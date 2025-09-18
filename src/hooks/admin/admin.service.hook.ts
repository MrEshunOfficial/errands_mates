import { useState, useCallback, useEffect } from "react";
import type { Service } from "@/types/service.types";
import { ServiceStatus } from "@/types/base.types";
import type { AuthResponse } from "@/types/user.types";

import {
  ServiceAPIError,
  serviceAPI,
  type ServiceSearchParams,
  type PaginatedServiceResponse,
  type ServiceResponse,
  type ServicesResponse,
  type BatchFileOperationResponse,
} from "@/lib/api/services/services.api";

interface AdminServiceState {
  pendingServices: Service[];
  allServices: Service[];
  popularServices: Service[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null;
  serviceStats: {
    totalServices: number;
    pendingApproval: number;
    approved: number;
    rejected: number;
    suspended: number;
    deleted: number;
  } | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  isInitialized: boolean;
  lastSearchParams: ServiceSearchParams | null;
}

interface AdminServiceActions {
  getPendingServices: (
    params?: Pick<ServiceSearchParams, "page" | "limit">
  ) => Promise<PaginatedServiceResponse>;
  approveService: (serviceId: string) => Promise<Service>;
  rejectService: (serviceId: string, reason?: string) => Promise<Service>;
  restoreService: (serviceId: string) => Promise<Service>;
  getAllServicesAdmin: (
    params?: ServiceSearchParams
  ) => Promise<PaginatedServiceResponse>;
  getServicesByStatusAdmin: (
    status: ServiceStatus,
    params?: Omit<ServiceSearchParams, "status">
  ) => Promise<PaginatedServiceResponse>;
  deleteServicePermanently: (serviceId: string) => Promise<void>;
  getPopularServices: (limit?: number) => Promise<Service[]>;
  togglePopular: (serviceId: string) => Promise<Service>;
  setPopularServices: (serviceIds: string[]) => Promise<Service[]>;
  removeFromPopular: (serviceId: string) => Promise<Service>;
  batchApproveServices: (serviceIds: string[]) => Promise<Service[]>;
  batchRejectServices: (
    serviceIds: string[],
    reason?: string
  ) => Promise<Service[]>;
  batchDeleteServices: (serviceIds: string[]) => Promise<void>;
  batchRestoreServices: (serviceIds: string[]) => Promise<Service[]>;
  batchGetServiceImages: (
    serviceIds: string[]
  ) => Promise<BatchFileOperationResponse>;
  batchDeleteServiceImages: (
    serviceIds: string[]
  ) => Promise<BatchFileOperationResponse>;
  getServiceStatistics: () => Promise<{
    totalServices: number;
    pendingApproval: number;
    approved: number;
    rejected: number;
    suspended: number;
    deleted: number;
  }>;
  getServicesCreatedInPeriod: (
    startDate: Date,
    endDate: Date
  ) => Promise<Service[]>;
  getMostPopularServices: (limit?: number) => Promise<Service[]>;
  getTopServiceProviders: (limit?: number) => Promise<unknown[]>;
  getServicesBySubmitter: (
    submitterId: string,
    params?: ServiceSearchParams
  ) => Promise<PaginatedServiceResponse>;
  getServicesWithReports: (
    params?: ServiceSearchParams
  ) => Promise<PaginatedServiceResponse>;
  getFlaggedServices: (
    params?: ServiceSearchParams
  ) => Promise<PaginatedServiceResponse>;
  refreshPendingServices: () => Promise<void>;
  refreshPopularServices: () => Promise<void>;
  refreshServiceStats: () => Promise<void>;
  refreshAllServices: () => Promise<void>;
  clearAdminData: () => void;
  clearError: () => void;
  clearSearch: () => void;
  getServiceStatusColor: (status: ServiceStatus) => string;
  getServiceStatusLabel: (status: ServiceStatus) => string;
  canPerformAdminAction: (action: string, service?: Service) => boolean;
  getServicePriorityLevel: (service: Service) => "low" | "medium" | "high";
}

export const useAdminService = (options?: {
  autoFetchPending?: boolean;
  autoFetchAll?: boolean;
  autoFetchPopular?: boolean;
  autoFetchStats?: boolean;
}): AdminServiceState & AdminServiceActions => {
  const shouldAutoFetch = Boolean(
    options?.autoFetchPending ||
      options?.autoFetchAll ||
      options?.autoFetchPopular ||
      options?.autoFetchStats
  );

  const [state, setState] = useState<AdminServiceState>({
    pendingServices: [],
    allServices: [],
    popularServices: [],
    pagination: null,
    serviceStats: null,
    isLoading: shouldAutoFetch,
    isSubmitting: false,
    error: null,
    isInitialized: false,
    lastSearchParams: null,
  });

  const updateState = useCallback((updates: Partial<AdminServiceState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleAdminAction = useCallback(
    async <T = AuthResponse>(
      action: () => Promise<T>,
      options?: {
        onSuccess?: (response: T) => void;
        showLoading?: boolean;
        showSubmitting?: boolean;
        loadingKey?: "isLoading" | "isSubmitting";
      }
    ): Promise<T> => {
      const {
        onSuccess,
        showLoading = true,
        showSubmitting = false,
        loadingKey,
      } = options || {};

      try {
        const activeLoadingKey =
          loadingKey || (showSubmitting ? "isSubmitting" : "isLoading");

        if (showLoading || showSubmitting) {
          updateState({
            [activeLoadingKey]: true,
            error: null,
          });
        } else {
          updateState({ error: null });
        }

        const response = await action();

        updateState({
          [activeLoadingKey]: false,
        });

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
  // ADMIN ANALYTICS AND REPORTING
  // ====================================================================

  const getServiceStatistics = useCallback(async () => {
    return await handleAdminAction(
      async () => {
        const stats = {
          totalServices: 0,
          pendingApproval: 0,
          approved: 0,
          rejected: 0,
          suspended: 0,
          deleted: 0,
        };

        const pendingResponse = await serviceAPI.getPendingServices({
          limit: 1,
        });
        stats.pendingApproval = pendingResponse.pagination?.totalItems || 0;

        const approvedResponse = await serviceAPI.getApprovedServices({
          limit: 1,
        });
        stats.approved = approvedResponse.pagination?.totalItems || 0;

        const rejectedResponse = await serviceAPI.getServicesByStatus(
          ServiceStatus.REJECTED,
          { limit: 1 }
        );
        stats.rejected = rejectedResponse.pagination?.totalItems || 0;

        const suspendedResponse = await serviceAPI.getServicesByStatus(
          ServiceStatus.SUSPENDED,
          { limit: 1 }
        );
        stats.suspended = suspendedResponse.pagination?.totalItems || 0;

        const deletedResponse = await serviceAPI.getUserDeletedServices({
          limit: 1,
        });
        stats.deleted = deletedResponse.pagination?.totalItems || 0;

        stats.totalServices =
          stats.pendingApproval +
          stats.approved +
          stats.rejected +
          stats.suspended +
          stats.deleted;

        updateState({ serviceStats: stats });
        return stats;
      },
      {
        showLoading: false,
        onSuccess: (stats) => {
          console.log("Service statistics updated:", stats);
        },
      }
    );
  }, [handleAdminAction, updateState]);

  // ====================================================================
  // ADMIN SERVICE APPROVAL WORKFLOW
  // ====================================================================

  const getAllServicesAdmin = useCallback(
    async (params?: ServiceSearchParams): Promise<PaginatedServiceResponse> => {
      const response = await handleAdminAction(
        () => serviceAPI.getAllServices(params),
        {
          showLoading: false,
          onSuccess: (res) => {
            const paginatedResponse = res as PaginatedServiceResponse;
            updateState({
              allServices: paginatedResponse.data,
              pagination: paginatedResponse.pagination,
              lastSearchParams: params || null,
            });
          },
        }
      );
      return response as PaginatedServiceResponse;
    },
    [handleAdminAction, updateState]
  );

  const refreshServiceStats = useCallback(async (): Promise<void> => {
    await getServiceStatistics();
  }, [getServiceStatistics]);

  const getPendingServices = useCallback(
    async (
      params?: Pick<ServiceSearchParams, "page" | "limit">
    ): Promise<PaginatedServiceResponse> => {
      const response = await handleAdminAction(
        () => serviceAPI.getPendingServices(params),
        {
          showLoading: false,
          onSuccess: (res) => {
            const paginatedResponse = res as PaginatedServiceResponse;
            updateState({
              pendingServices: paginatedResponse.data,
              pagination: paginatedResponse.pagination,
            });
          },
        }
      );
      return response as PaginatedServiceResponse;
    },
    [handleAdminAction, updateState]
  );

  const approveService = useCallback(
    async (serviceId: string): Promise<Service> => {
      const response = await handleAdminAction(
        () => serviceAPI.approveService({ serviceId }),
        {
          showSubmitting: true,
          onSuccess: () => {
            getPendingServices().catch(console.error);
            refreshServiceStats().catch(console.error);
          },
        }
      );
      return (response as ServiceResponse).data!;
    },
    [handleAdminAction, getPendingServices, refreshServiceStats]
  );

  const rejectService = useCallback(
    async (serviceId: string, reason?: string): Promise<Service> => {
      const response = await handleAdminAction(
        () => serviceAPI.rejectService({ serviceId, reason }),
        {
          showSubmitting: true,
          onSuccess: () => {
            getPendingServices().catch(console.error);
            refreshServiceStats().catch(console.error);
          },
        }
      );
      return (response as ServiceResponse).data!;
    },
    [handleAdminAction, getPendingServices, refreshServiceStats]
  );

  // FIXED: Remove the pre-check that was causing the issue
  const restoreService = useCallback(
    async (serviceId: string): Promise<Service> => {
      const response = await handleAdminAction(
        // Directly call the restore API without pre-checking the service status
        () => serviceAPI.restoreService(serviceId),
        {
          showSubmitting: true,
          onSuccess: () => {
            refreshServiceStats().catch(console.error);
            getAllServicesAdmin().catch(console.error);
          },
        }
      );
      return (response as ServiceResponse).data!;
    },
    [handleAdminAction, refreshServiceStats, getAllServicesAdmin]
  );

  const getServicesByStatusAdmin = useCallback(
    async (
      status: ServiceStatus,
      params?: Omit<ServiceSearchParams, "status">
    ): Promise<PaginatedServiceResponse> => {
      return handleAdminAction(
        () => serviceAPI.getServicesByStatus(status, params),
        { showLoading: false }
      ) as Promise<PaginatedServiceResponse>;
    },
    [handleAdminAction]
  );

  const deleteServicePermanently = useCallback(
    async (serviceId: string): Promise<void> => {
      return handleAdminAction(
        async () => {
          await serviceAPI.deleteService(serviceId);
        },
        {
          showSubmitting: true,
          onSuccess: () => {
            refreshServiceStats().catch(console.error);
            getAllServicesAdmin().catch(console.error);
          },
        }
      );
    },
    [handleAdminAction, refreshServiceStats, getAllServicesAdmin]
  );

  // ====================================================================
  // POPULAR SERVICES MANAGEMENT
  // ====================================================================

  const getPopularServices = useCallback(
    async (limit?: number): Promise<Service[]> => {
      const response = await handleAdminAction(
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
    [handleAdminAction, updateState]
  );

  const togglePopular = useCallback(
    async (serviceId: string): Promise<Service> => {
      const response = await handleAdminAction(
        () => serviceAPI.togglePopular(serviceId),
        {
          onSuccess: () => {
            getPopularServices().catch(console.error);
          },
        }
      );
      return (response as ServiceResponse).data!;
    },
    [handleAdminAction, getPopularServices]
  );

  const setPopularServices = useCallback(
    async (serviceIds: string[]): Promise<Service[]> => {
      return handleAdminAction(
        async () => {
          const results = await Promise.all(
            serviceIds.map(async (serviceId) => {
              const service = await serviceAPI.getServiceById(serviceId);
              if (!service.data?.isPopular) {
                return serviceAPI.togglePopular(serviceId);
              }
              return service;
            })
          );
          return results.map((res) => (res as ServiceResponse).data!);
        },
        {
          showSubmitting: true,
          onSuccess: () => {
            getPopularServices().catch(console.error);
          },
        }
      );
    },
    [handleAdminAction, getPopularServices]
  );

  const removeFromPopular = useCallback(
    async (serviceId: string): Promise<Service> => {
      return handleAdminAction(
        async () => {
          const service = await serviceAPI.getServiceById(serviceId);
          if (service.data?.isPopular) {
            return serviceAPI.togglePopular(serviceId);
          }
          return service;
        },
        {
          onSuccess: () => {
            getPopularServices().catch(console.error);
          },
        }
      ).then((response) => (response as ServiceResponse).data!);
    },
    [handleAdminAction, getPopularServices]
  );

  // ====================================================================
  // BATCH OPERATIONS
  // ====================================================================

  const batchApproveServices = useCallback(
    async (serviceIds: string[]): Promise<Service[]> => {
      return handleAdminAction(
        async () => {
          const results = await Promise.all(
            serviceIds.map((serviceId) =>
              serviceAPI.approveService({ serviceId })
            )
          );
          return results.map((res) => (res as ServiceResponse).data!);
        },
        {
          showSubmitting: true,
          onSuccess: () => {
            getPendingServices().catch(console.error);
            refreshServiceStats().catch(console.error);
          },
        }
      );
    },
    [handleAdminAction, getPendingServices, refreshServiceStats]
  );

  const batchRejectServices = useCallback(
    async (serviceIds: string[], reason?: string): Promise<Service[]> => {
      return handleAdminAction(
        async () => {
          const results = await Promise.all(
            serviceIds.map((serviceId) =>
              serviceAPI.rejectService({ serviceId, reason })
            )
          );
          return results.map((res) => (res as ServiceResponse).data!);
        },
        {
          showSubmitting: true,
          onSuccess: () => {
            getPendingServices().catch(console.error);
            refreshServiceStats().catch(console.error);
          },
        }
      );
    },
    [handleAdminAction, getPendingServices, refreshServiceStats]
  );

  const batchDeleteServices = useCallback(
    async (serviceIds: string[]): Promise<void> => {
      return handleAdminAction(
        async () => {
          await Promise.all(
            serviceIds.map((serviceId) => serviceAPI.deleteService(serviceId))
          );
        },
        {
          showSubmitting: true,
          onSuccess: () => {
            refreshServiceStats().catch(console.error);
            getAllServicesAdmin().catch(console.error);
          },
        }
      );
    },
    [handleAdminAction, refreshServiceStats, getAllServicesAdmin]
  );

  // FIXED: Remove the pre-check for batch restore as well
  const batchRestoreServices = useCallback(
    async (serviceIds: string[]): Promise<Service[]> => {
      return handleAdminAction(
        async () => {
          const results = await Promise.all(
            serviceIds.map((serviceId) => serviceAPI.restoreService(serviceId))
          );
          return results.map((res) => (res as ServiceResponse).data!);
        },
        {
          showSubmitting: true,
          onSuccess: () => {
            refreshServiceStats().catch(console.error);
            getAllServicesAdmin().catch(console.error);
          },
        }
      );
    },
    [handleAdminAction, refreshServiceStats, getAllServicesAdmin]
  );

  const batchGetServiceImages = useCallback(
    async (serviceIds: string[]): Promise<BatchFileOperationResponse> => {
      return handleAdminAction(
        () => serviceAPI.batchGetServiceImages(serviceIds),
        { showLoading: false }
      ) as Promise<BatchFileOperationResponse>;
    },
    [handleAdminAction]
  );

  const batchDeleteServiceImages = useCallback(
    async (serviceIds: string[]): Promise<BatchFileOperationResponse> => {
      return handleAdminAction(
        () => serviceAPI.batchDeleteServiceImages(serviceIds),
        { showLoading: false }
      ) as Promise<BatchFileOperationResponse>;
    },
    [handleAdminAction]
  );

  // ====================================================================
  // ADMIN ANALYTICS AND REPORTING (CONTINUED)
  // ====================================================================

  const getServicesCreatedInPeriod = useCallback(
    async (startDate: Date, endDate: Date): Promise<Service[]> => {
      return handleAdminAction(
        async () => {
          const response = await serviceAPI.getAllServices({
            sortBy: "createdAt",
            sortOrder: "desc",
          });
          return response.data.filter((service) => {
            const createdAt = new Date(service.createdAt);
            return createdAt >= startDate && createdAt <= endDate;
          });
        },
        { showLoading: false }
      );
    },
    [handleAdminAction]
  );

  const getMostPopularServices = useCallback(
    async (limit: number = 10): Promise<Service[]> => {
      return getPopularServices(limit);
    },
    [getPopularServices]
  );

  const getTopServiceProviders = useCallback(
    async (limit: number = 10): Promise<unknown[]> => {
      return handleAdminAction(
        async () => {
          const response = await serviceAPI.getAllServices({
            sortBy: "createdAt",
            sortOrder: "desc",
            limit,
          });
          const providerMap = new Map();
          response.data.forEach((service) => {
            const submitter = service.submittedBy;
            if (submitter && typeof submitter === "object" && submitter._id) {
              const id = submitter._id;
              const count = providerMap.get(id) || 0;
              providerMap.set(id, count + 1);
            }
          });
          return Array.from(providerMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([id, count]) => ({ providerId: id, serviceCount: count }));
        },
        { showLoading: false }
      );
    },
    [handleAdminAction]
  );

  // ====================================================================
  // ADVANCED FILTERING FOR ADMIN
  // ====================================================================

  const getServicesBySubmitter = useCallback(
    async (
      submitterId: string,
      params?: ServiceSearchParams
    ): Promise<PaginatedServiceResponse> => {
      return handleAdminAction(
        () => serviceAPI.getUserServices({ ...params, userId: submitterId }),
        { showLoading: false }
      ) as Promise<PaginatedServiceResponse>;
    },
    [handleAdminAction]
  );

  const getServicesWithReports =
    useCallback(async (): Promise<PaginatedServiceResponse> => {
      return {
        success: true,
        total: 0,
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }, []);

  const getFlaggedServices =
    useCallback(async (): Promise<PaginatedServiceResponse> => {
      console.warn("Flagged services not implemented, returning empty");
      return {
        success: true,
        total: 0,
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }, []);

  // ====================================================================
  // REFRESH METHODS
  // ====================================================================

  const refreshPendingServices = useCallback(async (): Promise<void> => {
    await getPendingServices();
  }, [getPendingServices]);

  const refreshPopularServices = useCallback(async (): Promise<void> => {
    await getPopularServices();
  }, [getPopularServices]);

  const refreshAllServices = useCallback(async (): Promise<void> => {
    await getAllServicesAdmin();
  }, [getAllServicesAdmin]);

  // ====================================================================
  // STATE MANAGEMENT
  // ====================================================================

  const clearAdminData = useCallback(() => {
    updateState({
      pendingServices: [],
      allServices: [],
      popularServices: [],
      pagination: null,
      serviceStats: null,
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

  const getServiceStatusColor = useCallback((status: ServiceStatus): string => {
    const colors = {
      [ServiceStatus.DRAFT]: "gray",
      [ServiceStatus.PENDING_APPROVAL]: "yellow",
      [ServiceStatus.APPROVED]: "green",
      [ServiceStatus.REJECTED]: "red",
      [ServiceStatus.SUSPENDED]: "orange",
      [ServiceStatus.INACTIVE]: "gray",
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
    };
    return labels[status] || status;
  }, []);

  const canPerformAdminAction = useCallback(
    (action: string, service?: Service): boolean => {
      if (!service) return true;

      switch (action) {
        case "approve":
          return service.status === ServiceStatus.PENDING_APPROVAL;
        case "reject":
          return service.status === ServiceStatus.PENDING_APPROVAL;
        case "restore":
          return (
            service.status === ServiceStatus.REJECTED ||
            service.status === ServiceStatus.SUSPENDED ||
            service.isDeleted === true
          );
        case "suspend":
          return service.status === ServiceStatus.APPROVED;
        case "delete":
          return true;
        default:
          return true;
      }
    },
    []
  );

  const getServicePriorityLevel = useCallback(
    (service: Service): "low" | "medium" | "high" => {
      const daysSinceSubmission = Math.floor(
        (Date.now() - new Date(service.createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (daysSinceSubmission > 7) return "high";
      if (daysSinceSubmission > 3) return "medium";
      return "low";
    },
    []
  );

  // Auto-initialization effect
  type AdminServiceResult =
    | {
        type: "pending";
        data: Awaited<ReturnType<typeof serviceAPI.getPendingServices>>;
      }
    | {
        type: "all";
        data: Awaited<ReturnType<typeof serviceAPI.getAllServices>>;
      }
    | {
        type: "popular";
        data: Awaited<ReturnType<typeof serviceAPI.getPopularServices>>;
      }
    | {
        type: "stats";
        data: {
          totalServices: number;
          pendingApproval: number;
          approved: number;
          rejected: number;
          suspended: number;
          deleted: number;
        };
      };

  useEffect(() => {
    let mounted = true;

    const initializeAdminService = async () => {
      if (!shouldAutoFetch) {
        updateState({ isInitialized: true, isLoading: false });
        return;
      }

      try {
        updateState({ isLoading: true, error: null });

        const promises: Promise<AdminServiceResult>[] = [];

        if (options?.autoFetchPending) {
          promises.push(
            serviceAPI.getPendingServices().then((response) => ({
              type: "pending",
              data: response,
            }))
          );
        }

        if (options?.autoFetchAll) {
          promises.push(
            serviceAPI.getAllServices().then((response) => ({
              type: "all",
              data: response,
            }))
          );
        }

        if (options?.autoFetchPopular) {
          promises.push(
            serviceAPI.getPopularServices().then((response) => ({
              type: "popular",
              data: response,
            }))
          );
        }

        if (options?.autoFetchStats) {
          promises.push(
            (async () => {
              const stats = await getServiceStatistics();
              return { type: "stats", data: stats };
            })()
          );
        }

        const results = await Promise.allSettled(promises);

        if (!mounted) return;

        const newState: Partial<AdminServiceState> = {
          isInitialized: true,
          isLoading: false,
        };

        results.forEach((result) => {
          if (result.status === "fulfilled") {
            const { type, data } = result.value;

            switch (type) {
              case "pending":
                newState.pendingServices = data.data;
                if (data.pagination) newState.pagination = data.pagination;
                break;
              case "all":
                newState.allServices = data.data;
                if (data.pagination) newState.pagination = data.pagination;
                break;
              case "popular":
                newState.popularServices = data.data;
                break;
              case "stats":
                newState.serviceStats = data;
                break;
            }
          } else {
            console.warn(
              "Admin service initialization failed for one operation:",
              result.reason
            );
          }
        });

        updateState(newState);
      } catch (error) {
        if (!mounted) return;

        console.warn("Admin service initialization failed:", error);
        updateState({
          isInitialized: true,
          isLoading: false,
          error:
            error instanceof ServiceAPIError && error.statusCode !== 401
              ? error.message
              : null,
        });
      }
    };

    initializeAdminService();

    return () => {
      mounted = false;
    };
  }, [
    shouldAutoFetch,
    options?.autoFetchPending,
    options?.autoFetchAll,
    options?.autoFetchPopular,
    options?.autoFetchStats,
    updateState,
    getServiceStatistics,
  ]);

  return {
    ...state,
    getPendingServices,
    approveService,
    rejectService,
    restoreService,
    getAllServicesAdmin,
    getServicesByStatusAdmin,
    deleteServicePermanently,
    getPopularServices,
    togglePopular,
    setPopularServices,
    removeFromPopular,
    batchApproveServices,
    batchRejectServices,
    batchDeleteServices,
    batchRestoreServices,
    batchGetServiceImages,
    batchDeleteServiceImages,
    getServiceStatistics,
    getServicesCreatedInPeriod,
    getMostPopularServices,
    getTopServiceProviders,
    getServicesBySubmitter,
    getServicesWithReports,
    getFlaggedServices,
    refreshPendingServices,
    refreshPopularServices,
    refreshServiceStats,
    refreshAllServices,
    clearAdminData,
    clearError,
    clearSearch,
    getServiceStatusColor,
    getServiceStatusLabel,
    canPerformAdminAction,
    getServicePriorityLevel,
  };
};
