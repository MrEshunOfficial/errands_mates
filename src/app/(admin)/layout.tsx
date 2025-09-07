"use client";

// app/(admin)/layout.tsx
import AdminHeader from "@/components/headerUi/AdminHeader";
import BaseLayout from "@/components/layout/BaseLayout";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { useProfile } from "@/hooks/profiles/useProfile";
import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { isLoading } = useProfile();

  if (isLoading) {
    return <LoadingOverlay show={true} message="loading please wait..." />;
  }

  return (
    <BaseLayout maxWidth="container">
      {/* Main container with full height and minimal spacing */}
      <div className="min-h-screen flex flex-col p-2">
        {/* Header - positioned at the top */}
        <AdminHeader />

        {/* Main content area - takes remaining height with minimal padding */}
        <main className="flex-1 p-2 border rounded-2xl">
          <>{children}</>
        </main>
      </div>
    </BaseLayout>
  );
}
