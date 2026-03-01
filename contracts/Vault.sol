// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Vault
 * @notice Secure asset management for ClearFall Dutch auctions
 * @dev Handles ERC20 deposits, multi-token payments, vesting, and secure withdrawals
 */
contract Vault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Structs ============
    struct LockedFunds {
        uint256 amount;
        bool isLocked;
    }

    // ============ State Variables ============
    address public immutable auction;
    IERC20 public immutable token;           // Token being auctioned
    address public immutable paymentToken;    // Payment token (address(0) for native)
    address public immutable creator;

    uint256 public totalDeposited;
    uint256 public totalLocked;
    uint256 public totalPenalties;
    uint256 public proceedsWithdrawn;
    uint256 public penaltiesWithdrawn;

    mapping(address => LockedFunds) public bidderFunds;

    // ============ Events ============
    event TokensDeposited(address indexed from, uint256 amount);
    event FundsLocked(address indexed bidder, uint256 amount);
    event FundsAdded(address indexed bidder, uint256 amount, uint256 newTotal);
    event FundsUnlocked(address indexed bidder, uint256 amount);
    event FundsRefundedWithPenalty(address indexed bidder, uint256 refunded, uint256 penalty);
    event FundsReleased(address indexed to, uint256 tokenAmount, uint256 refundAmount);
    event VestedTokensReleased(address indexed to, uint256 amount);
    event ExcessRefunded(address indexed to, uint256 amount);
    event TokensWithdrawn(address indexed to, uint256 amount);
    event ProceedsWithdrawn(address indexed creator, uint256 amount);
    event PenaltiesWithdrawn(address indexed creator, uint256 amount);

    // ============ Errors ============
    error OnlyAuction();
    error OnlyCreator();
    error InsufficientDeposit();
    error FundsAlreadyLocked();
    error NoFundsLocked();
    error TransferFailed();
    error InsufficientBalance();
    error NoPenaltiesToWithdraw();

    // ============ Modifiers ============
    modifier onlyAuction() {
        if (msg.sender != auction) revert OnlyAuction();
        _;
    }

    modifier onlyCreator() {
        if (msg.sender != creator) revert OnlyCreator();
        _;
    }

    // ============ Constructor ============
    constructor(address _token, address _paymentToken, address _creator) {
        auction = msg.sender;
        token = IERC20(_token);
        paymentToken = _paymentToken;
        creator = _creator;
    }

    // ============ Native Payment Functions ============

    /**
     * @notice Lock native funds (ETH/MATIC) for a bid commitment
     * @param bidder Address of the bidder
     */
    function lockFunds(address bidder) external payable onlyAuction nonReentrant {
        if (bidderFunds[bidder].isLocked) revert FundsAlreadyLocked();

        bidderFunds[bidder] = LockedFunds({
            amount: msg.value,
            isLocked: true
        });
        totalLocked += msg.value;

        emit FundsLocked(bidder, msg.value);
    }

    /**
     * @notice Add more native funds to existing commitment
     * @param bidder Address of the bidder
     */
    function addFunds(address bidder) external payable onlyAuction nonReentrant {
        LockedFunds storage funds = bidderFunds[bidder];
        if (!funds.isLocked) revert NoFundsLocked();

        funds.amount += msg.value;
        totalLocked += msg.value;

        emit FundsAdded(bidder, msg.value, funds.amount);
    }

    /**
     * @notice Record ERC20 token lock (tokens already transferred to vault)
     * @param bidder Address of the bidder
     * @param amount Amount locked
     */
    function recordTokenLock(address bidder, uint256 amount) external onlyAuction {
        if (bidderFunds[bidder].isLocked) {
            // Adding to existing lock
            bidderFunds[bidder].amount += amount;
        } else {
            // New lock
            bidderFunds[bidder] = LockedFunds({
                amount: amount,
                isLocked: true
            });
        }
        totalLocked += amount;

        emit FundsLocked(bidder, amount);
    }

    /**
     * @notice Unlock and refund funds with penalty handling
     * @param bidder Address to refund
     * @param refundAmount Amount to refund (after penalty)
     * @param penaltyAmount Penalty to keep
     * @param isNative Whether payment is native (ETH/MATIC) or ERC20
     */
    function unlockFundsWithPenalty(
        address bidder,
        uint256 refundAmount,
        uint256 penaltyAmount,
        bool isNative
    ) external onlyAuction nonReentrant {
        LockedFunds storage funds = bidderFunds[bidder];
        if (!funds.isLocked) revert NoFundsLocked();

        uint256 totalAmount = funds.amount;
        funds.amount = 0;
        funds.isLocked = false;
        totalLocked -= totalAmount;

        // Track penalties
        if (penaltyAmount > 0) {
            totalPenalties += penaltyAmount;
        }

        // Refund the bidder
        if (refundAmount > 0) {
            if (isNative) {
                (bool success, ) = payable(bidder).call{value: refundAmount}("");
                if (!success) revert TransferFailed();
            } else {
                IERC20(paymentToken).safeTransfer(bidder, refundAmount);
            }
        }

        emit FundsRefundedWithPenalty(bidder, refundAmount, penaltyAmount);
    }

    /**
     * @notice Release tokens to a winning bidder (immediate release)
     * @param bidder Address to receive tokens
     * @param tokenAmount Amount of tokens to release
     * @param refundAmount Amount to refund (excess payment)
     * @param isNative Whether payment is native or ERC20
     */
    function releaseToWinner(
        address bidder,
        uint256 tokenAmount,
        uint256 refundAmount,
        bool isNative
    ) external onlyAuction nonReentrant {
        LockedFunds storage funds = bidderFunds[bidder];

        // Clear locked status
        uint256 lockedAmount = funds.amount;
        funds.isLocked = false;
        funds.amount = 0;
        totalLocked -= lockedAmount;

        // Transfer auction tokens to winner
        token.safeTransfer(bidder, tokenAmount);

        // Refund excess payment if any
        if (refundAmount > 0) {
            if (isNative) {
                (bool success, ) = payable(bidder).call{value: refundAmount}("");
                if (!success) revert TransferFailed();
            } else {
                IERC20(paymentToken).safeTransfer(bidder, refundAmount);
            }
        }

        emit FundsReleased(bidder, tokenAmount, refundAmount);
    }

    /**
     * @notice Refund excess payment (for vesting scenarios)
     * @param bidder Address to refund
     * @param amount Amount to refund
     * @param isNative Whether payment is native or ERC20
     */
    function refundExcess(
        address bidder,
        uint256 amount,
        bool isNative
    ) external onlyAuction nonReentrant {
        LockedFunds storage funds = bidderFunds[bidder];

        // Reduce locked amount
        funds.amount -= amount;
        totalLocked -= amount;

        if (isNative) {
            (bool success, ) = payable(bidder).call{value: amount}("");
            if (!success) revert TransferFailed();
        } else {
            IERC20(paymentToken).safeTransfer(bidder, amount);
        }

        emit ExcessRefunded(bidder, amount);
    }

    /**
     * @notice Release vested tokens to a user
     * @param bidder Address to receive tokens
     * @param amount Amount of tokens to release
     */
    function releaseVestedTokens(
        address bidder,
        uint256 amount
    ) external onlyAuction nonReentrant {
        token.safeTransfer(bidder, amount);
        emit VestedTokensReleased(bidder, amount);
    }

    // ============ Creator Functions ============

    /**
     * @notice Withdraw unsold tokens after auction ends
     * @param amount Amount to withdraw
     */
    function withdrawTokens(uint256 amount) external onlyAuction nonReentrant {
        token.safeTransfer(creator, amount);
        emit TokensWithdrawn(creator, amount);
    }

    /**
     * @notice Withdraw auction proceeds
     * @param amount Amount of proceeds to withdraw
     * @param isNative Whether payment is native or ERC20
     */
    function withdrawProceeds(uint256 amount, bool isNative) external onlyAuction nonReentrant {
        proceedsWithdrawn += amount;

        if (isNative) {
            (bool success, ) = payable(creator).call{value: amount}("");
            if (!success) revert TransferFailed();
        } else {
            IERC20(paymentToken).safeTransfer(creator, amount);
        }

        emit ProceedsWithdrawn(creator, amount);
    }

    /**
     * @notice Withdraw collected penalties
     * @param isNative Whether payment is native or ERC20
     */
    function withdrawPenalties(bool isNative) external onlyAuction nonReentrant {
        uint256 available = totalPenalties - penaltiesWithdrawn;
        if (available == 0) revert NoPenaltiesToWithdraw();

        penaltiesWithdrawn += available;

        if (isNative) {
            (bool success, ) = payable(creator).call{value: available}("");
            if (!success) revert TransferFailed();
        } else {
            IERC20(paymentToken).safeTransfer(creator, available);
        }

        emit PenaltiesWithdrawn(creator, available);
    }

    // ============ View Functions ============

    /**
     * @notice Get locked funds for a bidder
     */
    function getLockedFunds(address bidder) external view returns (uint256 amount, bool isLocked) {
        LockedFunds memory funds = bidderFunds[bidder];
        return (funds.amount, funds.isLocked);
    }

    /**
     * @notice Get vault's auction token balance
     */
    function getTokenBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    /**
     * @notice Get vault's native balance (ETH/MATIC)
     */
    function getNativeBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Get vault's payment token balance (if ERC20)
     */
    function getPaymentTokenBalance() external view returns (uint256) {
        if (paymentToken == address(0)) {
            return address(this).balance;
        }
        return IERC20(paymentToken).balanceOf(address(this));
    }

    /**
     * @notice Get vault statistics
     */
    function getVaultStats() external view returns (
        uint256 _totalLocked,
        uint256 _totalPenalties,
        uint256 _proceedsWithdrawn,
        uint256 _penaltiesWithdrawn,
        uint256 _tokenBalance,
        uint256 _paymentBalance
    ) {
        uint256 paymentBal = paymentToken == address(0)
            ? address(this).balance
            : IERC20(paymentToken).balanceOf(address(this));

        return (
            totalLocked,
            totalPenalties,
            proceedsWithdrawn,
            penaltiesWithdrawn,
            token.balanceOf(address(this)),
            paymentBal
        );
    }

    // ============ Receive ============
    receive() external payable {}
}
