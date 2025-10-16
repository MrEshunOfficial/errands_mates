"use client";
import React from "react";
import {
  Save,
  AlertCircle,
  Loader2,
  Check,
  ChevronRight,
  User,
  MapPin,
  ToolCase,
  ShieldCheck,
} from "lucide-react";

import ProviderProfileFormLogic, {
  ProviderProfileFormChildProps,
} from "./ProviderProfileFormLogic";
import {
  PersonalInfoStep,
  ScheduleAndAvailabilityStep,
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
    {
      title: "Personal & Business Info",
      icon: User,
      component: PersonalInfoStep,
      description:
        "Provide your personal details and business contact information",
    },
    {
      title: "Service Offerings",
      icon: ToolCase,
      component: ServicesOfferedStep,
      description: "Select and describe the services you offer to clients",
    },
    {
      title: "Location & Working Hours",
      icon: MapPin,
      component: ScheduleAndAvailabilityStep,
      description:
        "Set your business location, coverage area, and availability",
    },
    {
      title: "Verification & Compliance",
      icon: ShieldCheck,
      component: CredentialsStep,
      description:
        "Upload certifications or IDs to verify your business and meet platform standards",
    },
  ];

  return (
    <ProviderProfileFormLogic
      mode={mode}
      redirectOnSuccess="/provider-dashboard"
      onSuccess={() => {
        toast.success(`Business Profile ${mode}d successfully!`);
      }}
      onError={(error) => {
        toast.error(`Failed to ${mode} Business Profile: ${error}`);
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
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Header */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between py-4">
                  {/* Progress Indicator */}
                  <div className="hidden md:flex items-center gap-3">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Step {currentStep + 1} of {totalSteps}
                    </div>
                    <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {completionPercentage}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Alert */}
            {submitError && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
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
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
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
            <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-4 py-4">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Step Navigation Sidebar */}
                <div className="sticky top-28 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50 shadow-xl rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Setup Progress
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Complete all steps to finish
                    </p>
                  </div>
                  <div className="p-4 space-y-2">
                    {steps.map((step, index) => {
                      const Icon = step.icon;
                      const isActive = currentStep === index;
                      const isCompleted = index < currentStep;

                      return (
                        <div
                          key={index}
                          className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                            isActive
                              ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 shadow-sm"
                              : isCompleted
                              ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                              : "bg-gray-50 dark:bg-gray-700/50 border border-transparent"
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isActive
                                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                                : isCompleted
                                ? "bg-green-500 text-white"
                                : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                            }`}
                          >
                            {isCompleted ? (
                              <Check className="w-5 h-5" />
                            ) : (
                              <Icon className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className={`text-sm font-medium ${
                                isActive
                                  ? "text-blue-700 dark:text-blue-300"
                                  : isCompleted
                                  ? "text-green-700 dark:text-green-300"
                                  : "text-gray-600 dark:text-gray-400"
                              }`}
                            >
                              {step.title}
                            </div>
                            {isActive && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Current step
                              </div>
                            )}
                          </div>
                          {isActive && (
                            <ChevronRight className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Progress Summary */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <span>Overall Progress</span>
                      <span className="font-medium">
                        {completionPercentage}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Form Content */}
                <div className="lg:col-span-3 space-y-6">
                  <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50 shadow-xl rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white shadow-lg">
                          {React.createElement(steps[currentStep].icon, {
                            className: "w-6 h-6",
                          })}
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {steps[currentStep].title}
                          </h2>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {steps[currentStep].description}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Render the imported step component */}
                      <CurrentStepComponent
                        formData={formData}
                        updateFieldValue={updateFieldValue}
                        validationErrors={validationErrors}
                        clearFieldError={clearFieldError}
                      />

                      {/* Navigation Buttons */}
                      <div className="flex justify-between pt-8 mt-8 border-t border-gray-200 dark:border-gray-700">
                        <button
                          type="button"
                          onClick={goToPreviousStep}
                          disabled={!canGoPrevious || isSubmitting}
                          className="px-6 h-12 border-2 border-gray-300 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          Previous
                        </button>

                        {!isLastStep ? (
                          <button
                            type="button"
                            onClick={goToNextStep}
                            disabled={!canGoNext || isSubmitting}
                            className="px-8 h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
                          >
                            Continue
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-8 h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
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
                                  : "Save Changes"}
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Helper Text */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">i</span>
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        {currentStep === 0 && (
                          <p>
                            Provide your contact information and set your
                            availability status. This helps clients know when
                            they can reach you.
                          </p>
                        )}
                        {currentStep === 1 && (
                          <p>
                            Select all the services you offer. You can add more
                            services later from your dashboard settings.
                          </p>
                        )}
                        {currentStep === 2 && (
                          <p>
                            Set your regular working hours for each day. These
                            can be adjusted anytime based on your schedule.
                          </p>
                        )}
                        {currentStep === 3 && (
                          <p>
                            Configure your deposit requirements and review your
                            risk level. These settings help protect both you and
                            your clients.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Action Button for Mobile */}
            {isLastStep && (
              <div className="lg:hidden fixed bottom-6 right-6 z-50">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 flex items-center justify-center text-white disabled:opacity-50 shadow-2xl transition-all"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-7 h-7 animate-spin" />
                  ) : (
                    <Save className="w-7 h-7" />
                  )}
                </button>
              </div>
            )}
          </div>
        );
      }}
    </ProviderProfileFormLogic>
  );
}
