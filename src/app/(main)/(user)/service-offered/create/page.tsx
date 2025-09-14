"use client";
// pages/services/create.tsx (Create Service Page)
import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";
import ServiceForm from "@/components/admin/services/service-form";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CreateServicePage: React.FC = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = () => {
    toast.success("Service created successfully!");
    router.push("/services");
  };

  const handleCancel = () => {
    router.back();
  };

  const handleRetry = () => {
    setError(null);
    // Re-fetch categories
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 mb-4">
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Create New Service
            </h1>
          </div>

          {/* Error content */}
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Failed to Load Categories
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
              <div className="space-x-4">
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Try Again
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="w-full p-2">
      <div className="flex flex-col gap-2">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link
            href="/admin"
            className="hover:text-foreground transition-colors">
            Admin
          </Link>
          <span>/</span>
          <Link
            href="/admin/services"
            className="hover:text-foreground transition-colors">
            Services
          </Link>
          <span>/</span>
          <span className="text-foreground">create</span>
        </nav>
      </div>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleCancel}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 mb-4 transition-colors">
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Create New Service
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Add a new service to the marketplace and start connecting with
            customers.
          </p>
        </div>

        <div className="container mx-auto max-w-4xl">
          {/* Service Form */}
          <ServiceForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            mode="create"
            showCancelButton={true}
            submitButtonText="Create Service"
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default CreateServicePage;
