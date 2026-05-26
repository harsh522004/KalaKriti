import { prisma } from '../db/client';

export async function getLastBlock(): Promise<bigint> {
  const cp = await prisma.checkpoint.upsert({
    where: { id: 1 },
    create: { id: 1, lastBlock: 0n },
    update: {},
  });
  return cp.lastBlock;
}

export async function setLastBlock(block: bigint): Promise<void> {
  await prisma.checkpoint.upsert({
    where: { id: 1 },
    create: { id: 1, lastBlock: block },
    update: { lastBlock: block },
  });
}
