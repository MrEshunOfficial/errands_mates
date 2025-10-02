"use client";
import React from "react";
import {
  Save,
  AlertCircle,
  Loader2,
  Check,
  ChevronRight,
  User,
  Briefcase,
  MapPin,
  Award,
  ToolCase,
} from "lucide-react";

import ProviderProfileFormLogic, {
  ProviderProfileFormChildProps,
} from "./ProviderProfileFormLogic";
import {
  PersonalInfoStep,
  BusinessDetailsStep,
  LocationStep,
  CredentialsStep,
  ServicesOfferedStep,
} from "./ProviderFormStep";
import { toast } from "sonner";

interface ProviderProfileFormProps {
  mode: "create" | "edit";
  profileId?: string;
}

export default function ProviderProfileForm({
  mode,
}: ProviderProfileFormProps) {
  // Define steps with their imported components
  const steps = [
    { title: "Personal Info", icon: User, component: PersonalInfoStep },
    {
      title: "Business Details",
      icon: Briefcase,
      component: BusinessDetailsStep,
    },
    {
      title: "Service(s) Offered",
      icon: ToolCase,
      component: ServicesOfferedStep,
    },
    { title: "Location", icon: MapPin, component: LocationStep },
    { title: "Credentials", icon: Award, component: CredentialsStep },
  ];

  return (
    <ProviderProfileFormLogic
      mode={mode}
      redirectOnSuccess="/dashboard"
      onSuccess={() => {
        toast.success(`Business Profile ${mode}d successfully:`);
      }}
      onError={() => {
        toast.error(`failed to ${mode} Business Profile:`);
      }}
    >
      {({
        submitError,
        submitSuccess,
        currentStep,
        totalSteps,
        goToNextStep,
        goToPreviousStep,
        handleSubmit,
        canGoNext,
        canGoPrevious,
        isSubmitting,
        isLastStep,
        formData,
        updateFieldValue,
        validationErrors,
        clearFieldError,
      }: ProviderProfileFormChildProps) => {
        const completionPercentage = Math.round(
          ((currentStep + 1) / totalSteps) * 100
        );

        // Get the current step component
        const CurrentStepComponent = steps[currentStep].component;

        return (
          <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Header */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40">
              <div className="max-w-7xl mx-auto p-2">
                <div className="flex items-center justify-between p-2">
                  {/* Progress Indicator */}
                  <div className="hidden md:flex items-center gap-3">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {completionPercentage}% Complete
                    </div>
                    <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Alert */}
            {submitError && (
              <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-6">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <span className="text-red-700 dark:text-red-300">
                      {submitError}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Success Alert */}
            {submitSuccess && (
              <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-6">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-green-700 dark:text-green-300">
                      Profile {mode}d successfully! Redirecting...
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-2">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Step Navigation */}
                <div className="lg:col-span-1">
                  <div className="sticky top-28 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50 shadow-xl rounded-lg">
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Progress
                      </h3>
                    </div>
                    <div className="p-3 space-y-3">
                      {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = currentStep === index;
                        const isCompleted = index < currentStep;

                        return (
                          <div
                            key={index}
                            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                              isActive
                                ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                                : isCompleted
                                ? "bg-green-50 dark:bg-green-900/20"
                                : "bg-gray-50 dark:bg-gray-700/50"
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                isActive
                                  ? "bg-blue-500 text-white"
                                  : isCompleted
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                              }`}
                            >
                              {isCompleted ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Icon className="w-4 h-4" />
                              )}
                            </div>
                            <span
                              className={`font-medium ${
                                isActive
                                  ? "text-blue-700 dark:text-blue-300"
                                  : isCompleted
                                  ? "text-green-700 dark:text-green-300"
                                  : "text-gray-600 dark:text-gray-400"
                              }`}
                            >
                              {step.title}
                            </span>
                            {isActive && (
                              <ChevronRight className="w-4 h-4 text-blue-500 ml-auto" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Form Content */}
                <div className="lg:col-span-3 space-y-8">
                  <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50 shadow-xl rounded-lg">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {steps[currentStep].title}
                      </h2>
                    </div>
                    <div className="p-6 space-y-4">
                      {/* Render the imported step component */}
                      <CurrentStepComponent
                        formData={formData}
                        updateFieldValue={updateFieldValue}
                        validationErrors={validationErrors}
                        clearFieldError={clearFieldError}
                      />

                      {/* Navigation Buttons */}
                      <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                        <button
                          type="button"
                          onClick={goToPreviousStep}
                          disabled={!canGoPrevious || isSubmitting}
                          className="px-8 h-12 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          Previous
                        </button>

                        {!isLastStep ? (
                          <button
                            type="button"
                            onClick={goToNextStep}
                            disabled={!canGoNext || isSubmitting}
                            className="px-8 h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                          >
                            Next
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-8 h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {mode === "create"
                                  ? "Creating Profile..."
                                  : "Updating Profile..."}
                              </>
                            ) : (
                              <>
                                <Save className="w-5 h-5" />
                                {mode === "create"
                                  ? "Create Profile"
                                  : "Update Profile"}
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Action Button for Mobile */}
              {isLastStep && (
                <div className="lg:hidden fixed bottom-6 right-6 z-50">
                  <div className="bg-white dark:bg-gray-800 rounded-full shadow-2xl border border-gray-200 dark:border-gray-700 p-1">
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 p-0 flex items-center justify-center text-white disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <Save className="w-6 h-6" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }}
    </ProviderProfileFormLogic>
  );
}
