import { AuthResponse } from "@/types/user.types";

// Custom error class for auth API errors
export class AuthAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'AuthAPIError';
  }
}

// Import the correct types from your type definitions
import {
  SignupRequestBody,
  LoginRequestBody,
  ResetPasswordRequestBody,
  VerifyEmailRequestBody,
  UpdatePasswordRequestBody,
  ResendVerificationRequestBody,
  GoogleAuthRequestBody,
  AppleAuthRequestBody,
  LinkProviderRequestBody,
  UpdateProfileRequestBody,
  UpdateProfilePreferencesRequestBody,
} from "@/types/user.types";

// Type aliases for better readability in the API class
export type SignupData = SignupRequestBody;
export type LoginData = LoginRequestBody;
export type VerifyEmailData = VerifyEmailRequestBody;
export type ResendVerificationData = ResendVerificationRequestBody;
export type ForgotPasswordData = ResetPasswordRequestBody;
export type ResetPasswordData = UpdatePasswordRequestBody;
export type ChangePasswordData = {
  currentPassword: string;
  newPassword: string;
};
export type GoogleAuthData = GoogleAuthRequestBody;
export type AppleAuthData = AppleAuthRequestBody;
export type LinkProviderData = LinkProviderRequestBody;
export type UpdateProfileData = UpdateProfileRequestBody;
export type UpdatePreferencesData = UpdateProfilePreferencesRequestBody;

// Admin-specific types
export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
}

export interface UpdateUserRoleData {
  systemRole: string;
}

export interface UpdateUserStatusData {
  status: string;
  reason?: string;
}

export interface ModerateUserData {
  moderationStatus: string;
  notes?: string;
  warningsCount?: number;
}

type ErrorResponse = { message?: string; error?: string; [key: string]: unknown };

// Auth API class
class AuthAPI {
  private baseURL: string;

  constructor(baseURL: string = '/api/auth') {
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
      throw new AuthAPIError(
        err.message || err.error || `Request failed with status ${response.status}`,
        response.status,
        data
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof AuthAPIError) {
      throw error;
    }

    throw new AuthAPIError(
      'Network error or server is unreachable',
      0,
      error
    );
  }
}


  // Credential-based authentication
  async signup(userData: SignupData): Promise<AuthResponse> {
    return this.makeRequest('/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: LoginData): Promise<AuthResponse> {
    return this.makeRequest('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout(): Promise<AuthResponse> {
    return this.makeRequest('/logout', {
      method: 'POST',
    });
  }

  // Email verification
  async verifyEmail(data: VerifyEmailData): Promise<AuthResponse> {
    return this.makeRequest('/verify-email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resendVerification(data: ResendVerificationData): Promise<AuthResponse> {
    return this.makeRequest('/resend-verification', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Password management
  async forgotPassword(data: ForgotPasswordData): Promise<AuthResponse> {
    return this.makeRequest('/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resetPassword(data: ResetPasswordData): Promise<AuthResponse> {
    return this.makeRequest('/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: ChangePasswordData): Promise<AuthResponse> {
    return this.makeRequest('/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // OAuth authentication - matches your backend routes
  async googleAuth(data: GoogleAuthData): Promise<AuthResponse> {
    return this.makeRequest('/google', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async appleAuth(data: AppleAuthData): Promise<AuthResponse> {
    return this.makeRequest('/apple', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Provider linking - matches your backend implementation
  async linkProvider(data: LinkProviderData): Promise<AuthResponse> {
    return this.makeRequest('/link-provider', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Profile management
  async updateProfile(data: UpdateProfileData): Promise<AuthResponse> {
    return this.makeRequest('/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updatePreferences(data: UpdatePreferencesData): Promise<AuthResponse> {
    return this.makeRequest('/preferences', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // User status and profile endpoints
  async getCurrentUser(): Promise<AuthResponse> {
    return this.makeRequest('/me', {
      method: 'GET',
    });
  }

  async getAuthStatus(): Promise<AuthResponse> {
    return this.makeRequest('/status', {
      method: 'GET',
    });
  }

  async refreshToken(): Promise<AuthResponse> {
    return this.makeRequest('/refresh-token', {
      method: 'POST',
    });
  }

  // Account management
  async deleteAccount(): Promise<AuthResponse> {
    return this.makeRequest('/account', {
      method: 'DELETE',
    });
  }

  async restoreAccount(email: string): Promise<AuthResponse> {
    return this.makeRequest('/restore-account', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Access verification endpoints
  async verifyEmailAccess(): Promise<AuthResponse> {
    return this.makeRequest('/verify-access/verified', {
      method: 'GET',
    });
  }

  async verifyAdminAccess(): Promise<AuthResponse> {
    return this.makeRequest('/verify-access/admin', {
      method: 'GET',
    });
  }

  async verifySuperAdminAccess(): Promise<AuthResponse> {
    return this.makeRequest('/verify-access/super-admin', {
      method: 'GET',
    });
  }

  // Admin endpoints - User management
  async getAllUsers(params?: GetUsersParams): Promise<AuthResponse> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/admin/users?${queryString}` : '/admin/users';
    
    return this.makeRequest(endpoint, {
      method: 'GET',
    });
  }

  async getUserById(userId: string): Promise<AuthResponse> {
    return this.makeRequest(`/admin/users/${userId}`, {
      method: 'GET',
    });
  }

  async updateUserStatus(userId: string, data: UpdateUserStatusData): Promise<AuthResponse> {
    return this.makeRequest(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async moderateUser(userId: string, data: ModerateUserData): Promise<AuthResponse> {
    return this.makeRequest(`/admin/users/${userId}/moderate`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getModerationStats(): Promise<AuthResponse> {
    return this.makeRequest('/admin/stats/moderation', {
      method: 'GET',
    });
  }

  // Super Admin endpoints
  async updateUserRole(userId: string, data: UpdateUserRoleData): Promise<AuthResponse> {
    return this.makeRequest(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(userId: string): Promise<AuthResponse> {
    return this.makeRequest(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async restoreUser(userId: string): Promise<AuthResponse> {
    return this.makeRequest(`/admin/users/${userId}/restore`, {
      method: 'POST',
    });
  }

  // Health check
  async healthCheck(): Promise<{ message: string; timestamp: string }> {
    return this.makeRequest('/health', {
      method: 'GET',
    });
  }
}

// Create and export singleton instance
export const authAPI = new AuthAPI();