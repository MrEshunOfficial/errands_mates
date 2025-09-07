import React, { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// Format date for display
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Eye,
  Trash2,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Flag,
  RotateCcw,
  Power,
  Shield,
  Image as ImageIcon,
  Calendar,
  User,
  Hash,
  TrendingUp,
  Loader2,
  ExternalLink,
  Edit3Icon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Category, CategoryDetails } from "@/types/category.types";
import { ModerationStatus } from "@/types";
import Image from "next/image";

// Types for user levels and view modes
type UserLevel = "public" | "authenticated" | "admin" | "super_admin";
type ViewMode = "grid" | "list" | "compact";

// Union type to accept both Category and CategoryDetails
type CategoryCardCategory = Category | CategoryDetails;

// Props interface
interface CategoryCardProps {
  category: CategoryCardCategory;
  userLevel: UserLevel;
  viewMode?: ViewMode;

  // Selection props
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: (category: CategoryCardCategory) => void;

  // Loading states
  isLoading?: boolean;
  actionLoading?: {
    view?: boolean;
    edit?: boolean;
    delete?: boolean;
    update?: boolean;
    moderate?: boolean;
  };

  // Display options
  showStats?: boolean;
  showModerationInfo?: boolean;
  showTags?: boolean;
  showDescription?: boolean;

  // Action handlers
  onView?: (category: CategoryCardCategory) => void;
  onEdit?: (category: CategoryCardCategory) => void;
  onDelete?: (category: CategoryCardCategory) => void;
  onRestore?: (category: CategoryCardCategory) => void;
  onToggleStatus?: (category: CategoryCardCategory) => void;
  onModerate?: (category: CategoryCardCategory) => void;

  // Custom content
  customActions?: React.ReactNode;
  customBadges?: React.ReactNode;
  customStats?: React.ReactNode;

  // Styling
  className?: string;
  variant?: "default" | "outline" | "ghost";
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  userLevel,
  viewMode = "grid",
  isSelectable = false,
  isSelected = false,
  onSelect,
  isLoading = false,
  actionLoading = {},
  showStats = false,
  showModerationInfo = false,
  showTags = true,
  showDescription = true,
  onView,
  onEdit,
  onDelete,
  onRestore,
  onToggleStatus,
  onModerate,
  customActions,
  customBadges,
  customStats,
  className,
  variant = "default",
}) => {
  const [imageError, setImageError] = useState(false);

  // Type guard to check if category has populated user fields
  const isPopulatedCategory = (
    cat: CategoryCardCategory
  ): cat is CategoryDetails => {
    return (
      typeof (cat as CategoryDetails).createdBy === "object" &&
      (cat as CategoryDetails).createdBy !== null &&
      typeof (cat as CategoryDetails).createdBy === "object" &&
      "_id" in ((cat as CategoryDetails).createdBy || {})
    );
  };

  // Safe accessor functions for populated user data
  const getLastModifiedByName = (): string => {
    if (isPopulatedCategory(category) && category.lastModifiedBy) {
      return (
        category.lastModifiedBy.displayName ||
        category.lastModifiedBy.name ||
        "Unknown"
      );
    }
    return "Unknown";
  };

  // Check permissions based on user level
  const canEdit = userLevel === "admin" || userLevel === "super_admin";
  const canDelete = userLevel === "admin" || userLevel === "super_admin";
  const canModerate = userLevel === "admin" || userLevel === "super_admin";
  const canRestore = userLevel === "super_admin";
  const canViewStats = userLevel === "admin" || userLevel === "super_admin";
  const canViewModerationInfo =
    userLevel === "admin" || userLevel === "super_admin";

  // Get status-based styling
  const getStatusColor = useCallback((status: ModerationStatus) => {
    switch (status) {
      case ModerationStatus.APPROVED:
        return "bg-green-100 text-green-800 border-green-200";
      case ModerationStatus.PENDING:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case ModerationStatus.REJECTED:
        return "bg-red-100 text-red-800 border-red-200";
      case ModerationStatus.FLAGGED:
        return "bg-orange-100 text-orange-800 border-orange-200";
      case ModerationStatus.HIDDEN:
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  }, []);

  const getStatusIcon = useCallback((status: ModerationStatus) => {
    switch (status) {
      case ModerationStatus.APPROVED:
        return <CheckCircle className="w-3 h-3" />;
      case ModerationStatus.PENDING:
        return <Clock className="w-3 h-3" />;
      case ModerationStatus.REJECTED:
        return <XCircle className="w-3 h-3" />;
      case ModerationStatus.FLAGGED:
        return <Flag className="w-3 h-3" />;
      case ModerationStatus.HIDDEN:
        return <Eye className="w-3 h-3" />;
      default:
        return <AlertTriangle className="w-3 h-3" />;
    }
  }, []);

  // Handle selection
  const handleSelect = useCallback(() => {
    if (isSelectable && onSelect) {
      onSelect(category);
    }
  }, [isSelectable, onSelect, category]);

  // Action handlers
  const handleAction = useCallback(
    (action: () => void, event: React.MouseEvent) => {
      event.stopPropagation();
      action();
    },
    []
  );

  const formatDate = (date: Date | string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  // Render image with fallback
  const renderImage = () => {
    if (!category.image?.url || imageError) {
      return (
        <div
          className={cn(
            "bg-muted flex items-center justify-center",
            viewMode === "grid" && "h-32",
            viewMode === "list" && "w-20 h-20",
            viewMode === "compact" && "w-12 h-12"
          )}
        >
          <ImageIcon
            className={cn(
              "text-muted-foreground",
              viewMode === "grid" && "w-8 h-8",
              viewMode === "list" && "w-6 h-6",
              viewMode === "compact" && "w-4 h-4"
            )}
          />
        </div>
      );
    }

    return (
      <div
        className={cn(
          "relative",
          viewMode === "grid" && "w-full h-32",
          viewMode === "list" && "w-20 h-20",
          viewMode === "compact" && "w-12 h-12"
        )}
      >
        <Image
          src={category.image.url}
          alt={category.name}
          className={cn(
            "object-cover bg-muted",
            viewMode === "grid" && "w-full h-32",
            viewMode === "list" && "w-20 h-20 rounded",
            viewMode === "compact" && "w-12 h-12 rounded"
          )}
          onError={() => setImageError(true)}
          loading="lazy"
          fill
        />
      </div>
    );
  };

  // Render status badges
  const renderStatusBadges = () => {
    const badges = [];

    // Active/Inactive status
    if (canViewModerationInfo || showModerationInfo) {
      badges.push(
        <Badge
          key="active-status"
          variant={category.isActive ? "default" : "secondary"}
          className={cn(
            "flex items-center gap-1",
            category.isActive
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-600"
          )}
        >
          <Power className="w-3 h-3" />
          {category.isActive ? "Active" : "Inactive"}
        </Badge>
      );
    }

    // Moderation status
    if (canViewModerationInfo || showModerationInfo) {
      badges.push(
        <Badge
          key="moderation-status"
          className={cn(
            "flex items-center gap-1",
            getStatusColor(category.moderationStatus)
          )}
        >
          {getStatusIcon(category.moderationStatus)}
          {category.moderationStatus
            .replace(/[-_]/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase())}
        </Badge>
      );
    }

    // Deleted status
    if (category.isDeleted) {
      badges.push(
        <Badge
          key="deleted-status"
          variant="destructive"
          className="flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" />
          Deleted
        </Badge>
      );
    }

    // Custom badges
    if (customBadges) {
      badges.push(
        <React.Fragment key="custom-badges">{customBadges}</React.Fragment>
      );
    }

    return badges;
  };

  // Render tags
  const renderTags = () => {
    if (!showTags || !category.tags?.length) return null;

    const visibleTags =
      viewMode === "compact"
        ? category.tags.slice(0, 2)
        : category.tags.slice(0, 4);
    const remainingCount = category.tags.length - visibleTags.length;

    return (
      <div className="flex flex-wrap gap-1">
        {visibleTags.map((tag, index) => (
          <Badge key={index} variant="outline" className="text-xs">
            <Hash className="w-2 h-2 mr-1" />
            {tag}
          </Badge>
        ))}
        {remainingCount > 0 && (
          <Badge variant="outline" className="text-xs">
            +{remainingCount} more
          </Badge>
        )}
      </div>
    );
  };

  // Render stats
  const renderStats = () => {
    if (!showStats || !canViewStats) return null;

    return (
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {customStats || (
          <>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span>Order: {category.displayOrder}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Created: {formatDate(category.createdAt)}</span>
            </div>
          </>
        )}
      </div>
    );
  };

  // Render moderation info
  const renderModerationInfo = () => {
    if (!canViewModerationInfo || !showModerationInfo) return null;

    return (
      <div className="text-xs text-muted-foreground space-y-1">
        <div className="flex flex-col items-end">
          {isPopulatedCategory(category) && category.lastModifiedBy && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>Modified by: {getLastModifiedByName()}</span>
            </div>
          )}
          <span>Last modified: {formatDate(category.updatedAt)}</span>
        </div>
      </div>
    );
  };

  // Render actions
  const renderActions = () => {
    const actions = [];

    // View action (available to all user levels)
    if (onView) {
      actions.push(
        <TooltipProvider key="view">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleAction(() => onView(category), e)}
                disabled={isLoading || actionLoading.view}
              >
                {actionLoading.view ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>View details</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // Edit action (admin only)
    if (canEdit && onEdit && !category.isDeleted) {
      actions.push(
        <TooltipProvider key="edit">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleAction(() => onEdit(category), e)}
                disabled={isLoading || actionLoading.edit}
              >
                {actionLoading.edit ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Edit3Icon className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit category</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // Custom actions
    if (customActions) {
      actions.push(
        <React.Fragment key="custom-actions">{customActions}</React.Fragment>
      );
    }

    // More actions dropdown (admin only)
    if (canEdit && (onDelete || onRestore || onToggleStatus || onModerate)) {
      actions.push(
        <DropdownMenu key="more-actions">
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* Toggle Status */}
            {onToggleStatus && !category.isDeleted && (
              <DropdownMenuItem
                onClick={() => onToggleStatus(category)}
                disabled={actionLoading.update}
              >
                <Power className="w-4 h-4 mr-2" />
                {category.isActive ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
            )}

            {/* Moderate */}
            {canModerate && onModerate && !category.isDeleted && (
              <DropdownMenuItem
                onClick={() => onModerate(category)}
                disabled={actionLoading.moderate}
              >
                <Shield className="w-4 h-4 mr-2" />
                Moderate
              </DropdownMenuItem>
            )}

            {/* Restore */}
            {canRestore && onRestore && category.isDeleted && (
              <DropdownMenuItem
                onClick={() => onRestore(category)}
                disabled={actionLoading.update}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restore
              </DropdownMenuItem>
            )}

            {/* Delete */}
            {canDelete && onDelete && !category.isDeleted && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(category)}
                  disabled={actionLoading.delete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return actions;
  };

  // Render based on view mode
  if (viewMode === "compact") {
    return (
      <Card
        className={cn(
          "transition-all duration-200",
          isSelectable && "cursor-pointer hover:shadow-md",
          isSelected && "ring-2 ring-primary",
          category.isDeleted && "opacity-60",
          variant === "outline" && "border-2",
          variant === "ghost" && "border-0 shadow-none",
          className
        )}
        onClick={isSelectable ? handleSelect : undefined}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            {/* Selection checkbox */}
            {isSelectable && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={handleSelect}
                onClick={(e) => e.stopPropagation()}
              />
            )}

            {/* Image */}
            {renderImage()}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">
                    {category.name}
                  </h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {renderStatusBadges()}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {renderActions()}
                </div>
              </div>
            </div>
          </div>

          {/* Moderation info */}
          {renderModerationInfo()}
        </CardContent>
      </Card>
    );
  }

  if (viewMode === "list") {
    return (
      <Card
        className={cn(
          "transition-all duration-200",
          isSelectable && "cursor-pointer hover:shadow-md",
          isSelected && "ring-2 ring-primary",
          category.isDeleted && "opacity-60",
          variant === "outline" && "border-2",
          variant === "ghost" && "border-0 shadow-none",
          className
        )}
        onClick={isSelectable ? handleSelect : undefined}
      >
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Selection checkbox */}
            {isSelectable && (
              <div className="flex-shrink-0 pt-1">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={handleSelect}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            {/* Image */}
            <div className="flex-shrink-0">{renderImage()}</div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-2 truncate">
                    {category.name}
                  </h3>

                  {showDescription && category.description && (
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {category.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-3">
                    {renderStatusBadges()}
                  </div>

                  {renderTags()}

                  {renderStats()}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {renderActions()}
                </div>
              </div>

              {/* Moderation info */}
              {renderModerationInfo()}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view (default)
  return (
    <Card
      className={cn(
        "transition-all duration-200 overflow-hidden",
        isSelectable && "cursor-pointer hover:shadow-lg",
        isSelected && "ring-2 ring-primary",
        category.isDeleted && "opacity-60",
        variant === "outline" && "border-2",
        variant === "ghost" && "border-0 shadow-none",
        className
      )}
      onClick={isSelectable ? handleSelect : undefined}
    >
      {/* Image */}
      <div className="relative">
        {renderImage()}

        {/* Selection checkbox overlay */}
        {isSelectable && (
          <div className="absolute top-2 left-2">
            <Checkbox
              checked={isSelected}
              onCheckedChange={handleSelect}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/90 backdrop-blur-sm"
            />
          </div>
        )}

        {/* Status badges overlay */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {renderStatusBadges().slice(0, 2)}
        </div>
      </div>

      {/* Content */}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg leading-tight line-clamp-2 flex-1">
            {category.name}
          </h3>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-4">
        {showDescription && category.description && (
          <p className="text-muted-foreground text-sm mb-3 line-clamp-3">
            {category.description}
          </p>
        )}

        {renderTags()}

        <div className="mt-3 space-y-2">
          {renderStats()}
          {renderModerationInfo()}
        </div>
      </CardContent>

      {/* Actions */}
      <CardFooter className="pt-0 pb-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1">{renderActions()}</div>
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading...
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default CategoryCard;
export type { CategoryCardProps, UserLevel, ViewMode, CategoryCardCategory };
