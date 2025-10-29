'use client';
import {
  Box,
  Button,
  Input,
  VStack,
  Text,
  Heading,
  Flex,
  Icon,
} from '@chakra-ui/react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch } from 'react-redux';
import { signupUser } from '@/store/reducers/authSlice';
import { AppDispatch } from '@/store/store';
import { toaster } from '@/components/ui/toaster';
import { MdOutlineEmail } from 'react-icons/md';
import { useState } from 'react';
// import Image from 'next/image';

export default function SignupPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [hasSignedUp, setHasSignedUp] = useState<boolean>(false);

  const formik = useFormik({
    initialValues: { email: '', password: '', confirmPassword: '' },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email').required('Email is required'),
      password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'Passwords must match')
        .required('Please confirm your password'),
    }),
    onSubmit: async (values) => {
      const result = await dispatch(signupUser(values));
      if (signupUser.fulfilled.match(result)) {
        setHasSignedUp(true);
      } else if (signupUser.rejected.match(result)) {
        toaster.create({
          title: result.error?.message || 'Signup failed',
          type: 'error',
        });
        setHasSignedUp(false);
      }
    },
  });

  return (
    <Flex h='calc(100vh - 64px)' align='center' justify='center'>
      <Box maxW='600px' w='full' px={6}>
        {hasSignedUp ? (
          <VStack gap={6} textAlign='center'>
            <Box
              p={8}
              borderRadius='lg'
              // bg='green.50'
              // borderWidth='2px'
              // borderColor='green.200'
            >
              <VStack gap={4}>
                <Icon size='2xl'>
                  <MdOutlineEmail />
                </Icon>
                <Heading size='2xl'>Check Your Email</Heading>
                <Text fontSize='xl'>We've sent a confirmation link to</Text>
                <Text fontWeight='bold' color='gray.800'>
                  {formik.values.email}
                </Text>
                <Text fontSize='md' mt={2}>
                  Please check your inbox and click the confirmation link to
                  activate your account.
                </Text>
              </VStack>
            </Box>
          </VStack>
        ) : (
          <Box>
            <VStack gap={2} mb={8} textAlign='center'>
              <Heading size='4xl'>Create Account</Heading>
              <Text color='gray.600'>Sign up to get started</Text>
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
                </Box>

                <Box>
                  <Input
                    name='confirmPassword'
                    placeholder='Confirm Password'
                    size='lg'
                    type='password'
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  {formik.touched.confirmPassword &&
                    formik.errors.confirmPassword && (
                      <Text color='red.500' fontSize='sm' mt={1}>
                        {formik.errors.confirmPassword}
                      </Text>
                    )}
                </Box>

                <Button
                  type='submit'
                  size='lg'
                  width='full'
                  colorScheme='blue'
                  disabled={formik.isSubmitting}
                  mt={2}
                >
                  Sign Up
                </Button>
              </VStack>
            </form>
          </Box>
        )}
      </Box>
    </Flex>
  );
}
