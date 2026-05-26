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
