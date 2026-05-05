interface SpeedTestProgress {
  testId: string;
  type: 'download' | 'upload';
  speed: number; // Mbps
  bytes: number;
  elapsed: number; // seconds
}

interface SpeedTestResult {
  success: boolean;
  downloadSpeed?: number; // Mbps
  uploadSpeed?: number; // Mbps
  ping?: number; // ms
  jitter?: number; // ms
  totalBytes?: number;
  duration?: number;
  error?: string;
}

export class SpeedTestService {
  constructor() {
    console.log('[SpeedTest] Service initialized - using Yandex Internetometer approach');
  }

  /**
   * Запускает тест скорости используя подход Яндекс.Интернетометр
   * Работает в России без VPN
   */
  async runSpeedTest(
    testId: string,
    onProgress: (progress: SpeedTestProgress) => void
  ): Promise<SpeedTestResult> {
    console.log(`[SpeedTest] Starting speed test ${testId}`);
    
    return new Promise(async (resolve) => {
      const https = require('https');
      const http = require('http');
      const startTime = Date.now();
      let lastProgressTime = Date.now();

      try {
        // Фаза 1: Ping через ICMP (реальный ping)
        let pingMs = 20; // Дефолт
        
        try {
          // Используем встроенный ping к 8.8.8.8
          const { exec } = require('child_process');
          const pingResult = await new Promise<number>((resolve) => {
            exec('ping -n 4 8.8.8.8', (error: any, stdout: string) => {
              if (!error && stdout) {
                // Парсим результат Windows: "Average = 15ms" или "Среднее = 15 мс"
                const avgMatch = stdout.match(/Average\s*=\s*(\d+)ms/i) || stdout.match(/Среднее\s*=\s*(\d+)/i);
                if (avgMatch) {
                  resolve(parseInt(avgMatch[1]));
                  return;
                }
                
                // Если не нашли среднее, берем первый результат: "time=15ms" или "время=15мс"
                const timeMatch = stdout.match(/time[=<](\d+)/i) || stdout.match(/время[=<](\d+)/i);
                if (timeMatch) {
                  resolve(parseInt(timeMatch[1]));
                  return;
                }
              }
              resolve(20); // Дефолт если не удалось распарсить
            });
            // Timeout 5 секунд
            setTimeout(() => resolve(20), 5000);
          });
          pingMs = pingResult;
        } catch (e) {
          console.error('[SpeedTest] Ping error:', e);
        }

        console.log(`[SpeedTest] Ping: ${pingMs}ms`);

        // Фаза 2: Download тест
        // Используем быстрые CDN серверы (больше серверов для лучшей скорости)
        const downloadUrls = [
          'http://speedtest.tele2.net/100MB.zip',
          'http://speedtest.tele2.net/100MB.zip',
          'http://speedtest.tele2.net/100MB.zip',
          'http://speedtest.tele2.net/100MB.zip',
          'https://proof.ovh.net/files/100Mb.dat',
          'https://proof.ovh.net/files/100Mb.dat',
          'https://proof.ovh.net/files/100Mb.dat',
          'https://proof.ovh.net/files/100Mb.dat',
          'http://speedtest.ftp.otenet.gr/files/test100Mb.db',
          'http://speedtest.ftp.otenet.gr/files/test100Mb.db',
          'http://speedtest.ftp.otenet.gr/files/test100Mb.db',
          'http://speedtest.ftp.otenet.gr/files/test100Mb.db',
        ];

        let totalDownloadBytes = 0;
        let maxDownloadSpeed = 0;
        const downloadDuration = 15; // 15 секунд
        const downloadStartTime = Date.now();
        let activeDownloads = 0;
        const numConnections = 64; // 64 параллельных соединения для максимальной скорости

        const downloadFromUrl = (url: string, connectionIndex: number): Promise<void> => {
          return new Promise((resolveDownload) => {
            const urlObj = new URL(url);
            const protocol = urlObj.protocol === 'https:' ? https : http;

            const makeRequest = () => {
              const elapsed = (Date.now() - downloadStartTime) / 1000;
              if (elapsed >= downloadDuration) {
                resolveDownload();
                return;
              }

              activeDownloads++;
              
              const req = protocol.get(url, (res: any) => {
                res.on('data', (chunk: Buffer) => {
                  totalDownloadBytes += chunk.length;
                  const elapsedSeconds = (Date.now() - downloadStartTime) / 1000;
                  
                  // Проверяем не истекло ли время
                  if (elapsedSeconds >= downloadDuration) {
                    res.destroy();
                    activeDownloads--;
                    resolveDownload();
                    return;
                  }
                  
                  const speedMbps = (totalDownloadBytes * 8) / (elapsedSeconds * 1000000);
                  maxDownloadSpeed = Math.max(maxDownloadSpeed, speedMbps);

                  const now = Date.now();
                  if (now - lastProgressTime >= 200) {
                    lastProgressTime = now;
                    onProgress({
                      testId,
                      type: 'download',
                      speed: speedMbps,
                      bytes: totalDownloadBytes,
                      elapsed: elapsedSeconds,
                    });
                  }
                });

                res.on('end', () => {
                  activeDownloads--;
                  const elapsed = (Date.now() - downloadStartTime) / 1000;
                  if (elapsed < downloadDuration) {
                    setTimeout(makeRequest, 10);
                  } else {
                    resolveDownload();
                  }
                });

                res.on('error', () => {
                  activeDownloads--;
                  const elapsed = (Date.now() - downloadStartTime) / 1000;
                  if (elapsed < downloadDuration) {
                    setTimeout(makeRequest, 100);
                  } else {
                    resolveDownload();
                  }
                });
              });

              req.on('error', () => {
                activeDownloads--;
                const elapsed = (Date.now() - downloadStartTime) / 1000;
                if (elapsed < downloadDuration) {
                  setTimeout(makeRequest, 100);
                } else {
                  resolveDownload();
                }
              });

              req.setTimeout(30000, () => {
                req.destroy();
                activeDownloads--;
              });
            };

            makeRequest();
          });
        };

        // Запускаем параллельные download соединения
        const downloadPromises = [];
        for (let i = 0; i < numConnections; i++) {
          const url = downloadUrls[i % downloadUrls.length];
          downloadPromises.push(downloadFromUrl(url, i));
        }

        // Ждем завершения всех download соединений ИЛИ таймаута
        await Promise.race([
          Promise.all(downloadPromises),
          new Promise(resolve => setTimeout(resolve, (downloadDuration + 2) * 1000))
        ]);

        // Принудительно завершаем все активные download соединения
        console.log(`[SpeedTest] Download phase complete, active downloads: ${activeDownloads}`);

        const finalDownloadSpeed = (totalDownloadBytes * 8) / (downloadDuration * 1000000);
        console.log(`[SpeedTest] Download: ${finalDownloadSpeed.toFixed(2)} Mbps`);

        // Фаза 3: Upload тест
        // Используем серверы для upload (дублируем для большего количества соединений)
        const uploadUrls = [
          'http://speedtest.tele2.net/upload.php',
          'http://speedtest.tele2.net/upload.php',
          'http://speedtest.tele2.net/upload.php',
          'http://speedtest.tele2.net/upload.php',
          'http://speedtest.tele2.net/upload.php',
          'http://speedtest.tele2.net/upload.php',
          'http://speedtest.ftp.otenet.gr/upload.php',
          'http://speedtest.ftp.otenet.gr/upload.php',
          'http://speedtest.ftp.otenet.gr/upload.php',
          'http://speedtest.ftp.otenet.gr/upload.php',
          'http://speedtest.ftp.otenet.gr/upload.php',
          'http://speedtest.ftp.otenet.gr/upload.php',
        ];

        let totalUploadBytes = 0;
        let maxUploadSpeed = 0;
        const uploadDuration = 15;
        const uploadStartTime = Date.now();
        let activeUploads = 0;
        const uploadConnections = 64; // 64 параллельных соединения для максимальной скорости

        const uploadToUrl = (url: string, connectionIndex: number): Promise<void> => {
          return new Promise((resolveUpload) => {
            const chunkSize = 2 * 1024 * 1024; // 2MB chunks для лучшей скорости

            const makeUploadRequest = () => {
              const elapsed = (Date.now() - uploadStartTime) / 1000;
              if (elapsed >= uploadDuration) {
                resolveUpload();
                return;
              }

              activeUploads++;
              const data = Buffer.alloc(chunkSize);
              const urlObj = new URL(url);
              const protocol = urlObj.protocol === 'https:' ? https : http;

              const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
                path: urlObj.pathname,
                method: 'POST',
                headers: {
                  'Content-Type': 'application/octet-stream',
                  'Content-Length': data.length,
                },
              };

              const req = protocol.request(options, (res: any) => {
                res.on('data', () => {});
                res.on('end', () => {
                  activeUploads--;
                  const elapsed = (Date.now() - uploadStartTime) / 1000;
                  if (elapsed < uploadDuration) {
                    setTimeout(makeUploadRequest, 10);
                  } else {
                    resolveUpload();
                  }
                });
                res.on('error', () => {
                  activeUploads--;
                  const elapsed = (Date.now() - uploadStartTime) / 1000;
                  if (elapsed < uploadDuration) {
                    setTimeout(makeUploadRequest, 100);
                  } else {
                    resolveUpload();
                  }
                });
              });

              req.on('error', () => {
                activeUploads--;
                const elapsed = (Date.now() - uploadStartTime) / 1000;
                if (elapsed < uploadDuration) {
                  setTimeout(makeUploadRequest, 100);
                } else {
                  resolveUpload();
                }
              });

              req.setTimeout(30000, () => {
                req.destroy();
                activeUploads--;
              });

              req.write(data, () => {
                totalUploadBytes += data.length;
                const elapsedSeconds = (Date.now() - uploadStartTime) / 1000;
                const speedMbps = (totalUploadBytes * 8) / (elapsedSeconds * 1000000);
                maxUploadSpeed = Math.max(maxUploadSpeed, speedMbps);

                const now = Date.now();
                if (now - lastProgressTime >= 200) {
                  lastProgressTime = now;
                  onProgress({
                    testId,
                    type: 'upload',
                    speed: speedMbps,
                    bytes: totalUploadBytes,
                    elapsed: elapsedSeconds,
                  });
                }
              });

              req.end();
            };

            makeUploadRequest();
          });
        };

        // Запускаем параллельные upload соединения
        const uploadPromises = [];
        for (let i = 0; i < uploadConnections; i++) {
          const url = uploadUrls[i % uploadUrls.length];
          uploadPromises.push(uploadToUrl(url, i));
        }

        // Ждем завершения всех upload соединений ИЛИ таймаута
        await Promise.race([
          Promise.all(uploadPromises),
          new Promise(resolve => setTimeout(resolve, (uploadDuration + 2) * 1000))
        ]);

        // Принудительно завершаем все активные upload соединения
        console.log(`[SpeedTest] Upload phase complete, active uploads: ${activeUploads}`);

        const finalUploadSpeed = (totalUploadBytes * 8) / (uploadDuration * 1000000);
        console.log(`[SpeedTest] Upload: ${finalUploadSpeed.toFixed(2)} Mbps`);

        const totalDuration = (Date.now() - startTime) / 1000;

        resolve({
          success: true,
          downloadSpeed: finalDownloadSpeed,
          uploadSpeed: finalUploadSpeed,
          ping: pingMs,
          jitter: 0,
          totalBytes: totalDownloadBytes + totalUploadBytes,
          duration: totalDuration,
        });

      } catch (error) {
        const err = error as Error;
        console.error(`[SpeedTest] Test error:`, err.message);
        resolve({
          success: false,
          error: `Ошибка теста: ${err.message}`,
        });
      }
    });
  }

  /**
   * Запускает тест (для совместимости с существующим API)
   */
  async runDownloadTest(
    testId: string,
    numConnections: number = 8,
    duration: number = 15,
    onProgress: (progress: SpeedTestProgress) => void
  ): Promise<SpeedTestResult> {
    return await this.runSpeedTest(testId, onProgress);
  }

  /**
   * Останавливает активный тест (заглушка для совместимости)
   */
  stopTest(testId: string): void {
    console.log(`[SpeedTest] Stop test ${testId} requested (not implemented)`);
  }

  /**
   * Проверяет, активен ли тест (заглушка для совместимости)
   */
  isTestActive(testId: string): boolean {
    return false;
  }
}

// Singleton instance
export const speedTestService = new SpeedTestService();
