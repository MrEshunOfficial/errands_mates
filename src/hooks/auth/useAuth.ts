// hooks/useAuth.ts - Updated version with restore account fix

import { useState, useEffect, useCallback } from 'react';
import type {
  AuthResponse,
  IUser,
  SignupRequestBody as SignupData,
  LoginRequestBody as LoginData,
  VerifyEmailRequestBody as VerifyEmailData,
  ResendVerificationRequestBody as ResendVerificationData,
  ResetPasswordRequestBody as ForgotPasswordData,
  UpdatePasswordRequestBody as ResetPasswordData,
  UpdateProfileRequestBody as UpdateProfileData,
  AppleAuthRequestBody,
} from '@/types/user.types';
import { AuthAPIError, authAPI } from '@/lib/api/auth/auth.api';

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

interface RestoreAccountData {
  email: string;
}

interface AuthState {
  user: Partial<IUser> | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginData) => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  verifyEmail: (data: VerifyEmailData) => Promise<void>;
  resendVerification: (data: ResendVerificationData) => Promise<void>;
  forgotPassword: (data: ForgotPasswordData) => Promise<void>;
  resetPassword: (data: ResetPasswordData) => Promise<void>;
  changePassword: (data: ChangePasswordData) => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  deleteAccount: () => Promise<void>;
  restoreAccount: (data: RestoreAccountData) => Promise<void>;
  googleAuth: (data: { idToken: string }) => Promise<void>;
  appleAuth: (data: AppleAuthRequestBody) => Promise<void>;
}

export const useAuth = (): AuthState & AuthActions => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleAuthAction = useCallback(async (
    action: () => Promise<AuthResponse>,
    onSuccess?: (response: AuthResponse) => void
  ) => {
    try {
      updateState({ isLoading: true, error: null });
      const response = await action();
      
      if (response.user) {
        updateState({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        updateState({ isLoading: false });
      }
      
      onSuccess?.(response);
    } catch (error) {
      const errorMessage = error instanceof AuthAPIError 
        ? error.message 
        : 'An unexpected error occurred';
      
      updateState({
        error: errorMessage,
        isLoading: false,
        ...(error instanceof AuthAPIError && error.statusCode === 401 ? {
          user: null,
          isAuthenticated: false,
        } : {}),
      });
      throw error;
    }
  }, [updateState]);

  // Auth actions with better error handling
  const login = useCallback(async (credentials: LoginData) => {
    await handleAuthAction(() => authAPI.login(credentials));
  }, [handleAuthAction]);

  const signup = useCallback(async (userData: SignupData) => {
    await handleAuthAction(() => authAPI.signup(userData));
  }, [handleAuthAction]);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Continue with logout even if server call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local state
      updateState({
        user: null,
        isAuthenticated: false,
        error: null,
      });
    }
  }, [updateState]);

  const refreshUser = useCallback(async () => {
    await handleAuthAction(() => authAPI.getCurrentUser());
  }, [handleAuthAction]);

  const verifyEmail = useCallback(async (data: VerifyEmailData) => {
    await handleAuthAction(() => authAPI.verifyEmail(data));
  }, [handleAuthAction]);

  const resendVerification = useCallback(async (data: ResendVerificationData) => {
    await handleAuthAction(() => authAPI.resendVerification(data));
  }, [handleAuthAction]);

  const forgotPassword = useCallback(async (data: ForgotPasswordData) => {
    await handleAuthAction(() => authAPI.forgotPassword(data));
  }, [handleAuthAction]);

  const resetPassword = useCallback(async (data: ResetPasswordData) => {
    await handleAuthAction(() => authAPI.resetPassword(data));
  }, [handleAuthAction]);

  const changePassword = useCallback(async (data: ChangePasswordData) => {
    await handleAuthAction(() => authAPI.changePassword(data));
  }, [handleAuthAction]);

  const updateProfile = useCallback(async (data: UpdateProfileData) => {
    await handleAuthAction(() => authAPI.updateProfile(data));
  }, [handleAuthAction]);

  const deleteAccount = useCallback(async () => {
    await handleAuthAction(
      () => authAPI.deleteAccount(),
      () => {
        updateState({
          user: null,
          isAuthenticated: false,
        });
      }
    );
  }, [handleAuthAction, updateState]);

  // Fixed restore account method - this doesn't authenticate the user, just initiates restore
  const restoreAccount = useCallback(async (data: RestoreAccountData) => {
    await handleAuthAction(
      () => authAPI.restoreAccount(data.email),
      () => {
        // Don't clear user state - restore account is just a request
        // The user needs to log in again after restore
      }
    );
  }, [handleAuthAction]);

  const googleAuth = useCallback(async (data: { idToken: string }) => {
    await handleAuthAction(() => authAPI.googleAuth(data));
  }, [handleAuthAction]);

  const appleAuth = useCallback(async (data: AppleAuthRequestBody) => {
    await handleAuthAction(() => authAPI.appleAuth(data));
  }, [handleAuthAction]);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // Enhanced initialization with better error handling
  // This automatically runs when the hook is first used
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const response = await authAPI.getCurrentUser();
        
        if (!mounted) return;

        if (response.user) {
          updateState({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          updateState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } catch (error) {
        if (!mounted) return;

        // Log the error for debugging
        console.warn('Auth initialization failed:', error);
        
        updateState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          // Only set error if it's not a simple "not authenticated" case
          error: error instanceof AuthAPIError && error.statusCode !== 401 
            ? error.message 
            : null,
        });
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [updateState]);

  return {
    ...state,
    login,
    signup,
    logout,
    refreshUser,
    clearError,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    changePassword,
    updateProfile,
    deleteAccount,
    restoreAccount,
    googleAuth,
    appleAuth,
  };
};