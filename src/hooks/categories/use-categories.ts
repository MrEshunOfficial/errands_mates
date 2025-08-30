import { useState, useCallback, useEffect, useRef } from "react";

import { Category } from "@/types/category.types";
import {
  categoryAPI,
  CategoryAPIError,
  CreateCategoryData,
  UpdateCategoryData,
  UpdateDisplayOrderData,
  CategorySearchParams,
  CategorySearchQuery,
  ModerateCategoryData,
} from "@/lib/api/categories/category.api";

// Hook state interfaces
interface CategoryState {
  data: Category | null;
  loading: boolean;
  error: string | null;
}

interface CategoriesState {
  data: Category[];
  loading: boolean;
  error: string | null;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface CategoryMutationState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

// Main category hook for single category operations
export const useCategory = (
  categoryId?: string,
  options?: {
    includeSubcategories?: boolean;
    autoFetch?: boolean;
  }
) => {
  const [state, setState] = useState<CategoryState>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchCategory = useCallback(
    async (id?: string) => {
      if (!id && !categoryId) {
        setState((prev) => ({ ...prev, error: "Category ID is required" }));
        return;
      }

      const targetId = id || categoryId!;
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await categoryAPI.getCategoryById(
          targetId,
          options?.includeSubcategories
        );
        setState({
          data: response.data?.category || null,
          loading: false,
          error: null,
        });
      } catch (error) {
        const errorMessage =
          error instanceof CategoryAPIError
            ? error.message
            : "Failed to fetch category";
        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });
      }
    },
    [categoryId, options?.includeSubcategories]
  );

  const fetchCategoryBySlug = useCallback(
    async (slug: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await categoryAPI.getCategoryBySlug(
          slug,
          options?.includeSubcategories
        );
        setState({
          data: response.data?.category || null,
          loading: false,
          error: null,
        });
      } catch (error) {
        const errorMessage =
          error instanceof CategoryAPIError
            ? error.message
            : "Failed to fetch category";
        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });
      }
    },
    [options?.includeSubcategories]
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const clearData = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  // Auto-fetch on mount if categoryId is provided and autoFetch is enabled
  useEffect(() => {
    if (categoryId && options?.autoFetch !== false) {
      fetchCategory();
    }
  }, [categoryId, fetchCategory, options?.autoFetch]);

  return {
    category: state.data,
    loading: state.loading,
    error: state.error,
    fetchCategory,
    fetchCategoryBySlug,
    clearError,
    clearData,
    refetch: () => fetchCategory(categoryId),
  };
};

// Hook for category lists and search
export const useCategories = (initialParams?: CategorySearchParams) => {
  const [state, setState] = useState<CategoriesState>({
    data: [],
    loading: false,
    error: null,
    pagination: undefined,
  });

  // Use useRef to store params to avoid recreating fetchCategories on every param change
  const paramsRef = useRef<CategorySearchParams>(initialParams || {});
  const [, forceUpdate] = useState({});

  // Function to update params without causing fetchCategories to recreate
  const updateParams = useCallback(
    (newParams: Partial<CategorySearchParams>) => {
      paramsRef.current = { ...paramsRef.current, ...newParams };
      forceUpdate({}); // Force a re-render if needed
    },
    []
  );

  const fetchCategories = useCallback(
    async (searchParams?: CategorySearchParams) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // Use provided params or current params from ref
      const queryParams = searchParams || paramsRef.current;

      try {
        const response = await categoryAPI.getCategories(queryParams);
        setState({
          data: response.data.categories,
          loading: false,
          error: null,
          pagination: response.data.pagination,
        });
      } catch (error) {
        const errorMessage =
          error instanceof CategoryAPIError
            ? error.message
            : "Failed to fetch categories";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
      }
    },
    []
  ); // No dependencies - params come from function argument or ref

  const fetchParentCategories = useCallback(
    async (includeSubcategories?: boolean, includeServicesCount?: boolean) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await categoryAPI.getParentCategories(
          includeSubcategories,
          includeServicesCount
        );
        setState({
          data: response.data.categories,
          loading: false,
          error: null,
          pagination: undefined,
        });
      } catch (error) {
        const errorMessage =
          error instanceof CategoryAPIError
            ? error.message
            : "Failed to fetch parent categories";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
      }
    },
    []
  ); // No dependencies - this function is stable

  const fetchSubcategories = useCallback(async (parentId: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await categoryAPI.getSubcategories(parentId);
      setState({
        data: response.data.categories,
        loading: false,
        error: null,
        pagination: undefined,
      });
    } catch (error) {
      const errorMessage =
        error instanceof CategoryAPIError
          ? error.message
          : "Failed to fetch subcategories";
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, []); // No dependencies - parentId comes as parameter

  const clearData = useCallback(() => {
    setState({
      data: [],
      loading: false,
      error: null,
      pagination: undefined,
    });
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    categories: state.data,
    loading: state.loading,
    error: state.error,
    pagination: state.pagination,
    params: paramsRef.current,
    fetchCategories,
    fetchParentCategories,
    fetchSubcategories,
    updateParams,
    clearData,
    clearError,
    refetch: () => fetchCategories(),
  };
};

// Hook for category search
export const useCategorySearch = () => {
  const [state, setState] = useState<CategoriesState>({
    data: [],
    loading: false,
    error: null,
  });

  const [query, setQuery] = useState<string>("");

  const searchCategories = useCallback(
    async (searchParams: CategorySearchQuery) => {
      if (!searchParams.q.trim()) {
        setState({
          data: [],
          loading: false,
          error: null,
        });
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await categoryAPI.searchCategories(searchParams);
        setState({
          data: response.data.categories,
          loading: false,
          error: null,
        });
      } catch (error) {
        const errorMessage =
          error instanceof CategoryAPIError
            ? error.message
            : "Failed to search categories";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
      }
    },
    []
  );

  const clearSearch = useCallback(() => {
    setQuery("");
    setState({
      data: [],
      loading: false,
      error: null,
    });
  }, []);

  return {
    results: state.data,
    loading: state.loading,
    error: state.error,
    query,
    setQuery,
    searchCategories,
    clearSearch,
  };
};

// Hook for category mutations (create, update, delete)
export const useCategoryMutations = () => {
  const [createState, setCreateState] = useState<CategoryMutationState>({
    loading: false,
    error: null,
    success: false,
  });

  const [updateState, setUpdateState] = useState<CategoryMutationState>({
    loading: false,
    error: null,
    success: false,
  });

  const [deleteState, setDeleteState] = useState<CategoryMutationState>({
    loading: false,
    error: null,
    success: false,
  });

  const createCategory = useCallback(
    async (data: CreateCategoryData): Promise<Category | null> => {
      setCreateState({ loading: true, error: null, success: false });

      try {
        const response = await categoryAPI.createCategory(data);
        setCreateState({ loading: false, error: null, success: true });
        return response.data?.category || null;
      } catch (error) {
        const errorMessage =
          error instanceof CategoryAPIError
            ? error.message
            : "Failed to create category";
        setCreateState({ loading: false, error: errorMessage, success: false });
        return null;
      }
    },
    []
  );

  const updateCategory = useCallback(
    async (
      categoryId: string,
      data: UpdateCategoryData
    ): Promise<Category | null> => {
      setUpdateState({ loading: true, error: null, success: false });

      try {
        const response = await categoryAPI.updateCategory(categoryId, data);
        setUpdateState({ loading: false, error: null, success: true });
        return response.data?.category || null;
      } catch (error) {
        const errorMessage =
          error instanceof CategoryAPIError
            ? error.message
            : "Failed to update category";
        setUpdateState({ loading: false, error: errorMessage, success: false });
        return null;
      }
    },
    []
  );

  const deleteCategory = useCallback(
    async (categoryId: string): Promise<boolean> => {
      setDeleteState({ loading: true, error: null, success: false });

      try {
        await categoryAPI.deleteCategory(categoryId);
        setDeleteState({ loading: false, error: null, success: true });
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof CategoryAPIError
            ? error.message
            : "Failed to delete category";
        setDeleteState({ loading: false, error: errorMessage, success: false });
        return false;
      }
    },
    []
  );

  const restoreCategory = useCallback(
    async (categoryId: string): Promise<Category | null> => {
      setUpdateState({ loading: true, error: null, success: false });

      try {
        const response = await categoryAPI.restoreCategory(categoryId);
        setUpdateState({ loading: false, error: null, success: true });
        return response.data?.category || null;
      } catch (error) {
        const errorMessage =
          error instanceof CategoryAPIError
            ? error.message
            : "Failed to restore category";
        setUpdateState({ loading: false, error: errorMessage, success: false });
        return null;
      }
    },
    []
  );

  const toggleCategoryStatus = useCallback(
    async (categoryId: string): Promise<Category | null> => {
      setUpdateState({ loading: true, error: null, success: false });

      try {
        const response = await categoryAPI.toggleCategoryStatus(categoryId);
        setUpdateState({ loading: false, error: null, success: true });
        return response.data?.category || null;
      } catch (error) {
        const errorMessage =
          error instanceof CategoryAPIError
            ? error.message
            : "Failed to toggle category status";
        setUpdateState({ loading: false, error: errorMessage, success: false });
        return null;
      }
    },
    []
  );

  const updateDisplayOrder = useCallback(
    async (data: UpdateDisplayOrderData): Promise<boolean> => {
      setUpdateState({ loading: true, error: null, success: false });

      try {
        await categoryAPI.updateDisplayOrder(data);
        setUpdateState({ loading: false, error: null, success: true });
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof CategoryAPIError
            ? error.message
            : "Failed to update display order";
        setUpdateState({ loading: false, error: errorMessage, success: false });
        return false;
      }
    },
    []
  );

  const moderateCategory = useCallback(
    async (data: ModerateCategoryData): Promise<Category | null> => {
      setUpdateState({ loading: true, error: null, success: false });

      try {
        const response = await categoryAPI.moderateCategory(data);
        setUpdateState({ loading: false, error: null, success: true });
        return response.data?.category || null;
      } catch (error) {
        const errorMessage =
          error instanceof CategoryAPIError
            ? error.message
            : "Failed to moderate category";
        setUpdateState({ loading: false, error: errorMessage, success: false });
        return null;
      }
    },
    []
  );

  const clearCreateState = useCallback(() => {
    setCreateState({ loading: false, error: null, success: false });
  }, []);

  const clearUpdateState = useCallback(() => {
    setUpdateState({ loading: false, error: null, success: false });
  }, []);

  const clearDeleteState = useCallback(() => {
    setDeleteState({ loading: false, error: null, success: false });
  }, []);

  return {
    // Create operations
    createCategory,
    createLoading: createState.loading,
    createError: createState.error,
    createSuccess: createState.success,
    clearCreateState,

    // Update operations
    updateCategory,
    restoreCategory,
    toggleCategoryStatus,
    updateDisplayOrder,
    moderateCategory,
    updateLoading: updateState.loading,
    updateError: updateState.error,
    updateSuccess: updateState.success,
    clearUpdateState,

    // Delete operations
    deleteCategory,
    deleteLoading: deleteState.loading,
    deleteError: deleteState.error,
    deleteSuccess: deleteState.success,
    clearDeleteState,
  };
};

// Combined hook for complete category management
export const useCategoryManager = (options?: {
  autoFetchOnMount?: boolean;
  defaultParams?: CategorySearchParams;
}) => {
  const categoriesHook = useCategories(options?.defaultParams);
  const mutationsHook = useCategoryMutations();
  const searchHook = useCategorySearch();

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (options?.autoFetchOnMount !== false) {
      categoriesHook.fetchCategories();
    }
  }, [categoriesHook, options?.autoFetchOnMount]); // Remove categoriesHook dependency to prevent infinite loop

  const refreshCategories = useCallback(async () => {
    await categoriesHook.refetch();
  }, [categoriesHook]); // Only depend on refetch function

  return {
    // Categories state and operations
    ...categoriesHook,

    // Mutations
    ...mutationsHook,

    // Search
    search: searchHook,

    // Utility functions
    refreshCategories,
  };
};

export default useCategoryManager;
