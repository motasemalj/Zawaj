# Account Deletion During Onboarding - Feature Documentation

## ✅ Implementation Complete

### Overview
Users can now cancel the onboarding process at any time, which will:
1. Delete their incomplete account
2. Log them out
3. Return them to the Welcome screen

### Backend Changes

#### 1. Database Schema - Cascade Deletes ✅
Added `onDelete: Cascade` to all foreign key relations to ensure clean deletion:

**Models Updated**:
- `Photo` → User relationship
- `Preference` → User relationship
- `Swipe` → User relationships (from_user, to_user)
- `Match` → User relationships (user_a, user_b)
- `Message` → User and Match relationships
- `Report` → User relationship
- `Block` → User relationships (blocker, blocked)
- `AuditLog` → User and Match relationships

**Migration Created**: `20251005045727_add_cascade_deletes`

When a user is deleted, ALL related data is automatically removed:
- ✅ Profile photos
- ✅ Preferences/filters
- ✅ Swipes given and received
- ✅ Matches (both as user_a and user_b)
- ✅ Messages sent
- ✅ Reports made
- ✅ Blocks given and received
- ✅ Audit logs

#### 2. API Endpoint - DELETE /users/me ✅

**Location**: `/backend/src/routes/users.ts`

**Endpoint**: `DELETE /users/me`

**Authentication**: Requires `x-user-id` header (dev mode)

**Response**:
```json
{
  "ok": true,
  "message": "Account deleted successfully"
}
```

**Implementation**:
```typescript
router.delete('/me', async (req: AuthedRequest, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Delete user and all related data (Prisma cascades)
    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ ok: true, message: 'Account deleted successfully' });
  } catch (e) {
    next(e);
  }
});
```

### Frontend Changes

#### 1. Back Button on Step 1 ✅

**Location**: All onboarding steps now have back button at top-right (RTL)

**Step 1 Behavior**:
- Shows back button with forward arrow icon (←)
- Clicking triggers confirmation dialog
- Confirming deletes account and logs out

#### 2. Confirmation Dialog ✅

**Location**: `NewOnboardingScreen.tsx` → `handleCancelOnboarding()`

**Arabic Text**:
- Title: "إلغاء التسجيل"
- Message: "هل أنت متأكد أنك تريد إلغاء التسجيل؟ سيتم حذف حسابك."
- Cancel button: "الاستمرار في التسجيل"
- Confirm button: "نعم، إلغاء" (destructive style - red)

**Flow**:
```
User clicks back button
    ↓
Confirmation dialog appears
    ↓
User clicks "نعم، إلغاء"
    ↓
API call: DELETE /users/me
    ↓
Set currentUserId to null (logout)
    ↓
Navigation automatically returns to Welcome screen
```

#### 3. Error Handling ✅

If the API call fails:
- Error is logged to console
- User is still logged out
- Navigation still proceeds to Welcome

This ensures the user isn't stuck even if the server is down.

### Code Implementation

#### NewOnboardingScreen.tsx
```typescript
const { setCurrentUserId, currentUserId } = useApiState();

const handleCancelOnboarding = () => {
  Alert.alert(
    'إلغاء التسجيل',
    'هل أنت متأكد أنك تريد إلغاء التسجيل؟ سيتم حذف حسابك.',
    [
      { text: 'الاستمرار في التسجيل', style: 'cancel' },
      { 
        text: 'نعم، إلغاء', 
        style: 'destructive', 
        onPress: async () => {
          try {
            setLoading(true);
            if (currentUserId) {
              await api.delete(`/users/me`);
            }
            setCurrentUserId(null);
          } catch (error) {
            console.error('Error deleting account:', error);
            setCurrentUserId(null);
          } finally {
            setLoading(false);
          }
        }
      }
    ]
  );
};

// Step 1 uses handleCancelOnboarding for back button
case 1:
  return <Step1NameRole 
    onComplete={handleStep1Complete} 
    onBack={handleCancelOnboarding} 
    showBackButton={true} 
  />;
```

#### Step1NameRole.tsx
```typescript
type Step1Props = {
  onComplete: (data: {...}) => void;
  onBack?: () => void;
  showBackButton?: boolean;  // New prop
};

export default function Step1NameRole({ 
  onComplete, 
  onBack, 
  showBackButton = true 
}: Step1Props) {
  // ...
  
  return (
    <ScrollView>
      {showBackButton && (
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-forward" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      )}
      {/* Rest of content */}
    </ScrollView>
  );
}
```

## 🎯 User Flow Example

### Scenario 1: Cancel at Step 1
```
1. User completes phone OTP
2. Lands on Step 1 (First Name & Role)
3. Sees back button at top-right
4. Clicks back button
5. Confirmation: "هل أنت متأكد أنك تريد إلغاء التسجيل؟ سيتم حذف حسابك."
6. Clicks "نعم، إلغاء"
7. Account deleted from database
8. User logged out
9. Returns to Welcome screen
```

### Scenario 2: Cancel at Step 5
```
1. User completes Steps 1-4
2. On Step 5 (About Me)
3. Clicks back button
4. Returns to Step 4
5. (Can click back again to go to Step 3, etc.)
6. Eventually reaches Step 1
7. Clicks back on Step 1
8. Confirmation and deletion flow (as above)
```

## 🔒 Safety Features

### 1. **Confirmation Dialog**
- Prevents accidental deletions
- Clear warning message in Arabic
- Destructive action styling (red)

### 2. **Graceful Degradation**
- If API fails, user is still logged out
- No stuck states
- Error logged for debugging

### 3. **Complete Data Removal**
- Cascade deletes ensure no orphaned records
- All user data removed
- Clean database state

## 🧪 Testing

### Manual Test Steps
1. Create new account via phone OTP
2. Start onboarding (Step 1)
3. Click back button at top-right
4. Verify confirmation dialog appears in Arabic
5. Click "نعم، إلغاء"
6. Verify:
   - Account deleted from database (check with Prisma Studio)
   - User logged out
   - Navigated to Welcome screen
   - Can create new account again

### Database Verification
```bash
cd backend
npx prisma studio
# Check Users table - account should be gone
# Check Photos, Preferences, etc. - related data should be gone
```

### API Test
```bash
# Get user ID first
USER_ID="your-user-id-here"

# Delete account
curl -X DELETE http://localhost:4000/users/me \
  -H "x-user-id: $USER_ID"

# Response should be:
# {"ok":true,"message":"Account deleted successfully"}
```

## 📊 Database Impact

### What Gets Deleted (Cascade)
When user ID `abc123` is deleted:

```sql
DELETE FROM Photo WHERE userId = 'abc123';
DELETE FROM Preference WHERE userId = 'abc123';
DELETE FROM Swipe WHERE from_user_id = 'abc123' OR to_user_id = 'abc123';
DELETE FROM Match WHERE user_a_id = 'abc123' OR user_b_id = 'abc123';
DELETE FROM Message WHERE sender_id = 'abc123';
DELETE FROM Report WHERE reporter_id = 'abc123';
DELETE FROM Block WHERE blocker_id = 'abc123' OR blocked_id = 'abc123';
DELETE FROM AuditLog WHERE sender_id = 'abc123';
DELETE FROM User WHERE id = 'abc123';
```

All handled automatically by Prisma cascade deletes!

## 🎨 UX Details

### Visual Elements
- **Icon**: Forward arrow (arrow-forward) because in RTL, "back" means "forward"
- **Position**: Top-right corner (natural for RTL)
- **Style**: Ghost button (no background, just icon)
- **Size**: 24px icon, comfortable tap target

### Dialog Design
- **Type**: Alert.alert (native dialog)
- **Style**: Destructive action (red on iOS)
- **Buttons**: 2 options (cancel vs. confirm)
- **Default**: Cancel (safe option)

### Loading State
- Shows loading indicator during deletion
- Prevents multiple clicks
- User can't interact until complete

## 🚀 Benefits

1. **User Control**: Complete agency to exit onboarding
2. **Clean Database**: No abandoned incomplete accounts
3. **Privacy**: User data fully removed on request
4. **Clear Communication**: Arabic confirmation prevents confusion
5. **Safety**: Requires explicit confirmation
6. **Professional**: Industry-standard UX pattern

## 📝 Future Enhancements

### Optional Improvements
- [ ] Add "Save as Draft" option (keep account but incomplete)
- [ ] Email confirmation before deletion (production)
- [ ] Soft delete with recovery period (30 days)
- [ ] Analytics tracking for drop-off points
- [ ] Exit survey ("Why are you leaving?")

### Production Considerations
- [ ] Add rate limiting to prevent abuse
- [ ] Log deletion events for audit
- [ ] Notify admin of deletions (monitoring)
- [ ] GDPR compliance documentation

---

**Status**: ✅ Fully Implemented and Ready for Testing

**Files Modified**:
- Backend: `users.ts` (new DELETE route), `schema.prisma` (cascade deletes)
- Frontend: `NewOnboardingScreen.tsx` (deletion handler), `Step1NameRole.tsx` (back button)
- Migration: `20251005045727_add_cascade_deletes`

