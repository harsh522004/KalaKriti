import { prisma } from '../db/client';
import { publicClient } from './client';
import { getLastBlock, setLastBlock } from '../services/checkpoint.service';
import { processFactoryLogs } from './factory.listener';
import { processNFTLogs } from './nft.listener';
import { processMarketplaceLogs } from './marketplace.listener';

const DEPLOY_BLOCK = BigInt(process.env.DEPLOY_BLOCK ?? '0');
const POLL_INTERVAL_MS = 12_000;
const CHUNK_SIZE = 10n; // Alchemy free tier: max 10 blocks per getLogs request

// Neon free tier scales to zero — P1001 means the DB is cold-starting.
// Retry up to 3 times with 2s delay before giving up on that poll tick.
async function withNeonRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 2000): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const isP1001 = typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P1001';
      if (isP1001 && attempt < retries) {
        console.log(`Neon cold start detected, retrying in ${delayMs}ms (attempt ${attempt}/${retries})...`);
        await new Promise(res => setTimeout(res, delayMs));
      } else {
        throw err;
      }
    }
  }
  throw new Error('unreachable');
}

export async function startListeners() {
  console.log('Event listeners starting...');
  await poll();
  setInterval(() => poll().catch(console.error), POLL_INTERVAL_MS);
}

async function poll() {
  const lastBlock = await withNeonRetry(() => getLastBlock());
  const fromBlock = lastBlock === 0n ? DEPLOY_BLOCK : lastBlock + 1n;
  const currentBlock = await publicClient.getBlockNumber();

  if (fromBlock > currentBlock) return;

  console.log(`Syncing blocks ${fromBlock}–${currentBlock}...`);

  for (let chunkFrom = fromBlock; chunkFrom <= currentBlock; chunkFrom += CHUNK_SIZE) {
    const chunkTo = chunkFrom + CHUNK_SIZE - 1n < currentBlock
      ? chunkFrom + CHUNK_SIZE - 1n
      : currentBlock;

    await withNeonRetry(() => processFactoryLogs(chunkFrom, chunkTo));

    const collections = await withNeonRetry(() => prisma.collection.findMany({ select: { address: true } }));
    const addresses = collections.map((c) => c.address as `0x${string}`);
    await withNeonRetry(() => processNFTLogs(addresses, chunkFrom, chunkTo));

    await withNeonRetry(() => processMarketplaceLogs(chunkFrom, chunkTo));

    await withNeonRetry(() => setLastBlock(chunkTo));
  }

  console.log(`Synced to block ${currentBlock}`);
}
