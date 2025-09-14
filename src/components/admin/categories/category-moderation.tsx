"use client";
// File: /components/admin/categories/CategoryModerationDetail.tsx

import {
  useAdminCategory,
  useCategoryModeration,
} from "@/hooks/admin/admin.category.hook";
import { ModerationStatus } from "@/types/base.types";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

interface CategoryModerationDetailProps {
  categoryId: string;
}

export function CategoryModerationDetail({
  categoryId,
}: CategoryModerationDetailProps) {
  const { category } = useAdminCategory(categoryId, {
    autoFetch: true,
  });

  const {
    moderateCategory,
    moderateLoading,
    moderateError,
    moderateSuccess,
    clearModerateState,
  } = useCategoryModeration();

  const [moderationNotes, setModerationNotes] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ModerationStatus>(
    ModerationStatus.PENDING
  );

  const handleModeration = async (status: ModerationStatus) => {
    await moderateCategory(categoryId, {
      moderationStatus: status,
      moderationNotes,
    });
  };

  if (!category)
    return (
      <div className="w-full h-screen flex items-center justify-center p-2">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">preparing please wait...</p>
          </div>
        </div>
      </div>
    );

  return (
    <div className="h-screen space-y-6">
      {/* Category Details Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Category Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Name
            </label>
            <p className="mt-1 text-gray-900 dark:text-gray-100">
              {category.name}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <p className="mt-1">
              <span
                className={`px-2 py-1 rounded text-sm
                  ${
                    category.moderationStatus === ModerationStatus.APPROVED
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : category.moderationStatus === ModerationStatus.REJECTED
                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  }`}
              >
                {category.moderationStatus}
              </span>
            </p>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <p className="mt-1 text-gray-900 dark:text-gray-100">
              {category.description || "No description provided"}
            </p>
          </div>
        </div>
      </div>

      {/* Moderation Action Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Moderation Action
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Moderation Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) =>
                setSelectedStatus(e.target.value as ModerationStatus)
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                         rounded-md bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-gray-100"
            >
              <option value={ModerationStatus.APPROVED}>Approve</option>
              <option value={ModerationStatus.REJECTED}>Reject</option>
              <option value={ModerationStatus.HIDDEN}>Hide</option>
              <option value={ModerationStatus.FLAGGED}>Flag for Review</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Moderation Notes
            </label>
            <textarea
              value={moderationNotes}
              onChange={(e) => setModerationNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                         rounded-md bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-gray-100"
              placeholder="Add notes about your moderation decision..."
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => handleModeration(selectedStatus)}
              disabled={moderateLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md 
                         hover:bg-blue-700 disabled:opacity-50"
            >
              {moderateLoading ? "Processing..." : "Apply Moderation"}
            </button>

            <button
              onClick={clearModerateState}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 
                         text-gray-700 dark:text-gray-200 
                         rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              Reset
            </button>
          </div>

          {moderateError && (
            <div className="text-red-600 dark:text-red-400 text-sm">
              {moderateError}
            </div>
          )}

          {moderateSuccess && (
            <div className="text-green-600 dark:text-green-400 text-sm">
              Moderation action applied successfully!
            </div>
          )}
        </div>
      </div>

      {/* Previous Moderation History */}
      {category.moderationNotes && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Previous Moderation Notes
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {category.moderationNotes}
          </p>
        </div>
      )}
    </div>
  );
}
