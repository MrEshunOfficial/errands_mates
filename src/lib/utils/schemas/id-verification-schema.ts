import { idType, UserRole } from "@/types";
import { z } from "zod";

// =============================================================================
// ID DETAILS VALIDATION SCHEMAS
// =============================================================================

// ID type configurations
export const idTypeConfigs = {
  [idType.NATIONAL_ID]: {
    label: "Ghana Card",
    icon: "🆔",
    description: "National identification card",
    placeholder: "GHA-123456789-0",
    example: "GHA-123456789-0",
    helpText: "Your Ghana Card number",
    validation: z.string().min(1, "Ghana Card number is required"),
  },
  [idType.VOTERS_ID]: {
    label: "Voter's ID",
    icon: "🗳️",
    description: "Electoral Commission voter ID",
    placeholder: "1234567890",
    example: "1234567890",
    helpText: "10-digit voter ID number",
    validation: z.string().regex(/^\d{10}$/, "Voter ID must be 10 digits"),
  },
  [idType.PASSPORT]: {
    label: "Ghana Passport",
    icon: "📘",
    description: "Ghana passport",
    placeholder: "A1234567",
    example: "A1234567",
    helpText: "Passport number",
    validation: z.string().min(1, "Passport number is required"),
  },
  [idType.DRIVERS_LICENSE]: {
    label: "Driver's License",
    icon: "🚗",
    description: "DVLA driving license",
    placeholder: "DL1234567",
    example: "DL1234567",
    helpText: "DVLA license number",
    validation: z.string().min(1, "Driver's license number is required"),
  },
  [idType.NHIS]: {
    label: "NHIS Card",
    icon: "🏥",
    description: "National Health Insurance card",
    placeholder: "1234567890",
    example: "1234567890",
    helpText: "10-digit NHIS number",
    validation: z.string().regex(/^\d{10}$/, "NHIS number must be 10 digits"),
  },
  [idType.OTHER]: {
    label: "Other ID",
    icon: "📋",
    description: "Other government-issued ID",
    placeholder: "Enter ID number",
    example: "Various formats",
    helpText: "Any valid government ID",
    validation: z.string().min(1, "ID number is required"),
  },
} as const;

// File reference schema for ID documents
export const idFileSchema = z.object({
  url: z.string().url("Invalid file URL"),
  fileName: z
    .string()
    .min(1, "File name is required")
    .max(255, "File name too long"),
  fileSize: z
    .number()
    .positive("File size must be positive")
    .max(10 * 1024 * 1024, "File too large")
    .optional(),
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
});

// ID details form schema
export const idDetailsFormSchema = z.object({
  idType: z.nativeEnum(idType, {
    message: "Please select a valid ID type",
  }),
  idNumber: z
    .string()
    .trim()
    .min(1, "ID number is required")
    .max(50, "ID number cannot exceed 50 characters"),
  idFile: idFileSchema.optional(), // File reference after upload
});

// ID details form with file upload (for form handling)
export const idDetailsFormWithFileSchema = z.object({
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
});

// ID details complete data schema (for API responses)
export const idDetailsCompleteSchema = z.object({
  idType: z.nativeEnum(idType),
  idNumber: z.string(),
  idFile: idFileSchema,
  verificationStatus: z
    .enum(["pending", "verified", "rejected"])
    .default("pending"),
  verifiedAt: z.date().optional(),
  rejectionReason: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Update schema for ID details
export const updateIdDetailsFormSchema = idDetailsFormSchema.partial();

// =============================================================================
// ID VERIFICATION FORM STEPS
// =============================================================================

export const idVerificationFormSteps = {
  selectIdType: z.object({ idType: idDetailsFormSchema.shape.idType }),
  enterIdNumber: z.object({
    idType: idDetailsFormSchema.shape.idType,
    idNumber: idDetailsFormSchema.shape.idNumber,
  }),
  uploadIdFile: idDetailsFormWithFileSchema,
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type IdDetailsFormData = z.infer<typeof idDetailsFormSchema>;
export type IdDetailsFormWithFileData = z.infer<
  typeof idDetailsFormWithFileSchema
>;
export type IdDetailsCompleteData = z.infer<typeof idDetailsCompleteSchema>;
export type UpdateIdDetailsFormData = z.infer<typeof updateIdDetailsFormSchema>;
export type IdFileData = z.infer<typeof idFileSchema>;

// =============================================================================
// FIELD CONFIGURATIONS
// =============================================================================

export const idDetailsFieldConfigs = {
  idType: {
    label: "ID Type",
    options: Object.entries(idTypeConfigs).map(([value, config]) => ({
      value,
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
    getDynamicPlaceholder: (idType: idType) =>
      idTypeConfigs[idType]?.placeholder || "Enter ID number",
    getDynamicHelpText: (idType: idType) =>
      idTypeConfigs[idType]?.helpText || "Enter your ID number",
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
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
    maxSizeLabel: "10MB",
    helpText:
      "Upload a clear photo or scan of your ID document. PDF, JPEG, PNG, WebP, and TIFF formats accepted.",
    required: true,
    recommendations: [
      "Ensure all text is clearly readable",
      "Avoid shadows and glare",
      "Capture the entire document",
      "Use good lighting",
    ],
  },
} as const;

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

export const validateIdDetailsForm = (data: Partial<IdDetailsFormData>) => {
  return idDetailsFormSchema.safeParse(data);
};

// ID document file validation helper
export const validateIdDocumentFile = (
  file: File
): { isValid: boolean; error?: string } => {
  const result = idDetailsFormWithFileSchema.shape.file.safeParse(file);

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
  idType: idType
): { isValid: boolean; error?: string } => {
  const config = idTypeConfigs[idType];
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
  };

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
  return "ID verification is optional for customers but helps build trust in the marketplace.";
};