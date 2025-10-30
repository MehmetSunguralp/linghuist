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
} from '@chakra-ui/react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { toaster } from '@/components/ui/toaster';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { client } from '@/lib/apolloClient';
import { GET_CURRENT_USER, UPDATE_PROFILE } from '@/lib/authQueries';
import { setAuthUser } from '@/store/reducers/authSlice';
import { MdDelete, MdAdd } from 'react-icons/md';
import {
  LANGUAGES,
  LANGUAGE_LEVELS,
  getLanguageCode,
  languageToCountryCode,
} from '@/utils/languages';
import FlagIcon from '@/components/FlagIcon';
import { RESET_PASSWORD, DELETE_ACCOUNT } from '@/lib/authQueries';

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
  country?: string | null;
  age?: number | null;
  role?: 'USER' | 'ADMIN' | 'MODERATOR';
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
            country: data.me.country || '',
            age: typeof data.me.age === 'number' ? String(data.me.age) : '',
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
      country: '',
      age: '',
      languagesKnown: [] as Language[],
      languagesLearn: [] as Language[],
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
      avatarUrl: Yup.string().url('Must be a valid URL'),
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
          (lang) =>
            (lang.name.trim() !== '' && lang.level.trim() === '') ||
            (lang.name.trim() === '' && lang.level.trim() !== ''),
        );
        const incompleteLearn = values.languagesLearn.some(
          (lang) =>
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

        // Filter out empty entries and strip __typename from language objects
        const cleanLanguages = (langs: Language[]) =>
          langs
            .filter(
              (lang) => lang.name.trim() !== '' && lang.level.trim() !== '',
            ) // Only keep entries with both name and level
            .map(({ name, level, code }) => ({ name, level, code }));

        const cleanedLanguagesKnown = cleanLanguages(values.languagesKnown);
        const cleanedLanguagesLearn = cleanLanguages(values.languagesLearn);

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

  // Check if there are any incomplete language entries
  const hasIncompleteLanguages = () => {
    const incompleteKnown = formik.values.languagesKnown.some(
      (lang) =>
        (lang.name.trim() !== '' && lang.level.trim() === '') ||
        (lang.name.trim() === '' && lang.level.trim() !== ''),
    );
    const incompleteLearn = formik.values.languagesLearn.some(
      (lang) =>
        (lang.name.trim() !== '' && lang.level.trim() === '') ||
        (lang.name.trim() === '' && lang.level.trim() !== ''),
    );
    return incompleteKnown || incompleteLearn;
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
          <Text color='gray.400' fontSize={'lg'}>
            Update your personal information
          </Text>
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
                    placeholder='Your full name (Only visible to you)'
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
                    placeholder='Set a unique username'
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

                <HStack gap={4}>
                  <Box flex={1}>
                    <Text mb={1} fontWeight='medium'>
                      Country
                    </Text>
                    {/* Country dropdown */}
                    <Menu.Root positioning={{ sameWidth: true, flip: true }}>
                      <Menu.Trigger asChild>
                        <Button
                          variant='outline'
                          size='lg'
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
                            <Text>
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
                      <Text color='red.500' fontSize='sm' mt={1}>
                        {formik.errors.country as string}
                      </Text>
                    )}
                  </Box>

                  <Box w='200px'>
                    <Text mb={1} fontWeight='medium'>
                      Age
                    </Text>
                    <Input
                      name='age'
                      placeholder='e.g., 29'
                      size='lg'
                      inputMode='numeric'
                      type='number'
                      min={16}
                      max={99}
                      value={formik.values.age}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.touched.age && formik.errors.age && (
                      <Text color='red.500' fontSize='sm' mt={1}>
                        {formik.errors.age as string}
                      </Text>
                    )}
                  </Box>
                </HStack>
              </VStack>
            </Box>

            {/* Languages Known Section */}
            <Box>
              <HStack justify='space-between' mb={4}>
                <Heading size='lg'>Languages I Know</Heading>
                <Button
                  size='sm'
                  variant={'outline'}
                  onClick={() => addLanguage('known')}
                >
                  <HStack gap={1}>
                    <MdAdd />
                    <Text>Add Language</Text>
                  </HStack>
                </Button>
              </HStack>
              <VStack gap={3} align='stretch'>
                {formik.values.languagesKnown.map((lang, index) => (
                  <HStack key={index} gap={2} position='relative'>
                    <Box flex={1}>
                      <Menu.Root positioning={{ sameWidth: true, flip: true }}>
                        <Menu.Trigger asChild>
                          <Button
                            variant='outline'
                            size='md'
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
                              <Text>{lang.name || 'Select language'}</Text>
                            </HStack>
                          </Button>
                        </Menu.Trigger>
                        <Portal>
                          <Menu.Positioner>
                            <Menu.Content maxH='300px' overflowY='auto'>
                              {LANGUAGES.map((language) => (
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
                              ))}
                            </Menu.Content>
                          </Menu.Positioner>
                        </Portal>
                      </Menu.Root>
                    </Box>

                    <Box w='200px'>
                      <Menu.Root positioning={{ sameWidth: true, flip: true }}>
                        <Menu.Trigger asChild>
                          <Button
                            variant='outline'
                            size='md'
                            width='full'
                            justifyContent='space-between'
                          >
                            <Text>{lang.level || 'Select level'}</Text>
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
                <Button
                  size='sm'
                  variant={'outline'}
                  onClick={() => addLanguage('learn')}
                >
                  <HStack gap={1}>
                    <MdAdd />
                    <Text>Add Language</Text>
                  </HStack>
                </Button>
              </HStack>
              <VStack gap={3} align='stretch'>
                {formik.values.languagesLearn.map((lang, index) => (
                  <HStack key={index} gap={2} position='relative'>
                    <Box flex={1}>
                      <Menu.Root positioning={{ sameWidth: true, flip: true }}>
                        <Menu.Trigger asChild>
                          <Button
                            variant='outline'
                            size='md'
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
                              <Text>{lang.name || 'Select language'}</Text>
                            </HStack>
                          </Button>
                        </Menu.Trigger>
                        <Portal>
                          <Menu.Positioner>
                            <Menu.Content maxH='300px' overflowY='auto'>
                              {LANGUAGES.map((language) => (
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
                              ))}
                            </Menu.Content>
                          </Menu.Positioner>
                        </Portal>
                      </Menu.Root>
                    </Box>

                    <Box w='200px'>
                      <Menu.Root positioning={{ sameWidth: true, flip: true }}>
                        <Menu.Trigger asChild>
                          <Button
                            variant='outline'
                            size='md'
                            width='full'
                            justifyContent='space-between'
                          >
                            {lang.level || 'Select level'}
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
                disabled={formik.isSubmitting || hasIncompleteLanguages()}
              >
                {formik.isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </HStack>

            {/* Password Section */}
            <Box>
              <Heading size='lg' mb={4} mt={8}>
                Password
              </Heading>
              <HStack justify={'space-between'}>
                <Text color='gray.400'>
                  You can send yourself a password reset email.
                </Text>
                <Button
                  variant='outline'
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
                <Heading size='lg' mb={4} mt={8} color='red.400'>
                  Danger Zone
                </Heading>
                <DeleteAccountSection />
              </Box>
            )}
          </VStack>
        </form>
      </Box>
    </Box>
  );
}

function DeleteAccountSection() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  return (
    <>
      <HStack justify={'space-between'}>
        <Text color='gray.400'>
          This action is irreversible. Your account and data will be permanently
          deleted.
        </Text>
        <Button
          colorPalette={'red'}
          variant='outline'
          onClick={() => setOpen(true)}
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
              p={6}
              borderRadius='md'
              minW={{ base: '90%', md: '480px' }}
            >
              <Heading size='md' mb={2}>
                Confirm Deletion
              </Heading>
              <Text color='gray.400' mb={4}>
                Enter your password to confirm account deletion.
              </Text>
              <Input
                type='password'
                placeholder='Password'
                size='lg'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                mb={4}
              />
              <HStack justify='flex-end'>
                <Button variant='ghost' onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  colorPalette={'red'}
                  disabled={submitting || password.length === 0}
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
