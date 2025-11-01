import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to get authenticated Supabase client
export function getAuthenticatedSupabase() {
  const token =
    typeof window !== 'undefined'
      ? sessionStorage.getItem('access_token')
      : null;

  if (!token) {
    throw new Error('No access token found. Please log in.');
  }

  // Re-check env vars since TypeScript doesn't narrow across function boundaries
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  // Use header-based auth directly since we're using our own GraphQL auth tokens
  // These aren't Supabase session tokens, so we can't use setSession()
  // Instead, we pass the token in the Authorization header for Storage API calls
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

// Upload image to Supabase Storage
// Returns the file path (not a URL) for private buckets
export async function uploadImage(
  file: File,
  bucket: string,
  folder: string,
  userId: string,
): Promise<string> {
  // Use authenticated client
  const authenticatedSupabase = getAuthenticatedSupabase();

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
}

// Get a signed URL for a private bucket file
// The path should be in format "bucket/path" or just "path"
export async function getSignedUrl(
  path: string,
  expiresIn = 3600,
): Promise<string> {
  const authenticatedSupabase = getAuthenticatedSupabase();

  // Extract bucket and file path
  const parts = path.split('/');
  const bucket = parts[0];
  const filePath = parts.slice(1).join('/');

  const { data, error } = await authenticatedSupabase.storage
    .from(bucket)
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    throw new Error(`Failed to get signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

// Delete image from Supabase Storage
// Accepts either a full path (bucket/path) or just the path
export async function deleteImage(path: string): Promise<void> {
  const authenticatedSupabase = getAuthenticatedSupabase();

  // Extract bucket and file path
  // Path can be in format "bucket/path" or just "path"
  const parts = path.split('/');
  let bucket: string;
  let filePath: string;

  if (parts[0] === 'avatars' || parts[0] === 'public') {
    // Format: bucket/path/to/file.jpg
    bucket = parts[0];
    filePath = parts.slice(1).join('/');
  } else {
    // Assume it's a path only, extract from full URL or use default bucket
    // For avatar paths, default bucket is 'avatars'
    if (path.includes('storage/v1/object')) {
      // Full URL format, extract path
      const urlParts = path.split('/');
      const bucketIndex = urlParts.indexOf('object') + 2;
      bucket = urlParts[bucketIndex];
      filePath = urlParts.slice(bucketIndex + 1).join('/');
    } else {
      // Assume it's just a path, use avatars as default
      bucket = 'avatars';
      filePath = path;
    }
  }

  const { error } = await authenticatedSupabase.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    console.error('Failed to delete image:', error);
    // Don't throw - allow cleanup to fail silently
  }
}
