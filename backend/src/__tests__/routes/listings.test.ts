jest.mock('../../services/listing.service');

import request from 'supertest';
import { app } from '../../app';
import * as service from '../../services/listing.service';

const mockGetListings = service.getListings as jest.Mock;

describe('GET /listings', () => {
  it('returns 200 with empty array', async () => {
    mockGetListings.mockResolvedValue([]);
    const res = await request(app).get('/listings');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('passes minPrice and maxPrice to service', async () => {
    mockGetListings.mockResolvedValue([]);
    await request(app).get('/listings?minPrice=1000&maxPrice=5000');
    expect(mockGetListings).toHaveBeenCalledWith({
      minPrice: '1000',
      maxPrice: '5000',
      collection: undefined,
    });
  });

  it('passes collection filter to service', async () => {
    mockGetListings.mockResolvedValue([]);
    await request(app).get('/listings?collection=0xCOLL');
    expect(mockGetListings).toHaveBeenCalledWith({
      minPrice: undefined,
      maxPrice: undefined,
      collection: '0xCOLL',
    });
  });
});
