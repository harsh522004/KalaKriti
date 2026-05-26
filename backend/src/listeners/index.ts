import { prisma } from '../db/client';
import { publicClient } from './client';
import { getLastBlock, setLastBlock } from '../services/checkpoint.service';
import { processFactoryLogs } from './factory.listener';
import { processNFTLogs } from './nft.listener';
import { processMarketplaceLogs } from './marketplace.listener';

const DEPLOY_BLOCK = BigInt(process.env.DEPLOY_BLOCK ?? '0');
const POLL_INTERVAL_MS = 12_000;
const CHUNK_SIZE = 10n; // Alchemy free tier: max 10 blocks per getLogs request

export async function startListeners() {
  console.log('Event listeners starting...');
  await poll();
  setInterval(() => poll().catch(console.error), POLL_INTERVAL_MS);
}

async function poll() {
  const lastBlock = await getLastBlock();
  const fromBlock = lastBlock === 0n ? DEPLOY_BLOCK : lastBlock + 1n;
  const currentBlock = await publicClient.getBlockNumber();

  if (fromBlock > currentBlock) return;

  console.log(`Syncing blocks ${fromBlock}–${currentBlock}...`);

  for (let chunkFrom = fromBlock; chunkFrom <= currentBlock; chunkFrom += CHUNK_SIZE) {
    const chunkTo = chunkFrom + CHUNK_SIZE - 1n < currentBlock
      ? chunkFrom + CHUNK_SIZE - 1n
      : currentBlock;

    await processFactoryLogs(chunkFrom, chunkTo);

    const collections = await prisma.collection.findMany({ select: { address: true } });
    const addresses = collections.map((c) => c.address as `0x${string}`);
    await processNFTLogs(addresses, chunkFrom, chunkTo);

    await processMarketplaceLogs(chunkFrom, chunkTo);

    await setLastBlock(chunkTo);
  }

  console.log(`Synced to block ${currentBlock}`);
}
