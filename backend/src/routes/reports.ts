import { Router } from 'express';
import { prisma } from '../prisma';
import { AuthedRequest } from '../types';
import { z } from 'zod';

const router = Router();

const reportSchema = z.object({
  target_type: z.enum(['user','message','photo']),
  target_id: z.string().min(1),
  reason: z.string().min(3).max(500),
});

router.post('/', async (req: AuthedRequest, res, next) => {
  try {
    const me = req.user!;
    const { target_type, target_id, reason } = reportSchema.parse(req.body);
    const r = await prisma.report.create({
      data: { reporter_id: me.id, target_type, target_id, reason },
    });
    res.json(r);
  } catch (e) {
    next(e);
  }
});

export default router;


