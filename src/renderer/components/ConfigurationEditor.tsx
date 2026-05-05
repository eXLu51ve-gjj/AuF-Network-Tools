import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  styled,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FileUpload as FileUploadIcon,
  FileDownload as FileDownloadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  MoreVert as MoreVertIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import { Grid, Section, Divider } from './Layout';
import { Button } from './Button';
import {
  ConfigurationParser,
  ValidationError,
  ConfigurationSchema,
} from '../services/ConfigurationParser';

// Styled components
const EditorSection = styled(Section)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const EditorContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
  height: '600px',
}));

const ProfileList = styled(Box)(({ theme }) => ({
  width: '250px',
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  borderRadius: theme.spacing(1),
  border: '1px solid rgba(255, 255, 255, 0.1)',
  overflow: 'auto',
}));

const EditorPane = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const CodeEditor = styled(TextField)(({ theme }) => ({
  flex: 1,
  '& .MuiInputBase-root': {
    fontFamily: 'monospace',
    fontSize: '0.875rem',
    height: '100%',
    alignItems: 'flex-start',
  },
  '& textarea': {
    height: '100% !important',
    overflow: 'auto !important',
  },
}));

const ErrorList = styled(Box)(({ theme }) => ({
  maxHeight: '150px',
  overflow: 'auto',
  backgroundColor: 'rgba(255, 0, 0, 0.05)',
  border: '1px solid rgba(255, 0, 0, 0.3)',
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1),
}));

interface ConfigProfile {
  id: string;
  name: string;
  description: string;
  content: string;
  lastModified: Date;
}

interface ConfigurationEditorProps {
  schema?: ConfigurationSchema;
  onSave?: (profile: ConfigProfile) => void;
}

const ConfigurationEditor: React.FC<ConfigurationEditorProps> = ({ schema, onSave }) => {
  const [profiles, setProfiles] = useState<ConfigProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<ConfigProfile | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isValid, setIsValid] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [newProfileDialog, setNewProfileDialog] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDescription, setNewProfileDescription] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuProfile, setMenuProfile] = useState<ConfigProfile | null>(null);

  // Load profiles from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('config-profiles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const loadedProfiles = parsed.map((p: any) => ({
          ...p,
          lastModified: new Date(p.lastModified),
        }));
        setProfiles(loadedProfiles);
        
        if (loadedProfiles.length > 0) {
          selectProfile(loadedProfiles[0]);
        }
      } catch (e) {
        console.error('Failed to load profiles:', e);
      }
    } else {
      // Create default profile
      const defaultProfile: ConfigProfile = {
        id: 'default',
        name: 'Default Configuration',
        description: 'Default application configuration',
        content: JSON.stringify(
          {
            theme: 'oled-black',
            network: {
              timeout: 5000,
              retries: 3,
            },
            tools: {
              ping: { count: 4, timeout: 1000 },
              traceroute: { maxHops: 30 },
              portScanner: { timeout: 2000 },
            },
          },
          null,
          2
        ),
        lastModified: new Date(),
      };
      
      setProfiles([defaultProfile]);
      selectProfile(defaultProfile);
    }
  }, []);

  // Save profiles to localStorage
  const saveProfiles = (updatedProfiles: ConfigProfile[]) => {
    localStorage.setItem('config-profiles', JSON.stringify(updatedProfiles));
    setProfiles(updatedProfiles);
  };

  // Select profile
  const selectProfile = (profile: ConfigProfile) => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Do you want to discard them?')) {
        return;
      }
    }
    
    setSelectedProfile(profile);
    setEditorContent(profile.content);
    setHasChanges(false);
    validateContent(profile.content);
  };

  // Validate content
  const validateContent = (content: string) => {
    const parseResult = ConfigurationParser.parseJSON(content);
    
    if (!parseResult.success) {
      setIsValid(false);
      setValidationErrors(parseResult.errors || []);
      return;
    }

    if (schema) {
      const errors = ConfigurationParser.validate(parseResult.data, schema);
      setIsValid(errors.length === 0);
      setValidationErrors(errors);
    } else {
      setIsValid(true);
      setValidationErrors([]);
    }
  };

  // Handle content change
  const handleContentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newContent = event.target.value;
    setEditorContent(newContent);
    setHasChanges(true);
    validateContent(newContent);
  };

  // Save current profile
  const saveCurrentProfile = () => {
    if (!selectedProfile || !isValid) return;

    const updatedProfile: ConfigProfile = {
      ...selectedProfile,
      content: editorContent,
      lastModified: new Date(),
    };

    const updatedProfiles = profiles.map((p) =>
      p.id === selectedProfile.id ? updatedProfile : p
    );

    saveProfiles(updatedProfiles);
    setSelectedProfile(updatedProfile);
    setHasChanges(false);

    if (onSave) {
      onSave(updatedProfile);
    }
  };

  // Create new profile
  const createNewProfile = () => {
    if (!newProfileName.trim()) return;

    const newProfile: ConfigProfile = {
      id: `profile-${Date.now()}`,
      name: newProfileName,
      description: newProfileDescription,
      content: '{\n  \n}',
      lastModified: new Date(),
    };

    const updatedProfiles = [...profiles, newProfile];
    saveProfiles(updatedProfiles);
    selectProfile(newProfile);
    
    setNewProfileDialog(false);
    setNewProfileName('');
    setNewProfileDescription('');
  };

  // Delete profile
  const deleteProfile = (profile: ConfigProfile) => {
    if (!confirm(`Are you sure you want to delete "${profile.name}"?`)) return;

    const updatedProfiles = profiles.filter((p) => p.id !== profile.id);
    saveProfiles(updatedProfiles);

    if (selectedProfile?.id === profile.id) {
      if (updatedProfiles.length > 0) {
        selectProfile(updatedProfiles[0]);
      } else {
        setSelectedProfile(null);
        setEditorContent('');
      }
    }

    setMenuAnchor(null);
  };

  // Duplicate profile
  const duplicateProfile = (profile: ConfigProfile) => {
    const newProfile: ConfigProfile = {
      id: `profile-${Date.now()}`,
      name: `${profile.name} (Copy)`,
      description: profile.description,
      content: profile.content,
      lastModified: new Date(),
    };

    const updatedProfiles = [...profiles, newProfile];
    saveProfiles(updatedProfiles);
    selectProfile(newProfile);
    setMenuAnchor(null);
  };

  // Export profile
  const exportProfile = (profile: ConfigProfile) => {
    const blob = new Blob([profile.content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profile.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMenuAnchor(null);
  };

  // Import profile
  const importProfile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const parseResult = ConfigurationParser.parseJSON(content);

        if (parseResult.success) {
          const newProfile: ConfigProfile = {
            id: `profile-${Date.now()}`,
            name: file.name.replace('.json', ''),
            description: 'Imported configuration',
            content,
            lastModified: new Date(),
          };

          const updatedProfiles = [...profiles, newProfile];
          saveProfiles(updatedProfiles);
          selectProfile(newProfile);
        } else {
          alert('Failed to import: Invalid JSON file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Format content
  const formatContent = () => {
    const parseResult = ConfigurationParser.parseJSON(editorContent);
    if (parseResult.success && parseResult.data) {
      const formatted = ConfigurationParser.format(parseResult.data, {
        indent: 2,
        sortKeys: false,
      });
      setEditorContent(formatted);
      setHasChanges(true);
    }
  };

  // Open menu
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, profile: ConfigProfile) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setMenuProfile(profile);
  };

  // Close menu
  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuProfile(null);
  };

  return (
    <Box>
      {/* Header */}
      <EditorSection background="paper" bordered>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Configuration Editor</Typography>
          <Grid gap={1} direction="row">
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setNewProfileDialog(true)}
            >
              New Profile
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileUploadIcon />}
              onClick={importProfile}
            >
              Import
            </Button>
          </Grid>
        </Box>
      </EditorSection>

      {/* Editor */}
      <EditorSection background="paper" bordered>
        <EditorContainer>
          {/* Profile List */}
          <ProfileList>
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <Typography variant="subtitle2" fontWeight="bold">
                Profiles ({profiles.length})
              </Typography>
            </Box>
            <List dense>
              {profiles.map((profile) => (
                <ListItem
                  key={profile.id}
                  disablePadding
                  secondaryAction={
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => handleMenuOpen(e, profile)}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemButton
                    selected={selectedProfile?.id === profile.id}
                    onClick={() => selectProfile(profile)}
                  >
                    <ListItemText
                      primary={profile.name}
                      secondary={profile.description}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </ProfileList>

          {/* Editor Pane */}
          <EditorPane>
            {selectedProfile && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {selectedProfile.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Last modified: {selectedProfile.lastModified.toLocaleString()}
                    </Typography>
                  </Box>
                  <Grid gap={1} direction="row">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<RefreshIcon />}
                      onClick={formatContent}
                      disabled={!isValid}
                    >
                      Format
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<SaveIcon />}
                      onClick={saveCurrentProfile}
                      disabled={!hasChanges || !isValid}
                    >
                      Save
                    </Button>
                  </Grid>
                </Box>

                {/* Validation Status */}
                {isValid ? (
                  <Alert severity="success" icon={<CheckCircleIcon />}>
                    Configuration is valid
                    {hasChanges && ' (unsaved changes)'}
                  </Alert>
                ) : (
                  <Alert severity="error" icon={<ErrorIcon />}>
                    Configuration has {validationErrors.length} error(s)
                  </Alert>
                )}

                {/* Code Editor */}
                <CodeEditor
                  multiline
                  value={editorContent}
                  onChange={handleContentChange}
                  placeholder="Enter JSON configuration..."
                  variant="outlined"
                  error={!isValid}
                />

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <ErrorList>
                    <Typography variant="subtitle2" gutterBottom>
                      Validation Errors:
                    </Typography>
                    {validationErrors.map((error, index) => (
                      <Box key={index} sx={{ mb: 1 }}>
                        <Typography variant="body2" color="error">
                          {error.line > 0 && `Line ${error.line}, Column ${error.column}: `}
                          {error.message}
                        </Typography>
                        {error.suggestion && (
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                            💡 {error.suggestion}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </ErrorList>
                )}
              </>
            )}

            {!selectedProfile && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'text.secondary',
                }}
              >
                <EditIcon sx={{ fontSize: 64, mb: 2 }} />
                <Typography variant="h6">No Profile Selected</Typography>
                <Typography variant="body2">
                  Select a profile from the list or create a new one
                </Typography>
              </Box>
            )}
          </EditorPane>
        </EditorContainer>
      </EditorSection>

      {/* New Profile Dialog */}
      <Dialog open={newProfileDialog} onClose={() => setNewProfileDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Profile</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Profile Name"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={newProfileDescription}
              onChange={(e) => setNewProfileDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewProfileDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={createNewProfile}
            disabled={!newProfileName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Profile Menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            if (menuProfile) duplicateProfile(menuProfile);
          }}
        >
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuProfile) exportProfile(menuProfile);
          }}
        >
          <ListItemIcon>
            <FileDownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuProfile) deleteProfile(menuProfile);
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

export default ConfigurationEditor;
