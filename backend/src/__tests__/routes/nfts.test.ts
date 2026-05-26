jest.mock('../../services/nft.service');

import request from 'supertest';
import { app } from '../../app';
import * as service from '../../services/nft.service';

const mockGetNFTs = service.getNFTs as jest.Mock;
const mockGetNFT = service.getNFT as jest.Mock;

describe('GET /nfts', () => {
  it('returns 200 with empty array', async () => {
    mockGetNFTs.mockResolvedValue([]);
    const res = await request(app).get('/nfts');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('passes owner query param to service', async () => {
    mockGetNFTs.mockResolvedValue([]);
    await request(app).get('/nfts?owner=0xABC');
    expect(mockGetNFTs).toHaveBeenCalledWith({ owner: '0xABC', collection: undefined });
  });

  it('passes collection query param to service', async () => {
    mockGetNFTs.mockResolvedValue([]);
    await request(app).get('/nfts?collection=0xCOLL');
    expect(mockGetNFTs).toHaveBeenCalledWith({ owner: undefined, collection: '0xCOLL' });
  });
});

describe('GET /nfts/:collection/:tokenId', () => {
  it('returns 404 when not found', async () => {
    mockGetNFT.mockResolvedValue(null);
    const res = await request(app).get('/nfts/0xCOLL/0');
    expect(res.status).toBe(404);
  });

  it('returns 400 for non-numeric tokenId', async () => {
    const res = await request(app).get('/nfts/0xCOLL/abc');
    expect(res.status).toBe(400);
  });

  it('returns 200 with NFT when found', async () => {
    const nft = { tokenId: 0, collectionAddress: '0xCOLL' };
    mockGetNFT.mockResolvedValue(nft);
    const res = await request(app).get('/nfts/0xCOLL/0');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(nft);
  });
});
