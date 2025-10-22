import { Box, Flex, Stack, Spacer, Button, Link } from '@chakra-ui/react';

export const Header = () => {
  return (
    <Box px={4} py={3} shadow='sm'>
      <Flex maxW='1200px' mx='auto' align='center'>
        <Link href='/' fontWeight='bold'>
          Linghuist
        </Link>

        <Stack direction='row' gap={8} ml={10}>
          <Link href='/discover'>Discover</Link>
          <Link href='/community'>Community</Link>
          <Link href='/chats'>Chats</Link>
          <Link href='/premium'>Premium</Link>
        </Stack>

        <Spacer />

        <Stack direction='row' gap={4}>
          <Button variant='outline'>Sign In</Button>
          <Button colorScheme='teal'>Sign Up</Button>
        </Stack>
      </Flex>
    </Box>
  );
};
