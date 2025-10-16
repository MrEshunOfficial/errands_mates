import { Types } from "mongoose";
import { BaseEntity, SoftDeletable, ServiceStatus, ModerationStatus } from "./base.types";
import { FileReference } from "@/lib/api/categories/categoryImage.api";
import { IUser } from "./user.types";
import { Category } from "./category.types";
export interface SubmittedBy {
  _id: string;
  name?: string;
  email?: string;
  serviceUserId?: string;
  [key: string]: unknown;
}

export interface Service extends BaseEntity, SoftDeletable {
  user: IUser | Types.ObjectId;
  title: string;
  description: string;
  priceDescription?: string;
  priceBasedOnServiceType: boolean;
 categoryId: Types.ObjectId;
  category?: Category; 
  images: FileReference[];
  isPopular: boolean;
  status: ServiceStatus;
  tags: string[];
  basePrice?: number;
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
  providerCount?: number;
  providers?: Types.ObjectId[];
  slug: string;
  submittedBy?: SubmittedBy;
  approvedBy?: SubmittedBy;
  approvedAt?: Date;
  rejectedBy?: SubmittedBy;
  rejectedAt?: Date;
  rejectionReason?: string;
  moderationNotes?: string;
  metaDescription?: string;
}


export interface ServiceFilters {
  categoryId?: Types.ObjectId;
  status?: ServiceStatus[];
  popular?: boolean;
  search?: string;
  priceRange?: {
    min?: number;
    max?: number;
  };
  location?: {
    ghanaPostGPS?: string;
    region?: string;
    city?: string;
    radius?: number;
  };
  rating?: number;
  moderationStatus?: ModerationStatus[];
}

export interface ServiceWithCategory extends Service {
  category: Category;
}

export interface ServiceQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
  categoryId?: string;
  status?: ServiceStatus;
  popular?: boolean;
}

