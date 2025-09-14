
// types/category.types.ts
import { Types } from "mongoose";
import { BaseEntity, SoftDeletable } from "./base.types";
import { ModerationStatus } from "./base.types";
import { Service } from "./service.types";
import { FileReference } from "@/lib/api/categories/categoryImage.api";

export interface Category extends BaseEntity, SoftDeletable {
  name: string;
  description?: string;
  image?: FileReference;
  tags: string[];
  isActive: boolean;
  displayOrder: number;
  parentCategoryId?: Types.ObjectId;

  slug: string;
  metaDescription?: string;

  createdBy?: Types.ObjectId;
  lastModifiedBy?: Types.ObjectId;
  moderationStatus: ModerationStatus;
  moderationNotes?: string;

  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;

  // Instance methods
  softDelete(deletedBy?: Types.ObjectId): Promise<Category>;
  restore(): Promise<Category>;

  moderatedBy?: Types.ObjectId;

  // Instance methods
  softDelete(deletedBy?: Types.ObjectId): Promise<Category>;
  restore(): Promise<Category>;
}

// Extended category with services and subcategories (populated/aggregated)
export interface CategoryWithServices extends Category {
  services: Service[];
  servicesCount: number;
  subcategories?: CategoryWithServices[];
}

// Populated user type
export interface PopulatedUser {
  _id: Types.ObjectId;
  name?: string;
  email?: string;
  displayName?: string;
}

// For API responses where we know these fields are populated
export interface CategoryDetails extends Omit<Category, "createdBy" | "lastModifiedBy"> {
  services?: Service[];
  servicesCount?: number;
  subcategories?: CategoryDetails[];

  createdBy?: PopulatedUser;
  lastModifiedBy?: PopulatedUser;
}

// For stats and admin views
export interface CategoryWithStats extends CategoryWithServices {
  activeServiceCount?: number;
  popularServices?: Service[];
  totalBookings?: number;
  averageRating?: number;
}

// Category filters
export interface CategoryFilters {
  isActive?: boolean;
  moderationStatus?: ModerationStatus[];
  parentCategoryId?: string;
  search?: string;
  hasServices?: boolean;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
}

