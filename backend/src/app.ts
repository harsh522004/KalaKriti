import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import collectionsRouter from './routes/collections';
import nftsRouter from './routes/nfts';
import listingsRouter from './routes/listings';
import activitiesRouter from './routes/activities';

export const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Serialize BigInt values as strings in JSON responses
app.set('json replacer', (_key: string, value: unknown) =>
  typeof value === 'bigint' ? value.toString() : value
);

app.use('/collections', collectionsRouter);
app.use('/nfts', nftsRouter);
app.use('/listings', listingsRouter);
app.use('/activities', activitiesRouter);

// Global error handler — Express 5 auto-forwards async route errors here
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export function startServer(port = 3001) {
  return app.listen(port, () => {
    console.log(`Backend running on port ${port}`);
  });
}
