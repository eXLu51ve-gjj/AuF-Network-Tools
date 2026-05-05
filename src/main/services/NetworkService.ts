import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import * as dns from 'dns';

const execAsync = promisify(exec);

export interface PingResult {
  host: string;
  alive: boolean;
  time?: number;
  ttl?: number;
  bytes?: number;
  error?: string;
}

export interface TracerouteHop {
  hop: number;
  ip: string;
  hostname: string;
  time1: number;
  time2: number;
  time3: number;
}

export interface WiFiNetwork {
  ssid: string;
  bssid: string;
  signal: number;
  channel: number;
  security: string;
  band: '2.4GHz' | '5GHz';
}

export interface NetworkInterface {
  name: string;
  type: string;
  mac: string;
  ipv4?: string;
  ipv6?: string;
  status: 'up' | 'down';
}

export class NetworkService {
  /**
   * Get external IP address
   */
  static async getExternalIP(): Promise<string> {
    try {
      const https = require('https');
      return new Promise((resolve, reject) => {
        https.get('https://api.ipify.org?format=text', (res: any) => {
          let data = '';
          res.on('data', (chunk: any) => data += chunk);
          res.on('end', () => resolve(data.trim()));
        }).on('error', (err: Error) => reject(err));
      });
    } catch (error) {
      return 'N/A';
    }
  }

  /**
   * Execute ping command
   */
  static async ping(host: string, count: number = 4, timeout: number = 5000): Promise<PingResult[]> {
    const results: PingResult[] = [];
    const isWindows = os.platform() === 'win32';

    try {
      const command = isWindows
        ? `chcp 65001 > nul && ping -n ${count} -w ${timeout} ${host}`
        : `ping -c ${count} -W ${Math.floor(timeout / 1000)} ${host}`;

      const { stdout } = await execAsync(command, { encoding: 'utf8', timeout: (count * timeout) + 10000 });
      
      // Log raw output for debugging
      console.log('[Ping] Raw output:', JSON.stringify(stdout.substring(0, 500)));
      
      const lines = stdout.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (isWindows) {
          // English: "Reply from 8.8.8.8: bytes=32 time=1ms TTL=128"
          const engMatch = trimmed.match(/Reply from ([^:]+):\s*bytes=(\d+)\s*time[=<](\d+)ms\s*TTL=(\d+)/i);
          if (engMatch) {
            results.push({ host: engMatch[1].trim(), alive: true, bytes: parseInt(engMatch[2]), time: parseInt(engMatch[3]), ttl: parseInt(engMatch[4]) });
            continue;
          }

          // Russian fast: "Ответ от 8.8.8.8: число байт=32 время<1мс TTL=128"
          const rusLt1 = trimmed.match(/Ответ от ([^:]+):\s*число байт=(\d+)\s*время<1\s*мс\s*TTL=(\d+)/i);
          if (rusLt1) {
            results.push({ host: rusLt1[1].trim(), alive: true, bytes: parseInt(rusLt1[2]), time: 1, ttl: parseInt(rusLt1[3]) });
            continue;
          }

          // Russian normal: "Ответ от 8.8.8.8: число байт=32 время=5мс TTL=128"
          const rusNormal = trimmed.match(/Ответ от ([^:]+):\s*число байт=(\d+)\s*время[=<](\d+)\s*мс\s*TTL=(\d+)/i);
          if (rusNormal) {
            results.push({ host: rusNormal[1].trim(), alive: true, bytes: parseInt(rusNormal[2]), time: parseInt(rusNormal[3]), ttl: parseInt(rusNormal[4]) });
            continue;
          }

          // Timeout line
          if (trimmed.match(/Request.*timed out|Превышен интервал ожидания/i)) {
            results.push({ host, alive: false, error: 'Request timed out' });
          }
        } else {
          const match = trimmed.match(/(\d+) bytes from ([^:]+): icmp_seq=(\d+) ttl=(\d+) time=([\d.]+) ms/i);
          if (match) {
            results.push({ host: match[2], alive: true, bytes: parseInt(match[1]), time: parseFloat(match[5]), ttl: parseInt(match[4]) });
          }
        }
      }

      console.log('[Ping] Parsed results:', results.length, 'packets');
      return results;
    } catch (error: any) {
      console.error('[Ping] Error:', error.message);
      return [{ host, alive: false, error: error.message }];
    }
  }

  /**
   * Execute traceroute command - streaming, hop by hop
   */
  static async traceroute(host: string, maxHops: number = 30): Promise<TracerouteHop[]> {
    const hops: TracerouteHop[] = [];
    const isWindows = os.platform() === 'win32';

    return new Promise((resolve) => {
      const { spawn } = require('child_process');
      
      const proc = isWindows
        ? spawn('cmd', ['/c', `chcp 65001 > nul && tracert -h ${maxHops} -w 1000 ${host}`], { shell: true })
        : spawn('traceroute', [`-m`, `${maxHops}`, `-w`, `1`, host]);

      let buffer = '';

      const parseLine = (line: string) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        if (isWindows) {
          const hopNumMatch = trimmed.match(/^(\d+)\s+/);
          if (!hopNumMatch) return;
          const hopNum = parseInt(hopNumMatch[1]);

          if (trimmed.match(/\*\s+\*\s+\*/)) {
            hops.push({ hop: hopNum, ip: '', hostname: '* * *', time1: 0, time2: 0, time3: 0 });
            return;
          }

          const timeMatches = [...trimmed.matchAll(/<?\d+\s*ms/gi)];
          const times = timeMatches.map(m => {
            const val = m[0].replace(/[<\s]|ms/gi, '');
            return parseInt(val) || 1;
          });

          let remaining = trimmed
            .replace(/^\d+\s+/, '')
            .replace(/<?\d+\s*ms\s*/gi, '')
            .trim();

          const bracketMatch = remaining.match(/^(.+?)\s+\[([^\]]+)\]/);
          const ipOnlyMatch = remaining.match(/^(\d+\.\d+\.\d+\.\d+)/);

          let ip = '';
          let hostname = remaining;

          if (bracketMatch) {
            hostname = bracketMatch[1].trim();
            ip = bracketMatch[2].trim();
          } else if (ipOnlyMatch) {
            ip = ipOnlyMatch[1];
            hostname = ip;
          }

          if (hostname || ip) {
            hops.push({
              hop: hopNum,
              ip: ip || hostname,
              hostname: hostname || ip,
              time1: times[0] || 0,
              time2: times[1] || 0,
              time3: times[2] || 0,
            });
          }
        } else {
          const match = trimmed.match(/^\s*(\d+)\s+(.+?)\s+\(([^)]+)\)\s+([\d.]+)\s*ms/);
          if (match) {
            hops.push({
              hop: parseInt(match[1]),
              hostname: match[2].trim(),
              ip: match[3],
              time1: parseFloat(match[4]),
              time2: parseFloat(match[4]),
              time3: parseFloat(match[4]),
            });
          }
        }
      };

      proc.stdout.on('data', (data: Buffer) => {
        buffer += data.toString('utf8');
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        lines.forEach(parseLine);
      });

      proc.stderr.on('data', (data: Buffer) => {
        console.error('[Traceroute] stderr:', data.toString());
      });

      proc.on('close', () => {
        if (buffer.trim()) parseLine(buffer);
        console.log('[Traceroute] Done, hops:', hops.length);
        resolve(hops);
      });

      proc.on('error', (err: Error) => {
        console.error('[Traceroute] Error:', err.message);
        resolve(hops);
      });
    });
  }

  /**
   * Scan WiFi networks (Windows only)
   */
  static async scanWiFi(): Promise<WiFiNetwork[]> {
    const networks: WiFiNetwork[] = [];
    const isWindows = os.platform() === 'win32';

    if (!isWindows) {
      throw new Error('WiFi scanning is only supported on Windows');
    }

    try {
      // Use chcp 65001 to force UTF-8 output, and handle errors gracefully
      const { stdout } = await execAsync(
        'chcp 65001 > nul && netsh wlan show networks mode=bssid',
        { encoding: 'utf8' }
      );

      const lines = stdout.split('\n');
      let currentNetwork: Partial<WiFiNetwork> = {};

      for (const line of lines) {
        const trimmed = line.trim();

        // Match SSID line (e.g. "SSID 1 : MyNetwork")
        if (trimmed.match(/^SSID\s+\d+\s*:/i)) {
          // Save previous network
          if (currentNetwork.ssid !== undefined) {
            networks.push(currentNetwork as WiFiNetwork);
          }
          const ssid = trimmed.split(':').slice(1).join(':').trim();
          currentNetwork = { ssid };
        } else if (trimmed.match(/^BSSID\s+\d+\s*:/i)) {
          currentNetwork.bssid = trimmed.split(':').slice(1).join(':').trim();
        } else if (trimmed.match(/^Signal|Сигнал/i)) {
          const signal = trimmed.match(/(\d+)%/);
          if (signal) {
            const pct = parseInt(signal[1]);
            // Convert % to dBm: 100% ≈ -30dBm, 0% ≈ -90dBm
            currentNetwork.signal = Math.round(-90 + (pct / 100) * 60);
          }
        } else if (trimmed.match(/^Channel|Канал/i)) {
          const channel = trimmed.match(/:\s*(\d+)/);
          if (channel) {
            const ch = parseInt(channel[1]);
            currentNetwork.channel = ch;
            // Channels 1-14 = 2.4GHz, 36+ = 5GHz
            currentNetwork.band = ch > 14 ? '5GHz' : '2.4GHz';
          }
        } else if (trimmed.match(/^Radio type|Тип радио/i)) {
          // "Radio type : 802.11ac" or "802.11n" etc.
          const radioType = trimmed.split(':')[1]?.trim() || '';
          // 802.11ac, 802.11ax (WiFi 6), 802.11a are always 5GHz
          if (radioType.match(/802\.11(a|ac|ax|ad)/i)) {
            currentNetwork.band = '5GHz';
          } else if (radioType.match(/802\.11(b|g)/i)) {
            currentNetwork.band = '2.4GHz';
          }
          // 802.11n can be both - keep channel-based detection
        } else if (trimmed.match(/^Authentication|Проверка подлинности/i)) {
          currentNetwork.security = trimmed.split(':')[1]?.trim() || 'Open';
        }
      }

      // Save last network
      if (currentNetwork.ssid !== undefined) {
        networks.push(currentNetwork as WiFiNetwork);
      }

      // Set defaults for missing fields
      return networks.map(n => ({
        ...n,
        band: n.band || '2.4GHz',
        channel: n.channel || 0,
        signal: n.signal || -70,
        bssid: n.bssid || '',
        security: n.security || 'Unknown',
      })) as WiFiNetwork[];
    } catch (error: any) {
      // Check if WiFi adapter is disabled
      const stdout = error.stdout || '';
      if (stdout.includes('disabled') || stdout.includes('выключен') || stdout.includes('не поддерживает')) {
        throw new Error('WiFi adapter is disabled or not available. Please enable your WiFi adapter.');
      }
      console.error('WiFi scan error:', error);
      return [];
    }
  }

  /**
   * Get network interfaces
   */
  static async getNetworkInterfaces(): Promise<NetworkInterface[]> {
    const interfaces: NetworkInterface[] = [];
    const networkInterfaces = os.networkInterfaces();

    for (const [name, addrs] of Object.entries(networkInterfaces)) {
      if (!addrs) continue;

      const ipv4 = addrs.find(addr => addr.family === 'IPv4' && !addr.internal);
      const ipv6 = addrs.find(addr => addr.family === 'IPv6' && !addr.internal);

      if (ipv4 || ipv6) {
        interfaces.push({
          name,
          type: name.toLowerCase().includes('wi-fi') || name.toLowerCase().includes('wireless') ? 'WiFi' : 'Ethernet',
          mac: ipv4?.mac || ipv6?.mac || '',
          ipv4: ipv4?.address,
          ipv6: ipv6?.address,
          status: 'up',
        });
      }
    }

    return interfaces;
  }

  /**
   * DNS lookup
   */
  static async dnsLookup(domain: string, recordType: string = 'A'): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const resolver = new dns.Resolver();
      
      switch (recordType.toUpperCase()) {
        case 'A':
          resolver.resolve4(domain, (err, addresses) => {
            if (err) reject(err);
            else resolve(addresses.map(addr => ({ type: 'A', value: addr, ttl: 3600 })));
          });
          break;
        case 'AAAA':
          resolver.resolve6(domain, (err, addresses) => {
            if (err) reject(err);
            else resolve(addresses.map(addr => ({ type: 'AAAA', value: addr, ttl: 3600 })));
          });
          break;
        case 'MX':
          resolver.resolveMx(domain, (err, addresses) => {
            if (err) reject(err);
            else resolve(addresses.map(addr => ({ type: 'MX', value: addr.exchange, priority: addr.priority, ttl: 3600 })));
          });
          break;
        case 'TXT':
          resolver.resolveTxt(domain, (err, addresses) => {
            if (err) reject(err);
            else resolve(addresses.map(addr => ({ type: 'TXT', value: addr.join(' '), ttl: 3600 })));
          });
          break;
        case 'NS':
          resolver.resolveNs(domain, (err, addresses) => {
            if (err) reject(err);
            else resolve(addresses.map(addr => ({ type: 'NS', value: addr, ttl: 86400 })));
          });
          break;
        case 'CNAME':
          resolver.resolveCname(domain, (err, addresses) => {
            if (err) reject(err);
            else resolve(addresses.map(addr => ({ type: 'CNAME', value: addr, ttl: 3600 })));
          });
          break;
        default:
          reject(new Error(`Unsupported record type: ${recordType}`));
      }
    });
  }

  /**
   * Reverse DNS lookup
   */
  static async reverseDNS(ip: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      dns.reverse(ip, (err, hostnames) => {
        if (err) reject(err);
        else resolve(hostnames);
      });
    });
  }

  /**
   * Connect to WiFi network (Windows only)
   */
  static async connectWiFi(ssid: string, password?: string): Promise<{ success: boolean; error?: string }> {
    const isWindows = os.platform() === 'win32';
    if (!isWindows) {
      return { success: false, error: 'Only supported on Windows' };
    }

    try {
      if (!password) {
        // Open network - connect directly
        const { stdout } = await execAsync(
          `netsh wlan connect name="${ssid}"`,
          { encoding: 'utf8' }
        );
        const success = stdout.toLowerCase().includes('successfully') || 
                        stdout.includes('успешно');
        return { success, error: success ? undefined : stdout.trim() };
      } else {
        // Protected network - create profile XML and connect
        const profileXml = `<?xml version="1.0"?>
<WLANProfile xmlns="http://www.microsoft.com/networking/WLAN/profile/v1">
  <name>${ssid}</name>
  <SSIDConfig>
    <SSID>
      <name>${ssid}</name>
    </SSID>
  </SSIDConfig>
  <connectionType>ESS</connectionType>
  <connectionMode>manual</connectionMode>
  <MSM>
    <security>
      <authEncryption>
        <authentication>WPA2PSK</authentication>
        <encryption>AES</encryption>
        <useOneX>false</useOneX>
      </authEncryption>
      <sharedKey>
        <keyType>passPhrase</keyType>
        <protected>false</protected>
        <keyMaterial>${password}</keyMaterial>
      </sharedKey>
    </security>
  </MSM>
</WLANProfile>`;

        // Write profile to temp file
        const tmpFile = `${os.tmpdir()}\\wifi_profile_${Date.now()}.xml`;
        const fs = require('fs');
        fs.writeFileSync(tmpFile, profileXml, 'utf8');

        try {
          // Add profile
          await execAsync(`netsh wlan add profile filename="${tmpFile}"`, { encoding: 'utf8' });
          // Connect
          const { stdout } = await execAsync(`netsh wlan connect name="${ssid}"`, { encoding: 'utf8' });
          const success = stdout.toLowerCase().includes('successfully') || stdout.includes('успешно');
          return { success, error: success ? undefined : stdout.trim() };
        } finally {
          // Clean up temp file
          try { require('fs').unlinkSync(tmpFile); } catch {}
        }
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Disconnect from current WiFi network
   */
  static async disconnectWiFi(): Promise<{ success: boolean; error?: string }> {
    try {
      await execAsync('netsh wlan disconnect', { encoding: 'utf8' });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Scan TCP port
   */
  static async scanPort(host: string, port: number, timeout: number = 1000): Promise<boolean> {
    return new Promise((resolve) => {
      const net = require('net');
      const socket = new net.Socket();

      socket.setTimeout(timeout);

      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });

      socket.on('error', () => {
        resolve(false);
      });

      socket.connect(port, host);
    });
  }

  /**
   * Scan UDP port
   * No ICMP response = open/filtered, ECONNREFUSED = closed
   */
  static async scanUDPPort(host: string, port: number, timeout: number = 2000): Promise<'open' | 'closed' | 'filtered'> {
    return new Promise((resolve) => {
      const dgram = require('dgram');
      const dnsModule = require('dns');

      dnsModule.lookup(host, (err: any, address: string) => {
        if (err) {
          resolve('filtered');
          return;
        }

        const client = dgram.createSocket('udp4');
        let resolved = false;

        const done = (result: 'open' | 'closed' | 'filtered') => {
          if (!resolved) {
            resolved = true;
            try { client.close(); } catch {}
            resolve(result);
          }
        };

        // Send empty UDP packet
        client.send(Buffer.alloc(0), port, address, (sendErr: any) => {
          if (sendErr) done('filtered');
        });

        // ECONNREFUSED = ICMP Port Unreachable = CLOSED
        client.on('error', (err: any) => {
          if (err.code === 'ECONNREFUSED') {
            done('closed');
          } else {
            done('filtered');
          }
        });

        // Got response = OPEN
        client.on('message', () => {
          done('open');
        });

        // Timeout = filtered (can't distinguish open from filtered without ICMP)
        setTimeout(() => done('filtered'), timeout);
      });
    });
  }
}
