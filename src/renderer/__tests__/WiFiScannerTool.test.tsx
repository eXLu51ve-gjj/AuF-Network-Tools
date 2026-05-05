import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WiFiScannerTool from '../components/tools/WiFiScannerTool';
import { ThemeProvider } from '../contexts/ThemeContext';

// Mock MUI icons
jest.mock('@mui/icons-material', () => ({
  PlayArrow: () => <div data-testid="play-icon">PlayArrowIcon</div>,
  Stop: () => <div data-testid="stop-icon">StopIcon</div>,
  Clear: () => <div data-testid="clear-icon">ClearIcon</div>,
  Download: () => <div data-testid="download-icon">DownloadIcon</div>,
  Refresh: () => <div data-testid="refresh-icon">RefreshIcon</div>,
  SignalCellular4Bar: () => <div data-testid="signal-icon">SignalIcon</div>,
  Wifi: () => <div data-testid="wifi-icon">WifiIcon</div>,
  Security: () => <div data-testid="security-icon">SecurityIcon</div>,
  Lock: () => <div data-testid="lock-icon">LockIcon</div>,
  LockOpen: () => <div data-testid="lock-open-icon">LockOpenIcon</div>,
  LockOutlined: () => <div data-testid="lock-outlined-icon">LockOutlinedIcon</div>,
  FilterList: () => <div data-testid="filter-icon">FilterIcon</div>,
  Sort: () => <div data-testid="sort-icon">SortIcon</div>,
  Star: () => <div data-testid="star-icon">StarIcon</div>,
  StarBorder: () => <div data-testid="star-border-icon">StarBorderIcon</div>,
}));

// Mock electronAPI
global.window.electronAPI = {
  windowControl: jest.fn(),
  updateTheme: jest.fn().mockResolvedValue({ success: true }),
  networkOperation: jest.fn().mockResolvedValue({ success: true, data: null }),
  on: jest.fn(),
  readConfig: jest.fn().mockResolvedValue({}),
  writeConfig: jest.fn().mockResolvedValue({ success: true }),
  getSystemInfo: jest.fn().mockResolvedValue({}),
  getNetworkInfo: jest.fn().mockResolvedValue({}),
};

describe('WiFiScannerTool Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test('renders WiFi scanner controls', () => {
    render(
      <ThemeProvider>
        <WiFiScannerTool />
      </ThemeProvider>
    );

    // Check for main controls
    expect(screen.getByText('Scan Controls')).toBeInTheDocument();
    expect(screen.getByText('Band Selection')).toBeInTheDocument();
    expect(screen.getByText('Start Scan')).toBeInTheDocument();
    expect(screen.getByText('Scan Duration: 10s')).toBeInTheDocument();
  });

  test('starts scanning when start button is clicked', async () => {
    render(
      <ThemeProvider>
        <WiFiScannerTool />
      </ThemeProvider>
    );

    const startButton = screen.getByText('Start Scan');
    fireEvent.click(startButton);

    // Should show stop button while scanning
    expect(screen.getByText('Stop Scan')).toBeInTheDocument();
    
    // Should show progress
    expect(screen.getByText(/Scanning/)).toBeInTheDocument();
  });

  test('stops scanning when stop button is clicked', async () => {
    render(
      <ThemeProvider>
        <WiFiScannerTool />
      </ThemeProvider>
    );

    const startButton = screen.getByText('Start Scan');
    fireEvent.click(startButton);

    const stopButton = screen.getByText('Stop Scan');
    fireEvent.click(stopButton);

    // Should show start button again
    expect(screen.getByText('Start Scan')).toBeInTheDocument();
  });

  test('displays network results after scan', async () => {
    render(
      <ThemeProvider>
        <WiFiScannerTool />
      </ThemeProvider>
    );

    const startButton = screen.getByText('Start Scan');
    fireEvent.click(startButton);

    // Fast-forward timers to complete scan
    jest.advanceTimersByTime(10000);

    await waitFor(() => {
      // Should show detected networks
      expect(screen.getByText('Detected Networks')).toBeInTheDocument();
      expect(screen.getByText('HomeNetwork-5G')).toBeInTheDocument();
      expect(screen.getByText('Office-WiFi')).toBeInTheDocument();
      expect(screen.getByText('Guest Network')).toBeInTheDocument();
    });
  });

  test('clears results when clear button is clicked', async () => {
    render(
      <ThemeProvider>
        <WiFiScannerTool />
      </ThemeProvider>
    );

    const startButton = screen.getByText('Start Scan');
    fireEvent.click(startButton);

    // Fast-forward timers to complete scan
    jest.advanceTimersByTime(10000);

    await waitFor(() => {
      expect(screen.getByText('Detected Networks')).toBeInTheDocument();
    });

    const clearButton = screen.getByText('Clear Results');
    fireEvent.click(clearButton);

    // Should show no networks message
    expect(screen.getByText('No Networks Detected')).toBeInTheDocument();
  });

  test('changes band selection', () => {
    render(
      <ThemeProvider>
        <WiFiScannerTool />
      </ThemeProvider>
    );

    const bandSelect = screen.getByLabelText('Band Selection');
    fireEvent.change(bandSelect, { target: { value: '5GHz' } });

    expect(screen.getByText('5GHz')).toBeInTheDocument();
  });

  test('toggles auto refresh', () => {
    render(
      <ThemeProvider>
        <WiFiScannerTool />
      </ThemeProvider>
    );

    const autoRefreshSwitch = screen.getByLabelText('Auto Refresh');
    fireEvent.click(autoRefreshSwitch);

    expect(screen.getByText('Refresh Interval')).toBeInTheDocument();
  });

  test('exports results when export button is clicked', async () => {
    // Mock URL.createObjectURL and document.createElement
    const mockCreateObjectURL = jest.fn();
    const mockRevokeObjectURL = jest.fn();
    const mockClick = jest.fn();
    const mockAppendChild = jest.fn();
    const mockRemoveChild = jest.fn();
    
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;
    
    const mockAnchor = {
      href: '',
      download: '',
      click: mockClick,
    };
    
    global.document.createElement = jest.fn().mockReturnValue(mockAnchor);
    global.document.body.appendChild = mockAppendChild;
    global.document.body.removeChild = mockRemoveChild;

    render(
      <ThemeProvider>
        <WiFiScannerTool />
      </ThemeProvider>
    );

    const startButton = screen.getByText('Start Scan');
    fireEvent.click(startButton);

    // Fast-forward timers to complete scan
    jest.advanceTimersByTime(10000);

    await waitFor(() => {
      expect(screen.getByText('Detected Networks')).toBeInTheDocument();
    });

    const exportButton = screen.getByText('Export Results');
    fireEvent.click(exportButton);

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
  });

  test('shows signal strength visualization', async () => {
    render(
      <ThemeProvider>
        <WiFiScannerTool />
      </ThemeProvider>
    );

    const startButton = screen.getByText('Start Scan');
    fireEvent.click(startButton);

    // Fast-forward timers to complete scan
    jest.advanceTimersByTime(10000);

    await waitFor(() => {
      // Check for signal strength display
      expect(screen.getByText('-45 dBm')).toBeInTheDocument();
      expect(screen.getByText('-62 dBm')).toBeInTheDocument();
      expect(screen.getByText('-68 dBm')).toBeInTheDocument();
    });
  });

  test('displays security types correctly', async () => {
    render(
      <ThemeProvider>
        <WiFiScannerTool />
      </ThemeProvider>
    );

    const startButton = screen.getByText('Start Scan');
    fireEvent.click(startButton);

    // Fast-forward timers to complete scan
    jest.advanceTimersByTime(10000);

    await waitFor(() => {
      // Check for security badges
      expect(screen.getByText('WPA3')).toBeInTheDocument();
      expect(screen.getByText('WPA2')).toBeInTheDocument();
      expect(screen.getByText('Open')).toBeInTheDocument();
      expect(screen.getByText('Enterprise')).toBeInTheDocument();
      expect(screen.getByText('WEP')).toBeInTheDocument();
    });
  });

  test('filters hidden networks when toggle is off', async () => {
    render(
      <ThemeProvider>
        <WiFiScannerTool />
      </ThemeProvider>
    );

    // Turn off show hidden networks
    const hiddenSwitch = screen.getByLabelText('Show Hidden Networks');
    fireEvent.click(hiddenSwitch);

    const startButton = screen.getByText('Start Scan');
    fireEvent.click(startButton);

    // Fast-forward timers to complete scan
    jest.advanceTimersByTime(10000);

    await waitFor(() => {
      // Should not show hidden network
      expect(screen.queryByText('[Hidden Network]')).not.toBeInTheDocument();
    });
  });
});