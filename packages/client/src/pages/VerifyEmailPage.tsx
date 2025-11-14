import { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Button,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { VERIFY_EMAIL_MUTATION } from '@/api/mutations';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifyEmail, { loading, error }] = useMutation(VERIFY_EMAIL_MUTATION);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const verify = async () => {
      // Supabase verification links contain tokens in the hash fragment
      // Format: #access_token=...&type=...&expires_in=...
      const hash = window.location.hash;
      const urlParams = new URLSearchParams(hash.substring(1));

      // Try to get userId from query params first (if passed explicitly)
      let userId = searchParams.get('userId');

      // If not in query params, try to extract from hash
      if (!userId) {
        // Supabase might pass userId in the hash
        userId = urlParams.get('userId');
      }

      // If still no userId, try to decode from access_token (JWT)
      if (!userId && urlParams.get('access_token')) {
        try {
          const token = urlParams.get('access_token');
          if (token) {
            // Decode JWT to get user ID (payload.sub contains the user ID)
            const payload = JSON.parse(atob(token.split('.')[1]));
            userId = payload.sub;
          }
        } catch (err) {
          console.error('Failed to decode token:', err);
        }
      }

      if (!userId) {
        setVerificationError(
          'No user ID found in verification link. Please try clicking the link from your email again.',
        );
        return;
      }

      try {
        const { data } = await verifyEmail({
          variables: { userId },
        });

        if (data?.verifyEmail) {
          setIsVerified(true);
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        }
      } catch (err: any) {
        setVerificationError(err.message || 'Failed to verify email');
      }
    };

    verify();
  }, [verifyEmail, navigate, searchParams]);

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
        {loading && (
          <Box>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="h6">Verifying your email...</Typography>
          </Box>
        )}

        {error && (
          <Box>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error.message || 'An error occurred during verification'}
            </Alert>
            <Button
              variant="contained"
              component={RouterLink}
              to="/login"
              sx={{ mt: 2 }}
            >
              Go to Login
            </Button>
          </Box>
        )}

        {verificationError && (
          <Box>
            <Alert severity="error" sx={{ mb: 2 }}>
              {verificationError}
            </Alert>
            <Button
              variant="contained"
              component={RouterLink}
              to="/login"
              sx={{ mt: 2 }}
            >
              Go to Login
            </Button>
          </Box>
        )}

        {isVerified && !loading && !error && (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Email verified successfully!
              </Typography>
              <Typography variant="body2">
                Redirecting to login page...
              </Typography>
            </Alert>
            <Button
              variant="contained"
              component={RouterLink}
              to="/login"
              sx={{ mt: 2 }}
            >
              Go to Login Now
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default VerifyEmailPage;
