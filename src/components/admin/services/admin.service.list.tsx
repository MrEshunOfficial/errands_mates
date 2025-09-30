"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ServiceStatus } from "@/types/base.types";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Plus,
  Trash2,
  RotateCcw,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Star,
  X,
  Loader2,
  Check,
  Users,
  MoreHorizontal,
  Calendar,
  User,
  Tag,
  Info,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAdminService } from "@/hooks/admin/admin.service.hook";
import Image from "next/image";
import { Service } from "@/types";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface SubmittedBy {
  _id: string;
  name?: string;
  email?: string;
  serviceUserId?: string;
}

type ServiceFilter = ServiceStatus | "all";

interface AdminServiceTableProps {
  limit?: number;
  showSearch?: boolean;
  searchPlaceholder?: string;
  className?: string;
  defaultFilter?: ServiceFilter;
  autoFetch?: boolean;
}

const AdminServiceTable: React.FC<AdminServiceTableProps> = ({
  limit = 20,
  showSearch = true,
  searchPlaceholder = "Search services...",
  className,
  defaultFilter = "all",
  autoFetch = true,
}) => {
  const router = useRouter();
  const [selectedServices, setSelectedServices] = useState<Set<string>>(
    new Set()
  );
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [serviceToReject, setServiceToReject] = useState<{
    service: Service;
    reason?: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [serviceFilter, setServiceFilter] =
    useState<ServiceFilter>(defaultFilter);

  // Loading states
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
    refreshAllServices,
  } = useAdminService({
    autoFetchAll: autoFetch,
    autoFetchStats: autoFetch,
  });

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

  const refreshAfterAction = useCallback(async () => {
    await refreshAllServices();
    await getServiceStatistics();
  }, [refreshAllServices, getServiceStatistics]);

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
        toast.error(`Failed to load services: ${String(err)}`);
      } finally {
        if (showLoading) {
          setIsFilterLoading(false);
        }
      }
    },
    [getAllServicesAdmin, apiParams]
  );

  useEffect(() => {
    if (!autoFetch || !isInitialized) return;
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
    },
    [serviceFilter]
  );

  const handleRefresh = useCallback(async (): Promise<void> => {
    setIsRefreshLoading(true);
    try {
      await refreshAfterAction();
      toast.success("Services refreshed successfully");
    } catch (err) {
      toast.error(`Failed to refresh: ${String(err)}`);
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

  // Individual action handlers
  const handleServiceApprove = useCallback(
    async (service: Service) => {
      await handleSimpleAction(
        () => approveService(service._id.toString()),
        `"${service.title}" approved`,
        "Failed to approve service"
      );
    },
    [approveService, handleSimpleAction]
  );

  const handleServiceReject = useCallback(
    async (service: Service, reason?: string) => {
      if (!reason) {
        setServiceToReject({ service });
        return;
      }
      await handleSimpleAction(
        () => rejectService(service._id.toString(), reason),
        `"${service.title}" rejected`,
        "Failed to reject service"
      );
    },
    [rejectService, handleSimpleAction]
  );

  const handleServiceRestore = useCallback(
    async (service: Service) => {
      await handleSimpleAction(
        () => restoreService(service._id.toString()),
        `"${service.title}" restored`,
        "Failed to restore service"
      );
    },
    [restoreService, handleSimpleAction]
  );

  const handleTogglePopular = useCallback(
    async (service: Service) => {
      const action = service.isPopular
        ? "unmarked as popular"
        : "marked as popular";
      await handleSimpleAction(
        () => togglePopular(service._id.toString()),
        `"${service.title}" ${action}`,
        "Failed to toggle popular status"
      );
    },
    [togglePopular, handleSimpleAction]
  );

  // Todo: implement modal to view providers
  const handleProviderViewModal = () => {
    window.alert("show provider modal");
  };
  const handleMoreInfoModalView = () => {
    window.alert("show provider modal");
  };

  // Utility functions
  const getCategoryName = (category?: string | Category): string => {
    if (!category) return "";
    if (typeof category === "string") return category;
    return category.name || category.slug || String(category._id);
  };

  const getSubmittedByName = (submittedBy?: string | SubmittedBy): string => {
    if (!submittedBy) return "Unknown";
    if (typeof submittedBy === "string") return `User ${submittedBy}`;
    return (
      submittedBy.name ||
      submittedBy.serviceUserId ||
      `User ${submittedBy._id}` ||
      "Unknown"
    );
  };

  const getSubmittedById = (submittedBy?: string | SubmittedBy): string => {
    if (!submittedBy) return "";
    if (typeof submittedBy === "string") return submittedBy;
    return submittedBy._id;
  };

  // Service Actions Dropdown
  const ServiceActionsDropdown: React.FC<{ service: Service }> = ({
    service,
  }) => {
    const status = service.status;
    const isPending = status === ServiceStatus.PENDING_APPROVAL;
    const isRejected = status === ServiceStatus.REJECTED;
    const isApproved = status === ServiceStatus.APPROVED;
    const isSuspended = status === ServiceStatus.SUSPENDED;

    //TODO: implement service activation feature
    // const isInactive = status === ServiceStatus.ACTIVATE;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleMoreInfoModalView}
            className="cursor-pointer"
          >
            <Info className="mr-2 h-4 w-4" />
            See more
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleProviderViewModal}
            className="cursor-pointer"
          >
            <Users className="mr-2 h-4 w-4" />
            View Providers ({service.providerCount})
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {isPending && (
            <>
              <DropdownMenuItem
                onClick={() => handleServiceApprove(service)}
                className="cursor-pointer text-green-700 dark:text-green-400"
              >
                <Check className="mr-2 h-4 w-4" />
                Approve Service
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleServiceReject(service)}
                className="cursor-pointer text-red-700 dark:text-red-400"
              >
                <X className="mr-2 h-4 w-4" />
                Reject Service
              </DropdownMenuItem>
            </>
          )}
          {isApproved && (
            <>
              <DropdownMenuItem
                onClick={() => handleServiceReject(service)}
                className="cursor-pointer text-orange-600 dark:text-orange-400"
              >
                <X className="mr-2 h-4 w-4" />
                Suspend Service
              </DropdownMenuItem>
            </>
          )}

          {isRejected && (
            <DropdownMenuItem
              onClick={() => handleServiceRestore(service)}
              className="cursor-pointer text-blue-700 dark:text-blue-400"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Re-Approve
            </DropdownMenuItem>
          )}
          {isSuspended && (
            <DropdownMenuItem
              onClick={() => handleServiceRestore(service)}
              className="cursor-pointer text-blue-700 dark:text-blue-400"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Re-Approve
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => handleTogglePopular(service)}
            className="cursor-pointer"
          >
            {service.isPopular ? (
              <>
                <Star className="mr-2 h-4 w-4 fill-current" />
                Remove from Popular
              </>
            ) : (
              <>
                <Star className="mr-2 h-4 w-4" />
                Mark as Popular
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {service.isDeleted ? (
            <DropdownMenuItem
              onClick={() => handleServiceRestore(service)}
              className="cursor-pointer text-blue-700 dark:text-blue-400"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Restore Service
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => setServiceToDelete(service)}
              className="cursor-pointer text-red-700 dark:text-red-400"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Service
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  if (isLoading && (!isInitialized || services.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-[90vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <div className="text-sm text-muted-foreground">
          {!isInitialized ? "Initializing..." : "Loading services..."}
        </div>
      </div>
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
    <div className={cn("space-y-6", className)}>
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {showSearch && (
          <div className="flex-1 max-w-md">
            <Input
              type="text"
              placeholder={searchPlaceholder}
              onChange={handleSearchChange}
              className="w-full"
              disabled={isLoading || isSubmitting}
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <Select value={serviceFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              {(["all", ...Object.values(ServiceStatus)] as const).map(
                (filter) => (
                  <SelectItem key={filter} value={filter}>
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
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>

          <Button
            onClick={() => router.push("/service-offered/create")}
            disabled={isSubmitting}
          >
            <Plus size={"icon"} />
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
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
                className="text-green-700 border-green-300 hover:bg-green-50"
              >
                <CheckSquare className="w-4 h-4 mr-1" />
                Approve
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={createBulkHandler(
                  (ids) => batchRejectServices(ids, "Bulk rejected by admin"),
                  "services rejected"
                )}
                disabled={isSubmitting || !selectedServices.size}
                className="text-red-700 border-red-300 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-1" />
                Reject
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={createBulkHandler(
                  batchRestoreServices,
                  "services restored"
                )}
                disabled={isSubmitting || !selectedServices.size}
                className="text-blue-700 border-blue-300 hover:bg-blue-50"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Restore
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting || !selectedServices.size}
                    className="text-red-700 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </AlertDialogTrigger>

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete Selected Services
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Permanently delete {selectedServices.size} selected
                      service
                      {selectedServices.size > 1 ? "s" : ""}? This action cannot
                      be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={createBulkHandler(
                        batchDeleteServices,
                        "services deleted"
                      )}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Delete All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedServices(new Set())}
                disabled={isSubmitting}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Services Table */}
      {!isLoading && isInitialized && services.length === 0 ? (
        <EmptyState message="No services found. Try adjusting your filters or creating a new service." />
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      services.length === 0
                        ? false
                        : selectedServices.size === services.length
                        ? true
                        : selectedServices.size > 0
                        ? "indeterminate"
                        : false
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Providers</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => {
                const serviceId = service._id.toString();
                const isSelected = selectedServices.has(serviceId);
                const statusColor = getServiceStatusColor(service.status);
                const statusLabel = getServiceStatusLabel(service.status);
                const categoryName = getCategoryName(service.category);
                const submittedByName = getSubmittedByName(service.submittedBy);
                const submittedById = getSubmittedById(service.submittedBy);

                return (
                  <TableRow
                    key={serviceId}
                    className={cn(
                      "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800",
                      isSelected && "bg-blue-50 dark:bg-blue-900/20"
                    )}
                    // onClick={() => router.push(`/admin/services/${serviceId}`)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() =>
                          toggleServiceSelection(serviceId)
                        }
                      />
                    </TableCell>

                    <TableCell>
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={
                            service.images?.[0]?.url ||
                            "/placeholder-service-image.jpg"
                          }
                          alt={service.title}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/placeholder-service-image.jpg";
                          }}
                        />
                      </div>
                    </TableCell>

                    <TableCell className="max-w-xs">
                      <div className="space-y-1">
                        <div className="font-medium truncate capitalize">
                          {service.title}
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-2">
                          {service.description}
                        </div>
                        <div className="flex items-center gap-2">
                          {service.isPopular && (
                            <Badge className="text-xs bg-yellow-100 text-yellow-800">
                              <Star className="w-3 h-3 mr-1 fill-current" />
                              Popular
                            </Badge>
                          )}
                          {service.tags?.slice(0, 2).map((tag, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {service.tags && service.tags.length > 2 && (
                            <span className="text-xs text-gray-400">
                              +{service.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("border font-medium", {
                          "border-green-300 text-green-700 bg-green-50":
                            statusColor === "green",
                          "border-yellow-300 text-yellow-700 bg-yellow-50":
                            statusColor === "yellow",
                          "border-red-300 text-red-700 bg-red-50":
                            statusColor === "red",
                          "border-orange-300 text-orange-700 bg-orange-50":
                            statusColor === "orange",
                          "border-gray-300 text-gray-700 bg-gray-50":
                            statusColor === "gray",
                        })}
                      >
                        {statusLabel}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600 capitalize">
                        {categoryName && (
                          <>
                            <Tag className="w-3 h-3" />
                            {categoryName}
                          </>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <User className="w-3 h-3" />
                        {submittedById ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/users/${submittedById}`);
                            }}
                            className="text-blue-600 hover:underline capitalize"
                          >
                            {submittedByName}
                          </button>
                        ) : (
                          <span className="text-gray-500 capitalize">
                            {submittedByName}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-3 h-3" />
                        {formatDate(service.createdAt)}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Users className="w-3 h-3" />
                        {service.providerCount}
                      </div>
                    </TableCell>

                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <ServiceActionsDropdown service={service} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {(pagination.currentPage - 1) * limit + 1} to{" "}
            {Math.min(pagination.currentPage * limit, pagination.totalItems)} of{" "}
            {pagination.totalItems} services
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
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>

            <span className="text-sm text-gray-600">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>

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
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      <AlertDialog
        open={!!serviceToReject}
        onOpenChange={() => {
          setServiceToReject(null);
          setRejectReason("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Service</AlertDialogTitle>
            <AlertDialogDescription>
              Provide a reason for rejecting &quot;
              {serviceToReject?.service.title}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter rejection reason (optional but recommended)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!serviceToReject) return;
                await handleServiceReject(
                  serviceToReject.service,
                  rejectReason || "Rejected by admin"
                );
                setServiceToReject(null);
                setRejectReason("");
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Reject Service
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog
        open={!!serviceToDelete}
        onOpenChange={() => setServiceToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete &quot;{serviceToDelete?.title}&quot;? This
              action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Service
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminServiceTable;
