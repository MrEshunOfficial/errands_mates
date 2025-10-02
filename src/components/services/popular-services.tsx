"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useUserService } from "@/hooks/public/services/use-service";
import {
  Loader2,
  TrendingUp,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Service } from "@/types/service.types";
import ServiceCard, { ServiceWithProviders } from "./service-card";
import { useRouter } from "next/navigation";

interface PopularServicesProps {
  limit?: number;
  title?: string;
  showTitle?: boolean;
  className?: string;
  variant?: "default" | "compact" | "featured";
  showActions?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onServiceContact?: (service: Service) => void;
  onServiceFavorite?: (service: Service) => void;
  showHeader?: boolean;
  showViewAllButton?: boolean;
  onViewAll?: () => void;
  onServiceClick?: (service: Service | ServiceWithProviders) => void;
}

export default function PopularServices({
  limit = 6,
  title = "Popular Services",
  showTitle = true,
  className = "",
  variant = "default",
  showActions = true,
  autoRefresh = false,
  refreshInterval = 300000,
  showHeader = true,
  showViewAllButton = true,
  onViewAll,
  onServiceClick,
}: PopularServicesProps) {
  const { popularServices, getPopularServices, isLoading, error } =
    useUserService();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const router = useRouter();
  // Fetch popular services
  const fetchServices = useCallback(
    async (showRefreshIndicator = false) => {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      }

      try {
        await getPopularServices(limit);
        setLastUpdated(new Date());
      } catch (err) {
        console.error("Error fetching popular services:", err);
      } finally {
        if (showRefreshIndicator) {
          setIsRefreshing(false);
        }
      }
    },
    [getPopularServices, limit]
  );

  // Initial fetch
  useEffect(() => {
    fetchServices();
  }, [fetchServices, limit]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchServices(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, limit, fetchServices]);

  // Manual refresh handler
  const handleRefresh = () => {
    fetchServices(true);
  };

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

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Loading state
  if (isLoading && !popularServices?.length) {
    return (
      <div className={`${className} animate-fade-in`}>
        {showHeader && showTitle && (
          <div className="mb-8">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-48 animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-72 animate-pulse"></div>
          </div>
        )}
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400" />
            <div className="absolute inset-0 rounded-full border-2 border-blue-100 dark:border-blue-900 animate-pulse"></div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Loading Popular Services
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Discovering trending services just for you...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`${className} animate-fade-in`}>
        {showHeader && showTitle && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <TrendingUp className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {title}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Error loading services
                </p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span>Retry</span>
            </button>
          </div>
        )}
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-800">
          <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
            <TrendingUp className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
              Unable to Load Popular Services
            </h3>
            <p className="text-red-700 dark:text-red-300 max-w-md">{error}</p>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors duration-200"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                  Retrying...
                </>
              ) : (
                "Try Again"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!popularServices || popularServices.length === 0) {
    return (
      <div className={`${className} animate-fade-in`}>
        {showHeader && showTitle && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Sparkles className="h-6 w-6 text-gray-400 dark:text-gray-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {title}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No services available
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full">
            <Sparkles className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              No Popular Services Yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              Popular services will appear here as users engage with them. Check
              back later!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} animate-fade-in`}>
      {/* Enhanced Header */}
      {showHeader && showTitle && (
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 mb-8">
          {/* Left: Title & info */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg shadow-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                {title}
              </h2>
              <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
                <span>
                  {popularServices.length} service
                  {popularServices.length !== 1 ? "s" : ""} trending now
                </span>
                {lastUpdated && (
                  <>
                    <span>•</span>
                    <span>Updated {formatLastUpdated(lastUpdated)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Middle: Popularity bullets */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-300">
            <div className="flex items-start gap-1">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1 flex-shrink-0" />
              <span>High customer satisfaction ratings</span>
            </div>
            <div className="flex items-start gap-1">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1 flex-shrink-0" />
              <span>Frequently booked and recommended</span>
            </div>
            <div className="flex items-start gap-1">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1 flex-shrink-0" />
              <span>Trusted service providers</span>
            </div>
          </div>

          {/* Right: Action buttons */}
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-all duration-200 disabled:opacity-50 group"
              title="Refresh services"
            >
              <RefreshCw
                className={`h-4 w-4 text-gray-600 dark:text-gray-400 transition-transform ${
                  isRefreshing ? "animate-spin" : "group-hover:rotate-180"
                }`}
              />
            </button>

            {showViewAllButton && onViewAll && (
              <button
                onClick={onViewAll}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 group"
              >
                <span className="font-medium">View All</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {popularServices.map((service, index) => (
          <div
            key={service._id.toString()}
            className="animate-fade-in"
            style={{
              animationDelay: `${index * 100}ms`,
              animationFillMode: "both",
            }}
          >
            <ServiceCard
              service={service}
              variant={variant}
              showActions={showActions}
              onView={handleView}
              onContact={handleContact}
              className="h-full"
            />
          </div>
        ))}
      </div>

      {/* Loading Overlay for Refresh */}
      {isRefreshing && popularServices.length > 0 && (
        <div className="fixed top-4 right-4 z-50 flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg animate-fade-in">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">Refreshing...</span>
        </div>
      )}
    </div>
  );
}
