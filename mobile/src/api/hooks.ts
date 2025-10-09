import React from 'react';
import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { getClient } from './client';

// ==================== QUERIES ====================

// Get current user profile
export function useCurrentUser(options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const api = getClient();
      try {
        const res = await api.get('/users/me');
        return res.data;
      } catch (error: any) {
        console.error('useCurrentUser error:', error.response?.status, error.message);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 401/403 (auth errors)
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    ...options,
  });
}

// Get discovery profiles with session-based exclusion tracking
// Store session excludes in a ref that persists across re-renders but resets on logout
const sessionExcludesRef = { current: new Set<string>() };

// Export function to reset session excludes (call on logout)
export function resetDiscoverySession() {
  console.log('[Discovery] Resetting session excludes on logout');
  sessionExcludesRef.current.clear();
}

// State for exclude version - persists across component re-renders but resets on app restart
const excludeVersionRef = { current: 0 };

export function useDiscoveryProfiles(options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>) {
  const [excludeVersion, setExcludeVersion] = React.useState(excludeVersionRef.current);
  const [page, setPage] = React.useState(0);
  
  const query = useQuery({
    queryKey: ['discovery', excludeVersion, page],
    queryFn: async () => {
      const api = getClient();
      const excludeList = Array.from(sessionExcludesRef.current);
      console.log(`[useDiscoveryProfiles] Fetching discovery profiles`);
      console.log(`[useDiscoveryProfiles] Session excludes: ${excludeList.length} profiles`);
      if (excludeList.length > 0) {
        console.log(`[useDiscoveryProfiles] Excluded IDs: ${excludeList.slice(0, 5).join(', ')}${excludeList.length > 5 ? '...' : ''}`);
      }
      
      const res = await api.get('/discovery', {
        params: {
          exclude_ids: excludeList.join(','),
          _ts: Date.now(), // Cache bust
          page,
          limit: 30,
        },
      });
      
      const profiles = res.data.users || [];
      console.log(`[useDiscoveryProfiles] ✅ Received ${profiles.length} profiles from API (page ${res.data.page}, hasMore=${res.data.hasMore})`);
      return profiles;
    },
    staleTime: 0, // Always fresh for discovery
    gcTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    ...options,
  });
  
  // Helper to mark profile as shown exactly once per session
  const markAsShown = React.useCallback((profileId: string) => {
    if (!profileId) return;
    if (sessionExcludesRef.current.has(profileId)) return; // already tracked; avoid spam
    sessionExcludesRef.current.add(profileId);
    // Keep logs minimal to avoid spam
    // console.log(`[useDiscoveryProfiles] Marked ${profileId} as shown (${sessionExcludesRef.current.size} total)`);
  }, []);
  
  // Helper to clear all session excludes (triggers refetch by incrementing version)
  const clearSessionExcludes = React.useCallback(() => {
    console.log('[useDiscoveryProfiles] Clearing session excludes and resetting page');
    sessionExcludesRef.current.clear();
    setPage(0); // Reset page to 0
    excludeVersionRef.current += 1;
    setExcludeVersion(excludeVersionRef.current); // Trigger refetch with new key
  }, []);
  
  return {
    ...query,
    sessionExcludeIds: sessionExcludesRef.current,
    markAsShown,
    clearSessionExcludes,
    setPage,
  };
}

// Get matches
export function useMatches(options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: ['matches'],
    queryFn: async () => {
      const api = getClient();
      return (await api.get('/matches')).data.matches;
    },
    staleTime: 1000 * 30, // 30 seconds
    ...options,
  });
}

// Get match details
export function useMatch(matchId: string | null, options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const api = getClient();
      // Backend returns match directly, not wrapped in { match: ... }
      return (await api.get(`/matches/${matchId}`)).data;
    },
    enabled: !!matchId,
    staleTime: 1000 * 60, // 1 minute
    ...options,
  });
}

// Get messages for a match
export function useMessages(matchId: string | null, options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: ['messages', matchId],
    queryFn: async () => {
      const api = getClient();
      return (await api.get(`/matches/${matchId}/messages`)).data.messages;
    },
    enabled: !!matchId,
    staleTime: 1000 * 10, // 10 seconds
    refetchInterval: 1000 * 5, // Poll every 5 seconds
    ...options,
  });
}

// Get onboarding options
export function useOnboardingOptions(options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: ['onboarding', 'options'],
    queryFn: async () => {
      const api = getClient();
      return (await api.get('/onboarding/options')).data;
    },
    staleTime: Infinity, // Options don't change
    ...options,
  });
}

// ==================== MUTATIONS ====================

// Send a swipe
export function useSwipe(options?: UseMutationOptions<any, any, any>) {
  return useMutation({
    mutationFn: async (data: { to_user_id: string; direction: 'left' | 'right'; is_super_like?: boolean }) => {
      const api = getClient();
      const res = await api.post('/swipes', data);
      return res.data;
    },
    // Let the component handle onSuccess to avoid duplicate match animations
    // The component's onSuccess will handle match invalidation
    ...options,
  });
}

// Undo swipe
export function useUndoSwipe(options?: UseMutationOptions<any, any, void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const api = getClient();
      const res = await api.post('/swipes/undo');
      return res.data;
    },
    onSuccess: (data) => {
      // If a match was deleted, invalidate matches
      if (data.match_deleted) {
        queryClient.invalidateQueries({ queryKey: ['matches'] });
      }
      // Invalidate discovery to allow the undone profile to reappear
      queryClient.invalidateQueries({ queryKey: ['discovery'] });
    },
    ...options,
  });
}

// Send a message
export function useSendMessage(options?: UseMutationOptions<any, any, any>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { match_id: string; text: string }) => {
      const api = getClient();
      const res = await api.post(`/matches/${data.match_id}/messages`, { text: data.text });
      return res.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate messages for this match
      queryClient.invalidateQueries({ queryKey: ['messages', variables.match_id] });
      // Invalidate matches to update last message timestamp
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
    ...options,
  });
}

// Unmatch
export function useUnmatch(options?: UseMutationOptions<any, any, string>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (matchId: string) => {
      const api = getClient();
      await api.delete(`/matches/${matchId}`);
      return matchId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
    ...options,
  });
}

// Update user profile
export function useUpdateProfile(options?: UseMutationOptions<any, any, any>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const api = getClient();
      const res = await api.put('/users/me', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
    ...options,
  });
}

// Update preferences
export function useUpdatePreferences(options?: UseMutationOptions<any, any, any>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const api = getClient();
      const res = await api.put('/users/me/preferences', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      // Invalidate discovery to apply new filters
      queryClient.invalidateQueries({ queryKey: ['discovery'] });
    },
    ...options,
  });
}

// Update device info (location, push token)
export function useUpdateDevice(options?: UseMutationOptions<any, any, any>) {
  return useMutation({
    mutationFn: async (data: any) => {
      const api = getClient();
      const res = await api.put('/users/me/device', data);
      return res.data;
    },
    ...options,
  });
}

// Mark discovery profile as seen (backend de-duplicates across sessions)
export function useMarkDiscoverySeen(options?: UseMutationOptions<any, any, string>) {
  return useMutation({
    mutationFn: async (seenUserId: string) => {
      const api = getClient();
      const res = await api.post('/discovery/seen', { seen_user_id: seenUserId });
      return res.data;
    },
    ...options,
  });
}

// Upload photos
export function useUploadPhoto(options?: UseMutationOptions<any, any, any>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const api = getClient();
      const res = await api.put('/photos/me/photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
    ...options,
  });
}

// Reorder photos
export function useReorderPhotos(options?: UseMutationOptions<any, any, any>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { photos: { id: string; order: number }[] }) => {
      const api = getClient();
      const res = await api.put('/photos/me/reorder', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
    ...options,
  });
}

// Delete photo
export function useDeletePhoto(options?: UseMutationOptions<any, any, string>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (photoId: string) => {
      const api = getClient();
      await api.delete(`/photos/${photoId}`);
      return photoId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
    ...options,
  });
}

// Delete account
export function useDeleteAccount(options?: UseMutationOptions<any, any, void>) {
  return useMutation({
    mutationFn: async () => {
      const api = getClient();
      await api.delete('/users/me');
    },
    ...options,
  });
}

// Onboarding step mutations
export function useOnboardingStep(step: number, options?: UseMutationOptions<any, any, any>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const api = getClient();
      const res = await api.post(`/onboarding/step${step}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
    ...options,
  });
}

// Upload single photo (onboarding)
export function useUploadSinglePhoto(options?: UseMutationOptions<any, any, FormData>) {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const api = getClient();
      const res = await api.post('/photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    ...options,
  });
}

// Report user/message/photo
export function useReport(options?: UseMutationOptions<any, any, any>) {
  return useMutation({
    mutationFn: async (data: { target_type: 'user' | 'message' | 'photo'; target_id: string; reason: string }) => {
      const api = getClient();
      const res = await api.post('/reports', data);
      return res.data;
    },
    ...options,
  });
}

