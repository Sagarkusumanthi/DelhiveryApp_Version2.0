import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { authRouter } from './routes/auth';
import { referenceRouter } from './routes/reference';
import { storesRouter } from './routes/stores';
import { productsRouter } from './routes/products';
import { ordersRouter } from './routes/orders';
import { remindersRouter } from './routes/reminders';
import { groupGiftsRouter } from './routes/groupGifts';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(express.json({ limit: '5mb' })); // 5mb to comfortably fit base64 delivery photos

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api', referenceRouter); // /api/cities, /api/categories
app.use('/api/stores', storesRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/reminders', remindersRouter);
app.use('/api/group-gifts', groupGiftsRouter);

// Centralized error handler — Prisma "not found" style errors, validation
// errors, and anything unexpected all land here instead of crashing the
// process or leaking a raw stack trace to the client.
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Giftly API listening on http://localhost:${PORT}`);
});
