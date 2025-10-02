import { FileReference } from "@/lib/api/categories/categoryImage.api";
import { idType, UserRole, IdDetails } from "@/types";
import { z } from "zod";

// =============================================================================
// ID DETAILS VALIDATION SCHEMAS
// =============================================================================

// ID type configurations - typed with idType enum
export const idTypeConfigs: Record<
  idType,
  {
    label: string;
    icon: string;
    description: string;
    placeholder: string;
    example: string;
    helpText: string;
    validation: z.ZodString;
  }
> = {
  [idType.NATIONAL_ID]: {
    label: "Ghana Card",
    icon: "🆔",
    description: "National identification card",
    placeholder: "GHA-123456789-0",
    example: "GHA-123456789-0",
    helpText: "Enter your Ghana Card number (e.g., GHA-123456789-0)",
    validation: z
      .string()
      .min(1, "Ghana Card number is required")
      .regex(/^GHA-\d{9}-\d$/, "Invalid Ghana Card number format"),
  },
  [idType.VOTERS_ID]: {
    label: "Voter's ID",
    icon: "🗳️",
    description: "Electoral Commission voter ID",
    placeholder: "1234567890",
    example: "1234567890",
    helpText: "Enter your 10-digit Voter ID number",
    validation: z
      .string()
      .regex(/^\d{10}$/, "Voter ID must be exactly 10 digits"),
  },
  [idType.PASSPORT]: {
    label: "Ghana Passport",
    icon: "📘",
    description: "Ghana passport",
    placeholder: "A1234567",
    example: "A1234567",
    helpText: "Enter your passport number (e.g., A1234567)",
    validation: z
      .string()
      .min(1, "Passport number is required")
      .regex(/^[A-Z]\d{7}$/, "Invalid passport number format"),
  },
  [idType.DRIVERS_LICENSE]: {
    label: "Driver's License",
    icon: "🚗",
    description: "DVLA driving license",
    placeholder: "DL1234567",
    example: "DL1234567",
    helpText: "Enter your DVLA license number (e.g., DL1234567)",
    validation: z
      .string()
      .min(1, "Driver's license number is required")
      .regex(/^DL\d{7}$/, "Invalid driver's license number format"),
  },
  [idType.NHIS]: {
    label: "NHIS Card",
    icon: "🏥",
    description: "National Health Insurance card",
    placeholder: "1234567890",
    example: "1234567890",
    helpText: "Enter your 10-digit NHIS number",
    validation: z
      .string()
      .regex(/^\d{10}$/, "NHIS number must be exactly 10 digits"),
  },
  [idType.OTHER]: {
    label: "Other ID",
    icon: "📋",
    description: "Other government-issued ID",
    placeholder: "Enter ID number",
    example: "Various formats",
    helpText: "Enter any valid government-issued ID number",
    validation: z.string().min(1, "ID number is required"),
  },
} as const;

// File reference schema - aligned with FileReference interface
export const fileReferenceSchema = z.object({
  url: z.string().url("Invalid file URL"),
  fileName: z
    .string()
    .min(1, "File name is required")
    .max(255, "File name too long"),
  fileSize: z
    .number()
    .positive("File size must be positive")
    .max(10 * 1024 * 1024, "File size must be less than 10MB"), // Required to match FileReference
  mimeType: z
    .enum([
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
      "image/tiff",
    ])
    .optional(),
  uploadedAt: z.date().optional(),
}) satisfies z.ZodType<FileReference>;

// ID details schema - matches IdDetails interface
export const idDetailsSchema = z
  .object({
    idType: z.nativeEnum(idType, {
      message: "Please select a valid ID type",
    }),
    idNumber: z
      .string()
      .trim()
      .min(1, "ID number is required")
      .max(50, "ID number cannot exceed 50 characters"),
    idFile: fileReferenceSchema,
  })
  .superRefine((data, ctx) => {
    // now you have access to both fields
    const { idType: type, idNumber } = data;

    if (type && idTypeConfigs[type]) {
      const result = idTypeConfigs[type].validation.safeParse(idNumber);

      if (!result.success) {
        result.error.issues.forEach((issue) => {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: issue.message,
            path: ["idNumber"], // target the correct field
          });
        });
      }
    }
  }) satisfies z.ZodType<IdDetails>;


// ID details form schema (for form handling before file upload)
export const idDetailsFormSchema = z
  .object({
    idType: z.nativeEnum(idType, {
      message: "Please select a valid ID type",
    }),
    idNumber: z
      .string()
      .trim()
      .min(1, "ID number is required")
      .max(50, "ID number cannot exceed 50 characters"),
    idFile: fileReferenceSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const { idType: type, idNumber } = data;

    if (type && idTypeConfigs[type]) {
      const result = idTypeConfigs[type].validation.safeParse(idNumber);

      if (!result.success) {
        result.error.issues.forEach((issue) => {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: issue.message,
            path: ["idNumber"], // point error at the idNumber field
          });
        });
      }
    }
  });


// ID details form with file upload (for form handling with File objects)
export const idDetailsFormWithFileSchema = z
  .object({
    idType: z.nativeEnum(idType, {
      message: "Please select a valid ID type",
    }),
    idNumber: z
      .string()
      .trim()
      .min(1, "ID number is required")
      .max(50, "ID number cannot exceed 50 characters"),
    file: z
      .instanceof(File)
      .refine(
        (file) => file.size <= 10 * 1024 * 1024,
        "File size must be less than 10MB"
      )
      .refine(
        (file) =>
          [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "application/pdf",
            "image/tiff",
          ].includes(file.type),
        "Only JPEG, PNG, WebP, PDF, and TIFF files are allowed"
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    const { idType, idNumber } = data;

    if (idType && idTypeConfigs[idType]) {
      const result = idTypeConfigs[idType].validation.safeParse(idNumber);

      if (!result.success) {
        result.error.issues.forEach((issue) => {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: issue.message,
            path: ["idNumber"], // mark error against idNumber
          });
        });
      }
    }
  });


// Partial update schema for ID details
export const updateIdDetailsSchema = idDetailsSchema.partial();

// Individual field update schemas
export const updateIdTypeSchema = z.object({
  idType: idDetailsSchema.shape.idType,
});

export const updateIdNumberSchema = z.object({
  idNumber: idDetailsSchema.shape.idNumber,
});

export const updateIdFileSchema = z.object({
  idFile: fileReferenceSchema,
});

// =============================================================================
// ID VERIFICATION FORM STEPS
// =============================================================================

export const idVerificationFormSteps = {
  selectIdType: z.object({
    idType: idDetailsSchema.shape.idType,
  }),
  enterIdNumber: z.object({
    idType: idDetailsSchema.shape.idType,
    idNumber: idDetailsSchema.shape.idNumber,
  }),
  uploadIdFile: idDetailsFormWithFileSchema,
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type IdDetailsType = z.infer<typeof idDetailsSchema>;
export type IdDetailsFormData = z.infer<typeof idDetailsFormSchema>;
export type IdDetailsFormWithFileData = z.infer<
  typeof idDetailsFormWithFileSchema
>;
export type UpdateIdDetailsData = z.infer<typeof updateIdDetailsSchema>;
export type FileReferenceType = z.infer<typeof fileReferenceSchema>;

// Type guards
export const isIdDetails = (data: unknown): data is IdDetails => {
  return idDetailsSchema.safeParse(data).success;
};

export const isFileReference = (data: unknown): data is FileReference => {
  return fileReferenceSchema.safeParse(data).success;
};

// =============================================================================
// FIELD CONFIGURATIONS
// =============================================================================

export const idDetailsFieldConfigs = {
  idType: {
    label: "ID Type",
    options: Object.entries(idTypeConfigs).map(([value, config]) => ({
      value: value as idType,
      label: config.label,
      description: config.description,
      icon: config.icon,
    })),
    required: true,
    helpText: "Select the type of government-issued ID you want to verify",
  },
  idNumber: {
    label: "ID Number",
    placeholder: "Enter your ID number",
    maxLength: 50,
    required: true,
    helpText: "Enter the number exactly as it appears on your ID document",
    getDynamicPlaceholder: (selectedIdType: idType): string =>
      idTypeConfigs[selectedIdType]?.placeholder || "Enter ID number",
    getDynamicHelpText: (selectedIdType: idType): string =>
      idTypeConfigs[selectedIdType]?.helpText || "Enter your ID number",
  },
  idFile: {
    label: "ID Document",
    acceptedTypes: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
      "image/tiff",
    ] as const,
    maxSize: 10 * 1024 * 1024, // 10MB
    maxSizeLabel: "10MB",
    helpText:
      "Upload a clear photo or scan of your ID document. Accepted formats: PDF, JPEG, PNG, WebP, TIFF.",
    required: true,
    recommendations: [
      "Ensure all text is clearly readable",
      "Avoid shadows and glare",
      "Capture the entire document",
      "Use good lighting",
    ] as const,
  },
} as const;

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

export const validateIdDetails = (data: unknown) => {
  return idDetailsSchema.safeParse(data);
};

export const validateIdDetailsForm = (data: unknown) => {
  return idDetailsFormSchema.safeParse(data);
};

// ID document file validation helper
export const validateIdDocumentFile = (
  file: File
): { isValid: boolean; error?: string } => {
  const fileSchema = idDetailsFormWithFileSchema.shape.file;
  const result = fileSchema.safeParse(file);

  if (result.success) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: result.error.issues[0]?.message || "Invalid file",
  };
};

// Dynamic ID number validation based on type
export const validateIdNumber = (
  idNumber: string,
  selectedIdType: idType
): { isValid: boolean; error?: string } => {
  const config = idTypeConfigs[selectedIdType];
  if (!config) {
    return { isValid: false, error: "Invalid ID type" };
  }

  const result = config.validation.safeParse(idNumber);

  if (result.success) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: result.error.issues[0]?.message || "Invalid ID number",
  };
};

// Validate file reference structure
export const validateFileReference = (
  fileRef: unknown
): { isValid: boolean; error?: string } => {
  const result = fileReferenceSchema.safeParse(fileRef);

  if (result.success) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: result.error.issues[0]?.message || "Invalid file reference",
  };
};

// =============================================================================
// ID VERIFICATION STATUS HELPERS
// =============================================================================

export const getIdVerificationStatusText = (
  status: "pending" | "verified" | "rejected"
): { text: string; color: string; icon: string } => {
  const statusConfig = {
    pending: {
      text: "Verification Pending",
      color: "orange",
      icon: "⏳",
    },
    verified: {
      text: "Verified",
      color: "green",
      icon: "✅",
    },
    rejected: {
      text: "Verification Failed",
      color: "red",
      icon: "❌",
    },
  } as const;

  return statusConfig[status];
};

// Check if user needs ID verification based on role
export const requiresIdVerification = (userRole: UserRole): boolean => {
  return userRole === UserRole.PROVIDER;
};

// Get ID verification requirement message
export const getIdVerificationRequirement = (userRole: UserRole): string => {
  if (userRole === UserRole.PROVIDER) {
    return "ID verification is required for service providers to build trust with customers.";
  }
  return "ID verification is optional for customers but enhances trust in the marketplace.";
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Get ID type options for dropdowns/selects
export const getIdTypeOptions = () => {
  return Object.entries(idTypeConfigs).map(([value, config]) => ({
    value: value as idType,
    label: config.label,
    description: config.description,
    icon: config.icon,
  }));
};

// Check if ID details are complete
export const isIdDetailsComplete = (data: Partial<IdDetails>): boolean => {
  return validateIdDetails(data).success;
};

// Get validation errors in a user-friendly format
export const getValidationErrors = (data: unknown): string[] => {
  const result = idDetailsSchema.safeParse(data);
  if (result.success) return [];

  return result.error.issues.map((issue) => issue.message);
};