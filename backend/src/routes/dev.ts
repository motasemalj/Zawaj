import { Router } from 'express';
import { prisma } from '../prisma';
import { z } from 'zod';
import { syncUserToFirebase, createFirestoreConversation } from '../services/firebase-sync';

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

// Dev-only: Sync a user to Firebase Auth/Firestore to enable chat when using dev login
router.post('/firebase/sync-user', async (req, res, next) => {
  try {
    const schema = z.object({ userId: z.string().min(1) });
    const { userId } = schema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { photos: { orderBy: { ordering: 'asc' } } },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    await syncUserToFirebase({
      id: user.id,
      email: user.email || `${user.id}@zawaj.app`,
      display_name: user.display_name || user.phone || 'User',
      role: user.role || undefined,
      photos: user.photos as any,
    });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// Dev-only: Create a Firestore conversation for an existing match
router.post('/firebase/create-conversation', async (req, res, next) => {
  try {
    const schema = z.object({ matchId: z.string().min(1) });
    const { matchId } = schema.parse(req.body);

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        user_a: { include: { photos: { orderBy: { ordering: 'asc' } } } },
        user_b: { include: { photos: { orderBy: { ordering: 'asc' } } } },
      },
    });
    if (!match) return res.status(404).json({ error: 'Match not found' });

    await createFirestoreConversation(match.id, match.user_a as any, match.user_b as any);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// Dev-only: Backfill Firestore conversations for all of a user's matches
router.post('/firebase/backfill-conversations', async (req, res, next) => {
  try {
    const schema = z.object({ userId: z.string().min(1) });
    const { userId } = schema.parse(req.body);

    const matches = await prisma.match.findMany({
      where: {
        OR: [{ user_a_id: userId }, { user_b_id: userId }],
      },
      include: {
        user_a: { include: { photos: { orderBy: { ordering: 'asc' } } } },
        user_b: { include: { photos: { orderBy: { ordering: 'asc' } } } },
      },
    });

    for (const m of matches) {
      // Sync both users first
      await syncUserToFirebase({
        id: m.user_a.id,
        email: m.user_a.email || `${m.user_a.id}@zawaj.app`,
        display_name: m.user_a.display_name || m.user_a.phone || 'User',
        role: m.user_a.role || undefined,
        photos: m.user_a.photos as any,
      });
      await syncUserToFirebase({
        id: m.user_b.id,
        email: m.user_b.email || `${m.user_b.id}@zawaj.app`,
        display_name: m.user_b.display_name || m.user_b.phone || 'User',
        role: m.user_b.role || undefined,
        photos: m.user_b.photos as any,
      });

      // Create conversation document if missing
      await createFirestoreConversation(m.id, m.user_a as any, m.user_b as any);
    }

    res.json({ ok: true, count: matches.length });
  } catch (e) {
    next(e);
  }
});

export default router;


