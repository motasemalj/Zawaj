import { Router } from 'express';
import { prisma } from '../prisma';
import { AuthedRequest } from '../types';
import { z } from 'zod';
import { createFirestoreConversation, syncUserToFirebase } from '../services/firebase-sync';

const router = Router();

const swipeSchema = z.object({
  to_user_id: z.string().min(1),
  direction: z.enum(['left','right']),
  is_super_like: z.boolean().optional(),
});

router.post('/', async (req: AuthedRequest, res, next) => {
  try {
    const me = req.user!;
    const { to_user_id, direction, is_super_like } = swipeSchema.parse(req.body);
    if (to_user_id === me.id) return res.status(400).json({ error: 'Cannot swipe yourself' });

    const toUser = await prisma.user.findUnique({ where: { id: to_user_id } });
    if (!toUser) return res.status(404).json({ error: 'User not found' });

    // Check blocking
    const blocked = await prisma.block.findFirst({ where: {
      OR: [
        { blocker_id: me.id, blocked_id: to_user_id },
        { blocker_id: to_user_id, blocked_id: me.id },
      ]
    }});
    if (blocked) return res.status(403).json({ error: 'User is blocked' });

    // Validate mother_for if role is mother
    if (me.role === 'mother' && !me.mother_for) {
      console.error('❌ Mother user missing mother_for:', me.id, me.display_name);
      return res.status(400).json({ error: 'Invalid account state: mother_for is required for mother role' });
    }
    
    // Validate target user's mother_for if they are a mother
    if (toUser.role === 'mother' && !toUser.mother_for) {
      console.error('❌ Target mother user missing mother_for:', toUser.id, toUser.display_name);
      return res.status(422).json({ error: 'Target user has invalid account state' });
    }

    // Normalize role values to be resilient to data entry issues (e.g., 'fe male')
    const normalizeRole = (r?: string | null) => (r || '').toLowerCase().replace(/\s+/g, '');
    const myRole = normalizeRole(me.role);
    const targetRole = normalizeRole(toUser.role);
    const targetMotherFor = (toUser.mother_for || '').toLowerCase();
    const myMotherFor = (me.mother_for || '').toLowerCase();

    // Check if this is a "swipe-back" (target user already swiped me)
    const theySwipedMe = await prisma.swipe.findFirst({
      where: { 
        from_user_id: to_user_id, 
        to_user_id: me.id 
      },
    });

    // Eligibility per role (normalized)
    const eligible = (() => {
      if (myRole === 'male') return targetRole === 'female';
      if (myRole === 'female') return targetRole === 'male';
      if (myRole === 'mother' && myMotherFor === 'son') return targetRole === 'female' || (targetRole === 'mother' && targetMotherFor === 'daughter');
      if (myRole === 'mother' && myMotherFor === 'daughter') return targetRole === 'male' || (targetRole === 'mother' && targetMotherFor === 'son');
      return false;
    })();
    
    // Allow swipe if either:
    // 1. Normal eligibility rules pass, OR
    // 2. This is a swipe-back (they already swiped me)
    if (!eligible && !theySwipedMe) {
      console.log('Swipe eligibility failed:', { myRole: me.role, myMotherFor: me.mother_for, targetRole: toUser.role, targetMotherFor: toUser.mother_for, isSwipeBack: !!theySwipedMe });
      return res.status(422).json({ error: 'Not eligible to swipe this user', details: { myRole: me.role, myMotherFor: me.mother_for, targetRole: toUser.role } });
    }
    
    if (theySwipedMe && !eligible) {
      console.log('✅ Allowing swipe-back (they already swiped me):', { from: me.id, to: to_user_id });
    }

    // Use upsert to handle the unique constraint (allows re-swiping after undo)
    const swipe = await prisma.swipe.upsert({
      where: { 
        from_user_id_to_user_id: { from_user_id: me.id, to_user_id }
      },
      update: {
        direction,
        is_super_like: is_super_like && direction === 'right' ? true : false,
      },
      create: { 
        from_user_id: me.id, 
        to_user_id, 
        direction,
        is_super_like: is_super_like && direction === 'right' ? true : false
      },
    });
    console.log(`✅ Swipe saved: ${me.id} -> ${to_user_id} (${direction}, super_like: ${is_super_like})`);

    let match = null as any;
    if (direction === 'right') {
      const reciprocal = await prisma.swipe.findFirst({
        where: { from_user_id: to_user_id, to_user_id: me.id, direction: 'right' },
        orderBy: { created_at: 'desc' },
      });
      if (reciprocal) {
        const a = me.id < to_user_id ? me.id : to_user_id;
        const b = me.id < to_user_id ? to_user_id : me.id;
        match = await prisma.match.upsert({
          where: { user_a_id_user_b_id: { user_a_id: a, user_b_id: b } },
          update: {},
          create: {
            user_a_id: a,
            user_b_id: b,
            roles_snapshot: JSON.stringify({ a_role: me.role, b_role: toUser.role }),
          },
          include: {
            user_a: {
              include: {
                photos: { orderBy: { ordering: 'asc' } },
              },
            },
            user_b: {
              include: {
                photos: { orderBy: { ordering: 'asc' } },
              },
            },
          },
        });
        
        // Sync users and create Firestore conversation
        try {
          await syncUserToFirebase(match.user_a as any);
          await syncUserToFirebase(match.user_b as any);
          await createFirestoreConversation(match.id, match.user_a as any, match.user_b as any);
          console.log(`✅ Match ${match.id} synced to Firestore`);
        } catch (error) {
          console.error('❌ Error syncing match to Firestore:', error);
          // Don't fail the request if Firebase sync fails
        }
      }
    }

    res.json({ swipe, match });
  } catch (e) {
    next(e);
  }
});

// Undo last swipe
router.post('/undo', async (req: AuthedRequest, res, next) => {
  try {
    const me = req.user!;
    
    // Find the most recent swipe by this user
    const lastSwipe = await prisma.swipe.findFirst({
      where: { from_user_id: me.id },
      orderBy: { created_at: 'desc' },
    });
    
    if (!lastSwipe) {
      return res.status(404).json({ error: 'No swipe to undo' });
    }
    
    // If it was a right swipe, check if it created a match and delete it
    let deletedMatch = null;
    if (lastSwipe.direction === 'right') {
      const a = me.id < lastSwipe.to_user_id ? me.id : lastSwipe.to_user_id;
      const b = me.id < lastSwipe.to_user_id ? lastSwipe.to_user_id : me.id;
      
      const match = await prisma.match.findUnique({
        where: { user_a_id_user_b_id: { user_a_id: a, user_b_id: b } },
      });
      
      if (match) {
        await prisma.match.delete({
          where: { user_a_id_user_b_id: { user_a_id: a, user_b_id: b } },
        });
        deletedMatch = match;
      }
    }
    
    // Delete the swipe
    await prisma.swipe.delete({
      where: { id: lastSwipe.id },
    });
    console.log(`Deleted swipe ${lastSwipe.id} for ${me.id} -> ${lastSwipe.to_user_id}`);
    
    res.json({ 
      undone: true, 
      swipe: lastSwipe,
      match_deleted: !!deletedMatch,
    });
  } catch (e) {
    next(e);
  }
});

// Get users who liked me (right swiped on me)
router.get('/liked-me', async (req: AuthedRequest, res, next) => {
  try {
    const me = req.user!;
    
    // Find all right swipes directed at me
    const swipes = await prisma.swipe.findMany({
      where: { 
        to_user_id: me.id,
        direction: 'right',
      },
      include: {
        from_user: {
          include: {
            photos: {
              orderBy: { ordering: 'asc' },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Filter out users who are already matched or who I've already swiped on
    const mySwipes = await prisma.swipe.findMany({
      where: { from_user_id: me.id },
      select: { to_user_id: true },
    });
    const mySwipedIds = new Set(mySwipes.map(s => s.to_user_id));

    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { user_a_id: me.id },
          { user_b_id: me.id },
        ],
      },
    });
    const matchedIds = new Set(
      matches.map(m => m.user_a_id === me.id ? m.user_b_id : m.user_a_id)
    );

    // Helper function to check BIDIRECTIONAL eligibility
    // If someone was able to swipe me, I should be able to swipe them back
    const normalizeRole = (r?: string | null) => (r || '').toLowerCase().replace(/\s+/g, '');
    const myRole = normalizeRole(me.role);
    const myMotherFor = (me.mother_for || '').toLowerCase();
    
    const isEligible = (targetUser: any) => {
      const targetRole = normalizeRole(targetUser.role);
      const targetMotherFor = (targetUser.mother_for || '').toLowerCase();
      
      // Check if I can swipe them OR if they can swipe me (bidirectional)
      const iCanSwipeThem = (() => {
        if (myRole === 'male') return targetRole === 'female';
        if (myRole === 'female') return targetRole === 'male';
        if (myRole === 'mother' && myMotherFor === 'son') return targetRole === 'female' || (targetRole === 'mother' && targetMotherFor === 'daughter');
        if (myRole === 'mother' && myMotherFor === 'daughter') return targetRole === 'male' || (targetRole === 'mother' && targetMotherFor === 'son');
        return false;
      })();
      
      const theyCanSwipeMe = (() => {
        if (targetRole === 'male') return myRole === 'female';
        if (targetRole === 'female') return myRole === 'male';
        if (targetRole === 'mother' && targetMotherFor === 'son') return myRole === 'female' || (myRole === 'mother' && myMotherFor === 'daughter');
        if (targetRole === 'mother' && targetMotherFor === 'daughter') return myRole === 'male' || (myRole === 'mother' && myMotherFor === 'son');
        return false;
      })();
      
      return iCanSwipeThem || theyCanSwipeMe;
    };

    // Filter to only show users I haven't interacted with yet AND are eligible to swipe
    const users = swipes
      .filter(s => !mySwipedIds.has(s.from_user_id) && !matchedIds.has(s.from_user_id) && isEligible(s.from_user))
      .map(s => s.from_user);

    res.json({ users });
  } catch (e) {
    next(e);
  }
});

export default router;

