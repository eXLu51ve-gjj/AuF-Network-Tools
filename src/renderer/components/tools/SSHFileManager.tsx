import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Breadcrumbs,
  Link,
  Chip,
  LinearProgress,
  Alert,
  styled,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button as MuiButton,
  TextField,
  Checkbox,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  ArrowUpward as UpIcon,
  Refresh as RefreshIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  CreateNewFolder as NewFolderIcon,
  Home as HomeIcon,
  Computer as ComputerIcon,
  Cloud as CloudIcon,
  SwapHoriz as TransferIcon,
} from '@mui/icons-material';
import { SSHConnection } from '../../types';

const ManagerContainer = styled(Box)({
  display: 'flex',
  height: '100%',
  gap: '4px',
  backgroundColor: '#0a0a0a',
  padding: '8px',
});

const Panel = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#111',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '6px',
  overflow: 'hidden',
}));

const PanelHeader = styled(Box)(({ theme }) => ({
  padding: '8px 12px',
  backgroundColor: '#1a1a1a',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
}));

const PanelToolbar = styled(Box)(({ theme }) => ({
  padding: '4px 8px',
  backgroundColor: '#161616',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
}));

const FileTable = styled(TableContainer)({
  flex: 1,
  overflow: 'auto',
  '&::-webkit-scrollbar': { width: '6px' },
  '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.2)', borderRadius: '3px' },
});

const TransferPanel = styled(Box)({
  width: '48px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
});

interface FileEntry {
  name: string;
  type: 'file' | 'dir';
  size: number;
  modified: string;
  permissions?: string;
}

interface TransferItem {
  id: string;
  name: string;
  direction: 'upload' | 'download';
  progress: number;
  status: 'pending' | 'transferring' | 'done' | 'error';
}

interface SSHFileManagerProps {
  connection: SSHConnection;
}

// Mock local files
const mockLocalFiles: FileEntry[] = [
  { name: '..', type: 'dir', size: 0, modified: '' },
  { name: 'Documents', type: 'dir', size: 0, modified: '2024-01-15 10:30' },
  { name: 'Downloads', type: 'dir', size: 0, modified: '2024-01-14 09:15' },
  { name: 'Desktop', type: 'dir', size: 0, modified: '2024-01-13 14:22' },
  { name: 'config.json', type: 'file', size: 2048, modified: '2024-01-12 11:00' },
  { name: 'script.sh', type: 'file', size: 512, modified: '2024-01-11 16:45' },
  { name: 'data.csv', type: 'file', size: 102400, modified: '2024-01-10 08:30' },
];

// Mock remote files
const mockRemoteFiles: FileEntry[] = [
  { name: '..', type: 'dir', size: 0, modified: '' },
  { name: 'etc', type: 'dir', size: 0, modified: '2024-01-15 00:00', permissions: 'drwxr-xr-x' },
  { name: 'home', type: 'dir', size: 0, modified: '2024-01-14 12:00', permissions: 'drwxr-xr-x' },
  { name: 'var', type: 'dir', size: 0, modified: '2024-01-13 08:00', permissions: 'drwxr-xr-x' },
  { name: 'tmp', type: 'dir', size: 0, modified: '2024-01-15 10:00', permissions: 'drwxrwxrwt' },
  { name: '.bashrc', type: 'file', size: 3526, modified: '2024-01-01 00:00', permissions: '-rw-r--r--' },
  { name: '.ssh', type: 'dir', size: 0, modified: '2024-01-05 12:00', permissions: 'drwx------' },
  { name: 'docker-compose.yml', type: 'file', size: 1024, modified: '2024-01-10 15:30', permissions: '-rw-r--r--' },
];

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const SSHFileManager: React.FC<SSHFileManagerProps> = ({ connection }) => {
  const [localPath, setLocalPath] = useState('C:\\');
  const [remotePath, setRemotePath] = useState('/root');
  const [localFiles, setLocalFiles] = useState<FileEntry[]>(mockLocalFiles);
  const [remoteFiles, setRemoteFiles] = useState<FileEntry[]>(mockRemoteFiles);
  const [selectedLocal, setSelectedLocal] = useState<string[]>([]);
  const [selectedRemote, setSelectedRemote] = useState<string[]>([]);
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState<'local' | 'remote' | null>(null);
  const [showSymlinks, setShowSymlinks] = useState(false);
  const [showHiddenFiles, setShowHiddenFiles] = useState(false);
  const [currentDrive, setCurrentDrive] = useState(
    process.env.USERPROFILE ? process.env.USERPROFILE.charAt(0).toUpperCase() + ':' : 'C:'
  );
  const [availableDrives, setAvailableDrives] = useState<string[]>(['C:']);
  
  // New folder dialog state
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderIsLocal, setNewFolderIsLocal] = useState(false);
  
  // New file dialog state
  const [newFileDialogOpen, setNewFileDialogOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileIsLocal, setNewFileIsLocal] = useState(false);
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ files: string[]; isLocal: boolean } | null>(null);
  
  // Error/success notifications
  const [notification, setNotification] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);

  // Load remote files
  const loadRemoteFiles = async (path: string) => {
    console.log('Loading remote files from:', path);
    setLoading(true);
    try {
      const result = await window.electronAPI.sshExecute(connection.id, `ls -la "${path}" 2>/dev/null || echo "ERROR"`);
      console.log('SSH execute result:', result);
      
      if (result.success && result.stdout) {
        // Check for error
        if (result.stdout.includes('ERROR') || result.stdout.includes('No such file')) {
          console.error('Failed to list directory:', path);
          setNotification({ message: `Не удалось открыть папку: ${path}`, type: 'error' });
          setLoading(false);
          return;
        }
        
        // Parse ls output
        const lines = result.stdout.split('\n').filter(l => l.trim());
        console.log('Parsed lines:', lines);
        const files: FileEntry[] = [];
        
        // Add parent directory
        if (path !== '/') {
          files.push({ name: '..', type: 'dir', size: 0, modified: '' });
        }
        
        for (const line of lines) {
          if (line.startsWith('total')) continue; // Skip total line
          
          const parts = line.split(/\s+/);
          if (parts.length < 9) continue;
          
          const permissions = parts[0];
          const size = parseInt(parts[4]) || 0;
          const name = parts.slice(8).join(' ');
          
          if (name === '.' || name === '..') continue;
          
          const type = permissions.startsWith('d') ? 'dir' : 'file';
          const modified = `${parts[5]} ${parts[6]} ${parts[7]}`;
          
          files.push({ name, type, size, modified, permissions });
        }
        
        console.log('Loaded files:', files);
        setRemoteFiles(files);
        setRemotePath(path);
      }
    } catch (err) {
      console.error('Failed to load remote files:', err);
      setNotification({ message: `Ошибка загрузки: ${err}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Load local files
  const loadLocalFiles = async (path: string) => {
    try {
      const result = await window.electronAPI.listLocalFiles(path);
      if (result.success && result.files) {
        setLocalFiles(result.files);
        setLocalPath(path);
      }
    } catch (err) {
      console.error('Failed to load local files:', err);
    }
  };

  // Initial load
  React.useEffect(() => {
    loadRemoteFiles(remotePath);
    // Load real desktop path and available drives
    window.electronAPI.getSpecialPaths().then((paths: any) => {
      if (paths.success && paths.desktop) {
        setLocalPath(paths.desktop);
        loadLocalFiles(paths.desktop);
        // Set current drive from desktop path
        const drive = paths.desktop.charAt(0).toUpperCase() + ':';
        setCurrentDrive(drive);
      }
    });
    window.electronAPI.getDrives().then((result: any) => {
      if (result.success && result.drives) {
        setAvailableDrives(result.drives);
      }
    });
  }, [connection.id]);

  // Create new folder
  const createFolder = async (isLocal: boolean) => {
    setNewFolderIsLocal(isLocal);
    setNewFolderName('');
    setNewFolderDialogOpen(true);
  };
  
  // Create new file
  const createFile = async (isLocal: boolean) => {
    setNewFileIsLocal(isLocal);
    setNewFileName('');
    setNewFileDialogOpen(true);
  };
  
  // Delete files
  const deleteFiles = async (files: string[], isLocal: boolean) => {
    setDeleteTarget({ files, isLocal });
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    
    const { files, isLocal } = deleteTarget;
    
    for (const fileName of files) {
      try {
        if (isLocal) {
          const fullPath = `${localPath}\\${fileName}`;
          const result = await window.electronAPI.deleteLocalFile(fullPath);
          if (result.success) {
            setNotification({ message: `Файл "${fileName}" удалён`, type: 'success' });
          } else {
            setNotification({ message: `Ошибка удаления: ${result.error}`, type: 'error' });
          }
        } else {
          const fullPath = remotePath === '/' ? `/${fileName}` : `${remotePath}/${fileName}`;
          const result = await window.electronAPI.sshExecute(
            connection.id,
            `rm -rf "${fullPath}"`
          );
          if (result.success) {
            setNotification({ message: `Файл "${fileName}" удалён`, type: 'success' });
          } else {
            setNotification({ message: `Ошибка удаления: ${result.stderr || result.error}`, type: 'error' });
          }
        }
      } catch (err) {
        setNotification({ message: `Ошибка: ${err}`, type: 'error' });
      }
    }
    
    // Refresh
    if (isLocal) {
      loadLocalFiles(localPath);
    } else {
      loadRemoteFiles(remotePath);
    }
    
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };
  
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    if (newFolderIsLocal) {
      try {
        const result = await window.electronAPI.createLocalFolder(localPath, newFolderName);
        if (result.success) {
          loadLocalFiles(localPath);
          setNotification({ message: `Папка "${newFolderName}" создана`, type: 'success' });
        } else {
          setNotification({ message: `Ошибка: ${result.error}`, type: 'error' });
        }
      } catch (err) {
        setNotification({ message: `Ошибка: ${err}`, type: 'error' });
      }
    } else {
      try {
        // Fix path: properly join paths
        const newFolderPath = remotePath === '/' ? `/${newFolderName}` : `${remotePath}/${newFolderName}`;
        const result = await window.electronAPI.sshExecute(
          connection.id,
          `mkdir -p "${newFolderPath}"`
        );
        if (result.success) {
          loadRemoteFiles(remotePath);
          setNotification({ message: `Папка "${newFolderName}" создана`, type: 'success' });
        } else {
          setNotification({ message: `Ошибка: ${result.stderr || result.error}`, type: 'error' });
        }
      } catch (err) {
        setNotification({ message: `Ошибка: ${err}`, type: 'error' });
      }
    }
    
    setNewFolderDialogOpen(false);
    setNewFolderName('');
  };
  
  const handleCreateFile = async () => {
    if (!newFileName.trim()) return;
    
    if (newFileIsLocal) {
      try {
        const fullPath = `${localPath}\\${newFileName}`;
        const result = await window.electronAPI.createLocalFile(fullPath);
        if (result.success) {
          loadLocalFiles(localPath);
          setNotification({ message: `Файл "${newFileName}" создан`, type: 'success' });
        } else {
          setNotification({ message: `Ошибка: ${result.error}`, type: 'error' });
        }
      } catch (err) {
        setNotification({ message: `Ошибка: ${err}`, type: 'error' });
      }
    } else {
      try {
        const fullPath = remotePath === '/' ? `/${newFileName}` : `${remotePath}/${newFileName}`;
        const result = await window.electronAPI.sshExecute(
          connection.id,
          `touch "${fullPath}"`
        );
        if (result.success) {
          loadRemoteFiles(remotePath);
          setNotification({ message: `Файл "${newFileName}" создан`, type: 'success' });
        } else {
          setNotification({ message: `Ошибка: ${result.stderr || result.error}`, type: 'error' });
        }
      } catch (err) {
        setNotification({ message: `Ошибка: ${err}`, type: 'error' });
      }
    }
    
    setNewFileDialogOpen(false);
    setNewFileName('');
  };

  // Navigate up
  const navigateUp = (isLocal: boolean) => {
    if (isLocal) {
      const parent = localPath.split('\\').slice(0, -1).join('\\');
      if (parent && parent !== currentDrive) {
        loadLocalFiles(parent);
      } else if (parent === currentDrive) {
        loadLocalFiles(currentDrive + '\\');
      }
    } else {
      const parent = remotePath.split('/').slice(0, -1).join('/') || '/';
      loadRemoteFiles(parent);
    }
  };

  // Change drive
  const changeDrive = (drive: string) => {
    setCurrentDrive(drive);
    loadLocalFiles(drive + '\\');
  };

  // Refresh
  const refresh = (isLocal: boolean) => {
    if (isLocal) {
      loadLocalFiles(localPath);
    } else {
      loadRemoteFiles(remotePath);
    }
  };

  // Handle file transfer
  const handleTransfer = async (direction: 'upload' | 'download', files: string[]) => {
    console.log('Transfer:', direction, files);
    console.log('Local files:', localFiles);
    console.log('Remote files:', remoteFiles);
    
    // Block only symlinks (not folders - we'll handle them recursively)
    if (direction === 'download') {
      const symlinks = files.filter(name => {
        const file = remoteFiles.find(f => f.name === name);
        console.log(`Checking remote file "${name}":`, file);
        // Block only symlinks
        return file && file.permissions && file.permissions.startsWith('l');
      });
      if (symlinks.length > 0) {
        console.log('Found symlinks in download:', symlinks);
        setNotification({ message: 'Скачивание симлинков не поддерживается. Выберите файлы или папки.', type: 'error' });
        return;
      }
    }
    
    console.log('No symlinks found, proceeding with transfer');
    
    const newTransfers: TransferItem[] = files.map(name => ({
      id: `${Date.now()}-${name}`,
      name,
      direction,
      progress: 0,
      status: 'transferring' as const,
    }));

    setTransfers(prev => [...prev, ...newTransfers]);

    for (const transfer of newTransfers) {
      try {
        if (direction === 'upload') {
          const localFile = localPath.endsWith('\\') ? `${localPath}${transfer.name}` : `${localPath}\\${transfer.name}`;
          // Fix path: properly join paths
          const remoteFile = remotePath === '/' ? `/${transfer.name}` : `${remotePath}/${transfer.name}`;
          
          console.log('Uploading:', localFile, '->', remoteFile);
          
          const result = await window.electronAPI.sshUploadFile(
            connection.id,
            localFile,
            remoteFile
          );
          
          console.log('Upload result:', JSON.stringify(result, null, 2));
          
          if (result.success) {
            setTransfers(prev => prev.map(t =>
              t.id === transfer.id ? { ...t, progress: 100, status: 'done' } : t
            ));
            loadRemoteFiles(remotePath); // Refresh remote
            setNotification({ message: `"${transfer.name}" загружен`, type: 'success' });
          } else {
            setTransfers(prev => prev.map(t =>
              t.id === transfer.id ? { ...t, status: 'error' } : t
            ));
            setNotification({ message: `Ошибка загрузки: ${result.error}`, type: 'error' });
          }
        } else {
          // Fix path: properly join paths
          const remoteFile = remotePath === '/' ? `/${transfer.name}` : `${remotePath}/${transfer.name}`;
          
          // If localPath is drive root (e.g. C:\), redirect to Downloads to avoid EPERM
          let targetLocalPath = localPath;
          if (localPath.match(/^[A-Z]:\\?$/i)) {
            const userProfile = process.env.USERPROFILE || localPath;
            targetLocalPath = `${userProfile}\\Downloads`;
            setNotification({ message: `Нет прав писать в корень диска. Скачиваю в ${targetLocalPath}`, type: 'info' });
          }
          
          const localFile = targetLocalPath.endsWith('\\') 
            ? `${targetLocalPath}${transfer.name}` 
            : `${targetLocalPath}\\${transfer.name}`;
          
          console.log('Downloading:', remoteFile, '->', localFile);
          
          const result = await window.electronAPI.sshDownloadFile(
            connection.id,
            remoteFile,
            localFile
          );
          
          console.log('Download result:', JSON.stringify(result, null, 2));
          
          if (result.success) {
            setTransfers(prev => prev.map(t =>
              t.id === transfer.id ? { ...t, progress: 100, status: 'done' } : t
            ));
            loadLocalFiles(localPath); // Refresh local
            setNotification({ message: `"${transfer.name}" скачан`, type: 'success' });
          } else {
            setTransfers(prev => prev.map(t =>
              t.id === transfer.id ? { ...t, status: 'error' } : t
            ));
            setNotification({ message: `Ошибка скачивания: ${result.error}`, type: 'error' });
          }
        }
      } catch (err) {
        console.error('Transfer error:', err);
        setTransfers(prev => prev.map(t =>
          t.id === transfer.id ? { ...t, status: 'error' } : t
        ));
        setNotification({ message: `Ошибка передачи: ${err}`, type: 'error' });
      }
    }

    setSelectedLocal([]);
    setSelectedRemote([]);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, files: string[], isLocal: boolean) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('files', JSON.stringify(files));
    e.dataTransfer.setData('isLocal', isLocal.toString());
  };

  const handleDragOver = (e: React.DragEvent, target: 'local' | 'remote') => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(target);
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const handleDrop = (e: React.DragEvent, target: 'local' | 'remote') => {
    e.preventDefault();
    setDragOver(null);
    
    const filesData = e.dataTransfer.getData('files');
    const isLocal = e.dataTransfer.getData('isLocal') === 'true';
    
    if (!filesData) return;
    
    const files = JSON.parse(filesData);
    
    // Determine transfer direction
    if (isLocal && target === 'remote') {
      handleTransfer('upload', files);
    } else if (!isLocal && target === 'local') {
      handleTransfer('download', files);
    }
  };

  const FileRow: React.FC<{
    file: FileEntry;
    selected: boolean;
    onSelect: () => void;
    onDoubleClick: () => void;
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent) => void;
  }> = ({ file, selected, onSelect, onDoubleClick, draggable, onDragStart }) => (
    <TableRow
      selected={selected}
      onDoubleClick={onDoubleClick}
      draggable={draggable && file.name !== '..'}
      onDragStart={onDragStart}
      sx={{
        cursor: 'pointer',
        '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' },
        '&.Mui-selected': { backgroundColor: 'rgba(0,255,255,0.1)' },
        '&.Mui-selected:hover': { backgroundColor: 'rgba(0,255,255,0.15)' },
      }}
    >
      <TableCell sx={{ py: 0.5, px: 1, width: '40px' }}>
        {file.name !== '..' && (
          <Checkbox
            size="small"
            checked={selected}
            onChange={onSelect}
            onClick={(e) => e.stopPropagation()}
            sx={{
              color: 'rgba(255,255,255,0.3)',
              '&.Mui-checked': { color: '#00d9ff' },
              padding: '2px',
            }}
          />
        )}
      </TableCell>
      <TableCell sx={{ py: 0.5, px: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {file.type === 'dir'
            ? <FolderIcon sx={{ fontSize: 16, color: '#ffd700' }} />
            : <FileIcon sx={{ fontSize: 16, color: '#aaa' }} />
          }
          <Typography variant="body2" sx={{ fontSize: '12px', fontFamily: 'monospace' }}>
            {file.name}
          </Typography>
        </Box>
      </TableCell>
      <TableCell sx={{ py: 0.5, px: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {formatSize(file.size)}
        </Typography>
      </TableCell>
      <TableCell sx={{ py: 0.5, px: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
          {file.modified}
        </Typography>
      </TableCell>
    </TableRow>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#0a0a0a' }}>
      {/* Transfer queue */}
      {transfers.filter(t => t.status !== 'done').length > 0 && (
        <Box sx={{ p: 1, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {transfers.filter(t => t.status !== 'done').map(t => (
            <Box key={t.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              {t.direction === 'upload' ? <UploadIcon sx={{ fontSize: 14 }} /> : <DownloadIcon sx={{ fontSize: 14 }} />}
              <Typography variant="caption" sx={{ minWidth: '120px', fontSize: '11px' }}>{t.name}</Typography>
              <LinearProgress variant="determinate" value={t.progress} sx={{ flex: 1, height: 4, borderRadius: 2 }} />
              <Typography variant="caption" sx={{ fontSize: '10px', minWidth: '35px' }}>{t.progress.toFixed(0)}%</Typography>
              <IconButton 
                size="small" 
                onClick={() => {
                  setTransfers(prev => prev.filter(item => item.id !== t.id));
                  setNotification({ message: `Передача "${t.name}" отменена`, type: 'info' });
                }}
                sx={{ p: 0.5 }}
              >
                <DeleteIcon sx={{ fontSize: 12, color: '#ff4444' }} />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}

      <ManagerContainer>
        {/* LOCAL PANEL */}
        <Panel>
          <PanelHeader>
            <ComputerIcon sx={{ fontSize: 16, color: '#00ccff' }} />
            <Typography variant="caption" fontWeight={600} color="#00ccff">Локальный компьютер</Typography>
          </PanelHeader>
          <PanelToolbar>
            <Select
              value={currentDrive}
              onChange={(e) => changeDrive(e.target.value)}
              size="small"
              sx={{
                minWidth: '60px',
                height: '28px',
                color: '#fff',
                fontSize: '12px',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00d9ff' },
                '& .MuiSvgIcon-root': { color: '#fff' },
              }}
            >
              {availableDrives.map(drive => (
                <MenuItem key={drive} value={drive} sx={{ fontSize: '12px' }}>{drive}</MenuItem>
              ))}
            </Select>
            <Tooltip title="Вверх"><IconButton size="small" onClick={() => navigateUp(true)}><UpIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>
            <Tooltip title="Обновить"><IconButton size="small" onClick={() => refresh(true)}><RefreshIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>
            <Tooltip title="Новая папка"><IconButton size="small" onClick={() => createFolder(true)}><NewFolderIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>
            <Tooltip title="Новый файл"><IconButton size="small" onClick={() => createFile(true)}><FileIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>
            <Tooltip title="Удалить"><IconButton size="small" disabled={selectedLocal.length === 0} onClick={() => deleteFiles(selectedLocal, true)}><DeleteIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1, fontSize: '11px', fontFamily: 'monospace' }}>
              {localPath}
            </Typography>
          </PanelToolbar>
          <FileTable 
            component={Paper} 
            sx={{ 
              backgroundColor: dragOver === 'local' ? 'rgba(0,255,255,0.05)' : 'transparent',
              border: dragOver === 'local' ? '2px dashed #00ffff' : 'none',
            }}
            onDragOver={(e) => handleDragOver(e, 'local')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'local')}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ py: 0.5, px: 1, fontSize: '11px', backgroundColor: '#1a1a1a', width: '40px' }}></TableCell>
                  <TableCell sx={{ py: 0.5, px: 1, fontSize: '11px', backgroundColor: '#1a1a1a' }}>Имя</TableCell>
                  <TableCell sx={{ py: 0.5, px: 1, fontSize: '11px', backgroundColor: '#1a1a1a' }}>Размер</TableCell>
                  <TableCell sx={{ py: 0.5, px: 1, fontSize: '11px', backgroundColor: '#1a1a1a' }}>Изменён</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {localFiles.map(file => (
                  <FileRow
                    key={file.name}
                    file={file}
                    selected={selectedLocal.includes(file.name)}
                    draggable={true}
                    onDragStart={(e) => {
                      const filesToDrag = selectedLocal.includes(file.name) ? selectedLocal : [file.name];
                      handleDragStart(e, filesToDrag, true);
                    }}
                    onSelect={() => {
                      if (file.name === '..') return;
                      setSelectedLocal(prev =>
                        prev.includes(file.name) ? prev.filter(n => n !== file.name) : [...prev, file.name]
                      );
                    }}
                    onDoubleClick={() => {
                      if (file.type === 'dir') {
                        if (file.name === '..') {
                          navigateUp(true);
                        } else {
                          loadLocalFiles(`${localPath}\\${file.name}`);
                        }
                      }
                    }}
                  />
                ))}
              </TableBody>
            </Table>
          </FileTable>
          <Box sx={{ p: 1, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
              {selectedLocal.length > 0 ? `${selectedLocal.length} выбрано` : `${localFiles.length - 1} объектов`}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '9px', fontStyle: 'italic' }}>
              Двойной клик = открыть
            </Typography>
          </Box>
        </Panel>

        {/* TRANSFER BUTTONS */}
        <TransferPanel>
          <Tooltip title={`Загрузить на ${connection.host}`}>
            <span>
              <IconButton
                size="small"
                color="primary"
                disabled={selectedLocal.length === 0}
                onClick={() => handleTransfer('upload', selectedLocal)}
                sx={{
                  backgroundColor: 'rgba(0,255,255,0.1)',
                  border: '1px solid rgba(0,255,255,0.3)',
                  '&:hover': { backgroundColor: 'rgba(0,255,255,0.2)' },
                  '&:disabled': { opacity: 0.3 },
                }}
              >
                <UploadIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Скачать на компьютер">
            <span>
              <IconButton
                size="small"
                color="secondary"
                disabled={selectedRemote.length === 0}
                onClick={() => handleTransfer('download', selectedRemote)}
                sx={{
                  backgroundColor: 'rgba(255,0,255,0.1)',
                  border: '1px solid rgba(255,0,255,0.3)',
                  '&:hover': { backgroundColor: 'rgba(255,0,255,0.2)' },
                  '&:disabled': { opacity: 0.3 },
                }}
              >
                <DownloadIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </span>
          </Tooltip>
        </TransferPanel>

        {/* REMOTE PANEL */}
        <Panel>
          <PanelHeader>
            <CloudIcon sx={{ fontSize: 16, color: '#00ff88' }} />
            <Typography variant="caption" fontWeight={600} color="#00ff88">
              {connection.username}@{connection.host}
            </Typography>
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title={showSymlinks ? 'Скрыть симлинки' : 'Показать симлинки'}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }} onClick={() => setShowSymlinks(v => !v)}>
                  <Checkbox
                    size="small"
                    checked={showSymlinks}
                    sx={{ color: 'rgba(255,255,255,0.3)', '&.Mui-checked': { color: '#ffd700' }, padding: '2px' }}
                  />
                  <Typography variant="caption" sx={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>
                    симлинки
                  </Typography>
                </Box>
              </Tooltip>
              <Tooltip title={showHiddenFiles ? 'Скрыть скрытые файлы' : 'Показать скрытые файлы'}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }} onClick={() => setShowHiddenFiles(v => !v)}>
                  <Checkbox
                    size="small"
                    checked={showHiddenFiles}
                    sx={{ color: 'rgba(255,255,255,0.3)', '&.Mui-checked': { color: '#00d9ff' }, padding: '2px' }}
                  />
                  <Typography variant="caption" sx={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>
                    скрытые
                  </Typography>
                </Box>
              </Tooltip>
            </Box>
          </PanelHeader>
          <PanelToolbar>
            <Tooltip title="Вверх"><IconButton size="small" onClick={() => navigateUp(false)}><UpIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>
            <Tooltip title="Обновить"><IconButton size="small" onClick={() => refresh(false)}><RefreshIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>
            <Tooltip title="Новая папка"><IconButton size="small" onClick={() => createFolder(false)}><NewFolderIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>
            <Tooltip title="Новый файл"><IconButton size="small" onClick={() => createFile(false)}><FileIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>
            <Tooltip title="Удалить"><IconButton size="small" disabled={selectedRemote.length === 0} onClick={() => deleteFiles(selectedRemote, false)}><DeleteIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1, fontSize: '11px', fontFamily: 'monospace' }}>
              {remotePath}
            </Typography>
          </PanelToolbar>
          <FileTable 
            component={Paper} 
            sx={{ 
              backgroundColor: dragOver === 'remote' ? 'rgba(0,255,136,0.05)' : 'transparent',
              border: dragOver === 'remote' ? '2px dashed #00ff88' : 'none',
            }}
            onDragOver={(e) => handleDragOver(e, 'remote')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'remote')}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ py: 0.5, px: 1, fontSize: '11px', backgroundColor: '#1a1a1a', width: '40px' }}></TableCell>
                  <TableCell sx={{ py: 0.5, px: 1, fontSize: '11px', backgroundColor: '#1a1a1a' }}>Имя</TableCell>
                  <TableCell sx={{ py: 0.5, px: 1, fontSize: '11px', backgroundColor: '#1a1a1a' }}>Размер</TableCell>
                  <TableCell sx={{ py: 0.5, px: 1, fontSize: '11px', backgroundColor: '#1a1a1a' }}>Изменён</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {remoteFiles
                  .filter(file => {
                    // Always show parent dir
                    if (file.name === '..') return true;
                    // Filter symlinks
                    if (!showSymlinks && file.permissions && file.permissions.startsWith('l')) return false;
                    // Filter hidden files (starting with .)
                    if (!showHiddenFiles && file.name.startsWith('.')) return false;
                    return true;
                  })
                  .map(file => (
                  <FileRow
                    key={file.name}
                    file={file}
                    selected={selectedRemote.includes(file.name)}
                    draggable={true}
                    onDragStart={(e) => {
                      const filesToDrag = selectedRemote.includes(file.name) ? selectedRemote : [file.name];
                      handleDragStart(e, filesToDrag, false);
                    }}
                    onSelect={() => {
                      if (file.name === '..') return;
                      setSelectedRemote(prev =>
                        prev.includes(file.name) ? prev.filter(n => n !== file.name) : [...prev, file.name]
                      );
                    }}
                    onDoubleClick={() => {
                      console.log('Double click on remote file:', file.name, file.type);
                      if (file.type === 'dir') {
                        if (file.name === '..') {
                          navigateUp(false);
                        } else {
                          // Fix path: properly join paths
                          const newPath = remotePath === '/' ? `/${file.name}` : `${remotePath}/${file.name}`;
                          console.log('Navigating to:', newPath);
                          loadRemoteFiles(newPath);
                        }
                      }
                    }}
                  />
                ))}
              </TableBody>
            </Table>
          </FileTable>
          <Box sx={{ p: 1, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
              {selectedRemote.length > 0 ? `${selectedRemote.length} выбрано` : `${remoteFiles.length - 1} объектов`}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '9px', fontStyle: 'italic' }}>
              Двойной клик = открыть
            </Typography>
          </Box>
        </Panel>
      </ManagerContainer>

      {/* New Folder Dialog */}
      <Dialog
        open={newFolderDialogOpen}
        onClose={() => setNewFolderDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 1, pt: 1, px: 2 }}>
          <Typography variant="h6" sx={{ fontSize: '14px' }}>
            {newFolderIsLocal ? 'Новая папка (локально)' : 'Новая папка (на сервере)'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 2, px: 2 }}>
          <TextField
            autoFocus
            fullWidth
            label="Имя папки"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateFolder();
              }
            }}
            size="small"
            sx={{
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
              '& .MuiInputBase-input': { color: '#fff' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
              '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00d9ff' },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', p: 1, px: 2 }}>
          <MuiButton onClick={() => setNewFolderDialogOpen(false)} sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Отмена
          </MuiButton>
          <MuiButton
            onClick={handleCreateFolder}
            variant="contained"
            disabled={!newFolderName.trim()}
            sx={{
              backgroundColor: '#00d9ff',
              color: '#000',
              '&:hover': { backgroundColor: '#00b8dd' },
              '&:disabled': { backgroundColor: 'rgba(0,217,255,0.3)' },
            }}
          >
            Создать
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* New File Dialog */}
      <Dialog
        open={newFileDialogOpen}
        onClose={() => setNewFileDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 1, pt: 1, px: 2 }}>
          <Typography variant="h6" sx={{ fontSize: '14px' }}>
            {newFileIsLocal ? 'Новый файл (локально)' : 'Новый файл (на сервере)'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 2, px: 2 }}>
          <TextField
            autoFocus
            fullWidth
            label="Имя файла (например: file.txt, doc.md)"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateFile();
              }
            }}
            size="small"
            sx={{
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
              '& .MuiInputBase-input': { color: '#fff' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
              '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00d9ff' },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', p: 1, px: 2 }}>
          <MuiButton onClick={() => setNewFileDialogOpen(false)} sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Отмена
          </MuiButton>
          <MuiButton
            onClick={handleCreateFile}
            variant="contained"
            disabled={!newFileName.trim()}
            sx={{
              backgroundColor: '#00d9ff',
              color: '#000',
              '&:hover': { backgroundColor: '#00b8dd' },
              '&:disabled': { backgroundColor: 'rgba(0,217,255,0.3)' },
            }}
          >
            Создать
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 1, pt: 1, px: 2 }}>
          <Typography variant="h6" sx={{ fontSize: '14px', color: '#ff4444' }}>
            Подтверждение удаления
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 2, px: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Вы уверены, что хотите удалить следующие файлы?
          </Typography>
          <Box sx={{ pl: 2 }}>
            {deleteTarget?.files.map(file => (
              <Typography key={file} variant="caption" sx={{ display: 'block', color: '#ff8888' }}>
                • {file}
              </Typography>
            ))}
          </Box>
          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'rgba(255,255,255,0.5)' }}>
            Это действие нельзя отменить!
          </Typography>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', p: 1, px: 2 }}>
          <MuiButton onClick={() => setDeleteDialogOpen(false)} sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Отмена
          </MuiButton>
          <MuiButton
            onClick={handleDeleteConfirm}
            variant="contained"
            sx={{
              backgroundColor: '#ff4444',
              color: '#fff',
              '&:hover': { backgroundColor: '#dd2222' },
            }}
          >
            Удалить
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      {notification && (
        <Alert
          severity={notification.type}
          onClose={() => setNotification(null)}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 9999,
            minWidth: '300px',
          }}
        >
          {notification.message}
        </Alert>
      )}
    </Box>
  );
};

export default SSHFileManager;
