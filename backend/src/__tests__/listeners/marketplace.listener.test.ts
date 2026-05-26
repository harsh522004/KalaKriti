jest.mock('../../listeners/client', () => ({
  publicClient: { getLogs: jest.fn() },
}));
jest.mock('../../services/listing.service');
jest.mock('../../services/nft.service');
jest.mock('../../services/activity.service');

import { publicClient } from '../../listeners/client';
import * as listingService from '../../services/listing.service';
import * as nftService from '../../services/nft.service';
import * as activityService from '../../services/activity.service';
import { processMarketplaceLogs } from '../../listeners/marketplace.listener';

const mockGetLogs = publicClient.getLogs as jest.Mock;
const mockCreateListing = listingService.createListing as jest.Mock;
const mockDeactivateListing = listingService.deactivateListing as jest.Mock;
const mockGetListingById = listingService.getListingById as jest.Mock;
const mockSetNFTListed = nftService.setNFTListed as jest.Mock;
const mockCreateActivity = activityService.createActivity as jest.Mock;

describe('processMarketplaceLogs', () => {
  it('does nothing when no logs', async () => {
    mockGetLogs.mockResolvedValue([]);
    await processMarketplaceLogs(0n, 100n);
    expect(mockCreateListing).not.toHaveBeenCalled();
  });

  it('creates listing and activity on NFTListed', async () => {
    mockGetLogs
      .mockResolvedValueOnce([{
        args: { listingId: 0n, seller: '0xSELLER', collection: '0xCOLL', tokenId: 0n, price: 1000n },
        transactionHash: '0xTX',
      }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    await processMarketplaceLogs(0n, 100n);

    expect(mockCreateListing).toHaveBeenCalledWith({
      listingId: 0, collectionAddress: '0xCOLL', tokenId: 0, seller: '0xSELLER', price: '1000',
    });
    expect(mockSetNFTListed).toHaveBeenCalledWith('0xCOLL', 0, true);
    expect(mockCreateActivity).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'list', actor: '0xSELLER', tokenId: 0 })
    );
  });

  it('deactivates listing and creates sale activity on NFTSold', async () => {
    mockGetLogs
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{
        args: { listingId: 0n, buyer: '0xBUYER', seller: '0xSELLER', tokenId: 0n, price: 1000n },
        transactionHash: '0xTX',
      }])
      .mockResolvedValueOnce([]);

    mockGetListingById.mockResolvedValue({
      listingId: 0, collectionAddress: '0xCOLL', tokenId: 0, seller: '0xSELLER',
    });

    await processMarketplaceLogs(0n, 100n);

    expect(mockDeactivateListing).toHaveBeenCalledWith(0);
    expect(mockSetNFTListed).toHaveBeenCalledWith('0xCOLL', 0, false);
    expect(mockCreateActivity).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'sale', actor: '0xBUYER' })
    );
  });

  it('deactivates listing on ListingCancelled', async () => {
    mockGetLogs
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{
        args: { listingId: 0n },
        transactionHash: '0xTX',
      }]);

    mockGetListingById.mockResolvedValue({
      listingId: 0, collectionAddress: '0xCOLL', tokenId: 0, seller: '0xSELLER',
    });

    await processMarketplaceLogs(0n, 100n);

    expect(mockDeactivateListing).toHaveBeenCalledWith(0);
    expect(mockSetNFTListed).toHaveBeenCalledWith('0xCOLL', 0, false);
    expect(mockCreateActivity).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'cancel', actor: '0xSELLER' })
    );
  });
});
