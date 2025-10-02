import z from "zod";

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

export const ServiceFormSchema = z
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

// define your type somewhere
export type ServiceFormData = {
  title: string;
  description: string;
  priceBasedOnServiceType: boolean;
   usePriceRange?: boolean;
  categoryId: string;
  images: {
    url: string;
    fileName: string;
    fileSize: number;
    mimeType?: string;
    uploadedAt?: string | Date;
  }[];
  tags: string[];
  priceRange: {
    min: number;
    max: number;
    currency: string;
  };
  basePrice?: number;
  priceDescription?: string;
};
