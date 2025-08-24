import { ProfilePicture } from "@/types";

// Helper function to get avatar URL safely
export const getAvatarUrl = (avatar?: ProfilePicture | string): string => {
  const defaultAvatar = "/default-avatar.png";

  if (!avatar) return defaultAvatar;
  if (typeof avatar === "string") return avatar;
  if (typeof avatar === "object" && avatar.url) return avatar.url;

  return defaultAvatar;
};