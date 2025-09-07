"use client";
import AppDownload from "@/components/homepage/AppDownload";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { useAuth } from "@/hooks/auth/useAuth";
import React from "react";

// In your app root or any component
export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingOverlay message="loading ..." />;
  }

  const renderData = isAuthenticated ? (
    <div>Welcome, {user?.name}!</div>
  ) : (
    <div>
      <AppDownload />
    </div>
  );

  return <>{renderData}</>;
}
