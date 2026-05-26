jest.mock('../../services/collection.service');

import request from 'supertest';
import { app } from '../../app';
import * as service from '../../services/collection.service';

const mockGetCollections = service.getCollections as jest.Mock;
const mockGetCollection = service.getCollection as jest.Mock;

describe('GET /collections', () => {
  it('returns 200 with empty array', async () => {
    mockGetCollections.mockResolvedValue([]);
    const res = await request(app).get('/collections');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 200 with collections array', async () => {
    const cols = [{ address: '0xABC', name: 'Art' }];
    mockGetCollections.mockResolvedValue(cols);
    const res = await request(app).get('/collections');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(cols);
  });
});

describe('GET /collections/:address', () => {
  it('returns 404 when not found', async () => {
    mockGetCollection.mockResolvedValue(null);
    const res = await request(app).get('/collections/0xNONE');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });

  it('returns 200 with collection when found', async () => {
    const col = { address: '0xABC', name: 'Art' };
    mockGetCollection.mockResolvedValue(col);
    const res = await request(app).get('/collections/0xABC');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(col);
  });
});
