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
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { LOGIN_MUTATION } from '../api/mutations';
import { ME_QUERY } from '../api/queries';
import { useAppDispatch } from '../store/hooks';
import { setAuth } from '../store/authStore';
import apolloClient from '../lib/apolloClient';
import type { User } from '../types';

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
  const [login, { loading, error }] = useMutation(LOGIN_MUTATION);

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

        navigate('/');
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Login
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error.message || 'An error occurred during login'}
          </Alert>
        )}

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
            <Link component={RouterLink} to="/reset-password" color="primary">
              Forgot your password?
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;

