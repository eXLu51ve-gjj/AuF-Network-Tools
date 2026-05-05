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
  Tabs,
  Tab,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  SignalCellular4Bar as SignalIcon,
  Wifi as WifiIcon,
  Security as SecurityIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  LockOutlined as LockOutlinedIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Timeline as TimelineIcon,
  BarChart as BarChartIcon,
  NetworkCheck as NetworkCheckIcon,
  WifiPassword as WifiPasswordIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { Layout, Grid, Section, Divider } from '../Layout';
import { Card } from '../Card';
import { Button } from '../Button';
import { WiFiNetwork, SignalHistoryPoint, BandMetrics, ChannelInfo } from '../../types';
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

const SignalBar = styled(Box)<{ strength: number }>(({ theme, strength }) => {
  // Convert dBm to percentage (approx)
  // -30 dBm = 100%, -90 dBm = 0%
  const percentage = Math.max(0, Math.min(100, ((strength + 90) / 60) * 100));
  
  // Determine color based on signal strength
  let color = theme.palette.error.main; // Red for weak
  if (strength > -70) color = theme.palette.success.main; // Green for good
  else if (strength > -80) color = theme.palette.warning.main; // Yellow for fair
  
  return {
    width: '100%',
    height: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    overflow: 'hidden',
    position: 'relative',
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      height: '100%',
      width: `${percentage}%`,
      backgroundColor: color,
      borderRadius: '4px',
      transition: 'width 0.3s ease',
    },
  };
});

const SecurityBadge = styled(Chip)(({ theme }) => ({
  fontSize: '0.75rem',
  height: '24px',
}));

const BandBadge = styled(Chip)(({ theme }) => ({
  fontSize: '0.75rem',
  height: '24px',
}));

export interface ScanResult {
  networks: WiFiNetwork[];
  timestamp: Date;
  duration: number;
  band: '2.4GHz' | '5GHz' | 'both';
}

interface WiFiScannerToolProps {
  onScanComplete?: (results: ScanResult) => void;
}

const WiFiScannerTool: React.FC<WiFiScannerToolProps> = ({ onScanComplete }) => {
  const { t } = useLanguage();
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResults, setScanResults] = useState<WiFiNetwork[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  
  // Connect dialog state
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [connectingNetwork, setConnectingNetwork] = useState<WiFiNetwork | null>(null);
  const [connectPassword, setConnectPassword] = useState('');
  const [showConnectPassword, setShowConnectPassword] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectedSSID, setConnectedSSID] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [selectedBand, setSelectedBand] = useState<'2.4GHz' | '5GHz' | 'both'>('both');
  const [scanDuration, setScanDuration] = useState(10); // seconds
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [showHidden, setShowHidden] = useState(true);
  const [sortBy, setSortBy] = useState<'signal' | 'channel' | 'ssid'>('signal');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState(0); // 0: Networks, 1: Channel Analysis, 2: Signal Stability, 3: Band Metrics
  const [signalHistory, setSignalHistory] = useState<Map<string, SignalHistoryPoint[]>>(new Map());
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate channel information for channel analysis
  const getChannelAnalysis = (): ChannelInfo[] => {
    const channelMap = new Map<number, WiFiNetwork[]>();
    
    scanResults.forEach(network => {
      const existing = channelMap.get(network.channel) || [];
      channelMap.set(network.channel, [...existing, network]);
    });
    
    const channelInfo: ChannelInfo[] = [];
    channelMap.forEach((networks, channel) => {
      const networkCount = networks.length;
      let interference: 'None' | 'Low' | 'Medium' | 'High' = 'None';
      
      if (networkCount === 1) interference = 'None';
      else if (networkCount === 2) interference = 'Low';
      else if (networkCount === 3) interference = 'Medium';
      else interference = 'High';
      
      channelInfo.push({
        channel,
        frequency: networks[0].frequency,
        networkCount,
        networks,
        interference,
      });
    });
    
    return channelInfo.sort((a, b) => a.channel - b.channel);
  };

  // Calculate band-specific metrics
  const getBandMetrics = (): BandMetrics[] => {
    const bands: ('2.4GHz' | '5GHz')[] = ['2.4GHz', '5GHz'];
    
    return bands.map(band => {
      const bandNetworks = scanResults.filter(n => n.band === band);
      
      if (bandNetworks.length === 0) {
        return {
          band,
          networkCount: 0,
          averageSignal: 0,
          channelUtilization: 0,
          recommendedChannel: band === '2.4GHz' ? 1 : 36,
          congestionLevel: 'Low' as const,
        };
      }
      
      const averageSignal = bandNetworks.reduce((sum, n) => sum + n.signalStrength, 0) / bandNetworks.length;
      
      // Calculate channel utilization
      const channelCounts = new Map<number, number>();
      bandNetworks.forEach(n => {
        channelCounts.set(n.channel, (channelCounts.get(n.channel) || 0) + 1);
      });
      
      const maxChannelCount = Math.max(...Array.from(channelCounts.values()));
      const channelUtilization = (maxChannelCount / bandNetworks.length) * 100;
      
      // Find least congested channel
      const allChannels = band === '2.4GHz' ? [1, 6, 11] : [36, 40, 44, 48, 149, 153, 157, 161];
      const channelScores = allChannels.map(ch => ({
        channel: ch,
        count: channelCounts.get(ch) || 0,
      }));
      const recommendedChannel = channelScores.sort((a, b) => a.count - b.count)[0].channel;
      
      // Determine congestion level
      let congestionLevel: 'Low' | 'Medium' | 'High' = 'Low';
      if (channelUtilization > 70) congestionLevel = 'High';
      else if (channelUtilization > 40) congestionLevel = 'Medium';
      
      return {
        band,
        networkCount: bandNetworks.length,
        averageSignal,
        channelUtilization,
        recommendedChannel,
        congestionLevel,
      };
    });
  };

  // Update signal history when scan completes
  const updateSignalHistory = (networks: WiFiNetwork[]) => {
    const newHistory = new Map(signalHistory);
    const timestamp = new Date();
    
    networks.forEach(network => {
      const history = newHistory.get(network.bssid) || [];
      history.push({
        timestamp,
        signalStrength: network.signalStrength,
        snr: network.snr,
      });
      
      // Keep only last 50 data points
      if (history.length > 50) {
        history.shift();
      }
      
      newHistory.set(network.bssid, history);
    });
    
    setSignalHistory(newHistory);
  };

  // Real WiFi scanning using system API
  const performRealScan = async () => {
    setIsScanning(true);
    setScanProgress(0);
    setScanError(null);
    
    try {
      // Simulate progress animation
      const progressInterval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, (scanDuration * 1000) / 9);
      
      // Call real WiFi scan API
      const response = await window.electronAPI.scanWiFi();
      
      clearInterval(progressInterval);
      setScanProgress(100);
      
      if (response.success && response.data) {
        // Convert API data to WiFiNetwork format
        let networks: WiFiNetwork[] = response.data.map((network: any, index: number) => ({
          id: `network-${Date.now()}-${index}`,
          ssid: network.ssid || 'Hidden Network',
          bssid: network.bssid || '',
          signalStrength: network.signal || 0,
          channel: network.channel || 0,
          frequency: network.channel > 14 ? 5000 + (network.channel * 5) : 2412 + ((network.channel - 1) * 5),
          band: network.band || '2.4GHz',
          security: network.security || 'Open',
          encryption: network.security?.includes('WPA3') ? 'WPA3' : 
                     network.security?.includes('WPA2') ? 'WPA2' : 
                     network.security?.includes('WPA') ? 'WPA' : 
                     network.security?.includes('WEP') ? 'WEP' : 'None',
          vendor: 'Unknown',
          lastSeen: new Date(),
          hidden: !network.ssid || network.ssid.trim() === '',
          capabilities: [],
        }));
        
        // Filter networks based on selected band
        if (selectedBand !== 'both') {
          networks = networks.filter(network => network.band === selectedBand);
        }
        
        // Filter hidden networks if needed
        if (!showHidden) {
          networks = networks.filter(network => !network.hidden);
        }
        
        // Sort networks
        networks.sort((a, b) => {
          if (sortBy === 'signal') return b.signalStrength - a.signalStrength;
          if (sortBy === 'channel') return a.channel - b.channel;
          return a.ssid.localeCompare(b.ssid);
        });
        
        const result: ScanResult = {
          networks,
          timestamp: new Date(),
          duration: scanDuration,
          band: selectedBand,
        };
        
        setScanResults(networks);
        setScanHistory(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 scans
        
        // Update signal history for stability tracking
        updateSignalHistory(networks);
        
        if (onScanComplete) {
          onScanComplete(result);
        }
      } else {
        console.error('WiFi scan failed:', response.error);
        // Fallback to empty results
        setScanResults([]);
      }
    } catch (error: any) {
      console.error('WiFi scan error:', error);
      // Show user-friendly error message
      if (error?.message?.includes('disabled') || error?.message?.includes('adapter')) {
        setScanError('WiFi адаптер выключен. Включите WiFi и попробуйте снова.');
      } else {
        setScanError('Ошибка сканирования. Убедитесь что WiFi включён.');
      }
      setScanResults([]);
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  };

  const startScan = () => {
    if (isScanning) return;
    performRealScan();
  };

  // Connect to WiFi network
  const handleConnectClick = (network: WiFiNetwork) => {
    setConnectingNetwork(network);
    setConnectPassword('');
    setConnectError(null);
    setConnectDialogOpen(true);
  };

  const handleConnect = async () => {
    if (!connectingNetwork) return;
    
    setIsConnecting(true);
    setConnectError(null);
    
    try {
      const isOpen = connectingNetwork.security === 'Open' || connectingNetwork.security === 'Открытая';
      const result = await window.electronAPI.connectWiFi(
        connectingNetwork.ssid,
        isOpen ? undefined : connectPassword
      );
      
      if (result.success) {
        setConnectedSSID(connectingNetwork.ssid);
        setConnectDialogOpen(false);
        setConnectPassword('');
      } else {
        setConnectError(result.error || 'Не удалось подключиться');
      }
    } catch (err) {
      setConnectError('Ошибка подключения');
    } finally {
      setIsConnecting(false);
    }
  };

  const stopScan = () => {
    setIsScanning(false);
    setScanProgress(0);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  const clearResults = () => {
    setScanResults([]);
    setScanHistory([]);
  };

  const toggleFavorite = (bssid: string) => {
    setFavorites(prev => 
      prev.includes(bssid) 
        ? prev.filter(id => id !== bssid)
        : [...prev, bssid]
    );
  };

  const exportResults = () => {
    const data = {
      scanResults,
      timestamp: new Date().toISOString(),
      scanSettings: {
        band: selectedBand,
        duration: scanDuration,
        showHidden,
      },
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wifi-scan-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Auto-refresh logic
  useEffect(() => {
    if (autoRefresh && !isScanning) {
      autoRefreshRef.current = setInterval(() => {
        performRealScan();
      }, refreshInterval * 1000);
    } else if (autoRefreshRef.current) {
      clearInterval(autoRefreshRef.current);
      autoRefreshRef.current = null;
    }
    
    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, isScanning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, []);

  const getSecurityIcon = (security: WiFiNetwork['security']) => {
    switch (security) {
      case 'WPA3':
        return <LockIcon fontSize="small" />;
      case 'WPA2':
        return <LockOutlinedIcon fontSize="small" />;
      case 'WEP':
        return <LockOpenIcon fontSize="small" />;
      case 'Enterprise':
        return <SecurityIcon fontSize="small" />;
      case 'Open':
        return <LockOpenIcon fontSize="small" />;
      default:
        return <SecurityIcon fontSize="small" />;
    }
  };

  const getSecurityColor = (security: WiFiNetwork['security']) => {
    switch (security) {
      case 'WPA3':
        return 'success';
      case 'WPA2':
        return 'info';
      case 'WEP':
        return 'warning';
      case 'Enterprise':
        return 'secondary';
      case 'Open':
        return 'error';
      default:
        return 'default';
    }
  };


  return (
    <Box>
      {/* Connect to WiFi Dialog */}
      <Dialog
        open={connectDialogOpen}
        onClose={() => { setConnectDialogOpen(false); setConnectError(null); }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WifiIcon />
          Подключиться к {connectingNetwork?.ssid}
        </DialogTitle>
        <DialogContent>
          {connectError && (
            <Alert severity="error" sx={{ mb: 2 }}>{connectError}</Alert>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Chip
              icon={getSecurityIcon(connectingNetwork?.security as any)}
              label={connectingNetwork?.security}
              color={getSecurityColor(connectingNetwork?.security as any)}
              size="small"
            />
            <Chip
              label={connectingNetwork?.band}
              color={connectingNetwork?.band === '5GHz' ? 'primary' : 'secondary'}
              size="small"
            />
            <Chip
              label={`${connectingNetwork?.signalStrength} dBm`}
              size="small"
              variant="outlined"
            />
          </Box>

          {connectingNetwork?.security !== 'Open' && connectingNetwork?.security !== 'Открытая' && (
            <TextField
              label="Пароль WiFi"
              type={showConnectPassword ? 'text' : 'password'}
              value={connectPassword}
              onChange={(e) => setConnectPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleConnect()}
              fullWidth
              size="small"
              autoFocus
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowConnectPassword(!showConnectPassword)}
                    >
                      {showConnectPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}

          {(connectingNetwork?.security === 'Open' || connectingNetwork?.security === 'Открытая') && (
            <Alert severity="info">Открытая сеть — пароль не требуется</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setConnectDialogOpen(false); setConnectError(null); }}>
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={handleConnect}
            disabled={isConnecting || (
              connectingNetwork?.security !== 'Open' && 
              connectingNetwork?.security !== 'Открытая' && 
              !connectPassword
            )}
            loading={isConnecting}
            startIcon={<WifiIcon />}
          >
            Подключиться
          </Button>
        </DialogActions>
      </Dialog>
      <ControlSection background="paper" bordered>
        <Typography variant="h6" gutterBottom>
          {t('scanControls')}
        </Typography>
        
        <Grid gap={2} direction="row" wrap="wrap">
          <Box sx={{ flex: 1, minWidth: '200px' }}>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>{t('bandSelection')}</InputLabel>
              <Select
                value={selectedBand}
                label={t('bandSelection')}
                onChange={(e) => setSelectedBand(e.target.value as any)}
                disabled={isScanning}
              >
                <MenuItem value="both">{t('both')} (2.4GHz & 5GHz)</MenuItem>
                <MenuItem value="2.4GHz">2.4GHz Only</MenuItem>
                <MenuItem value="5GHz">5GHz Only</MenuItem>
              </Select>
            </FormControl>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                {t('scanDuration')}: {scanDuration}s
              </Typography>
              <Slider
                value={scanDuration}
                onChange={(_, value) => setScanDuration(value as number)}
                min={5}
                max={30}
                step={5}
                disabled={isScanning}
                marks={[
                  { value: 5, label: '5s' },
                  { value: 10, label: '10s' },
                  { value: 15, label: '15s' },
                  { value: 20, label: '20s' },
                  { value: 25, label: '25s' },
                  { value: 30, label: '30s' },
                ]}
              />
            </Box>
          </Box>
          
          <Box sx={{ flex: 1, minWidth: '200px' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  disabled={isScanning}
                />
              }
              label={t('autoRefresh')}
            />
            
            {autoRefresh && (
              <FormControl fullWidth size="small" sx={{ mt: 2 }}>
                <InputLabel>{t('refreshInterval')}</InputLabel>
                <Select
                  value={refreshInterval}
                  label={t('refreshInterval')}
                  onChange={(e) => setRefreshInterval(e.target.value as number)}
                  disabled={isScanning}
                >
                  <MenuItem value={15}>15 {t('seconds')}</MenuItem>
                  <MenuItem value={30}>30 {t('seconds')}</MenuItem>
                  <MenuItem value={60}>1 {t('minute')}</MenuItem>
                  <MenuItem value={300}>5 {t('minutes')}</MenuItem>
                </Select>
              </FormControl>
            )}
            
            <FormControlLabel
              control={
                <Switch
                  checked={showHidden}
                  onChange={(e) => setShowHidden(e.target.checked)}
                  disabled={isScanning}
                />
              }
              label={t('showHiddenNetworks')}
              sx={{ mt: 2 }}
            />
          </Box>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid gap={2} direction="row" wrap="wrap">
          <Button
            variant="contained"
            color="primary"
            startIcon={isScanning ? <StopIcon /> : <PlayArrowIcon />}
            onClick={isScanning ? stopScan : startScan}
            disabled={isScanning && scanProgress >= 100}
            loading={isScanning}
          >
            {isScanning ? t('stopScan') : t('startScan')}
          </Button>
          
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<ClearIcon />}
            onClick={clearResults}
            disabled={scanResults.length === 0 || isScanning}
          >
            {t('clearResults')}
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportResults}
            disabled={scanResults.length === 0 || isScanning}
          >
            {t('exportResults')}
          </Button>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>{t('sortBy')}</InputLabel>
            <Select
              value={sortBy}
              label={t('sortBy')}
              onChange={(e) => setSortBy(e.target.value as any)}
              disabled={isScanning}
            >
              <MenuItem value="signal">{t('signalStrength')}</MenuItem>
              <MenuItem value="channel">{t('channel')}</MenuItem>
              <MenuItem value="ssid">{t('networkName')}</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        {isScanning && (
          <ProgressContainer>
            <ProgressInfo>
              <Typography variant="body2">
                {t('scanning')} {selectedBand} {t('networks')}...
              </Typography>
              <Typography variant="body2">
                {scanProgress}%
              </Typography>
            </ProgressInfo>
            <LinearProgress 
              variant="determinate" 
              value={scanProgress} 
              sx={{ height: 8, borderRadius: 4 }}
            />
          </ProgressContainer>
        )}

        {scanError && (
          <Alert severity="warning" sx={{ mt: 2 }} onClose={() => setScanError(null)}>
            {scanError}
          </Alert>
        )}

        {connectedSSID && (
          <Alert 
            severity="success" 
            sx={{ mt: 2 }}
            icon={<CheckCircleIcon />}
            action={
              <Button 
                size="small" 
                color="inherit"
                onClick={async () => {
                  await window.electronAPI.disconnectWiFi();
                  setConnectedSSID(null);
                }}
              >
                Отключиться
              </Button>
            }
          >
            Подключено к: <strong>{connectedSSID}</strong>
          </Alert>
        )}
      </ControlSection>
      
      {scanResults.length > 0 && (
        <ResultsSection background="paper" bordered>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
              <Tab icon={<WifiIcon />} label={t('networks')} />
              <Tab icon={<BarChartIcon />} label={t('channelAnalysis')} />
              <Tab icon={<TimelineIcon />} label={t('signalStability')} />
              <Tab icon={<NetworkCheckIcon />} label={t('bandMetrics')} />
            </Tabs>
          </Box>
          
          {/* Tab 0: Networks List */}
          {activeTab === 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  {t('detectedNetworks')} ({scanResults.length})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('lastScan')}: {scanHistory[0]?.timestamp.toLocaleTimeString()}
                </Typography>
              </Box>
              
              <TableContainer component={Paper} sx={{ backgroundColor: 'transparent' }}>
                <Table size="small" sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell width="40px"></TableCell>
                      <TableCell>{t('networkName')} ({t('ssid')})</TableCell>
                      <TableCell>{t('bssid')}</TableCell>
                      <TableCell>{t('channel')}</TableCell>
                      <TableCell>{t('signalStrength')}</TableCell>
                      <TableCell>{t('snr')}</TableCell>
                      <TableCell>{t('security')}</TableCell>
                      <TableCell>{t('band')}</TableCell>
                      <TableCell>{t('actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {scanResults.map((network) => (
                      <TableRow 
                        key={network.bssid}
                        sx={{ 
                          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
                          ...(network.hidden && { opacity: 0.7 }),
                        }}
                      >
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => toggleFavorite(network.bssid)}
                            sx={{ color: favorites.includes(network.bssid) ? '#ffd700' : 'inherit' }}
                          >
                            {favorites.includes(network.bssid) ? <StarIcon /> : <StarBorderIcon />}
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {network.hidden && <FilterIcon fontSize="small" />}
                            <Typography variant="body2">
                              {network.hidden ? '[Hidden Network]' : network.ssid}
                            </Typography>
                            {network.security === 'Enterprise' && network.enterpriseAuth && (
                              <Chip 
                                label={network.enterpriseAuth} 
                                size="small" 
                                color="secondary"
                                sx={{ fontSize: '0.65rem', height: '20px' }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {network.bssid}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {network.channel}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ width: '120px' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <SignalIcon fontSize="small" />
                              <Typography variant="body2">
                                {network.signalStrength} dBm
                              </Typography>
                            </Box>
                            <SignalBar strength={network.signalStrength} />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {network.snr ? `${network.snr} dB` : 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <SecurityBadge
                            icon={getSecurityIcon(network.security)}
                            label={network.security}
                            color={getSecurityColor(network.security)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <BandBadge
                            label={network.band}
                            color={network.band === '5GHz' ? 'primary' : 'secondary'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title={t('viewSignalHistory')}>
                            <IconButton 
                              size="small"
                              onClick={() => {
                                setSelectedNetwork(network.bssid);
                                setActiveTab(2);
                              }}
                            >
                              <TimelineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Подключиться">
                            <IconButton
                              size="small"
                              color={connectedSSID === network.ssid ? 'success' : 'primary'}
                              onClick={() => handleConnectClick(network)}
                            >
                              {connectedSSID === network.ssid 
                                ? <CheckCircleIcon fontSize="small" />
                                : <WifiIcon fontSize="small" />
                              }
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {scanHistory.length > 1 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('recentScans')} ({scanHistory.length - 1})
                  </Typography>
                  <Grid gap={1} direction="row" wrap="wrap">
                    {scanHistory.slice(1).map((scan, index) => (
                      <Chip
                        key={index}
                        label={`${scan.timestamp.toLocaleTimeString()} (${scan.networks.length} ${t('networks')})`}
                        size="small"
                        variant="outlined"
                        onClick={() => setScanResults(scan.networks)}
                      />
                    ))}
                  </Grid>
                </Box>
              )}
            </Box>
          )}
          
          {/* Tab 1: Channel Analysis */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {t('channelAnalysis')} & {t('interference')}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {t('channelInterferenceView')}
              </Typography>
              
              {getChannelAnalysis().map((channelInfo) => (
                <Card key={channelInfo.channel} sx={{ mb: 2, p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                      <Typography variant="h6">
                        {t('channel')} {channelInfo.channel}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {channelInfo.frequency} MHz
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Chip 
                        label={`${channelInfo.networkCount} ${channelInfo.networkCount !== 1 ? t('networks') : t('networkName')}`}
                        size="small"
                        color="primary"
                      />
                      <Chip 
                        label={`${channelInfo.interference} ${t('interference')}`}
                        size="small"
                        color={
                          channelInfo.interference === 'None' ? 'success' :
                          channelInfo.interference === 'Low' ? 'info' :
                          channelInfo.interference === 'Medium' ? 'warning' : 'error'
                        }
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  </Box>
                  
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>{t('ssid')}</TableCell>
                          <TableCell>{t('signal')}</TableCell>
                          <TableCell>{t('security')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {channelInfo.networks.map((network) => (
                          <TableRow key={network.bssid}>
                            <TableCell>{network.hidden ? '[Hidden]' : network.ssid}</TableCell>
                            <TableCell>{network.signalStrength} dBm</TableCell>
                            <TableCell>
                              <SecurityBadge
                                label={network.security}
                                color={getSecurityColor(network.security)}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              ))}
            </Box>
          )}
          
          {/* Tab 2: Signal Stability */}
          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {t('signalStability')} Tracking
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {t('monitorSignalChanges')}
              </Typography>
              
              {selectedNetwork && signalHistory.has(selectedNetwork) ? (
                <Box>
                  {(() => {
                    const network = scanResults.find(n => n.bssid === selectedNetwork);
                    const history = signalHistory.get(selectedNetwork) || [];
                    
                    return (
                      <Card sx={{ p: 2, mb: 2 }}>
                        <Typography variant="h6" gutterBottom>
                          {network?.hidden ? '[Hidden Network]' : network?.ssid}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {t('bssid')}: {selectedNetwork}
                        </Typography>
                        
                        <Box sx={{ mt: 3, height: 300, position: 'relative' }}>
                          <svg width="100%" height="100%" viewBox="0 0 800 300">
                            {/* Grid lines */}
                            {[0, 1, 2, 3, 4].map((i) => (
                              <line
                                key={`grid-${i}`}
                                x1="60"
                                y1={50 + i * 50}
                                x2="750"
                                y2={50 + i * 50}
                                stroke="rgba(255, 255, 255, 0.1)"
                                strokeWidth="1"
                              />
                            ))}
                            
                            {/* Y axis labels */}
                            {[-30, -45, -60, -75, -90].map((value, i) => (
                              <text
                                key={`y-label-${i}`}
                                x="50"
                                y={55 + i * 50}
                                fill="rgba(255, 255, 255, 0.7)"
                                fontSize="12"
                                textAnchor="end"
                              >
                                {value}
                              </text>
                            ))}
                            
                            {/* Signal strength line */}
                            {history.length > 1 && (
                              <polyline
                                points={history.map((point, i) => {
                                  const x = 60 + (i / (history.length - 1)) * 690;
                                  const y = 250 - ((point.signalStrength + 90) / 60) * 200;
                                  return `${x},${y}`;
                                }).join(' ')}
                                fill="none"
                                stroke="#00FFFF"
                                strokeWidth="2"
                              />
                            )}
                            
                            {/* Data points */}
                            {history.map((point, i) => {
                              const x = 60 + (i / (history.length - 1)) * 690;
                              const y = 250 - ((point.signalStrength + 90) / 60) * 200;
                              return (
                                <circle
                                  key={i}
                                  cx={x}
                                  cy={y}
                                  r="4"
                                  fill="#00FFFF"
                                />
                              );
                            })}
                            
                            {/* Axes */}
                            <line x1="60" y1="250" x2="750" y2="250" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="2" />
                            <line x1="60" y1="50" x2="60" y2="250" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="2" />
                            
                            {/* Labels */}
                            <text x="400" y="280" fill="rgba(255, 255, 255, 0.7)" fontSize="14" textAnchor="middle">
                              {t('time')}
                            </text>
                            <text x="30" y="150" fill="rgba(255, 255, 255, 0.7)" fontSize="14" textAnchor="middle" transform="rotate(-90, 30, 150)">
                              {t('signal')} (dBm)
                            </text>
                          </svg>
                        </Box>
                        
                        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {t('currentSignal')}
                            </Typography>
                            <Typography variant="h6">
                              {network?.signalStrength} dBm
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {t('averageSignalLabel')}
                            </Typography>
                            <Typography variant="h6">
                              {(history.reduce((sum, p) => sum + p.signalStrength, 0) / history.length).toFixed(1)} dBm
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {t('dataPoints')}
                            </Typography>
                            <Typography variant="h6">
                              {history.length}
                            </Typography>
                          </Box>
                        </Box>
                      </Card>
                    );
                  })()}
                </Box>
              ) : (
                <Alert severity="info">
                  {t('selectNetworkFromTab')}
                </Alert>
              )}
              
              {/* Show all networks with history */}
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                {t('networksWithHistory')}
              </Typography>
              <Grid gap={1} direction="row" wrap="wrap">
                {scanResults.filter(n => signalHistory.has(n.bssid)).map((network) => (
                  <Chip
                    key={network.bssid}
                    label={network.hidden ? '[Hidden]' : network.ssid}
                    onClick={() => setSelectedNetwork(network.bssid)}
                    color={selectedNetwork === network.bssid ? 'primary' : 'default'}
                    variant={selectedNetwork === network.bssid ? 'filled' : 'outlined'}
                  />
                ))}
              </Grid>
            </Box>
          )}
          
          {/* Tab 3: Band Metrics */}
          {activeTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {t('bandSpecificMetrics')}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {t('comparePerformance')}
              </Typography>
              
              <Grid gap={2} direction="row" wrap="wrap">
                {getBandMetrics().map((metrics) => (
                  <Card key={metrics.band} sx={{ flex: 1, minWidth: '300px', p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h5">
                        {metrics.band}
                      </Typography>
                      <BandBadge
                        label={metrics.congestionLevel}
                        color={
                          metrics.congestionLevel === 'Low' ? 'success' :
                          metrics.congestionLevel === 'Medium' ? 'warning' : 'error'
                        }
                      />
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('networksDetected')}
                      </Typography>
                      <Typography variant="h4">
                        {metrics.networkCount}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('averageSignal')}
                      </Typography>
                      <Typography variant="h6">
                        {metrics.averageSignal.toFixed(1)} dBm
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {t('channelUtilization')}
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={metrics.channelUtilization}
                        sx={{ 
                          height: 10, 
                          borderRadius: 5,
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: 
                              metrics.channelUtilization > 70 ? '#ff0000' :
                              metrics.channelUtilization > 40 ? '#ffff00' : '#00ff00'
                          }
                        }}
                      />
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {metrics.channelUtilization.toFixed(1)}%
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {t('recommendedChannel')}
                      </Typography>
                      <Chip 
                        label={`${t('channel')} ${metrics.recommendedChannel}`}
                        color="success"
                        icon={<NetworkCheckIcon />}
                      />
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        {t('leastCongestedChannel')}
                      </Typography>
                    </Box>
                  </Card>
                ))}
              </Grid>
              
              {/* Enterprise Networks Detection */}
              {scanResults.some(n => n.security === 'Enterprise') && (
                <Box sx={{ mt: 3 }}>
                  <Alert severity="info" icon={<SecurityIcon />}>
                    <Typography variant="subtitle2" gutterBottom>
                      {t('enterpriseNetworksDetected')}
                    </Typography>
                    <Typography variant="body2">
                      {scanResults.filter(n => n.security === 'Enterprise').length} {t('enterpriseNetworkFound')}:
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {scanResults.filter(n => n.security === 'Enterprise').map((network) => (
                        <Chip
                          key={network.bssid}
                          label={`${network.hidden ? '[Hidden]' : network.ssid} - ${network.enterpriseAuth || '802.1X'}`}
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))}
                    </Box>
                  </Alert>
                </Box>
              )}
            </Box>
          )}
        </ResultsSection>
      )}
      
      {scanResults.length === 0 && !isScanning && (
        <ResultsSection background="paper" bordered>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <WifiIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {t('noNetworksDetected')}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {t('clickStartScan')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('makeWifiAdapterEnabled')}
            </Typography>
          </Box>
        </ResultsSection>
      )}
    </Box>
  );
};

export { WiFiScannerTool as default };
export type { ScanResult };
