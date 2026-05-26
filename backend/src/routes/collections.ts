import { Router, Request, Response } from 'express';
import { getCollections, getCollection } from '../services/collection.service';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const collections = await getCollections();
  res.json(collections);
});

router.get('/:address', async (req: Request<{ address: string }>, res: Response) => {
  const collection = await getCollection(req.params.address);
  if (!collection) return res.status(404).json({ error: 'Not found' });
  res.json(collection);
});

export default router;
