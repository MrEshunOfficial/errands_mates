// types/provider-profile.types.ts
import { Types } from "mongoose";
import { BaseEntity, SoftDeletable, ProviderOperationalStatus, RiskLevel } from "./base.types";
import { FileReference } from "@/lib/api/categories/categoryImage.api";

// Service type - matches the populated service data from API
export interface Service {
  _id: string;
  title: string;
  description: string;
  images: string[];
  status: string;
  slug: string;
  id: string;
  user?: string;
  priceBasedOnServiceType?: boolean;
  category?: string;
  subcategory?: string;
  tags?: string[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// User location type
interface UserLocation {
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

// Contact details type
interface ContactDetails {
  primaryContact?: string;
  businessEmail?: string;
  alternateContact?: string;
  businessContact?: string;
}

// Profile ID populated type - matches the populated profileId from API
export interface ProfileId {
  _id: string;
  userId?: string;
  role?: string;
  bio?: string;
  location?: UserLocation;
  contactDetails?: ContactDetails;
  profilePicture?: FileReference
}



// Provider profile type - matches the API response structure
export interface ProviderProfile extends BaseEntity, SoftDeletable {
  profileId: ProfileId;
  providerContactInfo: {
    businessContact?: string;
    businessEmail?: string;
  };
  operationalStatus: ProviderOperationalStatus;
  serviceOfferings: Service[];
  workingHours?: Record<
    string,
    {
      start: string;
      end: string;
    }
  >;
  isCurrentlyAvailable: boolean;
  isAlwaysAvailable: boolean;
  businessName?: string;
  businessRegistration?: string;
  requireInitialDeposit: boolean;
  percentageDeposit?: number;
  performanceMetrics: {
    completionRate: number;
    averageRating: number;
    totalJobs: number;
    responseTimeMinutes: number;
    averageResponseTime: number;
    cancellationRate: number;
    disputeRate: number;
    clientRetentionRate: number;
  };
  riskLevel: RiskLevel;
  lastRiskAssessmentDate?: Date;
  riskAssessedBy?: Types.ObjectId;
  penaltiesCount: number;
  lastPenaltyDate?: Date;
}

// Database schema type (what's actually stored in MongoDB with ObjectIds)
export interface ProviderProfileSchema extends BaseEntity, SoftDeletable {
  profileId: Types.ObjectId;
  providerContactInfo: {
    businessContact?: string;
    businessEmail?: string;
  };
  operationalStatus: ProviderOperationalStatus;
  serviceOfferings: Types.ObjectId[];  // ObjectIds in database
  workingHours?: Record<
    string,
    {
      start: string;
      end: string;
    }
  >;
  isCurrentlyAvailable: boolean;
  isAlwaysAvailable: boolean;
  businessName?: string;
  businessRegistration?: string;
  requireInitialDeposit: boolean;
  percentageDeposit?: number;
  performanceMetrics: {
    completionRate: number;
    averageRating: number;
    totalJobs: number;
    responseTimeMinutes: number;
    averageResponseTime: number;
    cancellationRate: number;
    disputeRate: number;
    clientRetentionRate: number;
  };
  riskLevel: RiskLevel;
  lastRiskAssessmentDate?: Date;
  riskAssessedBy?: Types.ObjectId;
  penaltiesCount: number;
  lastPenaltyDate?: Date;
}

// Request/Response types for provider profile operations
export type CreateProviderProfileRequestBody = Omit<ProviderProfileSchema, "_id" | "createdAt" | "updatedAt">

export type UpdateProviderProfileRequestBody = Partial<
    Omit<ProviderProfileSchema, "_id" | "createdAt" | "updatedAt" | "profileId">
  >

export interface ProviderProfileResponse {
  message: string;
  providerProfile?: ProviderProfile;
  error?: string;
}

