"use client";
import React, { useState, useCallback } from "react";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Save,
  Plus,
  X,
  AlertCircle,
  DollarSign,
  Tag,
  FileText,
  ImageIcon,
  Loader2,
  Check,
  ArrowLeft,
  Info,
} from "lucide-react";
import { toast } from "react-hot-toast";

// Mock imports - replace with actual imports in your project
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserService } from "@/hooks/public/services/use-service";
import { FileReference } from "@/lib/api/categories/categoryImage.api";
import { Service } from "@/types/service.types";
import { useCategories } from "@/hooks/public/categories/userCategory.hook";
import ServiceImageUpload from "./ServiceImageUpload";

// Enhanced validation schema
const ImageSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  fileName: z
    .string()
    .min(1, "File name cannot be empty")
    .max(255, "File name too long"),
  fileSize: z
    .number()
    .min(1, "File size must be greater than 0")
    .max(50 * 1024 * 1024, "File size cannot exceed 50MB"),
  mimeType: z
    .string()
    .regex(
      /^image\/(jpeg|jpg|png|gif|webp|svg\+xml)$/,
      "Invalid image MIME type"
    )
    .optional(),
  uploadedAt: z
    .union([
      z.string().datetime("Must be a valid ISO datetime string"),
      z.date(),
    ])
    .optional(),
});

const PriceRangeSchema = z
  .object({
    min: z.number().min(0, "Minimum price cannot be negative"),
    max: z.number().min(0, "Maximum price cannot be negative"),
    currency: z
      .string()
      .length(3, "Currency code must be 3 characters")
      .regex(
        /^[A-Z]{3}$/,
        "Currency must be uppercase ISO 4217 code (e.g., USD, EUR)"
      )
      .default("GHS"),
  })
  .refine((data) => data.max >= data.min, {
    message: "Maximum price must be greater than or equal to minimum price",
    path: ["max"],
  });

const ServiceFormSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(200, "Title cannot exceed 200 characters")
      .trim(),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .max(5000, "Description cannot exceed 5000 characters")
      .trim(),
    priceBasedOnServiceType: z.boolean().default(false),
    categoryId: z.string().min(1, "Category selection is required"),
    images: z
      .array(ImageSchema)
      .min(1, "At least one image is required")
      .max(10, "Maximum 10 images allowed"),
    tags: z
      .array(
        z
          .string()
          .min(1, "Tag cannot be empty")
          .max(50, "Tag cannot exceed 50 characters")
          .trim()
      )
      .max(20, "Maximum 20 tags allowed")
      .default([]),
    basePrice: z
      .number()
      .min(0, "Base price cannot be negative")
      .multipleOf(0.01, "Price must have at most 2 decimal places")
      .optional(),
    priceDescription: z
      .string()
      .max(500, "Price description cannot exceed 500 characters")
      .trim()
      .optional(),
    priceRange: PriceRangeSchema,
  })
  .refine(
    (data) => {
      // If priceBasedOnServiceType is false, basePrice is required
      if (!data.priceBasedOnServiceType) {
        return data.basePrice !== undefined && data.basePrice > 0;
      }
      return true;
    },
    {
      message: "Base price is required when price is not based on service type",
      path: ["basePrice"],
    }
  )
  .refine(
    (data) => {
      if (data.basePrice !== undefined) {
        return (
          data.basePrice >= data.priceRange.min &&
          data.basePrice <= data.priceRange.max
        );
      }
      return true;
    },
    {
      message: "Base price must be within the specified price range",
      path: ["basePrice"],
    }
  );

type ServiceFormData = z.infer<typeof ServiceFormSchema>;

interface ServiceFormProps {
  mode?: "create" | "edit";
  serviceId?: string;
  initialData?: Partial<Service>;
  onSuccess?: (service: Service) => void;
  onCancel?: () => void;
}

const ServiceForm: React.FC<ServiceFormProps> = ({
  mode = "create",
  serviceId,
  initialData,
  onSuccess,
  onCancel,
}) => {
  // Form state and validation
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isValid, isDirty },
    reset,
  } = useForm<ServiceFormData>({
    resolver: zodResolver(ServiceFormSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      priceBasedOnServiceType: initialData?.priceBasedOnServiceType ?? false,
      categoryId: initialData?.categoryId?.toString() || "",
      images: initialData?.images || [],
      tags: initialData?.tags || [],
      basePrice: initialData?.basePrice || undefined,
      priceDescription: initialData?.priceDescription || "",
      priceRange: {
        min: initialData?.priceRange?.min || 0,
        max: initialData?.priceRange?.max || 1000,
        currency: initialData?.priceRange?.currency || "GHS",
      },
    },
    mode: "onChange",
  });

  // Watch form values for dynamic behavior
  const watchedValues = watch();
  const priceBasedOnServiceType = watch("priceBasedOnServiceType");
  const images = watch("images");
  const tags = watch("tags");

  // Component state
  const [newTag, setNewTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Custom hooks
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useCategories({}, { includeServices: false });

  const { createService, updateService, currentService } = useUserService();

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
        // Remove image only if we have more than one
        const newImages = currentImages.filter((_, i) => i !== index);
        setValue("images", newImages, { shouldValidate: true });
      }
    },
    [getValues, setValue]
  );

  // Handle image upload error
  const handleImageError = useCallback((error: string) => {
    toast.error(`Image upload error: ${error}`);
  }, []);

  // Add new image slot
  const handleAddImageSlot = useCallback(() => {
    const currentImages = getValues("images");
    if (currentImages.length < 10) {
      // Add a placeholder that the ServiceImageUpload component will handle
      setValue("images", [...currentImages, {} as FileReference], {
        shouldValidate: false, // Don't validate until user uploads
      });
    }
  }, [getValues, setValue]);

  // Remove image slot
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
      // Filter out empty image objects
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

      // Reset form after successful creation (not update)
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

  if (categoriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-lg text-gray-600 dark:text-gray-300">
            Loading categories...
          </span>
        </div>
      </div>
    );
  }

  const isEditMode = mode === "edit";
  const title = isEditMode ? "Edit Service" : "Create New Service";
  const subtitle = isEditMode
    ? "Update your service information"
    : "Fill out the form below to list your service on our marketplace";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              {isEditMode && onCancel && (
                <Button variant="ghost" size="sm" onClick={onCancel}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {subtitle}
                </p>
              </div>
            </div>

            {/* Form Status Indicator */}
            <div className="flex items-center gap-2">
              {isDirty && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Unsaved changes
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {categoriesError && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 dark:text-red-300">
                Failed to load categories: {categoriesError}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form Content */}
          <div className="lg:col-span{keyword:1,span:2} space-y-8">
            {/* Basic Information */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Service Title */}
                <div>
                  <Label
                    htmlFor="title"
                    className="text-sm font-medium mb-2 block"
                  >
                    Service Title *
                  </Label>
                  <Controller
                    name="title"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="title"
                        placeholder="Enter a clear, descriptive title for your service"
                        className={`h-11 ${
                          errors.title ? "border-red-500" : ""
                        }`}
                      />
                    )}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.title.message}
                    </p>
                  )}
                </div>

                {/* Service Description */}
                <div>
                  <Label
                    htmlFor="description"
                    className="text-sm font-medium mb-2 block"
                  >
                    Service Description *
                  </Label>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        id="description"
                        rows={6}
                        placeholder="Provide a detailed description of your service, including what's included, your experience, and any special features..."
                        className={`resize-none ${
                          errors.description ? "border-red-500" : ""
                        }`}
                      />
                    )}
                  />
                  <div className="flex items-center justify-between mt-1">
                    {errors.description ? (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.description.message}
                      </p>
                    ) : (
                      <div />
                    )}
                    <p className="text-xs text-gray-500">
                      {watchedValues.description?.length || 0} / 5000
                    </p>
                  </div>
                </div>

                {/* Category Selection */}
                <div>
                  <Label
                    htmlFor="categoryId"
                    className="text-sm font-medium mb-2 block"
                  >
                    Service Category *
                  </Label>
                  <Controller
                    name="categoryId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger
                          className={`h-11 ${
                            errors.categoryId ? "border-red-500" : ""
                          }`}
                        >
                          <SelectValue placeholder="Select a category for your service" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem
                              key={category._id.toString()}
                              value={category._id.toString()}
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.categoryId && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.categoryId.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Service Images */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-blue-500" />
                    Service Images *
                    <span className="text-sm font-normal text-gray-500">
                      ({images.filter((img) => img.url).length}/{images.length})
                    </span>
                  </div>
                  {images.length < 10 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddImageSlot}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Image
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <ServiceImageUpload
                            service={currentService}
                            imageIndex={index}
                            onSuccess={(imageData) =>
                              handleImageUpload(imageData, index)
                            }
                            onError={handleImageError}
                            showLabel={index === 0}
                            allowRemove={images.length > 1}
                            size={index === 0 ? "xl" : "lg"}
                            shape="rounded"
                          />
                        </div>
                        {index > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveImageSlot(index)}
                            className="mt-2 text-gray-500 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      {index === 0 && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                          <Info className="w-3 h-3" />
                          Primary image - will be featured in search results
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {errors.images && (
                  <p className="text-sm text-red-600 mt-4 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.images.message}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Tag className="w-5 h-5 text-blue-500" />
                  Service Tags
                  <span className="text-sm font-normal text-gray-500">
                    ({tags.length}/20)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter a tag..."
                      disabled={tags.length >= 20}
                      className="h-11"
                    />
                    <Button
                      type="button"
                      onClick={handleAddTag}
                      disabled={
                        !newTag.trim() ||
                        tags.includes(newTag.trim()) ||
                        tags.length >= 20
                      }
                      className="px-6"
                    >
                      Add
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Tags help customers find your service more easily
                  </p>
                </div>

                {/* Display Tags */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1 py-1 px-3"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {errors.tags && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.tags.message}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing Information */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Price Type Toggle */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label
                        htmlFor="priceBasedOnServiceType"
                        className="text-sm font-medium"
                      >
                        Variable Pricing
                      </Label>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Price varies by service type
                      </p>
                    </div>
                    <Controller
                      name="priceBasedOnServiceType"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          id="priceBasedOnServiceType"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                </div>

                {/* Base Price */}
                {!priceBasedOnServiceType && (
                  <div>
                    <Label
                      htmlFor="basePrice"
                      className="text-sm font-medium mb-2 block"
                    >
                      Base Price (GHS) *
                    </Label>
                    <Controller
                      name="basePrice"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="basePrice"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined
                            )
                          }
                          value={field.value ?? ""}
                          className={`h-11 ${
                            errors.basePrice ? "border-red-500" : ""
                          }`}
                        />
                      )}
                    />
                    {errors.basePrice && (
                      <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.basePrice.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Price Range */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">
                    Price Range (GHS)
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label
                        htmlFor="priceRange.min"
                        className="text-xs text-gray-500 mb-1 block"
                      >
                        Minimum
                      </Label>
                      <Controller
                        name="priceRange.min"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            id="priceRange.min"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0"
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                            className={`h-10 ${
                              errors.priceRange?.min ? "border-red-500" : ""
                            }`}
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="priceRange.max"
                        className="text-xs text-gray-500 mb-1 block"
                      >
                        Maximum
                      </Label>
                      <Controller
                        name="priceRange.max"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            id="priceRange.max"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="1000"
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 1000)
                            }
                            className={`h-10 ${
                              errors.priceRange?.max ? "border-red-500" : ""
                            }`}
                          />
                        )}
                      />
                    </div>
                  </div>
                  {(errors.priceRange?.min || errors.priceRange?.max) && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.priceRange?.min?.message ||
                        errors.priceRange?.max?.message}
                    </p>
                  )}
                </div>

                {/* Price Description */}
                <div>
                  <Label
                    htmlFor="priceDescription"
                    className="text-sm font-medium mb-2 block"
                  >
                    Price Description
                  </Label>
                  <Controller
                    name="priceDescription"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        id="priceDescription"
                        rows={3}
                        placeholder="Explain your pricing structure..."
                        className={`resize-none ${
                          errors.priceDescription ? "border-red-500" : ""
                        }`}
                      />
                    )}
                  />
                  <div className="flex items-center justify-between mt-1">
                    {errors.priceDescription ? (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.priceDescription.message}
                      </p>
                    ) : (
                      <div />
                    )}
                    <p className="text-xs text-gray-500">
                      {watchedValues.priceDescription?.length || 0} / 500
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Card>
              <CardContent className="pt-6">
                <Button
                  type="submit"
                  onClick={handleSubmit(onSubmit)}
                  size="lg"
                  disabled={!isValid || isSubmitting}
                  className="w-full h-12"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {isEditMode ? "Updating..." : "Creating..."}
                    </>
                  ) : submitSuccess ? (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      {isEditMode ? "Updated!" : "Created!"}
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      {isEditMode ? "Update Service" : "Create Service"}
                    </>
                  )}
                </Button>

                {/* Form Status */}
                <div className="mt-4 text-center text-sm">
                  {!isValid && isDirty && (
                    <p className="text-red-600 flex items-center justify-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Please fix the errors above to continue
                    </p>
                  )}
                  {isValid && !isDirty && (
                    <p className="text-gray-500">
                      {isEditMode
                        ? "Make changes to update your service"
                        : "Fill out the form to create your service"}
                    </p>
                  )}
                  {isValid && isDirty && !isSubmitting && (
                    <p className="text-green-600 flex items-center justify-center gap-1">
                      <Check className="w-3 h-3" />
                      Form is ready to submit
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-blue-900 dark:text-blue-100">
                  <Info className="w-4 h-4" />
                  Tips for Success
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    Use high-quality, professional images
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    Write a detailed, clear description
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    Set competitive, fair pricing
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    Add relevant tags for discoverability
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceForm;
