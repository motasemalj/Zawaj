import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';

const router = Router();

const TEST_OTP = process.env.TEST_OTP_CODE || '123456';

// Accept any string, we'll normalize digits server-side to avoid UX mismatch
const requestSchema = z.object({ phone: z.string().min(3) });
const verifySchema = z.object({ phone: z.string().min(3), code: z.string().regex(/^\d{6}$/) });
const emailRequestSchema = z.object({ email: z.string().email() });
const emailVerifySchema = z.object({ email: z.string().email(), code: z.string().regex(/^\d{6}$/) });

router.post('/otp/request', async (req, res, next) => {
  try {
    const raw = requestSchema.parse(req.body).phone || '';
    const phone = raw.replace(/\D/g, '');
    if (!/^\d{8,15}$/.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone. Use 8-15 digits.' });
    }
    // Optimized rate limiting strategy:
    // - Hard tap cooldown: 10s to prevent accidental double-taps
    // - Resend window: within 60s, return the same (still-valid) OTP instead of 429
    // - Generate new OTP only outside resend window or if previous expired
    const nowMs = Date.now();
    const recent = await prisma.otpCode.findFirst({ where: { phone }, orderBy: { created_at: 'desc' } });
    if (recent) {
      const recentCreatedMs = new Date(recent.created_at).getTime();
      const recentExpiresMs = new Date(recent.expires_at).getTime();
      const sinceMs = nowMs - recentCreatedMs;
      const TAP_COOLDOWN_MS = 10_000; // 10 seconds
      const RESEND_WINDOW_MS = 60_000; // 60 seconds
      const stillValid = recentExpiresMs > nowMs;

      if (sinceMs < TAP_COOLDOWN_MS) {
        const retryAfter = Math.ceil((TAP_COOLDOWN_MS - sinceMs) / 1000);
        res.setHeader('Retry-After', String(retryAfter));
        return res.status(429).json({ error: 'Too many requests', retry_after_seconds: retryAfter });
      }

      if (stillValid && sinceMs < RESEND_WINDOW_MS) {
        // Return existing OTP without creating a new one (smoother UX)
        return res.json({ ok: true, dev_code: TEST_OTP, resend: true });
      }
    }

    const code = TEST_OTP;
    const expires = new Date(nowMs + 10 * 60 * 1000);
    await prisma.otpCode.create({ data: { phone, code, expires_at: expires } });
    // In dev, return the code directly
    res.json({ ok: true, dev_code: TEST_OTP, resend: false });
  } catch (e) { next(e); }
});

router.post('/otp/verify', async (req, res, next) => {
  try {
    const parsed = verifySchema.parse(req.body);
    const phone = (parsed.phone || '').replace(/\D/g, '');
    if (!/^\d{8,15}$/.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone. Use 8-15 digits.' });
    }
    const code = parsed.code.trim();
    const otp = await prisma.otpCode.findFirst({ where: { phone }, orderBy: { created_at: 'desc' } });
    const now = new Date();
    const valid = otp && otp.expires_at >= now && (otp.code === code || code === TEST_OTP);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }
    // Upsert user by phone; create placeholder profile
    const existing = await prisma.user.findFirst({ where: { phone } });
    let isNew = false;
    let userId: string;
    if (!existing) {
      const created = await prisma.user.create({ data: {
        phone,
        role: 'male', // placeholder; will be updated during onboarding
        display_name: phone,
        dob: new Date('1990-01-01T00:00:00Z'),
        muslim_affirmed: false,
      }});
      userId = created.id;
      isNew = true;
    } else {
      userId = existing.id;
    }
    await prisma.user.update({ where: { id: userId }, data: { phone_verified: true, phone } });
    res.json({ ok: true, userId, isNew, note: 'Use x-user-id header with this id for authenticated calls in dev.' });
  } catch (e) { next(e); }
});

// Email OTP
router.post('/email/request', async (req, res, next) => {
  try {
    const email = emailRequestSchema.parse(req.body).email.toLowerCase();
    const nowMs = Date.now();
    const recent = await prisma.emailOtp.findFirst({ where: { email }, orderBy: { created_at: 'desc' } });
    if (recent) {
      const recentCreatedMs = new Date(recent.created_at).getTime();
      const recentExpiresMs = new Date(recent.expires_at).getTime();
      const sinceMs = nowMs - recentCreatedMs;
      const TAP_COOLDOWN_MS = 10_000;
      const RESEND_WINDOW_MS = 60_000;
      const stillValid = recentExpiresMs > nowMs;

      if (sinceMs < TAP_COOLDOWN_MS) {
        const retryAfter = Math.ceil((TAP_COOLDOWN_MS - sinceMs) / 1000);
        res.setHeader('Retry-After', String(retryAfter));
        return res.status(429).json({ error: 'Too many requests', retry_after_seconds: retryAfter });
      }

      if (stillValid && sinceMs < RESEND_WINDOW_MS) {
        return res.json({ ok: true, dev_code: TEST_OTP, resend: true });
      }
    }

    const code = TEST_OTP;
    const expires = new Date(nowMs + 10 * 60 * 1000);
    await prisma.emailOtp.create({ data: { email, code, expires_at: expires } });
    // TODO: Send via email provider; for dev return the code
    res.json({ ok: true, dev_code: TEST_OTP, resend: false });
  } catch (e) { next(e); }
});

router.post('/email/verify', async (req, res, next) => {
  try {
    const parsed = emailVerifySchema.parse(req.body);
    const email = parsed.email.toLowerCase();
    const code = parsed.code.trim();
    const otp = await prisma.emailOtp.findFirst({ where: { email }, orderBy: { created_at: 'desc' } });
    const now = new Date();
    const valid = otp && otp.expires_at >= now && (otp.code === code || code === TEST_OTP);
    if (!valid) return res.status(400).json({ error: 'Invalid or expired code' });
    let user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      user = await prisma.user.create({ data: {
        email,
        role: 'male',
        display_name: email.split('@')[0],
        dob: new Date('1990-01-01T00:00:00Z'),
        muslim_affirmed: false,
      }});
    }
    await prisma.user.update({ where: { id: user.id }, data: { email_verified: true, email } });
    res.json({ ok: true, userId: user.id, isNew: false });
  } catch (e) { next(e); }
});

// OAuth stubs for Google/Apple (MVP: return 501 Not Implemented)
router.post('/oauth/:provider', async (req, res) => {
  const { provider } = req.params;
  res.status(501).json({ error: `OAuth ${provider} not implemented in local dev. Use phone/email OTP.` });
});

export default router;

