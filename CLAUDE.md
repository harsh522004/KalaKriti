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

### Running Forge/Cast/Anvil (Windows + WSL)
Foundry is installed in WSL at `/home/harsh/.foundry/bin/`. Always run via:
```bash
wsl -e bash -c "export PATH=\$HOME/.foundry/bin:\$PATH && cd /mnt/h/devlopement/web3/KalaKriti && <command>"
```
To load `.env` vars in the same command, prefix with `source .env &&`.
Project H: drive maps to `/mnt/h/` in WSL.

### OpenZeppelin
OZ v5.6.1 installed via npm in `node_modules/`. Remapping: `@openzeppelin/contracts/=node_modules/@openzeppelin/contracts/`. Do NOT run `forge install` for OZ — use npm.

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

Deployed to Sepolia on 2026-05-26. Stored in `shared/addresses.json`.

```json
{
  "sepolia": {
    "CollectionFactory": "0xC6848D1F9B06995f01E2455a4e06deE7B32dA030",
    "Marketplace": "0xE59fB714CAa715E64Bb991F1F5E9709324373eE7"
  }
}
```

Etherscan:
- CollectionFactory: https://sepolia.etherscan.io/address/0xC6848D1F9B06995f01E2455a4e06deE7B32dA030
- Marketplace: https://sepolia.etherscan.io/address/0xE59fB714CAa715E64Bb991F1F5E9709324373eE7

---

## Neon MCP Usage

The Neon MCP is configured globally and available as `mcp__Neon__*` tools.

### Permission rules
- **Read-only tools — use freely, no user confirmation needed:**
  - `mcp__Neon__list_projects`, `mcp__Neon__describe_project`
  - `mcp__Neon__get_database_tables`, `mcp__Neon__describe_table_schema`
  - `mcp__Neon__run_sql` (SELECT queries only)
  - `mcp__Neon__get_connection_string`
  - `mcp__Neon__list_branch_computes`, `mcp__Neon__describe_branch`
  - `mcp__Neon__list_slow_queries`, `mcp__Neon__explain_sql_statement`
- **Write / mutating tools — always ask user first:**
  - `mcp__Neon__run_sql` with INSERT / UPDATE / DELETE
  - `mcp__Neon__run_sql_transaction`
  - `mcp__Neon__prepare_database_migration`, `mcp__Neon__complete_database_migration`
  - `mcp__Neon__create_branch`, `mcp__Neon__delete_branch`
  - `mcp__Neon__create_project`
- **NEVER run under any circumstances:**
  - `mcp__Neon__delete_project`

### Project reference
| Key | Value |
|---|---|
| Project name | KalaKriti |
| Project ID | `rough-union-67203035` |
| Database | `neondb` |
| Region | `aws-ap-southeast-1` |
| PG version | 18 |

### Quick-reference commands

```typescript
// List tables
mcp__Neon__get_database_tables({ projectId: 'rough-union-67203035' })

// Inspect a table
mcp__Neon__describe_table_schema({ projectId: 'rough-union-67203035', tableName: 'Collection' })

// Run a SELECT
mcp__Neon__run_sql({ projectId: 'rough-union-67203035', sql: 'SELECT * FROM "Collection" LIMIT 10;' })

// Get connection string
mcp__Neon__get_connection_string({ projectId: 'rough-union-67203035' })
```

---

## Mistakes & Lessons Learned

_Updated as we build. Empty for now — first entry goes here when we hit our first real mistake._

---

## Completed Phases

| Phase | Description | Status |
|---|---|---|
| Phase 0 | Foundation — repo setup, Foundry config, OZ install, shared/ structure | ✅ Done |
| Phase 1 | Smart Contracts — CollectionFactory, NFTCollection, Marketplace + Foundry tests | ✅ Done |
| Phase 2 | Backend Indexer — Express + Prisma + PostgreSQL + viem event listeners | ✅ Done |
| Phase 3 | Frontend — Vite + React + wagmi + RainbowKit + all pages + IPFS mint | ✅ Done |
| Phase 4 | Polish + Deploy — error handling, Vercel + Railway deploy, E2E Sepolia test | 🔜 Next |

---

## Current Phase

**Phase 3 (Frontend) complete. In local testing before Phase 4.**
Issues found during testing → `docs/development/Issues.md`
All code changes during testing → `docs/development/changesLogs.md`

---

## Development Workflow — Testing & Fixes

After each phase, test locally before moving on. During that testing period:

### Issues Log → `docs/development/Issues.md`

Log every bug or problem found with three fields:

- **Observation** — what was seen (plain language, no jargon)
- **Root Cause** — why it happened (one or two simple sentences — write it so a non-developer can follow)
- **Solution** — the fix applied or the best approach chosen

**Language rule:** Keep root cause and observation simple. Avoid dense technical paragraphs.

### Changes Log → `docs/development/changesLogs.md`

Record every code change made during testing or issue resolution:
- Date
- File(s) changed
- What changed and why (one line per change)

This covers both bug fixes and small improvements made during the testing phase.
