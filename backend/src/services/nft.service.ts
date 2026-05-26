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
