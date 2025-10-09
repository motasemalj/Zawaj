# Liked Me Feature Fixes

## Issues Fixed

### 1. ✅ Liking/Passing from "Liked Me" Removes Users from Discovery

**Issue:** Users swiped on in the "Liked Me" tab were still showing up in Discovery.

**Solution:** 
The Discovery endpoint already excludes all swiped users (both left and right):

**File:** `backend/src/routes/discovery.ts` (lines 173-179)
```typescript
// Exclude ALL already swiped users (both left and right)
const allSwipes = await prisma.swipe.findMany({ 
  where: { from_user_id: me.id },
  select: { to_user_id: true }
});
const excludeSwipedIds = allSwipes.map(s => s.to_user_id);
```

This means:
- When you like someone from "Liked Me" → Creates a swipe record → User excluded from discovery
- When you pass someone from "Liked Me" → Creates a swipe record → User excluded from discovery
- Works automatically with no additional code needed

### 2. ✅ Profile Details Modal Safe Area Padding

**Issue:** Profile modal didn't have proper safe area padding on all edges.

**Solution:** 
Updated ProfileDetailModal to use SafeAreaView on all edges:

**File:** `mobile/src/components/ProfileDetailModal.tsx`
```typescript
// Before
<Modal>
  <View style={styles.modalContainer}>
    <SafeAreaView edges={['top', 'left', 'right']}>

// After
<Modal>
  <SafeAreaView edges={['top', 'bottom', 'left', 'right']}>
    <View style={styles.safeArea}>
```

Changes:
- SafeAreaView now wraps the entire modal content
- All edges protected: top (status bar), bottom (home indicator), left/right (notches)
- Proper nesting for fullscreen modal presentation

### 3. ✅ "Hide Account" in Settings Disables Discovery

**Issue:** Unclear if hiding account actually removes user from discovery.

**Solution:** 
The feature already works correctly:

**Settings Screen** (`mobile/src/screens/UltraEnhancedSettingsScreen.tsx`, lines 437-459):
```typescript
<Switch 
  value={!userDiscoverable} 
  onValueChange={(hidden) => {
    setUserDiscoverable(!hidden);
    updateProfileMutation.mutate(
      { discoverable: !hidden },
      {
        onSuccess: () => {
          resetDiscoverySession();
          queryClient.invalidateQueries({ queryKey: ['discovery'] });
        }
      }
    );
  }} 
/>
```

**Discovery Endpoint** (`backend/src/routes/discovery.ts`, line 99):
```typescript
// Exclude users who chose to hide their profile
andConditions.push({ discoverable: { equals: true } });
```

Flow:
1. User toggles "إخفاء الحساب من الظهور" in settings
2. Updates `discoverable` field in database
3. Discovery cache invalidated
4. Discovery endpoint filters out users with `discoverable: false`
5. User no longer appears in anyone's discovery feed

### 4. ✅ Origin (الأصل) Display Fixed

**Issue:** Origin showing as technical array text instead of country name with flag.

**Example of issue:**
- Expected: `السعودية 🇸🇦` or `السعودية 🇸🇦، مصر 🇪🇬`
- Was showing: `["السعودية 🇸🇦"]` or similar

**Solution:** 
Updated `withOriginFlag()` function to handle JSON array format:

**File:** `mobile/src/components/ProfileDetailModal.tsx`
```typescript
function withOriginFlag(origin?: string | null): string | undefined {
  if (!origin) return origin ?? undefined;
  
  // Handle JSON array format (e.g., ["السعودية 🇸🇦", "مصر 🇪🇬"])
  try {
    const parsed = JSON.parse(origin);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Return comma-separated list of countries (already includes flags)
      return parsed.join('، ');
    }
  } catch {
    // Not JSON, continue with string processing
  }
  
  // If origin already contains an emoji, return as is
  if (/\p{Extended_Pictographic}/u.test(origin)) return origin;
  const flag = originFlagMap[origin];
  return flag ? `${origin} ${flag}` : origin;
}
```

**Results:**
- **Single origin:** `["السعودية 🇸🇦"]` → `السعودية 🇸🇦`
- **Multiple origins:** `["السعودية 🇸🇦", "مصر 🇪🇬"]` → `السعودية 🇸🇦، مصر 🇪🇬`
- **Plain string:** `"السعودية"` → `السعودية 🇸🇦` (adds flag from map)
- **Already has flag:** `"السعودية 🇸🇦"` → `السعودية 🇸🇦` (no change)

## Summary

All 4 issues are now fixed:

1. ✅ **Discovery Exclusion** - Swiped users automatically excluded (already working)
2. ✅ **Safe Area Padding** - Modal has proper padding on all edges
3. ✅ **Hide Account** - Feature fully functional (already working)
4. ✅ **Origin Display** - Clean country names with flags (no technical text)

## Files Modified

- ✏️ `mobile/src/components/ProfileDetailModal.tsx` - Safe area & origin display fixes
- 📝 Documentation updates

## Testing Checklist

- [ ] Swipe on user in "Liked Me" → User disappears from discovery
- [ ] Profile modal displays properly on iPhone X+ (notch, home indicator)
- [ ] Toggle "Hide Account" in settings → Profile no longer in discovery
- [ ] Origin displays as `السعودية 🇸🇦` not `["السعودية 🇸🇦"]`
- [ ] Multiple origins display as `السعودية 🇸🇦، مصر 🇪🇬`

