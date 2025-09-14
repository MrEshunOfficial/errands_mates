import { Category } from "@/types/category.types";
import { ModerationStatus } from "@/types/base.types";
import { AuthResponse } from "@/types/user.types";
import { FileReference } from "./categoryImage.api";

export class CategoryAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public data?: unknown
  ) {
    super(message);
    this.name = "CategoryAPIError";
  }
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  image?: FileReference;
  tags?: string[];
  parentCategoryId?: string;
  displayOrder?: number;
  metaDescription?: string;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  image?: FileReference;
  tags?: string[];
  parentCategoryId?: string;
  displayOrder?: number;
  metaDescription?: string;
  isActive?: boolean;
}

export interface UpdateDisplayOrderData {
  categories: Array<{
    id: string;
    displayOrder: number;
  }>;
}

export interface ModerateCategoryData {
  moderationStatus: ModerationStatus;
  moderationNotes?: string;
}

export interface BulkModerateCategoriesData {
  categoryIds: string[];
  moderationStatus: ModerationStatus;
  moderationNotes?: string;
}

export interface ModerationResponse {
  success: boolean;
  message?: string;
  data: {
    category: Category;
  };
}

export interface BulkModerationResponse {
  success: boolean;
  message?: string;
  data: {
    moderated: number;
    categories: Category[];
    notFound?: string[];
  };
}

export interface PendingCategoriesParams {
  page?: number;
  limit?: number;
  includeUserData?: boolean;
}

export interface CategorySearchParams {
  search?: string;
  parentId?: string | null;
  includeSubcategories?: boolean;
  includeServicesCount?: boolean;
  includeUserData?: boolean;
  includeInactive?: boolean;
  includeServices?: boolean;
  servicesLimit?: number;
  popularOnly?: boolean;
  sortBy?: "displayOrder" | "name" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface CategorySearchQuery {
  q: string;
  limit?: number;
  includeInactive?: boolean;
  includeUserData?: boolean;
  parentId?: string | null;
}

export interface CategoryFetchOptions {
  includeSubcategories?: boolean;
  includeUserData?: boolean;
  includeServices?: boolean;
  servicesLimit?: number;
  popularOnly?: boolean;
}

export interface ParentCategoriesFetchOptions {
  includeSubcategories?: boolean;
  includeServicesCount?: boolean;
  includeUserData?: boolean;
  includeInactive?: boolean;
  includeServices?: boolean;
  servicesLimit?: number;
  popularOnly?: boolean;
}

export interface SubcategoriesFetchOptions {
  includeUserData?: boolean;
  includeServices?: boolean;
  servicesLimit?: number;
  popularOnly?: boolean;
}

export interface PaginatedCategoryResponse {
  success: boolean;
  message?: string;
  data: {
    categories: Category[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface CategoryResponse {
  success: boolean;
  message?: string;
  data?: {
    category: Category;
  };
}

export interface CategoriesResponse {
  success: boolean;
  message?: string;
  data: {
    categories: Category[];
  };
}

export interface CategorySearchResponse {
  success: boolean;
  message?: string;
  data: {
    categories: Category[];
  };
}

export interface DeletedCategoriesParams {
  page?: number;
  limit?: number;
  includeSubcategories?: boolean;
  includeUserData?: boolean;
}

export interface DeletedCategoryFetchOptions {
  includeSubcategories?: boolean;
  includeUserData?: boolean;
  includeServices?: boolean;
  servicesLimit?: number;
  popularOnly?: boolean;
}

type ErrorResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  [key: string]: unknown;
};

class CategoryAPI {
  private baseURL: string;

  constructor(baseURL: string = "/api/categories") {
    this.baseURL = baseURL;
  }

  private async makeRequest<T = AuthResponse>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include",
      ...options,
    };

    try {
      const response = await fetch(url, config);

      const contentType = response.headers.get("content-type");
      let data: unknown;

      if (contentType && contentType.includes("application/json")) {
        data = (await response.json()) as T;
      } else {
        data = { success: false, message: await response.text() } as T;
      }

      if (!response.ok) {
        const err = data as ErrorResponse;
        throw new CategoryAPIError(
          err.message || `Request failed with status ${response.status}`,
          response.status,
          data
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof CategoryAPIError) {
        throw error;
      }

      throw new CategoryAPIError(
        "Network error or server is unreachable",
        0,
        error
      );
    }
  }

  private buildQueryParams<T extends object>(params: T): URLSearchParams {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    return queryParams;
  }

  // ==================== CRUD METHODS ====================

  async createCategory(data: CreateCategoryData): Promise<CategoryResponse> {
    return this.makeRequest<CategoryResponse>("/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getCategoryById(
    categoryId: string,
    options: CategoryFetchOptions = {}
  ): Promise<CategoryResponse> {
    const params = this.buildQueryParams(options);
    const endpoint = params.toString()
      ? `/${categoryId}?${params}`
      : `/${categoryId}`;
    return this.makeRequest<CategoryResponse>(endpoint);
  }

  async getCategoryBySlug(
    slug: string,
    options: CategoryFetchOptions = {}
  ): Promise<CategoryResponse> {
    const params = this.buildQueryParams(options);
    const endpoint = params.toString()
      ? `/slug/${slug}?${params}`
      : `/slug/${slug}`;
    return this.makeRequest<CategoryResponse>(endpoint);
  }

  async updateCategory(
    categoryId: string,
    data: UpdateCategoryData
  ): Promise<CategoryResponse> {
    return this.makeRequest<CategoryResponse>(`/${categoryId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(categoryId: string): Promise<AuthResponse> {
    return this.makeRequest<AuthResponse>(`/${categoryId}`, {
      method: "DELETE",
    });
  }

  async restoreCategory(categoryId: string): Promise<CategoryResponse> {
    return this.makeRequest<CategoryResponse>(`/${categoryId}/restore`, {
      method: "PATCH",
    });
  }

  async toggleCategoryStatus(categoryId: string): Promise<CategoryResponse> {
    return this.makeRequest<CategoryResponse>(`/${categoryId}/toggle-status`, {
      method: "PATCH",
    });
  }

  async updateDisplayOrder(
    data: UpdateDisplayOrderData
  ): Promise<CategoriesResponse> {
    return this.makeRequest<CategoriesResponse>("/display-order", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // ==================== FETCH METHODS ====================

  async getCategories(
    params: CategorySearchParams = {}
  ): Promise<PaginatedCategoryResponse> {
    const queryParams = this.buildQueryParams(params);
    const endpoint = queryParams.toString() ? `/?${queryParams}` : "/";
    return this.makeRequest<PaginatedCategoryResponse>(endpoint);
  }

  async getParentCategories(
    options: ParentCategoriesFetchOptions = {}
  ): Promise<CategoriesResponse> {
    const params = this.buildQueryParams(options);
    const endpoint = params.toString() ? `/parents?${params}` : "/parents";
    return this.makeRequest<CategoriesResponse>(endpoint);
  }

  async getSubcategories(
    parentId: string,
    options: SubcategoriesFetchOptions = {}
  ): Promise<CategoriesResponse> {
    const params = this.buildQueryParams(options);
    const endpoint = params.toString()
      ? `/parents/${parentId}/subcategories?${params}`
      : `/parents/${parentId}/subcategories`;
    return this.makeRequest<CategoriesResponse>(endpoint);
  }

  async searchCategories(
    params: CategorySearchQuery
  ): Promise<CategorySearchResponse> {
    const queryParams = this.buildQueryParams(params);
    return this.makeRequest<CategorySearchResponse>(`/search?${queryParams}`);
  }

  // ==================== DELETED CATEGORIES METHODS ====================

  async getDeletedCategories(
    params: DeletedCategoriesParams = {}
  ): Promise<PaginatedCategoryResponse> {
    const queryParams = this.buildQueryParams(params);
    const endpoint = queryParams.toString()
      ? `/deleted?${queryParams}`
      : "/deleted";
    return this.makeRequest<PaginatedCategoryResponse>(endpoint);
  }

  async getDeletedCategoryById(
    categoryId: string,
    options: DeletedCategoryFetchOptions = {}
  ): Promise<CategoryResponse> {
    const params = this.buildQueryParams(options);
    const endpoint = params.toString()
      ? `/deleted/${categoryId}?${params}`
      : `/deleted/${categoryId}`;
    return this.makeRequest<CategoryResponse>(endpoint);
  }

  // ==================== MODERATION METHODS ====================

  async getPendingCategories(
    params: PendingCategoriesParams = {}
  ): Promise<PaginatedCategoryResponse> {
    const queryParams = this.buildQueryParams(params);
    const endpoint = queryParams.toString()
      ? `/moderation/pending?${queryParams}`
      : "/moderation/pending";
    return this.makeRequest<PaginatedCategoryResponse>(endpoint);
  }

  async moderateCategory(
    categoryId: string,
    data: ModerateCategoryData
  ): Promise<ModerationResponse> {
    return this.makeRequest<ModerationResponse>(`/${categoryId}/moderate`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async bulkModerateCategories(
    data: BulkModerateCategoriesData
  ): Promise<BulkModerationResponse> {
    return this.makeRequest<BulkModerationResponse>("/moderate/bulk", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // ==================== ADMIN HELPER METHODS ====================

  async getCategoryWithFullDetails(
    categoryId: string,
    includeServices = true,
    servicesLimit = 10
  ): Promise<CategoryResponse> {
    return this.getCategoryById(categoryId, {
      includeSubcategories: true,
      includeUserData: true,
      includeServices,
      servicesLimit,
    });
  }

  async getCategoriesForAdmin(
    params: Omit<CategorySearchParams, "includeUserData"> & {
      includeInactive?: boolean;
      includeServices?: boolean;
      servicesLimit?: number;
    } = {}
  ): Promise<PaginatedCategoryResponse> {
    return this.getCategories({
      ...params,
      includeUserData: true,
      includeServicesCount: true,
      servicesLimit: params.servicesLimit || 5,
    });
  }

  async getParentCategoriesForAdmin(
    includeInactive = false,
    includeServices = false,
    servicesLimit = 5
  ): Promise<CategoriesResponse> {
    return this.getParentCategories({
      includeSubcategories: true,
      includeServicesCount: true,
      includeUserData: true,
      includeInactive,
      includeServices,
      servicesLimit,
    });
  }

  async searchCategoriesForAdmin(
    query: string,
    limit?: number,
    includeInactive = false,
  ): Promise<CategorySearchResponse> {
    return this.searchCategories({
      q: query,
      limit,
      includeUserData: true,
      includeInactive,
    });
  }

  // ==================== MODERATION HELPER METHODS ====================

  async approveCategoriesBulk(
    categoryIds: string[],
    notes?: string
  ): Promise<BulkModerationResponse> {
    return this.bulkModerateCategories({
      categoryIds,
      moderationStatus: ModerationStatus.APPROVED,
      moderationNotes: notes,
    });
  }

  async rejectCategoriesBulk(
    categoryIds: string[],
    notes?: string
  ): Promise<BulkModerationResponse> {
    return this.bulkModerateCategories({
      categoryIds,
      moderationStatus: ModerationStatus.REJECTED,
      moderationNotes: notes,
    });
  }

  async approveCategory(
    categoryId: string,
    notes?: string
  ): Promise<ModerationResponse> {
    return this.moderateCategory(categoryId, {
      moderationStatus: ModerationStatus.APPROVED,
      moderationNotes: notes,
    });
  }

  async rejectCategory(
    categoryId: string,
    notes?: string
  ): Promise<ModerationResponse> {
    return this.moderateCategory(categoryId, {
      moderationStatus: ModerationStatus.REJECTED,
      moderationNotes: notes,
    });
  }

  async flagCategory(
    categoryId: string,
    notes?: string
  ): Promise<ModerationResponse> {
    return this.moderateCategory(categoryId, {
      moderationStatus: ModerationStatus.FLAGGED,
      moderationNotes: notes,
    });
  }

  async hideCategory(
    categoryId: string,
    notes?: string
  ): Promise<ModerationResponse> {
    return this.moderateCategory(categoryId, {
      moderationStatus: ModerationStatus.HIDDEN,
      moderationNotes: notes,
    });
  }

  // ==================== PUBLIC FACING METHODS ====================

  async getCategoriesWithPopularServices(
    params: Omit<CategorySearchParams, "popularOnly" | "includeServices"> = {}
  ): Promise<PaginatedCategoryResponse> {
    return this.getCategories({
      ...params,
      includeServices: true,
      popularOnly: true,
      servicesLimit: params.servicesLimit || 3,
    });
  }

  async getParentCategoriesWithServices(
    servicesLimit = 5,
    popularOnly = false
  ): Promise<CategoriesResponse> {
    return this.getParentCategories({
      includeServices: true,
      servicesLimit,
      popularOnly,
      includeServicesCount: true,
    });
  }

  async getCategoryWithAllServices(
    categoryId: string,
    servicesLimit = 20
  ): Promise<CategoryResponse> {
    return this.getCategoryById(categoryId, {
      includeServices: true,
      includeSubcategories: true,
      servicesLimit,
    });
  }

  async getSubcategoriesWithServices(
    parentId: string,
    servicesLimit = 3,
    popularOnly = true
  ): Promise<CategoriesResponse> {
    return this.getSubcategories(parentId, {
      includeServices: true,
      servicesLimit,
      popularOnly,
    });
  }

  async getAllCategoriesForAdmin(
    params: CategorySearchParams = {},
    includeServices = false
  ): Promise<PaginatedCategoryResponse> {
    return this.getCategoriesForAdmin({
      ...params,
      includeInactive: true,
      includeServices,
      servicesLimit: 5,
    });
  }

  async getAllParentCategoriesForAdmin(
    includeServices = false
  ): Promise<CategoriesResponse> {
    return this.getParentCategoriesForAdmin(true, includeServices, 5);
  }

  async searchAllCategoriesForAdmin(
    query: string,
    limit?: number,
  ): Promise<CategorySearchResponse> {
    return this.searchCategoriesForAdmin(
      query,
      limit,
      true
    );
  }

  async getInactiveCategoriesForAdmin(
    params: CategorySearchParams = {}
  ): Promise<PaginatedCategoryResponse> {
    const response = await this.getCategoriesForAdmin({
      ...params,
      includeInactive: true,
    });

    const inactiveCategories = response.data.categories.filter(
      (cat) => !cat.isActive
    );

    return {
      ...response,
      data: {
        ...response.data,
        categories: inactiveCategories,
        pagination: {
          ...response.data.pagination,
          total: inactiveCategories.length,
        },
      },
    };
  }

  async getFeaturedCategories(limit = 8): Promise<CategoriesResponse> {
    const response = await this.getParentCategories({
      includeServices: true,
      servicesLimit: 3,
      popularOnly: true,
    });

    const featuredCategories = response.data.categories.slice(0, limit);

    return {
      ...response,
      data: {
        categories: featuredCategories,
      },
    };
  }

  async getCategoriesForNavigation(): Promise<CategoriesResponse> {
    return this.getParentCategories({
      includeSubcategories: true,
      includeServicesCount: true,
    });
  }

  async getCategoryBreadcrumb(categoryId: string): Promise<CategoryResponse> {
    return this.getCategoryById(categoryId, {
      includeUserData: false,
      includeSubcategories: false,
      includeServices: false,
    });
  }
}

export const categoryAPI = new CategoryAPI();
export default CategoryAPI;