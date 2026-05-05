import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  Divider as MuiDivider,
  styled,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  FolderOpen as FolderOpenIcon,
  History as HistoryIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { Layout, Grid, Section, Divider } from '../Layout';
import { Card } from '../Card';
import { Button } from '../Button';
import { SSHConnection } from '../../types';

// Styled components
const FeatureSection = styled(Section)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const StatusIndicator = styled(Box)<{ status: 'active' | 'inactive' | 'error' }>(
  ({ theme, status }) => {
    const colors = {
      active: theme.palette.success.main,
      inactive: theme.palette.text.secondary,
      error: theme.palette.error.main,
    };

    return {
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      backgroundColor: colors[status],
      display: 'inline-block',
      marginRight: theme.spacing(1),
    };
  }
);

interface PortForward {
  id: string;
  type: 'local' | 'remote' | 'dynamic';
  localPort: number;
  remoteHost: string;
  remotePort: number;
  status: 'active' | 'inactive' | 'error';
  connectionId: string;
}

interface FileTransfer {
  id: string;
  type: 'upload' | 'download';
  localPath: string;
  remotePath: string;
  size: number;
  transferred: number;
  status: 'pending' | 'transferring' | 'completed' | 'error';
  error?: string;
  startTime: Date;
  endTime?: Date;
}

interface SessionLog {
  id: string;
  connectionId: string;
  timestamp: Date;
  type: 'command' | 'output' | 'error' | 'connection' | 'disconnection';
  content: string;
}

interface SSHAdvancedFeaturesProps {
  connections: SSHConnection[];
}

const SSHAdvancedFeatures: React.FC<SSHAdvancedFeaturesProps> = ({ connections }) => {
  const [activeTab, setActiveTab] = useState(0);
  
  // Port Forwarding state
  const [portForwards, setPortForwards] = useState<PortForward[]>([]);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [forwardType, setForwardType] = useState<'local' | 'remote' | 'dynamic'>('local');
  const [localPort, setLocalPort] = useState(8080);
  const [remoteHost, setRemoteHost] = useState('localhost');
  const [remotePort, setRemotePort] = useState(80);
  const [selectedConnection, setSelectedConnection] = useState<string>('');
  
  // File Transfer state
  const [fileTransfers, setFileTransfers] = useState<FileTransfer[]>([]);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferType, setTransferType] = useState<'upload' | 'download'>('upload');
  const [localPath, setLocalPath] = useState('');
  const [remotePath, setRemotePath] = useState('');
  
  // Session Logs state
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);
  const [logFilter, setLogFilter] = useState<string>('all');
  
  // Session Recovery state
  const [disconnectedSessions, setDisconnectedSessions] = useState<SSHConnection[]>([]);
  const [recoveryInProgress, setRecoveryInProgress] = useState<string | null>(null);

  // Initialize session logs for connections
  useEffect(() => {
    connections.forEach(conn => {
      const existingLog = sessionLogs.find(log => 
        log.connectionId === conn.id && log.type === 'connection'
      );
      
      if (!existingLog) {
        addLog(conn.id, 'connection', `Connected to ${conn.host}:${conn.port} as ${conn.username}`);
      }
    });
  }, [connections]);

  // Simulate file transfer progress
  useEffect(() => {
    const interval = setInterval(() => {
      setFileTransfers(prev =>
        prev.map(transfer => {
          if (transfer.status === 'transferring' && transfer.transferred < transfer.size) {
            const increment = Math.min(transfer.size * 0.1, transfer.size - transfer.transferred);
            const newTransferred = transfer.transferred + increment;
            
            if (newTransferred >= transfer.size) {
              return {
                ...transfer,
                transferred: transfer.size,
                status: 'completed',
                endTime: new Date(),
              };
            }
            
            return {
              ...transfer,
              transferred: newTransferred,
            };
          }
          return transfer;
        })
      );
    }, 500);
    
    return () => clearInterval(interval);
  }, []);

  const addLog = (connectionId: string, type: SessionLog['type'], content: string) => {
    const newLog: SessionLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      connectionId,
      timestamp: new Date(),
      type,
      content,
    };
    
    setSessionLogs(prev => [...prev, newLog]);
  };

  // Port Forwarding functions
  const addPortForward = () => {
    if (!selectedConnection) {
      return;
    }
    
    const newForward: PortForward = {
      id: `forward-${Date.now()}`,
      type: forwardType,
      localPort,
      remoteHost,
      remotePort,
      status: 'active',
      connectionId: selectedConnection,
    };
    
    setPortForwards(prev => [...prev, newForward]);
    addLog(selectedConnection, 'command', 
      `Port forward created: ${forwardType} ${localPort} -> ${remoteHost}:${remotePort}`
    );
    
    setForwardDialogOpen(false);
    resetForwardForm();
  };

  const removePortForward = (forwardId: string) => {
    const forward = portForwards.find(f => f.id === forwardId);
    if (forward) {
      addLog(forward.connectionId, 'command', 
        `Port forward removed: ${forward.type} ${forward.localPort} -> ${forward.remoteHost}:${forward.remotePort}`
      );
    }
    
    setPortForwards(prev => prev.filter(f => f.id !== forwardId));
  };

  const togglePortForward = (forwardId: string) => {
    setPortForwards(prev =>
      prev.map(forward =>
        forward.id === forwardId
          ? { ...forward, status: forward.status === 'active' ? 'inactive' : 'active' }
          : forward
      )
    );
  };

  const resetForwardForm = () => {
    setForwardType('local');
    setLocalPort(8080);
    setRemoteHost('localhost');
    setRemotePort(80);
    setSelectedConnection('');
  };

  // File Transfer functions
  const startFileTransfer = () => {
    if (!selectedConnection || !localPath || !remotePath) {
      return;
    }
    
    const fileSize = Math.floor(Math.random() * 10000000) + 1000000; // Random size 1-10MB
    
    const newTransfer: FileTransfer = {
      id: `transfer-${Date.now()}`,
      type: transferType,
      localPath,
      remotePath,
      size: fileSize,
      transferred: 0,
      status: 'transferring',
      startTime: new Date(),
    };
    
    setFileTransfers(prev => [...prev, newTransfer]);
    addLog(selectedConnection, 'command', 
      `File transfer started: ${transferType} ${localPath} ${transferType === 'upload' ? '->' : '<-'} ${remotePath}`
    );
    
    setTransferDialogOpen(false);
    resetTransferForm();
  };

  const cancelFileTransfer = (transferId: string) => {
    setFileTransfers(prev =>
      prev.map(transfer =>
        transfer.id === transferId && transfer.status === 'transferring'
          ? { ...transfer, status: 'error', error: 'Cancelled by user', endTime: new Date() }
          : transfer
      )
    );
  };

  const resetTransferForm = () => {
    setTransferType('upload');
    setLocalPath('');
    setRemotePath('');
    setSelectedConnection('');
  };

  // Session Recovery functions
  const simulateDisconnection = (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (connection) {
      setDisconnectedSessions(prev => [...prev, connection]);
      addLog(connectionId, 'disconnection', `Connection lost to ${connection.host}:${connection.port}`);
    }
  };

  const recoverSession = async (connectionId: string) => {
    setRecoveryInProgress(connectionId);
    
    // Simulate recovery delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const connection = disconnectedSessions.find(c => c.id === connectionId);
    if (connection) {
      addLog(connectionId, 'connection', `Session recovered: ${connection.host}:${connection.port}`);
      setDisconnectedSessions(prev => prev.filter(c => c.id !== connectionId));
    }
    
    setRecoveryInProgress(null);
  };

  // Export logs
  const exportLogs = () => {
    const data = {
      logs: sessionLogs,
      timestamp: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ssh-logs-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDuration = (start: Date, end?: Date): string => {
    const endTime = end || new Date();
    const duration = (endTime.getTime() - start.getTime()) / 1000;
    
    if (duration < 60) return `${duration.toFixed(1)}s`;
    if (duration < 3600) return `${(duration / 60).toFixed(1)}m`;
    return `${(duration / 3600).toFixed(1)}h`;
  };

  const getFilteredLogs = (): SessionLog[] => {
    if (logFilter === 'all') return sessionLogs;
    if (logFilter === 'errors') return sessionLogs.filter(log => log.type === 'error');
    return sessionLogs.filter(log => log.connectionId === logFilter);
  };

  if (connections.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" gutterBottom>
          Нет активных SSH подключений
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Подключитесь к серверу для использования расширенных функций SSH.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Перенаправление портов" />
        <Tab label="Передача файлов (SCP)" />
        <Tab label="Журналы сеансов" />
        <Tab label="Восстановление сеанса" />
      </Tabs>

      {/* Tab 0: Port Forwarding */}
      {activeTab === 0 && (
        <FeatureSection background="paper" bordered>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Перенаправление портов</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setForwardDialogOpen(true)}
            >
              Добавить
            </Button>
          </Box>

          {portForwards.length === 0 ? (
            <Alert severity="info">
              Перенаправления портов не настроены. Нажмите "Добавить" для создания.
            </Alert>
          ) : (
            <TableContainer component={Paper} sx={{ backgroundColor: 'transparent' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Статус</TableCell>
                    <TableCell>Тип</TableCell>
                    <TableCell>Локальный порт</TableCell>
                    <TableCell>Удалённый</TableCell>
                    <TableCell>Подключение</TableCell>
                    <TableCell>Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {portForwards.map((forward) => {
                    const connection = connections.find(c => c.id === forward.connectionId);
                    return (
                      <TableRow key={forward.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <StatusIndicator status={forward.status} />
                            <Typography variant="body2">
                              {forward.status === 'active' ? 'Активно' : forward.status === 'inactive' ? 'Неактивно' : 'Ошибка'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={forward.type} size="small" />
                        </TableCell>
                        <TableCell>{forward.localPort}</TableCell>
                        <TableCell>
                          {forward.remoteHost}:{forward.remotePort}
                        </TableCell>
                        <TableCell>
                          {connection ? `${connection.username}@${connection.host}` : 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <Tooltip title={forward.status === 'active' ? 'Остановить' : 'Запустить'}>
                            <IconButton
                              size="small"
                              onClick={() => togglePortForward(forward.id)}
                            >
                              {forward.status === 'active' ? <StopIcon /> : <StartIcon />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Удалить">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removePortForward(forward.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </FeatureSection>
      )}

      {/* Tab 1: File Transfer */}
      {activeTab === 1 && (
        <FeatureSection background="paper" bordered>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Передача файлов (SCP)</Typography>
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={() => setTransferDialogOpen(true)}
            >
              Новая передача
            </Button>
          </Box>

          {fileTransfers.length === 0 ? (
            <Alert severity="info">
              Нет передач файлов. Нажмите "Новая передача" для загрузки или скачивания файлов.
            </Alert>
          ) : (
            <Box>
              {fileTransfers.map((transfer) => (
                <Card key={transfer.id} sx={{ mb: 2, p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {transfer.type === 'upload' ? <UploadIcon /> : <DownloadIcon />}
                      <Typography variant="body2" fontWeight="bold">
                        {transfer.type === 'upload' ? 'Загрузка' : 'Скачивание'}
                      </Typography>
                      <Chip
                        label={transfer.status}
                        size="small"
                        color={
                          transfer.status === 'completed' ? 'success' :
                          transfer.status === 'error' ? 'error' :
                          transfer.status === 'transferring' ? 'primary' : 'default'
                        }
                      />
                    </Box>
                    {transfer.status === 'transferring' && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => cancelFileTransfer(transfer.id)}
                      >
                        <StopIcon />
                      </IconButton>
                    )}
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {transfer.localPath} {transfer.type === 'upload' ? '→' : '←'} {transfer.remotePath}
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption">
                        {formatBytes(transfer.transferred)} / {formatBytes(transfer.size)}
                      </Typography>
                      <Typography variant="caption">
                        {((transfer.transferred / transfer.size) * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(transfer.transferred / transfer.size) * 100}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Длительность: {formatDuration(transfer.startTime, transfer.endTime)}
                    </Typography>
                    {transfer.error && (
                      <Typography variant="caption" color="error">
                        {transfer.error}
                      </Typography>
                    )}
                  </Box>
                </Card>
              ))}
            </Box>
          )}
        </FeatureSection>
      )}

      {/* Tab 2: Session Logs */}
      {activeTab === 2 && (
        <FeatureSection background="paper" bordered>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Журналы сеансов</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Фильтр</InputLabel>
                <Select
                  value={logFilter}
                  label="Фильтр"
                  onChange={(e) => setLogFilter(e.target.value)}
                >
                  <MenuItem value="all">Все журналы</MenuItem>
                  <MenuItem value="errors">Только ошибки</MenuItem>
                  {connections.map(conn => (
                    <MenuItem key={conn.id} value={conn.id}>
                      {conn.username}@{conn.host}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={exportLogs}
              >
                Экспорт
              </Button>
            </Box>
          </Box>

          {getFilteredLogs().length === 0 ? (
            <Alert severity="info">Нет журналов для отображения.</Alert>
          ) : (
            <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', maxHeight: 400 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Время</TableCell>
                    <TableCell>Тип</TableCell>
                    <TableCell>Подключение</TableCell>
                    <TableCell>Содержимое</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getFilteredLogs().map((log) => {
                    const connection = connections.find(c => c.id === log.connectionId);
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Typography variant="caption">
                            {log.timestamp.toLocaleTimeString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.type}
                            size="small"
                            color={
                              log.type === 'error' ? 'error' :
                              log.type === 'connection' ? 'success' :
                              log.type === 'disconnection' ? 'warning' : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {connection ? `${connection.username}@${connection.host}` : 'Unknown'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{log.content}</Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </FeatureSection>
      )}

      {/* Tab 3: Session Recovery */}
      {activeTab === 3 && (
        <FeatureSection background="paper" bordered>
          <Typography variant="h6" gutterBottom>
            Восстановление сеанса
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Восстановление отключённых SSH сеансов и продолжение работы.
          </Typography>

          {disconnectedSessions.length === 0 ? (
            <Alert severity="success" icon={<CheckCircleIcon />}>
              Все сеансы активны. Восстановление не требуется.
            </Alert>
          ) : (
            <Box>
              <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
                {disconnectedSessions.length} сеанс(ов) отключено. Нажмите "Восстановить" для переподключения.
              </Alert>

              <List>
                {disconnectedSessions.map((session) => (
                  <ListItem key={session.id}>
                    <ListItemText
                      primary={`${session.username}@${session.host}:${session.port}`}
                      secondary={`Последняя активность: ${session.lastActivity.toLocaleString()}`}
                    />
                    <ListItemSecondaryAction>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<RefreshIcon />}
                        onClick={() => recoverSession(session.id)}
                        disabled={recoveryInProgress === session.id}
                        loading={recoveryInProgress === session.id}
                      >
                        Восстановить
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          <MuiDivider sx={{ my: 3 }} />

          <Typography variant="subtitle2" gutterBottom>
            Тест восстановления сеанса
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Симулируйте отключение для проверки функции восстановления.
          </Typography>

          {connections.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 300 }}>
              <InputLabel>Выберите подключение для отключения</InputLabel>
              <Select
                value=""
                label="Выберите подключение для отключения"
                onChange={(e) => simulateDisconnection(e.target.value)}
              >
                {connections.map(conn => (
                  <MenuItem key={conn.id} value={conn.id}>
                    {conn.username}@{conn.host}:{conn.port}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </FeatureSection>
      )}

      {/* Port Forward Dialog */}
      <Dialog
        open={forwardDialogOpen}
        onClose={() => {
          setForwardDialogOpen(false);
          resetForwardForm();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Добавить перенаправление порта</DialogTitle>
        <DialogContent>
          <Grid gap={2} direction="column" sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Подключение</InputLabel>
              <Select
                value={selectedConnection}
                label="Подключение"
                onChange={(e) => setSelectedConnection(e.target.value)}
              >
                {connections.map(conn => (
                  <MenuItem key={conn.id} value={conn.id}>
                    {conn.username}@{conn.host}:{conn.port}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Тип перенаправления</InputLabel>
              <Select
                value={forwardType}
                label="Тип перенаправления"
                onChange={(e) => setForwardType(e.target.value as any)}
              >
                <MenuItem value="local">Локальное (-L)</MenuItem>
                <MenuItem value="remote">Удалённое (-R)</MenuItem>
                <MenuItem value="dynamic">Динамическое (-D)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Локальный порт"
              type="number"
              value={localPort}
              onChange={(e) => setLocalPort(parseInt(e.target.value) || 0)}
              size="small"
              fullWidth
            />

            {forwardType !== 'dynamic' && (
              <>
                <TextField
                  label="Удалённый хост"
                  value={remoteHost}
                  onChange={(e) => setRemoteHost(e.target.value)}
                  size="small"
                  fullWidth
                  placeholder="localhost или IP адрес"
                />

                <TextField
                  label="Удалённый порт"
                  type="number"
                  value={remotePort}
                  onChange={(e) => setRemotePort(parseInt(e.target.value) || 0)}
                  size="small"
                  fullWidth
                />
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setForwardDialogOpen(false);
            resetForwardForm();
          }}>
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={addPortForward}
            disabled={!selectedConnection || localPort <= 0}
          >
            Добавить
          </Button>
        </DialogActions>
      </Dialog>

      {/* File Transfer Dialog */}
      <Dialog
        open={transferDialogOpen}
        onClose={() => {
          setTransferDialogOpen(false);
          resetTransferForm();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Новая передача файлов</DialogTitle>
        <DialogContent>
          <Grid gap={2} direction="column" sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Подключение</InputLabel>
              <Select
                value={selectedConnection}
                label="Подключение"
                onChange={(e) => setSelectedConnection(e.target.value)}
              >
                {connections.map(conn => (
                  <MenuItem key={conn.id} value={conn.id}>
                    {conn.username}@{conn.host}:{conn.port}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Тип передачи</InputLabel>
              <Select
                value={transferType}
                label="Тип передачи"
                onChange={(e) => setTransferType(e.target.value as any)}
              >
                <MenuItem value="upload">Загрузка (Локальный → Удалённый)</MenuItem>
                <MenuItem value="download">Скачивание (Удалённый → Локальный)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Локальный путь"
              value={localPath}
              onChange={(e) => setLocalPath(e.target.value)}
              size="small"
              fullWidth
              placeholder="/путь/к/локальному/файлу"
              InputProps={{
                endAdornment: (
                  <IconButton size="small">
                    <FolderOpenIcon />
                  </IconButton>
                ),
              }}
            />

            <TextField
              label="Удалённый путь"
              value={remotePath}
              onChange={(e) => setRemotePath(e.target.value)}
              size="small"
              fullWidth
              placeholder="/путь/к/удалённому/файлу"
            />
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setTransferDialogOpen(false);
            resetTransferForm();
          }}>
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={startFileTransfer}
            disabled={!selectedConnection || !localPath || !remotePath}
          >
            Начать передачу
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SSHAdvancedFeatures;
