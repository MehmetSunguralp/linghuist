import { useEffect } from 'react';
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
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { SIGNUP_MUTATION } from '@/api/mutations';
import {
  emailValidation,
  passwordValidation,
  PASSWORD_HELPER_TEXT,
} from '@/utils/validation';
import { useAppSelector } from '@/store/hooks';

const validationSchema = Yup.object({
  email: emailValidation,
  password: passwordValidation,
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

interface SignupFormValues {
  email: string;
  password: string;
  confirmPassword: string;
}

const SignupPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [signup, { loading, error }] = useMutation(SIGNUP_MUTATION);

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

  const handleSubmit = async (values: SignupFormValues) => {
    try {
      const { data } = await signup({
        variables: {
          email: values.email,
          password: values.password,
        },
      });

      if (data?.signup) {
        navigate('/login');
      }
    } catch (err) {
      console.error('Signup error:', err);
    }
  };

  const backgroundImageUrl =
    'https://evsxpvgpnhdfgalkodpg.supabase.co/storage/v1/object/public/publicAssets/bg_img.png';

  return (
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

      {/* Right side - Signup Form */}
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
            Welcome to Linghuist
          </Typography>

          <Typography variant="h4" component="h1" gutterBottom align="center">
            Create Your Account
          </Typography>

          <Typography
            variant="subtitle2"
            component={'h3'}
            gutterBottom
            align="center"
            fontWeight={300}
          >
            Start practicing language skills and making new connections!
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2, mt: 2 }}>
              {error.message || 'An error occurred during signup'}
            </Alert>
          )}

          <Formik
            initialValues={{
              email: '',
              password: '',
              confirmPassword: '',
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
                    label="Confirm Password"
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
                    disabled={loading}
                    sx={{ mt: 2 }}
                  >
                    {loading ? (
                      <CircularProgress size={24} />
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login" color="primary">
                Login
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SignupPage;
