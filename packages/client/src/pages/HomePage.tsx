import { Container, Typography, Box } from '@mui/material';

const HomePage = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box>
        <Typography variant="h3" component="h1" gutterBottom>
          Welcome to Linghuist
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your language learning community
        </Typography>
      </Box>
    </Container>
  );
};

export default HomePage;

