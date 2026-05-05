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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Security as SecurityIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
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

const OpenChip = styled(Chip)(({ theme }) => ({
  backgroundColor: 'rgba(0, 255, 0, 0.1)',
  color: theme.palette.success.main,
  border: `1px solid ${theme.palette.success.main}`,
}));

const ClosedChip = styled(Chip)(({ theme }) => ({
  backgroundColor: 'rgba(255, 0, 0, 0.1)',
  color: theme.palette.error.main,
  border: `1px solid ${theme.palette.error.main}`,
}));

const FilteredChip = styled(Chip)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 0, 0.1)',
  color: theme.palette.warning.main,
  border: `1px solid ${theme.palette.warning.main}`,
}));

// Types
interface PortScanResult {
  id: number;
  port: number;
  state: 'open' | 'closed' | 'filtered';
  service: string;
  protocol: 'tcp' | 'udp';
  banner?: string;
  timestamp: Date;
  responseTime?: number;
}

interface PortScanFormData {
  host: string;
  startPort: number;
  endPort: number;
  scanTechnique: 'tcp-syn' | 'tcp-connect' | 'udp' | 'stealth' | 'aggressive';
  timeout: number;
  threads: number;
  serviceDetection: boolean;
  bannerGrab: boolean;
}

interface ScanStats {
  totalPorts: number;
  scannedPorts: number;
  openPorts: number;
  closedPorts: number;
  filteredPorts: number;
  minResponseTime: number;
  maxResponseTime: number;
  avgResponseTime: number;
}

const PortScannerTool: React.FC = () => {
  const { t } = useLanguage();
  
  // State
  const [formData, setFormData] = useState<PortScanFormData>({
    host: 'localhost',
    startPort: 1,
    endPort: 100,
    scanTechnique: 'tcp-connect',
    timeout: 1000,
    threads: 10,
    serviceDetection: true,
    bannerGrab: false,
  });
  const [results, setResults] = useState<PortScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [stats, setStats] = useState<ScanStats>({
    totalPorts: 0,
    scannedPorts: 0,
    openPorts: 0,
    closedPorts: 0,
    filteredPorts: 0,
    minResponseTime: 0,
    maxResponseTime: 0,
    avgResponseTime: 0,
  });
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);
  const [securityConfirmed, setSecurityConfirmed] = useState(false);
  const [sortBy, setSortBy] = useState<'port' | 'state' | 'service'>('port');

  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const isScanningRef = useRef(false);

  // Common services database
  const commonServices: Record<number, { name: string; protocol: 'tcp' | 'udp' }> = {
    20: { name: 'FTP Data', protocol: 'tcp' },
    21: { name: 'FTP Control', protocol: 'tcp' },
    22: { name: 'SSH', protocol: 'tcp' },
    23: { name: 'Telnet', protocol: 'tcp' },
    25: { name: 'SMTP', protocol: 'tcp' },
    53: { name: 'DNS', protocol: 'tcp' },
    80: { name: 'HTTP', protocol: 'tcp' },
    110: { name: 'POP3', protocol: 'tcp' },
    143: { name: 'IMAP', protocol: 'tcp' },
    443: { name: 'HTTPS', protocol: 'tcp' },
    3306: { name: 'MySQL', protocol: 'tcp' },
    3389: { name: 'RDP', protocol: 'tcp' },
    5432: { name: 'PostgreSQL', protocol: 'tcp' },
    6379: { name: 'Redis', protocol: 'tcp' },
    8080: { name: 'HTTP Proxy', protocol: 'tcp' },
    69: { name: 'TFTP', protocol: 'udp' },
    123: { name: 'NTP', protocol: 'udp' },
    161: { name: 'SNMP', protocol: 'udp' },
    162: { name: 'SNMP Trap', protocol: 'udp' },
    500: { name: 'ISAKMP', protocol: 'udp' },
    514: { name: 'Syslog', protocol: 'udp' },
  };

  // Handle form changes
  const handleInputChange = (field: keyof PortScanFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = field === 'host' || field === 'scanTechnique'
      ? event.target.value
      : field === 'serviceDetection' || field === 'bannerGrab'
      ? event.target.checked
      : parseInt(event.target.value, 10);
    
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Check if scan requires security confirmation
  const requiresSecurityConfirmation = () => {
    return formData.scanTechnique === 'aggressive' || 
           formData.scanTechnique === 'stealth' ||
           (formData.endPort - formData.startPort) > 1000;
  };

  // Get security warning message
  const getSecurityWarning = () => {
    if (formData.scanTechnique === 'aggressive') {
      return t('aggressiveScanWarning');
    } else if (formData.scanTechnique === 'stealth') {
      return t('stealthScanWarning');
    } else if ((formData.endPort - formData.startPort) > 1000) {
      return t('largeRangeScanWarning');
    }
    return t('standardScanOperation');
  };

  // Simulate port scan result
  const simulatePortScan = (port: number): PortScanResult => {
    // Determine protocol based on port and technique
    const protocol = formData.scanTechnique === 'udp' ? 'udp' : 'tcp';
    
    // Simulate port state (some ports open, some closed, some filtered)
    let state: 'open' | 'closed' | 'filtered';
    if (port <= 1024) {
      // Well-known ports have higher chance of being open
      state = Math.random() > 0.7 ? 'open' : Math.random() > 0.5 ? 'filtered' : 'closed';
    } else {
      // Higher ports more likely to be closed
      state = Math.random() > 0.9 ? 'open' : Math.random() > 0.7 ? 'filtered' : 'closed';
    }

    // Get service name
    const serviceInfo = commonServices[port];
    const service = serviceInfo ? serviceInfo.name : 'Unknown';
    
    // Simulate response time
    const responseTime = state === 'open' 
      ? Math.floor(Math.random() * 100) + 10 
      : state === 'filtered' 
        ? Math.floor(Math.random() * 500) + 100
        : Math.floor(Math.random() * 50) + 1;

    // Simulate banner for some open ports
    const banner = formData.bannerGrab && state === 'open' && Math.random() > 0.7
      ? `Service: ${service} (Simulated Banner)`
      : undefined;

    return {
      id: Date.now() + port,
      port,
      state,
      service,
      protocol,
      banner,
      timestamp: new Date(),
      responseTime,
    };
  };

  // Start port scan with real API
  const startPortScan = async () => {
    if (isScanning) return;
    
    // Check if security confirmation is needed
    if (requiresSecurityConfirmation() && !securityConfirmed) {
      setShowSecurityWarning(true);
      return;
    }
    
    setIsScanning(true);
    isScanningRef.current = true;
    setResults([]);
    setProgress(0);
    setStats({
      totalPorts: 0,
      scannedPorts: 0,
      openPorts: 0,
      closedPorts: 0,
      filteredPorts: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      avgResponseTime: 0,
    });
    
    const start = new Date();
    setStartTime(start);
    startTimeRef.current = start;
    
    // Calculate total ports and estimated time
    const totalPorts = formData.endPort - formData.startPort + 1;
    const estimated = totalPorts * (formData.timeout / formData.threads);
    setEstimatedTime(estimated);
    
    // Scan ports using real API
    const scanPort = async (port: number): Promise<PortScanResult> => {
      const startTime = Date.now();
      const isUDP = formData.scanTechnique === 'udp';
      const protocol: 'tcp' | 'udp' = isUDP ? 'udp' : 'tcp';
      
      try {
        const response = await window.electronAPI.scanPort(
          formData.host,
          port,
          formData.timeout,
          protocol
        );
        
        const responseTime = Date.now() - startTime;
        
        // For UDP: use state from response, for TCP: open/closed based on data
        let state: 'open' | 'closed' | 'filtered';
        if (isUDP) {
          state = response.state || (response.data ? 'open' : 'closed');
        } else {
          state = response.success && response.data ? 'open' : 'closed';
        }
        
        // Get service name
        const serviceInfo = commonServices[port];
        const service = serviceInfo ? serviceInfo.name : 'Unknown';
        
        return {
          id: Date.now() + port,
          port,
          state,
          service,
          protocol,
          timestamp: new Date(),
          responseTime,
        };
      } catch (error) {
        return {
          id: Date.now() + port,
          port,
          state: 'filtered',
          service: 'Unknown',
          protocol,
          timestamp: new Date(),
          responseTime: formData.timeout,
        };
      }
    };
    
    // Scan ports in batches (threads)
    let currentPort = formData.startPort;
    let scannedCount = 0;
    
    while (currentPort <= formData.endPort && isScanningRef.current) {
      const batch: Promise<PortScanResult>[] = [];
      
      // Create batch of scans
      for (let i = 0; i < formData.threads && currentPort <= formData.endPort; i++) {
        batch.push(scanPort(currentPort));
        currentPort++;
      }
      
      // Wait for batch to complete
      const batchResults = await Promise.all(batch);
      
      // Update results and stats
      for (const result of batchResults) {
        setResults(prev => [...prev, result]);
        scannedCount++;
        
        setStats(prev => {
          const newScannedPorts = prev.scannedPorts + 1;
          const newOpenPorts = result.state === 'open' ? prev.openPorts + 1 : prev.openPorts;
          const newClosedPorts = result.state === 'closed' ? prev.closedPorts + 1 : prev.closedPorts;
          const newFilteredPorts = result.state === 'filtered' ? prev.filteredPorts + 1 : prev.filteredPorts;
          
          let newMinTime = prev.minResponseTime;
          let newMaxTime = prev.maxResponseTime;
          let newTotalTime = prev.scannedPorts > 0 ? prev.avgResponseTime * prev.scannedPorts : 0;
          
          if (result.responseTime) {
            newTotalTime += result.responseTime;
            if (newMinTime === 0 || result.responseTime < newMinTime) {
              newMinTime = result.responseTime;
            }
            if (result.responseTime > newMaxTime) {
              newMaxTime = result.responseTime;
            }
          }
          
          const newAvgTime = newScannedPorts > 0 ? newTotalTime / newScannedPorts : 0;
          
          return {
            totalPorts,
            scannedPorts: newScannedPorts,
            openPorts: newOpenPorts,
            closedPorts: newClosedPorts,
            filteredPorts: newFilteredPorts,
            minResponseTime: newMinTime,
            maxResponseTime: newMaxTime,
            avgResponseTime: newAvgTime,
          };
        });
      }
      
      // Update progress
      const currentProgress = (scannedCount / totalPorts) * 100;
      setProgress(currentProgress);
    }
    
    isScanningRef.current = false;
    setIsScanning(false);
  };

  // Stop port scan
  const stopPortScan = () => {
    isScanningRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsScanning(false);
  };

  // Clear results
  const clearResults = () => {
    setResults([]);
    setStats({
      totalPorts: 0,
      scannedPorts: 0,
      openPorts: 0,
      closedPorts: 0,
      filteredPorts: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      avgResponseTime: 0,
    });
    setSecurityConfirmed(false);
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
    if (!isScanning || estimatedTime === 0) return '0s';
    const elapsed = new Date().getTime() - (startTimeRef.current?.getTime() || 0);
    const remaining = Math.max(0, estimatedTime - elapsed);
    return formatTime(remaining);
  };

  // Export results
  const exportResults = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      target: formData.host,
      parameters: formData,
      results: results.map(result => ({
        port: result.port,
        state: result.state,
        service: result.service,
        protocol: result.protocol,
        banner: result.banner,
        responseTime: result.responseTime,
        timestamp: result.timestamp.toISOString(),
      })),
      statistics: stats,
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `portscan_${formData.host}_${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Sort results - open ports always first when sorting by state
  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === 'port') return a.port - b.port;
    if (sortBy === 'state') {
      const order = { open: 0, filtered: 1, closed: 2 };
      return order[a.state] - order[b.state];
    }
    return a.service.localeCompare(b.service);
  });

  // Prepare chart data
  const chartData = results
    .filter(result => result.responseTime)
    .map(result => ({
      sequence: result.port,
      time: result.responseTime || 0,
      success: result.state === 'open',
      name: `Port ${result.port}`,
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
      {/* Security Warning Dialog */}
      <Dialog
        open={showSecurityWarning}
        onClose={() => setShowSecurityWarning(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <WarningIcon color="warning" />
            {t('securityWarning')}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {getSecurityWarning()}
          </Alert>
          <Typography variant="body2" paragraph>
            {t('scanningWithoutPermission')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('scanParameters')}:
          </Typography>
          <Typography variant="body2">
            • {t('host')}: {formData.host}
          </Typography>
          <Typography variant="body2">
            • {t('portRange')}: {formData.startPort} - {formData.endPort}
          </Typography>
          <Typography variant="body2">
            • {t('scanTechnique')}: {formData.scanTechnique}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSecurityWarning(false)} color="secondary">
            {t('cancel')}
          </Button>
          <Button
            onClick={() => {
              setSecurityConfirmed(true);
              setShowSecurityWarning(false);
              setTimeout(() => startPortScan(), 100);
            }}
            color="primary"
            variant="contained"
          >
            {t('understandAndProceed')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Control Section */}
      <ControlSection background="paper" bordered>
        <CardTitle>{t('portScannerConfiguration')}</CardTitle>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('scanTargetHosts')}
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Input
              label={t('hostnameOrIP')}
              placeholder="e.g., localhost or 192.168.1.1"
              value={formData.host}
              onChange={handleInputChange('host')}
              disabled={isScanning}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Input
              label={t('startPort')}
              type="number"
              value={formData.startPort}
              onChange={handleInputChange('startPort')}
              disabled={isScanning}
              inputProps={{ min: 1, max: 65535 }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Input
              label={t('endPort')}
              type="number"
              value={formData.endPort}
              onChange={handleInputChange('endPort')}
              disabled={isScanning}
              inputProps={{ min: 1, max: 65535 }}
              fullWidth
            />
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Input
              label={t('scanTechnique')}
              select
              value={formData.scanTechnique}
              onChange={handleInputChange('scanTechnique')}
              disabled={isScanning}
              fullWidth
            >
              <MenuItem value="tcp-connect">{t('tcpConnect')}</MenuItem>
              <MenuItem value="tcp-syn">TCP SYN (Stealth)</MenuItem>
              <MenuItem value="udp">UDP</MenuItem>
              <MenuItem value="stealth">Stealth (FIN/Xmas/Null)</MenuItem>
              <MenuItem value="aggressive">Aggressive (All Flags)</MenuItem>
            </Input>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box>
              <Typography variant="body2" gutterBottom>
                {t('timeoutMs')}: {formData.timeout}ms
              </Typography>
              <Slider
                value={formData.timeout}
                onChange={(_, value) => setFormData(prev => ({ ...prev, timeout: value as number }))}
                min={100}
                max={5000}
                step={100}
                disabled={isScanning}
                marks={[
                  { value: 100, label: '100ms' },
                  { value: 1000, label: '1s' },
                  { value: 2500, label: '2.5s' },
                  { value: 5000, label: '5s' },
                ]}
                sx={{ mt: 1 }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box>
              <Typography variant="body2" gutterBottom>
                {t('threads')}: {formData.threads}
              </Typography>
              <Slider
                value={formData.threads}
                onChange={(_, value) => setFormData(prev => ({ ...prev, threads: value as number }))}
                min={1}
                max={50}
                step={1}
                disabled={isScanning}
                marks={[
                  { value: 1, label: '1' },
                  { value: 10, label: '10' },
                  { value: 25, label: '25' },
                  { value: 50, label: '50' },
                ]}
                sx={{ mt: 1 }}
              />
            </Box>
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.serviceDetection}
                  onChange={handleInputChange('serviceDetection')}
                  disabled={isScanning}
                />
              }
              label={t('serviceDetection')}
            />
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              {t('attemptIdentifyServices')}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.bannerGrab}
                  onChange={handleInputChange('bannerGrab')}
                  disabled={isScanning}
                />
              }
              label={t('bannerGrabbing')}
            />
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              {t('attemptRetrieveBanners')}
            </Typography>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Layout direction="row" justify="space-between" align="center">
          <Layout direction="row" gap={2}>
            <Button
              variant="contained"
              color="primary"
              startIcon={isScanning ? <StopIcon /> : <PlayArrowIcon />}
              onClick={isScanning ? stopPortScan : startPortScan}
              disabled={!formData.host.trim() || formData.startPort > formData.endPort}
            >
              {isScanning ? t('stopScan') : t('startScan')}
            </Button>
            
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<ClearIcon />}
              onClick={clearResults}
              disabled={results.length === 0 || isScanning}
            >
              {t('clearResults')}
            </Button>
          </Layout>
          
          <Layout direction="row" gap={2}>
            <Button
              variant="contained"
              color="info"
              startIcon={<DownloadIcon />}
              onClick={exportResults}
              disabled={results.length === 0}
            >
              {t('exportResults')}
            </Button>
          </Layout>
        </Layout>
        
        {/* Progress Indicator */}
        {isScanning && (
          <ProgressContainer>
            <ProgressInfo>
              <Typography variant="body2" color="text.secondary">
                {t('progress')}: {stats.scannedPorts}/{stats.totalPorts} ({progress.toFixed(1)}%)
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
          <CardTitle>{t('pingStatistics').replace('Ping', 'Scan')}</CardTitle>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Card compact>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                  {t('status')}
                </Typography>
                <Layout direction="row" justify="space-between" align="center">
                  <Typography variant="body2">{t('count')}:</Typography>
                  <Typography variant="h6">{stats.totalPorts}</Typography>
                </Layout>
                <Layout direction="row" justify="space-between" align="center">
                  <Typography variant="body2">{t('progress')}:</Typography>
                  <Typography variant="h6">{stats.scannedPorts}</Typography>
                </Layout>
                <Layout direction="row" justify="space-between" align="center">
                  <Typography variant="body2" color="success.main">Open:</Typography>
                  <Typography variant="h6" color="success.main">{stats.openPorts}</Typography>
                </Layout>
                <Layout direction="row" justify="space-between" align="center">
                  <Typography variant="body2" color="error.main">Closed:</Typography>
                  <Typography variant="h6" color="error.main">{stats.closedPorts}</Typography>
                </Layout>
                <Layout direction="row" justify="space-between" align="center">
                  <Typography variant="body2" color="warning.main">Filtered:</Typography>
                  <Typography variant="h6" color="warning.main">{stats.filteredPorts}</Typography>
                </Layout>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card compact>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                  {t('responseTimes')}
                </Typography>
                <Layout direction="row" justify="space-between" align="center">
                  <Typography variant="body2">{t('min')}:</Typography>
                  <Typography variant="h6">{stats.minResponseTime.toFixed(1)}ms</Typography>
                </Layout>
                <Layout direction="row" justify="space-between" align="center">
                  <Typography variant="body2">{t('max')}:</Typography>
                  <Typography variant="h6">{stats.maxResponseTime.toFixed(1)}ms</Typography>
                </Layout>
                <Layout direction="row" justify="space-between" align="center">
                  <Typography variant="body2">{t('avg')}:</Typography>
                  <Typography variant="h6">{stats.avgResponseTime.toFixed(1)}ms</Typography>
                </Layout>
                <Layout direction="row" justify="space-between" align="center">
                  <Typography variant="body2">Open Rate:</Typography>
                  <Typography variant="h6" color={stats.openPorts / stats.scannedPorts > 0.1 ? 'success.main' : 'info.main'}>
                    {stats.scannedPorts > 0 ? ((stats.openPorts / stats.scannedPorts) * 100).toFixed(1) : 0}%
                  </Typography>
                </Layout>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card compact>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                  {t('pathAnalysis')}
                </Typography>
                <Typography variant="body2" paragraph>
                  {stats.openPorts === 0
                    ? 'Открытых портов не обнаружено. Цель хорошо защищена или недоступна.'
                    : stats.openPorts < 5
                    ? 'Обнаружено несколько открытых портов. Минимальная экспозиция сервисов.'
                    : stats.openPorts < 20
                    ? 'Умеренное количество открытых портов. Стандартная экспозиция сервисов.'
                    : 'Много открытых портов. Возможна избыточная экспозиция сервисов.'}
                </Typography>
                <Layout direction="row" gap={1} wrap="wrap">
                  <OpenChip icon={<CheckCircleIcon />} label={`${stats.openPorts} Open`} size="small" />
                  <ClosedChip icon={<ErrorIcon />} label={`${stats.closedPorts} Closed`} size="small" />
                  <FilteredChip icon={<FilterIcon />} label={`${stats.filteredPorts} Filtered`} size="small" />
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
            <CardTitle>{t('results')} ({results.length} ports)</CardTitle>
            <Layout direction="row" gap={2} align="center">
              <Typography variant="body2" color="text.secondary">
                {t('lastUpdated')}: {results[results.length - 1]?.timestamp.toLocaleTimeString()}
              </Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>{t('sortBy')}</InputLabel>
                <Select
                  value={sortBy}
                  label={t('sortBy')}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  disabled={isScanning}
                >
                  <MenuItem value="port">Port Number</MenuItem>
                  <MenuItem value="state">{t('status')}</MenuItem>
                  <MenuItem value="service">Service</MenuItem>
                </Select>
              </FormControl>
            </Layout>
          </Layout>
          
          <StyledTableContainer component={Paper}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Port</TableCell>
                  <TableCell>Protocol</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell>Response Time</TableCell>
                  <TableCell>Banner</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedResults.map((result) => (
                  <StyledTableRow key={result.id}>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {result.port}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color={result.protocol === 'tcp' ? 'info.main' : 'warning.main'}>
                        {result.protocol.toUpperCase()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {result.state === 'open' ? (
                        <OpenChip label="Open" size="small" />
                      ) : result.state === 'closed' ? (
                        <ClosedChip label="Closed" size="small" />
                      ) : (
                        <FilteredChip label="Filtered" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {result.service}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {result.responseTime ? (
                        <Typography variant="body2" color={result.responseTime < 100 ? 'success.main' : result.responseTime < 500 ? 'warning.main' : 'error.main'}>
                          {result.responseTime}ms
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {result.banner ? (
                        <Tooltip title={result.banner}>
                          <Typography variant="body2" noWrap sx={{ maxWidth: '200px' }}>
                            {result.banner}
                          </Typography>
                        </Tooltip>
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
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
      {chartData.length > 0 && (
        <Section background="paper" bordered>
          <CardTitle>{t('portResponseTimeVisualization')}</CardTitle>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('portResponseTimeGraph')}
          </Typography>
          
          <Box sx={{ mt: 3 }}>
            <SimpleChart
              data={chartData}
              height={300}
              title="Port Response Times"
            />
          </Box>
        </Section>
      )}
    </Box>
  );
};

export default PortScannerTool;