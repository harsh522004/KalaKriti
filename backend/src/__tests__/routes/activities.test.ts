jest.mock('../../services/activity.service');

import request from 'supertest';
import { app } from '../../app';
import * as service from '../../services/activity.service';

const mockGetActivities = service.getActivities as jest.Mock;

describe('GET /activities', () => {
  it('returns 200 with empty array', async () => {
    mockGetActivities.mockResolvedValue([]);
    const res = await request(app).get('/activities');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('passes tokenId to service as number', async () => {
    mockGetActivities.mockResolvedValue([]);
    await request(app).get('/activities?tokenId=5');
    expect(mockGetActivities).toHaveBeenCalledWith(
      expect.objectContaining({ tokenId: 5 })
    );
  });

  it('passes actor to service', async () => {
    mockGetActivities.mockResolvedValue([]);
    await request(app).get('/activities?actor=0xABC');
    expect(mockGetActivities).toHaveBeenCalledWith(
      expect.objectContaining({ actor: '0xABC' })
    );
  });
});
