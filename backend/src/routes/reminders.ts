import { Router } from 'express';
import { prisma } from '../prisma';

export const remindersRouter = Router();

// GET /api/reminders?userId=
remindersRouter.get('/', async (req, res) => {
  const { userId } = req.query as { userId?: string };
  const reminders = await prisma.reminder.findMany({
    where: { ...(userId ? { userId } : {}) },
    orderBy: { date: 'asc' },
  });
  res.json(reminders);
});

remindersRouter.post('/', async (req, res) => {
  const { userId, occasionName, recipientName, occasionType, date, repeatYearly, remindMe, giftCategory, note } = req.body ?? {};
  if (!userId || !occasionName || !recipientName || !occasionType || !date || !remindMe) {
    return res.status(400).json({ error: 'userId, occasionName, recipientName, occasionType, date and remindMe are required' });
  }
  const reminder = await prisma.reminder.create({
    data: {
      userId,
      occasionName,
      recipientName,
      occasionType,
      date: new Date(date),
      repeatYearly: !!repeatYearly,
      remindMe,
      giftCategory,
      note,
    },
  });
  res.status(201).json(reminder);
});

remindersRouter.patch('/:id', async (req, res) => {
  const { occasionName, recipientName, occasionType, date, repeatYearly, remindMe, giftCategory, note, giftPlanned } = req.body ?? {};
  const reminder = await prisma.reminder.update({
    where: { id: req.params.id },
    data: {
      ...(occasionName ? { occasionName } : {}),
      ...(recipientName ? { recipientName } : {}),
      ...(occasionType ? { occasionType } : {}),
      ...(date ? { date: new Date(date) } : {}),
      ...(repeatYearly !== undefined ? { repeatYearly } : {}),
      ...(remindMe ? { remindMe } : {}),
      ...(giftCategory !== undefined ? { giftCategory } : {}),
      ...(note !== undefined ? { note } : {}),
      ...(giftPlanned !== undefined ? { giftPlanned } : {}),
    },
  });
  res.json(reminder);
});

remindersRouter.delete('/:id', async (req, res) => {
  await prisma.reminder.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
