import { IdDetails, FileReference, idType } from "@/types/base.types";

// Custom error class for ID details API errors
export class IdDetailsAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public data?: unknown
  ) {
    super(message);
    this.name = "IdDetailsAPIError";
  }
}

// ===================================================================
// REQUEST/RESPONSE TYPES - UPDATED TO MATCH BACKEND
// ===================================================================

export interface UpdateIdDetailsData {
  idDetails: Partial<IdDetails>;
}

export interface UpdateFieldData {
  value: unknown;
}

export interface ValidationResult {
  hasIdDetails: boolean;
  isComplete: boolean;
  missing: string[];
  errors: string[];
}

export interface IdDetailsResponse {
  message: string;
  user?: {
    _id: string;
    email: string;
    name: string;
    displayName?: string;
  };
  profile?: {
    _id: string;
    userId: string;
    idDetails?: IdDetails;
    completeness?: number;
    lastModified?: Date;
  };
  idDetails?: IdDetails;
  hasIdDetails?: boolean;
  validation?: ValidationResult;
  error?: string;
}

export interface IdDetailsSummaryResponse {
  message: string;
  idDetails?: {
    idType: idType;
    hasIdNumber: boolean;
    hasIdFile: boolean;
    fileType?: string;
    uploadedAt?: Date;
  };
  hasIdDetails?: boolean;
  error?: string;
}

type ErrorResponse = {
  message?: string;
  error?: string;
  [key: string]: unknown;
};

// ===================================================================
// ID DETAILS API CLASS - UPDATED TO MATCH BACKEND ENDPOINTS
// ===================================================================

class IdDetailsAPI {
  private baseURL: string;

  constructor(baseURL: string = "/api/profile/id-details") {
    this.baseURL = baseURL;
  }

  private async makeRequest<T = IdDetailsResponse>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include",
      ...options,
    };

    try {
      const response = await fetch(url, config);

      const contentType = response.headers.get("content-type");
      let data: unknown;

      if (contentType && contentType.includes("application/json")) {
        data = (await response.json()) as T;
      } else {
        data = { message: await response.text() } as T;
      }

      if (!response.ok) {
        const err = data as ErrorResponse;
        throw new IdDetailsAPIError(
          err.message ||
            err.error ||
            `Request failed with status ${response.status}`,
          response.status,
          data
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof IdDetailsAPIError) {
        throw error;
      }

      throw new IdDetailsAPIError(
        "Network error or server is unreachable",
        0,
        error
      );
    }
  }

  // ===== CORE ID DETAILS MANAGEMENT =====

  /**
   * Get current ID details
   */
  async getIdDetails(): Promise<IdDetailsResponse> {
    return this.makeRequest("/", {
      method: "GET",
    });
  }

  /**
   * Update complete ID details (supports partial updates)
   */
  async updateIdDetails(data: UpdateIdDetailsData): Promise<IdDetailsResponse> {
    return this.makeRequest("/", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * Update only the ID type
   */
  async updateIdType(idType: idType): Promise<IdDetailsResponse> {
    return this.makeRequest("/idType", {
      method: "PUT",
      body: JSON.stringify({ value: idType }),
    });
  }

  /**
   * Update only the ID number
   */
  async updateIdNumber(idNumber: string): Promise<IdDetailsResponse> {
    return this.makeRequest("/idNumber", {
      method: "PUT",
      body: JSON.stringify({ value: idNumber }),
    });
  }

  /**
   * Update only the ID file
   */
  async updateIdFile(idFile: FileReference): Promise<IdDetailsResponse> {
    return this.makeRequest("/idFile", {
      method: "PUT",
      body: JSON.stringify({ value: idFile }),
    });
  }

  /**
   * Remove ID details
   */
  async removeIdDetails(): Promise<IdDetailsResponse> {
    return this.makeRequest("/", {
      method: "DELETE",
    });
  }

  /**
   * Validate ID details completeness and correctness
   */
  async validateIdDetails(): Promise<IdDetailsResponse> {
    return this.makeRequest("/validate", {
      method: "GET",
    });
  }

  /**
   * Get ID details summary (without sensitive data)
   */
  async getIdDetailsSummary(): Promise<IdDetailsSummaryResponse> {
    return this.makeRequest("/summary", {
      method: "GET",
    });
  }

  // ===== UTILITY METHODS =====

  /**
   * Get ID type options for UI dropdowns
   */
  getIdTypeOptions(): { value: idType; label: string }[] {
    return [
      { value: idType.NATIONAL_ID, label: "National ID" },
      { value: idType.PASSPORT, label: "Passport" },
      { value: idType.DRIVERS_LICENSE, label: "Driver's License" },
      { value: idType.VOTERS_ID, label: "Voter's ID" },
      { value: idType.NHIS, label: "NHIS Card" },
      { value: idType.OTHER, label: "Other" },
    ];
  }

  /**
   * Validate file structure before upload
   */
  validateFileStructure(file: FileReference): string[] {
    const errors: string[] = [];

    if (!file.url || !file.url.trim()) {
      errors.push("ID file URL is required");
    }

    if (!file.fileName || !file.fileName.trim()) {
      errors.push("ID file name is required");
    }

    // File size validation (10MB limit)
    const maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.fileSize && file.fileSize > maxFileSize) {
      errors.push("ID file size cannot exceed 10MB");
    }

    // MIME type validation
    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
      "image/tiff",
    ];
    if (file.mimeType && !allowedMimeTypes.includes(file.mimeType)) {
      errors.push(
        "Invalid file format. Only JPEG, PNG, WebP, PDF, and TIFF files are allowed"
      );
    }

    return errors;
  }

  /**
   * Check if ID details are complete
   */
  isIdDetailsComplete(idDetails: IdDetails | null): boolean {
    if (!idDetails) return false;
    return !!(idDetails.idType && idDetails.idNumber && idDetails.idFile);
  }
}

// Create and export singleton instance
export const idDetailsAPI = new IdDetailsAPI();

// Export the IdDetailsAPI class for custom instances
export { IdDetailsAPI };

// Export utility functions
export const hasIdDetails = (idDetails: IdDetails | null): boolean => {
  return idDetailsAPI.isIdDetailsComplete(idDetails);
};
