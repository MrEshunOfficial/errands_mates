import { z } from "zod";

// ✅ Updated Provider Contact Info Schema
const providerContactInfoSchema = z.object({
  businessContact: z.string().min(1, "Business contact is required"),
  businessEmail: z.string().email().optional(),
});

// ✅ Service Offering Schema (simplified for referencing existing services)
const serviceOfferingSchema = z.object({
  _id: z.string(),
});

// ✅ Working Hours Schema (removed `isAvailable`)
const workingHoursSlotSchema = z.object({
  start: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  end: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
});

const workingHoursSchema = z.record(
  z.enum([
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ]),
  workingHoursSlotSchema
);

// ✅ Enums
const operationalStatusEnum = z.enum([
  "probationary",
  "active",
  "restricted",
  "suspended",
  "inactive",
]);

const riskLevelEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

// ✅ Main Provider Profile Schema (aligned with your JSON)
export const createProviderProfileSchema = z
  .object({
    providerContactInfo: providerContactInfoSchema,
    operationalStatus: operationalStatusEnum.default("probationary"),
    serviceOfferings: z
      .array(serviceOfferingSchema)
      .min(1, "At least one service must be selected"),
    
    // 🔧 FIX: Make workingHours optional
    workingHours: workingHoursSchema.optional(),

    isCurrentlyAvailable: z.boolean().default(true),
    isAlwaysAvailable: z.boolean().default(false),

    businessName: z.string().min(1, "Business name is required"),

    // Deposit-related fields
    requireInitialDeposit: z.boolean().default(false),
    percentageDeposit: z.number().min(0).max(100).optional(),

    // Optional extended fields
    riskLevel: riskLevelEnum.optional().default("LOW"),
    lastRiskAssessmentDate: z.union([z.string(), z.date()]).optional(),
    riskAssessedBy: z.string().optional(),
    penaltiesCount: z.number().nonnegative().optional().default(0),
    lastPenaltyDate: z.union([z.string(), z.date()]).optional(),
    isDeleted: z.boolean().optional().default(false),
    deletedAt: z.union([z.string(), z.date()]).optional(),
    deletedBy: z.string().optional(),
  })
  // 🔧 FIX: Add refinement to validate workingHours conditionally
  .refine(
    (data) => {
      // If NOT always available, workingHours must be provided and not empty
      if (!data.isAlwaysAvailable) {
        return data.workingHours && Object.keys(data.workingHours).length > 0;
      }
      // If always available (24/7), workingHours is not required
      return true;
    },
    {
      message: "Working hours are required when not operating 24/7. Please set hours for at least one day or enable 'Always Available'.",
      path: ["workingHours"],
    }
  )
  // 🔧 FIX: Add refinement to validate deposit percentage
  .refine(
    (data) => {
      // If deposit is required, percentage must be provided and valid
      if (data.requireInitialDeposit) {
        return (
          data.percentageDeposit !== undefined &&
          data.percentageDeposit > 0 &&
          data.percentageDeposit <= 100
        );
      }
      return true;
    },
    {
      message: "Deposit percentage (1-100) is required when initial deposit is enabled",
      path: ["percentageDeposit"],
    }
  );

export const updateProviderProfileSchema = createProviderProfileSchema.partial();

export type CreateProviderProfileInput = z.infer<
  typeof createProviderProfileSchema
>;
export type UpdateProviderProfileInput = z.infer<
  typeof updateProviderProfileSchema
>;