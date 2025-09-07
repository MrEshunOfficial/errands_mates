// Custom hooks for React applications
import { CategoryImageService, FileReference, UploadImageRequest } from '@/lib/api/categories/categoryImage.api';
import { useState, useCallback } from 'react';

/**
 * Custom hook for managing category image operations
 */
export function useCategoryImage(categoryId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageData, setImageData] = useState<FileReference | null>(null);
  const [hasImage, setHasImage] = useState(false);

  const fetchImage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await CategoryImageService.getCategoryImage(categoryId);
      setImageData(result.data?.image || null);
      setHasImage(result.data?.hasImage || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  const uploadImage = useCallback(async (imageData: UploadImageRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await CategoryImageService.uploadCategoryImage(categoryId, imageData);
      setImageData(result.data?.image || null);
      setHasImage(true);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  const updateImage = useCallback(async (imageData: UploadImageRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await CategoryImageService.updateCategoryImage(categoryId, imageData);
      setImageData(result.data?.image || null);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  const replaceImage = useCallback(async (imageData: UploadImageRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await CategoryImageService.replaceCategoryImage(categoryId, imageData);
      setImageData(result.data?.newImage || null);
      setHasImage(true);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  const deleteImage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await CategoryImageService.deleteCategoryImage(categoryId);
      setImageData(null);
      setHasImage(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  return {
    loading,
    error,
    imageData,
    hasImage,
    fetchImage,
    uploadImage,
    updateImage,
    replaceImage,
    deleteImage
  };
}

/**
 * Custom hook for batch category image operations
 */
export function useBatchCategoryImages() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBatchImages = useCallback(async (categoryIds: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const result = await CategoryImageService.getBatchCategoryImages(categoryIds);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCategoriesWithImages = useCallback(async (categoryIds: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const result = await CategoryImageService.getCategoriesWithImages(categoryIds);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchBatchImages,
    getCategoriesWithImages
  };
}