import { UserRole, idType } from "@/types";
import { z } from "zod";

// Ghana phone number regex pattern from your backend
const ghanaPhoneRegex = /^\+233[0-9]{9}$|^0[0-9]{9}$/;

// Ghana Post GPS regex pattern from your backend
const ghanaPostGPSRegex = /^[A-Z]{2}-\d{3}-\d{4}$/;

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GPS coordinates validation schema (optional for users)
const gpsCoordinatesSchema = z.object({
  latitude: z
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90")
    .optional(),
  longitude: z
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180")
    .optional(),
});

// =============================================================================
// PROFILE PICTURE VALIDATION SCHEMA
// =============================================================================

// Profile picture schema for form validation
export const profilePictureFormSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      "File size must be less than 5MB"
    )
    .refine(
      (file) =>
        ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
          file.type
        ),
      "Only JPEG, PNG, and WebP files are allowed"
    )
    .refine((file) => {
      // Check if file name is reasonable length
      return file.name.length <= 255;
    }, "File name is too long")
    .optional(),
});

// Profile picture data schema (for API responses)
export const profilePictureSchema = z.object({
  url: z.string().url("Invalid profile picture URL"),
  fileName: z
    .string()
    .min(1, "File name is required")
    .max(255, "File name too long"),
  fileSize: z
    .number()
    .positive("File size must be positive")
    .max(5 * 1024 * 1024, "File too large")
    .optional(),
  mimeType: z
    .enum(["image/jpeg", "image/png", "image/webp", "image/jpg"])
    .optional(),
  uploadedAt: z.date().optional(),
});

// =============================================================================
// USER-FACING PROFILE FORM SCHEMAS (ID details removed)
// =============================================================================

// Basic personal information (Step 1) - Now includes profile picture
export const basicInfoFormSchema = z.object({
  bio: z
    .string()
    .trim()
    .max(500, "Bio cannot exceed 500 characters")
    .optional(),
  profilePicture: profilePictureSchema.optional(),
});

// Profile picture update form (standalone)
export const profilePictureUpdateFormSchema = z.object({
  profilePicture: profilePictureFormSchema.shape.file,
});

// Role selection (Step 2)
export const roleSelectionFormSchema = z.object({
  role: z.nativeEnum(UserRole, {
    message: "Please select whether you're a customer or service provider",
  }),
  isActiveInMarketplace: z.boolean().default(false),
});

// In profile.schemas.ts - Fix the extended schema

// Update the type export to match exactly
export type ExtendedUpdateUserProfileFormData = z.infer<
  typeof extendedUpdateUserProfileFormSchema
>;

// Location information (Step 3)
export const locationFormSchema = z.object({
  ghanaPostGPS: z
    .string()
    .trim()
    .regex(ghanaPostGPSRegex, "Ghana Post GPS must be in format XX-000-0000")
    .min(1, "Ghana Post GPS is required"),
  nearbyLandmark: z
    .string()
    .trim()
    .max(100, "Nearby landmark cannot exceed 100 characters")
    .optional(),
  region: z
    .string()
    .trim()
    .max(50, "Region cannot exceed 50 characters")
    .optional(),
  city: z
    .string()
    .trim()
    .max(50, "City cannot exceed 50 characters")
    .optional(),
  district: z
    .string()
    .trim()
    .max(50, "District cannot exceed 50 characters")
    .optional(),
  locality: z
    .string()
    .trim()
    .max(50, "Locality cannot exceed 50 characters")
    .optional(),
  other: z
    .string()
    .trim()
    .max(200, "Other location info cannot exceed 200 characters")
    .optional(),
  // GPS coordinates are optional and can be auto-populated
  gpsCoordinates: gpsCoordinatesSchema.optional(),
});

// Contact information (Step 4)
export const contactFormSchema = z.object({
  primaryContact: z
    .string()
    .trim()
    .regex(ghanaPhoneRegex, "Please provide a valid Ghana phone number"),
  secondaryContact: z
    .string()
    .trim()
    .regex(ghanaPhoneRegex, "Please provide a valid Ghana phone number")
    .optional()
    .or(z.literal("")), // Allow empty string
  businessEmail: z
    .string()
    .trim()
    .regex(emailRegex, "Please provide a valid email address")
    .optional()
    .or(z.literal("")), // Allow empty string
});

// Social media handles (Optional Step)
export const socialMediaFormSchema = z.object({
  socialMediaHandles: z
    .array(
      z.object({
        nameOfSocial: z
          .string()
          .trim()
          .min(1, "Social media platform name is required")
          .max(50, "Social media name cannot exceed 50 characters"),
        userName: z
          .string()
          .trim()
          .min(1, "Username is required")
          .max(100, "Username cannot exceed 100 characters"),
      })
    )
    .max(5, "Maximum 5 social media handles allowed")
    .optional()
    .default([]),
});

// =============================================================================
// SEPARATED ID DETAILS SCHEMAS
// =============================================================================

// ID type configurations (moved here for reference)
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

// ID details form schema (completely separate from profile)
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

// =============================================================================
// COMBINED USER PROFILE FORM SCHEMA (WITHOUT ID DETAILS)
// =============================================================================

// Complete user profile form - only profile-related fields
export const userProfileFormSchema = z.object({
  // Basic info (including profile picture)
  bio: basicInfoFormSchema.shape.bio,
  profilePicture: basicInfoFormSchema.shape.profilePicture,

  // Role and marketplace participation
  role: roleSelectionFormSchema.shape.role,
  isActiveInMarketplace: roleSelectionFormSchema.shape.isActiveInMarketplace,

  // Location (flattened structure for easier form handling)
  ghanaPostGPS: locationFormSchema.shape.ghanaPostGPS,
  nearbyLandmark: locationFormSchema.shape.nearbyLandmark,
  region: locationFormSchema.shape.region,
  city: locationFormSchema.shape.city,
  district: locationFormSchema.shape.district,
  locality: locationFormSchema.shape.locality,
  other: locationFormSchema.shape.other,
  gpsCoordinates: locationFormSchema.shape.gpsCoordinates,

  // Contact info
  primaryContact: contactFormSchema.shape.primaryContact,
  secondaryContact: contactFormSchema.shape.secondaryContact,
  businessEmail: contactFormSchema.shape.businessEmail,

  // Social media (optional)
  socialMediaHandles: socialMediaFormSchema.shape.socialMediaHandles,
});

// =============================================================================
// UPDATE SCHEMAS (All optional for partial updates)
// =============================================================================

export const updateBasicInfoFormSchema = basicInfoFormSchema.partial();
export const updateRoleSelectionFormSchema = roleSelectionFormSchema.partial();
export const updateLocationFormSchema = locationFormSchema.partial();
export const updateContactFormSchema = contactFormSchema.partial();
export const updateSocialMediaFormSchema = socialMediaFormSchema.partial();

// Complete update schema for profile
export const updateUserProfileFormSchema = userProfileFormSchema.partial();

// Update schema for ID details (separate)
export const updateIdDetailsFormSchema = idDetailsFormSchema.partial();

export const extendedUpdateUserProfileFormSchema =
  updateUserProfileFormSchema.extend({
    // Add ID verification fields for form handling - with proper enum type
    idType: z.nativeEnum(idType).optional(),
    idNumber: z.string().trim().max(50).optional(),
  });
// =============================================================================
// FORM STEP SCHEMAS FOR MULTI-STEP FORMS
// =============================================================================

// Profile form steps (no ID verification step)
export const profileFormSteps = {
  step1: basicInfoFormSchema,
  step2: roleSelectionFormSchema,
  step3: locationFormSchema,
  step4: contactFormSchema,
  step5: socialMediaFormSchema, // Optional
} as const;

// Separate ID verification form steps
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

// Profile types (no ID details)
export type UserProfileFormData = z.infer<typeof userProfileFormSchema>;
export type UpdateUserProfileFormData = z.infer<
  typeof updateUserProfileFormSchema
>;
export type ProfilePictureFormData = z.infer<typeof profilePictureFormSchema>;
export type ProfilePictureUpdateFormData = z.infer<
  typeof profilePictureUpdateFormSchema
>;

// Step-specific types
export type BasicInfoFormData = z.infer<typeof basicInfoFormSchema>;
export type RoleSelectionFormData = z.infer<typeof roleSelectionFormSchema>;
export type LocationFormData = z.infer<typeof locationFormSchema>;
export type ContactFormData = z.infer<typeof contactFormSchema>;
export type SocialMediaFormData = z.infer<typeof socialMediaFormSchema>;

// ID details types (separate)
export type IdDetailsFormData = z.infer<typeof idDetailsFormSchema>;
export type IdDetailsFormWithFileData = z.infer<
  typeof idDetailsFormWithFileSchema
>;
export type IdDetailsCompleteData = z.infer<typeof idDetailsCompleteSchema>;
export type UpdateIdDetailsFormData = z.infer<typeof updateIdDetailsFormSchema>;

// Add this to your updateUserProfileFormSchema in profile.schemas.ts
// export const extendedUpdateUserProfileFormSchema =
//   updateUserProfileFormSchema.extend({
//     // Add ID verification fields for form handling
//     idType: z.nativeEnum(idType).optional(),
//     idNumber: z.string().trim().max(50).optional(),
//   });

// // Update the type export
// export type ExtendedUpdateUserProfileFormData = z.infer<
//   typeof extendedUpdateUserProfileFormSchema
// >;

// =============================================================================
// FORM FIELD CONFIGURATIONS
// =============================================================================

export const userFormFieldConfigs = {
  profilePicture: {
    label: "Profile Picture",
    acceptedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    maxSize: 5 * 1024 * 1024, // 5MB
    maxSizeLabel: "5MB",
    helpText:
      "Upload a clear photo of yourself. JPEG, PNG, or WebP formats only.",
    optional: true,
    aspectRatio: "1:1", // Square aspect ratio recommended
    minResolution: { width: 150, height: 150 },
    recommendedResolution: { width: 400, height: 400 },
  },
  bio: {
    label: "About You",
    placeholder:
      "Tell us about yourself, your interests, and what makes you unique...",
    maxLength: 500,
    rows: 4,
    optional: true,
    helpText: "This helps others get to know you better",
  },
  role: {
    label: "I am a",
    options: [
      {
        value: UserRole.CUSTOMER,
        label: "Customer",
        description: "I want to book services",
      },
      {
        value: UserRole.PROVIDER,
        label: "Service Provider",
        description: "I provide services",
      },
    ],
    required: true,
    helpText: "You can change this later in your settings",
  },
  isActiveInMarketplace: {
    label: "Active in Marketplace",
    helpText: "Enable to participate in the service marketplace",
    defaultValue: false,
  },
  ghanaPostGPS: {
    label: "Ghana Post GPS Address",
    placeholder: "XX-0000-0000",
    pattern: "XX-0000-0000",
    required: true,
    helpText: "Your Ghana Post GPS address (e.g., GA-544-1234)",
  },
  nearbyLandmark: {
    label: "Nearby Landmark",
    placeholder: "e.g., Near Accra Mall, Behind Shell Station",
    maxLength: 100,
    optional: true,
  },
  region: {
    label: "Region",
    placeholder: "e.g., Greater Accra, Ashanti, Northern",
    maxLength: 50,
    optional: true,
  },
  city: {
    label: "City",
    placeholder: "e.g., Accra, Kumasi, Tamale",
    maxLength: 50,
    optional: true,
  },
  district: {
    label: "District",
    placeholder: "e.g., Tema Metropolitan, Kumasi Metropolitan",
    maxLength: 50,
    optional: true,
  },
  locality: {
    label: "Locality",
    placeholder: "e.g., East Legon, Osu, Airport Residential",
    maxLength: 50,
    optional: true,
  },
  other: {
    label: "Additional Location Info",
    placeholder: "Any additional location information",
    maxLength: 200,
    optional: true,
  },
  primaryContact: {
    label: "Primary Phone Number",
    placeholder: "+233XXXXXXXXX or 0XXXXXXXXX",
    type: "tel",
    required: true,
    helpText: "Your main phone number for contact",
  },
  secondaryContact: {
    label: "Secondary Phone Number",
    placeholder: "+233XXXXXXXXX or 0XXXXXXXXX",
    type: "tel",
    optional: true,
    helpText: "Alternative phone number",
  },
  businessEmail: {
    label: "Business Email",
    placeholder: "business@example.com",
    type: "email",
    optional: true,
    helpText: "Business email address",
  },
  socialMediaHandles: {
    label: "Social Media Profiles",
    maxItems: 5,
    optional: true,
    helpText: "Add up to 5 social media profiles",
    fields: {
      nameOfSocial: {
        label: "Platform",
        placeholder: "e.g., Instagram, Twitter, LinkedIn",
        maxLength: 50,
      },
      userName: {
        label: "Username/Handle",
        placeholder: "e.g., @username or profile URL",
        maxLength: 100,
      },
    },
  },
} as const;

// Separate field configurations for ID details
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

export const validateUserProfileForm = (data: Partial<UserProfileFormData>) => {
  return userProfileFormSchema.safeParse(data);
};

export const validateIdDetailsForm = (data: Partial<IdDetailsFormData>) => {
  return idDetailsFormSchema.safeParse(data);
};

// Profile picture validation helper
export const validateProfilePictureFile = (
  file: File
): { isValid: boolean; error?: string } => {
  const result = profilePictureFormSchema.shape.file.safeParse(file);

  if (result.success) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: result.error.issues[0]?.message || "Invalid file",
  };
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
// PROFILE COMPLETENESS CALCULATION (Updated - no ID details)
// =============================================================================

export const calculateUserProfileCompleteness = (
  profile: Partial<UserProfileFormData>
): {
  percentage: number;
  completedSections: string[];
  missingSections: string[];
} => {
  const sections = {
    basicInfo: !!(profile.bio && profile.bio.trim()),
    profilePicture: !!profile.profilePicture?.url,
    role: !!profile.role,
    location: !!profile.ghanaPostGPS,
    contact: !!profile.primaryContact,
    socialMedia: !!(
      profile.socialMediaHandles && profile.socialMediaHandles.length > 0
    ),
  };

  // Essential sections (required for basic functionality)
  const essentialSections = ["role", "location", "contact"];
  const essentialCompleted = essentialSections.filter(
    (section) => sections[section as keyof typeof sections]
  ).length;
  const essentialScore = (essentialCompleted / essentialSections.length) * 60; // 60% for essentials

  // Important sections (enhance profile quality)
  const importantSections = ["basicInfo", "profilePicture"];
  const importantCompleted = importantSections.filter(
    (section) => sections[section as keyof typeof sections]
  ).length;
  const importantScore = (importantCompleted / importantSections.length) * 30; // 30% for important

  // Optional sections (nice to have)
  const optionalSections = ["socialMedia"];
  const optionalCompleted = optionalSections.filter(
    (section) => sections[section as keyof typeof sections]
  ).length;
  const optionalScore = (optionalCompleted / optionalSections.length) * 10; // 10% for optional

  const percentage = Math.round(
    essentialScore + importantScore + optionalScore
  );

  const completedSections = Object.entries(sections)
    .filter(([, completed]) => completed)
    .map(([section]) => section);

  const missingSections = Object.entries(sections)
    .filter(([, completed]) => !completed)
    .map(([section]) => section);

  return {
    percentage,
    completedSections,
    missingSections,
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
