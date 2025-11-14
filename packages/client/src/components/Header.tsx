import { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Button,
  Avatar,
  Box,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  logout,
  setSignedAvatarUrl,
  clearSignedAvatarUrl,
} from '@/store/authStore';
import {
  getSupabaseStorageUrl,
  clearSupabaseStorageCache,
} from '@/utils/supabaseStorage';
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
  const [avatarMenuAnchor, setAvatarMenuAnchor] = useState<null | HTMLElement>(
    null,
  );
  const [avatarLoaded, setAvatarLoaded] = useState(false);

  useEffect(() => {
    const fetchAvatarUrl = async () => {
      if (!user?.avatarUrl || !accessToken) {
        // Clear avatar if no user or token
        if (signedAvatarUrl) {
          dispatch(clearSignedAvatarUrl());
        }
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
          // Reset loaded state when URL changes
          setAvatarLoaded(false);
        } else {
          // Clear avatar if fetch failed (file might not exist)
          dispatch(clearSignedAvatarUrl());
          setAvatarLoaded(false);
        }
      } catch (error) {
        console.error('Failed to get avatar URL:', error);
        // Clear avatar on error (file might not exist or be inaccessible)
        dispatch(clearSignedAvatarUrl());
        setAvatarLoaded(false);
      }
    };

    fetchAvatarUrl();
    // Only depend on user avatar URL and access token, not the cached values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.avatarUrl, user?.id, accessToken]);

  // Reset loaded state when avatar URL changes
  useEffect(() => {
    setAvatarLoaded(false);
  }, [signedAvatarUrl]);

  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
    setAvatarMenuAnchor(event.currentTarget);
  };

  const handleAvatarMenuClose = () => {
    setAvatarMenuAnchor(null);
  };

  const handleLogout = async () => {
    handleAvatarMenuClose();
    // Clear Apollo Client cache
    await apolloClient.clearStore();
    // Clear Supabase client caches
    clearSupabaseClientCache();
    clearSupabaseStorageCache();
    // Clear Redux state (includes signedAvatarUrl)
    dispatch(logout());
    // Navigate to login
    navigate('/login');
  };

  const handleProfileClick = () => {
    handleAvatarMenuClose();
    navigate('/profile');
  };

  return (
    <AppBar position="sticky">
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
                sx={{
                  cursor: 'pointer',
                  opacity: signedAvatarUrl && !avatarLoaded ? 0 : 1,
                  transition: 'opacity 0.3s ease-in-out',
                }}
                imgProps={{
                  onLoad: () => {
                    if (signedAvatarUrl) {
                      setAvatarLoaded(true);
                    }
                  },
                }}
                onClick={handleAvatarClick}
              />
              <Menu
                anchorEl={avatarMenuAnchor}
                open={Boolean(avatarMenuAnchor)}
                onClose={handleAvatarMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem onClick={handleProfileClick}>
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  Profile
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button color="inherit" onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button variant="contained" onClick={() => navigate('/signup')}>
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
