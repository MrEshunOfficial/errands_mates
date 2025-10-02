"use client";
import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Grid,
  List,
  RefreshCw,
  ArchiveRestore,
  Trash2,
  AlertTriangle,
  Calendar,
  User,
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
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDeletedCategoryManager } from "@/hooks/admin/admin.category.hook";
import {
  CategoryCardConfig,
  CategoryCardAction,
  AdminCategoryCard,
} from "./AdminCategoryCard";
import { format } from "date-fns";
import { CategoryDetails, PopulatedUser } from "@/types";
import { Types } from "mongoose";

type ViewMode = "grid" | "list";

interface DeletedCategoriesPageProps {
  className?: string;
}

const DeletedCategoriesPage: React.FC<DeletedCategoriesPageProps> = ({
  className,
}) => {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedCategories, setSelectedCategories] = useState<
    CategoryDetails[]
  >([]);
  const [categoryToRestore, setCategoryToRestore] =
    useState<CategoryDetails | null>(null);

  const {
    categories: deletedCategories,
    loading: isLoading,
    error,
    pagination,
    fetchDeletedCategories,
    restoreCategory,
    bulkRestore,
    updateLoading,
    updateError,
    updateSuccess,
    clearError,
    clearUpdateState,
    refetch,
    search,
  } = useDeletedCategoryManager({
    autoFetchOnMount: true,
    defaultParams: {
      limit: 20,
      includeUserData: true,
    },
  });

  // Clear success state after showing toast
  useEffect(() => {
    if (updateSuccess) {
      const timer = setTimeout(() => clearUpdateState(), 3000);
      return () => clearTimeout(timer);
    }
  }, [updateSuccess, clearUpdateState]);

  // Card configuration for deleted categories
  const getCardConfigForCategory = useCallback((): CategoryCardConfig => {
    return {
      viewMode,
      showSelection: true,
      showServiceCount: true,
      showStatus: true,
      showImage: true,
      showDescription: true,
      availableActions: ["view", "restore"],
      primaryAction: "view",
      customLabels: {
        restore: "Restore",
        view: "View Details",
      },
      deletedStyle: {
        cardClassName:
          "bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-800",
        badgeClassName:
          "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        textClassName: "text-muted-foreground",
      },
    };
  }, [viewMode]);

  /**
   * Handles an async action with success/error toasts
   * @param action - The async action to execute
   * @param successMsg - Message to show on success
   * @param errorMsg - Message to show on error
   */
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
      search.setQuery(query);

      if (!query.trim()) {
        search.clearSearch();
        return;
      }
      // Assuming the hook handles refetching on query change
    },
    [search]
  );

  const toggleSelection = useCallback((category: CategoryDetails): void => {
    setSelectedCategories((prev) =>
      prev.some((c) => c._id === category._id)
        ? prev.filter((c) => c._id !== category._id)
        : [...prev, category]
    );
  }, []);

  const isSelected = useCallback(
    (category: CategoryDetails): boolean =>
      selectedCategories.some((c) => c._id === category._id),
    [selectedCategories]
  );

  const handleCategoryAction = useCallback(
    (action: CategoryCardAction, category: CategoryDetails): void => {
      switch (action) {
        case "view":
          router.push(`/admin/services/categories/deleted/${category._id}`);
          break;
        case "restore":
          setCategoryToRestore(category);
          break;
        default:
          break;
      }
    },
    [router]
  );

  const confirmRestore = useCallback(async (): Promise<void> => {
    if (!categoryToRestore) return;

    await handleAction(
      () => restoreCategory(categoryToRestore._id.toString()),
      `"${categoryToRestore.name}" restored successfully`,
      "Failed to restore category"
    );

    setCategoryToRestore(null);
    setSelectedCategories((prev) =>
      prev.filter((c) => c._id !== categoryToRestore._id)
    );
  }, [handleAction, restoreCategory, categoryToRestore]);

  const bulkRestoreSelected = useCallback(async (): Promise<void> => {
    if (!selectedCategories.length) return;

    await handleAction(
      () => bulkRestore(selectedCategories.map((c) => c._id.toString())),
      `${selectedCategories.length} categories restored successfully`,
      "Failed to restore categories"
    );

    setSelectedCategories([]);
  }, [selectedCategories, handleAction, bulkRestore]);

  const refreshDeleted = useCallback(async (): Promise<void> => {
    await handleAction(
      () => refetch(),
      "Deleted categories refreshed",
      "Failed to refresh"
    );
  }, [handleAction, refetch]);

  // Format deleted date for display
  const formatDeletedDate = useCallback((date: string | Date): string => {
    try {
      return format(new Date(date), "MMM dd, yyyy 'at' HH:mm");
    } catch (e) {
      console.error("Invalid date format:", date, e);
      return "Unknown date";
    }
  }, []);

  const getUserDisplayName = (
    user: PopulatedUser | Types.ObjectId | string | undefined
  ): string => {
    if (!user) return "Unknown user";

    if (typeof user === "string") return user;

    if (typeof user === "object" && "name" in user) {
      return (
        (user as PopulatedUser).name ||
        (user as PopulatedUser).displayName ||
        (user as PopulatedUser).email ||
        "Unknown user"
      );
    }

    // If it's still an ObjectId, convert to string
    return user.toString();
  };

  // Move useMemo to top level to comply with Rules of Hooks
  const categoryCards = useMemo(
    () =>
      deletedCategories.map((category) => (
        <div key={category._id.toString()} className="relative">
          <AdminCategoryCard
            category={category}
            config={getCardConfigForCategory()}
            isSelected={isSelected(category)}
            onToggleSelection={toggleSelection}
            onAction={handleCategoryAction}
            isLoading={isLoading}
            actionLoading={updateLoading}
          />
          <div className="absolute -bottom-3 -right-1 bg-red-100 dark:bg-red-900 rounded-lg p-2 text-xs">
            {category.deletedAt && (
              <div className="flex items-center gap-1 text-red-700 dark:text-red-300">
                <Calendar className="w-3 h-3" />
                {formatDeletedDate(category.deletedAt)}
              </div>
            )}
            {category.deletedBy && (
              <div className="flex items-center gap-1 text-red-600 dark:text-red-400 mt-1">
                <User className="w-3 h-3" />
                <span>{getUserDisplayName(category.deletedBy)}</span>
              </div>
            )}
          </div>
        </div>
      )),
    [
      deletedCategories,
      getCardConfigForCategory,
      isSelected,
      toggleSelection,
      handleCategoryAction,
      isLoading,
      updateLoading,
      formatDeletedDate,
    ]
  );

  if (error && !deletedCategories.length) {
    return (
      <ErrorState
        title="Failed to load deleted categories"
        message={error}
        onRetry={() => {
          clearError();
          fetchDeletedCategories();
        }}
        showSearch={true}
        searchPlaceholder="Search deleted categories..."
      />
    );
  }

  if (isLoading && deletedCategories.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Loading deleted categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6 w-full", className)}>
      {/* Header */}
      <Card className="bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <Trash2 className="w-5 h-5" />
            Deleted Categories
          </CardTitle>
          <CardDescription className="text-red-600/80 dark:text-red-400/80">
            Categories that have been deleted but can still be restored.
            Permanently deleted categories cannot be recovered.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Search deleted categories..."
            value={search.query}
            onChange={handleSearchChange}
            className="w-full"
            disabled={isLoading}
            aria-label="Search deleted categories"
          />
        </div>

        <div className="flex items-center gap-2">
          {pagination && (
            <div className="text-sm text-muted-foreground px-3">
              {pagination.total} deleted categories
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={refreshDeleted}
            disabled={isLoading}
            aria-label="Refresh deleted categories">
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>

          <div className="flex border rounded-lg p-1">
            {(["list", "grid"] as const).map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode(mode)}
                className="px-3"
                disabled={isLoading}
                aria-label={`Switch to ${mode} view`}>
                {mode === "list" ? (
                  <List className="w-4 h-4" />
                ) : (
                  <Grid className="w-4 h-4" />
                )}
              </Button>
            ))}
          </div>

          <Button
            onClick={() => router.back()}
            variant="outline"
            aria-label="Back to categories">
            Back to Categories
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedCategories.length > 0 && (
        <Card className="bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                {selectedCategories.length} selected for restoration
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={bulkRestoreSelected}
                  disabled={isLoading || updateLoading}
                  className="text-green-600 hover:text-green-700 border-green-300"
                  aria-label="Restore selected categories">
                  <ArchiveRestore className="w-4 h-4 mr-1" />
                  Restore Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCategories([])}
                  aria-label="Clear selection">
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning if no deleted categories */}
      {!isLoading && !error && deletedCategories.length === 0 && (
        <Card className="bg-muted/50">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Deleted Categories</h3>
            <p className="text-muted-foreground mb-4">
              {search.query
                ? `No deleted categories found for "${search.query}"`
                : "There are no deleted categories at the moment."}
            </p>
            <div className="flex items-center justify-center gap-3">
              {search.query && (
                <Button
                  variant="outline"
                  onClick={() => {
                    search.setQuery("");
                    search.clearSearch();
                  }}
                  aria-label="Clear search">
                  Clear search
                </Button>
              )}
              <Button
                onClick={() => router.push("/admin/services/categories")}
                aria-label="View all categories">
                View All Categories
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Grid/List */}
      {deletedCategories.length > 0 && (
        <>
          <div
            className={cn(
              viewMode === "list"
                ? "space-y-4 sm:space-y-2"
                : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            )}>
            {categoryCards}
          </div>

          {/* Pagination info */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.pages} ({pagination.total}{" "}
                total categories)
              </p>
            </div>
          )}
        </>
      )}

      {/* Restore Confirmation Dialog */}
      <AlertDialog
        open={!!categoryToRestore}
        onOpenChange={() => setCategoryToRestore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ArchiveRestore className="w-5 h-5 text-green-600" />
              Restore Category
            </AlertDialogTitle>
            <AlertDialogDescription>
              Restore &quot;{categoryToRestore?.name}&quot; from deleted status?
              This will make the category active and visible again.
              {categoryToRestore &&
                (categoryToRestore.servicesCount || 0) > 0 && (
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-sm">
                    This category has {categoryToRestore.servicesCount || 0}{" "}
                    associated services that will also become active.
                  </div>
                )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRestore}
              className="bg-green-600 text-white hover:bg-green-700"
              aria-label="Restore category">
              <ArchiveRestore className="w-4 h-4 mr-1" />
              Restore Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Loading Overlay */}
      {updateLoading && <LoadingOverlay message="Restoring categories..." />}

      {/* Error Display */}
      {updateError && (
        <Card className="bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Restore Failed</span>
            </div>
            <p className="text-red-600/80 dark:text-red-400/80 text-sm mt-1">
              {updateError}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DeletedCategoriesPage;
