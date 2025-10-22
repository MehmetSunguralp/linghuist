'use client';

import { Box, Flex, Stack, Spacer, Button, Link, Icon } from '@chakra-ui/react';
import { FaCrown } from 'react-icons/fa';
import { IoChatbubbleEllipsesOutline } from 'react-icons/io5';
import { BsPeople } from 'react-icons/bs';
import { AiOutlineCompass } from 'react-icons/ai';
import { useRouter } from 'next/navigation';

export const Header = () => {
  const router = useRouter();

  const handleAuthButtons = (path: string) => {
    router.push(path);
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

        <Stack direction='row' gap={4}>
          <Button variant='subtle' onClick={() => handleAuthButtons('signin')}>
            Sign In
          </Button>
          <Button onClick={() => handleAuthButtons('signup')}>Sign Up</Button>
        </Stack>
      </Flex>
    </Box>
  );
};
