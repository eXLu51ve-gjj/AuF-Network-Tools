import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  styled,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  SwapHoriz as SwapIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { Layout, Grid, Section, Divider } from '../Layout';
import { Card } from '../Card';
import { Button } from '../Button';
import { useLanguage } from '../../contexts/LanguageContext';

// Styled components
const ControlSection = styled(Section)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const ResultsSection = styled(Section)(({ theme }) => ({
  marginTop: theme.spacing(3),
}));

const RecordChip = styled(Chip)(({ theme }) => ({
  fontSize: '0.75rem',
  height: '24px',
  fontFamily: 'monospace',
}));

interface DNSRecord {
  type: 'A' | 'AAAA' | 'MX' | 'TXT' | 'CNAME' | 'NS' | 'SOA' | 'PTR';
  value: string;
  ttl: number;
  priority?: number;
}

interface DNSResult {
  id: string;
  domain: string;
  records: DNSRecord[];
  timestamp: Date;
  queryTime: number;
  isReverse: boolean;
}

interface CacheEntry {
  domain: string;
  records: DNSRecord[];
  timestamp: Date;
  expiresAt: Date;
}

const DNSResolverTool: React.FC = () => {
  const { t } = useLanguage();
  const [domain, setDomain] = useState('');
  const [recordType, setRecordType] = useState<'ALL' | DNSRecord['type']>('ALL');
  const [isResolving, setIsResolving] = useState(false);
  const [results, setResults] = useState<DNSResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [dnsCache, setDnsCache] = useState<CacheEntry[]>([]);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [isReverseMode, setIsReverseMode] = useState(false);

  const validateDomain = (input: string): boolean => {
    if (isReverseMode) {
      // Validate IP address
      const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
      const ipv6Regex = /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/;
      return ipv4Regex.test(input) || ipv6Regex.test(input);
    } else {
      // Validate domain name
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(\.[a-zA-Z]{2,})+$/;
      return domainRegex.test(input) || input === 'localhost';
    }
  };

  const performDNSLookup = async () => {
    if (!domain.trim()) {
      setError('Please enter a domain name or IP address');
      return;
    }

    if (!validateDomain(domain.trim())) {
      setError(isReverseMode ? 'Invalid IP address format' : 'Invalid domain name format');
      return;
    }

    setIsResolving(true);
    setError(null);

    const startTime = Date.now();

    try {
      let records: DNSRecord[] = [];
      let queryDomain = domain.trim().toLowerCase();

      if (isReverseMode) {
        // Reverse DNS lookup using real API
        const response = await window.electronAPI.reverseDNS(queryDomain);
        
        if (response.success && response.data && response.data.length > 0) {
          records = response.data.map((hostname: string) => ({
            type: 'PTR' as const,
            value: hostname,
            ttl: 3600,
          }));
        } else {
          setError(`No PTR record found for ${queryDomain}`);
          setIsResolving(false);
          return;
        }
      } else {
        // Forward DNS lookup using real API
        if (recordType === 'ALL') {
          // Query multiple record types
          const types = ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME'];
          const promises = types.map(type => 
            window.electronAPI.dnsLookup(queryDomain, type)
              .then(res => res.success ? res.data : [])
              .catch(() => [])
          );
          
          const results = await Promise.all(promises);
          records = results.flat().filter(r => r);
        } else {
          // Query specific record type
          const response = await window.electronAPI.dnsLookup(queryDomain, recordType);
          
          if (response.success && response.data) {
            records = response.data;
          }
        }
        
        if (records.length === 0) {
          setError(`No ${recordType === 'ALL' ? 'DNS' : recordType} records found for ${queryDomain}`);
          setIsResolving(false);
          return;
        }
      }

      const queryTime = Date.now() - startTime;

      const result: DNSResult = {
        id: `result-${Date.now()}`,
        domain: queryDomain,
        records,
        timestamp: new Date(),
        queryTime,
        isReverse: isReverseMode,
      };

      setResults(prev => [result, ...prev]);

      // Add to cache
      const cacheEntry: CacheEntry = {
        domain: queryDomain,
        records,
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + Math.min(...records.map(r => r.ttl)) * 1000),
      };
      setDnsCache(prev => {
        const filtered = prev.filter(e => e.domain !== queryDomain);
        return [cacheEntry, ...filtered];
      });

      // Add to history
      if (!queryHistory.includes(queryDomain)) {
        setQueryHistory(prev => [queryDomain, ...prev.slice(0, 19)]);
      }

      setIsResolving(false);
    } catch (err) {
      setError('DNS query failed. Please try again.');
      setIsResolving(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setError(null);
  };

  const clearCache = () => {
    setDnsCache([]);
  };

  const clearHistory = () => {
    setQueryHistory([]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const exportResults = () => {
    const data = {
      results,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dns-results-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const loadFromHistory = (historicalDomain: string) => {
    setDomain(historicalDomain);
    setActiveTab(0);
  };

  const loadFromCache = (cachedDomain: string) => {
    const cached = dnsCache.find(e => e.domain === cachedDomain);
    if (cached) {
      const result: DNSResult = {
        id: `result-${Date.now()}`,
        domain: cached.domain,
        records: cached.records,
        timestamp: new Date(),
        queryTime: 0,
        isReverse: false,
      };
      setResults(prev => [result, ...prev]);
      setActiveTab(0);
    }
  };

  const removeCacheEntry = (cachedDomain: string) => {
    setDnsCache(prev => prev.filter(e => e.domain !== cachedDomain));
  };

  const getRecordColor = (type: DNSRecord['type']) => {
    const colors: Record<DNSRecord['type'], 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'> = {
      A: 'primary',
      AAAA: 'secondary',
      MX: 'success',
      TXT: 'info',
      CNAME: 'warning',
      NS: 'error',
      SOA: 'primary',
      PTR: 'secondary',
    };
    return colors[type] || 'default';
  };

  const formatTTL = (ttl: number): string => {
    if (ttl === 0) return 'No cache';
    if (ttl < 60) return `${ttl}s`;
    if (ttl < 3600) return `${Math.floor(ttl / 60)}m`;
    if (ttl < 86400) return `${Math.floor(ttl / 3600)}h`;
    return `${Math.floor(ttl / 86400)}d`;
  };

  return (
    <Box>
      <ControlSection background="paper" bordered>
        <Typography variant="h6" gutterBottom>
          {t('dnsResolver')}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid gap={2} direction="column">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              label={isReverseMode ? t('ipAddressLabel') : t('domainName')}
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && performDNSLookup()}
              size="small"
              fullWidth
              disabled={isResolving}
              placeholder={isReverseMode ? '8.8.8.8' : 'example.com'}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <Tooltip title={isReverseMode ? t('switchToForward') : t('switchToReverse')}>
              <IconButton
                onClick={() => {
                  setIsReverseMode(!isReverseMode);
                  setDomain('');
                  setError(null);
                }}
                disabled={isResolving}
              >
                <SwapIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {!isReverseMode && (
            <FormControl size="small" fullWidth>
              <InputLabel>{t('recordType')}</InputLabel>
              <Select
                value={recordType}
                label={t('recordType')}
                onChange={(e) => setRecordType(e.target.value as any)}
                disabled={isResolving}
              >
                <MenuItem value="ALL">{t('allRecords')}</MenuItem>
                <MenuItem value="A">A (IPv4 Address)</MenuItem>
                <MenuItem value="AAAA">AAAA (IPv6 Address)</MenuItem>
                <MenuItem value="MX">MX (Mail Exchange)</MenuItem>
                <MenuItem value="TXT">TXT (Text Records)</MenuItem>
                <MenuItem value="CNAME">CNAME (Canonical Name)</MenuItem>
                <MenuItem value="NS">NS (Name Server)</MenuItem>
                <MenuItem value="SOA">SOA (Start of Authority)</MenuItem>
              </Select>
            </FormControl>
          )}
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Grid gap={2} direction="row" wrap="wrap">
          <Button
            variant="contained"
            color="primary"
            startIcon={<SearchIcon />}
            onClick={performDNSLookup}
            disabled={isResolving}
            loading={isResolving}
          >
            {isReverseMode ? t('reverseLookup') : t('resolve')}
          </Button>

          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={clearResults}
            disabled={results.length === 0 || isResolving}
          >
            {t('clearResults')}
          </Button>

          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportResults}
            disabled={results.length === 0 || isResolving}
          >
            {t('export')}
          </Button>
        </Grid>
      </ControlSection>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label={`${t('results')} (${results.length})`} />
          <Tab label={`${t('cache')} (${dnsCache.length})`} />
          <Tab label={`${t('history')} (${queryHistory.length})`} />
        </Tabs>
      </Box>

      {/* Tab 0: Results */}
      {activeTab === 0 && (
        <>
          {results.length === 0 ? (
            <ResultsSection background="paper" bordered>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {t('noDNSResults')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('enterDomainToResolve')}
                </Typography>
              </Box>
            </ResultsSection>
          ) : (
            results.map((result) => (
              <ResultsSection key={result.id} background="paper" bordered>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="h6">{result.domain}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('queryTime')}: {result.queryTime}ms • {result.timestamp.toLocaleString()}
                      {result.isReverse && ` • ${t('reverseLookup')}`}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${result.records.length} ${result.records.length !== 1 ? t('recordsLabel') : t('record')}`}
                    size="small"
                    color="primary"
                  />
                </Box>

                <TableContainer component={Paper} sx={{ backgroundColor: 'transparent' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('type')}</TableCell>
                        <TableCell>{t('value')}</TableCell>
                        <TableCell>{t('ttl')}</TableCell>
                        <TableCell>{t('priority')}</TableCell>
                        <TableCell>{t('actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {result.records.map((record, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <RecordChip
                              label={record.type}
                              size="small"
                              color={getRecordColor(record.type)}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace">
                              {record.value}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{formatTTL(record.ttl)}</Typography>
                          </TableCell>
                          <TableCell>
                            {record.priority !== undefined ? record.priority : '-'}
                          </TableCell>
                          <TableCell>
                            <Tooltip title={t('copy')}>
                              <IconButton
                                size="small"
                                onClick={() => copyToClipboard(record.value)}
                              >
                                <CopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </ResultsSection>
            ))
          )}
        </>
      )}

      {/* Tab 1: Cache */}
      {activeTab === 1 && (
        <ResultsSection background="paper" bordered>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">{t('dnsCache')}</Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ClearIcon />}
              onClick={clearCache}
              disabled={dnsCache.length === 0}
            >
              {t('clearCache')}
            </Button>
          </Box>

          {dnsCache.length === 0 ? (
            <Alert severity="info">{t('dnsCacheEmpty')}</Alert>
          ) : (
            <List>
              {dnsCache.map((entry, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemText
                      primary={entry.domain}
                      secondary={
                        <>
                          {entry.records.length} {entry.records.length !== 1 ? t('recordsLabel') : t('record')} • {t('cached')}: {entry.timestamp.toLocaleTimeString()}
                          {' • '}{t('expires')}: {entry.expiresAt.toLocaleTimeString()}
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title={t('loadFromCache')}>
                        <IconButton
                          size="small"
                          onClick={() => loadFromCache(entry.domain)}
                        >
                          <RefreshIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('remove')}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeCacheEntry(entry.domain)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < dnsCache.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </ResultsSection>
      )}

      {/* Tab 3: History */}
      {activeTab === 2 && (
        <ResultsSection background="paper" bordered>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">{t('queryHistory')}</Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ClearIcon />}
              onClick={clearHistory}
              disabled={queryHistory.length === 0}
            >
              {t('clearHistory')}
            </Button>
          </Box>

          {queryHistory.length === 0 ? (
            <Alert severity="info">{t('noQueryHistory')}</Alert>
          ) : (
            <Grid gap={1} direction="row" wrap="wrap">
              {queryHistory.map((item, index) => (
                <Chip
                  key={index}
                  label={item}
                  onClick={() => loadFromHistory(item)}
                  icon={<HistoryIcon />}
                  variant="outlined"
                />
              ))}
            </Grid>
          )}
        </ResultsSection>
      )}
    </Box>
  );
};

export default DNSResolverTool;
