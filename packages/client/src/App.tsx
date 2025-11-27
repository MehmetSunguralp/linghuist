import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { ApolloProvider } from '@apollo/client';
import { Provider, useDispatch } from 'react-redux';
import theme from '@/theme';
import apolloClient from '@/lib/apolloClient';
import { store } from '@/store/store';
import { useAuthUser } from '@/hooks/useAuthUser';
import { logout } from '@/store/authStore';
import { clearSupabaseClientCache } from '@/lib/supabaseClient';
import { clearSupabaseStorageCache } from '@/utils/supabaseStorage';
import Header from '@/components/Header';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import VerifyEmailPage from '@/pages/VerifyEmailPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import ProfilePage from '@/pages/ProfilePage';
import ChatPage from '@/pages/ChatPage';
import DiscoverPage from '@/pages/DiscoverPage';

const AppContent = () => {
  // Fetch user data if authenticated
  useAuthUser();

  return (
    <Router>
      <UnauthorizedHandler />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verified" element={<VerifyEmailPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:username" element={<ChatPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
        </Routes>
      </Box>
    </Router>
  );
};

// Component to handle navigation on unauthorized errors (needs to be inside Router)
const UnauthorizedHandler = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const handleUnauthorized = async () => {
      // Clear all caches
      await apolloClient.clearStore();
      clearSupabaseClientCache();
      clearSupabaseStorageCache();
      
      // Dispatch logout to clear Redux state
      dispatch(logout());
      
      // Navigate to login page
      navigate('/login');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [dispatch, navigate]);

  return null;
};

function App() {
  return (
    <Provider store={store}>
      <ApolloProvider client={apolloClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AppContent />
        </ThemeProvider>
      </ApolloProvider>
    </Provider>
  );
}

export default App;
