import { Category } from "@/types/category.types";
import {
  ModerationStatus,
  FileReference
} from "@/types/base.types";
import { AuthResponse } from "@/types/user.types";

// Custom error class for category API errors
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

// Category-specific request/response types
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

// Admin-specific types
export interface ModerateCategoryData {
  categoryId: string;
  status: ModerationStatus;
  moderatedBy: string;
  reason?: string;
  notes?: string;
}

export interface CategorySearchParams {
  search?: string;
  parentId?: string;
  includeSubcategories?: boolean;
  includeServicesCount?: boolean;
  includeInactive?: boolean;
  sortBy?: "displayOrder" | "name" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface CategorySearchQuery {
  q: string;
  limit?: number;
  includeInactive?: boolean;
  parentId?: string;
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

type ErrorResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  [key: string]: unknown;
};

// Category API class
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

  // CRUD Operations
  async createCategory(data: CreateCategoryData): Promise<CategoryResponse> {
    return this.makeRequest<CategoryResponse>("/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getCategoryById(categoryId: string, includeSubcategories?: boolean): Promise<CategoryResponse> {
    const params = new URLSearchParams();
    if (includeSubcategories) params.append("includeSubcategories", "true");
    
    const endpoint = params.toString() ? `/${categoryId}?${params}` : `/${categoryId}`;
    return this.makeRequest<CategoryResponse>(endpoint);
  }

  async getCategoryBySlug(slug: string, includeSubcategories?: boolean): Promise<CategoryResponse> {
    const params = new URLSearchParams();
    if (includeSubcategories) params.append("includeSubcategories", "true");
    
    const endpoint = params.toString() ? `/slug/${slug}?${params}` : `/slug/${slug}`;
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

  // Category Listing Operations
  async getCategories(params: CategorySearchParams = {}): Promise<PaginatedCategoryResponse> {
    const queryString = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, value.toString());
      }
    });

    const endpoint = queryString.toString() ? `/?${queryString}` : "/";
    return this.makeRequest<PaginatedCategoryResponse>(endpoint);
  }

  async getParentCategories(
    includeSubcategories?: boolean,
    includeServicesCount?: boolean
  ): Promise<CategoriesResponse> {
    const params = new URLSearchParams();
    if (includeSubcategories) params.append("includeSubcategories", "true");
    if (includeServicesCount) params.append("includeServicesCount", "true");

    const endpoint = params.toString() ? `/parents?${params}` : "/parents";
    return this.makeRequest<CategoriesResponse>(endpoint);
  }

  async getSubcategories(parentId: string): Promise<CategoriesResponse> {
    return this.makeRequest<CategoriesResponse>(`/${parentId}/subcategories`);
  }

  // Search Operations
  async searchCategories(params: CategorySearchQuery): Promise<CategorySearchResponse> {
    const queryString = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, value.toString());
      }
    });

    return this.makeRequest<CategorySearchResponse>(`/search?${queryString}`);
  }

  // Category Status Operations
  async toggleCategoryStatus(categoryId: string): Promise<CategoryResponse> {
    return this.makeRequest<CategoryResponse>(`/${categoryId}/toggle-status`, {
      method: "PATCH",
    });
  }

  // Display Order Operations
  async updateDisplayOrder(data: UpdateDisplayOrderData): Promise<AuthResponse> {
    return this.makeRequest<AuthResponse>("/display-order", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Admin Operations
  async moderateCategory(data: ModerateCategoryData): Promise<CategoryResponse> {
    return this.makeRequest<CategoryResponse>("/admin/moderate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

// Export singleton instance
export const categoryAPI = new CategoryAPI();
export default CategoryAPI;