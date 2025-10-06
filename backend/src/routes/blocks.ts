import { Router } from 'express';
import { prisma } from '../prisma';
import { AuthedRequest } from '../types';
import { z } from 'zod';

const router = Router();

const idSchema = z.object({ target_user_id: z.string().min(1) });

router.post('/', async (req: AuthedRequest, res, next) => {
  try {
    const me = req.user!;
    const { target_user_id } = idSchema.parse(req.body);
    if (target_user_id === me.id) return res.status(400).json({ error: 'Cannot block yourself' });
    const block = await prisma.block.upsert({
      where: { blocker_id_blocked_id: { blocker_id: me.id, blocked_id: target_user_id } },
      update: {},
      create: { blocker_id: me.id, blocked_id: target_user_id },
    });
    res.json(block);
  } catch (e) { next(e); }
});

router.delete('/:targetUserId', async (req: AuthedRequest, res, next) => {
  try {
    const me = req.user!;
    const targetUserId = req.params.targetUserId;
    await prisma.block.delete({ where: { blocker_id_blocked_id: { blocker_id: me.id, blocked_id: targetUserId } } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;


