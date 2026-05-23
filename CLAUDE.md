# KalaKriti — Project Context for Claude

## What This Project Is
A learning-focused, portfolio-quality NFT marketplace built end-to-end on Ethereum (Sepolia testnet).
Goal: hands-on experience with Solidity, IPFS, wallet integration, event-driven backend, and modern React Web3 frontend.

Full spec: `docs/superpowers/specs/2026-05-23-kalakriti-nft-marketplace-design.md`

---

## Architecture

```
Frontend (Vite + React + wagmi/viem + TailwindCSS + RainbowKit)
        ↓ wallet txs              ↓ REST API
Smart Contracts (Sepolia)     Backend (Express + Prisma + PostgreSQL)
        ↓ events                      ↑
                          Pinata (IPFS) — image + metadata storage
```

**Three smart contracts:**
1. `CollectionFactory.sol` — deploys NFTCollection instances (factory pattern)
2. `NFTCollection.sol` — ERC721 + ERC721URIStorage + ERC2981 + Ownable
3. `Marketplace.sol` — list, buy, cancel, withdraw + 2% platform fee

---

## Stack Decisions

| Layer | Choice | Why |
|---|---|---|
| Contract tooling | Foundry | Already set up; faster tests than Hardhat |
| Contracts | Solidity ^0.8.20 + OpenZeppelin | Industry standard, audited base |
| Backend | Node.js + Express + TypeScript + Prisma | Pragmatic, clean ORM, good for learning |
| Database | PostgreSQL | Reliable, Prisma support, free tiers available |
| Frontend | Vite + React + TypeScript | Fast dev loop, modern |
| Web3 hooks | wagmi v2 + viem | Industry standard, replaces ethers.js for frontend |
| Wallet UI | RainbowKit | Best wallet modal UX, works with wagmi |
| IPFS | Pinata | Simplest SDK, free tier sufficient |
| Testnet | Sepolia | Ethereum testnet, already have credentials |

---

## Key Architecture Decisions

### Pull Payment Pattern
Sellers do NOT receive ETH directly on sale. Instead, `pendingWithdrawals[seller] += amount`.
Sellers call `withdrawFunds()` to pull their ETH.
**Why:** Prevents reentrancy and failed-transfer attacks.

### Exact Payment Required in buyNFT
`msg.value` must equal listing price exactly — no over/underpay.
**Why:** Simpler math, no refund logic needed, cleaner UX (wagmi reads price from contract).

### Approval-Based Marketplace
NFTs stay in the owner's wallet. Marketplace only gets `approve()` permission.
**Why:** Safer UX — owner retains custody until sale completes.

### Listing by listingId (not nftAddress+tokenId)
Listings are tracked by an incrementing `listingCounter` → `listingId`.
**Why:** Simpler for backend indexing; supports re-listing the same token at different prices.

### 2% Marketplace Fee
`MARKETPLACE_FEE_BPS = 200` (basis points, denominator 10000).
Fee goes to `feeRecipient` (set at deploy time, owner can update).

### ERC-2981 Royalties
Per-token royalty set at mint time via `_setTokenRoyalty(tokenId, receiver, feeNumerator)`.
Marketplace calls `royaltyInfo(tokenId, salePrice)` at buy time to compute and credit royalty.

### Security Patterns
- `nonReentrant` on `buyNFT()` and `withdrawFunds()`
- Checks-Effects-Interactions in `buyNFT()`
- Custom errors (not `require` strings) for gas efficiency
- Re-validate ownership + approval at buy time (not only at list time)

---

## Folder Structure

```
contracts/
  src/           ← Solidity contracts
  test/          ← Foundry tests
  script/        ← Deploy scripts
frontend/        ← Vite React app
backend/         ← Express indexer
shared/          ← ABIs + deployed contract addresses (auto-generated)
docs/
  superpowers/specs/  ← Design docs
knowledge_Base/  ← Reference docs (do not edit)
```

---

## Standards to Follow

### Solidity
- Solidity ^0.8.20
- Always use custom errors: `error NotOwner()` not `require(condition, "msg")`
- NatSpec only on public/external functions that need explanation
- No magic numbers — use named constants
- Follow Checks-Effects-Interactions in every state-changing function

### TypeScript (Backend + Frontend)
- Strict TypeScript (`"strict": true`)
- No `any` types
- Use async/await, not raw Promises

### Git
- Commits per phase step (e.g. `feat(contracts): add NFTCollection with ERC2981`)
- Keep commit messages short and simple — one line, no explanations
- Never include "Claude", "Co-Authored-By", or any AI attribution in commit messages
- Never commit `.env` — use `.env.example` for documentation
- **Never push to GitHub** — always stop before `git push`, user handles all pushes

### Testing (Foundry)
- Every public/external contract function has at least one test
- Test edge cases: wrong caller, wrong payment, already-listed, etc.
- Use `makeAddr("label")` for test addresses
- Use `vm.prank`, `vm.expectRevert`, `vm.deal` fluently

---

## Environment Variables

Stored in `.env` (never committed). Keys needed:
```
SEPOLIA_RPC_URL=          # Alchemy Sepolia endpoint
PRIVATE_KEY=              # Deployer wallet private key
ETHERSCAN_API_KEY=        # For contract verification
PINATA_API_KEY=           # Added in Phase 3
PINATA_SECRET_KEY=        # Added in Phase 3
WALLETCONNECT_PROJECT_ID= # Added in Phase 3
```

---

## Deployed Contract Addresses

Populated after Phase 1.4 deployment. Stored in `shared/addresses.json`.

```json
{
  "sepolia": {
    "CollectionFactory": "",
    "Marketplace": ""
  }
}
```

---

## Mistakes & Lessons Learned

_Updated as we build. Empty for now — first entry goes here when we hit our first real mistake._

---

## Current Phase

**Next up: Phase 0 — Foundation & Cleanup**
