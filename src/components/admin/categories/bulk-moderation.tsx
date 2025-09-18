import { Input } from "@/components/ui/input";
import {
  useAdminCategoryManager,
  useCategoryModeration,
} from "@/hooks/admin/admin.category.hook";
import { ModerationStatus } from "@/types/base.types";
import { useState, useMemo } from "react";
import { toast } from "sonner";

type BulkActionType = ModerationStatus | "DELETE" | "TOGGLE_STATUS";

export function CategoryModerationBulk() {
  const {
    categories,
    fetchAllCategories,
    searchAllCategories,
    searchResults,
    searchQuery,
    setSearchQuery,
    clearSearch,
  } = useAdminCategoryManager({
    autoFetchOnMount: true,
    includeInactive: true,
  });

  const {
    bulkModerateCategories,
    moderateCategory,
    toggleCategoryStatus,
    bulkToggleStatus,
    deleteCategory,
    bulkDelete,
    moderateLoading,
    moderateError,
    updateLoading,
    updateError,
    deleteLoading,
    deleteError,
  } = useCategoryModeration();

  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set()
  );
  const [bulkAction, setBulkAction] = useState<BulkActionType>(
    ModerationStatus.APPROVED
  );
  const [bulkNotes, setBulkNotes] = useState("");
  const [showModerationPanel, setShowModerationPanel] = useState(false);
  const [loadingStates, setLoadingStates] = useState<Record<string, string>>(
    {}
  );

  const categoriesToModerate = useMemo(() => {
    const source = searchQuery ? searchResults : categories;
    return source.filter(
      (category) =>
        category.moderationStatus === ModerationStatus.PENDING ||
        category.moderationStatus === ModerationStatus.FLAGGED
    );
  }, [categories, searchResults, searchQuery]);

  const handleCategorySelect = (categoryId: string, selected: boolean) => {
    const newSelection = new Set(selectedCategories);
    if (selected) {
      newSelection.add(categoryId);
    } else {
      newSelection.delete(categoryId);
    }
    setSelectedCategories(newSelection);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const allIds = new Set(
        categoriesToModerate.map((cat) => cat._id.toString())
      );
      setSelectedCategories(allIds);
    } else {
      setSelectedCategories(new Set());
    }
  };

  const setLoadingState = (categoryId: string, action: string) => {
    setLoadingStates((prev) => ({ ...prev, [categoryId]: action }));
  };

  const clearLoadingState = (categoryId: string) => {
    setLoadingStates((prev) => {
      const newState = { ...prev };
      delete newState[categoryId];
      return newState;
    });
  };

  // Individual quick actions
  const handleQuickModerate = async (
    categoryId: string,
    status: ModerationStatus,
    notes?: string
  ) => {
    setLoadingState(categoryId, `moderating-${status}`);
    try {
      await moderateCategory(categoryId, {
        moderationStatus: status,
        moderationNotes: notes || `Quick ${status.toLowerCase()} action`,
      });
      toast.success(`Category ${status.toLowerCase()} successfully!`);
      fetchAllCategories();
    } catch {
      toast.error(`Failed to ${status.toLowerCase()} category`);
    } finally {
      clearLoadingState(categoryId);
    }
  };

  const handleQuickToggleStatus = async (categoryId: string) => {
    setLoadingState(categoryId, "toggling");
    try {
      await toggleCategoryStatus(categoryId);
      toast.success("Category status updated successfully!");
      fetchAllCategories();
    } catch {
      toast.error("Failed to update category status");
    } finally {
      clearLoadingState(categoryId);
    }
  };

  const handleQuickDelete = async (categoryId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this category? This action cannot be undone."
      )
    ) {
      return;
    }

    setLoadingState(categoryId, "deleting");
    try {
      await deleteCategory(categoryId);
      toast.success("Category deleted successfully!");
      fetchAllCategories();
    } catch {
      toast.error("Failed to delete category");
    } finally {
      clearLoadingState(categoryId);
    }
  };

  // Bulk operations
  const handleBulkModeration = async () => {
    const categoryIds = Array.from(selectedCategories);

    try {
      if (bulkAction === "DELETE") {
        if (
          !confirm(
            `Are you sure you want to delete ${categoryIds.length} categories? This action cannot be undone.`
          )
        ) {
          return;
        }
        await bulkDelete(categoryIds);
        toast.success(`${categoryIds.length} categories deleted successfully!`);
      } else if (bulkAction === "TOGGLE_STATUS") {
        await bulkToggleStatus(categoryIds);
        toast.success(
          `${categoryIds.length} categories status updated successfully!`
        );
      } else {
        // Standard moderation actions
        const moderationData = categoryIds.map((categoryId) => ({
          categoryId,
          data: {
            moderationStatus: bulkAction as ModerationStatus,
            moderationNotes:
              bulkNotes || `Bulk ${bulkAction.toLowerCase()} action`,
          },
        }));
        await bulkModerateCategories(moderationData);
        toast.success(
          `${categoryIds.length} categories moderated successfully!`
        );
      }

      setSelectedCategories(new Set());
      setShowModerationPanel(false);
      setBulkNotes("");
      fetchAllCategories();
    } catch {
      toast.error("Bulk operation failed");
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      searchAllCategories(query);
    } else {
      clearSearch();
    }
  };

  const isAnyLoading = moderateLoading || updateLoading || deleteLoading;
  const hasErrors = moderateError || updateError || deleteError;

  return (
    <div className="p-4 rounded-md space-y-3 dark:bg-gray-900 dark:text-gray-100">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold dark:text-white">
          Category Moderation Queue
        </h1>
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {categoriesToModerate.length} categories pending moderation
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <input
          type="text"
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
        />
      </div>

      {selectedCategories.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {selectedCategories.size} categories selected
            </span>
            <button
              onClick={() => setShowModerationPanel(!showModerationPanel)}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600">
              Bulk Actions
            </button>
          </div>

          {showModerationPanel && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Bulk Action
                </label>
                <select
                  value={bulkAction}
                  onChange={(e) =>
                    setBulkAction(e.target.value as BulkActionType)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  <optgroup label="Moderation Actions">
                    <option value={ModerationStatus.APPROVED}>
                      Approve All
                    </option>
                    <option value={ModerationStatus.REJECTED}>
                      Reject All
                    </option>
                    <option value={ModerationStatus.HIDDEN}>Hide All</option>
                  </optgroup>
                  <optgroup label="Status Actions">
                    <option value="TOGGLE_STATUS">Toggle Active Status</option>
                  </optgroup>
                  <optgroup label="Destructive Actions">
                    <option value="DELETE">Delete All</option>
                  </optgroup>
                </select>
              </div>

              {!["DELETE", "TOGGLE_STATUS"].includes(bulkAction) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Bulk Notes
                  </label>
                  <textarea
                    value={bulkNotes}
                    onChange={(e) => setBulkNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Notes for all selected categories..."
                  />
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={handleBulkModeration}
                  disabled={isAnyLoading}
                  className={`px-4 py-2 text-white rounded-md disabled:opacity-50 ${
                    bulkAction === "DELETE"
                      ? "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                      : "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                  }`}>
                  {isAnyLoading
                    ? "Processing..."
                    : bulkAction === "DELETE"
                    ? "Delete All"
                    : bulkAction === "TOGGLE_STATUS"
                    ? "Toggle Status"
                    : "Apply to All"}
                </button>
                <button
                  onClick={() => setShowModerationPanel(false)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4 border-b dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <label className="flex items-center text-gray-700 dark:text-gray-200">
              <input
                type="checkbox"
                checked={
                  selectedCategories.size === categoriesToModerate.length &&
                  categoriesToModerate.length > 0
                }
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="mr-2 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 rounded"
              />
              Select All
            </label>
          </div>
        </div>

        <div className="divide-y dark:divide-gray-700">
          {categoriesToModerate.length > 0 ? (
            categoriesToModerate.map((category) => {
              const categoryLoading = loadingStates[category._id.toString()];

              return (
                <div
                  key={category._id.toString()}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-center space-x-4">
                    <Input
                      type="checkbox"
                      checked={selectedCategories.has(category._id.toString())}
                      onChange={(e) =>
                        handleCategorySelect(
                          category._id.toString(),
                          e.target.checked
                        )
                      }
                      className="text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 rounded"
                    />

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                          {category.name}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              category.moderationStatus ===
                              ModerationStatus.PENDING
                                ? "bg-yellow-100 dark:bg-yellow-800/50 text-yellow-800 dark:text-yellow-200"
                                : "bg-orange-100 dark:bg-orange-800/50 text-orange-800 dark:text-orange-200"
                            }`}>
                            {category.moderationStatus}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              category.isActive
                                ? "bg-green-100 dark:bg-green-800/50 text-green-800 dark:text-green-200"
                                : "bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200"
                            }`}>
                            {category.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {category.description || "No description"}
                      </p>

                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          Created:{" "}
                          {new Date(category.createdAt).toLocaleDateString()}
                        </span>
                        <span>Active: {category.isActive ? "Yes" : "No"}</span>
                        {category.moderationNotes && (
                          <span className="text-blue-600 dark:text-blue-400">
                            Has Notes
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-1">
                      {/* Quick Moderation Actions */}
                      <button
                        onClick={() =>
                          handleQuickModerate(
                            category._id.toString(),
                            ModerationStatus.APPROVED
                          )
                        }
                        disabled={categoryLoading === "moderating-APPROVED"}
                        className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-200 rounded hover:bg-green-200 dark:hover:bg-green-800 disabled:opacity-50"
                        title="Quick Approve">
                        {categoryLoading === "moderating-APPROVED"
                          ? "..."
                          : "✓"}
                      </button>

                      <button
                        onClick={() =>
                          handleQuickModerate(
                            category._id.toString(),
                            ModerationStatus.REJECTED
                          )
                        }
                        disabled={categoryLoading === "moderating-REJECTED"}
                        className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800 disabled:opacity-50"
                        title="Quick Reject">
                        {categoryLoading === "moderating-REJECTED"
                          ? "..."
                          : "✗"}
                      </button>

                      <button
                        onClick={() =>
                          handleQuickModerate(
                            category._id.toString(),
                            ModerationStatus.HIDDEN
                          )
                        }
                        disabled={categoryLoading === "moderating-HIDDEN"}
                        className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-200 rounded hover:bg-yellow-200 dark:hover:bg-yellow-800 disabled:opacity-50"
                        title="Quick Hide">
                        {categoryLoading === "moderating-HIDDEN" ? "..." : "👁"}
                      </button>

                      {/* Status Toggle */}
                      <button
                        onClick={() =>
                          handleQuickToggleStatus(category._id.toString())
                        }
                        disabled={categoryLoading === "toggling"}
                        className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-200 rounded hover:bg-purple-200 dark:hover:bg-purple-800 disabled:opacity-50"
                        title={`${
                          category.isActive ? "Deactivate" : "Activate"
                        } Category`}>
                        {categoryLoading === "toggling"
                          ? "..."
                          : category.isActive
                          ? "⏸"
                          : "▶"}
                      </button>

                      {/* Delete Action */}
                      <button
                        onClick={() =>
                          handleQuickDelete(category._id.toString())
                        }
                        disabled={categoryLoading === "deleting"}
                        className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800 disabled:opacity-50"
                        title="Delete Category">
                        {categoryLoading === "deleting" ? "..." : "🗑"}
                      </button>

                      {/* Detailed Review */}
                      <button
                        onClick={() =>
                          window.open(
                            `/admin/services/categories/${category._id}/moderate`,
                            "_blank"
                          )
                        }
                        className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800">
                        Review
                      </button>
                    </div>
                  </div>

                  {/* Show loading indicator if category is being processed */}
                  {categoryLoading && (
                    <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                      Processing: {categoryLoading.replace(/-/g, " ")}...
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No categories pending moderation
            </div>
          )}
        </div>
      </div>

      {hasErrors && (
        <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-700 rounded-md p-4">
          <div className="text-red-800 dark:text-red-200">
            {moderateError || updateError || deleteError}
          </div>
        </div>
      )}
    </div>
  );
}
