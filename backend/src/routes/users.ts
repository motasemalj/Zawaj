import { Router } from 'express';
import { prisma } from '../prisma';
import { AuthedRequest } from '../types';
import { z } from 'zod';

const router = Router();

const roleEnum = z.enum(['male', 'female', 'mother']);
const motherForEnum = z.enum(['son', 'daughter']).nullable();

const createUserSchema = z.object({
  role: roleEnum,
  mother_for: motherForEnum.optional().nullable(),
  display_name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(100),
  dob: z.string().min(1, 'تاريخ الميلاد مطلوب'),
  gender: z.string().optional().nullable(),
  city: z.string().min(1, 'المدينة مطلوبة').optional().nullable(),
  country: z.string().min(1, 'الدولة مطلوبة').optional().nullable(),
  nationality: z.string().optional().nullable(),
  height_cm: z.number().int().positive().optional().nullable(),
  education: z.string().optional().nullable(),
  profession: z.string().optional().nullable(),
  income_range: z.string().optional().nullable(),
  languages: z.array(z.string()).optional(),
  marital_status: z.string().optional().nullable(),
  relocate: z.boolean().optional(),
  want_children: z.enum(['yes','no','maybe']).optional().nullable(),
  religiousness: z.number().int().min(1).max(5).optional().nullable(),
  prayer_freq: z.enum(['always','often','sometimes','rarely']).optional().nullable(),
  quran_engagement: z.string().optional().nullable(),
  fasting_ramadan: z.string().optional().nullable(),
  hijab_preference: z.string().optional().nullable(),
  hijab: z.string().optional().nullable(),
  beard: z.string().optional().nullable(),
  halal_diet: z.string().optional().nullable(),
  smoker: z.string().optional().nullable(),
  fitness_level: z.string().optional().nullable(),
  dietary_preferences: z.string().optional().nullable(),
  spouse_practice: z.string().optional().nullable(),
  interests: z.array(z.string()).optional(),
  bio: z.string().max(500, 'النبذة يجب ألا تزيد عن 500 حرف').optional().nullable(),
  muslim_affirmed: z.boolean(),
  // ward (mother)
  ward_display_name: z.string().optional().nullable(),
  ward_dob: z.string().optional().nullable(),
  ward_city: z.string().optional().nullable(),
  ward_country: z.string().optional().nullable(),
  ward_education: z.string().optional().nullable(),
  ward_profession: z.string().optional().nullable(),
  ward_bio: z.string().max(500).optional().nullable(),
});

router.post('/', async (req: AuthedRequest, res, next) => {
  try {
    const parsed = createUserSchema.parse(req.body);
    if (!parsed.muslim_affirmed) {
      return res.status(400).json({ error: 'Muslim affirmation required' });
    }
    const user = await prisma.user.create({
      data: {
        ...parsed,
        languages: parsed.languages ? JSON.stringify(parsed.languages) : null,
        interests: parsed.interests ? JSON.stringify(parsed.interests) : null,
      },
    });
    res.json(user);
  } catch (e) {
    next(e);
  }
});

router.get('/me', async (req: AuthedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const me = await prisma.user.findUnique({ where: { id: userId }, include: { photos: true, preferences: true } });
    res.json(me);
  } catch (e) {
    next(e);
  }
});

const updatePrivacySchema = z.object({
  blur_mode: z.boolean().optional(),
  reveal_on_match: z.boolean().optional(),
});

router.put('/me/privacy', async (req: AuthedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const parsed = updatePrivacySchema.parse(req.body);
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        privacy_blur_mode: parsed.blur_mode,
        privacy_reveal_on_match: parsed.reveal_on_match,
      },
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

// Location + Notifications endpoints
const upsertDeviceSchema = z.object({ expo_push_token: z.string().optional(), location: z.object({ lat: z.number(), lng: z.number() }).optional() });
router.put('/me/device', async (req: AuthedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const parsed = upsertDeviceSchema.parse(req.body);
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        expo_push_token: parsed.expo_push_token,
        location: parsed.location ? JSON.stringify(parsed.location) : undefined,
      },
    });
    res.json({ ok: true, user: updated });
  } catch (e) { next(e); }
});

router.put('/me', async (req: AuthedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const body = req.body ?? {};
  const data: any = { ...body };
    // sanitize role and mother_for
    if (typeof body.role !== 'string' || !['male','female','mother'].includes(body.role)) {
      delete data.role;
    }
    
    // Only update mother_for if explicitly provided
    if ('mother_for' in body) {
      if (data.role === 'mother' || req.user!.role === 'mother') {
        if (typeof body.mother_for === 'string' && ['son','daughter'].includes(body.mother_for)) {
          data.mother_for = body.mother_for;
        } else if (body.mother_for === null) {
          // Allow explicit null if role is changing away from mother
          if (data.role && data.role !== 'mother') {
            data.mother_for = null;
          } else {
            delete data.mother_for; // Don't update if invalid for mother
          }
        } else {
          delete data.mother_for; // Don't update if invalid
        }
      } else if (data.role && data.role !== 'mother') {
        // If changing to non-mother role, force null
        data.mother_for = null;
      } else {
        delete data.mother_for; // Don't update if not applicable
      }
    } else {
      // mother_for not in body, don't modify it
      delete data.mother_for;
    }
    
    // Validate and parse DOB with age check
    if (typeof body.dob === 'string') {
      const s = body.dob.trim();
      const iso = s.length === 10 ? `${s}T00:00:00Z` : s;
      const d = new Date(iso);
      if (!isNaN(d.getTime())) {
        // Age validation
        const now = new Date();
        const age = now.getFullYear() - d.getFullYear() - ((now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) ? 1 : 0);
        if (age < 18) {
          return res.status(400).json({ message: 'يجب أن يكون العمر 18 سنة أو أكثر' });
        }
        if (age > 100) {
          return res.status(400).json({ message: 'يرجى التحقق من تاريخ الميلاد' });
        }
        data.dob = d;
      } else {
        delete data.dob;
      }
    }
    
    if (typeof body.ward_dob === 'string') {
      const s = body.ward_dob.trim();
      const iso = s.length === 10 ? `${s}T00:00:00Z` : s;
      const d = new Date(iso);
      if (!isNaN(d.getTime())) data.ward_dob = d; else delete data.ward_dob;
    }
    
    // Validate display_name
    if (typeof body.display_name === 'string' && body.display_name.trim().length > 0 && body.display_name.trim().length < 2) {
      return res.status(400).json({ message: 'الاسم يجب أن يكون حرفين على الأقل' });
    }
    
    // Validate bio length
    if (typeof body.bio === 'string' && body.bio.length > 500) {
      return res.status(400).json({ message: 'النبذة يجب ألا تزيد عن 500 حرف' });
    }
    
    // Normalize empty strings to null
    for (const k of Object.keys(data)) {
      if (typeof data[k] === 'string' && data[k].trim() === '') data[k] = null;
    }
    if (Array.isArray(body.languages)) data.languages = JSON.stringify(body.languages);
    if (Array.isArray(body.interests)) data.interests = JSON.stringify(body.interests);
    const updated = await prisma.user.update({
      where: { id: userId },
      data,
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

router.get('/me/completeness', async (req: AuthedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const u = await prisma.user.findUnique({ where: { id: userId }, include: { photos: true } });
    if (!u) return res.status(404).json({ error: 'Not found' });
    let score = 0;
    const fields: Array<[any, number]> = [
      [u.display_name, 10], [u.dob, 10], [u.city, 5], [u.country, 5], [u.nationality, 5],
      [u.education, 5], [u.profession, 5], [u.languages, 5], [u.marital_status, 5],
      [u.religiousness, 10], [u.prayer_freq, 5], [u.bio, 5], [u.photos?.length ? 'ok' : null, 15],
    ];
    for (const [v, w] of fields) if (v) score += w;
    const completeness = Math.min(100, score);
    res.json({ completeness });
  } catch (e) { next(e); }
});

const upsertPrefsSchema = z.object({
  age_min: z.number().int().optional(),
  age_max: z.number().int().optional(),
  distance_km: z.number().int().optional(),
  height_min_cm: z.number().int().optional(),
  height_max_cm: z.number().int().optional(),
  countries: z.array(z.string()).optional(),
  cities: z.array(z.string()).optional(),
  education: z.array(z.string()).optional(),
  education_preferences: z.string().optional(), // JSON string
  profession: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  religiousness_min: z.number().int().optional(),
  prayer_freq: z.array(z.enum(['always','often','sometimes','rarely'])).optional(),
  marital_status: z.array(z.string()).optional(),
  marital_status_preferences: z.string().optional(), // JSON string
  sect_preferences: z.string().optional(), // JSON string
  smoking_preferences: z.string().optional(), // JSON string
  children_preferences: z.string().optional(), // JSON string
  origin_preferences: z.string().optional(), // JSON string
  relocate: z.array(z.boolean()).optional(),
  relocate_preference: z.boolean().nullable().optional(), // null = any, true = yes, false = no
  want_children: z.array(z.enum(['yes','no','maybe'])).optional(),
  height_min: z.number().int().optional(), // Deprecated
  height_max: z.number().int().optional(), // Deprecated
  show_only_mothers: z.boolean().optional(),
});

router.put('/me/preferences', async (req: AuthedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const p = upsertPrefsSchema.parse(req.body);
    const data = {
      age_min: p.age_min,
      age_max: p.age_max,
      distance_km: p.distance_km,
      height_min_cm: p.height_min_cm,
      height_max_cm: p.height_max_cm,
      countries: p.countries ? JSON.stringify(p.countries) : undefined,
      cities: p.cities ? JSON.stringify(p.cities) : undefined,
      education: p.education ? JSON.stringify(p.education) : undefined,
      education_preferences: p.education_preferences,
      profession: p.profession ? JSON.stringify(p.profession) : undefined,
      languages: p.languages ? JSON.stringify(p.languages) : undefined,
      religiousness_min: p.religiousness_min,
      prayer_freq: p.prayer_freq ? JSON.stringify(p.prayer_freq) : undefined,
      marital_status: p.marital_status ? JSON.stringify(p.marital_status) : undefined,
      marital_status_preferences: p.marital_status_preferences,
      sect_preferences: p.sect_preferences,
      smoking_preferences: p.smoking_preferences,
      children_preferences: p.children_preferences,
      origin_preferences: p.origin_preferences,
      relocate: p.relocate ? JSON.stringify(p.relocate) : undefined,
      relocate_preference: p.relocate_preference,
      want_children: p.want_children ? JSON.stringify(p.want_children) : undefined,
      height_min: p.height_min,
      height_max: p.height_max,
      show_only_mothers: p.show_only_mothers,
    } as any;
    const prefs = await prisma.preference.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
    res.json(prefs);
  } catch (e) {
    next(e);
  }
});

// Delete user account (for incomplete onboarding or account deletion)
router.delete('/me', async (req: AuthedRequest, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Delete user and all related data (Prisma cascades will handle related records)
    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ ok: true, message: 'Account deleted successfully' });
  } catch (e) {
    next(e);
  }
});

export default router;

