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
  businessType?: string;
  minRating?: number;
  maxServiceRadius?: number;
  available?: boolean;
  search?: string;
  hasInsurance?: boolean;
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
  riskFactors?: unknown;
  mitigationMeasures?: unknown;
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
    isAvailable: boolean;
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
    assessments: {
      overdue: number;
      upToDate: number;
    };
  };
}

export interface RiskScoreResponse {
  message: string;
  data: {
    riskScore: number;
    riskLevel: RiskLevel;
    isRiskAssessmentOverdue: boolean;
    lastAssessmentDate?: Date;
    nextAssessmentDate?: Date;
    riskFactors?: unknown;
    mitigationMeasures?: unknown;
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

  // ===== CORE PROVIDER PROFILE MANAGEMENT (Token-based) =====

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
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // ===== PUBLIC PROVIDER PROFILES (No authentication required) =====

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
    const endpoint = queryString ? `/public?${queryString}` : "/public";

    return this.makeRequest<ApiResponse<PaginatedResponse<Partial<ProviderProfile>>>>(endpoint, {
      method: "GET",
    });
  }

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

  // ===== ADMIN PROVIDER PROFILE MANAGEMENT =====

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
   * Get provider profile by profile ID (Admin use)
   */
  async getProviderProfileByProfileId(
    profileId: string
  ): Promise<ApiResponse<ProviderProfile>> {
    return this.makeRequest<ApiResponse<ProviderProfile>>(`/profile/${profileId}`, {
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

  // ===== SPECIALIZED QUERIES =====

  /**
   * Get available providers
   */
  async getAvailableProviders(
    serviceRadius?: number
  ): Promise<ApiResponse<ProviderProfile[]>> {
    const params = serviceRadius
      ? `?serviceRadius=${serviceRadius}`
      : "";
    return this.makeRequest<ApiResponse<ProviderProfile[]>>(`/available${params}`, {
      method: "GET",
    });
  }

  /**
   * Get top-rated providers
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
   * Get high-risk providers
   */
  async getHighRiskProviders(): Promise<ApiResponse<ProviderProfile[]>> {
    return this.makeRequest<ApiResponse<ProviderProfile[]>>("/high-risk", {
      method: "GET",
    });
  }

  /**
   * Get providers by operational status
   */
  async getProvidersByStatus(
    status: ProviderOperationalStatus
  ): Promise<ApiResponse<ProviderProfile[]>> {
    return this.makeRequest<ApiResponse<ProviderProfile[]>>(`/by-status/${status}`, {
      method: "GET",
    });
  }

  /**
   * Get providers by risk level
   */
  async getProvidersByRiskLevel(
    riskLevel: RiskLevel
  ): Promise<ApiResponse<ProviderProfile[]>> {
    return this.makeRequest<ApiResponse<ProviderProfile[]>>(`/by-risk-level/${riskLevel}`, {
      method: "GET",
    });
  }

  // ===== OPERATIONAL STATUS MANAGEMENT =====

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

  // ===== PERFORMANCE METRICS =====

  /**
   * Update performance metrics (Admin only)
   */
  async updatePerformanceMetrics(
    id: string,
    data: UpdatePerformanceMetricsData
  ): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>(`/${id}/performance-metrics`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // ===== SERVICE OFFERINGS MANAGEMENT (Admin) =====

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

  // ===== PENALTIES & WARNINGS =====

  /**
   * Add penalty to provider (Admin only)
   */
  async addPenalty(id: string): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>(`/${id}/penalty`, {
      method: "POST",
    });
  }

  // ===== WORKING HOURS MANAGEMENT (Admin) =====

  /**
   * Update working hours (Admin use)
   */
  async updateWorkingHours(
    id: string,
    data: UpdateWorkingHoursData
  ): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>(`/${id}/working-hours`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // ===== RISK ASSESSMENT =====

  /**
   * Update risk assessment (Admin only)
   */
  async updateRiskAssessment(
    id: string,
    data: UpdateRiskAssessmentData
  ): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>(`/${id}/risk-assessment`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * Get provider risk score
   */
  async getProviderRiskScore(id: string): Promise<RiskScoreResponse> {
    return this.makeRequest<RiskScoreResponse>(`/${id}/risk-score`, {
      method: "GET",
    });
  }

  /**
   * Get overdue risk assessments
   */
  async getOverdueRiskAssessments(): Promise<ApiResponse<ProviderProfile[]>> {
    return this.makeRequest<ApiResponse<ProviderProfile[]>>("/overdue-assessments", {
      method: "GET",
    });
  }

  /**
   * Schedule next assessment
   */
  async scheduleNextAssessment(
    id: string,
    data: ScheduleAssessmentData
  ): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>(`/${id}/schedule-assessment`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Get risk assessment history
   */
  async getRiskAssessmentHistory(id: string): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>(`/${id}/risk-history`, {
      method: "GET",
    });
  }

  /**
   * Bulk update risk assessments
   */
  async bulkUpdateRiskAssessments(
    data: BulkUpdateRiskAssessmentsData
  ): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>("/bulk-risk-assessments", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // ===== STATISTICS & ANALYTICS =====

  /**
   * Get provider statistics
   */
  async getProviderStatistics(): Promise<ProviderStatisticsResponse> {
    return this.makeRequest<ProviderStatisticsResponse>("/statistics", {
      method: "GET",
    });
  }

  // ===== HEALTH CHECK =====

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<ApiResponse<{ timestamp: string }>> {
    return this.makeRequest<ApiResponse<{ timestamp: string }>>("/health", {
      method: "GET",
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
  return provider?.isAvailableForWork === true && isProviderActive(provider);
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

// Export the ProviderProfileAPI class for custom instances
export { ProviderProfileAPI };