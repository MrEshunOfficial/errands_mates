import { z } from "zod";

// --- FileReference ---
const fileReferenceSchema = z.object({
  url: z.string().url("Invalid URL format"),
  fileName: z.string().min(1, "File name cannot be empty").trim(),
  fileSize: z.number().nonnegative("File size cannot be negative").int("File size must be an integer"),
  mimeType: z.string().regex(/^[a-z]+\/[a-z0-9\-\+\.]+$/i, "Invalid MIME type format").optional(),
  uploadedAt: z.preprocess(
    (val) => (val ? new Date(val as string | Date) : undefined),
    z.date().optional()
  ),
});

// --- ProviderContactInfo ---
const providerContactInfoSchema = z.object({
  primaryContact: z
    .string()
    .trim()
    .regex(
      /^\+233[0-9]{9}$|^0[0-9]{9}$/,
      "Please provide a valid Ghana phone number (e.g., +233XXXXXXXXX or 0XXXXXXXXX)"
    ),
  secondaryContact: z
    .string()
    .trim()
    .regex(
      /^\+233[0-9]{9}$|^0[0-9]{9}$/,
      "Please provide a valid Ghana phone number (e.g., +233XXXXXXXXX or 0XXXXXXXXX)"
    )
    .optional(),
  businessEmail: z
    .string()
    .email("Please provide a valid email address")
    .toLowerCase()
    .trim()
    .optional(),
  emergencyContact: z
    .string()
    .trim()
    .regex(
      /^\+233[0-9]{9}$|^0[0-9]{9}$/,
      "Please provide a valid Ghana phone number (e.g., +233XXXXXXXXX or 0XXXXXXXXX)"
    ),
});

// --- Service Offering ---
const serviceOfferingSchema = z.object({
  _id: z.string().min(1, "Service ID is required"),
});

// --- Business Registration ---
const businessRegistrationSchema = z.object({
  registrationNumber: z
    .string()
    .min(1, "Registration number is required")
    .trim()
    .toUpperCase(),
  registrationDocument: fileReferenceSchema,
});

// --- Insurance ---
const insuranceSchema = z.object({
  provider: z.string().min(1, "Insurance provider is required").trim(),
  policyNumber: z.string().min(1, "Policy number is required").trim().toUpperCase(),
  expiryDate: z.preprocess(
    (val) => (val ? new Date(val as string | Date) : val),
    z.date().refine((d) => d > new Date(), {
      message: "Insurance expiry date must be in the future",
    }).refine((d) => d.getTime() - new Date().getTime() > 24 * 60 * 60 * 1000, {
      message: "Insurance must be valid for at least 24 hours",
    })
  ),
  document: fileReferenceSchema,
});

// --- Safety Measures ---
const safetyMeasuresSchema = z
  .object({
    requiresDeposit: z.boolean(),
    depositAmount: z
      .number()
      .positive("Deposit amount must be positive")
      .optional(),
    hasInsurance: z.boolean(),
    insuranceProvider: z.string().trim().optional(),
    insuranceExpiryDate: z
      .union([z.string(), z.date()])
      .transform((val) => {
        if (!val) return undefined;
        return val instanceof Date ? val : new Date(val);
      })
      .optional(),
    emergencyContactVerified: z.boolean(),
  })
  .superRefine((val, ctx) => {
    if (val.requiresDeposit && (!val.depositAmount || val.depositAmount <= 0)) {
      ctx.addIssue({
        path: ["depositAmount"],
        code: z.ZodIssueCode.custom,
        message:
          "Deposit amount is required and must be positive when deposit is required",
      });
    }

    if (val.hasInsurance) {
      if (!val.insuranceProvider || val.insuranceProvider.trim().length === 0) {
        ctx.addIssue({
          path: ["insuranceProvider"],
          code: z.ZodIssueCode.custom,
          message: "Insurance provider is required when insurance is enabled",
        });
      }

      if (!val.insuranceExpiryDate) {
        ctx.addIssue({
          path: ["insuranceExpiryDate"],
          code: z.ZodIssueCode.custom,
          message: "Insurance expiry date is required when insurance is enabled",
        });
      } else if (val.insuranceExpiryDate <= new Date()) {
        ctx.addIssue({
          path: ["insuranceExpiryDate"],
          code: z.ZodIssueCode.custom,
          message: "Insurance expiry date must be in the future",
        });
      }
    }
  });

// --- Working Hours ---
const workingHourSchema = z.object({
  start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Start time must be in HH:MM format (00:00-23:59)"),
  end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "End time must be in HH:MM format (00:00-23:59)"),
  isAvailable: z.boolean(),
})
.refine(
  (data) => {
    // If not available, skip time validation
    if (!data.isAvailable) return true;
    
    const [startHour, startMin] = data.start.split(":").map(Number);
    const [endHour, endMin] = data.end.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return endMinutes > startMinutes;
  },
  {
    message: "End time must be after start time when available",
    path: ["end"],
  }
);

const workingHoursSchema = z
  .record(
    z.string().refine(
      (day) => ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].includes(day.toLowerCase()),
      "Invalid day of week"
    ),
    workingHourSchema
  )
  .optional()
  .refine((hours) => !hours || Object.keys(hours).length > 0, {
    message: "At least one working day must be specified if working hours are provided",
  });

// --- Main Form Schema ---
export const providerProfileFormSchema = z
  .object({
    providerContactInfo: providerContactInfoSchema,

    serviceOfferings: z
      .array(serviceOfferingSchema)
      .min(1, "At least one service offering is required")
      .optional(),

    workingHours: workingHoursSchema,

    isAvailableForWork: z.boolean(),
    isAlwaysAvailable: z.boolean(),

    businessName: z
      .string()
      .max(100, "Business name must not exceed 100 characters")
      .trim()
      .optional()
      .refine((val) => !val || val.length >= 2, {
        message: "Business name must be at least 2 characters if provided",
      }),

    businessRegistration: businessRegistrationSchema.optional(),
    insurance: insuranceSchema.optional(),

    safetyMeasures: safetyMeasuresSchema,
  })
  .superRefine((val, ctx) => {
    // If always available, working hours should cover all 7 days with isAvailable: true
    if (val.isAlwaysAvailable && val.workingHours) {
      const availableDays = Object.values(val.workingHours).filter(h => h.isAvailable).length;
      if (availableDays < 7) {
        ctx.addIssue({
          path: ["isAlwaysAvailable"],
          code: z.ZodIssueCode.custom,
          message: "Cannot be always available with limited working hours",
        });
      }
    }

    // If not available for work, shouldn't have any available working hours
    if (!val.isAvailableForWork && val.workingHours) {
      const hasAvailableHours = Object.values(val.workingHours).some(h => h.isAvailable);
      if (hasAvailableHours) {
        ctx.addIssue({
          path: ["isAvailableForWork"],
          code: z.ZodIssueCode.custom,
          message: "Cannot have available working hours when unavailable for work",
        });
      }
    }

    // If business registration is provided, business name should also be provided
    if (val.businessRegistration && !val.businessName) {
      ctx.addIssue({
        path: ["businessName"],
        code: z.ZodIssueCode.custom,
        message: "Business name is required when business registration is provided",
      });
    }
  });