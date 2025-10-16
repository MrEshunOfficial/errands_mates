import { 
  CreateProviderProfileRequestBody, 
  ProviderProfileResponse, 
  UpdateProviderProfileRequestBody, 
  ProviderProfile 
} from "@/types/provider-profile.types";
import { QueryParams, PaginatedResponse } from "@/types/aggregated.types";
import {
  ProviderOperationalStatus,
  RiskLevel,
} from "@/types/base.types";

// Custom error class for provider profile API errors
export class ProviderProfileAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public data?: unknown
  ) {
    super(message);
    this.name = "ProviderProfileAPIError";
  }
}

// Generic API response interface
export interface ApiResponse<T = unknown> {
  message: string;
  data?: T;
  error?: string;
  success?: boolean;
}

// Provider Profile specific request/response types
export interface ProviderProfileQueryParams extends QueryParams {
  status?: ProviderOperationalStatus;
  riskLevel?: RiskLevel;
  available?: boolean;
  serviceId?: string;
}

export interface PublicProviderProfileQueryParams extends QueryParams {
  serviceId?: string;
  minRating?: number;
  available?: boolean;
  search?: string;
}

export interface LocationSearchParams {
  lat?: number;
  lng?: number;
  radius?: number;
  serviceId?: string;
  limit?: number;
}

export interface UpdateOperationalStatusData {
  status: ProviderOperationalStatus;
  reason?: string;
}

export interface UpdatePerformanceMetricsData {
  completionRate?: number;
  averageRating?: number;
  totalJobs?: number;
  responseTimeMinutes?: number;
  averageResponseTime?: number;
  cancellationRate?: number;
  disputeRate?: number;
  clientRetentionRate?: number;
}

export interface UpdateRiskAssessmentData {
  riskLevel?: RiskLevel;
  notes?: string;
  nextAssessmentDays?: number;
}

export interface BulkUpdateRiskAssessmentsData {
  providerIds: string[];
  updates: UpdateRiskAssessmentData;
}

export interface UpdateWorkingHoursData {
  day: string;
  hours: {
    start: string;
    end: string;
  };
}

export interface AddServiceOfferingData {
  serviceId: string;
}

export interface ScheduleAssessmentData {
  daysFromNow?: number;
}

export interface ProviderStatisticsResponse {
  message: string;
  data: {
    total: number;
    byStatus: {
      active: number;
      probationary: number;
      suspended: number;
    };
    byRiskLevel: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
    availability: {
      available: number;
      unavailable: number;
    };
  };
}

export interface RiskScoreResponse {
  message: string;
  data: {
    riskScore: number;
    riskLevel: RiskLevel;
    lastAssessmentDate?: Date;
    riskAssessedBy?: string;
    penaltiesCount: number;
    performanceMetrics?: ProviderProfile['performanceMetrics'];
  };
}

type ErrorResponse = {
  message?: string;
  error?: string;
  [key: string]: unknown;
};

// Provider Profile API class
class ProviderProfileAPI {
  private baseURL: string;

  constructor(baseURL: string = "/api/profile/provider-profiles") {
    this.baseURL = baseURL;
  }

  private async makeRequest<T = unknown>(
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
        data = { message: await response.text() } as T;
      }

      if (!response.ok) {
        const err = data as ErrorResponse;
        throw new ProviderProfileAPIError(
          err.message ||
            err.error ||
            `Request failed with status ${response.status}`,
          response.status,
          data
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof ProviderProfileAPIError) {
        throw error;
      }

      throw new ProviderProfileAPIError(
        "Network error or server is unreachable",
        0,
        error
      );
    }
  }

  // =============================================================================
  // PUBLIC ROUTES (No authentication required)
  // =============================================================================

  /**
   * Search public providers by location and service
   */
  async searchPublicProviders(
    params?: LocationSearchParams
  ): Promise<ApiResponse<Partial<ProviderProfile>[]>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/public/search?${queryString}` : "/public/search";

    return this.makeRequest<ApiResponse<Partial<ProviderProfile>[]>>(endpoint, {
      method: "GET",
    });
  }

  /**
   * Get all public provider profiles with filtering
   */
  async getPublicProviderProfiles(
    params?: PublicProviderProfileQueryParams
  ): Promise<ApiResponse<PaginatedResponse<Partial<ProviderProfile>>>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/public/browse?${queryString}` : "/public/browse";

    return this.makeRequest<ApiResponse<PaginatedResponse<Partial<ProviderProfile>>>>(endpoint, {
      method: "GET",
    });
  }

  /**
   * Get public provider profile by ID
   */
  async getPublicProviderProfile(
    id: string
  ): Promise<ApiResponse<Partial<ProviderProfile>>> {
    return this.makeRequest<ApiResponse<Partial<ProviderProfile>>>(`/public/${id}`, {
      method: "GET",
    });
  }

  // =============================================================================
  // AUTHENTICATED ROUTES (Token required)
  // =============================================================================

  /**
   * Create a new provider profile
   */
  async createProviderProfile(
    data: CreateProviderProfileRequestBody
  ): Promise<ProviderProfileResponse> {
    return this.makeRequest<ProviderProfileResponse>("/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Get current user's provider profile
   */
  async getMyProviderProfile(): Promise<ProviderProfileResponse> {
    return this.makeRequest<ProviderProfileResponse>("/me", {
      method: "GET",
    });
  }

  /**
   * Update current user's provider profile
   */
  async updateMyProviderProfile(
    data: UpdateProviderProfileRequestBody
  ): Promise<ProviderProfileResponse> {
    return this.makeRequest<ProviderProfileResponse>("/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * Toggle current user's availability
   */
  async toggleMyAvailability(): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>("/me/toggle-availability", {
      method: "PATCH",
    });
  }

  /**
   * Add service offering to current user's profile
   */
  async addMyServiceOffering(
    data: AddServiceOfferingData
  ): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>("/me/service-offerings", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Remove service offering from current user's profile
   */
  async removeMyServiceOffering(serviceId: string): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>(`/me/service-offerings/${serviceId}`, {
      method: "DELETE",
    });
  }

  /**
   * Update current user's working hours
   */
  async updateMyWorkingHours(
    data: UpdateWorkingHoursData
  ): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>("/me/working-hours", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // =============================================================================
  // ADMIN ROUTES
  // =============================================================================

  /**
   * Get provider statistics (Super Admin only)
   */
  async getProviderStatistics(): Promise<ProviderStatisticsResponse> {
    return this.makeRequest<ProviderStatisticsResponse>("/statistics", {
      method: "GET",
    });
  }

  /**
   * Bulk update risk assessments (Super Admin only)
   */
  async bulkUpdateRiskAssessments(
    data: BulkUpdateRiskAssessmentsData
  ): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>("/bulk/risk-assessments", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  /**
   * Get all provider profiles with pagination (Admin use)
   */
  async getAllProviderProfiles(
    params?: ProviderProfileQueryParams
  ): Promise<ApiResponse<PaginatedResponse<ProviderProfile>>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/all?${queryString}` : "/all";

    return this.makeRequest<ApiResponse<PaginatedResponse<ProviderProfile>>>(endpoint, {
      method: "GET",
    });
  }

  /**
   * Get available providers (Admin use)
   */
  async getAvailableProviders(
    serviceRadius?: number
  ): Promise<ApiResponse<ProviderProfile[]>> {
    const params = serviceRadius ? `?serviceRadius=${serviceRadius}` : "";
    return this.makeRequest<ApiResponse<ProviderProfile[]>>(`/available${params}`, {
      method: "GET",
    });
  }

  /**
   * Get top-rated providers (Admin use)
   */
  async getTopRatedProviders(
    limit?: number
  ): Promise<ApiResponse<ProviderProfile[]>> {
    const params = limit ? `?limit=${limit}` : "";
    return this.makeRequest<ApiResponse<ProviderProfile[]>>(`/top-rated${params}`, {
      method: "GET",
    });
  }

  /**
   * Get high-risk providers (Admin use)
   */
  async getHighRiskProviders(): Promise<ApiResponse<ProviderProfile[]>> {
    return this.makeRequest<ApiResponse<ProviderProfile[]>>("/high-risk", {
      method: "GET",
    });
  }

  /**
   * Get provider profile by profile ID (Admin use)
   */
  async getProviderProfileByProfileId(
    profileId: string
  ): Promise<ApiResponse<ProviderProfile>> {
    return this.makeRequest<ApiResponse<ProviderProfile>>(`/by-profile/${profileId}`, {
      method: "GET",
    });
  }

  /**
   * Get providers by operational status (Admin use)
   */
  async getProvidersByStatus(
    status: ProviderOperationalStatus
  ): Promise<ApiResponse<ProviderProfile[]>> {
    return this.makeRequest<ApiResponse<ProviderProfile[]>>(`/by-status/${status}`, {
      method: "GET",
    });
  }

  /**
   * Get providers by risk level (Admin use)
   */
  async getProvidersByRiskLevel(
    riskLevel: RiskLevel
  ): Promise<ApiResponse<ProviderProfile[]>> {
    return this.makeRequest<ApiResponse<ProviderProfile[]>>(`/by-risk-level/${riskLevel}`, {
      method: "GET",
    });
  }

  /**
   * Get provider profile by ID (Admin use)
   */
  async getProviderProfileById(
    id: string
  ): Promise<ApiResponse<ProviderProfile>> {
    return this.makeRequest<ApiResponse<ProviderProfile>>(`/${id}`, {
      method: "GET",
    });
  }

  /**
   * Update provider profile by ID (Admin use)
   */
  async updateProviderProfile(
    id: string,
    data: UpdateProviderProfileRequestBody
  ): Promise<ProviderProfileResponse> {
    return this.makeRequest<ProviderProfileResponse>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete provider profile (Admin use)
   */
  async deleteProviderProfile(id: string): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>(`/${id}`, {
      method: "DELETE",
    });
  }

  /**
   * Update provider operational status (Admin only)
   */
  async updateOperationalStatus(
    id: string,
    data: UpdateOperationalStatusData
  ): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>(`/${id}/operational-status`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  /**
   * Toggle provider availability (Admin use)
   */
  async toggleAvailability(id: string): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>(`/${id}/toggle-availability`, {
      method: "PATCH",
    });
  }

  /**
   * Update performance metrics (Admin only)
   */
  async updatePerformanceMetrics(
    id: string,
    data: UpdatePerformanceMetricsData
  ): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>(`/${id}/performance-metrics`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  /**
   * Add penalty to provider (Admin only)
   */
  async addPenalty(id: string): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>(`/${id}/penalties`, {
      method: "POST",
    });
  }

  /**
   * Update working hours (Admin use)
   */
  async updateWorkingHours(
    id: string,
    data: UpdateWorkingHoursData
  ): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>(`/${id}/working-hours`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  /**
   * Add service offering to provider (Admin use)
   */
  async addServiceOffering(
    id: string,
    data: AddServiceOfferingData
  ): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>(`/${id}/service-offerings`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Remove service offering from provider (Admin use)
   */
  async removeServiceOffering(
    id: string,
    serviceId: string
  ): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>(`/${id}/service-offerings/${serviceId}`, {
      method: "DELETE",
    });
  }

  /**
   * Update risk assessment (Admin only)
   */
  async updateRiskAssessment(
    id: string,
    data: UpdateRiskAssessmentData
  ): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>(`/${id}/risk-assessment`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  /**
   * Get provider risk score (Admin use)
   */
  async getProviderRiskScore(id: string): Promise<RiskScoreResponse> {
    return this.makeRequest<RiskScoreResponse>(`/${id}/risk-score`, {
      method: "GET",
    });
  }

  /**
   * Get risk assessment history (Admin use)
   */
  async getRiskAssessmentHistory(id: string): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>(`/${id}/risk-history`, {
      method: "GET",
    });
  }

  /**
   * Schedule next assessment (Admin use)
   */
  async scheduleNextAssessment(
    id: string,
    data: ScheduleAssessmentData
  ): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>(`/${id}/schedule-assessment`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }
}

// Create and export singleton instance
export const providerProfileAPI = new ProviderProfileAPI();

// Export utility functions
export const isProviderActive = (
  provider: ProviderProfile | null
): boolean => {
  return (
    provider?.operationalStatus === ProviderOperationalStatus.ACTIVE &&
    !provider?.isDeleted
  );
};

export const isProviderAvailable = (
  provider: ProviderProfile | null
): boolean => {
  return provider?.isCurrentlyAvailable === true && isProviderActive(provider);
};

export const getProviderRiskColor = (riskLevel: RiskLevel): string => {
  switch (riskLevel) {
    case RiskLevel.LOW:
      return "green";
    case RiskLevel.MEDIUM:
      return "yellow";
    case RiskLevel.HIGH:
      return "orange";
    case RiskLevel.CRITICAL:
      return "red";
    default:
      return "gray";
  }
};

export const getOperationalStatusColor = (
  status: ProviderOperationalStatus
): string => {
  switch (status) {
    case ProviderOperationalStatus.ACTIVE:
      return "green";
    case ProviderOperationalStatus.PROBATIONARY:
      return "yellow";
    case ProviderOperationalStatus.SUSPENDED:
      return "red";
    default:
      return "gray";
  }
};

export { ProviderProfileAPI };