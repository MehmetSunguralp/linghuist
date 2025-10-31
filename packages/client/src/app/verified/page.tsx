'use client';
import { useEffect, useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  Spinner,
  Icon,
  Button,
  Dialog,
  Portal,
  Input,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setAuthUser } from '@/store/reducers/authSlice';
import { client } from '@/lib/apolloClient';
import {
  GET_CURRENT_USER,
  VERIFY_EMAIL,
  RESEND_VERIFICATION,
} from '@/lib/authQueries';
import { AppDispatch } from '@/store/store';
import { MdOutlineError } from 'react-icons/md';
import { FaCircleCheck } from 'react-icons/fa6';
import { toaster } from '@/components/ui/toaster';

export default function VerifiedPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [resendOpen, setResendOpen] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendSubmitting, setResendSubmitting] = useState(false);

  useEffect(() => {
    const handleVerification = async () => {
      try {
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

              // Update isVerified in the database
              try {
                await client.mutate({
                  mutation: VERIFY_EMAIL,
                  variables: { userId: data.me.id },
                  context: {
                    headers: {
                      Authorization: `Bearer ${accessToken}`,
                    },
                  },
                });
              } catch (verifyError) {
                console.error(
                  'Failed to update verification status:',
                  verifyError,
                );
              }
            }
          } catch (fetchError) {
            console.error('Failed to fetch user data:', fetchError);
          }
          setStatus('success');

          setTimeout(() => {
            router.push('/signin');
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
    <Flex h='calc(100vh - 64px)' align='center' justify='center' px={{ base: 3, sm: 6 }}>
      <Box maxW='500px' w='full' px={{ base: 4, sm: 6 }}>
        <VStack gap={{ base: 4, sm: 6 }} textAlign='center'>
          {status === 'loading' && (
            <Box>
              <VStack gap={{ base: 3, sm: 4 }}>
                <Heading size={{ base: 'xl', sm: '2xl', md: '3xl' }}>Verifying Your Email</Heading>
                <Spinner size={{ base: 'lg', sm: 'xl' }} />
                <Text fontSize={{ base: 'sm', sm: 'lg', md: 'xl' }} color='gray.500'>
                  Please wait while we confirm your account
                </Text>
              </VStack>
            </Box>
          )}

          {status === 'success' && (
            <Box>
              <VStack gap={{ base: 3, sm: 4 }}>
                <Icon size={{ base: 'xl', sm: '2xl' }} color='green'>
                  <FaCircleCheck />
                </Icon>
                <Heading size={{ base: 'xl', sm: '2xl', md: '3xl' }}>Email Verified!</Heading>
                <Text fontSize={{ base: 'sm', sm: 'lg', md: 'xl' }} color='gray.300'>
                  Your account has been successfully verified.
                </Text>
                <Text fontSize={{ base: 'sm', sm: 'lg', md: 'xl' }} color='gray.500'>
                  Redirecting you to the app...
                </Text>
              </VStack>
            </Box>
          )}

          {status === 'error' && (
            <Box>
              <VStack gap={{ base: 3, sm: 4 }}>
                <Icon size={{ base: 'xl', sm: '2xl' }} color='red'>
                  <MdOutlineError />
                </Icon>
                <Heading size={{ base: 'xl', sm: '2xl', md: '3xl' }}>Verification Failed</Heading>
                <Text fontSize={{ base: 'sm', sm: 'lg', md: 'xl' }} color='gray.300'>
                  {errorMessage}
                </Text>
                <Button 
                  colorScheme='blue' 
                  onClick={() => setResendOpen(true)}
                  size={{ base: 'md', sm: 'lg' }}
                  width={{ base: 'full', sm: 'auto' }}
                >
                  Resend Verification Email
                </Button>
                <Text
                  fontSize={{ base: 'sm', sm: 'lg', md: 'xl' }}
                  color='gray.500'
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

      {/* Resend Verification Dialog */}
      <Dialog.Root
        open={resendOpen}
        onOpenChange={(e) => setResendOpen(e.open)}
        placement='center'
      >
        <Dialog.Backdrop />
        <Portal>
          <Dialog.Positioner>
            <Dialog.Content maxW={{ base: '90vw', sm: 'md' }}>
              <Dialog.Header>
                <Dialog.Title>
                  <Text fontSize={{ base: 'lg', sm: 'xl', md: '2xl' }}>Resend Verification Email</Text>
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <VStack gap={3}>
                  <Text color='gray.300' fontSize={{ base: 'xs', sm: 'sm', md: 'md' }}>
                    Enter your email address to receive a new verification link.
                  </Text>
                  <Input
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder='you@example.com'
                    type='email'
                    size={{ base: 'md', sm: 'lg' }}
                  />
                </VStack>
              </Dialog.Body>
              <Dialog.Footer flexDirection={{ base: 'column', sm: 'row' }} gap={{ base: 2, sm: 0 }}>
                <Button 
                  variant='ghost' 
                  onClick={() => setResendOpen(false)}
                  width={{ base: 'full', sm: 'auto' }}
                  order={{ base: 2, sm: 1 }}
                >
                  Cancel
                </Button>
                <Button
                  colorScheme='blue'
                  ml={{ base: 0, sm: 2 }}
                  width={{ base: 'full', sm: 'auto' }}
                  disabled={
                    resendSubmitting || !/^\S+@\S+\.\S+$/.test(resendEmail)
                  }
                  onClick={async () => {
                    setResendSubmitting(true);
                    try {
                      await client.mutate({
                        mutation: RESEND_VERIFICATION,
                        variables: { email: resendEmail },
                      });
                      toaster.create({
                        title: 'Verification email sent (check inbox)',
                        type: 'success',
                      });
                      setResendOpen(false);
                      setResendEmail('');
                    } catch (e: any) {
                      toaster.create({
                        title: e.message || 'Failed to send verification email',
                        type: 'error',
                      });
                    } finally {
                      setResendSubmitting(false);
                    }
                  }}
                >
                  {resendSubmitting ? 'Sending...' : 'Send Email'}
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Flex>
  );
}
