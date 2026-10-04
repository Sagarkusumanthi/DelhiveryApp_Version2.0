import { Router } from 'express';
import { prisma } from '../prisma';

export const productsRouter = Router();

// GET /api/products?storeId=&featured=true&cityId=&category=
productsRouter.get('/', async (req, res) => {
  const { storeId, featured, cityId, category } = req.query as {
    storeId?: string;
    featured?: string;
    cityId?: string;
    category?: string;
  };

  const products = await prisma.product.findMany({
    where: {
      ...(storeId ? { storeId } : {}),
      ...(featured !== undefined ? { featured: featured === 'true' } : {}),
      store: {
        ...(cityId ? { cityId } : {}),
        ...(category ? { category } : {}),
      },
    },
    include: { store: true },
  });
  res.json(products);
});

productsRouter.get('/:id', async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { store: true },
  });
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

productsRouter.patch('/:id', async (req, res) => {
  const { name, description, price, featured, isAvailable } = req.body ?? {};
  if (price !== undefined && (!Number.isFinite(price) || price <= 0)) {
    return res.status(400).json({ error: 'price must be a positive number' });
  }
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      ...(name ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(price !== undefined ? { price } : {}),
      ...(featured !== undefined ? { featured } : {}),
      ...(isAvailable !== undefined ? { isAvailable } : {}),
    },
  });
  res.json(product);
});
