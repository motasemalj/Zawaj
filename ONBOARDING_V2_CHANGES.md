# Onboarding V2 - Enhanced 8-Step Flow

## 🔄 What Changed

### Removed
- ❌ **Step 3: Selfie Verification** - Removed entirely per user request

### Enhanced
- ✅ **Step 2**: Now includes Height selection (added slider)
- ✅ **Step 4**: NEW - Demographics step with profession, education, location, smoking, marital status
- ✅ **Step 5**: Enhanced with "Do you have children?" and "Would you relocate?" questions
- ✅ **Step 8**: Merged Terms & Conditions into final Preferences step

### Renumbered
- Old 9 steps → New 8 steps
- All progress bars updated (X of 8)
- All step numbers adjusted

## 📋 New 8-Step Flow

### Step 1: First Name & Role ✅
**No changes** - Same as before
- First name (text input)
- Role: Male/Female/Mother
- Mother_for: Son/Daughter (if Mother)

### Step 2: Date of Birth + Height ✅
**ENHANCED** - Added height selection
- Date of birth (date picker, 18+ validation)
- **NEW**: Height (slider: 140-220 cm)
  - Shows in cm and feet/inches
  - Real-time conversion display
  - Large value display with accent color

### Step 3: Profile Photos ✅
**RENUMBERED** - Was Step 4
- Upload 1-6 photos
- First photo marked as primary
- Guidelines displayed
- Grid layout

### Step 4: Demographics ✅
**NEW STEP** - All new questions with selection-based UI

**Questions**:
1. **What's your profession?**
   - Text input
   - Placeholder: "مثال: مهندس، طبيب، معلم..."

2. **What's your education level?**
   - Selectable buttons
   - Options: ثانوي، دبلوم، بكالوريوس، ماجستير، دكتوراه، آخر

3. **Where did you grow up?**
   - City (text input)
   - Country (text input)

4. **What's your marital status?**
   - Selectable chips
   - Options: أعزب/عزباء، مطلق/مطلقة، أرمل/أرملة

5. **Do you smoke?**
   - Selectable chips
   - Options: لا، نعم، أحياناً، أحاول الإقلاع

### Step 5: About Me & Values ✅
**ENHANCED** - Added 2 new questions

**Existing**:
- Bio (text area, 20-500 chars)
- Ethnicity (selectable, 10 options - now in Arabic)
- Marriage timeline (5 options - now in Arabic)
- Religious sect (3 options - now in Arabic)

**NEW Questions**:
1. **Do you have children?**
   - 4 options (same as before but Arabic labels)
   - أريد أطفالاً
   - لدي أطفال وأريد المزيد
   - لدي أطفال ولا أريد المزيد
   - لا أريد أطفالاً

2. **Do you want children in the future?**
   - 3 chip options
   - نعم، لا، ربما

3. **Would you move abroad for marriage?**
   - 2 chip options  
   - نعم، لا

### Step 6: Interests & Personality ✅
**No changes** - Same as before
- Select 3-10 interests
- Select 3-5 personality traits

### Step 7: Icebreakers ✅
**No changes** - Same as before
- Choose 1-3 prompts
- Answer each (10-300 chars)

### Step 8: Preferences & Terms ✅
**ENHANCED** - Added Terms & Conditions

**Preferences** (existing):
- Age range (min/max sliders)
- Distance (5-500km slider)

**NEW - Terms & Conditions**:
- Title: "الشروط والأحكام" with shield icon
- 3 checkboxes (all required):
  - ✅ أوافق على شروط الخدمة
  - ✅ أوافق على سياسة الخصوصية
  - ✅ أوافق على اتباع إرشادات المجتمع
- Button text: "إكمال التسجيل 🎉"

## 🎨 UI/UX Enhancements

### Step 2 (Height Selector)
```
┌─────────────────────────────┐
│      تاريخ الميلاد           │
│  [Date Picker]              │
│                             │
│          الطول              │
│        170 سم               │  ← Large accent color
│       (5'7")                │  ← Feet/inches
│  ──────●──────────          │  ← Slider
│  140 سم      220 سم         │
└─────────────────────────────┘
```

### Step 4 (Demographics - NEW)
```
┌─────────────────────────────┐
│      معلومات إضافية         │
│                             │
│    ما هي مهنتك؟            │
│  ┌───────────────────────┐  │
│  │ مهندس...            │  │  ← Text input
│  └───────────────────────┘  │
│                             │
│    ما هو مستوى تعليمك؟     │
│  [ثانوي] [بكالوريوس] ...   │  ← Buttons
│                             │
│       أين نشأت؟            │
│  [المدينة] [الدولة]        │  ← Inputs
│                             │
│    ما هي حالتك الاجتماعية؟  │
│  [أعزب] [مطلق] [أرمل]      │  ← Chips
│                             │
│       هل تدخن؟             │
│  [لا] [نعم] [أحياناً]      │  ← Chips
└─────────────────────────────┘
```

### Step 5 (Enhanced)
```
┌─────────────────────────────┐
│      عنك وقيمك             │
│                             │
│  [Bio textarea]            │
│  [Ethnicity chips]         │
│  [Marriage timeline]       │
│  [Sect selection]          │
│                             │
│    هل لديك أطفال؟         │  ← Existing
│  [4 options]               │
│                             │
│  هل تريد أطفالاً؟         │  ← NEW
│  [نعم] [لا] [ربما]         │
│                             │
│  هل ستنتقل للخارج؟        │  ← NEW
│  [نعم] [لا]                │
└─────────────────────────────┘
```

### Step 8 (With Terms)
```
┌─────────────────────────────┐
│  التفضيلات والشروط          │
│                             │
│  [Age sliders]             │
│  [Distance slider]         │
│                             │
│  🛡️ الشروط والأحكام         │
│  ☑ شروط الخدمة             │
│  ☑ سياسة الخصوصية          │
│  ☑ إرشادات المجتمع         │
│                             │
│  [إكمال التسجيل 🎉]        │
└─────────────────────────────┘
```

## 🔧 Technical Changes

### Backend Routes Updated

#### `POST /onboarding/step2`
**Before**:
```typescript
{ dob: string }
```
**After**:
```typescript
{ 
  dob: string,
  height_cm: number  // NEW: 140-220
}
```

#### `POST /onboarding/step3`
**Before**: Selfie upload (multipart)
**After**: Profile photos confirmation (simple POST)

#### `POST /onboarding/step4` - NEW
```typescript
{
  profession: string,
  education: string,
  city: string,
  country: string,
  smoker: string,
  marital_status: string
}
```

#### `POST /onboarding/step5`
**Before**:
```typescript
{
  bio, ethnicity, marriage_timeline, sect, children_preference
}
```
**After**:
```typescript
{
  bio, ethnicity, marriage_timeline, sect,
  children_preference,
  want_children: string,    // NEW
  relocate: boolean          // NEW
}
```

#### `POST /onboarding/step8`
**Before**:
```typescript
{ age_min, age_max, distance_km }
```
**After**:
```typescript
{
  age_min, age_max, distance_km,
  accept_terms: true    // NEW - required
}
```
- Now marks `onboarding_completed = true`
- No separate step9 needed

#### `GET /onboarding/options`
**Updated** - All options now in Arabic:
```typescript
{
  education_levels: ['ثانوي', 'دبلوم', 'بكالوريوس', ...],
  marital_statuses: ['أعزب/عزباء', 'مطلق/مطلقة', ...],
  smoking_options: ['لا', 'نعم', 'أحياناً', ...],
  want_children_options: ['نعم', 'لا', 'ربما'],
  ethnicities: ['عربي', 'جنوب آسيوي', ...],  // Arabic
  sects: [{ value: 'sunni', label: 'سني' }, ...],  // Arabic labels
  marriage_timelines: [{ value: '...', label: 'خلال 6 أشهر' }, ...],  // Arabic
  children_preferences: [{ value: '...', label: 'أريد أطفالاً' }, ...],  // Arabic
  // ... rest stays in English
}
```

### Files Modified

#### Deleted (2)
- ❌ `Step3SelfieVerification.tsx`
- ❌ `Step4ProfilePhotos.tsx` (old version)
- ❌ `Step9Terms.tsx`

#### Created (2)
- ✅ `Step3ProfilePhotos.tsx` (renamed from Step4)
- ✅ `Step4Demographics.tsx` (NEW)

#### Updated (7)
- ✅ `Step1NameRole.tsx` - Progress: 1/8
- ✅ `Step2DateOfBirth.tsx` - Added height, Progress: 2/8
- ✅ `Step5AboutMe.tsx` - Added 2 questions, Progress: 5/8
- ✅ `Step6InterestsTraits.tsx` - Progress: 6/8
- ✅ `Step7Icebreakers.tsx` - Progress: 7/8
- ✅ `Step8Preferences.tsx` - Added terms, Progress: 8/8
- ✅ `NewOnboardingScreen.tsx` - Updated orchestration

## 📊 Data Collected (Complete List)

### Step 1
- first_name
- role (male/female/mother)
- mother_for (son/daughter)

### Step 2
- dob (date of birth)
- **height_cm** ✨ NEW

### Step 3
- photos (1-6 images)

### Step 4 ✨ NEW
- **profession** ✨
- **education** ✨
- **city** (where grew up) ✨
- **country** (where grew up) ✨
- **smoker** ✨
- **marital_status** ✨

### Step 5
- bio
- ethnicity
- marriage_timeline
- sect
- children_preference
- **want_children** ✨ NEW
- **relocate** ✨ NEW

### Step 6
- interests (3-10)
- personality_traits (3-5)

### Step 7
- icebreaker_questions (1-3)

### Step 8
- age_min, age_max
- distance_km
- **terms_accepted** ✨ NEW
- **terms_accepted_at** ✨ NEW
- **onboarding_completed** ✨ NEW

## ✅ All New Questions Implemented

| Question | UI Type | Options | Step |
|----------|---------|---------|------|
| What's your profession | Text Input | Free text | 4 |
| What's your education level | Buttons | 6 options | 4 |
| Where did you grow up? | Text Inputs | City + Country | 4 |
| How tall are you? | Slider | 140-220 cm | 2 |
| Do you smoke? | Chips | 4 options | 4 |
| What's your marital status? | Chips | 3 options | 4 |
| Do you have children? | Buttons | 4 options | 5 |
| Would you move abroad? | Chips | Yes/No | 5 |

## 🎯 UX Improvements

### 1. **Better Flow**
- 8 steps instead of 9 (faster completion)
- Related questions grouped together
- Logical progression

### 2. **Selection-Based UI**
- Height: Slider (not text input)
- Education: Buttons (not dropdown)
- Marital: Chips (easy tap)
- Smoking: Chips (quick select)
- Relocation: Yes/No chips (simple choice)

### 3. **Visual Hierarchy**
- Section titles for grouping
- Large accent values (height display)
- Conversions shown (cm → feet/inches)
- Real-time feedback

### 4. **Arabic Throughout**
- All options in Arabic
- All labels in Arabic
- RTL layout everywhere
- Cultural appropriateness

## 🔍 Comparison: Before vs After

### Before (9 Steps)
1. Name & Role
2. DOB
3. **Selfie** ← Removed
4. Photos
5. About Me (5 fields)
6. Interests
7. Icebreakers
8. Preferences
9. **Terms (separate)** ← Merged

### After (8 Steps)
1. Name & Role
2. DOB + **Height** ← Enhanced
3. Photos ← Renumbered
4. **Demographics** ← NEW (6 fields)
5. About Me ← Enhanced (7 fields now)
6. Interests ← Same
7. Icebreakers ← Same
8. Preferences + Terms ← Combined

### Data Collected
**Before**: ~25 fields  
**After**: ~30 fields (5 new questions added)

**Time Estimate**:
- Before: ~3-4 minutes
- After: ~3-4 minutes (same, but more data!)

## 🚀 Ready to Test

### Quick Test Flow
1. Start backend: `cd backend && npm run dev`
2. Start mobile: `cd mobile && npm start`
3. Create account → Go through 8 steps
4. Verify all new questions work
5. Check database has all new fields

### New Fields to Verify in Database
- `height_cm` (from Step 2)
- `profession` (from Step 4)
- `education` (from Step 4)
- `city` (from Step 4)
- `country` (from Step 4)
- `smoker` (from Step 4)
- `marital_status` (from Step 4)
- `want_children` (from Step 5)
- `relocate` (from Step 5)

---

## 📝 Summary

✅ Removed selfie verification  
✅ Added 8 new demographic questions  
✅ All questions use selection-based UI  
✅ Complete Arabic translations  
✅ Reduced from 9 to 8 steps  
✅ Better UX with logical grouping  
✅ Terms integrated into final step  

**Status**: Ready for testing! 🎉

