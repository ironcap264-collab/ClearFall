export const DutchAuctionABI = [
  // View functions
  {
    inputs: [],
    name: "token",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "paymentToken",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "startPrice",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "endPrice",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "reservePrice",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "startTime",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "commitEndTime",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "revealEndTime",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "clearingPrice",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "creator",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "vault",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "isCleared",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "isCancelled",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "isFailed",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "tokensDeposited",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "whitelistEnabled",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalRevealedDemand",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "bidCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "minBidAmount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "maxBidPerAddress",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "vestingDuration",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "vestingCliff",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "nonRevealPenalty",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "antiSnipingDuration",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getCurrentPhase",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getCurrentPrice",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getTimeRemaining",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getBidderCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getAuctionInfo",
    outputs: [
      { name: "_token", type: "address" },
      { name: "_paymentToken", type: "address" },
      { name: "_totalSupply", type: "uint256" },
      { name: "_startPrice", type: "uint256" },
      { name: "_endPrice", type: "uint256" },
      { name: "_reservePrice", type: "uint256" },
      { name: "_startTime", type: "uint256" },
      { name: "_commitEndTime", type: "uint256" },
      { name: "_revealEndTime", type: "uint256" },
      { name: "_phase", type: "uint8" },
      { name: "_currentPrice", type: "uint256" },
      { name: "_totalDemand", type: "uint256" },
      { name: "_isCleared", type: "bool" },
      { name: "_clearingPrice", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getAuctionStats",
    outputs: [
      { name: "_bidCount", type: "uint256" },
      { name: "_totalCommittedFunds", type: "uint256" },
      { name: "_totalRevealedDemand", type: "uint256" },
      { name: "_bidderCount", type: "uint256" },
      { name: "_tokensDeposited", type: "bool" },
      { name: "_isCancelled", type: "bool" },
      { name: "_isFailed", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getMetadata",
    outputs: [
      { name: "title", type: "string" },
      { name: "description", type: "string" },
      { name: "imageURI", type: "string" },
      { name: "metadataURI", type: "string" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "bidder", type: "address" }],
    name: "getCommitment",
    outputs: [
      { name: "hash", type: "bytes32" },
      { name: "lockedAmount", type: "uint256" },
      { name: "revealed", type: "bool" },
      { name: "revealedQuantity", type: "uint256" },
      { name: "commitTimestamp", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getVestingInfo",
    outputs: [
      { name: "totalAmount", type: "uint256" },
      { name: "claimedAmount", type: "uint256" },
      { name: "vestedAmount", type: "uint256" },
      { name: "claimableAmount", type: "uint256" },
      { name: "cliffEnd", type: "uint256" },
      { name: "endTime", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "isWhitelisted",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "hasClaimed",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  // Write functions
  {
    inputs: [],
    name: "depositTokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "_title", type: "string" },
      { name: "_description", type: "string" },
      { name: "_imageURI", type: "string" },
      { name: "_metadataURI", type: "string" }
    ],
    name: "updateMetadata",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "addToWhitelist",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "removeFromWhitelist",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "accounts", type: "address[]" }],
    name: "addToWhitelistBatch",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "cancelAuction",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "commitmentHash", type: "bytes32" }],
    name: "commit",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      { name: "commitmentHash", type: "bytes32" },
      { name: "amount", type: "uint256" }
    ],
    name: "commitWithToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "increaseBid",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "increaseBidWithToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "quantity", type: "uint256" },
      { name: "nonce", type: "uint256" }
    ],
    name: "reveal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "forceClear",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "claimTokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "claimVestedTokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "claimRefund",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "withdrawProceeds",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "withdrawUnsoldTokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "withdrawPenalties",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "bidder", type: "address" },
      { indexed: false, name: "commitmentHash", type: "bytes32" },
      { indexed: false, name: "lockedAmount", type: "uint256" },
      { indexed: false, name: "timestamp", type: "uint256" },
      { indexed: false, name: "bidNumber", type: "uint256" }
    ],
    name: "CommitmentMade",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "bidder", type: "address" },
      { indexed: false, name: "quantity", type: "uint256" },
      { indexed: false, name: "timestamp", type: "uint256" }
    ],
    name: "CommitmentRevealed",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "clearingPrice", type: "uint256" },
      { indexed: false, name: "totalDemand", type: "uint256" },
      { indexed: false, name: "timestamp", type: "uint256" },
      { indexed: false, name: "totalBidders", type: "uint256" }
    ],
    name: "AuctionCleared",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "bidder", type: "address" },
      { indexed: false, name: "tokenAmount", type: "uint256" },
      { indexed: false, name: "refundAmount", type: "uint256" },
      { indexed: false, name: "isVested", type: "bool" }
    ],
    name: "TokensClaimed",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "newCommitEndTime", type: "uint256" },
      { indexed: false, name: "extensionAmount", type: "uint256" }
    ],
    name: "TimeExtended",
    type: "event"
  }
] as const;
