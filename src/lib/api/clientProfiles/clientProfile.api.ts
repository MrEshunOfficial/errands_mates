// api/client-profile.api.ts
import { RiskLevel } from "@/types";
import {
  ClientProfile,
  CreateClientProfileRequest,
  UpdateClientProfileRequest,
  ClientProfileResponse,
  PaginationParams,
  PaginatedResponse,
  ApiResponse,
} from "@/types/client-profile.types";

// Custom error class for client profile API errors
export class ClientProfileAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public data?: unknown
  ) {
    super(message);
    this.name = "ClientProfileAPIError";
  }
}

// Client Profile specific request/response types
export interface ClientProfileQueryParams extends PaginationParams {
  page?: number;
  limit?: number;
  riskLevel?: RiskLevel;
  minTrustScore?: number;
  maxTrustScore?: number;
  loyaltyTier?: "bronze" | "silver" | "gold" | "platinum";
  hasActiveWarnings?: boolean;
  isVerified?: boolean;
  minBookings?: number;
  minSpent?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PublicClientProfileQueryParams {
  page?: number;
  limit?: number;
  loyaltyTier?: "bronze" | "silver" | "gold" | "platinum";
  minRating?: number;
  sortBy?: "memberSince" | "averageRating" | "totalReviews" | "loyaltyTier" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface AddPreferredServiceData {
  serviceId: string;
}

export interface AddPreferredProviderData {
  providerId: string;
}

export interface UpdateTrustScoreData {
  trustScore: number;
}

export interface ClientStatsResponse {
  loyaltyTier?: "bronze" | "silver" | "gold" | "platinum";
  memberSince?: Date;
  lastActiveDate?: Date;
  averageRating?: number;
  totalReviews: number;
  trustScore: number;
  riskLevel: RiskLevel;
  warningsCount: number;
}

type ErrorResponse = {
  message?: string;
  error?: string;
  [key: string]: unknown;
};

// Client Profile API class
class ClientProfileAPI {
  private baseURL: string;

  constructor(baseURL: string = "/api/profile/client-profiles") {
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
        throw new ClientProfileAPIError(
          err.message ||
            err.error ||
            `Request failed with status ${response.status}`,
          response.status,
          data
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof ClientProfileAPIError) {
        throw error;
      }

      throw new ClientProfileAPIError(
        "Network error or server is unreachable",
        0,
        error
      );
    }
  }

  // ===== PUBLIC CLIENT PROFILES (No authentication required) =====

  /**
   * Get all public client profiles with pagination and filters
   */
  async getPublicClientProfiles(
    params?: PublicClientProfileQueryParams
  ): Promise<ApiResponse<{
    profiles: Partial<ClientProfile>[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }>> {
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

    return this.makeRequest<ApiResponse<{
      profiles: Partial<ClientProfile>[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
      };
    }>>(endpoint, {
      method: "GET",
    });
  }

  /**
   * Get public client profile by ID
   */
  async getPublicClientProfile(
    id: string
  ): Promise<ApiResponse<Partial<ClientProfile>>> {
    return this.makeRequest<ApiResponse<Partial<ClientProfile>>>(
      `/public/${id}`,
      {
        method: "GET",
      }
    );
  }

  /**
   * Get public client profile by profile ID
   */
  async getPublicClientProfileByProfileId(
    profileId: string
  ): Promise<ApiResponse<Partial<ClientProfile>>> {
    return this.makeRequest<ApiResponse<Partial<ClientProfile>>>(
      `/public/by-profile/${profileId}`,
      {
        method: "GET",
      }
    );
  }

  /**
   * Get client stats by ID (public endpoint)
   */
  async getPublicClientStats(
    id: string
  ): Promise<ApiResponse<ClientStatsResponse>> {
    return this.makeRequest<ApiResponse<ClientStatsResponse>>(
      `/public/${id}/stats`,
      {
        method: "GET",
      }
    );
  }

  // ===== AUTHENTICATED CLIENT PROFILE MANAGEMENT =====

  /**
   * Create a new client profile (requires authentication)
   */
  async createClientProfile(
    data: CreateClientProfileRequest
  ): Promise<ClientProfileResponse> {
    return this.makeRequest<ClientProfileResponse>("/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Get current user's client profile (requires authentication)
   */
  async getMyClientProfile(): Promise<ClientProfileResponse> {
    return this.makeRequest<ClientProfileResponse>("/", {
      method: "GET",
    });
  }

  /**
   * Update current user's client profile (requires authentication)
   */
  async updateMyClientProfile(
    data: UpdateClientProfileRequest
  ): Promise<ClientProfileResponse> {
    return this.makeRequest<ClientProfileResponse>("/", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // ===== ADMIN CLIENT PROFILE MANAGEMENT =====

  /**
   * Get all client profiles with pagination (Admin only)
   */
  async getAllClientProfiles(
    params?: ClientProfileQueryParams
  ): Promise<PaginatedResponse<ClientProfile>> {
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

    return this.makeRequest<PaginatedResponse<ClientProfile>>(endpoint, {
      method: "GET",
    });
  }

  /**
   * Get high-risk clients (Admin only)
   */
  async getHighRiskClients(params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<PaginatedResponse<ClientProfile>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/high-risk?${queryString}` : "/high-risk";

    return this.makeRequest<PaginatedResponse<ClientProfile>>(endpoint, {
      method: "GET",
    });
  }

  /**
   * Get client profile by profile ID (Admin only)
   */
  async getClientProfileByProfileId(
    profileId: string
  ): Promise<ClientProfileResponse> {
    return this.makeRequest<ClientProfileResponse>(
      `/by-profile/${profileId}`,
      {
        method: "GET",
      }
    );
  }

  /**
   * Get client profile by ID (Admin only)
   */
  async getClientProfileById(
    id: string
  ): Promise<ClientProfileResponse> {
    return this.makeRequest<ClientProfileResponse>(`/${id}`, {
      method: "GET",
    });
  }

  /**
   * Update client profile by ID (Admin only)
   */
  async updateClientProfile(
    id: string,
    data: UpdateClientProfileRequest
  ): Promise<ClientProfileResponse> {
    return this.makeRequest<ClientProfileResponse>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete client profile (Admin only)
   */
  async deleteClientProfile(id: string): Promise<ClientProfileResponse> {
    return this.makeRequest<ClientProfileResponse>(`/${id}`, {
      method: "DELETE",
    });
  }

  /**
   * Get client stats (Admin only)
   */
  async getClientStats(
    id: string
  ): Promise<ApiResponse<ClientStatsResponse>> {
    return this.makeRequest<ApiResponse<ClientStatsResponse>>(
      `/${id}/stats`,
      {
        method: "GET",
      }
    );
  }

  // ===== TRUST SCORE MANAGEMENT (Admin only) =====

  /**
   * Update trust score (Admin only)
   */
  async updateTrustScore(
    id: string,
    data: UpdateTrustScoreData
  ): Promise<ClientProfileResponse> {
    return this.makeRequest<ClientProfileResponse>(`/${id}/trust-score`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // ===== PREFERRED SERVICES MANAGEMENT (Admin only) =====

  /**
   * Add preferred service to client (Admin only)
   */
  async addPreferredService(
    id: string,
    data: AddPreferredServiceData
  ): Promise<ClientProfileResponse> {
    return this.makeRequest<ClientProfileResponse>(
      `/${id}/preferred-services`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  }

  /**
   * Remove preferred service from client (Admin only)
   */
  async removePreferredService(
    id: string,
    serviceId: string
  ): Promise<ClientProfileResponse> {
    return this.makeRequest<ClientProfileResponse>(
      `/${id}/preferred-services`,
      {
        method: "DELETE",
        body: JSON.stringify({ serviceId }),
      }
    );
  }

  // ===== PREFERRED PROVIDERS MANAGEMENT (Admin only) =====

  /**
   * Add preferred provider to client (Admin only)
   */
  async addPreferredProvider(
    id: string,
    data: AddPreferredProviderData
  ): Promise<ClientProfileResponse> {
    return this.makeRequest<ClientProfileResponse>(
      `/${id}/preferred-providers`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  }

  /**
   * Remove preferred provider from client (Admin only)
   */
  async removePreferredProvider(
    id: string,
    providerId: string
  ): Promise<ClientProfileResponse> {
    return this.makeRequest<ClientProfileResponse>(
      `/${id}/preferred-providers`,
      {
        method: "DELETE",
        body: JSON.stringify({ providerId }),
      }
    );
  }
}

// Create and export singleton instance
export const clientProfileAPI = new ClientProfileAPI();


export const getClientRiskColor = (riskLevel: RiskLevel): string => {
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

export const getLoyaltyTierColor = (
  tier: "bronze" | "silver" | "gold" | "platinum"
): string => {
  switch (tier) {
    case "bronze":
      return "#CD7F32";
    case "silver":
      return "#C0C0C0";
    case "gold":
      return "#FFD700";
    case "platinum":
      return "#E5E4E2";
    default:
      return "gray";
  }
};

export const isHighRiskClient = (client: ClientProfile | null): boolean => {
  return (
    client?.riskLevel === RiskLevel.HIGH ||
    client?.riskLevel === RiskLevel.CRITICAL
  );
};

export const hasActiveWarnings = (client: ClientProfile | null): boolean => {
  return (client?.warningsCount ?? 0) > 0;
};

export const getClientStatusBadge = (
  client: ClientProfile | null
): {
  label: string;
  color: string;
} => {
  if (!client) return { label: "Unknown", color: "gray" };

  if (isHighRiskClient(client)) {
    return { label: "High Risk", color: "red" };
  }

  if (hasActiveWarnings(client)) {
    return { label: "Warning", color: "orange" };
  }

  return { label: "Active", color: "blue" };
};

// Export the ClientProfileAPI class for custom instances
export { ClientProfileAPI };