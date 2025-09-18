import { z } from "zod";

// Enhanced Image Schema with better validation
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

// Enhanced Price Range Schema with validation
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
      .default("USD")
      .optional(),
  })
  .refine((data) => data.max >= data.min, {
    message: "Maximum price must be greater than or equal to minimum price",
    path: ["max"],
  });

// Enhanced Product Schema with comprehensive validation
const ProductSchema = z
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

    priceBasedOnServiceType: z.boolean(),

    categoryId: z.string().min(1, "Category ID is required"),

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
      // If not price-based on service type, basePrice should be provided
      if (!data.priceBasedOnServiceType && data.basePrice === undefined) {
        return false;
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
      // If basePrice is provided, it should be within the price range
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

// Type inference for TypeScript usage
export type Product = z.infer<typeof ProductSchema>;
export type Image = z.infer<typeof ImageSchema>;
export type PriceRange = z.infer<typeof PriceRangeSchema>;

export default ProductSchema;
