import React from 'react';
import { styled } from '@mui/material/styles';
import { Grid, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../components';
import { useLanguage } from '../contexts/LanguageContext';
import PageTransition from '../components/PageTransition';

import iconNetwork from '../assets/icons/card-network.png';
import iconWifi from '../assets/icons/card-wifi.png';
import iconSSH from '../assets/icons/card-ssh.png';
import iconPorts from '../assets/icons/card-ports.png';
import iconBandwidth from '../assets/icons/card-bandwidth.png';
import iconConfig from '../assets/icons/card-config.png';

// Styled components
const DashboardContainer = styled(Box)({
  height: '100%',
  overflow: 'auto',
});

const ToolIcon = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '96px',
  height: '96px',
  borderRadius: '16px',
  marginBottom: '16px',
  overflow: 'hidden',
});

// Tool data defined inside component with translations


const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Quick actions with translations
  const quickActions = React.useMemo(() => [
    { label: t('quickWiFiScan'), action: 'quick-wifi-scan' },
    { label: t('pingLocalhost'), action: 'ping-localhost' },
    { label: t('checkPort80'), action: 'check-port-80' },
    { label: t('testDNS'), action: 'test-dns' },
  ], [t]);

  // Tool data with translations
  const tools = React.useMemo(() => [
    {
      title: t('networkDiagnostics'),
      description: t('networkDiagnosticsDesc'),
      icon: iconNetwork,
      path: '/diagnostics',
    },
    {
      title: t('wifiScanner'),
      description: t('wifiScannerDesc'),
      icon: iconWifi,
      path: '/wifi-scanner',
    },
    {
      title: t('sshTerminal'),
      description: t('sshTerminalDesc'),
      icon: iconSSH,
      path: '/ssh-terminal',
    },
    {
      title: t('portScanner'),
      description: t('portScannerDesc'),
      icon: iconPorts,
      path: '/port-scanner',
    },
    {
      title: t('bandwidthTest'),
      description: t('bandwidthTestDesc'),
      icon: iconBandwidth,
      path: '/utilities',
    },
    {
      title: t('configuration'),
      description: t('manageSettingsProfiles'),
      icon: iconConfig,
      path: '/configuration',
    },
  ], [t]);

  const handleToolClick = (path: string) => {
    navigate(path);
  };

  const handleQuickAction = (action: string) => {
    console.log('Quick action:', action);
    // Quick action implementation
  };

  return (
    <PageTransition>
      <DashboardContainer>
        {/* Welcome Section */}
        <Box sx={{ marginBottom: '32px' }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#00d9ff' }}>
            {t('welcomeTitle')}
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            {t('welcomeDescription')}
          </Typography>
        </Box>

        {/* Tools Grid */}
        <Grid container spacing={3}>
          {tools.map((tool, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card 
                title={tool.title}
                hoverEffect
                onClick={() => handleToolClick(tool.path)}
                sx={{ height: '100%', cursor: 'pointer' }}
              >
                <ToolIcon>
                  <img src={tool.icon} alt={tool.title} style={{ width: '96px', height: '96px', objectFit: 'contain' }} />
                </ToolIcon>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff', mb: 1 }}>
                  {tool.title}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }} paragraph>
                  {tool.description}
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small"
                  sx={{ 
                    marginTop: 'auto',
                    borderColor: 'rgba(0, 217, 255, 0.3)',
                    color: '#00d9ff',
                    '&:hover': {
                      borderColor: '#00d9ff',
                      backgroundColor: 'rgba(0, 217, 255, 0.1)',
                    }
                  }}
                >
                  {t('openTool')}
                </Button>
              </Card>
            </Grid>
          ))}
        </Grid>
      </DashboardContainer>
    </PageTransition>
  );
};

export default DashboardPage;