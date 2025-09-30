"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Plus,
  Filter,
  Search,
  BarChart3,
  RefreshCw,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  Eye,
  Edit,
  Trash2,
  FileImage,
  MoreVertical,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useUserService } from "@/hooks/public/services/use-service";
import { ServiceStatus } from "@/types/base.types";
import type { Service } from "@/types/service.types";
import type { UserServiceSearchParams } from "@/lib/api/services/services.api";
import ServiceCard from "@/components/public/services/service-card";
import { Button } from "@/components/ui/button";

type ViewMode = "grid" | "list";
type SortOrder = "asc" | "desc";
type SortField = "title" | "createdAt" | "updatedAt" | "status";

interface FilterOptions {
  status: ServiceStatus | "all";
  search: string;
  sortField: SortField;
  sortOrder: SortOrder;
}

export default function EnhancedUserServiceList() {
  const router = useRouter();

  // State management
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    status: "all",
    search: "",
    sortField: "createdAt",
    sortOrder: "desc",
  });
  const [selectedServices, setSelectedServices] = useState<Set<string>>(
    new Set()
  );
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  // Hook usage
  const {
    userServices,
    userServicesSummary,
    isLoading,
    error,
    pagination,
    getUserServices,
    getUserServicesByStatus,
    getUserDraftServices,
    getUserPendingServices,
    getUserApprovedServices,
    getUserRejectedServices,
    deleteService,
    uploadServiceImages,
    refreshUserServices,
    clearError,
    getServiceStatusColor,
    getServiceStatusLabel,
    canEditService,
  } = useUserService();

  // Filtered and sorted services
  const filteredServices = useMemo(() => {
    let filtered = [...userServices];

    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(
        (service) =>
          service.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          service.description
            ?.toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          service.tags?.some((tag) =>
            tag.toLowerCase().includes(filters.search.toLowerCase())
          )
      );
    }

    // Apply status filter
    if (filters.status !== "all") {
      filtered = filtered.filter(
        (service) => service.status === filters.status
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: unknown, bValue: unknown;

      switch (filters.sortField) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case "updatedAt":
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return filters.sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [userServices, filters]);

  // Handle service actions
  const handleView = useCallback(
    (service: Service) => {
      const serviceId =
        typeof service._id === "string" ? service._id : service._id.toString();
      router.push(`/services/${service.slug || serviceId}`);
    },
    [router]
  );

  const handleEdit = useCallback(
    (service: Service) => {
      const serviceId =
        typeof service._id === "string" ? service._id : service._id.toString();
      router.push(`/service-offered/edit/${serviceId}`);
    },
    [router]
  );

  const handleContact = useCallback(
    (service: Service) => {
      const serviceId =
        typeof service._id === "string" ? service._id : service._id.toString();
      router.push(`/services/${service.slug || serviceId}/providers`);
    },
    [router]
  );

  const handleDelete = useCallback(
    async (service: Service) => {
      if (
        !confirm(
          "Are you sure you want to delete this service? This action cannot be undone."
        )
      ) {
        return;
      }

      try {
        const serviceId =
          typeof service._id === "string"
            ? service._id
            : service._id.toString();
        await deleteService(serviceId);
      } catch (error) {
        console.error("Failed to delete service:", error);
      }
    },
    [deleteService]
  );

  const handleImageUpload = useCallback(
    async (service: Service, files: FileList) => {
      try {
        const serviceId =
          typeof service._id === "string"
            ? service._id
            : service._id.toString();
        const formData = new FormData();

        Array.from(files).forEach((file) => {
          formData.append("images", file);
        });

        await uploadServiceImages(serviceId, formData as any);
        await refreshUserServices();
      } catch (error) {
        console.error("Failed to upload images:", error);
      }
    },
    [uploadServiceImages, refreshUserServices]
  );

  // Filter handlers
  const handleStatusFilter = useCallback(
    async (status: ServiceStatus | "all") => {
      setFilters((prev) => ({ ...prev, status }));

      if (status === "all") {
        await getUserServices();
      } else {
        await getUserServicesByStatus(status);
      }
    },
    [getUserServices, getUserServicesByStatus]
  );

  const handleSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  }, []);

  const handleSort = useCallback((field: SortField) => {
    setFilters((prev) => ({
      ...prev,
      sortField: field,
      sortOrder:
        prev.sortField === field && prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  }, []);

  // Quick filter actions
  const loadDrafts = useCallback(
    () => getUserDraftServices(),
    [getUserDraftServices]
  );
  const loadPending = useCallback(
    () => getUserPendingServices(),
    [getUserPendingServices]
  );
  const loadApproved = useCallback(
    () => getUserApprovedServices(),
    [getUserApprovedServices]
  );
  const loadRejected = useCallback(
    () => getUserRejectedServices(),
    [getUserRejectedServices]
  );

  // Bulk actions
  const handleSelectAll = useCallback(() => {
    if (selectedServices.size === filteredServices.length) {
      setSelectedServices(new Set());
    } else {
      const allIds = filteredServices.map((service) =>
        typeof service._id === "string" ? service._id : service._id.toString()
      );
      setSelectedServices(new Set(allIds));
    }
  }, [filteredServices, selectedServices.size]);

  const handleServiceSelect = useCallback(
    (serviceId: string) => {
      const newSelected = new Set(selectedServices);
      if (newSelected.has(serviceId)) {
        newSelected.delete(serviceId);
      } else {
        newSelected.add(serviceId);
      }
      setSelectedServices(newSelected);
    },
    [selectedServices]
  );

  // Handle pagination
  const handlePageChange = useCallback(
    (page: number) => {
      const params: UserServiceSearchParams = {
        page,
        ...(filters.status !== "all" && { status: filters.status }),
      };
      getUserServices(params);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [filters.status, getUserServices]
  );

  // Retry on error
  const handleRetry = useCallback(() => {
    clearError();
    refreshUserServices();
  }, [clearError, refreshUserServices]);

  // Initial load
  useEffect(() => {
    getUserServices({});
  }, [getUserServices]);

  // Loading state
  if (isLoading && userServices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Loading your services...
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return <ErrorState message={error} onRetry={handleRetry} />;
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            My Services
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and track your registered services
          </p>
        </div>

        {/* Summary Cards */}
        {userServicesSummary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {userServicesSummary.totalServices}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            {Object.entries(userServicesSummary.statusCounts).map(
              ([status, count]) => (
                <div
                  key={status}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {getServiceStatusLabel(status as ServiceStatus)}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {count}
                      </p>
                    </div>
                    <div
                      className={`h-3 w-3 rounded-full bg-${getServiceStatusColor(
                        status as ServiceStatus
                      )}-500`}
                    />
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
          {/* Left side - Create button and filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={() => router.push("/service-offered/create")}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Create Service
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter size={16} />
              Filters
            </Button>

            <Button
              variant="outline"
              onClick={refreshUserServices}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw
                size={16}
                className={isLoading ? "animate-spin" : ""}
              />
              Refresh
            </Button>
          </div>

          {/* Right side - View controls and search */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search services..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* View mode toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <Grid3X3 size={16} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "list"
                    ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    handleStatusFilter(e.target.value as ServiceStatus | "all")
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  {Object.values(ServiceStatus).map((status) => (
                    <option key={status} value={status}>
                      {getServiceStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort by
                </label>
                <select
                  value={filters.sortField}
                  onChange={(e) => handleSort(e.target.value as SortField)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="createdAt">Date Created</option>
                  <option value="updatedAt">Last Modified</option>
                  <option value="title">Title</option>
                  <option value="status">Status</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Order
                </label>
                <button
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
                    }))
                  }
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  {filters.sortOrder === "asc" ? (
                    <SortAsc size={16} />
                  ) : (
                    <SortDesc size={16} />
                  )}
                  {filters.sortOrder === "asc" ? "Ascending" : "Descending"}
                </button>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quick Filters:
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={loadDrafts}>
                  Draft Services
                </Button>
                <Button variant="outline" size="sm" onClick={loadPending}>
                  Pending Approval
                </Button>
                <Button variant="outline" size="sm" onClick={loadApproved}>
                  Live Services
                </Button>
                <Button variant="outline" size="sm" onClick={loadRejected}>
                  Rejected Services
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedServices.size > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedServices.size} service(s) selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedServices(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!error && !isLoading && filteredServices.length === 0 && (
          <EmptyState
            message={
              filters.search || filters.status !== "all"
                ? "No services match your current filters."
                : "You haven't created any services yet."
            }
          />
        )}

        {/* Services Display */}
        {filteredServices.length > 0 && (
          <>
            {/* Selection Controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedServices.size === filteredServices.length}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Select all ({filteredServices.length})
                </span>
              </div>

              <span className="text-sm text-gray-500 dark:text-gray-400">
                Showing {filteredServices.length} of {userServices.length}{" "}
                services
              </span>
            </div>

            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {filteredServices.map((service) => {
                  const serviceId =
                    typeof service._id === "string"
                      ? service._id
                      : service._id.toString();
                  const isSelected = selectedServices.has(serviceId);

                  return (
                    <div key={serviceId} className="relative group">
                      {/* Selection checkbox */}
                      <div className="absolute top-2 left-2 z-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleServiceSelect(serviceId)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white/90 backdrop-blur-sm"
                        />
                      </div>

                      {/* Action menu */}
                      <div className="absolute top-2 right-2 z-10">
                        <div className="relative">
                          <button
                            onClick={() =>
                              setActionMenuOpen(
                                actionMenuOpen === serviceId ? null : serviceId
                              )
                            }
                            className="p-1 rounded-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {actionMenuOpen === serviceId && (
                            <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[150px] z-20">
                              <button
                                onClick={() => {
                                  handleView(service);
                                  setActionMenuOpen(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <Eye size={14} />
                                View
                              </button>

                              {canEditService(service, "current-user-id") && (
                                <button
                                  onClick={() => {
                                    handleEdit(service);
                                    setActionMenuOpen(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                  <Edit size={14} />
                                  Edit
                                </button>
                              )}

                              <label className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer">
                                <FileImage size={14} />
                                Add Images
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files) {
                                      handleImageUpload(
                                        service,
                                        e.target.files
                                      );
                                    }
                                    setActionMenuOpen(null);
                                  }}
                                />
                              </label>

                              <button
                                onClick={() => {
                                  handleDelete(service);
                                  setActionMenuOpen(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2"
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <ServiceCard
                        service={service}
                        variant="default"
                        onView={handleView}
                        onContact={handleContact}
                        className={`h-full border transition-all duration-200 ${
                          isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* List View */}
            {viewMode === "list" && (
              <div className="space-y-4 mb-8">
                {filteredServices.map((service) => {
                  const serviceId =
                    typeof service._id === "string"
                      ? service._id
                      : service._id.toString();
                  const isSelected = selectedServices.has(serviceId);

                  return (
                    <div
                      key={serviceId}
                      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 transition-all duration-200 ${
                        isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleServiceSelect(serviceId)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                              {service.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {service.category?.name}
                            </p>
                          </div>

                          <div>
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                                service.status === ServiceStatus.APPROVED
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : service.status ===
                                    ServiceStatus.PENDING_APPROVAL
                                  ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                  : "bg-gray-50 text-gray-700 border-gray-200"
                              }`}
                            >
                              {getServiceStatusLabel(service.status)}
                            </span>
                          </div>

                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(service.updatedAt).toLocaleDateString()}
                          </div>

                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleView(service)}
                            >
                              <Eye size={14} />
                            </Button>
                            {canEditService(service, "current-user-id") && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(service)}
                              >
                                <Edit size={14} />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(service)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage || isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            <div className="flex space-x-1">
              {Array.from(
                { length: Math.min(5, pagination.totalPages) },
                (_, i) => {
                  const page = i + 1;
                  const isCurrentPage = page === pagination.currentPage;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      disabled={isLoading}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                        isCurrentPage
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      {page}
                    </button>
                  );
                }
              )}
            </div>

            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage || isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-unavailable transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Click outside handler for action menu */}
      {actionMenuOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setActionMenuOpen(null)}
        />
      )}
    </div>
  );
}
