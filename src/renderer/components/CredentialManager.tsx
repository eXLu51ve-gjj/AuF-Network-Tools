import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Alert,
  Chip,
  Menu,
  styled,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Key as KeyIcon,
  Lock as LockIcon,
  VpnKey as VpnKeyIcon,
  Token as TokenIcon,
  MoreVert as MoreVertIcon,
  FileUpload as FileUploadIcon,
  FileDownload as FileDownloadIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { Grid, Section } from './Layout';
import { Button } from './Button';
import { SecureStorage, StoredCredential } from '../services/SecureStorage';

const CredentialList = styled(List)(({ theme }) => ({
  maxHeight: '500px',
  overflow: 'auto',
}));

const CredentialItem = styled(ListItem)(({ theme }) => ({
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  marginBottom: theme.spacing(1),
  borderRadius: theme.spacing(1),
  border: '1px solid rgba(255, 255, 255, 0.1)',
  '&:hover': {
    backgroundColor: 'rgba(0, 255, 255, 0.05)',
    borderColor: 'rgba(0, 255, 255, 0.3)',
  },
}));

interface CredentialManagerProps {
  onSelect?: (credentialId: string) => void;
}

const CredentialManager: React.FC<CredentialManagerProps> = ({ onSelect }) => {
  const [credentials, setCredentials] = useState<StoredCredential[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<StoredCredential | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuCredential, setMenuCredential] = useState<StoredCredential | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<StoredCredential['type']>('password');
  const [formUsername, setFormUsername] = useState('');
  const [formValue, setFormValue] = useState('');
  const [showValue, setShowValue] = useState(false);
  const [viewedValue, setViewedValue] = useState('');

  // Initialize secure storage
  useEffect(() => {
    SecureStorage.initialize().then(() => {
      loadCredentials();
    });
  }, []);

  const loadCredentials = async () => {
    const creds = await SecureStorage.getAllCredentials();
    setCredentials(creds);
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      const results = await SecureStorage.searchCredentials(searchQuery);
      setCredentials(results);
    } else {
      loadCredentials();
    }
  };

  const handleAddCredential = async () => {
    try {
      await SecureStorage.storeCredential(
        formName,
        formType,
        formValue,
        formUsername || undefined
      );
      
      resetForm();
      setAddDialog(false);
      loadCredentials();
    } catch (error) {
      console.error('Failed to add credential:', error);
      alert('Failed to add credential');
    }
  };

  const handleEditCredential = async () => {
    if (!selectedCredential) return;

    try {
      await SecureStorage.updateCredential(selectedCredential.id, {
        name: formName,
        username: formUsername || undefined,
        value: formValue || undefined,
      });

      resetForm();
      setEditDialog(false);
      setSelectedCredential(null);
      loadCredentials();
    } catch (error) {
      console.error('Failed to update credential:', error);
      alert('Failed to update credential');
    }
  };

  const handleDeleteCredential = async (credential: StoredCredential) => {
    if (!confirm(`Are you sure you want to delete "${credential.name}"?`)) return;

    try {
      await SecureStorage.deleteCredential(credential.id);
      loadCredentials();
      setMenuAnchor(null);
    } catch (error) {
      console.error('Failed to delete credential:', error);
      alert('Failed to delete credential');
    }
  };

  const handleViewCredential = async (credential: StoredCredential) => {
    try {
      const value = await SecureStorage.getCredential(credential.id);
      setViewedValue(value);
      setSelectedCredential(credential);
      setViewDialog(true);
      setMenuAnchor(null);
    } catch (error) {
      console.error('Failed to view credential:', error);
      alert('Failed to view credential');
    }
  };

  const handleExport = async () => {
    try {
      const data = await SecureStorage.exportCredentials();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `credentials-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export credentials:', error);
      alert('Failed to export credentials');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = event.target?.result as string;
          const count = await SecureStorage.importCredentials(data);
          alert(`Successfully imported ${count} credentials`);
          loadCredentials();
        } catch (error) {
          console.error('Failed to import credentials:', error);
          alert('Failed to import credentials');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const openEditDialog = (credential: StoredCredential) => {
    setSelectedCredential(credential);
    setFormName(credential.name);
    setFormType(credential.type);
    setFormUsername(credential.username || '');
    setFormValue('');
    setEditDialog(true);
    setMenuAnchor(null);
  };

  const resetForm = () => {
    setFormName('');
    setFormType('password');
    setFormUsername('');
    setFormValue('');
    setShowValue(false);
  };

  const getTypeIcon = (type: StoredCredential['type']) => {
    switch (type) {
      case 'password':
        return <LockIcon />;
      case 'ssh-key':
        return <VpnKeyIcon />;
      case 'api-key':
        return <KeyIcon />;
      case 'token':
        return <TokenIcon />;
      default:
        return <KeyIcon />;
    }
  };

  const getTypeColor = (type: StoredCredential['type']) => {
    switch (type) {
      case 'password':
        return '#00FFFF';
      case 'ssh-key':
        return '#FF00FF';
      case 'api-key':
        return '#FFFF00';
      case 'token':
        return '#00FF00';
      default:
        return '#FFFFFF';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Section background="paper" bordered sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Credential Manager</Typography>
          <Grid gap={1} direction="row">
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileUploadIcon />}
              onClick={handleImport}
            >
              Import
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileDownloadIcon />}
              onClick={handleExport}
              disabled={credentials.length === 0}
            >
              Export
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setAddDialog(true)}
            >
              Add Credential
            </Button>
          </Grid>
        </Box>

        <TextField
          placeholder="Search credentials..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Section>

      {/* Credentials List */}
      <Section background="paper" bordered>
        {credentials.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <LockIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Credentials Stored
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add credentials to securely store passwords, SSH keys, and API tokens
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {credentials.length} credential{credentials.length !== 1 ? 's' : ''} stored
            </Typography>
            <CredentialList>
              {credentials.map((credential) => (
                <CredentialItem key={credential.id}>
                  <ListItemIcon sx={{ color: getTypeColor(credential.type) }}>
                    {getTypeIcon(credential.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={credential.name}
                    secondary={
                      <Box>
                        <Typography variant="caption" component="span">
                          {credential.username && `${credential.username} • `}
                          {credential.type}
                        </Typography>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          Created: {credential.createdAt.toLocaleDateString()}
                          {credential.lastUsed && ` • Last used: ${credential.lastUsed.toLocaleDateString()}`}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => {
                        setMenuAnchor(e.currentTarget);
                        setMenuCredential(credential);
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </CredentialItem>
              ))}
            </CredentialList>
          </>
        )}
      </Section>

      {/* Add Credential Dialog */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Credential</DialogTitle>
        <DialogContent>
          <Grid gap={2} direction="column" sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              fullWidth
              required
            />

            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={formType}
                label="Type"
                onChange={(e) => setFormType(e.target.value as any)}
              >
                <MenuItem value="password">Password</MenuItem>
                <MenuItem value="ssh-key">SSH Key</MenuItem>
                <MenuItem value="api-key">API Key</MenuItem>
                <MenuItem value="token">Token</MenuItem>
              </Select>
            </FormControl>

            {(formType === 'password' || formType === 'ssh-key') && (
              <TextField
                label="Username"
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                fullWidth
              />
            )}

            <TextField
              label={formType === 'password' ? 'Password' : 'Value'}
              value={formValue}
              onChange={(e) => setFormValue(e.target.value)}
              type={showValue ? 'text' : 'password'}
              fullWidth
              required
              multiline={formType === 'ssh-key'}
              rows={formType === 'ssh-key' ? 4 : 1}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowValue(!showValue)}
                      edge="end"
                      size="small"
                    >
                      {showValue ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setAddDialog(false); resetForm(); }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddCredential}
            disabled={!formName.trim() || !formValue.trim()}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Credential Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Credential</DialogTitle>
        <DialogContent>
          <Grid gap={2} direction="column" sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              fullWidth
              required
            />

            <TextField
              label="Username"
              value={formUsername}
              onChange={(e) => setFormUsername(e.target.value)}
              fullWidth
            />

            <TextField
              label="New Value (leave empty to keep current)"
              value={formValue}
              onChange={(e) => setFormValue(e.target.value)}
              type={showValue ? 'text' : 'password'}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowValue(!showValue)}
                      edge="end"
                      size="small"
                    >
                      {showValue ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setEditDialog(false); resetForm(); }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleEditCredential}
            disabled={!formName.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Credential Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>View Credential</DialogTitle>
        <DialogContent>
          {selectedCredential && (
            <Grid gap={2} direction="column">
              <Alert severity="warning">
                Keep this information secure. Do not share it with others.
              </Alert>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1">{selectedCredential.name}</Typography>
              </Box>

              {selectedCredential.username && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Username
                  </Typography>
                  <Typography variant="body1">{selectedCredential.username}</Typography>
                </Box>
              )}

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Value
                </Typography>
                <TextField
                  value={viewedValue}
                  fullWidth
                  multiline
                  rows={4}
                  InputProps={{
                    readOnly: true,
                    sx: { fontFamily: 'monospace', fontSize: '0.875rem' },
                  }}
                />
              </Box>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem
          onClick={() => {
            if (menuCredential) handleViewCredential(menuCredential);
          }}
        >
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuCredential) openEditDialog(menuCredential);
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuCredential) handleDeleteCredential(menuCredential);
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default CredentialManager;
