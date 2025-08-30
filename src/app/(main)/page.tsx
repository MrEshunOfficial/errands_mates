"use client";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { useAuth } from "@/hooks/auth/useAuth";
import React from "react";

// In your app root or any component
export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingOverlay message="loading ..." />;
  }
  return (
    <div>
      {isAuthenticated ? (
        <div>Welcome, {user?.name}!</div>
      ) : (
        <div>Please log in</div>
      )}
    </div>
  );
}
