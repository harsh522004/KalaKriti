import { Router, Request, Response } from 'express';
import { getListings } from '../services/listing.service';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const { minPrice, maxPrice, collection } = req.query;
  const listings = await getListings({
    minPrice: typeof minPrice === 'string' ? minPrice : undefined,
    maxPrice: typeof maxPrice === 'string' ? maxPrice : undefined,
    collection: typeof collection === 'string' ? collection : undefined,
  });
  res.json(listings);
});

export default router;
