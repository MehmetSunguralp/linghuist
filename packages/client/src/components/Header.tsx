import { useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Button,
  Avatar,
  Box,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout, setSignedAvatarUrl } from '@/store/authStore';
import { getSupabaseStorageUrl } from '@/utils/supabaseStorage';
import apolloClient from '@/lib/apolloClient';
import { clearSupabaseClientCache } from '@/lib/supabaseClient';

// Signed URLs are valid for 1 hour (3600 seconds)
const SIGNED_URL_VALIDITY_MS = 3600 * 1000;

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {
    isAuthenticated,
    user,
    accessToken,
    signedAvatarUrl,
    signedAvatarUrlExpiry,
  } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const fetchAvatarUrl = async () => {
      if (!user?.avatarUrl || !accessToken) {
        return;
      }

      // Check if we have a valid cached signed URL
      const now = Date.now();
      if (
        signedAvatarUrl &&
        signedAvatarUrlExpiry &&
        now < signedAvatarUrlExpiry
      ) {
        // Cached URL is still valid, no need to fetch
        return;
      }

      // Fetch new signed URL
      try {
        const url = await getSupabaseStorageUrl(
          user.avatarUrl,
          'avatars',
          accessToken,
        );

        if (url) {
          // Cache the signed URL with expiry time (1 hour from now)
          const expiryTime = now + SIGNED_URL_VALIDITY_MS;
          dispatch(setSignedAvatarUrl({ url, expiryTime }));
        }
      } catch (error) {
        console.error('Failed to get avatar URL:', error);
      }
    };

    fetchAvatarUrl();
    // Only depend on user avatar URL and access token, not the cached values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.avatarUrl, accessToken]);

  const handleLogout = async () => {
    // Clear Apollo Client cache
    await apolloClient.clearStore();
    // Clear Supabase client cache
    clearSupabaseClientCache();
    // Clear Redux state (includes signedAvatarUrl)
    dispatch(logout());
    // Navigate to login
    navigate('/login');
  };

  return (
    <AppBar position="static">
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <RouterLink to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Typography variant="h6" component="div">
            Linghuist
          </Typography>
        </RouterLink>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isAuthenticated ? (
            <>
              <Avatar
                alt={user?.username || user?.email || 'User'}
                src={signedAvatarUrl || '/static/images/avatar/1.jpg'}
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate('/profile')}
              />
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login">
                Login
              </Button>
              <Button color="inherit" component={RouterLink} to="/signup">
                Sign Up
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
