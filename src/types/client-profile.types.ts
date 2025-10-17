import { RiskLevel } from "@/types";

// Base User Interface
export interface UserIdObject {
  _id: string;
  name: string;
  email: string;
  isVerified: boolean;
  createdAt: string;
}

// Social Media Handle Interface
export interface SocialMediaHandle {
  nameOfSocial: string;
  userName: string;
  _id: string;
}

// Profile Picture Interface
export interface ProfilePicture {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

// Location Interface
export interface Location {
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
}

// Contact Details Interface
export interface ContactDetails {
  primaryContact?: string;
  secondaryContact?: string;
}

// Profile ID Object Interface
export interface ProfileIdObject {
  _id: string;
  id: string;
  userId: string | UserIdObject;
  role: string;
  socialMediaHandles?: SocialMediaHandle[];
  profilePicture?: ProfilePicture;
  bio?: string;
  location?: Location;
  contactDetails?: ContactDetails;
  createdAt: string;
}

// Service Interface
export interface PreferredService {
  _id: string;
  id: string;
  slug: string;
  title: string;
  description: string;
  categoryId: string;
}

// Provider Interface
export interface PreferredProvider {
  _id: string;
  id: string;
  businessName: string;
}

// Notification Preferences Interface
export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  bookingUpdates: boolean;
  promotions: boolean;
  newsletter: boolean;
}

// Privacy Settings Interface
export interface PrivacySettings {
  profileVisibility: "public" | "private" | "connections";
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
  allowMessagesFromNonConnections: boolean;
}

// Main Client Profile Interface
export interface ClientProfile {
  _id: string;
  id: string;
  profileId: string | ProfileIdObject;
  preferredServices: (string | PreferredService)[];
  preferredProviders: (string | PreferredProvider)[];
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
  notificationPreferences: NotificationPreferences;
  privacySettings: PrivacySettings;
  notes: unknown[];
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Helper type to get the populated profile
export interface PopulatedClientProfile
  extends Omit<
    ClientProfile,
    "profileId" | "preferredServices" | "preferredProviders"
  > {
  profileId: ProfileIdObject;
  preferredServices: PreferredService[];
  preferredProviders: PreferredProvider[];
}

// Request Interfaces
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

// Response Interface
export interface ClientProfileResponse {
  success?: boolean;
  message: string;
  clientProfile?: ClientProfile;
  error?: string;
}

// Pagination Interfaces
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

// Verification Status Interface
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

// Reliability Metrics Interface
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

// Generic API Response
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Type Guards
export function isProfileIdObject(
  profileId: unknown
): profileId is ProfileIdObject {
  return (
    typeof profileId === "object" &&
    profileId !== null &&
    "_id" in profileId &&
    "userId" in profileId &&
    "role" in profileId
  );
}

export function isUserIdObject(userId: unknown): userId is UserIdObject {
  return (
    typeof userId === "object" &&
    userId !== null &&
    "_id" in userId &&
    "name" in userId &&
    "email" in userId
  );
}

export function isPreferredService(
  service: unknown
): service is PreferredService {
  return (
    typeof service === "object" &&
    service !== null &&
    "_id" in service &&
    "title" in service
  );
}

export function isPreferredProvider(
  provider: unknown
): provider is PreferredProvider {
  return (
    typeof provider === "object" &&
    provider !== null &&
    "_id" in provider &&
    "businessName" in provider
  );
}

// Helper function to extract user name
export function getUserName(
  profile: ClientProfile | Partial<ClientProfile>
): string {
  if (!profile?.profileId) return "User";

  if (isProfileIdObject(profile.profileId)) {
    const userId = profile.profileId.userId;
    if (isUserIdObject(userId)) {
      return userId.name;
    }
  }

  return "User";
}

// Helper function to extract user email
export function getUserEmail(
  profile: ClientProfile | Partial<ClientProfile>
): string | undefined {
  if (!profile?.profileId) return undefined;

  if (isProfileIdObject(profile.profileId)) {
    const userId = profile.profileId.userId;
    if (isUserIdObject(userId)) {
      return userId.email;
    }
  }

  return undefined;
}

// Helper function to get profile picture URL
export function getProfilePictureUrl(
  profile: ClientProfile | Partial<ClientProfile>
): string | undefined {
  if (!profile?.profileId) return undefined;

  if (isProfileIdObject(profile.profileId)) {
    return profile.profileId.profilePicture?.url;
  }

  return undefined;
}
