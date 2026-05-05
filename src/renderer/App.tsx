import React, { useState, useEffect } from 'react';
import { styled, keyframes } from '@mui/material/styles';
import { Box, CssBaseline, Typography, LinearProgress } from '@mui/material';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { useTheme } from './contexts/ThemeContext';
import Layout from './layouts/MainLayout';
import Router from './Router';

const AppContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary,
  minHeight: '100vh',
  width: '100vw',
  overflow: 'hidden',
}));

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
`;

const SplashScreen: React.FC<{ progress: number; status: string }> = ({ progress, status }) => (
  <Box sx={{
    position: 'fixed',
    inset: 0,
    backgroundColor: '#000',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    gap: 3,
  }}>
    {/* Logo / Icon */}
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <Box sx={{
        width: 64,
        height: 64,
        border: '2px solid #00d9ff',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: `${pulse} 2s ease-in-out infinite`,
      }}>
        <Typography sx={{ fontSize: '28px', fontFamily: 'monospace', color: '#00d9ff', fontWeight: 700 }}>
          &gt;_
        </Typography>
      </Box>
      <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#fff', letterSpacing: '0.1em' }}>
        AuF Tools
      </Typography>
      <Typography sx={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em' }}>
        WiFi Network Tools
      </Typography>
    </Box>

    {/* Progress bar */}
    <Box sx={{ width: '280px', display: 'flex', flexDirection: 'column', gap: 1 }}>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 3,
          borderRadius: 2,
          backgroundColor: 'rgba(255,255,255,0.1)',
          '& .MuiLinearProgress-bar': {
            backgroundColor: '#00d9ff',
            borderRadius: 2,
          },
        }}
      />
      <Typography sx={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
        {status}
      </Typography>
    </Box>
  </Box>
);

const App: React.FC = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Инициализация...');

  useEffect(() => {
    // Simulate loading stages
    const stages = [
      { progress: 20, status: 'Загрузка интерфейса...', delay: 100 },
      { progress: 50, status: 'Инициализация сервисов...', delay: 400 },
      { progress: 75, status: 'Подготовка инструментов...', delay: 700 },
      { progress: 95, status: 'Почти готово...', delay: 1000 },
      { progress: 100, status: 'Готово!', delay: 1300 },
    ];

    stages.forEach(({ progress, status, delay }) => {
      setTimeout(() => {
        setProgress(progress);
        setStatus(status);
      }, delay);
    });

    // Hide splash after all stages
    setTimeout(() => {
      setLoading(false);
    }, 1600);
  }, []);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {loading && <SplashScreen progress={progress} status={status} />}
      <AppContainer sx={{ opacity: loading ? 0 : 1, transition: 'opacity 0.3s ease' }}>
        <Layout>
          <Router />
        </Layout>
      </AppContainer>
    </MuiThemeProvider>
  );
};

export default App;
