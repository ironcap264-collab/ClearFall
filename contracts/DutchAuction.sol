// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Vault.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title DutchAuction
 * @notice Trustless Dutch auction with commit-reveal mechanism
 * @dev Enhanced with whitelist, vesting, multi-token payments, anti-sniping, and more
 */
contract DutchAuction is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Enums ============
    enum AuctionPhase {
        Pending,
        Commit,
        Reveal,
        Cleared,
        Settled,
        Cancelled,
        Failed
    }

    // ============ Structs ============
    struct AuctionParams {
        address token;                  // Token being auctioned
        address paymentToken;           // Payment token (address(0) for native ETH/MATIC)
        uint256 totalSupply;            // Total tokens for sale
        uint256 startPrice;             // Starting price per token
        uint256 endPrice;               // Minimum price per token
        uint256 reservePrice;           // Auction fails if clearing price below this
        uint256 startTime;              // When auction starts
        uint256 commitDuration;         // Duration of commit phase
        uint256 revealDuration;         // Duration of reveal phase
        uint256 vestingDuration;        // Vesting period for winners (0 = instant)
        uint256 vestingCliff;           // Cliff period before vesting starts
        uint256 nonRevealPenalty;       // Basis points (e.g., 1000 = 10%)
        uint256 minBidAmount;           // Minimum bid in payment token
        uint256 maxBidPerAddress;       // Maximum bid per address (0 = unlimited)
        uint256 antiSnipingDuration;    // Time extension if bid near end
        bool whitelistEnabled;          // Whether whitelist is active
        string metadataURI;             // IPFS URI for auction metadata
    }

    struct AuctionMetadata {
        string title;
        string description;
        string imageURI;
        string metadataURI;
    }

    struct Commitment {
        bytes32 hash;
        uint256 lockedAmount;
        bool revealed;
        uint256 revealedQuantity;
        uint256 commitTimestamp;
    }

    struct VestingSchedule {
        uint256 totalAmount;
        uint256 claimedAmount;
        uint256 startTime;
        uint256 cliffEnd;
        uint256 endTime;
    }

    // ============ Immutable State ============
    address public immutable factory;
    address public immutable creator;
    Vault public immutable vault;

    // Auction parameters (immutable after creation)
    address public token;
    address public paymentToken;
    uint256 public totalSupply;
    uint256 public startPrice;
    uint256 public endPrice;
    uint256 public reservePrice;
    uint256 public startTime;
    uint256 public commitEndTime;
    uint256 public revealEndTime;
    uint256 public vestingDuration;
    uint256 public vestingCliff;
    uint256 public nonRevealPenalty;
    uint256 public minBidAmount;
    uint256 public maxBidPerAddress;
    uint256 public antiSnipingDuration;
    bool public whitelistEnabled;

    // ============ Mutable State ============
    uint256 public totalRevealedDemand;
    uint256 public clearingPrice;
    uint256 public clearingTime;
    uint256 public totalCommittedFunds;
    uint256 public bidCount;
    bool public isCleared;
    bool public isSettled;
    bool public isCancelled;
    bool public isFailed;
    bool public tokensDeposited;

    AuctionMetadata public metadata;

    mapping(address => Commitment) public commitments;
    mapping(address => VestingSchedule) public vestingSchedules;
    mapping(address => bool) public whitelist;
    mapping(address => bool) public hasClaimed;
    address[] public bidders;

    // ============ Events ============
    event AuctionCreated(
        address indexed auction,
        address indexed creator,
        address token,
        address paymentToken,
        uint256 totalSupply,
        uint256 startPrice,
        uint256 endPrice,
        uint256 reservePrice
    );
    event TokensDeposited(address indexed creator, uint256 amount);
    event MetadataUpdated(string title, string description, string imageURI, string metadataURI);
    event WhitelistUpdated(address indexed account, bool status);
    event WhitelistBatchUpdated(uint256 count, bool status);
    event CommitmentMade(
        address indexed bidder,
        bytes32 commitmentHash,
        uint256 lockedAmount,
        uint256 timestamp,
        uint256 bidNumber
    );
    event CommitmentIncreased(
        address indexed bidder,
        uint256 additionalAmount,
        uint256 newTotal
    );
    event CommitmentRevealed(
        address indexed bidder,
        uint256 quantity,
        uint256 timestamp
    );
    event TimeExtended(uint256 newCommitEndTime, uint256 extensionAmount);
    event AuctionCleared(
        uint256 clearingPrice,
        uint256 totalDemand,
        uint256 timestamp,
        uint256 totalBidders
    );
    event AuctionFailed(string reason, uint256 timestamp);
    event AuctionCancelled(address indexed creator, uint256 timestamp);
    event TokensClaimed(
        address indexed bidder,
        uint256 tokenAmount,
        uint256 refundAmount,
        bool isVested
    );
    event VestingClaimed(
        address indexed bidder,
        uint256 amount,
        uint256 totalClaimed,
        uint256 remaining
    );
    event RefundClaimed(
        address indexed bidder,
        uint256 amount,
        uint256 penaltyApplied
    );
    event ProceedsWithdrawn(address indexed creator, uint256 amount);
    event UnsoldTokensWithdrawn(address indexed creator, uint256 amount);
    event PenaltyCollected(address indexed bidder, uint256 amount);

    // ============ Errors ============
    error InvalidPhase();
    error InvalidParameters();
    error AlreadyCommitted();
    error InsufficientFunds();
    error InvalidCommitment();
    error AlreadyRevealed();
    error AlreadyClaimed();
    error AuctionNotCleared();
    error AuctionNotSettled();
    error NotAWinner();
    error NothingToRefund();
    error NotWhitelisted();
    error BelowMinimumBid();
    error ExceedsMaxBid();
    error TokensNotDeposited();
    error AuctionAlreadyStarted();
    error NoBidsToCancel();
    error HasBidsCannotCancel();
    error VestingNotStarted();
    error NothingToVest();
    error AuctionCancelledOrFailed();

    // ============ Modifiers ============
    modifier onlyCreator() {
        if (msg.sender != creator) revert InvalidParameters();
        _;
    }

    modifier notCancelledOrFailed() {
        if (isCancelled || isFailed) revert AuctionCancelledOrFailed();
        _;
    }

    // ============ Constructor ============
    constructor(AuctionParams memory params, address _creator) {
        // Validate parameters
        if (params.startPrice <= params.endPrice) revert InvalidParameters();
        if (params.startTime < block.timestamp) revert InvalidParameters();
        if (params.totalSupply == 0) revert InvalidParameters();
        if (params.nonRevealPenalty > 10000) revert InvalidParameters();
        if (params.reservePrice > params.endPrice) revert InvalidParameters();

        factory = msg.sender;
        creator = _creator;

        // Set auction parameters
        token = params.token;
        paymentToken = params.paymentToken;
        totalSupply = params.totalSupply;
        startPrice = params.startPrice;
        endPrice = params.endPrice;
        reservePrice = params.reservePrice;
        startTime = params.startTime;
        commitEndTime = params.startTime + params.commitDuration;
        revealEndTime = commitEndTime + params.revealDuration;
        vestingDuration = params.vestingDuration;
        vestingCliff = params.vestingCliff;
        nonRevealPenalty = params.nonRevealPenalty;
        minBidAmount = params.minBidAmount;
        maxBidPerAddress = params.maxBidPerAddress;
        antiSnipingDuration = params.antiSnipingDuration;
        whitelistEnabled = params.whitelistEnabled;

        // Deploy vault
        vault = new Vault(params.token, params.paymentToken, _creator);

        // Set metadata URI
        metadata.metadataURI = params.metadataURI;

        emit AuctionCreated(
            address(this),
            _creator,
            params.token,
            params.paymentToken,
            params.totalSupply,
            params.startPrice,
            params.endPrice,
            params.reservePrice
        );
    }

    // ============ Setup Functions ============

    /**
     * @notice Deposit tokens for the auction (must be done before auction starts)
     */
    function depositTokens() external onlyCreator {
        if (tokensDeposited) revert InvalidParameters();
        if (block.timestamp >= startTime) revert AuctionAlreadyStarted();

        IERC20(token).safeTransferFrom(msg.sender, address(vault), totalSupply);
        tokensDeposited = true;

        emit TokensDeposited(msg.sender, totalSupply);
    }

    /**
     * @notice Update auction metadata
     */
    function updateMetadata(
        string calldata _title,
        string calldata _description,
        string calldata _imageURI,
        string calldata _metadataURI
    ) external onlyCreator {
        if (block.timestamp >= startTime) revert AuctionAlreadyStarted();

        metadata = AuctionMetadata({
            title: _title,
            description: _description,
            imageURI: _imageURI,
            metadataURI: _metadataURI
        });

        emit MetadataUpdated(_title, _description, _imageURI, _metadataURI);
    }

    /**
     * @notice Add address to whitelist
     */
    function addToWhitelist(address account) external onlyCreator {
        whitelist[account] = true;
        emit WhitelistUpdated(account, true);
    }

    /**
     * @notice Remove address from whitelist
     */
    function removeFromWhitelist(address account) external onlyCreator {
        whitelist[account] = false;
        emit WhitelistUpdated(account, false);
    }

    /**
     * @notice Batch add addresses to whitelist
     */
    function addToWhitelistBatch(address[] calldata accounts) external onlyCreator {
        for (uint256 i = 0; i < accounts.length; i++) {
            whitelist[accounts[i]] = true;
        }
        emit WhitelistBatchUpdated(accounts.length, true);
    }

    /**
     * @notice Cancel auction (only before any bids)
     */
    function cancelAuction() external onlyCreator notCancelledOrFailed {
        if (bidders.length > 0) revert HasBidsCannotCancel();
        if (isCleared) revert AuctionNotCleared();

        isCancelled = true;

        // Return deposited tokens if any
        if (tokensDeposited) {
            vault.withdrawTokens(totalSupply);
        }

        emit AuctionCancelled(msg.sender, block.timestamp);
    }

    // ============ Phase Functions ============

    /**
     * @notice Get current auction phase
     */
    function getCurrentPhase() public view returns (AuctionPhase) {
        if (isCancelled) return AuctionPhase.Cancelled;
        if (isFailed) return AuctionPhase.Failed;
        if (isSettled) return AuctionPhase.Settled;
        if (isCleared) return AuctionPhase.Cleared;
        if (!tokensDeposited) return AuctionPhase.Pending;
        if (block.timestamp < startTime) return AuctionPhase.Pending;
        if (block.timestamp < commitEndTime) return AuctionPhase.Commit;
        if (block.timestamp < revealEndTime) return AuctionPhase.Reveal;
        return AuctionPhase.Cleared; // Auto-clear after reveal phase
    }

    /**
     * @notice Get current price based on time
     * @dev Linear decrease from startPrice to endPrice
     */
    function getCurrentPrice() public view returns (uint256) {
        if (block.timestamp <= startTime) return startPrice;
        if (block.timestamp >= revealEndTime) return endPrice;

        uint256 elapsed = block.timestamp - startTime;
        uint256 duration = revealEndTime - startTime;
        uint256 priceRange = startPrice - endPrice;

        return startPrice - (priceRange * elapsed / duration);
    }

    /**
     * @notice Get price at a specific timestamp
     */
    function getPriceAt(uint256 timestamp) public view returns (uint256) {
        if (timestamp <= startTime) return startPrice;
        if (timestamp >= revealEndTime) return endPrice;

        uint256 elapsed = timestamp - startTime;
        uint256 duration = revealEndTime - startTime;
        uint256 priceRange = startPrice - endPrice;

        return startPrice - (priceRange * elapsed / duration);
    }

    // ============ Commit Phase ============

    /**
     * @notice Commit to a bid (hash of quantity + nonce + address)
     * @param commitmentHash keccak256(abi.encodePacked(quantity, nonce, msg.sender))
     */
    function commit(bytes32 commitmentHash) external payable nonReentrant notCancelledOrFailed {
        if (getCurrentPhase() != AuctionPhase.Commit) revert InvalidPhase();
        if (!tokensDeposited) revert TokensNotDeposited();
        if (commitments[msg.sender].hash != bytes32(0)) revert AlreadyCommitted();
        if (whitelistEnabled && !whitelist[msg.sender]) revert NotWhitelisted();

        uint256 bidAmount;

        // Handle payment (native or ERC20)
        if (paymentToken == address(0)) {
            bidAmount = msg.value;
        } else {
            // For ERC20 payments, amount is passed and tokens transferred
            revert InvalidParameters(); // Use commitWithToken for ERC20
        }

        if (bidAmount < minBidAmount) revert BelowMinimumBid();
        if (maxBidPerAddress > 0 && bidAmount > maxBidPerAddress) revert ExceedsMaxBid();

        bidCount++;
        commitments[msg.sender] = Commitment({
            hash: commitmentHash,
            lockedAmount: bidAmount,
            revealed: false,
            revealedQuantity: 0,
            commitTimestamp: block.timestamp
        });

        bidders.push(msg.sender);
        totalCommittedFunds += bidAmount;

        // Lock funds in vault
        vault.lockFunds{value: bidAmount}(msg.sender);

        // Anti-sniping: extend time if bid is near end
        _checkAndExtendTime();

        emit CommitmentMade(msg.sender, commitmentHash, bidAmount, block.timestamp, bidCount);
    }

    /**
     * @notice Commit with ERC20 token payment
     */
    function commitWithToken(bytes32 commitmentHash, uint256 amount) external nonReentrant notCancelledOrFailed {
        if (getCurrentPhase() != AuctionPhase.Commit) revert InvalidPhase();
        if (!tokensDeposited) revert TokensNotDeposited();
        if (paymentToken == address(0)) revert InvalidParameters(); // Use commit() for native
        if (commitments[msg.sender].hash != bytes32(0)) revert AlreadyCommitted();
        if (whitelistEnabled && !whitelist[msg.sender]) revert NotWhitelisted();
        if (amount < minBidAmount) revert BelowMinimumBid();
        if (maxBidPerAddress > 0 && amount > maxBidPerAddress) revert ExceedsMaxBid();

        // Transfer payment tokens to vault
        IERC20(paymentToken).safeTransferFrom(msg.sender, address(vault), amount);

        bidCount++;
        commitments[msg.sender] = Commitment({
            hash: commitmentHash,
            lockedAmount: amount,
            revealed: false,
            revealedQuantity: 0,
            commitTimestamp: block.timestamp
        });

        bidders.push(msg.sender);
        totalCommittedFunds += amount;

        // Record in vault
        vault.recordTokenLock(msg.sender, amount);

        // Anti-sniping: extend time if bid is near end
        _checkAndExtendTime();

        emit CommitmentMade(msg.sender, commitmentHash, amount, block.timestamp, bidCount);
    }

    /**
     * @notice Increase existing commitment
     */
    function increaseBid() external payable nonReentrant notCancelledOrFailed {
        if (getCurrentPhase() != AuctionPhase.Commit) revert InvalidPhase();
        if (commitments[msg.sender].hash == bytes32(0)) revert InvalidCommitment();
        if (paymentToken != address(0)) revert InvalidParameters(); // Use increaseBidWithToken for ERC20

        uint256 newTotal = commitments[msg.sender].lockedAmount + msg.value;
        if (maxBidPerAddress > 0 && newTotal > maxBidPerAddress) revert ExceedsMaxBid();

        commitments[msg.sender].lockedAmount = newTotal;
        totalCommittedFunds += msg.value;

        vault.addFunds{value: msg.value}(msg.sender);

        _checkAndExtendTime();

        emit CommitmentIncreased(msg.sender, msg.value, newTotal);
    }

    /**
     * @notice Increase existing commitment with ERC20
     */
    function increaseBidWithToken(uint256 amount) external nonReentrant notCancelledOrFailed {
        if (getCurrentPhase() != AuctionPhase.Commit) revert InvalidPhase();
        if (commitments[msg.sender].hash == bytes32(0)) revert InvalidCommitment();
        if (paymentToken == address(0)) revert InvalidParameters();

        uint256 newTotal = commitments[msg.sender].lockedAmount + amount;
        if (maxBidPerAddress > 0 && newTotal > maxBidPerAddress) revert ExceedsMaxBid();

        IERC20(paymentToken).safeTransferFrom(msg.sender, address(vault), amount);

        commitments[msg.sender].lockedAmount = newTotal;
        totalCommittedFunds += amount;

        vault.recordTokenLock(msg.sender, amount);

        _checkAndExtendTime();

        emit CommitmentIncreased(msg.sender, amount, newTotal);
    }

    /**
     * @notice Anti-sniping time extension
     */
    function _checkAndExtendTime() internal {
        if (antiSnipingDuration == 0) return;

        uint256 timeLeft = commitEndTime > block.timestamp ? commitEndTime - block.timestamp : 0;

        if (timeLeft < antiSnipingDuration) {
            uint256 extension = antiSnipingDuration - timeLeft;
            commitEndTime += extension;
            revealEndTime += extension;

            emit TimeExtended(commitEndTime, extension);
        }
    }

    // ============ Reveal Phase ============

    /**
     * @notice Reveal your bid
     * @param quantity The quantity you bid for
     * @param nonce The random nonce used in commitment
     */
    function reveal(uint256 quantity, uint256 nonce) external nonReentrant notCancelledOrFailed {
        AuctionPhase phase = getCurrentPhase();
        if (phase != AuctionPhase.Reveal) revert InvalidPhase();

        Commitment storage commitment = commitments[msg.sender];
        if (commitment.hash == bytes32(0)) revert InvalidCommitment();
        if (commitment.revealed) revert AlreadyRevealed();

        // Verify commitment
        bytes32 expectedHash = keccak256(abi.encodePacked(quantity, nonce, msg.sender));
        if (commitment.hash != expectedHash) revert InvalidCommitment();

        commitment.revealed = true;
        commitment.revealedQuantity = quantity;
        totalRevealedDemand += quantity;

        emit CommitmentRevealed(msg.sender, quantity, block.timestamp);

        // Check if auction should clear
        _checkAndClear();
    }

    /**
     * @notice Check if demand >= supply and clear auction
     */
    function _checkAndClear() internal {
        if (isCleared) return;

        if (totalRevealedDemand >= totalSupply) {
            _clearAuction();
        }
    }

    /**
     * @notice Internal function to clear the auction
     */
    function _clearAuction() internal {
        isCleared = true;
        clearingTime = block.timestamp;
        clearingPrice = getCurrentPrice();

        // Check reserve price
        if (clearingPrice < reservePrice) {
            isFailed = true;
            emit AuctionFailed("Clearing price below reserve", block.timestamp);
            return;
        }

        emit AuctionCleared(clearingPrice, totalRevealedDemand, clearingTime, bidders.length);
    }

    /**
     * @notice Force clear after reveal phase ends
     */
    function forceClear() external notCancelledOrFailed {
        if (isCleared) revert InvalidPhase();
        if (block.timestamp < revealEndTime) revert InvalidPhase();

        isCleared = true;
        clearingTime = revealEndTime;
        clearingPrice = endPrice;

        // Check reserve price
        if (clearingPrice < reservePrice && totalRevealedDemand > 0) {
            isFailed = true;
            emit AuctionFailed("Clearing price below reserve", block.timestamp);
            return;
        }

        // If no demand, mark as failed
        if (totalRevealedDemand == 0) {
            isFailed = true;
            emit AuctionFailed("No revealed demand", block.timestamp);
            return;
        }

        emit AuctionCleared(clearingPrice, totalRevealedDemand, clearingTime, bidders.length);
    }

    // ============ Claims & Settlement ============

    /**
     * @notice Claim tokens as a winner
     */
    function claimTokens() external nonReentrant {
        if (isCancelled) {
            _claimCancelledRefund();
            return;
        }
        if (isFailed) {
            _claimFailedRefund();
            return;
        }
        if (!isCleared) revert AuctionNotCleared();
        if (hasClaimed[msg.sender]) revert AlreadyClaimed();

        Commitment storage commitment = commitments[msg.sender];
        if (!commitment.revealed) revert NotAWinner();
        if (commitment.revealedQuantity == 0) revert NotAWinner();

        hasClaimed[msg.sender] = true;

        // Calculate allocation (pro-rata if oversubscribed)
        uint256 allocation;
        if (totalRevealedDemand <= totalSupply) {
            allocation = commitment.revealedQuantity;
        } else {
            allocation = (commitment.revealedQuantity * totalSupply) / totalRevealedDemand;
        }

        // Calculate payment and refund
        uint256 payment = allocation * clearingPrice;
        uint256 refund = commitment.lockedAmount > payment ? commitment.lockedAmount - payment : 0;

        // Handle vesting or immediate release
        if (vestingDuration > 0) {
            // Setup vesting schedule
            vestingSchedules[msg.sender] = VestingSchedule({
                totalAmount: allocation,
                claimedAmount: 0,
                startTime: block.timestamp,
                cliffEnd: block.timestamp + vestingCliff,
                endTime: block.timestamp + vestingDuration
            });

            // Refund excess payment immediately
            if (refund > 0) {
                vault.refundExcess(msg.sender, refund, paymentToken == address(0));
            }

            emit TokensClaimed(msg.sender, allocation, refund, true);
        } else {
            // Immediate release
            vault.releaseToWinner(msg.sender, allocation, refund, paymentToken == address(0));
            emit TokensClaimed(msg.sender, allocation, refund, false);
        }
    }

    /**
     * @notice Claim vested tokens
     */
    function claimVestedTokens() external nonReentrant {
        VestingSchedule storage schedule = vestingSchedules[msg.sender];
        if (schedule.totalAmount == 0) revert NothingToVest();
        if (block.timestamp < schedule.cliffEnd) revert VestingNotStarted();

        uint256 vested = _calculateVestedAmount(msg.sender);
        uint256 claimable = vested - schedule.claimedAmount;

        if (claimable == 0) revert NothingToVest();

        schedule.claimedAmount += claimable;

        vault.releaseVestedTokens(msg.sender, claimable);

        emit VestingClaimed(
            msg.sender,
            claimable,
            schedule.claimedAmount,
            schedule.totalAmount - schedule.claimedAmount
        );
    }

    /**
     * @notice Calculate vested amount for a user
     */
    function _calculateVestedAmount(address user) internal view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[user];

        if (block.timestamp < schedule.cliffEnd) return 0;
        if (block.timestamp >= schedule.endTime) return schedule.totalAmount;

        uint256 elapsed = block.timestamp - schedule.cliffEnd;
        uint256 vestingPeriod = schedule.endTime - schedule.cliffEnd;

        return (schedule.totalAmount * elapsed) / vestingPeriod;
    }

    /**
     * @notice Get vesting info for a user
     */
    function getVestingInfo(address user) external view returns (
        uint256 totalAmount,
        uint256 claimedAmount,
        uint256 vestedAmount,
        uint256 claimableAmount,
        uint256 cliffEnd,
        uint256 endTime
    ) {
        VestingSchedule memory schedule = vestingSchedules[user];
        uint256 vested = _calculateVestedAmount(user);

        return (
            schedule.totalAmount,
            schedule.claimedAmount,
            vested,
            vested - schedule.claimedAmount,
            schedule.cliffEnd,
            schedule.endTime
        );
    }

    /**
     * @notice Claim refund for non-revealed or losing bid
     */
    function claimRefund() external nonReentrant {
        if (isCancelled) {
            _claimCancelledRefund();
            return;
        }
        if (isFailed) {
            _claimFailedRefund();
            return;
        }
        if (!isCleared) revert AuctionNotCleared();
        if (hasClaimed[msg.sender]) revert AlreadyClaimed();

        Commitment storage commitment = commitments[msg.sender];
        if (commitment.hash == bytes32(0)) revert NothingToRefund();

        hasClaimed[msg.sender] = true;

        uint256 refundAmount = commitment.lockedAmount;
        uint256 penaltyAmount = 0;

        // Apply penalty for non-reveal
        if (!commitment.revealed && nonRevealPenalty > 0) {
            penaltyAmount = (refundAmount * nonRevealPenalty) / 10000;
            refundAmount -= penaltyAmount;

            emit PenaltyCollected(msg.sender, penaltyAmount);
        }

        if (refundAmount > 0) {
            vault.unlockFundsWithPenalty(msg.sender, refundAmount, penaltyAmount, paymentToken == address(0));
        }

        emit RefundClaimed(msg.sender, refundAmount, penaltyAmount);
    }

    /**
     * @notice Internal: claim refund when auction is cancelled
     */
    function _claimCancelledRefund() internal {
        if (hasClaimed[msg.sender]) revert AlreadyClaimed();

        Commitment storage commitment = commitments[msg.sender];
        if (commitment.hash == bytes32(0)) revert NothingToRefund();

        hasClaimed[msg.sender] = true;
        uint256 refundAmount = commitment.lockedAmount;

        // Full refund for cancellation (no penalty)
        vault.unlockFundsWithPenalty(msg.sender, refundAmount, 0, paymentToken == address(0));

        emit RefundClaimed(msg.sender, refundAmount, 0);
    }

    /**
     * @notice Internal: claim refund when auction fails
     */
    function _claimFailedRefund() internal {
        if (hasClaimed[msg.sender]) revert AlreadyClaimed();

        Commitment storage commitment = commitments[msg.sender];
        if (commitment.hash == bytes32(0)) revert NothingToRefund();

        hasClaimed[msg.sender] = true;
        uint256 refundAmount = commitment.lockedAmount;

        // Full refund for failed auction (no penalty)
        vault.unlockFundsWithPenalty(msg.sender, refundAmount, 0, paymentToken == address(0));

        emit RefundClaimed(msg.sender, refundAmount, 0);
    }

    /**
     * @notice Creator withdraws proceeds after auction clears
     */
    function withdrawProceeds() external nonReentrant onlyCreator {
        if (!isCleared || isFailed) revert AuctionNotCleared();

        uint256 sold = totalRevealedDemand < totalSupply ? totalRevealedDemand : totalSupply;
        uint256 proceeds = sold * clearingPrice;

        vault.withdrawProceeds(proceeds, paymentToken == address(0));

        emit ProceedsWithdrawn(creator, proceeds);
    }

    /**
     * @notice Creator withdraws unsold tokens
     */
    function withdrawUnsoldTokens() external nonReentrant onlyCreator {
        if (!isCleared && !isFailed && !isCancelled) revert AuctionNotCleared();

        uint256 unsold;
        if (isFailed || isCancelled) {
            unsold = totalSupply;
        } else if (totalRevealedDemand < totalSupply) {
            unsold = totalSupply - totalRevealedDemand;
        } else {
            revert InvalidParameters();
        }

        if (unsold > 0) {
            vault.withdrawTokens(unsold);
            emit UnsoldTokensWithdrawn(creator, unsold);
        }
    }

    /**
     * @notice Creator withdraws collected penalties
     */
    function withdrawPenalties() external nonReentrant onlyCreator {
        if (!isCleared) revert AuctionNotCleared();

        vault.withdrawPenalties(paymentToken == address(0));
    }

    // ============ View Functions ============

    /**
     * @notice Get auction info
     */
    function getAuctionInfo() external view returns (
        address _token,
        address _paymentToken,
        uint256 _totalSupply,
        uint256 _startPrice,
        uint256 _endPrice,
        uint256 _reservePrice,
        uint256 _startTime,
        uint256 _commitEndTime,
        uint256 _revealEndTime,
        AuctionPhase _phase,
        uint256 _currentPrice,
        uint256 _totalDemand,
        bool _isCleared,
        uint256 _clearingPrice
    ) {
        return (
            token,
            paymentToken,
            totalSupply,
            startPrice,
            endPrice,
            reservePrice,
            startTime,
            commitEndTime,
            revealEndTime,
            getCurrentPhase(),
            getCurrentPrice(),
            totalRevealedDemand,
            isCleared,
            clearingPrice
        );
    }

    /**
     * @notice Get auction statistics
     */
    function getAuctionStats() external view returns (
        uint256 _bidCount,
        uint256 _totalCommittedFunds,
        uint256 _totalRevealedDemand,
        uint256 _bidderCount,
        bool _tokensDeposited,
        bool _isCancelled,
        bool _isFailed
    ) {
        return (
            bidCount,
            totalCommittedFunds,
            totalRevealedDemand,
            bidders.length,
            tokensDeposited,
            isCancelled,
            isFailed
        );
    }

    /**
     * @notice Get auction metadata
     */
    function getMetadata() external view returns (
        string memory title,
        string memory description,
        string memory imageURI,
        string memory metadataURI
    ) {
        return (
            metadata.title,
            metadata.description,
            metadata.imageURI,
            metadata.metadataURI
        );
    }

    /**
     * @notice Get commitment for an address
     */
    function getCommitment(address bidder) external view returns (
        bytes32 hash,
        uint256 lockedAmount,
        bool revealed,
        uint256 revealedQuantity,
        uint256 commitTimestamp
    ) {
        Commitment memory c = commitments[bidder];
        return (c.hash, c.lockedAmount, c.revealed, c.revealedQuantity, c.commitTimestamp);
    }

    /**
     * @notice Check if address is whitelisted
     */
    function isWhitelisted(address account) external view returns (bool) {
        if (!whitelistEnabled) return true;
        return whitelist[account];
    }

    /**
     * @notice Get total number of bidders
     */
    function getBidderCount() external view returns (uint256) {
        return bidders.length;
    }

    /**
     * @notice Get bidders list (paginated)
     */
    function getBidders(uint256 offset, uint256 limit) external view returns (address[] memory) {
        uint256 total = bidders.length;
        if (offset >= total) return new address[](0);

        uint256 end = offset + limit;
        if (end > total) end = total;

        address[] memory result = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = bidders[i];
        }
        return result;
    }

    /**
     * @notice Get time remaining in current phase
     */
    function getTimeRemaining() external view returns (uint256) {
        AuctionPhase phase = getCurrentPhase();

        if (phase == AuctionPhase.Pending) {
            if (!tokensDeposited) return 0;
            return startTime - block.timestamp;
        } else if (phase == AuctionPhase.Commit) {
            return commitEndTime - block.timestamp;
        } else if (phase == AuctionPhase.Reveal) {
            return revealEndTime - block.timestamp;
        }

        return 0;
    }
}
