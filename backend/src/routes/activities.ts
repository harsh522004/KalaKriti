import { Router, Request, Response } from 'express';
import { getActivities } from '../services/activity.service';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const { tokenId, actor, collection } = req.query;
  const activities = await getActivities({
    tokenId: typeof tokenId === 'string' ? parseInt(tokenId, 10) : undefined,
    actor: typeof actor === 'string' ? actor : undefined,
    collection: typeof collection === 'string' ? collection : undefined,
  });
  res.json(activities);
});

export default router;
