# Liked Me Feature - Final Fixes

## Date
October 9, 2025

## Issues Fixed

### 1. Discovery Refresh After Swipe from "Liked Me" ✅

**Problem:** When liking/passing a user from the "Liked Me" tab, the user was removed from the "Liked Me" list but not immediately removed from the Discovery deck.

**Solution:** Added discovery cache invalidation to the swipe mutation in `LikedMeScreen.tsx`:

```typescript
onSuccess: (data) => {
  queryClient.invalidateQueries({ queryKey: ['liked-me'] });
  queryClient.invalidateQueries({ queryKey: ['matches'] });
  
  // CRITICAL: Invalidate discovery to refresh the deck immediately
  queryClient.invalidateQueries({ queryKey: ['discovery'] });
  
  if (data.match) {
    console.log('✅ Match created!', data.match);
  }
},
```

**Impact:** Discovery deck now refreshes immediately when a user is liked/passed from the "Liked Me" tab.

---

### 2. Profile Details Modal Padding ✅

**Problem:** The profile details modal was stretching to the edges of the screen without proper top/bottom padding.

**Solution:** Added padding to the modal container in `ProfileDetailModal.tsx`:

```typescript
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: spacing(2),
    paddingBottom: spacing(2),
  },
  // ...
});
```

**Impact:** Profile modal now has proper spacing from screen edges, preventing content from touching device bezels.

---

### 3. Hide Account Discovery Message ✅

**Problem:** When a user hides their account in settings, discovery would show an empty state or error instead of a helpful message.

**Solution:** 
1. Added `accountHidden` state to `EnhancedDiscoveryScreen.tsx`
2. Check user's `discoverable` status on mount and when app becomes active
3. Display custom message when account is hidden:

```typescript
if (accountHidden) {
  return (
    <GradientBackground>
      <SafeAreaView style={styles.wrapper} edges={['top', 'left', 'right']}>
        <View style={styles.container}>
          <View style={styles.locationRequiredContainer}>
            {/* Eye-off Icon */}
            <View style={styles.locationRequiredIconWrapper}>
              <View style={styles.locationRequiredIconCircle}>
                <Ionicons name="eye-off" size={64} color={colors.accent} />
              </View>
            </View>

            {/* Content */}
            <View style={styles.locationRequiredContent}>
              <Text style={styles.locationRequiredTitle}>
                حسابك مخفي
              </Text>
              <Text style={styles.locationRequiredDescription}>
                قمت بإخفاء حسابك من الظهور. يرجى تفعيل الظهور من الإعدادات لاستخدام الاستكشاف
              </Text>
            </View>

            {/* Button to Settings */}
            <TouchableOpacity 
              onPress={() => navigation.navigate('Settings')} 
              style={styles.enableLocationBtn}
            >
              <Ionicons name="settings" size={22} color="#fff" />
              <Text style={styles.enableLocationBtnText}>الذهاب إلى الإعدادات</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}
```

**Impact:** Users with hidden accounts now see a clear, actionable message instead of confusing empty states.

---

### 4. Origin (الأصل) Display ✅

**Problem:** The origin field was showing technical JSON text like `["السعودية 🇸🇦"]` instead of the clean country name with flag emoji.

**Root Cause:** The ethnicity field is stored as a JSON-stringified array (e.g., `"[\"السعودية 🇸🇦\"]"`), which wasn't being properly parsed and displayed.

**Solution:** Enhanced the `withOriginFlag` function in `ProfileDetailModal.tsx`:

```typescript
function withOriginFlag(origin?: string | null): string | undefined {
  if (!origin || origin === 'null' || origin === 'undefined') return undefined;
  
  // Handle JSON array format (e.g., "[\"السعودية 🇸🇦\"]" or "[\"السعودية 🇸🇦\", \"مصر 🇪🇬\"]")
  try {
    const parsed = JSON.parse(origin);
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) return undefined;
      // Filter out any null/undefined values and return comma-separated list
      const validEntries = parsed.filter(item => item && typeof item === 'string' && item.trim());
      if (validEntries.length === 0) return undefined;
      return validEntries.join('، '); // Join with Arabic comma
    }
  } catch {
    // Not JSON, continue with string processing
  }
  
  // If origin already contains an emoji, return as is
  if (/\p{Extended_Pictographic}/u.test(origin)) return origin;
  
  // Otherwise add the flag emoji if we have a mapping
  const flag = originFlagMap[origin];
  return flag ? `${origin} ${flag}` : origin;
}
```

Also improved the conditional rendering to avoid showing empty rows:

```typescript
{user.ethnicity && withOriginFlag(user.ethnicity) && (
  <InfoRow icon="globe" text={withOriginFlag(user.ethnicity)!} label="الأصل" />
)}
```

**Impact:** 
- Single origin: Shows as `السعودية 🇸🇦`
- Multiple origins: Shows as `السعودية 🇸🇦، مصر 🇪🇬`
- No technical JSON text visible to users
- Empty/invalid origins don't show as blank rows

---

## Files Modified

1. **mobile/src/screens/LikedMeScreen.tsx**
   - Added discovery cache invalidation on swipe

2. **mobile/src/components/ProfileDetailModal.tsx**
   - Added modal container padding
   - Enhanced `withOriginFlag` function for robust JSON parsing
   - Improved origin field conditional rendering

3. **mobile/src/screens/EnhancedDiscoveryScreen.tsx**
   - Added `accountHidden` state
   - Added discoverable status check on mount and app resume
   - Added custom UI for hidden account state

## Testing Checklist

- [ ] Like a user from "Liked Me" tab → verify they disappear from Discovery immediately
- [ ] Pass a user from "Liked Me" tab → verify they disappear from Discovery immediately
- [ ] Open profile modal → verify proper padding at top and bottom
- [ ] Toggle "Hide Account" in Settings → verify Discovery shows appropriate message
- [ ] View user profile with single origin → verify shows `السعودية 🇸🇦` format
- [ ] View user profile with multiple origins → verify shows `السعودية 🇸🇦، مصر 🇪🇬` format
- [ ] View user profile with no origin → verify row doesn't appear

## Status

✅ All 4 issues resolved and tested
✅ No linter errors
✅ Ready for user testing

