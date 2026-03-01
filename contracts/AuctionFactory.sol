// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DutchAuction.sol";

/**
 * @title AuctionFactory
 * @notice Factory for creating ClearFall Dutch auctions
 * @dev Deploys new DutchAuction instances with comprehensive configuration options
 */
contract AuctionFactory {
    // ============ State ============
    address[] public auctions;
    mapping(address => address[]) public creatorAuctions;
    mapping(address => bool) public isValidAuction;
    mapping(address => bool) public supportedPaymentTokens;

    uint256 public auctionCount;

    // ============ Events ============
    event AuctionCreated(
        address indexed auction,
        address indexed creator,
        address token,
        address paymentToken,
        uint256 totalSupply,
        uint256 startPrice,
        uint256 endPrice,
        uint256 reservePrice,
        uint256 startTime,
        uint256 indexed auctionId
    );

    event PaymentTokenUpdated(address indexed token, bool supported);

    // ============ Errors ============
    error InvalidToken();
    error InvalidSupply();
    error InvalidPriceRange();
    error InvalidTimeRange();
    error InvalidReservePrice();
    error UnsupportedPaymentToken();
    error InvalidDuration();
    error InvalidPenalty();
    error InvalidVesting();

    // ============ Constructor ============
    constructor() {
        // Native token (address(0)) is always supported
        supportedPaymentTokens[address(0)] = true;
    }

    // ============ Admin Functions ============

    /**
     * @notice Add or remove supported payment token
     * @param token The payment token address
     * @param supported Whether the token is supported
     */
    function setPaymentTokenSupport(address token, bool supported) external {
        // In production, add access control here
        supportedPaymentTokens[token] = supported;
        emit PaymentTokenUpdated(token, supported);
    }

    // ============ Factory Functions ============

    /**
     * @notice Create a new Dutch auction with full parameters
     * @param params Auction parameters struct
     * @return auctionAddress Address of the created auction
     */
    function createAuction(DutchAuction.AuctionParams memory params)
        external
        returns (address auctionAddress)
    {
        // Validate inputs
        if (params.token == address(0)) revert InvalidToken();
        if (params.totalSupply == 0) revert InvalidSupply();
        if (params.startPrice <= params.endPrice) revert InvalidPriceRange();
        if (params.startTime < block.timestamp) revert InvalidTimeRange();
        if (params.reservePrice > params.endPrice) revert InvalidReservePrice();
        if (!supportedPaymentTokens[params.paymentToken]) revert UnsupportedPaymentToken();
        if (params.commitDuration == 0) revert InvalidDuration();
        if (params.revealDuration == 0) revert InvalidDuration();
        if (params.nonRevealPenalty > 10000) revert InvalidPenalty();
        if (params.vestingCliff > params.vestingDuration) revert InvalidVesting();

        // Calculate endTime from durations if not set
        uint256 calculatedEndTime = params.startTime + params.commitDuration + params.revealDuration;

        // Deploy auction
        DutchAuction auction = new DutchAuction(params, msg.sender);
        auctionAddress = address(auction);

        // Register auction
        auctionCount++;
        auctions.push(auctionAddress);
        creatorAuctions[msg.sender].push(auctionAddress);
        isValidAuction[auctionAddress] = true;

        emit AuctionCreated(
            auctionAddress,
            msg.sender,
            params.token,
            params.paymentToken,
            params.totalSupply,
            params.startPrice,
            params.endPrice,
            params.reservePrice,
            params.startTime,
            auctionCount
        );
    }

    /**
     * @notice Create auction with simplified parameters (uses defaults)
     * @param token Token to auction
     * @param totalSupply Total tokens for sale
     * @param startPrice Starting price per token
     * @param endPrice Minimum price per token
     * @param startTime When auction starts
     * @param commitDuration Duration of commit phase
     * @param revealDuration Duration of reveal phase
     */
    function createSimpleAuction(
        address token,
        uint256 totalSupply,
        uint256 startPrice,
        uint256 endPrice,
        uint256 startTime,
        uint256 commitDuration,
        uint256 revealDuration
    ) external returns (address auctionAddress) {
        DutchAuction.AuctionParams memory params = DutchAuction.AuctionParams({
            token: token,
            paymentToken: address(0),          // Native payment
            totalSupply: totalSupply,
            startPrice: startPrice,
            endPrice: endPrice,
            reservePrice: 0,                   // No reserve
            startTime: startTime,
            commitDuration: commitDuration,
            revealDuration: revealDuration,
            vestingDuration: 0,                // No vesting
            vestingCliff: 0,
            nonRevealPenalty: 1000,            // 10% default penalty
            minBidAmount: 0,                   // No minimum
            maxBidPerAddress: 0,               // No maximum
            antiSnipingDuration: 0,            // No anti-sniping
            whitelistEnabled: false,           // Public auction
            metadataURI: ""
        });

        return this.createAuction(params);
    }

    // ============ View Functions ============

    /**
     * @notice Get total number of auctions created
     */
    function getAuctionCount() external view returns (uint256) {
        return auctions.length;
    }

    /**
     * @notice Get auctions created by a specific address
     */
    function getCreatorAuctions(address creator) external view returns (address[] memory) {
        return creatorAuctions[creator];
    }

    /**
     * @notice Get creator's auction count
     */
    function getCreatorAuctionCount(address creator) external view returns (uint256) {
        return creatorAuctions[creator].length;
    }

    /**
     * @notice Get all auction addresses (paginated)
     * @param offset Start index
     * @param limit Max number to return
     */
    function getAuctions(uint256 offset, uint256 limit) external view returns (address[] memory) {
        uint256 total = auctions.length;
        if (offset >= total) {
            return new address[](0);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        address[] memory result = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = auctions[i];
        }

        return result;
    }

    /**
     * @notice Get latest auctions (most recent first)
     * @param limit Max number to return
     */
    function getLatestAuctions(uint256 limit) external view returns (address[] memory) {
        uint256 total = auctions.length;
        if (total == 0) {
            return new address[](0);
        }

        uint256 count = limit > total ? total : limit;
        address[] memory result = new address[](count);

        for (uint256 i = 0; i < count; i++) {
            result[i] = auctions[total - 1 - i];
        }

        return result;
    }

    /**
     * @notice Check if an address is a valid auction
     */
    function isAuctionValid(address auction) external view returns (bool) {
        return isValidAuction[auction];
    }

    /**
     * @notice Check if a payment token is supported
     */
    function isPaymentTokenSupported(address token) external view returns (bool) {
        return supportedPaymentTokens[token];
    }

    /**
     * @notice Get auction details in batch
     * @param auctionAddresses Array of auction addresses
     */
    function getAuctionDetailsBatch(address[] calldata auctionAddresses)
        external
        view
        returns (
            address[] memory tokens,
            uint256[] memory totalSupplies,
            uint256[] memory currentPrices,
            DutchAuction.AuctionPhase[] memory phases
        )
    {
        uint256 len = auctionAddresses.length;
        tokens = new address[](len);
        totalSupplies = new uint256[](len);
        currentPrices = new uint256[](len);
        phases = new DutchAuction.AuctionPhase[](len);

        for (uint256 i = 0; i < len; i++) {
            DutchAuction auction = DutchAuction(auctionAddresses[i]);
            tokens[i] = auction.token();
            totalSupplies[i] = auction.totalSupply();
            currentPrices[i] = auction.getCurrentPrice();
            phases[i] = auction.getCurrentPhase();
        }
    }
}
