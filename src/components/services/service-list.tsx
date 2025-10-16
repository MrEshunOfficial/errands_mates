"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useUserService } from "@/hooks/public/services/use-service";
import ServiceCard from "./service-card";
import type { Service } from "@/types/service.types";
import type { ServiceSearchParams } from "@/lib/api/services/services.api";
import { useCategories } from "@/hooks/public/categories/userCategory.hook";
import ServiceFilterBar from "./ServiceFilterBar";
import { Skeleton } from "@/components/ui/skeleton";
import { ProviderProfile } from "@/types/provider-profile.types";

type SortOption = "createdAt" | "title" | "basePrice" | "updatedAt" | "";

interface FilterState {
  search: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  sortBy: SortOption;
}

type ServiceCardVariant = "default" | "compact" | "featured";

interface ServiceWithProviders extends Omit<Service, "providers"> {
  providers?: ProviderProfile[];
}

interface PublicServiceListProps {
  showHeader?: boolean;
  showFilters?: boolean;
  showPagination?: boolean;
  showResultsSummary?: boolean;
  title?: string;
  subtitle?: string;
  emptyStateMessage?: string;
  loadingMessage?: string;
  gridCols?: {
    default?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  maxItems?: number;
  initialFilters?: Partial<ServiceSearchParams>;
  onServiceClick?: (service: Service | ServiceWithProviders) => void;
  containerClassName?: string;
  cardVariant?: ServiceCardVariant;
}

const initialFilterState: FilterState = {
  search: "",
  category: "",
  minPrice: "",
  maxPrice: "",
  sortBy: "",
};

// Loading Skeleton Component
interface ServiceCardSkeletonProps {
  count?: number;
  gridCols?: {
    default?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

function ServiceCardSkeleton({
  count = 8,
  gridCols = {
    default: 1,
    md: 2,
    lg: 3,
    xl: 5,
  },
}: ServiceCardSkeletonProps) {
  const getGridColsClass = () => {
    const classes = [];
    if (gridCols.default) classes.push(`grid-cols-${gridCols.default}`);
    if (gridCols.md) classes.push(`md:grid-cols-${gridCols.md}`);
    if (gridCols.lg) classes.push(`lg:grid-cols-${gridCols.lg}`);
    if (gridCols.xl) classes.push(`xl:grid-cols-${gridCols.xl}`);
    return classes.join(" ");
  };

  return (
    <div className={`grid gap-3 ${getGridColsClass()}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="border rounded-lg p-4 space-y-3 h-full">
          {/* Image skeleton */}
          <Skeleton className="w-full h-48 rounded-lg" />

          {/* Title skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>

          {/* Description skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/5" />
          </div>

          {/* Footer skeleton */}
          <div className="flex items-center justify-between pt-2 border-t">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PublicServiceList({
  showHeader = true,
  showFilters = true,
  showPagination = true,
  showResultsSummary = true,
  title = "Discover Services",
  subtitle = "Find the perfect service for your needs",
  emptyStateMessage,
  maxItems,
  initialFilters,
  onServiceClick,
  containerClassName = "w-full min-h-screen bg-gray-50 dark:bg-gray-900 p-3",
  cardVariant = "default",
  gridCols = {
    default: 1,
    md: 2,
    lg: 3,
    xl: 5,
  },
}: PublicServiceListProps = {}) {
  const router = useRouter();

  const memoizedInitialFilters = useMemo(
    () => initialFilters || {},
    [initialFilters]
  );

  const [filterState, setFilterState] =
    useState<FilterState>(initialFilterState);
  const [appliedFilters, setAppliedFilters] = useState<ServiceSearchParams>(
    memoizedInitialFilters
  );
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  const { services, getAllServices, isLoading, error, pagination, clearError } =
    useUserService();
  const { categories } = useCategories(
    { includeInactive: false },
    { includeServices: false }
  );

  const displayedServices = useMemo(() => {
    if (maxItems && services.length > maxItems) {
      return services.slice(0, maxItems);
    }
    return services;
  }, [services, maxItems]);

  // Determine if we should show loading skeleton
  // Show skeleton only during initial load (when loading and never loaded before)
  const shouldShowLoadingSkeleton = isLoading && !hasInitialLoad;

  const convertFiltersToParams = useCallback(
    (filters: FilterState): ServiceSearchParams => {
      const params: ServiceSearchParams = { ...memoizedInitialFilters };

      if (filters.search.trim()) params.search = filters.search.trim();
      if (filters.category) params.category = filters.category;
      if (filters.minPrice && !isNaN(parseFloat(filters.minPrice))) {
        params.minPrice = filters.minPrice;
      }
      if (filters.maxPrice && !isNaN(parseFloat(filters.maxPrice))) {
        params.maxPrice = filters.maxPrice;
      }
      if (filters.sortBy) params.sortBy = filters.sortBy;

      params.page = 1;
      return params;
    },
    [memoizedInitialFilters]
  );

  const applyFilters = useCallback(
    async (filters: FilterState, isSearchChange = false) => {
      const params = convertFiltersToParams(filters);
      setAppliedFilters(params);

      if (isSearchChange) {
        const timeoutId = setTimeout(() => {
          getAllServices(params);
        }, 300);
        return () => clearTimeout(timeoutId);
      } else {
        getAllServices(params);
      }
    },
    [convertFiltersToParams, getAllServices]
  );

  const handleFilterChange = useCallback(
    (newFilters: FilterState) => {
      setFilterState(newFilters);
      applyFilters(newFilters);
    },
    [applyFilters]
  );

  const handleSearchChange = useCallback(
    (searchTerm: string) => {
      const newFilters = { ...filterState, search: searchTerm };
      setFilterState(newFilters);
      applyFilters(newFilters, true);
    },
    [filterState, applyFilters]
  );

  const handleClearFilters = useCallback(() => {
    setFilterState(initialFilterState);
    setAppliedFilters(memoizedInitialFilters);
    getAllServices(memoizedInitialFilters);
  }, [getAllServices, memoizedInitialFilters]);

  const getServiceId = useCallback(
    (service: Service | ServiceWithProviders): string => {
      return typeof service._id === "string"
        ? service._id
        : service._id.toString();
    },
    []
  );

  const getServiceIdentifier = useCallback(
    (service: Service | ServiceWithProviders): string => {
      const serviceId = getServiceId(service);
      return service.slug || serviceId;
    },
    [getServiceId]
  );

  const handleView = useCallback(
    (service: Service | ServiceWithProviders) => {
      if (onServiceClick) {
        onServiceClick(service);
        return;
      }

      const identifier = getServiceIdentifier(service);
      router.push(`/services/${identifier}`);
    },
    [router, onServiceClick, getServiceIdentifier]
  );

  const handleContact = useCallback(
    (service: Service | ServiceWithProviders) => {
      const identifier = getServiceIdentifier(service);
      router.push(`/services/${identifier}/providers`);
    },
    [router, getServiceIdentifier]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      const params = { ...appliedFilters, page };
      setAppliedFilters(params);
      getAllServices(params);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [appliedFilters, getAllServices]
  );

  const handleRetry = useCallback(() => {
    clearError();
    getAllServices(appliedFilters);
  }, [clearError, getAllServices, appliedFilters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterState.search) count++;
    if (filterState.category) count++;
    if (filterState.minPrice || filterState.maxPrice) count++;
    if (filterState.sortBy) count++;
    return count;
  }, [filterState]);

  const hasActiveFilters = activeFilterCount > 0;

  const getEmptyStateMessage = () => {
    if (emptyStateMessage) return emptyStateMessage;
    if (hasActiveFilters)
      return "No services match your criteria. Try adjusting your filters.";
    return "No services available at the moment.";
  };

  useEffect(() => {
    const loadServices = async () => {
      await getAllServices(memoizedInitialFilters);
      setHasInitialLoad(true);
    };

    loadServices();
  }, [getAllServices, memoizedInitialFilters]);

  // Show loading skeleton during initial load
  if (shouldShowLoadingSkeleton) {
    return (
      <div className={containerClassName}>
        {showHeader && (
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{subtitle}</p>
          </div>
        )}

        {showFilters && (
          <div className="mb-3">
            <ServiceFilterBar
              filterState={filterState}
              onFilterChange={handleFilterChange}
              onSearchChange={handleSearchChange}
              onClearFilters={handleClearFilters}
              categories={categories}
              activeFilterCount={activeFilterCount}
              isLoading={isLoading}
            />
          </div>
        )}

        <ServiceCardSkeleton count={maxItems || 8} gridCols={gridCols} />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={handleRetry} />;
  }

  return (
    <div className={containerClassName}>
      {showHeader && (
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            {title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{subtitle}</p>
        </div>
      )}

      {showFilters && (
        <div className="mb-3">
          <ServiceFilterBar
            filterState={filterState}
            onFilterChange={handleFilterChange}
            onSearchChange={handleSearchChange}
            onClearFilters={handleClearFilters}
            categories={categories}
            activeFilterCount={activeFilterCount}
            isLoading={isLoading}
          />
        </div>
      )}

      {showResultsSummary && pagination && displayedServices.length > 0 && (
        <div className="flex items-center justify-between mb-3 text-sm text-gray-600 dark:text-gray-400">
          <p>
            Showing {displayedServices.length} of {pagination.totalItems}{" "}
            services
            {pagination.totalPages > 1 && (
              <span>
                {" "}
                (Page {pagination.currentPage} of {pagination.totalPages})
              </span>
            )}
          </p>
          {hasActiveFilters && (
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""}{" "}
              applied
            </span>
          )}
        </div>
      )}

      {!error && !isLoading && services.length === 0 && (
        <EmptyState message={getEmptyStateMessage()} />
      )}

      {/* Show subtle loading indicator during filter/pagination loads */}
      {isLoading && hasInitialLoad && (
        <div className="flex justify-center items-center py-4 mb-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {displayedServices.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {displayedServices.map((service) => {
            const serviceId = getServiceId(service);
            return (
              <ServiceCard
                key={serviceId}
                service={service}
                variant={cardVariant}
                onView={handleView}
                onContact={handleContact}
                className="h-full"
              />
            );
          })}
        </div>
      )}

      {showPagination &&
        pagination &&
        pagination.totalPages > 1 &&
        !maxItems && (
          <div className="flex justify-center items-center space-x-1 mt-4">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage || isLoading}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            <div className="flex space-x-0.5">
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
                      className={`px-2.5 py-1.5 text-sm font-medium rounded transition-colors disabled:opacity-50 ${
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
              className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
    </div>
  );
}
