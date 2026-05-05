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
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider as MuiDivider,
  styled,
} from '@mui/material';
import {
  PlayArrow as ConnectIcon,
  Stop as DisconnectIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  FolderOpen as FolderOpenIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Key as KeyIcon,
  VpnKey as VpnKeyIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { Layout, Grid, Section, Divider } from '../Layout';
import { Card } from '../Card';
import { Button } from '../Button';
import { SSHConnection, ConnectionProfile } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

// Styled components
const ControlSection = styled(Section)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const ConnectionSection = styled(Section)(({ theme }) => ({
  marginTop: theme.spacing(3),
}));

const StatusIndicator = styled(Box)<{ status: 'connected' | 'disconnected' | 'connecting' | 'error' }>(
  ({ theme, status }) => {
    const colors = {
      connected: theme.palette.success.main,
      disconnected: theme.palette.text.secondary,
      connecting: theme.palette.warning.main,
      error: theme.palette.error.main,
    };

    return {
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      backgroundColor: colors[status],
      display: 'inline-block',
      marginRight: theme.spacing(1),
      animation: status === 'connecting' ? 'pulse 1.5s ease-in-out infinite' : 'none',
      '@keyframes pulse': {
        '0%, 100%': { opacity: 1 },
        '50%': { opacity: 0.5 },
      },
    };
  }
);

interface SSHConnectionToolProps {
  onConnect?: (connection: SSHConnection) => void;
  onDisconnect?: (connectionId: string) => void;
  compact?: boolean;
}

const SSHConnectionTool: React.FC<SSHConnectionToolProps> = ({ onConnect, onDisconnect, compact = false }) => {
  const { t } = useLanguage();
  
  // Connection form state
  const [host, setHost] = useState('');
  const [port, setPort] = useState(22);
  const [username, setUsername] = useState('root');
  const [authMethod, setAuthMethod] = useState<'password' | 'key' | 'agent'>('password');
  const [password, setPassword] = useState('');
  const [keyPath, setKeyPath] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Connection state
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'error'>('disconnected');
  const [activeConnections, setActiveConnections] = useState<SSHConnection[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [hostKeyWarning, setHostKeyWarning] = useState<string | null>(null);
  
  // Profile management state
  const [profiles, setProfiles] = useState<ConnectionProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  
  // Form validation
  const [errors, setErrors] = useState<{
    host?: string;
    port?: string;
    username?: string;
    password?: string;
    keyPath?: string;
  }>({});

  // Load profiles from localStorage on mount
  useEffect(() => {
    const savedProfiles = localStorage.getItem('ssh-profiles');
    if (savedProfiles) {
      try {
        setProfiles(JSON.parse(savedProfiles));
      } catch (e) {
        console.error('Failed to load SSH profiles:', e);
      }
    }
  }, []);

  // Save profiles to localStorage
  const saveProfiles = (newProfiles: ConnectionProfile[]) => {
    localStorage.setItem('ssh-profiles', JSON.stringify(newProfiles));
    setProfiles(newProfiles);
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!host.trim()) {
      newErrors.host = 'Host is required';
    } else if (!/^[a-zA-Z0-9.-]+$/.test(host)) {
      newErrors.host = 'Invalid host format';
    }
    
    if (port < 1 || port > 65535) {
      newErrors.port = 'Port must be between 1 and 65535';
    }
    
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (authMethod === 'password' && !password) {
      newErrors.password = 'Password is required';
    }
    
    if (authMethod === 'key' && !keyPath.trim()) {
      newErrors.keyPath = 'Key path is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Real SSH connection
  const handleConnect = async () => {
    if (!validateForm()) {
      return;
    }
    
    setConnectionStatus('connecting');
    setConnectionError(null);
    setHostKeyWarning(null);
    
    try {
      const result = await window.electronAPI.sshConnect({
        host,
        port,
        username,
        authMethod,
        password: authMethod === 'password' ? password : undefined,
        keyPath: authMethod === 'key' ? keyPath : undefined,
      });

      if (result.success && result.connectionId) {
        const newConnection: SSHConnection = {
          id: result.connectionId,
          host,
          port,
          username,
          authMethod,
          connected: true,
          lastActivity: new Date(),
        };
        
        setActiveConnections(prev => [...prev, newConnection]);
        setConnectionStatus('connected');
        setConnectionError(null);
        
        if (onConnect) {
          onConnect(newConnection);
        }
        
        // Reset password for security
        setPassword('');
      } else {
        setConnectionError(result.error || 'Connection failed');
        setConnectionStatus('error');
      }
    } catch (err) {
      setConnectionError('Connection error occurred');
      setConnectionStatus('error');
    }
  };

  // Disconnect SSH connection
  const handleDisconnect = async (connectionId: string) => {
    try {
      await window.electronAPI.sshDisconnect(connectionId);
    } catch (err) {
      console.error('Disconnect error:', err);
    }
    
    setActiveConnections(prev => prev.filter(conn => conn.id !== connectionId));
    
    if (onDisconnect) {
      onDisconnect(connectionId);
    }
    
    if (activeConnections.length <= 1) {
      setConnectionStatus('disconnected');
    }
  };

  // Load profile into form
  const loadProfile = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      setHost(profile.host);
      setPort(profile.port);
      setUsername(profile.username);
      setAuthMethod(profile.authMethod);
      setKeyPath(profile.keyPath || '');
      setSelectedProfile(profileId);
    }
  };

  // Save current connection as profile
  const saveAsProfile = () => {
    if (!validateForm() || !profileName.trim()) {
      return;
    }
    
    const newProfile: ConnectionProfile = {
      id: editingProfile || `profile-${Date.now()}`,
      name: profileName,
      host,
      port,
      username,
      authMethod,
      keyPath: authMethod === 'key' ? keyPath : undefined,
      timeout: 30,
    };
    
    let newProfiles: ConnectionProfile[];
    if (editingProfile) {
      newProfiles = profiles.map(p => p.id === editingProfile ? newProfile : p);
    } else {
      newProfiles = [...profiles, newProfile];
    }
    
    saveProfiles(newProfiles);
    setProfileDialogOpen(false);
    setProfileName('');
    setEditingProfile(null);
  };

  // Delete profile
  const deleteProfile = (profileId: string) => {
    const newProfiles = profiles.filter(p => p.id !== profileId);
    saveProfiles(newProfiles);
    
    if (selectedProfile === profileId) {
      setSelectedProfile('');
    }
  };

  // Open edit profile dialog
  const openEditProfile = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      setProfileName(profile.name);
      setEditingProfile(profileId);
      setProfileDialogOpen(true);
    }
  };

  return (
    <Box>
      <ControlSection background="paper" bordered>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            {t('sshConnection')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StatusIndicator status={connectionStatus} />
            <Typography variant="body2" color="text.secondary">
              {connectionStatus === 'connected' && `${t('connected')} (${activeConnections.length})`}
              {connectionStatus === 'disconnected' && t('disconnected')}
              {connectionStatus === 'connecting' && 'Connecting...'}
              {connectionStatus === 'error' && 'Connection Failed'}
            </Typography>
          </Box>
        </Box>
        
        {/* Connection Error Alert */}
        {connectionError && (
          <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 2 }} onClose={() => setConnectionError(null)}>
            <Typography variant="body2">{connectionError}</Typography>
          </Alert>
        )}
        
        {/* Host Key Warning */}
        {hostKeyWarning && (
          <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }} onClose={() => setHostKeyWarning(null)}>
            <Typography variant="body2">{hostKeyWarning}</Typography>
            <Box sx={{ mt: 1 }}>
              <Button size="small" variant="outlined" color="warning" onClick={() => setHostKeyWarning(null)}>
                Accept Risk & Continue
              </Button>
            </Box>
          </Alert>
        )}
        
        {/* Profile Selection */}
        <Box sx={{ mb: 3 }}>
          <Grid gap={2} direction="row" wrap="wrap">
            <FormControl size="small" sx={{ flex: 1, minWidth: '200px' }}>
              <InputLabel>{t('loadProfile')}</InputLabel>
              <Select
                value={selectedProfile}
                label={t('loadProfile')}
                onChange={(e) => loadProfile(e.target.value)}
                disabled={connectionStatus === 'connecting'}
              >
                <MenuItem value="">
                  <em>New Connection</em>
                </MenuItem>
                {profiles.map((profile) => (
                  <MenuItem key={profile.id} value={profile.id}>
                    {profile.name} ({profile.username}@{profile.host})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={() => {
                setProfileName('');
                setEditingProfile(null);
                setProfileDialogOpen(true);
              }}
              disabled={connectionStatus === 'connecting'}
            >
              {t('saveProfile')}
            </Button>
          </Grid>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Connection Form */}
        <Grid gap={2} direction="column">
          <Grid gap={2} direction="row" wrap="wrap">
            <TextField
              label={t('host')}
              value={host}
              onChange={(e) => setHost(e.target.value)}
              error={!!errors.host}
              helperText={errors.host}
              size="small"
              sx={{ flex: 2, minWidth: '200px' }}
              disabled={connectionStatus === 'connecting'}
              placeholder="example.com or 192.168.1.1"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              label={t('port')}
              type="number"
              value={port}
              onChange={(e) => setPort(parseInt(e.target.value) || 22)}
              error={!!errors.port}
              helperText={errors.port}
              size="small"
              sx={{ flex: 1, minWidth: '100px' }}
              disabled={connectionStatus === 'connecting'}
            />
          </Grid>
          
          <TextField
            label={t('username')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={!!errors.username}
            helperText={errors.username}
            size="small"
            fullWidth
            disabled={connectionStatus === 'connecting'}
            placeholder="root, admin, etc."
          />
          
          <FormControl size="small" fullWidth>
            <InputLabel>{t('authenticationMethod')}</InputLabel>
            <Select
              value={authMethod}
              label={t('authenticationMethod')}
              onChange={(e) => setAuthMethod(e.target.value as any)}
              disabled={connectionStatus === 'connecting'}
            >
              <MenuItem value="password">{t('password')}</MenuItem>
              <MenuItem value="key">Private Key</MenuItem>
              <MenuItem value="agent">SSH Agent</MenuItem>
            </Select>
          </FormControl>
          
          {authMethod === 'password' && (
            <TextField
              label={t('password')}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!errors.password}
              helperText={errors.password}
              size="small"
              fullWidth
              disabled={connectionStatus === 'connecting'}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}
          
          {authMethod === 'key' && (
            <TextField
              label="Private Key Path"
              value={keyPath}
              onChange={(e) => setKeyPath(e.target.value)}
              error={!!errors.keyPath}
              helperText={errors.keyPath || 'Path to your private key file (e.g., ~/.ssh/id_rsa)'}
              size="small"
              fullWidth
              disabled={connectionStatus === 'connecting'}
              placeholder="~/.ssh/id_rsa"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <KeyIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" edge="end">
                      <FolderOpenIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}
          
          {authMethod === 'agent' && (
            <Alert severity="info" icon={<VpnKeyIcon />}>
              <Typography variant="body2">
                Using SSH Agent for authentication. Make sure your SSH agent is running and has your keys loaded.
              </Typography>
            </Alert>
          )}
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid gap={2} direction="row" wrap="wrap">
          <Button
            variant="contained"
            color="primary"
            startIcon={<ConnectIcon />}
            onClick={handleConnect}
            disabled={connectionStatus === 'connecting'}
            loading={connectionStatus === 'connecting'}
          >
            {t('connect')}
          </Button>
          
          {connectionStatus === 'connected' && (
            <Chip
              icon={<CheckCircleIcon />}
              label={`${activeConnections.length} active connection${activeConnections.length !== 1 ? 's' : ''}`}
              color="success"
            />
          )}
        </Grid>
      </ControlSection>
      
      {/* Active Connections */}
      {activeConnections.length > 0 && (
        <ConnectionSection background="paper" bordered>
          <Typography variant="h6" gutterBottom>
            Active Connections
          </Typography>
          
          <TableContainer component={Paper} sx={{ backgroundColor: 'transparent' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('host')}</TableCell>
                  <TableCell>{t('username')}</TableCell>
                  <TableCell>{t('port')}</TableCell>
                  <TableCell>Auth Method</TableCell>
                  <TableCell>Last Activity</TableCell>
                  <TableCell>{t('actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeConnections.map((connection) => (
                  <TableRow key={connection.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StatusIndicator status="connected" />
                        <Typography variant="body2">{connection.host}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{connection.username}</TableCell>
                    <TableCell>{connection.port}</TableCell>
                    <TableCell>
                      <Chip
                        label={connection.authMethod}
                        size="small"
                        color={connection.authMethod === 'key' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{connection.lastActivity.toLocaleTimeString()}</TableCell>
                    <TableCell>
                      <Tooltip title="Disconnect">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDisconnect(connection.id)}
                        >
                          <DisconnectIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </ConnectionSection>
      )}
      
      {/* Saved Profiles */}
      {profiles.length > 0 && (
        <ConnectionSection background="paper" bordered>
          <Typography variant="h6" gutterBottom>
            Saved Profiles ({profiles.length})
          </Typography>
          
          <List>
            {profiles.map((profile, index) => (
              <React.Fragment key={profile.id}>
                {index > 0 && <MuiDivider />}
                <ListItem>
                  <ListItemText
                    primary={profile.name}
                    secondary={`${profile.username}@${profile.host}:${profile.port} (${profile.authMethod})`}
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title={t('edit')}>
                      <IconButton
                        size="small"
                        onClick={() => openEditProfile(profile.id)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('delete')}>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => deleteProfile(profile.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </ConnectionSection>
      )}
      
      {/* Save Profile Dialog */}
      <Dialog
        open={profileDialogOpen}
        onClose={() => {
          setProfileDialogOpen(false);
          setProfileName('');
          setEditingProfile(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingProfile ? 'Edit Profile' : 'Save Connection Profile'}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Profile Name"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            fullWidth
            size="small"
            sx={{ mt: 2 }}
            placeholder="My Server, Production DB, etc."
            autoFocus
          />
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Connection Details:
            </Typography>
            <Typography variant="body2">
              {t('host')}: {host}:{port}
            </Typography>
            <Typography variant="body2">
              {t('username')}: {username}
            </Typography>
            <Typography variant="body2">
              Auth: {authMethod}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setProfileDialogOpen(false);
              setProfileName('');
              setEditingProfile(null);
            }}
          >
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={saveAsProfile}
            disabled={!profileName.trim()}
          >
            {editingProfile ? 'Update' : t('save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SSHConnectionTool;
