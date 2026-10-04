import { Router } from 'express';
import { prisma } from '../prisma';

export const referenceRouter = Router();

referenceRouter.get('/cities', async (_req, res) => {
  const cities = await prisma.city.findMany({ orderBy: { name: 'asc' } });
  res.json(cities);
});

referenceRouter.get('/categories', async (_req, res) => {
  const categories = await prisma.category.findMany();
  res.json(categories);
});
