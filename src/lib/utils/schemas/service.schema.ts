// schemas/service.schema.ts
import { z } from "zod";
import mongoose from "mongoose";

// Base schemas that match your actual FileReference interface
const fileReferenceSchema = z.object({
  url: z.string().url("Invalid URL format"),
  fileName: z.string().min(1, "File name is required"),
  fileSize: z.number().positive().optional(),
  mimeType: z.string().optional(),
  uploadedAt: z.date().optional().default(() => new Date()),
});

const priceRangeSchema = z
  .object({
    min: z.number().min(0, "Minimum price must be non-negative"),
    max: z.number().min(0, "Maximum price must be non-negative"),
    currency: z.string().length(3, "Currency must be a 3-letter code").default("GHS"),
  })
  .refine((data) => data.max >= data.min, {
    message: "Maximum price must be greater than or equal to minimum price",
    path: ["max"],
  });

// Form-specific schema that matches ServiceFormData exactly
export const createServiceSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  priceBasedOnServiceType: z.boolean().default(true),
  categoryId: z.string().min(1, "Category is required"), // Keep as string for form
  images: z.array(fileReferenceSchema).min(1, "At least one image is required"),
  tags: z.array(z.string().min(1)).max(10, "Maximum 10 tags allowed").default([]),
  
  // Pricing fields - optional when priceBasedOnServiceType is true
  priceDescription: z.string().optional(),
  basePrice: z.number().min(0, "Base price must be non-negative").optional(),
  priceRange: priceRangeSchema.optional(),
});

// API schema that converts string categoryId to ObjectId (for backend)
export const serviceAPISchema = createServiceSchema.extend({
  categoryId: z.string().transform((val) => new mongoose.Types.ObjectId(val)),
});

// Type exports that match the schemas exactly
export type ServiceFormData = z.infer<typeof createServiceSchema>;
export type ServiceAPIData = z.infer<typeof serviceAPISchema>;

// Validation helpers
export const validateServiceForm = (data: unknown) => {
  return createServiceSchema.safeParse(data);
};

export const validateServiceAPI = (data: unknown) => {
  return serviceAPISchema.safeParse(data);
};