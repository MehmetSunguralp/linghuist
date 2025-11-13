import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { ApolloProvider } from '@apollo/client';
import { Provider } from 'react-redux';
import theme from './theme';
import apolloClient from './lib/apolloClient';
import { store } from './store/store';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

function App() {
  return (
    <Provider store={store}>
      <ApolloProvider client={apolloClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
              <Header />
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
              </Routes>
            </Box>
          </Router>
        </ThemeProvider>
      </ApolloProvider>
    </Provider>
  );
}

export default App;
