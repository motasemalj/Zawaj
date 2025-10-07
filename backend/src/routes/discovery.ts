import { Router } from 'express';
import { prisma } from '../prisma';
import { AuthedRequest } from '../types';

const router = Router();

function normalizeRole(r?: string | null): 'male' | 'female' | 'mother' | 'other' {
  const v = (r || '').toLowerCase().replace(/\s+/g, '');
  if (v === 'male') return 'male';
  if (v === 'female') return 'female';
  if (v === 'mother') return 'mother';
  return 'other';
}

function eligibleRoleTargets(me: { role: string; mother_for: string | null }) {
  const myRole = normalizeRole(me.role);
  if (myRole === 'male') return { roles: ['female'], mothersFor: [] as string[] };
  if (myRole === 'female') return { roles: ['male'], mothersFor: [] as string[] };
  // mother
  if ((me.mother_for || '').toLowerCase() === 'son') return { roles: ['female','mother'], mothersFor: ['daughter'] };
  return { roles: ['male','mother'], mothersFor: ['son'] };
}

router.get('/', async (req: AuthedRequest, res, next) => {
  try {
    const me = req.user!;
    const { roles, mothersFor } = eligibleRoleTargets({ role: me.role, mother_for: me.mother_for });
    const page = Math.max(parseInt((req.query.page as string) || '0', 10), 0);
    const limit = Math.min(Math.max(parseInt((req.query.limit as string) || '30', 10), 1), 100);

    // Get session exclusion list (profiles already shown in this session)
    const excludeIdsParam = req.query.exclude_ids as string | undefined;
    const sessionExcludeIds = excludeIdsParam 
      ? excludeIdsParam.split(',').filter(id => id.length > 0)
      : [];
    console.log(`Discovery request from ${me.id}, excluding ${sessionExcludeIds.length} session profiles`);

    const prefs = await prisma.preference.findUnique({ where: { userId: me.id } });

    // Build role condition with strict eligibility matching swipes endpoint
    const myRole = normalizeRole(me.role);
    const myMotherFor = (me.mother_for || '').toLowerCase();
    
    let roleCondition: any;
    
    if (myRole === 'male') {
      // Male can only see females
      roleCondition = { role: 'female' };
    } else if (myRole === 'female') {
      // Female can only see males
      roleCondition = { role: 'male' };
    } else if (myRole === 'mother' && myMotherFor === 'son') {
      // Mother looking for son can see: females OR mothers looking for daughter
      roleCondition = { 
        OR: [
          { role: 'female' },
          { AND: [{ role: 'mother' }, { mother_for: 'daughter' }] }
        ]
      };
    } else if (myRole === 'mother' && myMotherFor === 'daughter') {
      // Mother looking for daughter can see: males OR mothers looking for son
      roleCondition = { 
        OR: [
          { role: 'male' },
          { AND: [{ role: 'mother' }, { mother_for: 'son' }] }
        ]
      };
    } else {
      // Fallback: no results for invalid role combinations
      roleCondition = { role: 'invalid' };
    }

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
    console.log(`User ${me.id} has ${excludeSwipedIds.length} previous swipes to exclude`);

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

    // Exclude recently seen users in WHERE to strongly prevent immediate reappearance
    const EXCLUDE_SEEN_HOURS = 24;
    const since = new Date(Date.now() - EXCLUDE_SEEN_HOURS * 60 * 60 * 1000);
    const recentlySeen = await prisma.discoverySeen.findMany({
      where: { viewer_id: me.id, created_at: { gte: since } },
      select: { seen_user_id: true },
    });
    const excludeRecentlySeenIds = recentlySeen.map((r) => r.seen_user_id);

    // Combine all exclusions for DB WHERE: blocked, swiped, session-shown, and recently-seen (24h)
    const allExcludeIds = [
      me.id,
      ...Array.from(excludeIds),
      ...excludeSwipedIds,
      ...sessionExcludeIds,
      ...excludeRecentlySeenIds,
    ];
    andConditions.push({ id: { notIn: allExcludeIds } });
    console.log(`Excluded in WHERE: ${allExcludeIds.length} (${excludeIds.size} blocked, ${excludeSwipedIds.length} swiped, ${sessionExcludeIds.length} session, ${excludeRecentlySeenIds.length} seen<${EXCLUDE_SEEN_HOURS}h)`);

    // Location is optional - only apply distance filtering if user has location
    const meHasLocation = !!me.location;
    const distanceKm = prefs?.distance_km ?? 100; // default wider to avoid empty results

    const users = await prisma.user.findMany({
      where: whereBase,
      include: { photos: true },
      take: 300,
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

    // Parse all preference filters
    const prefHeightMin = prefs?.height_min_cm ?? null;
    const prefHeightMax = prefs?.height_max_cm ?? null;
    let prefOrigins: string[] | null = null;
    let prefSects: string[] | null = null;
    let prefEducation: string[] | null = null;
    let prefMaritalStatus: string[] | null = null;
    let prefSmoking: string[] | null = null;
    let prefChildren: string[] | null = null;
    
    try { prefOrigins = prefs?.origin_preferences ? JSON.parse(prefs.origin_preferences) : null; } catch { prefOrigins = null; }
    try { prefSects = prefs?.sect_preferences ? JSON.parse(prefs.sect_preferences) : null; } catch { prefSects = null; }
    try { prefEducation = prefs?.education_preferences ? JSON.parse(prefs.education_preferences) : null; } catch { prefEducation = null; }
    try { prefMaritalStatus = prefs?.marital_status_preferences ? JSON.parse(prefs.marital_status_preferences) : null; } catch { prefMaritalStatus = null; }
    try { prefSmoking = prefs?.smoking_preferences ? JSON.parse(prefs.smoking_preferences) : null; } catch { prefSmoking = null; }
    try { prefChildren = prefs?.children_preferences ? JSON.parse(prefs.children_preferences) : null; } catch { prefChildren = null; }
    
    const prefRelocate = prefs?.relocate_preference;
    
    console.log(`Applying filters: height(${prefHeightMin}-${prefHeightMax}), origins(${prefOrigins?.length || 0}), sects(${prefSects?.length || 0}), education(${prefEducation?.length || 0}), marital(${prefMaritalStatus?.length || 0}), smoking(${prefSmoking?.length || 0}), children(${prefChildren?.length || 0}), relocate(${prefRelocate})`);

    const filteredForAttrs = candidateUsers.filter(u => {
      // Normalize and double-check eligibility in case of dirty data
      const myRole = normalizeRole(me.role);
      const targetRole = normalizeRole(u.role as any);
      const myMotherFor = (me.mother_for || '').toLowerCase();
      const targetMotherFor = ((u as any).mother_for || '').toLowerCase();
      const roleEligible = (() => {
        if (myRole === 'male') return targetRole === 'female';
        if (myRole === 'female') return targetRole === 'male';
        if (myRole === 'mother' && myMotherFor === 'son') return targetRole === 'female' || (targetRole === 'mother' && targetMotherFor === 'daughter');
        if (myRole === 'mother' && myMotherFor === 'daughter') return targetRole === 'male' || (targetRole === 'mother' && targetMotherFor === 'son');
        return false;
      })();
      if (!roleEligible) return false;
      // Height clamp
      if (prefHeightMin !== null && typeof u.height_cm === 'number' && u.height_cm < prefHeightMin) return false;
      if (prefHeightMax !== null && typeof u.height_cm === 'number' && u.height_cm > prefHeightMax) return false;
      
      // Origins match: if preference list exists and non-empty, require intersection with user.ethnicity (JSON array or string)
      if (prefOrigins && prefOrigins.length > 0) {
        let userOrigins: string[] = [];
        try {
          if (u.ethnicity) {
            const parsed = JSON.parse(u.ethnicity as any);
            if (Array.isArray(parsed)) userOrigins = parsed;
            else if (typeof u.ethnicity === 'string') userOrigins = [u.ethnicity as any];
          }
        } catch {
          if (typeof u.ethnicity === 'string') userOrigins = [u.ethnicity as any];
        }
        if (!userOrigins.some(o => prefOrigins!.includes(o))) return false;
      }
      
      // Sect filter
      if (prefSects && prefSects.length > 0) {
        if (!u.sect || !prefSects.includes(u.sect as string)) return false;
      }
      
      // Education filter
      if (prefEducation && prefEducation.length > 0) {
        if (!u.education || !prefEducation.includes(u.education as string)) return false;
      }
      
      // Marital status filter
      if (prefMaritalStatus && prefMaritalStatus.length > 0) {
        if (!u.marital_status || !prefMaritalStatus.includes(u.marital_status as string)) return false;
      }
      
      // Smoking filter
      if (prefSmoking && prefSmoking.length > 0) {
        if (!u.smoker || !prefSmoking.includes(u.smoker as string)) return false;
      }
      
      // Children preference filter
      if (prefChildren && prefChildren.length > 0) {
        if (!u.children_preference || !prefChildren.includes(u.children_preference as string)) return false;
      }
      
      // Relocate filter (null = any, true = must be willing, false = must not be willing)
      if (prefRelocate !== null && prefRelocate !== undefined) {
        if (typeof u.relocate === 'boolean') {
          if (prefRelocate !== u.relocate) return false;
        } else {
          // If user hasn't specified, skip this filter to avoid excluding too many
        }
      }
      
      return true;
    });
    
    console.log(`After attribute filtering: ${filteredForAttrs.length} users (from ${candidateUsers.length} candidates)`);

    const usersWithScore = filteredForAttrs
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
    const start = page * limit;
    const end = start + limit;
    const pageItems = sorted.slice(start, end);
    const hasMore = end < sorted.length;
    console.log(`Returning page=${page} size=${pageItems.length}/${sorted.length}`);
    res.json({ users: pageItems, page, hasMore, total: sorted.length });
  } catch (e) {
    next(e);
  }
});

// Mark a profile as seen (for de-duplication across sessions with TTL)
router.post('/seen', async (req: AuthedRequest, res, next) => {
  try {
    const me = req.user!;
    const seen_user_id = (req.body?.seen_user_id as string) || '';
    if (!seen_user_id) return res.status(400).json({ error: 'seen_user_id is required' });
    if (seen_user_id === me.id) return res.status(400).json({ error: 'Cannot mark self as seen' });

    // Upsert based on unique [viewer_id, seen_user_id]; update timestamp to now
    const record = await prisma.discoverySeen.upsert({
      where: { viewer_id_seen_user_id: { viewer_id: me.id, seen_user_id } },
      update: { created_at: new Date() },
      create: { viewer_id: me.id, seen_user_id },
    });

    res.json({ ok: true, recordId: record.id });
  } catch (e) {
    next(e);
  }
});

export default router;

