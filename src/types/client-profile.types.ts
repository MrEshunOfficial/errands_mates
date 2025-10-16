import { IUserProfile, RiskLevel } from "@/types";

export interface ClientProfile {
  _id: string;
  id: string;
  profileId: string | IUserProfile | ProfileIdObject;
  preferredServices: string[];
  preferredProviders: string[];
  trustScore: number;
  riskLevel: RiskLevel;
  riskFactors: string[];
  flags: string[];
  loyaltyTier: "bronze" | "silver" | "gold" | "platinum";
  warningsCount: number;
  suspensionHistory: unknown[];
  totalReviews: number;
  averageRating?: number;
  memberSince: string;
  lastActiveDate: string;
  preferredContactMethod?: string;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
    bookingUpdates: boolean;
    promotions: boolean;
    newsletter: boolean;
  };
  privacySettings: {
    profileVisibility: "public" | "private" | "connections";
    showEmail: boolean;
    showPhone: boolean;
    showLocation: boolean;
    allowMessagesFromNonConnections: boolean;
  };
  notes: unknown[];
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserIdObject {
  _id: string;
  name: string;
  email: string;
  isVerified: boolean;
  createdAt: string;
}

export interface ProfileIdObject {
  _id: string;
  id: string;
  userId: string | UserIdObject;
  role: string;
  socialMediaHandles?: Array<{
    nameOfSocial: string;
    userName: string;
    _id: string;
  }>;
  profilePicture?: {
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: string;
  };
  bio?: string;
  location?: {
    gpsCoordinates?: {
      latitude: number;
      longitude: number;
    };
    ghanaPostGPS?: string;
    nearbyLandmark?: string;
    region?: string;
    city?: string;
    district?: string;
    locality?: string;
    other?: string;
  };
  contactDetails?: {
    primaryContact?: string;
    secondaryContact?: string;
  };
  createdAt: string;
}

export interface CreateClientProfileRequest {
  preferredServices?: string[];
  preferredProviders?: string[];
  preferredContactMethod?: string;
}

export interface UpdateClientProfileRequest {
  preferredServices?: string[];
  preferredProviders?: string[];
  preferredContactMethod?: string;
}

export interface ClientProfileResponse {
  success?: boolean;
  message: string;
  clientProfile?: ClientProfile;
  error?: string;
}

export interface PaginationParams {
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

export interface PaginatedResponse<T> {
  message: string;
  data: {
    profiles: T[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
}

export interface VerificationStatus {
  isVerified: boolean;
  verificationLevel: "none" | "partial" | "full";
  verifiedAspects: {
    phone: boolean;
    email: boolean;
    address: boolean;
  };
  loyaltyTier?: "bronze" | "silver" | "gold" | "platinum";
  memberSince?: string;
  averageRating?: number;
  totalReviews: number;
}

export interface ReliabilityMetrics {
  reliabilityScore: number;
  engagement: {
    memberSince?: string;
    lastActiveDate?: string;
    responseTime?: number;
    loyaltyTier?: "bronze" | "silver" | "gold" | "platinum";
  };
  reputation: {
    averageRating?: number;
    totalReviews: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

