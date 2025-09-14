"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Save,
  Send,
  X,
  Plus,
  DollarSign,
  Tag,
  AlertCircle,
  ChevronDown,
  Folder,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import type { Service } from "@/types/service.types";
import type { CategoryWithServices } from "@/types/category.types";
import { ServiceStatus } from "@/types/base.types";
import { createServiceSchema } from "@/lib/utils/schemas/service.schema";
import ServiceImageUpload from "./ServiceImageUpload";
import { useCategory } from "@/hooks/public/categories/userCategory.hook";
import { toast } from "sonner";
import { FileReference } from "@/lib/api/categories/categoryImage.api";

// Types
import { z } from "zod";
import { useUserService } from "@/hooks/public/services/use-service";

type ServiceFormData = z.infer<typeof createServiceSchema>;

interface ExtendedCategory extends CategoryWithServices {
  subcategories?: ExtendedCategory[];
}

interface ServiceFormProps {
  service?: Service | null;
  onSuccess?: (service: Service) => void;
  onCancel?: () => void;
  className?: string;
  submitButtonText?: string;
  mode?: "create" | "edit";
  showCancelButton?: boolean;
  categories?: ExtendedCategory[];
}

// Utility functions
const normalizeFileReference = (
  img: FileReference
): ServiceFormData["images"][0] => ({
  url: img.url,
  fileName: img.fileName,
  fileSize: img.fileSize,
  mimeType: img.mimeType,
  uploadedAt:
    img.uploadedAt instanceof Date
      ? img.uploadedAt
      : typeof img.uploadedAt === "string"
      ? new Date(img.uploadedAt)
      : new Date(),
});

const convertFormDataToAPI = (data: ServiceFormData) => ({
  ...data,
  categoryId: data.categoryId, // Keep as string, let the API handle conversion
  images: data.images.filter((img) => img.url),
  tags: data.tags.map((tag) => tag.trim()).filter(Boolean),
  title: data.title.trim(),
  description: data.description.trim(),
  priceDescription: data.priceDescription?.trim(),
});

// Components
const FormError = ({
  error,
  onClear,
}: {
  error: string;
  onClear: () => void;
}) => (
  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
    <div className="flex items-center space-x-2">
      <AlertCircle size={16} className="text-red-500 dark:text-red-400" />
      <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
    </div>
    <button
      type="button"
      onClick={onClear}
      className="mt-2 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
    >
      Dismiss
    </button>
  </div>
);

const SubmissionOverlay = ({ mode }: { mode: "create" | "edit" }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-4 shadow-xl">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      <div>
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {mode === "create" ? "Creating Service..." : "Updating Service..."}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please wait while we process your request
        </p>
      </div>
    </div>
  </div>
);

const FormField = ({
  label,
  error,
  children,
  required = false,
}: {
  label: string | React.ReactNode;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      {label} {required && "*"}
    </label>
    {children}
    {error && (
      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
    )}
  </div>
);

const ServiceForm: React.FC<ServiceFormProps> = ({
  service,
  onSuccess,
  onCancel,
  className = "",
  submitButtonText,
  mode = service ? "edit" : "create",
  showCancelButton = true,
  categories: propCategories = [],
}) => {
  // Hooks
  const {
    createService,
    updateService,
    isSubmitting,
    currentService,
    setCurrentService,
    error: serviceError,
    clearError,
  } = useUserService();

  const {
    categories: fetchedCategories,
    isLoading: categoriesLoading,
    fetchParentCategories,
  } = useCategory();

  // State - Fix the FileReference type issue
  const [currentImages, setCurrentImages] = useState<
    Array<{
      url: string;
      fileName: string;
      fileSize?: number;
      mimeType?: string;
      uploadedAt?: Date;
    }>
  >([]);
  const [tagInput, setTagInput] = useState("");
  const [localIsSubmitting, setLocalIsSubmitting] = useState(false);

  // Computed values
  const categories =
    propCategories.length > 0
      ? propCategories
      : (fetchedCategories as ExtendedCategory[]) || [];
  const serviceToUse = service || currentService;
  const isFormSubmitting = localIsSubmitting || isSubmitting;

  // Form setup
  const form = useForm<ServiceFormData>({
    resolver: zodResolver(createServiceSchema),
    defaultValues: {
      title: "",
      description: "",
      priceBasedOnServiceType: true,
      categoryId: "",
      images: [
        {
          url: "",
          fileName: "",
          uploadedAt: new Date(),
          fileSize: 0,
          mimeType: "",
        },
      ],
      tags: [],
      priceDescription: "",
      basePrice: undefined,
      priceRange: undefined,
    },
    mode: "onChange",
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    reset,
  } = form as unknown as ReturnType<typeof useForm<ServiceFormData>>;
  const [priceBasedOnServiceType, currentTags] = watch([
    "priceBasedOnServiceType",
    "tags",
  ]);

  // Effects
  useEffect(() => {
    if (serviceError) clearError();
  }, [serviceError, clearError]);

  useEffect(() => {
    if (
      propCategories.length === 0 &&
      !categoriesLoading &&
      !fetchedCategories?.length
    ) {
      fetchParentCategories({
        includeSubcategories: true,
        includeServicesCount: true,
      });
    }
  }, [
    propCategories.length,
    categoriesLoading,
    fetchedCategories?.length,
    fetchParentCategories,
  ]);

  useEffect(() => {
    if (serviceToUse) {
      const transformedImages =
        serviceToUse.images?.map(normalizeFileReference) || [];
      reset({
        title: serviceToUse.title,
        description: serviceToUse.description,
        priceBasedOnServiceType: serviceToUse.priceBasedOnServiceType,
        categoryId: serviceToUse.categoryId.toString(),
        images: transformedImages,
        tags: serviceToUse.tags || [],
        priceDescription: serviceToUse.priceDescription || "",
        basePrice: serviceToUse.basePrice,
        priceRange: serviceToUse.priceRange,
      });
      setCurrentImages(transformedImages);
    }
  }, [serviceToUse, reset]);

  // Handlers
  const handleImageUpdate = useCallback(
    (imageData: FileReference | null, index: number = 0) => {
      let updatedImages = [...currentImages];

      if (imageData) {
        // Ensure we have enough slots in the array
        while (updatedImages.length <= index) {
          updatedImages.push({
            url: "",
            fileName: "",
            fileSize: 0,
            uploadedAt: new Date(),
          });
        }
        updatedImages[index] = normalizeFileReference(imageData);
      } else if (index < updatedImages.length) {
        updatedImages.splice(index, 1);
      }

      // Filter out empty images and normalize
      updatedImages = updatedImages
        .filter((img) => img.url)
        .map((img) =>
          normalizeFileReference({ ...img, fileSize: img.fileSize ?? 0 })
        );

      setCurrentImages(updatedImages);
      setValue(
        "images",
        updatedImages.map((img) => ({
          ...img,
          uploadedAt: img.uploadedAt ?? new Date(),
        })),
        { shouldValidate: true }
      );

      if (serviceToUse) {
        // Convert back to FileReference format for the service
        const fileReferences: FileReference[] = updatedImages.map((img) => ({
          url: img.url,
          fileName: img.fileName,
          fileSize: img.fileSize || 0, // Provide default fileSize
          mimeType: img.mimeType,
          uploadedAt: img.uploadedAt || new Date(),
        }));
        setCurrentService({ ...serviceToUse, images: fileReferences });
      }
    },
    [currentImages, setValue, serviceToUse, setCurrentService]
  );

  const handleImageError = useCallback((error: string) => {
    console.error("Image upload error:", error);
    toast.error(error);
  }, []);

  const handleAddTag = useCallback(() => {
    const trimmedTag = tagInput.trim();
    if (
      trimmedTag &&
      !currentTags.includes(trimmedTag) &&
      currentTags.length < 10
    ) {
      setValue("tags", [...currentTags, trimmedTag], { shouldValidate: true });
      setTagInput("");
    }
  }, [tagInput, currentTags, setValue]);

  const handleRemoveTag = useCallback(
    (tagToRemove: string) => {
      setValue(
        "tags",
        currentTags.filter((tag) => tag !== tagToRemove),
        { shouldValidate: true }
      );
    },
    [currentTags, setValue]
  );

  const onSubmit = async (data: ServiceFormData) => {
    if (isFormSubmitting) return;

    try {
      setLocalIsSubmitting(true);
      clearError();

      const loadingToastId = toast.loading(
        mode === "create" ? "Creating service..." : "Updating service..."
      );

      const apiData = convertFormDataToAPI(data);
      const result =
        mode === "create"
          ? await createService(apiData)
          : await updateService(serviceToUse!._id.toString(), apiData);

      toast.dismiss(loadingToastId);
      toast.success(
        `Service ${mode === "create" ? "created" : "updated"} successfully!`
      );
      onSuccess?.(result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save service";
      toast.error(errorMessage);
    } finally {
      setLocalIsSubmitting(false);
    }
  };

  const canSubmit = isValid && !isFormSubmitting;
  const isRejected =
    service?.status === ServiceStatus.REJECTED ||
    currentService?.status === ServiceStatus.REJECTED;

  return (
    <div className={`w-full p-3 ${className}`}>
      {serviceError && <FormError error={serviceError} onClear={clearError} />}
      {isFormSubmitting && <SubmissionOverlay mode={mode} />}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 max-h-[80vh] overflow-auto"
      >
        {/* Service Images */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <ServiceImageUpload
            serviceId={serviceToUse?._id?.toString()}
            service={serviceToUse}
            imageIndex={0}
            onSuccess={(imageData) => handleImageUpdate(imageData, 0)}
            onError={handleImageError}
            size="xl"
            showLabel={true}
            allowRemove={true}
            disabled={isFormSubmitting}
          />

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((index) => (
              <ServiceImageUpload
                key={index}
                serviceId={serviceToUse?._id?.toString()}
                service={serviceToUse}
                imageIndex={index}
                onSuccess={(imageData) => handleImageUpdate(imageData, index)}
                onError={handleImageError}
                size="md"
                showLabel={false}
                allowRemove={true}
                disabled={isFormSubmitting}
              />
            ))}
          </div>
          {errors.images && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {errors.images.message}
            </p>
          )}
        </div>

        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 pb-2">
            Basic Information
          </h3>

          <FormField
            label="Service Title"
            error={errors.title?.message}
            required
          >
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  disabled={isFormSubmitting}
                  className={`w-full px-4 py-3 rounded-lg border transition-colors disabled:opacity-50 ${
                    errors.title
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  placeholder="Enter a descriptive title for your service"
                />
              )}
            />
          </FormField>

          <FormField
            label={
              <div className="flex items-center space-x-2">
                <Folder
                  size={16}
                  className="text-blue-600 dark:text-blue-400"
                />
                <span>Category</span>
              </div>
            }
            error={errors.categoryId?.message}
            required
          >
            {categoriesLoading ? (
              <div className="flex items-center space-x-2 p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Loading categories...
                </span>
              </div>
            ) : (
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <select
                      {...field}
                      disabled={isFormSubmitting}
                      className={`w-full px-4 py-3 pr-10 rounded-lg border transition-colors appearance-none disabled:opacity-50 ${
                        errors.categoryId
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                    >
                      <option value="">
                        Select a category for your service
                      </option>
                      {categories.map((category) => (
                        <optgroup
                          key={category._id.toString()}
                          label={category.name}
                        >
                          <option value={category._id.toString()}>
                            {category.name}
                          </option>
                          {category.subcategories?.map((sub) => (
                            <option
                              key={sub._id.toString()}
                              value={sub._id.toString()}
                            >
                              — {sub.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <ChevronDown
                      size={20}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                  </div>
                )}
              />
            )}
          </FormField>

          <FormField
            label="Description"
            error={errors.description?.message}
            required
          >
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  rows={4}
                  disabled={isFormSubmitting}
                  className={`w-full px-4 py-3 rounded-lg border transition-colors resize-none disabled:opacity-50 ${
                    errors.description
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  placeholder="Describe your service in detail..."
                />
              )}
            />
          </FormField>
        </div>

        {/* Pricing Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 pb-2">
            Pricing Information
          </h3>

          <div>
            <label className="flex items-center space-x-3">
              <Controller
                name="priceBasedOnServiceType"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    disabled={isFormSubmitting}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                  />
                )}
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Price based on service type (flexible pricing)
              </span>
            </label>
          </div>

          <AnimatePresence>
            {!priceBasedOnServiceType && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <FormField label="Price Description">
                  <Controller
                    name="priceDescription"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        disabled={isFormSubmitting}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="e.g., Starting from, Per hour, Fixed rate"
                      />
                    )}
                  />
                </FormField>

                <FormField label="Base Price (GHS)">
                  <Controller
                    name="basePrice"
                    control={control}
                    render={({ field }) => (
                      <div className="relative">
                        <DollarSign
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          size={18}
                        />
                        <input
                          {...field}
                          type="number"
                          min="0"
                          step="0.01"
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value) || undefined)
                          }
                          disabled={isFormSubmitting}
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          placeholder="0.00"
                        />
                      </div>
                    )}
                  />
                </FormField>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tags */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 pb-2">
            Tags
          </h3>

          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Tag
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleAddTag())
                }
                disabled={isFormSubmitting}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Enter tags to help customers find your service"
                maxLength={50}
              />
            </div>
            <button
              type="button"
              onClick={handleAddTag}
              disabled={
                !tagInput.trim() || currentTags.length >= 10 || isFormSubmitting
              }
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              <Plus size={18} />
              <span>Add</span>
            </button>
          </div>

          {currentTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {currentTags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    disabled={isFormSubmitting}
                    className="ml-2 hover:text-red-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          {isRejected && (
            <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
              <AlertCircle size={18} />
              <span className="text-sm">
                This service was rejected. Make necessary changes and resubmit
                for approval.
              </span>
            </div>
          )}

          <div className="flex space-x-4 sm:ml-auto">
            {showCancelButton && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isFormSubmitting}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                canSubmit
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-400 text-gray-700 cursor-not-allowed"
              }`}
            >
              {isFormSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>
                    {mode === "create" ? "Creating..." : "Updating..."}
                  </span>
                </>
              ) : (
                <>
                  {mode === "create" ? <Send size={18} /> : <Save size={18} />}
                  <span>
                    {submitButtonText ||
                      (mode === "create" ? "Create Service" : "Update Service")}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ServiceForm;
