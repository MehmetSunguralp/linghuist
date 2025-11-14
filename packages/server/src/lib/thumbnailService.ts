import sharp from 'sharp';
import { supabaseAdmin } from './supabaseAdminClient';

/**
 * Generates a thumbnail from an avatar image and uploads it to Supabase Storage
 * @param avatarUrl - The path to the original avatar in Supabase Storage (e.g., "avatars/user-id/image.jpg")
 * @param userId - The user ID for organizing files
 * @returns The thumbnail file path in storage (e.g., "userThumbnails/user-id/timestamp.webp")
 */
export async function generateAndUploadThumbnail(
  avatarUrl: string,
  userId: string,
): Promise<string | null> {
  try {
    // Extract bucket and path from avatarUrl
    // Format: "avatars/user-id/image.jpg" or "user-id/image.jpg"
    const parts = avatarUrl.split('/');
    let avatarPath: string;

    if (parts[0] === 'avatars') {
      // Format: "avatars/user-id/image.jpg"
      avatarPath = parts.slice(1).join('/');
    } else {
      // Assume it's just a path
      avatarPath = avatarUrl;
    }

    // Download the original avatar from Supabase
    const { data: avatarData, error: downloadError } =
      await supabaseAdmin.storage.from('avatars').download(avatarPath);

    if (downloadError || !avatarData) {
      console.error(
        'Failed to download avatar for thumbnail generation:',
        downloadError,
      );
      return null;
    }

    // Convert blob to buffer
    const originalBuffer = Buffer.from(await avatarData.arrayBuffer());

    // Generate thumbnail: 64x64, WebP with optimized settings
    // Use binary search to find the best quality that stays under 1KB
    let minQuality = 1;
    let maxQuality = 80;
    let bestQuality = 50;
    let thumbnailBuffer: Buffer | null = null;
    const targetSize = 1024; // 1KB

    // Binary search for optimal quality
    while (minQuality <= maxQuality) {
      const testQuality = Math.floor((minQuality + maxQuality) / 2);
      
      thumbnailBuffer = await sharp(originalBuffer)
        .resize(64, 64, {
          fit: 'cover',
          position: 'center',
          kernel: sharp.kernel.lanczos3, // Better quality resizing
        })
        .webp({
          quality: testQuality,
          effort: 6, // Higher effort = better compression (0-6)
          nearLossless: false,
          smartSubsample: true, // Better quality for small images
        })
        .toBuffer();

      if (thumbnailBuffer.length <= targetSize) {
        // This quality works, try higher
        bestQuality = testQuality;
        minQuality = testQuality + 1;
      } else {
        // Too large, try lower quality
        maxQuality = testQuality - 1;
      }
    }

    // If we found a good quality, use it
    if (thumbnailBuffer && thumbnailBuffer.length <= targetSize) {
      // Already have a good buffer
    } else {
      // Fallback: try with bestQuality we found
      thumbnailBuffer = await sharp(originalBuffer)
        .resize(64, 64, {
          fit: 'cover',
          position: 'center',
          kernel: sharp.kernel.lanczos3,
        })
        .webp({
          quality: bestQuality,
          effort: 6,
          nearLossless: false,
          smartSubsample: true,
        })
        .toBuffer();
    }

    // If still too large, try slightly smaller size with good quality
    if (thumbnailBuffer.length > targetSize) {
      thumbnailBuffer = await sharp(originalBuffer)
        .resize(60, 60, {
          fit: 'cover',
          position: 'center',
          kernel: sharp.kernel.lanczos3,
        })
        .webp({
          quality: 60,
          effort: 6,
          nearLossless: false,
          smartSubsample: true,
        })
        .toBuffer();
    }

    // Last resort: smaller size with moderate quality
    if (thumbnailBuffer.length > targetSize) {
      thumbnailBuffer = await sharp(originalBuffer)
        .resize(56, 56, {
          fit: 'cover',
          position: 'center',
          kernel: sharp.kernel.lanczos3,
        })
        .webp({
          quality: 50,
          effort: 6,
          nearLossless: false,
          smartSubsample: true,
        })
        .toBuffer();
    }

    // Generate unique filename
    const fileName = `${userId}/profile/${Date.now()}.webp`;

    // Upload thumbnail to userThumbnails bucket
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('userThumbnails')
      .upload(fileName, thumbnailBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Failed to upload thumbnail:', uploadError);
      return null;
    }

    // Return the file path
    return `userThumbnails/${uploadData.path}`;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return null;
  }
}

/**
 * Deletes a thumbnail from Supabase Storage
 * @param thumbnailUrl - The path to the thumbnail (e.g., "userThumbnails/user-id/image.webp")
 */
export async function deleteThumbnail(thumbnailUrl: string): Promise<void> {
  if (!thumbnailUrl) return;

  try {
    // Extract path from thumbnailUrl
    // Format: "userThumbnails/user-id/image.webp" or "user-id/image.webp"
    const parts = thumbnailUrl.split('/');
    let thumbnailPath: string;

    if (parts[0] === 'userThumbnails') {
      // Format: "userThumbnails/user-id/image.webp"
      thumbnailPath = parts.slice(1).join('/');
    } else {
      // Assume it's just a path
      thumbnailPath = thumbnailUrl;
    }

    const { error } = await supabaseAdmin.storage
      .from('userThumbnails')
      .remove([thumbnailPath]);

    if (error) {
      console.error('Failed to delete thumbnail:', error);
    }
  } catch (error) {
    console.error('Error deleting thumbnail:', error);
  }
}
