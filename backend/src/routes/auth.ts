import { Router } from 'express';
import { prisma } from '../prisma';

export const authRouter = Router();

// Demo-only login: looks the user up by email-or-phone + plaintext password
// match. This mirrors the original prototype's hardcoded DEMO_USERS and is
// NOT secure enough for real users — swap in bcrypt/argon2 + hashed
// passwords and real session/JWT issuance before this handles live traffic.
authRouter.post('/login', async (req, res) => {
  const { identifier, password } = req.body ?? {};
  if (!identifier || !password) {
    return res.status(400).json({ error: 'identifier (email or phone) and password are required' });
  }
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: { equals: identifier, mode: 'insensitive' } }, { phone: identifier }] },
  });
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Incorrect email/phone or password.' });
  }
  const { password: _pw, ...safeUser } = user;
  res.json({ user: safeUser });
});
