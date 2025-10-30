'use client';
import {
  Box,
  Button,
  Input,
  VStack,
  Text,
  Heading,
  Flex,
  Dialog,
  Portal,
} from '@chakra-ui/react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '@/store/reducers/authSlice';
import { AppDispatch, RootState } from '@/store/store';
import { toaster } from '@/components/ui/toaster';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { client } from '@/lib/apolloClient';
import { RESET_PASSWORD } from '@/lib/authQueries';

export default function SignInPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/discover');
    }
  }, [user, router]);

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email').required('Email is required'),
      password: Yup.string().required('Password is required'),
    }),
    onSubmit: async (values) => {
      const result = await dispatch(loginUser(values));
      if (loginUser.fulfilled.match(result)) {
        toaster.create({
          title: 'Welcome back!',
          type: 'success',
        });
        router.push('/');
      } else if (loginUser.rejected.match(result)) {
        toaster.create({
          title: result.error?.message || 'Login failed',
          type: 'error',
        });
      }
    },
  });

  return (
    <>
      <Flex h='calc(100vh - 64px)' align='center' justify='center'>
        <Box maxW='600px' w='full' px={6}>
          <VStack gap={2} mb={8} textAlign='center'>
            <Heading size='4xl'>Welcome Back</Heading>
            <Text color='gray.400'>Sign in to continue</Text>
          </VStack>

          <form onSubmit={formik.handleSubmit}>
            <VStack gap={4} align='stretch'>
              <Box>
                <Input
                  name='email'
                  placeholder='Email'
                  size='lg'
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.email && formik.errors.email && (
                  <Text color='red.500' fontSize='sm' mt={1}>
                    {formik.errors.email}
                  </Text>
                )}
              </Box>

              <Box>
                <Input
                  name='password'
                  placeholder='Password'
                  size='lg'
                  type='password'
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.password && formik.errors.password && (
                  <Text color='red.500' fontSize='sm' mt={1}>
                    {formik.errors.password}
                  </Text>
                )}
                <Text
                  mt={2}
                  color='blue.500'
                  cursor='pointer'
                  textDecoration={'underline'}
                  onClick={() => setForgotOpen(true)}
                >
                  Forgot password?
                </Text>
              </Box>

              <Button
                type='submit'
                size='lg'
                width='full'
                colorScheme='blue'
                disabled={formik.isSubmitting}
                mt={2}
              >
                Sign In
              </Button>

              <Text textAlign='center' color='gray.400' mt={4}>
                Don't have an account?{' '}
                <Link href='/signup'>
                  <Text
                    as='span'
                    color='blue.500'
                    cursor='pointer'
                    textDecoration={'underline'}
                  >
                    Sign up
                  </Text>
                </Link>
              </Text>
            </VStack>
          </form>
        </Box>
      </Flex>

      {/* Forgot Password Dialog */}
      <Dialog.Root
        open={forgotOpen}
        onOpenChange={(e) => setForgotOpen(e.open)}
        placement={'center'}
      >
        <Dialog.Backdrop />
        <Portal>
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>
                  <Text fontSize={'2xl'}>Reset Your Password</Text>
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <VStack gap={3}>
                  <Text color='gray.300' fontSize={'md'}>
                    Enter your account email to receive a reset link.
                  </Text>
                  <Input
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder='you@example.com'
                    type='email'
                    size='lg'
                  />
                </VStack>
              </Dialog.Body>
              <Dialog.Footer>
                <Button variant='ghost' onClick={() => setForgotOpen(false)}>
                  Cancel
                </Button>
                <Button
                  colorScheme='blue'
                  ml={2}
                  disabled={
                    forgotSubmitting || !/^\S+@\S+\.\S+$/.test(forgotEmail)
                  }
                  onClick={async () => {
                    setForgotSubmitting(true);
                    try {
                      await client.mutate({
                        mutation: RESET_PASSWORD,
                        variables: { email: forgotEmail },
                      });
                      toaster.create({
                        title: 'Reset Email Sent (Check Inbox)',
                        type: 'success',
                      });
                      setForgotOpen(false);
                      setForgotEmail('');
                    } catch (e: any) {
                      toaster.create({
                        title: e.message || 'Failed to send Reset Email',
                        type: 'error',
                      });
                    } finally {
                      setForgotSubmitting(false);
                    }
                  }}
                >
                  {forgotSubmitting ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
