// schemas/service.category.schema.ts
import { z } from "zod";
import { Types } from "mongoose";

// Base ObjectId schema
const objectIdSchema = z
  .string()
  .refine((val) => Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId format",
  })
  .transform((val) => new Types.ObjectId(val));

// File reference schema for category image
const fileReferenceSchema = z.object({
  url: z.string().url("Invalid URL format"),
  fileName: z.string().min(1, "File name is required"),
  fileSize: z.number().positive().optional(),
  mimeType: z.string().optional(),
  uploadedAt: z.date().optional(),
});

// Schema (updated to match your API types)
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(100, "Category name too long")
    .trim(),
  description: z.string().max(500, "Description too long").optional(),
  image: fileReferenceSchema.optional(),
  tags: z
    .array(z.string().min(1))
    .max(20, "Maximum 20 tags allowed")
    .default([]),
  isActive: z.boolean().default(true),
  parentCategoryId: z.string().optional(),
  createdBy: objectIdSchema.optional(),
});
