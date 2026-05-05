import React, { useState } from 'react';
import { Box, Typography, styled } from '@mui/material';
import { Container, Section } from '../components/Layout';
import WiFiScannerTool from '../components/tools/WiFiScannerTool';
import type { ScanResult } from '../components/tools/WiFiScannerTool';
import PageTransition from '../components/PageTransition';

// Styled components
const PageHeader = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));

const ToolSection = styled(Section)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const StatsSection = styled(Section)(({ theme }) => ({
  marginTop: theme.spacing(3),
}));

const WiFiScannerPage: React.FC = () => {
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);

  const handleScanComplete = (result: ScanResult) => {
    setLastScanResult(result);
  };

  return (
    <PageTransition>
      <Container maxWidth="xl">
      <PageHeader>
        <Typography variant="h4" component="h1" gutterBottom>
          WiFi Scanner
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Comprehensive wireless network scanning and analysis tool. Discover available networks, 
          measure signal strength, analyze security types, and optimize your WiFi environment.
        </Typography>
      </PageHeader>

      <ToolSection background="paper" bordered>
        <WiFiScannerTool onScanComplete={handleScanComplete} />
      </ToolSection>

      {lastScanResult && (
        <StatsSection background="paper" bordered>
          <Typography variant="h6" gutterBottom>
            Scan Statistics
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Networks Found
              </Typography>
              <Typography variant="h4">
                {lastScanResult.networks.length}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Scan Duration
              </Typography>
              <Typography variant="h4">
                {lastScanResult.duration}s
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Band Scanned
              </Typography>
              <Typography variant="h4">
                {lastScanResult.band}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Scan Time
              </Typography>
              <Typography variant="h4">
                {lastScanResult.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>
          </Box>
        </StatsSection>
      )}
    </Container>
    </PageTransition>
  );
};

export default WiFiScannerPage;