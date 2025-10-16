// hooks/useClientProfile.ts - User Level Hook
import { clientProfileAPI } from '@/lib/api/clientProfiles/clientProfile.api';
import { ClientProfile, CreateClientProfileRequest, UpdateClientProfileRequest } from '@/types';
import { useState, useEffect, useCallback } from 'react';

interface UseClientProfileState {
  profile: ClientProfile | null;
  loading: boolean;
  error: string | null;
  isCreating: boolean;
  isUpdating: boolean;
}

interface UseClientProfileActions {
  fetchMyProfile: () => Promise<void>;
  createProfile: (data: CreateClientProfileRequest) => Promise<void>;
  updateProfile: (data: UpdateClientProfileRequest) => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

type UseClientProfileReturn = UseClientProfileState & UseClientProfileActions;

export const useClientProfile = (
  autoFetch: boolean = true
): UseClientProfileReturn => {
  const [state, setState] = useState<UseClientProfileState>({
    profile: null,
    loading: false,
    error: null,
    isCreating: false,
    isUpdating: false,
  });

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    setState({
      profile: null,
      loading: false,
      error: null,
      isCreating: false,
      isUpdating: false,
    });
  }, []);

  const fetchMyProfile = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await clientProfileAPI.getMyClientProfile();
      setState((prev) => ({
        ...prev,
        profile: response.clientProfile || null,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch profile',
        loading: false,
      }));
    }
  }, []);

  const createProfile = useCallback(
    async (data: CreateClientProfileRequest) => {
      setState((prev) => ({ ...prev, isCreating: true, error: null }));
      try {
        const response = await clientProfileAPI.createClientProfile(data);
        setState((prev) => ({
          ...prev,
          profile: response.clientProfile || null,
          isCreating: false,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to create profile',
          isCreating: false,
        }));
        throw error;
      }
    },
    []
  );

  const updateProfile = useCallback(
    async (data: UpdateClientProfileRequest) => {
      setState((prev) => ({ ...prev, isUpdating: true, error: null }));
      try {
        const response = await clientProfileAPI.updateMyClientProfile(data);
        setState((prev) => ({
          ...prev,
          profile: response.clientProfile || null,
          isUpdating: false,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to update profile',
          isUpdating: false,
        }));
        throw error;
      }
    },
    []
  );

  const refreshProfile = useCallback(async () => {
    await fetchMyProfile();
  }, [fetchMyProfile]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchMyProfile();
    }
  }, [autoFetch, fetchMyProfile]);

  return {
    ...state,
    fetchMyProfile,
    createProfile,
    updateProfile,
    refreshProfile,
    clearError,
    reset,
  };
};

