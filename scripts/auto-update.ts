/**
 * Auto-update functionality for the application
 */

import { autoUpdater } from 'electron-updater';
import { BrowserWindow, dialog } from 'electron';

export class AutoUpdater {
  private mainWindow: BrowserWindow | null = null;
  private updateCheckInterval: NodeJS.Timeout | null = null;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.setupAutoUpdater();
  }

  private setupAutoUpdater(): void {
    // Configure auto-updater
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    // Check for updates on startup
    autoUpdater.checkForUpdatesAndNotify();

    // Check for updates every 4 hours
    this.updateCheckInterval = setInterval(() => {
      autoUpdater.checkForUpdatesAndNotify();
    }, 4 * 60 * 60 * 1000);

    // Event handlers
    autoUpdater.on('checking-for-update', () => {
      this.sendStatusToWindow('Checking for updates...');
    });

    autoUpdater.on('update-available', (info) => {
      this.sendStatusToWindow('Update available');
      this.showUpdateAvailableDialog(info);
    });

    autoUpdater.on('update-not-available', () => {
      this.sendStatusToWindow('App is up to date');
    });

    autoUpdater.on('error', (err) => {
      this.sendStatusToWindow('Error in auto-updater: ' + err);
    });

    autoUpdater.on('download-progress', (progressObj) => {
      const message = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`;
      this.sendStatusToWindow(message);
    });

    autoUpdater.on('update-downloaded', (info) => {
      this.sendStatusToWindow('Update downloaded');
      this.showUpdateDownloadedDialog(info);
    });
  }

  private sendStatusToWindow(text: string): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('update-status', text);
    }
  }

  private showUpdateAvailableDialog(info: any): void {
    if (!this.mainWindow) return;

    dialog
      .showMessageBox(this.mainWindow, {
        type: 'info',
        title: 'Update Available',
        message: `A new version ${info.version} is available. Do you want to download it now?`,
        buttons: ['Download', 'Later'],
        defaultId: 0,
        cancelId: 1,
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.downloadUpdate();
        }
      });
  }

  private showUpdateDownloadedDialog(info: any): void {
    if (!this.mainWindow) return;

    dialog
      .showMessageBox(this.mainWindow, {
        type: 'info',
        title: 'Update Ready',
        message: `Version ${info.version} has been downloaded. Restart the application to apply the update.`,
        buttons: ['Restart Now', 'Later'],
        defaultId: 0,
        cancelId: 1,
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
  }

  public checkForUpdates(): void {
    autoUpdater.checkForUpdates();
  }

  public destroy(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
  }
}
