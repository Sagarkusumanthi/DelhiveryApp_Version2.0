import { Router } from 'express';
import { prisma } from '../prisma';

export const groupGiftsRouter = Router();

const INCLUDE = { contributors: true, deliveryCity: true };

groupGiftsRouter.get('/', async (_req, res) => {
  const groupGifts = await prisma.groupGift.findMany({ include: INCLUDE, orderBy: { deliveryDate: 'asc' } });
  res.json(groupGifts);
});

groupGiftsRouter.get('/:id', async (req, res) => {
  const groupGift = await prisma.groupGift.findUnique({ where: { id: req.params.id }, include: INCLUDE });
  if (!groupGift) return res.status(404).json({ error: 'Group gift not found' });
  res.json(groupGift);
});

// POST /api/group-gifts
// body: { title, occasionType, recipientName, deliveryCityId, deliveryDate, goalAmount,
//         splitType, message, productIds, contributors: [{ name, amount, paid }] }
groupGiftsRouter.post('/', async (req, res) => {
  const { title, occasionType, recipientName, deliveryCityId, deliveryDate, goalAmount, splitType, message, productIds, contributors } = req.body ?? {};
  if (!title || !recipientName || !deliveryCityId || !deliveryDate || !goalAmount || !splitType) {
    return res.status(400).json({ error: 'title, recipientName, deliveryCityId, deliveryDate, goalAmount and splitType are required' });
  }
  const groupGift = await prisma.groupGift.create({
    data: {
      title,
      occasionType,
      recipientName,
      deliveryCityId,
      deliveryDate: new Date(deliveryDate),
      goalAmount,
      splitType,
      message,
      productIds: productIds ?? [],
      contributors: { create: (contributors ?? []).map((c: any) => ({ name: c.name, amount: c.amount, paid: !!c.paid })) },
    },
    include: INCLUDE,
  });
  res.status(201).json(groupGift);
});

// PATCH /api/group-gifts/:id/contributors/:contributorId  body: { paid: true }
groupGiftsRouter.patch('/:id/contributors/:contributorId', async (req, res) => {
  const { paid } = req.body ?? {};
  const contributor = await prisma.groupGiftContributor.update({
    where: { id: req.params.contributorId },
    data: { paid: !!paid },
  });
  res.json(contributor);
});

// POST /api/group-gifts/:id/contributors  body: { name, amount }
groupGiftsRouter.post('/:id/contributors', async (req, res) => {
  const { name, amount } = req.body ?? {};
  if (!name || !Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: 'name and a positive amount are required' });
  }
  const contributor = await prisma.groupGiftContributor.create({
    data: { groupGiftId: req.params.id, name, amount, paid: false },
  });
  res.status(201).json(contributor);
});
