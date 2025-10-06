import { Router } from 'express';
import { prisma } from '../prisma';
import { AuthedRequest } from '../types';

const router = Router();

function eligibleRoleTargets(me: { role: string; mother_for: string | null }) {
  if (me.role === 'male') return { roles: ['female'], mothersFor: [] as string[] };
  if (me.role === 'female') return { roles: ['male'], mothersFor: [] as string[] };
  // mother
  if (me.mother_for === 'son') return { roles: ['female','mother'], mothersFor: ['daughter'] };
  return { roles: ['male','mother'], mothersFor: ['son'] };
}

router.get('/', async (req: AuthedRequest, res, next) => {
  try {
    const me = req.user!;
    const { roles, mothersFor } = eligibleRoleTargets({ role: me.role, mother_for: me.mother_for });

    // Get session exclusion list (profiles already shown in this session)
    const excludeIdsParam = req.query.exclude_ids as string | undefined;
    const sessionExcludeIds = excludeIdsParam 
      ? excludeIdsParam.split(',').filter(id => id.length > 0)
      : [];
    console.log(`Discovery request from ${me.id}, excluding ${sessionExcludeIds.length} session profiles`);

    const prefs = await prisma.preference.findUnique({ where: { userId: me.id } });

    // Build role condition (mothers special case)
    const roleCondition = roles.includes('mother')
      ? { OR: [
          { role: { in: roles.filter(r => r !== 'mother') as any } },
          { role: 'mother', mother_for: { in: mothersFor as any } },
        ] }
      : { role: { in: roles as any } };

    // Base AND conditions to avoid overwriting OR keys
    const andConditions: any[] = [
      { id: { not: me.id } },
      // Completed onboarding or explicitly affirmed
      { OR: [ { muslim_affirmed: true }, { onboarding_completed: true } ] },
      // 18+
      { dob: { lte: new Date(new Date().setFullYear(new Date().getFullYear() - 18)) } },
      roleCondition,
    ];

    // Religiousness filter: allow nulls to pass so incomplete profiles aren't hidden
    if (prefs?.religiousness_min) {
      andConditions.push({ OR: [ { religiousness: { gte: prefs.religiousness_min } }, { religiousness: null } ] });
    }

    // Exclude users who chose to hide their profile
    andConditions.push({ discoverable: { equals: true } });
    const whereBase: any = { AND: andConditions };
    

    // City/Country filters from preferences
    try {
      const prefCountries = prefs?.countries ? JSON.parse(prefs.countries) as string[] : undefined;
      const prefCities = prefs?.cities ? JSON.parse(prefs.cities) as string[] : undefined;
      if (prefCountries && prefCountries.length > 0) andConditions.push({ country: { in: prefCountries } });
      if (prefCities && prefCities.length > 0) andConditions.push({ city: { in: prefCities } });
    } catch {}

    if (me.role === 'mother' && prefs?.show_only_mothers) {
      andConditions.push({ role: 'mother' });
      andConditions.push({ mother_for: { in: mothersFor as any } });
    }

    // Age filters
    if (prefs?.age_min || prefs?.age_max) {
      const today = new Date();
      if (prefs.age_min) {
        // age_min: 24 means find users 24+ years old (born 24+ years ago)
        const maxDob = new Date(today); maxDob.setFullYear(today.getFullYear() - (prefs.age_min as number));
        andConditions.push({ dob: { lte: maxDob } });
      }
      if (prefs.age_max) {
        // age_max: 40 means find users 40 or younger (born 40 or fewer years ago)
        const minDob = new Date(today); minDob.setFullYear(today.getFullYear() - (prefs.age_max as number));
        andConditions.push({ dob: { gte: minDob } });
      }
    }

    // Exclude blocked users
    const blocks = await prisma.block.findMany({ where: { OR: [ { blocker_id: me.id }, { blocked_id: me.id } ] } });
    const excludeIds = new Set<string>();
    for (const b of blocks) { excludeIds.add(b.blocker_id === me.id ? b.blocked_id : b.blocker_id); }

    // Exclude ALL already swiped users (both left and right)
    const allSwipes = await prisma.swipe.findMany({ 
      where: { from_user_id: me.id },
      select: { to_user_id: true }
    });
    const excludeSwipedIds = allSwipes.map(s => s.to_user_id);

    // Get super likes I've received (with fallback for schema compatibility)
    let superLikerIds: string[] = [];
    try {
      const superLikesReceived = await prisma.swipe.findMany({
        where: { 
          to_user_id: me.id, 
          is_super_like: true,
          from_user_id: { notIn: [...excludeSwipedIds, ...sessionExcludeIds] } // Exclude swiped and session-shown
        },
        select: { from_user_id: true }
      });
      superLikerIds = superLikesReceived.map(s => s.from_user_id);
    } catch (err) {
      // Fallback if is_super_like doesn't exist yet (older migrations)
      try {
        const superLikesReceived = await prisma.swipe.findMany({
          where: { 
            to_user_id: me.id,
            direction: 'up',
            from_user_id: { notIn: [...excludeSwipedIds, ...sessionExcludeIds] }
          },
          select: { from_user_id: true }
        });
        superLikerIds = superLikesReceived.map(s => s.from_user_id);
      } catch {
        console.warn('Super like query failed, continuing without it');
      }
    }

    // Combine all exclusions including session-based exclusions
    const allExcludeIds = [me.id, ...Array.from(excludeIds), ...excludeSwipedIds, ...sessionExcludeIds];
    andConditions.push({ id: { notIn: allExcludeIds } });
    console.log(`Total excluded IDs: ${allExcludeIds.length}`);

    // Location is optional - only apply distance filtering if user has location
    const meHasLocation = !!me.location;
    const distanceKm = prefs?.distance_km ?? 100; // default wider to avoid empty results

    const users = await prisma.user.findMany({
      where: whereBase,
      include: { photos: true },
      take: 200,
      orderBy: [
        { updated_at: 'desc' },
        { created_at: 'desc' },
      ],
    });

    // If empty, relax filters slightly to avoid empty decks for new users
    let candidateUsers = users;
    if (candidateUsers.length === 0) {
      const relaxed = await prisma.user.findMany({
        where: {
          id: { not: me.id },
          OR: [
            { muslim_affirmed: true },
            { onboarding_completed: true }
          ],
          role: { in: roles as any },
        },
        include: { photos: true },
        take: 50,
        orderBy: [
          { updated_at: 'desc' },
          { created_at: 'desc' },
        ],
      });
      candidateUsers = relaxed;
    }

    // Geo distance filter (rough haversine) and scoring
    function parseLoc(s?: string | null) {
      try { return s ? JSON.parse(s) as { lat: number; lng: number } : null; } catch { return null; }
    }
    const meLoc = parseLoc(me.location);

    const usersWithScore = candidateUsers
      .map(u => {
        const otherLoc = parseLoc(u.location);
        let distance = Infinity;
        if (meLoc && otherLoc) {
          const R = 6371; // km
          const dLat = (otherLoc.lat - meLoc.lat) * Math.PI / 180;
          const dLon = (otherLoc.lng - meLoc.lng) * Math.PI / 180;
          const a = Math.sin(dLat/2)**2 + Math.cos(meLoc.lat*Math.PI/180)*Math.cos(otherLoc.lat*Math.PI/180)*Math.sin(dLon/2)**2;
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          distance = R * c;
        }
        return { ...u, _distance_km: distance } as any;
      })
      .filter(u => {
        // Only apply distance filter if current user has location
        if (!meHasLocation) return true;
        return u._distance_km === Infinity ? true : u._distance_km <= distanceKm;
      })
      .map(u => {
      let score = 0;
      
      // Super likers get highest priority
      if (superLikerIds.includes(u.id)) score += 1000;
      
      // Boost recent activity
      const daysSinceUpdate = (Date.now() - new Date(u.updated_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 1) score += 50;
      else if (daysSinceUpdate < 3) score += 30;
      else if (daysSinceUpdate < 7) score += 10;
      
      // Boost users with photos (prefer those with face photos)
      if (u.photos && u.photos.length > 0) score += 25;
      if (u.photos && u.photos.length >= 3) score += 10;
      
      // Boost completed profiles
      if (u.bio) score += 15;
      if (u.profession) score += 10;
      if (u.education) score += 10;
      
      // Slight randomization for variety, but deterministic per user id to avoid flicker
      const seed = u.id.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
      const pseudoRandom = (Math.sin(seed) + 1) / 2; // 0..1
      score += pseudoRandom * 5;
      
        return { 
          ...u, 
          score,
          is_super_liker: superLikerIds.includes(u.id)
        } as any;
      });

    // Sort by score (highest first)
    const sorted = usersWithScore.sort((a, b) => b.score - a.score);

    res.json({ users: sorted });
  } catch (e) {
    next(e);
  }
});

export default router;

