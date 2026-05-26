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
