import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  styled,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { Layout, Grid, Section, Divider } from '../Layout';
import { Card, CardTitle } from '../Card';
import { Button } from '../Button';
import { Input } from '../Input';
import SimpleChart from '../SimpleChart';
import { useLanguage } from '../../contexts/LanguageContext';

// Styled components
const ControlSection = styled(Section)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const ResultsSection = styled(Section)(({ theme }) => ({
  marginTop: theme.spacing(3),
}));

const ProgressContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

const ProgressInfo = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(1),
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  maxHeight: '400px',
  overflow: 'auto',
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
}));

const SuccessChip = styled(Chip)(({ theme }) => ({
  backgroundColor: 'rgba(0, 255, 0, 0.1)',
  color: theme.palette.success.main,
  border: `1px solid ${theme.palette.success.main}`,
}));

const ErrorChip = styled(Chip)(({ theme }) => ({
  backgroundColor: 'rgba(255, 0, 0, 0.1)',
  color: theme.palette.error.main,
  border: `1px solid ${theme.palette.error.main}`,
}));



// Types
interface PingResult {
  id: number;
  sequence: number;
  timestamp: Date;
  host: string;
  bytes: number;
  time: number; // ms
  ttl: number;
  success: boolean;
  error?: string;
}

interface PingFormData {
  host: string;
  count: number;
  timeout: number;
  interval: number;
}

const PingTool: React.FC = () => {
  const { t } = useLanguage();
  // State
  const [formData, setFormData] = useState<PingFormData>({
    host: 'google.com',
    count: 10,
    timeout: 1000,
    interval: 1000,
  });
  const [results, setResults] = useState<PingResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentSequence, setCurrentSequence] = useState(0);
  const [stats, setStats] = useState({
    sent: 0,
    received: 0,
    lost: 0,
    minTime: 0,
    maxTime: 0,
    avgTime: 0,
  });

  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  // Handle form changes
  const handleInputChange = (field: keyof PingFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'host' 
      ? event.target.value 
      : parseInt(event.target.value, 10);
    
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Start ping operation - real-time streaming
  const startPing = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setResults([]);
    setCurrentSequence(0);
    setProgress(0);
    setStats({ sent: 0, received: 0, lost: 0, minTime: 0, maxTime: 0, avgTime: 0 });
    
    const start = new Date();
    setStartTime(start);
    startTimeRef.current = start;
    setEstimatedTime(formData.count * formData.interval);

    let sequence = 0;

    // Clear previous listeners
    window.electronAPI.removeAllListeners('ping:reply');
    window.electronAPI.removeAllListeners('ping:done');

    // Listen for real-time ping replies
    const handleReply = (pingData: any) => {
      sequence++;
      const result: PingResult = {
        id: Date.now() + sequence,
        sequence,
        timestamp: new Date(),
        host: pingData.host || formData.host,
        bytes: pingData.bytes || 32,
        time: pingData.time || 0,
        ttl: pingData.ttl || 0,
        success: pingData.alive,
        error: pingData.error,
      };

      setResults(prev => [...prev, result]);
      setCurrentSequence(sequence);
      setProgress((sequence / formData.count) * 100);

      setStats(prev => {
        const newSent = prev.sent + 1;
        const newReceived = result.success ? prev.received + 1 : prev.received;
        let newMin = prev.minTime, newMax = prev.maxTime, newAvg = prev.avgTime;
        if (result.success && result.time > 0) {
          if (prev.minTime === 0 || result.time < prev.minTime) newMin = result.time;
          if (result.time > prev.maxTime) newMax = result.time;
          newAvg = ((prev.avgTime * (newReceived - 1)) + result.time) / newReceived;
        }
        return { sent: newSent, received: newReceived, lost: newSent - newReceived, minTime: newMin, maxTime: newMax, avgTime: newAvg };
      });
    };

    const handleDone = () => {
      setIsRunning(false);
    };

    window.electronAPI.on('ping:reply', handleReply);
    window.electronAPI.on('ping:done', handleDone);

    try {
      await window.electronAPI.pingStream(formData.host, formData.count, formData.timeout);
    } catch (error) {
      console.error('Ping error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  // Stop ping operation
  const stopPing = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  };

  // Clear results
  const clearResults = () => {
    setResults([]);
    setStats({
      sent: 0,
      received: 0,
      lost: 0,
      minTime: 0,
      maxTime: 0,
      avgTime: 0,
    });
  };

  // Format time for display
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // Calculate elapsed time
  const getElapsedTime = () => {
    if (!startTime) return '0s';
    const elapsed = new Date().getTime() - startTime.getTime();
    return formatTime(elapsed);
  };

  // Calculate remaining time
  const getRemainingTime = () => {
    if (!isRunning || estimatedTime === 0) return '0s';
    const elapsed = new Date().getTime() - (startTimeRef.current?.getTime() || 0);
    const remaining = Math.max(0, estimatedTime - elapsed);
    return formatTime(remaining);
  };

  // Prepare chart data - include all points
  const chartData = results.map(result => ({
    sequence: result.sequence,
    time: result.time,
    success: result.success,
    name: `Ping ${result.sequence}`,
    ip: result.host,
  }));

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <Box>
      {/* Control Section */}
      <ControlSection background="paper" bordered>
        <CardTitle>{t('pingConfiguration')}</CardTitle>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('pingDescription')}
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Input
              label={t('hostnameOrIP')}
              placeholder="e.g., google.com or 8.8.8.8"
              value={formData.host}
              onChange={handleInputChange('host')}
              disabled={isRunning}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Input
              label={t('count')}
              type="number"
              value={formData.count}
              onChange={handleInputChange('count')}
              disabled={isRunning}
              inputProps={{ min: 1, max: 100 }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Input
              label={t('timeout')}
              type="number"
              value={formData.timeout}
              onChange={handleInputChange('timeout')}
              disabled={isRunning}
              inputProps={{ min: 100, max: 10000 }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Input
              label={t('interval')}
              type="number"
              value={formData.interval}
              onChange={handleInputChange('interval')}
              disabled={isRunning}
              inputProps={{ min: 100, max: 10000 }}
              fullWidth
            />
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Layout direction="row" justify="space-between" align="center">
          <Layout direction="row" gap={2}>
            <Button
              variant="contained"
              color="primary"
              startIcon={isRunning ? <StopIcon /> : <PlayArrowIcon />}
              onClick={isRunning ? stopPing : startPing}
              disabled={!formData.host.trim()}
            >
              {isRunning ? t('stopPing') : t('startPing')}
            </Button>
            
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<ClearIcon />}
              onClick={clearResults}
              disabled={results.length === 0 || isRunning}
            >
              {t('clearResults')}
            </Button>
          </Layout>
          
          <Layout direction="row" gap={2}>
            <Button
              variant="text"
              color="info"
              startIcon={<DownloadIcon />}
              disabled={results.length === 0}
            >
              {t('exportCSV')}
            </Button>
          </Layout>
        </Layout>
        
        {/* Progress Indicator */}
        {isRunning && (
          <ProgressContainer>
            <ProgressInfo>
              <Typography variant="body2" color="text.secondary">
                {t('progress')}: {currentSequence}/{formData.count} ({progress.toFixed(1)}%)
              </Typography>
              <Layout direction="row" gap={2} align="center">
                <Tooltip title={t('elapsedTime')}>
                  <Chip
                    icon={<ScheduleIcon />}
                    label={getElapsedTime()}
                    size="small"
                    variant="outlined"
                  />
                </Tooltip>
                <Tooltip title={t('estimatedTimeRemaining')}>
                  <Chip
                    icon={<RefreshIcon />}
                    label={getRemainingTime()}
                    size="small"
                    variant="outlined"
                  />
                </Tooltip>
              </Layout>
            </ProgressInfo>
            <LinearProgress 
              variant="determinate" 
              value={progress}
              sx={{
                height: '8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: '4px',
                },
              }}
            />
          </ProgressContainer>
        )}
      </ControlSection>

      {/* Statistics Section */}
      {results.length > 0 && (
        <Section background="paper" bordered>
          <CardTitle>{t('pingStatistics')}</CardTitle>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Card compact>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {t('packets')}
                </Typography>
                <Layout direction="row" justify="space-between" align="center">
                  <Typography variant="body2">{t('sent')}:</Typography>
                  <Typography variant="h6">{stats.sent}</Typography>
                </Layout>
                <Layout direction="row" justify="space-between" align="center">
                  <Typography variant="body2">{t('received')}:</Typography>
                  <Typography variant="h6" color="success.main">{stats.received}</Typography>
                </Layout>
                <Layout direction="row" justify="space-between" align="center">
                  <Typography variant="body2">{t('lost')}:</Typography>
                  <Typography variant="h6" color="error.main">{stats.lost}</Typography>
                </Layout>
                <Layout direction="row" justify="space-between" align="center">
                  <Typography variant="body2">{t('loss')}:</Typography>
                  <Typography variant="h6" color={stats.lost > 0 ? 'error.main' : 'success.main'}>
                    {stats.sent > 0 ? ((stats.lost / stats.sent) * 100).toFixed(1) : 0}%
                  </Typography>
                </Layout>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card compact>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {t('responseTimes')}
                </Typography>
                <Layout direction="row" justify="space-between" align="center">
                  <Typography variant="body2">{t('min')}:</Typography>
                  <Typography variant="h6">{stats.minTime}ms</Typography>
                </Layout>
                <Layout direction="row" justify="space-between" align="center">
                  <Typography variant="body2">{t('max')}:</Typography>
                  <Typography variant="h6">{stats.maxTime}ms</Typography>
                </Layout>
                <Layout direction="row" justify="space-between" align="center">
                  <Typography variant="body2">{t('avg')}:</Typography>
                  <Typography variant="h6">{stats.avgTime.toFixed(1)}ms</Typography>
                </Layout>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card compact>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {t('summary')}
                </Typography>
                <Typography variant="body2" paragraph>
                  {stats.lost === 0 ? (
                    <>{t('allPacketsReceived')}</>
                  ) : stats.lost < stats.sent * 0.1 ? (
                    <>{t('minorPacketLoss')}</>
                  ) : (
                    <>{t('significantPacketLoss')}</>
                  )}
                </Typography>
                <Layout direction="row" gap={1}>
                  <SuccessChip 
                    icon={<CheckCircleIcon />}
                    label={`${stats.received} ${t('successful')}`}
                    size="small"
                  />
                  <ErrorChip 
                    icon={<ErrorIcon />}
                    label={`${stats.lost} ${t('failed')}`}
                    size="small"
                  />
                </Layout>
              </Card>
            </Grid>
          </Grid>
        </Section>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <ResultsSection background="paper" bordered>
          <Layout direction="row" justify="space-between" align="center" marginBottom={2}>
            <CardTitle>{t('pingResults')} ({results.length} {t('packets')})</CardTitle>
            <Typography variant="body2" color="text.secondary">
              {t('lastUpdated')}: {results[results.length - 1]?.timestamp.toLocaleTimeString()}
            </Typography>
          </Layout>
          
          <StyledTableContainer component={Paper}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>{t('timestamp')}</TableCell>
                  <TableCell>{t('host')}</TableCell>
                  <TableCell>{t('bytes')}</TableCell>
                  <TableCell>{t('time')} (ms)</TableCell>
                  <TableCell>{t('ttl')}</TableCell>
                  <TableCell>{t('status')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((result) => (
                  <StyledTableRow key={result.id}>
                    <TableCell>{result.sequence}</TableCell>
                    <TableCell>
                      {result.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        second: '2-digit',
                        fractionalSecondDigits: 3 
                      })}
                    </TableCell>
                    <TableCell>{result.host}</TableCell>
                    <TableCell>{result.bytes}</TableCell>
                    <TableCell>
                      {result.success ? (
                        <Typography color="success.main">{result.time}ms</Typography>
                      ) : (
                        <Typography color="error.main">Timeout</Typography>
                      )}
                    </TableCell>
                    <TableCell>{result.success ? result.ttl : '-'}</TableCell>
                    <TableCell>
                      {result.success ? (
                        <SuccessChip label={t('success')} size="small" />
                      ) : (
                        <ErrorChip label={t('failed')} size="small" />
                      )}
                    </TableCell>
                  </StyledTableRow>
                ))}
              </TableBody>
            </Table>
          </StyledTableContainer>
        </ResultsSection>
      )}

      {/* Response Time Graph */}
      {results.length > 0 && (
        <Section background="paper" bordered>
          <CardTitle>{t('responseTimeVisualization')}</CardTitle>
          <Typography variant="body2" color="text.secondary" paragraph>
            {t('responseTimeGraph')}
          </Typography>
          
          <Box sx={{ mt: 3 }}>
            <SimpleChart
              data={chartData}
              height={300}
              title={t('responseTimes')}
            />
          </Box>
        </Section>
      )}
    </Box>
  );
};

export default PingTool;