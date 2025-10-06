Zawaj (MVP)

Backend (Express + Prisma + SQLite)
- Requirements: Node 20+, npm
- Setup:
  1. cd backend
  2. npm i
  3. export DATABASE_URL="file:./dev.db"
  4. npx prisma generate
  5. npx prisma migrate dev --name init
  6. npm run prisma:seed
  7. export PORT=4000 && npm run dev
- Auth: Dev-only via `x-user-id` header. Use mobile Auth picker to select a seeded user.
- Dev endpoints: `/dev/users` lists user IDs for testing.

Mobile (Expo React Native)
- Requirements: Node 20.19.4+ recommended for React Native 0.81.x.
- Setup:
  1. cd mobile
  2. npm i
  3. npm run web (or npm run ios / android)
  4. On first screen, set backend URL if needed (default http://localhost:4000), press "تحديث" to load users, then pick one.
  5. Explore tabs: استكشاف (swipe), التوافقات, الإعدادات. Use "تصفية" to set filters.

Features
- **Comprehensive 9-step onboarding flow**:
  1. First name & role selection (Male/Female/Mother)
  2. Age verification (18+ required)
  3. Selfie verification (liveness check)
  4. Profile photo uploads (1-6 photos)
  5. About me (bio, ethnicity, marriage timeline, sect, children preferences)
  6. Interests & personality traits (selectable, 3-10 interests, 3-5 traits)
  7. Icebreaker questions (1-3 conversation starters)
  8. Preference/filter settings (age range, distance)
  9. Terms & conditions acceptance
- Phone OTP authentication (dev mode)
- Profile creation and editing
- Swipe-based discovery (Tinder-style)
- Matching algorithm with preferences
- In-app messaging
- Blocking and reporting
- Privacy settings (blur mode)
- Geolocation-based discovery

Notes
- OTP, push, and NSFW detection are stubbed/commented to enable local testing.
- Photos upload saves to local `backend/uploads` and serves via `/uploads`.
- All UI is Arabic (RTL) for MVP.
- See ONBOARDING_GUIDE.md for detailed documentation on the onboarding flow.


