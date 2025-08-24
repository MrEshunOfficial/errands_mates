import {IUserProfile} from "@/types/profile.types";
import { 
  UserRole, 
  VerificationStatus, 
  ModerationStatus, 
  IUserPreferences,
  UserLocation, 
  NotificationPreferences,
  ContactDetails,
  IdDetails,
  ProfilePicture
} from "@/types/base.types";
import { AuthResponse } from "@/types/user.types";

// Custom error class for profile API errors
export class ProfileAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ProfileAPIError';
  }
}

// Profile-specific request/response types
export interface UpdateProfileData {
  name?: string;
  avatar?: string;
  profile?: {
    role?: UserRole;
    bio?: string;
    location?: UserLocation;
    preferences?: Partial<IUserPreferences>;
    socialMediaHandles?: Array<{ nameOfSocial: string; userName: string }>;
    contactDetails?: ContactDetails;
    idDetails?: IdDetails;
    profilePicture?: ProfilePicture;
    isActiveInMarketplace?: boolean;
  };
}

export interface UpdateProfileRoleData {
  role: UserRole;
}

export interface UpdateLocationData {
  location: UserLocation;
}

export interface UpdatePreferencesData {
  preferences: Partial<IUserPreferences>;
}

export interface UpdateSpecificPreferenceData {
  category: "notifications" | "privacy" | "app";
  key: string;
  value: NotificationPreferences;
}

export interface BulkUpdatePreferencesData {
  category: "notifications" | "privacy" | "app";
  updates: Record<string, NotificationPreferences>;
}

export interface UpdateMarketplaceStatusData {
  isActiveInMarketplace: boolean;
}

export interface AddSocialMediaData {
  nameOfSocial: string;
  userName: string;
}

// Admin-specific types
export interface UpdateVerificationStatusData {
  userId: string;
  status: VerificationStatus;
  reason?: string;
}

export interface UpdateModerationStatusData {
  userId: string;
  status: ModerationStatus;
  reason?: string;
}

export interface ModerateProfileContentData {
  userId: string;
  status: ModerationStatus;
  moderatedBy: string;
  notes?: string;
}

export interface ProfileSearchParams {
  q?: string;
  role?: UserRole;
  region?: string;
  city?: string;
  district?: string;
  verificationStatus?: VerificationStatus;
  moderationStatus?: ModerationStatus;
  isActiveInMarketplace?: boolean;
  minCompleteness?: number;
  maxCompleteness?: number;
  page?: number;
  limit?: number;
}

export interface LocationSearchParams {
  latitude: number;
  longitude: number;
  radius?: number;
  page?: number;
  limit?: number;
}

export interface PaginatedProfileResponse {
  message: string;
  profiles: IUserProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProfileAnalyticsResponse {
  message: string;
  data: {
    overview: {
      totalProfiles: number;
      activeMarketplaceProfiles: number;
      recentlyCreated: number;
    };
    verificationStatus: Record<string, number>;
    moderationStatus: Record<string, number>;
    roleDistribution: Record<string, number>;
    completenessStats: {
      avgCompleteness: number;
      minCompleteness: number;
      maxCompleteness: number;
    };
    topRegions: Array<{ _id: string; count: number }>;
  };
}

export interface ProfileActivitySummaryResponse {
  message: string;
  data: {
    userId: string;
    profileId: string;
    lastModified?: Date;
    lastModeratedAt?: Date;
    verificationStatus: VerificationStatus;
    moderationStatus: ModerationStatus;
    warningsCount: number;
    completeness: number;
    isActiveInMarketplace: boolean;
    accountAge: number;
    preferencesLastUpdated?: Date;
  };
}

type ErrorResponse = { message?: string; error?: string; [key: string]: unknown };

// Profile API class
class ProfileAPI {
  private baseURL: string;

  constructor(baseURL: string = '/api/profile') {
    this.baseURL = baseURL;
  }

  private async makeRequest<T = AuthResponse>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    try {
      const response = await fetch(url, config);

      const contentType = response.headers.get('content-type');
      let data: unknown;

      if (contentType && contentType.includes('application/json')) {
        data = (await response.json()) as T;
      } else {
        data = { message: await response.text() } as T;
      }

      if (!response.ok) {
        const err = data as ErrorResponse;
        throw new ProfileAPIError(
          err.message || err.error || `Request failed with status ${response.status}`,
          response.status,
          data
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof ProfileAPIError) {
        throw error;
      }

      throw new ProfileAPIError(
        'Network error or server is unreachable',
        0,
        error
      );
    }
  }

  // ===== CORE PROFILE MANAGEMENT =====

  /**
   * Get current user's profile
   */
  async getProfile(): Promise<AuthResponse> {
    return this.makeRequest('/', {
      method: 'GET',
    });
  }

  /**
   * Update profile information
   */
  async updateProfile(data: UpdateProfileData): Promise<AuthResponse> {
    return this.makeRequest('/', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update profile role
   */
  async updateProfileRole(data: UpdateProfileRoleData): Promise<AuthResponse> {
    return this.makeRequest('/role', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update profile location
   */
  async updateLocation(data: UpdateLocationData): Promise<AuthResponse> {
    return this.makeRequest('/location', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get profile completeness percentage
   */
  async getProfileCompleteness(): Promise<{ message: string; completeness: number; data: { completeness: number } }> {
    return this.makeRequest('/completeness', {
      method: 'GET',
    });
  }

  /**
   * Get profile with additional context
   */
  async getProfileWithContext(): Promise<AuthResponse> {
    return this.makeRequest('/with-context', {
      method: 'GET',
    });
  }

  /**
   * Delete profile (soft delete)
   */
  async deleteProfile(): Promise<AuthResponse> {
    return this.makeRequest('/', {
      method: 'DELETE',
    });
  }

  /**
   * Restore deleted profile
   */
  async restoreProfile(): Promise<AuthResponse> {
    return this.makeRequest('/restore', {
      method: 'PATCH',
    });
  }

  // ===== PREFERENCES MANAGEMENT =====

  /**
   * Update profile preferences
   */
  async updatePreferences(data: UpdatePreferencesData): Promise<AuthResponse> {
    return this.makeRequest('/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update a specific preference
   */
  async updateSpecificPreference(data: UpdateSpecificPreferenceData): Promise<AuthResponse> {
    return this.makeRequest('/preferences/specific', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Bulk update preferences for a category
   */
  async bulkUpdatePreferences(data: BulkUpdatePreferencesData): Promise<AuthResponse> {
    return this.makeRequest('/preferences/bulk', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ===== MARKETPLACE MANAGEMENT =====

  /**
   * Update marketplace active status
   */
  async updateMarketplaceStatus(data: UpdateMarketplaceStatusData): Promise<AuthResponse> {
    return this.makeRequest('/marketplace-status', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ===== SOCIAL MEDIA MANAGEMENT =====

  /**
   * Add social media handle
   */
  async addSocialMediaHandle(data: AddSocialMediaData): Promise<AuthResponse> {
    return this.makeRequest('/social-media', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Remove social media handle
   */
  async removeSocialMediaHandle(handleId: string): Promise<AuthResponse> {
    return this.makeRequest(`/social-media/${handleId}`, {
      method: 'DELETE',
    });
  }

  // ===== VERIFICATION & MODERATION =====

  /**
   * Initiate profile verification
   */
  async initiateVerification(): Promise<AuthResponse> {
    return this.makeRequest('/initiate-verification', {
      method: 'PATCH',
    });
  }

  // ===== BATCH OPERATIONS =====

  /**
   * Get batch profile data
   */
  async batchProfileOperations(): Promise<AuthResponse> {
    return this.makeRequest('/batch-operations', {
      method: 'GET',
    });
  }

  // ===== PROFILE EXPORT =====

  /**
   * Export profile data
   */
  async exportProfileData(): Promise<{ message: string; data: unknown }> {
    return this.makeRequest('/export', {
      method: 'GET',
    });
  }

  /**
   * Get profile activity summary
   */
  async getActivitySummary(): Promise<ProfileActivitySummaryResponse> {
    return this.makeRequest('/activity-summary', {
      method: 'GET',
    });
  }

  // ===== ADMIN ENDPOINTS =====

  /**
   * Get all profiles (admin only)
   */
  async getAllProfiles(page?: number, limit?: number): Promise<PaginatedProfileResponse> {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    
    const queryString = params.toString();
    const endpoint = queryString ? `/all?${queryString}` : '/all';
    
    return this.makeRequest(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get profiles by status
   */
  async getProfilesByStatus(status: string, page?: number, limit?: number): Promise<PaginatedProfileResponse> {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    
    const queryString = params.toString();
    const endpoint = queryString ? `/by-status/${status}?${queryString}` : `/by-status/${status}`;
    
    return this.makeRequest(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get profiles by verification status
   */
  async getProfilesByVerificationStatus(status: VerificationStatus, page?: number, limit?: number): Promise<PaginatedProfileResponse> {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    
    const queryString = params.toString();
    const endpoint = queryString ? `/by-verification-status/${status}?${queryString}` : `/by-verification-status/${status}`;
    
    return this.makeRequest(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get profiles by moderation status
   */
  async getProfilesByModerationStatus(status: ModerationStatus, page?: number, limit?: number): Promise<PaginatedProfileResponse> {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    
    const queryString = params.toString();
    const endpoint = queryString ? `/by-moderation-status/${status}?${queryString}` : `/by-moderation-status/${status}`;
    
    return this.makeRequest(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get incomplete profiles
   */
  async getIncompleteProfiles(threshold?: number, page?: number, limit?: number): Promise<PaginatedProfileResponse> {
    const params = new URLSearchParams();
    if (threshold) params.append('threshold', threshold.toString());
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    
    const queryString = params.toString();
    const endpoint = queryString ? `/incomplete?${queryString}` : '/incomplete';
    
    return this.makeRequest(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get marketplace active profiles
   */
  async getMarketplaceActiveProfiles(page?: number, limit?: number): Promise<PaginatedProfileResponse> {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    
    const queryString = params.toString();
    const endpoint = queryString ? `/marketplace-active?${queryString}` : '/marketplace-active';
    
    return this.makeRequest(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Update verification status (admin only)
   */
  async updateVerificationStatus(data: UpdateVerificationStatusData): Promise<AuthResponse> {
    return this.makeRequest('/verification-status', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update moderation status (admin only)
   */
  async updateModerationStatus(data: UpdateModerationStatusData): Promise<AuthResponse> {
    return this.makeRequest('/moderation-status', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Moderate profile content (admin only)
   */
  async moderateProfileContent(data: ModerateProfileContentData): Promise<AuthResponse> {
    return this.makeRequest('/moderate-content', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get pending moderation profiles
   */
  async getPendingModerationProfiles(page?: number, limit?: number): Promise<PaginatedProfileResponse> {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    
    const queryString = params.toString();
    const endpoint = queryString ? `/pending-moderation?${queryString}` : '/pending-moderation';
    
    return this.makeRequest(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Recalculate profile completeness
   */
  async recalculateCompleteness(userId?: string): Promise<{ message: string; [key: string]: unknown }> {
    const endpoint = userId ? `/recalculate-completeness/${userId}` : '/recalculate-completeness';
    return this.makeRequest(endpoint, {
      method: 'POST',
    });
  }

  // ===== SEARCH & FILTERING =====

  /**
   * Search profiles with filters
   */
  async searchProfiles(params: ProfileSearchParams): Promise<PaginatedProfileResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/search?${queryString}` : '/search';
    
    return this.makeRequest(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get profiles by location
   */
  async getProfilesByLocation(params: LocationSearchParams): Promise<PaginatedProfileResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    
    return this.makeRequest(`/by-location?${searchParams.toString()}`, {
      method: 'GET',
    });
  }

  // ===== ANALYTICS =====

  /**
   * Get profile analytics (admin only)
   */
  async getProfileAnalytics(): Promise<ProfileAnalyticsResponse> {
    return this.makeRequest('/analytics', {
      method: 'GET',
    });
  }

  // ===== HEALTH CHECK =====

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ message: string; timestamp: string }> {
    return this.makeRequest('/health', {
      method: 'GET',
    });
  }
}

// Create and export singleton instance
export const profileAPI = new ProfileAPI();

// Export utility functions for role checking (from your controller)
export const hasProfileRole = (profile: IUserProfile | null, role: UserRole): boolean => {
  return profile?.role === role;
};

// Export the ProfileAPI class for custom instances
export { ProfileAPI };