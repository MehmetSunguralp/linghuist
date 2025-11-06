'use client';
import {
  Box,
  Button,
  Input,
  VStack,
  Text,
  Heading,
  Flex,
  Textarea,
  HStack,
  IconButton,
  Menu,
  Portal,
  Dialog,
  Icon,
  Grid,
  GridItem,
  Tabs,
} from '@chakra-ui/react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toaster } from '@/components/ui/toaster';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useRef } from 'react';
import { client } from '@/lib/apolloClient';
import { GET_CURRENT_USER, UPDATE_PROFILE } from '@/lib/authQueries';
import {
  GET_FRIENDS,
  GET_USER_BY_ID,
  SEND_FRIEND_REQUEST,
  REMOVE_FRIEND,
  GET_PENDING_FRIEND_REQUESTS,
  GET_SENT_FRIEND_REQUESTS,
  RESPOND_FRIEND_REQUEST,
} from '@/lib/userQueries';
import { setAuthUser } from '@/store/reducers/authSlice';
import { MdDelete, MdAdd, MdEdit, MdClose } from 'react-icons/md';
import { IoChatbubbleEllipsesOutline } from 'react-icons/io5';

import { useParams } from 'next/navigation';
import {
  LANGUAGES,
  LANGUAGE_LEVELS,
  getLanguageCode,
  languageToCountryCode,
} from '@/utils/languages';
import FlagIcon from '@/components/FlagIcon';
import { RESET_PASSWORD, DELETE_ACCOUNT } from '@/lib/authQueries';
import UserCard from '@/components/UserCard';
import { uploadImage, getSignedUrl, deleteImage } from '@/lib/supabaseClient';
import imageCompression from 'browser-image-compression';
import { LanguageInput, UserProfile } from '@/types/AllTypes';

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const params = useParams();
  const user = useAppSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsDialogOpen, setFriendsDialogOpen] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [friendActionLoading, setFriendActionLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrlSigned, setAvatarUrlSigned] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileUserId = params?.id as string | undefined;
  const isOwnProfile = !profileUserId || profileUserId === user?.id;

  // Fetch friends count on mount
  useEffect(() => {
    if (user) {
      const fetchFriends = async () => {
        try {
          const { data } = await client.query<{ friends: any[] }>({
            query: GET_FRIENDS,
            fetchPolicy: 'cache-first',
          });
          setFriends(data?.friends || []);
        } catch (error) {
          console.error('Failed to fetch friends:', error);
        }
      };
      fetchFriends();
    }
  }, [user]);

  // Check friend status and pending requests
  useEffect(() => {
    if (!user || !profileUserId || isOwnProfile) return;

    const checkFriendStatus = async () => {
      try {
        const [friendsData, sentRequestsData, receivedRequestsData] =
          await Promise.all([
            client.query<{ friends: any[] }>({
              query: GET_FRIENDS,
              fetchPolicy: 'cache-first',
            }),
            client.query<{ sentFriendRequests: any[] }>({
              query: GET_SENT_FRIEND_REQUESTS,
              fetchPolicy: 'cache-first',
            }),
            client.query<{ pendingFriendRequests: any[] }>({
              query: GET_PENDING_FRIEND_REQUESTS,
              fetchPolicy: 'cache-first',
            }),
          ]);

        // Check if already friends
        const friendsList = friendsData.data?.friends || [];
        const friend = friendsList.find((f) => f.id === profileUserId);
        setIsFriend(!!friend);

        // Check if there's a pending request (sent or received)
        const sentRequests = sentRequestsData.data?.sentFriendRequests || [];
        const receivedRequests =
          receivedRequestsData.data?.pendingFriendRequests || [];

        const hasSentRequest = sentRequests.some(
          (req) => req.receiver?.id === profileUserId,
        );
        const hasReceivedRequest = receivedRequests.some(
          (req) => req.sender?.id === profileUserId,
        );

        setHasPendingRequest(hasSentRequest || hasReceivedRequest);
      } catch (error) {
        console.error('Failed to check friend status:', error);
      }
    };

    checkFriendStatus();
  }, [user, profileUserId, isOwnProfile]);

  useEffect(() => {
    if (!user) {
      router.push('/signin');
      return;
    }

    const fetchProfile = async () => {
      try {
        let profileData: UserProfile | null = null;

        if (isOwnProfile) {
          // Use cache-first: show cached data immediately if available, otherwise fetch
          const { data } = await client.query<{ me: UserProfile }>({
            query: GET_CURRENT_USER,
            fetchPolicy: 'cache-first',
          });
          profileData = data?.me || null;
        } else if (profileUserId) {
          // Use cache-first: show cached data immediately if available, otherwise fetch
          const { data } = await client.query<{ user: UserProfile }>({
            query: GET_USER_BY_ID,
            variables: { id: profileUserId },
            fetchPolicy: 'cache-first',
          });
          profileData = data?.user || null;
        }

        if (profileData) {
          setProfile(profileData);

          // Convert avatar path to signed URL if it's a path (not a full URL)
          if (profileData.avatarUrl) {
            // Check if it's a path format (bucket/path) or a full URL
            if (
              profileData.avatarUrl.startsWith('avatars/') ||
              profileData.avatarUrl.startsWith('http') === false
            ) {
              // It's a path, convert to signed URL
              try {
                const signedUrl = await getSignedUrl(profileData.avatarUrl);
                setAvatarUrlSigned(signedUrl);
              } catch (error) {
                console.error('Failed to get signed URL:', error);
                setAvatarUrlSigned(null);
              }
            } else {
              // It's already a full URL (legacy)
              setAvatarUrlSigned(profileData.avatarUrl);
            }
          } else {
            setAvatarUrlSigned(null);
          }

          if (isOwnProfile) {
            formik.setValues({
              name: profileData.name || '',
              username: profileData.username || '',
              bio: profileData.bio || '',
              avatarUrl: profileData.avatarUrl || '',
              country: profileData.country || '',
              age:
                typeof profileData.age === 'number'
                  ? String(profileData.age)
                  : '',
              languagesKnown: profileData.languagesKnown || [],
              languagesLearn: profileData.languagesLearn || [],
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        toaster.create({
          title: 'Failed to load profile',
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, router, profileUserId, isOwnProfile]);

  const formik = useFormik({
    initialValues: {
      name: '',
      username: '',
      bio: '',
      avatarUrl: '',
      country: '',
      age: '',
      languagesKnown: [] as LanguageInput[],
      languagesLearn: [] as LanguageInput[],
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Name is required'),
      username: Yup.string()
        .min(3, 'Username must be at least 3 characters')
        .matches(
          /^[a-zA-Z0-9_]+$/,
          'Username can only contain letters, numbers, and underscores',
        )
        .required('Username is required'),
      bio: Yup.string()
        .max(500, 'Bio must be less than 500 characters')
        .required('Bio is required'),
      avatarUrl: Yup.string().nullable(),
      country: Yup.string().required('Country is required'),
      age: Yup.number()
        .typeError('Age must be a number')
        .min(16, 'Minimum age is 16')
        .max(99, 'Maximum age is 99')
        .required('Age is required'),
    }),
    onSubmit: async (values) => {
      try {
        // Check for incomplete language entries
        const incompleteKnown = values.languagesKnown.some(
          (lang: LanguageInput) =>
            (lang.name.trim() !== '' && lang.level.trim() === '') ||
            (lang.name.trim() === '' && lang.level.trim() !== ''),
        );
        const incompleteLearn = values.languagesLearn.some(
          (lang: LanguageInput) =>
            (lang.name.trim() !== '' && lang.level.trim() === '') ||
            (lang.name.trim() === '' && lang.level.trim() !== ''),
        );

        if (incompleteKnown || incompleteLearn) {
          toaster.create({
            title: 'Please complete all language entries',
            description:
              'Each language must have both a name and a level selected',
            type: 'warning',
          });
          return;
        }

        // Check for duplicate languages
        const knownLanguages = values.languagesKnown
          .map((lang: LanguageInput) => lang.name.trim())
          .filter((name) => name !== '');
        const knownDuplicates =
          new Set(knownLanguages).size !== knownLanguages.length;

        const learnLanguages = values.languagesLearn
          .map((lang: LanguageInput) => lang.name.trim())
          .filter((name) => name !== '');
        const learnDuplicates =
          new Set(learnLanguages).size !== learnLanguages.length;

        if (knownDuplicates || learnDuplicates) {
          toaster.create({
            title: 'Duplicate languages found',
            description:
              'You cannot add the same language more than once in each list',
            type: 'warning',
          });
          return;
        }

        // Filter out empty entries and strip __typename from language objects
        const cleanLanguages = (langs: LanguageInput[]) =>
          langs
            .filter(
              (lang) => lang.name.trim() !== '' && lang.level.trim() !== '',
            ) // Only keep entries with both name and level
            .map(({ name, level, code }) => ({ name, level, code }));

        const cleanedLanguagesKnown = cleanLanguages(values.languagesKnown);
        const cleanedLanguagesLearn = cleanLanguages(values.languagesLearn);

        // Check minimum language requirements
        if (cleanedLanguagesKnown.length < 1) {
          toaster.create({
            title: 'At least one known language required',
            description: 'Please add at least one language you know',
            type: 'warning',
          });
          return;
        }

        if (cleanedLanguagesLearn.length < 1) {
          toaster.create({
            title: 'At least one learning language required',
            description: 'Please add at least one language you are learning',
            type: 'warning',
          });
          return;
        }

        // Check if any learned languages are Native/Fluent in known languages
        const nativeFluentKnown = values.languagesKnown
          .filter(
            (lang: LanguageInput) =>
              lang.name.trim() !== '' &&
              (lang.level === 'Native' || lang.level === 'Fluent'),
          )
          .map((lang: LanguageInput) => lang.name);
        const conflictingLearn = values.languagesLearn.some(
          (lang: LanguageInput) =>
            lang.name.trim() !== '' && nativeFluentKnown.includes(lang.name),
        );

        if (conflictingLearn) {
          toaster.create({
            title: 'Language conflict',
            description:
              'You cannot learn a language that you already know at Native or Fluent level',
            type: 'warning',
          });
          return;
        }

        // Check for at least one native language
        const nativeLanguages = cleanedLanguagesKnown.filter(
          (lang) => lang.level === 'Native',
        );
        if (nativeLanguages.length < 1) {
          toaster.create({
            title: 'Native language required',
            description:
              'You must have at least one native language in your known languages',
            type: 'warning',
          });
          return;
        }

        const { data } = await client.mutate<{ updateMe: UserProfile }>({
          mutation: UPDATE_PROFILE,
          variables: {
            data: {
              name: values.name || null,
              username: values.username || null,
              bio: values.bio || null,
              avatarUrl: values.avatarUrl || null,
              country: values.country ? values.country : null,
              age: values.age ? Number(values.age) : null,
              languagesKnown:
                cleanedLanguagesKnown.length > 0 ? cleanedLanguagesKnown : null,
              languagesLearn:
                cleanedLanguagesLearn.length > 0 ? cleanedLanguagesLearn : null,
            },
          },
        });

        if (data?.updateMe) {
          dispatch(
            setAuthUser({ id: data.updateMe.id, email: data.updateMe.email }),
          );
          // Update profile state to reflect changes immediately
          setProfile(data.updateMe);

          // Update signed URL if avatar was changed
          if (data.updateMe.avatarUrl) {
            if (
              data.updateMe.avatarUrl.startsWith('avatars/') ||
              data.updateMe.avatarUrl.startsWith('http') === false
            ) {
              try {
                const signedUrl = await getSignedUrl(data.updateMe.avatarUrl);
                setAvatarUrlSigned(signedUrl);
              } catch (error) {
                console.error('Failed to get signed URL:', error);
              }
            } else {
              setAvatarUrlSigned(data.updateMe.avatarUrl);
            }
          } else {
            setAvatarUrlSigned(null);
          }

          // Refresh the profile data
          const { data: refreshedData } = await client.query<{
            me: UserProfile;
          }>({
            query: GET_CURRENT_USER,
            fetchPolicy: 'network-only',
          });
          if (refreshedData?.me) {
            setProfile(refreshedData.me);
            // Update signed URL for refreshed data
            if (refreshedData.me.avatarUrl) {
              if (
                refreshedData.me.avatarUrl.startsWith('avatars/') ||
                refreshedData.me.avatarUrl.startsWith('http') === false
              ) {
                try {
                  const signedUrl = await getSignedUrl(
                    refreshedData.me.avatarUrl,
                  );
                  setAvatarUrlSigned(signedUrl);
                } catch (error) {
                  console.error('Failed to get signed URL:', error);
                }
              } else {
                setAvatarUrlSigned(refreshedData.me.avatarUrl);
              }
            }
          }
          toaster.create({
            title: 'Profile updated successfully!',
            type: 'success',
          });
        }
      } catch (error: any) {
        toaster.create({
          title: error.message || 'Failed to update profile',
          type: 'error',
        });
      }
    },
  });

  const addLanguage = (type: 'known' | 'learn') => {
    const field = type === 'known' ? 'languagesKnown' : 'languagesLearn';
    formik.setFieldValue(field, [
      ...(formik.values[field] as LanguageInput[]),
      { name: '', level: '', code: '' },
    ]);
  };

  const removeLanguage = (type: 'known' | 'learn', index: number) => {
    const field = type === 'known' ? 'languagesKnown' : 'languagesLearn';
    const currentList = formik.values[field] as LanguageInput[];

    // Count complete languages (with both name and level)
    const completeLanguages = currentList.filter(
      (lang: LanguageInput) =>
        lang.name.trim() !== '' && lang.level.trim() !== '',
    );

    // Check if this is the last complete language
    if (completeLanguages.length === 1) {
      const languageType = type === 'known' ? 'known' : 'learning';
      toaster.create({
        title: 'Cannot remove last language',
        description: `You must have at least one ${languageType} language. Please add another one before removing this.`,
        type: 'warning',
      });
      return;
    }

    // For known languages, check if removing the last native language
    if (type === 'known') {
      const languageToRemove = currentList[index];
      if (
        languageToRemove.level === 'Native' &&
        languageToRemove.name.trim() !== ''
      ) {
        const remainingNativeLanguages = currentList.filter(
          (lang: LanguageInput, idx) =>
            idx !== index && lang.name.trim() !== '' && lang.level === 'Native',
        );

        if (remainingNativeLanguages.length === 0) {
          toaster.create({
            title: 'Cannot remove last native language',
            description:
              'You must have at least one native language. Please add another native language before removing this one.',
            type: 'warning',
          });
          return;
        }
      }
    }

    const updated = currentList.filter((_, i) => i !== index);
    formik.setFieldValue(field, updated);
  };

  const updateLanguage = (
    type: 'known' | 'learn',
    index: number,
    key: keyof LanguageInput,
    value: string,
  ) => {
    const field = type === 'known' ? 'languagesKnown' : 'languagesLearn';
    const updated = [...(formik.values[field] as LanguageInput[])];

    // If changing level from Native to something else in known languages, check if it's the last native
    if (
      type === 'known' &&
      key === 'level' &&
      updated[index].level === 'Native' &&
      value !== 'Native'
    ) {
      const nativeCount = (
        formik.values.languagesKnown as LanguageInput[]
      ).filter(
        (lang: LanguageInput, idx) =>
          idx !== index && lang.name.trim() !== '' && lang.level === 'Native',
      ).length;

      if (nativeCount === 0) {
        toaster.create({
          title: 'Cannot change level',
          description:
            'You must have at least one native language. Please add another native language before changing this one.',
          type: 'warning',
        });
        return;
      }
    }

    updated[index] = { ...updated[index], [key]: value };

    // Auto-populate code when language name is selected
    if (key === 'name') {
      updated[index].code = getLanguageCode(value);
    }

    formik.setFieldValue(field, updated);
  };

  // Get languages that are already selected in known languages with Native or Fluent level
  const excludedFromLearnLanguages = useMemo(() => {
    return (formik.values.languagesKnown as LanguageInput[])
      .filter(
        (lang: LanguageInput) =>
          lang.name.trim() !== '' &&
          (lang.level === 'Native' || lang.level === 'Fluent'),
      )
      .map((lang: LanguageInput) => lang.name);
  }, [formik.values.languagesKnown]);

  // Get available languages for known languages list (exclude duplicates)
  const getAvailableKnownLanguages = (currentIndex: number) => {
    const selectedLanguages = (formik.values.languagesKnown as LanguageInput[])
      .map((lang: LanguageInput, idx) =>
        idx !== currentIndex ? lang.name : '',
      )
      .filter((name) => name.trim() !== '');
    return LANGUAGES.filter((lang) => !selectedLanguages.includes(lang.name));
  };

  // Get available languages for learned languages list (exclude duplicates and Native/Fluent from known)
  const getAvailableLearnLanguages = (currentIndex: number) => {
    const selectedLanguages = (formik.values.languagesLearn as LanguageInput[])
      .map((lang: LanguageInput, idx) =>
        idx !== currentIndex ? lang.name : '',
      )
      .filter((name) => name.trim() !== '');
    return LANGUAGES.filter(
      (lang) =>
        !selectedLanguages.includes(lang.name) &&
        !excludedFromLearnLanguages.includes(lang.name),
    );
  };

  // Check if there are any incomplete language entries
  const hasIncompleteLanguages = () => {
    const incompleteKnown = (
      formik.values.languagesKnown as LanguageInput[]
    ).some(
      (lang: LanguageInput) =>
        (lang.name.trim() !== '' && lang.level.trim() === '') ||
        (lang.name.trim() === '' && lang.level.trim() !== ''),
    );
    const incompleteLearn = (
      formik.values.languagesLearn as LanguageInput[]
    ).some(
      (lang: LanguageInput) =>
        (lang.name.trim() !== '' && lang.level.trim() === '') ||
        (lang.name.trim() === '' && lang.level.trim() !== ''),
    );
    return incompleteKnown || incompleteLearn;
  };

  // Check if there are duplicate languages
  const hasDuplicateLanguages = () => {
    const knownLanguages = (formik.values.languagesKnown as LanguageInput[])
      .map((lang: LanguageInput) => lang.name.trim())
      .filter((name) => name !== '');
    const knownDuplicates =
      new Set(knownLanguages).size !== knownLanguages.length;

    const learnLanguages = (formik.values.languagesLearn as LanguageInput[])
      .map((lang: LanguageInput) => lang.name.trim())
      .filter((name) => name !== '');
    const learnDuplicates =
      new Set(learnLanguages).size !== learnLanguages.length;

    return knownDuplicates || learnDuplicates;
  };

  // Check if minimum language requirements are met
  const hasMinimumLanguages = () => {
    const cleanKnown = (formik.values.languagesKnown as LanguageInput[]).filter(
      (lang: LanguageInput) =>
        lang.name.trim() !== '' && lang.level.trim() !== '',
    );
    const cleanLearn = (formik.values.languagesLearn as LanguageInput[]).filter(
      (lang: LanguageInput) =>
        lang.name.trim() !== '' && lang.level.trim() !== '',
    );
    return cleanKnown.length >= 1 && cleanLearn.length >= 1;
  };

  // Check if there's at least one native language
  const hasNativeLanguage = () => {
    const nativeLanguages = (
      formik.values.languagesKnown as LanguageInput[]
    ).filter(
      (lang: LanguageInput) =>
        lang.name.trim() !== '' &&
        lang.level.trim() !== '' &&
        lang.level === 'Native',
    );
    return nativeLanguages.length >= 1;
  };

  if (loading) {
    return (
      <Flex h='calc(100vh - 64px)' align='center' justify='center'>
        <Text fontSize={{ base: 'sm', sm: 'md' }}>Loading profile...</Text>
      </Flex>
    );
  }

  return (
    <Box
      h='calc(100vh - 64px)'
      overflowY='auto'
      pt={{ base: 4, sm: 8 }}
      pb={{ base: 4, sm: 8 }}
    >
      <Box maxW='800px' w='full' px={{ base: 3, sm: 6 }} mx='auto'>
        <VStack
          gap={{ base: 3, sm: 4 }}
          mb={{ base: 6, sm: 8 }}
          textAlign='center'
        >
          {/* Large Avatar with Menu for own profile */}
          {isOwnProfile ? (
            <Menu.Root>
              <Menu.Trigger asChild>
                <Box
                  as='button'
                  w={{ base: '120px', sm: '150px', md: '180px' }}
                  h={{ base: '120px', sm: '150px', md: '180px' }}
                  borderRadius='full'
                  overflow='hidden'
                  border='4px solid'
                  borderColor='gray.200'
                  _dark={{ borderColor: 'gray.700' }}
                  mx='auto'
                  mb={2}
                  position='relative'
                  cursor='pointer'
                  _hover={{ opacity: 0.9 }}
                  transition='opacity 0.2s'
                >
                  {uploadingAvatar ? (
                    <Box
                      w='full'
                      h='full'
                      bg='gray.100'
                      _dark={{ bg: 'gray.800' }}
                      display='flex'
                      alignItems='center'
                      justifyContent='center'
                    >
                      <Text fontSize='sm' color='gray.500'>
                        Uploading...
                      </Text>
                    </Box>
                  ) : avatarUrlSigned ? (
                    <img
                      src={avatarUrlSigned}
                      alt={profile?.name || 'Profile'}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <Box
                      w='full'
                      h='full'
                      bg='blue.500'
                      display='flex'
                      alignItems='center'
                      justifyContent='center'
                      color='white'
                      fontSize={{ base: '3xl', sm: '4xl', md: '5xl' }}
                      fontWeight='bold'
                    >
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </Box>
                  )}
                </Box>
              </Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content>
                    {avatarUrlSigned && (
                      <Menu.Item
                        value='view'
                        onClick={() => {
                          if (avatarUrlSigned) {
                            window.open(avatarUrlSigned, '_blank');
                          }
                        }}
                      >
                        View Image
                      </Menu.Item>
                    )}
                    <Menu.Item
                      value='change'
                      onClick={() => {
                        fileInputRef.current?.click();
                      }}
                    >
                      Change Image
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
          ) : avatarUrlSigned ? (
            <Box
              w={{ base: '120px', sm: '150px', md: '180px' }}
              h={{ base: '120px', sm: '150px', md: '180px' }}
              borderRadius='full'
              overflow='hidden'
              border='4px solid'
              borderColor='gray.200'
              _dark={{ borderColor: 'gray.700' }}
              mx='auto'
              mb={2}
              position='relative'
            >
              <img
                src={avatarUrlSigned}
                alt={profile?.name || 'Profile'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </Box>
          ) : (
            <Box
              w={{ base: '120px', sm: '150px', md: '180px' }}
              h={{ base: '120px', sm: '150px', md: '180px' }}
              borderRadius='full'
              bg='blue.500'
              display='flex'
              alignItems='center'
              justifyContent='center'
              color='white'
              fontSize={{ base: '3xl', sm: '4xl', md: '5xl' }}
              fontWeight='bold'
              mx='auto'
              mb={2}
            >
              {(profile?.name || profile?.username || 'U')
                ?.charAt(0)
                .toUpperCase()}
            </Box>
          )}

          {/* Hidden file input for avatar upload */}
          {isOwnProfile && user && (
            <Input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              display='none'
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                // Validate file size (5MB)
                const fileSizeMB = file.size / (1024 * 1024);
                if (fileSizeMB > 5) {
                  toaster.create({
                    title: 'File too large',
                    description: 'Image must be less than 5MB',
                    type: 'error',
                  });
                  return;
                }

                // Validate file type
                if (!file.type.startsWith('image/')) {
                  toaster.create({
                    title: 'Invalid file type',
                    description: 'Please select an image file',
                    type: 'error',
                  });
                  return;
                }

                setUploadingAvatar(true);
                try {
                  // Compress image before uploading (max 500KB)
                  const options = {
                    maxSizeMB: 0.5, // 500KB
                    maxWidthOrHeight: 1920,
                    useWebWorker: true,
                    fileType: file.type,
                  };

                  let compressedFile: File;
                  try {
                    compressedFile = await imageCompression(file, options);
                    console.log(
                      'Original file size:',
                      (file.size / 1024 / 1024).toFixed(2),
                      'MB',
                    );
                    console.log(
                      'Compressed file size:',
                      (compressedFile.size / 1024 / 1024).toFixed(2),
                      'MB',
                    );
                  } catch (compressError) {
                    console.error('Image compression failed:', compressError);
                    // Continue with original file if compression fails
                    compressedFile = file;
                  }

                  // Delete old avatar if it exists
                  const currentAvatarUrl =
                    formik.values.avatarUrl || profile?.avatarUrl;
                  if (currentAvatarUrl) {
                    try {
                      await deleteImage(currentAvatarUrl);
                      console.log('Old avatar deleted successfully');
                    } catch (deleteError) {
                      // Non-critical error, continue with upload
                      console.warn('Failed to delete old avatar:', deleteError);
                    }
                  }

                  // Upload compressed image - returns file path, not URL
                  const filePath = await uploadImage(
                    compressedFile,
                    'avatars',
                    'profile',
                    user.id,
                  );
                  formik.setFieldValue('avatarUrl', filePath);

                  // Auto-save avatar path
                  const { data } = await client.mutate<{
                    updateMe: UserProfile;
                  }>({
                    mutation: UPDATE_PROFILE,
                    variables: {
                      data: {
                        avatarUrl: filePath,
                      },
                    },
                  });

                  if (data?.updateMe) {
                    setProfile(data.updateMe);
                    // Get signed URL for the new avatar
                    try {
                      const signedUrl = await getSignedUrl(filePath);
                      setAvatarUrlSigned(signedUrl);
                    } catch (error) {
                      console.error('Failed to get signed URL:', error);
                    }
                    toaster.create({
                      title: 'Avatar updated successfully!',
                      type: 'success',
                    });
                  }
                } catch (error: any) {
                  toaster.create({
                    title: error.message || 'Failed to upload avatar',
                    type: 'error',
                  });
                } finally {
                  setUploadingAvatar(false);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }
              }}
            />
          )}

          <Heading size={{ base: '2xl', sm: '3xl', md: '4xl' }}>
            {isOwnProfile ? 'Account' : profile?.username || 'Profile'}
          </Heading>
          <Text color='gray.400' fontSize={{ base: 'sm', sm: 'md', md: 'lg' }}>
            {isOwnProfile
              ? 'Update your personal information'
              : profile?.bio || 'User profile'}
          </Text>

          {/* Friend action button and Start Chat - only show on other users' profiles */}
          {!isOwnProfile && profileUserId && (
            <HStack gap={3} justify='center' flexWrap='wrap'>
              <Button
                variant={'outline'}
                colorScheme={isFriend ? 'red' : 'green'}
                size={{ base: 'md', sm: 'lg' }}
                onClick={async () => {
                  setFriendActionLoading(true);
                  try {
                    if (isFriend) {
                      await client.mutate({
                        mutation: REMOVE_FRIEND,
                        variables: { friendId: profileUserId },
                      });
                      setIsFriend(false);
                      toaster.create({
                        title: 'Friend removed',
                        type: 'success',
                      });
                    } else {
                      // Send friend request
                      await client.mutate({
                        mutation: SEND_FRIEND_REQUEST,
                        variables: { receiverId: profileUserId },
                      });
                      setHasPendingRequest(true);
                      toaster.create({
                        title: 'Friend request sent',
                        type: 'success',
                      });
                      // Refresh friend status check
                      const checkStatus = async () => {
                        try {
                          const sentRequestsData = await client.query<{
                            sentFriendRequests: any[];
                          }>({
                            query: GET_SENT_FRIEND_REQUESTS,
                            fetchPolicy: 'network-only',
                          });
                          const sentRequests =
                            sentRequestsData.data?.sentFriendRequests || [];
                          const hasSentRequest = sentRequests.some(
                            (req) => req.receiver?.id === profileUserId,
                          );
                          setHasPendingRequest(hasSentRequest);
                        } catch (error) {
                          console.error(
                            'Failed to refresh request status:',
                            error,
                          );
                        }
                      };
                      checkStatus();
                    }
                  } catch (error: any) {
                    toaster.create({
                      title: error.message || 'Failed to update friend status',
                      type: 'error',
                    });
                  } finally {
                    setFriendActionLoading(false);
                  }
                }}
                disabled={friendActionLoading || hasPendingRequest}
              >
                <HStack gap={2}>
                  {isFriend ? (
                    <>
                      <Icon>
                        <MdClose />
                      </Icon>
                      <Text>Remove Friend</Text>
                    </>
                  ) : hasPendingRequest ? (
                    <Text>Request Sent</Text>
                  ) : (
                    <Text>Add Friend</Text>
                  )}
                </HStack>
              </Button>
              {isFriend && (
                <Button
                  colorScheme='blue'
                  size={{ base: 'md', sm: 'lg' }}
                  onClick={() => {
                    // TODO: Implement chat functionality
                    toaster.create({
                      title: 'Chat feature coming soon',
                      type: 'info',
                    });
                  }}
                >
                  <>
                    <Icon>
                      <IoChatbubbleEllipsesOutline />
                    </Icon>
                    <Text>Start Chat</Text>
                  </>
                </Button>
              )}
            </HStack>
          )}

          {/* Friends count - only show on own profile */}
          {isOwnProfile && (
            <Text
              as='button'
              onClick={async () => {
                setFriendsDialogOpen(true);
                if (friends.length === 0 && !friendsLoading) {
                  setFriendsLoading(true);
                  try {
                    const { data } = await client.query<{ friends: any[] }>({
                      query: GET_FRIENDS,
                      fetchPolicy: 'network-only',
                    });
                    setFriends(data?.friends || []);
                  } catch (error) {
                    console.error('Failed to fetch friends:', error);
                    toaster.create({
                      title: 'Failed to load friends',
                      type: 'error',
                    });
                  } finally {
                    setFriendsLoading(false);
                  }
                }
              }}
              textDecoration='underline'
              cursor='pointer'
              color='blue.500'
              fontSize={{ base: 'sm', sm: 'md' }}
              _hover={{ color: 'blue.600' }}
              mt={1}
            >
              {friends.length} {friends.length === 1 ? 'Friend' : 'Friends'}
            </Text>
          )}
        </VStack>

        {isOwnProfile ? (
          <form onSubmit={formik.handleSubmit}>
            <VStack gap={{ base: 4, sm: 6 }} align='stretch'>
              {/* Basic Info Section */}
              <Box>
                <Heading
                  size={{ base: 'md', sm: 'lg' }}
                  mb={{ base: 3, sm: 4 }}
                >
                  Basic Information
                </Heading>
                <VStack gap={{ base: 3, sm: 4 }} align='stretch'>
                  <Box>
                    <Text
                      mb={1}
                      fontWeight='medium'
                      fontSize={{ base: 'sm', sm: 'md' }}
                    >
                      Name
                    </Text>
                    <Box position='relative'>
                      <Input
                        name='name'
                        placeholder='Your full name (Only visible to you)'
                        size={{ base: 'md', sm: 'lg' }}
                        value={formik.values.name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        pr={10}
                      />
                      <Box
                        position='absolute'
                        right={3}
                        top='50%'
                        transform='translateY(-50%)'
                        pointerEvents='none'
                      >
                        <Icon color='gray.400' size='md'>
                          <MdEdit />
                        </Icon>
                      </Box>
                    </Box>
                    {formik.touched.name && formik.errors.name && (
                      <Text
                        color='red.500'
                        fontSize={{ base: 'xs', sm: 'sm' }}
                        mt={1}
                      >
                        {formik.errors.name}
                      </Text>
                    )}
                  </Box>

                  <Box>
                    <Text
                      mb={1}
                      fontWeight='medium'
                      fontSize={{ base: 'sm', sm: 'md' }}
                    >
                      Username
                    </Text>
                    <Box position='relative'>
                      <Input
                        name='username'
                        placeholder='Set a unique username'
                        size={{ base: 'md', sm: 'lg' }}
                        value={formik.values.username}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        pr={10}
                      />
                      <Box
                        position='absolute'
                        right={3}
                        top='50%'
                        transform='translateY(-50%)'
                        pointerEvents='none'
                      >
                        <Icon color='gray.400' size='md'>
                          <MdEdit />
                        </Icon>
                      </Box>
                    </Box>
                    {formik.touched.username && formik.errors.username && (
                      <Text
                        color='red.500'
                        fontSize={{ base: 'xs', sm: 'sm' }}
                        mt={1}
                      >
                        {formik.errors.username}
                      </Text>
                    )}
                  </Box>

                  <Box>
                    <Text
                      mb={1}
                      fontWeight='medium'
                      fontSize={{ base: 'sm', sm: 'md' }}
                    >
                      Bio
                    </Text>
                    <Box position='relative'>
                      <Textarea
                        name='bio'
                        placeholder='Tell us about yourself...'
                        size={{ base: 'md', sm: 'lg' }}
                        value={formik.values.bio}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        rows={4}
                        pr={10}
                      />
                      <Box
                        position='absolute'
                        right={2}
                        top={2}
                        pointerEvents='none'
                      >
                        <Icon color='gray.400' size='md'>
                          <MdEdit />
                        </Icon>
                      </Box>
                    </Box>
                    {formik.touched.bio && formik.errors.bio && (
                      <Text
                        color='red.500'
                        fontSize={{ base: 'xs', sm: 'sm' }}
                        mt={1}
                      >
                        {formik.errors.bio}
                      </Text>
                    )}
                  </Box>

                  <HStack
                    gap={{ base: 3, sm: 4 }}
                    flexDirection={{ base: 'column', sm: 'row' }}
                    align={{ base: 'stretch', sm: 'flex-end' }}
                  >
                    <Box flex={{ base: 'none', sm: 1 }}>
                      <Text
                        mb={1}
                        fontWeight='medium'
                        fontSize={{ base: 'sm', sm: 'md' }}
                      >
                        Country
                      </Text>
                      {/* Country dropdown */}
                      <Menu.Root positioning={{ sameWidth: true, flip: true }}>
                        <Menu.Trigger asChild>
                          <Button
                            variant='outline'
                            size={{ base: 'md', sm: 'lg' }}
                            width='full'
                            justifyContent='space-between'
                          >
                            <HStack gap={2}>
                              {formik.values.country &&
                                formik.values.country.length === 2 && (
                                  <FlagIcon
                                    countryCode={formik.values.country}
                                    size={18}
                                  />
                                )}
                              <Text fontSize={{ base: 'sm', sm: 'md' }}>
                                {(() => {
                                  const dn =
                                    typeof window !== 'undefined'
                                      ? new Intl.DisplayNames(['en'], {
                                          type: 'region',
                                        })
                                      : null;
                                  if (!formik.values.country)
                                    return 'Select country';
                                  const code =
                                    formik.values.country.toUpperCase();
                                  return code.length === 2 && dn
                                    ? dn.of(code)
                                    : formik.values.country;
                                })()}
                              </Text>
                            </HStack>
                          </Button>
                        </Menu.Trigger>
                        <Portal>
                          <Menu.Positioner>
                            <Menu.Content maxH='300px' overflowY='auto'>
                              {[
                                'TR',
                                'DE',
                                'US',
                                'GB',
                                'CA',
                                'FR',
                                'ES',
                                'PT',
                                'IT',
                                'NL',
                                'BE',
                                'SE',
                                'NO',
                                'DK',
                                'FI',
                                'PL',
                                'CZ',
                                'SK',
                                'SI',
                                'RO',
                                'HU',
                                'GR',
                                'UA',
                                'RU',
                                'IN',
                                'JP',
                                'CN',
                                'KR',
                                'BR',
                                'AR',
                                'MX',
                                'AU',
                                'NZ',
                                'IE',
                                'IL',
                                'SA',
                                'AE',
                                'ZA',
                                'EG',
                                'PK',
                                'BD',
                                'VN',
                                'TH',
                                'ID',
                                'MY',
                                'PH',
                              ].map((code) => (
                                <Menu.Item
                                  key={code}
                                  value={code}
                                  onClick={() =>
                                    formik.setFieldValue('country', code)
                                  }
                                >
                                  <HStack gap={2}>
                                    <FlagIcon countryCode={code} size={16} />
                                    <Text>
                                      {typeof window !== 'undefined'
                                        ? new Intl.DisplayNames(['en'], {
                                            type: 'region',
                                          }).of(code)
                                        : code}
                                    </Text>
                                  </HStack>
                                </Menu.Item>
                              ))}
                            </Menu.Content>
                          </Menu.Positioner>
                        </Portal>
                      </Menu.Root>
                      {formik.touched.country && formik.errors.country && (
                        <Text
                          color='red.500'
                          fontSize={{ base: 'xs', sm: 'sm' }}
                          mt={1}
                        >
                          {formik.errors.country as string}
                        </Text>
                      )}
                    </Box>

                    <Box w={{ base: 'full', sm: '200px' }}>
                      <Text
                        mb={1}
                        fontWeight='medium'
                        fontSize={{ base: 'sm', sm: 'md' }}
                      >
                        Age
                      </Text>
                      <Input
                        name='age'
                        placeholder='e.g., 29'
                        size={{ base: 'md', sm: 'lg' }}
                        inputMode='numeric'
                        type='number'
                        min={16}
                        max={99}
                        value={formik.values.age}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                      {formik.touched.age && formik.errors.age && (
                        <Text
                          color='red.500'
                          fontSize={{ base: 'xs', sm: 'sm' }}
                          mt={1}
                        >
                          {formik.errors.age as string}
                        </Text>
                      )}
                    </Box>
                  </HStack>
                </VStack>
              </Box>

              {/* Languages Known Section */}
              <Box>
                <HStack
                  justify='space-between'
                  mb={{ base: 3, sm: 4 }}
                  flexWrap='wrap'
                  gap={2}
                >
                  <Heading size={{ base: 'md', sm: 'lg' }}>
                    Languages I Know
                  </Heading>
                  <Button
                    size={{ base: 'xs', sm: 'sm' }}
                    variant={'outline'}
                    onClick={() => addLanguage('known')}
                  >
                    <HStack gap={1}>
                      <MdAdd />
                      <Text fontSize={{ base: 'xs', sm: 'sm' }}>
                        Add Language
                      </Text>
                    </HStack>
                  </Button>
                </HStack>
                <VStack gap={{ base: 2, sm: 3 }} align='stretch'>
                  {(formik.values.languagesKnown as LanguageInput[]).map(
                    (lang, index) => (
                      <HStack
                        key={index}
                        gap={{ base: 1, sm: 2 }}
                        position='relative'
                        flexWrap={{ base: 'wrap', sm: 'nowrap' }}
                      >
                        <Box
                          flex={1}
                          minW={{ base: 'calc(100% - 80px)', sm: 'auto' }}
                        >
                          <Menu.Root
                            positioning={{ sameWidth: true, flip: true }}
                          >
                            <Menu.Trigger asChild>
                              <Button
                                variant='outline'
                                size={{ base: 'sm', sm: 'md' }}
                                width='full'
                                justifyContent='space-between'
                              >
                                <HStack gap={2}>
                                  <FlagIcon
                                    countryCode={
                                      lang.code
                                        ? languageToCountryCode(lang.code)
                                        : lang.name
                                          ? languageToCountryCode(
                                              getLanguageCode(lang.name),
                                            )
                                          : undefined
                                    }
                                    size={16}
                                  />
                                  <Text fontSize={{ base: 'xs', sm: 'sm' }}>
                                    {lang.name || 'Select language'}
                                  </Text>
                                </HStack>
                              </Button>
                            </Menu.Trigger>
                            <Portal>
                              <Menu.Positioner>
                                <Menu.Content maxH='300px' overflowY='auto'>
                                  {getAvailableKnownLanguages(index).map(
                                    (language) => (
                                      <Menu.Item
                                        key={language.code}
                                        value={language.name}
                                        onClick={() =>
                                          updateLanguage(
                                            'known',
                                            index,
                                            'name',
                                            language.name,
                                          )
                                        }
                                      >
                                        <HStack gap={2}>
                                          <FlagIcon
                                            countryCode={languageToCountryCode(
                                              language.code,
                                            )}
                                            size={16}
                                          />
                                          <Text>{language.name}</Text>
                                        </HStack>
                                      </Menu.Item>
                                    ),
                                  )}
                                </Menu.Content>
                              </Menu.Positioner>
                            </Portal>
                          </Menu.Root>
                        </Box>

                        <Box
                          w={{ base: 'calc(100% - 60px)', sm: '200px' }}
                          flexShrink={0}
                        >
                          <Menu.Root
                            positioning={{ sameWidth: true, flip: true }}
                          >
                            <Menu.Trigger asChild>
                              <Button
                                variant='outline'
                                size={{ base: 'sm', sm: 'md' }}
                                width='full'
                                justifyContent='space-between'
                              >
                                <Text fontSize={{ base: 'xs', sm: 'sm' }}>
                                  {lang.level || 'Select level'}
                                </Text>
                              </Button>
                            </Menu.Trigger>
                            <Portal>
                              <Menu.Positioner>
                                <Menu.Content>
                                  {LANGUAGE_LEVELS.map((level) => (
                                    <Menu.Item
                                      key={level.value}
                                      value={level.value}
                                      onClick={() =>
                                        updateLanguage(
                                          'known',
                                          index,
                                          'level',
                                          level.value,
                                        )
                                      }
                                    >
                                      {level.label}
                                    </Menu.Item>
                                  ))}
                                </Menu.Content>
                              </Menu.Positioner>
                            </Portal>
                          </Menu.Root>
                        </Box>

                        <IconButton
                          aria-label='Remove'
                          onClick={() => removeLanguage('known', index)}
                          colorScheme='red'
                          variant='ghost'
                          size={{ base: 'sm', sm: 'md' }}
                        >
                          <MdDelete />
                        </IconButton>
                      </HStack>
                    ),
                  )}
                </VStack>
              </Box>

              {/* Languages Learning Section */}
              <Box>
                <HStack
                  justify='space-between'
                  mb={{ base: 3, sm: 4 }}
                  flexWrap='wrap'
                  gap={2}
                >
                  <Heading size={{ base: 'md', sm: 'lg' }}>
                    Languages I'm Learning
                  </Heading>
                  <Button
                    size={{ base: 'xs', sm: 'sm' }}
                    variant={'outline'}
                    onClick={() => addLanguage('learn')}
                  >
                    <HStack gap={1}>
                      <MdAdd />
                      <Text fontSize={{ base: 'xs', sm: 'sm' }}>
                        Add Language
                      </Text>
                    </HStack>
                  </Button>
                </HStack>
                <VStack gap={{ base: 2, sm: 3 }} align='stretch'>
                  {(formik.values.languagesLearn as LanguageInput[]).map(
                    (lang, index) => (
                      <HStack
                        key={index}
                        gap={{ base: 1, sm: 2 }}
                        position='relative'
                        flexWrap={{ base: 'wrap', sm: 'nowrap' }}
                      >
                        <Box
                          flex={1}
                          minW={{ base: 'calc(100% - 80px)', sm: 'auto' }}
                        >
                          <Menu.Root
                            positioning={{ sameWidth: true, flip: true }}
                          >
                            <Menu.Trigger asChild>
                              <Button
                                variant='outline'
                                size={{ base: 'sm', sm: 'md' }}
                                width='full'
                                justifyContent='space-between'
                              >
                                <HStack gap={2}>
                                  <FlagIcon
                                    countryCode={
                                      lang.code
                                        ? languageToCountryCode(lang.code)
                                        : lang.name
                                          ? languageToCountryCode(
                                              getLanguageCode(lang.name),
                                            )
                                          : undefined
                                    }
                                    size={16}
                                  />
                                  <Text fontSize={{ base: 'xs', sm: 'sm' }}>
                                    {lang.name || 'Select language'}
                                  </Text>
                                </HStack>
                              </Button>
                            </Menu.Trigger>
                            <Portal>
                              <Menu.Positioner>
                                <Menu.Content maxH='300px' overflowY='auto'>
                                  {getAvailableLearnLanguages(index).map(
                                    (language) => (
                                      <Menu.Item
                                        key={language.code}
                                        value={language.name}
                                        onClick={() =>
                                          updateLanguage(
                                            'learn',
                                            index,
                                            'name',
                                            language.name,
                                          )
                                        }
                                      >
                                        <HStack gap={2}>
                                          <FlagIcon
                                            countryCode={languageToCountryCode(
                                              language.code,
                                            )}
                                            size={16}
                                          />
                                          <Text>{language.name}</Text>
                                        </HStack>
                                      </Menu.Item>
                                    ),
                                  )}
                                </Menu.Content>
                              </Menu.Positioner>
                            </Portal>
                          </Menu.Root>
                        </Box>

                        <Box
                          w={{ base: 'calc(100% - 60px)', sm: '200px' }}
                          flexShrink={0}
                        >
                          <Menu.Root
                            positioning={{ sameWidth: true, flip: true }}
                          >
                            <Menu.Trigger asChild>
                              <Button
                                variant='outline'
                                size={{ base: 'sm', sm: 'md' }}
                                width='full'
                                justifyContent='space-between'
                              >
                                <Text fontSize={{ base: 'xs', sm: 'sm' }}>
                                  {lang.level || 'Select level'}
                                </Text>
                              </Button>
                            </Menu.Trigger>
                            <Portal>
                              <Menu.Positioner>
                                <Menu.Content>
                                  {LANGUAGE_LEVELS.filter(
                                    (level) => level.value !== 'Native',
                                  ).map((level) => (
                                    <Menu.Item
                                      key={level.value}
                                      value={level.value}
                                      onClick={() =>
                                        updateLanguage(
                                          'learn',
                                          index,
                                          'level',
                                          level.value,
                                        )
                                      }
                                    >
                                      {level.label}
                                    </Menu.Item>
                                  ))}
                                </Menu.Content>
                              </Menu.Positioner>
                            </Portal>
                          </Menu.Root>
                        </Box>

                        <IconButton
                          aria-label='Remove'
                          onClick={() => removeLanguage('learn', index)}
                          colorScheme='red'
                          variant='ghost'
                          size={{ base: 'sm', sm: 'md' }}
                        >
                          <MdDelete />
                        </IconButton>
                      </HStack>
                    ),
                  )}
                </VStack>
              </Box>

              {/* Action Buttons */}
              <HStack gap={4} pt={4}>
                <Button
                  type='submit'
                  size={{ base: 'md', sm: 'lg' }}
                  flex={1}
                  colorScheme='blue'
                  disabled={
                    formik.isSubmitting ||
                    hasIncompleteLanguages() ||
                    hasDuplicateLanguages() ||
                    !hasMinimumLanguages() ||
                    !hasNativeLanguage()
                  }
                >
                  {formik.isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </HStack>

              {/* Password Section */}
              <Box>
                <Heading
                  size={{ base: 'md', sm: 'lg' }}
                  mb={{ base: 3, sm: 4 }}
                  mt={{ base: 6, sm: 8 }}
                >
                  Password
                </Heading>
                <HStack
                  justify={'space-between'}
                  flexDirection={{ base: 'column', sm: 'row' }}
                  gap={{ base: 3, sm: 0 }}
                  align={{ base: 'stretch', sm: 'center' }}
                >
                  <Text color='gray.400' fontSize={{ base: 'xs', sm: 'sm' }}>
                    You can send yourself a password reset email.
                  </Text>
                  <Button
                    variant='outline'
                    size={{ base: 'sm', sm: 'md' }}
                    width={{ base: 'full', sm: 'auto' }}
                    onClick={async () => {
                      try {
                        await client.mutate({
                          mutation: RESET_PASSWORD,
                          variables: { email: profile?.email },
                        });
                        toaster.create({
                          title: 'Reset email sent',
                          type: 'success',
                        });
                      } catch (e: any) {
                        toaster.create({
                          title: e.message || 'Failed to send reset email',
                          type: 'error',
                        });
                      }
                    }}
                  >
                    Reset Password
                  </Button>
                </HStack>
              </Box>

              {/* Danger Zone: Delete Account */}
              {profile?.role !== 'ADMIN' && profile?.role !== 'MODERATOR' && (
                <Box>
                  <Heading
                    size={{ base: 'md', sm: 'lg' }}
                    mb={{ base: 3, sm: 4 }}
                    mt={{ base: 6, sm: 8 }}
                    color='red.400'
                  >
                    Danger Zone
                  </Heading>
                  <DeleteAccountSection />
                </Box>
              )}
            </VStack>
          </form>
        ) : (
          // Read-only view for other users
          <VStack gap={{ base: 4, sm: 6 }} align='stretch'>
            {/* Basic Info Section */}
            <Box>
              <Heading size={{ base: 'md', sm: 'lg' }} mb={{ base: 3, sm: 4 }}>
                Basic Information
              </Heading>
              <VStack gap={{ base: 3, sm: 4 }} align='stretch'>
                <Box>
                  <Text
                    mb={1}
                    fontWeight='medium'
                    fontSize={{ base: 'sm', sm: 'md' }}
                  >
                    Username
                  </Text>
                  <Text fontSize={{ base: 'md', sm: 'lg' }}>
                    {profile?.username || 'Not provided'}
                  </Text>
                </Box>

                <Box>
                  <Text
                    mb={1}
                    fontWeight='medium'
                    fontSize={{ base: 'sm', sm: 'md' }}
                  >
                    Bio
                  </Text>
                  <Text fontSize={{ base: 'md', sm: 'lg' }}>
                    {profile?.bio || 'No bio provided'}
                  </Text>
                </Box>

                <HStack
                  gap={{ base: 3, sm: 4 }}
                  flexDirection={{ base: 'column', sm: 'row' }}
                  align={{ base: 'stretch', sm: 'flex-end' }}
                >
                  <Box flex={{ base: 'none', sm: 1 }}>
                    <Text
                      mb={1}
                      fontWeight='medium'
                      fontSize={{ base: 'sm', sm: 'md' }}
                    >
                      Country
                    </Text>
                    <HStack gap={2}>
                      {profile?.country && profile.country.length === 2 && (
                        <FlagIcon countryCode={profile.country} size={18} />
                      )}
                      <Text fontSize={{ base: 'sm', sm: 'md' }}>
                        {(() => {
                          const dn =
                            typeof window !== 'undefined'
                              ? new Intl.DisplayNames(['en'], {
                                  type: 'region',
                                })
                              : null;
                          if (!profile?.country) return 'Not provided';
                          const code = profile.country.toUpperCase();
                          return code.length === 2 && dn
                            ? dn.of(code)
                            : profile.country;
                        })()}
                      </Text>
                    </HStack>
                  </Box>

                  <Box w={{ base: 'full', sm: '200px' }}>
                    <Text
                      mb={1}
                      fontWeight='medium'
                      fontSize={{ base: 'sm', sm: 'md' }}
                    >
                      Age
                    </Text>
                    <Text fontSize={{ base: 'md', sm: 'lg' }}>
                      {profile?.age || 'Not provided'}
                    </Text>
                  </Box>
                </HStack>
              </VStack>
            </Box>

            {/* Languages Known Section */}
            {profile?.languagesKnown && profile.languagesKnown.length > 0 && (
              <Box>
                <Heading
                  size={{ base: 'md', sm: 'lg' }}
                  mb={{ base: 3, sm: 4 }}
                >
                  Languages I Know
                </Heading>
                <VStack gap={{ base: 2, sm: 3 }} align='stretch'>
                  {profile.languagesKnown.map((lang, index) => (
                    <HStack key={index} gap={{ base: 2, sm: 3 }}>
                      <FlagIcon
                        countryCode={
                          lang.code
                            ? languageToCountryCode(lang.code)
                            : lang.name
                              ? languageToCountryCode(
                                  getLanguageCode(lang.name),
                                )
                              : undefined
                        }
                        size={20}
                      />
                      <Text fontSize={{ base: 'sm', sm: 'md' }}>
                        {lang.name}
                      </Text>
                      <Text
                        color='gray.500'
                        fontSize={{ base: 'xs', sm: 'sm' }}
                      >
                        ({lang.level})
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            )}

            {/* Languages Learning Section */}
            {profile?.languagesLearn && profile.languagesLearn.length > 0 && (
              <Box>
                <Heading
                  size={{ base: 'md', sm: 'lg' }}
                  mb={{ base: 3, sm: 4 }}
                >
                  Languages I'm Learning
                </Heading>
                <VStack gap={{ base: 2, sm: 3 }} align='stretch'>
                  {profile.languagesLearn.map((lang, index) => (
                    <HStack key={index} gap={{ base: 2, sm: 3 }}>
                      <FlagIcon
                        countryCode={
                          lang.code
                            ? languageToCountryCode(lang.code)
                            : lang.name
                              ? languageToCountryCode(
                                  getLanguageCode(lang.name),
                                )
                              : undefined
                        }
                        size={20}
                      />
                      <Text fontSize={{ base: 'sm', sm: 'md' }}>
                        {lang.name}
                      </Text>
                      <Text
                        color='gray.500'
                        fontSize={{ base: 'xs', sm: 'sm' }}
                      >
                        ({lang.level})
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            )}
          </VStack>
        )}
      </Box>

      {/* Friends Dialog */}
      <FriendsDialog
        open={friendsDialogOpen}
        onClose={() => setFriendsDialogOpen(false)}
        router={router}
      />
    </Box>
  );
}

// Friends Dialog Component
function FriendsDialog({
  open,
  onClose,
  router,
}: {
  open: boolean;
  onClose: () => void;
  router: any;
}) {
  const [friends, setFriends] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('friends');
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchAllData();
    }
  }, [open]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Use Promise.allSettled to handle individual failures gracefully
      const results = await Promise.allSettled([
        client.query<{ friends: any[] }>({
          query: GET_FRIENDS,
          fetchPolicy: 'network-only',
        }),
        client.query<{ sentFriendRequests: any[] }>({
          query: GET_SENT_FRIEND_REQUESTS,
          fetchPolicy: 'network-only',
        }),
        client.query<{ pendingFriendRequests: any[] }>({
          query: GET_PENDING_FRIEND_REQUESTS,
          fetchPolicy: 'network-only',
        }),
      ]);

      // Handle friends query
      if (results[0].status === 'fulfilled') {
        setFriends(results[0].value.data?.friends || []);
      } else {
        console.error('Failed to fetch friends:', results[0].reason);
        setFriends([]);
      }

      // Handle sent requests query
      if (results[1].status === 'fulfilled') {
        setSentRequests(results[1].value.data?.sentFriendRequests || []);
      } else {
        console.error('Failed to fetch sent requests:', results[1].reason);
        setSentRequests([]);
      }

      // Handle received requests query
      if (results[2].status === 'fulfilled') {
        setReceivedRequests(results[2].value.data?.pendingFriendRequests || []);
      } else {
        console.error('Failed to fetch received requests:', results[2].reason);
        setReceivedRequests([]);
      }

      // Only show error if all queries failed
      const allFailed = results.every((r) => r.status === 'rejected');
      if (allFailed) {
        toaster.create({
          title: 'Failed to load friend data',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Unexpected error fetching friend data:', error);
      // Set empty arrays as fallback
      setFriends([]);
      setSentRequests([]);
      setReceivedRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToRequest = async (requestId: string, accept: boolean) => {
    setRespondingTo(requestId);
    try {
      await client.mutate({
        mutation: RESPOND_FRIEND_REQUEST,
        variables: { requestId, accept },
      });
      toaster.create({
        title: accept ? 'Friend request accepted' : 'Friend request rejected',
        type: 'success',
      });
      await fetchAllData();
    } catch (error: any) {
      toaster.create({
        title: error.message || 'Failed to respond to request',
        type: 'error',
      });
    } finally {
      setRespondingTo(null);
    }
  };

  const renderUserGrid = (users: any[]) => {
    if (users.length === 0) {
      return (
        <VStack gap={4} py={8}>
          <Text color='gray.400' fontSize={{ base: 'sm', sm: 'md' }}>
            No items to display
          </Text>
        </VStack>
      );
    }

    return (
      <Box maxH='60vh' overflowY='auto'>
        <Grid
          templateColumns={{
            base: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          }}
          gap={4}
        >
          {users.map((user: any) => (
            <GridItem key={user.id}>
              <UserCard
                id={user.id}
                name={null}
                email={user.email}
                username={user.username}
                avatarUrl={user.avatarUrl}
                country={user.country}
                age={user.age}
                languagesKnown={user.languagesKnown}
                languagesLearn={user.languagesLearn}
              />
            </GridItem>
          ))}
        </Grid>
      </Box>
    );
  };

  const renderRequestGrid = (requests: any[], type: 'sent' | 'received') => {
    if (requests.length === 0) {
      return (
        <VStack gap={4} py={8}>
          <Text color='gray.400' fontSize={{ base: 'sm', sm: 'md' }}>
            No {type === 'sent' ? 'sent' : 'received'} requests
          </Text>
        </VStack>
      );
    }

    return (
      <Box maxH='60vh' overflowY='auto'>
        <Grid
          templateColumns={{
            base: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          }}
          gap={4}
        >
          {requests.map((request: any) => {
            const user = type === 'sent' ? request.receiver : request.sender;
            return (
              <GridItem key={request.id}>
                <Box position='relative'>
                  <UserCard
                    id={user.id}
                    name={null}
                    email={user.email}
                    username={user.username}
                    avatarUrl={user.avatarUrl}
                    country={user.country}
                    age={user.age}
                    languagesKnown={user.languagesKnown}
                    languagesLearn={user.languagesLearn}
                  />
                  {type === 'received' && (
                    <HStack gap={2} mt={2} justify='center' flexWrap='wrap'>
                      <Button
                        size='sm'
                        colorScheme='green'
                        onClick={() => handleRespondToRequest(request.id, true)}
                        disabled={respondingTo === request.id}
                      >
                        Accept
                      </Button>
                      <Button
                        size='sm'
                        colorScheme='red'
                        variant='outline'
                        onClick={() =>
                          handleRespondToRequest(request.id, false)
                        }
                        disabled={respondingTo === request.id}
                      >
                        Reject
                      </Button>
                    </HStack>
                  )}
                </Box>
              </GridItem>
            );
          })}
        </Grid>
      </Box>
    );
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => !e.open && onClose()}
      placement='center'
    >
      <Dialog.Backdrop />
      <Portal>
        <Dialog.Positioner>
          <Dialog.Content maxW={{ base: '90vw', sm: '600px', md: '800px' }}>
            <Dialog.Header>
              <Dialog.Title>
                <Text fontSize={{ base: 'lg', sm: 'xl', md: '2xl' }}>
                  Friends & Requests
                </Text>
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Tabs.Root
                value={activeTab}
                onValueChange={(e) => setActiveTab(e.value as string)}
              >
                <Tabs.List>
                  <Tabs.Trigger value='friends'>
                    Friends ({friends.length})
                  </Tabs.Trigger>
                  <Tabs.Trigger value='sent'>
                    Sent ({sentRequests.length})
                  </Tabs.Trigger>
                  <Tabs.Trigger value='received'>
                    Received ({receivedRequests.length})
                  </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value='friends'>
                  {loading ? (
                    <Flex justify='center' align='center' py={8}>
                      <Text>Loading friends...</Text>
                    </Flex>
                  ) : friends.length === 0 ? (
                    <VStack gap={4} py={8}>
                      <Text
                        color='gray.400'
                        fontSize={{ base: 'sm', sm: 'md' }}
                      >
                        You don't have any friends yet.
                      </Text>
                      <Button
                        colorScheme='blue'
                        onClick={() => {
                          onClose();
                          router.push('/discover');
                        }}
                        size={{ base: 'md', sm: 'lg' }}
                      >
                        Discover People
                      </Button>
                    </VStack>
                  ) : (
                    renderUserGrid(friends)
                  )}
                </Tabs.Content>
                <Tabs.Content value='sent'>
                  {loading ? (
                    <Flex justify='center' align='center' py={8}>
                      <Text>Loading sent requests...</Text>
                    </Flex>
                  ) : (
                    renderRequestGrid(sentRequests, 'sent')
                  )}
                </Tabs.Content>
                <Tabs.Content value='received'>
                  {loading ? (
                    <Flex justify='center' align='center' py={8}>
                      <Text>Loading received requests...</Text>
                    </Flex>
                  ) : (
                    renderRequestGrid(receivedRequests, 'received')
                  )}
                </Tabs.Content>
              </Tabs.Root>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                variant='ghost'
                onClick={onClose}
                size={{ base: 'md', sm: 'lg' }}
              >
                Close
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

function DeleteAccountSection() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  return (
    <>
      <HStack
        justify={'space-between'}
        flexDirection={{ base: 'column', sm: 'row' }}
        gap={{ base: 3, sm: 0 }}
        align={{ base: 'stretch', sm: 'center' }}
      >
        <Text color='gray.400' fontSize={{ base: 'xs', sm: 'sm' }}>
          This action is irreversible. Your account and data will be permanently
          deleted.
        </Text>
        <Button
          colorPalette={'red'}
          variant='outline'
          onClick={() => setOpen(true)}
          size={{ base: 'sm', sm: 'md' }}
          width={{ base: 'full', sm: 'auto' }}
        >
          Delete Account
        </Button>
      </HStack>

      {/* Hidden Menu root to satisfy types (not rendered) */}
      <Box display='none'>
        <Menu.Root open={open} onOpenChange={(e) => setOpen(e.open)}>
          <Menu.Trigger />
        </Menu.Root>
      </Box>

      <Portal>
        {open && (
          <Box
            position='fixed'
            inset={0}
            display='flex'
            alignItems='center'
            justifyContent='center'
            bg='blackAlpha.600'
            zIndex={1000}
          >
            <Box
              bg='bg'
              p={{ base: 4, sm: 6 }}
              borderRadius='md'
              minW={{ base: '90%', sm: '380px', md: '480px' }}
              maxW={{ base: '90%', sm: '95%' }}
              mx={{ base: 2, sm: 0 }}
            >
              <Heading size={{ base: 'sm', sm: 'md' }} mb={2}>
                Confirm Deletion
              </Heading>
              <Text color='gray.400' mb={4} fontSize={{ base: 'xs', sm: 'sm' }}>
                Enter your password to confirm account deletion.
              </Text>
              <Input
                type='password'
                placeholder='Password'
                size={{ base: 'md', sm: 'lg' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                mb={4}
              />
              <HStack
                justify='flex-end'
                flexDirection={{ base: 'column', sm: 'row' }}
                gap={{ base: 2, sm: 0 }}
              >
                <Button
                  variant='ghost'
                  onClick={() => setOpen(false)}
                  width={{ base: 'full', sm: 'auto' }}
                  order={{ base: 2, sm: 1 }}
                >
                  Cancel
                </Button>
                <Button
                  colorPalette={'red'}
                  disabled={submitting || password.length === 0}
                  width={{ base: 'full', sm: 'auto' }}
                  size={{ base: 'md', sm: 'lg' }}
                  onClick={async () => {
                    setSubmitting(true);
                    try {
                      await client.mutate({
                        mutation: DELETE_ACCOUNT,
                        variables: { password },
                      });
                      toaster.create({
                        title: 'Account deleted',
                        type: 'success',
                      });
                      // Clear local auth
                      if (typeof window !== 'undefined') {
                        sessionStorage.removeItem('access_token');
                        sessionStorage.removeItem('refresh_token');
                        sessionStorage.removeItem('auth_user');
                      }
                      router.push('/signup');
                    } catch (e: any) {
                      toaster.create({
                        title: e?.message || 'Failed to delete account',
                        type: 'error',
                      });
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  {submitting ? 'Deleting...' : 'Delete'}
                </Button>
              </HStack>
            </Box>
          </Box>
        )}
      </Portal>
    </>
  );
}
