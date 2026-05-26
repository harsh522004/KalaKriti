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
  price: '1000000000000000000',
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
    const cheapListing = { ...sample, price: '500000000000000000' };
    const expensiveListing = { ...sample, listingId: 1, price: '2000000000000000000' };
    mockFindMany.mockResolvedValue([cheapListing, expensiveListing]);
    const results = await getListings({ minPrice: '1000000000000000000' });
    expect(results).toHaveLength(1);
    expect(results[0].listingId).toBe(1);
  });

  it('getListings filters by maxPrice (BigInt comparison)', async () => {
    const cheapListing = { ...sample, price: '500000000000000000' };
    const expensiveListing = { ...sample, listingId: 1, price: '2000000000000000000' };
    mockFindMany.mockResolvedValue([cheapListing, expensiveListing]);
    const results = await getListings({ maxPrice: '1000000000000000000' });
    expect(results).toHaveLength(1);
    expect(results[0].listingId).toBe(0);
  });
});
