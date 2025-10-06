# Zawaj Onboarding Flow Documentation

## Overview

The Zawaj app now features a comprehensive 9-step onboarding process designed to create detailed user profiles while maintaining an excellent user experience. The flow is optimized for mobile-first interactions with a focus on selection-based inputs rather than typing.

## Onboarding Steps

### Step 1: First Name & Role
**Purpose**: Establish basic identity and user type
- **Inputs**:
  - First name (text input, 2-50 characters)
  - Role selection (Male / Female / Mother)
  - If Mother: Looking for (Son / Daughter)
- **Backend**: `POST /onboarding/step1`
- **Validation**: First name must be at least 2 characters; Mother role requires mother_for selection

### Step 2: Date of Birth
**Purpose**: Age verification (18+ requirement)
- **Inputs**:
  - Date of birth (native date picker)
- **Backend**: `POST /onboarding/step2`
- **Validation**: User must be 18-100 years old
- **UX**: Shows calculated age in real-time

### Step 3: Selfie Verification
**Purpose**: Identity verification and liveness check
- **Inputs**:
  - Live selfie photo (camera only, not gallery)
- **Backend**: `POST /onboarding/step3` (multipart/form-data)
- **Guidelines**:
  - Look directly at camera
  - Well-lit environment
  - No sunglasses or masks
- **Note**: This photo is NOT shown publicly; it's for verification only

### Step 4: Profile Photos
**Purpose**: Public profile images
- **Inputs**:
  - 1-6 photos from gallery
  - First photo becomes primary
- **Backend**: `POST /photos` (for each photo), then `POST /onboarding/step4`
- **Guidelines**:
  - Clear face visibility
  - No heavy filters or sunglasses
  - Recent photos (within 1 year)

### Step 5: About Me
**Purpose**: Detailed personal information and preferences
- **Inputs**:
  - Bio (20-500 characters, text area)
  - Ethnicity (selectable list): Arab, South Asian, Southeast Asian, African, Turkish, Persian, Caucasian, Hispanic/Latino, Mixed, Other
  - Marriage Timeline (selectable):
    - Within 6 months
    - 6-12 months
    - 1-2 years
    - 2+ years
    - Open to timing
  - Religious Sect (selectable): Sunni, Shia, Other
  - Children Preference (selectable):
    - Want children
    - Have children, want more
    - Have children, don't want more
    - Don't want children
- **Backend**: `POST /onboarding/step5`
- **UX**: All selections except bio use button-based UI for easy tapping

### Step 6: Interests & Personality Traits
**Purpose**: Match compatibility through shared interests and traits
- **Inputs**:
  - Interests (3-10 selections) from 28 options
  - Personality Traits (3-5 selections) from 26 options
- **Backend**: `POST /onboarding/step6`
- **Available Interests**: Travel, Reading, Sports, Cooking, Arts & Crafts, Music, Photography, Hiking, Fitness, Gaming, Volunteering, Fashion, Technology, Nature, Gardening, Movies, Writing, Dancing, Learning Languages, Community Service, Business, Science, History, Philosophy, Animals, Coffee, Tea, Entrepreneurship
- **Available Traits**: Adventurous, Ambitious, Caring, Creative, Easy-going, Empathetic, Family-oriented, Funny, Generous, Honest, Independent, Intellectual, Kind, Loyal, Open-minded, Optimistic, Organized, Patient, Playful, Practical, Reliable, Respectful, Romantic, Spiritual, Thoughtful, Traditional

### Step 7: Icebreaker Questions
**Purpose**: Conversation starters for matches
- **Inputs**:
  - 1-3 prompt-answer pairs
  - Each answer: 10-300 characters
- **Backend**: `POST /onboarding/step7`
- **Available Prompts** (12 options):
  - What makes you laugh the most?
  - What are you most grateful for?
  - What do you value most in a relationship?
  - What's your idea of a perfect weekend?
  - What are your favorite hobbies?
  - What's something you're passionate about?
  - What's your favorite way to spend quality time?
  - What are your life goals?
  - What makes you feel most loved?
  - What's your favorite memory from childhood?
  - What does an ideal day look like for you?
  - What are you currently learning or want to learn?
- **UX**: Users select a prompt, then type their answer; can remove and add different prompts

### Step 8: Preferences/Filters
**Purpose**: Set discovery criteria
- **Inputs**:
  - Minimum Age (18-100)
  - Maximum Age (18-100)
  - Maximum Distance (5-500 km)
- **Backend**: `POST /onboarding/step8`
- **UX**: Slider-based interface for easy adjustment

### Step 9: Terms & Conditions
**Purpose**: Legal compliance and community standards
- **Inputs**:
  - Accept Terms of Service (required)
  - Accept Privacy Policy (required)
  - Accept Community Guidelines (required)
- **Backend**: `POST /onboarding/step9`
- **Completion**: Marks `onboarding_completed = true` and navigates to main app

## Database Schema Changes

### New User Fields
```prisma
first_name          String?
ethnicity           String?
sect                String?       // 'sunni' | 'shia' | 'other'
marriage_timeline   String?       // 'within_6_months' | '6_12_months' | '1_2_years' | '2plus_years' | 'open'
children_preference String?       // 'want_children' | 'have_and_want_more' | 'have_dont_want_more' | 'dont_want'
personality_traits  String?       // JSON array
icebreaker_questions String?      // JSON array of {prompt, answer, type}
selfie_verified     Boolean       @default(false)
selfie_url          String?
terms_accepted      Boolean       @default(false)
terms_accepted_at   DateTime?
onboarding_completed Boolean      @default(false)
onboarding_step     Int?          @default(0)
```

## API Endpoints

### GET /onboarding/status
Returns current onboarding progress

**Response**:
```json
{
  "current_step": 5,
  "completed": false,
  "data": {
    "has_first_name": true,
    "has_dob": true,
    "has_selfie": true,
    "has_photos": false,
    ...
  }
}
```

### GET /onboarding/options
Returns all available dropdown/selection options

**Response**:
```json
{
  "ethnicities": [...],
  "sects": [...],
  "marriage_timelines": [...],
  "children_preferences": [...],
  "interests": [...],
  "personality_traits": [...],
  "icebreaker_prompts": [...]
}
```

### POST /onboarding/step[1-9]
Individual step submission endpoints
- All require authentication (`x-user-id` header in dev)
- Each updates `onboarding_step` to track progress
- Step 9 marks `onboarding_completed = true`

## UI/UX Best Practices Implemented

### 1. **Progress Indication**
- Visual progress bar at top of each screen
- "Step X of 9" text below progress bar
- Builds user confidence and sets expectations

### 2. **Selection Over Typing**
- Chips, buttons, and sliders used wherever possible
- Minimizes keyboard interactions
- Faster completion time

### 3. **Visual Feedback**
- Active selections highlighted with gradient
- Character counters for text inputs
- Real-time validation feedback

### 4. **Mobile-First Design**
- Large tap targets (minimum 44x44 points)
- Gradient backgrounds for modern aesthetic
- Bottom-anchored navigation buttons
- Keyboard-aware scrolling

### 5. **Error Prevention**
- Disabled "Continue" button until requirements met
- Clear validation messages
- Maximum/minimum constraints enforced in UI

### 6. **Navigation Flow**
- Back button on all steps except first
- State persistence (can resume from any step)
- Loading states during API calls

### 7. **Accessibility**
- High contrast text
- Large fonts (14-28pt)
- Clear labeling
- Icon + text combinations

## Component Architecture

### Reusable Components
1. **ProgressBar**: Visual progress indicator
2. **SelectableChip**: Single-selection chip with gradient active state
3. **MultiSelect**: Multi-selection chip group with min/max limits
4. **Button**: Gradient, outline, ghost, and solid variants
5. **GradientBackground**: Consistent screen backgrounds

### Screen Structure
Each step screen follows consistent pattern:
```tsx
- GradientBackground
  - ScrollView
    - Header (ProgressBar + Step Text)
    - Content (Form inputs)
    - Footer (Back + Continue buttons)
```

## Testing Recommendations

### Unit Tests
- [ ] Validation logic for each step
- [ ] Age calculation accuracy
- [ ] File upload handling
- [ ] Array limits (interests, traits, icebreakers)

### Integration Tests
- [ ] Complete flow from step 1 to 9
- [ ] Resume from interrupted onboarding
- [ ] Back navigation preserves data
- [ ] API error handling

### E2E Tests
- [ ] Full onboarding with photo uploads
- [ ] Terms acceptance flow
- [ ] Redirect to main app on completion

## Future Enhancements

1. **Selfie Verification**
   - Implement actual liveness detection
   - Face matching with profile photos
   - AI-based quality checks

2. **Voice Icebreakers**
   - Record audio answers
   - Voice playback in matches

3. **Location Services**
   - Auto-detect city/country
   - Map-based distance preferences

4. **Progressive Onboarding**
   - Allow skip with reminder
   - Complete profile post-signup

5. **A/B Testing**
   - Test different question orders
   - Measure completion rates per step
   - Optimize drop-off points

## Maintenance

### Updating Options
To add/modify dropdown options, edit `/backend/src/routes/onboarding.ts`:

```typescript
router.get('/options', async (req, res) => {
  res.json({
    ethnicities: [...], // Add new options here
    // ...
  });
});
```

### Adding New Steps
1. Create new step screen in `/mobile/src/screens/onboarding/`
2. Add backend validation in `/backend/src/routes/onboarding.ts`
3. Update `NewOnboardingScreen.tsx` switch statement
4. Update total step count in ProgressBar components

## Support

For questions or issues:
- Backend API issues: Check logs in `/backend/`
- Mobile UI issues: Check React Native debugger
- Database issues: Run `npx prisma studio` to inspect data

