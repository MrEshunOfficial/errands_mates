// service-card.txt (optimized - removed duplicated logic)
import React from "react";
import { useRouter } from "next/navigation";
import { ServiceStatus } from "@/types/base.types";
import {
  CheckSquare,
  Square,
  MoreHorizontal,
  Edit,
  Star,
  StarOff,
  Users,
  Check,
  X,
  RotateCcw,
  Trash2,
  Hash,
  ExternalLink,
  Calendar,
  User,
  Tag,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Service } from "@/types";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ServiceCardService {
  _id: string;
  title: string;
  description: string;
  status: ServiceStatus;
  isPopular: boolean;
  createdAt: string;
  updatedAt: string;
  category?: string | { _id: string; name: string; slug: string };
  price?: number;
  providersCount?: number;
  tags?: string[];
  submittedBy?:
    | string
    | {
        _id: string;
        name?: string;
        email?: string;
        serviceUserId?: string;
        [key: string]: unknown;
      };
  images?: { url: string }[];
}

interface ServiceCardProps {
  service: ServiceCardService;
  isSelected: boolean;
  onToggleSelect: () => void;
  getServiceStatusColor: (status: ServiceStatus) => string;
  getServiceStatusLabel: (status: ServiceStatus) => string;
  canPerformAdminAction: (action: string, service: Service) => boolean;
  getServicePriorityLevel: (service: Service) => string;
  approveService: (id: string) => Promise<Service>;
  rejectService: (id: string, reason?: string) => Promise<Service>;
  restoreService: (id: string) => Promise<Service>;
  togglePopular: (id: string) => Promise<Service>;
  setServiceToDelete: (service: ServiceCardService | null) => void;
  setServiceToReject: (
    value: { service: ServiceCardService; reason?: string } | null
  ) => void;
  refreshAfterAction?: () => Promise<void>; // Single refresh callback
  viewMode?: "compact" | "detailed";
  showTags?: boolean;
}

const getSubmittedByInfo = (
  submittedBy?:
    | {
        _id: string;
        name?: string;
        email?: string;
        serviceUserId?: string;
        [key: string]: unknown;
      }
    | string
): { name: string; id: string; email: string | undefined } | null => {
  if (!submittedBy) {
    return null;
  }

  if (typeof submittedBy === "string") {
    return { name: `User ${submittedBy}`, id: submittedBy, email: undefined };
  }

  const name =
    submittedBy.name ||
    submittedBy.serviceUserId ||
    `User ${submittedBy._id}` ||
    "Unknown User";

  return {
    name: name,
    id: submittedBy._id,
    email: submittedBy.email,
  };
};

// Simplified - uses hook's status functions instead of duplicating logic
const ServiceActionDropdown: React.FC<{
  service: ServiceCardService;
  getServiceStatusColor: (status: ServiceStatus) => string;
  getServiceStatusLabel: (status: ServiceStatus) => string;
  canPerformAdminAction: (action: string, service: Service) => boolean;
  approveService: (id: string) => Promise<Service>;
  rejectService: (id: string, reason?: string) => Promise<Service>;
  restoreService: (id: string) => Promise<Service>;
  togglePopular: (id: string) => Promise<Service>;
  setServiceToDelete: (service: ServiceCardService | null) => void;
  setServiceToReject: (
    value: { service: ServiceCardService; reason?: string } | null
  ) => void;
  refreshAfterAction?: () => Promise<void>;
}> = ({
  service,
  canPerformAdminAction,
  approveService,
  rejectService,
  restoreService,
  togglePopular,
  setServiceToDelete,
  setServiceToReject,
  refreshAfterAction,
}) => {
  const router = useRouter();
  const status = service.status;

  const isDeleted = status === ServiceStatus.REJECTED;
  const isPending = status === ServiceStatus.PENDING_APPROVAL;

  // Simplified action handler - no duplication of toast logic
  const handleAction = async (
    action: () => Promise<unknown>,
    successMsg?: string
  ): Promise<void> => {
    try {
      await action();
      if (successMsg) {
        toast.success(successMsg);
      }
      await refreshAfterAction?.();
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      toast.error(errorMessage);
    }
  };

  const handleServiceView = () => router.push(`/admin/services/${service._id}`);
  const handleServiceEdit = () =>
    router.push(`/admin/services/${service._id}/edit`);
  const handleViewProviders = () =>
    router.push(`/services/${service._id}/providers`);

  const handleServiceApprove = async () => {
    if (!canPerformAdminAction("approve", service as unknown as Service))
      return;
    await handleAction(
      () => approveService(service._id.toString()),
      `"${service.title}" approved`
    );
  };

  const handleServiceReject = async (reason?: string) => {
    if (!canPerformAdminAction("reject", service as unknown as Service)) return;
    if (!reason) {
      setServiceToReject({ service });
      return;
    }
    await handleAction(
      () => rejectService(service._id.toString(), reason),
      `"${service.title}" rejected`
    );
  };

  const handleServiceRestore = async () => {
    if (!canPerformAdminAction("restore", service as unknown as Service))
      return;
    await handleAction(
      () => restoreService(service._id.toString()),
      `"${service.title}" restored`
    );
  };

  const handleTogglePopular = async () => {
    const action = service.isPopular
      ? "unmarked as popular"
      : "marked as popular";
    await handleAction(
      () => togglePopular(service._id.toString()),
      `"${service.title}" ${action}`
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Manage Service</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleServiceView}
          className="cursor-pointer"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleViewProviders}
          className="cursor-pointer"
        >
          <Users className="mr-2 h-4 w-4" />
          View Providers ({service.providersCount || 0})
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleServiceEdit}
          className="cursor-pointer"
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit Service
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {isPending && (
          <>
            <DropdownMenuItem
              onClick={handleServiceApprove}
              disabled={
                !canPerformAdminAction("approve", service as unknown as Service)
              }
              className="cursor-pointer text-green-700 dark:text-green-400"
            >
              <Check className="mr-2 h-4 w-4" />
              Approve Service
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleServiceReject()}
              disabled={
                !canPerformAdminAction("reject", service as unknown as Service)
              }
              className="cursor-pointer text-red-700 dark:text-red-400"
            >
              <X className="mr-2 h-4 w-4" />
              Reject Service
            </DropdownMenuItem>
          </>
        )}

        {isDeleted && (
          <DropdownMenuItem
            onClick={handleServiceRestore}
            disabled={
              !canPerformAdminAction("restore", service as unknown as Service)
            }
            className="cursor-pointer text-blue-700 dark:text-blue-400"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Restore Service
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleTogglePopular}
          className="cursor-pointer"
        >
          {service.isPopular ? (
            <>
              <StarOff className="mr-2 h-4 w-4" />
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

        <DropdownMenuItem
          onClick={() => setServiceToDelete(service)}
          disabled={
            !canPerformAdminAction("delete", service as unknown as Service)
          }
          className="cursor-pointer text-red-700 dark:text-red-400"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Service
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Service Image Component (unchanged)
const ServiceImage: React.FC<{
  service: ServiceCardService;
  viewMode: "compact" | "detailed";
}> = ({ service, viewMode }) => {
  const getPrimaryImageUrl = (): string => {
    if (service.images?.length && service.images[0]?.url) {
      return service.images[0].url;
    }
    return "/placeholder-service-image.jpg";
  };

  const getImageDimensions = () => {
    if (viewMode === "compact") {
      return {
        containerClass: "aspect-video",
        width: 200,
        height: 120,
        sizes: "200px",
      };
    }
    return {
      containerClass: "w-24 h-20 flex-shrink-0 sm:w-32 sm:h-24",
      width: 128,
      height: 96,
      sizes: "(max-width: 640px) 96px, 128px",
    };
  };

  const { containerClass, width, height, sizes } = getImageDimensions();

  return (
    <div
      className={cn(
        "rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800",
        containerClass
      )}
    >
      <Image
        src={getPrimaryImageUrl()}
        alt={service.title}
        width={width}
        height={height}
        sizes={sizes}
        className="w-full h-full object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = "/placeholder-service-image.jpg";
        }}
      />
    </div>
  );
};

// Service Tags Component
const ServiceTags: React.FC<{
  tags: string[];
  viewMode: "compact" | "detailed";
  showTags: boolean;
}> = ({ tags, viewMode, showTags }) => {
  if (!showTags || !tags?.length) return null;

  const maxTags = viewMode === "compact" ? 2 : 4;
  const visibleTags = tags.slice(0, maxTags);
  const remainingCount = tags.length - visibleTags.length;

  return (
    <div className="flex flex-wrap gap-1">
      {visibleTags.map((tag, index) => (
        <Badge
          key={index}
          variant="secondary"
          className="text-xs h-5 px-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
        >
          <Hash className="w-2.5 h-2.5 mr-1" />
          {tag}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge
          variant="outline"
          className="text-xs h-5 px-2 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600"
        >
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
};

// Service Metadata Component (unchanged)
const ServiceMetadata: React.FC<{
  service: ServiceCardService;
  viewMode: "compact" | "detailed";
  submittedByInfo: ReturnType<typeof getSubmittedByInfo>;
  categoryName: string;
  router: ReturnType<typeof useRouter>;
}> = ({ service, viewMode, submittedByInfo, categoryName, router }) => {
  if (viewMode === "compact") {
    return (
      <div className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
        {categoryName && (
          <span className="flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {categoryName}
          </span>
        )}
        {typeof service.providersCount === "number" && (
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {service.providersCount} providers
          </span>
        )}
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDate(service.createdAt)}
        </span>
        {submittedByInfo && (
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/providers/${submittedByInfo.id}`);
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline"
              data-no-select
            >
              {submittedByInfo.name}
            </button>
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
      <div className="flex flex-wrap gap-4">
        {categoryName && (
          <div className="flex items-center gap-1 capitalize">
            <Tag className="w-4 h-4" />
            <span>{categoryName}</span>
          </div>
        )}
        {typeof service.providersCount === "number" && (
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{service.providersCount} providers</span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-1">
          <User className="w-4 h-4" />
          {submittedByInfo ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/admin/users/${submittedByInfo.id}`);
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline capitalize"
              data-no-select
            >
              {submittedByInfo.name}
            </button>
          ) : (
            <span className="italic">Unknown</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(service.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};

const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  isSelected,
  onToggleSelect,
  getServiceStatusColor,
  getServiceStatusLabel,
  canPerformAdminAction,
  approveService,
  rejectService,
  restoreService,
  togglePopular,
  setServiceToDelete,
  setServiceToReject,
  refreshAfterAction,
  viewMode = "compact",
  showTags = true,
}) => {
  const router = useRouter();
  const statusColor = getServiceStatusColor(service.status);
  const statusLabel = getServiceStatusLabel(service.status);

  const getCategoryName = (
    category?: string | { _id: string; name: string; slug: string }
  ): string => {
    if (!category) return "";
    if (typeof category === "string") return category;
    return category.name || category.slug || String(category._id);
  };

  const categoryName = getCategoryName(service.category);
  const submittedByInfo = getSubmittedByInfo(service.submittedBy);

  // Compact view
  if (viewMode === "compact") {
    return (
      <Card
        className={cn(
          "transition-all cursor-pointer h-full hover:shadow-lg w-full max-w-sm mx-auto",
          isSelected
            ? "border-blue-500 bg-blue-50/30 dark:bg-blue-950/30 dark:border-blue-400"
            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
          service.status === ServiceStatus.REJECTED
            ? "bg-orange-50/50 border-orange-200"
            : ""
        )}
      >
        <CardContent className="px-2 py-4">
          <div className="space-y-3 group">
            <div className="flex justify-between">
              <Input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleSelect();
                }}
                className="w-4 h-4"
              />
              <div className="flex gap-1">
                <Badge
                  variant="outline"
                  className={cn("text-xs border font-medium", statusColor)}
                >
                  <span className="w-3 h-3 mr-1">
                    {service.status === ServiceStatus.APPROVED && "✓"}
                    {service.status === ServiceStatus.PENDING_APPROVAL && "⏳"}
                    {service.status === ServiceStatus.REJECTED && "✗"}
                  </span>
                  {statusLabel}
                </Badge>
                {service.isPopular && (
                  <Badge className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Popular
                  </Badge>
                )}
              </div>
            </div>
            <ServiceImage service={service} viewMode={viewMode} />
            <div className="cursor-pointer">
              <h3 className="font-medium text-sm truncate mb-1 capitalize">
                {service.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {service.description}
              </p>
              <ServiceTags
                tags={service.tags || []}
                viewMode={viewMode}
                showTags={showTags}
              />
              <ServiceMetadata
                service={service}
                viewMode={viewMode}
                submittedByInfo={submittedByInfo}
                categoryName={categoryName}
                router={router}
              />
            </div>
            <div className="flex justify-between pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/admin/services/${service._id}`);
                }}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                View
              </Button>
              <ServiceActionDropdown
                service={service}
                getServiceStatusColor={getServiceStatusColor}
                getServiceStatusLabel={getServiceStatusLabel}
                canPerformAdminAction={canPerformAdminAction}
                approveService={approveService}
                rejectService={rejectService}
                restoreService={restoreService}
                togglePopular={togglePopular}
                setServiceToDelete={setServiceToDelete}
                setServiceToReject={setServiceToReject}
                refreshAfterAction={refreshAfterAction}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Detailed view mode
  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-900 rounded-xl border transition-all duration-200 hover:shadow-lg cursor-pointer group",
        isSelected
          ? "border-blue-500 bg-blue-50/30 dark:bg-blue-950/30 dark:border-blue-400 shadow-lg"
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
          className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          data-no-select
        >
          {isSelected ? (
            <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          ) : (
            <Square className="w-4 h-4 text-gray-400" />
          )}
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {isSelected ? "Selected" : "Select"}
          </span>
        </button>
        <div data-no-select>
          <ServiceActionDropdown
            service={service}
            getServiceStatusColor={getServiceStatusColor}
            getServiceStatusLabel={getServiceStatusLabel}
            canPerformAdminAction={canPerformAdminAction}
            approveService={approveService}
            rejectService={rejectService}
            restoreService={restoreService}
            togglePopular={togglePopular}
            setServiceToDelete={setServiceToDelete}
            setServiceToReject={setServiceToReject}
            refreshAfterAction={refreshAfterAction}
          />
        </div>
      </div>

      <div className="p-4">
        <div className="flex flex-row gap-4">
          <ServiceImage service={service} viewMode={viewMode} />
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 capitalize">
                {service.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mt-1">
                {service.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={cn("border font-medium", statusColor)}
              >
                <span className="w-3 h-3 mr-1.5">
                  {service.status === ServiceStatus.APPROVED && "✓"}
                  {service.status === ServiceStatus.PENDING_APPROVAL && "⏳"}
                  {service.status === ServiceStatus.REJECTED && "✗"}
                </span>
                {statusLabel}
              </Badge>

              {service.isPopular && (
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 font-medium">
                  <Star className="w-3 h-3 mr-1.5 fill-current" />
                  Popular
                </Badge>
              )}
            </div>

            <ServiceTags
              tags={service.tags || []}
              viewMode={viewMode}
              showTags={showTags}
            />

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
              <ServiceMetadata
                service={service}
                viewMode={viewMode}
                submittedByInfo={submittedByInfo}
                categoryName={categoryName}
                router={router}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
