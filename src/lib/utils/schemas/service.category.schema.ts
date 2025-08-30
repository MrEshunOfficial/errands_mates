// schemas/service.category.schema.ts
import { z } from "zod";
import { Types } from "mongoose";
import { ModerationStatus } from "@/types";

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

// Category creation schema (for new categories)
export const createCategorySchema = z.object({
  name: z.string()
    .min(1, "Category name is required")
    .max(100, "Category name too long")
    .trim(),
  description: z.string()
    .max(500, "Description too long")
    .optional(),
  image: fileReferenceSchema.optional(),
  tags: z.array(z.string().min(1))
    .max(20, "Maximum 20 tags allowed")
    .default([]),
  isActive: z.boolean().default(true),
  displayOrder: z.number()
    .int("Display order must be an integer")
    .min(0, "Display order must be non-negative")
    .default(0),
  parentCategoryId: objectIdSchema.optional(),
  slug: z.string()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase with hyphens only"
    ),
  metaDescription: z.string()
    .max(160, "Meta description too long")
    .optional(),
  createdBy: objectIdSchema.optional(),
});

// Category update schema (for existing categories)
export const updateCategorySchema = createCategorySchema.partial().extend({
  lastModifiedBy: objectIdSchema.optional(),
  moderationStatus: z.nativeEnum(ModerationStatus).optional(),
  isDeleted: z.boolean().optional(),
  deletedAt: z.date().optional(),
  deletedBy: objectIdSchema.optional(),
});

// Category filters schema
export const categoryFiltersSchema = z.object({
  name: z.string().optional(),
  isActive: z.boolean().optional(),
  parentCategoryId: objectIdSchema.optional(),
  moderationStatus: z.array(z.nativeEnum(ModerationStatus)).optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  includeDeleted: z.boolean().default(false),
});

// Category query parameters schema
export const categoryQueryParamsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("asc"),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  parentCategoryId: z.string().optional(),
  moderationStatus: z.nativeEnum(ModerationStatus).optional(),
  includeDeleted: z.coerce.boolean().default(false),
});

// Complete category schema (for database operations)
export const categorySchema = z.object({
  _id: objectIdSchema,
  name: z.string().min(1),
  description: z.string().optional(),
  image: fileReferenceSchema.optional(),
  tags: z.array(z.string()),
  isActive: z.boolean(),
  displayOrder: z.number().int().min(0),
  parentCategoryId: objectIdSchema.optional(),
  slug: z.string().min(1),
  metaDescription: z.string().optional(),
  createdBy: objectIdSchema.optional(),
  lastModifiedBy: objectIdSchema.optional(),
  moderationStatus: z.nativeEnum(ModerationStatus),
  
  // Base entity fields
  createdAt: z.date(),
  updatedAt: z.date(),
  
  // Soft deletable fields
  isDeleted: z.boolean().optional().default(false),
  deletedAt: z.date().optional(),
  deletedBy: objectIdSchema.optional(),
});

// Category hierarchy schema (for nested categories)
export const categoryHierarchySchema: z.ZodType<CategoryHierarchyType> = categorySchema.extend({
  subcategories: z.array(z.lazy(() => categoryHierarchySchema)).optional(),
  parentCategory: categorySchema.pick({
    _id: true,
    name: true,
    slug: true,
  }).optional(),
});

// Define the hierarchy type first for the recursive reference
export type CategoryHierarchyType = z.infer<typeof categorySchema> & {
  subcategories?: CategoryHierarchyType[];
  parentCategory?: Pick<z.infer<typeof categorySchema>, '_id' | 'name' | 'slug'>;
};

// Category with service count schema
export const categoryWithStatsSchema = categorySchema.extend({
  serviceCount: z.number().int().min(0).default(0),
  activeServiceCount: z.number().int().min(0).default(0),
});

// Bulk category operations
export const bulkCategoryUpdateSchema = z.object({
  categoryIds: z.array(objectIdSchema).min(1, "At least one category ID required"),
  updates: z.object({
    isActive: z.boolean().optional(),
    moderationStatus: z.nativeEnum(ModerationStatus).optional(),
    displayOrder: z.number().int().min(0).optional(),
    lastModifiedBy: objectIdSchema.optional(),
  }).refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be updated"
  ),
});

// Category soft delete schema
export const softDeleteCategorySchema = z.object({
  categoryId: objectIdSchema,
  deletedBy: objectIdSchema.optional(),
  cascadeToServices: z.boolean().default(false),
});

// Category restore schema
export const restoreCategorySchema = z.object({
  categoryId: objectIdSchema,
  restoredBy: objectIdSchema.optional(),
});

// Type exports for use in your application
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryFiltersInput = z.infer<typeof categoryFiltersSchema>;
export type CategoryQueryParamsInput = z.infer<typeof categoryQueryParamsSchema>;
export type CategorySchemaType = z.infer<typeof categorySchema>;
// CategoryHierarchyType is already defined above
export type CategoryWithStatsType = z.infer<typeof categoryWithStatsSchema>;
export type BulkCategoryUpdateInput = z.infer<typeof bulkCategoryUpdateSchema>;
export type SoftDeleteCategoryInput = z.infer<typeof softDeleteCategorySchema>;
export type RestoreCategoryInput = z.infer<typeof restoreCategorySchema>;