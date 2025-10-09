# Testing Guide - Authentication Revamp

## 🚀 Quick Start

This guide will help you test all the new authentication features and improvements.

---

## 📋 Prerequisites

### Backend
```bash
cd backend
npm install
npm run dev
```

### Mobile App
```bash
cd mobile
npm install
npm start
```

---

## 🧪 Test Scenarios

### 1. WelcomeScreen - Visual & Animations

**What to Test:**
- [ ] Screen loads with smooth animations
- [ ] Brand icon fades in and scales up
- [ ] Feature pills display correctly
- [ ] Buttons are properly styled
- [ ] Terms & privacy text is readable

**Steps:**
1. Open the app (should land on WelcomeScreen)
2. Observe the animation sequence
3. Check that all elements are properly positioned
4. Tap "إنشاء حساب جديد" → should navigate to SignupMethodScreen
5. Go back and tap "لديّ حساب بالفعل" → should navigate to LoginScreen

**Expected Result:**
- Smooth animations on mount
- No layout shifts or overlaps
- Clean, modern appearance
- All text is readable (RTL for Arabic)

---

### 2. SignupMethodScreen - Method Selection

**What to Test:**
- [ ] Three method cards display correctly
- [ ] Phone method is interactive
- [ ] Email method is interactive
- [ ] Social login shows "Coming Soon"
- [ ] Info cards explain security features

**Steps:**
1. From WelcomeScreen, tap "إنشاء حساب جديد"
2. Observe the three signup method cards
3. Tap on Phone method → should navigate to PhoneOTP screen
4. Go back and tap on Email method → should navigate to EmailOTP screen
5. Try tapping Social login → should not navigate (coming soon)

**Expected Result:**
- All cards are visually distinct
- Interactive cards respond to touch
- Navigation works correctly
- Coming soon badge is clear

---

### 3. Phone OTP - Happy Path (New User)

**What to Test:**
- [ ] Input field accepts phone number
- [ ] Keyboard doesn't overlay input
- [ ] OTP is sent successfully
- [ ] Code input appears
- [ ] Verification succeeds
- [ ] User is logged in

**Steps:**
1. Navigate to PhoneOTP screen
2. Enter a valid phone number (e.g., +962791234567)
3. Tap "إرسال رمز التحقق"
4. Wait for success message
5. Enter code "123456" (test code)
6. Tap "تأكيد وتسجيل الدخول"
7. Wait for success message

**Expected Result:**
- ✅ Success: "تم إرسال رمز التحقق بنجاح!"
- Code input field appears
- ✅ Success: "تم إنشاء الحساب بنجاح! 🎉"
- App navigates to Onboarding/Main screen

**Keyboard Test:**
- Input fields remain visible when keyboard opens
- Can scroll if needed
- Keyboard dismisses on tap outside

---

### 4. Phone OTP - Error Scenarios

#### Test 4a: Invalid Phone Format
**Steps:**
1. Enter "123" (too short)
2. Tap "إرسال رمز التحقق"

**Expected Result:**
- ❌ Error: "رقم الهاتف غير صالح. يجب أن يحتوي على 8-15 رقماً"
- Button remains enabled
- User can correct and retry

#### Test 4b: Rate Limiting
**Steps:**
1. Enter valid phone number
2. Request OTP
3. Immediately request again (within 10 seconds)

**Expected Result:**
- ⏱️ Error: "يرجى الانتظار X ثانية قبل إعادة المحاولة"
- Button shows countdown timer
- Button re-enables after countdown

#### Test 4c: Wrong OTP Code
**Steps:**
1. Request OTP successfully
2. Enter wrong code "000000" (not the test code)
3. Tap verify

**Expected Result:**
- ❌ Error: "رمز التحقق غير صحيح أو منتهي الصلاحية"
- Can retry with correct code
- Can request new OTP

#### Test 4d: Network Error (Airplane Mode)
**Steps:**
1. Enable airplane mode
2. Try to request OTP

**Expected Result:**
- 🌐 Error: "لا يوجد اتصال بالإنترنت. يرجى التحقق من اتصالك"
- Clear message about connectivity issue

---

### 5. Email OTP - Happy Path (New User)

**What to Test:**
- [ ] Email input accepts valid format
- [ ] OTP is sent successfully
- [ ] Code verification works
- [ ] User is logged in

**Steps:**
1. Navigate to EmailOTP screen
2. Enter valid email (e.g., test@example.com)
3. Tap "إرسال رمز التحقق"
4. Enter code "123456"
5. Tap "تأكيد وتسجيل الدخول"

**Expected Result:**
- ✅ Success: "تم إرسال رمز التحقق إلى بريدك!"
- ✅ Success: "تم إنشاء الحساب بنجاح! 🎉"
- User navigates to next screen

---

### 6. Email OTP - Error Scenarios

#### Test 6a: Invalid Email Format
**Steps:**
1. Enter "notanemail" (invalid format)
2. Tap "إرسال رمز التحقق"

**Expected Result:**
- ⚠️ Error: "البريد الإلكتروني غير صالح. يرجى التحقق من العنوان"

#### Test 6b: Wrong OTP Code
**Steps:**
1. Request OTP successfully
2. Enter wrong code "999999"
3. Tap verify

**Expected Result:**
- ❌ Error: "رمز التحقق غير صحيح أو منتهي الصلاحية"

---

### 7. LoginScreen - Existing User

**What to Test:**
- [ ] Login with existing phone
- [ ] Keyboard handling
- [ ] Error messages
- [ ] Success flow

**Steps:**
1. Create a user via signup flow first
2. Close app and reopen
3. Tap "لديّ حساب بالفعل"
4. Enter the same phone number used in signup
5. Request and verify OTP

**Expected Result:**
- ✅ Success: "تم تسجيل الدخول بنجاح! 🎉" (not "إنشاء الحساب")
- User logs in directly (skip onboarding)

---

### 8. Duplicate Prevention (Critical Feature)

#### Test 8a: Duplicate Phone Signup
**Steps:**
1. Complete signup with phone: +962791111111
2. Log out
3. Try to sign up again with same phone: +962791111111

**Expected Result:**
- Backend should recognize existing user
- Should log them in instead of creating duplicate
- OR show message: "رقم الهاتف مستخدم بالفعل"

#### Test 8b: Duplicate Email Signup
**Steps:**
1. Complete signup with email: user@test.com
2. Log out
3. Try to sign up again with same email: user@test.com

**Expected Result:**
- Backend should recognize existing user
- Should log them in instead of creating duplicate
- OR show message: "البريد الإلكتروني مستخدم بالفعل"

#### Test 8c: Check Database (Backend)
**Steps:**
```bash
# Connect to database
cd backend
npx prisma studio

# Check User table
# Search for phone: +962791111111
# Should see only ONE user, not multiple
```

**Expected Result:**
- Only one user per unique phone number
- Only one user per unique email
- No duplicate entries

---

### 9. Keyboard Handling (iOS & Android)

**What to Test:**
- [ ] Input fields don't get hidden by keyboard
- [ ] Can scroll when keyboard is open
- [ ] Keyboard dismisses on tap outside
- [ ] Submit on Enter key works

**Steps (Test on Physical Device):**
1. Open any OTP screen
2. Tap on input field
3. Keyboard should appear
4. Check that input field remains visible
5. Try scrolling the content
6. Tap outside input field
7. Keyboard should dismiss

**iOS Specific:**
- [ ] KeyboardAvoidingView works correctly
- [ ] Safe area respected

**Android Specific:**
- [ ] Keyboard behavior is smooth
- [ ] Back button dismisses keyboard first, then navigates

---

### 10. Loading States

**What to Test:**
- [ ] Button shows loading text
- [ ] Button is disabled during loading
- [ ] Loading prevents double submission
- [ ] Loading clears after response

**Steps:**
1. Request OTP
2. Observe button during request
3. Check that you can't tap button again
4. Wait for response
5. Button should return to normal state

**Expected Result:**
- Button text changes to "جاري الإرسال..." or "جاري التحقق..."
- Button is visually disabled (opacity reduced)
- No duplicate requests sent
- Button re-enables after response

---

### 11. Success Messages

**What to Test:**
- [ ] Success messages display with green styling
- [ ] Success messages auto-dismiss after 3 seconds
- [ ] Emojis render correctly
- [ ] Messages don't overlap with other elements

**Steps:**
1. Complete any successful action (send OTP, verify OTP)
2. Observe the success message
3. Count 3 seconds
4. Message should fade out

**Expected Result:**
- ✅ Green success message with checkmark
- 🎉 Celebration emoji for account creation/login
- Auto-dismisses smoothly
- Clean presentation

---

### 12. Resend OTP Flow

**What to Test:**
- [ ] Resend link appears after OTP sent
- [ ] Cooldown timer works
- [ ] Can resend after cooldown
- [ ] New OTP works correctly

**Steps:**
1. Request OTP
2. Wait for verification screen
3. Look for "لم تستلم الرمز؟ إعادة إرسال" link
4. Tap immediately → should show countdown
5. Wait 60 seconds
6. Tap again → should send new OTP

**Expected Result:**
- Resend link is visible and styled correctly
- Shows countdown: "إعادة إرسال (59ث)"
- After countdown, can resend
- New OTP is sent successfully

---

### 13. Edit Phone/Email Number

**What to Test:**
- [ ] Can edit number after OTP sent
- [ ] Returns to input screen
- [ ] Previous number is retained
- [ ] Can change and resend

**Steps:**
1. Request OTP with phone: +962791111111
2. On verification screen, tap pencil icon next to number
3. Should return to phone input
4. Change number to: +962792222222
5. Request OTP again
6. Should send to new number

**Expected Result:**
- Pencil icon is tappable
- Navigates back smoothly
- Can modify number
- Resend works with new number

---

### 14. Multi-Screen Navigation

**What to Test:**
- [ ] Back button works on all screens
- [ ] Navigation history is correct
- [ ] Can navigate between login/signup
- [ ] No navigation loops

**Steps:**
1. WelcomeScreen → Tap "إنشاء حساب"
2. SignupMethodScreen → Tap "Phone"
3. PhoneOTP → Tap back button
4. Should return to SignupMethodScreen
5. Tap "لديك حساب بالفعل؟ تسجيل الدخول"
6. Should go to LoginScreen
7. Tap back
8. Should return to WelcomeScreen

**Expected Result:**
- Navigation stack is correct
- Back button always works
- Footer links navigate correctly
- No infinite loops

---

### 15. RTL (Right-to-Left) Layout

**What to Test:**
- [ ] Arabic text aligns right
- [ ] Icons appear on correct side
- [ ] Input direction is RTL
- [ ] Buttons aligned correctly

**Steps:**
1. Check all screens
2. Verify text alignment
3. Check icon positions
4. Test input typing direction

**Expected Result:**
- All Arabic text aligns right
- Icons in correct position for RTL
- Natural reading flow
- No LTR/RTL conflicts

---

### 16. Error Recovery

**What to Test:**
- [ ] Can recover from any error
- [ ] Error messages are dismissible
- [ ] Can retry after error
- [ ] State resets correctly

**Steps:**
1. Trigger any error (invalid phone, wrong OTP, etc.)
2. Note error message appears
3. Correct the issue
4. Retry the action
5. Should succeed

**Expected Result:**
- Error appears clearly
- Error dismisses on new action
- Retry is possible
- Success after correction

---

## 📱 Device Testing Matrix

Test on multiple devices and screen sizes:

### iOS
- [ ] iPhone SE (small screen)
- [ ] iPhone 14 (standard)
- [ ] iPhone 14 Pro Max (large screen)
- [ ] iPad (tablet)

### Android
- [ ] Small phone (< 5.5")
- [ ] Standard phone (5.5" - 6.5")
- [ ] Large phone (> 6.5")
- [ ] Tablet

### OS Versions
- [ ] iOS 14+
- [ ] Android 10+

---

## 🐛 Known Issues / Edge Cases

Document any issues found during testing:

### Example Template:
```
**Issue**: Keyboard overlaps input on Android 10
**Device**: Samsung Galaxy S10
**Steps to Reproduce**:
1. Open PhoneOTP screen
2. Tap input field
3. Keyboard covers button

**Severity**: High
**Status**: To be fixed
```

---

## ✅ Testing Checklist Summary

Use this checklist to track your testing progress:

### Screens
- [ ] WelcomeScreen - Visual & Animations
- [ ] SignupMethodScreen - Method Selection
- [ ] LoginScreen - Login Flow
- [ ] PhoneOTP Screen - All Scenarios
- [ ] EmailOTP Screen - All Scenarios

### Features
- [ ] Keyboard Handling (iOS & Android)
- [ ] Error Messages (All Types)
- [ ] Success Messages
- [ ] Loading States
- [ ] Rate Limiting
- [ ] Duplicate Prevention
- [ ] OTP Resend
- [ ] Edit Phone/Email
- [ ] Navigation Flow

### Error Scenarios
- [ ] Invalid Input Formats
- [ ] Wrong OTP Codes
- [ ] Network Errors
- [ ] Rate Limit Errors
- [ ] Duplicate Account Errors

### Compatibility
- [ ] iOS Devices
- [ ] Android Devices
- [ ] Small Screens
- [ ] Large Screens
- [ ] RTL Layout
- [ ] Different OS Versions

---

## 📊 Test Results Template

Use this template to document test results:

```markdown
## Test Session: [Date]
**Tester**: [Name]
**Device**: [Device Name & OS]
**Build**: [Version]

### Tests Passed: X/Y

### Issues Found:
1. [Issue description]
2. [Issue description]

### Notes:
[Any additional observations]
```

---

## 🚨 Critical Tests (Must Pass)

These tests MUST pass before deployment:

1. ✅ **Duplicate Prevention Works**
   - Cannot create duplicate accounts
   - Database has no duplicates

2. ✅ **Keyboard Doesn't Overlay Inputs**
   - Tested on iOS and Android
   - All screen sizes

3. ✅ **Error Messages Are Clear**
   - User understands what went wrong
   - Can take corrective action

4. ✅ **OTP Flow Works End-to-End**
   - Can sign up new user
   - Can log in existing user

5. ✅ **No App Crashes**
   - All screens stable
   - All error cases handled

---

## 🎯 Success Criteria

The revamp is successful if:

✅ **Visual**: Modern, polished appearance
✅ **Functional**: No keyboard issues
✅ **Informative**: Clear error messages
✅ **Secure**: Duplicate prevention works
✅ **Stable**: No crashes or major bugs
✅ **Accessible**: Works on all devices/OS versions

---

## 📞 Reporting Issues

Found a bug? Report it:

1. Create GitHub Issue
2. Use template above
3. Include screenshots/video
4. Tag with `bug` label

---

**Happy Testing!** 🎉

For questions or help:
- Check [AUTH_REVAMP_SUMMARY.md](./AUTH_REVAMP_SUMMARY.md)
- Check [ERROR_MESSAGES_GUIDE.md](./ERROR_MESSAGES_GUIDE.md)
- Create an issue in the repository


