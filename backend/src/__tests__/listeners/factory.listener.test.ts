jest.mock('../../listeners/client', () => ({
  publicClient: {
    getLogs: jest.fn(),
    readContract: jest.fn(),
  },
}));
jest.mock('../../services/collection.service');

import { publicClient } from '../../listeners/client';
import * as collectionService from '../../services/collection.service';
import { processFactoryLogs } from '../../listeners/factory.listener';

const mockGetLogs = publicClient.getLogs as jest.Mock;
const mockReadContract = publicClient.readContract as jest.Mock;
const mockUpsertCollection = collectionService.upsertCollection as jest.Mock;

describe('processFactoryLogs', () => {
  it('does nothing when no logs returned', async () => {
    mockGetLogs.mockResolvedValue([]);
    await processFactoryLogs(0n, 100n);
    expect(mockUpsertCollection).not.toHaveBeenCalled();
  });

  it('upserts a collection when CollectionCreated log is found', async () => {
    mockGetLogs.mockResolvedValue([{
      args: { collectionAddress: '0xCOLL', owner: '0xOWNER' },
      address: '0xFACTORY',
    }]);
    mockReadContract
      .mockResolvedValueOnce('KalaArt')    // name()
      .mockResolvedValueOnce('KA')         // symbol()
      .mockResolvedValueOnce('ipfs://col') // collectionURI()
      .mockResolvedValueOnce(false);       // privateMint()

    await processFactoryLogs(0n, 100n);

    expect(mockUpsertCollection).toHaveBeenCalledWith({
      address: '0xCOLL',
      owner: '0xOWNER',
      name: 'KalaArt',
      symbol: 'KA',
      metadataURI: 'ipfs://col',
      privateMint: false,
    });
  });

  it('processes multiple CollectionCreated logs', async () => {
    mockGetLogs.mockResolvedValue([
      { args: { collectionAddress: '0xCOLL1', owner: '0xOWNER1' }, address: '0xFACTORY' },
      { args: { collectionAddress: '0xCOLL2', owner: '0xOWNER2' }, address: '0xFACTORY' },
    ]);
    mockReadContract.mockResolvedValue('x');

    await processFactoryLogs(0n, 100n);

    expect(mockUpsertCollection).toHaveBeenCalledTimes(2);
  });
});
