import { useState, useCallback, useEffect, useMemo } from "react";
import { Category } from "@/types/category.types";
import {
  categoryAPI,
  CategoryAPIError,
  CreateCategoryData,
  UpdateCategoryData,
  UpdateDisplayOrderData,
  CategorySearchParams,
  ModerateCategoryData,
  DeletedCategoriesParams,
  DeletedCategoryFetchOptions,
} from "@/lib/api/categories/category.api";

// Admin-specific category state interface
interface AdminCategoryState {
  category: Category | null;
  categories: Category[];
  allCategories: Category[];
  inactiveCategories: Category[];
  deletedCategories: Category[];
  searchResults: Category[];
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
  createLoading: boolean;
  createError: string | null;
  createSuccess: boolean;
  updateLoading: boolean;
  updateError: string | null;
  updateSuccess: boolean;
  deleteLoading: boolean;
  deleteError: string | null;
  deleteSuccess: boolean;
  moderateLoading: boolean;
  moderateError: string | null;
  moderateSuccess: boolean;
}

// Admin-specific category actions interface
interface AdminCategoryActions {
  // Enhanced fetch operations with admin privileges
  fetchCategoryWithFullDetails: (id: string) => Promise<void>;
  fetchAllCategories: (searchParams?: CategorySearchParams) => Promise<void>;
  fetchInactiveCategories: (
    searchParams?: CategorySearchParams
  ) => Promise<void>;
  fetchAllParentCategories: () => Promise<void>;
  fetchDeletedCategories: (params?: DeletedCategoriesParams) => Promise<void>;
  fetchDeletedCategoryById: (
    id: string,
    options?: DeletedCategoryFetchOptions
  ) => Promise<void>;

  // Admin search operations
  searchAllCategories: (query: string, limit?: number) => Promise<void>;
  searchInactiveCategories: (query: string, limit?: number) => Promise<void>;
  clearSearch: () => void;
  setSearchQuery: (query: string) => void;

  // Category management operations
  createCategory: (data: CreateCategoryData) => Promise<Category | null>;
  updateCategory: (
    categoryId: string,
    data: UpdateCategoryData
  ) => Promise<Category | null>;
  deleteCategory: (categoryId: string) => Promise<boolean>;
  restoreCategory: (categoryId: string) => Promise<Category | null>;
  toggleCategoryStatus: (categoryId: string) => Promise<Category | null>;
  updateDisplayOrder: (data: UpdateDisplayOrderData) => Promise<boolean>;

  // Admin-specific moderation operations
  moderateCategory: (
    categoryId: string,
    data: ModerateCategoryData
  ) => Promise<Category | null>;
  bulkModerateCategories: (
    categories: Array<{ categoryId: string; data: ModerateCategoryData }>
  ) => Promise<void>;

  // Utility operations
  updateParams: (newParams: Partial<CategorySearchParams>) => void;
  clearData: () => void;
  clearError: () => void;
  clearCreateState: () => void;
  clearUpdateState: () => void;
  clearDeleteState: () => void;
  clearModerateState: () => void;
  refetch: () => Promise<void>;

  // Bulk operations
  bulkToggleStatus: (categoryIds: string[]) => Promise<void>;
  bulkDelete: (categoryIds: string[]) => Promise<void>;
  bulkRestore: (categoryIds: string[]) => Promise<void>;
}

type CategoryResult =
  | { type: "category"; data: Category | null }
  | { type: "categories"; data: { categories: Category[] } }
  | {
      type: "paginatedCategories";
      data: {
        categories: Category[];
        pagination: AdminCategoryState["pagination"];
      };
    };

export const useAdminCategory = (
  categoryId?: string,
  options?: {
    autoFetch?: boolean;
    autoFetchCategories?: boolean;
    autoFetchDeleted?: boolean;
    defaultParams?: CategorySearchParams;
    includeInactive?: boolean;
  }
): AdminCategoryState & AdminCategoryActions => {
  const [state, setState] = useState<AdminCategoryState>({
    category: null,
    categories: [],
    allCategories: [],
    inactiveCategories: [],
    deletedCategories: [],
    searchResults: [],
    pagination: undefined,
    searchQuery: "",
    params: {
      ...options?.defaultParams,
      includeUserData: true,
      includeInactive: options?.includeInactive,
    },

    isLoading: !!(
      (categoryId && options?.autoFetch !== false) ||
      options?.autoFetchCategories ||
      options?.autoFetchDeleted
    ),

    error: null,
    isInitialized: false,
    createLoading: false,
    createError: null,
    createSuccess: false,
    updateLoading: false,
    updateError: null,
    updateSuccess: false,
    deleteLoading: false,
    deleteError: null,
    deleteSuccess: false,
    moderateLoading: false,
    moderateError: null,
    moderateSuccess: false,
  });

  const memoizedOptions = useMemo(() => options, [options]);

  const updateState = useCallback((updates: Partial<AdminCategoryState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Generic action handler for consistent error handling
  const handleAdminAction = useCallback(
    async <T>(
      action: () => Promise<T>,
      options?: {
        onSuccess?: (response: T) => void;
        loadingKey?: keyof Pick<
          AdminCategoryState,
          | "isLoading"
          | "createLoading"
          | "updateLoading"
          | "deleteLoading"
          | "moderateLoading"
        >;
        errorKey?: keyof Pick<
          AdminCategoryState,
          | "error"
          | "createError"
          | "updateError"
          | "deleteError"
          | "moderateError"
        >;
        successKey?: keyof Pick<
          AdminCategoryState,
          | "createSuccess"
          | "updateSuccess"
          | "deleteSuccess"
          | "moderateSuccess"
        >;
      }
    ): Promise<T> => {
      const {
        onSuccess,
        loadingKey = "isLoading",
        errorKey = "error",
        successKey,
      } = options || {};

      try {
        updateState({
          [loadingKey]: true,
          [errorKey]: null,
          ...(successKey && { [successKey]: false }),
        });

        const response = await action();

        updateState({
          [loadingKey]: false,
          ...(successKey && { [successKey]: true }),
        });

        onSuccess?.(response);
        return response;
      } catch (error) {
        const errorMessage =
          error instanceof CategoryAPIError
            ? error.message
            : "An unexpected error occurred";

        updateState({
          [loadingKey]: false,
          [errorKey]: errorMessage,
          ...(successKey && { [successKey]: false }),
        });
        throw error;
      }
    },
    [updateState]
  );

  // Admin fetch operations
  const fetchCategoryWithFullDetails = useCallback(
    async (id: string) => {
      await handleAdminAction(
        () => categoryAPI.getCategoryWithFullDetails(id),
        {
          onSuccess: (response) => {
            updateState({ category: response.data?.category || null });
          },
        }
      );
    },
    [handleAdminAction, updateState]
  );

  const fetchAllCategories = useCallback(
    async (searchParams?: CategorySearchParams) => {
      const queryParams = {
        ...state.params,
        ...searchParams,
        includeUserData: true,
        includeInactive: true,
        includeDeleted: true,
      };

      await handleAdminAction(
        () => categoryAPI.getAllCategoriesForAdmin(queryParams),
        {
          onSuccess: (response) => {
            updateState({
              allCategories: response.data.categories,
              categories: response.data.categories,
              pagination: response.data.pagination,
            });
          },
        }
      );
    },
    [handleAdminAction, state.params, updateState]
  );

  const fetchInactiveCategories = useCallback(
    async (searchParams?: CategorySearchParams) => {
      const queryParams = { ...state.params, ...searchParams };

      await handleAdminAction(
        () => categoryAPI.getInactiveCategoriesForAdmin(queryParams),
        {
          onSuccess: (response) => {
            updateState({
              inactiveCategories: response.data.categories,
              categories: response.data.categories,
              pagination: response.data.pagination,
            });
          },
        }
      );
    },
    [handleAdminAction, state.params, updateState]
  );

  const fetchAllParentCategories = useCallback(async () => {
    await handleAdminAction(
      () => categoryAPI.getAllParentCategoriesForAdmin(),
      {
        onSuccess: (response) => {
          updateState({
            categories: response.data.categories,
            pagination: undefined,
          });
        },
      }
    );
  }, [handleAdminAction, updateState]);

  const fetchDeletedCategories = useCallback(
    async (params?: DeletedCategoriesParams) => {
      await handleAdminAction(() => categoryAPI.getDeletedCategories(params), {
        onSuccess: (response) => {
          updateState({
            deletedCategories: response.data.categories,
            categories: response.data.categories,
            pagination: response.data.pagination,
          });
        },
      });
    },
    [handleAdminAction, updateState]
  );

  const fetchDeletedCategoryById = useCallback(
    async (id: string, options?: DeletedCategoryFetchOptions) => {
      await handleAdminAction(
        () => categoryAPI.getDeletedCategoryById(id, options),
        {
          onSuccess: (response) => {
            updateState({ category: response.data?.category || null });
          },
        }
      );
    },
    [handleAdminAction, updateState]
  );

  // Admin search operations
  const searchAllCategories = useCallback(
    async (query: string, limit?: number) => {
      if (!query.trim()) {
        updateState({
          searchResults: [],
          searchQuery: query,
        });
        return;
      }

      await handleAdminAction(
        () => categoryAPI.searchAllCategoriesForAdmin(query, limit),
        {
          onSuccess: (response) => {
            updateState({
              searchResults: response.data.categories,
              searchQuery: query,
            });
          },
        }
      );
    },
    [handleAdminAction, updateState]
  );

  const searchInactiveCategories = useCallback(
    async (query: string, limit?: number) => {
      if (!query.trim()) {
        updateState({
          searchResults: [],
          searchQuery: query,
        });
        return;
      }

      await handleAdminAction(
        () => categoryAPI.searchAllCategoriesForAdmin(query, limit),
        {
          onSuccess: (response) => {
            const inactiveResults = response.data.categories.filter(
              (cat) => !cat.isActive
            );
            updateState({
              searchResults: inactiveResults,
              searchQuery: query,
            });
          },
        }
      );
    },
    [handleAdminAction, updateState]
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

  // Category management operations
  const createCategory = useCallback(
    async (data: CreateCategoryData): Promise<Category | null> => {
      return await handleAdminAction(() => categoryAPI.createCategory(data), {
        loadingKey: "createLoading",
        errorKey: "createError",
        successKey: "createSuccess",
        onSuccess: () => {
          if (state.categories.length > 0) {
            fetchAllCategories();
          }
        },
      })
        .then((response) => response.data?.category || null)
        .catch(() => null);
    },
    [handleAdminAction, state.categories.length, fetchAllCategories]
  );

  const updateCategory = useCallback(
    async (
      categoryId: string,
      data: UpdateCategoryData
    ): Promise<Category | null> => {
      return await handleAdminAction(
        () => categoryAPI.updateCategory(categoryId, data),
        {
          loadingKey: "updateLoading",
          errorKey: "updateError",
          successKey: "updateSuccess",
          onSuccess: (response) => {
            const updatedCategory = response.data?.category;
            if (updatedCategory) {
              if (state.category?._id.toString() === categoryId) {
                updateState({ category: updatedCategory });
              }
              const updateInArray = (categories: Category[]) =>
                categories.map((cat) =>
                  cat._id.toString() === categoryId ? updatedCategory : cat
                );

              updateState({
                categories: updateInArray(state.categories),
                allCategories: updateInArray(state.allCategories),
                inactiveCategories: updateInArray(state.inactiveCategories),
                deletedCategories: state.deletedCategories.filter(
                  (cat) => cat._id.toString() !== categoryId
                ),
              });
            }
          },
        }
      )
        .then((response) => response.data?.category || null)
        .catch(() => null);
    },
    [
      handleAdminAction,
      state.category,
      state.categories,
      state.allCategories,
      state.inactiveCategories,
      state.deletedCategories,
      updateState,
    ]
  );

  const deleteCategory = useCallback(
    async (categoryId: string): Promise<boolean> => {
      return await handleAdminAction(
        () => categoryAPI.deleteCategory(categoryId),
        {
          loadingKey: "deleteLoading",
          errorKey: "deleteError",
          successKey: "deleteSuccess",
          onSuccess: () => {
            if (state.category?._id.toString() === categoryId) {
              updateState({ category: null });
            }
            fetchAllCategories();
            fetchDeletedCategories();
          },
        }
      )
        .then(() => true)
        .catch(() => false);
    },
    [
      handleAdminAction,
      state.category,
      updateState,
      fetchAllCategories,
      fetchDeletedCategories,
    ]
  );

  const restoreCategory = useCallback(
    async (categoryId: string): Promise<Category | null> => {
      return await handleAdminAction(
        () => categoryAPI.restoreCategory(categoryId),
        {
          loadingKey: "updateLoading",
          errorKey: "updateError",
          successKey: "updateSuccess",
          onSuccess: (response) => {
            const restoredCategory = response.data?.category;
            if (restoredCategory) {
              if (state.category?._id.toString() === categoryId) {
                updateState({ category: restoredCategory });
              }
              updateState({
                deletedCategories: state.deletedCategories.filter(
                  (cat) => cat._id.toString() !== categoryId
                ),
                allCategories: state.allCategories.map((cat) =>
                  cat._id.toString() === categoryId ? restoredCategory : cat
                ),
              });
              fetchAllCategories();
            }
          },
        }
      )
        .then((response) => response.data?.category || null)
        .catch(() => null);
    },
    [
      handleAdminAction,
      state.category,
      state.deletedCategories,
      state.allCategories,
      updateState,
      fetchAllCategories,
    ]
  );

  const toggleCategoryStatus = useCallback(
    async (categoryId: string): Promise<Category | null> => {
      return await handleAdminAction(
        () => categoryAPI.toggleCategoryStatus(categoryId),
        {
          loadingKey: "updateLoading",
          errorKey: "updateError",
          successKey: "updateSuccess",
          onSuccess: (response) => {
            const updatedCategory = response.data?.category;
            if (updatedCategory) {
              if (state.category?._id.toString() === categoryId) {
                updateState({ category: updatedCategory });
              }
              const updateInArray = (categories: Category[]) =>
                categories.map((cat) =>
                  cat._id.toString() === categoryId ? updatedCategory : cat
                );

              updateState({
                categories: updateInArray(state.categories),
                allCategories: updateInArray(state.allCategories),
                inactiveCategories: updatedCategory.isActive
                  ? state.inactiveCategories.filter(
                      (cat) => cat._id.toString() !== categoryId
                    )
                  : [
                      ...state.inactiveCategories.filter(
                        (cat) => cat._id.toString() !== categoryId
                      ),
                      updatedCategory,
                    ],
                deletedCategories: state.deletedCategories.filter(
                  (cat) => cat._id.toString() !== categoryId
                ),
              });
            }
          },
        }
      )
        .then((response) => response.data?.category || null)
        .catch(() => null);
    },
    [
      handleAdminAction,
      state.category,
      state.categories,
      state.allCategories,
      state.inactiveCategories,
      state.deletedCategories,
      updateState,
    ]
  );

  const updateDisplayOrder = useCallback(
    async (data: UpdateDisplayOrderData): Promise<boolean> => {
      return await handleAdminAction(
        () => categoryAPI.updateDisplayOrder(data),
        {
          loadingKey: "updateLoading",
          errorKey: "updateError",
          successKey: "updateSuccess",
          onSuccess: () => {
            if (state.categories.length > 0) {
              fetchAllCategories();
            }
          },
        }
      )
        .then(() => true)
        .catch(() => false);
    },
    [handleAdminAction, state.categories.length, fetchAllCategories]
  );

  // Admin-specific moderation operations
  const moderateCategory = useCallback(
    async (
      categoryId: string,
      data: ModerateCategoryData
    ): Promise<Category | null> => {
      return await handleAdminAction(
        () => categoryAPI.moderateCategory(categoryId, data),
        {
          loadingKey: "moderateLoading",
          errorKey: "moderateError",
          successKey: "moderateSuccess",
          onSuccess: (response) => {
            const moderatedCategory = response.data?.category;
            if (moderatedCategory) {
              if (state.category?._id.toString() === categoryId) {
                updateState({ category: moderatedCategory });
              }
              const updateInArray = (categories: Category[]) =>
                categories.map((cat) =>
                  cat._id.toString() === categoryId ? moderatedCategory : cat
                );

              updateState({
                categories: updateInArray(state.categories),
                allCategories: updateInArray(state.allCategories),
                inactiveCategories: updateInArray(state.inactiveCategories),
                deletedCategories: state.deletedCategories.filter(
                  (cat) => cat._id.toString() !== categoryId
                ),
              });
            }
          },
        }
      )
        .then((response) => response.data?.category || null)
        .catch(() => null);
    },
    [
      handleAdminAction,
      state.category,
      state.categories,
      state.allCategories,
      state.inactiveCategories,
      state.deletedCategories,
      updateState,
    ]
  );

  const bulkModerateCategories = useCallback(
    async (
      categories: Array<{ categoryId: string; data: ModerateCategoryData }>
    ) => {
      const results = await Promise.allSettled(
        categories.map(({ categoryId, data }) =>
          moderateCategory(categoryId, data)
        )
      );

      const failed = results.filter(
        (result) => result.status === "rejected"
      ).length;
      if (failed > 0) {
        console.warn(
          `${failed} out of ${categories.length} moderation actions failed`
        );
      }
    },
    [moderateCategory]
  );

  // Bulk operations
  const bulkToggleStatus = useCallback(
    async (categoryIds: string[]) => {
      const results = await Promise.allSettled(
        categoryIds.map((id) => toggleCategoryStatus(id))
      );

      const failed = results.filter(
        (result) => result.status === "rejected"
      ).length;
      if (failed > 0) {
        console.warn(
          `${failed} out of ${categoryIds.length} status toggle actions failed`
        );
      }
    },
    [toggleCategoryStatus]
  );

  const bulkDelete = useCallback(
    async (categoryIds: string[]) => {
      const results = await Promise.allSettled(
        categoryIds.map((id) => deleteCategory(id))
      );

      const failed = results.filter(
        (result) => result.status === "rejected"
      ).length;
      if (failed > 0) {
        console.warn(
          `${failed} out of ${categoryIds.length} delete actions failed`
        );
      }
    },
    [deleteCategory]
  );

  const bulkRestore = useCallback(
    async (categoryIds: string[]) => {
      const results = await Promise.allSettled(
        categoryIds.map((id) => restoreCategory(id))
      );

      const failed = results.filter(
        (result) => result.status === "rejected"
      ).length;
      if (failed > 0) {
        console.warn(
          `${failed} out of ${categoryIds.length} restore actions failed`
        );
      }
    },
    [restoreCategory]
  );

  // Utility operations
  const updateParams = useCallback(
    (newParams: Partial<CategorySearchParams>) => {
      updateState({ params: { ...state.params, ...newParams } });
    },
    [updateState, state.params]
  );

  const clearData = useCallback(() => {
    updateState({
      category: null,
      categories: [],
      allCategories: [],
      inactiveCategories: [],
      deletedCategories: [],
      searchResults: [],
      pagination: undefined,
    });
  }, [updateState]);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const clearCreateState = useCallback(() => {
    updateState({
      createLoading: false,
      createError: null,
      createSuccess: false,
    });
  }, [updateState]);

  const clearUpdateState = useCallback(() => {
    updateState({
      updateLoading: false,
      updateError: null,
      updateSuccess: false,
    });
  }, [updateState]);

  const clearDeleteState = useCallback(() => {
    updateState({
      deleteLoading: false,
      deleteError: null,
      deleteSuccess: false,
    });
  }, [updateState]);

  const clearModerateState = useCallback(() => {
    updateState({
      moderateLoading: false,
      moderateError: null,
      moderateSuccess: false,
    });
  }, [updateState]);

  const refetch = useCallback(async () => {
    const promises: Promise<void>[] = [];
    if (categoryId && state.category) {
      promises.push(fetchCategoryWithFullDetails(categoryId));
    }
    if (state.categories.length > 0) {
      promises.push(fetchAllCategories());
    }
    if (state.deletedCategories.length > 0) {
      promises.push(fetchDeletedCategories());
    }
    await Promise.all(promises);
  }, [
    categoryId,
    state.category,
    state.categories.length,
    state.deletedCategories.length,
    fetchCategoryWithFullDetails,
    fetchAllCategories,
    fetchDeletedCategories,
  ]);

  // Admin auto-initialization effect
  useEffect(() => {
    let mounted = true;

    const initializeAdminCategory = async () => {
      try {
        const promises: Promise<CategoryResult>[] = [];

        if (categoryId && memoizedOptions?.autoFetch !== false) {
          promises.push(
            categoryAPI
              .getCategoryWithFullDetails(categoryId)
              .then((response) => ({
                type: "category" as const,
                data: response.data?.category || null,
              }))
          );
        }

        if (memoizedOptions?.autoFetchCategories) {
          promises.push(
            categoryAPI
              .getAllCategoriesForAdmin(state.params)
              .then((response) => ({
                type: "paginatedCategories" as const,
                data: response.data,
              }))
          );
        }

        if (memoizedOptions?.autoFetchDeleted) {
          promises.push(
            categoryAPI.getDeletedCategories(state.params).then((response) => ({
              type: "paginatedCategories" as const,
              data: response.data,
            }))
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

        const newState: Partial<AdminCategoryState> = {
          isInitialized: true,
          isLoading: false,
        };

        results.forEach((result) => {
          if (result.status === "fulfilled") {
            const { type, data } = result.value;

            if (type === "category") {
              newState.category = data;
            } else if (type === "paginatedCategories") {
              if (data.categories.some((cat) => cat.isDeleted)) {
                newState.deletedCategories = data.categories;
              } else {
                newState.allCategories = data.categories;
                newState.categories = data.categories;
              }
              newState.pagination = data.pagination;
            }
          } else {
            console.warn(
              "Admin category initialization failed for one operation:",
              result.reason
            );
          }
        });

        updateState(newState);
      } catch (error) {
        if (!mounted) return;

        console.warn("Admin category initialization failed:", error);
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

    initializeAdminCategory();

    return () => {
      mounted = false;
    };
  }, [
    categoryId,
    memoizedOptions?.autoFetch,
    memoizedOptions?.autoFetchCategories,
    memoizedOptions?.autoFetchDeleted,
    state.params,
    updateState,
  ]);

  return {
    ...state,
    fetchCategoryWithFullDetails,
    fetchAllCategories,
    fetchInactiveCategories,
    fetchAllParentCategories,
    fetchDeletedCategories,
    fetchDeletedCategoryById,
    searchAllCategories,
    searchInactiveCategories,
    clearSearch,
    setSearchQuery,
    createCategory,
    updateCategory,
    deleteCategory,
    restoreCategory,
    toggleCategoryStatus,
    updateDisplayOrder,
    moderateCategory,
    bulkModerateCategories,
    bulkToggleStatus,
    bulkDelete,
    bulkRestore,
    updateParams,
    clearData,
    clearError,
    clearCreateState,
    clearUpdateState,
    clearDeleteState,
    clearModerateState,
    refetch,
  };
};

// Convenience hooks for specific admin use cases

/**
 * Hook for managing all categories including inactive ones
 */
export const useAdminCategoryManager = (options?: {
  autoFetchOnMount?: boolean;
  autoFetchDeleted?: boolean;
  defaultParams?: CategorySearchParams;
  includeInactive?: boolean;
}) => {
  return useAdminCategory(undefined, {
    autoFetchCategories: options?.autoFetchOnMount !== false,
    autoFetchDeleted: options?.autoFetchDeleted,
    defaultParams: options?.defaultParams,
    includeInactive: options?.includeInactive ?? true,
  });
};

/**
 * Hook specifically for managing inactive categories
 */
export const useInactiveCategoryManager = (options?: {
  autoFetchOnMount?: boolean;
  defaultParams?: CategorySearchParams;
}) => {
  const adminHook = useAdminCategory(undefined, {
    autoFetchCategories: false,
    defaultParams: options?.defaultParams,
    includeInactive: true,
  });

  useEffect(() => {
    if (options?.autoFetchOnMount !== false) {
      adminHook.fetchInactiveCategories();
    }
  }, [adminHook, options?.autoFetchOnMount]);

  return {
    categories: adminHook.inactiveCategories,
    loading: adminHook.isLoading,
    error: adminHook.error,
    pagination: adminHook.pagination,
    params: adminHook.params,

    fetchInactiveCategories: adminHook.fetchInactiveCategories,
    searchInactiveCategories: adminHook.searchInactiveCategories,

    restoreCategory: adminHook.restoreCategory,
    bulkRestore: adminHook.bulkRestore,

    updateParams: adminHook.updateParams,
    clearData: adminHook.clearData,
    clearError: adminHook.clearError,
    clearUpdateState: adminHook.clearUpdateState,
    refetch: adminHook.refetch,

    search: {
      results: adminHook.searchResults,
      loading: adminHook.isLoading,
      error: adminHook.error,
      query: adminHook.searchQuery,
      setQuery: adminHook.setSearchQuery,
      searchInactive: adminHook.searchInactiveCategories,
      clearSearch: adminHook.clearSearch,
    },

    updateLoading: adminHook.updateLoading,
    updateError: adminHook.updateError,
    updateSuccess: adminHook.updateSuccess,
  };
};

/**
 * Hook for managing deleted categories
 */
export const useDeletedCategoryManager = (options?: {
  autoFetchOnMount?: boolean;
  defaultParams?: DeletedCategoriesParams;
}) => {
  const adminHook = useAdminCategory(undefined, {
    autoFetchCategories: false,
    autoFetchDeleted: options?.autoFetchOnMount !== false,
    defaultParams: options?.defaultParams,
  });

  return {
    categories: adminHook.deletedCategories,
    loading: adminHook.isLoading,
    error: adminHook.error,
    pagination: adminHook.pagination,
    params: adminHook.params,

    fetchDeletedCategories: adminHook.fetchDeletedCategories,
    fetchDeletedCategoryById: adminHook.fetchDeletedCategoryById,

    restoreCategory: adminHook.restoreCategory,
    bulkRestore: adminHook.bulkRestore,

    updateParams: adminHook.updateParams,
    clearData: adminHook.clearData,
    clearError: adminHook.clearError,
    clearUpdateState: adminHook.clearUpdateState,
    refetch: adminHook.refetch,

    search: {
      results: adminHook.searchResults,
      loading: adminHook.isLoading,
      error: adminHook.error,
      query: adminHook.searchQuery,
      setQuery: adminHook.setSearchQuery,
      clearSearch: adminHook.clearSearch,
    },

    updateLoading: adminHook.updateLoading,
    updateError: adminHook.updateError,
    updateSuccess: adminHook.updateSuccess,
  };
};

/**
 * Hook for category moderation operations
 */
export const useCategoryModeration = () => {
  const adminHook = useAdminCategory();

  return {
    moderateCategory: adminHook.moderateCategory,
    bulkModerateCategories: adminHook.bulkModerateCategories,

    toggleCategoryStatus: adminHook.toggleCategoryStatus,
    bulkToggleStatus: adminHook.bulkToggleStatus,

    restoreCategory: adminHook.restoreCategory,
    bulkRestore: adminHook.bulkRestore,

    deleteCategory: adminHook.deleteCategory,
    bulkDelete: adminHook.bulkDelete,

    moderateLoading: adminHook.moderateLoading,
    moderateError: adminHook.moderateError,
    moderateSuccess: adminHook.moderateSuccess,
    updateLoading: adminHook.updateLoading,
    updateError: adminHook.updateError,
    updateSuccess: adminHook.updateSuccess,
    deleteLoading: adminHook.deleteLoading,
    deleteError: adminHook.deleteError,
    deleteSuccess: adminHook.deleteSuccess,

    clearModerateState: adminHook.clearModerateState,
    clearUpdateState: adminHook.clearUpdateState,
    clearDeleteState: adminHook.clearDeleteState,
  };
};
