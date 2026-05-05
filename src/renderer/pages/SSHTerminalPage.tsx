import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Chip,
  Collapse,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  styled,
  Tab,
  Tabs,
  Menu,
  Button as MuiButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Terminal as TerminalIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Circle as CircleIcon,
  Close as CloseIcon,
  Bookmark as BookmarkIcon,
  Tune as TuneIcon,
  ExpandLess,
  ExpandMore,
  Folder as FolderIcon,
  Palette as PaletteIcon,
  Key as KeyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import SSHConnectionTool from '../components/tools/SSHConnectionTool';
import SSHTerminal from '../components/tools/SSHTerminal';
import SSHFileManager from '../components/tools/SSHFileManager';
import { SSH_THEMES, getTheme, SSHTheme, TERMINAL_FONTS, getFont } from '../components/tools/SSHThemes';
import PageTransition from '../components/PageTransition';
import { SSHConnection, ConnectionProfile } from '../types';

// ─── Styled ───────────────────────────────────────────────────────────────────

const PageContainer = styled(Box)({ display: 'flex', height: '100%', overflow: 'hidden' });

const MainArea = styled(Box)({ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#000' });

const TabBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: '#111',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
  minHeight: '30px',
  paddingLeft: '4px',
  gap: '2px',
  overflowX: 'auto',
  '&::-webkit-scrollbar': { height: '3px' },
  '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.2)' },
}));

const SessionTab = styled(Box)<{ active?: boolean }>(({ theme, active }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 12px 4px 10px',
  borderRadius: '4px 4px 0 0',
  cursor: 'pointer',
  fontSize: '12px',
  fontFamily: 'monospace',
  whiteSpace: 'nowrap',
  backgroundColor: active ? '#000' : 'transparent',
  color: active ? '#00ffff' : 'rgba(255,255,255,0.5)',
  borderTop: active ? '1px solid rgba(0,255,255,0.4)' : '1px solid transparent',
  borderLeft: active ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
  borderRight: active ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
  '&:hover': { backgroundColor: active ? '#000' : 'rgba(255,255,255,0.05)', color: active ? '#00ffff' : 'rgba(255,255,255,0.8)' },
}));

const AddTabBtn = styled(IconButton)({
  width: '26px',
  height: '26px',
  borderRadius: '4px',
  color: 'rgba(255,255,255,0.4)',
  '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' },
});

const Sidebar = styled(Box)(({ theme }) => ({
  width: '260px',
  minWidth: '260px',
  backgroundColor: '#0f0f0f',
  borderLeft: '1px solid rgba(255,255,255,0.08)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
}));

const SidebarNav = styled(Box)({
  display: 'flex',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  padding: '2px',
  gap: '2px',
});

const NavBtn = styled(IconButton)<{ active?: boolean }>(({ active }) => ({
  flex: 1,
  borderRadius: '4px',
  height: '28px',
  color: active ? '#00ffff' : 'rgba(255,255,255,0.4)',
  backgroundColor: active ? 'rgba(0,255,255,0.08)' : 'transparent',
  '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
}));

const SidebarContent = styled(Box)({
  flex: 1,
  overflowY: 'auto',
  '&::-webkit-scrollbar': { width: '4px' },
  '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.15)', borderRadius: '2px' },
});

const EmptyTerminal = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#000',
  color: 'rgba(255,255,255,0.2)',
});

// ─── Types ────────────────────────────────────────────────────────────────────

type TabType = 'terminal' | 'files';
type SidebarView = 'connect' | 'themes' | 'advanced';

interface AppTab {
  id: string;
  type: TabType;
  connection: SSHConnection;
  label: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const SSHTerminalPage: React.FC = () => {
  const [activeConnections, setActiveConnections] = useState<SSHConnection[]>([]);
  const [tabs, setTabs] = useState<AppTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [sidebarView, setSidebarView] = useState<SidebarView>('connect');
  const [connectionsExpanded, setConnectionsExpanded] = useState(true);
  const [currentThemeId, setCurrentThemeId] = useState('github-dark');
  const [currentFontId, setCurrentFontId] = useState('cascadia-code');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewTabMenu, setShowNewTabMenu] = useState<SSHConnection | null>(null);
  const [newTabMenuAnchor, setNewTabMenuAnchor] = useState<HTMLElement | null>(null);
  
  // Panel visibility
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  
  // Custom theme colors
  const [customColors, setCustomColors] = useState({
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    cursor: '#00d9ff',
    error: '#f44747',
    success: '#4ec9b0',
    info: '#00d9ff',
  });

  // Profile management state
  const [savedProfiles, setSavedProfiles] = useState<ConnectionProfile[]>([]);
  const [host, setHost] = useState('');
  const [port, setPort] = useState(22);
  const [username, setUsername] = useState('root');
  const [password, setPassword] = useState('');
  const [authMethod, setAuthMethod] = useState<'password' | 'key' | 'agent'>('password');
  const [profileName, setProfileName] = useState('');
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

  // Accordion state
  const [profilesExpanded, setProfilesExpanded] = useState(true);
  const [themesExpanded, setThemesExpanded] = useState(false);
  const [advancedExpanded, setAdvancedExpanded] = useState(false);

  // Minimap state
  const [showMinimap, setShowMinimap] = useState(false);

  // Profile context menu state
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<HTMLElement | null>(null);
  const [selectedProfileForMenu, setSelectedProfileForMenu] = useState<string | null>(null);

  // Quick connect dialog state
  const [quickConnectOpen, setQuickConnectOpen] = useState(false);
  const [quickConnectType, setQuickConnectType] = useState<'terminal' | 'files'>('terminal');
  const [quickHost, setQuickHost] = useState('');
  const [quickPort, setQuickPort] = useState(22);
  const [quickUsername, setQuickUsername] = useState('root');
  const [quickPassword, setQuickPassword] = useState('');

  // Load profiles from localStorage on mount
  useEffect(() => {
    const savedProfilesData = localStorage.getItem('ssh-profiles');
    if (savedProfilesData) {
      try {
        setSavedProfiles(JSON.parse(savedProfilesData));
      } catch (e) {
        console.error('Failed to load SSH profiles:', e);
      }
    }
  }, []);

  // Save profile handler
  const handleSaveProfile = () => {
    if (!host.trim() || !username.trim() || !profileName.trim()) {
      return;
    }

    let updatedProfiles: ConnectionProfile[];

    if (editingProfileId) {
      // Update existing profile
      updatedProfiles = savedProfiles.map(p => 
        p.id === editingProfileId 
          ? {
              ...p,
              name: profileName,
              host,
              port,
              username,
              authMethod,
              password: authMethod === 'password' ? password : undefined,
            }
          : p
      );
      setEditingProfileId(null);
    } else {
      // Create new profile
      const newProfile: ConnectionProfile = {
        id: `profile-${Date.now()}`,
        name: profileName,
        host,
        port,
        username,
        authMethod,
        password: authMethod === 'password' ? password : undefined,
        timeout: 30,
      };
      updatedProfiles = [...savedProfiles, newProfile];
    }

    setSavedProfiles(updatedProfiles);
    localStorage.setItem('ssh-profiles', JSON.stringify(updatedProfiles));

    // Clear form
    setProfileName('');
    setPassword('');
  };

  // Delete profile handler
  const handleDeleteProfile = (profileId: string) => {
    const updatedProfiles = savedProfiles.filter(p => p.id !== profileId);
    setSavedProfiles(updatedProfiles);
    localStorage.setItem('ssh-profiles', JSON.stringify(updatedProfiles));
    
    // Clear form if we're editing this profile
    if (editingProfileId === profileId) {
      setEditingProfileId(null);
      setHost('');
      setPort(22);
      setUsername('root');
      setPassword('');
      setAuthMethod('password');
      setProfileName('');
    }
  };

  // Quick connect from profile (double click)
  const handleQuickConnect = async (profile: ConnectionProfile, openAs: 'terminal' | 'files' = 'terminal') => {
    try {
      const result = await window.electronAPI.sshConnect({
        host: profile.host,
        port: profile.port,
        username: profile.username,
        authMethod: profile.authMethod,
        password: profile.authMethod === 'password' ? profile.password : undefined,
      });

      if (result.success && result.connectionId) {
        const newConnection: SSHConnection = {
          id: result.connectionId,
          host: profile.host,
          port: profile.port,
          username: profile.username,
          authMethod: profile.authMethod,
          connected: true,
          lastActivity: new Date(),
        };
        
        setActiveConnections(prev => [...prev, newConnection]);
        
        // Open appropriate tab
        if (openAs === 'terminal') {
          const tabId = `terminal-${newConnection.id}`;
          const newTab: AppTab = {
            id: tabId,
            type: 'terminal',
            connection: newConnection,
            label: `${newConnection.username}@${newConnection.host}`,
          };
          setTabs(prev => [...prev, newTab]);
          setActiveTabId(tabId);
        } else {
          openFileManager(newConnection);
        }
      }
    } catch (err) {
      console.error('Quick connect error:', err);
    }
  };

  // Quick connect from dialog
  const handleQuickConnectFromDialog = async () => {
    if (!quickHost.trim() || !quickUsername.trim()) {
      return;
    }

    try {
      const result = await window.electronAPI.sshConnect({
        host: quickHost,
        port: quickPort,
        username: quickUsername,
        authMethod: 'password',
        password: quickPassword,
      });

      if (result.success && result.connectionId) {
        const newConnection: SSHConnection = {
          id: result.connectionId,
          host: quickHost,
          port: quickPort,
          username: quickUsername,
          authMethod: 'password',
          connected: true,
          lastActivity: new Date(),
        };
        
        setActiveConnections(prev => [...prev, newConnection]);
        
        // Open appropriate tab
        if (quickConnectType === 'terminal') {
          const tabId = `terminal-${newConnection.id}`;
          const newTab: AppTab = {
            id: tabId,
            type: 'terminal',
            connection: newConnection,
            label: `${newConnection.username}@${newConnection.host}`,
          };
          setTabs(prev => [...prev, newTab]);
          setActiveTabId(tabId);
        } else {
          openFileManager(newConnection);
        }

        // Close dialog and reset
        setQuickConnectOpen(false);
        setQuickHost('');
        setQuickPort(22);
        setQuickUsername('root');
        setQuickPassword('');
      }
    } catch (err) {
      console.error('Quick connect error:', err);
    }
  };

  const currentTheme = currentThemeId === 'custom' 
    ? { ...getTheme('termius-dark'), ...customColors, id: 'custom', name: 'Custom', description: 'Пользовательская тема' }
    : getTheme(currentThemeId);
  const currentFont = getFont(currentFontId);

  const handleConnect = async () => {
    if (!host.trim() || !username.trim()) {
      return;
    }

    try {
      const result = await window.electronAPI.sshConnect({
        host,
        port,
        username,
        authMethod,
        password: authMethod === 'password' ? password : undefined,
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
        
        // Auto-open terminal tab
        const tabId = `terminal-${newConnection.id}`;
        const newTab: AppTab = {
          id: tabId,
          type: 'terminal',
          connection: newConnection,
          label: `${newConnection.username}@${newConnection.host}`,
        };
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(tabId);
        
        // Reset password for security
        setPassword('');
      }
    } catch (err) {
      console.error('Connection error:', err);
    }
  };

  const handleDisconnect = (connectionId: string) => {
    setActiveConnections(prev => prev.filter(c => c.id !== connectionId));
    setTabs(prev => prev.filter(t => t.connection.id !== connectionId));
    if (activeTabId?.includes(connectionId)) {
      const remaining = tabs.filter(t => t.connection.id !== connectionId);
      setActiveTabId(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
    }
  };

  const openFileManager = (connection: SSHConnection) => {
    const tabId = `files-${connection.id}`;
    const existing = tabs.find(t => t.id === tabId);
    if (existing) {
      setActiveTabId(tabId);
      return;
    }
    const newTab: AppTab = {
      id: tabId,
      type: 'files',
      connection,
      label: `📁 ${connection.username}@${connection.host}`,
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(tabId);
  };

  const openNewTerminal = (connection: SSHConnection) => {
    const tabId = `terminal-${connection.id}-${Date.now()}`;
    const newTab: AppTab = {
      id: tabId,
      type: 'terminal',
      connection,
      label: `${connection.username}@${connection.host}`,
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(tabId);
  };

  const closeTab = (tabId: string) => {
    const idx = tabs.findIndex(t => t.id === tabId);
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);
    if (activeTabId === tabId) {
      setActiveTabId(newTabs.length > 0 ? newTabs[Math.max(0, idx - 1)].id : null);
    }
  };

  const activeTab = tabs.find(t => t.id === activeTabId);

  return (
    <PageTransition>
      <PageContainer>
      {/* ═══ MAIN AREA ═══ */}
      <MainArea>
        {/* Tab bar */}
        <TabBar>
          {tabs.map(tab => (
            <SessionTab
              key={tab.id}
              active={tab.id === activeTabId}
              onClick={() => setActiveTabId(tab.id)}
            >
              {tab.type === 'terminal'
                ? <TerminalIcon sx={{ fontSize: 12 }} />
                : <FolderIcon sx={{ fontSize: 12 }} />
              }
              <span>{tab.label}</span>
              <Box
                component="span"
                onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                sx={{
                  display: 'flex', alignItems: 'center', ml: 0.5,
                  opacity: 0.5, '&:hover': { opacity: 1 },
                  cursor: 'pointer',
                }}
              >
                <CloseIcon sx={{ fontSize: 10 }} />
              </Box>
            </SessionTab>
          ))}

          {/* + button - shows menu to choose Terminal or File Manager */}
          <>
            <Tooltip title={activeConnections.length > 0 ? "Новая вкладка" : "Новое подключение"}>
              <AddTabBtn
                size="small"
                onClick={(e) => {
                  setNewTabMenuAnchor(e.currentTarget);
                  setShowNewTabMenu(activeConnections.length > 0 ? (activeTab?.connection || activeConnections[0]) : null);
                }}
              >
                <AddIcon sx={{ fontSize: 14 }} />
              </AddTabBtn>
            </Tooltip>
            <Menu
              anchorEl={newTabMenuAnchor}
              open={Boolean(newTabMenuAnchor)}
              onClose={() => { setNewTabMenuAnchor(null); setShowNewTabMenu(null); }}
              PaperProps={{ sx: { backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', minWidth: '200px' } }}
            >
                <MenuItem
                  onClick={() => {
                    setQuickConnectType('terminal');
                    setQuickConnectOpen(true);
                    setNewTabMenuAnchor(null);
                    setShowNewTabMenu(null);
                  }}
                  sx={{ gap: 1.5, fontSize: '13px' }}
                >
                  <TerminalIcon sx={{ fontSize: 16, color: '#00ffff' }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontSize: '13px' }}>SSH Терминал</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                      Быстрое подключение
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setQuickConnectType('files');
                    setQuickConnectOpen(true);
                    setNewTabMenuAnchor(null);
                    setShowNewTabMenu(null);
                  }}
                  sx={{ gap: 1.5, fontSize: '13px' }}
                >
                  <FolderIcon sx={{ fontSize: 16, color: '#ffd700' }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontSize: '13px' }}>Файловый менеджер</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                      Быстрое подключение
                    </Typography>
                  </Box>
                </MenuItem>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 0.5 }} />
                <MenuItem
                  onClick={() => {
                    setShowRightSidebar(true);
                    setProfilesExpanded(true);
                    setNewTabMenuAnchor(null);
                    setShowNewTabMenu(null);
                  }}
                  sx={{ gap: 1.5, fontSize: '13px' }}
                >
                  <AddIcon sx={{ fontSize: 16, color: '#00d9ff' }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontSize: '13px' }}>Выбрать профиль</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>Сохраненные подключения</Typography>
                  </Box>
                </MenuItem>
              </Menu>
          </>
          
          {/* Spacer */}
          <Box sx={{ flex: 1 }} />
          
          {/* Toggle right sidebar button */}
          <Tooltip title={showRightSidebar ? "Скрыть панель" : "Показать панель"}>
            <AddTabBtn
              size="small"
              onClick={() => setShowRightSidebar(!showRightSidebar)}
              sx={{
                color: '#ff8c00',
                '&:hover': {
                  backgroundColor: 'rgba(255, 140, 0, 0.1)',
                  color: '#ff8c00',
                },
              }}
            >
              <TuneIcon sx={{ fontSize: 14 }} />
            </AddTabBtn>
          </Tooltip>
        </TabBar>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          {!activeTab ? (
            <EmptyTerminal>
              <Box sx={{ mb: 2, opacity: 0.2 }}>
                <svg width="80" height="80" viewBox="0 0 80 80" fill="currentColor">
                  <text x="10" y="60" fontFamily="monospace" fontSize="48" fontWeight="bold" fill={currentTheme.foreground}>&gt;_</text>
                </svg>
              </Box>
              <Typography variant="body2" sx={{ mt: 1, color: '#ff4444', fontWeight: 500 }}>
                Подключитесь к серверу →
              </Typography>
            </EmptyTerminal>
          ) : activeTab.type === 'terminal' ? (
            <SSHTerminal
              connections={activeConnections}
              selectedConnectionId={activeTab.connection.id}
              onCloseSession={handleDisconnect}
              onSelectSession={() => {}}
              theme={currentTheme}
              fontFamily={currentFont.family}
              showMinimap={showMinimap}
            />
          ) : (
            <SSHFileManager connection={activeTab.connection} />
          )}
        </Box>
      </MainArea>

      {/* ═══ RIGHT SIDEBAR ═══ */}
      <Sidebar sx={{ 
        transform: showRightSidebar ? 'translateX(0)' : 'translateX(100%)',
        opacity: showRightSidebar ? 1 : 0,
        width: showRightSidebar ? '280px' : '0px',
        minWidth: showRightSidebar ? '280px' : '0px',
      }}>
        {/* Header */}
        <Box sx={{ p: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Typography variant="caption" fontWeight={700} sx={{ color: '#00d9ff', letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '11px' }}>
            SSH Профиля
          </Typography>
        </Box>

        <SidebarContent>
          {/* ═══ ACCORDION 1: ПРОФИЛИ ═══ */}
          <Box>
            <ListItemButton 
              dense 
              onClick={() => setProfilesExpanded(!profilesExpanded)} 
              sx={{ py: 1, px: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <ListItemText primary={
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px', fontWeight: 600 }}>
                  Профили
                </Typography>
              } />
              {profilesExpanded ? <ExpandLess sx={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }} /> : <ExpandMore sx={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }} />}
            </ListItemButton>

            <Collapse in={profilesExpanded}>
              {/* Saved Profiles List */}
              <Box sx={{ p: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.5px', fontWeight: 600 }}>
                    СОХРАНЕННЫЕ
                  </Typography>
                  <Tooltip title="Новый профиль">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditingProfileId(null);
                        setHost('');
                        setPort(22);
                        setUsername('root');
                        setPassword('');
                        setAuthMethod('password');
                        setProfileName('');
                      }}
                      sx={{ 
                        p: 0.5, 
                        color: 'rgba(255,255,255,0.4)',
                        '&:hover': { color: '#00d9ff', backgroundColor: 'rgba(0,217,255,0.1)' }
                      }}
                    >
                      <AddIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {savedProfiles.length === 0 ? (
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', py: 1 }}>
                      Нет сохраненных профилей
                    </Typography>
                  ) : (
                    savedProfiles.map((profile) => (
                      <Box
                        key={profile.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          p: '6px 8px',
                          borderRadius: '4px',
                          backgroundColor: editingProfileId === profile.id ? 'rgba(0,217,255,0.08)' : 'rgba(255,255,255,0.02)',
                          border: editingProfileId === profile.id ? '1px solid rgba(0,217,255,0.3)' : '1px solid rgba(255,255,255,0.05)',
                          '&:hover': { 
                            backgroundColor: editingProfileId === profile.id ? 'rgba(0,217,255,0.08)' : 'rgba(255,255,255,0.05)',
                            borderColor: editingProfileId === profile.id ? 'rgba(0,217,255,0.3)' : 'rgba(255,255,255,0.1)'
                          },
                        }}
                      >
                        <Box
                          onClick={() => {
                            setHost(profile.host);
                            setPort(profile.port);
                            setUsername(profile.username);
                            setAuthMethod(profile.authMethod);
                            setProfileName(profile.name);
                            setPassword(profile.password || '');
                            setEditingProfileId(profile.id);
                          }}
                          onDoubleClick={() => {
                            handleQuickConnect(profile, 'terminal');
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setProfileMenuAnchor(e.currentTarget);
                            setSelectedProfileForMenu(profile.id);
                          }}
                          sx={{ flex: 1, cursor: 'pointer', minWidth: 0 }}
                        >
                          <Typography variant="caption" sx={{ fontSize: '11px', color: '#fff', display: 'block', fontWeight: 500 }} noWrap>
                            {profile.name}
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }} noWrap>
                            {profile.username}@{profile.host}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.25 }}>
                          <Tooltip title="Удалить">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProfile(profile.id);
                              }}
                              sx={{ 
                                p: 0.5, 
                                color: 'rgba(255,255,255,0.3)',
                                '&:hover': { color: '#ff4444', backgroundColor: 'rgba(255,68,68,0.1)' }
                              }}
                            >
                              <CloseIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    ))
                  )}
                </Box>

                {/* Profile Context Menu */}
                <Menu
                  anchorEl={profileMenuAnchor}
                  open={Boolean(profileMenuAnchor)}
                  onClose={() => {
                    setProfileMenuAnchor(null);
                    setSelectedProfileForMenu(null);
                  }}
                  PaperProps={{ sx: { backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', minWidth: '180px' } }}
                >
                  <MenuItem
                    onClick={() => {
                      const profile = savedProfiles.find(p => p.id === selectedProfileForMenu);
                      if (profile) handleQuickConnect(profile, 'terminal');
                      setProfileMenuAnchor(null);
                      setSelectedProfileForMenu(null);
                    }}
                    sx={{ gap: 1.5, fontSize: '13px' }}
                  >
                    <TerminalIcon sx={{ fontSize: 16, color: '#00ffff' }} />
                    <Typography variant="body2" sx={{ fontSize: '13px' }}>SSH Терминал</Typography>
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      const profile = savedProfiles.find(p => p.id === selectedProfileForMenu);
                      if (profile) handleQuickConnect(profile, 'files');
                      setProfileMenuAnchor(null);
                      setSelectedProfileForMenu(null);
                    }}
                    sx={{ gap: 1.5, fontSize: '13px' }}
                  >
                    <FolderIcon sx={{ fontSize: 16, color: '#ffd700' }} />
                    <Typography variant="body2" sx={{ fontSize: '13px' }}>Файловый менеджер</Typography>
                  </MenuItem>
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 0.5 }} />
                  <MenuItem
                    onClick={() => {
                      const profile = savedProfiles.find(p => p.id === selectedProfileForMenu);
                      if (profile) {
                        setHost(profile.host);
                        setPort(profile.port);
                        setUsername(profile.username);
                        setAuthMethod(profile.authMethod);
                        setProfileName(profile.name);
                        setPassword(profile.password || '');
                        setEditingProfileId(profile.id);
                      }
                      setProfileMenuAnchor(null);
                      setSelectedProfileForMenu(null);
                    }}
                    sx={{ gap: 1.5, fontSize: '13px' }}
                  >
                    <BookmarkIcon sx={{ fontSize: 16, color: '#00d9ff' }} />
                    <Typography variant="body2" sx={{ fontSize: '13px' }}>Редактировать</Typography>
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      if (selectedProfileForMenu) handleDeleteProfile(selectedProfileForMenu);
                      setProfileMenuAnchor(null);
                      setSelectedProfileForMenu(null);
                    }}
                    sx={{ gap: 1.5, fontSize: '13px', color: '#ff4444' }}
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                    <Typography variant="body2" sx={{ fontSize: '13px' }}>Удалить</Typography>
                  </MenuItem>
                </Menu>
              </Box>

              {/* Connection Form */}
              <Box sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {/* Row 1: Host + Port */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      label="ХОСТ"
                      value={host}
                      onChange={(e) => setHost(e.target.value)}
                      size="small"
                      sx={{ 
                        flex: 2,
                        '& .MuiInputLabel-root': { fontSize: '11px', color: 'rgba(255,255,255,0.4)' },
                        '& .MuiInputBase-input': { fontSize: '12px', color: '#fff' },
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                        '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00d9ff' },
                      }}
                      placeholder="10.10.10.70"
                    />
                    <TextField
                      label="порт"
                      type="number"
                      value={port}
                      onChange={(e) => setPort(parseInt(e.target.value) || 22)}
                      size="small"
                      sx={{ 
                        flex: 1,
                        '& .MuiInputLabel-root': { fontSize: '11px', color: 'rgba(255,255,255,0.4)' },
                        '& .MuiInputBase-input': { fontSize: '12px', color: '#fff' },
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                        '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00d9ff' },
                      }}
                    />
                  </Box>

                  {/* Row 2: Username + Password */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      label="имя пользователя"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      size="small"
                      sx={{ 
                        flex: 1,
                        '& .MuiInputLabel-root': { fontSize: '11px', color: 'rgba(255,255,255,0.4)' },
                        '& .MuiInputBase-input': { fontSize: '12px', color: '#fff' },
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                        '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00d9ff' },
                      }}
                      placeholder="root"
                    />
                    <TextField
                      label="пароль"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      size="small"
                      sx={{ 
                        flex: 1,
                        '& .MuiInputLabel-root': { fontSize: '11px', color: 'rgba(255,255,255,0.4)' },
                        '& .MuiInputBase-input': { fontSize: '12px', color: '#fff' },
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                        '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00d9ff' },
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => setShowPassword(!showPassword)}
                              sx={{ p: 0.5, color: 'rgba(255,255,255,0.3)' }}
                            >
                              {showPassword ? <VisibilityOffIcon sx={{ fontSize: 16 }} /> : <VisibilityIcon sx={{ fontSize: 16 }} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>

                  {/* Row 3: Profile Name + Auth Method */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      label="имя профиля"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      size="small"
                      sx={{ 
                        flex: 1,
                        '& .MuiInputLabel-root': { fontSize: '11px', color: 'rgba(255,255,255,0.4)' },
                        '& .MuiInputBase-input': { fontSize: '12px', color: '#fff' },
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                        '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00d9ff' },
                      }}
                      placeholder="TeamSpeak"
                    />
                    <FormControl size="small" sx={{ flex: 1 }}>
                      <InputLabel sx={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>метод аутеф</InputLabel>
                      <Select
                        value={authMethod}
                        label="метод аутеф"
                        onChange={(e) => setAuthMethod(e.target.value as 'password' | 'key' | 'agent')}
                        sx={{
                          fontSize: '12px',
                          color: '#fff',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00d9ff' },
                        }}
                      >
                        <MenuItem value="password" sx={{ fontSize: '12px' }}>Пароль</MenuItem>
                        <MenuItem value="key" sx={{ fontSize: '12px' }}>Ключ</MenuItem>
                        <MenuItem value="agent" sx={{ fontSize: '12px' }}>Агент</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Save Button */}
                  <MuiButton
                    variant="contained"
                    fullWidth
                    onClick={handleSaveProfile}
                    sx={{
                      mt: 0.5,
                      backgroundColor: '#00d9ff',
                      color: '#000',
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'lowercase',
                      py: 0.75,
                      '&:hover': { backgroundColor: '#00b8dd' },
                    }}
                  >
                    {editingProfileId ? 'обновить' : 'сохранить'}
                  </MuiButton>

                  {/* Connect Button */}
                  <MuiButton
                    variant="outlined"
                    fullWidth
                    onClick={handleConnect}
                    sx={{
                      mt: 1,
                      borderColor: '#00ff88',
                      color: '#00ff88',
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'lowercase',
                      py: 0.75,
                      '&:hover': { 
                        borderColor: '#00ff88',
                        backgroundColor: 'rgba(0,255,136,0.1)' 
                      },
                    }}
                  >
                    подключиться
                  </MuiButton>
                </Box>
              </Box>
            </Collapse>
          </Box>

          {/* ═══ ACCORDION 2: ТЕМЫ ═══ */}
          <Box>
            <ListItemButton 
              dense 
              onClick={() => setThemesExpanded(!themesExpanded)} 
              sx={{ py: 1, px: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <ListItemText primary={
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px', fontWeight: 600 }}>
                  Темы
                </Typography>
              } />
              {themesExpanded ? <ExpandLess sx={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }} /> : <ExpandMore sx={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }} />}
            </ListItemButton>

            <Collapse in={themesExpanded}>
              <Box sx={{ p: 1.5 }}>
                {/* Font Selector */}
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px', fontWeight: 600, display: 'block', mb: 1 }}>
                  🔤 Шрифт
                </Typography>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <Select
                    value={currentFontId}
                    onChange={(e) => setCurrentFontId(e.target.value)}
                    sx={{
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00d9ff' },
                    }}
                  >
                    {TERMINAL_FONTS.map(font => (
                      <MenuItem key={font.id} value={font.id} sx={{ fontFamily: font.family, fontSize: '12px' }}>
                        {font.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Theme Selector */}
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px', fontWeight: 600, display: 'block', mb: 1 }}>
                  🎨 Готовые темы
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {SSH_THEMES.map(theme => (
                    <Box
                      key={theme.id}
                      onClick={() => setCurrentThemeId(theme.id)}
                      sx={{
                        p: 1,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        border: `1px solid ${currentThemeId === theme.id ? theme.cursor : 'rgba(255,255,255,0.08)'}`,
                        backgroundColor: currentThemeId === theme.id ? `${theme.background}cc` : 'rgba(255,255,255,0.02)',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.2)' },
                      }}
                    >
                      {/* Color preview */}
                      <Box sx={{ display: 'flex', gap: 0.5, mb: 0.75 }}>
                        {[theme.background, theme.foreground, theme.ip, theme.error, theme.success, theme.keyword].map((color, i) => (
                          <Box key={i} sx={{ width: 14, height: 14, borderRadius: '3px', backgroundColor: color, border: '1px solid rgba(255,255,255,0.1)' }} />
                        ))}
                      </Box>
                      <Typography variant="caption" sx={{ fontSize: '12px', fontWeight: 600, color: theme.foreground, display: 'block' }}>
                        {theme.name}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>
                        {theme.description}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* Custom Theme Editor */}
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px', fontWeight: 600, display: 'block', mb: 1, mt: 2 }}>
                  🎨 Свои цвета
                </Typography>
                <Box sx={{ p: 1.5, borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(['background', 'foreground', 'cursor', 'error', 'success', 'info'] as const).map((colorKey) => (
                      <Box key={colorKey} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
                        <Box
                          component="input"
                          type="color"
                          value={customColors[colorKey]}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setCustomColors(prev => ({ ...prev, [colorKey]: e.target.value }));
                            setCurrentThemeId('custom');
                          }}
                          sx={{
                            width: '32px',
                            height: '32px',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            backgroundColor: 'transparent',
                          }}
                        />
                        <Typography variant="caption" sx={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)' }}>
                          {colorKey.slice(0, 3)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            </Collapse>
          </Box>

          {/* ═══ ACCORDION 3: РАСШИРЕННЫЕ ═══ */}
          <Box>
            <ListItemButton 
              dense 
              onClick={() => setAdvancedExpanded(!advancedExpanded)} 
              sx={{ py: 1, px: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <ListItemText primary={
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px', fontWeight: 600 }}>
                  Расширенные
                </Typography>
              } />
              {advancedExpanded ? <ExpandLess sx={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }} /> : <ExpandMore sx={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }} />}
            </ListItemButton>

            <Collapse in={advancedExpanded}>
              <Box sx={{ p: 1.5 }}>
                {/* Minimap Toggle */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px', fontWeight: 600, display: 'block', mb: 1 }}>
                    Настройки терминала
                  </Typography>
                  <Box
                    onClick={() => setShowMinimap(!showMinimap)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1,
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' }
                    }}
                  >
                    <Typography variant="caption" sx={{ fontSize: '11px', color: '#fff' }}>
                      Minimap
                    </Typography>
                    <Box
                      sx={{
                        width: '40px',
                        height: '20px',
                        borderRadius: '10px',
                        backgroundColor: showMinimap ? '#00d9ff' : 'rgba(255,255,255,0.2)',
                        position: 'relative',
                        transition: 'background-color 0.3s',
                      }}
                    >
                      <Box
                        sx={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          backgroundColor: '#fff',
                          position: 'absolute',
                          top: '2px',
                          left: showMinimap ? '22px' : '2px',
                          transition: 'left 0.3s',
                        }}
                      />
                    </Box>
                  </Box>
                </Box>

                {/* Active Connections */}
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px', fontWeight: 600, display: 'block', mb: 1 }}>
                  Активные подключения
                </Typography>
                {activeConnections.length === 0 ? (
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
                    Нет активных подключений
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {activeConnections.map(conn => (
                      <Box key={conn.id} sx={{ p: 1, borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                        <Typography variant="caption" sx={{ fontSize: '11px', fontFamily: 'monospace', color: '#00ff88', display: 'block', mb: 1 }}>
                          {conn.username}@{conn.host}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box
                            onClick={() => openFileManager(conn)}
                            sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.75, borderRadius: '4px', cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
                          >
                            <FolderIcon sx={{ fontSize: 14, color: '#ffd700' }} />
                            <Typography variant="caption" sx={{ fontSize: '11px' }}>Файловый менеджер</Typography>
                          </Box>
                          <Box
                            onClick={() => openNewTerminal(conn)}
                            sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.75, borderRadius: '4px', cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
                          >
                            <TerminalIcon sx={{ fontSize: 14, color: '#00ffff' }} />
                            <Typography variant="caption" sx={{ fontSize: '11px' }}>Новый терминал</Typography>
                          </Box>
                          <Box
                            onClick={() => handleDisconnect(conn.id)}
                            sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.75, borderRadius: '4px', cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(255,68,68,0.1)' } }}
                          >
                            <CloseIcon sx={{ fontSize: 14, color: '#ff4444' }} />
                            <Typography variant="caption" sx={{ fontSize: '11px', color: '#ff4444' }}>Отключить</Typography>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Collapse>
          </Box>
        </SidebarContent>
      </Sidebar>

      {/* Quick Connect Dialog */}
      <Dialog
        open={quickConnectOpen}
        onClose={() => setQuickConnectOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a1a',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            maxWidth: '580px',
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 1, pt: 1, px: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {quickConnectType === 'terminal' ? (
              <TerminalIcon sx={{ fontSize: 20, color: '#00ffff' }} />
            ) : (
              <FolderIcon sx={{ fontSize: 20, color: '#ffd700' }} />
            )}
            <Typography variant="h6" sx={{ fontSize: '15px', fontWeight: 600 }}>
              {quickConnectType === 'terminal' ? 'SSH Терминал' : 'Файловый менеджер'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 2, px: 2.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {/* Host + Port */}
            <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center' }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', minWidth: '40px' }}>
                Хост
              </Typography>
              <TextField
                value={quickHost}
                onChange={(e) => setQuickHost(e.target.value)}
                fullWidth
                autoFocus
                placeholder="10.10.10.70"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleQuickConnectFromDialog();
                  }
                }}
                sx={{
                  flex: 1,
                  '& .MuiInputBase-root': {
                    height: '40px',
                  },
                  '& .MuiInputBase-input': { 
                    color: '#fff', 
                    fontSize: '13px',
                    padding: '8px 12px',
                    '&::placeholder': {
                      color: 'rgba(255,255,255,0.3)',
                      opacity: 1,
                    }
                  },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '6px',
                  },
                  '& .MuiOutlinedInput-notchedOutline': { 
                    borderColor: '#00d9ff',
                    borderWidth: '2px',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': { 
                    borderColor: '#00d9ff',
                    borderWidth: '2px',
                  },
                  '& .Mui-focused .MuiOutlinedInput-notchedOutline': { 
                    borderColor: '#00d9ff',
                    borderWidth: '2px',
                  },
                }}
              />
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', minWidth: '40px', textAlign: 'right' }}>
                порт
              </Typography>
              <TextField
                value={quickPort}
                onChange={(e) => setQuickPort(parseInt(e.target.value) || 22)}
                placeholder="22"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleQuickConnectFromDialog();
                  }
                }}
                sx={{
                  width: '80px',
                  '& .MuiInputBase-root': {
                    height: '40px',
                  },
                  '& .MuiInputBase-input': { 
                    color: '#fff', 
                    fontSize: '13px',
                    padding: '8px 12px',
                    textAlign: 'center',
                    '&::placeholder': {
                      color: 'rgba(255,255,255,0.3)',
                      opacity: 1,
                    }
                  },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '6px',
                  },
                  '& .MuiOutlinedInput-notchedOutline': { 
                    borderColor: 'rgba(255,255,255,0.3)',
                    borderWidth: '1px',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': { 
                    borderColor: 'rgba(255,255,255,0.5)',
                  },
                  '& .Mui-focused .MuiOutlinedInput-notchedOutline': { 
                    borderColor: '#00d9ff',
                    borderWidth: '2px',
                  },
                }}
              />
            </Box>

            {/* Username */}
            <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center' }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', minWidth: '130px' }}>
                Имя пользователя
              </Typography>
              <TextField
                value={quickUsername}
                onChange={(e) => setQuickUsername(e.target.value)}
                fullWidth
                placeholder="root"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleQuickConnectFromDialog();
                  }
                }}
                sx={{
                  '& .MuiInputBase-root': {
                    height: '40px',
                  },
                  '& .MuiInputBase-input': { 
                    color: '#fff', 
                    fontSize: '13px',
                    padding: '8px 12px',
                    '&::placeholder': {
                      color: 'rgba(255,255,255,0.3)',
                      opacity: 1,
                    }
                  },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '6px',
                  },
                  '& .MuiOutlinedInput-notchedOutline': { 
                    borderColor: 'rgba(255,255,255,0.3)',
                    borderWidth: '1px',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': { 
                    borderColor: 'rgba(255,255,255,0.5)',
                  },
                  '& .Mui-focused .MuiOutlinedInput-notchedOutline': { 
                    borderColor: '#00d9ff',
                    borderWidth: '2px',
                  },
                }}
              />
            </Box>

            {/* Password */}
            <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center' }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', minWidth: '130px' }}>
                пароль
              </Typography>
              <TextField
                type={showPassword ? 'text' : 'password'}
                value={quickPassword}
                onChange={(e) => setQuickPassword(e.target.value)}
                fullWidth
                placeholder="••••••••"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleQuickConnectFromDialog();
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: 'rgba(255,255,255,0.5)', mr: 0.25 }}
                      >
                        {showPassword ? <VisibilityOffIcon sx={{ fontSize: 16 }} /> : <VisibilityIcon sx={{ fontSize: 16 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiInputBase-root': {
                    height: '40px',
                  },
                  '& .MuiInputBase-input': { 
                    color: '#fff', 
                    fontSize: '13px',
                    padding: '8px 12px',
                    '&::placeholder': {
                      color: 'rgba(255,255,255,0.3)',
                      opacity: 1,
                    }
                  },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '6px',
                  },
                  '& .MuiOutlinedInput-notchedOutline': { 
                    borderColor: 'rgba(255,255,255,0.3)',
                    borderWidth: '1px',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': { 
                    borderColor: 'rgba(255,255,255,0.5)',
                  },
                  '& .Mui-focused .MuiOutlinedInput-notchedOutline': { 
                    borderColor: '#00d9ff',
                    borderWidth: '2px',
                  },
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', p: 1.25, px: 2.5, gap: 1.25 }}>
          <MuiButton
            onClick={() => setQuickConnectOpen(false)}
            sx={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: '12px',
              py: 0.65,
              px: 2.25,
              textTransform: 'none',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' }
            }}
          >
            Отмена
          </MuiButton>
          <MuiButton
            variant="contained"
            onClick={handleQuickConnectFromDialog}
            disabled={!quickHost.trim() || !quickUsername.trim()}
            sx={{
              backgroundColor: '#00d9ff',
              color: '#000',
              fontWeight: 600,
              fontSize: '12px',
              py: 0.65,
              px: 2.75,
              textTransform: 'none',
              borderRadius: '6px',
              '&:hover': { backgroundColor: '#00b8dd' },
              '&:disabled': { backgroundColor: 'rgba(0,217,255,0.3)', color: 'rgba(0,0,0,0.5)' }
            }}
          >
            Подключиться
          </MuiButton>
        </DialogActions>
      </Dialog>
    </PageContainer>
    </PageTransition>
  );
};

export default SSHTerminalPage;
