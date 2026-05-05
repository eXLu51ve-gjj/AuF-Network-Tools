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
  TextField,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  styled,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Keyboard as KeyboardIcon,
  PlayArrow as PlayArrowIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { Grid, Section } from './Layout';
import { Button } from './Button';

const ShortcutChip = styled(Chip)(({ theme }) => ({
  fontFamily: 'monospace',
  fontWeight: 'bold',
  backgroundColor: 'rgba(0, 255, 255, 0.1)',
  border: '1px solid rgba(0, 255, 255, 0.3)',
}));

const KeyCaptureBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  border: '2px dashed rgba(0, 255, 255, 0.5)',
  borderRadius: theme.spacing(1),
  textAlign: 'center',
  backgroundColor: 'rgba(0, 255, 255, 0.05)',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
  },
}));

interface KeyboardShortcut {
  id: string;
  name: string;
  description: string;
  keys: string[];
  action: string;
  category: 'navigation' | 'tools' | 'general' | 'custom';
  enabled: boolean;
}

interface MacroStep {
  type: 'command' | 'delay' | 'keypress';
  value: string;
  delay?: number;
}

interface Macro {
  id: string;
  name: string;
  description: string;
  steps: MacroStep[];
  shortcut?: string[];
}

const defaultShortcuts: KeyboardShortcut[] = [
  {
    id: 'nav-dashboard',
    name: 'Go to Dashboard',
    description: 'Navigate to the dashboard page',
    keys: ['Ctrl', 'Shift', 'D'],
    action: 'navigate:/dashboard',
    category: 'navigation',
    enabled: true,
  },
  {
    id: 'nav-diagnostics',
    name: 'Go to Diagnostics',
    description: 'Navigate to network diagnostics',
    keys: ['Ctrl', 'Shift', 'N'],
    action: 'navigate:/diagnostics',
    category: 'navigation',
    enabled: true,
  },
  {
    id: 'nav-wifi',
    name: 'Go to WiFi Scanner',
    description: 'Navigate to WiFi scanner',
    keys: ['Ctrl', 'Shift', 'W'],
    action: 'navigate:/wifi-scanner',
    category: 'navigation',
    enabled: true,
  },
  {
    id: 'tool-ping',
    name: 'Quick Ping',
    description: 'Open ping tool',
    keys: ['Ctrl', 'P'],
    action: 'tool:ping',
    category: 'tools',
    enabled: true,
  },
  {
    id: 'tool-scan',
    name: 'Start Scan',
    description: 'Start current tool scan',
    keys: ['Ctrl', 'Enter'],
    action: 'tool:start',
    category: 'tools',
    enabled: true,
  },
  {
    id: 'tool-stop',
    name: 'Stop Scan',
    description: 'Stop current tool scan',
    keys: ['Ctrl', 'Shift', 'S'],
    action: 'tool:stop',
    category: 'tools',
    enabled: true,
  },
  {
    id: 'general-search',
    name: 'Search',
    description: 'Focus search input',
    keys: ['Ctrl', 'K'],
    action: 'general:search',
    category: 'general',
    enabled: true,
  },
  {
    id: 'general-settings',
    name: 'Open Settings',
    description: 'Navigate to settings',
    keys: ['Ctrl', ','],
    action: 'navigate:/settings',
    category: 'general',
    enabled: true,
  },
];

const KeyboardShortcutsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>(defaultShortcuts);
  const [macros, setMacros] = useState<Macro[]>([]);
  const [editDialog, setEditDialog] = useState(false);
  const [macroDialog, setMacroDialog] = useState(false);
  const [selectedShortcut, setSelectedShortcut] = useState<KeyboardShortcut | null>(null);
  const [capturedKeys, setCapturedKeys] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Macro form state
  const [macroName, setMacroName] = useState('');
  const [macroDescription, setMacroDescription] = useState('');
  const [macroSteps, setMacroSteps] = useState<MacroStep[]>([]);

  useEffect(() => {
    // Load custom shortcuts
    const saved = localStorage.getItem('keyboard-shortcuts');
    if (saved) {
      try {
        const custom = JSON.parse(saved);
        setShortcuts([...defaultShortcuts, ...custom]);
      } catch (e) {
        console.error('Failed to load shortcuts:', e);
      }
    }

    // Load macros
    const savedMacros = localStorage.getItem('keyboard-macros');
    if (savedMacros) {
      try {
        setMacros(JSON.parse(savedMacros));
      } catch (e) {
        console.error('Failed to load macros:', e);
      }
    }
  }, []);

  const handleKeyCapture = (event: React.KeyboardEvent) => {
    if (!isCapturing) return;

    event.preventDefault();
    event.stopPropagation();

    const keys: string[] = [];
    if (event.ctrlKey) keys.push('Ctrl');
    if (event.shiftKey) keys.push('Shift');
    if (event.altKey) keys.push('Alt');
    if (event.metaKey) keys.push('Meta');

    const key = event.key;
    if (
      key !== 'Control' &&
      key !== 'Shift' &&
      key !== 'Alt' &&
      key !== 'Meta' &&
      key.length === 1
    ) {
      keys.push(key.toUpperCase());
    } else if (
      ['Enter', 'Space', 'Escape', 'Tab', 'Backspace', 'Delete'].includes(key)
    ) {
      keys.push(key);
    }

    if (keys.length > 1) {
      setCapturedKeys(keys);
      checkConflict(keys);
    }
  };

  const checkConflict = (keys: string[]) => {
    const keysStr = keys.join('+');
    const conflict = shortcuts.find(
      (s) =>
        s.enabled &&
        s.id !== selectedShortcut?.id &&
        s.keys.join('+') === keysStr
    );

    if (conflict) {
      setConflictWarning(`Conflict with "${conflict.name}"`);
    } else {
      setConflictWarning(null);
    }
  };

  const handleSaveShortcut = () => {
    if (!selectedShortcut || capturedKeys.length === 0) return;

    const updated = shortcuts.map((s) =>
      s.id === selectedShortcut.id ? { ...s, keys: capturedKeys } : s
    );

    const custom = updated.filter(
      (s) => !defaultShortcuts.find((d) => d.id === s.id)
    );

    localStorage.setItem('keyboard-shortcuts', JSON.stringify(custom));
    setShortcuts(updated);
    setEditDialog(false);
    setCapturedKeys([]);
    setIsCapturing(false);
    setConflictWarning(null);
  };

  const handleToggleShortcut = (id: string) => {
    const updated = shortcuts.map((s) =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    );

    const custom = updated.filter(
      (s) => !defaultShortcuts.find((d) => d.id === s.id)
    );

    localStorage.setItem('keyboard-shortcuts', JSON.stringify(custom));
    setShortcuts(updated);
  };

  const handleResetShortcuts = () => {
    if (!confirm('Reset all shortcuts to defaults?')) return;

    localStorage.removeItem('keyboard-shortcuts');
    setShortcuts(defaultShortcuts);
  };

  const handleAddMacro = () => {
    if (!macroName.trim() || macroSteps.length === 0) return;

    const newMacro: Macro = {
      id: `macro-${Date.now()}`,
      name: macroName,
      description: macroDescription,
      steps: macroSteps,
    };

    const updated = [...macros, newMacro];
    localStorage.setItem('keyboard-macros', JSON.stringify(updated));
    setMacros(updated);
    setMacroDialog(false);
    setMacroName('');
    setMacroDescription('');
    setMacroSteps([]);
  };

  const handleDeleteMacro = (id: string) => {
    if (!confirm('Delete this macro?')) return;

    const updated = macros.filter((m) => m.id !== id);
    localStorage.setItem('keyboard-macros', JSON.stringify(updated));
    setMacros(updated);
  };

  const handlePlayMacro = (macro: Macro) => {
    console.log('Playing macro:', macro.name);
    // In a real implementation, this would execute the macro steps
    alert(`Macro "${macro.name}" would be executed here`);
  };

  const openEditDialog = (shortcut: KeyboardShortcut) => {
    setSelectedShortcut(shortcut);
    setCapturedKeys(shortcut.keys);
    setEditDialog(true);
  };

  const getCategoryColor = (category: KeyboardShortcut['category']) => {
    switch (category) {
      case 'navigation':
        return '#00FFFF';
      case 'tools':
        return '#FF00FF';
      case 'general':
        return '#FFFF00';
      case 'custom':
        return '#00FF00';
      default:
        return '#FFFFFF';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Section background="paper" bordered sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Keyboard Shortcuts & Macros</Typography>
          <Grid gap={1} direction="row">
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={handleResetShortcuts}
            >
              Reset to Defaults
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setMacroDialog(true)}
            >
              Create Macro
            </Button>
          </Grid>
        </Box>
      </Section>

      {/* Tabs */}
      <Section background="paper" bordered>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Shortcuts" />
          <Tab label="Macros" />
        </Tabs>

        {/* Shortcuts Tab */}
        {activeTab === 0 && (
          <Box sx={{ mt: 3 }}>
            <TableContainer component={Paper} sx={{ backgroundColor: 'transparent' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Shortcut</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {shortcuts.map((shortcut) => (
                    <TableRow key={shortcut.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {shortcut.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <ShortcutChip
                          label={shortcut.keys.join(' + ')}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={shortcut.category}
                          size="small"
                          sx={{
                            backgroundColor: `${getCategoryColor(shortcut.category)}20`,
                            borderColor: getCategoryColor(shortcut.category),
                            color: getCategoryColor(shortcut.category),
                          }}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {shortcut.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={shortcut.enabled ? 'Enabled' : 'Disabled'}
                          size="small"
                          color={shortcut.enabled ? 'success' : 'default'}
                          onClick={() => handleToggleShortcut(shortcut.id)}
                          sx={{ cursor: 'pointer' }}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => openEditDialog(shortcut)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Macros Tab */}
        {activeTab === 1 && (
          <Box sx={{ mt: 3 }}>
            {macros.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <KeyboardIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No Macros Created
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create macros to automate repetitive tasks
                </Typography>
              </Box>
            ) : (
              <List>
                {macros.map((macro) => (
                  <ListItem
                    key={macro.id}
                    sx={{
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      mb: 1,
                      borderRadius: 1,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <ListItemText
                      primary={macro.name}
                      secondary={
                        <>
                          <Typography variant="caption" component="div">
                            {macro.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {macro.steps.length} steps
                          </Typography>
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handlePlayMacro(macro)}
                        sx={{ mr: 1 }}
                      >
                        <PlayArrowIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleDeleteMacro(macro.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}
      </Section>

      {/* Edit Shortcut Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Keyboard Shortcut</DialogTitle>
        <DialogContent>
          {selectedShortcut && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>{selectedShortcut.name}</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary" paragraph>
                {selectedShortcut.description}
              </Typography>

              <KeyCaptureBox
                onClick={() => setIsCapturing(true)}
                onKeyDown={handleKeyCapture}
                tabIndex={0}
              >
                {isCapturing ? (
                  <Typography variant="body2" color="primary">
                    Press your desired key combination...
                  </Typography>
                ) : (
                  <Typography variant="body2">
                    Click here and press keys to capture
                  </Typography>
                )}
                {capturedKeys.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <ShortcutChip label={capturedKeys.join(' + ')} />
                  </Box>
                )}
              </KeyCaptureBox>

              {conflictWarning && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  {conflictWarning}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveShortcut}
            disabled={capturedKeys.length === 0 || conflictWarning !== null}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Macro Dialog */}
      <Dialog open={macroDialog} onClose={() => setMacroDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Macro</DialogTitle>
        <DialogContent>
          <Grid gap={2} direction="column" sx={{ mt: 1 }}>
            <TextField
              label="Macro Name"
              value={macroName}
              onChange={(e) => setMacroName(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={macroDescription}
              onChange={(e) => setMacroDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />

            <Alert severity="info">
              Macro functionality is a placeholder. In a full implementation, you would add
              steps like commands, delays, and key presses here.
            </Alert>

            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => {
                setMacroSteps([
                  ...macroSteps,
                  { type: 'command', value: 'example-command' },
                ]);
              }}
            >
              Add Step
            </Button>

            {macroSteps.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Steps ({macroSteps.length}):
                </Typography>
                <List dense>
                  {macroSteps.map((step, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={`${index + 1}. ${step.type}: ${step.value}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMacroDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddMacro}
            disabled={!macroName.trim() || macroSteps.length === 0}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default KeyboardShortcutsManager;
