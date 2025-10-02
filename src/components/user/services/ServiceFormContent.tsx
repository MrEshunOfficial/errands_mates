import React from "react";
import {
  Control,
  UseFormWatch,
  UseFormGetValues,
  UseFormSetValue,
  FieldErrors,
} from "react-hook-form";
import {
  Plus,
  X,
  AlertCircle,
  DollarSign,
  Tag,
  FileText,
  ImageIcon,
  Info,
  ChevronRight,
  Upload,
  Star,
  ArrowLeft,
} from "lucide-react";

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
import { Service } from "@/types/service.types";
import { Category } from "@/types/category.types";
import ServiceImageUpload from "./ServiceImageUpload";
import { ServiceFormData } from "@/lib/utils/schemas/service.schema";
import { Controller } from "react-hook-form";
import { FileReference } from "@/lib/api/categories/categoryImage.api";

interface ServiceFormContentProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  control: Control<ServiceFormData>;
  watch: UseFormWatch<ServiceFormData>;
  getValues: UseFormGetValues<ServiceFormData>;
  setValue: UseFormSetValue<ServiceFormData>;
  errors: FieldErrors<ServiceFormData>;
  categories: Category[];
  currentService?: Service | null;
  newTag: string;
  setNewTag: (tag: string) => void;
  handleAddTag: () => void;
  handleRemoveTag: (tag: string) => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  handleImageUpload: (imageData: FileReference, index: number) => void;
  handleImageError: (error: string) => void;
  handleAddImageSlot: () => void;
  handleRemoveImageSlot: (index: number) => void;
}

const ServiceFormContent: React.FC<ServiceFormContentProps> = ({
  currentStep,
  setCurrentStep,
  control,
  watch,
  setValue,
  errors,
  categories,
  currentService,
  newTag,
  setNewTag,
  handleAddTag,
  handleRemoveTag,
  handleKeyPress,
  handleImageUpload,
  handleImageError,
  handleAddImageSlot,
  handleRemoveImageSlot,
}) => {
  const watchedValues = watch();
  const priceBasedOnServiceType = watch("priceBasedOnServiceType");
  const usePriceRange = watch("usePriceRange");
  const images = watch("images");
  const tags = watch("tags");

  return (
    <>
      {/* Basic Information Step */}
      {currentStep === 0 && (
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50 shadow-xl">
          <CardHeader className="border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Basic Information</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Tell customers what service you&apos;re offering
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            {/* Service Title */}
            <div className="space-y-3">
              <Label
                htmlFor="title"
                className="text-base font-semibold flex items-center gap-2"
              >
                Service Title
                <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="title"
                    placeholder="e.g., Professional Photography for Events"
                    className={`h-12 text-lg bg-gray-50 dark:bg-gray-900 border-2 transition-all focus:bg-white dark:focus:bg-gray-800 ${
                      errors.title
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-200 dark:border-gray-600 focus:border-blue-500"
                    }`}
                  />
                )}
              />
              {errors.title && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{errors.title.message}</span>
                </div>
              )}
            </div>

            {/* Category Selection */}
            <div className="space-y-3">
              <Label
                htmlFor="categoryId"
                className="text-base font-semibold flex items-center gap-2"
              >
                Service Category
                <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger
                      className={`h-12 bg-gray-50 dark:bg-gray-900 border-2 transition-all focus:bg-white dark:focus:bg-gray-800 ${
                        errors.categoryId
                          ? "border-red-300"
                          : "border-gray-200 dark:border-gray-600"
                      }`}
                    >
                      <SelectValue placeholder="Choose the category that best fits your service" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem
                          key={category._id.toString()}
                          value={category._id.toString()}
                          className="py-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                {category.name.charAt(0)}
                              </span>
                            </div>
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.categoryId && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{errors.categoryId.message}</span>
                </div>
              )}
            </div>

            {/* Service Description */}
            <div className="space-y-3">
              <Label
                htmlFor="description"
                className="text-base font-semibold flex items-center gap-2"
              >
                Service Description
                <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    id="description"
                    rows={6}
                    placeholder="Describe your service in detail. What do you offer? What makes you unique? Include your experience, process, and what customers can expect..."
                    className={`text-base bg-gray-50 dark:bg-gray-900 border-2 transition-all focus:bg-white dark:focus:bg-gray-800 resize-none ${
                      errors.description
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-200 dark:border-gray-600 focus:border-blue-500"
                    }`}
                  />
                )}
              />
              <div className="flex items-center justify-between">
                {errors.description ? (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">
                      {errors.description.message}
                    </span>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    A detailed description helps customers understand your
                    service better
                  </div>
                )}
                <div className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                  {watchedValues.description?.length || 0} / 5000
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={() => setCurrentStep(1)}
                size="lg"
                className="px-8 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                disabled={
                  !watchedValues.title ||
                  !watchedValues.description ||
                  !watchedValues.categoryId
                }
              >
                Continue to Images
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Images Step */}
      {currentStep === 1 && (
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50 shadow-xl">
          <CardHeader className="border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Service Images</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Showcase your work with high-quality images (
                    {images.filter((img) => img.url).length}/10)
                  </p>
                </div>
              </div>

              {images.length < 10 && (
                <Button
                  variant="outline"
                  onClick={handleAddImageSlot}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Add Image
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-8">
            {images.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900">
                <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  No images added yet
                </h3>
                <p className="text-gray-500 dark:text-gray-500 mb-6">
                  Add at least one image to showcase your service
                </p>
                <Button
                  onClick={handleAddImageSlot}
                  size="lg"
                  className="gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Upload First Image
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Primary Image */}
                {images[0] && (
                  <div className="relative">
                    <div className="absolute -top-2 -left-2 z-10 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Primary Image
                    </div>
                    <ServiceImageUpload
                      service={currentService}
                      imageIndex={0}
                      onSuccess={(imageData) => {
                        if (imageData) {
                          handleImageUpload(imageData, 0);
                        }
                      }}
                      onError={handleImageError}
                      showLabel={false}
                      allowRemove={false}
                      size="xl"
                      shape="rounded"
                    />
                  </div>
                )}

                {/* Additional Images Grid */}
                {images.length > 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {images.slice(1).map((image, index) => (
                      <div key={index + 1} className="relative group">
                        <ServiceImageUpload
                          service={currentService}
                          imageIndex={index + 1}
                          onSuccess={(imageData) => {
                            if (imageData) {
                              handleImageUpload(imageData, index + 1);
                            }
                          }}
                          onError={handleImageError}
                          showLabel={false}
                          allowRemove={true}
                          size="lg"
                          shape="rounded"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveImageSlot(index + 1)}
                          className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {errors.images && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mt-6">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{errors.images.message}</span>
              </div>
            )}

            {/* Tips */}
            <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Image Tips
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>
                      • Use high-resolution images (at least 1200x800 pixels)
                    </li>
                    <li>• Show your work in action or completed results</li>
                    <li>• Include before/after photos if applicable</li>
                    <li>• Keep images professional and well-lit</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(0)}
                size="lg"
                className="px-8"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Basic Info
              </Button>
              <Button
                onClick={() => setCurrentStep(2)}
                size="lg"
                className="px-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                disabled={images.filter((img) => img.url).length === 0}
              >
                Continue to Pricing
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Step */}
      {currentStep === 2 && (
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50 shadow-xl">
          <CardHeader className="border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-green-50 to-teal-50 dark:from-gray-800 dark:to-gray-800 rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Pricing Strategy</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Set competitive and fair pricing for your service
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            {/* Variable Pricing Toggle */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <Label
                    htmlFor="priceBasedOnServiceType"
                    className="text-base font-semibold"
                  >
                    Variable Pricing
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Enable this if your pricing varies significantly based on
                    specific requirements, project scope, or different service
                    types. Customers will need to contact you for quotes.
                  </p>
                </div>
                <div className="ml-6">
                  <Controller
                    name="priceBasedOnServiceType"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        id="priceBasedOnServiceType"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="scale-125"
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Fixed Price Section */}
            {!priceBasedOnServiceType && (
              <div className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                {/* Pricing Type Toggle */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label
                        htmlFor="usePriceRange"
                        className="text-base font-semibold"
                      >
                        Use Price Range
                      </Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Toggle ON for flexible pricing (min-max range) or OFF
                        for a single fixed price
                      </p>
                    </div>
                    <div className="ml-6">
                      <Controller
                        name="usePriceRange"
                        control={control}
                        render={({ field }) => (
                          <Switch
                            id="usePriceRange"
                            checked={field.value || false}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              if (checked) {
                                setValue("basePrice", undefined);
                              } else {
                                setValue("priceRange.min", 0);
                                setValue("priceRange.max", 1000);
                              }
                            }}
                            className="scale-125"
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Fixed Base Price */}
                {!usePriceRange && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <Label
                        htmlFor="basePrice"
                        className="text-base font-semibold"
                      >
                        Fixed Base Price (GHS)
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                    </div>
                    <Controller
                      name="basePrice"
                      control={control}
                      render={({ field }) => (
                        <div className="relative">
                          <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                          <Input
                            id="basePrice"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Enter your base price"
                            onChange={(e) => {
                              const value =
                                e.target.value === ""
                                  ? undefined
                                  : parseFloat(e.target.value);
                              field.onChange(value);
                            }}
                            value={field.value === undefined ? "" : field.value}
                            className={`h-14 pl-12 text-xl font-semibold bg-gray-50 dark:bg-gray-900 border-2 transition-all ${
                              errors.basePrice
                                ? "border-red-300"
                                : "border-gray-200 dark:border-gray-600 focus:border-green-500"
                            }`}
                          />
                        </div>
                      )}
                    />
                    {errors.basePrice && (
                      <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">
                          {errors.basePrice.message}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Price Range */}
                {usePriceRange && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <h3 className="text-lg font-semibold">
                        Price Range
                        <span className="text-red-500 ml-1">*</span>
                      </h3>
                      <span className="text-sm text-gray-500">
                        (Set minimum and maximum prices)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label
                          htmlFor="priceRange.min"
                          className="text-sm font-medium text-gray-600 dark:text-gray-400"
                        >
                          Minimum Price (GHS)
                        </Label>
                        <Controller
                          name="priceRange.min"
                          control={control}
                          render={({ field }) => (
                            <Input
                              id="priceRange.min"
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="Minimum"
                              onChange={(e) => {
                                const value =
                                  e.target.value === ""
                                    ? undefined
                                    : parseFloat(e.target.value);
                                field.onChange(value);
                              }}
                              value={
                                field.value === undefined || field.value === 0
                                  ? ""
                                  : field.value
                              }
                              className={`h-12 text-lg bg-gray-50 dark:bg-gray-900 border-2 ${
                                errors.priceRange?.min
                                  ? "border-red-300"
                                  : "border-gray-200 dark:border-gray-600 focus:border-blue-500"
                              }`}
                            />
                          )}
                        />
                      </div>
                      <div className="space-y-3">
                        <Label
                          htmlFor="priceRange.max"
                          className="text-sm font-medium text-gray-600 dark:text-gray-400"
                        >
                          Maximum Price (GHS)
                        </Label>
                        <Controller
                          name="priceRange.max"
                          control={control}
                          render={({ field }) => (
                            <Input
                              id="priceRange.max"
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="Maximum"
                              onChange={(e) => {
                                const value =
                                  e.target.value === ""
                                    ? undefined
                                    : parseFloat(e.target.value);
                                field.onChange(value);
                              }}
                              value={
                                field.value === undefined ||
                                field.value === 1000
                                  ? ""
                                  : field.value
                              }
                              className={`h-12 text-lg bg-gray-50 dark:bg-gray-900 border-2 ${
                                errors.priceRange?.max
                                  ? "border-red-300"
                                  : "border-gray-200 dark:border-gray-600 focus:border-blue-500"
                              }`}
                            />
                          )}
                        />
                      </div>
                    </div>
                    {(errors.priceRange?.min || errors.priceRange?.max) && (
                      <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">
                          {errors.priceRange?.min?.message ||
                            errors.priceRange?.max?.message}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Price Description */}
                <div className="space-y-3">
                  <Label
                    htmlFor="priceDescription"
                    className="text-base font-medium"
                  >
                    Pricing Details
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      (Optional)
                    </span>
                  </Label>
                  <Controller
                    name="priceDescription"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        id="priceDescription"
                        rows={4}
                        placeholder="Explain your pricing structure, what's included, additional costs, payment terms, etc..."
                        className={`bg-gray-50 dark:bg-gray-900 border-2 transition-all resize-none ${
                          errors.priceDescription
                            ? "border-red-300"
                            : "border-gray-200 dark:border-gray-600 focus:border-green-500"
                        }`}
                      />
                    )}
                  />
                  <div className="flex items-center justify-between">
                    {errors.priceDescription ? (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">
                          {errors.priceDescription.message}
                        </span>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        Help customers understand your pricing structure
                      </div>
                    )}
                    <div className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                      {watchedValues.priceDescription?.length || 0} / 500
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                size="lg"
                className="px-8"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Images
              </Button>
              <Button
                onClick={() => setCurrentStep(3)}
                size="lg"
                className="px-8 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
                disabled={
                  !priceBasedOnServiceType &&
                  (!usePriceRange
                    ? !watchedValues.basePrice
                    : !watchedValues.priceRange?.min ||
                      !watchedValues.priceRange?.max)
                }
              >
                Continue to Tags
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tags Step */}
      {currentStep === 3 && (
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50 shadow-xl">
          <CardHeader className="border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-800 rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                <Tag className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Service Tags</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Help customers discover your service ({tags.length}/20)
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            {/* Tag Input */}
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter a tag (e.g., photography, weddings, professional)..."
                    disabled={tags.length >= 20}
                    className="h-12 text-base bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-600 focus:border-orange-500"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleAddTag}
                  disabled={
                    !newTag.trim() ||
                    tags.includes(newTag.trim()) ||
                    tags.length >= 20
                  }
                  size="lg"
                  className="px-6 bg-orange-500 hover:bg-orange-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Tag
                </Button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-2">Tag suggestions:</p>
                    <p>
                      Include skills, specialties, tools you use, industries you
                      serve, and service types. Examples: &quot;wedding
                      photography&quot;, &quot;adobe photoshop&quot;,
                      &quot;portrait&quot;, &quot;commercial&quot;,
                      &quot;editing&quot;
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Display Tags */}
            {tags.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-base font-semibold">Your Tags</h3>
                <div className="flex flex-wrap gap-3">
                  {tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-2 py-2 px-4 text-sm bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 border border-orange-200 dark:border-orange-800 hover:from-orange-200 hover:to-red-200 dark:hover:from-orange-900/50 dark:hover:to-red-900/50 transition-all"
                    >
                      <span className="font-medium">{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:bg-red-200 dark:hover:bg-red-800 rounded-full p-1 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900">
                <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  No tags added yet
                </h3>
                <p className="text-gray-500">
                  Add some tags to help customers find your service
                </p>
              </div>
            )}

            {errors.tags && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{errors.tags.message}</span>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-end pt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
                size="lg"
                className="px-8"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Pricing
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default ServiceFormContent;
