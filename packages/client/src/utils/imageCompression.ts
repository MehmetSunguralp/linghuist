import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file to approximately 250KB
 * @param file - The image file to compress
 * @returns Compressed file as Blob
 */
export const compressImageTo250KB = async (file: File): Promise<File> => {
  const options = {
    maxSizeMB: 0.25, // 250KB
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: file.type,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw new Error('Failed to compress image');
  }
};

