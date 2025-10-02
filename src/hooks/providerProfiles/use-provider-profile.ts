import { useState, useCallback, useEffect, useMemo } from 'react';
import { Types } from 'mongoose';
import {
  ProviderProfile,
  CreateProviderProfileRequestBody,
  UpdateProviderProfileRequestBody,
  ProviderProfileResponse,
} from '@/types/provider-profile.types';
import { PaginatedResponse } from '@/types/aggregated.types';
import { LocationSearchParams } from '@/lib/api/profiles/profile.api';
import {
  ApiResponse,
  AddServiceOfferingData,
  UpdateWorkingHoursData,
  PublicProviderProfileQueryParams,
  ProviderProfileAPIError,
  providerProfileAPI,
  BulkUpdateRiskAssessmentsData,
  ProviderStatisticsResponse,
  RiskScoreResponse,
  ScheduleAssessmentData,
  UpdateOperationalStatusData,
  UpdatePerformanceMetricsData,
  UpdateRiskAssessmentData,
} from '@/lib/api/providerProfiles/providerProfile.api';
import { ProviderOperationalStatus, RiskLevel } from '@/types';

interface UseProviderProfileState {
  loading: boolean;
  error: string | null;
  success: boolean;
  lastAction: string | null;
}

interface UseProviderProfileReturn extends UseProviderProfileState {
  createProfile: (data: CreateProviderProfileRequestBody) => Promise<ProviderProfileResponse>;
  getMyProfile: () => Promise<ProviderProfileResponse>;
  updateMyProfile: (data: UpdateProviderProfileRequestBody) => Promise<ProviderProfileResponse>;
  deleteMyProfile: () => Promise<ApiResponse>;
  toggleMyAvailability: () => Promise<ApiResponse>;
  addMyServiceOffering: (data: AddServiceOfferingData) => Promise<ApiResponse>;
  removeMyServiceOffering: (serviceId: string) => Promise<ApiResponse>;
  updateMyWorkingHours: (data: UpdateWorkingHoursData) => Promise<ApiResponse>;
  getPublicProfile: (id: string) => Promise<ApiResponse<Partial<ProviderProfile>>>;
  getPublicProfiles: (params?: PublicProviderProfileQueryParams) => Promise<ApiResponse<PaginatedResponse<Partial<ProviderProfile>>>>;
  searchPublicProviders: (params?: LocationSearchParams) => Promise<ApiResponse<Partial<ProviderProfile>[]>>;
  getProviderStatistics: () => Promise<ProviderStatisticsResponse>;
  getMyRiskScore: () => Promise<RiskScoreResponse>;
  getMyRiskAssessmentHistory: () => Promise<ApiResponse>;
  updateOperationalStatus: (id: string, data: UpdateOperationalStatusData) => Promise<ApiResponse>;
  updatePerformanceMetrics: (id: string, data: UpdatePerformanceMetricsData) => Promise<ApiResponse>;
  updateRiskAssessment: (id: string, data: UpdateRiskAssessmentData) => Promise<ApiResponse>;
  addPenalty: (id: string) => Promise<ApiResponse>;
  scheduleNextAssessment: (id: string, data: ScheduleAssessmentData) => Promise<ApiResponse>;
  bulkUpdateRiskAssessments: (data: BulkUpdateRiskAssessmentsData) => Promise<ApiResponse>;
  getAvailableProviders: (serviceRadius?: number) => Promise<ApiResponse<ProviderProfile[]>>;
  getTopRatedProviders: (limit?: number) => Promise<ApiResponse<ProviderProfile[]>>;
  getHighRiskProviders: () => Promise<ApiResponse<ProviderProfile[]>>;
  getProvidersByStatus: (status: ProviderOperationalStatus) => Promise<ApiResponse<ProviderProfile[]>>;
  getProvidersByRiskLevel: (riskLevel: RiskLevel) => Promise<ApiResponse<ProviderProfile[]>>;
  getOverdueRiskAssessments: () => Promise<ApiResponse<ProviderProfile[]>>;
  healthCheck: () => Promise<ApiResponse<{ timestamp: string }>>;
  clearError: () => void;
  clearSuccess: () => void;
  reset: () => void;
  retry: () => Promise<void>;
}

interface UseProviderProfileOptions {
  autoLoad?: boolean;
  enableRetry?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

export const useProviderProfile = (options: UseProviderProfileOptions = {}): UseProviderProfileReturn => {
  const {
    autoLoad = false,
    enableRetry = true,
    retryAttempts = 3,
    retryDelay = 1000,
  } = options;

  const [state, setState] = useState<UseProviderProfileState>({
    loading: false,
    error: null,
    success: false,
    lastAction: null,
  });

  const [lastFailedAction, setLastFailedAction] = useState<(() => Promise<unknown>) | null>(null);

  const updateState = useCallback((updates: Partial<UseProviderProfileState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleApiCall = useCallback(
    async <T>(
      apiCall: () => Promise<T>,
      options?: {
        showSuccess?: boolean;
        successMessage?: string;
        actionName?: string;
        enableRetry?: boolean;
      },
    ): Promise<T> => {
      const {
        showSuccess = true,
        actionName = 'API call',
        enableRetry: localEnableRetry = enableRetry,
      } = options || {};

      updateState({
        loading: true,
        error: null,
        success: false,
        lastAction: actionName,
      });

      let attempts = 0;
      const maxAttempts = localEnableRetry ? retryAttempts : 1;

      while (attempts < maxAttempts) {
        try {
          const result = await apiCall();

          updateState({
            loading: false,
            success: showSuccess,
            lastAction: actionName,
          });

          setLastFailedAction(null);

          return result;
        } catch (error) {
          attempts++;

          if (attempts >= maxAttempts) {
            const errorMessage =
              error instanceof ProviderProfileAPIError ? error.message : 'An unexpected error occurred';

            updateState({
              loading: false,
              error: errorMessage,
              success: false,
              lastAction: actionName,
            });

            if (localEnableRetry) {
              setLastFailedAction(() => () => handleApiCall(apiCall, options));
            }

            throw error;
          } else {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }

      throw new Error('Max retry attempts reached');
    },
    [updateState, enableRetry, retryAttempts, retryDelay],
  );

  const createProfile = useCallback(
    async (data: CreateProviderProfileRequestBody): Promise<ProviderProfileResponse> => {
      return handleApiCall(
        () => providerProfileAPI.createProviderProfile(data),
        {
          showSuccess: true,
          actionName: 'Create provider profile',
        },
      );
    },
    [handleApiCall],
  );

  const getMyProfile = useCallback(
    async (): Promise<ProviderProfileResponse> => {
      return handleApiCall(
        () => providerProfileAPI.getMyProviderProfile(),
        {
          showSuccess: false,
          actionName: 'Fetch my profile',
        },
      );
    },
    [handleApiCall],
  );

  const updateMyProfile = useCallback(
    async (data: UpdateProviderProfileRequestBody): Promise<ProviderProfileResponse> => {
      return handleApiCall(
        () => providerProfileAPI.updateMyProviderProfile(data),
        {
          showSuccess: true,
          actionName: 'Update profile',
        },
      );
    },
    [handleApiCall],
  );

  const deleteMyProfile = useCallback(
    async (): Promise<ApiResponse> => {
      return handleApiCall(
        async () => {
          const profile = await providerProfileAPI.getMyProviderProfile();
          if (profile.providerProfile?._id) {
            return providerProfileAPI.deleteProviderProfile(profile.providerProfile._id.toString());
          }
          throw new Error('No provider profile found to delete');
        },
        {
          showSuccess: true,
          actionName: 'Delete profile',
        },
      );
    },
    [handleApiCall],
  );

  const toggleMyAvailability = useCallback(
    async (): Promise<ApiResponse> => {
      return handleApiCall(
        () => providerProfileAPI.toggleMyAvailability(),
        {
          showSuccess: true,
          actionName: 'Toggle availability',
        },
      );
    },
    [handleApiCall],
  );

  const addMyServiceOffering = useCallback(
    async (data: AddServiceOfferingData): Promise<ApiResponse> => {
      return handleApiCall(
        () => providerProfileAPI.addMyServiceOffering(data),
        {
          showSuccess: true,
          actionName: 'Add service offering',
        },
      );
    },
    [handleApiCall],
  );

  const removeMyServiceOffering = useCallback(
    async (serviceId: string): Promise<ApiResponse> => {
      return handleApiCall(
        () => providerProfileAPI.removeMyServiceOffering(serviceId),
        {
          showSuccess: true,
          actionName: 'Remove service offering',
        },
      );
    },
    [handleApiCall],
  );

  const updateMyWorkingHours = useCallback(
    async (data: UpdateWorkingHoursData): Promise<ApiResponse> => {
      return handleApiCall(
        () => providerProfileAPI.updateMyWorkingHours(data),
        {
          showSuccess: true,
          actionName: 'Update working hours',
        },
      );
    },
    [handleApiCall],
  );

  const getPublicProfile = useCallback(
    async (id: string): Promise<ApiResponse<Partial<ProviderProfile>>> => {
      return handleApiCall(
        () => providerProfileAPI.getPublicProviderProfile(id),
        {
          showSuccess: false,
          actionName: 'Fetch public profile',
        },
      );
    },
    [handleApiCall],
  );

  const getPublicProfiles = useCallback(
    async (
      params?: PublicProviderProfileQueryParams,
    ): Promise<ApiResponse<PaginatedResponse<Partial<ProviderProfile>>>> => {
      return handleApiCall(
        () => providerProfileAPI.getPublicProviderProfiles(params),
        {
          showSuccess: false,
          actionName: 'Fetch public profiles',
        },
      );
    },
    [handleApiCall],
  );

  const searchPublicProviders = useCallback(
    async (params?: LocationSearchParams): Promise<ApiResponse<Partial<ProviderProfile>[]>> => {
      return handleApiCall(
        () => providerProfileAPI.searchPublicProviders(params),
        {
          showSuccess: false,
          actionName: 'Search providers',
        },
      );
    },
    [handleApiCall],
  );

  const getProviderStatistics = useCallback(
    async (): Promise<ProviderStatisticsResponse> => {
      return handleApiCall(
        () => providerProfileAPI.getProviderStatistics(),
        {
          showSuccess: false,
          actionName: 'Fetch provider statistics',
        },
      );
    },
    [handleApiCall],
  );

  const getMyRiskScore = useCallback(
    async (): Promise<RiskScoreResponse> => {
      return handleApiCall(
        async () => {
          const profile = await providerProfileAPI.getMyProviderProfile();
          if (profile.providerProfile?._id) {
            return providerProfileAPI.getProviderRiskScore(profile.providerProfile._id.toString());
          }
          throw new Error('No provider profile found');
        },
        {
          showSuccess: false,
          actionName: 'Fetch my risk score',
        },
      );
    },
    [handleApiCall],
  );

  const getMyRiskAssessmentHistory = useCallback(
    async (): Promise<ApiResponse> => {
      return handleApiCall(
        async () => {
          const profile = await providerProfileAPI.getMyProviderProfile();
          if (profile.providerProfile?._id) {
            return providerProfileAPI.getRiskAssessmentHistory(profile.providerProfile._id.toString());
          }
          throw new Error('No provider profile found');
        },
        {
          showSuccess: false,
          actionName: 'Fetch risk assessment history',
        },
      );
    },
    [handleApiCall],
  );

  const updateOperationalStatus = useCallback(
    async (id: string, data: UpdateOperationalStatusData): Promise<ApiResponse> => {
      return handleApiCall(
        () => providerProfileAPI.updateOperationalStatus(id, data),
        {
          showSuccess: true,
          actionName: 'Update operational status',
        },
      );
    },
    [handleApiCall],
  );

  const updatePerformanceMetrics = useCallback(
    async (id: string, data: UpdatePerformanceMetricsData): Promise<ApiResponse> => {
      return handleApiCall(
        () => providerProfileAPI.updatePerformanceMetrics(id, data),
        {
          showSuccess: true,
          actionName: 'Update performance metrics',
        },
      );
    },
    [handleApiCall],
  );

  const updateRiskAssessment = useCallback(
    async (id: string, data: UpdateRiskAssessmentData): Promise<ApiResponse> => {
      return handleApiCall(
        () => providerProfileAPI.updateRiskAssessment(id, data),
        {
          showSuccess: true,
          actionName: 'Update risk assessment',
        },
      );
    },
    [handleApiCall],
  );

  const addPenalty = useCallback(
    async (id: string): Promise<ApiResponse> => {
      return handleApiCall(
        () => providerProfileAPI.addPenalty(id),
        {
          showSuccess: true,
          actionName: 'Add penalty',
        },
      );
    },
    [handleApiCall],
  );

  const scheduleNextAssessment = useCallback(
    async (id: string, data: ScheduleAssessmentData): Promise<ApiResponse> => {
      return handleApiCall(
        () => providerProfileAPI.scheduleNextAssessment(id, data),
        {
          showSuccess: true,
          actionName: 'Schedule next assessment',
        },
      );
    },
    [handleApiCall],
  );

  const bulkUpdateRiskAssessments = useCallback(
    async (data: BulkUpdateRiskAssessmentsData): Promise<ApiResponse> => {
      return handleApiCall(
        () => providerProfileAPI.bulkUpdateRiskAssessments(data),
        {
          showSuccess: true,
          actionName: 'Bulk update risk assessments',
        },
      );
    },
    [handleApiCall],
  );

  const getAvailableProviders = useCallback(
    async (serviceRadius?: number): Promise<ApiResponse<ProviderProfile[]>> => {
      return handleApiCall(
        () => providerProfileAPI.getAvailableProviders(serviceRadius),
        {
          showSuccess: false,
          actionName: 'Fetch available providers',
        },
      );
    },
    [handleApiCall],
  );

  const getTopRatedProviders = useCallback(
    async (limit?: number): Promise<ApiResponse<ProviderProfile[]>> => {
      return handleApiCall(
        () => providerProfileAPI.getTopRatedProviders(limit),
        {
          showSuccess: false,
          actionName: 'Fetch top-rated providers',
        },
      );
    },
    [handleApiCall],
  );

  const getHighRiskProviders = useCallback(
    async (): Promise<ApiResponse<ProviderProfile[]>> => {
      return handleApiCall(
        () => providerProfileAPI.getHighRiskProviders(),
        {
          showSuccess: false,
          actionName: 'Fetch high-risk providers',
        },
      );
    },
    [handleApiCall],
  );

  const getProvidersByStatus = useCallback(
    async (status: ProviderOperationalStatus): Promise<ApiResponse<ProviderProfile[]>> => {
      return handleApiCall(
        () => providerProfileAPI.getProvidersByStatus(status),
        {
          showSuccess: false,
          actionName: 'Fetch providers by status',
        },
      );
    },
    [handleApiCall],
  );

  const getProvidersByRiskLevel = useCallback(
    async (riskLevel: RiskLevel): Promise<ApiResponse<ProviderProfile[]>> => {
      return handleApiCall(
        () => providerProfileAPI.getProvidersByRiskLevel(riskLevel),
        {
          showSuccess: false,
          actionName: 'Fetch providers by risk level',
        },
      );
    },
    [handleApiCall],
  );

  const getOverdueRiskAssessments = useCallback(
    async (): Promise<ApiResponse<ProviderProfile[]>> => {
      return handleApiCall(
        () => providerProfileAPI.getOverdueRiskAssessments(),
        {
          showSuccess: false,
          actionName: 'Fetch overdue risk assessments',
        },
      );
    },
    [handleApiCall],
  );

  const healthCheck = useCallback(
    async (): Promise<ApiResponse<{ timestamp: string }>> => {
      return handleApiCall(
        () => providerProfileAPI.healthCheck(),
        {
          showSuccess: false,
          actionName: 'Health check',
        },
      );
    },
    [handleApiCall],
  );

  const clearError = useCallback(() => {
    updateState({ error: null });
    setLastFailedAction(null);
  }, [updateState]);

  const clearSuccess = useCallback(() => {
    updateState({ success: false });
  }, [updateState]);

  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      success: false,
      lastAction: null,
    });
    setLastFailedAction(null);
  }, []);

  const retry = useCallback(async (): Promise<void> => {
    if (lastFailedAction) {
      try {
        await lastFailedAction();
      } catch (error) {
        console.warn('Retry failed:', error);
      }
    }
  }, [lastFailedAction]);

  useEffect(() => {
    if (autoLoad) {
      getMyProfile().catch(error => {
        console.warn('Auto-load profile failed:', error);
      });
    }
  }, [autoLoad, getMyProfile]);

  return {
    loading: state.loading,
    error: state.error,
    success: state.success,
    lastAction: state.lastAction,
    createProfile,
    getMyProfile,
    updateMyProfile,
    deleteMyProfile,
    toggleMyAvailability,
    addMyServiceOffering,
    removeMyServiceOffering,
    updateMyWorkingHours,
    getPublicProfile,
    getPublicProfiles,
    searchPublicProviders,
    getProviderStatistics,
    getMyRiskScore,
    getMyRiskAssessmentHistory,
    updateOperationalStatus,
    updatePerformanceMetrics,
    updateRiskAssessment,
    addPenalty,
    scheduleNextAssessment,
    bulkUpdateRiskAssessments,
    getAvailableProviders,
    getTopRatedProviders,
    getHighRiskProviders,
    getProvidersByStatus,
    getProvidersByRiskLevel,
    getOverdueRiskAssessments,
    healthCheck,
    clearError,
    clearSuccess,
    reset,
    retry,
  };
};

interface UseMyProviderProfileState {
  profile: ProviderProfile | null;
  profileLoading: boolean;
  initialized: boolean;
}

interface UseMyProviderProfileReturn extends UseMyProviderProfileState {
  loading: boolean;
  error: string | null;
  success: boolean;
  lastAction: string | null;
  loadProfile: () => Promise<void>;
  updateProfile: (data: UpdateProviderProfileRequestBody) => Promise<ProviderProfileResponse>;
  toggleAvailability: () => Promise<ApiResponse>;
  addServiceOffering: (data: AddServiceOfferingData) => Promise<ApiResponse>;
  removeServiceOffering: (serviceId: string) => Promise<ApiResponse>;
  updateWorkingHours: (data: UpdateWorkingHoursData) => Promise<ApiResponse>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
  clearSuccess: () => void;
  setProfile: (profile: ProviderProfile | null) => void;
  resetProfile: () => void;
  isAvailable: boolean;
  hasServiceOfferings: boolean;
  serviceOfferingsCount: number;
  hasWorkingHours: boolean;
}

export const useMyProviderProfile = (options?: {
  autoLoad?: boolean;
}): UseMyProviderProfileReturn => {
  const { autoLoad = true } = options || {};

  const [localState, setLocalState] = useState<UseMyProviderProfileState>({
    profile: null,
    profileLoading: false,
    initialized: false,
  });

  const {
    loading,
    error,
    success,
    lastAction,
    getMyProfile,
    updateMyProfile,
    toggleMyAvailability,
    addMyServiceOffering,
    removeMyServiceOffering,
    updateMyWorkingHours,
    clearError,
    clearSuccess,
  } = useProviderProfile({ autoLoad: false });

  const updateLocalState = useCallback((updates: Partial<UseMyProviderProfileState>) => {
    setLocalState(prev => ({ ...prev, ...updates }));
  }, []);

  const loadProfile = useCallback(async () => {
    if (loading || localState.profileLoading) return; // Prevent duplicate calls
    
    updateLocalState({ profileLoading: true });
    try {
      console.log('Loading profile...'); // Debug log
      const response = await getMyProfile();
      console.log('API Response:', response); // Debug log
      
      if (response && response.providerProfile) {
        console.log('Setting profile:', response.providerProfile); // Debug log
        updateLocalState({
          profile: response.providerProfile as ProviderProfile,
          initialized: true,
        });
      } else {
        console.log('No provider profile in response'); // Debug log
        updateLocalState({ 
          profile: null,
          initialized: true 
        });
      }
    } catch (error) {
      console.error('Failed to load provider profile:', error);
      updateLocalState({ 
        profile: null,
        initialized: true 
      });
    } finally {
      updateLocalState({ profileLoading: false });
    }
  }, [getMyProfile, updateLocalState, loading, localState.profileLoading]);

  const updateProfile = useCallback(
    async (data: UpdateProviderProfileRequestBody) => {
      const response = await updateMyProfile(data);
      if (response.providerProfile && success) {
        updateLocalState({
          profile: {
            ...localState.profile,
            ...response.providerProfile,
          } as ProviderProfile,
        });
      }
      return response;
    },
    [updateMyProfile, success, localState.profile, updateLocalState],
  );

  const toggleAvailability = useCallback(
    async () => {
      const response = await toggleMyAvailability();
      if (success && localState.profile) {
        updateLocalState({
          profile: {
            ...localState.profile,
            isAvailableForWork: !localState.profile.isAvailableForWork,
          } as ProviderProfile,
        });
      }
      return response;
    },
    [toggleMyAvailability, success, localState.profile, updateLocalState],
  );

  const addServiceOffering = useCallback(
    async (data: AddServiceOfferingData) => {
      const response = await addMyServiceOffering(data);
      if (success && localState.profile) {
        updateLocalState({
          profile: {
            ...localState.profile,
            serviceOfferings: [
  ...(localState?.profile?.serviceOfferings ?? []),
  new Types.ObjectId(data.serviceId),
],

          } as ProviderProfile,
        });
      }
      return response;
    },
    [addMyServiceOffering, success, localState.profile, updateLocalState],
  );

  const removeServiceOffering = useCallback(
    async (serviceId: string) => {
      const response = await removeMyServiceOffering(serviceId);
      if (success && localState.profile) {
        updateLocalState({
          profile: {
            ...localState.profile,
            serviceOfferings: localState?.profile?.serviceOfferings?.filter(
              id => id.toString() !== serviceId,
            ),
          } as ProviderProfile,
        });
      }
      return response;
    },
    [removeMyServiceOffering, success, localState.profile, updateLocalState],
  );

  const updateWorkingHours = useCallback(
    async (data: UpdateWorkingHoursData) => {
      const response = await updateMyWorkingHours(data);
      if (success && localState.profile) {
        updateLocalState({
          profile: {
            ...localState.profile,
            workingHours: {
              ...(localState.profile.workingHours || {}),
              [data.day]: data.hours,
            },
          } as ProviderProfile,
        });
      }
      return response;
    },
    [updateMyWorkingHours, success, localState.profile, updateLocalState],
  );

  const refreshProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  const setProfile = useCallback(
    (profile: ProviderProfile | null) => {
      updateLocalState({ profile });
    },
    [updateLocalState],
  );

  const resetProfile = useCallback(() => {
    setLocalState({
      profile: null,
      profileLoading: false,
      initialized: false,
    });
  }, []);

  const isAvailable = useMemo(() => {
    return localState.profile?.isAvailableForWork ?? false;
  }, [localState.profile]);

  const hasServiceOfferings = useMemo(() => {
    return (localState.profile?.serviceOfferings?.length ?? 0) > 0;
  }, [localState.profile]);

  const serviceOfferingsCount = useMemo(() => {
    return localState.profile?.serviceOfferings?.length ?? 0;
  }, [localState.profile]);

  const hasWorkingHours = useMemo(() => {
    const workingHours = localState.profile?.workingHours;
    return !!workingHours && Object.keys(workingHours).length > 0;
  }, [localState.profile]);

  // Only run autoLoad once when component mounts
  useEffect(() => {
    if (autoLoad && !localState.initialized && !localState.profileLoading) {
      loadProfile();
    }
  }, [autoLoad, loadProfile, localState.initialized, localState.profileLoading]); // Removed dependencies that could cause infinite loops

  return {
    profile: localState.profile,
    profileLoading: localState.profileLoading,
    initialized: localState.initialized,
    loading,
    error,
    success,
    lastAction,
    loadProfile,
    updateProfile,
    toggleAvailability,
    addServiceOffering,
    removeServiceOffering,
    updateWorkingHours,
    refreshProfile,
    clearError,
    clearSuccess,
    setProfile,
    resetProfile,
    isAvailable,
    hasServiceOfferings,
    serviceOfferingsCount,
    hasWorkingHours,
  };
};