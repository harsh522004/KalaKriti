jest.mock('../../listeners/client', () => ({
  publicClient: {
    getLogs: jest.fn(),
    readContract: jest.fn(),
  },
}));
jest.mock('../../services/nft.service');

import { publicClient } from '../../listeners/client';
import * as nftService from '../../services/nft.service';
import { processNFTLogs } from '../../listeners/nft.listener';

const mockGetLogs = publicClient.getLogs as jest.Mock;
const mockReadContract = publicClient.readContract as jest.Mock;
const mockUpsertNFT = nftService.upsertNFT as jest.Mock;
const mockUpdateNFTOwner = nftService.updateNFTOwner as jest.Mock;

const COLL = '0xCOLLECTION';
const ZERO = '0x0000000000000000000000000000000000000000';

describe('processNFTLogs', () => {
  it('does nothing when no logs and no collection addresses', async () => {
    await processNFTLogs([], 0n, 100n);
    expect(mockGetLogs).not.toHaveBeenCalled();
  });

  it('upserts an NFT when NFTMinted log is found', async () => {
    mockGetLogs
      .mockResolvedValueOnce([{
        args: { tokenId: 0n, creator: '0xARTIST' },
        address: COLL,
      }])
      .mockResolvedValueOnce([]);

    mockReadContract
      .mockResolvedValueOnce('ipfs://token0')
      .mockResolvedValueOnce(['0xARTIST', 500n]);

    await processNFTLogs([COLL], 0n, 100n);

    expect(mockUpsertNFT).toHaveBeenCalledWith({
      tokenId: 0,
      collectionAddress: COLL,
      owner: '0xARTIST',
      creator: '0xARTIST',
      tokenURI: 'ipfs://token0',
      royaltyPct: 500,
    });
  });

  it('updates NFT owner on non-mint Transfer', async () => {
    mockGetLogs
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{
        args: { from: '0xOLDOWNER', to: '0xNEWOWNER', tokenId: 0n },
        address: COLL,
      }]);

    await processNFTLogs([COLL], 0n, 100n);

    expect(mockUpdateNFTOwner).toHaveBeenCalledWith(COLL, 0, '0xNEWOWNER');
  });

  it('skips Transfer events where from is zero address (mints)', async () => {
    mockGetLogs
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{
        args: { from: ZERO, to: '0xMINTER', tokenId: 0n },
        address: COLL,
      }]);

    await processNFTLogs([COLL], 0n, 100n);

    expect(mockUpdateNFTOwner).not.toHaveBeenCalled();
  });
});
