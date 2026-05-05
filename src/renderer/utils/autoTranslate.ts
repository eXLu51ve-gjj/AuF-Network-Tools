// Automatic translation utility
// This maps common English phrases to translation keys

export const autoTranslateMap: Record<string, string> = {
  // Common buttons
  'Start Scan': 'startScan',
  'Stop Scan': 'stopScan',
  'Clear Results': 'clearResults',
  'Export Results': 'exportResults',
  'Save': 'save',
  'Cancel': 'cancel',
  'Close': 'close',
  'Apply': 'apply',
  'Reset': 'reset',
  'Delete': 'delete',
  'Edit': 'edit',
  'Add': 'add',
  'Open Tool': 'openTool',
  
  // WiFi Scanner
  'Scan Controls': 'scanControls',
  'Band Selection': 'bandSelection',
  'Both': 'both',
  'Scan Duration': 'scanDuration',
  'Auto Refresh': 'autoRefresh',
  'Refresh Interval': 'refreshInterval',
  'Show Hidden Networks': 'showHiddenNetworks',
  'Sort By': 'sortBy',
  'Signal Strength': 'signalStrength',
  'Channel': 'channel',
  'Network Name': 'networkName',
  'Detected Networks': 'detectedNetworks',
  'Last scan': 'lastScan',
  'Scanning': 'scanning',
  'networks': 'networks',
  'No Networks Detected': 'noNetworksDetected',
  
  // Network Info
  'SSID': 'ssid',
  'BSSID': 'bssid',
  'Security': 'security',
  'Band': 'band',
  'SNR': 'snr',
  'Actions': 'actions',
  
  // Time
  'seconds': 'seconds',
  'minutes': 'minutes',
  'minute': 'minute',
  
  // Status
  'Active': 'active',
  'Inactive': 'inactive',
  'Enabled': 'enabled',
  'Disabled': 'disabled',
  'Connected': 'connected',
  'Disconnected': 'disconnected',
  'Ready': 'ready',
};

// Function to auto-translate text
export const autoTranslate = (text: string, t: (key: string) => string): string => {
  const key = autoTranslateMap[text];
  if (key) {
    return t(key);
  }
  return text;
};
