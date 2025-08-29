"use client";
import IdDetailsUpdateForm from "@/components/profile/form/Id-details";
import { useAuth } from "@/hooks/auth/useAuth";
import React from "react";

// In your app root or any component
export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }
  return (
    <div>
      {isAuthenticated ? (
        <div>
          Welcome, {user?.name}! <br /> <IdDetailsUpdateForm />
        </div>
      ) : (
        <div>Please log in</div>
      )}
    </div>
  );
}
