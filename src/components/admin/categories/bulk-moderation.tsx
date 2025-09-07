"use client";
import {
  useAdminCategoryManager,
  useCategoryModeration,
} from "@/hooks/categories/adminCategory.hook";
import { ModerationStatus } from "@/types/base.types";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export function CategoryModerationBulk() {
  const {
    categories,
    isLoading,
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

  const { bulkModerateCategories, moderateLoading, moderateError } =
    useCategoryModeration();

  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set()
  );
  const [bulkAction, setBulkAction] = useState<ModerationStatus>(
    ModerationStatus.APPROVED
  );
  const [bulkNotes, setBulkNotes] = useState("");
  const [showModerationPanel, setShowModerationPanel] = useState(false);

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

  const handleBulkModeration = async () => {
    const moderationData = Array.from(selectedCategories).map((categoryId) => ({
      categoryId,
      data: {
        moderationStatus: bulkAction,
        moderationNotes: bulkNotes,
      },
    }));

    await bulkModerateCategories(moderationData);
    toast.success("Moderation successful!");
    setSelectedCategories(new Set());
    setShowModerationPanel(false);
    setBulkNotes("");
    fetchAllCategories();
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      searchAllCategories(query);
    } else {
      clearSearch();
    }
  };

  return (
    <div className="space-y-6 dark:bg-gray-900 dark:text-gray-100">
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
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
            >
              Moderate Selected
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
                    setBulkAction(e.target.value as ModerationStatus)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value={ModerationStatus.APPROVED}>Approve All</option>
                  <option value={ModerationStatus.REJECTED}>Reject All</option>
                  <option value={ModerationStatus.HIDDEN}>Hide All</option>
                </select>
              </div>

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

              <div className="flex space-x-2">
                <button
                  onClick={handleBulkModeration}
                  disabled={moderateLoading}
                  className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50"
                >
                  {moderateLoading ? "Processing..." : "Apply to All"}
                </button>
                <button
                  onClick={() => setShowModerationPanel(false)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
                >
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
          {isLoading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Loading categories...
            </div>
          ) : categoriesToModerate.length > 0 ? (
            categoriesToModerate.map((category) => (
              <div
                key={category._id.toString()}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="flex items-center space-x-4">
                  <input
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
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          category.moderationStatus === ModerationStatus.PENDING
                            ? "bg-yellow-100 dark:bg-yellow-800/50 text-yellow-800 dark:text-yellow-200"
                            : "bg-orange-100 dark:bg-orange-800/50 text-orange-800 dark:text-orange-200"
                        }`}
                      >
                        {category.moderationStatus}
                      </span>
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
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        window.open(
                          `/admin/services/categories/${category._id}/moderate`,
                          "_blank"
                        )
                      }
                      className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                    >
                      Review
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No categories pending moderation
            </div>
          )}
        </div>
      </div>

      {moderateError && (
        <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-700 rounded-md p-4">
          <div className="text-red-800 dark:text-red-200">{moderateError}</div>
        </div>
      )}
    </div>
  );
}
