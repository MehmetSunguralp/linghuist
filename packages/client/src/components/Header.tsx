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
} from '@chakra-ui/react';
import { FaCrown } from 'react-icons/fa';
import { IoChatbubbleEllipsesOutline } from 'react-icons/io5';
import { BsPeople } from 'react-icons/bs';
import { AiOutlineCompass } from 'react-icons/ai';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { clearAuthUser } from '@/store/reducers/authSlice';

export const Header = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);

  const handleAuthButtons = (path: string) => {
    router.push(path);
  };

  const handleSignOut = () => {
    // Clear session storage
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    // Clear Redux state
    dispatch(clearAuthUser());
    // Redirect to sign in
    router.push('/signin');
  };

  return (
    <Box px={4} py={3} shadow='sm'>
      <Flex maxW='1200px' mx='auto' align='center'>
        <Link href='/' fontWeight='bold'>
          Linghuist
        </Link>

        <Stack direction='row' gap={8} ml={10}>
          <Link href='/discover'>
            Discover
            <Icon size='lg'>
              <AiOutlineCompass />
            </Icon>
          </Link>
          <Link href='/community'>
            Community
            <Icon size='lg'>
              <BsPeople />
            </Icon>
          </Link>
          <Link href='/chats'>
            Chats
            <Icon size='lg'>
              <IoChatbubbleEllipsesOutline />
            </Icon>
          </Link>
          <Link href='/premium'>
            Premium
            <Icon size='lg' color='yellow'>
              <FaCrown />
            </Icon>
          </Link>
        </Stack>

        <Spacer />

        {user ? (
          <Menu.Root>
            <Menu.Trigger asChild>
              <Box
                as='button'
                w='40px'
                h='40px'
                borderRadius='full'
                bg='blue.500'
                display='flex'
                alignItems='center'
                justifyContent='center'
                cursor='pointer'
                fontWeight='bold'
                color='white'
                _hover={{ bg: 'blue.600' }}
                transition='background 0.2s'
              >
                {user.email.charAt(0).toUpperCase()}
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
              onClick={() => handleAuthButtons('signin')}
            >
              Sign In
            </Button>
            <Button onClick={() => handleAuthButtons('signup')}>Sign Up</Button>
          </Stack>
        )}
      </Flex>
    </Box>
  );
};
