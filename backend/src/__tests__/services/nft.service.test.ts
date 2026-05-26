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
