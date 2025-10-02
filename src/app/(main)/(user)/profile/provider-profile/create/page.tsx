import ProviderProfileForm from "@/components/user/provider-profile/form/ProviderProfileFormWrapper";
import React from "react";
import Link from "next/link";

export default function CreateProviderProfilePage() {
  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb */}
      <div className="flex flex-col gap-2 mb-4">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link
            href="/profile"
            className="hover:text-foreground transition-colors"
          >
            Business Profile
          </Link>
          <span>/</span>
          <Link
            href="/dashboard"
            className="hover:text-foreground transition-colors"
          >
            Provider Dashboard
          </Link>
          <span>/</span>
          <span className="text-foreground">Create</span>
        </nav>
      </div>

      {/* Page Title */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Create Business Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Add your business details to get started and showcase your services.
          </p>
        </div>
      </div>

      <ProviderProfileForm mode="create" />
    </div>
  );
}
