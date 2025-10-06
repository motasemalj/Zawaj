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
  console.log('Starting comprehensive seed...');
  
  // Clean up existing data
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

  // Extended sample profiles with diverse data
  const profiles = [
    // Males (15 profiles)
    {
      role: 'male', display_name: 'أحمد محمد', dob: yearsAgo(28), city: 'الرياض', country: 'السعودية',
      nationality: 'سعودي', muslim_affirmed: true, religiousness: 5, prayer_freq: 'always',
      education: 'بكالوريوس هندسة', profession: 'مهندس برمجيات', marital_status: 'single',
      bio: 'أبحث عن شريكة حياة ملتزمة، أحب السفر والقراءة والتقنية',
      interests: JSON.stringify(['قراءة','رحلات','تقنية']), 
      languages: JSON.stringify(['العربية','الإنجليزية']),
      beard: 'yes', halal_diet: 'yes',
      imageUrl: 'https://i.pravatar.cc/400?img=12'
    },
    {
      role: 'male', display_name: 'خالد عبدالله', dob: yearsAgo(32), city: 'جدة', country: 'السعودية',
      nationality: 'سعودي', muslim_affirmed: true, religiousness: 5, prayer_freq: 'always',
      education: 'ماجستير إدارة أعمال', profession: 'مدير مشاريع', marital_status: 'single',
      bio: 'ملتزم دينياً، أبحث عن زوجة صالحة لبناء أسرة مسلمة',
      interests: JSON.stringify(['رياضة','قراءة القرآن','أعمال']),
      languages: JSON.stringify(['العربية','الإنجليزية']),
      beard: 'yes', halal_diet: 'yes', income_range: '10000-20000',
      imageUrl: 'https://i.pravatar.cc/400?img=13'
    },
    {
      role: 'male', display_name: 'عمر حسن', dob: yearsAgo(30), city: 'دبي', country: 'الإمارات',
      nationality: 'إماراتي', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      education: 'بكالوريوس طب', profession: 'طبيب', marital_status: 'single',
      bio: 'طبيب مقيم، أحب مساعدة الآخرين والسفر. أبحث عن شريكة تفهم طبيعة عملي',
      interests: JSON.stringify(['طب','سفر','رياضة']),
      languages: JSON.stringify(['العربية','الإنجليزية','الفرنسية']),
      beard: 'no', halal_diet: 'yes',
      imageUrl: 'https://i.pravatar.cc/400?img=14'
    },
    {
      role: 'male', display_name: 'يوسف علي', dob: yearsAgo(27), city: 'الدوحة', country: 'قطر',
      nationality: 'قطري', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      education: 'بكالوريوس اقتصاد', profession: 'محلل مالي', marital_status: 'single',
      bio: 'محلل مالي، أحب الرياضة والقراءة. أسعى لبناء حياة مستقرة',
      interests: JSON.stringify(['اقتصاد','كرة قدم','سينما']),
      languages: JSON.stringify(['العربية','الإنجليزية']),
      imageUrl: 'https://i.pravatar.cc/400?img=15'
    },
    {
      role: 'male', display_name: 'محمد سعيد', dob: yearsAgo(29), city: 'القاهرة', country: 'مصر',
      nationality: 'مصري', muslim_affirmed: true, religiousness: 5, prayer_freq: 'always',
      education: 'بكالوريوس شريعة', profession: 'معلم', marital_status: 'single',
      bio: 'معلم شريعة، أبحث عن زوجة ملتزمة تشاركني قيمي الدينية',
      interests: JSON.stringify(['تعليم','دعوة','قراءة']),
      languages: JSON.stringify(['العربية']),
      beard: 'yes', halal_diet: 'yes',
      imageUrl: 'https://i.pravatar.cc/400?img=33'
    },
    {
      role: 'male', display_name: 'عبدالرحمن أحمد', dob: yearsAgo(31), city: 'عمّان', country: 'الأردن',
      nationality: 'أردني', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      education: 'ماجستير هندسة', profession: 'مهندس معماري', marital_status: 'divorced',
      bio: 'مهندس معماري، مطلق بدون أطفال. أبحث عن بداية جديدة',
      interests: JSON.stringify(['تصميم','فن','سفر']),
      languages: JSON.stringify(['العربية','الإنجليزية']),
      imageUrl: 'https://i.pravatar.cc/400?img=51'
    },
    {
      role: 'male', display_name: 'ياسر محمود', dob: yearsAgo(26), city: 'دمشق', country: 'سوريا',
      nationality: 'سوري', muslim_affirmed: true, religiousness: 3, prayer_freq: 'sometimes',
      education: 'بكالوريوس صيدلة', profession: 'صيدلي', marital_status: 'single',
      bio: 'صيدلي، أحب الكيمياء والعلوم. أبحث عن شريكة متعلمة',
      interests: JSON.stringify(['علوم','قراءة','موسيقى']),
      languages: JSON.stringify(['العربية','الإنجليزية','التركية']),
      imageUrl: 'https://i.pravatar.cc/400?img=52'
    },
    {
      role: 'male', display_name: 'طارق فيصل', dob: yearsAgo(35), city: 'الكويت', country: 'الكويت',
      nationality: 'كويتي', muslim_affirmed: true, religiousness: 5, prayer_freq: 'always',
      education: 'دكتوراه', profession: 'أستاذ جامعي', marital_status: 'widowed',
      bio: 'أستاذ جامعي، أرمل. أبحث عن شريكة حياة تشاركني حب العلم',
      interests: JSON.stringify(['تدريس','بحث علمي','قراءة']),
      languages: JSON.stringify(['العربية','الإنجليزية']),
      beard: 'yes', halal_diet: 'yes', income_range: '20000+',
      imageUrl: 'https://i.pravatar.cc/400?img=56'
    },
    {
      role: 'male', display_name: 'سامي حسين', dob: yearsAgo(24), city: 'بيروت', country: 'لبنان',
      nationality: 'لبناني', muslim_affirmed: true, religiousness: 3, prayer_freq: 'often',
      education: 'بكالوريوس إعلام', profession: 'صحفي', marital_status: 'single',
      bio: 'صحفي شاب، أحب الكتابة والتصوير',
      interests: JSON.stringify(['صحافة','تصوير','سفر']),
      languages: JSON.stringify(['العربية','الإنجليزية','الفرنسية']),
      imageUrl: 'https://i.pravatar.cc/400?img=59'
    },
    {
      role: 'male', display_name: 'فهد الأحمد', dob: yearsAgo(33), city: 'المنامة', country: 'البحرين',
      nationality: 'بحريني', muslim_affirmed: true, religiousness: 4, prayer_freq: 'always',
      education: 'بكالوريوس هندسة بترول', profession: 'مهندس بترول', marital_status: 'single',
      bio: 'مهندس بترول، أعمل في مشاريع كبرى. أبحث عن الاستقرار',
      interests: JSON.stringify(['هندسة','غوص','صيد']),
      languages: JSON.stringify(['العربية','الإنجليزية']),
      income_range: '15000-25000',
      imageUrl: 'https://i.pravatar.cc/400?img=60'
    },

    // Females (15 profiles)
    {
      role: 'female', display_name: 'فاطمة أحمد', dob: yearsAgo(25), city: 'دبي', country: 'الإمارات',
      nationality: 'إماراتية', muslim_affirmed: true, religiousness: 5, prayer_freq: 'always',
      education: 'ماجستير تصميم جرافيك', profession: 'مصممة جرافيك', marital_status: 'single',
      bio: 'ملتزمة دينياً، أبحث عن شريك حياة صالح يشاركني قيمي',
      interests: JSON.stringify(['تصميم','فن','قراءة']),
      languages: JSON.stringify(['العربية','الإنجليزية']),
      hijab: 'yes', halal_diet: 'yes',
      imageUrl: 'https://i.pravatar.cc/400?img=5'
    },
    {
      role: 'female', display_name: 'مريم سعيد', dob: yearsAgo(26), city: 'الرياض', country: 'السعودية',
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 5, prayer_freq: 'always',
      education: 'بكالوريوس تمريض', profession: 'ممرضة', marital_status: 'single',
      bio: 'ممرضة محترفة، أحب مساعدة الآخرين والعمل الإنساني',
      interests: JSON.stringify(['طب','طبخ','سفر']),
      languages: JSON.stringify(['العربية','الإنجليزية']),
      hijab: 'yes', halal_diet: 'yes',
      imageUrl: 'https://i.pravatar.cc/400?img=9'
    },
    {
      role: 'female', display_name: 'سارة محمود', dob: yearsAgo(24), city: 'مسقط', country: 'عُمان',
      nationality: 'عمانية', muslim_affirmed: true, religiousness: 5, prayer_freq: 'always',
      education: 'بكالوريوس تربية', profession: 'معلمة', marital_status: 'single',
      bio: 'معلمة، أحب التعليم والعمل مع الأطفال. أسعى لبناء أسرة سعيدة',
      interests: JSON.stringify(['تعليم','قراءة','خياطة']),
      languages: JSON.stringify(['العربية']),
      hijab: 'yes', halal_diet: 'yes',
      imageUrl: 'https://i.pravatar.cc/400?img=10'
    },
    {
      role: 'female', display_name: 'نورة عبدالله', dob: yearsAgo(29), city: 'الكويت', country: 'الكويت',
      nationality: 'كويتية', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      education: 'ماجستير علوم حاسب', profession: 'مبرمجة', marital_status: 'single',
      bio: 'مهندسة برمجيات، أحب التقنية والابتكار. أبحث عن شريك يقدر طموحي',
      interests: JSON.stringify(['برمجة','تقنية','قراءة']),
      languages: JSON.stringify(['العربية','الإنجليزية']),
      hijab: 'yes', halal_diet: 'yes',
      imageUrl: 'https://i.pravatar.cc/400?img=20'
    },
    {
      role: 'female', display_name: 'ليلى حسن', dob: yearsAgo(27), city: 'الدوحة', country: 'قطر',
      nationality: 'قطرية', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      education: 'بكالوريوس صحافة', profession: 'مذيعة', marital_status: 'single',
      bio: 'مذيعة تلفزيونية، أحب التواصل مع الناس والإعلام',
      interests: JSON.stringify(['إعلام','قراءة','سفر']),
      languages: JSON.stringify(['العربية','الإنجليزية']),
      hijab: 'yes',
      imageUrl: 'https://i.pravatar.cc/400?img=23'
    },
    {
      role: 'female', display_name: 'هند محمد', dob: yearsAgo(23), city: 'أبوظبي', country: 'الإمارات',
      nationality: 'إماراتية', muslim_affirmed: true, religiousness: 5, prayer_freq: 'always',
      education: 'بكالوريوس طب أسنان', profession: 'طبيبة أسنان', marital_status: 'single',
      bio: 'طبيبة أسنان، أحب عملي ومساعدة الناس',
      interests: JSON.stringify(['طب','رياضة','طبخ']),
      languages: JSON.stringify(['العربية','الإنجليزية']),
      hijab: 'yes', halal_diet: 'yes',
      imageUrl: 'https://i.pravatar.cc/400?img=24'
    },
    {
      role: 'female', display_name: 'آية عبدالرحمن', dob: yearsAgo(28), city: 'عمّان', country: 'الأردن',
      nationality: 'أردنية', muslim_affirmed: true, religiousness: 5, prayer_freq: 'always',
      education: 'ماجستير علوم إسلامية', profession: 'باحثة', marital_status: 'divorced',
      bio: 'باحثة في العلوم الإسلامية، مطلقة بدون أطفال. أبحث عن بداية جديدة',
      interests: JSON.stringify(['بحث','قراءة','دعوة']),
      languages: JSON.stringify(['العربية','الإنجليزية']),
      hijab: 'yes', halal_diet: 'yes',
      imageUrl: 'https://i.pravatar.cc/400?img=25'
    },
    {
      role: 'female', display_name: 'ريم فاضل', dob: yearsAgo(22), city: 'الرباط', country: 'المغرب',
      nationality: 'مغربية', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      education: 'بكالوريوس هندسة', profession: 'مهندسة مدني', marital_status: 'single',
      bio: 'مهندسة مدني، أحب التصميم والبناء',
      interests: JSON.stringify(['هندسة','رسم','سفر']),
      languages: JSON.stringify(['العربية','الفرنسية','الإنجليزية']),
      hijab: 'yes',
      imageUrl: 'https://i.pravatar.cc/400?img=26'
    },
    {
      role: 'female', display_name: 'دينا أحمد', dob: yearsAgo(30), city: 'تونس', country: 'تونس',
      nationality: 'تونسية', muslim_affirmed: true, religiousness: 3, prayer_freq: 'sometimes',
      education: 'بكالوريوس اقتصاد', profession: 'محاسبة', marital_status: 'single',
      bio: 'محاسبة، أحب النظام والدقة في العمل',
      interests: JSON.stringify(['مالية','قراءة','موسيقى']),
      languages: JSON.stringify(['العربية','الفرنسية']),
      imageUrl: 'https://i.pravatar.cc/400?img=27'
    },
    {
      role: 'female', display_name: 'رنا خالد', dob: yearsAgo(25), city: 'جدة', country: 'السعودية',
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 5, prayer_freq: 'always',
      education: 'بكالوريوس صيدلة', profession: 'صيدلانية', marital_status: 'single',
      bio: 'صيدلانية، أحب العمل في المجال الطبي ومساعدة المرضى',
      interests: JSON.stringify(['صيدلة','قراءة','رياضة']),
      languages: JSON.stringify(['العربية','الإنجليزية']),
      hijab: 'yes', halal_diet: 'yes',
      imageUrl: 'https://i.pravatar.cc/400?img=28'
    },
    {
      role: 'female', display_name: 'لينا عمر', dob: yearsAgo(31), city: 'الإسكندرية', country: 'مصر',
      nationality: 'مصرية', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      education: 'ماجستير أدب', profession: 'كاتبة', marital_status: 'single',
      bio: 'كاتبة وشاعرة، أحب الأدب والفن',
      interests: JSON.stringify(['كتابة','شعر','قراءة']),
      languages: JSON.stringify(['العربية','الإنجليزية']),
      hijab: 'yes',
      imageUrl: 'https://i.pravatar.cc/400?img=29'
    },
    {
      role: 'female', display_name: 'أسماء يوسف', dob: yearsAgo(26), city: 'مكة', country: 'السعودية',
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 5, prayer_freq: 'always',
      education: 'بكالوريوس تغذية', profession: 'أخصائية تغذية', marital_status: 'single',
      bio: 'أخصائية تغذية، أهتم بالصحة والعافية',
      interests: JSON.stringify(['تغذية','رياضة','طبخ']),
      languages: JSON.stringify(['العربية','الإنجليزية']),
      hijab: 'yes', halal_diet: 'yes',
      imageUrl: 'https://i.pravatar.cc/400?img=30'
    },
    {
      role: 'female', display_name: 'ندى سامي', dob: yearsAgo(28), city: 'الدمام', country: 'السعودية',
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 4, prayer_freq: 'often',
      education: 'بكالوريوس تسويق', profession: 'مديرة تسويق', marital_status: 'single',
      bio: 'مديرة تسويق، أحب الإبداع والابتكار في العمل',
      interests: JSON.stringify(['تسويق','تصوير','سفر']),
      languages: JSON.stringify(['العربية','الإنجليزية']),
      hijab: 'yes',
      imageUrl: 'https://i.pravatar.cc/400?img=31'
    },
    {
      role: 'female', display_name: 'منى إبراهيم', dob: yearsAgo(27), city: 'الخبر', country: 'السعودية',
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 5, prayer_freq: 'always',
      education: 'ماجستير علم نفس', profession: 'أخصائية نفسية', marital_status: 'single',
      bio: 'أخصائية نفسية، أساعد الناس في تحسين حياتهم',
      interests: JSON.stringify(['علم نفس','قراءة','يوجا']),
      languages: JSON.stringify(['العربية','الإنجليزية']),
      hijab: 'yes', halal_diet: 'yes',
      imageUrl: 'https://i.pravatar.cc/400?img=32'
    },
    {
      role: 'female', display_name: 'شيماء علي', dob: yearsAgo(24), city: 'أبها', country: 'السعودية',
      nationality: 'سعودية', muslim_affirmed: true, religiousness: 5, prayer_freq: 'always',
      education: 'بكالوريوس علوم شرعية', profession: 'معلمة قرآن', marital_status: 'single',
      bio: 'معلمة قرآن، أحب تعليم كتاب الله',
      interests: JSON.stringify(['تعليم','قراءة القرآن','دعوة']),
      languages: JSON.stringify(['العربية']),
      hijab: 'yes', halal_diet: 'yes',
      imageUrl: 'https://i.pravatar.cc/400?img=45'
    },

    // Mothers (5 profiles)
    {
      role: 'mother', mother_for: 'son', display_name: 'أم خالد', dob: yearsAgo(50), city: 'جدة', country: 'السعودية',
      muslim_affirmed: true, 
      ward_display_name: 'خالد', ward_dob: yearsAgo(26), ward_city: 'جدة',
      ward_education: 'بكالوريوس هندسة', ward_profession: 'مهندس كهرباء',
      ward_bio: 'مهندس ملتزم، يصلي ويصوم',
      bio: 'أبحث عن زوجة صالحة لابني خالد',
      interests: JSON.stringify(['أسرة']), languages: JSON.stringify(['العربية']),
      imageUrl: 'https://i.pravatar.cc/400?img=47'
    },
    {
      role: 'mother', mother_for: 'daughter', display_name: 'أم سارة', dob: yearsAgo(48), city: 'مسقط', country: 'عُمان',
      muslim_affirmed: true, 
      ward_display_name: 'سارة', ward_dob: yearsAgo(24), ward_city: 'مسقط',
      ward_education: 'بكالوريوس طب', ward_profession: 'طبيبة',
      ward_bio: 'طبيبة ملتزمة، محجبة',
      bio: 'أبحث عن زوج صالح لابنتي سارة الطبيبة',
      interests: JSON.stringify(['تعليم']), languages: JSON.stringify(['العربية']),
      imageUrl: 'https://i.pravatar.cc/400?img=44'
    },
    {
      role: 'mother', mother_for: 'son', display_name: 'أم عبدالله', dob: yearsAgo(52), city: 'الرياض', country: 'السعودية',
      muslim_affirmed: true, 
      ward_display_name: 'عبدالله', ward_dob: yearsAgo(28), ward_city: 'الرياض',
      ward_education: 'ماجستير إدارة', ward_profession: 'مدير',
      ward_bio: 'مدير ناجح، ملتزم دينياً',
      bio: 'أبحث عن زوجة مناسبة لابني عبدالله',
      interests: JSON.stringify(['أسرة']), languages: JSON.stringify(['العربية']),
      imageUrl: 'https://i.pravatar.cc/400?img=48'
    },
    {
      role: 'mother', mother_for: 'daughter', display_name: 'أم نورة', dob: yearsAgo(46), city: 'دبي', country: 'الإمارات',
      muslim_affirmed: true, 
      ward_display_name: 'نورة', ward_dob: yearsAgo(23), ward_city: 'دبي',
      ward_education: 'بكالوريوس', ward_profession: 'معلمة',
      ward_bio: 'معلمة، ملتزمة ومحجبة',
      bio: 'أبحث عن زوج كريم لابنتي نورة',
      interests: JSON.stringify(['أسرة']), languages: JSON.stringify(['العربية']),
      imageUrl: 'https://i.pravatar.cc/400?img=49'
    },
    {
      role: 'mother', mother_for: 'son', display_name: 'أم محمد', dob: yearsAgo(54), city: 'المدينة', country: 'السعودية',
      muslim_affirmed: true, 
      ward_display_name: 'محمد', ward_dob: yearsAgo(30), ward_city: 'المدينة',
      ward_education: 'دكتوراه', ward_profession: 'أستاذ جامعي',
      ward_bio: 'أستاذ جامعي، حافظ للقرآن',
      bio: 'أبحث عن زوجة صالحة حافظة للقرآن لابني الدكتور محمد',
      interests: JSON.stringify(['أسرة','تعليم']), languages: JSON.stringify(['العربية']),
      imageUrl: 'https://i.pravatar.cc/400?img=50'
    },
  ];

  console.log('Creating users and downloading images...');
  
  for (const profile of profiles) {
    const { imageUrl, ...userData } = profile;
    
    // Create user
    const user = await prisma.user.create({ data: userData as any });
    console.log(`Created user: ${user.display_name}`);

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
      console.log(`Downloaded image for ${user.display_name}`);
    } catch (err) {
      console.error(`Failed to download image for ${user.display_name}:`, err);
    }

    // Create preferences
    await prisma.preference.create({
      data: {
        userId: user.id,
        age_min: profile.role === 'male' ? 20 : 24,
        age_max: profile.role === 'male' ? 35 : 38,
        religiousness_min: 3,
        show_only_mothers: profile.role === 'mother' ? false : undefined,
      }
    });
  }

  console.log(`\n✅ Seed completed successfully!`);
  console.log(`📊 Created ${profiles.length} profiles:`);
  console.log(`   - Males: ${profiles.filter(p => p.role === 'male').length}`);
  console.log(`   - Females: ${profiles.filter(p => p.role === 'female').length}`);
  console.log(`   - Mothers: ${profiles.filter(p => p.role === 'mother').length}`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });