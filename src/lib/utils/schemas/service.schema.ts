// schemas/service.schema.ts
import { z } from "zod";
import { Types } from "mongoose";
import { ServiceStatus, ModerationStatus } from "@/types";

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

const priceRangeSchema = z.object({
  min: z.number().min(0, "Minimum price must be non-negative"),
  max: z.number().min(0, "Maximum price must be non-negative"),
  currency: z.string().length(3, "Currency must be a 3-letter code"),
}).refine(
  (data) => data.max >= data.min,
  {
    message: "Maximum price must be greater than or equal to minimum price",
    path: ["max"],
  }
);

// Service creation schema (for new services)
export const createServiceSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  priceDescription: z.string().optional(),
  priceBasedOnServiceType: z.boolean().default(false),
  categoryId: objectIdSchema,
  images: z.array(fileReferenceSchema).min(1, "At least one image is required"),
  isPopular: z.boolean().default(false),
  tags: z.array(z.string().min(1)).max(10, "Maximum 10 tags allowed"),
  basePrice: z.number().min(0, "Base price must be non-negative").optional(),
  priceRange: priceRangeSchema.optional(),
  slug: z.string().min(1, "Slug is required").regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must be lowercase with hyphens"
  ),
  metaDescription: z.string().max(160, "Meta description too long").optional(),
  submittedBy: objectIdSchema.optional(),
});

// Service update schema (for existing services)
export const updateServiceSchema = createServiceSchema.partial().extend({
  approvedBy: objectIdSchema.optional(),
  approvedAt: z.date().optional(),
  rejectedBy: objectIdSchema.optional(),
  rejectedAt: z.date().optional(),
  rejectionReason: z.string().optional(),
  moderationNotes: z.string().optional(),
  status: z.nativeEnum(ServiceStatus).optional(),
});

// Service filters schema
export const serviceFiltersSchema = z.object({
  categoryId: objectIdSchema.optional(),
  status: z.array(z.nativeEnum(ServiceStatus)).optional(),
  popular: z.boolean().optional(),
  search: z.string().optional(),
  priceRange: z.object({
    min: z.number().min(0).optional(),
    max: z.number().min(0).optional(),
  }).optional(),
  location: z.object({
    ghanaPostGPS: z.string().optional(),
    region: z.string().optional(),
    city: z.string().optional(),
    radius: z.number().positive().optional(),
  }).optional(),
  rating: z.number().min(0).max(5).optional(),
  moderationStatus: z.array(z.nativeEnum(ModerationStatus)).optional(),
});

// Service query parameters schema
export const serviceQueryParamsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.nativeEnum(ServiceStatus).optional(),
  popular: z.coerce.boolean().optional(),
});

// Complete service schema (for database operations)
export const serviceSchema = z.object({
  _id: objectIdSchema,
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  priceDescription: z.string().optional(),
  priceBasedOnServiceType: z.boolean(),
  categoryId: objectIdSchema,
  images: z.array(fileReferenceSchema),
  isPopular: z.boolean(),
  status: z.nativeEnum(ServiceStatus),
  tags: z.array(z.string()),
  basePrice: z.number().min(0).optional(),
  priceRange: priceRangeSchema.optional(),
  slug: z.string().min(1),
  metaDescription: z.string().optional(),
  submittedBy: objectIdSchema.optional(),
  approvedBy: objectIdSchema.optional(),
  approvedAt: z.date().optional(),
  rejectedBy: objectIdSchema.optional(),
  rejectedAt: z.date().optional(),
  rejectionReason: z.string().optional(),
  moderationNotes: z.string().optional(),
  
  // Base entity fields
  createdAt: z.date(),
  updatedAt: z.date(),
  
  // Soft deletable fields
  isDeleted: z.boolean().optional(),
  deletedAt: z.date().optional(),
  deletedBy: objectIdSchema.optional(),
});

// Service with category schema
export const serviceWithCategorySchema = serviceSchema.extend({
  category: z.object({
    _id: objectIdSchema,
    name: z.string(),
  }),
});

// Type exports for use in your application
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ServiceFiltersInput = z.infer<typeof serviceFiltersSchema>;
export type ServiceQueryParamsInput = z.infer<typeof serviceQueryParamsSchema>;
export type ServiceSchemaType = z.infer<typeof serviceSchema>;
export type ServiceWithCategoryType = z.infer<typeof serviceWithCategorySchema>;