// hooks/useUserService.ts - User-focused service management hook

import { useState, useEffect, useCallback } from "react";
import type { Service } from "@/types/service.types";
import { ServiceStatus } from "@/types/base.types";
import type { AuthResponse } from "@/types/user.types";

import {
  ServiceAPIError,
  serviceAPI,
  type CreateServiceData,
  type UpdateServiceData,
  type ServiceSearchParams,
  type UserServiceSearchParams,
  type ServiceFetchOptions,
  type PaginatedServiceResponse,
  type UserServiceResponse,
  type ServiceResponse,
  type ServicesResponse,
  type ServiceImageUploadData,
  type ServiceImageResponse,
  type ServiceImagesResponse,
} from "@/lib/api/services/services.api";

interface UserServiceState {
  // Current service data
  currentService?: Service | null;

  // User collections
  userServices: Service[];
  popularServices: Service[];

  // User service summary
  userServicesSummary: {
    statusCounts: Record<string, number>;
    totalServices: number;
  } | null;

  // Public services with pagination
  services: Service[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null;

  // State flags
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  isInitialized: boolean;

  // Search state
  lastSearchParams: ServiceSearchParams | null;
}

interface UserServiceActions {
  // Core service management
  createService: (data: CreateServiceData) => Promise<Service>;
  getServiceById: (
    serviceId: string,
    options?: ServiceFetchOptions
  ) => Promise<Service>;
  getServiceBySlug: (slug: string) => Promise<Service>;
  updateService: (
    serviceId: string,
    data: UpdateServiceData
  ) => Promise<Service>;
  deleteService: (serviceId: string) => Promise<void>;

  // Service file management
  uploadServiceImages: (
    serviceId: string,
    data: ServiceImageUploadData
  ) => Promise<ServiceImageResponse>;
  getServiceImages: (serviceId: string) => Promise<ServiceImagesResponse>;
  deleteServiceImages: (serviceId: string) => Promise<ServiceImagesResponse>;

  // User service operations
  getUserServices: (
    params?: UserServiceSearchParams
  ) => Promise<UserServiceResponse>;
  refreshUserServices: () => Promise<void>;

  // User-specific status methods
  getUserServicesByStatus: (
    status: ServiceStatus,
    params?: Omit<UserServiceSearchParams, "status">
  ) => Promise<UserServiceResponse>;
  getUserDraftServices: (
    params?: UserServiceSearchParams
  ) => Promise<UserServiceResponse>;
  getUserPendingServices: (
    params?: UserServiceSearchParams
  ) => Promise<UserServiceResponse>;
  getUserApprovedServices: (
    params?: UserServiceSearchParams
  ) => Promise<UserServiceResponse>;
  getUserRejectedServices: (
    params?: UserServiceSearchParams
  ) => Promise<UserServiceResponse>;
  getUserDeletedServices: (
    params?: UserServiceSearchParams
  ) => Promise<UserServiceResponse>;

  // Public service listing operations
  getAllServices: (
    params?: ServiceSearchParams
  ) => Promise<PaginatedServiceResponse>;
  getPopularServices: (limit?: number) => Promise<Service[]>;
  getApprovedServices: (
    params?: ServiceSearchParams
  ) => Promise<PaginatedServiceResponse>;

  // Category and filtering operations
  getServicesByCategory: (
    categoryId: string,
    params?: Omit<ServiceSearchParams, "category">
  ) => Promise<PaginatedServiceResponse>;
  getServicesWithPricing: (
    params?: ServiceSearchParams
  ) => Promise<PaginatedServiceResponse>;
  getServicesByStatus: (
    status: ServiceStatus,
    params?: Omit<ServiceSearchParams, "status">
  ) => Promise<PaginatedServiceResponse>;
  getServicesInPriceRange: (
    minPrice: number,
    maxPrice: number,
    params?: Omit<ServiceSearchParams, "minPrice" | "maxPrice">
  ) => Promise<PaginatedServiceResponse>;
  getServicesWithFixedPricing: (
    params?: ServiceSearchParams
  ) => Promise<PaginatedServiceResponse>;
  getServicesWithServiceTypePricing: (
    params?: ServiceSearchParams
  ) => Promise<PaginatedServiceResponse>;

  // Sorting and filtering
  getServicesByTags: (
    tags: string[],
    params?: Omit<ServiceSearchParams, "tags">
  ) => Promise<PaginatedServiceResponse>;
  getRecentServices: (
    limit?: number,
    params?: ServiceSearchParams
  ) => Promise<PaginatedServiceResponse>;
  getServicesByPriceLowToHigh: (
    params?: ServiceSearchParams
  ) => Promise<PaginatedServiceResponse>;
  getServicesByPriceHighToLow: (
    params?: ServiceSearchParams
  ) => Promise<PaginatedServiceResponse>;
  getTopPopularServices: (limit?: number) => Promise<Service[]>;

  // Convenience methods
  getServiceWithFullDetails: (serviceId: string) => Promise<Service>;
  refreshPopularServices: () => Promise<void>;

  // State management
  setCurrentService: (service: Service | null) => void;
  clearServices: () => void;
  clearError: () => void;
  clearSearch: () => void;

  // Utility functions
  isServiceOwner: (service: Service, userId: string) => boolean;
  canEditService: (service: Service, userId: string) => boolean;
  getServiceStatusColor: (status: ServiceStatus) => string;
  getServiceStatusLabel: (status: ServiceStatus) => string;
}

const initialState: UserServiceState = {
  currentService: null,
  userServices: [],
  popularServices: [],
  services: [],
  userServicesSummary: null,
  pagination: null,
  isLoading: false,
  isSubmitting: false,
  error: null,
  isInitialized: false,
  lastSearchParams: null,
};

export const useUserService = (): UserServiceState & UserServiceActions => {
  const [state, setState] = useState<UserServiceState>(initialState);

  const updateState = useCallback((updates: Partial<UserServiceState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleServiceAction = useCallback(
    async <T = AuthResponse>(
      action: () => Promise<T>,
      options?: {
        onSuccess?: (response: T) => void;
        updateCurrentService?: boolean;
        showLoading?: boolean;
        showSubmitting?: boolean;
      }
    ): Promise<T> => {
      const {
        onSuccess,
        updateCurrentService = false,
        showLoading = true,
        showSubmitting = false,
      } = options || {};

      try {
        if (showLoading) {
          updateState({ isLoading: true, error: null });
        } else if (showSubmitting) {
          updateState({ isSubmitting: true, error: null });
        } else {
          updateState({ error: null });
        }

        const response = await action();

        // Update current service if response contains service data
        if (
          updateCurrentService &&
          response &&
          typeof response === "object" &&
          "data" in response
        ) {
          const serviceResponse = response as unknown as ServiceResponse;
          if (serviceResponse.data) {
            updateState({
              currentService: serviceResponse.data,
              isLoading: false,
              isSubmitting: false,
            });
          } else {
            updateState({
              isLoading: false,
              isSubmitting: false,
            });
          }
        } else {
          updateState({
            isLoading: false,
            isSubmitting: false,
          });
        }

        onSuccess?.(response);
        return response;
      } catch (error) {
        const errorMessage =
          error instanceof ServiceAPIError
            ? error.message
            : "An unexpected error occurred";

        updateState({
          error: errorMessage,
          isLoading: false,
          isSubmitting: false,
        });
        throw error;
      }
    },
    [updateState]
  );

  // ====================================================================
  // USER SERVICE OPERATIONS
  // ====================================================================

  const getUserServices = useCallback(
    async (params?: UserServiceSearchParams): Promise<UserServiceResponse> => {
      const response = await handleServiceAction(
        () => serviceAPI.getUserServices(params),
        {
          showLoading: false,
          onSuccess: (res) => {
            const userResponse = res as UserServiceResponse;
            updateState({
              userServices: userResponse.data,
              userServicesSummary: userResponse.summary,
              pagination: userResponse.pagination,
            });
          },
        }
      );
      return response as UserServiceResponse;
    },
    [handleServiceAction, updateState]
  );

  // ====================================================================
  // CORE SERVICE MANAGEMENT
  // ====================================================================

  const createService = useCallback(
    async (data: CreateServiceData): Promise<Service> => {
      const response = await handleServiceAction(
        () => serviceAPI.createService(data),
        {
          showSubmitting: true,
          onSuccess: () => {
            // Refresh user services to include the new service
            getUserServices().catch(console.error);
          },
        }
      );
      return (response as ServiceResponse).data!;
    },
    [getUserServices, handleServiceAction]
  );

  const getServiceById = useCallback(
    async (
      serviceId: string,
      options?: ServiceFetchOptions
    ): Promise<Service> => {
      const response = await handleServiceAction(
        () => serviceAPI.getServiceById(serviceId, options),
        { updateCurrentService: true }
      );
      return (response as ServiceResponse).data!;
    },
    [handleServiceAction]
  );

  const getServiceBySlug = useCallback(
    async (slug: string): Promise<Service> => {
      const response = await handleServiceAction(
        () => serviceAPI.getServiceBySlug(slug),
        { updateCurrentService: true }
      );
      return (response as ServiceResponse).data!;
    },
    [handleServiceAction]
  );

  const updateService = useCallback(
    async (serviceId: string, data: UpdateServiceData): Promise<Service> => {
      const response = await handleServiceAction(
        () => serviceAPI.updateService(serviceId, data),
        {
          updateCurrentService: true,
          showSubmitting: true,
          onSuccess: () => {
            // Refresh user services to reflect the update
            getUserServices().catch(console.error);
          },
        }
      );
      return (response as ServiceResponse).data!;
    },
    [getUserServices, handleServiceAction]
  );

  const deleteService = useCallback(
    async (serviceId: string): Promise<void> => {
      await handleServiceAction(() => serviceAPI.deleteService(serviceId), {
        onSuccess: () => {
          // Clear current service if it was deleted
          if (state.currentService?._id.toString() === serviceId) {
            updateState({ currentService: null });
          }
          // Refresh user services
          getUserServices().catch(console.error);
        },
      });
    },
    [
      getUserServices,
      handleServiceAction,
      state.currentService?._id,
      updateState,
    ]
  );

  // ====================================================================
  // SERVICE FILE MANAGEMENT
  // ====================================================================

  const uploadServiceImages = useCallback(
    async (
      serviceId: string,
      data: ServiceImageUploadData
    ): Promise<ServiceImageResponse> => {
      return handleServiceAction(
        () => serviceAPI.uploadServiceImages(serviceId, data),
        {
          showSubmitting: true,
          onSuccess: () => {
            // Optionally refresh the current service if it matches
            if (state.currentService?._id.toString() === serviceId) {
              getServiceById(serviceId).catch(console.error);
            }
          },
        }
      ) as Promise<ServiceImageResponse>;
    },
    [handleServiceAction, state.currentService?._id, getServiceById]
  );

  const getServiceImages = useCallback(
    async (serviceId: string): Promise<ServiceImagesResponse> => {
      return handleServiceAction(() => serviceAPI.getServiceImages(serviceId), {
        showLoading: false,
      }) as Promise<ServiceImagesResponse>;
    },
    [handleServiceAction]
  );

  const deleteServiceImages = useCallback(
    async (serviceId: string): Promise<ServiceImagesResponse> => {
      return handleServiceAction(
        () => serviceAPI.deleteServiceImages(serviceId),
        {
          onSuccess: () => {
            // Optionally refresh the current service if it matches
            if (state.currentService?._id.toString() === serviceId) {
              getServiceById(serviceId).catch(console.error);
            }
          },
        }
      ) as Promise<ServiceImagesResponse>;
    },
    [handleServiceAction, state.currentService?._id, getServiceById]
  );

  // ====================================================================
  // PUBLIC SERVICE ROUTES
  // ====================================================================

  const getAllServices = useCallback(
    async (params?: ServiceSearchParams): Promise<PaginatedServiceResponse> => {
      const response = await handleServiceAction(
        () => serviceAPI.getAllServices(params),
        {
          showLoading: true, // Changed from false to true
          onSuccess: (res) => {
            const paginatedResponse = res as PaginatedServiceResponse;
            updateState({
              services: paginatedResponse.data,
              pagination: paginatedResponse.pagination,
              lastSearchParams: params || null,
            });
          },
        }
      );
      return response as PaginatedServiceResponse;
    },
    [handleServiceAction, updateState]
  );

  const getPopularServices = useCallback(
    async (limit?: number): Promise<Service[]> => {
      const response = await handleServiceAction(
        () => serviceAPI.getPopularServices(limit),
        {
          showLoading: false,
          onSuccess: (res) => {
            const servicesResponse = res as ServicesResponse;
            updateState({ popularServices: servicesResponse.data });
          },
        }
      );
      return (response as ServicesResponse).data;
    },
    [handleServiceAction, updateState]
  );

  const getApprovedServices = useCallback(
    async (params?: ServiceSearchParams): Promise<PaginatedServiceResponse> => {
      return handleServiceAction(() => serviceAPI.getApprovedServices(params), {
        showLoading: false,
      }) as Promise<PaginatedServiceResponse>;
    },
    [handleServiceAction]
  );

  const getServicesWithPricing = useCallback(
    async (params?: ServiceSearchParams): Promise<PaginatedServiceResponse> => {
      return handleServiceAction(
        () => serviceAPI.getServicesWithPricing(params),
        { showLoading: false }
      ) as Promise<PaginatedServiceResponse>;
    },
    [handleServiceAction]
  );

  const getServicesByCategory = useCallback(
    async (
      categoryId: string,
      params?: Omit<ServiceSearchParams, "category">
    ): Promise<PaginatedServiceResponse> => {
      return handleServiceAction(
        () => serviceAPI.getServicesByCategory(categoryId, params),
        { showLoading: false }
      ) as Promise<PaginatedServiceResponse>;
    },
    [handleServiceAction]
  );

  // ====================================================================
  // CONVENIENCE METHODS
  // ====================================================================

  const getServiceWithFullDetails = useCallback(
    async (serviceId: string): Promise<Service> => {
      return handleServiceAction(
        () => serviceAPI.getServiceWithFullDetails(serviceId),
        { updateCurrentService: true }
      ).then((res) => (res as ServiceResponse).data!);
    },
    [handleServiceAction]
  );

  const getServicesByStatus = useCallback(
    async (
      status: ServiceStatus,
      params?: Omit<ServiceSearchParams, "status">
    ): Promise<PaginatedServiceResponse> => {
      return handleServiceAction(
        () => serviceAPI.getServicesByStatus(status, params),
        { showLoading: false }
      ) as Promise<PaginatedServiceResponse>;
    },
    [handleServiceAction]
  );

  const getServicesInPriceRange = useCallback(
    async (
      minPrice: number,
      maxPrice: number,
      params?: Omit<ServiceSearchParams, "minPrice" | "maxPrice">
    ): Promise<PaginatedServiceResponse> => {
      return handleServiceAction(
        () => serviceAPI.getServicesInPriceRange(minPrice, maxPrice, params),
        { showLoading: false }
      ) as Promise<PaginatedServiceResponse>;
    },
    [handleServiceAction]
  );

  const getServicesWithFixedPricing = useCallback(
    async (params?: ServiceSearchParams): Promise<PaginatedServiceResponse> => {
      return handleServiceAction(
        () => serviceAPI.getServicesWithFixedPricing(params),
        { showLoading: false }
      ) as Promise<PaginatedServiceResponse>;
    },
    [handleServiceAction]
  );

  const getServicesWithServiceTypePricing = useCallback(
    async (params?: ServiceSearchParams): Promise<PaginatedServiceResponse> => {
      return handleServiceAction(
        () => serviceAPI.getServicesWithServiceTypePricing(params),
        { showLoading: false }
      ) as Promise<PaginatedServiceResponse>;
    },
    [handleServiceAction]
  );

  // ====================================================================
  // USER-SPECIFIC STATUS METHODS
  // ====================================================================

  const getUserServicesByStatus = useCallback(
    async (
      status: ServiceStatus,
      params?: Omit<UserServiceSearchParams, "status">
    ): Promise<UserServiceResponse> => {
      return handleServiceAction(
        () => serviceAPI.getUserServicesByStatus(status, params),
        { showLoading: false }
      ) as Promise<UserServiceResponse>;
    },
    [handleServiceAction]
  );

  const getUserDraftServices = useCallback(
    async (params?: UserServiceSearchParams): Promise<UserServiceResponse> => {
      return handleServiceAction(
        () => serviceAPI.getUserDraftServices(params),
        { showLoading: false }
      ) as Promise<UserServiceResponse>;
    },
    [handleServiceAction]
  );

  const getUserPendingServices = useCallback(
    async (params?: UserServiceSearchParams): Promise<UserServiceResponse> => {
      return handleServiceAction(
        () => serviceAPI.getUserPendingServices(params),
        { showLoading: false }
      ) as Promise<UserServiceResponse>;
    },
    [handleServiceAction]
  );

  const getUserApprovedServices = useCallback(
    async (params?: UserServiceSearchParams): Promise<UserServiceResponse> => {
      return handleServiceAction(
        () => serviceAPI.getUserApprovedServices(params),
        { showLoading: false }
      ) as Promise<UserServiceResponse>;
    },
    [handleServiceAction]
  );

  const getUserRejectedServices = useCallback(
    async (params?: UserServiceSearchParams): Promise<UserServiceResponse> => {
      return handleServiceAction(
        () => serviceAPI.getUserRejectedServices(params),
        { showLoading: false }
      ) as Promise<UserServiceResponse>;
    },
    [handleServiceAction]
  );

  const getUserDeletedServices = useCallback(
    async (params?: UserServiceSearchParams): Promise<UserServiceResponse> => {
      return handleServiceAction(
        () => serviceAPI.getUserDeletedServices(params),
        { showLoading: false }
      ) as Promise<UserServiceResponse>;
    },
    [handleServiceAction]
  );

  // ====================================================================
  // SORTING AND FILTERING
  // ====================================================================

  const getServicesByTags = useCallback(
    async (
      tags: string[],
      params?: Omit<ServiceSearchParams, "tags">
    ): Promise<PaginatedServiceResponse> => {
      return handleServiceAction(
        () => serviceAPI.getServicesByTags(tags, params),
        { showLoading: false }
      ) as Promise<PaginatedServiceResponse>;
    },
    [handleServiceAction]
  );

  const getRecentServices = useCallback(
    async (
      limit: number = 10,
      params?: ServiceSearchParams
    ): Promise<PaginatedServiceResponse> => {
      return handleServiceAction(
        () => serviceAPI.getRecentServices(limit, params),
        { showLoading: false }
      ) as Promise<PaginatedServiceResponse>;
    },
    [handleServiceAction]
  );

  const getServicesByPriceLowToHigh = useCallback(
    async (params?: ServiceSearchParams): Promise<PaginatedServiceResponse> => {
      return handleServiceAction(
        () => serviceAPI.getServicesByPriceLowToHigh(params),
        { showLoading: false }
      ) as Promise<PaginatedServiceResponse>;
    },
    [handleServiceAction]
  );

  const getServicesByPriceHighToLow = useCallback(
    async (params?: ServiceSearchParams): Promise<PaginatedServiceResponse> => {
      return handleServiceAction(
        () => serviceAPI.getServicesByPriceHighToLow(params),
        { showLoading: false }
      ) as Promise<PaginatedServiceResponse>;
    },
    [handleServiceAction]
  );

  const getTopPopularServices = useCallback(
    async (limit: number = 10): Promise<Service[]> => {
      const response = await handleServiceAction(
        () => serviceAPI.getTopPopularServices(limit),
        { showLoading: false }
      );
      return (response as ServicesResponse).data;
    },
    [handleServiceAction]
  );

  // ====================================================================
  // REFRESH METHODS
  // ====================================================================

  const refreshUserServices = useCallback(async (): Promise<void> => {
    await getUserServices();
  }, [getUserServices]);

  const refreshPopularServices = useCallback(async (): Promise<void> => {
    await getPopularServices();
  }, [getPopularServices]);

  // ====================================================================
  // STATE MANAGEMENT
  // ====================================================================

  const setCurrentService = useCallback(
    (service: Service | null) => {
      updateState({ currentService: service });
    },
    [updateState]
  );

  const clearServices = useCallback(() => {
    updateState({
      services: [],
      userServices: [],
      popularServices: [],
      pagination: null,
      userServicesSummary: null,
    });
  }, [updateState]);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const clearSearch = useCallback(() => {
    updateState({
      lastSearchParams: null,
    });
  }, [updateState]);

  // ====================================================================
  // UTILITY FUNCTIONS
  // ====================================================================

  const isServiceOwner = useCallback(
    (service: Service, userId: string): boolean => {
      return service.submittedBy?.toString() === userId;
    },
    []
  );

  const canEditService = useCallback(
    (service: Service, userId: string): boolean => {
      // User can edit if they own the service and it's in an editable state
      if (!isServiceOwner(service, userId)) return false;

      return [ServiceStatus.DRAFT, ServiceStatus.REJECTED].includes(
        service.status
      );
    },
    [isServiceOwner]
  );

  const getServiceStatusColor = useCallback((status: ServiceStatus): string => {
    const colors = {
      [ServiceStatus.DRAFT]: "gray",
      [ServiceStatus.PENDING_APPROVAL]: "yellow",
      [ServiceStatus.APPROVED]: "green",
      [ServiceStatus.REJECTED]: "red",
      [ServiceStatus.SUSPENDED]: "orange",
      [ServiceStatus.INACTIVE]: "gray",
      [ServiceStatus.ACTIVATE]: "teal",
    };
    return colors[status] || "gray";
  }, []);

  const getServiceStatusLabel = useCallback((status: ServiceStatus): string => {
    const labels = {
      [ServiceStatus.DRAFT]: "Draft",
      [ServiceStatus.PENDING_APPROVAL]: "Pending Approval",
      [ServiceStatus.APPROVED]: "Approved",
      [ServiceStatus.REJECTED]: "Rejected",
      [ServiceStatus.SUSPENDED]: "Suspended",
      [ServiceStatus.INACTIVE]: "Inactive",
      [ServiceStatus.ACTIVATE]: "teal",
    };
    return labels[status] || status;
  }, []);

  // Auto-initialization effect
  useEffect(() => {
    let mounted = true;

    const initializeServices = async () => {
      try {
        // Fetch popular services on initialization
        const popularResponse = await serviceAPI.getPopularServices(10);

        if (!mounted) return;

        updateState({
          popularServices: popularResponse.data,
          isInitialized: true,
        });
      } catch (error) {
        if (!mounted) return;

        console.warn("Service initialization failed:", error);

        updateState({
          isInitialized: true,
          error:
            error instanceof ServiceAPIError && error.statusCode !== 401
              ? error.message
              : null,
        });
      }
    };

    initializeServices();

    return () => {
      mounted = false;
    };
  }, [updateState]);

  return {
    ...state,
    // Core CRUD operations
    createService,
    getServiceById,
    getServiceBySlug,
    updateService,
    deleteService,

    // File management operations
    uploadServiceImages,
    getServiceImages,
    deleteServiceImages,

    // Public listing operations
    getAllServices,
    getPopularServices,
    getApprovedServices,
    getServicesWithPricing,
    getServicesByCategory,

    // User-specific operations
    getUserServices,
    refreshUserServices,

    // Convenience methods
    getServiceWithFullDetails,
    getServicesByStatus,
    getServicesInPriceRange,
    getServicesWithFixedPricing,
    getServicesWithServiceTypePricing,

    // User service status methods
    getUserServicesByStatus,
    getUserDraftServices,
    getUserPendingServices,
    getUserApprovedServices,
    getUserRejectedServices,
    getUserDeletedServices,

    // Sorting and filtering
    getServicesByTags,
    getRecentServices,
    getServicesByPriceLowToHigh,
    getServicesByPriceHighToLow,
    getTopPopularServices,

    // Refresh methods
    refreshPopularServices,

    // State management
    setCurrentService,
    clearServices,
    clearError,
    clearSearch,

    // Utilities
    isServiceOwner,
    canEditService,
    getServiceStatusColor,
    getServiceStatusLabel,
  };
};
