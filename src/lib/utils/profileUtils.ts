// utils/profileUtils.ts
import type { IUserProfile } from "@/types/profile.types";

// Get user initials from name
export const getInitials = (name: string): string => {
  if (!name || typeof name !== "string") return "NA";
  const parts = name.trim().split(/\s+/);
  return (
    parts
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2) || "NA"
  );
};

// Format date for display
export const formatDate = (date: string | Date | undefined): string => {
  if (!date) return "N/A";
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "Invalid Date";
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "Invalid Date";
  }
};

// Format role display name
export const getRoleDisplay = (role: string | undefined): string => {
  if (!role) return "N/A";
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Calculate profile completeness based on filled fields
export const calculateProfileCompleteness = (profile: Partial<IUserProfile> | null): number => {
  if (!profile) return 0;

  const fields = {
    // Basic profile fields (50% weight)
    basicInfo: {
      weight: 50,
      fields: {
        role: !!profile.role,
        bio: !!profile.bio,
        verificationStatus: !!profile.verificationStatus,
        profilePicture: !!profile.profilePicture,
      }
    },
    
    // Contact details (25% weight)
    contactDetails: {
      weight: 25,
      fields: {
        primaryContact: !!profile.contactDetails?.primaryContact,
        businessEmail: !!profile.contactDetails?.businessEmail,
      }
    },
    
    // Location information (15% weight)
    location: {
      weight: 15,
      fields: {
        ghanaPostGPS: !!profile.location?.ghanaPostGPS,
        region: !!profile.location?.region,
        city: !!profile.location?.city,
      }
    },
    
    // ID verification (10% weight)
    idDetails: {
      weight: 10,
      fields: {
        idType: !!profile.idDetails?.idType,
        idNumber: !!profile.idDetails?.idNumber,
        idFile: !!profile.idDetails?.idFile,
      }
    }
  };

  let totalScore = 0;
  
  Object.values(fields).forEach(category => {
    const filledFields = Object.values(category.fields).filter(Boolean).length;
    const totalFields = Object.values(category.fields).length;
    const categoryScore = totalFields > 0 ? (filledFields / totalFields) * category.weight : 0;
    totalScore += categoryScore;
  });

  return Math.round(totalScore);
};

// Get profile completeness status
export const getCompletenessStatus = (completeness: number): {
  status: "incomplete" | "partial" | "complete";
  message: string;
  color: "red" | "yellow" | "green";
} => {
  if (completeness >= 90) {
    return {
      status: "complete",
      message: "Profile is complete!",
      color: "green"
    };
  } else if (completeness >= 60) {
    return {
      status: "partial",
      message: "Profile is mostly complete",
      color: "yellow"
    };
  } else {
    return {
      status: "incomplete",
      message: "Profile needs more information",
      color: "red"
    };
  }
};

// Check if profile has minimum required fields
export const hasMinimumRequiredFields = (profile: Partial<IUserProfile> | null): boolean => {
  if (!profile) return false;
  
  return !!(
    profile.role &&
    profile.contactDetails?.primaryContact &&
    profile.location?.ghanaPostGPS
  );
};