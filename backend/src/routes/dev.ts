import { Router } from 'express';
import { prisma } from '../prisma';

const router = Router();

router.get('/users', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, display_name: true, role: true, mother_for: true },
      orderBy: { created_at: 'asc' },
    });
    res.json({ users });
  } catch (e) {
    next(e);
  }
});

export default router;


