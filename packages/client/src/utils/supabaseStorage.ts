/**
 * Supabase Storage URL utility
 *
 * Gets signed URLs for files stored in Supabase Storage (requires authentication)
 */

import { createClient } from '@supabase/supabase-js';
import { tokenStorage } from '@/utils/tokenStorage';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables are not set. Some features may not work.',
  );
}

/**
 * Helper to get authenticated Supabase client
 * Creates a new client with the access token in headers for each operation
 */
function getAuthenticatedSupabase(accessToken?: string | null) {
  const token = accessToken || tokenStorage.get();

  if (!token) {
    throw new Error('No access token found. Please log in.');
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  // Create a new client with header-based auth
  // Use header-based auth directly since we're using our own GraphQL auth tokens
  // These aren't Supabase session tokens, so we pass the token in the Authorization header
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

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
    const authenticatedSupabase = getAuthenticatedSupabase(accessToken);

    // Get signed URL (valid for 1 hour by default)
    const { data, error } = await authenticatedSupabase.storage
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

/**
 * Uploads a file to Supabase Storage
 * @param file - The file to upload
 * @param bucket - The storage bucket name (required)
 * @param folder - The folder within the bucket (e.g., "profile", "posts")
 * @param userId - The user ID for organizing files
 * @param accessToken - Optional access token
 * @returns The file path in storage (e.g., "avatars/user-id/timestamp.jpg")
 */
export const uploadImage = async (
  file: File,
  bucket: string,
  folder: string,
  userId: string,
  accessToken?: string | null,
): Promise<string> => {
  if (!bucket) {
    throw new Error('Bucket name is required');
  }

  // Use authenticated client
  const authenticatedSupabase = getAuthenticatedSupabase(accessToken);

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${folder}/${Date.now()}.${fileExt}`;

  // Upload file
  const { data, error } = await authenticatedSupabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Return the file path (we'll use signed URLs when displaying)
  // Format: bucket/path
  return `${bucket}/${data.path}`;
};

/**
 * Deletes a file from Supabase Storage
 * @param filePath - The path to the file (e.g., "avatars/user-id/image.jpg")
 * @param bucket - The storage bucket name (required)
 * @param accessToken - Optional access token
 */
export const deleteImage = async (
  filePath: string,
  bucket: string,
  accessToken?: string | null,
): Promise<void> => {
  if (!filePath) return;
  if (!bucket) {
    throw new Error('Bucket name is required');
  }

  const authenticatedSupabase = getAuthenticatedSupabase(accessToken);

  // Extract bucket and file path
  // Path can be in format "bucket/path" or just "path"
  const parts = filePath.split('/');
  let filePathToDelete: string;

  if (parts[0] === bucket) {
    // Format: bucket/path/to/file.jpg
    filePathToDelete = parts.slice(1).join('/');
  } else {
    // Assume it's just a path
    filePathToDelete = filePath;
  }

  const { error } = await authenticatedSupabase.storage
    .from(bucket)
    .remove([filePathToDelete]);

  if (error) {
    console.error('Failed to delete image:', error);
    // Don't throw - allow cleanup to fail silently
  }
};
