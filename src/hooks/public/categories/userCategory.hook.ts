import { useState, useCallback, useEffect, useMemo } from "react";

import { Category } from "@/types/category.types";
import {
  categoryAPI,
  CategoryAPIError,
  CategorySearchParams,
  CategorySearchQuery,
  CategoryFetchOptions,
  ParentCategoriesFetchOptions,
  SubcategoriesFetchOptions,
} from "@/lib/api/categories/category.api";

// Enhanced category state interface with new service-related features
interface CategoryState {
  category: Category | null;
  categories: Category[];
  searchResults: Category[];
  featuredCategories: Category[];
  navigationCategories: Category[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  searchQuery: string;
  params: CategorySearchParams;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

// Enhanced category actions interface with new service-related methods
interface CategoryActions {
  // Single category operations
  fetchCategory: (id: string, options?: CategoryFetchOptions) => Promise<void>;
  fetchCategoryBySlug: (
    slug: string,
    options?: CategoryFetchOptions
  ) => Promise<void>;
  fetchCategoryWithAllServices: (
    id: string,
    servicesLimit?: number
  ) => Promise<void>; // NEW
  fetchCategoryBreadcrumb: (id: string) => Promise<void>; // NEW

  // Category list operations
  fetchCategories: (searchParams?: CategorySearchParams) => Promise<void>;
  fetchParentCategories: (
    options?: ParentCategoriesFetchOptions
  ) => Promise<void>;
  fetchSubcategories: (
    parentId: string,
    options?: SubcategoriesFetchOptions
  ) => Promise<void>;
  fetchCategoriesWithPopularServices: (
    searchParams?: CategorySearchParams
  ) => Promise<void>; // NEW
  fetchParentCategoriesWithServices: (
    servicesLimit?: number,
    popularOnly?: boolean
  ) => Promise<void>; // NEW
  fetchSubcategoriesWithServices: (
    parentId: string,
    servicesLimit?: number,
    popularOnly?: boolean
  ) => Promise<void>; // NEW

  // NEW: Special purpose fetches
  fetchFeaturedCategories: (limit?: number) => Promise<void>;
  fetchNavigationCategories: () => Promise<void>;

  // Search operations
  searchCategories: (searchParams: CategorySearchQuery) => Promise<void>;
  clearSearch: () => void;
  setSearchQuery: (query: string) => void;

  // Utility operations
  updateParams: (newParams: Partial<CategorySearchParams>) => void;
  clearData: () => void;
  clearError: () => void;
  refetch: () => Promise<void>;
}

export const useCategory = (
  categoryId?: string,
  options?: {
    includeSubcategories?: boolean;
    includeUserData?: boolean;
    includeServices?: boolean; // NEW: Include services data
    servicesLimit?: number; // NEW: Limit number of services
    popularOnly?: boolean; // NEW: Only include popular services
    autoFetch?: boolean;
    autoFetchCategories?: boolean;
    defaultParams?: CategorySearchParams;
  }
): CategoryState & CategoryActions => {
  const [state, setState] = useState<CategoryState>({
    category: null,
    categories: [],
    searchResults: [],
    featuredCategories: [],
    navigationCategories: [],
    pagination: undefined,
    searchQuery: "",
    params: options?.defaultParams || {},
    isLoading: !!(
      (categoryId && options?.autoFetch !== false) ||
      options?.autoFetchCategories
    ),
    error: null,
    isInitialized: false,
  });

  // Memoize options to prevent unnecessary re-renders
  const memoizedOptions = useMemo(() => options, [options]);

  const updateState = useCallback((updates: Partial<CategoryState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Generic action handler for consistent error handling
  const handleCategoryAction = useCallback(
    async <T>(
      action: () => Promise<T>,
      onSuccess?: (response: T) => void
    ): Promise<T> => {
      try {
        updateState({ isLoading: true, error: null });

        const response = await action();

        updateState({ isLoading: false });

        onSuccess?.(response);
        return response;
      } catch (error) {
        const errorMessage =
          error instanceof CategoryAPIError
            ? error.message
            : "An unexpected error occurred";

        updateState({
          isLoading: false,
          error: errorMessage,
        });
        throw error;
      }
    },
    [updateState]
  );

  // Single category operations
  const fetchCategory = useCallback(
    async (id: string, fetchOptions?: CategoryFetchOptions) => {
      const defaultOptions: CategoryFetchOptions = {
        includeSubcategories: memoizedOptions?.includeSubcategories,
        includeUserData: memoizedOptions?.includeUserData,
        includeServices: memoizedOptions?.includeServices,
        servicesLimit: memoizedOptions?.servicesLimit,
        popularOnly: memoizedOptions?.popularOnly,
      };

      const finalOptions = { ...defaultOptions, ...fetchOptions };

      await handleCategoryAction(
        () => categoryAPI.getCategoryById(id, finalOptions),
        (response) => {
          updateState({ category: response.data?.category || null });
        }
      );
    },
    [handleCategoryAction, memoizedOptions, updateState]
  );

  const fetchCategoryBySlug = useCallback(
    async (slug: string, fetchOptions?: CategoryFetchOptions) => {
      const defaultOptions: CategoryFetchOptions = {
        includeSubcategories: memoizedOptions?.includeSubcategories,
        includeUserData: memoizedOptions?.includeUserData,
        includeServices: memoizedOptions?.includeServices,
        servicesLimit: memoizedOptions?.servicesLimit,
        popularOnly: memoizedOptions?.popularOnly,
      };

      const finalOptions = { ...defaultOptions, ...fetchOptions };

      await handleCategoryAction(
        () => categoryAPI.getCategoryBySlug(slug, finalOptions),
        (response) => {
          updateState({ category: response.data?.category || null });
        }
      );
    },
    [handleCategoryAction, memoizedOptions, updateState]
  );

  // NEW: Fetch category with all its services - perfect for detailed category pages
  const fetchCategoryWithAllServices = useCallback(
    async (id: string, servicesLimit = 20) => {
      await handleCategoryAction(
        () => categoryAPI.getCategoryWithAllServices(id, servicesLimit),
        (response) => {
          updateState({ category: response.data?.category || null });
        }
      );
    },
    [handleCategoryAction, updateState]
  );

  // NEW: Fetch minimal category data for breadcrumbs
  const fetchCategoryBreadcrumb = useCallback(
    async (id: string) => {
      await handleCategoryAction(
        () => categoryAPI.getCategoryBreadcrumb(id),
        (response) => {
          updateState({ category: response.data?.category || null });
        }
      );
    },
    [handleCategoryAction, updateState]
  );

  // Category list operations
  const fetchCategories = useCallback(
    async (searchParams?: CategorySearchParams) => {
      const queryParams = searchParams || state.params;

      await handleCategoryAction(
        () => categoryAPI.getCategories(queryParams),
        (response) => {
          updateState({
            categories: response.data.categories,
            pagination: response.data.pagination,
          });
        }
      );
    },
    [handleCategoryAction, state.params, updateState]
  );

  const fetchParentCategories = useCallback(
    async (fetchOptions?: ParentCategoriesFetchOptions) => {
      const defaultOptions: ParentCategoriesFetchOptions = {
        includeUserData: memoizedOptions?.includeUserData,
        includeServices: memoizedOptions?.includeServices,
        servicesLimit: memoizedOptions?.servicesLimit,
        popularOnly: memoizedOptions?.popularOnly,
        includeInactive: false, // Always exclude inactive categories for users
      };

      const finalOptions = {
        ...defaultOptions,
        ...fetchOptions,
        includeInactive: false,
      };

      await handleCategoryAction(
        () => categoryAPI.getParentCategories(finalOptions),
        (response) => {
          updateState({
            categories: response.data.categories,
            pagination: undefined,
          });
        }
      );
    },
    [handleCategoryAction, memoizedOptions, updateState]
  );

  const fetchSubcategories = useCallback(
    async (parentId: string, fetchOptions?: SubcategoriesFetchOptions) => {
      const defaultOptions: SubcategoriesFetchOptions = {
        includeUserData: memoizedOptions?.includeUserData,
        includeServices: memoizedOptions?.includeServices,
        servicesLimit: memoizedOptions?.servicesLimit,
        popularOnly: memoizedOptions?.popularOnly,
      };

      const finalOptions = { ...defaultOptions, ...fetchOptions };

      await handleCategoryAction(
        () => categoryAPI.getSubcategories(parentId, finalOptions),
        (response) => {
          updateState({
            categories: response.data.categories,
            pagination: undefined,
          });
        }
      );
    },
    [handleCategoryAction, memoizedOptions, updateState]
  );

  // NEW: Enhanced category fetching methods with services using optimized API methods
  const fetchCategoriesWithPopularServices = useCallback(
    async (searchParams?: CategorySearchParams) => {
      const queryParams = { ...state.params, ...searchParams };

      await handleCategoryAction(
        () => categoryAPI.getCategoriesWithPopularServices(queryParams),
        (response) => {
          updateState({
            categories: response.data.categories,
            pagination: response.data.pagination,
          });
        }
      );
    },
    [handleCategoryAction, state.params, updateState]
  );

  const fetchParentCategoriesWithServices = useCallback(
    async (servicesLimit = 5, popularOnly = false) => {
      await handleCategoryAction(
        () =>
          categoryAPI.getParentCategoriesWithServices(
            servicesLimit,
            popularOnly
          ),
        (response) => {
          updateState({
            categories: response.data.categories,
            pagination: undefined,
          });
        }
      );
    },
    [handleCategoryAction, updateState]
  );

  const fetchSubcategoriesWithServices = useCallback(
    async (parentId: string, servicesLimit = 3, popularOnly = true) => {
      await handleCategoryAction(
        () =>
          categoryAPI.getSubcategoriesWithServices(
            parentId,
            servicesLimit,
            popularOnly
          ),
        (response) => {
          updateState({
            categories: response.data.categories,
            pagination: undefined,
          });
        }
      );
    },
    [handleCategoryAction, updateState]
  );

  // NEW: Special purpose fetches for common UI patterns using optimized API methods
  const fetchFeaturedCategories = useCallback(
    async (limit = 8) => {
      await handleCategoryAction(
        () => categoryAPI.getFeaturedCategories(limit),
        (response) => {
          updateState({
            featuredCategories: response.data.categories,
          });
        }
      );
    },
    [handleCategoryAction, updateState]
  );

  const fetchNavigationCategories = useCallback(async () => {
    await handleCategoryAction(
      () => categoryAPI.getCategoriesForNavigation(),
      (response) => {
        updateState({
          navigationCategories: response.data.categories,
        });
      }
    );
  }, [handleCategoryAction, updateState]);

  // Search operations - enhanced to exclude inactive categories for users
  const searchCategories = useCallback(
    async (searchParams: CategorySearchQuery) => {
      if (!searchParams.q.trim()) {
        updateState({
          searchResults: [],
          searchQuery: searchParams.q,
        });
        return;
      }

      // Ensure we don't include inactive categories for users
      const userSearchParams = {
        ...searchParams,
        includeInactive: false,
      };

      await handleCategoryAction(
        () => categoryAPI.searchCategories(userSearchParams),
        (response) => {
          updateState({
            searchResults: response.data.categories,
            searchQuery: searchParams.q,
          });
        }
      );
    },
    [handleCategoryAction, updateState]
  );

  const clearSearch = useCallback(() => {
    updateState({
      searchResults: [],
      searchQuery: "",
    });
  }, [updateState]);

  const setSearchQuery = useCallback(
    (query: string) => {
      updateState({ searchQuery: query });
    },
    [updateState]
  );

  // Utility operations
  const updateParams = useCallback(
    (newParams: Partial<CategorySearchParams>) => {
      // Ensure inactive categories are never included for regular users
      const safeParams = {
        ...state.params,
        ...newParams,
        includeInactive: false,
      };
      updateState({ params: safeParams });
    },
    [updateState, state.params]
  );

  const clearData = useCallback(() => {
    updateState({
      category: null,
      categories: [],
      searchResults: [],
      featuredCategories: [],
      navigationCategories: [],
      pagination: undefined,
    });
  }, [updateState]);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const refetch = useCallback(async () => {
    if (categoryId && state.category) {
      await fetchCategory(categoryId);
    }
    if (state.categories.length > 0) {
      await fetchCategories();
    }
  }, [
    categoryId,
    state.category,
    state.categories.length,
    fetchCategory,
    fetchCategories,
  ]);

  // Enhanced auto-initialization effect
  useEffect(() => {
    let mounted = true;

    type Pagination = {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };

    type CategoryResult = { type: "category"; data: Category | null };
    type CategoriesResult = {
      type: "categories";
      data: { categories: Category[]; pagination: Pagination };
    };
    type Result = CategoryResult | CategoriesResult;

    const initializeCategory = async () => {
      try {
        const promises: Promise<Result>[] = [];

        // Auto-fetch single category if provided
        if (categoryId && memoizedOptions?.autoFetch !== false) {
          const categoryFetchOptions: CategoryFetchOptions = {
            includeSubcategories: memoizedOptions?.includeSubcategories,
            includeUserData: memoizedOptions?.includeUserData,
            includeServices: memoizedOptions?.includeServices,
            servicesLimit: memoizedOptions?.servicesLimit,
            popularOnly: memoizedOptions?.popularOnly,
          };

          promises.push(
            categoryAPI.getCategoryById(categoryId, categoryFetchOptions).then(
              (response): CategoryResult => ({
                type: "category",
                data: response.data?.category || null,
              })
            )
          );
        }

        // Auto-fetch categories list if enabled
        if (memoizedOptions?.autoFetchCategories) {
          const searchParams = {
            ...state.params,
            includeServices: memoizedOptions?.includeServices,
            servicesLimit: memoizedOptions?.servicesLimit,
            popularOnly: memoizedOptions?.popularOnly,
            includeInactive: false, // Never include inactive categories for users
          };

          promises.push(
            categoryAPI.getCategories(searchParams).then(
              (response): CategoriesResult => ({
                type: "categories",
                data: response.data,
              })
            )
          );
        }

        if (promises.length === 0) {
          if (mounted) {
            updateState({ isInitialized: true, isLoading: false });
          }
          return;
        }

        const results = await Promise.allSettled(promises);

        if (!mounted) return;

        const newState: Partial<CategoryState> = {
          isInitialized: true,
          isLoading: false,
        };

        results.forEach((result) => {
          if (result.status === "fulfilled") {
            const { type, data } = result.value;

            if (type === "category") {
              newState.category = data;
            } else if (type === "categories") {
              newState.categories = data.categories;
              newState.pagination = data.pagination;
            }
          } else {
            console.warn(
              "Category initialization failed for one operation:",
              result.reason
            );
          }
        });

        updateState(newState);
      } catch (error) {
        if (!mounted) return;

        console.warn("Category initialization failed:", error);
        updateState({
          isInitialized: true,
          isLoading: false,
          error:
            error instanceof CategoryAPIError && error.statusCode !== 401
              ? error.message
              : null,
        });
      }
    };

    initializeCategory();

    return () => {
      mounted = false;
    };
  }, [
    categoryId,
    memoizedOptions?.autoFetch,
    memoizedOptions?.autoFetchCategories,
    memoizedOptions?.includeSubcategories,
    memoizedOptions?.includeUserData,
    memoizedOptions?.includeServices,
    memoizedOptions?.servicesLimit,
    memoizedOptions?.popularOnly,
    state.params,
    updateState,
  ]);

  return {
    ...state,
    fetchCategory,
    fetchCategoryBySlug,
    fetchCategoryWithAllServices,
    fetchCategoryBreadcrumb,
    fetchCategories,
    fetchParentCategories,
    fetchSubcategories,
    fetchCategoriesWithPopularServices,
    fetchParentCategoriesWithServices,
    fetchSubcategoriesWithServices,
    fetchFeaturedCategories,
    fetchNavigationCategories,
    searchCategories,
    clearSearch,
    setSearchQuery,
    updateParams,
    clearData,
    clearError,
    refetch,
  };
};

// Enhanced convenience hooks for specific use cases with new service features

/**
 * Hook for fetching and managing category lists with service integration
 */
export const useCategories = (
  initialParams?: CategorySearchParams,
  options?: {
    includeServices?: boolean;
    servicesLimit?: number;
    popularOnly?: boolean;
  }
) => {
  const categoryHook = useCategory(undefined, {
    autoFetchCategories: true,
    defaultParams: { ...initialParams, includeInactive: false },
    servicesLimit: options?.servicesLimit,
    popularOnly: options?.popularOnly,
  });

  return {
    categories: categoryHook.categories,
    loading: categoryHook.isLoading,
    error: categoryHook.error,
    pagination: categoryHook.pagination,
    params: categoryHook.params,
    fetchCategories: categoryHook.fetchCategories,
    fetchParentCategories: categoryHook.fetchParentCategories,
    fetchSubcategories: categoryHook.fetchSubcategories,
    fetchCategoriesWithPopularServices:
      categoryHook.fetchCategoriesWithPopularServices,
    fetchParentCategoriesWithServices:
      categoryHook.fetchParentCategoriesWithServices,
    fetchSubcategoriesWithServices: categoryHook.fetchSubcategoriesWithServices,
    updateParams: categoryHook.updateParams,
    clearData: categoryHook.clearData,
    clearError: categoryHook.clearError,
    refetch: categoryHook.refetch,
  };
};

/**
 * Enhanced hook for category search functionality with service options
 */
export const useCategorySearch = (options?: {
  includeServices?: boolean;
  servicesLimit?: number;
  popularOnly?: boolean;
}) => {
  const categoryHook = useCategory(undefined, {
    includeServices: options?.includeServices,
    servicesLimit: options?.servicesLimit,
    popularOnly: options?.popularOnly,
  });

  const searchWithServices = useCallback(
    async (
      searchParams: Omit<
        CategorySearchQuery,
        "includeServices" | "servicesLimit" | "popularOnly" | "includeInactive"
      >
    ) => {
      const enhancedParams: CategorySearchQuery = {
        ...searchParams,
        includeInactive: false,
      };

      await categoryHook.searchCategories(enhancedParams);
    },
    [categoryHook]
  );

  return {
    results: categoryHook.searchResults,
    loading: categoryHook.isLoading,
    error: categoryHook.error,
    query: categoryHook.searchQuery,
    setQuery: categoryHook.setSearchQuery,
    searchCategories: categoryHook.searchCategories,
    searchWithServices,
    clearSearch: categoryHook.clearSearch,
  };
};

/**
 * Enhanced hook for category detail pages with comprehensive service data
 */
export const useCategoryDetail = (
  categoryId?: string,
  options?: {
    slug?: string;
    includeSubcategories?: boolean;
    includeUserData?: boolean;
    includeServices?: boolean;
    servicesLimit?: number;
    popularOnly?: boolean;
    autoFetch?: boolean;
    fetchAllServices?: boolean; // NEW: Option to fetch all services for detailed view
  }
) => {
  const categoryHook = useCategory(categoryId, {
    includeSubcategories: options?.includeSubcategories ?? true,
    includeUserData: options?.includeUserData,
    includeServices: options?.includeServices,
    servicesLimit: options?.servicesLimit,
    popularOnly: options?.popularOnly,
    autoFetch: options?.autoFetch,
  });

  // Fetch by slug with enhanced service options
  const fetchBySlug = useCallback(
    async (slug: string) => {
      const fetchOptions: CategoryFetchOptions = {
        includeSubcategories: options?.includeSubcategories ?? true,
        includeUserData: options?.includeUserData,
        includeServices: options?.includeServices,
        servicesLimit: options?.servicesLimit,
        popularOnly: options?.popularOnly,
      };

      await categoryHook.fetchCategoryBySlug(slug, fetchOptions);
    },
    [categoryHook, options]
  );

  // NEW: Fetch category with all services for detailed view
  const fetchWithAllServices = useCallback(
    async (id?: string, servicesLimit = 50) => {
      const targetId = id || categoryId;
      if (targetId) {
        await categoryHook.fetchCategoryWithAllServices(
          targetId,
          servicesLimit
        );
      }
    },
    [categoryHook, categoryId]
  );

  // Auto-fetch by slug if provided instead of categoryId
  useEffect(() => {
    if (options?.slug && !categoryId && options?.autoFetch !== false) {
      fetchBySlug(options.slug);
    }
  }, [options?.slug, categoryId, options?.autoFetch, fetchBySlug]);

  // Auto-fetch all services if requested
  useEffect(() => {
    if (
      options?.fetchAllServices &&
      categoryId &&
      options?.autoFetch !== false
    ) {
      fetchWithAllServices(categoryId);
    }
  }, [
    options?.fetchAllServices,
    categoryId,
    options?.autoFetch,
    fetchWithAllServices,
  ]);

  return {
    category: categoryHook.category,
    loading: categoryHook.isLoading,
    error: categoryHook.error,
    isInitialized: categoryHook.isInitialized,

    // Enhanced fetch methods
    fetchById: categoryHook.fetchCategory,
    fetchBySlug,
    fetchWithAllServices,
    fetchBreadcrumb: categoryHook.fetchCategoryBreadcrumb,

    // Utility methods
    clearError: categoryHook.clearError,
    refetch: categoryHook.refetch,
  };
};

/**
 * Enhanced hook for parent/child category relationships with services
 */
export const useCategoryHierarchy = (
  parentId?: string,
  options?: {
    includeUserData?: boolean;
    includeServices?: boolean;
    servicesLimit?: number;
    popularOnly?: boolean;
    autoFetch?: boolean;
  }
) => {
  const categoryHook = useCategory(undefined, {
    includeUserData: options?.includeUserData,
    includeServices: options?.includeServices,
    servicesLimit: options?.servicesLimit,
    popularOnly: options?.popularOnly,
  });

  // Fetch parent categories with services
  const fetchParents = useCallback(
    async (fetchOptions?: ParentCategoriesFetchOptions) => {
      const safeOptions = { ...fetchOptions, includeInactive: false };
      await categoryHook.fetchParentCategories(safeOptions);
    },
    [categoryHook]
  );

  // Fetch subcategories with services for a specific parent
  const fetchChildren = useCallback(
    async (
      parentCategoryId: string,
      fetchOptions?: SubcategoriesFetchOptions
    ) => {
      await categoryHook.fetchSubcategories(parentCategoryId, fetchOptions);
    },
    [categoryHook]
  );

  // NEW: Fetch parent categories with their services
  const fetchParentsWithServices = useCallback(
    async (servicesLimit = 5, popularOnly = false) => {
      await categoryHook.fetchParentCategoriesWithServices(
        servicesLimit,
        popularOnly
      );
    },
    [categoryHook]
  );

  // NEW: Fetch subcategories with their services
  const fetchChildrenWithServices = useCallback(
    async (parentCategoryId: string, servicesLimit = 3, popularOnly = true) => {
      await categoryHook.fetchSubcategoriesWithServices(
        parentCategoryId,
        servicesLimit,
        popularOnly
      );
    },
    [categoryHook]
  );

  // Auto-fetch based on parentId with service options
  useEffect(() => {
    if (options?.autoFetch !== false) {
      if (parentId) {
        if (options?.includeServices) {
          fetchChildrenWithServices(
            parentId,
            options.servicesLimit,
            options.popularOnly
          );
        } else {
          fetchChildren(parentId, {
            includeUserData: options?.includeUserData,
          });
        }
      } else {
        if (options?.includeServices) {
          fetchParentsWithServices(options.servicesLimit, options.popularOnly);
        } else {
          fetchParents({
            includeSubcategories: true,
            includeServicesCount: true,
            includeUserData: options?.includeUserData,
            includeInactive: false, // Always false for users
          });
        }
      }
    }
  }, [
    parentId,
    options,
    fetchChildren,
    fetchParents,
    fetchChildrenWithServices,
    fetchParentsWithServices,
  ]);

  return {
    categories: categoryHook.categories,
    loading: categoryHook.isLoading,
    error: categoryHook.error,
    isInitialized: categoryHook.isInitialized,

    // Hierarchy-specific methods
    fetchParents,
    fetchChildren,
    fetchParentsWithServices,
    fetchChildrenWithServices,

    // Utility methods
    clearData: categoryHook.clearData,
    clearError: categoryHook.clearError,
    refetch: categoryHook.refetch,
  };
};

/**
 * Enhanced hook for category browsing with search and services
 */
export const useCategoryBrowser = (
  initialParams?: CategorySearchParams,
  options?: {
    includeServices?: boolean;
    servicesLimit?: number;
    popularOnly?: boolean;
  }
) => {
  const categoryHook = useCategory(undefined, {
    autoFetchCategories: true,
    defaultParams: { ...initialParams, includeInactive: false }, // Ensure inactive are excluded
    includeServices: options?.includeServices,
    servicesLimit: options?.servicesLimit,
    popularOnly: options?.popularOnly,
  });

  return {
    // Main state
    categories: categoryHook.categories,
    loading: categoryHook.isLoading,
    error: categoryHook.error,
    pagination: categoryHook.pagination,
    params: categoryHook.params,

    // Enhanced category operations
    fetchCategories: categoryHook.fetchCategories,
    fetchParentCategories: categoryHook.fetchParentCategories,
    fetchSubcategories: categoryHook.fetchSubcategories,
    fetchCategoriesWithPopularServices:
      categoryHook.fetchCategoriesWithPopularServices,
    fetchParentCategoriesWithServices:
      categoryHook.fetchParentCategoriesWithServices,
    fetchSubcategoriesWithServices: categoryHook.fetchSubcategoriesWithServices,
    updateParams: categoryHook.updateParams,

    // Search functionality
    search: {
      results: categoryHook.searchResults,
      loading: categoryHook.isLoading,
      error: categoryHook.error,
      query: categoryHook.searchQuery,
      setQuery: categoryHook.setSearchQuery,
      searchCategories: categoryHook.searchCategories,
      clearSearch: categoryHook.clearSearch,
    },

    // Utility methods
    clearData: categoryHook.clearData,
    clearError: categoryHook.clearError,
    refetch: categoryHook.refetch,
  };
};

/**
 * NEW: Hook specifically for homepage/landing page featured categories
 */
export const useFeaturedCategories = (
  limit = 8,
  options?: {
    autoFetch?: boolean;
  }
) => {
  const categoryHook = useCategory(undefined, {
    includeServices: true,
    servicesLimit: 3,
    popularOnly: true,
  });

  useEffect(() => {
    if (options?.autoFetch !== false) {
      categoryHook.fetchFeaturedCategories(limit);
    }
  }, [limit, options?.autoFetch, categoryHook]);

  return {
    featuredCategories: categoryHook.featuredCategories,
    loading: categoryHook.isLoading,
    error: categoryHook.error,
    fetchFeaturedCategories: categoryHook.fetchFeaturedCategories,
    clearError: categoryHook.clearError,
  };
};

/**
 * NEW: Hook specifically for navigation menu categories
 */
export const useNavigationCategories = (options?: { autoFetch?: boolean }) => {
  const categoryHook = useCategory();

  useEffect(() => {
    if (options?.autoFetch !== false) {
      categoryHook.fetchNavigationCategories();
    }
  }, [options?.autoFetch, categoryHook]);

  return {
    navigationCategories: categoryHook.navigationCategories,
    loading: categoryHook.isLoading,
    error: categoryHook.error,
    fetchNavigationCategories: categoryHook.fetchNavigationCategories,
    clearError: categoryHook.clearError,
  };
};

export default useCategory;
