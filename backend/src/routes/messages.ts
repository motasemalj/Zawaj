import { Router } from 'express';
import { prisma } from '../prisma';
import { AuthedRequest } from '../types';
import { z } from 'zod';

const router = Router();

router.get('/:matchId/messages', async (req: AuthedRequest, res, next) => {
  try {
    const me = req.user!;
    const matchId = req.params.matchId;
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match || (match.user_a_id !== me.id && match.user_b_id !== me.id)) {
      return res.status(404).json({ error: 'Match not found' });
    }
    // Block check
    const otherId = match.user_a_id === me.id ? match.user_b_id : match.user_a_id;
    const blocked = await prisma.block.findFirst({ where: {
      OR: [
        { blocker_id: me.id, blocked_id: otherId },
        { blocker_id: otherId, blocked_id: me.id },
      ]
    }});
    if (blocked) return res.status(403).json({ error: 'Blocked' });
    const limit = Number(req.query.limit ?? 30);
    const messages = await prisma.message.findMany({
      where: { match_id: matchId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
    res.json({ messages: messages.reverse() });
  } catch (e) {
    next(e);
  }
});

const sendSchema = z.object({ text: z.string().min(1).max(1000) });

const allowMotherToIndividualChat = true;

router.post('/:matchId/messages', async (req: AuthedRequest, res, next) => {
  try {
    const me = req.user!;
    const matchId = req.params.matchId;
    const match = await prisma.match.findUnique({ where: { id: matchId }, include: { user_a: true, user_b: true } });
    if (!match || (match.user_a_id !== me.id && match.user_b_id !== me.id)) {
      return res.status(404).json({ error: 'Match not found' });
    }
    const otherId = match.user_a_id === me.id ? match.user_b_id : match.user_a_id;
    const blocked = await prisma.block.findFirst({ where: {
      OR: [
        { blocker_id: me.id, blocked_id: otherId },
        { blocker_id: otherId, blocked_id: me.id },
      ]
    }});
    if (blocked) return res.status(403).json({ error: 'Blocked' });
    const { text } = sendSchema.parse(req.body);

    // Simple word filter example
    const banned = [/sex/ig, /nude/ig, /harass/ig];
    if (banned.some((r) => r.test(text))) {
      return res.status(400).json({ error: 'Message content not allowed' });
    }

    // Mother guardian policy & audit
    const aRole = (match.user_a as any)?.role as string;
    const bRole = (match.user_b as any)?.role as string;
    const isMotherChat = aRole === 'mother' || bRole === 'mother';
    if (isMotherChat && !allowMotherToIndividualChat) {
      return res.status(403).json({ error: 'Chat not allowed by policy' });
    }

    const msg = await prisma.message.create({
      data: { match_id: matchId, sender_id: me.id, text },
    });
    await prisma.match.update({ where: { id: matchId }, data: { last_message_at: msg.created_at } });
    if (isMotherChat) {
      await prisma.auditLog.create({ data: { match_id: matchId, sender_id: me.id, action: 'mother_message' } });
    }
    res.json(msg);
  } catch (e) {
    next(e);
  }
});

export default router;

