import React from "react";
import {
  Star,
  Tag,
  Calendar,
  Users,
  ExternalLink,
  Info,
  Share2,
} from "lucide-react";
import Image from "next/image";
import { Service } from "@/types/service.types";
import { ServiceStatus } from "@/types/base.types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Link from "next/link";

// Type for provider data from API response
export interface ProviderData {
  _id: string;
  profileId?: {
    _id: string;
    profilePicture?: {
      url?: string;
      fileName?: string;
    };
  };
  providerContactInfo?: {
    businessEmail?: string;
    emergencyContact?: string;
    primaryContact?: string;
    secondaryContact?: string;
  };
  operationalStatus: string;
  serviceOfferings: string[];
  businessName?: string;
  performanceMetrics?: {
    completionRate: number;
    averageRating: number;
    totalJobs: number;
    responseTimeMinutes: number;
    averageResponseTime: number;
    cancellationRate: number;
    disputeRate: number;
    clientRetentionRate: number;
  };
}

// Extended Service type with populated providers
export interface ServiceWithProviders extends Omit<Service, "providers"> {
  providers?: ProviderData[];
}

interface ServiceCardProps {
  service: Service | ServiceWithProviders;
  variant?: "default" | "compact" | "featured";
  showActions?: boolean;
  onView?: (service: Service | ServiceWithProviders) => void;
  onContact?: (service: Service | ServiceWithProviders) => void;
  className?: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  variant = "default",
  showActions = true,
  onView,
  className = "",
}) => {
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/services/${
      service.slug || service._id
    }`;
    const shareData = {
      title: service.title,
      text: `Check out this service: ${service.title}${
        service.category ? ` - ${service.category.name}` : ""
      }`,
      url: shareUrl,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        alert("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const formatPrice = () => {
    if (service.priceRange) {
      const { min, max, currency } = service.priceRange;
      if (min === max) {
        return `${currency} ${min}`;
      }
      return `${currency} ${min}-${max}`;
    }
    if (service.basePrice) {
      return `GHS ${service.basePrice}`;
    }
    if (service.priceDescription) {
      return service.priceDescription;
    }
    return "";
  };

  const getPriceTooltip = () => {
    if (service.priceRange) {
      return "Price range based on service options";
    }
    if (service.basePrice) {
      return "Starting price for this service";
    }
    if (service.priceDescription) {
      return "Custom pricing - contact for details";
    }
    return "Pricing available upon request - contact service provider for details";
  };

  const hasPrice = () => {
    return service.priceRange || service.basePrice || service.priceDescription;
  };

  const getStatusColor = (status: ServiceStatus) => {
    switch (status) {
      case ServiceStatus.APPROVED:
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case ServiceStatus.PENDING_APPROVAL:
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case ServiceStatus.DRAFT:
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
      case ServiceStatus.REJECTED:
        return "bg-rose-500/10 text-rose-600 border-rose-500/20";
      case ServiceStatus.SUSPENDED:
        return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      case ServiceStatus.INACTIVE:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      default:
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    }
  };

  const getStatusLabel = (status: ServiceStatus) => {
    switch (status) {
      case ServiceStatus.PENDING_APPROVAL:
        return "Pending";
      case ServiceStatus.APPROVED:
        return "Live";
      case ServiceStatus.DRAFT:
        return "Draft";
      case ServiceStatus.REJECTED:
        return "Rejected";
      case ServiceStatus.SUSPENDED:
        return "Paused";
      case ServiceStatus.INACTIVE:
        return "Inactive";
      default:
        return status;
    }
  };

  const formatDate = (date: string | Date) => {
    try {
      const d = typeof date === "string" ? new Date(date) : date;
      const now = new Date();
      const diff = now.getTime() - d.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days === 0) return "Today";
      if (days === 1) return "Yesterday";
      if (days < 7) return `${days}d ago`;
      if (days < 30) return `${Math.floor(days / 7)}w ago`;
      if (days < 365) return `${Math.floor(days / 30)}mo ago`;
      return `${Math.floor(days / 365)}y ago`;
    } catch {
      return "Recent";
    }
  };

  const getImageUrl = () => {
    if (service.images && service.images.length > 0) {
      return service.images[0].url;
    }
    return "/api/placeholder/400/300";
  };

  const getImageAlt = () => {
    if (
      service.images &&
      service.images.length > 0 &&
      service.images[0].fileName
    ) {
      return service.images[0].fileName;
    }
    return service.title;
  };

  const renderTags = () => {
    if (!service.tags || service.tags.length === 0) return null;

    const maxVisibleTags = variant === "compact" ? 2 : 3;
    const visibleTags = service.tags.slice(0, maxVisibleTags);
    const hiddenTagsCount = service.tags.length - maxVisibleTags;

    return (
      <div className="flex flex-wrap gap-2 items-start">
        {visibleTags.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="inline-flex items-center px-2 py-0.5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full border border-gray-200/50 dark:border-gray-600/50 hover:shadow-sm transition-all duration-200 hover:scale-105 cursor-default"
            title={tag}
          >
            <span className="capitalize truncate max-w-[60px]">{tag}</span>
          </span>
        ))}

        {hiddenTagsCount > 0 && (
          <span
            className="inline-flex items-center px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-full border border-blue-200/50 dark:border-blue-800/50 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            title={`${hiddenTagsCount} more tags: ${service.tags
              .slice(maxVisibleTags)
              .join(", ")}`}
          >
            +{hiddenTagsCount}
          </span>
        )}
      </div>
    );
  };

  // Helper function to check if service has populated providers
  const hasPopulatedProviders = (
    service: Service | ServiceWithProviders
  ): service is ServiceWithProviders => {
    return "providers" in service && Array.isArray(service.providers);
  };

  return (
    <div
      className={`flex flex-col group bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200/50 dark:border-gray-800/50 hover:border-gray-300/50 dark:hover:border-gray-700/50 min-h-[300px] ${className}`}
    >
      <div className="relative flex-shrink-0 h-32 overflow-hidden">
        <Image
          src={getImageUrl()}
          alt={getImageAlt()}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/api/placeholder/400/300";
          }}
          fill
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

        <div className="absolute top-1.5 left-1.5 flex gap-1.5">
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm ${getStatusColor(
              service.status
            )}`}
          >
            <div className="w-1 h-1 rounded-full bg-current mr-1" />
            {getStatusLabel(service.status)}
          </span>
        </div>

        <div className="absolute top-1.5 right-1.5 flex gap-1.5">
          {service.isPopular && (
            <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-1.5 py-0.5 rounded-full text-xs font-bold flex items-center backdrop-blur-sm">
              <Star className="w-2.5 h-2.5 mr-0.5 fill-current" />
              Hot
            </div>
          )}

          <button
            onClick={handleShare}
            className="bg-white/90 dark:bg-gray-900/90 hover:bg-white dark:hover:bg-gray-900 backdrop-blur-sm p-1 rounded-full transition-all duration-200 hover:shadow-md group/share"
            title="Share this service"
          >
            <Share2 className="w-3 h-3 text-gray-700 dark:text-gray-300 group-hover/share:text-blue-600 dark:group-hover/share:text-blue-400 transition-colors" />
          </button>
        </div>

        <div className="absolute bottom-1.5 right-1.5">
          <div
            className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-1.5 py-0.5 rounded cursor-help transition-all duration-200 hover:bg-white dark:hover:bg-gray-900 hover:shadow-md"
            title={getPriceTooltip()}
          >
            <div className="flex items-center text-xs">
              {hasPrice() ? (
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {formatPrice()}
                </span>
              ) : (
                <span className="text-muted-foreground">
                  contact for pricing
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-3 min-h-0">
        <div className="flex items-start justify-between gap-2 mb-2 flex-shrink-0">
          {service.category && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50 flex-shrink-0">
              <Tag className="w-2.5 h-2.5 mr-1" />
              <span className="truncate max-w-[80px]">
                {service.category.name}
              </span>
            </span>
          )}

          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
            <Calendar className="w-2.5 h-2.5 mr-0.5" />
            {formatDate(service.createdAt)}
          </div>
        </div>

        <div className="mb-2 flex-shrink-0">
          <h2
            className="font-bold capitalize text-gray-900 dark:text-gray-100 line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-sm"
            title={service.title}
          >
            {service.title}
          </h2>
        </div>

        {service.tags && service.tags.length > 0 && (
          <div className="flex-1 min-h-0 mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Tags
              </span>
            </div>
            <div className="min-h-[24px]">{renderTags()}</div>
          </div>
        )}

        {showActions && (
          <div className="flex gap-1.5 pt-2 border-t border-gray-100 dark:border-gray-800 flex-shrink-0 mt-auto">
            <button
              onClick={() => onView?.(service)}
              className="flex-1 group/btn flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-blue-500/20"
            >
              <Info className="w-3 h-3 mr-1 group-hover/btn:scale-110 transition-transform" />
              Details
            </button>

            <Popover>
              <PopoverTrigger className="flex-1 group/btn flex items-center justify-center bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-200 border border-gray-200/50 dark:border-gray-700/50 hover:border-gray-300/50 dark:hover:border-gray-600/50">
                <Users className="w-3 h-3 mr-1 group-hover/btn:scale-110 transition-transform" />
                Providers ({service.providerCount})
              </PopoverTrigger>
              <PopoverContent
                className="w-96 p-1 shadow-2xl border-gray-200/50 dark:border-gray-800/50"
                align="end"
                side="top"
                sideOffset={8}
              >
                <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    Service Providers
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {service.providerCount || 0} provider
                    {service.providerCount !== 1 ? "s" : ""} offering{" "}
                    {service.title}
                  </p>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {hasPopulatedProviders(service) &&
                  service.providers &&
                  service.providers.length > 0 ? (
                    <div className="space-y-1">
                      {/* Only show the first 5 providers */}
                      {service.providers
                        .slice(0, 5)
                        .map((provider: ProviderData) => (
                          <div
                            key={provider._id}
                            className="flex gap-3 p-3 my-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                          >
                            <div className="flex-shrink-0">
                              {provider.profileId?.profilePicture?.url ? (
                                <div className="relative w-10 h-10">
                                  <Image
                                    src={provider.profileId.profilePicture.url}
                                    alt={provider.businessName || "Provider"}
                                    className="rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
                                    fill
                                  />
                                </div>
                              ) : (
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                  <Users className="w-5 h-5 text-white" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                                  {provider.businessName || "Service Provider"}
                                </h4>
                                <Link
                                  href={`/providers/${provider._id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline flex-shrink-0"
                                >
                                  View
                                  <ExternalLink size={10} />
                                </Link>
                              </div>

                              {provider.providerContactInfo && (
                                <div className="mt-1 space-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                                  {provider.providerContactInfo
                                    .businessEmail && (
                                    <div className="truncate">
                                      ✉️{" "}
                                      {
                                        provider.providerContactInfo
                                          .businessEmail
                                      }
                                    </div>
                                  )}
                                  {provider.providerContactInfo
                                    .emergencyContact && (
                                    <div className="truncate">
                                      📞{" "}
                                      {
                                        provider.providerContactInfo
                                          .emergencyContact
                                      }
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                      {/* Show a 'View all providers' link if there are more than 5 */}
                      {service.providers.length > 1 && (
                        <div className="pt-2 text-center">
                          <Link
                            href={`/services/${
                              service._id || service.slug
                            }/providers`}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            View all providers
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 px-4">
                      <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-900 dark:text-gray-100 font-medium text-sm mb-1">
                        No providers available
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Check back later for available providers
                      </p>
                    </div>
                  )}
                </div>

                <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    @errandsmate • {service.title}
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceCard;
