// hooks/usePublicClientProfile.ts - Public Level Hook
import { clientProfileAPI, ClientStatsResponse } from '@/lib/api/clientProfiles/clientProfile.api';
import { ClientProfile } from '@/types';
import { useState, useEffect, useCallback } from 'react';

interface UsePublicClientProfileState {
  profile: Partial<ClientProfile> | null;
  stats: ClientStatsResponse | null;
  loading: boolean;
  error: string | null;
}

interface UsePublicClientProfileActions {
  fetchPublicProfile: (id: string) => Promise<void>;
  fetchPublicProfileByProfileId: (profileId: string) => Promise<void>;
  fetchPublicStats: (id: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

type UsePublicClientProfileReturn = UsePublicClientProfileState &
  UsePublicClientProfileActions;

export const usePublicClientProfile = (
  clientId?: string,
  autoFetch: boolean = false
): UsePublicClientProfileReturn => {
  const [state, setState] = useState<UsePublicClientProfileState>({
    profile: null,
    stats: null,
    loading: false,
    error: null,
  });

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    setState({
      profile: null,
      stats: null,
      loading: false,
      error: null,
    });
  }, []);

  const fetchPublicProfile = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await clientProfileAPI.getPublicClientProfile(id);
      setState((prev) => ({
        ...prev,
        profile: response.data || null,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : 'Failed to fetch public profile',
        loading: false,
      }));
    }
  }, []);

  const fetchPublicProfileByProfileId = useCallback(async (profileId: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await clientProfileAPI.getPublicClientProfileByProfileId(
        profileId
      );
      setState((prev) => ({
        ...prev,
        profile: response.data || null,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : 'Failed to fetch public profile',
        loading: false,
      }));
    }
  }, []);

  const fetchPublicStats = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await clientProfileAPI.getPublicClientStats(id);
      setState((prev) => ({
        ...prev,
        stats: response.data || null,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch client stats',
        loading: false,
      }));
    }
  }, []);

  // Auto-fetch on mount if enabled and clientId provided
  useEffect(() => {
    if (autoFetch && clientId) {
      fetchPublicProfile(clientId);
    }
  }, [autoFetch, clientId, fetchPublicProfile]);

  return {
    ...state,
    fetchPublicProfile,
    fetchPublicProfileByProfileId,
    fetchPublicStats,
    clearError,
    reset,
  };
};