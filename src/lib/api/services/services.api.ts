import { Service } from "@/types/service.types";
import { ServiceStatus } from "@/types/base.types";
import { AuthResponse } from "@/types/user.types";
import { FileReference } from "../categories/categoryImage.api";

// Custom error class for service API errors
export class ServiceAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public data?: unknown
  ) {
    super(message);
    this.name = "ServiceAPIError";
  }
}

// Service-specific request/response types
export interface CreateServiceData {
  title: string;
  description: string;
  categoryId: string;
  priceDescription?: string;
  priceBasedOnServiceType?: boolean;
  basePrice?: number;
  priceRange?: {
    min: number;
    max: number;
    currency?: string;
  };
  images?: FileReference[];
  tags?: string[];
  metaDescription?: string;
}

export interface UpdateServiceData {
  title?: string;
  description?: string;
  categoryId?: string;
  priceDescription?: string;
  priceBasedOnServiceType?: boolean;
  basePrice?: number;
  priceRange?: {
    min: number;
    max: number;
    currency?: string;
  };
  images?: FileReference[];
  tags?: string[];
  metaDescription?: string;
  isPopular?: boolean;
}

// Admin-specific types
export interface ApproveServiceData {
  serviceId: string;
}

export interface RejectServiceData {
  serviceId: string;
  reason?: string;
}

export interface ServiceSearchParams {
  userId?: string;
  search?: string;
  category?: string;
  status?: ServiceStatus;
  isPopular?: boolean;
  tags?: string | string[];
  minPrice?: string;
  maxPrice?: string;
  priceBasedOnServiceType?: boolean;
  sortBy?: "createdAt" | "title" | "basePrice" | "updatedAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface UserServiceSearchParams extends ServiceSearchParams {
  includeDeleted?: boolean;
}

export interface ServiceSearchQuery {
  q: string;
  limit?: number;
  category?: string;
  status?: ServiceStatus;
  includeUserData?: boolean;
}

export interface ServiceFetchOptions {
  includeCategory?: boolean;
  includeUserData?: boolean;
}

export interface PaginatedServiceResponse {
  success: boolean;
  message?: string;
  data: Service[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  total: number;
}

export interface UserServiceResponse extends PaginatedServiceResponse {
  summary: {
    statusCounts: Record<string, number>;
    totalServices: number;
  };
}

export interface ServiceResponse {
  success: boolean;
  message?: string;
  data?: Service;
}

export interface ServicesResponse {
  success: boolean;
  message?: string;
  data: Service[];
}

export interface ServiceSearchResponse {
  success: boolean;
  message?: string;
  data: Service[];
}

// File upload types for service images
export interface ServiceImageUploadData {
  file: {
    url: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    uploadedAt?: Date;
  };
}

export interface ServiceImageResponse {
  success: boolean;
  message?: string;
  data?: {
    entityType: string;
    entityId: string;
    file: FileReference;
    entity?: Service;
  };
}

export interface ServiceImagesResponse {
  success: boolean;
  message?: string;
  data?: {
    file?: FileReference | FileReference[];
    hasFile: boolean;
    entityType: string;
    entityId: string;
  };
}

export interface BatchFileOperationData {
  entities: Array<{
    entityType: string;
    entityId: string;
  }>;
}

export interface BatchFileOperationResponse {
  success: boolean;
  message?: string;
  data?: {
    operation: string;
    results: Array<{
      entityType: string;
      entityId: string;
      success: boolean;
      error?: string;
      hasFile?: boolean;
      file?: FileReference | null;
    }>;
    total: number;
    successful: number;
  };
}

type ErrorResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  [key: string]: unknown;
};

// Service API class
class ServiceAPI {
  private baseURL: string;

  constructor(baseURL: string = "/api/services") {
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
        throw new ServiceAPIError(
          err.message || `Request failed with status ${response.status}`,
          response.status,
          data
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof ServiceAPIError) {
        throw error;
      }

      throw new ServiceAPIError(
        "Network error or server is unreachable",
        0,
        error
      );
    }
  }

  // =============================================================
  // AUTHENTICATED SERVICE ROUTES - Match backend routes exactly
  // =============================================================

  /**
   * Get services created by the current authenticated user
   * GET /api/services/my-services
   */
  async getUserServices(
    params: UserServiceSearchParams = {}
  ): Promise<UserServiceResponse> {
    const queryString = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => queryString.append(key, v.toString()));
        } else {
          queryString.append(key, value.toString());
        }
      }
    });

    const endpoint = queryString.toString()
      ? `/my-services?${queryString}`
      : "/my-services";
    return this.makeRequest<UserServiceResponse>(endpoint);
  }

  /**
   * Create new service (authenticated users can create services)
   * POST /api/services/
   */
  async createService(data: CreateServiceData): Promise<ServiceResponse> {
    return this.makeRequest<ServiceResponse>("/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Update service (users can update their own services)
   * PUT /api/services/:id
   */
  async updateService(
    serviceId: string,
    data: UpdateServiceData
  ): Promise<ServiceResponse> {
    return this.makeRequest<ServiceResponse>(`/${serviceId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * Soft delete service (users can delete their own services)
   * DELETE /api/services/:id
   */
  async deleteService(serviceId: string): Promise<AuthResponse> {
    return this.makeRequest<AuthResponse>(`/${serviceId}`, {
      method: "DELETE",
    });
  }

  // =============================================================
  // SERVICE FILE MANAGEMENT ROUTES - Authentication required
  // =============================================================

  /**
   * Add/Update images to existing service
   * POST /api/services/:serviceId/images
   */
  async uploadServiceImages(
    serviceId: string,
    data: ServiceImageUploadData
  ): Promise<ServiceImageResponse> {
    return this.makeRequest<ServiceImageResponse>(`/${serviceId}/images`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Get service images
   * GET /api/services/:serviceId/images
   */
  async getServiceImages(serviceId: string): Promise<ServiceImagesResponse> {
    return this.makeRequest<ServiceImagesResponse>(`/${serviceId}/images`);
  }

  /**
   * Delete all images from service
   * DELETE /api/services/:serviceId/images
   */
  async deleteServiceImages(serviceId: string): Promise<ServiceImagesResponse> {
    return this.makeRequest<ServiceImagesResponse>(`/${serviceId}/images`, {
      method: "DELETE",
    });
  }

  // =============================================================
  // ADMIN SERVICE ROUTES - Admin authentication required
  // =============================================================

  /**
   * Restore deleted service (admin only)
   * PATCH /api/services/:id/restore
   */
  async restoreService(serviceId: string): Promise<ServiceResponse> {
    return this.makeRequest<ServiceResponse>(`/${serviceId}/restore`, {
      method: "PATCH",
    });
  }

  /**
   * Toggle popular status (admin only)
   * PATCH /api/services/:id/toggle-popular
   */
  async togglePopular(serviceId: string): Promise<ServiceResponse> {
    return this.makeRequest<ServiceResponse>(`/${serviceId}/toggle-popular`, {
      method: "PATCH",
    });
  }

  /**
   * Approve service (admin only)
   * PATCH /api/services/:id/approve
   */
  async approveService(data: ApproveServiceData): Promise<ServiceResponse> {
    return this.makeRequest<ServiceResponse>(`/${data.serviceId}/approve`, {
      method: "PATCH",
    });
  }

  /**
   * Reject service (admin only)
   * PATCH /api/services/:id/reject
   */
  async rejectService(data: RejectServiceData): Promise<ServiceResponse> {
    return this.makeRequest<ServiceResponse>(`/${data.serviceId}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ reason: data.reason }),
    });
  }

  /**
   * Batch file operations for multiple services (admin only)
   * POST /api/services/batch/images/:operation
   */
  async batchFileOperation(
    operation: "get" | "delete",
    data: BatchFileOperationData
  ): Promise<BatchFileOperationResponse> {
    return this.makeRequest<BatchFileOperationResponse>(
      `/batch/images/${operation}`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  }

  // =============================================================
  // PUBLIC SERVICE ROUTES - No authentication required (exact order from routes)
  // =============================================================

  /**
   * Get all services with filtering and pagination
   * GET /api/services/
   */
  async getAllServices(
    params: ServiceSearchParams = {}
  ): Promise<PaginatedServiceResponse> {
    const queryString = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => queryString.append(key, v.toString()));
        } else {
          queryString.append(key, value.toString());
        }
      }
    });

    const endpoint = queryString.toString() ? `/?${queryString}` : "/";
    return this.makeRequest<PaginatedServiceResponse>(endpoint);
  }

  /**
   * Get popular services
   * GET /api/services/popular
   */
  async getPopularServices(limit?: number): Promise<ServicesResponse> {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());

    const endpoint = params.toString() ? `/popular?${params}` : "/popular";
    return this.makeRequest<ServicesResponse>(endpoint);
  }

  /**
   * Get services with explicit pricing only (priceBasedOnServiceType: false)
   * GET /api/services/with-pricing
   */
  async getServicesWithPricing(
    params: ServiceSearchParams = {}
  ): Promise<PaginatedServiceResponse> {
    const queryString = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => queryString.append(key, v.toString()));
        } else {
          queryString.append(key, value.toString());
        }
      }
    });

    const endpoint = queryString.toString()
      ? `/with-pricing?${queryString}`
      : "/with-pricing";
    return this.makeRequest<PaginatedServiceResponse>(endpoint);
  }

  /**
   * Get pending services (admin only - for moderation)
   * GET /api/services/pending
   */
  async getPendingServices(
    params: Pick<ServiceSearchParams, "page" | "limit"> = {}
  ): Promise<PaginatedServiceResponse> {
    const queryString = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, value.toString());
      }
    });

    const endpoint = queryString.toString()
      ? `/pending?${queryString}`
      : "/pending";
    return this.makeRequest<PaginatedServiceResponse>(endpoint);
  }

  /**
   * Get services by category (parameterized route)
   * GET /api/services/category/:categoryId
   */
  async getServicesByCategory(
    categoryId: string,
    params: Omit<ServiceSearchParams, "category"> = {}
  ): Promise<PaginatedServiceResponse> {
    const queryString = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => queryString.append(key, v.toString()));
        } else {
          queryString.append(key, value.toString());
        }
      }
    });

    const endpoint = queryString.toString()
      ? `/category/${categoryId}?${queryString}`
      : `/category/${categoryId}`;

    return this.makeRequest<PaginatedServiceResponse>(endpoint);
  }

  /**
   * Get service by slug (for SEO-friendly URLs)
   * GET /api/services/slug/:slug
   */
  async getServiceBySlug(slug: string): Promise<ServiceResponse> {
    return this.makeRequest<ServiceResponse>(`/slug/${slug}`);
  }

  /**
   * Get service by ID
   * GET /api/services/:id
   */
  async getServiceById(
    serviceId: string,
    options: ServiceFetchOptions = {}
  ): Promise<ServiceResponse> {
    const params = new URLSearchParams();

    if (options.includeCategory) params.append("includeCategory", "true");
    if (options.includeUserData) params.append("includeUserData", "true");

    const endpoint = params.toString()
      ? `/${serviceId}?${params}`
      : `/${serviceId}`;
    return this.makeRequest<ServiceResponse>(endpoint);
  }

  // =============================================================
  // CONVENIENCE METHODS FOR COMMON USE CASES
  // =============================================================

  /**
   * Get service with full details (including category and user data)
   * Useful for admin interfaces
   */
  async getServiceWithFullDetails(serviceId: string): Promise<ServiceResponse> {
    return this.getServiceById(serviceId, {
      includeCategory: true,
      includeUserData: true,
    });
  }

  /**
   * Get services for admin dashboard with user tracking
   */
  async getServicesForAdmin(
    params: ServiceSearchParams = {}
  ): Promise<PaginatedServiceResponse> {
    return this.getAllServices({
      ...params,
      // Could add includeUserData if supported by backend
    });
  }

  /**
   * Get approved services only (for public display)
   */
  async getApprovedServices(
    params: ServiceSearchParams = {}
  ): Promise<PaginatedServiceResponse> {
    return this.getAllServices({
      ...params,
      status: ServiceStatus.APPROVED,
    });
  }

  /**
   * Get services by status
   */
  async getServicesByStatus(
    status: ServiceStatus,
    params: Omit<ServiceSearchParams, "status"> = {}
  ): Promise<PaginatedServiceResponse> {
    return this.getAllServices({
      ...params,
      status,
    });
  }

  /**
   * Get services in a price range
   */
  async getServicesInPriceRange(
    minPrice: number,
    maxPrice: number,
    params: Omit<ServiceSearchParams, "minPrice" | "maxPrice"> = {}
  ): Promise<PaginatedServiceResponse> {
    return this.getAllServices({
      ...params,
      minPrice: minPrice.toString(),
      maxPrice: maxPrice.toString(),
    });
  }

  /**
   * Get services with fixed pricing (not service-type based)
   */
  async getServicesWithFixedPricing(
    params: ServiceSearchParams = {}
  ): Promise<PaginatedServiceResponse> {
    return this.getServicesWithPricing(params);
  }

  /**
   * Get services with service-type based pricing
   */
  async getServicesWithServiceTypePricing(
    params: ServiceSearchParams = {}
  ): Promise<PaginatedServiceResponse> {
    return this.getAllServices({
      ...params,
      priceBasedOnServiceType: true,
    });
  }

  /**
   * Get user's services by status
   */
  async getUserServicesByStatus(
    status: ServiceStatus,
    params: Omit<UserServiceSearchParams, "status"> = {}
  ): Promise<UserServiceResponse> {
    return this.getUserServices({
      ...params,
      status,
    });
  }

  /**
   * Get user's draft services
   */
  async getUserDraftServices(
    params: UserServiceSearchParams = {}
  ): Promise<UserServiceResponse> {
    return this.getUserServicesByStatus(ServiceStatus.DRAFT, params);
  }

  /**
   * Get user's pending services
   */
  async getUserPendingServices(
    params: UserServiceSearchParams = {}
  ): Promise<UserServiceResponse> {
    return this.getUserServicesByStatus(ServiceStatus.PENDING_APPROVAL, params);
  }

  /**
   * Get user's approved services
   */
  async getUserApprovedServices(
    params: UserServiceSearchParams = {}
  ): Promise<UserServiceResponse> {
    return this.getUserServicesByStatus(ServiceStatus.APPROVED, params);
  }

  /**
   * Get user's rejected services
   */
  async getUserRejectedServices(
    params: UserServiceSearchParams = {}
  ): Promise<UserServiceResponse> {
    return this.getUserServicesByStatus(ServiceStatus.REJECTED, params);
  }

  /**
   * Get user's deleted services
   */
  async getUserDeletedServices(
    params: UserServiceSearchParams = {}
  ): Promise<UserServiceResponse> {
    return this.getUserServices({
      ...params,
      includeDeleted: true,
    });
  }

  /**
   * Get popular services with limit
   */
  async getTopPopularServices(limit: number = 10): Promise<ServicesResponse> {
    return this.getPopularServices(limit);
  }

  /**
   * Get services by multiple tags
   */
  async getServicesByTags(
    tags: string[],
    params: Omit<ServiceSearchParams, "tags"> = {}
  ): Promise<PaginatedServiceResponse> {
    return this.getAllServices({
      ...params,
      tags,
    });
  }

  /**
   * Get recently created services
   */
  async getRecentServices(
    limit: number = 10,
    params: ServiceSearchParams = {}
  ): Promise<PaginatedServiceResponse> {
    return this.getAllServices({
      ...params,
      limit,
      sortBy: "createdAt",
      sortOrder: "desc",
      status: ServiceStatus.APPROVED,
    });
  }

  /**
   * Get services sorted by price (low to high)
   */
  async getServicesByPriceLowToHigh(
    params: ServiceSearchParams = {}
  ): Promise<PaginatedServiceResponse> {
    return this.getAllServices({
      ...params,
      sortBy: "basePrice",
      sortOrder: "asc",
      priceBasedOnServiceType: false,
    });
  }

  /**
   * Get services sorted by price (high to low)
   */
  async getServicesByPriceHighToLow(
    params: ServiceSearchParams = {}
  ): Promise<PaginatedServiceResponse> {
    return this.getAllServices({
      ...params,
      sortBy: "basePrice",
      sortOrder: "desc",
      priceBasedOnServiceType: false,
    });
  }

  // =============================================================
  // BATCH OPERATIONS AND UTILITY METHODS
  // =============================================================

  /**
   * Batch get files for multiple services (admin only)
   */
  async batchGetServiceImages(
    serviceIds: string[]
  ): Promise<BatchFileOperationResponse> {
    const entities = serviceIds.map((id) => ({
      entityType: "service",
      entityId: id,
    }));

    return this.batchFileOperation("get", { entities });
  }

  /**
   * Batch delete files for multiple services (admin only)
   */
  async batchDeleteServiceImages(
    serviceIds: string[]
  ): Promise<BatchFileOperationResponse> {
    const entities = serviceIds.map((id) => ({
      entityType: "service",
      entityId: id,
    }));

    return this.batchFileOperation("delete", { entities });
  }

}

// Export singleton instance
export const serviceAPI = new ServiceAPI();
export default ServiceAPI;
