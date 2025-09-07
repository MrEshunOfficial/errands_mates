import { Service } from "@/types/service.types";
import {
  ServiceStatus,
  FileReference
} from "@/types/base.types";
import { AuthResponse } from "@/types/user.types";

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

  // CRUD Operations
  async createService(data: CreateServiceData): Promise<ServiceResponse> {
    return this.makeRequest<ServiceResponse>("/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getServiceById(
    serviceId: string, 
    options: ServiceFetchOptions = {}
  ): Promise<ServiceResponse> {
    const params = new URLSearchParams();
    
    if (options.includeCategory) params.append("includeCategory", "true");
    if (options.includeUserData) params.append("includeUserData", "true");
    
    const endpoint = params.toString() ? `/${serviceId}?${params}` : `/${serviceId}`;
    return this.makeRequest<ServiceResponse>(endpoint);
  }

  async getServiceBySlug(slug: string): Promise<ServiceResponse> {
    return this.makeRequest<ServiceResponse>(`/slug/${slug}`);
  }

  async updateService(
    serviceId: string,
    data: UpdateServiceData
  ): Promise<ServiceResponse> {
    return this.makeRequest<ServiceResponse>(`/${serviceId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteService(serviceId: string): Promise<AuthResponse> {
    return this.makeRequest<AuthResponse>(`/${serviceId}`, {
      method: "DELETE",
    });
  }

  async restoreService(serviceId: string): Promise<ServiceResponse> {
    return this.makeRequest<ServiceResponse>(`/${serviceId}/restore`, {
      method: "PATCH",
    });
  }

  // Service Listing Operations
  async getAllServices(params: ServiceSearchParams = {}): Promise<PaginatedServiceResponse> {
    const queryString = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => queryString.append(key, v.toString()));
        } else {
          queryString.append(key, value.toString());
        }
      }
    });

    const endpoint = queryString.toString() ? `/?${queryString}` : "/";
    return this.makeRequest<PaginatedServiceResponse>(endpoint);
  }

  async getUserServices(params: UserServiceSearchParams = {}): Promise<UserServiceResponse> {
    const queryString = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => queryString.append(key, v.toString()));
        } else {
          queryString.append(key, value.toString());
        }
      }
    });

    const endpoint = queryString.toString() ? `/user?${queryString}` : "/user";
    return this.makeRequest<UserServiceResponse>(endpoint);
  }

  // Category-based Operations
  async getServicesByCategory(
    categoryId: string, 
    params: Omit<ServiceSearchParams, 'category'> = {}
  ): Promise<PaginatedServiceResponse> {
    const queryString = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => queryString.append(key, v.toString()));
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

  // Popular Services
  async getPopularServices(limit?: number): Promise<ServicesResponse> {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    
    const endpoint = params.toString() ? `/popular?${params}` : "/popular";
    return this.makeRequest<ServicesResponse>(endpoint);
  }

  async togglePopular(serviceId: string): Promise<ServiceResponse> {
    return this.makeRequest<ServiceResponse>(`/${serviceId}/toggle-popular`, {
      method: "PATCH",
    });
  }

  // Pricing-based Operations
  async getServicesWithPricing(params: ServiceSearchParams = {}): Promise<PaginatedServiceResponse> {
    const queryString = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => queryString.append(key, v.toString()));
        } else {
          queryString.append(key, value.toString());
        }
      }
    });

    const endpoint = queryString.toString() ? `/pricing?${queryString}` : "/pricing";
    return this.makeRequest<PaginatedServiceResponse>(endpoint);
  }

  // Admin Operations
  async getPendingServices(params: Pick<ServiceSearchParams, 'page' | 'limit'> = {}): Promise<PaginatedServiceResponse> {
    const queryString = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, value.toString());
      }
    });

    const endpoint = queryString.toString() ? `/admin/pending?${queryString}` : "/admin/pending";
    return this.makeRequest<PaginatedServiceResponse>(endpoint);
  }

  async approveService(data: ApproveServiceData): Promise<ServiceResponse> {
    return this.makeRequest<ServiceResponse>(`/${data.serviceId}/approve`, {
      method: "PATCH",
    });
  }

  async rejectService(data: RejectServiceData): Promise<ServiceResponse> {
    return this.makeRequest<ServiceResponse>(`/${data.serviceId}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ reason: data.reason }),
    });
  }

  // Search Operations
  async searchServices(params: ServiceSearchQuery): Promise<ServiceSearchResponse> {
    const queryString = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, value.toString());
      }
    });

    return this.makeRequest<ServiceSearchResponse>(`/search?${queryString}`);
  }

  // Convenience methods for common use cases
  
  /**
   * Get service with full details (including category and user data)
   * Useful for admin interfaces
   */
  async getServiceWithFullDetails(serviceId: string): Promise<ServiceResponse> {
    return this.getServiceById(serviceId, {
      includeCategory: true,
      includeUserData: true
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
  async getApprovedServices(params: ServiceSearchParams = {}): Promise<PaginatedServiceResponse> {
    return this.getAllServices({
      ...params,
      status: ServiceStatus.APPROVED
    });
  }

  /**
   * Get services by status
   */
  async getServicesByStatus(
    status: ServiceStatus, 
    params: Omit<ServiceSearchParams, 'status'> = {}
  ): Promise<PaginatedServiceResponse> {
    return this.getAllServices({
      ...params,
      status
    });
  }

  /**
   * Get services in a price range
   */
  async getServicesInPriceRange(
    minPrice: number, 
    maxPrice: number, 
    params: Omit<ServiceSearchParams, 'minPrice' | 'maxPrice'> = {}
  ): Promise<PaginatedServiceResponse> {
    return this.getAllServices({
      ...params,
      minPrice: minPrice.toString(),
      maxPrice: maxPrice.toString()
    });
  }

  /**
   * Get services with fixed pricing (not service-type based)
   */
  async getServicesWithFixedPricing(params: ServiceSearchParams = {}): Promise<PaginatedServiceResponse> {
    return this.getServicesWithPricing(params);
  }

  /**
   * Get services with service-type based pricing
   */
  async getServicesWithServiceTypePricing(params: ServiceSearchParams = {}): Promise<PaginatedServiceResponse> {
    return this.getAllServices({
      ...params,
      priceBasedOnServiceType: true
    });
  }

  /**
   * Search services with specific filters for public display
   */
  async searchServicesForPublic(
    query: string, 
    categoryId?: string, 
    limit?: number
  ): Promise<ServiceSearchResponse> {
    return this.searchServices({
      q: query,
      category: categoryId,
      limit,
      status: ServiceStatus.APPROVED
    });
  }

  /**
   * Search services for admin with all data
   */
  async searchServicesForAdmin(
    query: string, 
    limit?: number,
    status?: ServiceStatus
  ): Promise<ServiceSearchResponse> {
    return this.searchServices({
      q: query,
      limit,
      status,
      includeUserData: true
    });
  }

  /**
   * Get user's services by status
   */
  async getUserServicesByStatus(
    status: ServiceStatus,
    params: Omit<UserServiceSearchParams, 'status'> = {}
  ): Promise<UserServiceResponse> {
    return this.getUserServices({
      ...params,
      status
    });
  }

  /**
   * Get user's draft services
   */
  async getUserDraftServices(params: UserServiceSearchParams = {}): Promise<UserServiceResponse> {
    return this.getUserServicesByStatus(ServiceStatus.DRAFT, params);
  }

  /**
   * Get user's pending services
   */
  async getUserPendingServices(params: UserServiceSearchParams = {}): Promise<UserServiceResponse> {
    return this.getUserServicesByStatus(ServiceStatus.PENDING_APPROVAL, params);
  }

  /**
   * Get user's approved services
   */
  async getUserApprovedServices(params: UserServiceSearchParams = {}): Promise<UserServiceResponse> {
    return this.getUserServicesByStatus(ServiceStatus.APPROVED, params);
  }

  /**
   * Get user's rejected services
   */
  async getUserRejectedServices(params: UserServiceSearchParams = {}): Promise<UserServiceResponse> {
    return this.getUserServicesByStatus(ServiceStatus.REJECTED, params);
  }

  /**
   * Get user's deleted services
   */
  async getUserDeletedServices(params: UserServiceSearchParams = {}): Promise<UserServiceResponse> {
    return this.getUserServices({
      ...params,
      includeDeleted: true
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
    params: Omit<ServiceSearchParams, 'tags'> = {}
  ): Promise<PaginatedServiceResponse> {
    return this.getAllServices({
      ...params,
      tags
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
      status: ServiceStatus.APPROVED
    });
  }

  /**
   * Get services sorted by price (low to high)
   */
  async getServicesByPriceLowToHigh(params: ServiceSearchParams = {}): Promise<PaginatedServiceResponse> {
    return this.getAllServices({
      ...params,
      sortBy: "basePrice",
      sortOrder: "asc",
      priceBasedOnServiceType: false
    });
  }

  /**
   * Get services sorted by price (high to low)
   */
  async getServicesByPriceHighToLow(params: ServiceSearchParams = {}): Promise<PaginatedServiceResponse> {
    return this.getAllServices({
      ...params,
      sortBy: "basePrice",
      sortOrder: "desc",
      priceBasedOnServiceType: false
    });
  }
}

// Export singleton instance
export const serviceAPI = new ServiceAPI();
export default ServiceAPI;