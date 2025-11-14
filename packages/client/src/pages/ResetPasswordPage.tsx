import { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Link,
  Snackbar,
} from '@mui/material';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { RESET_PASSWORD_MUTATION } from '@/api/mutations';
import {
  emailValidation,
  passwordValidation,
  PASSWORD_HELPER_TEXT,
} from '@/utils/validation';
import { getSupabaseAuthClient } from '@/lib/supabaseAuthClient';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/authStore';
import apolloClient from '@/lib/apolloClient';
import { clearSupabaseClientCache } from '@/lib/supabaseClient';
import { clearSupabaseStorageCache } from '@/utils/supabaseStorage';

// Validation schema for requesting reset email
const requestResetSchema = Yup.object({
  email: emailValidation,
});

// Validation schema for setting new password
const setPasswordSchema = Yup.object({
  password: passwordValidation,
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

interface RequestResetFormValues {
  email: string;
}

interface SetPasswordFormValues {
  password: string;
  confirmPassword: string;
}

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [searchParams] = useSearchParams();
  const [resetPassword, { loading: requestLoading, error: requestError }] =
    useMutation(RESET_PASSWORD_MUTATION);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const initialEmail = searchParams.get('email') || '';

  // Check if we have a recovery token in the URL (from email link)
  useEffect(() => {
    const checkRecoverySession = async () => {
      // If user is authenticated but has no recovery token, redirect to home
      const hasHash =
        window.location.hash && window.location.hash.includes('access_token');

      if (isAuthenticated && !hasHash) {
        // User is logged in but no recovery token - redirect to home
        navigate('/');
        return;
      }

      const supabase = getSupabaseAuthClient();
      if (!supabase) {
        setIsLoadingSession(false);
        // If no Supabase client and user is not authenticated, redirect to home
        if (!isAuthenticated && !hasHash) {
          navigate('/');
        }
        return;
      }

      try {
        // Check if URL has hash parameters (Supabase adds tokens in hash)
        if (hasHash) {
          // Wait a bit for Supabase to process the hash
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // Check if there's a session in the URL hash (from password reset email)
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (session && session.user && !error) {
          // Verify it's a recovery session (type should be 'recovery')
          const hashParams = new URLSearchParams(
            window.location.hash.substring(1),
          );
          const type = hashParams.get('type');

          if (type === 'recovery' || session.user) {
            // We have a valid recovery session
            setUserEmail(session.user.email || '');
            setIsSettingPassword(true);
          }
        } else if (!isAuthenticated && !hasHash) {
          // No recovery token and not authenticated - redirect to home
          navigate('/');
        }
      } catch (err) {
        console.error('Error checking session:', err);
        if (!isAuthenticated && !hasHash) {
          navigate('/');
        }
      } finally {
        setIsLoadingSession(false);
      }
    };

    checkRecoverySession();
  }, [isAuthenticated, navigate]);

  const handleRequestReset = async (values: RequestResetFormValues) => {
    try {
      const { data } = await resetPassword({
        variables: {
          email: values.email,
        },
      });

      if (data?.resetPassword) {
        // If user is logged in, sign them out
        if (isAuthenticated) {
          // Clear Apollo Client cache
          await apolloClient.clearStore();
          // Clear Supabase client caches
          clearSupabaseClientCache();
          clearSupabaseStorageCache();
          // Clear Redux state
          dispatch(logout());

          // Show success toast
          setSnackbar({
            open: true,
            message: 'Password reset email sent. You have been signed out.',
            severity: 'success',
          });
        } else {
          // Show success toast
          setSnackbar({
            open: true,
            message: 'Password reset email sent.',
            severity: 'success',
          });
        }

        // Redirect to login after a short delay
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
    } catch (err) {
      console.error('Reset password error:', err);
    }
  };

  const handleSetPassword = async (values: SetPasswordFormValues) => {
    setPasswordError('');
    const supabase = getSupabaseAuthClient();
    if (!supabase) {
      setPasswordError('Unable to connect to authentication service');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        setPasswordError(error.message || 'Failed to update password');
        return;
      }

      // Success - password updated
      // If user is logged in, sign them out
      if (isAuthenticated) {
        // Clear Apollo Client cache
        await apolloClient.clearStore();
        // Clear Supabase client caches
        clearSupabaseClientCache();
        clearSupabaseStorageCache();
        // Clear Redux state
        dispatch(logout());
      }

      // Clear the URL hash to remove the token
      window.history.replaceState(null, '', window.location.pathname);

      // Show success toast
      setSnackbar({
        open: true,
        message: 'Password updated successfully!',
        severity: 'success',
      });

      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err: any) {
      setPasswordError(err.message || 'An unexpected error occurred');
    }
  };

  // Loading state while checking for recovery session
  if (isLoadingSession) {
    return (
      <Container
        maxWidth="sm"
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Loading...
          </Typography>
        </Paper>
      </Container>
    );
  }

  // Show form to set new password (when user clicked email link)
  if (isSettingPassword) {
    return (
      <Container
        maxWidth="sm"
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Reset Password
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mb: 3 }}
          >
            Enter your new password below.
          </Typography>

          {passwordError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {passwordError}
            </Alert>
          )}

          <Formik
            initialValues={{
              password: '',
              confirmPassword: '',
            }}
            validationSchema={setPasswordSchema}
            onSubmit={handleSetPassword}
          >
            {({ errors, touched }) => (
              <Form>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Email"
                    type="email"
                    value={userEmail}
                    disabled
                    fullWidth
                    variant="outlined"
                  />

                  <Field
                    as={TextField}
                    name="password"
                    label="New Password"
                    type="password"
                    fullWidth
                    error={touched.password && !!errors.password}
                    helperText={
                      touched.password && errors.password
                        ? errors.password
                        : PASSWORD_HELPER_TEXT
                    }
                    variant="outlined"
                  />

                  <Field
                    as={TextField}
                    name="confirmPassword"
                    label="Confirm New Password"
                    type="password"
                    fullWidth
                    error={touched.confirmPassword && !!errors.confirmPassword}
                    helperText={
                      touched.confirmPassword && errors.confirmPassword
                    }
                    variant="outlined"
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    sx={{ mt: 2 }}
                  >
                    Update Password
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2">
              Remember your password?{' '}
              <Link component={RouterLink} to="/login" color="primary">
                Login
              </Link>
            </Typography>
          </Box>
        </Paper>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    );
  }

  // Show form to request reset email (default state)
  return (
    <Container
      maxWidth="sm"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Reset Password
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mb: 3 }}
        >
          Enter your email address and we'll send you a link to reset your
          password.
        </Typography>

        {requestError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {requestError.message || 'An error occurred'}
          </Alert>
        )}

        <Formik
          initialValues={{
            email: initialEmail,
          }}
          validationSchema={requestResetSchema}
          onSubmit={handleRequestReset}
        >
          {({ errors, touched }) => (
            <Form>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  disabled={requestLoading}
                  sx={{ mt: 2 }}
                >
                  {requestLoading ? (
                    <CircularProgress size={24} />
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </Box>
            </Form>
          )}
        </Formik>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2">
            Remember your password?{' '}
            <Link component={RouterLink} to="/login" color="primary">
              Login
            </Link>
          </Typography>
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ResetPasswordPage;
