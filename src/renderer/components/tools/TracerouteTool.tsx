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
  MenuItem,
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
  Router as RouterIcon,
  NetworkCheck as NetworkCheckIcon,
  Timeline as TimelineIcon,
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

const PathVisualizationContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  padding: theme.spacing(3),
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  minHeight: '200px',
  overflow: 'hidden',
}));

const PathNode = styled(Box)<{ success: boolean; active: boolean }>(({ theme, success, active }) => ({
  position: 'absolute',
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  backgroundColor: success 
    ? active 
      ? 'rgba(0, 255, 0, 0.2)' 
      : 'rgba(0, 255, 0, 0.1)'
    : active
      ? 'rgba(255, 0, 0, 0.2)'
      : 'rgba(255, 0, 0, 0.1)',
  border: `2px solid ${success ? theme.palette.success.main : theme.palette.error.main}`,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.3s ease',
  zIndex: 2,
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: `0 0 12px ${success ? theme.palette.success.main : theme.palette.error.main}40`,
  },
}));

const PathLine = styled(Box)<{ success: boolean }>(({ theme, success }) => ({
  position: 'absolute',
  height: '4px',
  backgroundColor: success ? theme.palette.success.main : theme.palette.error.main,
  opacity: 0.6,
  zIndex: 1,
}));

const NodeIcon = styled(RouterIcon)<{ success: boolean }>(({ theme, success }) => ({
  color: success ? theme.palette.success.main : theme.palette.error.main,
  fontSize: '24px',
}));

const NodeLabel = styled(Typography)(({ theme }) => ({
  fontSize: '10px',
  color: theme.palette.text.secondary,
  marginTop: '2px',
  textAlign: 'center',
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

const NodeTime = styled(Typography)<{ success: boolean }>(({ theme, success }) => ({
  fontSize: '9px',
  color: success ? theme.palette.success.main : theme.palette.error.main,
  fontWeight: 'bold',
}));

// Types
interface TracerouteResult {
  id: number;
  hop: number;
  host: string;
  ip: string;
  times: number[]; // ms for each probe
  success: boolean;
  timestamp: Date;
  error?: string;
}

interface TracerouteFormData {
  host: string;
  maxHops: number;
  timeout: number;
  protocol: 'icmp' | 'udp' | 'tcp';
}

interface PathStats {
  totalHops: number;
  successfulHops: number;
  failedHops: number;
  minTime: number;
  maxTime: number;
  avgTime: number;
  totalTime: number;
}

const TracerouteTool: React.FC = () => {
  const { t } = useLanguage();
  // State
  const [formData, setFormData] = useState<TracerouteFormData>({
    host: 'google.com',
    maxHops: 30,
    timeout: 1000,
    protocol: 'icmp',
  });
  const [results, setResults] = useState<TracerouteResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentHop, setCurrentHop] = useState(0);
  const [stats, setStats] = useState<PathStats>({
    totalHops: 0,
    successfulHops: 0,
    failedHops: 0,
    minTime: 0,
    maxTime: 0,
    avgTime: 0,
    totalTime: 0,
  });

  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  // Handle form changes
  const handleInputChange = (field: keyof TracerouteFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = field === 'host' || field === 'protocol'
      ? event.target.value
      : parseInt(event.target.value, 10);
    
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Start traceroute operation - real-time streaming
  const startTraceroute = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setResults([]);
    setCurrentHop(0);
    setProgress(0);
    setStats({ totalHops: 0, successfulHops: 0, failedHops: 0, minTime: 0, maxTime: 0, avgTime: 0, totalTime: 0 });
    
    const start = new Date();
    setStartTime(start);
    startTimeRef.current = start;
    setEstimatedTime(formData.maxHops * formData.timeout);

    // Clear any previous listeners to prevent duplicates
    window.electronAPI.removeAllListeners('traceroute:hop');
    window.electronAPI.removeAllListeners('traceroute:done');

    // Listen for real-time hop events
    const handleHop = (hopData: any) => {
      const result: TracerouteResult = {
        id: Date.now() + hopData.hop,
        hop: hopData.hop,
        host: hopData.hostname || hopData.ip || '***',
        ip: hopData.ip || '***',
        times: [hopData.time1, hopData.time2, hopData.time3].filter((t: number) => t > 0),
        success: hopData.ip !== '' && hopData.time1 > 0,
        timestamp: new Date(),
        error: hopData.ip === '' ? 'Request timed out' : undefined,
      };

      setResults(prev => {
        const newResults = [...prev, result];
        setCurrentHop(newResults.length);
        setProgress((newResults.length / formData.maxHops) * 100);
        return newResults;
      });

      setStats(prev => {
        const newTotal = prev.totalHops + 1;
        const newSuccess = result.success ? prev.successfulHops + 1 : prev.successfulHops;
        let newMin = prev.minTime, newMax = prev.maxTime, newTotal2 = prev.totalTime;
        if (result.success && result.times.length > 0) {
          const avg = result.times.reduce((a, b) => a + b, 0) / result.times.length;
          newTotal2 += avg;
          if (prev.minTime === 0 || avg < prev.minTime) newMin = avg;
          if (avg > prev.maxTime) newMax = avg;
        }
        return {
          totalHops: newTotal,
          successfulHops: newSuccess,
          failedHops: newTotal - newSuccess,
          minTime: newMin,
          maxTime: newMax,
          avgTime: newSuccess > 0 ? newTotal2 / newSuccess : 0,
          totalTime: newTotal2,
        };
      });
    };

    const handleDone = () => {
      setIsRunning(false);
    };

    // Register listeners
    window.electronAPI.on('traceroute:hop', handleHop);
    window.electronAPI.on('traceroute:done', handleDone);

    try {
      await window.electronAPI.tracerouteStream(formData.host, formData.maxHops, formData.protocol);
    } catch (error) {
      console.error('Traceroute error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  // Stop traceroute operation
  const stopTraceroute = () => {
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
      totalHops: 0,
      successfulHops: 0,
      failedHops: 0,
      minTime: 0,
      maxTime: 0,
      avgTime: 0,
      totalTime: 0,
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

  // Prepare chart data - include ALL points, failures at y=0
  const chartData = results.map(result => ({
    sequence: result.hop,
    time: result.success && result.times.length > 0
      ? result.times.reduce((a, b) => a + b, 0) / result.times.length
      : 0,
    success: result.success,
    name: `Hop ${result.hop}`,
    ip: result.ip || result.host,
  }));

  // Export path data
  const exportPathData = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      target: formData.host,
      parameters: formData,
      results: results.map(result => ({
        hop: result.hop,
        host: result.host,
        ip: result.ip,
        avgTime: result.success && result.times.length > 0 
          ? result.times.reduce((a, b) => a + b, 0) / result.times.length 
          : null,
        times: result.times,
        success: result.success,
        timestamp: result.timestamp.toISOString(),
      })),
      statistics: stats,
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `traceroute_${formData.host}_${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Render network path visualization - grid layout, 10 per row
  const renderPathVisualization = () => {
    if (results.length === 0) return null;

    const NODES_PER_ROW = 10;
    const rows: typeof results[] = [];
    for (let i = 0; i < results.length; i += NODES_PER_ROW) {
      rows.push(results.slice(i, i + NODES_PER_ROW));
    }

    return (
      <PathVisualizationContainer>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NetworkCheckIcon /> {t('networkPathVisualization')} ({results.length} {t('hop')}s)
        </Typography>

        {rows.map((rowNodes, rowIndex) => (
          <Box key={rowIndex} sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'nowrap' }}>
            {rowNodes.map((result, nodeIndex) => {
              const globalIndex = rowIndex * NODES_PER_ROW + nodeIndex;
              const avgTime = result.success && result.times.length > 0
                ? result.times.reduce((a, b) => a + b, 0) / result.times.length
                : 0;
              const isLast = nodeIndex === rowNodes.length - 1;

              return (
                <Box key={result.id} sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {/* Node */}
                  <Box sx={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: result.success
                      ? globalIndex === currentHop - 1 ? 'rgba(0,255,0,0.25)' : 'rgba(0,255,0,0.1)'
                      : globalIndex === currentHop - 1 ? 'rgba(255,0,0,0.25)' : 'rgba(255,0,0,0.1)',
                    border: `2px solid ${result.success ? '#00ff00' : '#ff0000'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'default',
                    transition: 'all 0.2s',
                    '&:hover': { transform: 'scale(1.08)', boxShadow: `0 0 10px ${result.success ? '#00ff0040' : '#ff000040'}` },
                  }}>
                    <NodeIcon success={result.success} />
                    <NodeLabel sx={{ maxWidth: '56px', px: '2px' }}>
                      {result.host === '* * *' ? '***' : result.host}
                    </NodeLabel>
                    <NodeTime success={result.success}>
                      {result.success ? `${Math.round(avgTime)}ms` : 'X'}
                    </NodeTime>
                  </Box>

                  {/* Connector line (not after last in row) */}
                  {!isLast && (
                    <Box sx={{
                      width: '24px',
                      height: '3px',
                      backgroundColor: result.success && rowNodes[nodeIndex + 1]?.success
                        ? '#00ff00' : '#ff0000',
                      opacity: 0.6,
                      flexShrink: 0,
                    }} />
                  )}
                </Box>
              );
            })}
          </Box>
        ))}

        <Typography variant="caption" color="text.secondary">
          {results.length} {t('hop')}s total
        </Typography>
      </PathVisualizationContainer>
    );
  };

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
        <CardTitle>{t('tracerouteConfiguration')}</CardTitle>
        <Typography variant="body2" color="text.secondary" paragraph>
          {t('tracerouteDescription')}
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
              label={t('maxHops')}
              type="number"
              value={formData.maxHops}
              onChange={handleInputChange('maxHops')}
              disabled={isRunning}
              inputProps={{ min: 1, max: 64 }}
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
              label={t('protocol')}
              select
              value={formData.protocol}
              onChange={handleInputChange('protocol')}
              disabled={isRunning}
              fullWidth
            >
              <MenuItem value="icmp">ICMP</MenuItem>
              <MenuItem value="udp">UDP</MenuItem>
              <MenuItem value="tcp">TCP</MenuItem>
            </Input>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Layout direction="row" justify="space-between" align="center">
          <Layout direction="row" gap={2}>
            <Button
              variant="contained"
              color="primary"
              startIcon={isRunning ? <StopIcon /> : <PlayArrowIcon />}
              onClick={isRunning ? stopTraceroute : startTraceroute}
              disabled={!formData.host.trim()}
            >
              {isRunning ? t('stopTraceroute') : t('startTraceroute')}
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
              variant="contained"
              color="info"
              startIcon={<DownloadIcon />}
              onClick={exportPathData}
              disabled={results.length === 0}
            >
              {t('exportPathData')}
            </Button>
          </Layout>
        </Layout>
        
        {/* Progress Indicator */}
        {isRunning && (
          <ProgressContainer>
            <ProgressInfo>
              <Typography variant="body2" color="text.secondary">
                {t('progress')}: {currentHop}/{formData.maxHops} ({progress.toFixed(1)}%)
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
          <CardTitle>{t('tracerouteStatistics')}</CardTitle>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Card compact>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {t('pathSummary')}
                </Typography>
                <Layout direction="row" justify="space-between" align="center">
                  <Typography variant="body2">{t('totalHops')}:</Typography>
                  <Typography variant="h6">{stats.totalHops}</Typography>
                </Layout>
                <Layout direction="row" justify="space-between" align="center">
                  <Typography variant="body2">{t('successful')}:</Typography>
                  <Typography variant="h6" color="success.main">{stats.successfulHops}</Typography>
                </Layout>
                <Layout direction="row" justify="space-between" align="center">
                  <Typography variant="body2">{t('failed')}:</Typography>
                  <Typography variant="h6" color="error.main">{stats.failedHops}</Typography>
                </Layout>
                <Layout direction="row" justify="space-between" align="center">
                  <Typography variant="body2">{t('successRate')}:</Typography>
                  <Typography variant="h6" color={stats.successfulHops / stats.totalHops > 0.8 ? 'success.main' : 'warning.main'}>
                    {stats.totalHops > 0 ? ((stats.successfulHops / stats.totalHops) * 100).toFixed(1) : 0}%
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
                  <Typography variant="h6">{stats.minTime.toFixed(1)}ms</Typography>
                </Layout>
                <Layout direction="row" justify="space-between" align="center">
                  <Typography variant="body2">{t('max')}:</Typography>
                  <Typography variant="h6">{stats.maxTime.toFixed(1)}ms</Typography>
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
                  {t('pathAnalysis')}
                </Typography>
                <Typography variant="body2" paragraph>
                  {stats.failedHops === 0 ? (
                    <>{t('allHopsResponded')}</>
                  ) : stats.failedHops < stats.totalHops * 0.2 ? (
                    <>{t('minorHopFailures')}</>
                  ) : (
                    <>{t('significantHopFailures')}</>
                  )}
                </Typography>
                <Layout direction="row" gap={1}>
                  <SuccessChip 
                    icon={<CheckCircleIcon />}
                    label={`${stats.successfulHops} ${t('successful')}`}
                    size="small"
                  />
                  <ErrorChip 
                    icon={<ErrorIcon />}
                    label={`${stats.failedHops} ${t('failed')}`}
                    size="small"
                  />
                </Layout>
              </Card>
            </Grid>
          </Grid>
        </Section>
      )}

      {/* Network Path Visualization */}
      {results.length > 0 && (
        <Section background="paper" bordered>
          {renderPathVisualization()}
        </Section>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <ResultsSection background="paper" bordered>
          <Layout direction="row" justify="space-between" align="center" marginBottom={2}>
            <CardTitle>{t('tracerouteResults')} ({results.length} {t('hop')}s)</CardTitle>
            <Typography variant="body2" color="text.secondary">
              {t('lastUpdated')}: {results[results.length - 1]?.timestamp.toLocaleTimeString()}
            </Typography>
          </Layout>
          
          <StyledTableContainer component={Paper}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>{t('hop')}</TableCell>
                  <TableCell>{t('hostname')}</TableCell>
                  <TableCell>{t('ipAddress')}</TableCell>
                  <TableCell>{t('times')}</TableCell>
                  <TableCell>{t('avgTime')}</TableCell>
                  <TableCell>{t('status')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((result) => {
                  const avgTime = result.success && result.times.length > 0 
                    ? result.times.reduce((a, b) => a + b, 0) / result.times.length 
                    : 0;
                  
                  return (
                    <StyledTableRow key={result.id}>
                      <TableCell>{result.hop}</TableCell>
                      <TableCell>
                        <Tooltip title={result.host}>
                          <Typography variant="body2" noWrap sx={{ maxWidth: '200px' }}>
                            {result.host}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{result.ip}</TableCell>
                      <TableCell>
                        {result.success ? (
                          <Typography variant="body2" color="success.main">
                            {result.times.map(t => `${t}ms`).join(', ')}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="error.main">Timeout</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {result.success ? (
                          <Typography color="success.main">{avgTime.toFixed(1)}ms</Typography>
                        ) : (
                          <Typography color="error.main">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {result.success ? (
                          <SuccessChip label={t('success')} size="small" />
                        ) : (
                          <ErrorChip label={t('failed')} size="small" />
                        )}
                      </TableCell>
                    </StyledTableRow>
                  );
                })}
              </TableBody>
            </Table>
          </StyledTableContainer>
        </ResultsSection>
      )}

      {/* Response Time Graph */}
      {results.length > 0 && (
        <Section background="paper" bordered>
          <CardTitle>{t('hopResponseTimeVisualization')}</CardTitle>
          <Typography variant="body2" color="text.secondary" paragraph>
            {t('hopResponseTimeGraph')}
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

export default TracerouteTool;