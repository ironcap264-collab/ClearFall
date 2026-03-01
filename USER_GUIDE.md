# ClearFall Protocol - User Guide

A complete guide on how to interact with the ClearFall Dutch Auction platform.

---

## Table of Contents

1. [Overview](#overview)
2. [For Auction Creators](#for-auction-creators)
3. [For Bidders](#for-bidders)
4. [Faucet & Test Tokens](#faucet--test-tokens)
5. [Example Scenario](#example-scenario)
6. [Why Commit-Reveal](#why-commit-reveal)
7. [Smart Contract Functions](#smart-contract-functions)
8. [Troubleshooting](#troubleshooting)

---

## Overview

ClearFall is a decentralized Dutch auction platform for fair token distribution. It uses a **commit-reveal mechanism** to prevent front-running and MEV attacks.

### Key Features

- **Dutch Auction**: Price starts high and decreases over time
- **Commit-Reveal**: Bids are hidden until reveal phase
- **Uniform Clearing Price**: All winners pay the same price
- **MEV Protected**: No front-running possible
- **IPFS Metadata**: Auction details stored on decentralized storage
- **Testnet Faucet**: Mint free CFT tokens for testing
- **AI Assistant**: In-app chatbot for platform help

### Auction Phases

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   PENDING    │ -> │    COMMIT    │ -> │    REVEAL    │ -> │   CLEARED    │
│              │    │              │    │              │    │              │
│ Waiting for  │    │ Submit       │    │ Reveal your  │    │ Claim tokens │
│ tokens       │    │ hidden bids  │    │ bid quantity │    │ or refunds   │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

---

## For Auction Creators

### Step 1: Create an Auction (or Token First)

1. Connect your wallet on the website
2. Go to the **Create** page
3. **Option A – Create Token First**: If you don't have a token, use the "Create Token First" tab to deploy an ERC20 token (name, symbol, supply). Then switch to the auction tab and paste the new token address.
4. **Option B – Use Existing Token**: If you already have a token address, paste it in the auction form.
5. Fill in the auction details:

| Field | Description | Example |
|-------|-------------|---------|
| Title | Name of your auction | "MyToken Launch Sale" |
| Description | Details about your token | "Fair launch of MyToken" |
| Image | Upload auction image (stored on IPFS) | mytoken-logo.png |
| Token Address | ERC20 token contract address | 0x1234...5678 |
| Total Supply | Number of tokens to sell | 1,000,000 |
| Start Price | Initial price per token (MATIC) | 0.5 |
| End Price | Minimum price per token (MATIC) | 0.05 |
| Start Time | When the auction begins | Tomorrow 12:00 PM |
| Commit Duration | How long users can submit bids | 24 hours (86400 seconds) |
| Reveal Duration | How long users can reveal bids | 12 hours (43200 seconds) |

**Pro tip**: Use the **"Enhance with AI"** button to improve your auction title and description.

**Advanced Options:**
- Reserve Price: Minimum clearing price (auction fails if below)
- Min/Max Bid: Limits per address
- Whitelist: Restrict to approved addresses only
- Vesting: Lock tokens with vesting schedule
- Anti-Sniping: Extend time if bids come near end

### Step 2: Deposit Tokens

After creating the auction, go to your **Dashboard**:

1. Find your auction card
2. Click **"Deposit"** button
3. **First transaction**: Approve the auction contract to spend your tokens
4. **Second transaction**: Deposit tokens to the auction vault

> ⚠️ The auction won't start until tokens are deposited!

### Step 3: Configure (Optional)

Before the auction starts, you can:

- **Update Metadata**: Change title, description, image
- **Add Whitelist**: Add addresses that can participate
- **Cancel**: Cancel the auction (only if no bids yet)

### Step 4: Monitor & Withdraw

During the auction:
- Watch bids come in on the auction detail page
- See total committed funds and demand

After the auction clears:
1. Go to Dashboard
2. Click **"Withdraw"** to collect your proceeds (MATIC)
3. Click **"Withdraw Unsold"** if any tokens weren't sold

---

## For Bidders

### Step 1: Find an Auction

1. Visit the ClearFall website
2. Go to **Explore** page to browse all auctions
3. Use filters to find active auctions
4. Click on an auction to view details

### Step 2: Connect Wallet

1. Click **"Connect"** button
2. Select your wallet (MetaMask, WalletConnect, etc.)
3. Make sure you're on **Polygon Amoy** network
4. Ensure you have MATIC for bidding and gas fees

### Step 3: Submit Bid (Commit Phase)

During the **COMMIT** phase, you submit a hidden bid:

```
┌─────────────────────────────────────────┐
│  Current Price: 0.5 MATIC               │
│  Time Remaining: 23h 45m                │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Bid Amount (MATIC): [____10___] │    │  <- How much MATIC to lock
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Quantity (Tokens):  [____50___] │    │  <- How many tokens you want
│  └─────────────────────────────────┘    │
│                                         │
│  [Submit Commitment]                    │
│                                         │
└─────────────────────────────────────────┘
```

**What happens when you click "Submit Commitment":**

1. Your bid is converted to a hash (hidden from everyone)
2. Your MATIC is locked in the vault
3. A popup shows your **Quantity** and **Nonce**

> ⚠️ **IMPORTANT: Save your Quantity and Nonce!** You need these to reveal your bid later.

```
┌─────────────────────────────────────────┐
│  ⚠️ SAVE THIS INFORMATION!              │
│                                         │
│  Quantity: 50                           │
│  Nonce: 8374628374628374982374...       │
│                                         │
│  [Copy Quantity] [Copy Nonce]           │
└─────────────────────────────────────────┘
```

### Step 4: Reveal Bid (Reveal Phase)

When the commit phase ends, the **REVEAL** phase begins. You must reveal your bid:

```
┌─────────────────────────────────────────┐
│  ⚠️ REVEAL PHASE ACTIVE                 │
│  Time Remaining: 5h 30m                 │
│                                         │
│  Your Commitment: Found                 │
│  Locked Amount: 10 MATIC                │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Quantity:  [____50____________] │    │  <- Enter saved quantity
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Nonce:     [_837462837462837__] │    │  <- Enter saved nonce
│  └─────────────────────────────────┘    │
│                                         │
│  [Reveal Bid]                           │
│                                         │
└─────────────────────────────────────────┘
```

**What happens:**
- Contract verifies your quantity and nonce match your commitment
- Your bid quantity is now public
- You're eligible to win tokens

> ⚠️ **If you don't reveal**, you lose part of your deposit as a penalty!

### Step 5: Claim Tokens

After the reveal phase ends, the auction **clears** at a uniform price:

```
┌─────────────────────────────────────────┐
│  AUCTION CLEARED                        │
│  Clearing Price: 0.3 MATIC per token    │
│                                         │
│  Your Revealed Bid: 50 tokens           │
│  Your Allocation: 50 tokens             │
│  Payment: 15 MATIC (50 x 0.3)           │
│  Refund: 0 MATIC                        │
│                                         │
│  [Claim Tokens]                         │
│                                         │
└─────────────────────────────────────────┘
```

Click **"Claim Tokens"** to:
- Receive your tokens
- Get refunded any excess MATIC (if you locked more than needed)

---

## Faucet & Test Tokens

### Get Test MATIC

For gas fees on Polygon Amoy, get free MATIC from:
- [Polygon Faucet](https://faucet.polygon.technology/)
- [Amoy Explorer](https://amoy.polygonscan.com/)

### Get Test CFT Tokens

1. Go to the **Faucet** page
2. Connect your wallet
3. Click **"Mint Now"** to receive 1,000 CFT tokens
4. **Cooldown**: 24 hours between mints per address
5. Use CFT to test auctions without creating your own token

### Your Created Tokens

If you created tokens via the **Create** page, they appear in the Faucet under **"My Created Assets"**. You can add them to your wallet and view balances there.

---

## Example Scenario

### Auction Setup

| Parameter | Value |
|-----------|-------|
| Token | MyToken (MTK) |
| Total Supply | 10,000 tokens |
| Start Price | 1.0 MATIC |
| End Price | 0.1 MATIC |
| Commit Duration | 24 hours |
| Reveal Duration | 6 hours |

### Bidders During Commit Phase

| Bidder | Locked MATIC | Hidden Quantity |
|--------|--------------|-----------------|
| Alice | 100 MATIC | 500 tokens |
| Bob | 200 MATIC | 1,000 tokens |
| Carol | 50 MATIC | 200 tokens |
| Dave | 300 MATIC | 800 tokens |

> Nobody knows anyone else's quantity during commit phase!

### After Reveal Phase

All bidders reveal their quantities:
- Total demand: 2,500 tokens
- Supply: 10,000 tokens
- Demand < Supply, so everyone gets what they wanted
- Clearing price: 0.4 MATIC (price when last reveal came in)

### Final Results

| Bidder | Tokens Received | Payment | Refund |
|--------|-----------------|---------|--------|
| Alice | 500 tokens | 200 MATIC | 0 MATIC |
| Bob | 1,000 tokens | 400 MATIC | 0 MATIC |
| Carol | 200 tokens | 80 MATIC | 0 MATIC |
| Dave | 800 tokens | 320 MATIC | 0 MATIC |

**If demand exceeded supply**, tokens would be allocated pro-rata based on bid quantities.

---

## Why Commit-Reveal?

### The Problem with Normal Auctions

In a normal on-chain auction:
1. Alice submits a bid for 50 tokens
2. Bob sees Alice's transaction in the mempool
3. Bob front-runs with a higher bid
4. MEV bots extract value from users

### How Commit-Reveal Solves This

1. **Commit Phase**: Alice submits a hash of her bid (hidden)
2. Nobody can see Alice wants 50 tokens
3. Front-running is impossible without knowing the quantity
4. **Reveal Phase**: Alice reveals her bid
5. By now, it's too late to front-run

```
NORMAL AUCTION:              COMMIT-REVEAL:

Alice bids 50 ──────┐        Alice commits [hash] ─────┐
                    │                                   │
Bob sees Alice ─────┤        Bob sees hash ────────────┤ (can't decode!)
                    │        (doesn't know quantity)    │
Bob front-runs ─────┤                                   │
                    ▼                                   ▼
Alice loses         ✗        Alice reveals 50 ─────────► Alice wins ✓
```

---

## Smart Contract Functions

### For Bidders

| Function | When to Use | Description |
|----------|-------------|-------------|
| `commit(hash)` | Commit phase | Submit hidden bid with locked MATIC |
| `reveal(quantity, nonce)` | Reveal phase | Reveal your bid quantity |
| `claimTokens()` | After cleared | Claim won tokens + refund |
| `claimRefund()` | After cleared | Claim refund (if didn't reveal) |
| `claimVestedTokens()` | If vesting | Claim vested tokens over time |

### For Creators

| Function | When to Use | Description |
|----------|-------------|-------------|
| `depositTokens()` | Before start | Deposit tokens to activate auction |
| `updateMetadata(...)` | Before start | Update title, description, image |
| `addToWhitelistBatch(...)` | Before start | Add addresses to whitelist |
| `cancelAuction()` | Before bids | Cancel and recover tokens |
| `withdrawProceeds()` | After cleared | Withdraw MATIC proceeds |
| `withdrawUnsoldTokens()` | After cleared | Withdraw unsold tokens |

---

## Troubleshooting

### "Transaction Failed"

- Check you have enough MATIC for gas
- Ensure you're on Polygon Amoy network
- Check the auction is in the correct phase

### "Invalid Commitment"

- Make sure Quantity and Nonce are exactly what you saved
- Don't add spaces or modify the values
- Check you're revealing on the correct auction

### "Not Whitelisted"

- This auction requires whitelist approval
- Contact the auction creator to get whitelisted

### "Tokens Not Deposited"

- Creator hasn't deposited tokens yet
- Wait for creator to complete deposit

### Lost Quantity/Nonce

- Check browser localStorage (the app saves it automatically)
- If truly lost, you cannot reveal and will lose your deposit minus penalty

---

## Network Information

| Network | Chain ID | RPC URL |
|---------|----------|---------|
| Polygon Amoy (Testnet) | 80002 | https://rpc-amoy.polygon.technology |
| Polygon Mainnet | 137 | https://polygon-rpc.com |

### Getting Test MATIC

For Polygon Amoy testnet, get free MATIC from:
- https://faucet.polygon.technology/
- https://amoy.polygonscan.com/

---

## AI Assistant

Use the floating chat button (bottom-right) to ask questions about the platform:

- **"How do I create a Dutch Auction?"** – Step-by-step guide
- **"How to create a new Token?"** – Token deployment walkthrough
- **"What is the Faucet for?"** – Explains test tokens
- **"Explain Dutch Auction mechanism"** – Technical overview

The assistant can answer other questions about ClearFall, auctions, and bidding.

---

## Support

- **Explorer**: https://amoy.polygonscan.com/
- **Issues**: Check contract events for detailed error messages

---

*Built with ClearFall Protocol on Polygon*
