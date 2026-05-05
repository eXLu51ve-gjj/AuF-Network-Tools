import React from 'react';
import { Box, styled } from '@mui/material';
import BandwidthTestTool from '../components/tools/BandwidthTestTool';
import PageTransition from '../components/PageTransition';

// Glassmorphism container
const GlassContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #000000 100%)',
  padding: theme.spacing(4),
  position: 'relative',
  overflow: 'hidden',
  
  // Animated background elements
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '-50%',
    left: '-50%',
    width: '200%',
    height: '200%',
    background: 'radial-gradient(circle, rgba(0, 255, 255, 0.03) 0%, transparent 70%)',
    animation: 'pulse 15s ease-in-out infinite',
  },
  
  '@keyframes pulse': {
    '0%, 100%': {
      transform: 'translate(0, 0) scale(1)',
      opacity: 0.3,
    },
    '50%': {
      transform: 'translate(10%, 10%) scale(1.1)',
      opacity: 0.5,
    },
  },
}));

// Bento grid layout
const BentoGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(12, 1fr)',
  gap: theme.spacing(3),
  maxWidth: '1600px',
  margin: '0 auto',
  position: 'relative',
  zIndex: 1,
}));

// Main speedtest card (large, center)
const SpeedTestCard = styled(Box)(({ theme }) => ({
  gridColumn: 'span 12',
  background: 'rgba(10, 10, 10, 0.6)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(0, 255, 255, 0.1)',
  borderRadius: theme.spacing(3),
  padding: theme.spacing(4),
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  transition: 'all 0.3s ease',
  
  '&:hover': {
    border: '1px solid rgba(0, 255, 255, 0.2)',
    boxShadow: '0 8px 32px 0 rgba(0, 255, 255, 0.1)',
  },
}));

const UtilitiesPage: React.FC = () => {
  return (
    <PageTransition>
      <GlassContainer>
        <BentoGrid>
          <SpeedTestCard>
            <BandwidthTestTool />
          </SpeedTestCard>
        </BentoGrid>
      </GlassContainer>
    </PageTransition>
  );
};

export default UtilitiesPage;
