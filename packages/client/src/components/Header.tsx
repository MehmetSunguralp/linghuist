import { AppBar, Toolbar, Button, Avatar, Box, Typography } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout } from '../store/authStore';

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
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
                src={user?.avatarUrl || '/static/images/avatar/1.jpg'}
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

