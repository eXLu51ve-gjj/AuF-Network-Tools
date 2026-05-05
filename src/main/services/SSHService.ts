import { Client, ConnectConfig } from 'ssh2';
import * as fs from 'fs';
import * as os from 'os';

export interface SSHConnectOptions {
  host: string;
  port: number;
  username: string;
  authMethod: 'password' | 'key' | 'agent';
  password?: string;
  keyPath?: string;
}

export interface SSHConnectionResult {
  success: boolean;
  connectionId?: string;
  error?: string;
}

export interface SSHCommandResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  error?: string;
}

const activeConnections = new Map<string, Client>();
const ptyShells = new Map<string, any>();

export class SSHService {

  static async connect(options: SSHConnectOptions): Promise<SSHConnectionResult> {
    return new Promise((resolve) => {
      const conn = new Client();
      const connectionId = `ssh-${Date.now()}`;

      const config: ConnectConfig = {
        host: options.host,
        port: options.port,
        username: options.username,
        readyTimeout: 10000,
        keepaliveInterval: 30000,
      };

      if (options.authMethod === 'password' && options.password) {
        config.password = options.password;
      } else if (options.authMethod === 'key' && options.keyPath) {
        try {
          const keyPath = options.keyPath.replace('~', os.homedir());
          config.privateKey = fs.readFileSync(keyPath);
        } catch (err) {
          resolve({ success: false, error: `Failed to read private key: ${(err as Error).message}` });
          return;
        }
      } else if (options.authMethod === 'agent') {
        config.agent = process.env.SSH_AUTH_SOCK;
      }

      conn.on('ready', () => {
        activeConnections.set(connectionId, conn);
        resolve({ success: true, connectionId });
      });

      conn.on('error', (err) => {
        resolve({ success: false, error: err.message });
      });

      try {
        conn.connect(config);
      } catch (err) {
        resolve({ success: false, error: (err as Error).message });
      }
    });
  }

  /**
   * Open a PTY shell for interactive use (supports sudo, vim, etc.)
   */
  static openShell(
    connectionId: string,
    onData: (data: string) => void,
    onClose: () => void
  ): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      const conn = activeConnections.get(connectionId);
      if (!conn) {
        resolve({ success: false, error: 'Connection not found' });
        return;
      }

      // Close existing shell if any
      const existing = ptyShells.get(connectionId);
      if (existing) {
        try { existing.end(); } catch {}
        ptyShells.delete(connectionId);
      }

      conn.shell(
        { 
          term: 'xterm-256color', 
          cols: 220, 
          rows: 50,
          env: {
            TERM: 'xterm-256color',
            COLORTERM: 'truecolor',
            CLICOLOR: '1',
            CLICOLOR_FORCE: '1',
          }
        } as any,
        (err: Error | undefined, stream: any) => {
          if (err) {
            resolve({ success: false, error: err.message });
            return;
          }

          ptyShells.set(connectionId, stream);

          stream.on('data', (data: Buffer) => {
            onData(data.toString('utf8'));
          });

          stream.on('close', () => {
            ptyShells.delete(connectionId);
            onClose();
          });

          // ═══════════════════════════════════════════════════════════════════
          // INITIALIZE LS_COLORS - Like Termius does
          // ═══════════════════════════════════════════════════════════════════
          // This makes ls, grep, and other commands use colors properly
          // Format: type=ANSI_CODE where ANSI codes are like "1;34" (bright blue)
          const LS_COLORS = [
            'rs=0',           // reset
            'di=1;34',        // directories - bright blue (\x1b[1;34m)
            'ln=1;36',        // symlinks - bright cyan (\x1b[1;36m)
            'mh=00',          // multi-hardlink
            'pi=40;33',       // pipe
            'so=1;35',        // socket - bright magenta
            'do=1;35',        // door
            'bd=40;33;1',     // block device
            'cd=40;33;1',     // char device
            'or=40;31;1',     // orphan symlink - red on black
            'mi=00',          // missing file
            'su=37;41',       // setuid - white on red
            'sg=30;43',       // setgid - black on yellow
            'ca=30;41',       // capability
            'tw=30;42',       // sticky other writable - black on green
            'ow=34;42',       // other writable - blue on green
            'st=37;44',       // sticky - white on blue
            'ex=1;32',        // executable - bright green (\x1b[1;32m)
            // Archives - bright red
            '*.tar=1;31', '*.tgz=1;31', '*.arc=1;31', '*.arj=1;31',
            '*.taz=1;31', '*.lha=1;31', '*.lz4=1;31', '*.lzh=1;31',
            '*.lzma=1;31', '*.tlz=1;31', '*.txz=1;31', '*.tzo=1;31',
            '*.t7z=1;31', '*.zip=1;31', '*.z=1;31', '*.dz=1;31',
            '*.gz=1;31', '*.lrz=1;31', '*.lz=1;31', '*.lzo=1;31',
            '*.xz=1;31', '*.zst=1;31', '*.tzst=1;31', '*.bz2=1;31',
            '*.bz=1;31', '*.tbz=1;31', '*.tbz2=1;31', '*.tz=1;31',
            '*.deb=1;31', '*.rpm=1;31', '*.jar=1;31', '*.war=1;31',
            '*.ear=1;31', '*.sar=1;31', '*.rar=1;31', '*.alz=1;31',
            '*.ace=1;31', '*.zoo=1;31', '*.cpio=1;31', '*.7z=1;31',
            '*.rz=1;31', '*.cab=1;31', '*.wim=1;31', '*.swm=1;31',
            '*.dwm=1;31', '*.esd=1;31',
            // Images - bright magenta
            '*.jpg=1;35', '*.jpeg=1;35', '*.mjpg=1;35', '*.mjpeg=1;35',
            '*.gif=1;35', '*.bmp=1;35', '*.pbm=1;35', '*.pgm=1;35',
            '*.ppm=1;35', '*.tga=1;35', '*.xbm=1;35', '*.xpm=1;35',
            '*.tif=1;35', '*.tiff=1;35', '*.png=1;35', '*.svg=1;35',
            '*.svgz=1;35', '*.mng=1;35', '*.pcx=1;35', '*.mov=1;35',
            '*.mpg=1;35', '*.mpeg=1;35', '*.m2v=1;35', '*.mkv=1;35',
            '*.webm=1;35', '*.webp=1;35', '*.ogm=1;35', '*.mp4=1;35',
            '*.m4v=1;35', '*.mp4v=1;35', '*.vob=1;35', '*.qt=1;35',
            '*.nuv=1;35', '*.wmv=1;35', '*.asf=1;35', '*.rm=1;35',
            '*.rmvb=1;35', '*.flc=1;35', '*.avi=1;35', '*.fli=1;35',
            '*.flv=1;35', '*.gl=1;35', '*.dl=1;35', '*.xcf=1;35',
            '*.xwd=1;35', '*.yuv=1;35', '*.cgm=1;35', '*.emf=1;35',
            // Audio - cyan
            '*.aac=0;36', '*.au=0;36', '*.flac=0;36', '*.m4a=0;36',
            '*.mid=0;36', '*.midi=0;36', '*.mka=0;36', '*.mp3=0;36',
            '*.mpc=0;36', '*.ogg=0;36', '*.ra=0;36', '*.wav=0;36',
            '*.oga=0;36', '*.opus=0;36', '*.spx=0;36', '*.xspf=0;36',
            // Documents - normal white
            '*.pdf=0;37', '*.doc=0;37', '*.docx=0;37', '*.xls=0;37',
            '*.xlsx=0;37', '*.ppt=0;37', '*.pptx=0;37', '*.odt=0;37',
            '*.ods=0;37', '*.odp=0;37', '*.txt=0;37',
          ].join(':');

          // Send initialization commands
          // Use setTimeout to ensure shell is ready
          setTimeout(() => {
            try {
              // Set LS_COLORS for colored ls output
              stream.write(`export LS_COLORS="${LS_COLORS}"\r`);
              
              // Set aliases for colored output
              stream.write(`alias ls='ls --color=auto'\r`);
              stream.write(`alias grep='grep --color=auto'\r`);
              stream.write(`alias fgrep='fgrep --color=auto'\r`);
              stream.write(`alias egrep='egrep --color=auto'\r`);
              
              // Clear the screen to hide initialization commands
              stream.write('clear\r');
            } catch (e) {
              console.error('Failed to initialize shell colors:', e);
            }
          }, 100);

          resolve({ success: true });
        }
      );
    });
  }

  static writeToShell(connectionId: string, data: string): boolean {
    const shell = ptyShells.get(connectionId);
    if (!shell) return false;
    shell.write(data);
    return true;
  }

  static resizeShell(connectionId: string, cols: number, rows: number): void {
    const shell = ptyShells.get(connectionId);
    if (shell && shell.setWindow) {
      shell.setWindow(rows, cols, 0, 0);
    }
  }

  static executeCommandStream(
    connectionId: string,
    command: string,
    onStdout: (data: string) => void,
    onStderr: (data: string) => void,
    onClose: (code: number) => void,
    onError: (err: Error) => void
  ): void {
    const conn = activeConnections.get(connectionId);
    if (!conn) {
      onError(new Error('Connection not found'));
      return;
    }

    conn.exec(command, (err, stream) => {
      if (err) { onError(err); return; }

      stream.on('close', (code: number) => onClose(code || 0));
      stream.on('data', (data: Buffer) => onStdout(data.toString()));
      stream.stderr.on('data', (data: Buffer) => onStderr(data.toString()));
      stream.on('error', (err: Error) => onError(err));
    });
  }

  static async executeCommand(connectionId: string, command: string): Promise<SSHCommandResult> {
    const conn = activeConnections.get(connectionId);
    if (!conn) return { success: false, error: 'Connection not found' };

    return new Promise((resolve) => {
      conn.exec(command, (err, stream) => {
        if (err) { resolve({ success: false, error: err.message }); return; }

        let stdout = '';
        let stderr = '';

        stream.on('close', (code: number) => resolve({ success: true, stdout, stderr, exitCode: code }));
        stream.on('data', (data: Buffer) => { stdout += data.toString(); });
        stream.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });
      });
    });
  }

  static disconnect(connectionId: string): boolean {
    const shell = ptyShells.get(connectionId);
    if (shell) { try { shell.end(); } catch {} ptyShells.delete(connectionId); }
    const conn = activeConnections.get(connectionId);
    if (conn) { conn.end(); activeConnections.delete(connectionId); return true; }
    return false;
  }

  static getActiveConnections(): string[] {
    return Array.from(activeConnections.keys());
  }

  static isConnected(connectionId: string): boolean {
    return activeConnections.has(connectionId);
  }

  /**
   * Upload file or directory to remote server via SFTP
   */
  static async uploadFile(
    connectionId: string,
    localPath: string,
    remotePath: string
  ): Promise<{ success: boolean; error?: string }> {
    console.log('[SSHService] uploadFile called:', { connectionId, localPath, remotePath });
    
    return new Promise(async (resolve) => {
      const conn = activeConnections.get(connectionId);
      if (!conn) {
        console.error('[SSHService] Connection not found:', connectionId);
        resolve({ success: false, error: 'Connection not found' });
        return;
      }

      // Check if it's a directory
      const fs = require('fs');
      const path = require('path');
      
      try {
        const stats = fs.statSync(localPath);
        
        if (stats.isDirectory()) {
          // Upload directory recursively
          console.log('[SSHService] Uploading directory recursively...');
          conn.sftp(async (err, sftp) => {
            if (err) {
              console.error('[SSHService] SFTP error:', err);
              resolve({ success: false, error: err.message });
              return;
            }

            try {
              // Create remote directory
              await new Promise((res, rej) => {
                sftp.mkdir(remotePath, (err) => {
                  if (err && err.message !== 'Failure') rej(err);
                  else res(true);
                });
              });

              // Upload all files in directory
              const files = fs.readdirSync(localPath);
              for (const file of files) {
                const localFilePath = path.join(localPath, file);
                const remoteFilePath = `${remotePath}/${file}`;
                const fileStats = fs.statSync(localFilePath);

                if (fileStats.isDirectory()) {
                  // Recursive upload
                  const result = await SSHService.uploadFile(connectionId, localFilePath, remoteFilePath);
                  if (!result.success) {
                    sftp.end();
                    resolve(result);
                    return;
                  }
                } else {
                  // Upload file
                  await new Promise((res, rej) => {
                    sftp.fastPut(localFilePath, remoteFilePath, (err) => {
                      if (err) rej(err);
                      else res(true);
                    });
                  });
                }
              }

              sftp.end();
              console.log('[SSHService] Directory upload successful!');
              resolve({ success: true });
            } catch (err: any) {
              sftp.end();
              console.error('[SSHService] Directory upload error:', err);
              resolve({ success: false, error: err.message });
            }
          });
        } else {
          // Upload single file
          console.log('[SSHService] Getting SFTP session...');
          conn.sftp((err, sftp) => {
            if (err) {
              console.error('[SSHService] SFTP error:', err);
              resolve({ success: false, error: err.message });
              return;
            }

            console.log('[SSHService] Starting fastPut...');
            sftp.fastPut(localPath, remotePath, (err) => {
              sftp.end();
              if (err) {
                console.error('[SSHService] fastPut error:', err);
                resolve({ success: false, error: err.message });
              } else {
                console.log('[SSHService] Upload successful!');
                resolve({ success: true });
              }
            });
          });
        }
      } catch (err: any) {
        console.error('[SSHService] File stat error:', err);
        resolve({ success: false, error: err.message });
      }
    });
  }

  /**
   * Download file or directory from remote server via SFTP
   */
  static async downloadFile(
    connectionId: string,
    remotePath: string,
    localPath: string
  ): Promise<{ success: boolean; error?: string }> {
    console.log('[SSHService] downloadFile called:', { connectionId, remotePath, localPath });
    
    return new Promise(async (resolve) => {
      const conn = activeConnections.get(connectionId);
      if (!conn) {
        console.error('[SSHService] Connection not found:', connectionId);
        resolve({ success: false, error: 'Connection not found' });
        return;
      }

      console.log('[SSHService] Getting SFTP session...');
      conn.sftp(async (err, sftp) => {
        if (err) {
          console.error('[SSHService] SFTP error:', err);
          resolve({ success: false, error: err.message });
          return;
        }

        try {
          // Check if remote path is a directory
          const stats: any = await new Promise((res, rej) => {
            sftp.stat(remotePath, (err, stats) => {
              if (err) rej(err);
              else res(stats);
            });
          });

          if (stats.isDirectory()) {
            // Download directory recursively
            console.log('[SSHService] Downloading directory recursively...');
            const fs = require('fs');
            const path = require('path');

            // Create local directory
            if (!fs.existsSync(localPath)) {
              fs.mkdirSync(localPath, { recursive: true });
            }

            // List remote directory
            const files: any[] = await new Promise((res, rej) => {
              sftp.readdir(remotePath, (err, list) => {
                if (err) rej(err);
                else res(list);
              });
            });

            // Download all files
            for (const file of files) {
              const remoteFilePath = `${remotePath}/${file.filename}`;
              const localFilePath = path.join(localPath, file.filename);

              if (file.attrs.isDirectory()) {
                // Recursive download
                const result = await SSHService.downloadFile(connectionId, remoteFilePath, localFilePath);
                if (!result.success) {
                  sftp.end();
                  resolve(result);
                  return;
                }
              } else {
                // Download file
                await new Promise((res, rej) => {
                  sftp.fastGet(remoteFilePath, localFilePath, (err) => {
                    if (err) rej(err);
                    else res(true);
                  });
                });
              }
            }

            sftp.end();
            console.log('[SSHService] Directory download successful!');
            resolve({ success: true });
          } else {
            // Download single file
            console.log('[SSHService] Starting fastGet...');
            
            // Ensure parent directory exists
            const fs = require('fs');
            const path = require('path');
            const parentDir = path.dirname(localPath);
            if (!fs.existsSync(parentDir)) {
              fs.mkdirSync(parentDir, { recursive: true });
            }
            
            sftp.fastGet(remotePath, localPath, (err) => {
              sftp.end();
              if (err) {
                console.error('[SSHService] fastGet error:', err);
                resolve({ success: false, error: err.message });
              } else {
                console.log('[SSHService] Download successful!');
                resolve({ success: true });
              }
            });
          }
        } catch (err: any) {
          sftp.end();
          console.error('[SSHService] Download error:', err);
          resolve({ success: false, error: err.message });
        }
      });
    });
  }

  /**
   * List files in remote directory via SFTP
   */
  static async listRemoteFiles(
    connectionId: string,
    remotePath: string
  ): Promise<{ success: boolean; files?: any[]; error?: string }> {
    return new Promise((resolve) => {
      const conn = activeConnections.get(connectionId);
      if (!conn) {
        resolve({ success: false, error: 'Connection not found' });
        return;
      }

      conn.sftp((err, sftp) => {
        if (err) {
          resolve({ success: false, error: err.message });
          return;
        }

        sftp.readdir(remotePath, (err, list) => {
          sftp.end();
          if (err) {
            resolve({ success: false, error: err.message });
          } else {
            resolve({ success: true, files: list });
          }
        });
      });
    });
  }
}
