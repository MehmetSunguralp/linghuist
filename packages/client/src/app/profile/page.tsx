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
  NativeSelectRoot,
  NativeSelectField,
} from '@chakra-ui/react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { toaster } from '@/components/ui/toaster';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { client } from '@/lib/apolloClient';
import { GET_CURRENT_USER, UPDATE_PROFILE } from '@/lib/authQueries';
import { setAuthUser } from '@/store/reducers/authSlice';
import { MdDelete, MdAdd } from 'react-icons/md';
import { LANGUAGES, LANGUAGE_LEVELS, getLanguageCode } from '@/utils/languages';

interface Language {
  name: string;
  level: string;
  code: string;
}

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
  languagesKnown?: Language[];
  languagesLearn?: Language[];
}

export default function ProfilePage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/signin');
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data } = await client.query<{ me: UserProfile }>({
          query: GET_CURRENT_USER,
          fetchPolicy: 'network-only',
        });

        if (data?.me) {
          setProfile(data.me);
          formik.setValues({
            name: data.me.name || '',
            username: data.me.username || '',
            bio: data.me.bio || '',
            avatarUrl: data.me.avatarUrl || '',
            languagesKnown: data.me.languagesKnown || [],
            languagesLearn: data.me.languagesLearn || [],
          });
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
  }, [user, router]);

  const formik = useFormik({
    initialValues: {
      name: '',
      username: '',
      bio: '',
      avatarUrl: '',
      languagesKnown: [] as Language[],
      languagesLearn: [] as Language[],
    },
    validationSchema: Yup.object({
      name: Yup.string(),
      username: Yup.string()
        .min(3, 'Username must be at least 3 characters')
        .matches(
          /^[a-zA-Z0-9_]+$/,
          'Username can only contain letters, numbers, and underscores',
        ),
      bio: Yup.string().max(500, 'Bio must be less than 500 characters'),
      avatarUrl: Yup.string().url('Must be a valid URL'),
    }),
    onSubmit: async (values) => {
      try {
        // Strip __typename from language objects
        const cleanLanguages = (langs: Language[]) =>
          langs.map(({ name, level, code }) => ({ name, level, code }));

        const { data } = await client.mutate<{ updateMe: UserProfile }>({
          mutation: UPDATE_PROFILE,
          variables: {
            data: {
              name: values.name || null,
              username: values.username || null,
              bio: values.bio || null,
              avatarUrl: values.avatarUrl || null,
              languagesKnown:
                values.languagesKnown.length > 0
                  ? cleanLanguages(values.languagesKnown)
                  : null,
              languagesLearn:
                values.languagesLearn.length > 0
                  ? cleanLanguages(values.languagesLearn)
                  : null,
            },
          },
        });

        if (data?.updateMe) {
          dispatch(
            setAuthUser({ id: data.updateMe.id, email: data.updateMe.email }),
          );
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
      ...formik.values[field],
      { name: '', level: '', code: '' },
    ]);
  };

  const removeLanguage = (type: 'known' | 'learn', index: number) => {
    const field = type === 'known' ? 'languagesKnown' : 'languagesLearn';
    const updated = formik.values[field].filter((_, i) => i !== index);
    formik.setFieldValue(field, updated);
  };

  const updateLanguage = (
    type: 'known' | 'learn',
    index: number,
    key: keyof Language,
    value: string,
  ) => {
    const field = type === 'known' ? 'languagesKnown' : 'languagesLearn';
    const updated = [...formik.values[field]];
    updated[index] = { ...updated[index], [key]: value };

    // Auto-populate code when language name is selected
    if (key === 'name') {
      updated[index].code = getLanguageCode(value);
    }

    formik.setFieldValue(field, updated);
  };

  if (loading) {
    return (
      <Flex h='calc(100vh - 64px)' align='center' justify='center'>
        <Text>Loading profile...</Text>
      </Flex>
    );
  }

  return (
    <Box h='calc(100vh - 64px)' overflowY='auto' pt={8} pb={8}>
      <Box maxW='800px' w='full' px={6} mx='auto'>
        <VStack gap={2} mb={8} textAlign='center'>
          <Heading size='4xl'>Edit Profile</Heading>
          <Text color='gray.600'>Update your personal information</Text>
        </VStack>

        <form onSubmit={formik.handleSubmit}>
          <VStack gap={6} align='stretch'>
            {/* Basic Info Section */}
            <Box>
              <Heading size='lg' mb={4}>
                Basic Information
              </Heading>
              <VStack gap={4} align='stretch'>
                <Box>
                  <Text mb={1} fontWeight='medium'>
                    Name
                  </Text>
                  <Input
                    name='name'
                    placeholder='Your full name'
                    size='lg'
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  {formik.touched.name && formik.errors.name && (
                    <Text color='red.500' fontSize='sm' mt={1}>
                      {formik.errors.name}
                    </Text>
                  )}
                </Box>

                <Box>
                  <Text mb={1} fontWeight='medium'>
                    Username
                  </Text>
                  <Input
                    name='username'
                    placeholder='unique_username'
                    size='lg'
                    value={formik.values.username}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  {formik.touched.username && formik.errors.username && (
                    <Text color='red.500' fontSize='sm' mt={1}>
                      {formik.errors.username}
                    </Text>
                  )}
                </Box>

                <Box>
                  <Text mb={1} fontWeight='medium'>
                    Bio
                  </Text>
                  <Textarea
                    name='bio'
                    placeholder='Tell us about yourself...'
                    size='lg'
                    value={formik.values.bio}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    rows={4}
                  />
                  {formik.touched.bio && formik.errors.bio && (
                    <Text color='red.500' fontSize='sm' mt={1}>
                      {formik.errors.bio}
                    </Text>
                  )}
                </Box>

                <Box>
                  <Text mb={1} fontWeight='medium'>
                    Avatar URL
                  </Text>
                  <Input
                    name='avatarUrl'
                    placeholder='https://example.com/avatar.jpg'
                    size='lg'
                    value={formik.values.avatarUrl}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  {formik.touched.avatarUrl && formik.errors.avatarUrl && (
                    <Text color='red.500' fontSize='sm' mt={1}>
                      {formik.errors.avatarUrl}
                    </Text>
                  )}
                </Box>
              </VStack>
            </Box>

            {/* Languages Known Section */}
            <Box>
              <HStack justify='space-between' mb={4}>
                <Heading size='lg'>Languages I Know</Heading>
                <Button size='sm' onClick={() => addLanguage('known')}>
                  <HStack gap={1}>
                    <MdAdd />
                    <Text>Add Language</Text>
                  </HStack>
                </Button>
              </HStack>
              <VStack gap={3} align='stretch'>
                {formik.values.languagesKnown.map((lang, index) => (
                  <HStack key={index} gap={2}>
                    <NativeSelectRoot size='md' flex={1}>
                      <NativeSelectField
                        value={lang.name}
                        onChange={(e) =>
                          updateLanguage('known', index, 'name', e.target.value)
                        }
                      >
                        <option value=''>Select language</option>
                        {LANGUAGES.map((language) => (
                          <option key={language.code} value={language.name}>
                            {language.name}
                          </option>
                        ))}
                      </NativeSelectField>
                    </NativeSelectRoot>

                    <NativeSelectRoot size='md' flex={1}>
                      <NativeSelectField
                        value={lang.level}
                        onChange={(e) =>
                          updateLanguage(
                            'known',
                            index,
                            'level',
                            e.target.value,
                          )
                        }
                      >
                        <option value=''>Select level</option>
                        {LANGUAGE_LEVELS.map((level) => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </NativeSelectField>
                    </NativeSelectRoot>

                    <IconButton
                      aria-label='Remove'
                      onClick={() => removeLanguage('known', index)}
                      colorScheme='red'
                      variant='ghost'
                    >
                      <MdDelete />
                    </IconButton>
                  </HStack>
                ))}
              </VStack>
            </Box>

            {/* Languages Learning Section */}
            <Box>
              <HStack justify='space-between' mb={4}>
                <Heading size='lg'>Languages I'm Learning</Heading>
                <Button size='sm' onClick={() => addLanguage('learn')}>
                  <HStack gap={1}>
                    <MdAdd />
                    <Text>Add Language</Text>
                  </HStack>
                </Button>
              </HStack>
              <VStack gap={3} align='stretch'>
                {formik.values.languagesLearn.map((lang, index) => (
                  <HStack key={index} gap={2}>
                    <NativeSelectRoot size='md' flex={1}>
                      <NativeSelectField
                        value={lang.name}
                        onChange={(e) =>
                          updateLanguage('learn', index, 'name', e.target.value)
                        }
                      >
                        <option value=''>Select language</option>
                        {LANGUAGES.map((language) => (
                          <option key={language.code} value={language.name}>
                            {language.name}
                          </option>
                        ))}
                      </NativeSelectField>
                    </NativeSelectRoot>

                    <NativeSelectRoot size='md' flex={1}>
                      <NativeSelectField
                        value={lang.level}
                        onChange={(e) =>
                          updateLanguage(
                            'learn',
                            index,
                            'level',
                            e.target.value,
                          )
                        }
                      >
                        <option value=''>Select level</option>
                        {LANGUAGE_LEVELS.map((level) => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </NativeSelectField>
                    </NativeSelectRoot>

                    <IconButton
                      aria-label='Remove'
                      onClick={() => removeLanguage('learn', index)}
                      colorScheme='red'
                      variant='ghost'
                    >
                      <MdDelete />
                    </IconButton>
                  </HStack>
                ))}
              </VStack>
            </Box>

            {/* Action Buttons */}
            <HStack gap={4} pt={4}>
              <Button
                type='submit'
                size='lg'
                flex={1}
                colorScheme='blue'
                disabled={formik.isSubmitting}
              >
                {formik.isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                size='lg'
                variant='outline'
                onClick={() => router.push('/')}
              >
                Cancel
              </Button>
            </HStack>
          </VStack>
        </form>
      </Box>
    </Box>
  );
}
