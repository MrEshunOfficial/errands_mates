// Updated service_form.txt (ServiceForm component)
"use client";
import React, { useState, useCallback, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import {
  Save,
  AlertCircle,
  FileText,
  ImageIcon,
  Loader2,
  Check,
  ChevronRight,
  DollarSign,
  Tag,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserService } from "@/hooks/public/services/use-service";
import { FileReference } from "@/lib/api/categories/categoryImage.api";
import { Service } from "@/types/service.types";
import { useCategories } from "@/hooks/public/categories/userCategory.hook";
import ServiceFormContent from "./ServiceFormContent";
import { ServiceFormData } from "@/lib/utils/schemas/service.schema";
import { CategoryWithServices } from "@/types/category.types";

interface ServiceFormProps {
  mode?: "create" | "edit";
  serviceId?: string;
  initialData?: Partial<Service>;
  categories?: CategoryWithServices[];
  onSuccess?: (service: Service) => void;
  onCancel?: () => void;
}

const ServiceForm: React.FC<ServiceFormProps> = ({
  mode = "create",
  serviceId,
  initialData,
  categories: propCategories,
  onSuccess,
}) => {
  // hook
  const {
    handleSubmit,
    control,
    watch,
    getValues,
    setValue,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ServiceFormData>({
    defaultValues: {
      title: "",
      description: "",
      priceDescription: "",
      priceBasedOnServiceType: false,
      categoryId: "",
      images: [],
      tags: [],
      basePrice: undefined,
      priceRange: { min: 0, max: 1000 },
    },
  });

  // Populate form with initialData in edit mode
  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title || "",
        description: initialData.description || "",
        priceDescription: initialData.priceDescription || "",
        priceBasedOnServiceType: initialData.priceBasedOnServiceType ?? false,
        categoryId: initialData.categoryId?.toString() || "",
        images: initialData.images || [],
        tags: initialData.tags || [],
        basePrice: initialData.basePrice,
        priceRange: initialData.priceRange
          ? { ...initialData.priceRange }
          : { min: 0, max: 1000 },
      });
    }
  }, [initialData, reset]);

  // Watch form values for dynamic behavior
  const watchedValues = watch();
  const priceBasedOnServiceType = watch("priceBasedOnServiceType");
  const images = watch("images") || [];
  const tags = watch("tags");

  // Component state
  const [newTag, setNewTag] = useState("");
  const [, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Custom hooks - Use prop categories if provided, else fetch
  const {
    categories: hookedCategories,
    loading: hookedLoading,
    error: hookedError,
  } = useCategories({}, { includeServices: false });

  const categories = propCategories || hookedCategories;
  const categoriesLoading = propCategories ? false : hookedLoading;
  const categoriesError = propCategories ? null : hookedError;

  const { createService, updateService, currentService } = useUserService();

  // Form steps for better organization
  const steps = [
    { title: "Basic Info", icon: FileText },
    { title: "Images", icon: ImageIcon },
    { title: "Pricing", icon: DollarSign },
    { title: "Tags", icon: Tag },
  ];

  // Handle tag management
  const handleAddTag = useCallback(() => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 20) {
      setValue("tags", [...tags, trimmedTag], { shouldValidate: true });
      setNewTag("");
    }
  }, [newTag, tags, setValue]);

  const handleRemoveTag = useCallback(
    (tagToRemove: string) => {
      setValue(
        "tags",
        tags.filter((tag) => tag !== tagToRemove),
        { shouldValidate: true }
      );
    },
    [tags, setValue]
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddTag();
      }
    },
    [handleAddTag]
  );

  // Handle image upload success
  const handleImageUpload = useCallback(
    (imageData: FileReference | null, index: number) => {
      const currentImages = getValues("images");
      if (imageData) {
        const newImages = [...currentImages];
        newImages[index] = imageData;
        setValue("images", newImages, { shouldValidate: true });
      } else if (currentImages.length > 1) {
        const newImages = currentImages.filter((_, i) => i !== index);
        setValue("images", newImages, { shouldValidate: true });
      }
    },
    [getValues, setValue]
  );

  const handleImageError = useCallback((error: string) => {
    toast.error(`Image upload error: ${error}`);
  }, []);

  const handleAddImageSlot = useCallback(() => {
    const currentImages = getValues("images");
    if (currentImages.length < 10) {
      setValue("images", [...currentImages, {} as FileReference], {
        shouldValidate: false,
      });
    }
  }, [getValues, setValue]);

  const handleRemoveImageSlot = useCallback(
    (index: number) => {
      const currentImages = getValues("images");
      if (currentImages.length > 1) {
        const newImages = currentImages.filter((_, i) => i !== index);
        setValue("images", newImages, { shouldValidate: true });
      }
    },
    [getValues, setValue]
  );

  // Form submission
  const onSubmit: SubmitHandler<ServiceFormData> = async (data) => {
    setIsSubmitting(true);
    setSubmitSuccess(false);

    try {
      const validImages = data.images.filter((img) => img.url && img.fileName);

      const serviceData = {
        title: data.title,
        description: data.description,
        priceDescription: data.priceDescription,
        priceBasedOnServiceType: data.priceBasedOnServiceType,
        categoryId: data.categoryId,
        images: validImages,
        tags: data.tags,
        basePrice: data.basePrice,
        priceRange: data.priceRange,
      };

      let result: Service;

      if (mode === "edit" && serviceId) {
        result = await updateService(serviceId, serviceData);
        toast.success("Service updated successfully!");
      } else {
        result = await createService(serviceData);
        toast.success("Service created successfully!");
      }

      setSubmitSuccess(true);
      onSuccess?.(result);

      if (mode === "create") {
        setTimeout(() => {
          reset();
          setSubmitSuccess(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Service submission failed:", error);
      toast.error(
        error instanceof Error ? error.message : `Failed to ${mode} service`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate form completion percentage
  const getCompletionPercentage = () => {
    let completed = 0;
    const total = 4;

    if (
      watchedValues.title &&
      watchedValues.description &&
      watchedValues.categoryId
    )
      completed++;
    if (images.filter((img) => img.url).length > 0) completed++;
    if (priceBasedOnServiceType || watchedValues.basePrice) completed++;
    if (tags.length > 0) completed++;

    return Math.round((completed / total) * 100);
  };

  if (categoriesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 px-6 py-4 rounded-2xl shadow-lg">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
            Loading categories...
          </span>
        </div>
      </div>
    );
  }

  const isEditMode = mode === "edit";
  const completionPercentage = getCompletionPercentage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  {!isEditMode && "Create New Service"}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {!isEditMode && "Showcase your skills to potential customers"}
                </p>
              </div>
            </div>

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
      {categoriesError && (
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700 dark:text-red-300">
                Failed to load categories: {categoriesError}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Step Navigation - Mobile Horizontal, Desktop Vertical */}
          <div className="lg:col-span-1">
            <Card className="sticky top-28 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">
                  Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = currentStep === index;
                  const isCompleted =
                    index < currentStep ||
                    (index === 0 &&
                      watchedValues.title &&
                      watchedValues.description &&
                      watchedValues.categoryId) ||
                    (index === 1 &&
                      images.filter((img) => img.url).length > 0) ||
                    (index === 2 &&
                      (priceBasedOnServiceType || watchedValues.basePrice)) ||
                    (index === 3 && tags.length > 0);

                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                          : isCompleted
                          ? "bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      }`}
                      onClick={() => setCurrentStep(index)}
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
              </CardContent>
            </Card>
          </div>

          {/* Form Content */}
          <div className="lg:col-span-3 space-y-8">
            <ServiceFormContent
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              control={control}
              watch={watch}
              getValues={getValues}
              setValue={setValue}
              errors={errors}
              categories={categories}
              currentService={currentService}
              newTag={newTag}
              setNewTag={setNewTag}
              handleAddTag={handleAddTag}
              handleRemoveTag={handleRemoveTag}
              handleKeyPress={handleKeyPress}
              handleImageUpload={handleImageUpload}
              handleImageError={handleImageError}
              handleAddImageSlot={handleAddImageSlot}
              handleRemoveImageSlot={handleRemoveImageSlot}
            />

            {/* Submit Button at end of last step */}
            {currentStep === 3 && (
              <div className="flex justify-end">
                <Button
                  type="submit"
                  onClick={handleSubmit(onSubmit)}
                  size="lg"
                  disabled={!isValid || isSubmitting}
                  className="px-8 h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {isEditMode
                        ? "Updating Service..."
                        : "Creating Service..."}
                    </>
                  ) : submitSuccess ? (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      {isEditMode ? "Service Updated!" : "Service Created!"}
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      {isEditMode ? "Update Service" : "Create Service"}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Floating Action Button for Mobile */}
        <div className="lg:hidden fixed bottom-6 right-6 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-full shadow-2xl border border-gray-200 dark:border-gray-700 p-1">
            <Button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              size="lg"
              disabled={!isValid || isSubmitting}
              className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 p-0"
            >
              {isSubmitting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : submitSuccess ? (
                <Check className="w-6 h-6" />
              ) : (
                <Save className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceForm;
