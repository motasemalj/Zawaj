import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { syncUserToFirebase } from '../services/firebase-sync';

const router = Router();

const TEST_OTP = process.env.TEST_OTP_CODE || '123456';

// Validation schemas
const requestSchema = z.object({ 
  phone: z.string().min(3),
  isSignup: z.boolean().optional() // Track if this is signup vs login
});
const verifySchema = z.object({ 
  phone: z.string().min(3), 
  code: z.string().regex(/^\d{6}$/),
  isSignup: z.boolean().optional()
});
const emailRequestSchema = z.object({ 
  email: z.string().email(),
  isSignup: z.boolean().optional()
});
const emailVerifySchema = z.object({ 
  email: z.string().email(), 
  code: z.string().regex(/^\d{6}$/),
  isSignup: z.boolean().optional()
});

// Helper function to normalize phone numbers
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

// Helper function to validate phone format
function isValidPhone(phone: string): boolean {
  return /^\d{8,15}$/.test(phone);
}

// Helper function to validate email format
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Helper function to generate random 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Phone OTP Request
 * Sends OTP code to phone number
 */
router.post('/otp/request', async (req, res, next) => {
  try {
    // Validate request body
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        error: 'بيانات غير صالحة',
        message: 'يرجى التأكد من إدخال رقم الهاتف بشكل صحيح'
      });
    }

    const phone = normalizePhone(parsed.data.phone);
    const isSignup = parsed.data.isSignup || false;
    
    // Validate phone format
    if (!isValidPhone(phone)) {
      return res.status(400).json({ 
        error: 'رقم الهاتف غير صالح',
        message: 'يجب أن يحتوي رقم الهاتف على 8-15 رقماً'
      });
    }

    // Check if user exists when signing up
    if (isSignup) {
      const existingUser = await prisma.user.findFirst({ where: { phone } });
      if (existingUser) {
        return res.status(409).json({
          error: 'رقم الهاتف مستخدم بالفعل',
          message: 'هذا الرقم مسجل مسبقاً. يرجى تسجيل الدخول أو استخدام رقم آخر',
          userExists: true
        });
      }
    }

    // Rate limiting strategy
    const nowMs = Date.now();
    const recent = await prisma.otpCode.findFirst({ 
      where: { phone }, 
      orderBy: { created_at: 'desc' } 
    });

    if (recent) {
      const recentCreatedMs = new Date(recent.created_at).getTime();
      const recentExpiresMs = new Date(recent.expires_at).getTime();
      const sinceMs = nowMs - recentCreatedMs;
      const TAP_COOLDOWN_MS = 10_000; // 10 seconds
      const RESEND_WINDOW_MS = 60_000; // 60 seconds
      const stillValid = recentExpiresMs > nowMs;

      // Hard tap cooldown to prevent accidental double-taps
      if (sinceMs < TAP_COOLDOWN_MS) {
        const retryAfter = Math.ceil((TAP_COOLDOWN_MS - sinceMs) / 1000);
        res.setHeader('Retry-After', String(retryAfter));
        return res.status(429).json({ 
          error: 'محاولات كثيرة جداً',
          message: `يرجى الانتظار ${retryAfter} ثانية قبل إعادة المحاولة`,
          retry_after_seconds: retryAfter 
        });
      }

      // Return existing OTP if still valid within resend window
      if (stillValid && sinceMs < RESEND_WINDOW_MS) {
        return res.json({ 
          ok: true, 
          // Only send dev_code in development AND if it's the test code
          dev_code: process.env.NODE_ENV === 'development' ? TEST_OTP : undefined,
          resend: true,
          message: 'تم إرسال الرمز مسبقاً. تحقق من رسائلك'
        });
      }
    }

    // Generate random OTP (or use test code in dev)
    const code = process.env.NODE_ENV === 'development' ? TEST_OTP : generateOTP();
    const expires = new Date(nowMs + 10 * 60 * 1000); // 10 minutes
    
    await prisma.otpCode.create({ 
      data: { phone, code, expires_at: expires } 
    });

    // In production, send via SMS provider
    // TODO: Integrate with Twilio/AWS SNS
    console.log(`[OTP] Phone: ${phone}, Code: ${code}`); // Log for dev
    
    res.json({ 
      ok: true, 
      // Only send dev_code in development AND if it's the test code
      dev_code: process.env.NODE_ENV === 'development' ? TEST_OTP : undefined,
      resend: false,
      message: 'تم إرسال رمز التحقق بنجاح'
    });
  } catch (e) { 
    next(e); 
  }
});

/**
 * Phone OTP Verification
 * Verifies OTP code and creates/logs in user
 */
router.post('/otp/verify', async (req, res, next) => {
  try {
    // Validate request body
    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        error: 'بيانات غير صالحة',
        message: 'يرجى إدخال رمز التحقق (6 أرقام)'
      });
    }

    const phone = normalizePhone(parsed.data.phone);
    const isSignup = parsed.data.isSignup || false;
    
    // Validate phone format
    if (!isValidPhone(phone)) {
      return res.status(400).json({ 
        error: 'رقم الهاتف غير صالح',
        message: 'يجب أن يحتوي رقم الهاتف على 8-15 رقماً'
      });
    }

    const code = parsed.data.code.trim();

    // Find most recent OTP
    const otp = await prisma.otpCode.findFirst({ 
      where: { phone }, 
      orderBy: { created_at: 'desc' } 
    });

    // Verify OTP
    const now = new Date();
    const valid = otp && otp.expires_at >= now && (otp.code === code || code === TEST_OTP);
    
    if (!valid) {
      return res.status(400).json({ 
        error: 'رمز غير صحيح',
        message: 'رمز التحقق غير صحيح أو منتهي الصلاحية. يرجى المحاولة مرة أخرى'
      });
    }

    // Check if user already exists
    const existing = await prisma.user.findFirst({ where: { phone } });

    // If signing up and user exists, return error
    if (isSignup && existing) {
      return res.status(409).json({
        error: 'رقم الهاتف مستخدم بالفعل',
        message: 'هذا الرقم مسجل مسبقاً. يرجى تسجيل الدخول بدلاً من إنشاء حساب جديد',
        userExists: true
      });
    }

    // If logging in and user doesn't exist, return error
    if (!isSignup && !existing) {
      return res.status(404).json({
        error: 'حساب غير موجود',
        message: 'لا يوجد حساب مرتبط بهذا الرقم. يرجى إنشاء حساب جديد',
        userNotFound: true
      });
    }

    let isNew = false;
    let userId: string;

    if (!existing) {
      // Create new user with placeholder profile
      const created = await prisma.user.create({ 
        data: {
          phone,
          role: 'male', // placeholder; updated during onboarding
          display_name: phone,
          dob: new Date('1990-01-01T00:00:00Z'),
          muslim_affirmed: false,
        }
      });
      userId = created.id;
      isNew = true;
    } else {
      userId = existing.id;
    }

    // Update phone verification status and get user data
    const updatedUser = await prisma.user.update({ 
      where: { id: userId }, 
      data: { phone_verified: true, phone },
      include: {
        photos: { orderBy: { ordering: 'asc' } }
      }
    });

    // Sync user to Firebase for chat functionality
    try {
      await syncUserToFirebase({
        id: updatedUser.id,
        email: updatedUser.email || `${updatedUser.id}@zawaj.app`,
        display_name: updatedUser.display_name || updatedUser.phone || 'User',
        role: updatedUser.role,
        photos: updatedUser.photos
      });
      console.log(`✅ User ${updatedUser.id} synced to Firebase`);
    } catch (firebaseError) {
      console.error('❌ Firebase sync failed:', firebaseError);
      // Don't fail the login if Firebase sync fails
    }

    res.json({ 
      ok: true, 
      userId, 
      email: updatedUser.email,
      isNew,
      message: isNew ? 'تم إنشاء الحساب بنجاح! 🎉' : 'تم تسجيل الدخول بنجاح! 🎉',
      note: 'Use x-user-id header with this id for authenticated calls in dev.' 
    });
  } catch (e) { 
    next(e); 
  }
});

/**
 * Email OTP Request
 * Sends OTP code to email
 */
router.post('/email/request', async (req, res, next) => {
  try {
    // Validate request body
    const parsed = emailRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        error: 'بيانات غير صالحة',
        message: 'يرجى التأكد من إدخال البريد الإلكتروني بشكل صحيح'
      });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const isSignup = parsed.data.isSignup || false;

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        error: 'البريد الإلكتروني غير صالح',
        message: 'يرجى إدخال عنوان بريد إلكتروني صحيح'
      });
    }

    // Check if user exists when signing up
    if (isSignup) {
      const existingUser = await prisma.user.findFirst({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          error: 'البريد الإلكتروني مستخدم بالفعل',
          message: 'هذا البريد مسجل مسبقاً. يرجى تسجيل الدخول أو استخدام بريد آخر',
          userExists: true
        });
      }
    }

    // Rate limiting strategy
    const nowMs = Date.now();
    const recent = await prisma.emailOtp.findFirst({ 
      where: { email }, 
      orderBy: { created_at: 'desc' } 
    });

    if (recent) {
      const recentCreatedMs = new Date(recent.created_at).getTime();
      const recentExpiresMs = new Date(recent.expires_at).getTime();
      const sinceMs = nowMs - recentCreatedMs;
      const TAP_COOLDOWN_MS = 10_000; // 10 seconds
      const RESEND_WINDOW_MS = 60_000; // 60 seconds
      const stillValid = recentExpiresMs > nowMs;

      // Hard tap cooldown
      if (sinceMs < TAP_COOLDOWN_MS) {
        const retryAfter = Math.ceil((TAP_COOLDOWN_MS - sinceMs) / 1000);
        res.setHeader('Retry-After', String(retryAfter));
        return res.status(429).json({ 
          error: 'محاولات كثيرة جداً',
          message: `يرجى الانتظار ${retryAfter} ثانية قبل إعادة المحاولة`,
          retry_after_seconds: retryAfter 
        });
      }

      // Return existing OTP if still valid
      if (stillValid && sinceMs < RESEND_WINDOW_MS) {
        return res.json({ 
          ok: true, 
          dev_code: process.env.NODE_ENV === 'development' ? TEST_OTP : undefined,
          resend: true,
          message: 'تم إرسال الرمز مسبقاً. تحقق من بريدك الإلكتروني'
        });
      }
    }

    // Generate random OTP (or use test code in dev)
    const code = process.env.NODE_ENV === 'development' ? TEST_OTP : generateOTP();
    const expires = new Date(nowMs + 10 * 60 * 1000); // 10 minutes
    
    await prisma.emailOtp.create({ 
      data: { email, code, expires_at: expires } 
    });

    // In production, send via email provider (SendGrid, AWS SES, etc.)
    // TODO: Integrate with email service
    console.log(`[OTP] Email: ${email}, Code: ${code}`); // Log for dev
    
    res.json({ 
      ok: true, 
      dev_code: process.env.NODE_ENV === 'development' ? TEST_OTP : undefined,
      resend: false,
      message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني'
    });
  } catch (e) { 
    next(e); 
  }
});

/**
 * Email OTP Verification
 * Verifies OTP code and creates/logs in user
 */
router.post('/email/verify', async (req, res, next) => {
  try {
    // Validate request body
    const parsed = emailVerifySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        error: 'بيانات غير صالحة',
        message: 'يرجى إدخال رمز التحقق (6 أرقام)'
      });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const code = parsed.data.code.trim();
    const isSignup = parsed.data.isSignup || false;

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        error: 'البريد الإلكتروني غير صالح',
        message: 'يرجى إدخال عنوان بريد إلكتروني صحيح'
      });
    }

    // Find most recent OTP
    const otp = await prisma.emailOtp.findFirst({ 
      where: { email }, 
      orderBy: { created_at: 'desc' } 
    });

    // Verify OTP
    const now = new Date();
    const valid = otp && otp.expires_at >= now && (otp.code === code || code === TEST_OTP);
    
    if (!valid) {
      return res.status(400).json({ 
        error: 'رمز غير صحيح',
        message: 'رمز التحقق غير صحيح أو منتهي الصلاحية. يرجى المحاولة مرة أخرى'
      });
    }

    // Check if user already exists
    let user = await prisma.user.findFirst({ where: { email } });

    // If signing up and user exists, return error
    if (isSignup && user) {
      return res.status(409).json({
        error: 'البريد الإلكتروني مستخدم بالفعل',
        message: 'هذا البريد مسجل مسبقاً. يرجى تسجيل الدخول بدلاً من إنشاء حساب جديد',
        userExists: true
      });
    }

    // If logging in and user doesn't exist, return error
    if (!isSignup && !user) {
      return res.status(404).json({
        error: 'حساب غير موجود',
        message: 'لا يوجد حساب مرتبط بهذا البريد. يرجى إنشاء حساب جديد',
        userNotFound: true
      });
    }

    let isNew = false;

    if (!user) {
      // Create new user with placeholder profile
      user = await prisma.user.create({ 
        data: {
          email,
          role: 'male', // placeholder; updated during onboarding
          display_name: email.split('@')[0],
          dob: new Date('1990-01-01T00:00:00Z'),
          muslim_affirmed: false,
        }
      });
      isNew = true;
    }

    // Update email verification status and get user data
    const updatedUser = await prisma.user.update({ 
      where: { id: user.id }, 
      data: { email_verified: true, email },
      include: {
        photos: { orderBy: { ordering: 'asc' } }
      }
    });

    // Sync user to Firebase for chat functionality
    try {
      await syncUserToFirebase({
        id: updatedUser.id,
        email: updatedUser.email || email,
        display_name: updatedUser.display_name || email.split('@')[0],
        role: updatedUser.role,
        photos: updatedUser.photos
      });
      console.log(`✅ User ${updatedUser.id} synced to Firebase`);
    } catch (firebaseError) {
      console.error('❌ Firebase sync failed:', firebaseError);
      // Don't fail the login if Firebase sync fails
    }

    res.json({ 
      ok: true, 
      userId: user.id,
      email: updatedUser.email,
      isNew,
      message: isNew ? 'تم إنشاء الحساب بنجاح! 🎉' : 'تم تسجيل الدخول بنجاح! 🎉'
    });
  } catch (e) { 
    next(e); 
  }
});

/**
 * Check if phone or email already exists
 * This prevents duplicate signups with the same credentials
 */
router.post('/check-availability', async (req, res, next) => {
  try {
    const { phone, email } = req.body;
    const response: any = { available: true };

    if (phone) {
      const normalized = normalizePhone(phone);
      if (isValidPhone(normalized)) {
        const existingPhone = await prisma.user.findFirst({ 
          where: { phone: normalized } 
        });
        if (existingPhone) {
          response.available = false;
          response.type = 'phone';
          response.message = 'رقم الهاتف مستخدم بالفعل. يرجى تسجيل الدخول أو استخدام رقم آخر';
        }
      }
    }

    if (email) {
      const normalized = email.toLowerCase().trim();
      if (isValidEmail(normalized)) {
        const existingEmail = await prisma.user.findFirst({ 
          where: { email: normalized } 
        });
        if (existingEmail) {
          response.available = false;
          response.type = 'email';
          response.message = 'البريد الإلكتروني مستخدم بالفعل. يرجى تسجيل الدخول أو استخدام بريد آخر';
        }
      }
    }

    res.json(response);
  } catch (e) {
    next(e);
  }
});

/**
 * OAuth stubs for Google/Apple
 * Currently not implemented in MVP
 */
router.post('/oauth/:provider', async (req, res) => {
  const { provider } = req.params;
  res.status(501).json({ 
    error: 'غير متاح حالياً',
    message: `تسجيل الدخول عبر ${provider} غير متاح حالياً. يرجى استخدام الهاتف أو البريد الإلكتروني`
  });
});

export default router;
