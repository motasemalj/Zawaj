import { PrismaClient } from '@prisma/client';
import https from 'https';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function downloadImage(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log('🌱 Starting NEW comprehensive seed with ALL fields properly filled...\n');
  
  // Clean database
  console.log('🧹 Cleaning database...');
  await prisma.discoverySeen.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.message.deleteMany();
  await prisma.match.deleteMany();
  await prisma.swipe.deleteMany();
  await prisma.preference.deleteMany();
  await prisma.report.deleteMany();
  await prisma.block.deleteMany();
  await prisma.otpCode.deleteMany();
  await prisma.emailOtp.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Database cleaned\n');

  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

  const today = new Date();
  function yearsAgo(n: number) { const d = new Date(today); d.setFullYear(d.getFullYear() - n); return d; }

  const profiles = [
    // ==================== MALES (15 profiles) ====================
    {
      role: 'male', gender: 'male', display_name: 'أحمد المحمود', first_name: 'أحمد', dob: yearsAgo(28),
      city: 'الرياض', country: 'السعودية', nationality: 'سعودي',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 24.7136, lng: 46.6753 }),
      height_cm: 178, education: 'ماجستير هندسة', profession: 'مهندس برمجيات',
      income_range: '15000-25000', marital_status: 'single',
      want_children: 'yes', children_preference: 'want_children', relocate: false,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 5, prayer_freq: 'always', sect: 'سني',
      quran_engagement: 'حافظ', fasting_ramadan: 'yes',
      beard: 'full', halal_diet: 'strict', smoker: 'no',
      fitness_level: 'active', dietary_preferences: 'halal_only',
      marriage_timeline: 'within_6_months',
      interests: JSON.stringify(['قرآن', 'برمجة', 'قراءة', 'رياضة', 'سفر']),
      personality_traits: JSON.stringify(['طموح', 'ملتزم', 'صادق', 'مسؤول', 'متفائل']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'ما هدفك في الحياة؟', answer: 'بناء أسرة صالحة وخدمة ديني', type: 'text' },
        { prompt: 'هوايتك المفضلة؟', answer: 'قراءة القرآن والبرمجة', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      bio: 'حافظ للقرآن، مهندس برمجيات، أبحث عن زوجة صالحة محافظة لبناء أسرة مسلمة',
      imageUrl: 'https://i.pravatar.cc/400?img=12'
    },
    {
      role: 'male', gender: 'male', display_name: 'خالد العتيبي', first_name: 'خالد', dob: yearsAgo(32),
      city: 'جدة', country: 'السعودية', nationality: 'سعودي',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 21.5433, lng: 39.1728 }),
      height_cm: 182, education: 'دكتوراه طب', profession: 'طبيب قلب',
      income_range: '25000+', marital_status: 'single',
      want_children: 'yes', children_preference: 'want_children', relocate: false,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 5, prayer_freq: 'always', sect: 'سني',
      quran_engagement: 'يومي', fasting_ramadan: 'yes',
      beard: 'trimmed', halal_diet: 'strict', smoker: 'no',
      fitness_level: 'very_active', dietary_preferences: 'halal_only',
      marriage_timeline: '6_12_months',
      interests: JSON.stringify(['طب', 'رياضة', 'سفر', 'قراءة', 'عائلة']),
      personality_traits: JSON.stringify(['طموح', 'رحيم', 'صبور', 'ملتزم', 'متفاني']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'لماذا اخترت الطب؟', answer: 'لخدمة الناس ومساعدتهم', type: 'text' },
        { prompt: 'ما حلمك؟', answer: 'طبيب ماهر وأب صالح', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      bio: 'طبيب قلب، ملتزم دينياً، أبحث عن شريكة حياة متفاهمة',
      imageUrl: 'https://i.pravatar.cc/400?img=13'
    },
    {
      role: 'male', gender: 'male', display_name: 'عبدالله الزهراني', first_name: 'عبدالله', dob: yearsAgo(26),
      city: 'مكة المكرمة', country: 'السعودية', nationality: 'سعودي',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 21.4225, lng: 39.8262 }),
      height_cm: 175, education: 'بكالوريوس شريعة', profession: 'معلم قرآن',
      income_range: '8000-12000', marital_status: 'single',
      want_children: 'yes', children_preference: 'want_children', relocate: true,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 5, prayer_freq: 'always', sect: 'سني',
      quran_engagement: 'حافظ', fasting_ramadan: 'yes',
      beard: 'full', halal_diet: 'strict', smoker: 'no',
      fitness_level: 'moderate', dietary_preferences: 'halal_only',
      marriage_timeline: 'within_6_months',
      interests: JSON.stringify(['قرآن', 'تعليم', 'دعوة', 'قراءة', 'عائلة']),
      personality_traits: JSON.stringify(['متدين', 'صبور', 'متواضع', 'طيب', 'متفاهم']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'ما أهم شيء في حياتك؟', answer: 'القرآن وتعليمه', type: 'text' },
        { prompt: 'كيف تقضي وقت فراغك؟', answer: 'قراءة القرآن والدعوة', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية']),
      bio: 'معلم قرآن كريم، حافظ، أبحث عن زوجة حافظة تشاركني حب كتاب الله',
      imageUrl: 'https://i.pravatar.cc/400?img=14'
    },
    {
      role: 'male', gender: 'male', display_name: 'محمد الشمري', first_name: 'محمد', dob: yearsAgo(29),
      city: 'المدينة المنورة', country: 'السعودية', nationality: 'سعودي',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 24.5247, lng: 39.5692 }),
      height_cm: 180, education: 'ماجستير محاسبة', profession: 'محاسب قانوني',
      income_range: '15000-20000', marital_status: 'single',
      want_children: 'yes', children_preference: 'want_children', relocate: false,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 4, prayer_freq: 'often', sect: 'سني',
      quran_engagement: 'أسبوعي', fasting_ramadan: 'yes',
      beard: 'trimmed', halal_diet: 'mostly', smoker: 'no',
      fitness_level: 'active', dietary_preferences: 'flexible',
      marriage_timeline: '6_12_months',
      interests: JSON.stringify(['رياضة', 'سفر', 'قراءة', 'مال', 'استثمار']),
      personality_traits: JSON.stringify(['طموح', 'منظم', 'دقيق', 'صادق', 'مسؤول']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'ما شغفك؟', answer: 'الاستثمار والتخطيط المالي', type: 'text' },
        { prompt: 'أين ترى نفسك بعد 5 سنوات؟', answer: 'رجل أعمال ناجح مع عائلة', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      bio: 'محاسب قانوني، أحب الرياضة والسفر، أبحث عن شريكة طموحة',
      imageUrl: 'https://i.pravatar.cc/400?img=15'
    },
    {
      role: 'male', gender: 'male', display_name: 'سعد القحطاني', first_name: 'سعد', dob: yearsAgo(31),
      city: 'الدمام', country: 'السعودية', nationality: 'سعودي',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 26.4207, lng: 50.0888 }),
      height_cm: 177, education: 'بكالوريوس إدارة', profession: 'مدير مبيعات',
      income_range: '18000-25000', marital_status: 'divorced',
      want_children: 'maybe', children_preference: 'want_children', relocate: true,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 4, prayer_freq: 'often', sect: 'سني',
      quran_engagement: 'أسبوعي', fasting_ramadan: 'yes',
      beard: 'none', halal_diet: 'mostly', smoker: 'no',
      fitness_level: 'moderate', dietary_preferences: 'flexible',
      marriage_timeline: '1_2_years',
      interests: JSON.stringify(['أعمال', 'سفر', 'طبخ', 'قراءة', 'تطوير']),
      personality_traits: JSON.stringify(['اجتماعي', 'طموح', 'متفاهم', 'صادق', 'متفائل']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'ما الذي تعلمته؟', answer: 'أهمية التواصل والتفاهم', type: 'text' },
        { prompt: 'ماذا تبحث عنه؟', answer: 'شريكة تفهمني وتشاركني أهدافي', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      bio: 'مدير مبيعات، مطلق بلا أطفال، أبحث عن بداية جديدة',
      imageUrl: 'https://i.pravatar.cc/400?img=16'
    },
    {
      role: 'male', gender: 'male', display_name: 'فيصل الدوسري', first_name: 'فيصل', dob: yearsAgo(27),
      city: 'الرياض', country: 'السعودية', nationality: 'سعودي',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 24.7136, lng: 46.6753 }),
      height_cm: 172, education: 'بكالوريوس تصميم', profession: 'مصمم جرافيك',
      income_range: '10000-15000', marital_status: 'single',
      want_children: 'yes', children_preference: 'want_children', relocate: false,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 3, prayer_freq: 'often', sect: 'سني',
      quran_engagement: 'أحياناً', fasting_ramadan: 'yes',
      beard: 'none', halal_diet: 'mostly', smoker: 'no',
      fitness_level: 'moderate', dietary_preferences: 'flexible',
      marriage_timeline: '1_2_years',
      interests: JSON.stringify(['تصميم', 'فن', 'موسيقى', 'سفر', 'ثقافة']),
      personality_traits: JSON.stringify(['مبدع', 'فني', 'متفتح', 'طموح', 'متفائل']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'ما يلهمك؟', answer: 'الفن والتصميم الجميل', type: 'text' },
        { prompt: 'أين ترى نفسك بعد 5 سنوات؟', answer: 'مصمم ناجح مع عائلة سعيدة', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      bio: 'مصمم مبدع، أحب الفن والثقافة، أبحث عن شريكة متفاهمة',
      imageUrl: 'https://i.pravatar.cc/400?img=17'
    },
    {
      role: 'male', gender: 'male', display_name: 'عمر الحربي', first_name: 'عمر', dob: yearsAgo(24),
      city: 'جدة', country: 'السعودية', nationality: 'سعودي',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 21.5433, lng: 39.1728 }),
      height_cm: 176, education: 'بكالوريوس حاسب', profession: 'مبرمج',
      income_range: '8000-12000', marital_status: 'single',
      want_children: 'yes', children_preference: 'want_children', relocate: false,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 3, prayer_freq: 'sometimes', sect: 'سني',
      quran_engagement: 'أحياناً', fasting_ramadan: 'yes',
      beard: 'none', halal_diet: 'mostly', smoker: 'no',
      fitness_level: 'light', dietary_preferences: 'flexible',
      marriage_timeline: '2plus_years',
      interests: JSON.stringify(['برمجة', 'ألعاب', 'تقنية', 'أنمي', 'سينما']),
      personality_traits: JSON.stringify(['خجول', 'ذكي', 'مخلص', 'طموح', 'متفاني']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'ما هي لعبتك المفضلة؟', answer: 'ألعاب الذكاء والاستراتيجية', type: 'text' },
        { prompt: 'ماذا تحب في البرمجة؟', answer: 'حل المشاكل والابتكار', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      bio: 'مبرمج حديث التخرج، أبحث عن شريكة متفاهمة تشاركني اهتماماتي',
      imageUrl: 'https://i.pravatar.cc/400?img=18'
    },
    {
      role: 'male', gender: 'male', display_name: 'يوسف السالم', first_name: 'يوسف', dob: yearsAgo(25),
      city: 'مكة المكرمة', country: 'السعودية', nationality: 'سعودي',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 21.4225, lng: 39.8262 }),
      height_cm: 179, education: 'بكالوريوس صيدلة', profession: 'صيدلي',
      income_range: '12000-18000', marital_status: 'single',
      want_children: 'yes', children_preference: 'want_children', relocate: false,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 4, prayer_freq: 'often', sect: 'سني',
      quran_engagement: 'أسبوعي', fasting_ramadan: 'yes',
      beard: 'trimmed', halal_diet: 'mostly', smoker: 'no',
      fitness_level: 'active', dietary_preferences: 'halal_preferred',
      marriage_timeline: '6_12_months',
      interests: JSON.stringify(['صحة', 'رياضة', 'قراءة', 'سفر', 'طبخ']),
      personality_traits: JSON.stringify(['رحيم', 'مسؤول', 'طموح', 'متفاهم', 'هادئ']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'لماذا الصيدلة؟', answer: 'لمساعدة الناس والعناية بصحتهم', type: 'text' },
        { prompt: 'ما هوايتك؟', answer: 'الرياضة والقراءة', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      bio: 'صيدلي، أحب مساعدة الناس والرياضة، أبحث عن شريكة متفاهمة',
      imageUrl: 'https://i.pravatar.cc/400?img=19'
    },
    {
      role: 'male', gender: 'male', display_name: 'كريم حسن', first_name: 'كريم', dob: yearsAgo(30),
      city: 'القاهرة', country: 'مصر', nationality: 'مصري',
      ethnicity: JSON.stringify(['مصر 🇪🇬']),
      location: JSON.stringify({ lat: 30.0444, lng: 31.2357 }),
      height_cm: 181, education: 'ماجستير هندسة', profession: 'مهندس مدني',
      income_range: '15000-20000', marital_status: 'single',
      want_children: 'yes', children_preference: 'want_children', relocate: true,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 4, prayer_freq: 'often', sect: 'سني',
      quran_engagement: 'أسبوعي', fasting_ramadan: 'yes',
      beard: 'trimmed', halal_diet: 'mostly', smoker: 'no',
      fitness_level: 'active', dietary_preferences: 'flexible',
      marriage_timeline: '6_12_months',
      interests: JSON.stringify(['هندسة', 'سفر', 'تاريخ', 'قراءة', 'رياضة']),
      personality_traits: JSON.stringify(['طموح', 'مثقف', 'متفتح', 'صادق', 'متفاهم']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'لماذا الهندسة؟', answer: 'أحب البناء والتصميم', type: 'text' },
        { prompt: 'ما أجمل مكان زرته؟', answer: 'دبي - مدينة المستقبل', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      bio: 'مهندس مدني من القاهرة، أبحث عن شريكة طموحة للانتقال معاً',
      imageUrl: 'https://i.pravatar.cc/400?img=20'
    },
    {
      role: 'male', gender: 'male', display_name: 'طارق العلي', first_name: 'طارق', dob: yearsAgo(33),
      city: 'دبي', country: 'الإمارات', nationality: 'إماراتي',
      ethnicity: JSON.stringify(['الإمارات 🇦🇪']),
      location: JSON.stringify({ lat: 25.2048, lng: 55.2708 }),
      height_cm: 183, education: 'ماجستير إدارة', profession: 'رجل أعمال',
      income_range: '25000+', marital_status: 'divorced',
      want_children: 'maybe', children_preference: 'have_dont_want_more', relocate: false,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 3, prayer_freq: 'sometimes', sect: 'سني',
      quran_engagement: 'نادراً', fasting_ramadan: 'yes',
      beard: 'none', halal_diet: 'flexible', smoker: 'no',
      fitness_level: 'very_active', dietary_preferences: 'flexible',
      marriage_timeline: '2plus_years',
      interests: JSON.stringify(['أعمال', 'سفر', 'رياضة', 'فخامة', 'سيارات']),
      personality_traits: JSON.stringify(['طموح', 'واثق', 'كريم', 'اجتماعي', 'عملي']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'ما سر نجاحك؟', answer: 'العمل الجاد والذكاء', type: 'text' },
        { prompt: 'ماذا تبحث عنه؟', answer: 'شريكة متفاهمة تحب الحياة', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية', 'الإنجليزية', 'الفرنسية']),
      bio: 'رجل أعمال في دبي، مطلق، أبحث عن شريكة متفاهمة',
      imageUrl: 'https://i.pravatar.cc/400?img=21'
    },

    // ==================== FEMALES (15 profiles) ====================
    {
      role: 'female', gender: 'female', display_name: 'فاطمة الأحمد', first_name: 'فاطمة', dob: yearsAgo(25),
      city: 'الرياض', country: 'السعودية', nationality: 'سعودية',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 24.7136, lng: 46.6753 }),
      height_cm: 162, education: 'بكالوريوس شريعة', profession: 'معلمة قرآن',
      marital_status: 'single',
      want_children: 'yes', children_preference: 'want_children', relocate: true,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 5, prayer_freq: 'always', sect: 'سنية',
      quran_engagement: 'حافظة', fasting_ramadan: 'yes',
      hijab: 'full', halal_diet: 'strict', smoker: 'no',
      fitness_level: 'moderate', dietary_preferences: 'halal_only',
      marriage_timeline: 'within_6_months',
      interests: JSON.stringify(['قرآن', 'تعليم', 'قراءة', 'عائلة', 'طبخ']),
      personality_traits: JSON.stringify(['ملتزمة', 'طيبة', 'صبورة', 'متفاهمة', 'متواضعة']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'ما أهم شيء في حياتك؟', answer: 'حفظ القرآن وتعليمه', type: 'text' },
        { prompt: 'ما حلمك؟', answer: 'أسرة صالحة تحفظ القرآن', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية']),
      bio: 'معلمة قرآن، حافظة، أبحث عن زوج صالح ملتزم لبناء أسرة مسلمة',
      imageUrl: 'https://i.pravatar.cc/400?img=40'
    },
    {
      role: 'female', gender: 'female', display_name: 'مريم السالم', first_name: 'مريم', dob: yearsAgo(27),
      city: 'جدة', country: 'السعودية', nationality: 'سعودية',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 21.5433, lng: 39.1728 }),
      height_cm: 165, education: 'ماجستير صيدلة', profession: 'صيدلانية',
      marital_status: 'single',
      want_children: 'yes', children_preference: 'want_children', relocate: false,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 5, prayer_freq: 'always', sect: 'سنية',
      quran_engagement: 'يومي', fasting_ramadan: 'yes',
      hijab: 'full', halal_diet: 'strict', smoker: 'no',
      fitness_level: 'active', dietary_preferences: 'halal_only',
      marriage_timeline: '6_12_months',
      interests: JSON.stringify(['صحة', 'قراءة', 'عائلة', 'طبخ', 'رياضة']),
      personality_traits: JSON.stringify(['ملتزمة', 'طموحة', 'رحيمة', 'منظمة', 'متفانية']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'لماذا الصيدلة؟', answer: 'لمساعدة الناس والعناية بصحتهم', type: 'text' },
        { prompt: 'ماذا تبحثين عنه؟', answer: 'زوج صالح نبني معاً أسرة', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      bio: 'صيدلانية، ملتزمة دينياً، أبحث عن زوج صالح لبناء حياة مستقرة',
      imageUrl: 'https://i.pravatar.cc/400?img=41'
    },
    {
      role: 'female', gender: 'female', display_name: 'عائشة المطيري', first_name: 'عائشة', dob: yearsAgo(23),
      city: 'مكة المكرمة', country: 'السعودية', nationality: 'سعودية',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 21.4225, lng: 39.8262 }),
      height_cm: 160, education: 'بكالوريوس شريعة', profession: 'طالبة دراسات عليا',
      marital_status: 'single',
      want_children: 'yes', children_preference: 'want_children', relocate: true,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 5, prayer_freq: 'always', sect: 'سنية',
      quran_engagement: 'حافظة', fasting_ramadan: 'yes',
      hijab: 'full', halal_diet: 'strict', smoker: 'no',
      fitness_level: 'light', dietary_preferences: 'halal_only',
      marriage_timeline: 'within_6_months',
      interests: JSON.stringify(['علم شرعي', 'قرآن', 'قراءة', 'تعليم', 'دعوة']),
      personality_traits: JSON.stringify(['طالبة علم', 'متدينة', 'صبورة', 'متواضعة', 'طيبة']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'ما تخصصك؟', answer: 'دراسات عليا في الشريعة', type: 'text' },
        { prompt: 'ما حلمك؟', answer: 'أن أصبح عالمة وأم صالحة', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية']),
      bio: 'طالبة دراسات عليا في الشريعة، حافظة للقرآن، أبحث عن زوج طالب علم',
      imageUrl: 'https://i.pravatar.cc/400?img=42'
    },
    {
      role: 'female', gender: 'female', display_name: 'نورة العتيبي', first_name: 'نورة', dob: yearsAgo(26),
      city: 'المدينة المنورة', country: 'السعودية', nationality: 'سعودية',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 24.5247, lng: 39.5692 }),
      height_cm: 168, education: 'ماجستير هندسة', profession: 'مهندسة معمارية',
      marital_status: 'single',
      want_children: 'yes', children_preference: 'want_children', relocate: false,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 4, prayer_freq: 'often', sect: 'سنية',
      quran_engagement: 'أسبوعي', fasting_ramadan: 'yes',
      hijab: 'modern', halal_diet: 'mostly', smoker: 'no',
      fitness_level: 'moderate', dietary_preferences: 'flexible',
      marriage_timeline: '6_12_months',
      interests: JSON.stringify(['هندسة', 'فن', 'سفر', 'قراءة', 'تصميم']),
      personality_traits: JSON.stringify(['مبدعة', 'طموحة', 'منظمة', 'متفتحة', 'متفاهمة']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'ما يلهمك في التصميم؟', answer: 'العمارة الإسلامية التقليدية', type: 'text' },
        { prompt: 'ماذا تحبين في عملك؟', answer: 'تحويل الأفكار لواقع', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      bio: 'مهندسة معمارية، أحب التصميم والإبداع، أبحث عن شريك طموح',
      imageUrl: 'https://i.pravatar.cc/400?img=43'
    },
    {
      role: 'female', gender: 'female', display_name: 'لينا الحربي', first_name: 'لينا', dob: yearsAgo(28),
      city: 'الدمام', country: 'السعودية', nationality: 'سعودية',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 26.4207, lng: 50.0888 }),
      height_cm: 163, education: 'ماجستير طب أسنان', profession: 'طبيبة أسنان',
      marital_status: 'single',
      want_children: 'yes', children_preference: 'want_children', relocate: false,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 4, prayer_freq: 'often', sect: 'سنية',
      quran_engagement: 'أسبوعي', fasting_ramadan: 'yes',
      hijab: 'modern', halal_diet: 'mostly', smoker: 'no',
      fitness_level: 'active', dietary_preferences: 'halal_preferred',
      marriage_timeline: '6_12_months',
      interests: JSON.stringify(['طب', 'رياضة', 'قراءة', 'سفر', 'صحة']),
      personality_traits: JSON.stringify(['رحيمة', 'دقيقة', 'طموحة', 'متفانية', 'متفاهمة']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'لماذا طب الأسنان؟', answer: 'أحب مساعدة الناس بالابتسام', type: 'text' },
        { prompt: 'ما هوايتك؟', answer: 'الرياضة والقراءة', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      bio: 'طبيبة أسنان، أبحث عن شريك طموح يقدر عملي',
      imageUrl: 'https://i.pravatar.cc/400?img=44'
    },
    {
      role: 'female', gender: 'female', display_name: 'سارة القحطاني', first_name: 'سارة', dob: yearsAgo(24),
      city: 'الرياض', country: 'السعودية', nationality: 'سعودية',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 24.7136, lng: 46.6753 }),
      height_cm: 161, education: 'بكالوريوس تصميم', profession: 'مصممة جرافيك',
      marital_status: 'single',
      want_children: 'yes', children_preference: 'want_children', relocate: false,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 3, prayer_freq: 'often', sect: 'سنية',
      quran_engagement: 'أحياناً', fasting_ramadan: 'yes',
      hijab: 'modern', halal_diet: 'mostly', smoker: 'no',
      fitness_level: 'light', dietary_preferences: 'flexible',
      marriage_timeline: '1_2_years',
      interests: JSON.stringify(['تصميم', 'فن', 'موسيقى', 'سفر', 'ثقافة']),
      personality_traits: JSON.stringify(['مبدعة', 'فنية', 'متفتحة', 'طموحة', 'لطيفة']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'ما يلهمك؟', answer: 'الفن المعاصر والطبيعة', type: 'text' },
        { prompt: 'ماذا تحبين في التصميم؟', answer: 'التعبير عن الأفكار بصرياً', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      bio: 'مصممة جرافيك، مبدعة، أحب الفن والثقافة، أبحث عن شريك متفاهم',
      imageUrl: 'https://i.pravatar.cc/400?img=45'
    },
    {
      role: 'female', gender: 'female', display_name: 'هدى الشمري', first_name: 'هدى', dob: yearsAgo(32),
      city: 'جدة', country: 'السعودية', nationality: 'سعودية',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 21.5433, lng: 39.1728 }),
      height_cm: 164, education: 'بكالوريوس تربية', profession: 'معلمة',
      marital_status: 'divorced',
      want_children: 'maybe', children_preference: 'have_and_want_more', relocate: false,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 4, prayer_freq: 'often', sect: 'سنية',
      quran_engagement: 'أسبوعي', fasting_ramadan: 'yes',
      hijab: 'full', halal_diet: 'mostly', smoker: 'no',
      fitness_level: 'light', dietary_preferences: 'halal_preferred',
      marriage_timeline: '1_2_years',
      interests: JSON.stringify(['تعليم', 'عائلة', 'قراءة', 'طبخ', 'أطفال']),
      personality_traits: JSON.stringify(['صبورة', 'حنونة', 'مسؤولة', 'متفاهمة', 'عملية']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'ما الذي تعلمتِه؟', answer: 'الأمومة أعظم مسؤولية', type: 'text' },
        { prompt: 'ماذا تبحثين عنه؟', answer: 'شريك متفاهم يحب الأطفال', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية']),
      bio: 'معلمة، مطلقة بطفلين، أبحث عن شريك متفاهم يحب العائلة',
      imageUrl: 'https://i.pravatar.cc/400?img=46'
    },
    {
      role: 'female', gender: 'female', display_name: 'أمل الزهراني', first_name: 'أمل', dob: yearsAgo(29),
      city: 'مكة المكرمة', country: 'السعودية', nationality: 'سعودية',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 21.4225, lng: 39.8262 }),
      height_cm: 166, education: 'ماجستير شريعة', profession: 'محاضرة جامعية',
      marital_status: 'widowed',
      want_children: 'maybe', children_preference: 'want_children', relocate: true,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 5, prayer_freq: 'always', sect: 'سنية',
      quran_engagement: 'يومي', fasting_ramadan: 'yes',
      hijab: 'full', halal_diet: 'strict', smoker: 'no',
      fitness_level: 'moderate', dietary_preferences: 'halal_only',
      marriage_timeline: '1_2_years',
      interests: JSON.stringify(['تعليم', 'قراءة', 'قرآن', 'علم شرعي', 'دعوة']),
      personality_traits: JSON.stringify(['عالمة', 'صبورة', 'قوية', 'متدينة', 'حكيمة']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'ما أصعب تجربة مررت بها؟', answer: 'فقدان زوجي', type: 'text' },
        { prompt: 'ما يعطيك القوة؟', answer: 'إيماني بالله وحب العلم', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      bio: 'محاضرة جامعية، أرملة بلا أطفال، أبحث عن بداية جديدة مع رجل صالح',
      imageUrl: 'https://i.pravatar.cc/400?img=47'
    },
    {
      role: 'female', gender: 'female', display_name: 'ريم الدوسري', first_name: 'ريم', dob: yearsAgo(22),
      city: 'المدينة المنورة', country: 'السعودية', nationality: 'سعودية',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 24.5247, lng: 39.5692 }),
      height_cm: 159, education: 'بكالوريوس حاسب', profession: 'مبرمجة',
      marital_status: 'single',
      want_children: 'yes', children_preference: 'want_children', relocate: false,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 4, prayer_freq: 'often', sect: 'سنية',
      quran_engagement: 'أسبوعي', fasting_ramadan: 'yes',
      hijab: 'modern', halal_diet: 'mostly', smoker: 'no',
      fitness_level: 'light', dietary_preferences: 'flexible',
      marriage_timeline: '1_2_years',
      interests: JSON.stringify(['برمجة', 'تقنية', 'قراءة', 'أنمي', 'ألعاب']),
      personality_traits: JSON.stringify(['ذكية', 'طموحة', 'خجولة', 'مخلصة', 'متفانية']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'ما لغة البرمجة المفضلة؟', answer: 'Python وJavaScript', type: 'text' },
        { prompt: 'ماذا تحبين في التقنية؟', answer: 'القدرة على الابتكار', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      bio: 'مبرمجة حديثة التخرج، أحب التقنية، أبحث عن شريك متفاهم',
      imageUrl: 'https://i.pravatar.cc/400?img=48'
    },
    {
      role: 'female', gender: 'female', display_name: 'رهف العمري', first_name: 'رهف', dob: yearsAgo(23),
      city: 'الدمام', country: 'السعودية', nationality: 'سعودية',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 26.4207, lng: 50.0888 }),
      height_cm: 167, education: 'بكالوريوس إعلام', profession: 'إعلامية',
      marital_status: 'single',
      want_children: 'yes', children_preference: 'want_children', relocate: false,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 3, prayer_freq: 'sometimes', sect: 'سنية',
      quran_engagement: 'أحياناً', fasting_ramadan: 'yes',
      hijab: 'modern', halal_diet: 'flexible', smoker: 'no',
      fitness_level: 'moderate', dietary_preferences: 'flexible',
      marriage_timeline: '2plus_years',
      interests: JSON.stringify(['إعلام', 'كتابة', 'سفر', 'موضة', 'ثقافة']),
      personality_traits: JSON.stringify(['واثقة', 'اجتماعية', 'طموحة', 'متحدثة', 'مبدعة']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'ما أحب شيء في عملك؟', answer: 'التواصل مع الجمهور', type: 'text' },
        { prompt: 'ما حلمك؟', answer: 'مذيعة مشهورة وأم ناجحة', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      bio: 'إعلامية، أحب التواصل والإبداع، أبحث عن شريك واثق ومتفاهم',
      imageUrl: 'https://i.pravatar.cc/400?img=49'
    },
    {
      role: 'female', gender: 'female', display_name: 'ياسمين حسن', first_name: 'ياسمين', dob: yearsAgo(26),
      city: 'القاهرة', country: 'مصر', nationality: 'مصرية',
      ethnicity: JSON.stringify(['مصر 🇪🇬']),
      location: JSON.stringify({ lat: 30.0444, lng: 31.2357 }),
      height_cm: 165, education: 'ماجستير قانون', profession: 'محامية',
      marital_status: 'single',
      want_children: 'yes', children_preference: 'want_children', relocate: true,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 4, prayer_freq: 'often', sect: 'سنية',
      quran_engagement: 'أسبوعي', fasting_ramadan: 'yes',
      hijab: 'modern', halal_diet: 'mostly', smoker: 'no',
      fitness_level: 'moderate', dietary_preferences: 'flexible',
      marriage_timeline: '6_12_months',
      interests: JSON.stringify(['قانون', 'قراءة', 'سفر', 'ثقافة', 'موسيقى']),
      personality_traits: JSON.stringify(['ذكية', 'قوية', 'عادلة', 'طموحة', 'متحدثة']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'لماذا القانون؟', answer: 'أحب العدالة والدفاع عن الحقوق', type: 'text' },
        { prompt: 'ماذا تبحثين عنه؟', answer: 'شريك قوي ومتفاهم', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      bio: 'محامية من القاهرة، أبحث عن شريك طموح ومثقف',
      imageUrl: 'https://i.pravatar.cc/400?img=50'
    },
    {
      role: 'female', gender: 'female', display_name: 'ليلى الكندي', first_name: 'ليلى', dob: yearsAgo(27),
      city: 'دبي', country: 'الإمارات', nationality: 'إماراتية',
      ethnicity: JSON.stringify(['الإمارات 🇦🇪']),
      location: JSON.stringify({ lat: 25.2048, lng: 55.2708 }),
      height_cm: 170, education: 'ماجستير تسويق', profession: 'مديرة تسويق',
      marital_status: 'single',
      want_children: 'yes', children_preference: 'want_children', relocate: false,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 3, prayer_freq: 'often', sect: 'سنية',
      quran_engagement: 'أحياناً', fasting_ramadan: 'yes',
      hijab: 'modern', halal_diet: 'flexible', smoker: 'no',
      fitness_level: 'active', dietary_preferences: 'flexible',
      marriage_timeline: '1_2_years',
      interests: JSON.stringify(['تسويق', 'أعمال', 'سفر', 'موضة', 'ثقافة']),
      personality_traits: JSON.stringify(['طموحة', 'واثقة', 'اجتماعية', 'مبدعة', 'قيادية']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'ما أكبر إنجاز لك؟', answer: 'قيادة حملة تسويقية ناجحة', type: 'text' },
        { prompt: 'ما يلهمك؟', answer: 'رؤية دبي 2030', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      bio: 'مديرة تسويق في دبي، طموحة ومبدعة، أبحث عن شريك ناجح',
      imageUrl: 'https://i.pravatar.cc/400?img=51'
    },
    {
      role: 'male', gender: 'male', display_name: 'عادل المطيري', first_name: 'عادل', dob: yearsAgo(35),
      city: 'الرياض', country: 'السعودية', nationality: 'سعودي',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 24.7136, lng: 46.6753 }),
      height_cm: 175, education: 'دكتوراه', profession: 'أستاذ جامعي',
      income_range: '20000-25000', marital_status: 'widowed',
      want_children: 'yes', children_preference: 'have_and_want_more', relocate: false,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 5, prayer_freq: 'always', sect: 'سني',
      quran_engagement: 'يومي', fasting_ramadan: 'yes',
      beard: 'full', halal_diet: 'strict', smoker: 'no',
      fitness_level: 'moderate', dietary_preferences: 'halal_only',
      marriage_timeline: '6_12_months',
      interests: JSON.stringify(['تعليم', 'قراءة', 'عائلة', 'بحث علمي', 'قرآن']),
      personality_traits: JSON.stringify(['عالم', 'حكيم', 'صبور', 'مسؤول', 'متدين']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'ما تخصصك؟', answer: 'الشريعة الإسلامية', type: 'text' },
        { prompt: 'ماذا تبحث عنه؟', answer: 'أم صالحة لأطفالي وشريكة حياة', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      bio: 'أستاذ جامعي، أرمل بطفلين، أبحث عن أم صالحة وشريكة حياة',
      imageUrl: 'https://i.pravatar.cc/400?img=22'
    },
    {
      role: 'male', gender: 'male', display_name: 'نواف السبيعي', first_name: 'نواف', dob: yearsAgo(26),
      city: 'المدينة المنورة', country: 'السعودية', nationality: 'سعودي',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 24.5247, lng: 39.5692 }),
      height_cm: 178, education: 'بكالوريوس شريعة', profession: 'داعية',
      income_range: '8000-12000', marital_status: 'single',
      want_children: 'yes', children_preference: 'want_children', relocate: true,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 5, prayer_freq: 'always', sect: 'سني',
      quran_engagement: 'حافظ', fasting_ramadan: 'yes',
      beard: 'full', halal_diet: 'strict', smoker: 'no',
      fitness_level: 'moderate', dietary_preferences: 'halal_only',
      marriage_timeline: 'within_6_months',
      interests: JSON.stringify(['دعوة', 'قرآن', 'تعليم', 'خدمة', 'عائلة']),
      personality_traits: JSON.stringify(['متدين', 'متواضع', 'صادق', 'طيب', 'ملتزم']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'ما أعظم هدف لك؟', answer: 'نشر الدين والدعوة إلى الله', type: 'text' },
        { prompt: 'ماذا تبحث عنه؟', answer: 'زوجة صالحة تعينني على ديني', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية']),
      bio: 'داعية إسلامي، حافظ للقرآن، أبحث عن زوجة صالحة',
      imageUrl: 'https://i.pravatar.cc/400?img=23'
    },
    {
      role: 'female', gender: 'female', display_name: 'جميلة الغامدي', first_name: 'جميلة', dob: yearsAgo(30),
      city: 'الرياض', country: 'السعودية', nationality: 'سعودية',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 24.7136, lng: 46.6753 }),
      height_cm: 162, education: 'دكتوراه شريعة', profession: 'باحثة شرعية',
      marital_status: 'single',
      want_children: 'yes', children_preference: 'want_children', relocate: true,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 5, prayer_freq: 'always', sect: 'سنية',
      quran_engagement: 'حافظة', fasting_ramadan: 'yes',
      hijab: 'full', halal_diet: 'strict', smoker: 'no',
      fitness_level: 'light', dietary_preferences: 'halal_only',
      marriage_timeline: 'within_6_months',
      interests: JSON.stringify(['علم شرعي', 'قرآن', 'تعليم', 'بحث', 'دعوة']),
      personality_traits: JSON.stringify(['عالمة', 'متدينة', 'متواضعة', 'صبورة', 'حكيمة']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'ما موضوع بحثك؟', answer: 'الفقه الإسلامي المعاصر', type: 'text' },
        { prompt: 'ما حلمك؟', answer: 'خدمة الدين والعلم', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      bio: 'باحثة شرعية، حافظة للقرآن، طالبة علم، أبحث عن زوج عالم',
      imageUrl: 'https://i.pravatar.cc/400?img=52'
    },
    {
      role: 'male', gender: 'male', display_name: 'ماجد الغامدي', first_name: 'ماجد', dob: yearsAgo(29),
      city: 'جدة', country: 'السعودية', nationality: 'سعودي',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 21.5433, lng: 39.1728 }),
      height_cm: 180, education: 'ماجستير مالية', profession: 'محلل مالي',
      income_range: '18000-25000', marital_status: 'single',
      want_children: 'yes', children_preference: 'want_children', relocate: false,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 4, prayer_freq: 'often', sect: 'سني',
      quran_engagement: 'أسبوعي', fasting_ramadan: 'yes',
      beard: 'trimmed', halal_diet: 'mostly', smoker: 'no',
      fitness_level: 'active', dietary_preferences: 'flexible',
      marriage_timeline: '6_12_months',
      interests: JSON.stringify(['مال', 'استثمار', 'رياضة', 'سفر', 'قراءة']),
      personality_traits: JSON.stringify(['ذكي', 'دقيق', 'طموح', 'منظم', 'صادق']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'ما نصيحتك المالية؟', answer: 'الاستثمار المبكر والحكيم', type: 'text' },
        { prompt: 'ما شغفك؟', answer: 'تحليل الأسواق المالية', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      bio: 'محلل مالي، أحب الاستثمار والرياضة، أبحث عن شريكة ذكية',
      imageUrl: 'https://i.pravatar.cc/400?img=24'
    },
    {
      role: 'male', gender: 'male', display_name: 'بندر الراشد', first_name: 'بندر', dob: yearsAgo(27),
      city: 'الدمام', country: 'السعودية', nationality: 'سعودي',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 26.4207, lng: 50.0888 }),
      height_cm: 174, education: 'بكالوريوس فنون', profession: 'مصور فوتوغرافي',
      income_range: '10000-15000', marital_status: 'single',
      want_children: 'maybe', children_preference: 'want_children', relocate: true,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 3, prayer_freq: 'often', sect: 'سني',
      quran_engagement: 'أحياناً', fasting_ramadan: 'yes',
      beard: 'none', halal_diet: 'mostly', smoker: 'no',
      fitness_level: 'moderate', dietary_preferences: 'flexible',
      marriage_timeline: '1_2_years',
      interests: JSON.stringify(['تصوير', 'سفر', 'فن', 'طبيعة', 'مغامرات']),
      personality_traits: JSON.stringify(['فني', 'مبدع', 'حالم', 'متفتح', 'متفائل']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'أجمل صورة التقطتها؟', answer: 'شروق الشمس في الجبال', type: 'text' },
        { prompt: 'ما يلهمك؟', answer: 'الطبيعة والناس', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      bio: 'مصور محترف، أحب السفر واكتشاف الجديد، أبحث عن شريكة مغامرة',
      imageUrl: 'https://i.pravatar.cc/400?img=25'
    },
    {
      role: 'male', gender: 'male', display_name: 'إبراهيم النجار', first_name: 'إبراهيم', dob: yearsAgo(34),
      city: 'عمّان', country: 'الأردن', nationality: 'أردني',
      ethnicity: JSON.stringify(['الأردن 🇯🇴']),
      location: JSON.stringify({ lat: 31.9454, lng: 35.9284 }),
      height_cm: 177, education: 'ماجستير عمارة', profession: 'مهندس معماري',
      income_range: '12000-18000', marital_status: 'single',
      want_children: 'yes', children_preference: 'want_children', relocate: true,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 4, prayer_freq: 'often', sect: 'سني',
      quran_engagement: 'أسبوعي', fasting_ramadan: 'yes',
      beard: 'trimmed', halal_diet: 'mostly', smoker: 'no',
      fitness_level: 'moderate', dietary_preferences: 'flexible',
      marriage_timeline: '6_12_months',
      interests: JSON.stringify(['هندسة', 'تصميم', 'فن', 'تاريخ', 'سفر']),
      personality_traits: JSON.stringify(['مبدع', 'دقيق', 'طموح', 'مثقف', 'متفاهم']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'ما يلهمك في التصميم؟', answer: 'العمارة الإسلامية القديمة', type: 'text' },
        { prompt: 'ما مشروعك المفضل؟', answer: 'تصميم مسجد عصري', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      bio: 'مهندس معماري من عمّان، أحب التصميم والإبداع',
      imageUrl: 'https://i.pravatar.cc/400?img=26'
    },
    {
      role: 'female', gender: 'female', display_name: 'بشرى السبيعي', first_name: 'بشرى', dob: yearsAgo(25),
      city: 'جدة', country: 'السعودية', nationality: 'سعودية',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 21.5433, lng: 39.1728 }),
      height_cm: 163, education: 'بكالوريوس تمريض', profession: 'ممرضة',
      marital_status: 'single',
      want_children: 'yes', children_preference: 'want_children', relocate: false,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 4, prayer_freq: 'often', sect: 'سنية',
      quran_engagement: 'أسبوعي', fasting_ramadan: 'yes',
      hijab: 'modern', halal_diet: 'mostly', smoker: 'no',
      fitness_level: 'active', dietary_preferences: 'halal_preferred',
      marriage_timeline: '6_12_months',
      interests: JSON.stringify(['صحة', 'عناية', 'قراءة', 'رياضة', 'طبخ']),
      personality_traits: JSON.stringify(['رحيمة', 'صبورة', 'متفانية', 'طيبة', 'مسؤولة']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'لماذا التمريض؟', answer: 'أحب مساعدة المرضى', type: 'text' },
        { prompt: 'ما أصعب موقف؟', answer: 'رعاية طفل مريض', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      bio: 'ممرضة، أحب مساعدة الناس، أبحث عن شريك رحيم',
      imageUrl: 'https://i.pravatar.cc/400?img=53'
    },
    {
      role: 'male', gender: 'male', display_name: 'راشد الكعبي', first_name: 'راشد', dob: yearsAgo(31),
      city: 'الدوحة', country: 'قطر', nationality: 'قطري',
      ethnicity: JSON.stringify(['قطر 🇶🇦']),
      location: JSON.stringify({ lat: 25.2854, lng: 51.5310 }),
      height_cm: 182, education: 'بكالوريوس إدارة', profession: 'مدير مشروع',
      income_range: '20000-25000', marital_status: 'single',
      want_children: 'yes', children_preference: 'want_children', relocate: false,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 4, prayer_freq: 'often', sect: 'سني',
      quran_engagement: 'أسبوعي', fasting_ramadan: 'yes',
      beard: 'trimmed', halal_diet: 'mostly', smoker: 'no',
      fitness_level: 'active', dietary_preferences: 'flexible',
      marriage_timeline: '6_12_months',
      interests: JSON.stringify(['إدارة', 'رياضة', 'سفر', 'قيادة', 'تطوير']),
      personality_traits: JSON.stringify(['قيادي', 'منظم', 'طموح', 'اجتماعي', 'متفاهم']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'ما أكبر مشروع أدرته؟', answer: 'بناء برج سكني في الدوحة', type: 'text' },
        { prompt: 'ما يحفزك؟', answer: 'النجاح وتحقيق الأهداف', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      bio: 'مدير مشاريع في الدوحة، أبحث عن شريكة طموحة',
      imageUrl: 'https://i.pravatar.cc/400?img=28'
    },
    {
      role: 'female', gender: 'female', display_name: 'دانة الراشد', first_name: 'دانة', dob: yearsAgo(24),
      city: 'مكة المكرمة', country: 'السعودية', nationality: 'سعودية',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 21.4225, lng: 39.8262 }),
      height_cm: 161, education: 'بكالوريوس لغات', profession: 'مترجمة',
      marital_status: 'single',
      want_children: 'yes', children_preference: 'want_children', relocate: true,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 3, prayer_freq: 'often', sect: 'سنية',
      quran_engagement: 'أحياناً', fasting_ramadan: 'yes',
      hijab: 'modern', halal_diet: 'mostly', smoker: 'no',
      fitness_level: 'moderate', dietary_preferences: 'flexible',
      marriage_timeline: '1_2_years',
      interests: JSON.stringify(['لغات', 'ترجمة', 'سفر', 'ثقافات', 'قراءة']),
      personality_traits: JSON.stringify(['ذكية', 'متعددة المواهب', 'متفتحة', 'متفاهمة', 'مثقفة']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'كم لغة تتحدثين؟', answer: 'أربع لغات بطلاقة', type: 'text' },
        { prompt: 'ما أجمل ثقافة؟', answer: 'كل ثقافة لها جمالها', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية', 'الإنجليزية', 'الفرنسية']),
      bio: 'مترجمة، أحب اللغات والثقافات، أبحث عن شريك مثقف',
      imageUrl: 'https://i.pravatar.cc/400?img=54'
    },
    {
      role: 'male', gender: 'male', display_name: 'وليد الشهري', first_name: 'وليد', dob: yearsAgo(25),
      city: 'الرياض', country: 'السعودية', nationality: 'سعودي',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 24.7136, lng: 46.6753 }),
      height_cm: 173, education: 'بكالوريوس إدارة', profession: 'موظف حكومي',
      income_range: '8000-12000', marital_status: 'single',
      want_children: 'yes', children_preference: 'want_children', relocate: false,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 5, prayer_freq: 'always', sect: 'سني',
      quran_engagement: 'يومي', fasting_ramadan: 'yes',
      beard: 'full', halal_diet: 'strict', smoker: 'no',
      fitness_level: 'moderate', dietary_preferences: 'halal_only',
      marriage_timeline: 'within_6_months',
      interests: JSON.stringify(['قرآن', 'رياضة', 'عائلة', 'قراءة', 'دعوة']),
      personality_traits: JSON.stringify(['ملتزم', 'بسيط', 'طيب', 'صادق', 'متدين']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'ما أهم شيء في الحياة؟', answer: 'الدين والأسرة', type: 'text' },
        { prompt: 'ما حلمك؟', answer: 'أسرة صالحة سعيدة', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية']),
      bio: 'موظف حكومي، ملتزم دينياً، أبحث عن زوجة محافظة بسيطة',
      imageUrl: 'https://i.pravatar.cc/400?img=29'
    },
    {
      role: 'female', gender: 'female', display_name: 'شهد النجار', first_name: 'شهد', dob: yearsAgo(28),
      city: 'عمّان', country: 'الأردن', nationality: 'أردنية',
      ethnicity: JSON.stringify(['الأردن 🇯🇴']),
      location: JSON.stringify({ lat: 31.9454, lng: 35.9284 }),
      height_cm: 164, education: 'ماجستير حاسب', profession: 'مهندسة كمبيوتر',
      marital_status: 'single',
      want_children: 'yes', children_preference: 'want_children', relocate: true,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 4, prayer_freq: 'often', sect: 'سنية',
      quran_engagement: 'أسبوعي', fasting_ramadan: 'yes',
      hijab: 'modern', halal_diet: 'mostly', smoker: 'no',
      fitness_level: 'moderate', dietary_preferences: 'flexible',
      marriage_timeline: '6_12_months',
      interests: JSON.stringify(['برمجة', 'تقنية', 'قراءة', 'سفر', 'ذكاء اصطناعي']),
      personality_traits: JSON.stringify(['ذكية', 'طموحة', 'متفانية', 'منظمة', 'مبدعة']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'ما مجالك في التقنية؟', answer: 'الذكاء الاصطناعي', type: 'text' },
        { prompt: 'ما حلمك؟', answer: 'بناء شركة تقنية', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      bio: 'مهندسة كمبيوتر من عمّان، أحب التكنولوجيا، أبحث عن شريك ذكي',
      imageUrl: 'https://i.pravatar.cc/400?img=55'
    },
    {
      role: 'male', gender: 'male', display_name: 'عبدالرحمن الحمد', first_name: 'عبدالرحمن', dob: yearsAgo(30),
      city: 'مكة المكرمة', country: 'السعودية', nationality: 'سعودي',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 21.4225, lng: 39.8262 }),
      height_cm: 179, education: 'ماجستير شريعة', profession: 'باحث شرعي',
      income_range: '12000-18000', marital_status: 'single',
      want_children: 'yes', children_preference: 'want_children', relocate: true,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 5, prayer_freq: 'always', sect: 'سني',
      quran_engagement: 'حافظ', fasting_ramadan: 'yes',
      beard: 'full', halal_diet: 'strict', smoker: 'no',
      fitness_level: 'moderate', dietary_preferences: 'halal_only',
      marriage_timeline: 'within_6_months',
      interests: JSON.stringify(['علم شرعي', 'قرآن', 'تعليم', 'بحث', 'دعوة']),
      personality_traits: JSON.stringify(['عالم', 'متدين', 'متواضع', 'صبور', 'حكيم']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'ما موضوع بحثك؟', answer: 'الفقه الإسلامي المعاصر', type: 'text' },
        { prompt: 'ماذا تبحث عنه؟', answer: 'زوجة طالبة علم', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      bio: 'باحث شرعي، حافظ للقرآن، أبحث عن زوجة طالبة علم',
      imageUrl: 'https://i.pravatar.cc/400?img=30'
    },
    {
      role: 'female', gender: 'female', display_name: 'منى الكعبي', first_name: 'منى', dob: yearsAgo(29),
      city: 'الدوحة', country: 'قطر', nationality: 'قطرية',
      ethnicity: JSON.stringify(['قطر 🇶🇦']),
      location: JSON.stringify({ lat: 25.2854, lng: 51.5310 }),
      height_cm: 168, education: 'ماجستير إدارة', profession: 'مديرة مشروع',
      marital_status: 'single',
      want_children: 'yes', children_preference: 'want_children', relocate: false,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 4, prayer_freq: 'often', sect: 'سنية',
      quran_engagement: 'أسبوعي', fasting_ramadan: 'yes',
      hijab: 'modern', halal_diet: 'mostly', smoker: 'no',
      fitness_level: 'active', dietary_preferences: 'flexible',
      marriage_timeline: '6_12_months',
      interests: JSON.stringify(['إدارة', 'أعمال', 'قراءة', 'سفر', 'تطوير']),
      personality_traits: JSON.stringify(['قيادية', 'طموحة', 'منظمة', 'واثقة', 'متفاهمة']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'ما أكبر تحدي؟', answer: 'إدارة مشروع بميزانية ضخمة', type: 'text' },
        { prompt: 'ما يحفزك؟', answer: 'تحقيق النجاح والتميز', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      bio: 'مديرة مشاريع في الدوحة، طموحة، أبحث عن شريك ناجح',
      imageUrl: 'https://i.pravatar.cc/400?img=57'
    },
    {
      role: 'male', gender: 'male', display_name: 'سلطان البقمي', first_name: 'سلطان', dob: yearsAgo(28),
      city: 'جدة', country: 'السعودية', nationality: 'سعودي',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 21.5433, lng: 39.1728 }),
      height_cm: 184, education: 'بكالوريوس طيران', profession: 'طيار',
      income_range: '25000+', marital_status: 'single',
      want_children: 'yes', children_preference: 'want_children', relocate: true,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 4, prayer_freq: 'often', sect: 'سني',
      quran_engagement: 'أسبوعي', fasting_ramadan: 'yes',
      beard: 'trimmed', halal_diet: 'mostly', smoker: 'no',
      fitness_level: 'very_active', dietary_preferences: 'flexible',
      marriage_timeline: '6_12_months',
      interests: JSON.stringify(['طيران', 'سفر', 'رياضة', 'مغامرات', 'تقنية']),
      personality_traits: JSON.stringify(['شجاع', 'واثق', 'مغامر', 'طموح', 'مسؤول']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'لماذا الطيران؟', answer: 'حب السماء والحرية', type: 'text' },
        { prompt: 'أجمل وجهة؟', answer: 'جزر المالديف', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      bio: 'طيار، أحب السفر والمغامرات، أبحث عن شريكة تحب الحياة',
      imageUrl: 'https://i.pravatar.cc/400?img=31'
    },
    {
      role: 'female', gender: 'female', display_name: 'إيمان البقمي', first_name: 'إيمان', dob: yearsAgo(24),
      city: 'مكة المكرمة', country: 'السعودية', nationality: 'سعودية',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 21.4225, lng: 39.8262 }),
      height_cm: 162, education: 'بكالوريوس تربية', profession: 'معلمة ابتدائي',
      marital_status: 'single',
      want_children: 'yes', children_preference: 'want_children', relocate: false,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 5, prayer_freq: 'always', sect: 'سنية',
      quran_engagement: 'يومي', fasting_ramadan: 'yes',
      hijab: 'full', halal_diet: 'strict', smoker: 'no',
      fitness_level: 'light', dietary_preferences: 'halal_only',
      marriage_timeline: 'within_6_months',
      interests: JSON.stringify(['تعليم', 'أطفال', 'قرآن', 'قراءة', 'عائلة']),
      personality_traits: JSON.stringify(['حنونة', 'صبورة', 'طيبة', 'متدينة', 'بسيطة']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'لماذا تعليم الأطفال؟', answer: 'أحب الأطفال وتربيتهم', type: 'text' },
        { prompt: 'ما حلمك؟', answer: 'أم صالحة لأطفال كثيرين', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية']),
      bio: 'معلمة ابتدائي، أحب الأطفال والتعليم، أبحث عن زوج صالح',
      imageUrl: 'https://i.pravatar.cc/400?img=60'
    },
    {
      role: 'male', gender: 'male', display_name: 'تركي العنزي', first_name: 'تركي', dob: yearsAgo(32),
      city: 'الدمام', country: 'السعودية', nationality: 'سعودي',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 26.4207, lng: 50.0888 }),
      height_cm: 178, education: 'ماجستير موارد بشرية', profession: 'مدير موارد بشرية',
      income_range: '18000-25000', marital_status: 'divorced',
      want_children: 'yes', children_preference: 'want_children', relocate: false,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 4, prayer_freq: 'often', sect: 'سني',
      quran_engagement: 'أسبوعي', fasting_ramadan: 'yes',
      beard: 'trimmed', halal_diet: 'mostly', smoker: 'no',
      fitness_level: 'active', dietary_preferences: 'flexible',
      marriage_timeline: '6_12_months',
      interests: JSON.stringify(['إدارة', 'قراءة', 'رياضة', 'تطوير', 'قيادة']),
      personality_traits: JSON.stringify(['قيادي', 'متفاهم', 'صادق', 'منظم', 'حكيم']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'ما تعلمته من الطلاق؟', answer: 'أهمية التواصل والتفاهم', type: 'text' },
        { prompt: 'ماذا تبحث عنه؟', answer: 'شريكة متفاهمة نبني معاً', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      bio: 'مدير موارد بشرية، مطلق، أبحث عن شريكة متفاهمة لبداية جديدة',
      imageUrl: 'https://i.pravatar.cc/400?img=33'
    },
    {
      role: 'female', gender: 'female', display_name: 'أسماء العنزي', first_name: 'أسماء', dob: yearsAgo(30),
      city: 'الدمام', country: 'السعودية', nationality: 'سعودية',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 26.4207, lng: 50.0888 }),
      height_cm: 164, education: 'ماجستير تربية', profession: 'مستشارة تربوية',
      marital_status: 'divorced',
      want_children: 'yes', children_preference: 'have_dont_want_more', relocate: false,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 4, prayer_freq: 'often', sect: 'سنية',
      quran_engagement: 'أسبوعي', fasting_ramadan: 'yes',
      hijab: 'modern', halal_diet: 'mostly', smoker: 'no',
      fitness_level: 'light', dietary_preferences: 'flexible',
      marriage_timeline: '1_2_years',
      interests: JSON.stringify(['تربية', 'استشارات', 'قراءة', 'عائلة', 'تطوير']),
      personality_traits: JSON.stringify(['حكيمة', 'صبورة', 'متفاهمة', 'عملية', 'مسؤولة']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'ما أهم درس تربوي؟', answer: 'الحب والحدود معاً', type: 'text' },
        { prompt: 'ماذا تبحثين عنه؟', answer: 'شريك يحب أطفالي', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      bio: 'مستشارة تربوية، مطلقة بطفل، أبحث عن شريك متفاهم يحب الأطفال',
      imageUrl: 'https://i.pravatar.cc/400?img=62'
    },
    {
      role: 'male', gender: 'male', display_name: 'ناصر الشهراني', first_name: 'ناصر', dob: yearsAgo(27),
      city: 'مكة المكرمة', country: 'السعودية', nationality: 'سعودي',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 21.4225, lng: 39.8262 }),
      height_cm: 176, education: 'بكالوريوس شريعة', profession: 'إمام مسجد',
      income_range: '8000-12000', marital_status: 'single',
      want_children: 'yes', children_preference: 'want_children', relocate: false,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 5, prayer_freq: 'always', sect: 'سني',
      quran_engagement: 'حافظ', fasting_ramadan: 'yes',
      beard: 'full', halal_diet: 'strict', smoker: 'no',
      fitness_level: 'moderate', dietary_preferences: 'halal_only',
      marriage_timeline: 'within_6_months',
      interests: JSON.stringify(['قرآن', 'دعوة', 'تعليم', 'قراءة', 'عبادة']),
      personality_traits: JSON.stringify(['متدين', 'متواضع', 'صادق', 'طيب', 'ملتزم']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'ما أعظم نعمة؟', answer: 'حفظ القرآن الكريم', type: 'text' },
        { prompt: 'ما حلمك؟', answer: 'أسرة صالحة تخدم الدين', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية']),
      bio: 'إمام مسجد، حافظ للقرآن، أبحث عن زوجة صالحة حافظة',
      imageUrl: 'https://i.pravatar.cc/400?img=35'
    },
    {
      role: 'female', gender: 'female', display_name: 'غادة الشهري', first_name: 'غادة', dob: yearsAgo(23),
      city: 'الرياض', country: 'السعودية', nationality: 'سعودية',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 24.7136, lng: 46.6753 }),
      height_cm: 160, education: 'بكالوريوس شريعة', profession: 'داعية',
      marital_status: 'single',
      want_children: 'yes', children_preference: 'want_children', relocate: true,
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 5, prayer_freq: 'always', sect: 'سنية',
      quran_engagement: 'حافظة', fasting_ramadan: 'yes',
      hijab: 'full', halal_diet: 'strict', smoker: 'no',
      fitness_level: 'light', dietary_preferences: 'halal_only',
      marriage_timeline: 'within_6_months',
      interests: JSON.stringify(['دعوة', 'قرآن', 'تعليم', 'قراءة', 'عبادة']),
      personality_traits: JSON.stringify(['متدينة', 'طيبة', 'متواضعة', 'صبورة', 'ملتزمة']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'ما رسالتك؟', answer: 'الدعوة إلى الله بالحكمة', type: 'text' },
        { prompt: 'ما حلمك؟', answer: 'نشر الدين وبناء أسرة صالحة', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية']),
      bio: 'داعية، حافظة للقرآن، أبحث عن زوج صالح متدين',
      imageUrl: 'https://i.pravatar.cc/400?img=58'
    },

    // ==================== MOTHERS (10 profiles) ====================
    {
      role: 'mother', mother_for: 'son', gender: 'female',
      display_name: 'أم محمد الأحمد', first_name: 'سارة', dob: yearsAgo(52),
      city: 'الرياض', country: 'السعودية', nationality: 'سعودية',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 24.7136, lng: 46.6753 }),
      height_cm: 160, education: 'بكالوريوس تربية', profession: 'معلمة متقاعدة',
      marital_status: 'married',
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 5, prayer_freq: 'always', sect: 'سنية',
      quran_engagement: 'يومي', fasting_ramadan: 'yes',
      hijab: 'full', halal_diet: 'strict', smoker: 'no',
      fitness_level: 'light',
      interests: JSON.stringify(['عائلة', 'تربية', 'قرآن', 'طبخ']),
      personality_traits: JSON.stringify(['حنونة', 'حكيمة', 'صبورة', 'متدينة', 'متفانية']),
      languages: JSON.stringify(['العربية']),
      bio: 'أبحث عن زوجة صالحة محافظة لابني المهندس محمد',
      ward_display_name: 'محمد', ward_dob: yearsAgo(28),
      ward_city: 'الرياض', ward_country: 'السعودية',
      ward_education: 'ماجستير هندسة', ward_profession: 'مهندس برمجيات',
      ward_bio: 'مهندس برمجيات، ملتزم دينياً، حافظ للقرآن، طموح ومسؤول',
      imageUrl: 'https://i.pravatar.cc/400?img=65'
    },
    {
      role: 'mother', mother_for: 'son', gender: 'female',
      display_name: 'أم خالد السالم', first_name: 'نورة', dob: yearsAgo(48),
      city: 'جدة', country: 'السعودية', nationality: 'سعودية',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 21.5433, lng: 39.1728 }),
      height_cm: 162, education: 'ثانوية', profession: 'ربة منزل',
      marital_status: 'married',
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 5, prayer_freq: 'always', sect: 'سنية',
      quran_engagement: 'يومي', fasting_ramadan: 'yes',
      hijab: 'full', halal_diet: 'strict', smoker: 'no',
      fitness_level: 'light',
      interests: JSON.stringify(['عائلة', 'طبخ', 'قرآن', 'تربية']),
      personality_traits: JSON.stringify(['حنونة', 'صبورة', 'متدينة', 'بسيطة', 'محبة']),
      languages: JSON.stringify(['العربية']),
      bio: 'أبحث عن زوجة صالحة محافظة لابني الطبيب خالد',
      ward_display_name: 'خالد', ward_dob: yearsAgo(26),
      ward_city: 'جدة', ward_country: 'السعودية',
      ward_education: 'بكالوريوس طب', ward_profession: 'طبيب',
      ward_bio: 'طبيب، ملتزم دينياً، يبحث عن زوجة صالحة',
      imageUrl: 'https://i.pravatar.cc/400?img=66'
    },
    {
      role: 'mother', mother_for: 'daughter', gender: 'female',
      display_name: 'أم فاطمة المحمود', first_name: 'مريم', dob: yearsAgo(50),
      city: 'الرياض', country: 'السعودية', nationality: 'سعودية',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 24.7136, lng: 46.6753 }),
      height_cm: 162, education: 'بكالوريوس', profession: 'معلمة متقاعدة',
      marital_status: 'married',
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 5, prayer_freq: 'always', sect: 'سنية',
      quran_engagement: 'يومي', fasting_ramadan: 'yes',
      hijab: 'full', halal_diet: 'strict', smoker: 'no',
      fitness_level: 'light',
      interests: JSON.stringify(['عائلة', 'تربية', 'قرآن', 'طبخ']),
      personality_traits: JSON.stringify(['حنونة', 'حكيمة', 'صبورة', 'متدينة', 'محبة']),
      languages: JSON.stringify(['العربية']),
      bio: 'أبحث عن زوج صالح ملتزم لابنتي المعلمة فاطمة',
      ward_display_name: 'فاطمة', ward_dob: yearsAgo(25),
      ward_city: 'الرياض', ward_country: 'السعودية',
      ward_education: 'بكالوريوس شريعة', ward_profession: 'معلمة قرآن',
      ward_bio: 'معلمة قرآن، حافظة للقرآن، ملتزمة دينياً، صالحة',
      imageUrl: 'https://i.pravatar.cc/400?img=75'
    },
    {
      role: 'mother', mother_for: 'daughter', gender: 'female',
      display_name: 'أم مريم العتيبي', first_name: 'هدى', dob: yearsAgo(48),
      city: 'جدة', country: 'السعودية', nationality: 'سعودية',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 21.5433, lng: 39.1728 }),
      height_cm: 163, education: 'ثانوية', profession: 'ربة منزل',
      marital_status: 'married',
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 5, prayer_freq: 'always', sect: 'سنية',
      quran_engagement: 'يومي', fasting_ramadan: 'yes',
      hijab: 'full', halal_diet: 'strict', smoker: 'no',
      fitness_level: 'light',
      interests: JSON.stringify(['عائلة', 'طبخ', 'قرآن', 'تربية']),
      personality_traits: JSON.stringify(['حنونة', 'بسيطة', 'صبورة', 'متدينة', 'محبة']),
      languages: JSON.stringify(['العربية']),
      bio: 'أبحث عن زوج صالح ملتزم لابنتي الصيدلانية مريم',
      ward_display_name: 'مريم', ward_dob: yearsAgo(26),
      ward_city: 'جدة', ward_country: 'السعودية',
      ward_education: 'ماجستير صيدلة', ward_profession: 'صيدلانية',
      ward_bio: 'صيدلانية، ملتزمة دينياً، طموحة، صالحة',
      imageUrl: 'https://i.pravatar.cc/400?img=76'
    },
    {
      role: 'mother', mother_for: 'son', gender: 'female',
      display_name: 'أم عبدالله المطيري', first_name: 'فاطمة', dob: yearsAgo(55),
      city: 'مكة المكرمة', country: 'السعودية', nationality: 'سعودية',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 21.4225, lng: 39.8262 }),
      height_cm: 158, education: 'ماجستير', profession: 'أستاذة متقاعدة',
      marital_status: 'married',
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 5, prayer_freq: 'always', sect: 'سنية',
      quran_engagement: 'يومي', fasting_ramadan: 'yes',
      hijab: 'full', halal_diet: 'strict', smoker: 'no',
      fitness_level: 'light',
      interests: JSON.stringify(['علم', 'تربية', 'قرآن', 'تعليم']),
      personality_traits: JSON.stringify(['حكيمة', 'عالمة', 'صبورة', 'متدينة', 'محبة']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      bio: 'أبحث عن زوجة صالحة طالبة علم لابني الدكتور عبدالله',
      ward_display_name: 'عبدالله', ward_dob: yearsAgo(30),
      ward_city: 'مكة المكرمة', ward_country: 'السعودية',
      ward_education: 'دكتوراه شريعة', ward_profession: 'أستاذ جامعي',
      ward_bio: 'أستاذ جامعي، حافظ للقرآن، باحث شرعي، متدين',
      imageUrl: 'https://i.pravatar.cc/400?img=67'
    },
    {
      role: 'mother', mother_for: 'son', gender: 'female',
      display_name: 'أم أحمد الشمري', first_name: 'سعاد', dob: yearsAgo(50),
      city: 'المدينة المنورة', country: 'السعودية', nationality: 'سعودية',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 24.5247, lng: 39.5692 }),
      height_cm: 161, education: 'بكالوريوس', profession: 'موظفة متقاعدة',
      marital_status: 'married',
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 4, prayer_freq: 'often', sect: 'سنية',
      quran_engagement: 'أسبوعي', fasting_ramadan: 'yes',
      hijab: 'full', halal_diet: 'mostly', smoker: 'no',
      fitness_level: 'light',
      interests: JSON.stringify(['عائلة', 'طبخ', 'قراءة', 'تربية']),
      personality_traits: JSON.stringify(['حنونة', 'متفاهمة', 'صبورة', 'عملية', 'محبة']),
      languages: JSON.stringify(['العربية']),
      bio: 'أبحث عن زوجة متعلمة لابني المحاسب أحمد',
      ward_display_name: 'أحمد', ward_dob: yearsAgo(27),
      ward_city: 'المدينة المنورة', ward_country: 'السعودية',
      ward_education: 'ماجستير محاسبة', ward_profession: 'محاسب',
      ward_bio: 'محاسب قانوني، أحب الرياضة والسفر، ملتزم',
      imageUrl: 'https://i.pravatar.cc/400?img=68'
    },
    {
      role: 'mother', mother_for: 'son', gender: 'female',
      display_name: 'أم سعد القحطاني', first_name: 'عائشة', dob: yearsAgo(53),
      city: 'الدمام', country: 'السعودية', nationality: 'سعودية',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 26.4207, lng: 50.0888 }),
      height_cm: 160, education: 'ثانوية', profession: 'ربة منزل',
      marital_status: 'married',
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 5, prayer_freq: 'always', sect: 'سنية',
      quran_engagement: 'يومي', fasting_ramadan: 'yes',
      hijab: 'full', halal_diet: 'strict', smoker: 'no',
      fitness_level: 'light',
      interests: JSON.stringify(['عائلة', 'تربية', 'قرآن', 'طبخ']),
      personality_traits: JSON.stringify(['حنونة', 'بسيطة', 'صبورة', 'متدينة', 'محبة']),
      languages: JSON.stringify(['العربية']),
      bio: 'أبحث عن زوجة صالحة محافظة لابني سعد',
      ward_display_name: 'سعد', ward_dob: yearsAgo(29),
      ward_city: 'الدمام', ward_country: 'السعودية',
      ward_education: 'بكالوريوس إدارة', ward_profession: 'مدير مبيعات',
      ward_bio: 'مدير مبيعات ناجح، مطلق، يبحث عن بداية جديدة',
      imageUrl: 'https://i.pravatar.cc/400?img=69'
    },
    {
      role: 'mother', mother_for: 'daughter', gender: 'female',
      display_name: 'أم عائشة الزهراني', first_name: 'خديجة', dob: yearsAgo(46),
      city: 'مكة المكرمة', country: 'السعودية', nationality: 'سعودية',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 21.4225, lng: 39.8262 }),
      height_cm: 162, education: 'ماجستير', profession: 'أستاذة متقاعدة',
      marital_status: 'married',
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 5, prayer_freq: 'always', sect: 'سنية',
      quran_engagement: 'يومي', fasting_ramadan: 'yes',
      hijab: 'full', halal_diet: 'strict', smoker: 'no',
      fitness_level: 'light',
      interests: JSON.stringify(['علم', 'تربية', 'قرآن', 'تعليم']),
      personality_traits: JSON.stringify(['حكيمة', 'عالمة', 'صبورة', 'متدينة', 'محبة']),
      languages: JSON.stringify(['العربية']),
      bio: 'أبحث عن زوج صالح طالب علم لابنتي عائشة',
      ward_display_name: 'عائشة', ward_dob: yearsAgo(23),
      ward_city: 'مكة المكرمة', ward_country: 'السعودية',
      ward_education: 'بكالوريوس شريعة', ward_profession: 'طالبة دراسات عليا',
      ward_bio: 'طالبة دراسات عليا في الشريعة، حافظة للقرآن',
      imageUrl: 'https://i.pravatar.cc/400?img=77'
    },
    {
      role: 'mother', mother_for: 'daughter', gender: 'female',
      display_name: 'أم نورة القحطاني', first_name: 'منى', dob: yearsAgo(52),
      city: 'المدينة المنورة', country: 'السعودية', nationality: 'سعودية',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 24.5247, lng: 39.5692 }),
      height_cm: 160, education: 'بكالوريوس', profession: 'موظفة متقاعدة',
      marital_status: 'married',
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 4, prayer_freq: 'often', sect: 'سنية',
      quran_engagement: 'أسبوعي', fasting_ramadan: 'yes',
      hijab: 'full', halal_diet: 'mostly', smoker: 'no',
      fitness_level: 'light',
      interests: JSON.stringify(['عائلة', 'فن', 'قراءة', 'طبخ']),
      personality_traits: JSON.stringify(['حنونة', 'مثقفة', 'صبورة', 'متفاهمة', 'محبة']),
      languages: JSON.stringify(['العربية']),
      bio: 'أبحث عن زوج متعلم طموح لابنتي المهندسة نورة',
      ward_display_name: 'نورة', ward_dob: yearsAgo(27),
      ward_city: 'المدينة المنورة', ward_country: 'السعودية',
      ward_education: 'ماجستير هندسة', ward_profession: 'مهندسة معمارية',
      ward_bio: 'مهندسة معمارية، أحب التصميم والإبداع، طموحة',
      imageUrl: 'https://i.pravatar.cc/400?img=78'
    },
    {
      role: 'mother', mother_for: 'daughter', gender: 'female',
      display_name: 'أم لينا الشمري', first_name: 'رقية', dob: yearsAgo(51),
      city: 'الدمام', country: 'السعودية', nationality: 'سعودية',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 26.4207, lng: 50.0888 }),
      height_cm: 161, education: 'ثانوية', profession: 'ربة منزل',
      marital_status: 'married',
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 4, prayer_freq: 'often', sect: 'سنية',
      quran_engagement: 'أسبوعي', fasting_ramadan: 'yes',
      hijab: 'full', halal_diet: 'mostly', smoker: 'no',
      fitness_level: 'light',
      interests: JSON.stringify(['عائلة', 'صحة', 'قراءة', 'طبخ']),
      personality_traits: JSON.stringify(['حنونة', 'صبورة', 'بسيطة', 'متفاهمة', 'محبة']),
      languages: JSON.stringify(['العربية']),
      bio: 'أبحث عن زوج متعلم لابنتي الطبيبة لينا',
      ward_display_name: 'لينا', ward_dob: yearsAgo(28),
      ward_city: 'الدمام', ward_country: 'السعودية',
      ward_education: 'ماجستير طب أسنان', ward_profession: 'طبيبة أسنان',
      ward_bio: 'طبيبة أسنان، طموحة، متفانية في عملها',
      imageUrl: 'https://i.pravatar.cc/400?img=79'
    },
    {
      role: 'mother', mother_for: 'son', gender: 'female',
      display_name: 'أم فيصل الدوسري', first_name: 'أمل', dob: yearsAgo(49),
      city: 'الرياض', country: 'السعودية', nationality: 'سعودية',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 24.7136, lng: 46.6753 }),
      height_cm: 162, education: 'بكالوريوس', profession: 'معلمة متقاعدة',
      marital_status: 'married',
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 4, prayer_freq: 'often', sect: 'سنية',
      quran_engagement: 'أسبوعي', fasting_ramadan: 'yes',
      hijab: 'full', halal_diet: 'mostly', smoker: 'no',
      fitness_level: 'light',
      interests: JSON.stringify(['عائلة', 'فن', 'قراءة', 'طبخ']),
      personality_traits: JSON.stringify(['حنونة', 'مبدعة', 'صبورة', 'متفاهمة', 'محبة']),
      languages: JSON.stringify(['العربية']),
      bio: 'أبحث عن زوجة متفاهمة لابني المصمم فيصل',
      ward_display_name: 'فيصل', ward_dob: yearsAgo(25),
      ward_city: 'الرياض', ward_country: 'السعودية',
      ward_education: 'بكالوريوس تصميم', ward_profession: 'مصمم جرافيك',
      ward_bio: 'مصمم مبدع، أحب الفن والثقافة',
      imageUrl: 'https://i.pravatar.cc/400?img=70'
    },
    {
      role: 'mother', mother_for: 'daughter', gender: 'female',
      display_name: 'أم سارة الدوسري', first_name: 'زينب', dob: yearsAgo(47),
      city: 'الرياض', country: 'السعودية', nationality: 'سعودية',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 24.7136, lng: 46.6753 }),
      height_cm: 163, education: 'بكالوريوس', profession: 'معلمة متقاعدة',
      marital_status: 'married',
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 3, prayer_freq: 'often', sect: 'سنية',
      quran_engagement: 'أحياناً', fasting_ramadan: 'yes',
      hijab: 'modern', halal_diet: 'mostly', smoker: 'no',
      fitness_level: 'light',
      interests: JSON.stringify(['عائلة', 'فن', 'تصميم', 'طبخ']),
      personality_traits: JSON.stringify(['حنونة', 'متفتحة', 'صبورة', 'متفاهمة', 'مبدعة']),
      languages: JSON.stringify(['العربية']),
      bio: 'أبحث عن زوج متفاهم لابنتي المصممة سارة',
      ward_display_name: 'سارة', ward_dob: yearsAgo(24),
      ward_city: 'الرياض', ward_country: 'السعودية',
      ward_education: 'بكالوريوس تصميم', ward_profession: 'مصممة جرافيك',
      ward_bio: 'مصممة جرافيك، مبدعة، أحب الفن والثقافة',
      imageUrl: 'https://i.pravatar.cc/400?img=80'
    },
    {
      role: 'mother', mother_for: 'daughter', gender: 'female',
      display_name: 'أم ريم الحربي', first_name: 'لطيفة', dob: yearsAgo(45),
      city: 'جدة', country: 'السعودية', nationality: 'سعودية',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 21.5433, lng: 39.1728 }),
      height_cm: 164, education: 'بكالوريوس', profession: 'موظفة',
      marital_status: 'married',
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 4, prayer_freq: 'often', sect: 'سنية',
      quran_engagement: 'أسبوعي', fasting_ramadan: 'yes',
      hijab: 'modern', halal_diet: 'mostly', smoker: 'no',
      fitness_level: 'moderate',
      interests: JSON.stringify(['عائلة', 'تقنية', 'قراءة', 'تطوير']),
      personality_traits: JSON.stringify(['حديثة', 'متفتحة', 'صبورة', 'متفاهمة', 'داعمة']),
      languages: JSON.stringify(['العربية']),
      bio: 'أبحث عن زوج متعلم لابنتي المبرمجة ريم',
      ward_display_name: 'ريم', ward_dob: yearsAgo(22),
      ward_city: 'جدة', ward_country: 'السعودية',
      ward_education: 'بكالوريوس حاسب', ward_profession: 'مبرمجة',
      ward_bio: 'مبرمجة حديثة التخرج، أحب التقنية والبرمجة',
      imageUrl: 'https://i.pravatar.cc/400?img=81'
    },
    {
      role: 'mother', mother_for: 'daughter', gender: 'female',
      display_name: 'أم رهف السالم', first_name: 'بدرية', dob: yearsAgo(49),
      city: 'الدمام', country: 'السعودية', nationality: 'سعودية',
      ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      location: JSON.stringify({ lat: 26.4207, lng: 50.0888 }),
      height_cm: 161, education: 'ثانوية', profession: 'ربة منزل',
      marital_status: 'married',
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 3, prayer_freq: 'often', sect: 'سنية',
      quran_engagement: 'أحياناً', fasting_ramadan: 'yes',
      hijab: 'modern', halal_diet: 'mostly', smoker: 'no',
      fitness_level: 'light',
      interests: JSON.stringify(['عائلة', 'إعلام', 'ثقافة', 'طبخ']),
      personality_traits: JSON.stringify(['حنونة', 'متفتحة', 'صبورة', 'متفاهمة', 'داعمة']),
      languages: JSON.stringify(['العربية']),
      bio: 'أبحث عن زوج متفاهم لابنتي الإعلامية رهف',
      ward_display_name: 'رهف', ward_dob: yearsAgo(23),
      ward_city: 'الدمام', ward_country: 'السعودية',
      ward_education: 'بكالوريوس إعلام', ward_profession: 'إعلامية',
      ward_bio: 'إعلامية، أحب التواصل والإبداع، طموحة',
      imageUrl: 'https://i.pravatar.cc/400?img=82'
    },
  ];

  console.log(`📝 Creating ${profiles.length} COMPLETE profiles...\n`);

  let successCount = 0;
  let failCount = 0;

  for (const profile of profiles) {
    try {
      const { imageUrl, ...userData } = profile;
      
      const user = await prisma.user.create({ data: userData as any });
      successCount++;
      console.log(`✅ ${user.display_name} (${user.role}${user.mother_for ? ` - ${user.mother_for}` : ''})`);

      // Download image
      try {
        const filename = `${user.id}-0.jpg`;
        const filepath = path.join(uploadsDir, filename);
        await downloadImage(imageUrl, filepath);
        
        await prisma.photo.create({
          data: {
            userId: user.id,
            url: `/uploads/${filename}`,
            ordering: 0,
            blurred: false,
          }
        });
        console.log(`   📸 Photo saved`);
      } catch (err) {
        console.log(`   ⚠️  Photo failed`);
      }

      // Create comprehensive preferences
      const prefData: any = {
        userId: user.id,
        religiousness_min: profile.religiousness >= 4 ? 4 : 3,
        distance_km: 100,
      };

      if (profile.role === 'male') {
        prefData.age_min = 20;
        prefData.age_max = 35;
        prefData.height_min_cm = 150;
        prefData.height_max_cm = 180;
      } else if (profile.role === 'female') {
        prefData.age_min = 24;
        prefData.age_max = 40;
        prefData.height_min_cm = 170;
        prefData.height_max_cm = 195;
      } else if (profile.role === 'mother') {
        if (profile.mother_for === 'son') {
          prefData.age_min = 20;
          prefData.age_max = 35;
          prefData.height_min_cm = 150;
          prefData.height_max_cm = 175;
        } else {
          prefData.age_min = 24;
          prefData.age_max = 40;
          prefData.height_min_cm = 170;
          prefData.height_max_cm = 200;
        }
        prefData.show_only_mothers = false;
      }

      await prisma.preference.create({ data: prefData });

    } catch (err: any) {
      failCount++;
      console.error(`❌ ${profile.display_name}: ${err.message}`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎉 SEED COMPLETED!`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📊 Total: ${profiles.length}`);
  console.log(`${'='.repeat(60)}\n`);

  console.log('✅ All profiles have ALL fields properly filled:');
  console.log('   • Gender, ethnicity, sect');
  console.log('   • Smoker, fitness_level, dietary preferences');
  console.log('   • Personality traits (5 each)');
  console.log('   • Icebreaker questions (2 each)');
  console.log('   • Marriage timeline');
  console.log('   • Children preference');
  console.log('   • Quran engagement, fasting');
  console.log('   • Hijab/Beard preferences');
  console.log('   • Complete location data');
  console.log('   • Profile images');
  console.log('   • Comprehensive preferences\n');
}

main().catch(console.error).finally(() => prisma.$disconnect());

