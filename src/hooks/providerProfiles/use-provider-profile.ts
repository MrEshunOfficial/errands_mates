import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Types } from 'mongoose';
import {
  ProviderProfile,
  CreateProviderProfileRequestBody,
  UpdateProviderProfileRequestBody,
  ProviderProfileResponse,
} from '@/types/provider-profile.types';
import { PaginatedResponse } from '@/types/aggregated.types';
import {
  ApiResponse,
  AddServiceOfferingData,
  UpdateWorkingHoursData,
  PublicProviderProfileQueryParams,
  LocationSearchParams,
  ProviderProfileAPIError,
  providerProfileAPI,
  BulkUpdateRiskAssessmentsData,
  ProviderStatisticsResponse,
  RiskScoreResponse,
  ScheduleAssessmentData,
  UpdateOperationalStatusData,
  UpdatePerformanceMetricsData,
  UpdateRiskAssessmentData,
  ProviderProfileQueryParams,
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
  getAllProviderProfiles: (params?: ProviderProfileQueryParams) => Promise<ApiResponse<PaginatedResponse<ProviderProfile>>>;
  getAvailableProviders: (serviceRadius?: number) => Promise<ApiResponse<ProviderProfile[]>>;
  getTopRatedProviders: (limit?: number) => Promise<ApiResponse<ProviderProfile[]>>;
  getHighRiskProviders: () => Promise<ApiResponse<ProviderProfile[]>>;
  getProvidersByStatus: (status: ProviderOperationalStatus) => Promise<ApiResponse<ProviderProfile[]>>;
  getProvidersByRiskLevel: (riskLevel: RiskLevel) => Promise<ApiResponse<ProviderProfile[]>>;
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

  // ============================================================================
  // AUTHENTICATED USER METHODS
  // ============================================================================

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

  // ============================================================================
  // PUBLIC METHODS (No authentication required)
  // ============================================================================

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

  // ============================================================================
  // ADMIN METHODS
  // ============================================================================

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

  const getAllProviderProfiles = useCallback(
    async (params?: ProviderProfileQueryParams): Promise<ApiResponse<PaginatedResponse<ProviderProfile>>> => {
      return handleApiCall(
        () => providerProfileAPI.getAllProviderProfiles(params),
        {
          showSuccess: false,
          actionName: 'Fetch all provider profiles',
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
    getAllProviderProfiles,
    getAvailableProviders,
    getTopRatedProviders,
    getHighRiskProviders,
    getProvidersByStatus,
    getProvidersByRiskLevel,
    clearError,
    clearSuccess,
    reset,
    retry,
  };
};

// ============================================================================
// USE MY PROVIDER PROFILE HOOK
// ============================================================================

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
    if (loading || localState.profileLoading) return;
    
    updateLocalState({ profileLoading: true });
    try {
      const response = await getMyProfile();
      
      if (response && response.providerProfile) {
        updateLocalState({
          profile: response.providerProfile as ProviderProfile,
          initialized: true,
        });
      } else {
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
            isCurrentlyAvailable: !localState.profile.isCurrentlyAvailable,
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
    return localState.profile?.isCurrentlyAvailable ?? false;
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

  useEffect(() => {
    if (autoLoad && !localState.initialized && !localState.profileLoading) {
      loadProfile();
    }
  }, [autoLoad, loadProfile, localState.initialized, localState.profileLoading]);

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

// ============================================================================
// USE PUBLIC PROVIDER PROFILES HOOK
// ============================================================================

interface UsePublicProviderProfilesState {
  providers: Partial<ProviderProfile>[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

interface UsePublicProviderProfilesReturn extends UsePublicProviderProfilesState {
  loadProviders: (params?: PublicProviderProfileQueryParams) => Promise<void>;
  searchProviders: (params?: LocationSearchParams) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const usePublicProviderProfiles = (
  initialParams?: PublicProviderProfileQueryParams
): UsePublicProviderProfilesReturn => {
  const [state, setState] = useState<UsePublicProviderProfilesState>({
    providers: [],
    total: 0,
    page: 1,
    limit: initialParams?.limit || 12,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
    loading: false,
    error: null,
    initialized: false,
  });

  const [currentParams, setCurrentParams] = useState<PublicProviderProfileQueryParams | undefined>(initialParams);
  const hasLoadedRef = useRef(false);

  const updateState = useCallback((updates: Partial<UsePublicProviderProfilesState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const loadProviders = useCallback(async (params?: PublicProviderProfileQueryParams) => {
    updateState({ loading: true, error: null });
    
    try {
      const response = await providerProfileAPI.getPublicProviderProfiles(params);
      
      if (response.success && response.data) {
        updateState({
          providers: response.data.data || [],
          total: response.data.total || 0,
          page: response.data.page || 1,
          limit: response.data.limit || 12,
          totalPages: response.data.totalPages || 0,
          hasNext: response.data.hasNext || false,
          hasPrev: response.data.hasPrev || false,
          loading: false,
          initialized: true,
        });
        setCurrentParams(params);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      const errorMessage = error instanceof ProviderProfileAPIError 
        ? error.message 
        : 'Failed to load providers';
      
      updateState({
        loading: false,
        error: errorMessage,
        initialized: true,
      });
    }
  }, [updateState]);

  const searchProviders = useCallback(async (params?: LocationSearchParams) => {
    updateState({ loading: true, error: null });
    
    try {
      const response = await providerProfileAPI.searchPublicProviders(params);
      
      if (response.success && response.data) {
        updateState({
          providers: response.data,
          total: response.data.length,
          page: 1,
          limit: response.data.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
          loading: false,
          initialized: true,
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      const errorMessage = error instanceof ProviderProfileAPIError 
        ? error.message 
        : 'Failed to search providers';
      
      updateState({
        loading: false,
        error: errorMessage,
        initialized: true,
      });
    }
  }, [updateState]);

  const loadMore = useCallback(async () => {
    if (!state.hasNext || state.loading) return;

    const nextPage = state.page + 1;
    const params = { ...currentParams, page: nextPage, limit: state.limit };

    updateState({ loading: true, error: null });

    try {
      const response = await providerProfileAPI.getPublicProviderProfiles(params);
      
      if (response.success && response.data) {
        updateState({
          providers: [...state.providers, ...(response.data.data || [])],
          total: response.data.total || 0,
          page: response.data.page || nextPage,
          limit: response.data.limit || state.limit,
          totalPages: response.data.totalPages || 0,
          hasNext: response.data.hasNext || false,
          hasPrev: response.data.hasPrev || false,
          loading: false,
        });
        setCurrentParams(params);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      const errorMessage = error instanceof ProviderProfileAPIError 
        ? error.message 
        : 'Failed to load more providers';
      
      updateState({
        loading: false,
        error: errorMessage,
      });
    }
  }, [state.hasNext, state.loading, state.page, state.limit, state.providers, currentParams, updateState]);

  const goToPage = useCallback(async (page: number) => {
    if (page < 1 || page > state.totalPages || state.loading) return;

    const params = { ...currentParams, page, limit: state.limit };
    await loadProviders(params);
  }, [state.totalPages, state.loading, state.limit, currentParams, loadProviders]);

  const refresh = useCallback(async () => {
    await loadProviders(currentParams);
  }, [currentParams, loadProviders]);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const reset = useCallback(() => {
    setState({
      providers: [],
      total: 0,
      page: 1,
      limit: initialParams?.limit || 12,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
      loading: false,
      error: null,
      initialized: false,
    });
    setCurrentParams(initialParams);
  }, [initialParams]);

  // Auto-load on mount if initial params provided
  useEffect(() => {
    if (initialParams && !hasLoadedRef.current && !state.initialized && !state.loading) {
      hasLoadedRef.current = true;
      loadProviders(initialParams);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.initialized, state.loading]);

  return {
    providers: state.providers,
    total: state.total,
    page: state.page,
    limit: state.limit,
    totalPages: state.totalPages,
    hasNext: state.hasNext,
    hasPrev: state.hasPrev,
    loading: state.loading,
    error: state.error,
    initialized: state.initialized,
    loadProviders,
    searchProviders,
    loadMore,
    refresh,
    goToPage,
    clearError,
    reset,
  };
};

// ============================================================================
// USE SINGLE PUBLIC PROVIDER PROFILE HOOK
// ============================================================================

interface UseSinglePublicProviderProfileState {
  provider: Partial<ProviderProfile> | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

interface UseSinglePublicProviderProfileReturn extends UseSinglePublicProviderProfileState {
  loadProvider: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useSinglePublicProviderProfile = (
  providerId?: string
): UseSinglePublicProviderProfileReturn => {
  const [state, setState] = useState<UseSinglePublicProviderProfileState>({
    provider: null,
    loading: false,
    error: null,
    initialized: false,
  });

  const [currentProviderId, setCurrentProviderId] = useState<string | undefined>(providerId);

  const updateState = useCallback((updates: Partial<UseSinglePublicProviderProfileState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const loadProvider = useCallback(async (id: string) => {
    updateState({ loading: true, error: null });

    try {
      const response = await providerProfileAPI.getPublicProviderProfile(id);
      
      if (response.success && response.data) {
        updateState({
          provider: response.data,
          loading: false,
          initialized: true,
        });
        setCurrentProviderId(id);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      const errorMessage = error instanceof ProviderProfileAPIError 
        ? error.message 
        : 'Failed to load provider profile';
      
      updateState({
        loading: false,
        error: errorMessage,
        initialized: true,
      });
    }
  }, [updateState]);

  const refresh = useCallback(async () => {
    if (currentProviderId) {
      await loadProvider(currentProviderId);
    }
  }, [currentProviderId, loadProvider]);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const reset = useCallback(() => {
    setState({
      provider: null,
      loading: false,
      error: null,
      initialized: false,
    });
    setCurrentProviderId(undefined);
  }, []);

  // Auto-load on mount if providerId provided
  useEffect(() => {
    if (providerId && !state.initialized && !state.loading) {
      loadProvider(providerId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.initialized, state.loading]);

  return {
    provider: state.provider,
    loading: state.loading,
    error: state.error,
    initialized: state.initialized,
    loadProvider,
    refresh,
    clearError,
    reset,
  };
};

// ============================================================================
// USE PROVIDER SEARCH HOOK (Location-based search)
// ============================================================================

interface UseProviderSearchState {
  results: Partial<ProviderProfile>[];
  loading: boolean;
  error: string | null;
  lastSearchParams: LocationSearchParams | null;
  initialized: boolean;
}

interface UseProviderSearchReturn extends UseProviderSearchState {
  search: (params: LocationSearchParams) => Promise<void>;
  clearResults: () => void;
  clearError: () => void;
  reset: () => void;
}

export const useProviderSearch = (): UseProviderSearchReturn => {
  const [state, setState] = useState<UseProviderSearchState>({
    results: [],
    loading: false,
    error: null,
    lastSearchParams: null,
    initialized: false,
  });

  const updateState = useCallback((updates: Partial<UseProviderSearchState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const search = useCallback(async (params: LocationSearchParams) => {
    updateState({ loading: true, error: null });

    try {
      const response = await providerProfileAPI.searchPublicProviders(params);
      
      if (response.success && response.data) {
        updateState({
          results: response.data,
          loading: false,
          lastSearchParams: params,
          initialized: true,
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      const errorMessage = error instanceof ProviderProfileAPIError 
        ? error.message 
        : 'Search failed';
      
      updateState({
        loading: false,
        error: errorMessage,
        initialized: true,
      });
    }
  }, [updateState]);

  const clearResults = useCallback(() => {
    updateState({ results: [] });
  }, [updateState]);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const reset = useCallback(() => {
    setState({
      results: [],
      loading: false,
      error: null,
      lastSearchParams: null,
      initialized: false,
    });
  }, []);

  return {
    results: state.results,
    loading: state.loading,
    error: state.error,
    lastSearchParams: state.lastSearchParams,
    initialized: state.initialized,
    search,
    clearResults,
    clearError,
    reset,
  };
};