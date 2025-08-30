// schemas/service.schema.ts
import { z } from "zod";
import { Types } from "mongoose";

// Base schemas for reusable components
const objectIdSchema = z
  .string()
  .refine((val) => Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId format",
  })
  .transform((val) => new Types.ObjectId(val));

const fileReferenceSchema = z.object({
  url: z.string().url("Invalid URL format"),
  fileName: z.string().min(1, "File name is required"),
  fileSize: z.number().positive().optional(),
  mimeType: z.string().optional(),
  uploadedAt: z.date().optional(),
});

const priceRangeSchema = z
  .object({
    min: z.number().min(0, "Minimum price must be non-negative"),
    max: z.number().min(0, "Maximum price must be non-negative"),
    currency: z.string().length(3, "Currency must be a 3-letter code"),
  })
  .refine((data) => data.max >= data.min, {
    message: "Maximum price must be greater than or equal to minimum price",
    path: ["max"],
  });

// Service creation schema (for new services)
export const createServiceSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  priceBasedOnServiceType: z.boolean().default(true),
  categoryId: objectIdSchema,
  images: z.array(fileReferenceSchema).min(1, "At least one image is required"),
  tags: z.array(z.string().min(1)).max(10, "Maximum 10 tags allowed"),

  // pricing options are only available when priceBasedOnServiceType is false
  priceDescription: z.string().optional(),
  basePrice: z.number().min(0, "Base price must be non-negative").optional(),
  priceRange: priceRangeSchema.optional(),
  submittedBy: objectIdSchema.optional(),
});
