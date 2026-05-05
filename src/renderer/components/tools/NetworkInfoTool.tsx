import React, { useState, useEffect } from 'react';
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
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  styled,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  NetworkCheck as NetworkCheckIcon,
  Router as RouterIcon,
  Dns as DnsIcon,
  Computer as ComputerIcon,
  Storage as StorageIcon,
  Cable as CableIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { Layout, Grid, Section, Divider } from '../Layout';
import { Card } from '../Card';
import { Button } from '../Button';

// Styled components
const InfoSection = styled(Section)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const InfoCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: 'rgba(0, 255, 255, 0.05)',
  border: '1px solid rgba(0, 255, 255, 0.2)',
}));

const InfoRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(1, 0),
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  '&:last-child': {
    borderBottom: 'none',
  },
}));

const InfoLabel = styled(Typography)(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.7)',
  fontSize: '0.875rem',
  fontWeight: 500,
}));

const InfoValue = styled(Typography)(({ theme }) => ({
  color: '#FFFFFF',
  fontSize: '0.875rem',
  fontFamily: 'monospace',
  fontWeight: 600,
}));

interface NetworkInterface {
  name: string;
  displayName: string;
  type: 'Ethernet' | 'WiFi' | 'Loopback' | 'Virtual';
  status: 'Connected' | 'Disconnected' | 'Limited';
  ipv4: string;
  ipv6: string;
  mac: string;
  subnet: string;
  gateway: string;
  dns: string[];
  speed: string;
  mtu: number;
  bytesReceived: number;
  bytesSent: number;
}

interface RouteEntry {
  destination: string;
  gateway: string;
  interface: string;
  metric: number;
}

interface NetworkService {
  name: string;
  protocol: string;
  port: number;
  status: 'Running' | 'Stopped';
  description: string;
}

const NetworkInfoTool: React.FC = () => {
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
  const [routes, setRoutes] = useState<RouteEntry[]>([]);
  const [services, setServices] = useState<NetworkService[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch real network information
  const fetchNetworkInfo = async () => {
    setIsLoading(true);

    try {
      const response = await window.electronAPI.getNetworkInterfaces();

      if (response.success && response.data) {
        const realInterfaces: NetworkInterface[] = response.data.map((iface: any) => ({
          name: iface.name,
          displayName: iface.name,
          type: iface.type || 'Unknown',
          status: iface.status === 'up' ? 'Connected' : 'Disconnected',
          ipv4: iface.ipv4 || '',
          ipv6: iface.ipv6 || '',
          mac: iface.mac || '',
          subnet: '',
          gateway: '',
          dns: [],
          speed: '',
          mtu: 1500,
          bytesReceived: 0,
          bytesSent: 0,
        }));

        setInterfaces(realInterfaces);
      }

      // Routes and services remain as informational placeholders
      setRoutes([
        { destination: '0.0.0.0/0', gateway: 'Default Gateway', interface: 'Active Interface', metric: 0 },
      ]);
      setServices([]);
    } catch (error) {
      console.error('Failed to fetch network info:', error);
    } finally {
      setLastUpdate(new Date());
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworkInfo();
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' => {
    switch (status) {
      case 'Connected':
      case 'Running':
        return 'success';
      case 'Disconnected':
      case 'Stopped':
        return 'error';
      case 'Limited':
        return 'warning';
      default:
        return 'error';
    }
  };

  const getInterfaceIcon = (type: string) => {
    switch (type) {
      case 'Ethernet':
        return <CableIcon />;
      case 'WiFi':
        return <NetworkCheckIcon />;
      case 'Loopback':
        return <ComputerIcon />;
      case 'Virtual':
        return <StorageIcon />;
      default:
        return <NetworkCheckIcon />;
    }
  };

  return (
    <Box>
      {/* Header */}
      <InfoSection background="paper" bordered>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Network Information
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={fetchNetworkInfo}
            loading={isLoading}
          >
            Refresh
          </Button>
        </Box>

        {lastUpdate && (
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastUpdate.toLocaleString()}
          </Typography>
        )}
      </InfoSection>

      {/* Network Interfaces */}
      <InfoSection background="paper" bordered>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NetworkCheckIcon />
          Network Interfaces ({interfaces.length})
        </Typography>

        <Box sx={{ mt: 2 }}>
          {interfaces.map((iface) => (
            <Accordion
              key={iface.name}
              sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                '&:before': { display: 'none' },
                mb: 1,
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  '& .MuiAccordionSummary-content': {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {getInterfaceIcon(iface.type)}
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {iface.displayName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {iface.name} • {iface.type}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={iface.status}
                  size="small"
                  color={getStatusColor(iface.status)}
                  icon={iface.status === 'Connected' ? <CheckCircleIcon /> : <ErrorIcon />}
                />
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  <InfoRow>
                    <InfoLabel>IPv4 Address</InfoLabel>
                    <InfoValue>{iface.ipv4 || 'N/A'}</InfoValue>
                  </InfoRow>
                  <InfoRow>
                    <InfoLabel>IPv6 Address</InfoLabel>
                    <InfoValue>{iface.ipv6 || 'N/A'}</InfoValue>
                  </InfoRow>
                  <InfoRow>
                    <InfoLabel>MAC Address</InfoLabel>
                    <InfoValue>{iface.mac}</InfoValue>
                  </InfoRow>
                  <InfoRow>
                    <InfoLabel>Subnet Mask</InfoLabel>
                    <InfoValue>{iface.subnet || 'N/A'}</InfoValue>
                  </InfoRow>
                  <InfoRow>
                    <InfoLabel>Default Gateway</InfoLabel>
                    <InfoValue>{iface.gateway || 'N/A'}</InfoValue>
                  </InfoRow>
                  <InfoRow>
                    <InfoLabel>DNS Servers</InfoLabel>
                    <InfoValue>
                      {iface.dns.length > 0 ? iface.dns.join(', ') : 'N/A'}
                    </InfoValue>
                  </InfoRow>
                  <InfoRow>
                    <InfoLabel>Link Speed</InfoLabel>
                    <InfoValue>{iface.speed || 'N/A'}</InfoValue>
                  </InfoRow>
                  <InfoRow>
                    <InfoLabel>MTU</InfoLabel>
                    <InfoValue>{iface.mtu} bytes</InfoValue>
                  </InfoRow>
                  <InfoRow>
                    <InfoLabel>Bytes Received</InfoLabel>
                    <InfoValue>{formatBytes(iface.bytesReceived)}</InfoValue>
                  </InfoRow>
                  <InfoRow>
                    <InfoLabel>Bytes Sent</InfoLabel>
                    <InfoValue>{formatBytes(iface.bytesSent)}</InfoValue>
                  </InfoRow>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </InfoSection>

      {/* Routing Table */}
      <InfoSection background="paper" bordered>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RouterIcon />
          Routing Table ({routes.length} routes)
        </Typography>

        <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Destination</TableCell>
                <TableCell>Gateway</TableCell>
                <TableCell>Interface</TableCell>
                <TableCell>Metric</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {routes.map((route, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {route.destination}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {route.gateway === '0.0.0.0' ? 'On-link' : route.gateway}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={route.interface} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {route.metric}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </InfoSection>

      {/* Network Services */}
      <InfoSection background="paper" bordered>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DnsIcon />
          Network Services ({services.filter(s => s.status === 'Running').length} running)
        </Typography>

        <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Service</TableCell>
                <TableCell>Protocol</TableCell>
                <TableCell>Port</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {services.map((service, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {service.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={service.protocol} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {service.port}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={service.status}
                      size="small"
                      color={getStatusColor(service.status)}
                      icon={service.status === 'Running' ? <CheckCircleIcon /> : <ErrorIcon />}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {service.description}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </InfoSection>

      {/* Summary */}
      <InfoSection background="paper" bordered>
        <Typography variant="h6" gutterBottom>
          Network Summary
        </Typography>

        <Grid gap={2} direction="row" wrap="wrap">
          <InfoCard sx={{ flex: 1, minWidth: '200px' }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Active Interfaces
            </Typography>
            <Typography variant="h4" color="#00FFFF">
              {interfaces.filter(i => i.status === 'Connected').length}
            </Typography>
          </InfoCard>

          <InfoCard sx={{ flex: 1, minWidth: '200px' }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Total Routes
            </Typography>
            <Typography variant="h4" color="#FF00FF">
              {routes.length}
            </Typography>
          </InfoCard>

          <InfoCard sx={{ flex: 1, minWidth: '200px' }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Running Services
            </Typography>
            <Typography variant="h4" color="#00FF00">
              {services.filter(s => s.status === 'Running').length}
            </Typography>
          </InfoCard>

          <InfoCard sx={{ flex: 1, minWidth: '200px' }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Total Traffic
            </Typography>
            <Typography variant="h4" color="#FFFF00">
              {formatBytes(
                interfaces.reduce((sum, i) => sum + i.bytesReceived + i.bytesSent, 0)
              )}
            </Typography>
          </InfoCard>
        </Grid>
      </InfoSection>
    </Box>
  );
};

export default NetworkInfoTool;
