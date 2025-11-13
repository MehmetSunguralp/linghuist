import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
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
} from '@mui/material';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { RESET_PASSWORD_MUTATION } from '../api/mutations';

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
});

interface ResetPasswordFormValues {
  email: string;
}

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const [resetPassword, { loading, error }] = useMutation(RESET_PASSWORD_MUTATION);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const initialEmail = searchParams.get('email') || '';

  const handleSubmit = async (values: ResetPasswordFormValues) => {
    try {
      const { data } = await resetPassword({
        variables: {
          email: values.email,
        },
      });

      if (data?.resetPassword) {
        setIsEmailSent(true);
      }
    } catch (err) {
      console.error('Reset password error:', err);
    }
  };

  if (isEmailSent) {
    return (
      <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Password Reset Email Sent
            </Typography>
            <Typography variant="body2">
              Check your email for instructions to reset your password.
            </Typography>
          </Alert>
          <Button
            variant="contained"
            component={RouterLink}
            to="/login"
            sx={{ mt: 2 }}
          >
            Back to Login
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Reset Password
        </Typography>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          Enter your email address and we'll send you a link to reset your password.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error.message || 'An error occurred'}
          </Alert>
        )}

        <Formik
          initialValues={{
            email: initialEmail,
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
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
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Send Reset Link'}
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
    </Container>
  );
};

export default ResetPasswordPage;

