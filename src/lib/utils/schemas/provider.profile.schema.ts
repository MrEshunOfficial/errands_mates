import { z } from "zod";

// File Reference Schema
const fileReferenceSchema = z.object({
  url: z.string().url(),
  fileName: z.string(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  uploadedAt: z.union([z.string(), z.date()]).optional(),
});

// Provider Contact Info Schema
const providerContactInfoSchema = z.object({
  primaryContact: z.string().min(1, "Primary contact is required"),
  secondaryContact: z.string().optional(),
  businessEmail: z.string().email().optional(),
  emergencyContact: z.string().optional(),
});

// Service Offering Schema (simplified for referencing existing services)
const serviceOfferingSchema = z.object({
  _id: z.string(),
});

// Working Hours Schema
const workingHoursSlotSchema = z.object({
  start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  isAvailable: z.boolean(),
});

const workingHoursSchema = z.record(
  z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]),
  workingHoursSlotSchema
).optional();

// Business Registration Schema
const businessRegistrationSchema = z.object({
  registrationNumber: z.string().min(1, "Registration number is required"),
  registrationDocument: fileReferenceSchema,
}).optional();

// Insurance Schema
const insuranceSchema = z.object({
  provider: z.string().min(1, "Insurance provider is required"),
  policyNumber: z.string().min(1, "Policy number is required"),
  expiryDate: z.union([z.string(), z.date()]),
  document: fileReferenceSchema,
}).optional();

// Safety Measures Schema
const safetyMeasuresSchema = z.object({
  requiresDeposit: z.boolean(),
  depositAmount: z.number().nonnegative().optional(),
  hasInsurance: z.boolean(),
  insuranceProvider: z.string().optional(),
  insuranceExpiryDate: z.union([z.string(), z.date()]).optional(),
  emergencyContactVerified: z.boolean(),
});

// Performance Metrics Schema (optional for creation)
const performanceMetricsSchema = z.object({
  completionRate: z.number().min(0).max(100).default(0),
  averageRating: z.number().min(0).max(5).default(0),
  totalJobs: z.number().nonnegative().default(0),
  responseTimeMinutes: z.number().nonnegative().default(0),
  averageResponseTime: z.number().nonnegative().default(0),
  cancellationRate: z.number().min(0).max(100).default(0),
  disputeRate: z.number().min(0).max(100).default(0),
  clientRetentionRate: z.number().min(0).max(100).default(0),
}).optional();

// Enums
const operationalStatusEnum = z.enum([
  "probationary",
  "active",
  "restricted",
  "suspended",
  "inactive",
]);

const riskLevelEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

// Main Provider Profile Creation Schema
export const createProviderProfileSchema = z.object({
  providerContactInfo: providerContactInfoSchema,
  operationalStatus: operationalStatusEnum.optional().default("probationary"),
  serviceOfferings: z.array(serviceOfferingSchema).optional(),
  workingHours: workingHoursSchema,
  isAvailableForWork: z.boolean().default(true),
  isAlwaysAvailable: z.boolean().default(false),
  businessName: z.string().optional(),
  businessRegistration: businessRegistrationSchema,
  insurance: insuranceSchema,
  safetyMeasures: safetyMeasuresSchema,
  performanceMetrics: performanceMetricsSchema,
  riskLevel: riskLevelEnum.optional().default("LOW"),
  lastRiskAssessmentDate: z.union([z.string(), z.date()]).optional(),
  riskAssessedBy: z.string().optional(),
  penaltiesCount: z.number().nonnegative().optional().default(0),
  lastPenaltyDate: z.union([z.string(), z.date()]).optional(),
  isDeleted: z.boolean().optional().default(false),
  deletedAt: z.union([z.string(), z.date()]).optional(),
  deletedBy: z.string().optional(),
}).refine(
  (data) => {
    // If deposit is required, depositAmount must be provided
    if (data.safetyMeasures.requiresDeposit && !data.safetyMeasures.depositAmount) {
      return false;
    }
    return true;
  },
  {
    message: "Deposit amount is required when requiresDeposit is true",
    path: ["safetyMeasures", "depositAmount"],
  }
).refine(
  (data) => {
    // If hasInsurance is true, insuranceProvider should be provided
    if (data.safetyMeasures.hasInsurance && !data.safetyMeasures.insuranceProvider) {
      return false;
    }
    return true;
  },
  {
    message: "Insurance provider is required when hasInsurance is true",
    path: ["safetyMeasures", "insuranceProvider"],
  }
);

// Update Provider Profile Schema (all fields optional)
export const updateProviderProfileSchema = createProviderProfileSchema.partial();

// Type exports
export type CreateProviderProfileInput = z.infer<typeof createProviderProfileSchema>;
export type UpdateProviderProfileInput = z.infer<typeof updateProviderProfileSchema>;