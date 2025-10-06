import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { authMiddleware } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';

const router = Router();
router.use(authMiddleware);

// File upload configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads');
    await fs.mkdir(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${req.userId}-selfie-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage, 
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|webp)$/i;
    if (allowed.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images allowed.'));
    }
  }
});

// Get onboarding status
router.get('/status', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        onboarding_step: true,
        onboarding_completed: true,
        first_name: true,
        dob: true,
        selfie_verified: true,
        ethnicity: true,
        sect: true,
        marriage_timeline: true,
        children_preference: true,
        interests: true,
        personality_traits: true,
        icebreaker_questions: true,
        terms_accepted: true,
        photos: { select: { id: true, url: true } }
      }
    });
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({
      current_step: user.onboarding_step || 0,
      completed: user.onboarding_completed,
      data: {
        has_first_name: !!user.first_name,
        has_dob: user.dob && user.dob.getFullYear() !== 1990,
        has_selfie: user.selfie_verified,
        has_photos: user.photos.length > 0,
        has_bio: !!user.ethnicity,
        has_interests: !!user.interests,
        has_icebreakers: !!user.icebreaker_questions,
        has_terms: user.terms_accepted
      }
    });
  } catch (e) { next(e); }
});

// Step 1: First Name & Role
const step1Schema = z.object({
  first_name: z.string().min(2).max(50),
  role: z.enum(['male', 'female', 'mother']),
  mother_for: z.enum(['son', 'daughter']).optional()
});

router.post('/step1', async (req, res, next) => {
  try {
    const data = step1Schema.parse(req.body);
    
    if (data.role === 'mother' && !data.mother_for) {
      return res.status(400).json({ error: 'mother_for required when role is mother' });
    }
    
    await prisma.user.update({
      where: { id: req.userId },
      data: {
        first_name: data.first_name,
        display_name: data.first_name,
        role: data.role,
        mother_for: data.mother_for || null,
        onboarding_step: Math.max((await prisma.user.findUnique({ where: { id: req.userId }, select: { onboarding_step: true } }))?.onboarding_step || 0, 1)
      }
    });
    
    res.json({ ok: true, next_step: 2 });
  } catch (e) { next(e); }
});

// Step 2: Date of Birth + Height
const step2Schema = z.object({
  dob: z.string().refine((date) => {
    const dob = new Date(date);
    const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    return age >= 18 && age <= 100;
  }, { message: 'Must be 18+ years old' }),
  height_cm: z.number().int().min(140).max(220)
});

router.post('/step2', async (req, res, next) => {
  try {
    const data = step2Schema.parse(req.body);
    
    await prisma.user.update({
      where: { id: req.userId },
      data: {
        dob: new Date(data.dob),
        height_cm: data.height_cm,
        onboarding_step: Math.max((await prisma.user.findUnique({ where: { id: req.userId }, select: { onboarding_step: true } }))?.onboarding_step || 0, 2)
      }
    });
    
    res.json({ ok: true, next_step: 3 });
  } catch (e) { next(e); }
});

// Step 3: Profile Photos (handled by existing photos route, but update step)
router.post('/step3', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { photos: true }
    });
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.photos.length === 0) {
      return res.status(400).json({ error: 'At least one profile photo required' });
    }
    
    await prisma.user.update({
      where: { id: req.userId },
      data: {
        onboarding_step: Math.max(user.onboarding_step || 0, 3)
      }
    });
    
    res.json({ ok: true, next_step: 4 });
  } catch (e) { next(e); }
});

// Step 4: Demographics (Profession, Education, Location, Smoking, Marital Status)
const step4Schema = z.object({
  profession: z.string().min(2).max(100),
  education: z.string().min(2),
  hometown: z.string().min(2).max(200),
  smoker: z.string().min(2),
  marital_status: z.string().min(2)
});

router.post('/step4', async (req, res, next) => {
  try {
    const data = step4Schema.parse(req.body);
    
    // Parse hometown to extract city and country if possible (or store as-is)
    const hometown = data.hometown;
    let city = hometown;
    let country = '';
    
    // Try to split by comma to separate city and country
    if (hometown.includes('،')) {
      const parts = hometown.split('،').map(p => p.trim());
      city = parts[0] || hometown;
      country = parts[1] || '';
    } else if (hometown.includes(',')) {
      const parts = hometown.split(',').map(p => p.trim());
      city = parts[0] || hometown;
      country = parts[1] || '';
    }
    
    await prisma.user.update({
      where: { id: req.userId },
      data: {
        profession: data.profession,
        education: data.education,
        city: city,
        country: country,
        smoker: data.smoker,
        marital_status: data.marital_status,
        onboarding_step: Math.max((await prisma.user.findUnique({ where: { id: req.userId }, select: { onboarding_step: true } }))?.onboarding_step || 0, 4)
      }
    });
    
    res.json({ ok: true, next_step: 5 });
  } catch (e) { next(e); }
});

// Step 5: About Me (Bio, Ethnicity, Marriage Timeline, Sect, Children, Relocation)
const step5Schema = z.object({
  bio: z.string().optional(),
  ethnicity: z.array(z.string()).min(1).max(2), // Allow 1-2 origins
  marriage_timeline: z.string().min(2), // Arabic labels
  sect: z.string().min(2), // Arabic labels
  children_preference: z.string().min(2), // Arabic labels
  want_children: z.string().min(2),
  relocate: z.boolean(),
  religiousness: z.number().int().min(1).max(5).optional(),
  prayer_freq: z.string().min(2).optional(), // store Arabic label
});

router.post('/step5', async (req, res, next) => {
  try {
    const data = step5Schema.parse(req.body);
    
    await prisma.user.update({
      where: { id: req.userId },
      data: {
        bio: data.bio,
        ethnicity: JSON.stringify(data.ethnicity), // Store as JSON array
        marriage_timeline: data.marriage_timeline,
        sect: data.sect,
        children_preference: data.children_preference,
        want_children: data.want_children,
        relocate: data.relocate,
        religiousness: data.religiousness,
        prayer_freq: data.prayer_freq,
        onboarding_step: Math.max((await prisma.user.findUnique({ where: { id: req.userId }, select: { onboarding_step: true } }))?.onboarding_step || 0, 5)
      }
    });
    
    res.json({ ok: true, next_step: 6 });
  } catch (e) { next(e); }
});

// Step 6: Interests & Personality Traits (Optional)
const step6Schema = z.object({
  interests: z.array(z.string()).max(10),
  personality_traits: z.array(z.string()).max(5)
});

router.post('/step6', async (req, res, next) => {
  try {
    const data = step6Schema.parse(req.body);
    
    await prisma.user.update({
      where: { id: req.userId },
      data: {
        interests: JSON.stringify(data.interests),
        personality_traits: JSON.stringify(data.personality_traits),
        onboarding_step: Math.max((await prisma.user.findUnique({ where: { id: req.userId }, select: { onboarding_step: true } }))?.onboarding_step || 0, 6)
      }
    });
    
    res.json({ ok: true, next_step: 7 });
  } catch (e) { next(e); }
});

// Step 7: Icebreaker Questions (Optional)
const step7Schema = z.object({
  icebreakers: z.array(z.object({
    prompt: z.string(),
    answer: z.string().max(300),
    type: z.enum(['text', 'voice'])
  })).max(3)
});

router.post('/step7', async (req, res, next) => {
  try {
    const data = step7Schema.parse(req.body);
    
    await prisma.user.update({
      where: { id: req.userId },
      data: {
        icebreaker_questions: JSON.stringify(data.icebreakers),
        onboarding_step: Math.max((await prisma.user.findUnique({ where: { id: req.userId }, select: { onboarding_step: true } }))?.onboarding_step || 0, 7)
      }
    });
    
    res.json({ ok: true, next_step: 8 });
  } catch (e) { next(e); }
});

// Step 8: Preferences/Filters + Terms & Conditions (Final Step)
const step8Schema = z.object({
  age_min: z.number().int().min(18),
  age_max: z.number().int().min(18),
  distance_km: z.number().int().min(1).max(500),
  accept_terms: z.literal(true)
});

router.post('/step8', async (req, res, next) => {
  try {
    const data = step8Schema.parse(req.body);
    
    // No age range validation - allow any range
    
    // Upsert preference
    await prisma.preference.upsert({
      where: { userId: req.userId },
      create: {
        userId: req.userId,
        age_min: data.age_min,
        age_max: data.age_max,
        distance_km: data.distance_km
      },
      update: {
        age_min: data.age_min,
        age_max: data.age_max,
        distance_km: data.distance_km
      }
    });
    
    // Mark onboarding as complete with terms accepted
    await prisma.user.update({
      where: { id: req.userId },
      data: {
        terms_accepted: true,
        terms_accepted_at: new Date(),
        onboarding_completed: true,
        onboarding_step: 8
      }
    });
    
    res.json({ ok: true, completed: true });
  } catch (e) { next(e); }
});

// Get available options for dropdowns
router.get('/options', async (req, res) => {
  res.json({
    education_levels: ['ثانوي', 'دبلوم', 'بكالوريوس', 'ماجستير', 'دكتوراه', 'آخر'],
    marital_statuses: ['أعزب/عزباء', 'مطلق/مطلقة', 'أرمل/أرملة'],
    smoking_options: ['لا', 'نعم', 'أحياناً', 'أحاول الإقلاع'],
    want_children_options: ['نعم', 'لا', 'ربما'],
    arabic_origins: [
      { code: 'SA', name: 'السعودية', flag: '🇸🇦' },
      { code: 'AE', name: 'الإمارات', flag: '🇦🇪' },
      { code: 'KW', name: 'الكويت', flag: '🇰🇼' },
      { code: 'QA', name: 'قطر', flag: '🇶🇦' },
      { code: 'BH', name: 'البحرين', flag: '🇧🇭' },
      { code: 'OM', name: 'عمان', flag: '🇴🇲' },
      { code: 'YE', name: 'اليمن', flag: '🇾🇪' },
      { code: 'IQ', name: 'العراق', flag: '🇮🇶' },
      { code: 'JO', name: 'الأردن', flag: '🇯🇴' },
      { code: 'SY', name: 'سوريا', flag: '🇸🇾' },
      { code: 'LB', name: 'لبنان', flag: '🇱🇧' },
      { code: 'PS', name: 'فلسطين', flag: '🇵🇸' },
      { code: 'EG', name: 'مصر', flag: '🇪🇬' },
      { code: 'SD', name: 'السودان', flag: '🇸🇩' },
      { code: 'LY', name: 'ليبيا', flag: '🇱🇾' },
      { code: 'TN', name: 'تونس', flag: '🇹🇳' },
      { code: 'DZ', name: 'الجزائر', flag: '🇩🇿' },
      { code: 'MA', name: 'المغرب', flag: '🇲🇦' },
      { code: 'MR', name: 'موريتانيا', flag: '🇲🇷' },
      { code: 'SO', name: 'الصومال', flag: '🇸🇴' },
      { code: 'DJ', name: 'جيبوتي', flag: '🇩🇯' },
      { code: 'KM', name: 'جزر القمر', flag: '🇰🇲' },
    ],
    have_children_options: ['نعم', 'لا'],
    marital_status_options: ['أعزب/عزباء', 'مطلق/مطلقة', 'أرمل/أرملة'],
    sects: ['سني', 'شيعي', 'آخر'],
    marriage_timelines: ['خلال 6 أشهر', '6-12 شهر', '1-2 سنة', 'أكثر من سنتين', 'مفتوح للتوقيت'],
    children_preferences: ['نعم', 'لا', 'ربما'],
    arabic_interests: [
      'السفر', 'القراءة', 'الرياضة', 'الطبخ', 'الفنون والحرف', 'الموسيقى',
      'التصوير', 'المشي', 'اللياقة', 'الألعاب', 'التطوع', 'الموضة',
      'التكنولوجيا', 'الطبيعة', 'البستنة', 'الأفلام', 'الكتابة', 'الرقص',
      'تعلم اللغات', 'خدمة المجتمع', 'الأعمال', 'العلوم',
      'التاريخ', 'الفلسفة', 'الحيوانات', 'القهوة', 'الشاي', 'ريادة الأعمال'
    ],
    arabic_personality_traits: [
      'مغامر', 'طموح', 'حنون', 'مبدع', 'هادئ', 'متعاطف',
      'عائلي', 'مرح', 'كريم', 'صادق', 'مستقل', 'مثقف',
      'لطيف', 'مخلص', 'منفتح', 'متفائل', 'منظم', 'صبور',
      'لعوب', 'عملي', 'موثوق', 'محترم', 'رومانسي', 'روحاني',
      'مفكر', 'تقليدي'
    ],
    arabic_prayer_frequencies: ['دائماً', 'غالباً', 'أحياناً', 'نادراً'],
    arabic_icebreaker_prompts: [
      'ما الذي يجعلك تضحك أكثر؟',
      'ما الذي تشعر بالامتنان له أكثر؟',
      'ما أكثر شيء تقدره في العلاقة؟',
      'ما هي فكرتك عن عطلة نهاية أسبوع مثالية؟',
      'ما هي هواياتك المفضلة؟',
      'ما هو الشيء الذي تشعر بشغف تجاهه؟',
      'ما هي طريقتك المفضلة لقضاء وقت ممتع؟',
      'ما هي أهدافك في الحياة؟',
      'ما الذي يجعلك تشعر بأنك محبوب؟',
      'ما هي ذكريتك المفضلة من الطفولة؟',
      'كيف يبدو يومك المثالي؟',
      'ما الذي تتعلمه حالياً أو تريد تعلمه؟'
    ]
  });
});

export default router;

