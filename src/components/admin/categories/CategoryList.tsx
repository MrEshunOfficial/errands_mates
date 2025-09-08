"use client";
import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Category } from "@/types/category.types";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Grid,
  List,
  RefreshCw,
  Plus,
  Trash2,
  RotateCcw,
  ExternalLink,
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
import { useAdminCategoryManager } from "@/hooks/categories/adminCategory.hook";
import Image from "next/image";

// Type definitions
type CategoryFilter = "all" | "active" | "inactive";
type ViewMode = "grid" | "list";

interface SimplifiedCategoryListProps {
  includeSubcategories?: boolean;
  includeServicesCount?: boolean;
  limit?: number;
  onCategoryClick?: (category: Category) => void;
  showSearch?: boolean;
  searchPlaceholder?: string;
  className?: string;
  includeInactive?: boolean;
  defaultFilter?: CategoryFilter;
}

interface CategoryImageProps {
  category: Category;
  size: {
    w: number;
    h: number;
    class: string;
  };
}

interface ActionBtnProps {
  category: Category;
  isGrid?: boolean;
  onDelete: (category: Category) => void;
  onRestore: (category: Category) => void;
}

interface ServiceCountDisplayProps {
  category: Category;
  includeServicesCount: boolean;
  getServiceCount: (category: Category) => number;
}

interface CategoryCardProps {
  category: Category;
  isGrid: boolean;
  isSelected: (category: Category) => boolean;
  onToggleSelection: (category: Category) => void;
  onCategoryView: (category: Category) => void;
  onDelete: (category: Category) => void;
  onRestore: (category: Category) => void;
  includeServicesCount: boolean;
  getServiceCount: (category: Category) => number;
}

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

const SimplifiedCategoryList: React.FC<SimplifiedCategoryListProps> = ({
  includeSubcategories = true,
  includeServicesCount = true,
  limit = 20,
  onCategoryClick,
  showSearch = true,
  searchPlaceholder = "Search categories...",
  className,
  includeInactive = true,
  defaultFilter = "all",
}) => {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );
  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilter>(defaultFilter);

  const {
    categories,
    allCategories,
    inactiveCategories,
    searchResults,
    searchQuery,
    isLoading,
    error,
    fetchAllCategories,
    fetchInactiveCategories,
    searchAllCategories,
    searchInactiveCategories,
    clearSearch,
    setSearchQuery,
    deleteCategory,
    restoreCategory,
    bulkDelete,
    bulkRestore,
    bulkToggleStatus,
    updateLoading,
    deleteLoading,
    clearError,
    refetch,
  } = useAdminCategoryManager({
    autoFetchOnMount: true,
    defaultParams: {
      limit,
      includeSubcategories,
      includeServicesCount,
      includeUserData: true,
    },
    includeInactive,
  });

  const getFilteredCategories = useCallback((): Category[] => {
    if (searchQuery) return searchResults;

    const filterMap: Record<CategoryFilter, Category[]> = {
      all: allCategories,
      active: categories.filter((c) => c.isActive),
      inactive: inactiveCategories,
    };

    return filterMap[categoryFilter] || categories;
  }, [
    searchQuery,
    searchResults,
    categoryFilter,
    allCategories,
    categories,
    inactiveCategories,
  ]);

  // Helper function to get service count from category object
  const getServiceCount = useCallback((category: Category): number => {
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
  }, []);

  const handleAction = useCallback(
    async (
      action: () => Promise<unknown>,
      successMsg: string,
      errorMsg: string
    ): Promise<void> => {
      try {
        await action();
        if (successMsg) {
          toast.success(successMsg);
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        toast.error(`${errorMsg}: ${errorMessage}`);
      }
    },
    []
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const query = e.target.value;
      setSearchQuery(query);

      if (!query.trim()) {
        clearSearch();
        return;
      }

      const searchFn =
        categoryFilter === "inactive"
          ? searchInactiveCategories
          : searchAllCategories;

      searchFn(query, limit);
    },
    [
      setSearchQuery,
      searchAllCategories,
      searchInactiveCategories,
      clearSearch,
      limit,
      categoryFilter,
    ]
  );

  const handleFilterChange = useCallback(
    async (filter: CategoryFilter): Promise<void> => {
      setCategoryFilter(filter);
      clearSearch();

      const fetchFn =
        filter === "inactive" ? fetchInactiveCategories : fetchAllCategories;

      await handleAction(fetchFn, "", "Failed to filter categories");
    },
    [clearSearch, fetchAllCategories, fetchInactiveCategories, handleAction]
  );

  const toggleSelection = useCallback((category: Category): void => {
    setSelectedCategories((prev) =>
      prev.some((c) => c._id === category._id)
        ? prev.filter((c) => c._id !== category._id)
        : [...prev, category]
    );
  }, []);

  const isSelected = useCallback(
    (category: Category): boolean =>
      selectedCategories.some((c) => c._id === category._id),
    [selectedCategories]
  );

  const handleCategoryView = useCallback(
    (category: Category): void => {
      if (onCategoryClick) {
        onCategoryClick(category);
      } else {
        router.push(`/admin/services/categories/${category._id}`);
      }
    },
    [onCategoryClick, router]
  );

  const handleCategoryDelete = useCallback((category: Category): void => {
    setCategoryToDelete(category);
  }, []);

  const handleCategoryRestore = useCallback(
    async (category: Category): Promise<void> => {
      await handleAction(
        () => restoreCategory(category._id.toString()),
        `"${category.name}" restored`,
        "Failed to restore"
      );
    },
    [handleAction, restoreCategory]
  );

  const createBulkHandler = useCallback(
    (action: (ids: string[]) => Promise<unknown>, successMessage: string) =>
      async (): Promise<void> => {
        if (!selectedCategories.length) return;

        await handleAction(
          () => action(selectedCategories.map((c) => c._id.toString())),
          `${selectedCategories.length} ${successMessage}`,
          `Failed to ${successMessage.split(" ")[1]}`
        );

        setSelectedCategories([]);
      },
    [selectedCategories, handleAction]
  );

  const displayCategories = getFilteredCategories();

  // Component definitions
  const CategoryImage: React.FC<CategoryImageProps> = ({ category, size }) => (
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

  const ActionBtn: React.FC<ActionBtnProps> = ({
    category,
    isGrid,
    onDelete,
    onRestore,
  }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        if (category.isActive) {
          onDelete(category);
        } else {
          onRestore(category);
        }
      }}
      className={cn(
        isGrid
          ? category.isActive
            ? "text-destructive"
            : "text-green-600"
          : `px-2 ${category.isActive ? "text-destructive" : "text-green-600"}`
      )}>
      {category.isActive ? (
        <Trash2 className="w-4 h-4" />
      ) : (
        <RotateCcw className="w-4 h-4" />
      )}
      {isGrid && (
        <span className="ml-1">{category.isActive ? "Delete" : "Restore"}</span>
      )}
    </Button>
  );

  const ServiceCountDisplay: React.FC<ServiceCountDisplayProps> = ({
    category,
    includeServicesCount,
    getServiceCount,
  }) => {
    if (!includeServicesCount) return null;

    const serviceCount = getServiceCount(category);

    return (
      <p className="text-xs text-muted-foreground">
        {serviceCount} service{serviceCount !== 1 ? "s" : ""}
      </p>
    );
  };

  const CategoryCard: React.FC<CategoryCardProps> = ({
    category,
    isGrid,
    isSelected,
    onToggleSelection,
    onCategoryView,
    onDelete,
    onRestore,
    includeServicesCount,
    getServiceCount,
  }) => (
    <Card
      className={cn(
        "transition-all cursor-pointer",
        isGrid ? "h-full hover:shadow-lg" : "hover:shadow-md",
        !category.isActive && "bg-orange-50/50 border-orange-200"
      )}>
      <CardContent className="px-2">
        {isGrid ? (
          <div className="space-y-3">
            <div className="flex justify-between">
              <Input
                type="checkbox"
                checked={isSelected(category)}
                onChange={() => onToggleSelection(category)}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4"
              />
              {!category.isActive && (
                <Badge variant="secondary" className="text-xs">
                  Inactive
                </Badge>
              )}
            </div>
            <CategoryImage
              category={category}
              size={{ w: 200, h: 120, class: "aspect-video" }}
            />
            <div
              onClick={() => onCategoryView(category)}
              className="cursor-pointer">
              <h3 className="font-medium text-sm truncate mb-1">
                {category.name}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {category.description || "No description"}
              </p>
              <ServiceCountDisplay
                category={category}
                includeServicesCount={includeServicesCount}
                getServiceCount={getServiceCount}
              />
            </div>
            <div className="flex justify-between pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onCategoryView(category);
                }}>
                <ExternalLink className="w-4 h-4 mr-1" />
                View
              </Button>
              <ActionBtn
                category={category}
                isGrid
                onDelete={onDelete}
                onRestore={onRestore}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Input
              type="checkbox"
              checked={isSelected(category)}
              onChange={() => onToggleSelection(category)}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4"
            />
            <CategoryImage
              category={category}
              size={{ w: 48, h: 48, class: "w-12 h-12 flex-shrink-0" }}
            />
            <div
              className="flex-1 min-w-0 cursor-pointer"
              onClick={() => onCategoryView(category)}>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-sm truncate">
                  {category.name}
                </h3>
                {!category.isActive && (
                  <Badge variant="secondary" className="text-xs">
                    Inactive
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {category.description || "No description"}
              </p>
              <ServiceCountDisplay
                category={category}
                includeServicesCount={includeServicesCount}
                getServiceCount={getServiceCount}
              />
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onCategoryView(category);
                }}
                className="px-2">
                <ExternalLink className="w-4 h-4" />
              </Button>
              <ActionBtn
                category={category}
                onDelete={onDelete}
                onRestore={onRestore}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Error state
  if (error && !displayCategories.length && !isLoading) {
    return (
      <ErrorState
        title="Failed to load categories"
        message={error}
        onRetry={() => {
          clearError();
          handleFilterChange(categoryFilter);
        }}
        showSearch={showSearch}
        searchPlaceholder={searchPlaceholder}
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
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full"
              disabled={isLoading}
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          <Select value={categoryFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              {(["all", "active", "inactive"] as const).map((filter) => (
                <SelectItem key={filter} value={filter}>
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handleAction(
                async () => {
                  clearSearch();
                  await refetch();
                },
                "Categories refreshed",
                "Failed to refresh"
              )
            }
            disabled={isLoading}>
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
          <div className="flex border rounded-lg p-1">
            {(["list", "grid"] as const).map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode(mode)}
                className="px-3">
                {mode === "list" ? (
                  <List className="w-4 h-4" />
                ) : (
                  <Grid className="w-4 h-4" />
                )}
              </Button>
            ))}
          </div>

          <Button
            onClick={() => router.push("/admin/services/categories/create")}>
            <Plus className="w-4 h-4 mr-2" />
            Create
          </Button>
        </div>
      </div>

      {selectedCategories.length > 0 && (
        <div className="bg-muted/50 border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedCategories.length} selected
            </span>
            <div className="flex gap-2">
              {selectedCategories.some((c) => !c.isActive) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={createBulkHandler(
                    bulkRestore,
                    "categories restored"
                  )}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Restore
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={createBulkHandler(
                  bulkToggleStatus,
                  "categories status updated"
                )}>
                Toggle Status
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Categories</AlertDialogTitle>
                    <AlertDialogDescription>
                      Delete {selectedCategories.length} selected categories?
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={createBulkHandler(
                        bulkDelete,
                        "categories deleted"
                      )}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCategories([])}>
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      {isLoading && !displayCategories.length ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : !displayCategories.length ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery
              ? `No results for "${searchQuery}"`
              : "No categories found"}
          </h3>
          <div className="flex items-center justify-center gap-3">
            {searchQuery && (
              <Button variant="outline" onClick={clearSearch}>
                Clear search
              </Button>
            )}
            <Button
              onClick={() => router.push("/admin/services/categories/create")}>
              <Plus className="w-4 h-4 mr-2" />
              Create Category
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={
            viewMode === "list"
              ? "space-y-2"
              : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          }>
          {displayCategories.map((category) => (
            <CategoryCard
              key={category._id.toString()}
              category={category}
              isGrid={viewMode === "grid"}
              isSelected={isSelected}
              onToggleSelection={toggleSelection}
              onCategoryView={handleCategoryView}
              onDelete={handleCategoryDelete}
              onRestore={handleCategoryRestore}
              includeServicesCount={includeServicesCount}
              getServiceCount={getServiceCount}
            />
          ))}
        </div>
      )}

      <AlertDialog
        open={!!categoryToDelete}
        onOpenChange={() => setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &quot;{categoryToDelete?.name}&quot;? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!categoryToDelete) return;

                await handleAction(
                  () => deleteCategory(categoryToDelete._id.toString()),
                  `"${categoryToDelete.name}" deleted successfully`,
                  "Failed to delete category"
                );

                setCategoryToDelete(null);
                setSelectedCategories((prev) =>
                  prev.filter((c) => c._id !== categoryToDelete._id)
                );
              }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {(updateLoading || deleteLoading) && (
        <LoadingOverlay
          message={updateLoading ? "Updating..." : "Deleting..."}
        />
      )}
    </div>
  );
};

export default SimplifiedCategoryList;
