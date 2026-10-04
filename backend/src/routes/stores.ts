import { Router } from 'express';
import { prisma } from '../prisma';

export const storesRouter = Router();

// GET /api/stores?cityId=hyd&category=Flowers
storesRouter.get('/', async (req, res) => {
  const { cityId, category } = req.query as { cityId?: string; category?: string };
  const stores = await prisma.store.findMany({
    where: {
      ...(cityId ? { cityId } : {}),
      ...(category ? { category } : {}),
    },
    orderBy: { name: 'asc' },
  });
  res.json(stores);
});

storesRouter.get('/:id', async (req, res) => {
  const store = await prisma.store.findUnique({
    where: { id: req.params.id },
    include: { products: true, city: true },
  });
  if (!store) return res.status(404).json({ error: 'Store not found' });
  res.json(store);
});

storesRouter.patch('/:id', async (req, res) => {
  const { name, open, openTime, closeTime, address, description } = req.body ?? {};
  const store = await prisma.store.update({
    where: { id: req.params.id },
    data: {
      ...(name ? { name } : {}),
      ...(open !== undefined ? { open } : {}),
      ...(openTime ? { openTime } : {}),
      ...(closeTime ? { closeTime } : {}),
      ...(address !== undefined ? { address } : {}),
      ...(description !== undefined ? { description } : {}),
    },
  });
  res.json(store);
});
