import { app, BrowserWindow, ipcMain, Menu, Tray, clipboard, shell } from 'electron';
import path from 'path';
import { NetworkService } from './services/NetworkService';
import { SSHService } from './services/SSHService';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

const createWindow = () => {
  // Create the browser window - show immediately with black background
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    titleBarStyle: 'hiddenInset',
    frame: false,
    backgroundColor: '#000000', // OLED black theme
    show: true, // Show immediately
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // and load the index.html of the app.
  // In production, load from the built files
  const indexPath = path.join(__dirname, '../renderer/index.html');
  mainWindow.loadFile(indexPath);

  // Create application menu
  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          label: 'New Scan',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow?.webContents.send('new-scan');
          },
        },
        { type: 'separator' },
        {
          label: 'Preferences',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow?.webContents.send('open-preferences');
          },
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { 
          label: 'Toggle Developer Tools',
          accelerator: 'F12',
          click: () => {
            if (mainWindow) {
              if (mainWindow.webContents.isDevToolsOpened()) {
                mainWindow.webContents.closeDevTools();
              } else {
                mainWindow.webContents.openDevTools();
              }
            }
          }
        },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, { role: 'close' }],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: async () => {
            const { shell } = require('electron');
            await shell.openExternal('https://docs.wifi-network-tools.com');
          },
        },
        { type: 'separator' },
        {
          label: 'About WiFi Network Tools',
          click: () => {
            mainWindow?.webContents.send('open-about');
          },
        },
      ],
    },
  ]);

  Menu.setApplicationMenu(menu);

  // Create system tray icon
  try {
    tray = new Tray(path.join(__dirname, 'tray-icon.png'));
  } catch {
    // Fallback if icon not found
    try {
      tray = new Tray(path.join(__dirname, '../renderer/assets/icons/tray-icon.png'));
    } catch {
      console.log('Tray icon not found, skipping tray');
    }
  }
  
  if (tray) {
    // Function to update tray menu with dynamic data
    const updateTrayMenu = async () => {
      let externalIP = 'Загрузка...';

      try {
        // Get external IP
        externalIP = await NetworkService.getExternalIP();
      } catch (error) {
        externalIP = 'N/A';
      }

      const contextMenu = Menu.buildFromTemplate([
        {
          label: 'Открыть AuF Network Tools',
          click: () => {
            if (mainWindow) {
              mainWindow.show();
              mainWindow.focus();
            }
          },
        },
        { type: 'separator' },
        {
          label: `Внешний IP: ${externalIP}`,
          enabled: false,
        },
        {
          label: 'Ping (8.8.8.8)',
          click: () => {
            // Open CMD with continuous ping
            const { exec } = require('child_process');
            exec('start cmd.exe /k "ping 8.8.8.8 -t"');
          },
        },
        { type: 'separator' },
        {
          label: 'SSH Терминал',
          click: () => {
            if (mainWindow) {
              mainWindow.show();
              mainWindow.focus();
              mainWindow.webContents.send('open-ssh-terminal');
            }
          },
        },
        {
          label: 'Быстрый перевод',
          click: async () => {
            // Get text from clipboard and open Google Translate
            const text = clipboard.readText();
            if (text && text.trim()) {
              const encodedText = encodeURIComponent(text.trim());
              const url = `https://translate.google.com/?sl=auto&tl=ru&text=${encodedText}&op=translate`;
              shell.openExternal(url);
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Выход',
          click: () => {
            app.quit();
          },
        },
      ]);
      tray?.setToolTip('AuF Network Tools');
      tray?.setContextMenu(contextMenu);
    };

    // Initial menu update
    updateTrayMenu();

    // Update external IP every 60 seconds
    setInterval(() => {
      updateTrayMenu();
    }, 60000);
    
    // Double click on tray icon opens the app
    tray.on('double-click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  }

  // Handle window close event
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle window minimize to tray
  mainWindow.on('minimize', (event: Electron.Event) => {
    event.preventDefault();
    mainWindow?.hide();
  });

  // Handle window close to tray
  mainWindow.on('close', (event: Electron.Event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
    return false;
  });
};

// IPC handlers for window controls
ipcMain.on('window-control', (_event, action) => {
  if (!mainWindow) return;

  switch (action) {
    case 'minimize':
      mainWindow.minimize();
      break;
    case 'maximize':
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
      break;
    case 'close':
      mainWindow.close();
      break;
  }
});

// IPC handler for theme updates
ipcMain.handle('update-theme', (_event, themeConfig) => {
  // Update window theme settings
  if (mainWindow) {
    mainWindow.setBackgroundColor(themeConfig.backgroundColor || '#000000');
  }
  return { success: true };
});

// IPC handler for network operations
ipcMain.handle('network:ping', async (_event, host: string, count: number, timeout: number) => {
  try {
    const results = await NetworkService.ping(host, count, timeout);
    return { success: true, data: results };
  } catch (err) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
});

ipcMain.handle('network:traceroute', async (_event, host: string, maxHops: number) => {
  try {
    const results = await NetworkService.traceroute(host, maxHops);
    return { success: true, data: results };
  } catch (err) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
});

// Streaming traceroute - sends each hop as it arrives, supports ICMP/TCP/UDP
ipcMain.handle('network:traceroute-stream', async (_event, host: string, maxHops: number, protocol: string = 'icmp') => {
  const { spawn } = require('child_process');
  const isWindows = process.platform === 'win32';
  const hops: any[] = [];

  return new Promise((resolve) => {
    let proc: any;

    if (isWindows) {
      if (protocol === 'tcp') {
        // TCP traceroute via PowerShell Test-Connection with TTL
        const psScript = `
$host_target = '${host}'
$maxHops = ${maxHops}
for ($ttl = 1; $ttl -le $maxHops; $ttl++) {
  $ping = Test-Connection -ComputerName $host_target -Count 1 -TimeToLive $ttl -ErrorAction SilentlyContinue
  if ($ping) {
    $addr = $ping.Address
    $time = $ping.ResponseTime
    Write-Output "$ttl|$addr|$time"
    if ($addr -eq $host_target -or $ping.StatusCode -eq 0) { break }
  } else {
    Write-Output "$ttl|*|0"
  }
}`.trim();
        proc = spawn('powershell', ['-NoProfile', '-NonInteractive', '-Command', psScript]);
      } else {
        // ICMP via tracert (default)
        proc = spawn('cmd', ['/c', `chcp 65001 > nul && tracert -h ${maxHops} -w 1000 ${host}`], { shell: true });
      }
    } else {
      // Linux/Mac: support ICMP, UDP, TCP
      const flag = protocol === 'tcp' ? '-T' : protocol === 'udp' ? '' : '-I';
      const args = flag ? [flag, `-m`, `${maxHops}`, `-w`, `1`, host] : [`-m`, `${maxHops}`, `-w`, `1`, host];
      proc = spawn('traceroute', args);
    }

    let buffer = '';

    const parseLine = (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // PowerShell TCP output: "1|192.168.1.1|5"
      if (protocol === 'tcp' && isWindows) {
        const parts = trimmed.split('|');
        if (parts.length === 3) {
          const hopNum = parseInt(parts[0]);
          const ip = parts[1] === '*' ? '' : parts[1].trim();
          const time = parseInt(parts[2]) || 0;
          if (!isNaN(hopNum)) {
            const hop = { hop: hopNum, ip, hostname: ip || '* * *', time1: time, time2: time, time3: time };
            hops.push(hop);
            mainWindow?.webContents.send('traceroute:hop', hop);
          }
        }
        return;
      }

      // Standard tracert ICMP parsing
      const hopNumMatch = trimmed.match(/^(\d+)\s+/);
      if (!hopNumMatch) return;
      const hopNum = parseInt(hopNumMatch[1]);

      if (trimmed.match(/\*\s+\*\s+\*/)) {
        const hop = { hop: hopNum, ip: '', hostname: '* * *', time1: 0, time2: 0, time3: 0 };
        hops.push(hop);
        mainWindow?.webContents.send('traceroute:hop', hop);
        return;
      }

      const timeMatches = [...trimmed.matchAll(/<?\d+\s*ms/gi)];
      const times = timeMatches.map(m => parseInt(m[0].replace(/[<\s]|ms/gi, '')) || 1);

      let remaining = trimmed.replace(/^\d+\s+/, '').replace(/<?\d+\s*ms\s*/gi, '').trim();
      const bracketMatch = remaining.match(/^(.+?)\s+\[([^\]]+)\]/);
      const ipOnlyMatch = remaining.match(/^(\d+\.\d+\.\d+\.\d+)/);

      let ip = '';
      let hostname = remaining;
      if (bracketMatch) { hostname = bracketMatch[1].trim(); ip = bracketMatch[2].trim(); }
      else if (ipOnlyMatch) { ip = ipOnlyMatch[1]; hostname = ip; }

      if (hostname || ip) {
        const hop = { hop: hopNum, ip: ip || hostname, hostname: hostname || ip, time1: times[0] || 0, time2: times[1] || 0, time3: times[2] || 0 };
        hops.push(hop);
        mainWindow?.webContents.send('traceroute:hop', hop);
      }
    };

    proc.stdout.on('data', (data: Buffer) => {
      buffer += data.toString('utf8');
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      lines.forEach(parseLine);
    });

    proc.on('close', () => {
      if (buffer.trim()) parseLine(buffer);
      mainWindow?.webContents.send('traceroute:done');
      resolve({ success: true, data: hops });
    });

    proc.on('error', (err: Error) => {
      resolve({ success: false, error: err.message });
    });
  });
});

ipcMain.handle('network:scan-wifi', async () => {
  try {
    const networks = await NetworkService.scanWiFi();
    return { success: true, data: networks };
  } catch (err) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
});

// Streaming ping - sends each reply in real-time
ipcMain.handle('network:ping-stream', async (_event, host: string, count: number, timeout: number) => {
  const { spawn } = require('child_process');
  const isWindows = process.platform === 'win32';
  const results: any[] = [];

  return new Promise((resolve) => {
    const proc = isWindows
      ? spawn('cmd', ['/c', `chcp 65001 > nul && ping -n ${count} -w ${timeout} ${host}`], { shell: true })
      : spawn('ping', [`-c`, `${count}`, `-W`, `${Math.floor(timeout / 1000)}`, host]);

    let buffer = '';

    const parseLine = (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (isWindows) {
        // English: "Reply from 8.8.8.8: bytes=32 time<1ms TTL=128"
        const engMatch = trimmed.match(/Reply from ([^:]+):\s*bytes=(\d+)\s*time[=<](\d+)ms\s*TTL=(\d+)/i);
        if (engMatch) {
          const result = { host: engMatch[1].trim(), alive: true, bytes: parseInt(engMatch[2]), time: parseInt(engMatch[3]), ttl: parseInt(engMatch[4]) };
          results.push(result);
          mainWindow?.webContents.send('ping:reply', result);
          return;
        }

        // English fast: "time<1ms"
        const engFast = trimmed.match(/Reply from ([^:]+):\s*bytes=(\d+)\s*time<1ms\s*TTL=(\d+)/i);
        if (engFast) {
          const result = { host: engFast[1].trim(), alive: true, bytes: parseInt(engFast[2]), time: 1, ttl: parseInt(engFast[3]) };
          results.push(result);
          mainWindow?.webContents.send('ping:reply', result);
          return;
        }

        // Russian fast: "время<1мс"
        const rusLt1 = trimmed.match(/Ответ от ([^:]+):\s*число байт=(\d+)\s*время<1\s*мс\s*TTL=(\d+)/i);
        if (rusLt1) {
          const result = { host: rusLt1[1].trim(), alive: true, bytes: parseInt(rusLt1[2]), time: 1, ttl: parseInt(rusLt1[3]) };
          results.push(result);
          mainWindow?.webContents.send('ping:reply', result);
          return;
        }

        // Russian normal: "время=5мс"
        const rusNormal = trimmed.match(/Ответ от ([^:]+):\s*число байт=(\d+)\s*время[=<](\d+)\s*мс\s*TTL=(\d+)/i);
        if (rusNormal) {
          const result = { host: rusNormal[1].trim(), alive: true, bytes: parseInt(rusNormal[2]), time: parseInt(rusNormal[3]), ttl: parseInt(rusNormal[4]) };
          results.push(result);
          mainWindow?.webContents.send('ping:reply', result);
          return;
        }

        // Timeout
        if (trimmed.match(/Request.*timed out|Превышен интервал ожидания/i)) {
          const result = { host, alive: false, error: 'Request timed out' };
          results.push(result);
          mainWindow?.webContents.send('ping:reply', result);
        }
      } else {
        const match = trimmed.match(/(\d+) bytes from ([^:]+): icmp_seq=(\d+) ttl=(\d+) time=([\d.]+) ms/i);
        if (match) {
          const result = { host: match[2], alive: true, bytes: parseInt(match[1]), time: parseFloat(match[5]), ttl: parseInt(match[4]) };
          results.push(result);
          mainWindow?.webContents.send('ping:reply', result);
        }
      }
    };

    proc.stdout.on('data', (data: Buffer) => {
      buffer += data.toString('utf8');
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      lines.forEach(parseLine);
    });

    proc.on('close', () => {
      if (buffer.trim()) parseLine(buffer);
      mainWindow?.webContents.send('ping:done');
      resolve({ success: true, data: results });
    });

    proc.on('error', (err: Error) => {
      resolve({ success: false, error: err.message });
    });
  });
});

ipcMain.handle('network:connect-wifi', async (_event, ssid: string, password?: string) => {
  try {
    const result = await NetworkService.connectWiFi(ssid, password);
    return result;
  } catch (err) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
});

ipcMain.handle('network:disconnect-wifi', async () => {
  try {
    const result = await NetworkService.disconnectWiFi();
    return result;
  } catch (err) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
});

ipcMain.handle('network:get-interfaces', async () => {
  try {
    const interfaces = await NetworkService.getNetworkInterfaces();
    return { success: true, data: interfaces };
  } catch (err) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
});

ipcMain.handle('network:dns-lookup', async (_event, domain: string, recordType: string) => {
  try {
    const records = await NetworkService.dnsLookup(domain, recordType);
    return { success: true, data: records };
  } catch (err) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
});

ipcMain.handle('network:reverse-dns', async (_event, ip: string) => {
  try {
    const hostnames = await NetworkService.reverseDNS(ip);
    return { success: true, data: hostnames };
  } catch (err) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
});

ipcMain.handle('network:scan-port', async (_event, host: string, port: number, timeout: number, protocol: string = 'tcp') => {
  try {
    if (protocol === 'udp') {
      const state = await NetworkService.scanUDPPort(host, port, timeout);
      return { success: true, data: state === 'open', state };
    } else {
      const isOpen = await NetworkService.scanPort(host, port, timeout);
      return { success: true, data: isOpen, state: isOpen ? 'open' : 'closed' };
    }
  } catch (err) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
});

// SSH IPC handlers
ipcMain.handle('ssh:connect', async (_event, options) => {
  try {
    const result = await SSHService.connect(options);
    return result;
  } catch (err) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
});

// Open PTY shell for interactive use
ipcMain.handle('ssh:open-shell', async (_event, connectionId: string) => {
  try {
    const result = await SSHService.openShell(
      connectionId,
      (data: string) => {
        mainWindow?.webContents.send('ssh:pty-data', { connectionId, data });
      },
      () => {
        mainWindow?.webContents.send('ssh:pty-close', { connectionId });
      }
    );
    return result;
  } catch (err) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
});

// Write to PTY shell
ipcMain.on('ssh:pty-write', (_event, connectionId: string, data: string) => {
  SSHService.writeToShell(connectionId, data);
});

// Resize PTY
ipcMain.on('ssh:pty-resize', (_event, connectionId: string, cols: number, rows: number) => {
  SSHService.resizeShell(connectionId, cols, rows);
});

ipcMain.handle('ssh:execute', async (_event, connectionId: string, command: string) => {
  try {
    const result = await SSHService.executeCommand(connectionId, command);
    return result;
  } catch (err) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
});

// Streaming SSH execute - sends output line by line in real-time
ipcMain.handle('ssh:execute-stream', async (_event, connectionId: string, command: string) => {
  // Get the active connection from SSHService
  const connections = SSHService.getActiveConnections();
  if (!connections.includes(connectionId)) {
    return { success: false, error: 'Connection not found' };
  }

  return new Promise((resolve) => {
    SSHService.executeCommandStream(
      connectionId,
      command,
      (data: string) => {
        mainWindow?.webContents.send('ssh:stdout', { connectionId, data });
      },
      (data: string) => {
        mainWindow?.webContents.send('ssh:stderr', { connectionId, data });
      },
      (code: number) => {
        mainWindow?.webContents.send('ssh:done', { connectionId, code });
        resolve({ success: true, exitCode: code });
      },
      (err: Error) => {
        mainWindow?.webContents.send('ssh:error', { connectionId, error: err.message });
        resolve({ success: false, error: err.message });
      }
    );
  });
});

ipcMain.handle('ssh:disconnect', async (_event, connectionId: string) => {
  try {
    const success = SSHService.disconnect(connectionId);
    return { success };
  } catch (err) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
});

// SSH File transfer handlers
ipcMain.handle('ssh:upload-file', async (_event, connectionId: string, localPath: string, remotePath: string) => {
  try {
    const result = await SSHService.uploadFile(connectionId, localPath, remotePath);
    return result;
  } catch (err) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ssh:download-file', async (_event, connectionId: string, remotePath: string, localPath: string) => {
  try {
    const result = await SSHService.downloadFile(connectionId, remotePath, localPath);
    return result;
  } catch (err) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ssh:list-remote-files', async (_event, connectionId: string, remotePath: string) => {
  try {
    const result = await SSHService.listRemoteFiles(connectionId, remotePath);
    return result;
  } catch (err) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
});

// Local file system handler
ipcMain.handle('fs:list-local-files', async (_event, localPath: string) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    const entries = await fs.readdir(localPath, { withFileTypes: true });
    const files = await Promise.all(
      entries.map(async (entry: any) => {
        const fullPath = path.join(localPath, entry.name);
        try {
          const stats = await fs.stat(fullPath);
          return {
            name: entry.name,
            type: entry.isDirectory() ? 'dir' : 'file',
            size: stats.size,
            modified: stats.mtime.toISOString(),
          };
        } catch {
          return null;
        }
      })
    );
    
    // Add parent directory entry
    const validFiles = files.filter(f => f !== null);
    if (localPath !== path.parse(localPath).root) {
      validFiles.unshift({ name: '..', type: 'dir', size: 0, modified: '' });
    }
    
    return { success: true, files: validFiles };
  } catch (err) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
});

// Create local folder handler
ipcMain.handle('fs:create-local-folder', async (_event, localPath: string, folderName: string) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    const fullPath = path.join(localPath, folderName);
    await fs.mkdir(fullPath, { recursive: true });
    
    return { success: true };
  } catch (err) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
});

// Create local file handler
ipcMain.handle('fs:create-local-file', async (_event, filePath: string) => {
  try {
    const fs = require('fs').promises;
    
    await fs.writeFile(filePath, '', 'utf8');
    
    return { success: true };
  } catch (err) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
});

// Delete local file handler
ipcMain.handle('fs:delete-local-file', async (_event, filePath: string) => {
  try {
    const fs = require('fs').promises;
    
    const stats = await fs.stat(filePath);
    if (stats.isDirectory()) {
      await fs.rm(filePath, { recursive: true, force: true });
    } else {
      await fs.unlink(filePath);
    }
    
    return { success: true };
  } catch (err) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
});

// Get special folders handler
ipcMain.handle('fs:get-special-paths', async () => {
  try {
    const { app } = require('electron');
    return {
      success: true,
      desktop: app.getPath('desktop'),
      downloads: app.getPath('downloads'),
      home: app.getPath('home'),
    };
  } catch (err) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
});
ipcMain.handle('fs:get-drives', async () => {
  try {
    const { execSync } = require('child_process');
    const os = require('os');
    
    if (os.platform() === 'win32') {
      // Use PowerShell to get drives - more reliable than wmic
      const output = execSync(
        'powershell -NoProfile -Command "Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Name"',
        { encoding: 'utf8' }
      );
      const drives = output
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line && line.length === 1 && line.match(/^[A-Za-z]$/))
        .map((line: string) => line.toUpperCase() + ':')
        .sort();
      
      console.log('[Drives] Found drives:', drives);
      return { success: true, drives: drives.length > 0 ? drives : ['C:'] };
    } else {
      return { success: true, drives: ['/'] };
    }
  } catch (err) {
    const error = err as Error;
    console.error('[Drives] Error:', error.message);
    return { success: false, error: error.message, drives: ['C:'] };
  }
});

// Bandwidth speed test handlers
import { speedTestService } from './services/SpeedTestService';

ipcMain.handle('network:speed-test-download', async (_event, testId: string, numConnections: number, duration: number) => {
  try {
    const result = await speedTestService.runDownloadTest(
      testId,
      numConnections,
      duration,
      (progress) => {
        mainWindow?.webContents.send('speed-test:progress', progress);
      }
    );
    return result;
  } catch (error) {
    const err = error as Error;
    console.error('[SpeedTest] Download test error:', err.message);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('network:speed-test-stop', async (_event, testId: string) => {
  speedTestService.stopTest(testId);
  return { success: true };
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle app quitting
app.on('before-quit', () => {
  isQuitting = true;
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.