jest.mock('../../db/client', () => ({
  prisma: {
    activity: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '../../db/client';
import { createActivity, getActivities } from '../../services/activity.service';

const mockCreate = prisma.activity.create as jest.Mock;
const mockFindMany = prisma.activity.findMany as jest.Mock;

const sample = {
  type: 'sale',
  actor: '0xBUYER',
  tokenId: 0,
  collectionAddress: '0xCOLL',
  price: '1000000000000000000',
  txHash: '0xTXHASH',
};

describe('activity.service', () => {
  it('createActivity calls prisma.activity.create', async () => {
    mockCreate.mockResolvedValue(sample);
    await createActivity(sample);
    expect(mockCreate).toHaveBeenCalledWith({ data: sample });
  });

  it('getActivities filters by tokenId', async () => {
    mockFindMany.mockResolvedValue([]);
    await getActivities({ tokenId: 0 });
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tokenId: 0 }) })
    );
  });

  it('getActivities filters by actor', async () => {
    mockFindMany.mockResolvedValue([]);
    await getActivities({ actor: '0xACTOR' });
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ actor: '0xACTOR' }) })
    );
  });

  it('getActivities filters by collection', async () => {
    mockFindMany.mockResolvedValue([]);
    await getActivities({ collection: '0xCOLL' });
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ collectionAddress: '0xCOLL' }) })
    );
  });
});
