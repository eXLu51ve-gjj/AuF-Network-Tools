import React from 'react';
import { styled } from '@mui/material/styles';
import { Box, AppBar, Toolbar, IconButton, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

import iconNetwork from '../assets/icons/card-network.png';
import iconWifi from '../assets/icons/card-wifi.png';
import iconSSH from '../assets/icons/card-ssh.png';
import iconPorts from '../assets/icons/card-ports.png';
import iconConfig from '../assets/icons/card-config.png';
import iconUtilities from '../assets/icons/card-utilities.png';

// Dashboard icon (grid)
const DashboardSvg = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
    <rect x="3" y="3" width="8" height="8" rx="1"/>
    <rect x="13" y="3" width="8" height="8" rx="1"/>
    <rect x="3" y="13" width="8" height="8" rx="1"/>
    <rect x="13" y="13" width="8" height="8" rx="1"/>
  </svg>
);

// PNG icon wrapper for menu
const MenuIcon16: React.FC<{ src: string; active: boolean }> = ({ src, active }) => (
  <img src={src} alt="" style={{ width: 26, height: 26, objectFit: 'contain', opacity: active ? 1 : 0.45 }} />
);

// Styled components
const LayoutContainer = styled(Box)({
  display: 'flex',
  height: '100vh',
  width: '100vw',
  overflow: 'hidden',
});

const MainContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.default,
  overflow: 'hidden',
  transition: 'margin 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
}));

const ContentArea = styled(Box)({
  flexGrow: 1,
  overflow: 'auto',
  padding: '16px',
});

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: '#000000',
  borderBottom: 'none',
  color: theme.palette.text.primary,
  boxShadow: 'none',
  minHeight: '28px',
  maxHeight: '28px',
  height: '28px',
  WebkitAppRegion: 'drag', // Make the app bar draggable
  '& *': {
    WebkitAppRegion: 'no-drag', // Make child elements not draggable
  },
  '& .MuiToolbar-root': {
    minHeight: '28px !important',
    maxHeight: '28px !important',
    height: '28px !important',
    padding: '0 4px !important',
  },
}));

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: 220,
  flexShrink: 0,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '& .MuiDrawer-paper': {
    width: 220,
    backgroundColor: '#000000',
    borderRight: 'none',
    color: theme.palette.text.primary,
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflowX: 'hidden',
    overflowY: 'auto',
  },
}));

const DrawerHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 1),
  minHeight: '40px',
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const AppTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '1.1rem',
  color: theme.palette.primary.main,
  letterSpacing: '-0.25px',
}));

const StatusBar = styled(Box)(({ theme }) => ({
  display: 'none', // Hidden to maximize space
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1, 3),
  backgroundColor: theme.palette.background.paper,
  borderTop: `1px solid ${theme.palette.divider}`,
  minHeight: '40px',
  fontSize: '0.75rem',
}));

// Navigation items
const getNavigationItems = (t: (key: any) => string) => [
  { text: t('dashboard'), icon: 'dashboard', path: '/' },
  { text: t('sshTerminal'), icon: 'ssh', path: '/ssh-terminal' },
  { text: t('networkDiagnostics'), icon: 'network', path: '/diagnostics' },
  { text: t('wifiScanner'), icon: 'wifi', path: '/wifi-scanner' },
  { text: t('portScanner'), icon: 'ports', path: '/port-scanner' },
  { text: t('utilities'), icon: 'utilities', path: '/utilities' },
  { text: t('settings'), icon: 'config', path: '/settings' },
];

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [networkStatus, setNetworkStatus] = React.useState('Connected');

  const navigationItems = React.useMemo(() => getNavigationItems(t), [t]);

  // Update time every minute
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Listen for IPC events from main process
  React.useEffect(() => {
    const handleOpenSSHTerminal = () => {
      navigate('/ssh-terminal');
    };

    const handleOpenWiFiScanner = () => {
      navigate('/wifi-scanner');
    };

    const handleQuickScan = () => {
      navigate('/wifi-scanner');
    };

    // Register IPC listeners
    if (window.electronAPI?.on) {
      window.electronAPI.on('open-ssh-terminal', handleOpenSSHTerminal);
      window.electronAPI.on('open-wifi-scanner', handleOpenWiFiScanner);
      window.electronAPI.on('quick-scan', handleQuickScan);
    }

    // Cleanup
    return () => {
      if (window.electronAPI?.removeAllListeners) {
        window.electronAPI.removeAllListeners('open-ssh-terminal');
        window.electronAPI.removeAllListeners('open-wifi-scanner');
        window.electronAPI.removeAllListeners('quick-scan');
      }
    };
  }, [navigate]);

  // Format time
  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <LayoutContainer>
      {/* Sidebar Navigation */}
      <StyledDrawer 
        variant="persistent" 
        open={drawerOpen}
        sx={{
          transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          width: drawerOpen ? 220 : 0,
        }}
      >
        {/* Close button at top */}
        <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            padding: '4px',
            minHeight: '28px',
            alignItems: 'center',
          }}>
            <IconButton 
              onClick={handleDrawerToggle} 
              size="small"
              sx={{
                color: '#ff8c00',
                padding: '4px',
                width: '24px',
                height: '24px',
                '&:hover': {
                  backgroundColor: 'rgba(255, 140, 0, 0.1)',
                },
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '16px' }}>
                <Box sx={{ width: '100%', height: '2px', backgroundColor: '#ff8c00', borderRadius: '1px' }} />
                <Box sx={{ width: '100%', height: '2px', backgroundColor: '#ff8c00', borderRadius: '1px' }} />
                <Box sx={{ width: '100%', height: '2px', backgroundColor: '#ff8c00', borderRadius: '1px' }} />
              </Box>
            </IconButton>
          </Box>
          
          {/* Main Navigation */}
          <List sx={{ pt: 0 }}>
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
              <ListItem 
                button 
                key={item.text}
                onClick={() => handleNavigation(item.path)}
                selected={isActive}
                sx={{
                  borderRadius: '8px',
                  margin: '3px 6px',
                  padding: '6px 8px',
                  backgroundColor: 'transparent',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
                  '&.Mui-selected': {
                    backgroundColor: 'transparent',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: '36px' }}>
                  {item.icon === 'dashboard' ? (
                    <Box sx={{ color: isActive ? '#00d9ff' : 'rgba(255,255,255,0.4)', display: 'flex' }}>
                      <DashboardSvg />
                    </Box>
                  ) : (
                    <MenuIcon16
                      src={
                        item.icon === 'network' ? iconNetwork :
                        item.icon === 'wifi' ? iconWifi :
                        item.icon === 'ssh' ? iconSSH :
                        item.icon === 'ports' ? iconPorts :
                        item.icon === 'utilities' ? iconUtilities :
                        iconConfig
                      }
                      active={isActive}
                    />
                  )}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.8rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#00d9ff' : 'rgba(255, 255, 255, 0.5)',
                  }}
                />
              </ListItem>
              );
            })}
          </List>
        </StyledDrawer>

      {/* Main Content Area */}
      <MainContent>
        {/* Top App Bar */}
        <StyledAppBar position="static">
          <Toolbar sx={{ minHeight: '28px', maxHeight: '28px', WebkitAppRegion: 'drag', padding: '0 4px !important' }}>
            {/* Left side - App title and close button */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, WebkitAppRegion: 'no-drag' }}>
              {/* Menu Toggle Button - only when drawer is closed */}
              {!drawerOpen && (
                <IconButton 
                  onClick={handleDrawerToggle}
                  size="small"
                  sx={{ 
                    color: '#ff8c00',
                    padding: '4px',
                    width: '24px',
                    height: '24px',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 140, 0, 0.1)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '16px' }}>
                    <Box sx={{ width: '100%', height: '2px', backgroundColor: '#ff8c00', borderRadius: '1px' }} />
                    <Box sx={{ width: '100%', height: '2px', backgroundColor: '#ff8c00', borderRadius: '1px' }} />
                    <Box sx={{ width: '100%', height: '2px', backgroundColor: '#ff8c00', borderRadius: '1px' }} />
                  </Box>
                </IconButton>
              )}
              
              {/* App Title */}
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: '0.875rem', 
                  fontWeight: 600,
                  color: theme.palette.primary.main,
                  letterSpacing: '-0.25px',
                }}
              >
                AuF Tools
              </Typography>
            </Box>
            
            {/* Center - Empty space for dragging */}
            <Box sx={{ flexGrow: 1 }} />

            {/* Right side - Time and Window Controls (not draggable) */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, WebkitAppRegion: 'no-drag' }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1 }}>
                {formattedTime}
              </Typography>
              
              {/* Window Controls - Compact buttons */}
              <Box sx={{ display: 'flex', gap: '0px', alignItems: 'center' }}>
                <IconButton 
                  size="small"
                  onClick={() => window.electronAPI?.windowControl('minimize')}
                  sx={{ 
                    width: '36px',
                    height: '28px',
                    borderRadius: '0px',
                    color: theme.palette.text.secondary,
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                  }}
                >
                  <Typography sx={{ fontSize: '16px', lineHeight: 1, marginTop: '1px' }}>−</Typography>
                </IconButton>
                <IconButton 
                  size="small"
                  onClick={() => window.electronAPI?.windowControl('maximize')}
                  sx={{ 
                    width: '36px',
                    height: '28px',
                    borderRadius: '0px',
                    color: theme.palette.text.secondary,
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                  }}
                >
                  <Typography sx={{ fontSize: '13px', lineHeight: 1, marginTop: '-1px' }}>□</Typography>
                </IconButton>
                <IconButton 
                  size="small"
                  onClick={() => window.electronAPI?.windowControl('close')}
                  sx={{ 
                    width: '36px',
                    height: '28px',
                    borderRadius: '0px',
                    color: theme.palette.error.main,
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&:hover': { 
                      backgroundColor: theme.palette.error.main,
                      color: '#fff'
                    }
                  }}
                >
                  <Typography sx={{ fontSize: '16px', lineHeight: 1, marginTop: '1px' }}>×</Typography>
                </IconButton>
              </Box>
            </Box>
          </Toolbar>
        </StyledAppBar>

        {/* Content Area */}
        <ContentArea>
          {children}
        </ContentArea>

        {/* Status Bar */}
        <StatusBar>
          <Typography variant="caption" color="text.secondary">
            {t('ready')} • OLED Black Theme Active
          </Typography>
          <Typography variant="caption" color="text.secondary">
            WiFi Network Tools v1.0.0
          </Typography>
        </StatusBar>
      </MainContent>
    </LayoutContainer>
  );
};

export default MainLayout;