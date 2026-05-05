import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  styled,
  IconButton,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

// Glassmorphism styled components
const TestContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
}));

const Header = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  marginBottom: theme.spacing(2),
}));

const Title = styled(Typography)(({ theme }) => ({
  fontSize: '2rem',
  fontWeight: 700,
  background: 'linear-gradient(135deg, #00FFFF 0%, #FF00FF 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  marginBottom: theme.spacing(1),
}));

const Subtitle = styled(Typography)(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.6)',
  fontSize: '0.875rem',
}));

// Start button
const StartButton = styled(IconButton)(({ theme }) => ({
  width: '120px',
  height: '120px',
  margin: '0 auto',
  background: 'linear-gradient(135deg, #00FFFF 0%, #00CCCC 100%)',
  color: '#000',
  fontSize: '3rem',
  transition: 'all 0.3s ease',
  boxShadow: '0 0 30px rgba(0, 255, 255, 0.3)',
  
  '&:hover': {
    background: 'linear-gradient(135deg, #00FFFF 0%, #00AAAA 100%)',
    transform: 'scale(1.05)',
    boxShadow: '0 0 40px rgba(0, 255, 255, 0.5)',
  },
  
  '&:disabled': {
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.3)',
  },
}));

// Speed display cards
const SpeedGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: theme.spacing(3),
  marginTop: theme.spacing(3),
}));

const SpeedCard = styled(Box)<{ active?: boolean }>(({ theme, active }) => ({
  background: active 
    ? 'linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(0, 255, 255, 0.05) 100%)'
    : 'rgba(255, 255, 255, 0.03)',
  backdropFilter: 'blur(10px)',
  border: active 
    ? '2px solid rgba(0, 255, 255, 0.3)'
    : '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
  textAlign: 'center',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  
  '&::before': active ? {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.2), transparent)',
    animation: 'shimmer 2s infinite',
  } : {},
  
  '@keyframes shimmer': {
    '0%': { left: '-100%' },
    '100%': { left: '100%' },
  },
}));

const SpeedValue = styled(Typography)(({ theme }) => ({
  fontSize: '3.5rem',
  fontWeight: 700,
  fontFamily: 'monospace',
  background: 'linear-gradient(135deg, #00FFFF 0%, #FFFFFF 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  marginTop: theme.spacing(1),
}));

const SpeedLabel = styled(Typography)(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.6)',
  fontSize: '0.875rem',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginTop: theme.spacing(1),
}));

// Chart container
const ChartContainer = styled(Box)(({ theme }) => ({
  background: 'rgba(0, 0, 0, 0.3)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
  marginTop: theme.spacing(3),
  minHeight: '350px',
}));

// Progress bar
const StyledProgress = styled(LinearProgress)(({ theme }) => ({
  height: '8px',
  borderRadius: '4px',
  background: 'rgba(255, 255, 255, 0.1)',
  
  '& .MuiLinearProgress-bar': {
    background: 'linear-gradient(90deg, #00FFFF 0%, #FF00FF 100%)',
    borderRadius: '4px',
  },
}));

const StatusText = styled(Typography)(({ theme }) => ({
  textAlign: 'center',
  color: '#00FFFF',
  fontSize: '0.875rem',
  marginTop: theme.spacing(1),
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
}));

interface SpeedDataPoint {
  time: number;
  download: number;
  upload: number;
}

const BandwidthTestTool: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [testPhase, setTestPhase] = useState<'idle' | 'ping' | 'download' | 'upload' | 'complete'>('idle');
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [ping, setPing] = useState(0);
  const [progress, setProgress] = useState(0);
  const [chartData, setChartData] = useState<SpeedDataPoint[]>([]);
  const [downloadChartData, setDownloadChartData] = useState<SpeedDataPoint[]>([]);
  const [uploadChartData, setUploadChartData] = useState<SpeedDataPoint[]>([]);

  const runTest = async () => {
    setIsTesting(true);
    setTestPhase('ping');
    setProgress(0);
    setChartData([]);
    setDownloadChartData([]);
    setUploadChartData([]);
    setDownloadSpeed(0);
    setUploadSpeed(0);

    const testId = `test-${Date.now()}`;

    try {
      setProgress(10);
      
      const downloadPoints: SpeedDataPoint[] = [];
      const uploadPoints: SpeedDataPoint[] = [];
      let downloadPhaseStarted = false;
      let uploadPhaseStarted = false;
      
      const progressHandler = (data: any) => {
        if (data.testId === testId) {
          if (data.type === 'download') {
            if (!downloadPhaseStarted) {
              downloadPhaseStarted = true;
              setTestPhase('download');
            }
            const speed = Math.round(data.speed * 100) / 100;
            setDownloadSpeed(speed);
            downloadPoints.push({ 
              time: Math.round(data.elapsed * 100) / 100, 
              download: speed, 
              upload: 0 
            });
            setDownloadChartData([...downloadPoints]);
            setProgress(10 + Math.min(50, (data.elapsed / 15) * 50));
          } else if (data.type === 'upload') {
            if (!uploadPhaseStarted) {
              uploadPhaseStarted = true;
              setTestPhase('upload');
            }
            const speed = Math.round(data.speed * 100) / 100;
            setUploadSpeed(speed);
            uploadPoints.push({ 
              time: Math.round(data.elapsed * 100) / 100, 
              download: 0, 
              upload: speed 
            });
            setUploadChartData([...uploadPoints]);
            setProgress(60 + Math.min(40, (data.elapsed / 15) * 40));
          }
        }
      };

      window.electronAPI.on('speed-test:progress', progressHandler);
      
      // Запускаем полный тест
      const result = await window.electronAPI.speedTestDownload(testId, 8, 15);
      
      window.electronAPI.removeAllListeners('speed-test:progress');

      if (result.success) {
        if (result.downloadSpeed) setDownloadSpeed(result.downloadSpeed);
        if (result.uploadSpeed) setUploadSpeed(result.uploadSpeed);
        if (result.ping) setPing(result.ping);
      }

      setProgress(100);
      setTestPhase('complete');
    } catch (error) {
      console.error('Test error:', error);
      alert(`Ошибка теста: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setIsTesting(false);
      window.electronAPI.removeAllListeners('speed-test:progress');
    }
  };

  const stopTest = () => {
    setIsTesting(false);
    setTestPhase('idle');
    setProgress(0);
  };

  const getStatusText = () => {
    switch (testPhase) {
      case 'ping': return 'Измерение задержки...';
      case 'download': return 'Тестирование скорости загрузки...';
      case 'upload': return 'Тестирование скорости отдачи...';
      case 'complete': return 'Тест завершен!';
      default: return 'Нажмите для начала теста';
    }
  };

  return (
    <TestContainer>
      <Header>
        <Title>Тест скорости интернета</Title>
        <Subtitle>Измерение реальной пропускной способности вашего соединения</Subtitle>
      </Header>

      {/* Start/Stop Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <StartButton
          onClick={isTesting ? stopTest : runTest}
          disabled={false}
        >
          {isTesting ? <StopIcon fontSize="inherit" /> : <PlayIcon fontSize="inherit" />}
        </StartButton>
      </Box>

      {/* Status */}
      {testPhase !== 'idle' && (
        <Box>
          <StatusText>{getStatusText()}</StatusText>
          <StyledProgress variant="determinate" value={progress} sx={{ mt: 2 }} />
          <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1, color: 'rgba(255,255,255,0.5)' }}>
            {progress.toFixed(0)}%
          </Typography>
        </Box>
      )}

      {/* Speed Cards */}
      {(testPhase !== 'idle' || downloadSpeed > 0) && (
        <SpeedGrid>
          <SpeedCard active={testPhase === 'download'}>
            <DownloadIcon sx={{ fontSize: 40, color: '#00FFFF' }} />
            <SpeedValue>{downloadSpeed.toFixed(2)}</SpeedValue>
            <SpeedLabel>Mbps Download</SpeedLabel>
          </SpeedCard>

          <SpeedCard active={testPhase === 'upload'}>
            <UploadIcon sx={{ fontSize: 40, color: '#FF00FF' }} />
            <SpeedValue>{uploadSpeed.toFixed(2)}</SpeedValue>
            <SpeedLabel>Mbps Upload</SpeedLabel>
          </SpeedCard>

          <SpeedCard active={testPhase === 'ping'}>
            <SpeedIcon sx={{ fontSize: 40, color: '#FFFF00' }} />
            <SpeedValue>{ping.toFixed(0)}</SpeedValue>
            <SpeedLabel>ms Ping</SpeedLabel>
          </SpeedCard>
        </SpeedGrid>
      )}

      {/* Charts - Download and Upload side by side */}
      {(downloadChartData.length > 0 || uploadChartData.length > 0) && (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mt: 3 }}>
          {/* Download Chart */}
          {downloadChartData.length > 0 && (
            <ChartContainer>
              <Typography variant="h6" sx={{ color: '#00FFFF', mb: 2, fontSize: '1rem' }}>
                Download - График скорости
              </Typography>
              <Box sx={{ width: '100%', height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={downloadChartData}>
                    <defs>
                      <linearGradient id="colorDownload" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00FFFF" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00FFFF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="time" 
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: 'rgba(255,255,255,0.5)' }}
                      tickFormatter={(value) => value.toFixed(1)}
                      label={{ value: 'Время (сек)', position: 'insideBottom', offset: -5, fill: 'rgba(255,255,255,0.5)' }}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: 'rgba(255,255,255,0.5)' }}
                      tickFormatter={(value) => value.toFixed(0)}
                      label={{ value: 'Скорость (Mbps)', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.5)' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'rgba(0, 0, 0, 0.8)', 
                        border: '1px solid rgba(0, 255, 255, 0.3)',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      formatter={(value: any) => `${Number(value).toFixed(2)} Mbps`}
                      labelFormatter={(label) => `Время: ${Number(label).toFixed(1)}с`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="download" 
                      stroke="#00FFFF" 
                      strokeWidth={2}
                      fill="url(#colorDownload)" 
                      name="Download"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </ChartContainer>
          )}

          {/* Upload Chart */}
          {uploadChartData.length > 0 && (
            <ChartContainer>
              <Typography variant="h6" sx={{ color: '#FF00FF', mb: 2, fontSize: '1rem' }}>
                Upload - График скорости
              </Typography>
              <Box sx={{ width: '100%', height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={uploadChartData}>
                    <defs>
                      <linearGradient id="colorUpload" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF00FF" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#FF00FF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="time" 
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: 'rgba(255,255,255,0.5)' }}
                      tickFormatter={(value) => value.toFixed(1)}
                      label={{ value: 'Время (сек)', position: 'insideBottom', offset: -5, fill: 'rgba(255,255,255,0.5)' }}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: 'rgba(255,255,255,0.5)' }}
                      tickFormatter={(value) => value.toFixed(0)}
                      label={{ value: 'Скорость (Mbps)', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.5)' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'rgba(0, 0, 0, 0.8)', 
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      formatter={(value: any) => `${Number(value).toFixed(2)} Mbps`}
                      labelFormatter={(label) => `Время: ${Number(label).toFixed(1)}с`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="upload" 
                      stroke="#FF00FF" 
                      strokeWidth={2}
                      fill="url(#colorUpload)" 
                      name="Upload"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </ChartContainer>
          )}
        </Box>
      )}
    </TestContainer>
  );
};

export default BandwidthTestTool;
