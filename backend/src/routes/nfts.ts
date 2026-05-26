import { Router, Request, Response } from 'express';
import { getNFTs, getNFT } from '../services/nft.service';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const { owner, collection } = req.query;
  const nfts = await getNFTs({
    owner: typeof owner === 'string' ? owner : undefined,
    collection: typeof collection === 'string' ? collection : undefined,
  });
  res.json(nfts);
});

router.get('/:collection/:tokenId', async (req: Request<{ collection: string; tokenId: string }>, res: Response) => {
  const tokenId = parseInt(req.params.tokenId, 10);
  if (isNaN(tokenId)) return res.status(400).json({ error: 'Invalid tokenId' });
  const nft = await getNFT(req.params.collection, tokenId);
  if (!nft) return res.status(404).json({ error: 'Not found' });
  res.json(nft);
});

export default router;
