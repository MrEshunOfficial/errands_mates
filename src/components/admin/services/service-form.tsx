"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import {
  Save,
  Send,
  X,
  Plus,
  DollarSign,
  Tag,
  AlertCircle,
  Info,
  ChevronDown,
  Folder,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Types } from "mongoose";

import type { Service } from "@/types/service.types";
import type { CategoryWithServices } from "@/types/category.types";
import { FileReference, ServiceStatus } from "@/types/base.types";

// Import your schema
import { Button } from "@/components/ui/button";
import { useService } from "@/hooks/services/use-service";
import { createServiceSchema } from "@/lib/utils/schemas/service.schema";
import ServiceImageUpload from "./ServiceImageUpload";
import { useCategory } from "@/hooks/categories/userCategory.hook";

// Form data type based on the schema - matches what the form expects
type ServiceFormData = {
  title: string;
  description: string;
  priceBasedOnServiceType: boolean;
  categoryId: string; // Form uses string, we convert to ObjectId later
  images: FileReference[];
  tags: string[];
  priceDescription?: string;
  basePrice?: number;
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
};

// API data types - what the backend expects
type CreateServiceData = {
  title: string;
  description: string;
  priceBasedOnServiceType: boolean;
  categoryId: Types.ObjectId;
  images: FileReference[];
  tags: string[];
  priceDescription?: string;
  basePrice?: number;
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
  submittedBy?: Types.ObjectId;
};

type UpdateServiceData = CreateServiceData;

// Extended Category type to handle subcategories property
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
  const { createService, updateService, isSubmitting } = useService();
  const {
    categories: fetchedCategories,
    isLoading: categoriesLoading,
    error: categoriesError,
    fetchParentCategories,
    clearError: clearCategoriesError,
  } = useCategory();

  const [currentImages, setCurrentImages] = useState<FileReference[]>([]);
  const [showPricingFields, setShowPricingFields] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Use prop categories if provided, otherwise use fetched categories
  const categories: ExtendedCategory[] =
    propCategories.length > 0
      ? propCategories
      : (fetchedCategories as ExtendedCategory[]) || [];

  // Form setup with validation
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    reset,
  } = useForm<ServiceFormData>({
    resolver: zodResolver(createServiceSchema),
    defaultValues: {
      title: "",
      description: "",
      priceBasedOnServiceType: true,
      categoryId: "",
      images: [],
      tags: [],
      priceDescription: "",
      basePrice: undefined,
      priceRange: undefined,
    },
    mode: "onChange",
  });

  // Watch for changes
  const priceBasedOnServiceType = watch("priceBasedOnServiceType");
  const currentTags = watch("tags");

  // Fetch categories if not provided as props
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

  // Initialize form when service prop changes
  useEffect(() => {
    if (service) {
      // Transform images to ensure uploadedAt is Date type
      const transformedImages: FileReference[] =
        service.images?.map((img) => ({
          ...img,
          uploadedAt:
            img.uploadedAt instanceof Date
              ? img.uploadedAt
              : img.uploadedAt
              ? new Date(img.uploadedAt)
              : undefined,
        })) || [];

      reset({
        title: service.title,
        description: service.description,
        priceBasedOnServiceType: service.priceBasedOnServiceType,
        categoryId: service.categoryId.toString(),
        images: transformedImages,
        tags: service.tags || [],
        priceDescription: service.priceDescription || "",
        basePrice: service.basePrice,
        priceRange: service.priceRange
          ? {
              min: service.priceRange.min,
              max: service.priceRange.max,
              currency: service.priceRange.currency,
            }
          : undefined,
      });
      setCurrentImages(transformedImages);
      setSelectedCategory(service.categoryId.toString());
      setShowPricingFields(!service.priceBasedOnServiceType);
    }
  }, [service, reset]);

  // Update pricing fields visibility
  useEffect(() => {
    setShowPricingFields(!priceBasedOnServiceType);
  }, [priceBasedOnServiceType]);

  // Handle image updates
  const handleImageUpdate = useCallback(
    (imageData: FileReference | null, index: number = 0) => {
      if (imageData) {
        // Add or replace image at specific index
        const updatedImages = [...currentImages];

        // Ensure uploadedAt is a Date object
        const normalizedImage = {
          ...imageData,
          uploadedAt:
            imageData.uploadedAt instanceof Date
              ? imageData.uploadedAt
              : new Date(imageData.uploadedAt || Date.now()),
        };

        if (index < updatedImages.length) {
          updatedImages[index] = normalizedImage;
        } else {
          // Fill gaps if needed
          while (updatedImages.length < index) {
            updatedImages.push({
              url: "",
              fileName: "",
              fileSize: 0,
              mimeType: "",
              uploadedAt: new Date(),
            });
          }
          updatedImages[index] = normalizedImage;
        }

        setCurrentImages(updatedImages);
        setValue("images", updatedImages, {
          shouldValidate: true,
          shouldDirty: true,
        });
      } else {
        // Remove image at index
        const updatedImages = currentImages.filter((_, i) => i !== index);
        setCurrentImages(updatedImages);
        setValue("images", updatedImages, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    },
    [currentImages, setValue]
  );

  // Add this effect to sync with service updates from the hook
  useEffect(() => {
    if (service?.images) {
      const transformedImages = service.images.map((img) => ({
        ...img,
        uploadedAt:
          img.uploadedAt instanceof Date
            ? img.uploadedAt
            : new Date(img.uploadedAt || Date.now()),
      }));

      if (JSON.stringify(transformedImages) !== JSON.stringify(currentImages)) {
        setCurrentImages(transformedImages);
        setValue("images", transformedImages, {
          shouldValidate: true,
          shouldDirty: false, // Don't mark as dirty for sync updates
        });
      }
    }
  }, [service?.images, setValue, currentImages]);

  const handleImageError = useCallback((error: string, index: number = 0) => {
    console.error(`Image upload error at index ${index}:`, error);
    toast.error(error);
  }, []);

  // Handle tag addition
  const handleAddTag = useCallback(() => {
    const trimmedTag = tagInput.trim();
    if (
      trimmedTag &&
      !currentTags.includes(trimmedTag) &&
      currentTags.length < 10
    ) {
      const newTags = [...currentTags, trimmedTag];
      setValue("tags", newTags, { shouldValidate: true, shouldDirty: true });
      setTagInput("");
    }
  }, [tagInput, currentTags, setValue]);

  // Handle tag removal
  const handleRemoveTag = useCallback(
    (tagToRemove: string) => {
      const newTags = currentTags.filter((tag) => tag !== tagToRemove);
      setValue("tags", newTags, { shouldValidate: true, shouldDirty: true });
    },
    [currentTags, setValue]
  );

  // Handle tag input key press
  const handleTagKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddTag();
      }
    },
    [handleAddTag]
  );

  // Form submission with proper typing
  const onSubmit: SubmitHandler<ServiceFormData> = async (data) => {
    try {
      let result: Service;

      if (mode === "create") {
        // Convert form data to API format
        const createData: CreateServiceData = {
          ...data,
          categoryId: new Types.ObjectId(data.categoryId),
        };
        result = await createService(createData);
        toast.success("Service created successfully!");
      } else if (service?._id) {
        // Update existing service
        const updateData: UpdateServiceData = {
          ...data,
          categoryId: new Types.ObjectId(data.categoryId),
        };
        result = await updateService(service._id.toString(), updateData);
        toast.success("Service updated successfully!");
      } else {
        throw new Error("Service ID is required for updates");
      }

      onSuccess?.(result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save service";
      toast.error(errorMessage);
      console.error("Service form submission error:", error);
    }
  };

  // Form validation status
  const canSubmit = isValid && currentImages.length > 0 && !isSubmitting;

  return (
    <div className={`w-full p-3 ${className}`}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 max-h-[80vh] overflow-auto">
        {/* Service Images */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <ServiceImageUpload
            serviceId={service?._id?.toString()}
            service={service}
            imageIndex={0}
            onSuccess={(imageData) => handleImageUpdate(imageData, 0)}
            onError={(error) => handleImageError(error, 0)}
            size="xl"
            showLabel={true}
            allowRemove={true}
            disabled={isSubmitting}
          />

          {/* Additional Images */}
          {(currentImages.length > 0 || mode === "create") && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((index) => (
                <ServiceImageUpload
                  key={index}
                  serviceId={service?._id?.toString()}
                  service={service}
                  imageIndex={index}
                  onSuccess={(imageData) => handleImageUpdate(imageData, index)}
                  onError={(error) => handleImageError(error, index)}
                  size="md"
                  showLabel={false}
                  allowRemove={true}
                  disabled={isSubmitting}
                />
              ))}
            </div>
          )}

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

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Service Title *
            </label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    errors.title
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  placeholder="Enter a descriptive title for your service"
                />
              )}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center space-x-2">
                <Folder
                  size={16}
                  className="text-blue-600 dark:text-blue-400"
                />
                <span>Category *</span>
              </div>
            </label>

            {/* Category Loading State */}
            {categoriesLoading && (
              <div className="flex items-center space-x-2 p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Loading categories...
                </span>
              </div>
            )}

            {/* Category Error State */}
            {categoriesError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle
                    size={16}
                    className="text-red-500 dark:text-red-400"
                  />
                  <span className="text-sm text-red-700 dark:text-red-300">
                    Failed to load categories: {categoriesError}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    clearCategoriesError();
                    fetchParentCategories({
                      includeSubcategories: true,
                      includeServicesCount: true,
                    });
                  }}
                  className="mt-2 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline">
                  Retry
                </button>
              </div>
            )}

            {/* Category Select */}
            {!categoriesLoading && !categoriesError && (
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <select
                      {...field}
                      value={field.value || selectedCategory}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        setSelectedCategory(e.target.value);
                      }}
                      className={`w-full px-4 py-3 pr-10 rounded-lg border transition-colors appearance-none ${
                        errors.categoryId
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}>
                      <option value="">
                        Select a category for your service
                      </option>
                      {categories.map((category) => (
                        <optgroup
                          key={category._id.toString()}
                          label={category.name}>
                          <option value={category._id.toString()}>
                            {category.name}
                            {category.subcategories &&
                              category.subcategories.length > 0 &&
                              ` (${category.subcategories.length} subcategories)`}
                          </option>
                          {category.subcategories?.map((subcategory) => (
                            <option
                              key={subcategory._id.toString()}
                              value={subcategory._id.toString()}
                              className="pl-4">
                              — {subcategory.name}
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

            {/* Category Validation Error */}
            {errors.categoryId && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
                <AlertCircle size={14} />
                <span>{errors.categoryId.message}</span>
              </p>
            )}

            {/* Category Help Text */}
            {selectedCategory && !errors.categoryId && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <Info size={12} className="inline mr-1" />
                  {(() => {
                    const selected = categories
                      .flatMap((cat) => [cat, ...(cat.subcategories || [])])
                      .find((cat) => cat._id.toString() === selectedCategory);
                    return selected
                      ? `Selected: ${selected.name}${
                          selected.description
                            ? ` - ${selected.description}`
                            : ""
                        }`
                      : "Category selected";
                  })()}
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  rows={4}
                  className={`w-full px-4 py-3 rounded-lg border transition-colors resize-none ${
                    errors.description
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  placeholder="Describe your service in detail..."
                />
              )}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.description.message}
              </p>
            )}
          </div>
        </div>

        {/* Pricing Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 pb-2">
            Pricing Information
          </h3>

          {/* Pricing Type Toggle */}
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
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                )}
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Price based on service type (flexible pricing)
              </span>
              <div className="group relative">
                <Info
                  size={16}
                  className="text-gray-400 hover:text-gray-600 cursor-help"
                />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Check this if pricing varies by service complexity
                </div>
              </div>
            </label>
          </div>

          {/* Fixed Pricing Fields */}
          <AnimatePresence>
            {showPricingFields && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4">
                {/* Price Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price Description
                  </label>
                  <Controller
                    name="priceDescription"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="e.g., Starting from, Per hour, Fixed rate"
                      />
                    )}
                  />
                </div>

                {/* Base Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Base Price (GHS)
                  </label>
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
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          placeholder="0.00"
                        />
                      </div>
                    )}
                  />
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price Range (Optional)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Controller
                      name="priceRange.min"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">
                            Minimum
                          </label>
                          <input
                            {...field}
                            type="number"
                            min="0"
                            step="0.01"
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(
                                Number(e.target.value) || undefined
                              )
                            }
                            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            placeholder="0.00"
                          />
                        </div>
                      )}
                    />
                    <Controller
                      name="priceRange.max"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">
                            Maximum
                          </label>
                          <input
                            {...field}
                            type="number"
                            min="0"
                            step="0.01"
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(
                                Number(e.target.value) || undefined
                              )
                            }
                            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            placeholder="0.00"
                          />
                        </div>
                      )}
                    />
                    <Controller
                      name="priceRange.currency"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">
                            Currency
                          </label>
                          <select
                            {...field}
                            value={field.value || "GHS"}
                            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                            <option value="GHS">GHS</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                          </select>
                        </div>
                      )}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tags */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 pb-2">
            Tags
          </h3>

          {/* Tag Input */}
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
                onKeyPress={handleTagKeyPress}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Enter tags to help customers find your service"
                maxLength={50}
              />
            </div>
            <button
              type="button"
              onClick={handleAddTag}
              disabled={!tagInput.trim() || currentTags.length >= 10}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2">
              <Plus size={18} />
              <span>Add</span>
            </button>
          </div>

          {/* Tag List */}
          {currentTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {currentTags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                  {tag}
                  <Button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 hover:text-red-600 transition-colors">
                    <X size={14} />
                  </Button>
                </span>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-500">
            Add up to 10 tags. Tags help customers discover your service.
          </p>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          {service?.status === ServiceStatus.REJECTED && (
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
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
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
              }`}>
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : mode === "create" ? (
                <Send size={18} />
              ) : (
                <Save size={18} />
              )}
              <span>
                {isSubmitting
                  ? "Saving..."
                  : submitButtonText ||
                    (mode === "create" ? "Create Service" : "Update Service")}
              </span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ServiceForm;
