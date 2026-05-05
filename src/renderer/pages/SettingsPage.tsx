import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  FormGroup,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Divider,
  styled,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Palette as PaletteIcon,
  Notifications as NotificationsIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  Keyboard as KeyboardIcon,
} from '@mui/icons-material';
import { Container, Section, Grid } from '../components/Layout';
import { Button } from '../components/Button';
import CredentialManager from '../components/CredentialManager';
import ThemeCustomizer from '../components/ThemeCustomizer';
import KeyboardShortcutsManager from '../components/KeyboardShortcutsManager';
import { useLanguage } from '../contexts/LanguageContext';
import PageTransition from '../components/PageTransition';

const PageHeader = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));

const SettingsSection = styled(Section)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const TabPanel = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3, 0),
}));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const CustomTabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <TabPanel
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
    >
      {value === index && children}
    </TabPanel>
  );
};

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { language, setLanguage, t } = useLanguage();

  // Security settings
  const [autoLock, setAutoLock] = useState(false);
  const [lockTimeout, setLockTimeout] = useState(15);
  const [requireAuth, setRequireAuth] = useState(true);
  const [auditLogging, setAuditLogging] = useState(true);
  const [rateLimiting, setRateLimiting] = useState(true);

  // Theme settings
  const [theme, setTheme] = useState('oled-black');
  const [fontSize, setFontSize] = useState(14);
  const [compactMode, setCompactMode] = useState(true);
  const [animations, setAnimations] = useState(true);

  // Notification settings
  const [scanComplete, setScanComplete] = useState(true);
  const [errorNotifications, setErrorNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Performance settings
  const [maxConcurrent, setMaxConcurrent] = useState(5);
  const [cacheEnabled, setCacheEnabled] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSaveSettings = () => {
    const settings = {
      security: { autoLock, lockTimeout, requireAuth, auditLogging, rateLimiting },
      theme: { theme, fontSize, compactMode, animations },
      notifications: { scanComplete, errorNotifications, soundEnabled },
      performance: { maxConcurrent, cacheEnabled, autoSave },
    };

    localStorage.setItem('app-settings', JSON.stringify(settings));
    alert(t('settingsSaved'));
  };

  const handleResetSettings = () => {
    if (!confirm(t('confirmReset'))) return;

    // Reset to defaults
    setAutoLock(false);
    setLockTimeout(15);
    setRequireAuth(true);
    setAuditLogging(true);
    setRateLimiting(true);
    setTheme('oled-black');
    setFontSize(14);
    setCompactMode(true);
    setAnimations(true);
    setScanComplete(true);
    setErrorNotifications(true);
    setSoundEnabled(false);
    setMaxConcurrent(5);
    setCacheEnabled(true);
    setAutoSave(true);

    localStorage.removeItem('app-settings');
    alert(t('resetToDefaults'));
  };

  return (
    <PageTransition>
      <Container maxWidth="xl">
      <PageHeader>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('settings')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('securitySettingsDesc')}
        </Typography>
      </PageHeader>

      <SettingsSection background="paper" bordered>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="settings tabs"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              minHeight: '48px',
            },
          }}
        >
          <Tab icon={<SecurityIcon />} iconPosition="start" label={t('securitySettings')} />
          <Tab icon={<PaletteIcon />} iconPosition="start" label={t('appearance')} />
          <Tab icon={<NotificationsIcon />} iconPosition="start" label={t('notifications')} />
          <Tab icon={<SpeedIcon />} iconPosition="start" label={t('performance')} />
          <Tab icon={<StorageIcon />} iconPosition="start" label={t('credentials')} />
          <Tab icon={<KeyboardIcon />} iconPosition="start" label={t('shortcuts')} />
        </Tabs>

        {/* Security Tab */}
        <CustomTabPanel value={activeTab} index={0}>
          <Typography variant="h6" gutterBottom>
            {t('securitySettings')}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {t('securitySettingsDesc')}
          </Typography>

          <FormGroup>
            <FormControlLabel
              control={<Switch checked={requireAuth} onChange={(e) => setRequireAuth(e.target.checked)} />}
              label={
                <Box>
                  <Typography variant="body2">{t('requireAuth')}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('requireAuthDesc')}
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={<Switch checked={auditLogging} onChange={(e) => setAuditLogging(e.target.checked)} />}
              label={
                <Box>
                  <Typography variant="body2">{t('auditLogging')}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('auditLoggingDesc')}
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={<Switch checked={rateLimiting} onChange={(e) => setRateLimiting(e.target.checked)} />}
              label={
                <Box>
                  <Typography variant="body2">{t('rateLimiting')}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('rateLimitingDesc')}
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={<Switch checked={autoLock} onChange={(e) => setAutoLock(e.target.checked)} />}
              label={
                <Box>
                  <Typography variant="body2">{t('autoLock')}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('autoLockDesc')}
                  </Typography>
                </Box>
              }
            />
          </FormGroup>

          {autoLock && (
            <Box sx={{ mt: 3, ml: 4 }}>
              <Typography variant="body2" gutterBottom>
                {t('lockTimeout')}: {lockTimeout} {t('minutes')}
              </Typography>
              <Slider
                value={lockTimeout}
                onChange={(e, value) => setLockTimeout(value as number)}
                min={5}
                max={60}
                step={5}
                marks
                valueLabelDisplay="auto"
                sx={{ maxWidth: 400 }}
              />
            </Box>
          )}

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>{t('securityBestPractices')}</strong>
            </Typography>
            <Typography variant="caption" component="div">
              {t('useStrongPasswords')}
            </Typography>
            <Typography variant="caption" component="div">
              {t('enableAuditLogging')}
            </Typography>
            <Typography variant="caption" component="div">
              {t('reviewCredentials')}
            </Typography>
          </Alert>
        </CustomTabPanel>

        {/* Appearance Tab */}
        <CustomTabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>
            {t('appearance')}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {t('appearanceDesc')}
          </Typography>

          {/* Language Selection */}
          <Box sx={{ mb: 4 }}>
            <FormControl fullWidth sx={{ maxWidth: 400 }}>
              <InputLabel>{t('language')}</InputLabel>
              <Select
                value={language}
                label={t('language')}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'ru')}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="ru">Русский</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {t('selectPreferredLanguage')}
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          <ThemeCustomizer />
        </CustomTabPanel>

        {/* Notifications Tab */}
        <CustomTabPanel value={activeTab} index={2}>
          <Typography variant="h6" gutterBottom>
            {t('notificationSettings')}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {t('notificationSettingsDesc')}
          </Typography>

          <FormGroup>
            <FormControlLabel
              control={<Switch checked={scanComplete} onChange={(e) => setScanComplete(e.target.checked)} />}
              label={
                <Box>
                  <Typography variant="body2">{t('scanCompleteNotifications')}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('scanCompleteDesc')}
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={<Switch checked={errorNotifications} onChange={(e) => setErrorNotifications(e.target.checked)} />}
              label={
                <Box>
                  <Typography variant="body2">{t('errorNotifications')}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('errorNotificationsDesc')}
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={<Switch checked={soundEnabled} onChange={(e) => setSoundEnabled(e.target.checked)} />}
              label={
                <Box>
                  <Typography variant="body2">{t('soundEffects')}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('soundEffectsDesc')}
                  </Typography>
                </Box>
              }
            />
          </FormGroup>
        </CustomTabPanel>

        {/* Performance Tab */}
        <CustomTabPanel value={activeTab} index={3}>
          <Typography variant="h6" gutterBottom>
            {t('performanceSettings')}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {t('performanceSettingsDesc')}
          </Typography>

          <Grid gap={3} direction="column">
            <Box>
              <Typography variant="body2" gutterBottom>
                {t('maxConcurrentOperations')}: {maxConcurrent}
              </Typography>
              <Slider
                value={maxConcurrent}
                onChange={(e, value) => setMaxConcurrent(value as number)}
                min={1}
                max={10}
                step={1}
                marks
                valueLabelDisplay="auto"
                sx={{ maxWidth: 400 }}
              />
              <Typography variant="caption" color="text.secondary">
                {t('maxConcurrentDesc')}
              </Typography>
            </Box>

            <FormGroup>
              <FormControlLabel
                control={<Switch checked={cacheEnabled} onChange={(e) => setCacheEnabled(e.target.checked)} />}
                label={
                  <Box>
                    <Typography variant="body2">{t('enableCaching')}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('enableCachingDesc')}
                    </Typography>
                  </Box>
                }
              />

              <FormControlLabel
                control={<Switch checked={autoSave} onChange={(e) => setAutoSave(e.target.checked)} />}
                label={
                  <Box>
                    <Typography variant="body2">{t('autoSaveResults')}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('autoSaveResultsDesc')}
                    </Typography>
                  </Box>
                }
              />
            </FormGroup>
          </Grid>
        </CustomTabPanel>

        {/* Credentials Tab */}
        <CustomTabPanel value={activeTab} index={4}>
          <CredentialManager />
        </CustomTabPanel>

        {/* Shortcuts Tab */}
        <CustomTabPanel value={activeTab} index={5}>
          <KeyboardShortcutsManager />
        </CustomTabPanel>

        {/* Action Buttons */}
        <Divider sx={{ my: 3 }} />
        <Grid gap={2} direction="row" justify="flex-end">
          <Button variant="outlined" onClick={handleResetSettings}>
            {t('resetToDefaults')}
          </Button>
          <Button variant="contained" onClick={handleSaveSettings}>
            {t('saveSettings')}
          </Button>
        </Grid>
      </SettingsSection>
    </Container>
    </PageTransition>
  );
};

export default SettingsPage;