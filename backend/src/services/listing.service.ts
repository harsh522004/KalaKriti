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
