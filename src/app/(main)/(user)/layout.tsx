"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import ProfileNavigation from "@/components/layout/profile-layout";
import { useAuth } from "@/hooks/auth/useAuth";
import { useProfile } from "@/hooks/profiles/useProfile";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  // Auth hook
  const {
    isAuthenticated,
    isLoading: authLoading,
    error: authError,
  } = useAuth();

  // Profile hook
  const {
    profile,
    isLoading: profileLoading,
    error: profileError,
  } = useProfile();

  const hasError = authError || profileError;
  const isLoading = authLoading || (isAuthenticated && profileLoading);

  if (!isLoading && isAuthenticated && !profile) {
    router.replace("/update-profile");
    return null;
  }

  if (hasError) {
    return <div className="p-4 text-red-600">Error loading profile data.</div>;
  }

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="flex space-x-2">
      <ProfileNavigation />
      <main className="flex-1 p-2 border rounded">{children}</main>
    </div>
  );
}
