import { Router } from 'express';
import { prisma } from '../prisma';
import { AuthedRequest } from '../types';
import { deleteFirestoreConversation } from '../services/firebase-sync';

const router = Router();

router.get('/', async (req: AuthedRequest, res, next) => {
  try {
    const me = req.user!;
    const matches = await prisma.match.findMany({
      where: { OR: [{ user_a_id: me.id }, { user_b_id: me.id }] },
      include: {
        user_a: {
          include: {
            photos: {
              orderBy: { ordering: 'asc' },
            },
          },
        },
        user_b: {
          include: {
            photos: {
              orderBy: { ordering: 'asc' },
            },
          },
        },
      },
      orderBy: { last_message_at: 'desc' },
    });

    // Fetch last message text for each match
    const matchesWithLastMessage = await Promise.all(
      matches.map(async (match) => {
        if (match.last_message_at) {
          const lastMessage = await prisma.message.findFirst({
            where: { match_id: match.id },
            orderBy: { created_at: 'desc' },
            select: { text: true },
          });
          return {
            ...match,
            last_message_text: lastMessage?.text || null,
          };
        }
        return {
          ...match,
          last_message_text: null,
        };
      })
    );

    res.json({ matches: matchesWithLastMessage });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req: AuthedRequest, res, next) => {
  try {
    const me = req.user!;
    const id = req.params.id;
    const m = await prisma.match.findUnique({ 
      where: { id }, 
      include: { 
        user_a: {
          include: {
            photos: {
              orderBy: { ordering: 'asc' },
            },
          },
        },
        user_b: {
          include: {
            photos: {
              orderBy: { ordering: 'asc' },
            },
          },
        },
      } 
    });
    if (!m || (m.user_a_id !== me.id && m.user_b_id !== me.id)) return res.status(404).json({ error: 'Not found' });
    res.json(m);
  } catch (e) {
    next(e);
  }
});

// Unmatch endpoint - delete a match
router.delete('/:id', async (req: AuthedRequest, res, next) => {
  try {
    const me = req.user!;
    const id = req.params.id;
    
    // Verify the match exists and user is part of it
    const m = await prisma.match.findUnique({ where: { id } });
    if (!m) return res.status(404).json({ error: 'Match not found' });
    if (m.user_a_id !== me.id && m.user_b_id !== me.id) {
      return res.status(403).json({ error: 'Not authorized to unmatch' });
    }
    
    // Delete all messages in this match first (due to foreign key constraints)
    await prisma.message.deleteMany({ where: { match_id: id } });
    
    // Delete the match
    await prisma.match.delete({ where: { id } });
    
    // Delete Firestore conversation
    try {
      await deleteFirestoreConversation(id);
      console.log(`✅ Firestore conversation ${id} deleted`);
    } catch (error) {
      console.error('❌ Error deleting Firestore conversation:', error);
      // Don't fail the request if Firebase sync fails
    }
    
    console.log(`✅ Unmatch: User ${me.id} unmatched from match ${id}`);
    res.json({ ok: true, message: 'Unmatched successfully' });
  } catch (e) {
    next(e);
  }
});

export default router;

