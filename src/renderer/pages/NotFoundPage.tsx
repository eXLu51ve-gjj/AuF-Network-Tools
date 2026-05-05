import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Container } from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import PageTransition from '../components/PageTransition';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <Container maxWidth="md" centered>
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h1" component="h1" gutterBottom sx={{ fontSize: '6rem', fontWeight: 700 }}>
          404
        </Typography>
        <Typography variant="h4" component="h2" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          The page you are looking for doesn't exist or has been moved.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Return to Dashboard
        </Button>
      </Box>
    </Container>
    </PageTransition>
  );
};

export default NotFoundPage;