import { parseAbiItem } from 'viem';
import { publicClient } from './client';
import { createListing, deactivateListing, getListingById } from '../services/listing.service';
import { setNFTListed } from '../services/nft.service';
import { createActivity } from '../services/activity.service';

const MARKETPLACE_ADDRESS = process.env.MARKETPLACE_ADDRESS as `0x${string}`;

const NFT_LISTED = parseAbiItem(
  'event NFTListed(uint256 indexed listingId, address indexed seller, address indexed collection, uint256 tokenId, uint256 price)'
);
const NFT_SOLD = parseAbiItem(
  'event NFTSold(uint256 indexed listingId, address indexed buyer, address indexed seller, uint256 tokenId, uint256 price)'
);
const LISTING_CANCELLED = parseAbiItem(
  'event ListingCancelled(uint256 indexed listingId)'
);

export async function processMarketplaceLogs(fromBlock: bigint, toBlock: bigint) {
  const listedLogs = await publicClient.getLogs({
    address: MARKETPLACE_ADDRESS,
    event: NFT_LISTED,
    fromBlock,
    toBlock,
  });

  for (const log of listedLogs) {
    const { listingId, seller, collection, tokenId, price } = log.args as {
      listingId: bigint;
      seller: `0x${string}`;
      collection: `0x${string}`;
      tokenId: bigint;
      price: bigint;
    };
    await createListing({
      listingId: Number(listingId),
      collectionAddress: collection,
      tokenId: Number(tokenId),
      seller,
      price: price.toString(),
    });
    await setNFTListed(collection, Number(tokenId), true);
    await createActivity({
      type: 'list',
      actor: seller,
      tokenId: Number(tokenId),
      collectionAddress: collection,
      price: price.toString(),
      txHash: log.transactionHash ?? '',
    });
  }

  const soldLogs = await publicClient.getLogs({
    address: MARKETPLACE_ADDRESS,
    event: NFT_SOLD,
    fromBlock,
    toBlock,
  });

  for (const log of soldLogs) {
    const { listingId, buyer, tokenId, price } = log.args as {
      listingId: bigint;
      buyer: `0x${string}`;
      seller: `0x${string}`;
      tokenId: bigint;
      price: bigint;
    };
    const listing = await getListingById(Number(listingId));
    if (!listing) continue;
    await deactivateListing(Number(listingId));
    await setNFTListed(listing.collectionAddress, Number(tokenId), false);
    await createActivity({
      type: 'sale',
      actor: buyer,
      tokenId: Number(tokenId),
      collectionAddress: listing.collectionAddress,
      price: price.toString(),
      txHash: log.transactionHash ?? '',
    });
  }

  const cancelledLogs = await publicClient.getLogs({
    address: MARKETPLACE_ADDRESS,
    event: LISTING_CANCELLED,
    fromBlock,
    toBlock,
  });

  for (const log of cancelledLogs) {
    const { listingId } = log.args as { listingId: bigint };
    const listing = await getListingById(Number(listingId));
    if (!listing) continue;
    await deactivateListing(Number(listingId));
    await setNFTListed(listing.collectionAddress, listing.tokenId, false);
    await createActivity({
      type: 'cancel',
      actor: listing.seller,
      tokenId: listing.tokenId,
      collectionAddress: listing.collectionAddress,
      txHash: log.transactionHash ?? '',
    });
  }
}
