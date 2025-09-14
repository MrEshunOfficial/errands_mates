"use client";
import React from "react";
import { Category } from "@/types/category.types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ExternalLink,
  Archive,
  ArchiveRestore,
  Trash2,
  Edit,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Extended category type with potential service count properties
interface ExtendedCategory extends Category {
  serviceCount?: number;
  servicesCount?: number;
  services_count?: number;
  service_count?: number;
  services?: unknown[];
  subcategories?: Array<{
    serviceCount?: number;
    servicesCount?: number;
  }>;
}

export type CategoryCardAction =
  | "view"
  | "edit"
  | "archive"
  | "restore"
  | "delete"
  | "moderate"
  | "toggle-status";

export interface CategoryCardConfig {
  // View configuration
  viewMode: "grid" | "list";
  showSelection?: boolean;
  showServiceCount?: boolean;
  showStatus?: boolean;
  showImage?: boolean;
  showDescription?: boolean;

  // Action configuration
  availableActions: CategoryCardAction[];
  primaryAction?: CategoryCardAction;

  // Custom labels and styling
  customLabels?: {
    archive?: string;
    restore?: string;
    delete?: string;
    view?: string;
    edit?: string;
    moderate?: string;
  };

  // Status-specific styling
  inactiveStyle?: {
    cardClassName?: string;
    badgeClassName?: string;
    textClassName?: string;
  };

  deletedStyle?: {
    cardClassName?: string;
    badgeClassName?: string;
    textClassName?: string;
  };
}

export interface AdminCategoryCardProps {
  category: Category;
  config: CategoryCardConfig;

  // Selection
  isSelected?: boolean;
  onToggleSelection?: (category: Category) => void;

  // Actions
  onAction: (action: CategoryCardAction, category: Category) => void;

  // Loading states
  isLoading?: boolean;
  actionLoading?: boolean;

  // Custom className
  className?: string;
}

const DEFAULT_CONFIG: CategoryCardConfig = {
  viewMode: "grid",
  showSelection: true,
  showServiceCount: true,
  showStatus: true,
  showImage: true,
  showDescription: true,
  availableActions: ["view", "edit", "archive", "delete"],
  primaryAction: "view",
};

const DEFAULT_INACTIVE_STYLE = {
  cardClassName:
    "bg-orange-50/50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800",
  badgeClassName:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  textClassName: "text-muted-foreground",
};

const DEFAULT_DELETED_STYLE = {
  cardClassName:
    "bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-800",
  badgeClassName: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  textClassName: "text-muted-foreground",
};

// Helper function to get service count from category object
const getServiceCount = (category: Category): number => {
  const extendedCategory = category as ExtendedCategory;
  const possibleCounts: Array<number | undefined> = [
    extendedCategory.serviceCount,
    extendedCategory.servicesCount,
    extendedCategory.services_count,
    extendedCategory.service_count,
    Array.isArray(extendedCategory.services)
      ? extendedCategory.services.length
      : undefined,
    extendedCategory.subcategories?.reduce((total, sub) => {
      const subCount = sub.serviceCount || sub.servicesCount || 0;
      return total + subCount;
    }, 0),
  ];

  const count = possibleCounts.find(
    (count): count is number => typeof count === "number" && count >= 0
  );

  return count ?? 0;
};

const CategoryImage: React.FC<{
  category: Category;
  size: { w: number; h: number; class: string };
}> = ({ category, size }) => (
  <div className={cn("rounded-lg overflow-hidden bg-muted", size.class)}>
    {category.image ? (
      <Image
        src={category.image.url}
        alt={category.name}
        width={size.w}
        height={size.h}
        className="w-full h-full object-cover"
      />
    ) : (
      <div className="w-full h-full bg-muted-foreground/10" />
    )}
  </div>
);

const ServiceCountDisplay: React.FC<{
  category: Category;
}> = ({ category }) => {
  const serviceCount = getServiceCount(category);

  return (
    <p className="text-xs text-muted-foreground">
      {serviceCount} service{serviceCount !== 1 ? "s" : ""}
    </p>
  );
};

const StatusBadge: React.FC<{
  category: Category;
  config: CategoryCardConfig;
}> = ({ category, config }) => {
  if (!config.showStatus) return null;

  const isDeleted = (category as Category).isDeleted;

  if (isDeleted) {
    const style = config.deletedStyle || DEFAULT_DELETED_STYLE;
    return (
      <Badge
        variant="secondary"
        className={cn("text-xs", style.badgeClassName)}
      >
        Deleted
      </Badge>
    );
  }

  if (!category.isActive) {
    const style = config.inactiveStyle || DEFAULT_INACTIVE_STYLE;
    return (
      <Badge
        variant="secondary"
        className={cn("text-xs", style.badgeClassName)}
      >
        Inactive
      </Badge>
    );
  }

  return null;
};

const ActionButton: React.FC<{
  action: CategoryCardAction;
  category: Category;
  config: CategoryCardConfig;
  onAction: (action: CategoryCardAction, category: Category) => void;
  variant?: "icon" | "text";
  size?: "sm" | "default";
}> = ({
  action,
  category,
  config,
  onAction,
  variant = "icon",
  size = "sm",
}) => {
  const customLabels = config.customLabels || {};

  const getActionConfig = (action: CategoryCardAction) => {
    switch (action) {
      case "view":
        return {
          icon: ExternalLink,
          label: customLabels.view || "View",
          className: "",
        };
      case "edit":
        return {
          icon: Edit,
          label: customLabels.edit || "Edit",
          className: "",
        };
      case "archive":
        return {
          icon: Archive,
          label: customLabels.archive || "Archive",
          className: "text-orange-600 hover:text-orange-700",
        };
      case "restore":
        return {
          icon: ArchiveRestore,
          label: customLabels.restore || "Restore",
          className: "text-green-600 hover:text-green-700",
        };
      case "delete":
        return {
          icon: Trash2,
          label: customLabels.delete || "Delete",
          className: "text-destructive hover:text-destructive/90",
        };
      case "moderate":
        return {
          icon: Eye,
          label: customLabels.moderate || "Moderate",
          className: "text-blue-600 hover:text-blue-700",
        };
      case "toggle-status":
        return {
          icon: category.isActive ? Archive : ArchiveRestore,
          label: category.isActive ? "Deactivate" : "Activate",
          className: category.isActive
            ? "text-orange-600 hover:text-orange-700"
            : "text-green-600 hover:text-green-700",
        };
      default:
        return {
          icon: MoreHorizontal,
          label: "Action",
          className: "",
        };
    }
  };

  const actionConfig = getActionConfig(action);
  const Icon = actionConfig.icon;

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={(e) => {
        e.stopPropagation();
        onAction(action, category);
      }}
      className={cn(variant === "icon" ? "px-2" : "", actionConfig.className)}
      title={actionConfig.label}
    >
      <Icon className="w-4 h-4" />
      {variant === "text" && <span className="ml-1">{actionConfig.label}</span>}
    </Button>
  );
};

const GridActions: React.FC<{
  category: Category;
  config: CategoryCardConfig;
  onAction: (action: CategoryCardAction, category: Category) => void;
}> = ({ category, config, onAction }) => {
  const primaryAction = config.primaryAction || "view";
  const otherActions = config.availableActions.filter(
    (action) => action !== primaryAction
  );

  return (
    <div className="flex justify-between pt-2 border-t">
      <ActionButton
        action={primaryAction}
        category={category}
        config={config}
        onAction={onAction}
        variant="text"
      />

      {otherActions.length === 1 ? (
        <ActionButton
          action={otherActions[0]}
          category={category}
          config={config}
          onAction={onAction}
          variant="text"
        />
      ) : otherActions.length > 1 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {otherActions.map((action, index) => (
              <React.Fragment key={action}>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction(action, category);
                  }}
                >
                  <ActionButton
                    action={action}
                    category={category}
                    config={config}
                    onAction={() => {}}
                    variant="text"
                  />
                </DropdownMenuItem>
                {index < otherActions.length - 1 && action === "view" && (
                  <DropdownMenuSeparator />
                )}
              </React.Fragment>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
};

const ListActions: React.FC<{
  category: Category;
  config: CategoryCardConfig;
  onAction: (action: CategoryCardAction, category: Category) => void;
}> = ({ category, config, onAction }) => {
  return (
    <div className="flex gap-1">
      {config.availableActions.slice(0, 2).map((action) => (
        <ActionButton
          key={action}
          action={action}
          category={category}
          config={config}
          onAction={onAction}
          variant="icon"
        />
      ))}

      {config.availableActions.length > 2 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="px-2">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {config.availableActions.slice(2).map((action) => (
              <DropdownMenuItem
                key={action}
                onClick={(e) => {
                  e.stopPropagation();
                  onAction(action, category);
                }}
              >
                <ActionButton
                  action={action}
                  category={category}
                  config={config}
                  onAction={() => {}}
                  variant="text"
                />
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export const AdminCategoryCard: React.FC<AdminCategoryCardProps> = ({
  category,
  config: userConfig,
  isSelected,
  onToggleSelection,
  onAction,
  isLoading = false,
  actionLoading = false,
  className,
}) => {
  const config = { ...DEFAULT_CONFIG, ...userConfig };

  // Determine category status styling
  const isDeleted = (category as Category).isDeleted;
  let statusStyle = {};

  if (isDeleted && config.deletedStyle) {
    statusStyle = config.deletedStyle;
  } else if (!category.isActive && config.inactiveStyle) {
    statusStyle = config.inactiveStyle;
  } else if (isDeleted) {
    statusStyle = DEFAULT_DELETED_STYLE;
  } else if (!category.isActive) {
    statusStyle = DEFAULT_INACTIVE_STYLE;
  }

  interface StatusStyle {
    cardClassName?: string;
    textClassName?: string;
  }

  const cardClassName = cn(
    "transition-all cursor-pointer",
    config.viewMode === "grid" ? "h-full hover:shadow-lg" : "hover:shadow-md",
    (statusStyle as unknown as StatusStyle).cardClassName,
    isLoading && "opacity-50",
    className
  );

  const textClassName = cn(
    "font-medium text-sm truncate",
    (statusStyle as unknown as StatusStyle).textClassName
  );

  const handlePrimaryClick = () => {
    if (actionLoading || isLoading) return;
    const primaryAction = config.primaryAction || "view";
    onAction(primaryAction, category);
  };

  if (config.viewMode === "grid") {
    return (
      <Card className={cardClassName}>
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header with selection and status */}
            <div className="flex justify-between items-start">
              {config.showSelection && onToggleSelection && (
                <Input
                  type="checkbox"
                  checked={isSelected || false}
                  onChange={() => onToggleSelection(category)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4"
                  disabled={isLoading || actionLoading}
                />
              )}
              <div className="flex gap-1">
                <StatusBadge category={category} config={config} />
              </div>
            </div>

            {/* Image */}
            {config.showImage && (
              <CategoryImage
                category={category}
                size={{ w: 200, h: 120, class: "aspect-video" }}
              />
            )}

            {/* Content */}
            <div onClick={handlePrimaryClick} className="cursor-pointer">
              <h3 className={cn(textClassName, "mb-1")}>{category.name}</h3>

              {config.showDescription && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {category.description || "No description"}
                </p>
              )}

              {config.showServiceCount && (
                <ServiceCountDisplay category={category} />
              )}
            </div>

            {/* Actions */}
            <GridActions
              category={category}
              config={config}
              onAction={onAction}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  // List view
  return (
    <Card className={cardClassName}>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {/* Selection */}
          {config.showSelection && onToggleSelection && (
            <Input
              type="checkbox"
              checked={isSelected || false}
              onChange={() => onToggleSelection(category)}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4"
              disabled={isLoading || actionLoading}
            />
          )}

          {/* Image */}
          {config.showImage && (
            <CategoryImage
              category={category}
              size={{ w: 48, h: 48, class: "w-12 h-12 flex-shrink-0" }}
            />
          )}

          {/* Content */}
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={handlePrimaryClick}
          >
            <div className="flex items-center gap-2 mb-1">
              <h3 className={textClassName}>{category.name}</h3>
              <StatusBadge category={category} config={config} />
            </div>

            {config.showDescription && (
              <p className="text-xs text-muted-foreground truncate">
                {category.description || "No description"}
              </p>
            )}

            {config.showServiceCount && (
              <ServiceCountDisplay category={category} />
            )}
          </div>

          {/* Actions */}
          <ListActions
            category={category}
            config={config}
            onAction={onAction}
          />
        </div>
      </CardContent>
    </Card>
  );
};
