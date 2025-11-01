'use client';
import {
  Box,
  HStack,
  VStack,
  Text,
  Avatar,
  Tag as CTag,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import FlagIcon from './FlagIcon';
import { languageToCountryCode } from '@/utils/languages';
import { getSignedUrl } from '@/lib/supabaseClient';

type Language = { name: string; level: string; code: string };

export interface UserCardProps {
  id: string;
  name?: string | null;
  email: string;
  username?: string | null;
  avatarUrl?: string | null;
  country?: string | null; // ISO-3166 alpha-2
  age?: number | null;
  languagesKnown?: Language[];
  languagesLearn?: Language[];
}

const regionNames =
  typeof window !== 'undefined'
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

export const UserCard = ({
  id,
  name,
  email,
  username,
  avatarUrl,
  country,
  age,
  languagesKnown,
  languagesLearn,
}: UserCardProps) => {
  const router = useRouter();
  const [signedAvatarUrl, setSignedAvatarUrl] = useState<string | null>(null);
  const displayName = name || username || email;

  // Convert avatar path to signed URL if it's a path (not a full URL)
  useEffect(() => {
    if (avatarUrl) {
      // Check if it's a path format (bucket/path) or a full URL
      if (
        avatarUrl.startsWith('avatars/') ||
        (avatarUrl.startsWith('http') === false && avatarUrl.includes('/'))
      ) {
        // It's a path, convert to signed URL
        getSignedUrl(avatarUrl)
          .then((url) => {
            setSignedAvatarUrl(url);
          })
          .catch((error) => {
            console.error('Failed to get signed URL for avatar:', error);
            setSignedAvatarUrl(null);
          });
      } else {
        // It's already a full URL (legacy or external)
        setSignedAvatarUrl(avatarUrl);
      }
    } else {
      setSignedAvatarUrl(null);
    }
  }, [avatarUrl]);
  const getCountryCode = (value?: string | null): string | null => {
    if (!value) return null;
    const trimmed = value.trim();
    if (trimmed.length === 2) return trimmed.toUpperCase();
    const normalized = trimmed.toLowerCase().replace(/\s+/g, ' ');
    const mapping: Record<string, string> = {
      turkey: 'TR',
      germany: 'DE',
      deutschland: 'DE',
      'united states': 'US',
      usa: 'US',
      canada: 'CA',
      france: 'FR',
      spain: 'ES',
      portugal: 'PT',
      italy: 'IT',
      japan: 'JP',
      china: 'CN',
      'south korea': 'KR',
      korea: 'KR',
      india: 'IN',
      'united kingdom': 'GB',
      uk: 'GB',
      england: 'GB',
      wales: 'GB',
      scotland: 'GB',
    };
    return mapping[normalized] || null;
  };

  const countryCode = getCountryCode(country);
  const countryName =
    countryCode && regionNames
      ? regionNames.of(countryCode)
      : country || undefined;

  return (
    <Box
      borderWidth='1px'
      borderRadius='lg'
      p={4}
      shadow='sm'
      cursor='pointer'
      transition='all 0.2s'
      _hover={{
        shadow: 'md',
        transform: 'translateY(-2px)',
        borderColor: 'blue.300',
        _dark: { borderColor: 'blue.600' },
      }}
      onClick={() => router.push(`/profile/${id}`)}
    >
      <HStack gap={3} align='start'>
        <Box position='relative'>
          <Avatar.Root>
            <Avatar.Image src={signedAvatarUrl || undefined} />
            <Avatar.Fallback name={displayName} />
          </Avatar.Root>
          {countryCode && (
            <Box
              position='absolute'
              top='-6px'
              right='-6px'
              borderRadius='full'
              overflow='hidden'
              boxShadow='sm'
            >
              <FlagIcon countryCode={countryCode} size={18} />
            </Box>
          )}
        </Box>
        <VStack align='start' gap={1} flex={1}>
          <HStack gap={2} align='center'>
            <Text fontWeight='bold'>{displayName}</Text>
            {countryName && (
              <Text color='gray.300' fontSize='sm'>
                · {countryName}
              </Text>
            )}
            {typeof age === 'number' && (
              <Text color='gray.300' fontSize='sm'>
                · {age}
              </Text>
            )}
          </HStack>

          {languagesKnown && languagesKnown.length > 0 && (
            <VStack align='start' gap={1} mt={2}>
              <Text fontSize='sm' color='gray.200'>
                Speaks
              </Text>
              <Wrap>
                {languagesKnown.map((l, i) => (
                  <WrapItem key={`${l.code}-${i}`}>
                    <CTag.Root>
                      <HStack gap={2}>
                        <FlagIcon
                          countryCode={languageToCountryCode(l.code)}
                          size={14}
                        />
                        <CTag.Label>{l.name}</CTag.Label>
                      </HStack>
                    </CTag.Root>
                  </WrapItem>
                ))}
              </Wrap>
            </VStack>
          )}

          {languagesLearn && languagesLearn.length > 0 && (
            <VStack align='start' gap={1} mt={2}>
              <Text fontSize='sm' color='gray.200'>
                Learning
              </Text>
              <Wrap>
                {languagesLearn.map((l, i) => (
                  <WrapItem key={`${l.code}-${i}`}>
                    <CTag.Root variant='subtle'>
                      <HStack gap={2}>
                        <FlagIcon
                          countryCode={languageToCountryCode(l.code)}
                          size={14}
                        />
                        <CTag.Label>{l.name}</CTag.Label>
                      </HStack>
                    </CTag.Root>
                  </WrapItem>
                ))}
              </Wrap>
            </VStack>
          )}
        </VStack>
      </HStack>
    </Box>
  );
};

export default UserCard;
