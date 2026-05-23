# KalaKriti NFT Marketplace — Design Spec
**Date:** 2026-05-23
**Author:** harsh522004
**Status:** Approved

---

## Purpose

A learning-focused, portfolio-quality NFT marketplace built end-to-end. The goal is hands-on experience with real-world Web3 tools and concepts: Solidity smart contracts, IPFS metadata storage, wallet integration, event-driven backend indexing, and a modern React frontend.

Not a production marketplace — a complete, polished showcase of the full Web3 development stack.

---

## Scope

**In scope (core):**
- Create NFT collections (CollectionFactory pattern)
- Mint ERC-721 NFTs with IPFS metadata and per-token royalties (ERC-2981)
- List NFTs for fixed-price sale
- Buy listed NFTs (pull payment pattern)
- Cancel listings
- Withdraw earnings
- 2% marketplace fee on every sale
- Backend event indexer for search/filter
- Frontend with wallet connection (MetaMask / WalletConnect)

**Out of scope (future extension):**
- Auctions / time-based bidding
- Offers on unlisted NFTs
- Multi-chain support
- ERC-20 payment tokens
- Gasless / meta-transactions

---

## Tech Stack

| Layer | Stack |
|---|---|
| Smart Contracts | Foundry, Solidity ^0.8.20, OpenZeppelin |
| Backend | Node.js + Express + TypeScript + Prisma + PostgreSQL |
| Frontend | Vite + React + TypeScript + wagmi/viem + TailwindCSS + RainbowKit |
| IPFS | Pinata |
| Testnet | Sepolia |

---

## Architecture

```
Frontend (Vite + React + wagmi)
        ↓ wallet txs           ↓ REST API calls
Smart Contracts (Sepolia)    Backend Indexer (Express)
        ↓ events                      ↓
                        PostgreSQL (via Prisma)
                                      ↑
                        Pinata (IPFS) for NFT metadata
```

**Core principle:**
- Blockchain = source of truth
- Backend = search & index layer
- IPFS = metadata storage
- Frontend = user interaction layer

---

## Smart Contracts

### NFTCollection.sol
Extends: `ERC721`, `ERC721URIStorage`, `ERC2981`, `Ownable`

```
State:
  bool public privateMint
  uint256 public tokenCounter

Functions:
  mintNFT(tokenURI, royaltyReceiver, royaltyFeeNumerator)
    → mints token, stores URI, sets per-token royalty via _setTokenRoyalty

Events:
  NFTMinted(uint256 tokenId, address creator)
```

Royalty fee uses basis points (10000 denominator). Example: 500 = 5%.

### CollectionFactory.sol
```
State:
  address[] public allCollections
  mapping(address => address[]) public collectionsByOwner

Functions:
  createCollection(name, symbol, collectionURI, privateMint)
    → deploys NFTCollection, transfers ownership to msg.sender, records address

Events:
  CollectionCreated(address collectionAddress, address owner)
```

### Marketplace.sol
Extends: `ReentrancyGuard`, `Ownable`

```
State:
  struct Listing { address seller; uint256 price; bool active; }
  mapping(uint256 => Listing) public listings
  mapping(address => uint256) public pendingWithdrawals
  uint256 public listingCounter
  uint256 public constant MARKETPLACE_FEE_BPS = 200   // 2%
  address public feeRecipient

Functions:
  listNFT(collection, tokenId, price)
    → validates: caller is owner, price > 0, not already listed, marketplace approved
  cancelListing(listingId)
    → validates: caller is seller; marks inactive
  buyNFT(listingId) payable [nonReentrant]
    → validates: listing active, msg.value == price (exact), seller still owns, marketplace approved
    → calculates: royalty (ERC2981), fee (2%), seller = remainder
    → credits pendingWithdrawals for all three parties
    → transfers NFT seller → buyer; marks listing inactive
  withdrawFunds() [nonReentrant]
    → checks balance > 0, zeroes balance, transfers ETH

Events:
  NFTListed(uint256 listingId, address seller, address collection, uint256 tokenId, uint256 price)
  NFTSold(uint256 listingId, address buyer, address seller, uint256 tokenId, uint256 price)
  ListingCancelled(uint256 listingId)
```

**Security patterns used:**
- ReentrancyGuard on all payable + withdrawal functions
- Checks-Effects-Interactions order in buyNFT
- Pull-over-push payments (no direct ETH push to sellers)
- Custom errors (not require strings) for gas efficiency
- Ownership + approval re-validated at buy time (not just list time)

---

## Backend

### Folder Structure
```
backend/
  src/
    listeners/     ← factory.listener.ts, nft.listener.ts, marketplace.listener.ts
    services/      ← collection.service.ts, nft.service.ts, listing.service.ts
    routes/        ← collections.ts, nfts.ts, listings.ts, activities.ts
    db/            ← prisma client singleton
  prisma/
    schema.prisma
```

### Database Schema (Prisma)
```
Collection: address, owner, name, symbol, metadataURI, privateMint, createdAt
NFT:        tokenId, collectionAddress, owner, creator, tokenURI, royaltyPct, isListed
Listing:    listingId, collectionAddress, tokenId, seller, price, active, createdAt
Activity:   id, type(mint|list|sale|cancel|transfer), actor, tokenId, price, txHash, timestamp
```

### Event Listeners
- `CollectionCreated` → upsert Collection row
- `NFTMinted` → insert NFT row
- `Transfer` → update NFT owner
- `NFTListed` → insert Listing row, set NFT.isListed = true
- `NFTSold` → update Listing (inactive), update NFT owner, insert Activity
- `ListingCancelled` → update Listing (inactive), set NFT.isListed = false
- On startup: replay events from last saved checkpoint block

### REST APIs
```
GET /collections
GET /collections/:address
GET /nfts?owner=&collection=
GET /nfts/:collection/:tokenId
GET /listings?minPrice=&maxPrice=&collection=
GET /activities?tokenId=&actor=
```

---

## Frontend

### Pages
| Route | Purpose |
|---|---|
| `/` | Marketplace — all active listings, search + filter |
| `/collections` | All collections + create new |
| `/collections/:address` | Collection detail + its NFTs |
| `/mint` | Upload image → metadata → mint NFT |
| `/profile` | My NFTs, my listings, pending withdrawals |
| `/nft/:collection/:tokenId` | NFT detail + List / Buy / Cancel actions |

### Key Flows

**Mint:**
Upload image to Pinata → upload metadata JSON to Pinata → call `mintNFT(tokenURI, receiver, fee)`

**List (2-step):**
Check approval → call `approve(marketplace, tokenId)` if needed → call `listNFT(collection, tokenId, price)`
> Show user both steps with clear status labels ("Step 1: Approve" → "Step 2: List")

**Buy:**
Call `buyNFT(listingId, { value: price })`

**Withdraw:**
Show `pendingWithdrawals[address]` balance → call `withdrawFunds()`

### Wallet Integration
- RainbowKit `ConnectButton` for wallet modal
- `useAccount`, `useChainId` for state
- Network guard: warn + prompt switch if not on Sepolia (chainId 11155111)
- `useWriteContract` + `useWaitForTransactionReceipt` for all write calls

### IPFS Display
All `ipfs://` URIs resolved via Pinata gateway for display:
`ipfs://CID` → `https://gateway.pinata.cloud/ipfs/CID`

---

## Required Account Setups

| Service | Phase | What to do |
|---|---|---|
| Alchemy | Already done | Verify Sepolia RPC key is active |
| Etherscan | Already done | Key already in .env |
| PostgreSQL | Phase 2.1 | Install locally or use Supabase/Railway (free) |
| Pinata | Phase 3.3 | pinata.cloud → create account → get API key |
| WalletConnect | Phase 3.1 | cloud.walletconnect.com → create project → get Project ID |
| Vercel | Phase 4.2 | vercel.com → sign up (free) |
| Railway or Render | Phase 4.3 | railway.app or render.com → sign up (free) |

---

## Phased Plan Summary

### Phase 0 — Foundation & Cleanup
- 0.1 Clean old code, set up final folder structure
- 0.2 Install OpenZeppelin, confirm remappings
- 0.3 Set up CLAUDE.md
- 0.4 Verify .env credentials

### Phase 1 — Smart Contracts
- 1.1 NFTCollection.sol + tests
- 1.2 CollectionFactory.sol + tests
- 1.3 Marketplace.sol + tests (most critical)
- 1.4 DeployAll.s.sol + Sepolia deploy + Etherscan verify

### Phase 2 — Backend Indexer
- 2.1 Project setup (Express + Prisma + PostgreSQL)
- 2.2 Database schema + migrations
- 2.3 Event listeners (factory, NFT, marketplace)
- 2.4 REST APIs with filtering

### Phase 3 — Frontend
- 3.1 Vite setup + wallet connection (RainbowKit)
- 3.2 Pages + components (Marketplace, Mint, Profile, NFT Detail)
- 3.3 Pinata IPFS integration
- 3.4 Contract interaction flows (mint, list, buy, withdraw)

### Phase 4 — Polish & Deployment
- 4.1 Error handling + UX polish
- 4.2 Deploy frontend to Vercel
- 4.3 Deploy backend to Railway/Render
- 4.4 End-to-end Sepolia test + README update
