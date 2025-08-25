import { UserRole, idType } from "@/types";
import { z } from "zod";

// Ghana phone number regex pattern from your backend
const ghanaPhoneRegex = /^\+233[0-9]{9}$|^0[0-9]{9}$/;

// Ghana Post GPS regex pattern from your backend
const ghanaPostGPSRegex = /^[A-Z]{2}-\d{4}-\d{4}$/;

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
// ID TYPE CONFIGURATIONS (Must be defined before usage)
// =============================================================================

export const idTypeConfigs = {
  [idType.NATIONAL_ID]: {
    label: "Ghana Card",
    icon: "🆔",
    description: "National identification card",
    placeholder: "GHA-123456789-0",
    example: "GHA-123456789-0",
    helpText: "Your Ghana Card number",
  },
  [idType.VOTERS_ID]: {
    label: "Voter's ID",
    icon: "🗳️",
    description: "Electoral Commission voter ID",
    placeholder: "1234567890",
    example: "1234567890",
    helpText: "10-digit voter ID number",
  },
  [idType.PASSPORT]: {
    label: "Ghana Passport",
    icon: "📘",
    description: "Ghana passport",
    placeholder: "A1234567",
    example: "A1234567",
    helpText: "Passport number",
  },
  [idType.DRIVERS_LICENSE]: {
    label: "Driver's License",
    icon: "🚗",
    description: "DVLA driving license",
    placeholder: "DL1234567",
    example: "DL1234567",
    helpText: "DVLA license number",
  },
  [idType.NHIS]: {
    label: "NHIS Card",
    icon: "🏥",
    description: "National Health Insurance card",
    placeholder: "1234567890",
    example: "1234567890",
    helpText: "10-digit NHIS number",
  },
  [idType.OTHER]: {
    label: "Other ID",
    icon: "📋",
    description: "Other government-issued ID",
    placeholder: "Enter ID number",
    example: "Various formats",
    helpText: "Any valid government ID",
  },
} as const;

// =============================================================================
// USER-FACING FORM SCHEMAS (Only fields users should fill)
// =============================================================================

// Basic personal information (Step 1)
export const basicInfoFormSchema = z.object({
  bio: z
    .string()
    .trim()
    .max(500, "Bio cannot exceed 500 characters")
    .optional(),
});

// Role selection (Step 2)
export const roleSelectionFormSchema = z.object({
  role: z.nativeEnum(UserRole, {
    message: "Please select whether you're a customer or service provider",
  }),
  isActiveInMarketplace: z.boolean().default(false),
});

// Location information (Step 3)
export const locationFormSchema = z.object({
  ghanaPostGPS: z
    .string()
    .trim()
    .regex(ghanaPostGPSRegex, "Ghana Post GPS must be in format XX-0000-0000")
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

// ID verification (Required for service providers, optional for customers)
export const idVerificationFormSchema = z.object({
  idType: z.nativeEnum(idType, {
    message: "Please select a valid ID type",
  }),
  idNumber: z
    .string()
    .trim()
    .min(1, "ID number is required")
    .max(50, "ID number cannot exceed 50 characters"),
  // Note: idFile will be handled separately through file upload
});

// =============================================================================
// COMBINED USER PROFILE FORM SCHEMA
// =============================================================================

// Complete user profile form - only user-editable fields
export const userProfileFormSchema = z.object({
  // Basic info
  bio: basicInfoFormSchema.shape.bio,

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

  // ID verification (conditional based on role)
  idType: idVerificationFormSchema.shape.idType.optional(),
  idNumber: idVerificationFormSchema.shape.idNumber.optional(),
});

// =============================================================================
// UPDATE SCHEMAS (All optional for partial updates)
// =============================================================================

export const updateBasicInfoFormSchema = basicInfoFormSchema.partial();
export const updateRoleSelectionFormSchema = roleSelectionFormSchema.partial();
export const updateLocationFormSchema = locationFormSchema.partial();
export const updateContactFormSchema = contactFormSchema.partial();
export const updateSocialMediaFormSchema = socialMediaFormSchema.partial();
export const updateIdVerificationFormSchema =
  idVerificationFormSchema.partial();

// Complete update schema
export const updateUserProfileFormSchema = userProfileFormSchema.partial();

// =============================================================================
// CONDITIONAL VALIDATION SCHEMAS
// =============================================================================

// Schema for customers (ID verification optional)
export const customerProfileFormSchema = userProfileFormSchema.omit({
  idType: true,
  idNumber: true,
});

// Schema for service providers (ID verification required)
export const serviceProviderProfileFormSchema = userProfileFormSchema.extend({
  idType: idVerificationFormSchema.shape.idType,
  idNumber: idVerificationFormSchema.shape.idNumber,
});

// =============================================================================
// FORM STEP SCHEMAS FOR MULTI-STEP FORMS
// =============================================================================

export const profileFormSteps = {
  step1: basicInfoFormSchema,
  step2: roleSelectionFormSchema,
  step3: locationFormSchema,
  step4: contactFormSchema,
  step5: socialMediaFormSchema, // Optional
  step6: idVerificationFormSchema, // Conditional
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type UserProfileFormData = z.infer<typeof userProfileFormSchema>;
export type UpdateUserProfileFormData = z.infer<
  typeof updateUserProfileFormSchema
>;

// Step-specific types
export type BasicInfoFormData = z.infer<typeof basicInfoFormSchema>;
export type RoleSelectionFormData = z.infer<typeof roleSelectionFormSchema>;
export type LocationFormData = z.infer<typeof locationFormSchema>;
export type ContactFormData = z.infer<typeof contactFormSchema>;
export type SocialMediaFormData = z.infer<typeof socialMediaFormSchema>;
export type IdVerificationFormData = z.infer<typeof idVerificationFormSchema>;

// Role-specific types
export type CustomerProfileFormData = z.infer<typeof customerProfileFormSchema>;
export type ServiceProviderProfileFormData = z.infer<
  typeof serviceProviderProfileFormSchema
>;

// =============================================================================
// FORM FIELD CONFIGURATIONS
// =============================================================================

export const userFormFieldConfigs = {
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
  idType: {
    label: "ID Type",
    options: Object.entries(idTypeConfigs).map(([value, config]) => ({
      value,
      label: config.label,
      description: config.description,
      icon: config.icon,
    })),
    required: false, // Conditional based on role
  },
  idNumber: {
    label: "ID Number",
    placeholder: "Enter your ID number",
    maxLength: 50,
    required: false, // Conditional based on role
    helpText: "Required for service providers",
  },
} as const;

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

export const validateUserProfileForm = (
  data: Partial<UserProfileFormData>,
  userRole?: UserRole
) => {
  // Use appropriate schema based on role
  const schema =
    userRole === UserRole.PROVIDER
      ? serviceProviderProfileFormSchema
      : customerProfileFormSchema;

  return schema.safeParse(data);
};

// =============================================================================
// PROFILE COMPLETENESS CALCULATION (User fields only)
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
    role: !!profile.role,
    location: !!profile.ghanaPostGPS,
    contact: !!profile.primaryContact,
    socialMedia: !!(
      profile.socialMediaHandles && profile.socialMediaHandles.length > 0
    ),
    identification: !!(profile.idType && profile.idNumber), // For service providers
  };

  // Essential sections (required for basic functionality)
  const essentialSections = ["role", "location", "contact"];
  const essentialCompleted = essentialSections.filter(
    (section) => sections[section as keyof typeof sections]
  ).length;
  const essentialScore = (essentialCompleted / essentialSections.length) * 60; // 60% for essentials

  // Important sections (enhance profile quality)
  const importantSections = ["basicInfo"];
  const importantCompleted = importantSections.filter(
    (section) => sections[section as keyof typeof sections]
  ).length;
  const importantScore = (importantCompleted / importantSections.length) * 30; // 30% for important

  // Optional sections (nice to have)
  const optionalSections = ["socialMedia", "identification"];
  const optionalCompleted = optionalSections.filter(
    (section) => sections[section as keyof typeof sections]
  ).length;
  const optionalScore = (optionalCompleted / optionalSections.length) * 10; // 10% for optional

  const percentage = Math.round(
    essentialScore + importantScore + optionalScore
  );

  const completedSections = Object.entries(sections)
    .filter(([_, completed]) => completed)
    .map(([section, _]) => section);

  const missingSections = Object.entries(sections)
    .filter(([_, completed]) => !completed)
    .map(([section, _]) => section);

  return {
    percentage,
    completedSections,
    missingSections,
  };
};
