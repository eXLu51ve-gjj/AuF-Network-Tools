// Core application types

export interface ThemeConfig {
  mode: 'light' | 'dark';
  backgroundColor: string;
  textColor: string;
  primaryColor: string;
  secondaryColor: string;
  spacing: number;
}

export interface NetworkDiagnosticResult {
  id: string;
  type: 'ping' | 'traceroute' | 'port-scan' | 'dns-lookup' | 'wifi-scan';
  target: string;
  timestamp: Date;
  success: boolean;
  duration: number;
  results: any;
  error?: string;
}

export interface WiFiNetwork {
  ssid: string;
  bssid: string;
  channel: number;
  frequency: number;
  signalStrength: number;
  security: 'WPA2' | 'WPA3' | 'WEP' | 'Open' | 'Enterprise';
  band: '2.4GHz' | '5GHz';
  encryption: string;
  hidden: boolean;
  snr?: number; // Signal-to-noise ratio in dB
  enterpriseAuth?: string; // Enterprise authentication method (802.1X, EAP-TLS, EAP-PEAP, etc.)
}

export interface SSHConnection {
  id: string;
  host: string;
  port: number;
  username: string;
  authMethod: 'password' | 'key' | 'agent';
  connected: boolean;
  lastActivity: Date;
}

export interface PortScanResult {
  port: number;
  state: 'open' | 'closed' | 'filtered';
  service: string;
  protocol: 'tcp' | 'udp';
  banner?: string;
}

export interface Configuration {
  version: string;
  theme: ThemeSettings;
  connections: ConnectionProfile[];
  scanPresets: ScanPreset[];
  exportSettings: ExportSettings;
  security: SecuritySettings;
}

export interface ThemeSettings {
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  iconColor: string;
  spacing: number;
}

export interface ConnectionProfile {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authMethod: 'password' | 'key' | 'agent';
  keyPath?: string;
  password?: string;
  timeout: number;
}

export interface ScanPreset {
  id: string;
  name: string;
  type: 'ping' | 'traceroute' | 'port-scan' | 'wifi-scan' | 'dns-lookup';
  parameters: Record<string, any>;
}

export interface ExportSettings {
  format: 'csv' | 'pdf' | 'json' | 'text';
  includeMetadata: boolean;
  template: string;
}

export interface SecuritySettings {
  storeCredentials: boolean;
  maskPasswords: boolean;
  validateHostKeys: boolean;
  rateLimit: number;
}

// UI State Types
export interface AppState {
  currentView: string;
  activeConnections: SSHConnection[];
  scanResults: NetworkDiagnosticResult[];
  configuration: Configuration;
  preferences: UserPreferences;
}

export interface UserPreferences {
  autoSave: boolean;
  notifications: boolean;
  compactMode: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
}

// Network Operation Types
export interface PingParameters {
  host: string;
  count: number;
  timeout: number;
  packetSize: number;
}

export interface TracerouteParameters {
  host: string;
  maxHops: number;
  timeout: number;
  protocol: 'icmp' | 'udp' | 'tcp';
}

export interface PortScanParameters {
  host: string;
  ports: number[] | string;
  technique: 'connect' | 'syn' | 'ack' | 'fin' | 'xmas' | 'null';
  timeout: number;
  threads: number;
}

export interface WiFiScanParameters {
  interface: string;
  duration: number;
  band: '2.4GHz' | '5GHz' | 'both';
  channels: number[];
}

export interface SignalHistoryPoint {
  timestamp: Date;
  signalStrength: number;
  snr?: number;
}

export interface BandMetrics {
  band: '2.4GHz' | '5GHz';
  networkCount: number;
  averageSignal: number;
  channelUtilization: number;
  recommendedChannel: number;
  congestionLevel: 'Low' | 'Medium' | 'High';
}

export interface ChannelInfo {
  channel: number;
  frequency: number;
  networkCount: number;
  networks: WiFiNetwork[];
  interference: 'None' | 'Low' | 'Medium' | 'High';
}

// Export Types
export interface ReportData {
  scanId: string;
  timestamp: Date;
  parameters: any;
  results: any[];
  summary: ReportSummary;
}

export interface ReportSummary {
  totalScans: number;
  successful: number;
  failed: number;
  averageDuration: number;
  recommendations: string[];
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  timestamp: Date;
  context?: any;
  suggestions: string[];
}

// Event Types
export interface AppEvent {
  type: string;
  data: any;
  timestamp: Date;
  source: string;
}