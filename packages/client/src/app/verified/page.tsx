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
    <Flex h='calc(100vh - 64px)' align='center' justify='center'>
      <Box maxW='500px' w='full' px={6}>
        <VStack gap={6} textAlign='center'>
          {status === 'loading' && (
            <Box>
              <VStack gap={4}>
                <Heading size='3xl'>Verifying Your Email</Heading>
                <Spinner size='xl' />
                <Text fontSize={'xl'} color='gray.500'>
                  Please wait while we confirm your account
                </Text>
              </VStack>
            </Box>
          )}

          {status === 'success' && (
            <Box>
              <VStack gap={4}>
                <Icon size='2xl' color='green'>
                  <FaCircleCheck />
                </Icon>
                <Heading size='3xl'>Email Verified!</Heading>
                <Text fontSize={'xl'} color='gray.300'>
                  Your account has been successfully verified.
                </Text>
                <Text fontSize={'xl'} color='gray.500'>
                  Redirecting you to the app...
                </Text>
              </VStack>
            </Box>
          )}

          {status === 'error' && (
            <Box>
              <VStack gap={4}>
                <Icon size='2xl' color='red'>
                  <MdOutlineError />
                </Icon>
                <Heading size='3xl'>Verification Failed</Heading>
                <Text fontSize={'xl'} color='gray.300'>
                  {errorMessage}
                </Text>
                <Button colorScheme='blue' onClick={() => setResendOpen(true)}>
                  Resend Verification Email
                </Button>
                <Text
                  fontSize={'xl'}
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
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>
                  <Text fontSize={'2xl'}>Resend Verification Email</Text>
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <VStack gap={3}>
                  <Text color='gray.300' fontSize={'md'}>
                    Enter your email address to receive a new verification link.
                  </Text>
                  <Input
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder='you@example.com'
                    type='email'
                    size='lg'
                  />
                </VStack>
              </Dialog.Body>
              <Dialog.Footer>
                <Button variant='ghost' onClick={() => setResendOpen(false)}>
                  Cancel
                </Button>
                <Button
                  colorScheme='blue'
                  ml={2}
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
