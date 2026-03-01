export const AuctionFactoryABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    inputs: [],
    name: "InvalidDuration",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidPenalty",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidPriceRange",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidReservePrice",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidSupply",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidTimeRange",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidToken",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidVesting",
    type: "error"
  },
  {
    inputs: [],
    name: "UnsupportedPaymentToken",
    type: "error"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "auction", type: "address" },
      { indexed: true, name: "creator", type: "address" },
      { indexed: false, name: "token", type: "address" },
      { indexed: false, name: "paymentToken", type: "address" },
      { indexed: false, name: "totalSupply", type: "uint256" },
      { indexed: false, name: "startPrice", type: "uint256" },
      { indexed: false, name: "endPrice", type: "uint256" },
      { indexed: false, name: "reservePrice", type: "uint256" },
      { indexed: false, name: "startTime", type: "uint256" },
      { indexed: true, name: "auctionId", type: "uint256" }
    ],
    name: "AuctionCreated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "token", type: "address" },
      { indexed: false, name: "supported", type: "bool" }
    ],
    name: "PaymentTokenUpdated",
    type: "event"
  },
  {
    inputs: [
      {
        components: [
          { name: "token", type: "address" },
          { name: "paymentToken", type: "address" },
          { name: "totalSupply", type: "uint256" },
          { name: "startPrice", type: "uint256" },
          { name: "endPrice", type: "uint256" },
          { name: "reservePrice", type: "uint256" },
          { name: "startTime", type: "uint256" },
          { name: "commitDuration", type: "uint256" },
          { name: "revealDuration", type: "uint256" },
          { name: "vestingDuration", type: "uint256" },
          { name: "vestingCliff", type: "uint256" },
          { name: "nonRevealPenalty", type: "uint256" },
          { name: "minBidAmount", type: "uint256" },
          { name: "maxBidPerAddress", type: "uint256" },
          { name: "antiSnipingDuration", type: "uint256" },
          { name: "whitelistEnabled", type: "bool" },
          { name: "metadataURI", type: "string" }
        ],
        name: "params",
        type: "tuple"
      }
    ],
    name: "createAuction",
    outputs: [{ name: "auctionAddress", type: "address" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "token", type: "address" },
      { name: "totalSupply", type: "uint256" },
      { name: "startPrice", type: "uint256" },
      { name: "endPrice", type: "uint256" },
      { name: "startTime", type: "uint256" },
      { name: "commitDuration", type: "uint256" },
      { name: "revealDuration", type: "uint256" }
    ],
    name: "createSimpleAuction",
    outputs: [{ name: "auctionAddress", type: "address" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "auctionCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "", type: "uint256" }],
    name: "auctions",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getAuctionCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "offset", type: "uint256" },
      { name: "limit", type: "uint256" }
    ],
    name: "getAuctions",
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "limit", type: "uint256" }],
    name: "getLatestAuctions",
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "creator", type: "address" }],
    name: "getCreatorAuctions",
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "creator", type: "address" }],
    name: "getCreatorAuctionCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "auction", type: "address" }],
    name: "isAuctionValid",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "token", type: "address" }],
    name: "isPaymentTokenSupported",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  }
] as const;
