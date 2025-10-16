
// hooks/useAdminClientProfiles.ts - Admin Level Hook
import { clientProfileAPI } from '@/lib/api/clientProfiles/clientProfile.api';
import { ClientProfile, PaginationParams, UpdateClientProfileRequest } from '@/types';
import { useState, useCallback } from 'react';

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface UseAdminClientProfilesState {
  profiles: ClientProfile[];
  highRiskProfiles: ClientProfile[];
  selectedProfile: ClientProfile | null;
  pagination: PaginationData | null;
  loading: boolean;
  error: string | null;
  isUpdating: boolean;
  isDeleting: boolean;
}

interface UseAdminClientProfilesActions {
  fetchAllProfiles: (params?: PaginationParams) => Promise<void>;
  fetchProfileById: (id: string) => Promise<void>;
  fetchProfileByProfileId: (profileId: string) => Promise<void>;
  updateProfile: (id: string, data: UpdateClientProfileRequest) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  updateTrustScore: (id: string, trustScore: number) => Promise<void>;
  addPreferredService: (id: string, serviceId: string) => Promise<void>;
  removePreferredService: (id: string, serviceId: string) => Promise<void>;
  addPreferredProvider: (id: string, providerId: string) => Promise<void>;
  removePreferredProvider: (id: string, providerId: string) => Promise<void>;
  fetchHighRiskClients: (params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => Promise<void>;
  clearError: () => void;
  clearSelectedProfile: () => void;
}

type UseAdminClientProfilesReturn = UseAdminClientProfilesState &
  UseAdminClientProfilesActions;

/**
 * Admin-level hook for managing all client profiles
 * Provides full CRUD operations, filtering, pagination, and risk management
 */
export const useAdminClientProfiles = (): UseAdminClientProfilesReturn => {
  const [state, setState] = useState<UseAdminClientProfilesState>({
    profiles: [],
    highRiskProfiles: [],
    selectedProfile: null,
    pagination: null,
    loading: false,
    error: null,
    isUpdating: false,
    isDeleting: false,
  });

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const clearSelectedProfile = useCallback(() => {
    setState((prev) => ({ ...prev, selectedProfile: null }));
  }, []);

  const fetchAllProfiles = useCallback(async (params?: PaginationParams) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await clientProfileAPI.getAllClientProfiles(params);
      setState((prev) => ({
        ...prev,
        profiles: response.data.profiles,
        pagination: response.data.pagination,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : 'Failed to fetch profiles',
        loading: false,
      }));
    }
  }, []);

  const fetchProfileById = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await clientProfileAPI.getClientProfileById(id);
      setState((prev) => ({
        ...prev,
        selectedProfile: response.clientProfile || null,
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

  const fetchProfileByProfileId = useCallback(async (profileId: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await clientProfileAPI.getClientProfileByProfileId(
        profileId
      );
      setState((prev) => ({
        ...prev,
        selectedProfile: response.clientProfile || null,
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

  const updateProfile = useCallback(
    async (id: string, data: UpdateClientProfileRequest) => {
      setState((prev) => ({ ...prev, isUpdating: true, error: null }));
      try {
        const response = await clientProfileAPI.updateClientProfile(id, data);
        setState((prev) => ({
          ...prev,
          selectedProfile: response.clientProfile || prev.selectedProfile,
          profiles: prev.profiles.map((p) =>
            p._id === id ? response.clientProfile || p : p
          ),
          isUpdating: false,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error ? error.message : 'Failed to update profile',
          isUpdating: false,
        }));
        throw error;
      }
    },
    []
  );

  const deleteProfile = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isDeleting: true, error: null }));
    try {
      await clientProfileAPI.deleteClientProfile(id);
      setState((prev) => ({
        ...prev,
        profiles: prev.profiles.filter((p) => p._id !== id),
        selectedProfile:
          prev.selectedProfile?._id === id ? null : prev.selectedProfile,
        isDeleting: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : 'Failed to delete profile',
        isDeleting: false,
      }));
      throw error;
    }
  }, []);

  const updateTrustScore = useCallback(
    async (id: string, trustScore: number) => {
      setState((prev) => ({ ...prev, isUpdating: true, error: null }));
      try {
        const response = await clientProfileAPI.updateTrustScore(id, {
          trustScore,
        });
        setState((prev) => ({
          ...prev,
          selectedProfile: response.clientProfile || prev.selectedProfile,
          profiles: prev.profiles.map((p) =>
            p._id === id ? response.clientProfile || p : p
          ),
          isUpdating: false,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to update trust score',
          isUpdating: false,
        }));
        throw error;
      }
    },
    []
  );

  const addPreferredService = useCallback(
    async (id: string, serviceId: string) => {
      setState((prev) => ({ ...prev, isUpdating: true, error: null }));
      try {
        const response = await clientProfileAPI.addPreferredService(id, {
          serviceId,
        });
        setState((prev) => ({
          ...prev,
          selectedProfile: response.clientProfile || prev.selectedProfile,
          profiles: prev.profiles.map((p) =>
            p._id === id ? response.clientProfile || p : p
          ),
          isUpdating: false,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to add preferred service',
          isUpdating: false,
        }));
        throw error;
      }
    },
    []
  );

  const removePreferredService = useCallback(
    async (id: string, serviceId: string) => {
      setState((prev) => ({ ...prev, isUpdating: true, error: null }));
      try {
        const response = await clientProfileAPI.removePreferredService(
          id,
          serviceId
        );
        setState((prev) => ({
          ...prev,
          selectedProfile: response.clientProfile || prev.selectedProfile,
          profiles: prev.profiles.map((p) =>
            p._id === id ? response.clientProfile || p : p
          ),
          isUpdating: false,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to remove preferred service',
          isUpdating: false,
        }));
        throw error;
      }
    },
    []
  );

  const addPreferredProvider = useCallback(
    async (id: string, providerId: string) => {
      setState((prev) => ({ ...prev, isUpdating: true, error: null }));
      try {
        const response = await clientProfileAPI.addPreferredProvider(id, {
          providerId,
        });
        setState((prev) => ({
          ...prev,
          selectedProfile: response.clientProfile || prev.selectedProfile,
          profiles: prev.profiles.map((p) =>
            p._id === id ? response.clientProfile || p : p
          ),
          isUpdating: false,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to add preferred provider',
          isUpdating: false,
        }));
        throw error;
      }
    },
    []
  );

  const removePreferredProvider = useCallback(
    async (id: string, providerId: string) => {
      setState((prev) => ({ ...prev, isUpdating: true, error: null }));
      try {
        const response = await clientProfileAPI.removePreferredProvider(
          id,
          providerId
        );
        setState((prev) => ({
          ...prev,
          selectedProfile: response.clientProfile || prev.selectedProfile,
          profiles: prev.profiles.map((p) =>
            p._id === id ? response.clientProfile || p : p
          ),
          isUpdating: false,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to remove preferred provider',
          isUpdating: false,
        }));
        throw error;
      }
    },
    []
  );

  const fetchHighRiskClients = useCallback(
    async (params?: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const response = await clientProfileAPI.getHighRiskClients(params);
        setState((prev) => ({
          ...prev,
          highRiskProfiles: response.data.profiles,
          pagination: response.data.pagination,
          loading: false,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to fetch high-risk clients',
          loading: false,
        }));
      }
    },
    []
  );

  return {
    ...state,
    fetchAllProfiles,
    fetchProfileById,
    fetchProfileByProfileId,
    updateProfile,
    deleteProfile,
    updateTrustScore,
    addPreferredService,
    removePreferredService,
    addPreferredProvider,
    removePreferredProvider,
    fetchHighRiskClients,
    clearError,
    clearSelectedProfile,
  };
};