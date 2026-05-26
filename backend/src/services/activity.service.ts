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
