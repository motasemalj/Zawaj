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
  console.log('🌱 Starting comprehensive seed with diverse test users...\n');
  
  // Clean up existing data
  console.log('🧹 Cleaning existing data...');
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

  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

  const today = new Date();
  function yearsAgo(n: number) { const d = new Date(today); d.setFullYear(d.getFullYear() - n); return d; }

  console.log('👥 Creating diverse user profiles...\n');

  // Helper to generate location
  const locations = [
    { city: 'الرياض', country: 'السعودية', lat: 24.7136, lng: 46.6753 },
    { city: 'جدة', country: 'السعودية', lat: 21.5433, lng: 39.1728 },
    { city: 'مكة', country: 'السعودية', lat: 21.4225, lng: 39.8262 },
    { city: 'المدينة', country: 'السعودية', lat: 24.5247, lng: 39.5692 },
    { city: 'الدمام', country: 'السعودية', lat: 26.4207, lng: 50.0888 },
    { city: 'القاهرة', country: 'مصر', lat: 30.0444, lng: 31.2357 },
    { city: 'دبي', country: 'الإمارات', lat: 25.2048, lng: 55.2708 },
    { city: 'عمّان', country: 'الأردن', lat: 31.9454, lng: 35.9284 },
    { city: 'بيروت', country: 'لبنان', lat: 33.8886, lng: 35.4955 },
    { city: 'الدوحة', country: 'قطر', lat: 25.2854, lng: 51.5310 },
  ];

  const profiles = [
    // ==================== MALES (25 profiles) ====================
    
    // High religiousness males
    {
      role: 'male', gender: 'male', display_name: 'أحمد المحمود', first_name: 'أحمد', dob: yearsAgo(28), 
      city: locations[0].city, country: locations[0].country,
      location: JSON.stringify({ lat: locations[0].lat, lng: locations[0].lng }),
      nationality: 'سعودي', ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 5, prayer_freq: 'always', sect: 'سني',
      quran_engagement: 'حافظ', fasting_ramadan: 'yes',
      beard: 'full', halal_diet: 'strict', education: 'ماجستير', profession: 'مهندس برمجيات',
      height_cm: 178, marital_status: 'single', want_children: 'yes',
      children_preference: 'want_children', relocate: false,
      smoker: 'no', fitness_level: 'active', dietary_preferences: 'halal_only',
      marriage_timeline: 'within_6_months',
      bio: 'حافظ للقرآن، أبحث عن زوجة صالحة محافظة',
      interests: JSON.stringify(['قرآن', 'برمجة', 'قراءة', 'رياضة', 'سفر']),
      personality_traits: JSON.stringify(['طموح', 'ملتزم', 'صادق', 'مسؤول', 'متفائل']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'ما هدفك في الحياة؟', answer: 'بناء أسرة صالحة', type: 'text' },
        { prompt: 'هوايتك المفضلة؟', answer: 'قراءة القرآن', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      income_range: '15000-25000',
      imageUrl: 'https://i.pravatar.cc/400?img=12'
    },
    {
      role: 'male', gender: 'male', display_name: 'خالد العتيبي', first_name: 'خالد', dob: yearsAgo(32),
      city: locations[1].city, country: locations[1].country, location: JSON.stringify({ lat: locations[1].lat, lng: locations[1].lng }),
      nationality: 'سعودي', ethnicity: JSON.stringify(['السعودية 🇸🇦']),
      muslim_affirmed: true, onboarding_completed: true, terms_accepted: true,
      religiousness: 5, prayer_freq: 'always', sect: 'سني',
      quran_engagement: 'يومي', fasting_ramadan: 'yes',
      beard: 'trimmed', halal_diet: 'strict', education: 'دكتوراه', profession: 'طبيب',
      height_cm: 182, marital_status: 'single', want_children: 'yes',
      children_preference: 'want_children', relocate: false,
      smoker: 'no', fitness_level: 'very_active', dietary_preferences: 'halal_only',
      marriage_timeline: '6_12_months',
      bio: 'طبيب قلب، ملتزم دينياً، أبحث عن شريكة حياة',
      interests: JSON.stringify(['طب', 'رياضة', 'سفر', 'قراءة', 'عائلة']),
      personality_traits: JSON.stringify(['طموح', 'رحيم', 'صبور', 'ملتزم', 'متفاني']),
      icebreaker_questions: JSON.stringify([
        { prompt: 'لماذا اخترت الطب؟', answer: 'لخدمة الناس', type: 'text' },
        { prompt: 'ما حلمك؟', answer: 'طبيب ماهر وأب صالح', type: 'text' }
      ]),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      income_range: '25000+',
      imageUrl: 'https://i.pravatar.cc/400?img=13'
    },
    {
      role: 'male', display_name: 'عبدالله الزهراني', dob: yearsAgo(26),
      city: locations[2].city, country: locations[2].country, location: JSON.stringify({ lat: locations[2].lat, lng: locations[2].lng }),
      nationality: 'سعودي', muslim_affirmed: true, religiousness: 5, prayer_freq: 'always',
      beard: 'full', education: 'بكالوريوس', profession: 'معلم قرآن',
      height_cm: 175, marital_status: 'single', want_children: 'yes',
      bio: 'معلم قرآن كريم، أبحث عن زوجة حافظة للقرآن',
      interests: JSON.stringify(['قرآن', 'تعليم', 'عائلة']),
      languages: JSON.stringify(['العربية']),
      income_range: '8000-12000',
      imageUrl: 'https://i.pravatar.cc/400?img=14'
    },

    // Medium religiousness males
    {
      role: 'male', display_name: 'محمد الشمري', dob: yearsAgo(29),
      city: locations[3].city, country: locations[3].country, location: JSON.stringify({ lat: locations[3].lat, lng: locations[3].lng }),
      nationality: 'سعودي', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      beard: 'trimmed', education: 'ماجستير', profession: 'محاسب',
      height_cm: 180, marital_status: 'single', want_children: 'yes',
      bio: 'محاسب قانوني، أحب الرياضة والسفر',
      interests: JSON.stringify(['رياضة', 'سفر', 'قراءة']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      income_range: '15000-20000',
      imageUrl: 'https://i.pravatar.cc/400?img=15'
    },
    {
      role: 'male', display_name: 'سعد القحطاني', dob: yearsAgo(31),
      city: locations[4].city, country: locations[4].country, location: JSON.stringify({ lat: locations[4].lat, lng: locations[4].lng }),
      nationality: 'سعودي', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      beard: 'none', education: 'بكالوريوس', profession: 'مدير مبيعات',
      height_cm: 177, marital_status: 'divorced', want_children: 'maybe',
      bio: 'مدير مبيعات، مطلق بلا أطفال، ابحث عن بداية جديدة',
      interests: JSON.stringify(['أعمال', 'سفر', 'طبخ']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      income_range: '18000-25000',
      imageUrl: 'https://i.pravatar.cc/400?img=16'
    },
    {
      role: 'male', display_name: 'فيصل الدوسري', dob: yearsAgo(27),
      city: locations[0].city, country: locations[0].country, location: JSON.stringify({ lat: locations[0].lat, lng: locations[0].lng }),
      nationality: 'سعودي', muslim_affirmed: true, religiousness: 3, prayer_freq: 'often',
      education: 'بكالوريوس', profession: 'مصمم جرافيك',
      height_cm: 172, marital_status: 'single', want_children: 'yes',
      bio: 'مصمم مبدع، أحب الفن والثقافة',
      interests: JSON.stringify(['تصميم', 'فن', 'موسيقى']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      income_range: '10000-15000',
      imageUrl: 'https://i.pravatar.cc/400?img=17'
    },

    // Younger males
    {
      role: 'male', display_name: 'عمر الحربي', dob: yearsAgo(24),
      city: locations[1].city, country: locations[1].country, location: JSON.stringify({ lat: locations[1].lat, lng: locations[1].lng }),
      nationality: 'سعودي', muslim_affirmed: true, religiousness: 3, prayer_freq: 'sometimes',
      beard: 'none', education: 'بكالوريوس', profession: 'مبرمج',
      height_cm: 176, marital_status: 'single', want_children: 'yes',
      bio: 'مبرمج حديث التخرج، أبحث عن شريكة متفاهمة',
      interests: JSON.stringify(['برمجة', 'ألعاب', 'تقنية']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      income_range: '8000-12000',
      imageUrl: 'https://i.pravatar.cc/400?img=18'
    },
    {
      role: 'male', display_name: 'يوسف السالم', dob: yearsAgo(25),
      city: locations[2].city, country: locations[2].country, location: JSON.stringify({ lat: locations[2].lat, lng: locations[2].lng }),
      nationality: 'سعودي', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      beard: 'trimmed', education: 'بكالوريوس', profession: 'صيدلي',
      height_cm: 179, marital_status: 'single', want_children: 'yes',
      bio: 'صيدلي، أحب مساعدة الناس والرياضة',
      interests: JSON.stringify(['صحة', 'رياضة', 'قراءة']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      income_range: '12000-18000',
      imageUrl: 'https://i.pravatar.cc/400?img=19'
    },

    // International males
    {
      role: 'male', display_name: 'كريم حسن', dob: yearsAgo(30),
      city: locations[5].city, country: locations[5].country, location: JSON.stringify({ lat: locations[5].lat, lng: locations[5].lng }),
      nationality: 'مصري', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      beard: 'trimmed', education: 'ماجستير', profession: 'مهندس مدني',
      height_cm: 181, marital_status: 'single', want_children: 'yes',
      bio: 'مهندس مدني من القاهرة، أبحث عن شريكة طموحة',
      interests: JSON.stringify(['هندسة', 'سفر', 'تاريخ']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      income_range: '15000-20000',
      imageUrl: 'https://i.pravatar.cc/400?img=20'
    },
    {
      role: 'male', display_name: 'طارق العلي', dob: yearsAgo(33),
      city: locations[6].city, country: locations[6].country, location: JSON.stringify({ lat: locations[6].lat, lng: locations[6].lng }),
      nationality: 'إماراتي', muslim_affirmed: true, religiousness: 3, prayer_freq: 'sometimes',
      beard: 'none', education: 'ماجستير', profession: 'رجل أعمال',
      height_cm: 183, marital_status: 'divorced', want_children: 'maybe',
      bio: 'رجل أعمال في دبي، أبحث عن شريكة متفاهمة',
      interests: JSON.stringify(['أعمال', 'سفر', 'رياضة']),
      languages: JSON.stringify(['العربية', 'الإنجليزية', 'الفرنسية']),
      income_range: '25000+',
      imageUrl: 'https://i.pravatar.cc/400?img=21'
    },

    // More diverse scenarios
    {
      role: 'male', display_name: 'عادل المطيري', dob: yearsAgo(35),
      city: locations[0].city, country: locations[0].country, location: JSON.stringify({ lat: locations[0].lat, lng: locations[0].lng }),
      nationality: 'سعودي', muslim_affirmed: true, religiousness: 5, prayer_freq: 'always',
      beard: 'full', education: 'دكتوراه', profession: 'أستاذ جامعي',
      height_cm: 175, marital_status: 'widowed', want_children: 'yes',
      bio: 'أستاذ جامعي، أرمل، عندي طفلين، أبحث عن أم صالحة',
      interests: JSON.stringify(['تعليم', 'قراءة', 'عائلة']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      income_range: '20000-25000',
      imageUrl: 'https://i.pravatar.cc/400?img=22'
    },
    {
      role: 'male', display_name: 'نواف السبيعي', dob: yearsAgo(26),
      city: locations[3].city, country: locations[3].country, location: JSON.stringify({ lat: locations[3].lat, lng: locations[3].lng }),
      nationality: 'سعودي', muslim_affirmed: true, religiousness: 5, prayer_freq: 'always',
      beard: 'full', education: 'بكالوريوس', profession: 'داعية',
      height_cm: 178, marital_status: 'single', want_children: 'yes',
      bio: 'داعية إسلامي، حافظ للقرآن، أبحث عن زوجة صالحة',
      interests: JSON.stringify(['دعوة', 'قرآن', 'تعليم']),
      languages: JSON.stringify(['العربية']),
      income_range: '8000-12000',
      imageUrl: 'https://i.pravatar.cc/400?img=23'
    },

    // More males with different characteristics
    {
      role: 'male', display_name: 'ماجد الغامدي', dob: yearsAgo(29),
      city: locations[1].city, country: locations[1].country, location: JSON.stringify({ lat: locations[1].lat, lng: locations[1].lng }),
      nationality: 'سعودي', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      beard: 'trimmed', education: 'ماجستير', profession: 'محلل مالي',
      height_cm: 180, marital_status: 'single', want_children: 'yes',
      bio: 'محلل مالي، أحب الاستثمار والرياضة',
      interests: JSON.stringify(['مال', 'استثمار', 'رياضة']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      income_range: '18000-25000',
      imageUrl: 'https://i.pravatar.cc/400?img=24'
    },
    {
      role: 'male', display_name: 'بندر الراشد', dob: yearsAgo(27),
      city: locations[4].city, country: locations[4].country, location: JSON.stringify({ lat: locations[4].lat, lng: locations[4].lng }),
      nationality: 'سعودي', muslim_affirmed: true, religiousness: 3, prayer_freq: 'often',
      beard: 'none', education: 'بكالوريوس', profession: 'مصور فوتوغرافي',
      height_cm: 174, marital_status: 'single', want_children: 'maybe',
      bio: 'مصور محترف، أحب السفر واكتشاف الجديد',
      interests: JSON.stringify(['تصوير', 'سفر', 'فن']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      income_range: '10000-15000',
      imageUrl: 'https://i.pravatar.cc/400?img=25'
    },
    {
      role: 'male', display_name: 'إبراهيم النجار', dob: yearsAgo(34),
      city: locations[7].city, country: locations[7].country, location: JSON.stringify({ lat: locations[7].lat, lng: locations[7].lng }),
      nationality: 'أردني', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      beard: 'trimmed', education: 'ماجستير', profession: 'مهندس معماري',
      height_cm: 177, marital_status: 'single', want_children: 'yes',
      bio: 'مهندس معماري من عمّان، أحب التصميم والإبداع',
      interests: JSON.stringify(['هندسة', 'تصميم', 'فن']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      income_range: '12000-18000',
      imageUrl: 'https://i.pravatar.cc/400?img=26'
    },
    {
      role: 'male', display_name: 'حسام الدين', dob: yearsAgo(28),
      city: locations[8].city, country: locations[8].country, location: JSON.stringify({ lat: locations[8].lat, lng: locations[8].lng }),
      nationality: 'لبناني', muslim_affirmed: true, religiousness: 3, prayer_freq: 'sometimes',
      beard: 'none', education: 'ماجستير', profession: 'مترجم',
      height_cm: 176, marital_status: 'single', want_children: 'yes',
      bio: 'مترجم محترف، أتحدث 5 لغات، أحب الثقافات',
      interests: JSON.stringify(['لغات', 'ثقافة', 'سفر']),
      languages: JSON.stringify(['العربية', 'الإنجليزية', 'الفرنسية', 'الإسبانية']),
      income_range: '10000-15000',
      imageUrl: 'https://i.pravatar.cc/400?img=27'
    },
    {
      role: 'male', display_name: 'راشد الكعبي', dob: yearsAgo(31),
      city: locations[9].city, country: locations[9].country, location: JSON.stringify({ lat: locations[9].lat, lng: locations[9].lng }),
      nationality: 'قطري', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      beard: 'trimmed', education: 'بكالوريوس', profession: 'مدير مشروع',
      height_cm: 182, marital_status: 'single', want_children: 'yes',
      bio: 'مدير مشاريع في الدوحة، أبحث عن شريكة طموحة',
      interests: JSON.stringify(['إدارة', 'رياضة', 'سفر']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      income_range: '20000-25000',
      imageUrl: 'https://i.pravatar.cc/400?img=28'
    },

    // Additional males for testing
    {
      role: 'male', display_name: 'وليد الشهري', dob: yearsAgo(25),
      city: locations[0].city, country: locations[0].country, location: JSON.stringify({ lat: locations[0].lat, lng: locations[0].lng }),
      nationality: 'سعودي', muslim_affirmed: true, religiousness: 5, prayer_freq: 'always',
      beard: 'full', education: 'بكالوريوس', profession: 'موظف حكومي',
      height_cm: 173, marital_status: 'single', want_children: 'yes',
      bio: 'موظف حكومي، ملتزم دينياً، أبحث عن زوجة محافظة',
      interests: JSON.stringify(['قرآن', 'رياضة', 'عائلة']),
      languages: JSON.stringify(['العربية']),
      income_range: '8000-12000',
      imageUrl: 'https://i.pravatar.cc/400?img=29'
    },
    {
      role: 'male', display_name: 'عبدالرحمن الحمد', dob: yearsAgo(30),
      city: locations[2].city, country: locations[2].country, location: JSON.stringify({ lat: locations[2].lat, lng: locations[2].lng }),
      nationality: 'سعودي', muslim_affirmed: true, religiousness: 5, prayer_freq: 'always',
      beard: 'full', education: 'ماجستير', profession: 'باحث شرعي',
      height_cm: 179, marital_status: 'single', want_children: 'yes',
      bio: 'باحث شرعي، حافظ للقرآن، أبحث عن زوجة طالبة علم',
      interests: JSON.stringify(['علم شرعي', 'قرآن', 'تعليم']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      income_range: '12000-18000',
      imageUrl: 'https://i.pravatar.cc/400?img=30'
    },
    {
      role: 'male', display_name: 'سلطان البقمي', dob: yearsAgo(28),
      city: locations[1].city, country: locations[1].country, location: JSON.stringify({ lat: locations[1].lat, lng: locations[1].lng }),
      nationality: 'سعودي', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      beard: 'trimmed', education: 'بكالوريوس', profession: 'طيار',
      height_cm: 184, marital_status: 'single', want_children: 'yes',
      bio: 'طيار، أحب السفر والمغامرات',
      interests: JSON.stringify(['طيران', 'سفر', 'رياضة']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      income_range: '25000+',
      imageUrl: 'https://i.pravatar.cc/400?img=31'
    },
    {
      role: 'male', display_name: 'هيثم القرني', dob: yearsAgo(26),
      city: locations[3].city, country: locations[3].country, location: JSON.stringify({ lat: locations[3].lat, lng: locations[3].lng }),
      nationality: 'سعودي', muslim_affirmed: true, religiousness: 3, prayer_freq: 'often',
      beard: 'none', education: 'بكالوريوس', profession: 'محرر فيديو',
      height_cm: 175, marital_status: 'single', want_children: 'yes',
      bio: 'محرر فيديو، أحب الإنتاج الإبداعي',
      interests: JSON.stringify(['إنتاج', 'سينما', 'فن']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      income_range: '10000-15000',
      imageUrl: 'https://i.pravatar.cc/400?img=32'
    },
    {
      role: 'male', display_name: 'تركي العنزي', dob: yearsAgo(32),
      city: locations[4].city, country: locations[4].country, location: JSON.stringify({ lat: locations[4].lat, lng: locations[4].lng }),
      nationality: 'سعودي', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      beard: 'trimmed', education: 'ماجستير', profession: 'مدير موارد بشرية',
      height_cm: 178, marital_status: 'divorced', want_children: 'yes',
      bio: 'مدير موارد بشرية، مطلق، أبحث عن شريكة متفاهمة',
      interests: JSON.stringify(['إدارة', 'قراءة', 'رياضة']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      income_range: '18000-25000',
      imageUrl: 'https://i.pravatar.cc/400?img=33'
    },
    {
      role: 'male', display_name: 'زياد المالكي', dob: yearsAgo(29),
      city: locations[0].city, country: locations[0].country, location: JSON.stringify({ lat: locations[0].lat, lng: locations[0].lng }),
      nationality: 'سعودي', muslim_affirmed: true, religiousness: 3, prayer_freq: 'sometimes',
      beard: 'none', education: 'بكالوريوس', profession: 'مسوق رقمي',
      height_cm: 177, marital_status: 'single', want_children: 'maybe',
      bio: 'مسوق رقمي، أحب التكنولوجيا والابتكار',
      interests: JSON.stringify(['تسويق', 'تقنية', 'ريادة']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      income_range: '12000-18000',
      imageUrl: 'https://i.pravatar.cc/400?img=34'
    },
    {
      role: 'male', display_name: 'ناصر الشهراني', dob: yearsAgo(27),
      city: locations[2].city, country: locations[2].country, location: JSON.stringify({ lat: locations[2].lat, lng: locations[2].lng }),
      nationality: 'سعودي', muslim_affirmed: true, religiousness: 5, prayer_freq: 'always',
      beard: 'full', education: 'بكالوريوس', profession: 'إمام مسجد',
      height_cm: 176, marital_status: 'single', want_children: 'yes',
      bio: 'إمام مسجد، حافظ للقرآن، أبحث عن زوجة صالحة',
      interests: JSON.stringify(['قرآن', 'دعوة', 'تعليم']),
      languages: JSON.stringify(['العربية']),
      income_range: '8000-12000',
      imageUrl: 'https://i.pravatar.cc/400?img=35'
    },
    {
      role: 'male', display_name: 'جاسر الزهراني', dob: yearsAgo(33),
      city: locations[1].city, country: locations[1].country, location: JSON.stringify({ lat: locations[1].lat, lng: locations[1].lng }),
      nationality: 'سعودي', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      beard: 'trimmed', education: 'ماجستير', profession: 'استشاري أعمال',
      height_cm: 181, marital_status: 'single', want_children: 'yes',
      bio: 'استشاري أعمال، أبحث عن شريكة طموحة',
      interests: JSON.stringify(['أعمال', 'قراءة', 'سفر']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      income_range: '25000+',
      imageUrl: 'https://i.pravatar.cc/400?img=36'
    },
    {
      role: 'male', display_name: 'عثمان الخالدي', dob: yearsAgo(24),
      city: locations[3].city, country: locations[3].country, location: JSON.stringify({ lat: locations[3].lat, lng: locations[3].lng }),
      nationality: 'سعودي', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      beard: 'trimmed', education: 'بكالوريوس', profession: 'مهندس كهرباء',
      height_cm: 174, marital_status: 'single', want_children: 'yes',
      bio: 'مهندس كهرباء حديث التخرج، طموح',
      interests: JSON.stringify(['هندسة', 'تقنية', 'رياضة']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      income_range: '8000-12000',
      imageUrl: 'https://i.pravatar.cc/400?img=37'
    },

    // ==================== FEMALES (25 profiles) ====================
    
    // High religiousness females
    {
      role: 'female', display_name: 'فاطمة الأحمد', dob: yearsAgo(25),
      city: locations[0].city, country: locations[0].country, location: JSON.stringify({ lat: locations[0].lat, lng: locations[0].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 5, prayer_freq: 'always',
      hijab: 'full', halal_diet: 'strict', education: 'بكالوريوس', profession: 'معلمة قرآن',
      height_cm: 162, marital_status: 'single', want_children: 'yes',
      bio: 'معلمة قرآن، حافظة للقرآن، أبحث عن زوج صالح ملتزم',
      interests: JSON.stringify(['قرآن', 'تعليم', 'عائلة']),
      languages: JSON.stringify(['العربية']),
      imageUrl: 'https://i.pravatar.cc/400?img=40'
    },
    {
      role: 'female', display_name: 'مريم السالم', dob: yearsAgo(27),
      city: locations[1].city, country: locations[1].country, location: JSON.stringify({ lat: locations[1].lat, lng: locations[1].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 5, prayer_freq: 'always',
      hijab: 'full', education: 'ماجستير', profession: 'صيدلانية',
      height_cm: 165, marital_status: 'single', want_children: 'yes',
      bio: 'صيدلانية، ملتزمة دينياً، أبحث عن زوج صالح',
      interests: JSON.stringify(['صحة', 'قراءة', 'عائلة']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      imageUrl: 'https://i.pravatar.cc/400?img=41'
    },
    {
      role: 'female', display_name: 'عائشة المطيري', dob: yearsAgo(23),
      city: locations[2].city, country: locations[2].country, location: JSON.stringify({ lat: locations[2].lat, lng: locations[2].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 5, prayer_freq: 'always',
      hijab: 'full', education: 'بكالوريوس', profession: 'طالبة دراسات عليا',
      height_cm: 160, marital_status: 'single', want_children: 'yes',
      bio: 'طالبة دراسات عليا في الشريعة، حافظة للقرآن',
      interests: JSON.stringify(['علم شرعي', 'قرآن', 'قراءة']),
      languages: JSON.stringify(['العربية']),
      imageUrl: 'https://i.pravatar.cc/400?img=42'
    },

    // Medium religiousness females
    {
      role: 'female', display_name: 'نورة العتيبي', dob: yearsAgo(26),
      city: locations[3].city, country: locations[3].country, location: JSON.stringify({ lat: locations[3].lat, lng: locations[3].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      hijab: 'modern', education: 'ماجستير', profession: 'مهندسة معمارية',
      height_cm: 168, marital_status: 'single', want_children: 'yes',
      bio: 'مهندسة معمارية، أحب التصميم والإبداع',
      interests: JSON.stringify(['هندسة', 'فن', 'سفر']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      imageUrl: 'https://i.pravatar.cc/400?img=43'
    },
    {
      role: 'female', display_name: 'لينا الحربي', dob: yearsAgo(28),
      city: locations[4].city, country: locations[4].country, location: JSON.stringify({ lat: locations[4].lat, lng: locations[4].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      hijab: 'modern', education: 'ماجستير', profession: 'طبيبة أسنان',
      height_cm: 163, marital_status: 'single', want_children: 'yes',
      bio: 'طبيبة أسنان، أبحث عن شريك طموح',
      interests: JSON.stringify(['طب', 'رياضة', 'قراءة']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      imageUrl: 'https://i.pravatar.cc/400?img=44'
    },
    {
      role: 'female', display_name: 'سارة القحطاني', dob: yearsAgo(24),
      city: locations[0].city, country: locations[0].country, location: JSON.stringify({ lat: locations[0].lat, lng: locations[0].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 3, prayer_freq: 'often',
      hijab: 'modern', education: 'بكالوريوس', profession: 'مصممة جرافيك',
      height_cm: 161, marital_status: 'single', want_children: 'yes',
      bio: 'مصممة جرافيك، مبدعة، أحب الفن والثقافة',
      interests: JSON.stringify(['تصميم', 'فن', 'موسيقى']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      imageUrl: 'https://i.pravatar.cc/400?img=45'
    },

    // Divorced/widowed females
    {
      role: 'female', display_name: 'هدى الشمري', dob: yearsAgo(32),
      city: locations[1].city, country: locations[1].country, location: JSON.stringify({ lat: locations[1].lat, lng: locations[1].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      hijab: 'full', education: 'بكالوريوس', profession: 'معلمة',
      height_cm: 164, marital_status: 'divorced', want_children: 'maybe',
      bio: 'معلمة، مطلقة بطفلين، أبحث عن شريك متفاهم',
      interests: JSON.stringify(['تعليم', 'عائلة', 'قراءة']),
      languages: JSON.stringify(['العربية']),
      imageUrl: 'https://i.pravatar.cc/400?img=46'
    },
    {
      role: 'female', display_name: 'أمل الزهراني', dob: yearsAgo(29),
      city: locations[2].city, country: locations[2].country, location: JSON.stringify({ lat: locations[2].lat, lng: locations[2].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 5, prayer_freq: 'always',
      hijab: 'full', education: 'ماجستير', profession: 'محاضرة جامعية',
      height_cm: 166, marital_status: 'widowed', want_children: 'maybe',
      bio: 'محاضرة جامعية، أرملة بلا أطفال، أبحث عن بداية جديدة',
      interests: JSON.stringify(['تعليم', 'قراءة', 'قرآن']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      imageUrl: 'https://i.pravatar.cc/400?img=47'
    },

    // Younger females
    {
      role: 'female', display_name: 'ريم الدوسري', dob: yearsAgo(22),
      city: locations[3].city, country: locations[3].country, location: JSON.stringify({ lat: locations[3].lat, lng: locations[3].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      hijab: 'modern', education: 'بكالوريوس', profession: 'مبرمجة',
      height_cm: 159, marital_status: 'single', want_children: 'yes',
      bio: 'مبرمجة حديثة التخرج، أحب التقنية',
      interests: JSON.stringify(['برمجة', 'تقنية', 'قراءة']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      imageUrl: 'https://i.pravatar.cc/400?img=48'
    },
    {
      role: 'female', display_name: 'رهف العمري', dob: yearsAgo(23),
      city: locations[4].city, country: locations[4].country, location: JSON.stringify({ lat: locations[4].lat, lng: locations[4].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 3, prayer_freq: 'sometimes',
      hijab: 'modern', education: 'بكالوريوس', profession: 'إعلامية',
      height_cm: 167, marital_status: 'single', want_children: 'yes',
      bio: 'إعلامية، أحب التواصل والإبداع',
      interests: JSON.stringify(['إعلام', 'كتابة', 'سفر']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      imageUrl: 'https://i.pravatar.cc/400?img=49'
    },

    // International females
    {
      role: 'female', display_name: 'ياسمين حسن', dob: yearsAgo(26),
      city: locations[5].city, country: locations[5].country, location: JSON.stringify({ lat: locations[5].lat, lng: locations[5].lng }),
      nationality: 'مصرية', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      hijab: 'modern', education: 'ماجستير', profession: 'محامية',
      height_cm: 165, marital_status: 'single', want_children: 'yes',
      bio: 'محامية من القاهرة، أبحث عن شريك طموح',
      interests: JSON.stringify(['قانون', 'قراءة', 'سفر']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      imageUrl: 'https://i.pravatar.cc/400?img=50'
    },
    {
      role: 'female', display_name: 'ليلى الكندي', dob: yearsAgo(27),
      city: locations[6].city, country: locations[6].country, location: JSON.stringify({ lat: locations[6].lat, lng: locations[6].lng }),
      nationality: 'إماراتية', muslim_affirmed: true, religiousness: 3, prayer_freq: 'often',
      hijab: 'modern', education: 'ماجستير', profession: 'مديرة تسويق',
      height_cm: 170, marital_status: 'single', want_children: 'yes',
      bio: 'مديرة تسويق في دبي، طموحة ومبدعة',
      interests: JSON.stringify(['تسويق', 'أعمال', 'سفر']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      imageUrl: 'https://i.pravatar.cc/400?img=51'
    },

    // More diverse scenarios
    {
      role: 'female', display_name: 'جميلة الغامدي', dob: yearsAgo(30),
      city: locations[0].city, country: locations[0].country, location: JSON.stringify({ lat: locations[0].lat, lng: locations[0].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 5, prayer_freq: 'always',
      hijab: 'full', education: 'دكتوراه', profession: 'باحثة شرعية',
      height_cm: 162, marital_status: 'single', want_children: 'yes',
      bio: 'باحثة شرعية، حافظة للقرآن، طالبة علم',
      interests: JSON.stringify(['علم شرعي', 'قرآن', 'تعليم']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      imageUrl: 'https://i.pravatar.cc/400?img=52'
    },
    {
      role: 'female', display_name: 'بشرى السبيعي', dob: yearsAgo(25),
      city: locations[1].city, country: locations[1].country, location: JSON.stringify({ lat: locations[1].lat, lng: locations[1].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      hijab: 'modern', education: 'بكالوريوس', profession: 'ممرضة',
      height_cm: 163, marital_status: 'single', want_children: 'yes',
      bio: 'ممرضة، أحب مساعدة الناس',
      interests: JSON.stringify(['صحة', 'عناية', 'قراءة']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      imageUrl: 'https://i.pravatar.cc/400?img=53'
    },
    {
      role: 'female', display_name: 'دانة الراشد', dob: yearsAgo(24),
      city: locations[2].city, country: locations[2].country, location: JSON.stringify({ lat: locations[2].lat, lng: locations[2].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 3, prayer_freq: 'often',
      hijab: 'modern', education: 'بكالوريوس', profession: 'مترجمة',
      height_cm: 161, marital_status: 'single', want_children: 'yes',
      bio: 'مترجمة، أحب اللغات والثقافات',
      interests: JSON.stringify(['لغات', 'ترجمة', 'سفر']),
      languages: JSON.stringify(['العربية', 'الإنجليزية', 'الفرنسية']),
      imageUrl: 'https://i.pravatar.cc/400?img=54'
    },
    {
      role: 'female', display_name: 'شهد النجار', dob: yearsAgo(28),
      city: locations[7].city, country: locations[7].country, location: JSON.stringify({ lat: locations[7].lat, lng: locations[7].lng }),
      nationality: 'أردنية', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      hijab: 'modern', education: 'ماجستير', profession: 'مهندسة كمبيوتر',
      height_cm: 164, marital_status: 'single', want_children: 'yes',
      bio: 'مهندسة كمبيوتر من عمّان، أحب التكنولوجيا',
      interests: JSON.stringify(['برمجة', 'تقنية', 'قراءة']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      imageUrl: 'https://i.pravatar.cc/400?img=55'
    },
    {
      role: 'female', display_name: 'رنا خليل', dob: yearsAgo(26),
      city: locations[8].city, country: locations[8].country, location: JSON.stringify({ lat: locations[8].lat, lng: locations[8].lng }),
      nationality: 'لبنانية', muslim_affirmed: true, religiousness: 3, prayer_freq: 'sometimes',
      hijab: 'modern', education: 'بكالوريوس', profession: 'مصممة أزياء',
      height_cm: 166, marital_status: 'single', want_children: 'yes',
      bio: 'مصممة أزياء، أحب الموضة والفن',
      interests: JSON.stringify(['تصميم', 'أزياء', 'فن']),
      languages: JSON.stringify(['العربية', 'الفرنسية', 'الإنجليزية']),
      imageUrl: 'https://i.pravatar.cc/400?img=56'
    },
    {
      role: 'female', display_name: 'منى الكعبي', dob: yearsAgo(29),
      city: locations[9].city, country: locations[9].country, location: JSON.stringify({ lat: locations[9].lat, lng: locations[9].lng }),
      nationality: 'قطرية', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      hijab: 'modern', education: 'ماجستير', profession: 'مديرة مشروع',
      height_cm: 168, marital_status: 'single', want_children: 'yes',
      bio: 'مديرة مشاريع في الدوحة، طموحة',
      interests: JSON.stringify(['إدارة', 'أعمال', 'قراءة']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      imageUrl: 'https://i.pravatar.cc/400?img=57'
    },

    // More females for testing
    {
      role: 'female', display_name: 'غادة الشهري', dob: yearsAgo(23),
      city: locations[0].city, country: locations[0].country, location: JSON.stringify({ lat: locations[0].lat, lng: locations[0].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 5, prayer_freq: 'always',
      hijab: 'full', education: 'بكالوريوس', profession: 'داعية',
      height_cm: 160, marital_status: 'single', want_children: 'yes',
      bio: 'داعية، حافظة للقرآن، أبحث عن زوج صالح',
      interests: JSON.stringify(['دعوة', 'قرآن', 'تعليم']),
      languages: JSON.stringify(['العربية']),
      imageUrl: 'https://i.pravatar.cc/400?img=58'
    },
    {
      role: 'female', display_name: 'وفاء الحمد', dob: yearsAgo(27),
      city: locations[1].city, country: locations[1].country, location: JSON.stringify({ lat: locations[1].lat, lng: locations[1].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      hijab: 'modern', education: 'ماجستير', profession: 'محللة مالية',
      height_cm: 165, marital_status: 'single', want_children: 'yes',
      bio: 'محللة مالية، أحب الأرقام والتحليل',
      interests: JSON.stringify(['مال', 'استثمار', 'قراءة']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      imageUrl: 'https://i.pravatar.cc/400?img=59'
    },
    {
      role: 'female', display_name: 'إيمان البقمي', dob: yearsAgo(24),
      city: locations[2].city, country: locations[2].country, location: JSON.stringify({ lat: locations[2].lat, lng: locations[2].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 5, prayer_freq: 'always',
      hijab: 'full', education: 'بكالوريوس', profession: 'معلمة ابتدائي',
      height_cm: 162, marital_status: 'single', want_children: 'yes',
      bio: 'معلمة ابتدائي، أحب الأطفال والتعليم',
      interests: JSON.stringify(['تعليم', 'أطفال', 'قرآن']),
      languages: JSON.stringify(['العربية']),
      imageUrl: 'https://i.pravatar.cc/400?img=60'
    },
    {
      role: 'female', display_name: 'جود القرني', dob: yearsAgo(25),
      city: locations[3].city, country: locations[3].country, location: JSON.stringify({ lat: locations[3].lat, lng: locations[3].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 3, prayer_freq: 'often',
      hijab: 'modern', education: 'بكالوريوس', profession: 'مذيعة',
      height_cm: 169, marital_status: 'single', want_children: 'yes',
      bio: 'مذيعة، أحب الإعلام والتواصل',
      interests: JSON.stringify(['إعلام', 'تقديم', 'ثقافة']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      imageUrl: 'https://i.pravatar.cc/400?img=61'
    },
    {
      role: 'female', display_name: 'أسماء العنزي', dob: yearsAgo(30),
      city: locations[4].city, country: locations[4].country, location: JSON.stringify({ lat: locations[4].lat, lng: locations[4].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      hijab: 'modern', education: 'ماجستير', profession: 'مستشارة تربوية',
      height_cm: 164, marital_status: 'divorced', want_children: 'yes',
      bio: 'مستشارة تربوية، مطلقة بلا أطفال',
      interests: JSON.stringify(['تربية', 'استشارات', 'قراءة']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      imageUrl: 'https://i.pravatar.cc/400?img=62'
    },
    {
      role: 'female', display_name: 'حنان المالكي', dob: yearsAgo(26),
      city: locations[0].city, country: locations[0].country, location: JSON.stringify({ lat: locations[0].lat, lng: locations[0].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      hijab: 'modern', education: 'بكالوريوس', profession: 'صحفية',
      height_cm: 163, marital_status: 'single', want_children: 'yes',
      bio: 'صحفية، أحب الكتابة والتحقيق',
      interests: JSON.stringify(['صحافة', 'كتابة', 'ثقافة']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      imageUrl: 'https://i.pravatar.cc/400?img=63'
    },
    {
      role: 'female', display_name: 'عبير الشهراني', dob: yearsAgo(28),
      city: locations[1].city, country: locations[1].country, location: JSON.stringify({ lat: locations[1].lat, lng: locations[1].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 5, prayer_freq: 'always',
      hijab: 'full', education: 'ماجستير', profession: 'أستاذة شريعة',
      height_cm: 161, marital_status: 'single', want_children: 'yes',
      bio: 'أستاذة شريعة، طالبة علم، حافظة للقرآن',
      interests: JSON.stringify(['علم شرعي', 'قرآن', 'تدريس']),
      languages: JSON.stringify(['العربية']),
      imageUrl: 'https://i.pravatar.cc/400?img=64'
    },

    // ==================== MOTHERS (20 profiles) ====================
    
    // Mothers for sons (10 profiles)
    {
      role: 'mother', mother_for: 'son', display_name: 'أم محمد الأحمد', dob: yearsAgo(52),
      city: locations[0].city, country: locations[0].country, location: JSON.stringify({ lat: locations[0].lat, lng: locations[0].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 5, prayer_freq: 'always',
      education: 'بكالوريوس', profession: 'معلمة متقاعدة',
      ward_display_name: 'محمد', ward_dob: yearsAgo(28), ward_education: 'ماجستير',
      ward_profession: 'مهندس برمجيات', ward_city: 'الرياض',
      ward_bio: 'مهندس برمجيات، ملتزم دينياً، حافظ للقرآن',
      bio: 'أبحث عن زوجة صالحة محافظة لابني المهندس محمد',
      interests: JSON.stringify(['عائلة', 'تربية', 'قرآن']),
      languages: JSON.stringify(['العربية']),
      imageUrl: 'https://i.pravatar.cc/400?img=65'
    },
    {
      role: 'mother', mother_for: 'son', display_name: 'أم خالد السالم', dob: yearsAgo(48),
      city: locations[1].city, country: locations[1].country, location: JSON.stringify({ lat: locations[1].lat, lng: locations[1].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 5, prayer_freq: 'always',
      education: 'ثانوية', profession: 'ربة منزل',
      ward_display_name: 'خالد', ward_dob: yearsAgo(26), ward_education: 'بكالوريوس',
      ward_profession: 'طبيب', ward_city: 'جدة',
      ward_bio: 'طبيب، ملتزم دينياً، يبحث عن زوجة صالحة',
      bio: 'أبحث عن زوجة صالحة محافظة لابني الطبيب خالد',
      interests: JSON.stringify(['عائلة', 'طبخ', 'قرآن']),
      languages: JSON.stringify(['العربية']),
      imageUrl: 'https://i.pravatar.cc/400?img=66'
    },
    {
      role: 'mother', mother_for: 'son', display_name: 'أم عبدالله المطيري', dob: yearsAgo(55),
      city: locations[2].city, country: locations[2].country, location: JSON.stringify({ lat: locations[2].lat, lng: locations[2].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 5, prayer_freq: 'always',
      education: 'ماجستير', profession: 'أستاذة متقاعدة',
      ward_display_name: 'عبدالله', ward_dob: yearsAgo(30), ward_education: 'دكتوراه',
      ward_profession: 'أستاذ جامعي', ward_city: 'مكة',
      ward_bio: 'أستاذ جامعي، حافظ للقرآن، باحث شرعي',
      bio: 'أبحث عن زوجة صالحة طالبة علم لابني الدكتور عبدالله',
      interests: JSON.stringify(['علم', 'تربية', 'قرآن']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      imageUrl: 'https://i.pravatar.cc/400?img=67'
    },
    {
      role: 'mother', mother_for: 'son', display_name: 'أم أحمد الشمري', dob: yearsAgo(50),
      city: locations[3].city, country: locations[3].country, location: JSON.stringify({ lat: locations[3].lat, lng: locations[3].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      education: 'بكالوريوس', profession: 'موظفة',
      ward_display_name: 'أحمد', ward_dob: yearsAgo(27), ward_education: 'ماجستير',
      ward_profession: 'محاسب', ward_city: 'المدينة',
      ward_bio: 'محاسب قانوني، أحب الرياضة والسفر',
      bio: 'أبحث عن زوجة متعلمة لابني المحاسب أحمد',
      interests: JSON.stringify(['عائلة', 'طبخ', 'قراءة']),
      languages: JSON.stringify(['العربية']),
      imageUrl: 'https://i.pravatar.cc/400?img=68'
    },
    {
      role: 'mother', mother_for: 'son', display_name: 'أم سعد القحطاني', dob: yearsAgo(53),
      city: locations[4].city, country: locations[4].country, location: JSON.stringify({ lat: locations[4].lat, lng: locations[4].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 5, prayer_freq: 'always',
      education: 'ثانوية', profession: 'ربة منزل',
      ward_display_name: 'سعد', ward_dob: yearsAgo(29), ward_education: 'بكالوريوس',
      ward_profession: 'مدير مبيعات', ward_city: 'الدمام',
      ward_bio: 'مدير مبيعات ناجح، ملتزم دينياً',
      bio: 'أبحث عن زوجة صالحة محافظة لابني سعد',
      interests: JSON.stringify(['عائلة', 'تربية', 'قرآن']),
      languages: JSON.stringify(['العربية']),
      imageUrl: 'https://i.pravatar.cc/400?img=69'
    },
    {
      role: 'mother', mother_for: 'son', display_name: 'أم فيصل الدوسري', dob: yearsAgo(49),
      city: locations[0].city, country: locations[0].country, location: JSON.stringify({ lat: locations[0].lat, lng: locations[0].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      education: 'بكالوريوس', profession: 'معلمة',
      ward_display_name: 'فيصل', ward_dob: yearsAgo(25), ward_education: 'بكالوريوس',
      ward_profession: 'مصمم جرافيك', ward_city: 'الرياض',
      ward_bio: 'مصمم مبدع، أحب الفن والثقافة',
      bio: 'أبحث عن زوجة متفاهمة لابني المصمم فيصل',
      interests: JSON.stringify(['عائلة', 'فن', 'قراءة']),
      languages: JSON.stringify(['العربية']),
      imageUrl: 'https://i.pravatar.cc/400?img=70'
    },
    {
      role: 'mother', mother_for: 'son', display_name: 'أم عمر الحربي', dob: yearsAgo(47),
      city: locations[1].city, country: locations[1].country, location: JSON.stringify({ lat: locations[1].lat, lng: locations[1].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 3, prayer_freq: 'often',
      education: 'بكالوريوس', profession: 'موظفة بنك',
      ward_display_name: 'عمر', ward_dob: yearsAgo(24), ward_education: 'بكالوريوس',
      ward_profession: 'مبرمج', ward_city: 'جدة',
      ward_bio: 'مبرمج حديث التخرج، طموح',
      bio: 'أبحث عن زوجة متعلمة لابني المبرمج عمر',
      interests: JSON.stringify(['عائلة', 'تقنية', 'سفر']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      imageUrl: 'https://i.pravatar.cc/400?img=71'
    },
    {
      role: 'mother', mother_for: 'son', display_name: 'أم يوسف السالم', dob: yearsAgo(51),
      city: locations[2].city, country: locations[2].country, location: JSON.stringify({ lat: locations[2].lat, lng: locations[2].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 5, prayer_freq: 'always',
      education: 'ثانوية', profession: 'ربة منزل',
      ward_display_name: 'يوسف', ward_dob: yearsAgo(26), ward_education: 'بكالوريوس',
      ward_profession: 'صيدلي', ward_city: 'مكة',
      ward_bio: 'صيدلي، ملتزم دينياً، أحب مساعدة الناس',
      bio: 'أبحث عن زوجة صالحة محافظة لابني الصيدلي يوسف',
      interests: JSON.stringify(['عائلة', 'صحة', 'قرآن']),
      languages: JSON.stringify(['العربية']),
      imageUrl: 'https://i.pravatar.cc/400?img=72'
    },
    {
      role: 'mother', mother_for: 'son', display_name: 'أم ماجد الغامدي', dob: yearsAgo(54),
      city: locations[3].city, country: locations[3].country, location: JSON.stringify({ lat: locations[3].lat, lng: locations[3].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      education: 'بكالوريوس', profession: 'مديرة مدرسة',
      ward_display_name: 'ماجد', ward_dob: yearsAgo(31), ward_education: 'ماجستير',
      ward_profession: 'محلل مالي', ward_city: 'المدينة',
      ward_bio: 'محلل مالي، أحب الاستثمار والرياضة',
      bio: 'أبحث عن زوجة متعلمة طموحة لابني ماجد',
      interests: JSON.stringify(['تعليم', 'عائلة', 'قراءة']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      imageUrl: 'https://i.pravatar.cc/400?img=73'
    },
    {
      role: 'mother', mother_for: 'son', display_name: 'أم بندر الراشد', dob: yearsAgo(50),
      city: locations[4].city, country: locations[4].country, location: JSON.stringify({ lat: locations[4].lat, lng: locations[4].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 3, prayer_freq: 'often',
      education: 'بكالوريوس', profession: 'موظفة',
      ward_display_name: 'بندر', ward_dob: yearsAgo(28), ward_education: 'بكالوريوس',
      ward_profession: 'مصور', ward_city: 'الدمام',
      ward_bio: 'مصور محترف، أحب السفر والفن',
      bio: 'أبحث عن زوجة متفاهمة لابني المصور بندر',
      interests: JSON.stringify(['فن', 'تصوير', 'سفر']),
      languages: JSON.stringify(['العربية']),
      imageUrl: 'https://i.pravatar.cc/400?img=74'
    },

    // Mothers for daughters (10 profiles)
    {
      role: 'mother', mother_for: 'daughter', display_name: 'أم فاطمة المحمود', dob: yearsAgo(50),
      city: locations[0].city, country: locations[0].country, location: JSON.stringify({ lat: locations[0].lat, lng: locations[0].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 5, prayer_freq: 'always',
      education: 'بكالوريوس', profession: 'معلمة متقاعدة',
      ward_display_name: 'فاطمة', ward_dob: yearsAgo(25), ward_education: 'بكالوريوس',
      ward_profession: 'معلمة قرآن', ward_city: 'الرياض',
      ward_bio: 'معلمة قرآن، حافظة للقرآن، صالحة',
      bio: 'أبحث عن زوج صالح ملتزم لابنتي المعلمة فاطمة',
      interests: JSON.stringify(['عائلة', 'تربية', 'قرآن']),
      languages: JSON.stringify(['العربية']),
      imageUrl: 'https://i.pravatar.cc/400?img=75'
    },
    {
      role: 'mother', mother_for: 'daughter', display_name: 'أم مريم العتيبي', dob: yearsAgo(48),
      city: locations[1].city, country: locations[1].country, location: JSON.stringify({ lat: locations[1].lat, lng: locations[1].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 5, prayer_freq: 'always',
      education: 'ثانوية', profession: 'ربة منزل',
      ward_display_name: 'مريم', ward_dob: yearsAgo(26), ward_education: 'ماجستير',
      ward_profession: 'صيدلانية', ward_city: 'جدة',
      ward_bio: 'صيدلانية، ملتزمة دينياً، صالحة',
      bio: 'أبحث عن زوج صالح ملتزم لابنتي الصيدلانية مريم',
      interests: JSON.stringify(['عائلة', 'طبخ', 'قرآن']),
      languages: JSON.stringify(['العربية']),
      imageUrl: 'https://i.pravatar.cc/400?img=76'
    },
    {
      role: 'mother', mother_for: 'daughter', display_name: 'أم عائشة الزهراني', dob: yearsAgo(46),
      city: locations[2].city, country: locations[2].country, location: JSON.stringify({ lat: locations[2].lat, lng: locations[2].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 5, prayer_freq: 'always',
      education: 'ماجستير', profession: 'أستاذة',
      ward_display_name: 'عائشة', ward_dob: yearsAgo(23), ward_education: 'بكالوريوس',
      ward_profession: 'طالبة دراسات عليا', ward_city: 'مكة',
      ward_bio: 'طالبة دراسات عليا في الشريعة، حافظة للقرآن',
      bio: 'أبحث عن زوج صالح طالب علم لابنتي عائشة',
      interests: JSON.stringify(['علم', 'تربية', 'قرآن']),
      languages: JSON.stringify(['العربية']),
      imageUrl: 'https://i.pravatar.cc/400?img=77'
    },
    {
      role: 'mother', mother_for: 'daughter', display_name: 'أم نورة القحطاني', dob: yearsAgo(52),
      city: locations[3].city, country: locations[3].country, location: JSON.stringify({ lat: locations[3].lat, lng: locations[3].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      education: 'بكالوريوس', profession: 'موظفة',
      ward_display_name: 'نورة', ward_dob: yearsAgo(27), ward_education: 'ماجستير',
      ward_profession: 'مهندسة معمارية', ward_city: 'المدينة',
      ward_bio: 'مهندسة معمارية، أحب التصميم والإبداع',
      bio: 'أبحث عن زوج متعلم طموح لابنتي المهندسة نورة',
      interests: JSON.stringify(['عائلة', 'فن', 'قراءة']),
      languages: JSON.stringify(['العربية']),
      imageUrl: 'https://i.pravatar.cc/400?img=78'
    },
    {
      role: 'mother', mother_for: 'daughter', display_name: 'أم لينا الشمري', dob: yearsAgo(51),
      city: locations[4].city, country: locations[4].country, location: JSON.stringify({ lat: locations[4].lat, lng: locations[4].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      education: 'ثانوية', profession: 'ربة منزل',
      ward_display_name: 'لينا', ward_dob: yearsAgo(28), ward_education: 'ماجستير',
      ward_profession: 'طبيبة أسنان', ward_city: 'الدمام',
      ward_bio: 'طبيبة أسنان، أبحث عن شريك طموح',
      bio: 'أبحث عن زوج متعلم لابنتي الطبيبة لينا',
      interests: JSON.stringify(['عائلة', 'صحة', 'قراءة']),
      languages: JSON.stringify(['العربية']),
      imageUrl: 'https://i.pravatar.cc/400?img=79'
    },
    {
      role: 'mother', mother_for: 'daughter', display_name: 'أم سارة الدوسري', dob: yearsAgo(47),
      city: locations[0].city, country: locations[0].country, location: JSON.stringify({ lat: locations[0].lat, lng: locations[0].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 3, prayer_freq: 'often',
      education: 'بكالوريوس', profession: 'معلمة',
      ward_display_name: 'سارة', ward_dob: yearsAgo(24), ward_education: 'بكالوريوس',
      ward_profession: 'مصممة جرافيك', ward_city: 'الرياض',
      ward_bio: 'مصممة جرافيك، مبدعة، أحب الفن',
      bio: 'أبحث عن زوج متفاهم لابنتي المصممة سارة',
      interests: JSON.stringify(['عائلة', 'فن', 'تصميم']),
      languages: JSON.stringify(['العربية']),
      imageUrl: 'https://i.pravatar.cc/400?img=80'
    },
    {
      role: 'mother', mother_for: 'daughter', display_name: 'أم ريم الحربي', dob: yearsAgo(45),
      city: locations[1].city, country: locations[1].country, location: JSON.stringify({ lat: locations[1].lat, lng: locations[1].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      education: 'بكالوريوس', profession: 'موظفة',
      ward_display_name: 'ريم', ward_dob: yearsAgo(22), ward_education: 'بكالوريوس',
      ward_profession: 'مبرمجة', ward_city: 'جدة',
      ward_bio: 'مبرمجة حديثة التخرج، أحب التقنية',
      bio: 'أبحث عن زوج متعلم لابنتي المبرمجة ريم',
      interests: JSON.stringify(['عائلة', 'تقنية', 'قراءة']),
      languages: JSON.stringify(['العربية']),
      imageUrl: 'https://i.pravatar.cc/400?img=81'
    },
    {
      role: 'mother', mother_for: 'daughter', display_name: 'أم رهف السالم', dob: yearsAgo(49),
      city: locations[2].city, country: locations[2].country, location: JSON.stringify({ lat: locations[2].lat, lng: locations[2].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 3, prayer_freq: 'often',
      education: 'ثانوية', profession: 'ربة منزل',
      ward_display_name: 'رهف', ward_dob: yearsAgo(23), ward_education: 'بكالوريوس',
      ward_profession: 'إعلامية', ward_city: 'مكة',
      ward_bio: 'إعلامية، أحب التواصل والإبداع',
      bio: 'أبحث عن زوج متفاهم لابنتي الإعلامية رهف',
      interests: JSON.stringify(['عائلة', 'إعلام', 'ثقافة']),
      languages: JSON.stringify(['العربية']),
      imageUrl: 'https://i.pravatar.cc/400?img=82'
    },
    {
      role: 'mother', mother_for: 'daughter', display_name: 'أم بشرى الغامدي', dob: yearsAgo(48),
      city: locations[3].city, country: locations[3].country, location: JSON.stringify({ lat: locations[3].lat, lng: locations[3].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      education: 'بكالوريوس', profession: 'معلمة',
      ward_display_name: 'بشرى', ward_dob: yearsAgo(25), ward_education: 'بكالوريوس',
      ward_profession: 'ممرضة', ward_city: 'المدينة',
      ward_bio: 'ممرضة، أحب مساعدة الناس',
      bio: 'أبحث عن زوج صالح لابنتي الممرضة بشرى',
      interests: JSON.stringify(['عائلة', 'صحة', 'قراءة']),
      languages: JSON.stringify(['العربية']),
      imageUrl: 'https://i.pravatar.cc/400?img=83'
    },
    {
      role: 'mother', mother_for: 'daughter', display_name: 'أم دانة الراشد', dob: yearsAgo(47),
      city: locations[4].city, country: locations[4].country, location: JSON.stringify({ lat: locations[4].lat, lng: locations[4].lng }),
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 3, prayer_freq: 'often',
      education: 'بكالوريوس', profession: 'موظفة',
      ward_display_name: 'دانة', ward_dob: yearsAgo(24), ward_education: 'بكالوريوس',
      ward_profession: 'مترجمة', ward_city: 'الدمام',
      ward_bio: 'مترجمة، أحب اللغات والثقافات',
      bio: 'أبحث عن زوج متعلم لابنتي المترجمة دانة',
      interests: JSON.stringify(['عائلة', 'لغات', 'سفر']),
      languages: JSON.stringify(['العربية', 'الإنجليزية']),
      imageUrl: 'https://i.pravatar.cc/400?img=84'
    },
  ];

  console.log(`📝 Creating ${profiles.length} profiles...`);
  console.log(`   - Males: ${profiles.filter(p => p.role === 'male').length}`);
  console.log(`   - Females: ${profiles.filter(p => p.role === 'female').length}`);
  console.log(`   - Mothers (sons): ${profiles.filter(p => p.role === 'mother' && p.mother_for === 'son').length}`);
  console.log(`   - Mothers (daughters): ${profiles.filter(p => p.role === 'mother' && p.mother_for === 'daughter').length}\n`);

  let successCount = 0;
  let failCount = 0;

  for (const profile of profiles) {
    try {
      const { imageUrl, ...userData } = profile;
      
      // Create user
      const user = await prisma.user.create({ data: userData as any });
      successCount++;
      console.log(`✅ Created: ${user.display_name} (${user.role}${user.mother_for ? ` - ${user.mother_for}` : ''})`);

      // Download and save image
      try {
        const filename = `${user.id}-0.jpg`;
        const filepath = path.join(uploadsDir, filename);
        await downloadImage(imageUrl, filepath);
        
        // Create photo record
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
        console.log(`   ⚠️  Photo download failed (continuing...)`);
      }

      // Create preferences based on role
      const prefData: any = {
        userId: user.id,
        religiousness_min: profile.religiousness >= 4 ? 4 : 3,
      };

      if (profile.role === 'male') {
        prefData.age_min = 20;
        prefData.age_max = 35;
      } else if (profile.role === 'female') {
        prefData.age_min = 24;
        prefData.age_max = 40;
      } else if (profile.role === 'mother') {
        prefData.age_min = profile.mother_for === 'son' ? 20 : 24;
        prefData.age_max = profile.mother_for === 'son' ? 35 : 40;
        prefData.show_only_mothers = false;
      }

      prefData.distance_km = 100; // Default 100km

      await prisma.preference.create({ data: prefData });

    } catch (err: any) {
      failCount++;
      console.error(`❌ Failed to create ${profile.display_name}:`, err.message);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎉 Seed completed!`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📊 Total: ${profiles.length}`);
  console.log(`${'='.repeat(60)}\n`);

  console.log('📋 Test Scenarios Covered:');
  console.log('   1. High religiousness users (5/5)');
  console.log('   2. Medium religiousness users (3-4/5)');
  console.log('   3. Different age ranges (22-55)');
  console.log('   4. Multiple cities across Saudi Arabia');
  console.log('   5. International users (Egypt, UAE, Jordan, Lebanon, Qatar)');
  console.log('   6. Divorced and widowed users');
  console.log('   7. Various professions and education levels');
  console.log('   8. Mothers representing sons (10 profiles)');
  console.log('   9. Mothers representing daughters (10 profiles)');
  console.log('  10. Different marital statuses (single, divorced, widowed)');
  console.log('  11. Various interests and languages');
  console.log('  12. Income ranges for males\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

