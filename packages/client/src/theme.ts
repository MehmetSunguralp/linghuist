import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6E53B5',
      light: '#747bff',
      dark: '#535bf2',
    },
    secondary: {
      main: '#9677E6',
    },
    background: {
      default: '#2C2638',
      paper: '#3C364C',
    },
    text: {
      primary: 'rgba(255, 255, 255, 0.87)',
      secondary: 'rgba(255, 255, 255, 0.6)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
          '&:hover': {
            backgroundColor: '#8161D1',
          },
        },
        outlined: ({ theme }) => ({
          color: theme.palette.secondary.main,
          borderColor: theme.palette.secondary.main,
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
            backgroundColor: '#6E53B51F',
          },
        }),
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
          },
        },
      },
    },
  },
});

export default theme;
