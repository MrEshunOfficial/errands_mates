"use client";
import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Category } from "@/types/category.types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Grid, List, RefreshCw, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CategoryCardAction,
  CategoryVariant,
  SharedCategoryCard,
} from "@/components/categories/SharedCategoryCard";
import {
  useCategories,
  useCategorySearch,
} from "@/hooks/public/categories/userCategory.hook";
import { toast } from "sonner";

type ViewMode = "grid" | "list";
type SortOption = "name" | "popular" | "newest";

interface PublicCategoryListProps {
  initialLimit?: number;
  showSearch?: boolean;
  searchPlaceholder?: string;
  className?: string;
  defaultViewMode?: ViewMode;
}

const PublicCategoryList: React.FC<PublicCategoryListProps> = ({
  initialLimit = 24,
  showSearch = true,
  searchPlaceholder = "Search categories...",
  className,
  defaultViewMode = "grid",
}) => {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);
  const [sortBy, setSortBy] = useState<SortOption>("popular");

  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
    fetchParentCategories,
    clearError,
  } = useCategories(
    { limit: initialLimit },
    { includeServices: true, servicesLimit: 3, popularOnly: true }
  );

  const {
    results: searchResults,
    loading: searchLoading,
    error: searchError,
    query: searchQuery,
    setQuery: setSearchQuery,
    searchCategories,
    clearSearch,
  } = useCategorySearch({
    includeServices: true,
    servicesLimit: 3,
    popularOnly: true,
  });

  const isLoading = categoriesLoading || searchLoading;
  const error = categoriesError || searchError;

  useEffect(() => {
    fetchParentCategories();
  }, []); // Only run once on mount

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const query = e.target.value;
      setSearchQuery(query);

      if (!query.trim()) {
        clearSearch();
        return;
      }

      searchCategories({ q: query, limit: initialLimit });
    },
    [setSearchQuery, searchCategories, clearSearch, initialLimit]
  );

  const handleCategoryAction = useCallback(
    (action: CategoryCardAction, categoryVariant: CategoryVariant): void => {
      const category = categoryVariant as Category;

      switch (action) {
        case "explore":
          router.push(`/services/category/${category.slug || category._id}`);
          break;

        case "share":
          const categoryUrl = `${window.location.origin}/categories/${
            category.slug || category._id
          }`;
          navigator.clipboard.writeText(categoryUrl);
          toast.success(`${category.name} shared successfully`);
          break;
        default:
          console.warn(`Unhandled action: ${action}`);
          break;
      }
    },
    [router]
  );

  const getSortedCategories = useCallback(
    (categoriesToSort: Category[]): Category[] => {
      const sorted = [...categoriesToSort];

      switch (sortBy) {
        case "name":
          return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case "popular":
          return sorted.sort((a, b) => {
            const aCount =
              "servicesCount" in a ? (a.servicesCount as number) : 0;
            const bCount =
              "servicesCount" in b ? (b.servicesCount as number) : 0;
            return bCount - aCount;
          });
        case "newest":
          return sorted.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        default:
          return sorted;
      }
    },
    [sortBy]
  );

  const displayCategories = searchQuery
    ? getSortedCategories(searchResults)
    : getSortedCategories(categories);

  if (error && displayCategories.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Failed to load categories</p>
          <p className="text-sm text-destructive">{error}</p>
          <Button
            variant="outline"
            onClick={() => {
              clearError();
              fetchParentCategories();
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading && displayCategories.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Loading categories...</p>
        </div>
      </div>
    );
  }

  if (!isLoading && displayCategories.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? `No categories found for "${searchQuery}"`
              : "No categories available"}
          </p>
          {searchQuery && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                clearSearch();
              }}
            >
              Clear search
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6 w-full", className)}>
      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {showSearch && (
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-9"
              disabled={isLoading}
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as SortOption)}
            disabled={isLoading}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border rounded-lg p-1">
            {(["grid", "list"] as const).map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode(mode)}
                className="px-3"
                disabled={isLoading}
              >
                {mode === "list" ? (
                  <List className="w-4 h-4" />
                ) : (
                  <Grid className="w-4 h-4" />
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Category Count */}
      <div className="text-sm text-muted-foreground">
        {searchQuery ? (
          <span>
            Found {displayCategories.length} categor
            {displayCategories.length === 1 ? "y" : "ies"} for &quot;
            {searchQuery}&quot;
          </span>
        ) : (
          <span>
            Showing {displayCategories.length} categor
            {displayCategories.length === 1 ? "y" : "ies"}
          </span>
        )}
      </div>

      {/* Categories Grid/List */}
      <div
        className={
          viewMode === "list"
            ? "space-y-3"
            : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        }
      >
        {displayCategories.map((category) => (
          <SharedCategoryCard
            key={category._id.toString()}
            category={category as CategoryVariant}
            preset="public"
            config={{
              viewMode,
            }}
            onAction={handleCategoryAction}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* Loading Overlay */}
      {isLoading && displayCategories.length > 0 && (
        <div className="flex justify-center py-4">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

export default PublicCategoryList;
