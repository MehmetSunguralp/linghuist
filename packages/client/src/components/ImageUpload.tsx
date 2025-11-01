'use client';
import { useState, useRef } from 'react';
import {
  Box,
  Button,
  Input,
  VStack,
  Text,
  Icon,
  Spinner,
} from '@chakra-ui/react';
import { MdImage, MdClose } from 'react-icons/md';
import { uploadImage } from '@/lib/supabaseClient';
import { ImageUploadProps } from '@/types/AllTypes';

export default function ImageUpload({
  value,
  onChange,
  bucket = 'avatars',
  folder = 'profile',
  userId,
  label = 'Upload Image',
  accept = 'image/*',
  maxSizeMB = 5,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      alert(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Supabase
    setUploading(true);
    try {
      const url = await uploadImage(file, bucket, folder, userId);
      onChange(url);
    } catch (error: any) {
      alert(error.message || 'Failed to upload image');
      setPreview(null);
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <VStack gap={3} align='stretch'>
      <Box>
        <Text mb={1} fontWeight='medium' fontSize={{ base: 'sm', sm: 'md' }}>
          {label}
        </Text>
        <Input
          ref={fileInputRef}
          type='file'
          accept={accept}
          onChange={handleFileSelect}
          display='none'
        />
        <Box position='relative'>
          {preview && (
            <Box
              position='relative'
              w='full'
              h='200px'
              borderRadius='md'
              overflow='hidden'
              border='2px solid'
              borderColor='gray.200'
              _dark={{ borderColor: 'gray.700' }}
              mb={2}
            >
              <img
                src={preview}
                alt='Preview'
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <Button
                position='absolute'
                top={2}
                right={2}
                size='sm'
                colorScheme='red'
                onClick={handleRemove}
                disabled={uploading}
              >
                <Icon>
                  <MdClose />
                </Icon>
              </Button>
            </Box>
          )}
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            width='full'
            variant='outline'
            size={{ base: 'md', sm: 'lg' }}
          >
            {uploading ? (
              <>
                <Spinner size='sm' mr={2} />
                <Text>Uploading...</Text>
              </>
            ) : (
              <>
                <Icon mr={2}>
                  <MdImage />
                </Icon>
                <Text>{preview ? 'Change Image' : label}</Text>
              </>
            )}
          </Button>
        </Box>
        <Text fontSize={{ base: 'xs', sm: 'sm' }} color='gray.500' mt={1}>
          Max size: {maxSizeMB}MB. Accepted formats: JPG, PNG, GIF, WebP
        </Text>
      </Box>
    </VStack>
  );
}
