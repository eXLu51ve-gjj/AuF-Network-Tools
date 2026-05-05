import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  LinearProgress,
  styled,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Public as PublicIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Section } from '../Layout';
import { Card, CardTitle } from '../Card';
import { Button } from '../Button';
import { useLanguage } from '../../contexts/LanguageContext';

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

interface PortResult {
  port: number;
  state: 'open' | 'closed' | 'filtered' | 'checking';
  responseTime?: number;
  error?: string;
}

// Common ports presets
const COMMON_PORTS = [
  { label: 'HTTP', port: 80 },
  { label: 'HTTPS', port: 443 },
  { label: 'SSH', port: 22 },
  { label: 'FTP', port: 21 },
  { label: 'SMTP', port: 25 },
  { label: 'DNS', port: 53 },
  { label: 'RDP', port: 3389 },
  { label: 'MySQL', port: 3306 },
];

const pollResult = async (requestId: string, nodeKey: string, port: number): Promise<PortResult> => {
  for (let attempt = 0; attempt < 15; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    try {
      const resultResp = await fetch(
        `https://check-host.net/check-result/${requestId}`,
        { headers: { 'Accept': 'application/json' } }
      );
      if (!resultResp.ok) continue;
      const resultData = await resultResp.json();
      const nodeResult = resultData[nodeKey];
      if (nodeResult === null || nodeResult === undefined) continue;
      if (Array.isArray(nodeResult) && nodeResult.length > 0) {
        const result = nodeResult[0];
        if (result && result.time !== undefined) {
          return { port, state: 'open', responseTime: Math.round(result.time * 1000) };
        } else if (result && result.error) {
          const errMsg = result.error.toLowerCase();
          if (errMsg.includes('refused') || errMsg.includes('reset')) {
            return { port, state: 'closed' };
          }
          return { port, state: 'filtered', error: result.error };
        }
      }
    } catch {}
  }
  return { port, state: 'filtered', error: 'Timeout' };
};

const ExternalPortScanner: React.FC = () => {
  const { t } = useLanguage();
  const [host, setHost] = useState('');
  const [portsInput, setPortsInput] = useState('80, 443, 22');
  const [results, setResults] = useState<PortResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [checkedFrom, setCheckedFrom] = useState<string | null>(null);
  const [isDetectingIP, setIsDetectingIP] = useState(false);

  // Auto-detect external IP
  const detectMyIP = async () => {
    setIsDetectingIP(true);
    try {
      const resp = await fetch('https://api.ipify.org?format=json');
      const data = await resp.json();
      if (data.ip) {
        setHost(data.ip);
      }
    } catch {
      try {
        // Fallback
        const resp2 = await fetch('https://api64.ipify.org?format=json');
        const data2 = await resp2.json();
        if (data2.ip) setHost(data2.ip);
      } catch {
        setError('Не удалось определить внешний IP');
      }
    } finally {
      setIsDetectingIP(false);
    }
  };

  const parsePorts = (input: string): number[] => {
    const ports: number[] = [];
    const parts = input.split(',').map(p => p.trim());
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let p = start; p <= end; p++) {
            if (p >= 1 && p <= 65535) ports.push(p);
          }
        }
      } else {
        const port = parseInt(part);
        if (!isNaN(port) && port >= 1 && port <= 65535) {
          ports.push(port);
        }
      }
    }
    return [...new Set(ports)]; // deduplicate
  };

  const checkPortExternal = async (host: string, port: number): Promise<PortResult> => {
    const checkUrl = `https://check-host.net/check-tcp?host=${encodeURIComponent(host)}:${port}&max_nodes=1`;

    const doRequest = async () => {
      const resp = await fetch(checkUrl, { headers: { 'Accept': 'application/json' } });
      if (!resp.ok) return null;
      return await resp.json();
    };

    try {
      let checkData = await doRequest();

      // If rate limited (no request_id), wait 3s and retry
      if (!checkData?.request_id) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        checkData = await doRequest();
      }

      if (!checkData?.request_id) {
        return { port, state: 'filtered', error: 'API rate limit — подождите немного' };
      }

      const nodeKey = Object.keys(checkData.nodes || {})[0];
      if (nodeKey && checkData.nodes[nodeKey]) {
        const nodeInfo = checkData.nodes[nodeKey];
        setCheckedFrom(`${nodeInfo[2]}, ${nodeInfo[1]}`);
      }

      return await pollResult(checkData.request_id, nodeKey, port);
    } catch (err: any) {
      return { port, state: 'filtered', error: err.message };
    }
  };

  const startScan = async () => {
    if (!host.trim()) {
      setError('Введите IP адрес или домен');
      return;
    }

    const ports = parsePorts(portsInput);
    if (ports.length === 0) {
      setError('Введите корректные порты (например: 80, 443, 22 или 8000-8010)');
      return;
    }

    if (ports.length > 20) {
      setError('Максимум 20 портов за раз (ограничение внешнего API)');
      return;
    }

    setIsScanning(true);
    setError(null);
    setCheckedFrom(null);
    setProgress(0);

    // Initialize results as "checking"
    setResults(ports.map(port => ({ port, state: 'checking' as const })));

    // Check ports sequentially with delay to avoid rate limiting
    for (let i = 0; i < ports.length; i++) {
      const port = ports[i];
      
      // Add delay between requests to avoid rate limiting
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      const result = await checkPortExternal(host.trim(), port);
      setResults(prev => prev.map(r => r.port === port ? result : r));
      setProgress(((i + 1) / ports.length) * 100);
    }

    setIsScanning(false);
  };

  const addCommonPort = (port: number) => {
    const current = parsePorts(portsInput);
    if (!current.includes(port)) {
      setPortsInput(prev => prev ? `${prev}, ${port}` : `${port}`);
    }
  };

  const getStateChip = (state: PortResult['state']) => {
    switch (state) {
      case 'open':
        return <OpenChip icon={<CheckCircleIcon />} label="Open" size="small" />;
      case 'closed':
        return <ClosedChip icon={<ErrorIcon />} label="Closed" size="small" />;
      case 'filtered':
        return <FilteredChip icon={<FilterIcon />} label="Filtered" size="small" />;
      case 'checking':
        return <Chip label="Проверяется..." size="small" variant="outlined" />;
    }
  };

  const openCount = results.filter(r => r.state === 'open').length;
  const closedCount = results.filter(r => r.state === 'closed').length;
  const filteredCount = results.filter(r => r.state === 'filtered').length;

  return (
    <Box>
      <Section background="paper" bordered sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <PublicIcon color="primary" />
          <CardTitle>Внешний сканер портов</CardTitle>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Проверяет порты снаружи через внешний сервер (check-host.net). 
          Показывает реальную доступность из интернета — не зависит от вашей локальной сети.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {checkedFrom && (
          <Alert severity="info" sx={{ mb: 2 }} icon={<PublicIcon />}>
            Проверка выполняется с внешнего сервера: <strong>{checkedFrom}</strong>
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 2, minWidth: '200px', display: 'flex', gap: 1 }}>
            <TextField
              label="IP адрес или домен"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="Введите IP или нажмите 'Мой IP'"
              size="small"
              fullWidth
              disabled={isScanning}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PublicIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <Tooltip title="Определить мой внешний IP автоматически">
              <span>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={detectMyIP}
                  disabled={isScanning || isDetectingIP}
                  loading={isDetectingIP}
                  sx={{ whiteSpace: 'nowrap', minWidth: '90px' }}
                >
                  Мой IP
                </Button>
              </span>
            </Tooltip>
          </Box>
          <TextField
            label="Порты (через запятую или диапазон)"
            value={portsInput}
            onChange={(e) => setPortsInput(e.target.value)}
            placeholder="80, 443, 8000-8010"
            size="small"
            sx={{ flex: 3, minWidth: '250px' }}
            disabled={isScanning}
            helperText="Максимум 20 портов. Пример: 80, 443, 22 или 8000-8010"
          />
        </Box>

        {/* Quick port buttons */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
            Быстрый выбор:
          </Typography>
          {COMMON_PORTS.map(({ label, port }) => (
            <Chip
              key={port}
              label={`${label} (${port})`}
              size="small"
              variant="outlined"
              onClick={() => addCommonPort(port)}
              disabled={isScanning}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SearchIcon />}
            onClick={startScan}
            disabled={isScanning}
            loading={isScanning}
          >
            {isScanning ? 'Проверяется...' : 'Проверить снаружи'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={() => { setResults([]); setCheckedFrom(null); setProgress(0); }}
            disabled={results.length === 0 || isScanning}
          >
            {t('clearResults')}
          </Button>
        </Box>

        {isScanning && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Проверка через внешний сервер... {progress.toFixed(0)}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}
      </Section>

      {results.length > 0 && (
        <Section background="paper" bordered sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <CardTitle>Результаты ({results.length} портов)</CardTitle>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <OpenChip icon={<CheckCircleIcon />} label={`${openCount} Open`} size="small" />
              <ClosedChip icon={<ErrorIcon />} label={`${closedCount} Closed`} size="small" />
              <FilteredChip icon={<FilterIcon />} label={`${filteredCount} Filtered`} size="small" />
            </Box>
          </Box>

          <TableContainer component={Paper} sx={{ backgroundColor: 'transparent' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Порт</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell>Время отклика</TableCell>
                  <TableCell>Примечание</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.sort((a, b) => {
                  const order = { open: 0, checking: 1, filtered: 2, closed: 3 };
                  return order[a.state] - order[b.state];
                }).map((result) => (
                  <TableRow
                    key={result.port}
                    sx={{ '&:hover': { backgroundColor: 'rgba(255,255,255,0.03)' } }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
                        {result.port}
                      </Typography>
                    </TableCell>
                    <TableCell>{getStateChip(result.state)}</TableCell>
                    <TableCell>
                      {result.responseTime !== undefined ? (
                        <Typography variant="body2" color="success.main">
                          {result.responseTime}ms
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">—</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {result.error || (result.state === 'open' ? 'Порт доступен из интернета' : result.state === 'closed' ? 'Порт закрыт (RST)' : result.state === 'filtered' ? 'Нет ответа (файрвол)' : '')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Section>
      )}

      {/* Info card */}
      <Section background="paper" bordered>
        <CardTitle>Как это работает</CardTitle>
        <Typography variant="body2" color="text.secondary" paragraph>
          В отличие от обычного сканера, этот инструмент отправляет запросы через внешний сервер 
          <strong> check-host.net</strong> — так вы видите реальную картину из интернета.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <OpenChip label="Open" size="small" sx={{ mr: 1 }} />
            <Typography variant="caption" color="text.secondary">
              Порт доступен из интернета (SYN-ACK)
            </Typography>
          </Box>
          <Box>
            <ClosedChip label="Closed" size="small" sx={{ mr: 1 }} />
            <Typography variant="caption" color="text.secondary">
              Порт закрыт, хост отвечает RST
            </Typography>
          </Box>
          <Box>
            <FilteredChip label="Filtered" size="small" sx={{ mr: 1 }} />
            <Typography variant="caption" color="text.secondary">
              Файрвол блокирует (нет ответа)
            </Typography>
          </Box>
        </Box>
      </Section>
    </Box>
  );
};

export default ExternalPortScanner;
