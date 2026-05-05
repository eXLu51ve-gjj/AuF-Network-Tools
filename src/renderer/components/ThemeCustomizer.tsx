import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Slider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
  Grid as MuiGrid,
  Alert,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  styled,
} from '@mui/material';
import {
  Palette as PaletteIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  FileUpload as FileUploadIcon,
  FileDownload as FileDownloadIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { Grid, Section } from './Layout';
import { Button } from './Button';

const ColorPicker = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const ColorSwatch = styled(Box)<{ color: string }>(({ color }) => ({
  width: '48px',
  height: '48px',
  borderRadius: '8px',
  backgroundColor: color,
  border: '2px solid rgba(255, 255, 255, 0.2)',
  cursor: 'pointer',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.1)',
  },
}));

const PreviewCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  marginTop: theme.spacing(2),
}));

export interface ThemeConfig {
  id: string;
  name: string;
  colors: {
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  spacing: {
    base: number;
    compact: boolean;
  };
  typography: {
    fontSize: number;
    fontFamily: string;
  };
  effects: {
    borderRadius: number;
    shadowIntensity: number;
    transitionSpeed: number;
  };
}

const defaultThemes: ThemeConfig[] = [
  {
    id: 'oled-black',
    name: 'OLED Black',
    colors: {
      background: '#000000',
      surface: '#0A0A0A',
      primary: '#00FFFF',
      secondary: '#FF00FF',
      accent: '#FFFF00',
      text: '#FFFFFF',
      textSecondary: '#B0B0B0',
      border: '#333333',
      success: '#00FF00',
      warning: '#FFA500',
      error: '#FF0000',
      info: '#00BFFF',
    },
    spacing: {
      base: 8,
      compact: true,
    },
    typography: {
      fontSize: 14,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    effects: {
      borderRadius: 8,
      shadowIntensity: 0.3,
      transitionSpeed: 200,
    },
  },
  {
    id: 'dark-blue',
    name: 'Dark Blue',
    colors: {
      background: '#0D1117',
      surface: '#161B22',
      primary: '#58A6FF',
      secondary: '#BC8CFF',
      accent: '#FFA657',
      text: '#C9D1D9',
      textSecondary: '#8B949E',
      border: '#30363D',
      success: '#3FB950',
      warning: '#D29922',
      error: '#F85149',
      info: '#58A6FF',
    },
    spacing: {
      base: 8,
      compact: false,
    },
    typography: {
      fontSize: 14,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    effects: {
      borderRadius: 6,
      shadowIntensity: 0.5,
      transitionSpeed: 150,
    },
  },
];

interface ThemeCustomizerProps {
  onThemeChange?: (theme: ThemeConfig) => void;
}

const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({ onThemeChange }) => {
  const [themes, setThemes] = useState<ThemeConfig[]>(defaultThemes);
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(defaultThemes[0]);
  const [previewMode, setPreviewMode] = useState(false);
  const [saveDialog, setSaveDialog] = useState(false);
  const [themeName, setThemeName] = useState('');

  useEffect(() => {
    // Load saved themes
    const saved = localStorage.getItem('custom-themes');
    if (saved) {
      try {
        const customThemes = JSON.parse(saved);
        setThemes([...defaultThemes, ...customThemes]);
      } catch (e) {
        console.error('Failed to load custom themes:', e);
      }
    }

    // Load active theme
    const activeThemeId = localStorage.getItem('active-theme');
    if (activeThemeId) {
      const theme = themes.find((t) => t.id === activeThemeId);
      if (theme) {
        setCurrentTheme(theme);
      }
    }
  }, []);

  const handleColorChange = (colorKey: keyof ThemeConfig['colors'], value: string) => {
    setCurrentTheme({
      ...currentTheme,
      colors: {
        ...currentTheme.colors,
        [colorKey]: value,
      },
    });
  };

  const handleSpacingChange = (key: keyof ThemeConfig['spacing'], value: any) => {
    setCurrentTheme({
      ...currentTheme,
      spacing: {
        ...currentTheme.spacing,
        [key]: value,
      },
    });
  };

  const handleTypographyChange = (key: keyof ThemeConfig['typography'], value: any) => {
    setCurrentTheme({
      ...currentTheme,
      typography: {
        ...currentTheme.typography,
        [key]: value,
      },
    });
  };

  const handleEffectsChange = (key: keyof ThemeConfig['effects'], value: number) => {
    setCurrentTheme({
      ...currentTheme,
      effects: {
        ...currentTheme.effects,
        [key]: value,
      },
    });
  };

  const handleSaveTheme = () => {
    if (!themeName.trim()) return;

    const newTheme: ThemeConfig = {
      ...currentTheme,
      id: `custom-${Date.now()}`,
      name: themeName,
    };

    const customThemes = themes.filter((t) => !defaultThemes.find((dt) => dt.id === t.id));
    const updatedThemes = [...customThemes, newTheme];

    localStorage.setItem('custom-themes', JSON.stringify(updatedThemes));
    setThemes([...defaultThemes, ...updatedThemes]);
    setCurrentTheme(newTheme);
    setSaveDialog(false);
    setThemeName('');
  };

  const handleLoadTheme = (theme: ThemeConfig) => {
    setCurrentTheme(theme);
  };

  const handleApplyTheme = () => {
    localStorage.setItem('active-theme', currentTheme.id);
    if (onThemeChange) {
      onThemeChange(currentTheme);
    }
    alert('Theme applied successfully! Refresh the page to see changes.');
  };

  const handleResetTheme = () => {
    setCurrentTheme(defaultThemes[0]);
  };

  const handleExportTheme = () => {
    const data = JSON.stringify(currentTheme, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `theme-${currentTheme.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportTheme = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const theme = JSON.parse(event.target?.result as string) as ThemeConfig;
          setCurrentTheme(theme);
        } catch (error) {
          alert('Failed to import theme: Invalid file format');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleDeleteTheme = (themeId: string) => {
    if (defaultThemes.find((t) => t.id === themeId)) {
      alert('Cannot delete default themes');
      return;
    }

    if (!confirm('Are you sure you want to delete this theme?')) return;

    const customThemes = themes.filter(
      (t) => !defaultThemes.find((dt) => dt.id === t.id) && t.id !== themeId
    );

    localStorage.setItem('custom-themes', JSON.stringify(customThemes));
    setThemes([...defaultThemes, ...customThemes]);

    if (currentTheme.id === themeId) {
      setCurrentTheme(defaultThemes[0]);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Section background="paper" bordered sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Theme Customizer</Typography>
          <Grid gap={1} direction="row">
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileUploadIcon />}
              onClick={handleImportTheme}
            >
              Import
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileDownloadIcon />}
              onClick={handleExportTheme}
            >
              Export
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={handleResetTheme}
            >
              Reset
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<SaveIcon />}
              onClick={() => setSaveDialog(true)}
            >
              Save As
            </Button>
          </Grid>
        </Box>

        <Alert severity="info">
          Customize colors, spacing, typography, and effects. Changes are previewed in real-time.
        </Alert>
      </Section>

      <MuiGrid container spacing={3}>
        {/* Theme List */}
        <MuiGrid item xs={12} md={3}>
          <Section background="paper" bordered>
            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
              Available Themes
            </Typography>
            <List dense>
              {themes.map((theme) => (
                <ListItem
                  key={theme.id}
                  button
                  selected={currentTheme.id === theme.id}
                  onClick={() => handleLoadTheme(theme)}
                >
                  <ListItemText
                    primary={theme.name}
                    secondary={
                      defaultThemes.find((t) => t.id === theme.id) ? 'Default' : 'Custom'
                    }
                  />
                  {!defaultThemes.find((t) => t.id === theme.id) && (
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTheme(theme.id);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
              ))}
            </List>
          </Section>
        </MuiGrid>

        {/* Customization Options */}
        <MuiGrid item xs={12} md={9}>
          <Section background="paper" bordered>
            <Typography variant="h6" gutterBottom>
              {currentTheme.name}
            </Typography>

            {/* Colors */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                Colors
              </Typography>
              <MuiGrid container spacing={2}>
                {Object.entries(currentTheme.colors).map(([key, value]) => (
                  <MuiGrid item xs={12} sm={6} md={4} key={key}>
                    <ColorPicker>
                      <ColorSwatch color={value} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </Typography>
                        <TextField
                          value={value}
                          onChange={(e) =>
                            handleColorChange(key as keyof ThemeConfig['colors'], e.target.value)
                          }
                          size="small"
                          fullWidth
                          inputProps={{
                            style: { fontFamily: 'monospace', fontSize: '0.75rem' },
                          }}
                        />
                      </Box>
                    </ColorPicker>
                  </MuiGrid>
                ))}
              </MuiGrid>
            </Box>

            {/* Spacing */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                Spacing
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Base Unit: {currentTheme.spacing.base}px
                </Typography>
                <Slider
                  value={currentTheme.spacing.base}
                  onChange={(e, value) => handleSpacingChange('base', value)}
                  min={4}
                  max={16}
                  step={2}
                  marks
                  valueLabelDisplay="auto"
                  sx={{ maxWidth: 400 }}
                />
              </Box>
              <FormControlLabel
                control={
                  <Radio
                    checked={currentTheme.spacing.compact}
                    onChange={(e) => handleSpacingChange('compact', e.target.checked)}
                  />
                }
                label="Compact Mode"
              />
            </Box>

            {/* Typography */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                Typography
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Font Size: {currentTheme.typography.fontSize}px
                </Typography>
                <Slider
                  value={currentTheme.typography.fontSize}
                  onChange={(e, value) => handleTypographyChange('fontSize', value)}
                  min={12}
                  max={18}
                  step={1}
                  marks
                  valueLabelDisplay="auto"
                  sx={{ maxWidth: 400 }}
                />
              </Box>
              <TextField
                label="Font Family"
                value={currentTheme.typography.fontFamily}
                onChange={(e) => handleTypographyChange('fontFamily', e.target.value)}
                size="small"
                fullWidth
                sx={{ maxWidth: 400 }}
              />
            </Box>

            {/* Effects */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                Effects
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Border Radius: {currentTheme.effects.borderRadius}px
                </Typography>
                <Slider
                  value={currentTheme.effects.borderRadius}
                  onChange={(e, value) => handleEffectsChange('borderRadius', value as number)}
                  min={0}
                  max={16}
                  step={2}
                  marks
                  valueLabelDisplay="auto"
                  sx={{ maxWidth: 400 }}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Shadow Intensity: {currentTheme.effects.shadowIntensity}
                </Typography>
                <Slider
                  value={currentTheme.effects.shadowIntensity}
                  onChange={(e, value) => handleEffectsChange('shadowIntensity', value as number)}
                  min={0}
                  max={1}
                  step={0.1}
                  marks
                  valueLabelDisplay="auto"
                  sx={{ maxWidth: 400 }}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Transition Speed: {currentTheme.effects.transitionSpeed}ms
                </Typography>
                <Slider
                  value={currentTheme.effects.transitionSpeed}
                  onChange={(e, value) => handleEffectsChange('transitionSpeed', value as number)}
                  min={0}
                  max={500}
                  step={50}
                  marks
                  valueLabelDisplay="auto"
                  sx={{ maxWidth: 400 }}
                />
              </Box>
            </Box>

            {/* Preview */}
            <Box>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                Preview
              </Typography>
              <PreviewCard
                sx={{
                  backgroundColor: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                  borderRadius: `${currentTheme.effects.borderRadius}px`,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: currentTheme.colors.text,
                    fontSize: `${currentTheme.typography.fontSize + 4}px`,
                  }}
                >
                  Sample Heading
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: currentTheme.colors.textSecondary,
                    fontSize: `${currentTheme.typography.fontSize}px`,
                    mb: 2,
                  }}
                >
                  This is how your theme will look with the current settings.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label="Primary"
                    size="small"
                    sx={{ backgroundColor: currentTheme.colors.primary, color: '#000' }}
                  />
                  <Chip
                    label="Secondary"
                    size="small"
                    sx={{ backgroundColor: currentTheme.colors.secondary, color: '#000' }}
                  />
                  <Chip
                    label="Accent"
                    size="small"
                    sx={{ backgroundColor: currentTheme.colors.accent, color: '#000' }}
                  />
                  <Chip
                    label="Success"
                    size="small"
                    sx={{ backgroundColor: currentTheme.colors.success, color: '#000' }}
                  />
                  <Chip
                    label="Warning"
                    size="small"
                    sx={{ backgroundColor: currentTheme.colors.warning, color: '#000' }}
                  />
                  <Chip
                    label="Error"
                    size="small"
                    sx={{ backgroundColor: currentTheme.colors.error, color: '#FFF' }}
                  />
                </Box>
              </PreviewCard>
            </Box>

            {/* Apply Button */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" onClick={handleApplyTheme} startIcon={<PaletteIcon />}>
                Apply Theme
              </Button>
            </Box>
          </Section>
        </MuiGrid>
      </MuiGrid>

      {/* Save Theme Dialog */}
      <Dialog open={saveDialog} onClose={() => setSaveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Save Custom Theme</DialogTitle>
        <DialogContent>
          <TextField
            label="Theme Name"
            value={themeName}
            onChange={(e) => setThemeName(e.target.value)}
            fullWidth
            autoFocus
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveTheme}
            disabled={!themeName.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ThemeCustomizer;
