// hooks/useProfile.ts - Smart profile management hook with automatic data fetching

import { useState, useEffect, useCallback } from 'react';
import type { IUserProfile } from '@/types/profile.types';
import type { 
  UserRole, 
  VerificationStatus, 
  ModerationStatus} from '@/types/base.types';
import type { AuthResponse } from '@/types/user.types';
import { 
  ProfileAPIError, 
  profileAPI,
  type UpdateProfileData,
  type UpdateProfileRoleData,
  type UpdateLocationData,
  type UpdatePreferencesData,
  type UpdateSpecificPreferenceData,
  type BulkUpdatePreferencesData,
  type UpdateMarketplaceStatusData,
  type AddSocialMediaData,
  type UpdateVerificationStatusData,
  type UpdateModerationStatusData,
  type ModerateProfileContentData,
  type ProfileSearchParams,
  type LocationSearchParams,
  type PaginatedProfileResponse,
  type ProfileAnalyticsResponse,
  type ProfileActivitySummaryResponse
} from '@/lib/api/profiles/profile.api';

interface ProfileState {
  profile?: Partial<IUserProfile> | null;
  completeness: number;
  activitySummary: ProfileActivitySummaryResponse['data'] | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

interface ProfileActions {
  // Core profile management
  refreshProfile: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  updateProfileRole: (data: UpdateProfileRoleData) => Promise<void>;
  updateLocation: (data: UpdateLocationData) => Promise<void>;
  deleteProfile: () => Promise<void>;
  restoreProfile: () => Promise<void>;
  
  // Preferences management
  updatePreferences: (data: UpdatePreferencesData) => Promise<void>;
  updateSpecificPreference: (data: UpdateSpecificPreferenceData) => Promise<void>;
  bulkUpdatePreferences: (data: BulkUpdatePreferencesData) => Promise<void>;
  
  // Marketplace management
  updateMarketplaceStatus: (data: UpdateMarketplaceStatusData) => Promise<void>;
  
  // Social media management
  addSocialMediaHandle: (data: AddSocialMediaData) => Promise<void>;
  removeSocialMediaHandle: (handleId: string) => Promise<void>;
  
  // Verification
  initiateVerification: () => Promise<void>;
  
  // Data operations
  exportProfileData: () => Promise<{ message: string; data: unknown }>;
  refreshCompleteness: () => Promise<void>;
  refreshActivitySummary: () => Promise<void>;
  
  // Admin operations
  updateVerificationStatus: (data: UpdateVerificationStatusData) => Promise<void>;
  updateModerationStatus: (data: UpdateModerationStatusData) => Promise<void>;
  moderateProfileContent: (data: ModerateProfileContentData) => Promise<void>;
  recalculateCompleteness: (userId?: string) => Promise<void>;
  
  // Search operations
  searchProfiles: (params: ProfileSearchParams) => Promise<PaginatedProfileResponse>;
  getProfilesByLocation: (params: LocationSearchParams) => Promise<PaginatedProfileResponse>;
  getAllProfiles: (page?: number, limit?: number) => Promise<PaginatedProfileResponse>;
  getProfilesByStatus: (status: string, page?: number, limit?: number) => Promise<PaginatedProfileResponse>;
  getProfilesByVerificationStatus: (status: VerificationStatus, page?: number, limit?: number) => Promise<PaginatedProfileResponse>;
  getProfilesByModerationStatus: (status: ModerationStatus, page?: number, limit?: number) => Promise<PaginatedProfileResponse>;
  getIncompleteProfiles: (threshold?: number, page?: number, limit?: number) => Promise<PaginatedProfileResponse>;
  getMarketplaceActiveProfiles: (page?: number, limit?: number) => Promise<PaginatedProfileResponse>;
  getPendingModerationProfiles: (page?: number, limit?: number) => Promise<PaginatedProfileResponse>;
  
  // Analytics
  getProfileAnalytics: () => Promise<ProfileAnalyticsResponse>;
  
  // Utility
  clearError: () => void;
  hasRole: (role: UserRole) => boolean;
}

export const useProfile = (): ProfileState & ProfileActions => {
  const [state, setState] = useState<ProfileState>({
    profile: null,
    completeness: 0,
    activitySummary: null,
    isLoading: true,
    error: null,
    isInitialized: false,
  });

  const updateState = useCallback((updates: Partial<ProfileState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleProfileAction = useCallback(async <T = AuthResponse>(
    action: () => Promise<T>,
    options?: {
      onSuccess?: (response: T) => void;
      updateProfileFromResponse?: boolean;
      showLoading?: boolean;
    }
  ): Promise<T> => {
    const { 
      onSuccess, 
      updateProfileFromResponse = true, 
      showLoading = true 
    } = options || {};

    try {
      if (showLoading) {
        updateState({ isLoading: true, error: null });
      } else {
        updateState({ error: null });
      }
      
      const response = await action();
      
      // Update profile if response contains profile data
      if (updateProfileFromResponse && response && typeof response === 'object' && 'profile' in response) {
        const authResponse = response as unknown as AuthResponse;
        if (authResponse.profile) {
          updateState({
            profile: authResponse.profile,
            isLoading: false,
          });
        } else {
          updateState({ isLoading: false });
        }
      } else {
        updateState({ isLoading: false });
      }
      
      
      onSuccess?.(response);
      return response;
    } catch (error) {
      const errorMessage = error instanceof ProfileAPIError 
        ? error.message 
        : 'An unexpected error occurred';
      
      updateState({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  }, [updateState]);

  // Core profile management
  const refreshProfile = useCallback(async () => {
    await handleProfileAction(() => profileAPI.getProfile());
  }, [handleProfileAction]);

  const updateProfile = useCallback(async (data: UpdateProfileData) => {
    await handleProfileAction(() => profileAPI.updateProfile(data));
  }, [handleProfileAction]);

  const updateProfileRole = useCallback(async (data: UpdateProfileRoleData) => {
    await handleProfileAction(() => profileAPI.updateProfileRole(data));
  }, [handleProfileAction]);

  const updateLocation = useCallback(async (data: UpdateLocationData) => {
    await handleProfileAction(() => profileAPI.updateLocation(data));
  }, [handleProfileAction]);

  const deleteProfile = useCallback(async () => {
    await handleProfileAction(
      () => profileAPI.deleteProfile(),
      {
        onSuccess: () => {
          updateState({ profile: null });
        }
      }
    );
  }, [handleProfileAction, updateState]);

  const restoreProfile = useCallback(async () => {
    await handleProfileAction(() => profileAPI.restoreProfile());
  }, [handleProfileAction]);

  // Preferences management
  const updatePreferences = useCallback(async (data: UpdatePreferencesData) => {
    await handleProfileAction(() => profileAPI.updatePreferences(data));
  }, [handleProfileAction]);

  const updateSpecificPreference = useCallback(async (data: UpdateSpecificPreferenceData) => {
    await handleProfileAction(() => profileAPI.updateSpecificPreference(data));
  }, [handleProfileAction]);

  const bulkUpdatePreferences = useCallback(async (data: BulkUpdatePreferencesData) => {
    await handleProfileAction(() => profileAPI.bulkUpdatePreferences(data));
  }, [handleProfileAction]);

  // Marketplace management
  const updateMarketplaceStatus = useCallback(async (data: UpdateMarketplaceStatusData) => {
    await handleProfileAction(() => profileAPI.updateMarketplaceStatus(data));
  }, [handleProfileAction]);

  // Social media management
  const addSocialMediaHandle = useCallback(async (data: AddSocialMediaData) => {
    await handleProfileAction(() => profileAPI.addSocialMediaHandle(data));
  }, [handleProfileAction]);

  const removeSocialMediaHandle = useCallback(async (handleId: string) => {
    await handleProfileAction(() => profileAPI.removeSocialMediaHandle(handleId));
  }, [handleProfileAction]);

  // Verification
  const initiateVerification = useCallback(async () => {
    await handleProfileAction(() => profileAPI.initiateVerification());
  }, [handleProfileAction]);

  // Data operations
  const exportProfileData = useCallback(async () => {
    return handleProfileAction(
      () => profileAPI.exportProfileData(),
      { updateProfileFromResponse: false }
    );
  }, [handleProfileAction]);

  const refreshCompleteness = useCallback(async () => {
    try {
      updateState({ error: null });
      const response = await profileAPI.getProfileCompleteness();
      updateState({ 
        completeness: response.data.completeness || response.completeness || 0 
      });
    } catch (error) {
      const errorMessage = error instanceof ProfileAPIError 
        ? error.message 
        : 'Failed to fetch profile completeness';
      updateState({ error: errorMessage });
    }
  }, [updateState]);

  const refreshActivitySummary = useCallback(async () => {
    try {
      updateState({ error: null });
      const response = await profileAPI.getActivitySummary();
      updateState({ activitySummary: response.data });
    } catch (error) {
      const errorMessage = error instanceof ProfileAPIError 
        ? error.message 
        : 'Failed to fetch activity summary';
      updateState({ error: errorMessage });
    }
  }, [updateState]);

  // Admin operations
  const updateVerificationStatus = useCallback(async (data: UpdateVerificationStatusData) => {
    await handleProfileAction(
      () => profileAPI.updateVerificationStatus(data),
      { updateProfileFromResponse: false }
    );
  }, [handleProfileAction]);

  const updateModerationStatus = useCallback(async (data: UpdateModerationStatusData) => {
    await handleProfileAction(
      () => profileAPI.updateModerationStatus(data),
      { updateProfileFromResponse: false }
    );
  }, [handleProfileAction]);

  const moderateProfileContent = useCallback(async (data: ModerateProfileContentData) => {
    await handleProfileAction(
      () => profileAPI.moderateProfileContent(data),
      { updateProfileFromResponse: false }
    );
  }, [handleProfileAction]);

  const recalculateCompleteness = useCallback(async (userId?: string) => {
    await handleProfileAction(
      () => profileAPI.recalculateCompleteness(userId),
      { updateProfileFromResponse: false }
    );
  }, [handleProfileAction]);

  // Search operations (these don't update the main profile state)
  const searchProfiles = useCallback(async (params: ProfileSearchParams) => {
    return handleProfileAction(
      () => profileAPI.searchProfiles(params),
      { updateProfileFromResponse: false, showLoading: false }
    );
  }, [handleProfileAction]);

  const getProfilesByLocation = useCallback(async (params: LocationSearchParams) => {
    return handleProfileAction(
      () => profileAPI.getProfilesByLocation(params),
      { updateProfileFromResponse: false, showLoading: false }
    );
  }, [handleProfileAction]);

  const getAllProfiles = useCallback(async (page?: number, limit?: number) => {
    return handleProfileAction(
      () => profileAPI.getAllProfiles(page, limit),
      { updateProfileFromResponse: false, showLoading: false }
    );
  }, [handleProfileAction]);

  const getProfilesByStatus = useCallback(async (status: string, page?: number, limit?: number) => {
    return handleProfileAction(
      () => profileAPI.getProfilesByStatus(status, page, limit),
      { updateProfileFromResponse: false, showLoading: false }
    );
  }, [handleProfileAction]);

  const getProfilesByVerificationStatus = useCallback(async (status: VerificationStatus, page?: number, limit?: number) => {
    return handleProfileAction(
      () => profileAPI.getProfilesByVerificationStatus(status, page, limit),
      { updateProfileFromResponse: false, showLoading: false }
    );
  }, [handleProfileAction]);

  const getProfilesByModerationStatus = useCallback(async (status: ModerationStatus, page?: number, limit?: number) => {
    return handleProfileAction(
      () => profileAPI.getProfilesByModerationStatus(status, page, limit),
      { updateProfileFromResponse: false, showLoading: false }
    );
  }, [handleProfileAction]);

  const getIncompleteProfiles = useCallback(async (threshold?: number, page?: number, limit?: number) => {
    return handleProfileAction(
      () => profileAPI.getIncompleteProfiles(threshold, page, limit),
      { updateProfileFromResponse: false, showLoading: false }
    );
  }, [handleProfileAction]);

  const getMarketplaceActiveProfiles = useCallback(async (page?: number, limit?: number) => {
    return handleProfileAction(
      () => profileAPI.getMarketplaceActiveProfiles(page, limit),
      { updateProfileFromResponse: false, showLoading: false }
    );
  }, [handleProfileAction]);

  const getPendingModerationProfiles = useCallback(async (page?: number, limit?: number) => {
    return handleProfileAction(
      () => profileAPI.getPendingModerationProfiles(page, limit),
      { updateProfileFromResponse: false, showLoading: false }
    );
  }, [handleProfileAction]);

  // Analytics
  const getProfileAnalytics = useCallback(async () => {
    return handleProfileAction(
      () => profileAPI.getProfileAnalytics(),
      { updateProfileFromResponse: false, showLoading: false }
    );
  }, [handleProfileAction]);

  // Utility functions
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const hasRole = useCallback((role: UserRole): boolean => {
    return state.profile?.role === role;
  }, [state.profile]);

  // Auto-initialization effect
  useEffect(() => {
    let mounted = true;

    const initializeProfile = async () => {
      try {
        // Fetch profile data
        const [profileResponse, completenessResponse] = await Promise.allSettled([
          profileAPI.getProfile(),
          profileAPI.getProfileCompleteness(),
        ]);

        if (!mounted) return;

        // Handle profile response
        if (profileResponse.status === 'fulfilled' && profileResponse.value.profile) {
          updateState({
            profile: profileResponse.value.profile,
            isInitialized: true,
            isLoading: false,
          });
        } else {
          updateState({
            profile: null,
            isInitialized: true,
            isLoading: false,
          });
        }

        // Handle completeness response
        if (completenessResponse.status === 'fulfilled') {
          const completenessData = completenessResponse.value;
          updateState({
            completeness: completenessData.data?.completeness || completenessData.completeness || 0,
          });
        }

        // Optionally fetch activity summary (non-blocking)
        try {
          const activityResponse = await profileAPI.getActivitySummary();
          if (mounted) {
            updateState({ activitySummary: activityResponse.data });
          }
        } catch (error) {
          // Silently fail for activity summary
          console.warn('Failed to fetch activity summary:', error);
        }

      } catch (error) {
        if (!mounted) return;

        console.warn('Profile initialization failed:', error);
        
        updateState({
          profile: null,
          isInitialized: true,
          isLoading: false,
          error: error instanceof ProfileAPIError && error.statusCode !== 401 
            ? error.message 
            : null,
        });
      }
    };

    initializeProfile();

    return () => {
      mounted = false;
    };
  }, [updateState]);

  return {
    ...state,
    refreshProfile,
    updateProfile,
    updateProfileRole,
    updateLocation,
    deleteProfile,
    restoreProfile,
    updatePreferences,
    updateSpecificPreference,
    bulkUpdatePreferences,
    updateMarketplaceStatus,
    addSocialMediaHandle,
    removeSocialMediaHandle,
    initiateVerification,
    exportProfileData,
    refreshCompleteness,
    refreshActivitySummary,
    updateVerificationStatus,
    updateModerationStatus,
    moderateProfileContent,
    recalculateCompleteness,
    searchProfiles,
    getProfilesByLocation,
    getAllProfiles,
    getProfilesByStatus,
    getProfilesByVerificationStatus,
    getProfilesByModerationStatus,
    getIncompleteProfiles,
    getMarketplaceActiveProfiles,
    getPendingModerationProfiles,
    getProfileAnalytics,
    clearError,
    hasRole,
  };
};