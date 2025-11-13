/**
 * Supabase Storage URL utility
 *
 * Gets signed URLs for files stored in Supabase Storage (requires authentication)
 */

import { createSupabaseClient } from '../lib/supabaseClient';
import { tokenStorage } from './tokenStorage';

/**
 * Gets the signed URL for a Supabase storage file (requires authentication)
 * @param filePath - The path to the file (e.g., "avatars/user-id/image.jpg" or "user-id/image.jpg")
 * @param bucket - The storage bucket name (required, e.g., "avatars", "posts", "documents")
 * @param accessToken - Optional access token. If not provided, uses token from storage
 * @returns The signed URL to the file, or empty string if unavailable
 */
export const getSupabaseStorageUrl = async (
  filePath: string,
  bucket: string,
  accessToken?: string | null,
): Promise<string> => {
  if (!filePath) return '';
  if (!bucket) {
    console.error('Bucket name is required');
    return '';
  }

  // If it's already a full URL, return it
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  // Get access token from parameter or storage
  const token = accessToken || tokenStorage.get();
  if (!token) {
    console.warn('No access token available for signed URL generation');
    return '';
  }

  // Remove leading slash if present
  let cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;

  // If the path already starts with the bucket name, remove it to avoid duplication
  // e.g., "avatars/user-id/image.jpg" -> "user-id/image.jpg" when bucket is "avatars"
  if (cleanPath.startsWith(`${bucket}/`)) {
    cleanPath = cleanPath.substring(bucket.length + 1);
  }

  try {
    const client = createSupabaseClient(token);
    if (!client) {
      console.error('Failed to create Supabase client');
      return '';
    }

    // Get signed URL (valid for 1 hour by default)
    const { data, error } = await client.storage
      .from(bucket)
      .createSignedUrl(cleanPath, 3600); // 1 hour expiry

    if (error) {
      console.error('Error creating signed URL:', error);
      return '';
    }

    return data?.signedUrl || '';
  } catch (err) {
    console.error('Failed to generate signed URL:', err);
    return '';
  }
};

/**
 * Gets the signed URL for a Supabase storage file (synchronous version that returns a promise)
 * This is the same as getSupabaseStorageUrl but kept for backward compatibility
 * @param filePath - The path to the file
 * @param bucket - The storage bucket name (required)
 * @param accessToken - Optional access token
 * @returns The signed URL (promise)
 */
export const getSupabaseSignedUrl = (
  filePath: string,
  bucket: string,
  accessToken?: string | null,
): Promise<string> => {
  return getSupabaseStorageUrl(filePath, bucket, accessToken);
};
