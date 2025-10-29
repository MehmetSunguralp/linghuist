'use client';
import { useEffect, useState } from 'react';
import { Box, Flex, Heading, Text, VStack, Spinner } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setAuthUser } from '@/store/reducers/authSlice';
import { client } from '@/lib/apolloClient';
import { GET_CURRENT_USER } from '@/lib/authQueries';
import { AppDispatch } from '@/store/store';

export default function VerifiedPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleVerification = async () => {
      try {
        // Extract tokens from URL hash fragment (format: #access_token=...&refresh_token=...)
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1),
        );
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        if (error) {
          setStatus('error');
          setErrorMessage(
            errorDescription || 'Verification failed. Please try again.',
          );
          return;
        }

        if (accessToken && refreshToken) {
          sessionStorage.setItem('access_token', accessToken);
          sessionStorage.setItem('refresh_token', refreshToken);

          try {
            const { data } = await client.query<{
              me: {
                id: string;
                email: string;
                name?: string;
                username?: string;
              };
            }>({
              query: GET_CURRENT_USER,
              context: {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              },
            });

            if (data?.me) {
              dispatch(setAuthUser({ id: data.me.id, email: data.me.email }));
            }
          } catch (fetchError) {
            console.error('Failed to fetch user data:', fetchError);
          }
          setStatus('success');

          setTimeout(() => {
            router.push('/');
          }, 2000);
        } else {
          setStatus('error');
          setErrorMessage('No tokens found. Please try signing up again.');
        }
      } catch (err) {
        setStatus('error');
        setErrorMessage('An unexpected error occurred.');
      }
    };

    handleVerification();
  }, [router, dispatch]);

  return (
    <Flex h='calc(100vh - 64px)' align='center' justify='center'>
      <Box maxW='500px' w='full' px={6}>
        <VStack gap={6} textAlign='center'>
          {status === 'loading' && (
            <Box
              p={8}
              borderRadius='lg'
              bg='blue.50'
              borderWidth='2px'
              borderColor='blue.200'
            >
              <VStack gap={4}>
                <Spinner size='xl' color='blue.500' />
                <Heading size='lg' color='blue.700'>
                  Verifying Your Email
                </Heading>
                <Text color='gray.600'>
                  Please wait while we confirm your account...
                </Text>
              </VStack>
            </Box>
          )}

          {status === 'success' && (
            <Box
              p={8}
              borderRadius='lg'
              bg='green.50'
              borderWidth='2px'
              borderColor='green.200'
            >
              <VStack gap={4}>
                <Box fontSize='4xl'>✅</Box>
                <Heading size='lg' color='green.700'>
                  Email Verified!
                </Heading>
                <Text color='gray.600'>
                  Your account has been successfully verified.
                </Text>
                <Text color='gray.600' fontSize='sm'>
                  Redirecting you to the app...
                </Text>
              </VStack>
            </Box>
          )}

          {status === 'error' && (
            <Box
              p={8}
              borderRadius='lg'
              bg='red.50'
              borderWidth='2px'
              borderColor='red.200'
            >
              <VStack gap={4}>
                <Box fontSize='4xl'>❌</Box>
                <Heading size='lg' color='red.700'>
                  Verification Failed
                </Heading>
                <Text color='gray.600'>{errorMessage}</Text>
                <Text
                  color='blue.600'
                  cursor='pointer'
                  textDecoration='underline'
                  onClick={() => router.push('/signup')}
                >
                  Back to Sign Up
                </Text>
              </VStack>
            </Box>
          )}
        </VStack>
      </Box>
    </Flex>
  );
}
