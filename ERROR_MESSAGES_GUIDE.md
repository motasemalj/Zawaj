# Error Messages Reference Guide

## 🎯 Purpose
This guide documents all user-facing error messages in the authentication system. All messages are in Arabic and designed to be clear, helpful, and actionable.

---

## 📱 Phone Authentication

### Request OTP (`/auth/otp/request`)

| Scenario | Error Icon | Message (Arabic) | English Translation |
|----------|-----------|------------------|-------------------|
| **Invalid Format** | ⚠️ | رقم الهاتف غير صالح. يجب أن يحتوي على 8-15 رقماً | Phone number invalid. Must contain 8-15 digits |
| **Too Many Requests** | ⏱️ | يرجى الانتظار X ثانية قبل إعادة المحاولة | Please wait X seconds before trying again |
| **Already Sent (Valid)** | ℹ️ | تم إرسال الرمز مسبقاً. تحقق من رسائلك | Code already sent. Check your messages |
| **Network Error** | 🌐 | لا يوجد اتصال بالإنترنت. يرجى التحقق من اتصالك | No internet connection. Check your connection |
| **Server Error** | ❌ | تعذر إرسال الرمز. يرجى المحاولة لاحقاً | Failed to send code. Try again later |
| **Success** | ✅ | تم إرسال رمز التحقق بنجاح! | Verification code sent successfully! |

### Verify OTP (`/auth/otp/verify`)

| Scenario | Error Icon | Message (Arabic) | English Translation |
|----------|-----------|------------------|-------------------|
| **Invalid Format** | ⚠️ | يرجى إدخال رمز التحقق كاملاً (6 أرقام) | Please enter complete verification code (6 digits) |
| **Wrong Code** | ❌ | رمز التحقق غير صحيح أو منتهي الصلاحية | Verification code incorrect or expired |
| **Network Error** | 🌐 | لا يوجد اتصال بالإنترنت. يرجى التحقق من اتصالك | No internet connection. Check your connection |
| **Server Error** | ❌ | حدث خطأ أثناء التحقق. يرجى المحاولة مرة أخرى | Error during verification. Please try again |
| **Success (New User)** | ✅🎉 | تم إنشاء الحساب بنجاح! | Account created successfully! |
| **Success (Existing)** | ✅🎉 | تم تسجيل الدخول بنجاح! | Login successful! |

---

## 📧 Email Authentication

### Request OTP (`/auth/email/request`)

| Scenario | Error Icon | Message (Arabic) | English Translation |
|----------|-----------|------------------|-------------------|
| **Invalid Format** | ⚠️ | البريد الإلكتروني غير صالح. يرجى التحقق من العنوان | Email invalid. Please check the address |
| **Too Many Requests** | ⏱️ | يرجى الانتظار X ثانية قبل إعادة المحاولة | Please wait X seconds before trying again |
| **Already Sent (Valid)** | ℹ️ | تم إرسال الرمز مسبقاً. تحقق من بريدك الإلكتروني | Code already sent. Check your email |
| **Network Error** | 🌐 | لا يوجد اتصال بالإنترنت. يرجى التحقق من اتصالك | No internet connection. Check your connection |
| **Server Error** | ❌ | تعذر إرسال الرمز. يرجى المحاولة لاحقاً | Failed to send code. Try again later |
| **Success** | ✅ | تم إرسال رمز التحقق إلى بريدك! | Verification code sent to your email! |

### Verify OTP (`/auth/email/verify`)

| Scenario | Error Icon | Message (Arabic) | English Translation |
|----------|-----------|------------------|-------------------|
| **Invalid Format** | ⚠️ | يرجى إدخال رمز التحقق كاملاً (6 أرقام) | Please enter complete verification code (6 digits) |
| **Wrong Code** | ❌ | رمز التحقق غير صحيح أو منتهي الصلاحية | Verification code incorrect or expired |
| **Network Error** | 🌐 | لا يوجد اتصال بالإنترنت. يرجى التحقق من اتصالك | No internet connection. Check your connection |
| **Server Error** | ❌ | حدث خطأ أثناء التحقق. يرجى المحاولة مرة أخرى | Error during verification. Please try again |
| **Success (New User)** | ✅🎉 | تم إنشاء الحساب بنجاح! | Account created successfully! |
| **Success (Existing)** | ✅🎉 | تم تسجيل الدخول بنجاح! | Login successful! |

---

## 🔐 Duplicate Prevention

### Check Availability (`/auth/check-availability`)

| Scenario | Type | Message (Arabic) | English Translation |
|----------|------|------------------|-------------------|
| **Phone Exists** | phone | رقم الهاتف مستخدم بالفعل. يرجى تسجيل الدخول أو استخدام رقم آخر | Phone number already in use. Please login or use another number |
| **Email Exists** | email | البريد الإلكتروني مستخدم بالفعل. يرجى تسجيل الدخول أو استخدام بريد آخر | Email already in use. Please login or use another email |
| **Available** | - | متاح للتسجيل | Available for registration |

---

## 🚫 OAuth (Not Implemented)

### OAuth Login (`/auth/oauth/:provider`)

| Scenario | Error Icon | Message (Arabic) | English Translation |
|----------|-----------|------------------|-------------------|
| **Not Available** | ⚠️ | تسجيل الدخول عبر {provider} غير متاح حالياً. يرجى استخدام الهاتف أو البريد الإلكتروني | Login via {provider} not available currently. Use phone or email |

---

## 💡 Message Design Principles

### 1. **Clarity**
- Use simple, everyday Arabic
- Avoid technical jargon
- Be specific about what went wrong

### 2. **Actionability**
- Tell users what to do next
- Provide clear next steps
- Offer alternatives when possible

### 3. **Tone**
- Friendly and helpful
- Never blame the user
- Reassuring when errors occur

### 4. **Visual Hierarchy**
- Use emojis/icons to draw attention
- Error (❌) vs Warning (⚠️) vs Info (ℹ️)
- Success messages get celebration emojis (🎉)

### 5. **Consistency**
- Similar scenarios get similar messages
- Consistent formatting across all screens
- Predictable error patterns

---

## 🎨 Message Components

### Structure
Every error message has:
1. **Icon/Emoji** - Visual indicator
2. **Primary Message** - What happened
3. **Secondary Info** - What to do (when applicable)

### Example
```
⚠️ رقم الهاتف غير صالح. يجب أن يحتوي على 8-15 رقماً
│  │                        │
│  │                        └── Action/Explanation
│  └── Primary Message
└── Visual Indicator
```

---

## 📊 Common User Scenarios

### Scenario 1: New User Signup
**Flow**: WelcomeScreen → SignupMethodScreen → PhoneOTP → Verify → Success
**Messages**:
- "✅ تم إرسال رمز التحقق بنجاح!" (OTP sent)
- "✅ تم إنشاء الحساب بنجاح! 🎉" (Account created)

### Scenario 2: Existing User Login
**Flow**: WelcomeScreen → LoginScreen → Enter Phone → Verify → Success
**Messages**:
- "✅ تم إرسال رمز التحقق بنجاح!" (OTP sent)
- "✅ تم تسجيل الدخول بنجاح! 🎉" (Login successful)

### Scenario 3: Duplicate Signup Attempt
**Flow**: SignupMethodScreen → PhoneOTP → Enter existing phone → Error
**Message**: "رقم الهاتف مستخدم بالفعل. يرجى تسجيل الدخول أو استخدام رقم آخر"
**Action**: Redirect to login screen

### Scenario 4: Rate Limited
**Flow**: Request OTP → Wait < 10 seconds → Request again → Error
**Message**: "⏱️ يرجى الانتظار X ثانية قبل إعادة المحاولة"
**UI**: Button disabled with countdown timer

### Scenario 5: Wrong OTP Code
**Flow**: Request OTP → Enter wrong code → Error
**Message**: "❌ رمز التحقق غير صحيح أو منتهي الصلاحية"
**Action**: User can retry or request new code

### Scenario 6: Network Issue
**Flow**: Any request → Network down → Error
**Message**: "🌐 لا يوجد اتصال بالإنترنت. يرجى التحقق من اتصالك"
**Action**: User checks connection and retries

---

## 🔍 Testing Error Messages

### Manual Testing Checklist
- [ ] Test each error message appears correctly
- [ ] Verify emoji/icons display properly
- [ ] Check RTL text alignment (Arabic)
- [ ] Test message wrapping on small screens
- [ ] Verify color coding (error vs success)
- [ ] Check message timing (auto-dismiss)
- [ ] Test on iOS and Android

### Automated Testing
```typescript
// Example test case
describe('Phone OTP Error Messages', () => {
  it('shows invalid phone format error', async () => {
    const response = await request(app)
      .post('/auth/otp/request')
      .send({ phone: '123' });
    
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('8-15 رقماً');
  });
});
```

---

## 🌍 Localization Notes

### Current Language: Arabic (RTL)
- All messages are in Modern Standard Arabic
- Formal but friendly tone
- Compatible with right-to-left layout

### Future Languages
If adding English or other languages:
1. Create message catalog file
2. Use i18n library (e.g., `react-i18next`)
3. Maintain same message structure
4. Keep visual indicators (emojis) language-agnostic

---

## 📝 Updating Messages

### When to Update
- User feedback indicates confusion
- Analytics show high error rates
- A/B testing shows better alternatives
- Product requirements change

### How to Update
1. Update backend message in `backend/src/routes/auth.ts`
2. Document change in this file
3. Update frontend display if needed
4. Test on all platforms
5. Monitor user feedback

### Example Update
```typescript
// Before
{ message: 'رمز غير صحيح' }

// After (more helpful)
{ message: 'رمز التحقق غير صحيح أو منتهي الصلاحية. يرجى المحاولة مرة أخرى' }
```

---

## 🎯 Success Metrics

Track these metrics to measure message effectiveness:

1. **Error Recovery Rate**
   - % of users who successfully complete flow after error
   - Target: >80%

2. **Support Tickets**
   - Number of tickets about specific errors
   - Target: Decreasing trend

3. **Message Clarity Score**
   - User feedback surveys
   - Target: >4/5 stars

4. **Completion Rate**
   - % of users who complete auth flow
   - Target: >90%

---

## 🔗 Related Documentation

- [AUTH_REVAMP_SUMMARY.md](./AUTH_REVAMP_SUMMARY.md) - Complete revamp overview
- Backend API Documentation - API endpoint specs
- Frontend Component Guide - UI component usage
- User Testing Results - Real user feedback

---

## 📞 Contact

For questions about error messages or to suggest improvements:
- Create an issue in the project repository
- Tag with `ux` and `error-handling` labels
- Include screenshots and user feedback when applicable

---

**Last Updated**: October 8, 2025
**Version**: 1.0.0
**Maintainer**: Development Team


