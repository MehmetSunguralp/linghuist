import { useMutation } from '@apollo/client';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Link,
  Snackbar,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { LOGIN_MUTATION } from '@/api/mutations';
import { ME_QUERY } from '@/api/queries';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setAuth } from '@/store/authStore';
import apolloClient from '@/lib/apolloClient';
import type { User } from '@/types';

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string().required('Password is required'),
});

interface LoginFormValues {
  email: string;
  password: string;
}

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [login, { loading, error }] = useMutation(LOGIN_MUTATION);

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Prevent body scroll on auth pages
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleSubmit = async (values: LoginFormValues) => {
    try {
      // Clear any cached data before login
      await apolloClient.clearStore();

      const { data } = await login({
        variables: {
          email: values.email,
          password: values.password,
        },
      });

      if (data?.login) {
        const token = data.login;
        dispatch(setAuth({ token }));

        // Fetch user data after login (with fetchPolicy to bypass cache)
        try {
          const { data: userData } = await apolloClient.query({
            query: ME_QUERY,
            fetchPolicy: 'network-only', // Always fetch fresh data
            context: {
              headers: {
                authorization: `Bearer ${token}`,
              },
            },
          });

          if (userData?.me) {
            dispatch(setAuth({ token, user: userData.me as User }));
          }
        } catch (userErr) {
          console.error('Failed to fetch user data:', userErr);
          // Still proceed with login even if user fetch fails
        }

        // Show success message
        setSnackbar({
          open: true,
          message: 'Login successful! Redirecting...',
          severity: 'success',
        });

        // Navigate after a short delay to show the success message
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setSnackbar({
        open: true,
        message: err.message || 'An error occurred during login',
        severity: 'error',
      });
    }
  };

  const backgroundImageUrl =
    'https://evsxpvgpnhdfgalkodpg.supabase.co/storage/v1/object/public/publicAssets/bg_img.png';

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          height: '100dvh',
          maxHeight: '100dvh',
          display: 'flex',
          overflow: 'hidden',
          zIndex: 1000,
        }}
      >
        {/* Left side - Background Image */}
        <Box
          sx={{
            width: '50%',
            height: '100%',
            maxHeight: '100dvh',
            backgroundImage: `url(${backgroundImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            overflow: 'hidden',
            display: { xs: 'none', md: 'block' },
          }}
        />

        {/* Right side - Login Form */}
        <Box
          sx={{
            width: { xs: '100%', md: '50%' },
            height: '100%',
            maxHeight: '100dvh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4,
            overflow: 'auto',
          }}
        >
          <Box sx={{ width: '100%', maxWidth: '400px' }}>
            <Typography
              variant="h2"
              fontWeight={700}
              component="h2"
              gutterBottom
              align="center"
            >
              Welcome Back!
            </Typography>

            <Typography variant="h4" component="h1" gutterBottom align="center">
              Log into Your Account
            </Typography>

            <Typography
              variant="subtitle2"
              component={'h3'}
              gutterBottom
              align="center"
              fontWeight={300}
            >
              Keep practicing language skills and making new connections!
            </Typography>

            <Formik
              initialValues={{
                email: '',
                password: '',
              }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ errors, touched }) => (
                <Form>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      mt: 3,
                    }}
                  >
                    <Field
                      as={TextField}
                      name="email"
                      label="Email"
                      type="email"
                      fullWidth
                      error={touched.email && !!errors.email}
                      helperText={touched.email && errors.email}
                      variant="outlined"
                    />

                    <Field
                      as={TextField}
                      name="password"
                      label="Password"
                      type="password"
                      fullWidth
                      error={touched.password && !!errors.password}
                      helperText={touched.password && errors.password}
                      variant="outlined"
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      fullWidth
                      size="large"
                      disabled={loading}
                      sx={{ mt: 2 }}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Login'}
                    </Button>
                  </Box>
                </Form>
              )}
            </Formik>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="body2">
                Don't have an account?{' '}
                <Link component={RouterLink} to="/signup" color="primary">
                  Sign up
                </Link>
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <Link
                  component={RouterLink}
                  to="/reset-password"
                  color="primary"
                >
                  Forgot your password?
                </Link>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ zIndex: 1500 }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%', color: 'white' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default LoginPage;
