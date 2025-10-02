import { Category } from "@/types";

export interface FileReference {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType?: string;
  uploadedAt?: Date | string;
}

export interface CategoryImageResponse {
  success: boolean;
  message?: string;
  data?: {
    image?: FileReference;
    hasImage: boolean;
    categoryName: string;
    categorySlug: string;
    categoryActive?: boolean;
    category?: Category;
    newImage?: FileReference;
    oldImage?: FileReference;
    wasReplaced?: boolean;
    deletedImage?: FileReference;
  };
  error?: string;
}

export interface BatchCategoryImagesResponse {
  success: boolean;
  message?: string;
  data?: {
    categories: Array<{
      categoryId: string;
      categoryName: string;
      categorySlug: string;
      isActive: boolean;
      hasImage: boolean;
      image: FileReference | null;
    }>;
    total: number;
    requestedCount: number;
  };
  error?: string;
}

export interface UploadImageRequest {
  image: {
    url: string;
    fileName: string;
    fileSize?: number;
    mimeType?: string;
    uploadedAt?: Date | string;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";
const CATEGORIES_ENDPOINT = `${API_BASE_URL}/categories`;

export class CategoryImageService {
  private static getAuthHeaders(): HeadersInit {
    const token =
      localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private static async handleResponse<T>(
    response: Response,
    endpoint?: string
  ): Promise<T> {
    if (!response.ok) {
      // Enhanced error logging
      console.error(
        `API Error - Endpoint: ${endpoint}, Status: ${response.status}, URL: ${response.url}`
      );

      let errorData;
      try {
        errorData = await response.json();
      } catch (parseError) {
        console.error("Failed to parse error response:", parseError);
        errorData = {};
      }

      // Handle different error scenarios
      const errorMessage =
        errorData?.message ||
        errorData?.error ||
        `HTTP error! status: ${response.status}`;

      if (response.status === 404) {
        throw new Error(`Resource not found: ${errorMessage}`);
      } else if (response.status === 401) {
        throw new Error("Unauthorized - please check authentication");
      } else if (response.status === 403) {
        throw new Error("Forbidden - insufficient permissions");
      }

      throw new Error(errorMessage);
    }
    return response.json();
  }

  static async getCategoryImage(
    categoryId: string
  ): Promise<CategoryImageResponse> {
    if (!categoryId || categoryId.trim() === "") {
      throw new Error("Category ID is required");
    }

    const endpoint = `${CATEGORIES_ENDPOINT}/${categoryId}/images`;

    try {
      console.log(`Fetching category image from: ${endpoint}`);

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return await this.handleResponse<CategoryImageResponse>(
        response,
        endpoint
      );
    } catch (error) {
      console.error("Error fetching category image:", error);

      // If it's a 404, return a default response instead of throwing
      if (
        error instanceof Error &&
        error.message.includes("Resource not found")
      ) {
        return {
          success: false,
          message: "Category image not found",
          data: {
            hasImage: false,
            categoryName: "Unknown Category",
            categorySlug: categoryId,
            categoryActive: false,
          },
          error: error.message,
        };
      }

      throw error;
    }
  }

  static async getCategoryImageBySlug(
    slug: string
  ): Promise<CategoryImageResponse> {
    if (!slug || slug.trim() === "") {
      throw new Error("Category slug is required");
    }

    const endpoint = `${CATEGORIES_ENDPOINT}/slug/${slug}/images`;

    try {
      console.log(`Fetching category image by slug from: ${endpoint}`);

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return await this.handleResponse<CategoryImageResponse>(
        response,
        endpoint
      );
    } catch (error) {
      console.error("Error fetching category image by slug:", error);
      throw error;
    }
  }

  static async getBatchCategoryImages(
    categoryIds: string[]
  ): Promise<BatchCategoryImagesResponse> {
    if (!categoryIds || categoryIds.length === 0) {
      throw new Error("Category IDs are required");
    }

    const ids = categoryIds.join(",");
    const endpoint = `${CATEGORIES_ENDPOINT}/images/batch?ids=${encodeURIComponent(
      ids
    )}`;

    try {
      console.log(`Fetching batch category images from: ${endpoint}`);

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return await this.handleResponse<BatchCategoryImagesResponse>(
        response,
        endpoint
      );
    } catch (error) {
      console.error("Error fetching batch category images:", error);
      throw error;
    }
  }

  static async uploadCategoryImage(
    categoryId: string,
    imageData: UploadImageRequest
  ): Promise<CategoryImageResponse> {
    if (!categoryId || categoryId.trim() === "") {
      throw new Error("Category ID is required");
    }

    // Note: Upload uses the base categories endpoint, not the specific category endpoint
    const endpoint = `${CATEGORIES_ENDPOINT}/`;

    try {
      console.log(`Uploading category image to: ${endpoint}`);

      // Add categoryId to the request body for uploads
      const requestBody = {
        ...imageData,
        categoryId: categoryId,
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody),
      });

      return await this.handleResponse<CategoryImageResponse>(
        response,
        endpoint
      );
    } catch (error) {
      console.error("Error uploading category image:", error);
      throw error;
    }
  }

  static async updateCategoryImage(
    categoryId: string,
    imageData: UploadImageRequest
  ): Promise<CategoryImageResponse> {
    if (!categoryId || categoryId.trim() === "") {
      throw new Error("Category ID is required");
    }

    const endpoint = `${CATEGORIES_ENDPOINT}/${categoryId}/images`;

    try {
      console.log(`Updating category image at: ${endpoint}`);

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(imageData),
      });

      return await this.handleResponse<CategoryImageResponse>(
        response,
        endpoint
      );
    } catch (error) {
      console.error("Error updating category image:", error);
      throw error;
    }
  }

  static async replaceCategoryImage(
    categoryId: string,
    imageData: UploadImageRequest
  ): Promise<CategoryImageResponse> {
    if (!categoryId || categoryId.trim() === "") {
      throw new Error("Category ID is required");
    }

    // Use the existing category update endpoint
    const endpoint = `${CATEGORIES_ENDPOINT}/${categoryId}`;

    try {
      console.log(`Updating category image at: ${endpoint}`);

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ image: imageData.image }),
      });

      return await this.handleResponse<CategoryImageResponse>(
        response,
        endpoint
      );
    } catch (error) {
      console.error("Error replacing category image:", error);
      throw error;
    }
  }
  static async deleteCategoryImage(
    categoryId: string
  ): Promise<CategoryImageResponse> {
    if (!categoryId || categoryId.trim() === "") {
      throw new Error("Category ID is required");
    }

    const endpoint = `${CATEGORIES_ENDPOINT}/${categoryId}/images`;

    try {
      console.log(`Deleting category image at: ${endpoint}`);

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse<CategoryImageResponse>(
        response,
        endpoint
      );
    } catch (error) {
      console.error("Error deleting category image:", error);
      throw error;
    }
  }

  static validateImageFile(file: File): { isValid: boolean; error?: string } {
    const maxFileSize = 5 * 1024 * 1024;
    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (file.size > maxFileSize) {
      return { isValid: false, error: "Image file size cannot exceed 5MB" };
    }
    if (!allowedMimeTypes.includes(file.type)) {
      return {
        isValid: false,
        error:
          "Invalid image format. Only JPEG, PNG, WebP, and GIF are allowed",
      };
    }
    return { isValid: true };
  }

  static createImageUploadData(
    file: File,
    uploadedUrl: string
  ): UploadImageRequest {
    return {
      image: {
        url: uploadedUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        uploadedAt: new Date(),
      },
    };
  }

  static async categoryHasImage(categoryId: string): Promise<boolean> {
    try {
      const result = await this.getCategoryImage(categoryId);
      return result.data?.hasImage || false;
    } catch (error) {
      console.error("Error checking if category has image:", error);
      return false;
    }
  }

  static async getCategoryImageUrl(categoryId: string): Promise<string | null> {
    try {
      const result = await this.getCategoryImage(categoryId);
      return result.data?.image?.url || null;
    } catch (error) {
      console.error("Error getting category image URL:", error);
      return null;
    }
  }

  static async getCategoriesWithImages(
    categoryIds: string[]
  ): Promise<Record<string, boolean>> {
    try {
      const result = await this.getBatchCategoryImages(categoryIds);
      const imageStatus: Record<string, boolean> = {};
      result.data?.categories.forEach((category) => {
        imageStatus[category.categoryId] = category.hasImage;
      });
      return imageStatus;
    } catch (error) {
      console.error("Error checking categories with images:", error);
      return {};
    }
  }
}