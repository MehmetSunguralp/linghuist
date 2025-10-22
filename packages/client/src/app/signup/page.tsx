'use client';
import { useState } from 'react';
import { Box, Button, Input, VStack } from '@chakra-ui/react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch } from 'react-redux';
import { signupUser } from '@/store/reducers/authSlice';
import { AppDispatch } from '@/store/store';
import { toaster } from '@/components/ui/toaster';

export default function SignupPage() {
  const dispatch = useDispatch<AppDispatch>();

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email').required('Required'),
      password: Yup.string().min(6, 'Min 6 characters').required('Required'),
    }),
    onSubmit: async (values) => {
      const result = await dispatch(signupUser(values));
      if (signupUser.fulfilled.match(result)) {
        toaster.create({ title: 'Signup successful!', type: 'success' });
      } else {
        toaster.create({ title: 'Signup failed!', type: 'error' });
      }
    },
  });

  return (
    <Box maxW='400px' mx='auto' mt={10}>
      <form onSubmit={formik.handleSubmit}>
        <VStack gap={4}>
          <Input
            name='email'
            placeholder='Email'
            value={formik.values.email}
            onChange={formik.handleChange}
          />
          <Input
            name='password'
            placeholder='Password'
            type='password'
            value={formik.values.password}
            onChange={formik.handleChange}
          />
          <Button type='submit' colorPalette='cyan' width='full'>
            Sign Up
          </Button>
        </VStack>
      </form>
    </Box>
  );
}
