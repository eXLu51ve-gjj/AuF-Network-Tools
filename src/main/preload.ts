import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Window control
  windowControl: (action: string) => ipcRenderer.send('window-control', action),
  updateTheme: (themeConfig: any) => ipcRenderer.invoke('update-theme', themeConfig),

  // Network
  ping: (host: string, count: number, timeout: number) =>
    ipcRenderer.invoke('network:ping', host, count, timeout),
  pingStream: (host: string, count: number, timeout: number) =>
    ipcRenderer.invoke('network:ping-stream', host, count, timeout),
  traceroute: (host: string, maxHops: number) =>
    ipcRenderer.invoke('network:traceroute', host, maxHops),
  tracerouteStream: (host: string, maxHops: number, protocol?: string) =>
    ipcRenderer.invoke('network:traceroute-stream', host, maxHops, protocol || 'icmp'),
  scanWiFi: () => ipcRenderer.invoke('network:scan-wifi'),
  connectWiFi: (ssid: string, password?: string) =>
    ipcRenderer.invoke('network:connect-wifi', ssid, password),
  disconnectWiFi: () => ipcRenderer.invoke('network:disconnect-wifi'),
  getNetworkInterfaces: () => ipcRenderer.invoke('network:get-interfaces'),
  dnsLookup: (domain: string, recordType: string) =>
    ipcRenderer.invoke('network:dns-lookup', domain, recordType),
  reverseDNS: (ip: string) => ipcRenderer.invoke('network:reverse-dns', ip),
  scanPort: (host: string, port: number, timeout: number, protocol?: string) =>
    ipcRenderer.invoke('network:scan-port', host, port, timeout, protocol || 'tcp'),

  // SSH
  sshConnect: (options: any) => ipcRenderer.invoke('ssh:connect', options),
  sshOpenShell: (connectionId: string) => ipcRenderer.invoke('ssh:open-shell', connectionId),
  sshPtyWrite: (connectionId: string, data: string) =>
    ipcRenderer.send('ssh:pty-write', connectionId, data),
  sshPtyResize: (connectionId: string, cols: number, rows: number) =>
    ipcRenderer.send('ssh:pty-resize', connectionId, cols, rows),
  sshExecute: (connectionId: string, command: string) =>
    ipcRenderer.invoke('ssh:execute', connectionId, command),
  sshExecuteStream: (connectionId: string, command: string) =>
    ipcRenderer.invoke('ssh:execute-stream', connectionId, command),
  sshDisconnect: (connectionId: string) => ipcRenderer.invoke('ssh:disconnect', connectionId),
  sshUploadFile: (connectionId: string, localPath: string, remotePath: string) =>
    ipcRenderer.invoke('ssh:upload-file', connectionId, localPath, remotePath),
  sshDownloadFile: (connectionId: string, remotePath: string, localPath: string) =>
    ipcRenderer.invoke('ssh:download-file', connectionId, remotePath, localPath),
  sshListRemoteFiles: (connectionId: string, remotePath: string) =>
    ipcRenderer.invoke('ssh:list-remote-files', connectionId, remotePath),
  listLocalFiles: (localPath: string) =>
    ipcRenderer.invoke('fs:list-local-files', localPath),
  createLocalFolder: (localPath: string, folderName: string) =>
    ipcRenderer.invoke('fs:create-local-folder', localPath, folderName),
  createLocalFile: (filePath: string) =>
    ipcRenderer.invoke('fs:create-local-file', filePath),
  deleteLocalFile: (filePath: string) =>
    ipcRenderer.invoke('fs:delete-local-file', filePath),
  getDrives: () =>
    ipcRenderer.invoke('fs:get-drives'),
  getSpecialPaths: () =>
    ipcRenderer.invoke('fs:get-special-paths'),

  // Speed test
  speedTestDownload: (testId: string, numConnections: number, duration: number) =>
    ipcRenderer.invoke('network:speed-test-download', testId, numConnections, duration),
  speedTestUpload: (testId: string, duration: number) =>
    ipcRenderer.invoke('network:speed-test-upload', testId, duration),
  speedTestStop: (testId: string) =>
    ipcRenderer.invoke('network:speed-test-stop', testId),

  // Event listeners
  on: (channel: string, callback: Function) => {
    const validChannels = [
      'new-scan', 'open-preferences', 'open-about', 'quick-scan', 'open-wifi-scanner', 'open-ssh-terminal',
      'traceroute:hop', 'traceroute:done',
      'ping:reply', 'ping:done',
      'ssh:stdout', 'ssh:stderr', 'ssh:done', 'ssh:error',
      'ssh:pty-data', 'ssh:pty-close',
      'speed-test:progress',
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_event, ...args) => callback(...args));
    }
  },

  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },

  readConfig: (filePath: string) => ipcRenderer.invoke('read-config', filePath),
  writeConfig: (filePath: string, data: any) => ipcRenderer.invoke('write-config', filePath, data),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
});

declare global {
  interface Window {
    electronAPI: {
      windowControl: (action: string) => void;
      updateTheme: (themeConfig: any) => Promise<any>;
      ping: (host: string, count: number, timeout: number) => Promise<any>;
      pingStream: (host: string, count: number, timeout: number) => Promise<any>;
      traceroute: (host: string, maxHops: number) => Promise<any>;
      tracerouteStream: (host: string, maxHops: number, protocol?: string) => Promise<any>;
      scanWiFi: () => Promise<any>;
      connectWiFi: (ssid: string, password?: string) => Promise<any>;
      disconnectWiFi: () => Promise<any>;
      getNetworkInterfaces: () => Promise<any>;
      dnsLookup: (domain: string, recordType: string) => Promise<any>;
      reverseDNS: (ip: string) => Promise<any>;
      scanPort: (host: string, port: number, timeout: number, protocol?: string) => Promise<any>;
      sshConnect: (options: any) => Promise<any>;
      sshOpenShell: (connectionId: string) => Promise<any>;
      sshPtyWrite: (connectionId: string, data: string) => void;
      sshPtyResize: (connectionId: string, cols: number, rows: number) => void;
      sshExecute: (connectionId: string, command: string) => Promise<any>;
      sshExecuteStream: (connectionId: string, command: string) => Promise<any>;
      sshDisconnect: (connectionId: string) => Promise<any>;
      sshUploadFile: (connectionId: string, localPath: string, remotePath: string) => Promise<any>;
      sshDownloadFile: (connectionId: string, remotePath: string, localPath: string) => Promise<any>;
      sshListRemoteFiles: (connectionId: string, remotePath: string) => Promise<any>;
      listLocalFiles: (localPath: string) => Promise<any>;
      createLocalFolder: (localPath: string, folderName: string) => Promise<any>;
      createLocalFile: (filePath: string) => Promise<any>;
      deleteLocalFile: (filePath: string) => Promise<any>;
      getDrives: () => Promise<any>;
      getSpecialPaths: () => Promise<any>;
      speedTestDownload: (testId: string, numConnections: number, duration: number) => Promise<any>;
      speedTestUpload: (testId: string, duration: number) => Promise<any>;
      speedTestStop: (testId: string) => Promise<any>;
      on: (channel: string, callback: Function) => void;
      removeAllListeners: (channel: string) => void;
      readConfig: (filePath: string) => Promise<any>;
      writeConfig: (filePath: string, data: any) => Promise<any>;
      getSystemInfo: () => Promise<any>;
    };
  }
}
