// types/provider-profile.types.ts
import { Types } from "mongoose";
import {
  BaseEntity,
  SoftDeletable,
  ProviderContactInfo,
  ProviderOperationalStatus,
  RiskLevel,
} from "./base.types";
import { FileReference } from "@/lib/api/categories/categoryImage.api";

export interface ProviderProfile extends BaseEntity, SoftDeletable {
  profileId: Types.ObjectId;

  providerContactInfo: ProviderContactInfo;

  operationalStatus: ProviderOperationalStatus;
  serviceOfferings: Types.ObjectId[];
  workingHours?: Record<
    string,
    {
      start: string;
      end: string;
      isAvailable: boolean;
    }
  >;

  isAvailableForWork: boolean;
  isAlwaysAvailable: boolean;

  businessName?: string;
  businessRegistration?: {
    registrationNumber: string;
    registrationDocument: FileReference;
  };

  insurance?: {
    provider: string;
    policyNumber: string;
    expiryDate: Date;
    document: FileReference;
  };

  safetyMeasures: {
    requiresDeposit: boolean;
    depositAmount?: number;
    hasInsurance: boolean;
    insuranceProvider?: string;
    insuranceExpiryDate?: Date;
    emergencyContactVerified: boolean;
  };

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
export type CreateProviderProfileRequestBody = Omit<ProviderProfile, "_id" | "createdAt" | "updatedAt">

export type UpdateProviderProfileRequestBody = Partial<
    Omit<ProviderProfile, "_id" | "createdAt" | "updatedAt" | "profileId">
  >

export interface ProviderProfileResponse {
  message: string;
  providerProfile?: Partial<ProviderProfile>;
  error?: string;
}

