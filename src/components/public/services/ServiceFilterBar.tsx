"use client";

import React, { useState, useCallback } from "react";
import {
  Search,
  X,
  Filter,
  ArrowUpDown,
  DollarSign,
  Tag as TagIcon,
  ChevronDown,
} from "lucide-react";
import { Types } from "mongoose";

// Types
type SortOption = "createdAt" | "title" | "basePrice" | "updatedAt" | "";

interface FilterState {
  search: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  sortBy: SortOption;
}

interface Category {
  _id: Types.ObjectId;
  name: string;
}

interface ServiceFilterBarProps {
  filterState: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onSearchChange: (search: string) => void;
  onClearFilters: () => void;
  categories: Category[];
  activeFilterCount: number;
  isLoading?: boolean;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "", label: "Most Relevant" },
  { value: "createdAt", label: "Newest First" },
  { value: "basePrice", label: "Price: Low to High" },
  { value: "title", label: "Name A-Z" },
];

export default function ServiceFilterBar({
  filterState,
  onFilterChange,
  onSearchChange,
  onClearFilters,
  categories,
  activeFilterCount,
  isLoading = false,
}: ServiceFilterBarProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Handle individual filter updates
  const updateFilter = useCallback(
    (key: keyof FilterState, value: string) => {
      const newFilters = { ...filterState, [key]: value };
      onFilterChange(newFilters);
    },
    [filterState, onFilterChange]
  );

  // Handle price range updates
  const updatePriceRange = useCallback(
    (minPrice: string, maxPrice: string) => {
      const newFilters = { ...filterState, minPrice, maxPrice };
      onFilterChange(newFilters);
    },
    [filterState, onFilterChange]
  );

  // Remove specific filter
  const removeFilter = useCallback(
    (filterKey: keyof FilterState) => {
      const updates: Partial<FilterState> = {};

      if (filterKey === "minPrice" || filterKey === "maxPrice") {
        updates.minPrice = "";
        updates.maxPrice = "";
      } else {
        updates[filterKey] = "";
      }

      const newFilters = { ...filterState, ...updates };
      onFilterChange(newFilters);
    },
    [filterState, onFilterChange]
  );

  // Check if filters are active
  const hasActiveFilters = activeFilterCount > 0;

  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    return (
      categories.find((c) => c._id.toString() === categoryId)?.name || "Unknown"
    );
  };

  return (
    <div className="mb-2">
      {/* Main Filter Row */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search services, skills, categories..."
            value={filterState.search}
            onChange={(e) => onSearchChange(e.target.value)}
            disabled={isLoading}
            className="w-full pl-12 pr-4 py-3.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap lg:flex-nowrap gap-3">
          {/* Category Filter */}
          <div className="relative min-w-[160px]">
            <select
              value={filterState.category}
              onChange={(e) => updateFilter("category", e.target.value)}
              disabled={isLoading}
              className="w-full appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3.5 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer disabled:opacity-50"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option
                  key={category._id.toString()}
                  value={category._id.toString()}
                >
                  {category.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Sort Filter */}
          <div className="relative min-w-[140px]">
            <select
              value={filterState.sortBy}
              onChange={(e) =>
                updateFilter("sortBy", e.target.value as SortOption)
              }
              disabled={isLoading}
              className="w-full appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3.5 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer disabled:opacity-50"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value || "default"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ArrowUpDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-3.5 rounded-xl border transition-all font-medium whitespace-nowrap disabled:opacity-50 ${
              showAdvancedFilters
                ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300"
                : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Active Filters Pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 py-1.5">
            Active filters:
          </span>

          {filterState.search && (
            <FilterPill
              icon={<Search className="h-3 w-3" />}
              label={`"${filterState.search}"`}
              onRemove={() => removeFilter("search")}
              color="blue"
            />
          )}

          {filterState.category && (
            <FilterPill
              icon={<TagIcon className="h-3 w-3" />}
              label={getCategoryName(filterState.category)}
              onRemove={() => removeFilter("category")}
              color="green"
            />
          )}

          {(filterState.minPrice || filterState.maxPrice) && (
            <FilterPill
              icon={<DollarSign className="h-3 w-3" />}
              label={`GHS ${filterState.minPrice || "0"} - ${
                filterState.maxPrice || "∞"
              }`}
              onRemove={() => removeFilter("minPrice")}
              color="purple"
            />
          )}

          {filterState.sortBy && (
            <FilterPill
              icon={<ArrowUpDown className="h-3 w-3" />}
              label={
                SORT_OPTIONS.find((s) => s.value === filterState.sortBy)
                  ?.label || ""
              }
              onRemove={() => removeFilter("sortBy")}
              color="orange"
            />
          )}

          <button
            onClick={onClearFilters}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-200 dark:border-red-800 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium transition-colors"
          >
            <X className="h-3 w-3" />
            Clear All
          </button>
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="border-t border-gray-100 dark:border-gray-700 p-6 bg-gray-50/50 dark:bg-gray-700/20">
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Price Range (GHS)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Minimum
                </label>
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  value={filterState.minPrice}
                  onChange={(e) =>
                    updatePriceRange(e.target.value, filterState.maxPrice)
                  }
                  disabled={isLoading}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maximum
                </label>
                <input
                  type="number"
                  placeholder="No limit"
                  min="0"
                  step="0.01"
                  value={filterState.maxPrice}
                  onChange={(e) =>
                    updatePriceRange(filterState.minPrice, e.target.value)
                  }
                  disabled={isLoading}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setShowAdvancedFilters(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Filter Pill Component
interface FilterPillProps {
  icon: React.ReactNode;
  label: string;
  onRemove: () => void;
  color: "blue" | "green" | "purple" | "orange";
}

function FilterPill({ icon, label, onRemove, color }: FilterPillProps) {
  const colorClasses = {
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800",
    green:
      "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800",
    purple:
      "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-800",
    orange:
      "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 hover:bg-orange-200 dark:hover:bg-orange-800",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${colorClasses[color]}`}
    >
      {icon}
      {label}
      <button
        onClick={onRemove}
        className="rounded-full p-0.5 ml-1 hover:scale-110 transition-transform"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
