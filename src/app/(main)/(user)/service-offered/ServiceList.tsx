"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ServiceStatus } from "@/types/base.types";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Grid,
  List,
  RefreshCw,
  Plus,
  Trash2,
  RotateCcw,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Star,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAdminService } from "@/hooks/admin/admin.service.hook";
import ServiceCard from "./ServiceCard";

// Service interface (unchanged)
interface ServiceCardService {
  _id: string | number;
  title: string;
  description: string;
  status: ServiceStatus;
  isPopular: boolean;
  createdAt: string;
  updatedAt: string;
  category?: string | { _id: string; name: string; slug: string };
  price?: number;
  providersCount?: number;
  submittedBy?:
    | string
    | {
        _id: string;
        name?: string;
        serviceUserId?: string;
        [key: string]: unknown;
      };
  images?: { url: string }[];
}

type ServiceFilter = ServiceStatus | "all";
type ViewMode = "grid" | "list";

interface ServiceListProps {
  limit?: number;
  showSearch?: boolean;
  searchPlaceholder?: string;
  className?: string;
  defaultFilter?: ServiceFilter;
  autoFetch?: boolean;
}

const AdminServiceList: React.FC<ServiceListProps> = ({
  limit = 20,
  showSearch = true,
  searchPlaceholder = "Search services...",
  className,
  defaultFilter = "all",
  autoFetch = true,
}) => {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedServices, setSelectedServices] = useState<Set<string>>(
    new Set()
  );
  const [serviceToDelete, setServiceToDelete] =
    useState<ServiceCardService | null>(null);
  const [serviceToReject, setServiceToReject] = useState<{
    service: ServiceCardService;
    reason?: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [serviceFilter, setServiceFilter] =
    useState<ServiceFilter>(defaultFilter);

  // Local loading states for specific operations
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isRefreshLoading, setIsRefreshLoading] = useState(false);

  const {
    allServices: services,
    pagination,
    isLoading: hookLoading,
    isSubmitting,
    error,
    isInitialized,
    getAllServicesAdmin,
    approveService,
    rejectService,
    restoreService,
    togglePopular,
    deleteServicePermanently,
    batchApproveServices,
    batchRejectServices,
    batchDeleteServices,
    batchRestoreServices,
    getServiceStatistics,
    clearError,
    getServiceStatusColor,
    getServiceStatusLabel,
    canPerformAdminAction,
    getServicePriorityLevel,
    refreshAllServices,
  } = useAdminService({
    autoFetchAll: autoFetch,
    autoFetchStats: autoFetch,
  });

  // Single refresh function for all actions
  const refreshAfterAction = useCallback(async () => {
    await refreshAllServices();
    await getServiceStatistics();
  }, [refreshAllServices, getServiceStatistics]);

  // Compute combined loading state
  const isLoading =
    hookLoading || isFilterLoading || isSearchLoading || isRefreshLoading;

  const apiParams = useMemo(
    () => ({
      page: pagination?.currentPage || 1,
      limit,
      ...(serviceFilter !== "all" && { status: serviceFilter }),
    }),
    [pagination?.currentPage, limit, serviceFilter]
  );

  // Simplified - use hook's handleAdminAction for most operations
  const handleSimpleAction = useCallback(
    async (
      action: () => Promise<unknown>,
      successMsg: string,
      errorMsg: string
    ): Promise<void> => {
      try {
        await action();
        toast.success(successMsg);
        await refreshAfterAction();
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        toast.error(`${errorMsg}: ${errorMessage}`);
      }
    },
    [refreshAfterAction]
  );

  const fetchServices = useCallback(
    async (showLoading = false) => {
      if (showLoading) {
        setIsFilterLoading(true);
      }

      try {
        await getAllServicesAdmin(apiParams);
      } catch (err) {
        toast.error(`Failed to load services list: ${String(err)}`);
      } finally {
        if (showLoading) {
          setIsFilterLoading(false);
        }
      }
    },
    [getAllServicesAdmin, apiParams]
  );

  // Only fetch manually if auto-fetch is disabled or for filter changes
  useEffect(() => {
    if (!autoFetch || !isInitialized) {
      return;
    }

    // Only fetch when filter changes from the default
    if (serviceFilter !== defaultFilter) {
      fetchServices(true);
    }
  }, [serviceFilter, autoFetch, isInitialized, defaultFilter, fetchServices]);

  const handleSearchChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
      const query = e.target.value;
      setIsSearchLoading(true);

      try {
        const searchParams = { ...apiParams, search: query };
        await getAllServicesAdmin(searchParams);
      } catch (err) {
        toast.error(`Search failed: ${String(err)}`);
      } finally {
        setIsSearchLoading(false);
      }
    },
    [getAllServicesAdmin, apiParams]
  );

  const handleFilterChange = useCallback(
    async (filter: ServiceFilter): Promise<void> => {
      if (filter === serviceFilter) return;

      setServiceFilter(filter);
      // fetchServices will be called by useEffect with showLoading = true
    },
    [serviceFilter]
  );

  const handleRefresh = useCallback(async (): Promise<void> => {
    setIsRefreshLoading(true);
    try {
      await refreshAfterAction();
      toast.success("Services refreshed successfully");
    } catch (err) {
      toast.error(`Failed to refresh services: ${String(err)}`);
    } finally {
      setIsRefreshLoading(false);
    }
  }, [refreshAfterAction]);

  const toggleServiceSelection = useCallback((serviceId: string): void => {
    setSelectedServices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  }, []);

  const isServiceSelected = useCallback(
    (serviceId: string): boolean => selectedServices.has(serviceId),
    [selectedServices]
  );

  const toggleSelectAll = useCallback((): void => {
    if (selectedServices.size === services.length) {
      setSelectedServices(new Set());
    } else {
      setSelectedServices(
        new Set(services.map((service) => service._id.toString()))
      );
    }
  }, [services, selectedServices]);

  const createBulkHandler = useCallback(
    (action: (ids: string[]) => Promise<unknown>, successMessage: string) =>
      async (): Promise<void> => {
        if (selectedServices.size === 0) return;
        const selectedIds = Array.from(selectedServices);

        await handleSimpleAction(
          () => action(selectedIds),
          `${selectedIds.length} ${successMessage}`,
          `Failed to ${successMessage.split(" ")[1]}`
        );

        setSelectedServices(new Set());
      },
    [selectedServices, handleSimpleAction]
  );

  // Show loading spinner during initial load or when no data yet
  if (isLoading && (!isInitialized || services.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-1/2 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <div className="text-sm text-muted-foreground">
          {!isInitialized ? "Initializing..." : "Loading services..."}
        </div>
      </div>
    );
  }

  // empty state when no services exist
  if (!isLoading && isInitialized && services.length === 0) {
    return (
      <EmptyState message="No services found. Try adjusting your filters or creating a new service." />
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load services"
        message={error}
        onRetry={() => {
          clearError();
          handleFilterChange(serviceFilter);
        }}
      />
    );
  }

  return (
    <div className={cn("space-y-6 w-full", className)}>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {showSearch && (
          <div className="flex-1 max-w-md">
            <Input
              type="text"
              placeholder={searchPlaceholder}
              onChange={handleSearchChange}
              className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              disabled={isLoading || isSubmitting}
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <Select value={serviceFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-36 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
              {(["all", ...Object.values(ServiceStatus)] as const).map(
                (filter) => (
                  <SelectItem
                    key={filter}
                    value={filter}
                    className="hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {filter.charAt(0).toUpperCase() +
                      filter.slice(1).replace(/_/g, " ")}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || isSubmitting}
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <RefreshCw
              className={cn(
                "w-4 h-4",
                isLoading && "animate-spin",
                "text-gray-600 dark:text-gray-300"
              )}
            />
          </Button>

          <div className="flex border gap-1 rounded-lg p-1 border-gray-300 dark:border-gray-600">
            {(["list", "grid"] as const).map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode(mode)}
                className={cn(
                  "px-3",
                  viewMode === mode
                    ? "bg-blue-600 dark:bg-blue-500 text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
              >
                {mode === "list" ? (
                  <List className="w-4 h-4" />
                ) : (
                  <Grid className="w-4 h-4" />
                )}
              </Button>
            ))}
          </div>

          <Button
            onClick={() => router.push("/admin/services/create")}
            disabled={isSubmitting}
            className="bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Service
          </Button>
        </div>
      </div>

      {selectedServices.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
              {selectedServices.size} service
              {selectedServices.size > 1 ? "s" : ""} selected
            </span>

            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={createBulkHandler(
                  batchApproveServices,
                  "services approved"
                )}
                disabled={isSubmitting || !selectedServices.size}
                className="text-green-700 dark:text-green-400 border-green-300 dark:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/50"
              >
                <CheckSquare className="w-4 h-4 mr-1" />
                Approve Selected
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={createBulkHandler(
                  (ids) => batchRejectServices(ids, "Batch rejected by admin"),
                  "services rejected"
                )}
                disabled={isSubmitting || !selectedServices.size}
                className="text-red-700 dark:text-red-400 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/50"
              >
                <X className="w-4 h-4 mr-1" />
                Reject Selected
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={createBulkHandler(
                  (ids) => Promise.all(ids.map((id) => togglePopular(id))),
                  "services popularity toggled"
                )}
                disabled={isSubmitting || !selectedServices.size}
                className="text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/50"
              >
                <Star className="w-4 h-4 mr-1" />
                Toggle Popular
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting || !selectedServices.size}
                    className="text-red-700 dark:text-red-400 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete Selected
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-gray-900 dark:text-gray-100">
                      Delete Selected Services
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
                      Permanently delete {selectedServices.size} selected
                      service
                      {selectedServices.size > 1 ? "s" : ""}? This action cannot
                      be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={createBulkHandler(
                        batchDeleteServices,
                        "services deleted"
                      )}
                      className="bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600 text-white"
                    >
                      Delete All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting || !selectedServices.size}
                    className="text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/50"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Restore Selected
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-gray-900 dark:text-gray-100">
                      Restore Selected Services
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
                      Restore {selectedServices.size} selected service
                      {selectedServices.size > 1 ? "s" : ""}?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={createBulkHandler(
                        batchRestoreServices,
                        "services restored"
                      )}
                      className="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white"
                    >
                      Restore All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedServices(new Set())}
                disabled={isSubmitting}
                className="text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={toggleSelectAll}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200"
        >
          {selectedServices.size === services.length ? (
            <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          ) : (
            <Square className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          )}
          Select all {services.length} service{services.length > 1 ? "s" : ""}
        </Button>

        {pagination && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Showing {(pagination.currentPage - 1) * limit + 1} to{" "}
            {Math.min(pagination.currentPage * limit, pagination.totalItems)} of{" "}
            {pagination.totalItems} services
          </span>
        )}
      </div>

      {services.length === 0 ? (
        <EmptyState
          message="Try adjusting your filters or creating a new service."
          showSearch={showSearch}
          searchPlaceholder={searchPlaceholder}
        />
      ) : (
        <div
          className={
            viewMode === "list"
              ? "space-y-3"
              : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          }
        >
          {services.map((service) => (
            <ServiceCard
              key={service._id.toString()}
              service={{
                ...service,
                _id: service._id.toString(),
                createdAt:
                  service.createdAt instanceof Date
                    ? service.createdAt.toISOString()
                    : service.createdAt,
                updatedAt:
                  service.updatedAt instanceof Date
                    ? service.updatedAt.toISOString()
                    : service.updatedAt,
                submittedBy: service.submittedBy
                  ? typeof service.submittedBy === "object" &&
                    service.submittedBy !== null
                    ? {
                        ...service.submittedBy,
                        _id:
                          typeof service.submittedBy._id === "object"
                            ? service.submittedBy._id.toString()
                            : service.submittedBy._id,
                      }
                    : service.submittedBy
                  : undefined,
              }}
              isSelected={isServiceSelected(service._id.toString())}
              onToggleSelect={() =>
                toggleServiceSelection(service._id.toString())
              }
              getServiceStatusColor={getServiceStatusColor}
              getServiceStatusLabel={getServiceStatusLabel}
              canPerformAdminAction={canPerformAdminAction}
              getServicePriorityLevel={getServicePriorityLevel}
              approveService={approveService}
              rejectService={rejectService}
              restoreService={restoreService}
              togglePopular={togglePopular}
              setServiceToDelete={setServiceToDelete}
              setServiceToReject={setServiceToReject}
              refreshAfterAction={refreshAfterAction}
              viewMode={viewMode === "grid" ? "compact" : "detailed"}
            />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Page {pagination.currentPage} of {pagination.totalPages} (
            {pagination.totalItems} total services)
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() =>
                getAllServicesAdmin({
                  ...apiParams,
                  page: pagination.currentPage - 1,
                })
              }
              disabled={!pagination.hasPrevPage || isLoading || isSubmitting}
              variant="outline"
              size="sm"
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>

            {Array.from(
              { length: Math.min(5, pagination.totalPages) },
              (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.currentPage <= 3) {
                  pageNum = i + 1;
                } else if (
                  pagination.currentPage >=
                  pagination.totalPages - 2
                ) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    onClick={() =>
                      getAllServicesAdmin({ ...apiParams, page: pageNum })
                    }
                    disabled={isLoading || isSubmitting}
                    variant={
                      pageNum === pagination.currentPage ? "default" : "outline"
                    }
                    size="sm"
                    className={cn(
                      "w-10 h-8",
                      pageNum === pagination.currentPage
                        ? "bg-blue-600 dark:bg-blue-500 text-white"
                        : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                  >
                    {pageNum}
                  </Button>
                );
              }
            )}

            <Button
              onClick={() =>
                getAllServicesAdmin({
                  ...apiParams,
                  page: pagination.currentPage + 1,
                })
              }
              disabled={!pagination.hasNextPage || isLoading || isSubmitting}
              variant="outline"
              size="sm"
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog
        open={!!serviceToReject}
        onOpenChange={() => {
          setServiceToReject(null);
          setRejectReason("");
        }}
      >
        <AlertDialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-gray-100">
              Reject Service
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
              Provide a reason for rejecting &quot;
              {serviceToReject?.service.title}&quot;. This will help the service
              owner understand what needs to be improved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter rejection reason (optional but recommended)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!serviceToReject) return;
                await handleSimpleAction(
                  () =>
                    rejectService(
                      serviceToReject.service._id.toString(),
                      rejectReason || "Rejected by admin"
                    ),
                  `"${serviceToReject.service.title}" rejected`,
                  "Failed to reject service"
                );
                setServiceToReject(null);
                setRejectReason("");
              }}
              className="bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600 text-white"
            >
              Reject Service
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!serviceToDelete}
        onOpenChange={() => setServiceToDelete(null)}
      >
        <AlertDialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-gray-100">
              Delete Service
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
              Permanently delete &quot;{serviceToDelete?.title}&quot;? This
              action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!serviceToDelete) return;
                await handleSimpleAction(
                  () =>
                    deleteServicePermanently(serviceToDelete._id.toString()),
                  `"${serviceToDelete.title}" deleted successfully`,
                  "Failed to delete service"
                );
                setServiceToDelete(null);
                setSelectedServices((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(serviceToDelete._id.toString());
                  return newSet;
                });
              }}
              className="bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600 text-white"
            >
              Continue Deleting
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminServiceList;
