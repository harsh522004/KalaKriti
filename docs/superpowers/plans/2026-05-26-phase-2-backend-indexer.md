# Phase 2: Backend Indexer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Express + Prisma backend that indexes KalaKriti smart contract events into PostgreSQL and serves a REST API for the frontend.

**Architecture:** A polling listener fetches blockchain logs every 12 seconds using viem's `getLogs`, processes them into PostgreSQL via Prisma, and checkpoints the last processed block for replay on restart. Express routes query the DB to serve collections, NFTs, listings, and activity feeds.

**Tech Stack:** Node.js 24 LTS, TypeScript 5 (strict), Express 5.2, Prisma 7 (7.6.0), PostgreSQL 18 (Neon), viem 2, Jest 29, supertest

---

## File Map

```
backend/
  src/
    index.ts                              ← entry point: starts server + listeners
    app.ts                                ← Express app, route mounting, BigInt serializer
    db/
      client.ts                           ← Prisma singleton (one instance across app)
    services/
      collection.service.ts              ← upsertCollection, getCollections, getCollection
      nft.service.ts                     ← upsertNFT, updateNFTOwner, setNFTListed, getNFTs, getNFT
      listing.service.ts                 ← createListing, deactivateListing, getListingById, getListings
      activity.service.ts                ← createActivity, getActivities
      checkpoint.service.ts              ← getLastBlock, setLastBlock (tracks replay position)
    routes/
      collections.ts                     ← GET /collections, GET /collections/:address
      nfts.ts                            ← GET /nfts, GET /nfts/:collection/:tokenId
      listings.ts                        ← GET /listings
      activities.ts                      ← GET /activities
    listeners/
      client.ts                          ← viem public client singleton
      factory.listener.ts                ← CollectionCreated → collection.service
      nft.listener.ts                    ← NFTMinted + Transfer → nft.service
      marketplace.listener.ts            ← NFTListed, NFTSold, ListingCancelled → services
      index.ts                           ← poll loop, orchestrates all listeners
    __tests__/
      services/
        collection.service.test.ts
        nft.service.test.ts
        listing.service.test.ts
        activity.service.test.ts
      routes/
        collections.test.ts
        nfts.test.ts
        listings.test.ts
        activities.test.ts
      listeners/
        factory.listener.test.ts
        nft.listener.test.ts
        marketplace.listener.test.ts
  prisma/
    schema.prisma
  prisma.config.ts                           ← Prisma 7: database URL lives here (not in schema.prisma)
  package.json
  tsconfig.json
  jest.config.ts
  .env.example
```

---

## Task 1: Project Setup

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/jest.config.ts`
- Create: `backend/.env.example`
- Create: `backend/src/app.ts`
- Create: `backend/src/index.ts`

- [ ] **Step 1: Create directory structure**

Run from repo root:
```powershell
New-Item -ItemType Directory -Force backend/src/db, backend/src/services, backend/src/routes, backend/src/listeners, backend/src/__tests__/services, backend/src/__tests__/routes, backend/src/__tests__/listeners, backend/prisma
```

- [ ] **Step 2: Create `backend/package.json`**

```json
{
  "name": "kalakriti-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon --watch src --ext ts --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate"
  },
  "dependencies": {
    "@prisma/client": "^7.6.0",
    "dotenv": "^16.4.5",
    "express": "^5.2.0",
    "viem": "^2.17.0"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/jest": "^29.5.12",
    "@types/node": "^24.0.0",
    "@types/supertest": "^6.0.2",
    "nodemon": "^3.1.3",
    "prisma": "^7.6.0",
    "supertest": "^7.0.0",
    "ts-jest": "^29.1.4",
    "ts-node": "^10.9.2",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 3: Install dependencies**

```powershell
cd backend && npm install
```

Expected: `node_modules/` populated, no errors.

- [ ] **Step 4: Create `backend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 5: Create `backend/jest.config.ts`**

```typescript
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  clearMocks: true,
};
```

- [ ] **Step 6: Create `backend/.env.example`**

```
DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/kalakriti?sslmode=require
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
FACTORY_ADDRESS=0xC6848D1F9B06995f01E2455a4e06deE7B32dA030
MARKETPLACE_ADDRESS=0xE59fB714CAa715E64Bb991F1F5E9709324373eE7
DEPLOY_BLOCK=10927023
PORT=3001
```

Copy to `.env`. For `DATABASE_URL`: sign up free at [neon.tech](https://neon.tech) → create project → copy the connection string (it already includes `?sslmode=require`). For `SEPOLIA_RPC_URL`: copy from the root project `.env`.

- [ ] **Step 7: Create `backend/src/app.ts`**

> Express 5 automatically catches errors thrown in async route handlers and forwards them to error middleware — no try/catch needed in routes.

```typescript
import express, { Request, Response, NextFunction } from 'express';
import collectionsRouter from './routes/collections';
import nftsRouter from './routes/nfts';
import listingsRouter from './routes/listings';
import activitiesRouter from './routes/activities';

export const app = express();

app.use(express.json());

// Serialize BigInt values as strings in JSON responses
app.set('json replacer', (_key: string, value: unknown) =>
  typeof value === 'bigint' ? value.toString() : value
);

app.use('/collections', collectionsRouter);
app.use('/nfts', nftsRouter);
app.use('/listings', listingsRouter);
app.use('/activities', activitiesRouter);

// Global error handler — Express 5 auto-forwards async route errors here
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export function startServer(port = 3001) {
  return app.listen(port, () => {
    console.log(`Backend running on port ${port}`);
  });
}
```

- [ ] **Step 8: Create `backend/src/index.ts`**

```typescript
import 'dotenv/config';
import { startServer } from './app';
import { startListeners } from './listeners';

async function main() {
  await startListeners();
  startServer(Number(process.env.PORT) || 3001);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 9: Create stub route files so the app compiles**

`backend/src/routes/collections.ts`:
```typescript
import { Router } from 'express';
const router = Router();
export default router;
```

Create the same stub in `backend/src/routes/nfts.ts`, `backend/src/routes/listings.ts`, `backend/src/routes/activities.ts`, and `backend/src/listeners/index.ts`:

`backend/src/routes/nfts.ts`:
```typescript
import { Router } from 'express';
const router = Router();
export default router;
```

`backend/src/routes/listings.ts`:
```typescript
import { Router } from 'express';
const router = Router();
export default router;
```

`backend/src/routes/activities.ts`:
```typescript
import { Router } from 'express';
const router = Router();
export default router;
```

`backend/src/listeners/index.ts`:
```typescript
export async function startListeners() {
  // implemented in Task 11
}
```

- [ ] **Step 10: Verify TypeScript compiles**

```powershell
cd backend && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 11: Commit**

```powershell
cd .. && git add backend/ && git commit -m "chore(backend): project setup with Express and TypeScript"
```

---

## Task 2: Prisma Schema + Migration

**Files:**
- Create: `backend/prisma/schema.prisma`
- Create: `backend/src/db/client.ts`

- [ ] **Step 1: Create `backend/prisma/schema.prisma`**

> **Prisma 7 breaking change:** The `url` is no longer in `schema.prisma`. It moves to `prisma.config.ts` (next step).

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  // URL is defined in prisma.config.ts — do NOT add url here in Prisma 7
}

model Collection {
  address     String    @id
  owner       String
  name        String
  symbol      String
  metadataURI String
  privateMint Boolean   @default(false)
  createdAt   DateTime  @default(now())
  nfts        NFT[]
  listings    Listing[]
}

// tokenId uses Int (safe for this project; max 2,147,483,647 tokens per collection)
model NFT {
  id                String     @id @default(cuid())
  tokenId           Int
  collectionAddress String
  owner             String
  creator           String
  tokenURI          String
  royaltyPct        Int        @default(0)
  isListed          Boolean    @default(false)
  collection        Collection @relation(fields: [collectionAddress], references: [address])

  @@unique([tokenId, collectionAddress])
}

model Listing {
  listingId         Int        @id
  collectionAddress String
  tokenId           Int
  seller            String
  price             String     // wei amount as decimal string (avoids JS BigInt overflow)
  active            Boolean    @default(true)
  createdAt         DateTime   @default(now())
  collection        Collection @relation(fields: [collectionAddress], references: [address])
}

model Activity {
  id                String   @id @default(cuid())
  type              String   // "mint" | "list" | "sale" | "cancel" | "transfer"
  actor             String
  tokenId           Int
  collectionAddress String
  price             String?  // null for non-sale activities
  txHash            String
  timestamp         DateTime @default(now())
}

// Single-row table tracking last processed block for event replay on restart
model Checkpoint {
  id        Int    @id @default(1)
  lastBlock BigInt @default(0)
}
```

- [ ] **Step 2: Create `backend/prisma.config.ts`**

Prisma 7 reads the database URL from this file (not from `schema.prisma`):

```typescript
import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 3: Set up Neon PostgreSQL (free, no install needed)**

1. Go to [neon.tech](https://neon.tech) → sign up free (no credit card)
2. Create a new project → name it `kalakriti`
3. Copy the connection string — looks like: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/kalakriti?sslmode=require`
4. Paste it into `backend/.env` as `DATABASE_URL`

- [ ] **Step 4: Run the migration**

```powershell
cd backend && npx prisma migrate dev --name init
```

Expected:
```
Applying migration `20260526_init`
Your database is now in sync with your schema.
Generated Prisma Client
```

- [ ] **Step 5: Verify tables were created**

```powershell
cd backend && npx prisma studio
```

Opens a browser UI. Confirm these tables exist: `Collection`, `NFT`, `Listing`, `Activity`, `Checkpoint`. Close Prisma Studio.

- [ ] **Step 6: Create `backend/src/db/client.ts`**

```typescript
import { PrismaClient } from '@prisma/client';

// Pass datasourceUrl explicitly — Prisma 7 reads URL from prisma.config.ts for CLI,
// but the runtime client needs it passed directly or via env.
export const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});
```

- [ ] **Step 7: Commit**

```powershell
cd .. && git add backend/prisma/ backend/prisma.config.ts backend/src/db/ && git commit -m "feat(backend): add Prisma schema and initial migration"
```

---

## Task 3: Collection Service + Route (TDD)

**Files:**
- Create: `backend/src/__tests__/services/collection.service.test.ts`
- Create: `backend/src/services/collection.service.ts`
- Create: `backend/src/__tests__/routes/collections.test.ts`
- Modify: `backend/src/routes/collections.ts`

- [ ] **Step 1: Write the failing service test**

`backend/src/__tests__/services/collection.service.test.ts`:
```typescript
jest.mock('../../db/client', () => ({
  prisma: {
    collection: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from '../../db/client';
import {
  upsertCollection,
  getCollections,
  getCollection,
} from '../../services/collection.service';

const mockUpsert = prisma.collection.upsert as jest.Mock;
const mockFindMany = prisma.collection.findMany as jest.Mock;
const mockFindUnique = prisma.collection.findUnique as jest.Mock;

const sample = {
  address: '0xABC',
  owner: '0xDEF',
  name: 'KalaArt',
  symbol: 'KA',
  metadataURI: 'ipfs://col',
  privateMint: false,
};

describe('collection.service', () => {
  it('upsertCollection calls prisma.collection.upsert with correct args', async () => {
    mockUpsert.mockResolvedValue(sample);
    await upsertCollection(sample);
    expect(mockUpsert).toHaveBeenCalledWith({
      where: { address: '0xABC' },
      create: sample,
      update: { owner: '0xDEF' },
    });
  });

  it('getCollections returns all collections ordered by createdAt desc', async () => {
    mockFindMany.mockResolvedValue([sample]);
    const result = await getCollections();
    expect(result).toEqual([sample]);
    expect(mockFindMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'desc' } });
  });

  it('getCollection returns null when not found', async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await getCollection('0xNONE');
    expect(result).toBeNull();
  });

  it('getCollection returns the collection when found', async () => {
    mockFindUnique.mockResolvedValue(sample);
    const result = await getCollection('0xABC');
    expect(result).toEqual(sample);
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { address: '0xABC' } });
  });
});
```

- [ ] **Step 2: Run service test — confirm it FAILs**

```powershell
cd backend && npx jest __tests__/services/collection.service.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../../services/collection.service'`

- [ ] **Step 3: Implement `backend/src/services/collection.service.ts`**

```typescript
import { prisma } from '../db/client';

export interface CollectionData {
  address: string;
  owner: string;
  name: string;
  symbol: string;
  metadataURI: string;
  privateMint: boolean;
}

export async function upsertCollection(data: CollectionData) {
  return prisma.collection.upsert({
    where: { address: data.address },
    create: data,
    update: { owner: data.owner },
  });
}

export async function getCollections() {
  return prisma.collection.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function getCollection(address: string) {
  return prisma.collection.findUnique({ where: { address } });
}
```

- [ ] **Step 4: Run service test — confirm it PASSes**

```powershell
cd backend && npx jest __tests__/services/collection.service.test.ts --no-coverage
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Write the failing route test**

`backend/src/__tests__/routes/collections.test.ts`:
```typescript
jest.mock('../../services/collection.service');

import request from 'supertest';
import { app } from '../../app';
import * as service from '../../services/collection.service';

const mockGetCollections = service.getCollections as jest.Mock;
const mockGetCollection = service.getCollection as jest.Mock;

describe('GET /collections', () => {
  it('returns 200 with empty array', async () => {
    mockGetCollections.mockResolvedValue([]);
    const res = await request(app).get('/collections');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 200 with collections array', async () => {
    const cols = [{ address: '0xABC', name: 'Art' }];
    mockGetCollections.mockResolvedValue(cols);
    const res = await request(app).get('/collections');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(cols);
  });
});

describe('GET /collections/:address', () => {
  it('returns 404 when not found', async () => {
    mockGetCollection.mockResolvedValue(null);
    const res = await request(app).get('/collections/0xNONE');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });

  it('returns 200 with collection when found', async () => {
    const col = { address: '0xABC', name: 'Art' };
    mockGetCollection.mockResolvedValue(col);
    const res = await request(app).get('/collections/0xABC');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(col);
  });
});
```

- [ ] **Step 6: Run route test — confirm it FAILs**

```powershell
cd backend && npx jest __tests__/routes/collections.test.ts --no-coverage
```

Expected: FAIL — route returns 404 for all requests (stub router has no handlers).

- [ ] **Step 7: Implement `backend/src/routes/collections.ts`**

Replace the stub with:
```typescript
import { Router, Request, Response } from 'express';
import { getCollections, getCollection } from '../services/collection.service';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const collections = await getCollections();
  res.json(collections);
});

router.get('/:address', async (req: Request, res: Response) => {
  const collection = await getCollection(req.params.address);
  if (!collection) return res.status(404).json({ error: 'Not found' });
  res.json(collection);
});

export default router;
```

- [ ] **Step 8: Run route test — confirm it PASSes**

```powershell
cd backend && npx jest __tests__/routes/collections.test.ts --no-coverage
```

Expected: All 4 tests PASS.

- [ ] **Step 9: Commit**

```powershell
cd .. && git add backend/src/services/collection.service.ts backend/src/routes/collections.ts backend/src/__tests__/services/collection.service.test.ts backend/src/__tests__/routes/collections.test.ts && git commit -m "feat(backend): collection service and route"
```

---

## Task 4: NFT Service + Route (TDD)

**Files:**
- Create: `backend/src/__tests__/services/nft.service.test.ts`
- Create: `backend/src/services/nft.service.ts`
- Create: `backend/src/__tests__/routes/nfts.test.ts`
- Modify: `backend/src/routes/nfts.ts`

- [ ] **Step 1: Write the failing service test**

`backend/src/__tests__/services/nft.service.test.ts`:
```typescript
jest.mock('../../db/client', () => ({
  prisma: {
    nFT: {
      upsert: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from '../../db/client';
import {
  upsertNFT,
  updateNFTOwner,
  setNFTListed,
  getNFTs,
  getNFT,
} from '../../services/nft.service';

const mockUpsert = prisma.nFT.upsert as jest.Mock;
const mockUpdate = prisma.nFT.update as jest.Mock;
const mockFindMany = prisma.nFT.findMany as jest.Mock;
const mockFindUnique = prisma.nFT.findUnique as jest.Mock;

const sample = {
  tokenId: 0,
  collectionAddress: '0xCOLL',
  owner: '0xOWNER',
  creator: '0xOWNER',
  tokenURI: 'ipfs://token0',
  royaltyPct: 500,
};

describe('nft.service', () => {
  it('upsertNFT calls prisma.nFT.upsert with correct args', async () => {
    mockUpsert.mockResolvedValue(sample);
    await upsertNFT(sample);
    expect(mockUpsert).toHaveBeenCalledWith({
      where: { tokenId_collectionAddress: { tokenId: 0, collectionAddress: '0xCOLL' } },
      create: sample,
      update: { owner: '0xOWNER', tokenURI: 'ipfs://token0' },
    });
  });

  it('updateNFTOwner calls prisma.nFT.update with new owner', async () => {
    mockUpdate.mockResolvedValue({});
    await updateNFTOwner('0xCOLL', 0, '0xNEWOWNER');
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { tokenId_collectionAddress: { tokenId: 0, collectionAddress: '0xCOLL' } },
      data: { owner: '0xNEWOWNER' },
    });
  });

  it('setNFTListed calls prisma.nFT.update with isListed flag', async () => {
    mockUpdate.mockResolvedValue({});
    await setNFTListed('0xCOLL', 0, true);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { tokenId_collectionAddress: { tokenId: 0, collectionAddress: '0xCOLL' } },
      data: { isListed: true },
    });
  });

  it('getNFTs filters by owner when provided', async () => {
    mockFindMany.mockResolvedValue([sample]);
    await getNFTs({ owner: '0xOWNER' });
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ owner: '0xOWNER' }) })
    );
  });

  it('getNFTs filters by collection when provided', async () => {
    mockFindMany.mockResolvedValue([sample]);
    await getNFTs({ collection: '0xCOLL' });
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ collectionAddress: '0xCOLL' }) })
    );
  });

  it('getNFT returns null when not found', async () => {
    mockFindUnique.mockResolvedValue(null);
    expect(await getNFT('0xCOLL', 99)).toBeNull();
  });
});
```

- [ ] **Step 2: Run service test — confirm it FAILs**

```powershell
cd backend && npx jest __tests__/services/nft.service.test.ts --no-coverage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `backend/src/services/nft.service.ts`**

```typescript
import { prisma } from '../db/client';

export interface NFTData {
  tokenId: number;
  collectionAddress: string;
  owner: string;
  creator: string;
  tokenURI: string;
  royaltyPct: number;
}

export async function upsertNFT(data: NFTData) {
  return prisma.nFT.upsert({
    where: { tokenId_collectionAddress: { tokenId: data.tokenId, collectionAddress: data.collectionAddress } },
    create: data,
    update: { owner: data.owner, tokenURI: data.tokenURI },
  });
}

export async function updateNFTOwner(collectionAddress: string, tokenId: number, owner: string) {
  return prisma.nFT.update({
    where: { tokenId_collectionAddress: { tokenId, collectionAddress } },
    data: { owner },
  });
}

export async function setNFTListed(collectionAddress: string, tokenId: number, isListed: boolean) {
  return prisma.nFT.update({
    where: { tokenId_collectionAddress: { tokenId, collectionAddress } },
    data: { isListed },
  });
}

export async function getNFTs(filter: { owner?: string; collection?: string }) {
  return prisma.nFT.findMany({
    where: {
      ...(filter.owner && { owner: filter.owner }),
      ...(filter.collection && { collectionAddress: filter.collection }),
    },
    orderBy: { id: 'desc' },
  });
}

export async function getNFT(collectionAddress: string, tokenId: number) {
  return prisma.nFT.findUnique({
    where: { tokenId_collectionAddress: { tokenId, collectionAddress } },
  });
}
```

- [ ] **Step 4: Run service test — confirm it PASSes**

```powershell
cd backend && npx jest __tests__/services/nft.service.test.ts --no-coverage
```

Expected: All 6 tests PASS.

- [ ] **Step 5: Write the failing route test**

`backend/src/__tests__/routes/nfts.test.ts`:
```typescript
jest.mock('../../services/nft.service');

import request from 'supertest';
import { app } from '../../app';
import * as service from '../../services/nft.service';

const mockGetNFTs = service.getNFTs as jest.Mock;
const mockGetNFT = service.getNFT as jest.Mock;

describe('GET /nfts', () => {
  it('returns 200 with empty array', async () => {
    mockGetNFTs.mockResolvedValue([]);
    const res = await request(app).get('/nfts');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('passes owner query param to service', async () => {
    mockGetNFTs.mockResolvedValue([]);
    await request(app).get('/nfts?owner=0xABC');
    expect(mockGetNFTs).toHaveBeenCalledWith({ owner: '0xABC', collection: undefined });
  });

  it('passes collection query param to service', async () => {
    mockGetNFTs.mockResolvedValue([]);
    await request(app).get('/nfts?collection=0xCOLL');
    expect(mockGetNFTs).toHaveBeenCalledWith({ owner: undefined, collection: '0xCOLL' });
  });
});

describe('GET /nfts/:collection/:tokenId', () => {
  it('returns 404 when not found', async () => {
    mockGetNFT.mockResolvedValue(null);
    const res = await request(app).get('/nfts/0xCOLL/0');
    expect(res.status).toBe(404);
  });

  it('returns 400 for non-numeric tokenId', async () => {
    const res = await request(app).get('/nfts/0xCOLL/abc');
    expect(res.status).toBe(400);
  });

  it('returns 200 with NFT when found', async () => {
    const nft = { tokenId: 0, collectionAddress: '0xCOLL' };
    mockGetNFT.mockResolvedValue(nft);
    const res = await request(app).get('/nfts/0xCOLL/0');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(nft);
  });
});
```

- [ ] **Step 6: Run route test — confirm it FAILs**

```powershell
cd backend && npx jest __tests__/routes/nfts.test.ts --no-coverage
```

Expected: FAIL.

- [ ] **Step 7: Implement `backend/src/routes/nfts.ts`**

```typescript
import { Router, Request, Response } from 'express';
import { getNFTs, getNFT } from '../services/nft.service';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const { owner, collection } = req.query;
  const nfts = await getNFTs({
    owner: typeof owner === 'string' ? owner : undefined,
    collection: typeof collection === 'string' ? collection : undefined,
  });
  res.json(nfts);
});

router.get('/:collection/:tokenId', async (req: Request, res: Response) => {
  const tokenId = parseInt(req.params.tokenId, 10);
  if (isNaN(tokenId)) return res.status(400).json({ error: 'Invalid tokenId' });
  const nft = await getNFT(req.params.collection, tokenId);
  if (!nft) return res.status(404).json({ error: 'Not found' });
  res.json(nft);
});

export default router;
```

- [ ] **Step 8: Run route test — confirm it PASSes**

```powershell
cd backend && npx jest __tests__/routes/nfts.test.ts --no-coverage
```

Expected: All 6 tests PASS.

- [ ] **Step 9: Commit**

```powershell
cd .. && git add backend/src/services/nft.service.ts backend/src/routes/nfts.ts backend/src/__tests__/services/nft.service.test.ts backend/src/__tests__/routes/nfts.test.ts && git commit -m "feat(backend): NFT service and route"
```

---

## Task 5: Listing Service + Route (TDD)

**Files:**
- Create: `backend/src/__tests__/services/listing.service.test.ts`
- Create: `backend/src/services/listing.service.ts`
- Create: `backend/src/__tests__/routes/listings.test.ts`
- Modify: `backend/src/routes/listings.ts`

- [ ] **Step 1: Write the failing service test**

`backend/src/__tests__/services/listing.service.test.ts`:
```typescript
jest.mock('../../db/client', () => ({
  prisma: {
    listing: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '../../db/client';
import {
  createListing,
  deactivateListing,
  getListingById,
  getListings,
} from '../../services/listing.service';

const mockCreate = prisma.listing.create as jest.Mock;
const mockUpdate = prisma.listing.update as jest.Mock;
const mockFindUnique = prisma.listing.findUnique as jest.Mock;
const mockFindMany = prisma.listing.findMany as jest.Mock;

const sample = {
  listingId: 0,
  collectionAddress: '0xCOLL',
  tokenId: 0,
  seller: '0xSELLER',
  price: '1000000000000000000', // 1 ETH in wei
};

describe('listing.service', () => {
  it('createListing calls prisma.listing.create', async () => {
    mockCreate.mockResolvedValue(sample);
    await createListing(sample);
    expect(mockCreate).toHaveBeenCalledWith({ data: sample });
  });

  it('deactivateListing sets active=false', async () => {
    mockUpdate.mockResolvedValue({});
    await deactivateListing(0);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { listingId: 0 },
      data: { active: false },
    });
  });

  it('getListingById returns null when not found', async () => {
    mockFindUnique.mockResolvedValue(null);
    expect(await getListingById(999)).toBeNull();
  });

  it('getListings returns only active listings', async () => {
    mockFindMany.mockResolvedValue([{ ...sample, active: true }]);
    const results = await getListings({});
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ active: true }) })
    );
    expect(results).toHaveLength(1);
  });

  it('getListings filters by minPrice (BigInt comparison)', async () => {
    const cheapListing = { ...sample, price: '500000000000000000' };  // 0.5 ETH
    const expensiveListing = { ...sample, listingId: 1, price: '2000000000000000000' }; // 2 ETH
    mockFindMany.mockResolvedValue([cheapListing, expensiveListing]);
    const results = await getListings({ minPrice: '1000000000000000000' }); // min 1 ETH
    expect(results).toHaveLength(1);
    expect(results[0].listingId).toBe(1);
  });

  it('getListings filters by maxPrice (BigInt comparison)', async () => {
    const cheapListing = { ...sample, price: '500000000000000000' };
    const expensiveListing = { ...sample, listingId: 1, price: '2000000000000000000' };
    mockFindMany.mockResolvedValue([cheapListing, expensiveListing]);
    const results = await getListings({ maxPrice: '1000000000000000000' }); // max 1 ETH
    expect(results).toHaveLength(1);
    expect(results[0].listingId).toBe(0);
  });
});
```

- [ ] **Step 2: Run service test — confirm it FAILs**

```powershell
cd backend && npx jest __tests__/services/listing.service.test.ts --no-coverage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `backend/src/services/listing.service.ts`**

```typescript
import { prisma } from '../db/client';

export interface ListingData {
  listingId: number;
  collectionAddress: string;
  tokenId: number;
  seller: string;
  price: string;
}

export async function createListing(data: ListingData) {
  return prisma.listing.create({ data });
}

export async function deactivateListing(listingId: number) {
  return prisma.listing.update({
    where: { listingId },
    data: { active: false },
  });
}

export async function getListingById(listingId: number) {
  return prisma.listing.findUnique({ where: { listingId } });
}

export async function getListings(filter: {
  minPrice?: string;
  maxPrice?: string;
  collection?: string;
}) {
  const rows = await prisma.listing.findMany({
    where: {
      active: true,
      ...(filter.collection && { collectionAddress: filter.collection }),
    },
    orderBy: { createdAt: 'desc' },
  });

  // Price filtering uses BigInt because wei amounts exceed Number.MAX_SAFE_INTEGER
  return rows.filter((l) => {
    const price = BigInt(l.price);
    if (filter.minPrice && price < BigInt(filter.minPrice)) return false;
    if (filter.maxPrice && price > BigInt(filter.maxPrice)) return false;
    return true;
  });
}
```

- [ ] **Step 4: Run service test — confirm it PASSes**

```powershell
cd backend && npx jest __tests__/services/listing.service.test.ts --no-coverage
```

Expected: All 6 tests PASS.

- [ ] **Step 5: Write the failing route test**

`backend/src/__tests__/routes/listings.test.ts`:
```typescript
jest.mock('../../services/listing.service');

import request from 'supertest';
import { app } from '../../app';
import * as service from '../../services/listing.service';

const mockGetListings = service.getListings as jest.Mock;

describe('GET /listings', () => {
  it('returns 200 with empty array', async () => {
    mockGetListings.mockResolvedValue([]);
    const res = await request(app).get('/listings');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('passes minPrice and maxPrice to service', async () => {
    mockGetListings.mockResolvedValue([]);
    await request(app).get('/listings?minPrice=1000&maxPrice=5000');
    expect(mockGetListings).toHaveBeenCalledWith({
      minPrice: '1000',
      maxPrice: '5000',
      collection: undefined,
    });
  });

  it('passes collection filter to service', async () => {
    mockGetListings.mockResolvedValue([]);
    await request(app).get('/listings?collection=0xCOLL');
    expect(mockGetListings).toHaveBeenCalledWith({
      minPrice: undefined,
      maxPrice: undefined,
      collection: '0xCOLL',
    });
  });
});
```

- [ ] **Step 6: Run route test — confirm it FAILs**

```powershell
cd backend && npx jest __tests__/routes/listings.test.ts --no-coverage
```

Expected: FAIL.

- [ ] **Step 7: Implement `backend/src/routes/listings.ts`**

```typescript
import { Router, Request, Response } from 'express';
import { getListings } from '../services/listing.service';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const { minPrice, maxPrice, collection } = req.query;
  const listings = await getListings({
    minPrice: typeof minPrice === 'string' ? minPrice : undefined,
    maxPrice: typeof maxPrice === 'string' ? maxPrice : undefined,
    collection: typeof collection === 'string' ? collection : undefined,
  });
  res.json(listings);
});

export default router;
```

- [ ] **Step 8: Run route test — confirm it PASSes**

```powershell
cd backend && npx jest __tests__/routes/listings.test.ts --no-coverage
```

Expected: All 3 tests PASS.

- [ ] **Step 9: Commit**

```powershell
cd .. && git add backend/src/services/listing.service.ts backend/src/routes/listings.ts backend/src/__tests__/services/listing.service.test.ts backend/src/__tests__/routes/listings.test.ts && git commit -m "feat(backend): listing service and route"
```

---

## Task 6: Activity Service + Route (TDD)

**Files:**
- Create: `backend/src/__tests__/services/activity.service.test.ts`
- Create: `backend/src/services/activity.service.ts`
- Create: `backend/src/__tests__/routes/activities.test.ts`
- Modify: `backend/src/routes/activities.ts`

- [ ] **Step 1: Write the failing service test**

`backend/src/__tests__/services/activity.service.test.ts`:
```typescript
jest.mock('../../db/client', () => ({
  prisma: {
    activity: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '../../db/client';
import { createActivity, getActivities } from '../../services/activity.service';

const mockCreate = prisma.activity.create as jest.Mock;
const mockFindMany = prisma.activity.findMany as jest.Mock;

const sample = {
  type: 'sale',
  actor: '0xBUYER',
  tokenId: 0,
  collectionAddress: '0xCOLL',
  price: '1000000000000000000',
  txHash: '0xTXHASH',
};

describe('activity.service', () => {
  it('createActivity calls prisma.activity.create', async () => {
    mockCreate.mockResolvedValue(sample);
    await createActivity(sample);
    expect(mockCreate).toHaveBeenCalledWith({ data: sample });
  });

  it('getActivities filters by tokenId', async () => {
    mockFindMany.mockResolvedValue([]);
    await getActivities({ tokenId: 0 });
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tokenId: 0 }) })
    );
  });

  it('getActivities filters by actor', async () => {
    mockFindMany.mockResolvedValue([]);
    await getActivities({ actor: '0xACTOR' });
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ actor: '0xACTOR' }) })
    );
  });

  it('getActivities filters by collection', async () => {
    mockFindMany.mockResolvedValue([]);
    await getActivities({ collection: '0xCOLL' });
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ collectionAddress: '0xCOLL' }) })
    );
  });
});
```

- [ ] **Step 2: Run service test — confirm it FAILs**

```powershell
cd backend && npx jest __tests__/services/activity.service.test.ts --no-coverage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `backend/src/services/activity.service.ts`**

```typescript
import { prisma } from '../db/client';

export interface ActivityData {
  type: string;
  actor: string;
  tokenId: number;
  collectionAddress: string;
  price?: string;
  txHash: string;
}

export async function createActivity(data: ActivityData) {
  return prisma.activity.create({ data });
}

export async function getActivities(filter: {
  tokenId?: number;
  actor?: string;
  collection?: string;
}) {
  return prisma.activity.findMany({
    where: {
      ...(filter.tokenId !== undefined && { tokenId: filter.tokenId }),
      ...(filter.actor && { actor: filter.actor }),
      ...(filter.collection && { collectionAddress: filter.collection }),
    },
    orderBy: { timestamp: 'desc' },
  });
}
```

- [ ] **Step 4: Run service test — confirm it PASSes**

```powershell
cd backend && npx jest __tests__/services/activity.service.test.ts --no-coverage
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Write the failing route test**

`backend/src/__tests__/routes/activities.test.ts`:
```typescript
jest.mock('../../services/activity.service');

import request from 'supertest';
import { app } from '../../app';
import * as service from '../../services/activity.service';

const mockGetActivities = service.getActivities as jest.Mock;

describe('GET /activities', () => {
  it('returns 200 with empty array', async () => {
    mockGetActivities.mockResolvedValue([]);
    const res = await request(app).get('/activities');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('passes tokenId to service as number', async () => {
    mockGetActivities.mockResolvedValue([]);
    await request(app).get('/activities?tokenId=5');
    expect(mockGetActivities).toHaveBeenCalledWith(
      expect.objectContaining({ tokenId: 5 })
    );
  });

  it('passes actor to service', async () => {
    mockGetActivities.mockResolvedValue([]);
    await request(app).get('/activities?actor=0xABC');
    expect(mockGetActivities).toHaveBeenCalledWith(
      expect.objectContaining({ actor: '0xABC' })
    );
  });
});
```

- [ ] **Step 6: Run route test — confirm it FAILs**

```powershell
cd backend && npx jest __tests__/routes/activities.test.ts --no-coverage
```

Expected: FAIL.

- [ ] **Step 7: Implement `backend/src/routes/activities.ts`**

```typescript
import { Router, Request, Response } from 'express';
import { getActivities } from '../services/activity.service';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const { tokenId, actor, collection } = req.query;
  const activities = await getActivities({
    tokenId: typeof tokenId === 'string' ? parseInt(tokenId, 10) : undefined,
    actor: typeof actor === 'string' ? actor : undefined,
    collection: typeof collection === 'string' ? collection : undefined,
  });
  res.json(activities);
});

export default router;
```

- [ ] **Step 8: Run route test — confirm it PASSes**

```powershell
cd backend && npx jest __tests__/routes/activities.test.ts --no-coverage
```

Expected: All 3 tests PASS.

- [ ] **Step 9: Run full test suite**

```powershell
cd backend && npx jest --no-coverage
```

Expected: All tests PASS across all services and routes.

- [ ] **Step 10: Commit**

```powershell
cd .. && git add backend/src/services/activity.service.ts backend/src/routes/activities.ts backend/src/__tests__/services/activity.service.test.ts backend/src/__tests__/routes/activities.test.ts && git commit -m "feat(backend): activity service and route"
```

---

## Task 7: Checkpoint Service

**Files:**
- Create: `backend/src/services/checkpoint.service.ts`

> No TDD for this one — the logic is trivial and it requires a real DB to test meaningfully.

- [ ] **Step 1: Create `backend/src/services/checkpoint.service.ts`**

```typescript
import { prisma } from '../db/client';

// Returns the last block that was fully processed (0n if never run before)
export async function getLastBlock(): Promise<bigint> {
  const cp = await prisma.checkpoint.upsert({
    where: { id: 1 },
    create: { id: 1, lastBlock: 0n },
    update: {},
  });
  return cp.lastBlock;
}

// Called after each successful poll to record progress
export async function setLastBlock(block: bigint): Promise<void> {
  await prisma.checkpoint.upsert({
    where: { id: 1 },
    create: { id: 1, lastBlock: block },
    update: { lastBlock: block },
  });
}
```

- [ ] **Step 2: Commit**

```powershell
cd .. && git add backend/src/services/checkpoint.service.ts && git commit -m "feat(backend): checkpoint service for event replay"
```

---

## Task 8: Viem Client + Factory Listener (TDD)

**Files:**
- Create: `backend/src/listeners/client.ts`
- Create: `backend/src/__tests__/listeners/factory.listener.test.ts`
- Create: `backend/src/listeners/factory.listener.ts`

- [ ] **Step 1: Create `backend/src/listeners/client.ts`**

```typescript
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL),
});
```

- [ ] **Step 2: Write the failing listener test**

`backend/src/__tests__/listeners/factory.listener.test.ts`:
```typescript
jest.mock('../../listeners/client', () => ({
  publicClient: {
    getLogs: jest.fn(),
    readContract: jest.fn(),
  },
}));
jest.mock('../../services/collection.service');

import { publicClient } from '../../listeners/client';
import * as collectionService from '../../services/collection.service';
import { processFactoryLogs } from '../../listeners/factory.listener';

const mockGetLogs = publicClient.getLogs as jest.Mock;
const mockReadContract = publicClient.readContract as jest.Mock;
const mockUpsertCollection = collectionService.upsertCollection as jest.Mock;

describe('processFactoryLogs', () => {
  it('does nothing when no logs returned', async () => {
    mockGetLogs.mockResolvedValue([]);
    await processFactoryLogs(0n, 100n);
    expect(mockUpsertCollection).not.toHaveBeenCalled();
  });

  it('upserts a collection when CollectionCreated log is found', async () => {
    mockGetLogs.mockResolvedValue([{
      args: { collectionAddress: '0xCOLL', owner: '0xOWNER' },
      address: '0xFACTORY',
    }]);
    mockReadContract
      .mockResolvedValueOnce('KalaArt')    // name()
      .mockResolvedValueOnce('KA')         // symbol()
      .mockResolvedValueOnce('ipfs://col') // collectionURI()
      .mockResolvedValueOnce(false);       // privateMint()

    await processFactoryLogs(0n, 100n);

    expect(mockUpsertCollection).toHaveBeenCalledWith({
      address: '0xCOLL',
      owner: '0xOWNER',
      name: 'KalaArt',
      symbol: 'KA',
      metadataURI: 'ipfs://col',
      privateMint: false,
    });
  });

  it('processes multiple CollectionCreated logs', async () => {
    mockGetLogs.mockResolvedValue([
      { args: { collectionAddress: '0xCOLL1', owner: '0xOWNER1' }, address: '0xFACTORY' },
      { args: { collectionAddress: '0xCOLL2', owner: '0xOWNER2' }, address: '0xFACTORY' },
    ]);
    mockReadContract.mockResolvedValue('x'); // each call returns 'x' for simplicity

    await processFactoryLogs(0n, 100n);

    expect(mockUpsertCollection).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 3: Run listener test — confirm it FAILs**

```powershell
cd backend && npx jest __tests__/listeners/factory.listener.test.ts --no-coverage
```

Expected: FAIL — module not found.

- [ ] **Step 4: Create `backend/src/listeners/factory.listener.ts`**

```typescript
import { parseAbi, parseAbiItem } from 'viem';
import { publicClient } from './client';
import { upsertCollection } from '../services/collection.service';

const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS as `0x${string}`;

const COLLECTION_CREATED = parseAbiItem(
  'event CollectionCreated(address indexed collectionAddress, address indexed owner)'
);

const NFT_COLLECTION_READ_ABI = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function collectionURI() view returns (string)',
  'function privateMint() view returns (bool)',
]);

export async function processFactoryLogs(fromBlock: bigint, toBlock: bigint) {
  const logs = await publicClient.getLogs({
    address: FACTORY_ADDRESS,
    event: COLLECTION_CREATED,
    fromBlock,
    toBlock,
  });

  for (const log of logs) {
    const { collectionAddress, owner } = log.args as {
      collectionAddress: `0x${string}`;
      owner: `0x${string}`;
    };

    const [name, symbol, metadataURI, privateMint] = await Promise.all([
      publicClient.readContract({ address: collectionAddress, abi: NFT_COLLECTION_READ_ABI, functionName: 'name' }),
      publicClient.readContract({ address: collectionAddress, abi: NFT_COLLECTION_READ_ABI, functionName: 'symbol' }),
      publicClient.readContract({ address: collectionAddress, abi: NFT_COLLECTION_READ_ABI, functionName: 'collectionURI' }),
      publicClient.readContract({ address: collectionAddress, abi: NFT_COLLECTION_READ_ABI, functionName: 'privateMint' }),
    ]);

    await upsertCollection({
      address: collectionAddress,
      owner,
      name: name as string,
      symbol: symbol as string,
      metadataURI: metadataURI as string,
      privateMint: privateMint as boolean,
    });
  }
}
```

- [ ] **Step 5: Run listener test — confirm it PASSes**

```powershell
cd backend && npx jest __tests__/listeners/factory.listener.test.ts --no-coverage
```

Expected: All 3 tests PASS.

- [ ] **Step 6: Commit**

```powershell
cd .. && git add backend/src/listeners/client.ts backend/src/listeners/factory.listener.ts backend/src/__tests__/listeners/factory.listener.test.ts && git commit -m "feat(backend): factory event listener"
```

---

## Task 9: NFT Listener (TDD)

**Files:**
- Create: `backend/src/__tests__/listeners/nft.listener.test.ts`
- Create: `backend/src/listeners/nft.listener.ts`

- [ ] **Step 1: Write the failing listener test**

`backend/src/__tests__/listeners/nft.listener.test.ts`:
```typescript
jest.mock('../../listeners/client', () => ({
  publicClient: {
    getLogs: jest.fn(),
    readContract: jest.fn(),
  },
}));
jest.mock('../../services/nft.service');

import { publicClient } from '../../listeners/client';
import * as nftService from '../../services/nft.service';
import { processNFTLogs } from '../../listeners/nft.listener';

const mockGetLogs = publicClient.getLogs as jest.Mock;
const mockReadContract = publicClient.readContract as jest.Mock;
const mockUpsertNFT = nftService.upsertNFT as jest.Mock;
const mockUpdateNFTOwner = nftService.updateNFTOwner as jest.Mock;

const COLL = '0xCOLLECTION';
const ZERO = '0x0000000000000000000000000000000000000000';

describe('processNFTLogs', () => {
  it('does nothing when no logs and no collection addresses', async () => {
    await processNFTLogs([], 0n, 100n);
    expect(mockGetLogs).not.toHaveBeenCalled();
  });

  it('upserts an NFT when NFTMinted log is found', async () => {
    // First call = NFTMinted logs, second call = Transfer logs
    mockGetLogs
      .mockResolvedValueOnce([{
        args: { tokenId: 0n, creator: '0xARTIST' },
        address: COLL,
      }])
      .mockResolvedValueOnce([]); // no Transfer logs

    mockReadContract
      .mockResolvedValueOnce('ipfs://token0')      // tokenURI()
      .mockResolvedValueOnce(['0xARTIST', 500n]);  // royaltyInfo()

    await processNFTLogs([COLL], 0n, 100n);

    expect(mockUpsertNFT).toHaveBeenCalledWith({
      tokenId: 0,
      collectionAddress: COLL,
      owner: '0xARTIST',
      creator: '0xARTIST',
      tokenURI: 'ipfs://token0',
      royaltyPct: 500,
    });
  });

  it('updates NFT owner on non-mint Transfer', async () => {
    mockGetLogs
      .mockResolvedValueOnce([]) // no NFTMinted logs
      .mockResolvedValueOnce([{
        args: { from: '0xOLDOWNER', to: '0xNEWOWNER', tokenId: 0n },
        address: COLL,
      }]);

    await processNFTLogs([COLL], 0n, 100n);

    expect(mockUpdateNFTOwner).toHaveBeenCalledWith(COLL, 0, '0xNEWOWNER');
  });

  it('skips Transfer events where from is zero address (mints)', async () => {
    mockGetLogs
      .mockResolvedValueOnce([]) // no NFTMinted logs
      .mockResolvedValueOnce([{
        args: { from: ZERO, to: '0xMINTER', tokenId: 0n },
        address: COLL,
      }]);

    await processNFTLogs([COLL], 0n, 100n);

    expect(mockUpdateNFTOwner).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run listener test — confirm it FAILs**

```powershell
cd backend && npx jest __tests__/listeners/nft.listener.test.ts --no-coverage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `backend/src/listeners/nft.listener.ts`**

```typescript
import { parseAbi, parseAbiItem } from 'viem';
import { publicClient } from './client';
import { upsertNFT, updateNFTOwner } from '../services/nft.service';

const NFT_MINTED = parseAbiItem(
  'event NFTMinted(uint256 indexed tokenId, address indexed creator)'
);

const ERC721_TRANSFER = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
);

const NFT_READ_ABI = parseAbi([
  'function tokenURI(uint256) view returns (string)',
  'function royaltyInfo(uint256, uint256) view returns (address, uint256)',
]);

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export async function processNFTLogs(
  collectionAddresses: `0x${string}`[],
  fromBlock: bigint,
  toBlock: bigint
) {
  if (collectionAddresses.length === 0) return;

  // Process NFTMinted events
  const mintLogs = await publicClient.getLogs({
    address: collectionAddresses,
    event: NFT_MINTED,
    fromBlock,
    toBlock,
  });

  for (const log of mintLogs) {
    const { tokenId, creator } = log.args as { tokenId: bigint; creator: `0x${string}` };
    const collectionAddress = log.address;
    const tokenIdNum = Number(tokenId);

    const [tokenURI, royaltyResult] = await Promise.all([
      publicClient.readContract({
        address: collectionAddress,
        abi: NFT_READ_ABI,
        functionName: 'tokenURI',
        args: [tokenId],
      }),
      publicClient.readContract({
        address: collectionAddress,
        abi: NFT_READ_ABI,
        functionName: 'royaltyInfo',
        args: [tokenId, 10000n],
      }),
    ]);

    const [, royaltyAmount] = royaltyResult as [string, bigint];

    await upsertNFT({
      tokenId: tokenIdNum,
      collectionAddress,
      owner: creator,
      creator,
      tokenURI: tokenURI as string,
      royaltyPct: Number(royaltyAmount), // out of 10000 BPS
    });
  }

  // Process Transfer events (skip mints where from == address(0))
  const transferLogs = await publicClient.getLogs({
    address: collectionAddresses,
    event: ERC721_TRANSFER,
    fromBlock,
    toBlock,
  });

  for (const log of transferLogs) {
    const { from, to, tokenId } = log.args as {
      from: `0x${string}`;
      to: `0x${string}`;
      tokenId: bigint;
    };
    if (from === ZERO_ADDRESS) continue;
    await updateNFTOwner(log.address, Number(tokenId), to);
  }
}
```

- [ ] **Step 4: Run listener test — confirm it PASSes**

```powershell
cd backend && npx jest __tests__/listeners/nft.listener.test.ts --no-coverage
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```powershell
cd .. && git add backend/src/listeners/nft.listener.ts backend/src/__tests__/listeners/nft.listener.test.ts && git commit -m "feat(backend): NFT event listener"
```

---

## Task 10: Marketplace Listener (TDD)

**Files:**
- Create: `backend/src/__tests__/listeners/marketplace.listener.test.ts`
- Create: `backend/src/listeners/marketplace.listener.ts`

- [ ] **Step 1: Write the failing listener test**

`backend/src/__tests__/listeners/marketplace.listener.test.ts`:
```typescript
jest.mock('../../listeners/client', () => ({
  publicClient: { getLogs: jest.fn() },
}));
jest.mock('../../services/listing.service');
jest.mock('../../services/nft.service');
jest.mock('../../services/activity.service');

import { publicClient } from '../../listeners/client';
import * as listingService from '../../services/listing.service';
import * as nftService from '../../services/nft.service';
import * as activityService from '../../services/activity.service';
import { processMarketplaceLogs } from '../../listeners/marketplace.listener';

const mockGetLogs = publicClient.getLogs as jest.Mock;
const mockCreateListing = listingService.createListing as jest.Mock;
const mockDeactivateListing = listingService.deactivateListing as jest.Mock;
const mockGetListingById = listingService.getListingById as jest.Mock;
const mockSetNFTListed = nftService.setNFTListed as jest.Mock;
const mockCreateActivity = activityService.createActivity as jest.Mock;

describe('processMarketplaceLogs', () => {
  it('does nothing when no logs', async () => {
    mockGetLogs.mockResolvedValue([]);
    await processMarketplaceLogs(0n, 100n);
    expect(mockCreateListing).not.toHaveBeenCalled();
  });

  it('creates listing and activity on NFTListed', async () => {
    mockGetLogs
      .mockResolvedValueOnce([{                        // NFTListed logs
        args: { listingId: 0n, seller: '0xSELLER', collection: '0xCOLL', tokenId: 0n, price: 1000n },
        transactionHash: '0xTX',
      }])
      .mockResolvedValueOnce([])                       // NFTSold logs
      .mockResolvedValueOnce([]);                      // ListingCancelled logs

    await processMarketplaceLogs(0n, 100n);

    expect(mockCreateListing).toHaveBeenCalledWith({
      listingId: 0, collectionAddress: '0xCOLL', tokenId: 0, seller: '0xSELLER', price: '1000',
    });
    expect(mockSetNFTListed).toHaveBeenCalledWith('0xCOLL', 0, true);
    expect(mockCreateActivity).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'list', actor: '0xSELLER', tokenId: 0 })
    );
  });

  it('deactivates listing and creates sale activity on NFTSold', async () => {
    mockGetLogs
      .mockResolvedValueOnce([])                       // NFTListed logs
      .mockResolvedValueOnce([{                        // NFTSold logs
        args: { listingId: 0n, buyer: '0xBUYER', seller: '0xSELLER', tokenId: 0n, price: 1000n },
        transactionHash: '0xTX',
      }])
      .mockResolvedValueOnce([]);                      // ListingCancelled logs

    mockGetListingById.mockResolvedValue({
      listingId: 0, collectionAddress: '0xCOLL', tokenId: 0, seller: '0xSELLER',
    });

    await processMarketplaceLogs(0n, 100n);

    expect(mockDeactivateListing).toHaveBeenCalledWith(0);
    expect(mockSetNFTListed).toHaveBeenCalledWith('0xCOLL', 0, false);
    expect(mockCreateActivity).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'sale', actor: '0xBUYER' })
    );
  });

  it('deactivates listing on ListingCancelled', async () => {
    mockGetLogs
      .mockResolvedValueOnce([])                       // NFTListed logs
      .mockResolvedValueOnce([])                       // NFTSold logs
      .mockResolvedValueOnce([{                        // ListingCancelled logs
        args: { listingId: 0n },
        transactionHash: '0xTX',
      }]);

    mockGetListingById.mockResolvedValue({
      listingId: 0, collectionAddress: '0xCOLL', tokenId: 0, seller: '0xSELLER',
    });

    await processMarketplaceLogs(0n, 100n);

    expect(mockDeactivateListing).toHaveBeenCalledWith(0);
    expect(mockSetNFTListed).toHaveBeenCalledWith('0xCOLL', 0, false);
    expect(mockCreateActivity).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'cancel', actor: '0xSELLER' })
    );
  });
});
```

- [ ] **Step 2: Run listener test — confirm it FAILs**

```powershell
cd backend && npx jest __tests__/listeners/marketplace.listener.test.ts --no-coverage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `backend/src/listeners/marketplace.listener.ts`**

```typescript
import { parseAbiItem } from 'viem';
import { publicClient } from './client';
import { createListing, deactivateListing, getListingById } from '../services/listing.service';
import { setNFTListed } from '../services/nft.service';
import { createActivity } from '../services/activity.service';

const MARKETPLACE_ADDRESS = process.env.MARKETPLACE_ADDRESS as `0x${string}`;

const NFT_LISTED = parseAbiItem(
  'event NFTListed(uint256 indexed listingId, address indexed seller, address indexed collection, uint256 tokenId, uint256 price)'
);
const NFT_SOLD = parseAbiItem(
  'event NFTSold(uint256 indexed listingId, address indexed buyer, address indexed seller, uint256 tokenId, uint256 price)'
);
const LISTING_CANCELLED = parseAbiItem(
  'event ListingCancelled(uint256 indexed listingId)'
);

export async function processMarketplaceLogs(fromBlock: bigint, toBlock: bigint) {
  // NFTListed
  const listedLogs = await publicClient.getLogs({
    address: MARKETPLACE_ADDRESS,
    event: NFT_LISTED,
    fromBlock,
    toBlock,
  });

  for (const log of listedLogs) {
    const { listingId, seller, collection, tokenId, price } = log.args as {
      listingId: bigint;
      seller: `0x${string}`;
      collection: `0x${string}`;
      tokenId: bigint;
      price: bigint;
    };
    await createListing({
      listingId: Number(listingId),
      collectionAddress: collection,
      tokenId: Number(tokenId),
      seller,
      price: price.toString(),
    });
    await setNFTListed(collection, Number(tokenId), true);
    await createActivity({
      type: 'list',
      actor: seller,
      tokenId: Number(tokenId),
      collectionAddress: collection,
      price: price.toString(),
      txHash: log.transactionHash ?? '',
    });
  }

  // NFTSold
  const soldLogs = await publicClient.getLogs({
    address: MARKETPLACE_ADDRESS,
    event: NFT_SOLD,
    fromBlock,
    toBlock,
  });

  for (const log of soldLogs) {
    const { listingId, buyer, tokenId, price } = log.args as {
      listingId: bigint;
      buyer: `0x${string}`;
      seller: `0x${string}`;
      tokenId: bigint;
      price: bigint;
    };
    const listing = await getListingById(Number(listingId));
    if (!listing) continue;
    await deactivateListing(Number(listingId));
    await setNFTListed(listing.collectionAddress, Number(tokenId), false);
    await createActivity({
      type: 'sale',
      actor: buyer,
      tokenId: Number(tokenId),
      collectionAddress: listing.collectionAddress,
      price: price.toString(),
      txHash: log.transactionHash ?? '',
    });
  }

  // ListingCancelled
  const cancelledLogs = await publicClient.getLogs({
    address: MARKETPLACE_ADDRESS,
    event: LISTING_CANCELLED,
    fromBlock,
    toBlock,
  });

  for (const log of cancelledLogs) {
    const { listingId } = log.args as { listingId: bigint };
    const listing = await getListingById(Number(listingId));
    if (!listing) continue;
    await deactivateListing(Number(listingId));
    await setNFTListed(listing.collectionAddress, listing.tokenId, false);
    await createActivity({
      type: 'cancel',
      actor: listing.seller,
      tokenId: listing.tokenId,
      collectionAddress: listing.collectionAddress,
      txHash: log.transactionHash ?? '',
    });
  }
}
```

- [ ] **Step 4: Run listener test — confirm it PASSes**

```powershell
cd backend && npx jest __tests__/listeners/marketplace.listener.test.ts --no-coverage
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```powershell
cd .. && git add backend/src/listeners/marketplace.listener.ts backend/src/__tests__/listeners/marketplace.listener.test.ts && git commit -m "feat(backend): marketplace event listener"
```

---

## Task 11: Listener Orchestrator + Smoke Test

**Files:**
- Modify: `backend/src/listeners/index.ts`

- [ ] **Step 1: Implement `backend/src/listeners/index.ts`**

Replace the stub with:
```typescript
import { prisma } from '../db/client';
import { publicClient } from './client';
import { getLastBlock, setLastBlock } from '../services/checkpoint.service';
import { processFactoryLogs } from './factory.listener';
import { processNFTLogs } from './nft.listener';
import { processMarketplaceLogs } from './marketplace.listener';

const DEPLOY_BLOCK = BigInt(process.env.DEPLOY_BLOCK ?? '0');
const POLL_INTERVAL_MS = 12_000; // 12 seconds (one Sepolia slot)

export async function startListeners() {
  console.log('Event listeners starting...');
  await poll();
  setInterval(() => poll().catch(console.error), POLL_INTERVAL_MS);
}

async function poll() {
  const lastBlock = await getLastBlock();
  const fromBlock = lastBlock === 0n ? DEPLOY_BLOCK : lastBlock + 1n;
  const currentBlock = await publicClient.getBlockNumber();

  if (fromBlock > currentBlock) return; // already up to date

  console.log(`Syncing blocks ${fromBlock}–${currentBlock}...`);

  // Order matters: factory first so collection addresses exist before NFT listener runs
  await processFactoryLogs(fromBlock, currentBlock);

  const collections = await prisma.collection.findMany({ select: { address: true } });
  const addresses = collections.map((c) => c.address as `0x${string}`);
  await processNFTLogs(addresses, fromBlock, currentBlock);

  await processMarketplaceLogs(fromBlock, currentBlock);

  await setLastBlock(currentBlock);
  console.log(`Synced to block ${currentBlock}`);
}
```

- [ ] **Step 2: Run full test suite**

```powershell
cd backend && npx jest --no-coverage
```

Expected: All tests PASS. Zero failures.

- [ ] **Step 3: Verify TypeScript compiles cleanly**

```powershell
cd backend && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Start the dev server and verify it runs**

Make sure your `.env` has a valid `DATABASE_URL` and `SEPOLIA_RPC_URL`, then:

```powershell
cd backend && npm run dev
```

Expected console output:
```
Event listeners starting...
Syncing blocks 10927023–<current>...
Synced to block <current>
Backend running on port 3001
```

The sync may take a few seconds. After the first pass it will poll every 12 seconds.

- [ ] **Step 5: Smoke test the REST API**

In a new terminal, with the server running:

```powershell
# List all collections (may be empty if no events yet)
Invoke-RestMethod http://localhost:3001/collections

# List all active listings
Invoke-RestMethod http://localhost:3001/listings

# List recent activities
Invoke-RestMethod http://localhost:3001/activities
```

Expected: Each returns a JSON array (possibly empty on first run before events are indexed).

- [ ] **Step 6: Commit**

```powershell
cd .. && git add backend/src/listeners/index.ts && git commit -m "feat(backend): listener orchestrator with checkpoint replay"
```

---

## Completion Checklist

- [ ] `npm install` completes without errors
- [ ] `npx prisma migrate dev` runs successfully
- [ ] `npx jest` — all tests pass (service + route + listener tests)
- [ ] `npx tsc --noEmit` — no TypeScript errors
- [ ] `npm run dev` — server starts, listeners begin syncing
- [ ] `GET /collections` returns JSON array
- [ ] `GET /nfts` returns JSON array
- [ ] `GET /listings` returns JSON array
- [ ] `GET /activities` returns JSON array
- [ ] After indexing, collections/NFTs/listings appear in DB (check via Prisma Studio)

**Next plan:** `2026-05-26-phase-3-frontend.md` (write when ready to start Phase 3)
