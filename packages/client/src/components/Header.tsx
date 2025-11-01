'use client';

import {
  Box,
  Flex,
  Stack,
  Spacer,
  Button,
  Link,
  Icon,
  Menu,
  Portal,
  IconButton,
  VStack,
  Collapsible,
  HStack,
  Text,
} from '@chakra-ui/react';
import { FaCrown } from 'react-icons/fa';
import { IoChatbubbleEllipsesOutline } from 'react-icons/io5';
import { BsPeople } from 'react-icons/bs';
import { AiOutlineCompass } from 'react-icons/ai';
import { HiMenu, HiX } from 'react-icons/hi';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { clearAuthUser } from '@/store/reducers/authSlice';
import { useState, useEffect } from 'react';
import { client } from '@/lib/apolloClient';
import { GET_CURRENT_USER } from '@/lib/authQueries';
import { getSignedUrl } from '@/lib/supabaseClient';

export const Header = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const initialized = useSelector((state: RootState) => state.auth.initialized);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Fetch user avatar
  useEffect(() => {
    if (user && initialized) {
      const fetchAvatar = async () => {
        try {
          const { data } = await client.query<{
            me: { avatarUrl?: string | null };
          }>({
            query: GET_CURRENT_USER,
            fetchPolicy: 'cache-first',
          });
          if (data?.me?.avatarUrl) {
            // Check if it's a path format (bucket/path) or a full URL
            if (
              data.me.avatarUrl.startsWith('avatars/') ||
              data.me.avatarUrl.startsWith('http') === false
            ) {
              // It's a path, convert to signed URL
              try {
                const signedUrl = await getSignedUrl(data.me.avatarUrl);
                setAvatarUrl(signedUrl);
              } catch (error) {
                console.error('Failed to get signed URL:', error);
              }
            } else {
              // It's already a full URL (legacy)
              setAvatarUrl(data.me.avatarUrl);
            }
          }
        } catch (error) {
          // Silently fail - avatar is optional
        }
      };
      fetchAvatar();
    }
  }, [user, initialized]);

  const handleAuthButtons = (path: string) => {
    router.push(path);
    setMobileMenuOpen(false);
  };

  const handleSignOut = () => {
    // Clear session storage
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('auth_user');
    // Clear Redux state
    dispatch(clearAuthUser());
    // Redirect to sign in
    router.push('/signin');
    setMobileMenuOpen(false);
  };

  const handleNavClick = (path: string) => {
    router.push(path);
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { href: '/discover', label: 'Discover', icon: AiOutlineCompass },
    { href: '/community', label: 'Community', icon: BsPeople },
    { href: '/chats', label: 'Chats', icon: IoChatbubbleEllipsesOutline },
    { href: '/premium', label: 'Premium', icon: FaCrown, color: 'yellow' },
  ];

  return (
    <Box px={{ base: 3, sm: 4 }} py={{ base: 2, sm: 3 }} shadow='sm'>
      <Flex maxW='1200px' mx='auto' align='center' gap={{ base: 2, sm: 4 }}>
        <Link href='/' fontWeight='bold' fontSize={{ base: 'lg', sm: 'xl' }}>
          Linghuist
        </Link>

        {/* Desktop Navigation */}
        <Stack
          direction='row'
          gap={{ base: 4, md: 8 }}
          ml={{ base: 0, md: 10 }}
          display={{ base: 'none', md: 'flex' }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              display='flex'
              alignItems='center'
              gap={2}
              fontSize={{ base: 'sm', md: 'md' }}
            >
              {link.label}
              <Icon size='md' color={link.color}>
                <link.icon />
              </Icon>
            </Link>
          ))}
        </Stack>

        <Spacer />

        {/* Desktop Auth/User Menu */}
        <Box display={{ base: 'none', md: 'block' }}>
          {!initialized ? (
            <Box
              w='40px'
              h='40px'
              borderRadius='full'
              bg='gray.200'
              _dark={{ bg: 'gray.700' }}
            />
          ) : user ? (
            <Menu.Root>
              <Menu.Trigger asChild>
                <Box
                  as='button'
                  w='40px'
                  h='40px'
                  borderRadius='full'
                  overflow='hidden'
                  bg={avatarUrl ? 'transparent' : 'blue.500'}
                  display='flex'
                  alignItems='center'
                  justifyContent='center'
                  cursor='pointer'
                  fontWeight='bold'
                  color='white'
                  _hover={{ opacity: 0.9 }}
                  transition='opacity 0.2s'
                  border={avatarUrl ? '2px solid' : 'none'}
                  borderColor='gray.300'
                  _dark={{ borderColor: 'gray.600' }}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={user.email}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    user.email.charAt(0).toUpperCase()
                  )}
                </Box>
              </Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content>
                    <Menu.Item
                      cursor={'pointer'}
                      value='profile'
                      onClick={() => router.push('/profile')}
                    >
                      Profile
                    </Menu.Item>
                    <Menu.Item
                      value='signout'
                      cursor={'pointer'}
                      onClick={handleSignOut}
                    >
                      Sign Out
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
          ) : (
            <Stack direction='row' gap={4}>
              <Button
                variant='subtle'
                size={{ base: 'sm', md: 'md' }}
                onClick={() => handleAuthButtons('/signin')}
              >
                Sign In
              </Button>
              <Button
                size={{ base: 'sm', md: 'md' }}
                onClick={() => handleAuthButtons('/signup')}
              >
                Sign Up
              </Button>
            </Stack>
          )}
        </Box>

        {/* Mobile Hamburger Menu Button */}
        <IconButton
          display={{ base: 'flex', md: 'none' }}
          aria-label='Toggle menu'
          variant='ghost'
          size='md'
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Icon size='lg'>{mobileMenuOpen ? <HiX /> : <HiMenu />}</Icon>
        </IconButton>

        {/* Mobile User Avatar/Buttons */}
        {initialized && user && (
          <Box display={{ base: 'flex', md: 'none' }}>
            <Menu.Root>
              <Menu.Trigger asChild>
                <Box
                  as='button'
                  w='36px'
                  h='36px'
                  borderRadius='full'
                  overflow='hidden'
                  bg={avatarUrl ? 'transparent' : 'blue.500'}
                  display='flex'
                  alignItems='center'
                  justifyContent='center'
                  cursor='pointer'
                  fontWeight='bold'
                  color='white'
                  _hover={{ opacity: 0.9 }}
                  transition='opacity 0.2s'
                  border={avatarUrl ? '2px solid' : 'none'}
                  borderColor='gray.300'
                  _dark={{ borderColor: 'gray.600' }}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={user.email}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    user.email.charAt(0).toUpperCase()
                  )}
                </Box>
              </Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content>
                    <Menu.Item
                      cursor={'pointer'}
                      value='profile'
                      onClick={() => {
                        router.push('/profile');
                        setMobileMenuOpen(false);
                      }}
                    >
                      Profile
                    </Menu.Item>
                    <Menu.Item
                      value='signout'
                      cursor={'pointer'}
                      onClick={handleSignOut}
                    >
                      Sign Out
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
          </Box>
        )}
      </Flex>

      {/* Mobile Navigation Menu */}
      <Collapsible.Root open={mobileMenuOpen}>
        <Collapsible.Content>
          <Box
            pt={{ base: 3, sm: 4 }}
            pb={2}
            display={{ base: 'block', md: 'none' }}
          >
            <VStack gap={3} align='stretch'>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => handleNavClick(link.href)}
                  display='flex'
                  alignItems='center'
                  gap={2}
                  py={2}
                  px={2}
                  borderRadius='md'
                  _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
                  fontSize='sm'
                >
                  <Icon size='md' color={link.color}>
                    <link.icon />
                  </Icon>
                  <Text>{link.label}</Text>
                </Link>
              ))}
              {!initialized ? (
                <Box
                  w='36px'
                  h='36px'
                  borderRadius='full'
                  bg='gray.200'
                  _dark={{ bg: 'gray.700' }}
                />
              ) : !user ? (
                <VStack gap={2} align='stretch' pt={2}>
                  <Button
                    variant='subtle'
                    size='sm'
                    width='full'
                    onClick={() => handleAuthButtons('/signin')}
                  >
                    Sign In
                  </Button>
                  <Button
                    size='sm'
                    width='full'
                    onClick={() => handleAuthButtons('/signup')}
                  >
                    Sign Up
                  </Button>
                </VStack>
              ) : null}
            </VStack>
          </Box>
        </Collapsible.Content>
      </Collapsible.Root>
    </Box>
  );
};
