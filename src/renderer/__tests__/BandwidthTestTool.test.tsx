import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BandwidthTestTool from '../components/tools/BandwidthTestTool';

describe('BandwidthTestTool', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders bandwidth test interface', () => {
    render(<BandwidthTestTool />);
    
    expect(screen.getByText('Bandwidth Test')).toBeInTheDocument();
    expect(screen.getByLabelText(/Test Server/i)).toBeInTheDocument();
  });

  it('displays test servers', () => {
    render(<BandwidthTestTool />);
    
    const serverSelect = screen.getByLabelText(/Test Server/i);
    fireEvent.mouseDown(serverSelect);
    
    expect(screen.getByText(/Speedtest.net/i)).toBeInTheDocument();
    expect(screen.getByText(/Fast.com/i)).toBeInTheDocument();
  });

  it('starts bandwidth test', async () => {
    render(<BandwidthTestTool />);
    
    // Select server
    const serverSelect = screen.getByLabelText(/Test Server/i);
    fireEvent.mouseDown(serverSelect);
    const serverOption = screen.getByText(/Speedtest.net/i);
    fireEvent.click(serverOption);
    
    // Start test
    const startButton = screen.getByRole('button', { name: /Start Test/i });
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Testing/i)).toBeInTheDocument();
    });
  });

  it('shows progress during test', async () => {
    render(<BandwidthTestTool />);
    
    const serverSelect = screen.getByLabelText(/Test Server/i);
    fireEvent.mouseDown(serverSelect);
    fireEvent.click(screen.getByText(/Speedtest.net/i));
    
    const startButton = screen.getByRole('button', { name: /Start Test/i });
    fireEvent.click(startButton);
    
    await waitFor(() => {
      const progressBars = document.querySelectorAll('[role="progressbar"]');
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });

  it('displays download speed', async () => {
    render(<BandwidthTestTool />);
    
    const serverSelect = screen.getByLabelText(/Test Server/i);
    fireEvent.mouseDown(serverSelect);
    fireEvent.click(screen.getByText(/Speedtest.net/i));
    
    const startButton = screen.getByRole('button', { name: /Start Test/i });
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Mbps Download/i)).toBeInTheDocument();
    }, { timeout: 10000 });
  });

  it('displays upload speed', async () => {
    render(<BandwidthTestTool />);
    
    const serverSelect = screen.getByLabelText(/Test Server/i);
    fireEvent.mouseDown(serverSelect);
    fireEvent.click(screen.getByText(/Speedtest.net/i));
    
    const startButton = screen.getByRole('button', { name: /Start Test/i });
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Mbps Upload/i)).toBeInTheDocument();
    }, { timeout: 10000 });
  });

  it('displays ping', async () => {
    render(<BandwidthTestTool />);
    
    const serverSelect = screen.getByLabelText(/Test Server/i);
    fireEvent.mouseDown(serverSelect);
    fireEvent.click(screen.getByText(/Speedtest.net/i));
    
    const startButton = screen.getByRole('button', { name: /Start Test/i });
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText(/ms Ping/i)).toBeInTheDocument();
    }, { timeout: 10000 });
  });

  it('displays jitter and packet loss', async () => {
    render(<BandwidthTestTool />);
    
    const serverSelect = screen.getByLabelText(/Test Server/i);
    fireEvent.mouseDown(serverSelect);
    fireEvent.click(screen.getByText(/Speedtest.net/i));
    
    const startButton = screen.getByRole('button', { name: /Start Test/i });
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Jitter:/i)).toBeInTheDocument();
      expect(screen.getByText(/Packet Loss:/i)).toBeInTheDocument();
    }, { timeout: 10000 });
  });

  it('shows real-time speed graph', async () => {
    render(<BandwidthTestTool />);
    
    const serverSelect = screen.getByLabelText(/Test Server/i);
    fireEvent.mouseDown(serverSelect);
    fireEvent.click(screen.getByText(/Speedtest.net/i));
    
    const startButton = screen.getByRole('button', { name: /Start Test/i });
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Real-time Speed Graph/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('saves test to history', async () => {
    render(<BandwidthTestTool />);
    
    const serverSelect = screen.getByLabelText(/Test Server/i);
    fireEvent.mouseDown(serverSelect);
    fireEvent.click(screen.getByText(/Speedtest.net/i));
    
    const startButton = screen.getByRole('button', { name: /Start Test/i });
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Test History/i)).toBeInTheDocument();
    }, { timeout: 10000 });
  });

  it('displays test history table', async () => {
    render(<BandwidthTestTool />);
    
    const serverSelect = screen.getByLabelText(/Test Server/i);
    fireEvent.mouseDown(serverSelect);
    fireEvent.click(screen.getByText(/Speedtest.net/i));
    
    const startButton = screen.getByRole('button', { name: /Start Test/i });
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Date & Time/i)).toBeInTheDocument();
      expect(screen.getByText(/Download/i)).toBeInTheDocument();
      expect(screen.getByText(/Upload/i)).toBeInTheDocument();
    }, { timeout: 10000 });
  });

  it('calculates average speeds', async () => {
    render(<BandwidthTestTool />);
    
    const serverSelect = screen.getByLabelText(/Test Server/i);
    fireEvent.mouseDown(serverSelect);
    fireEvent.click(screen.getByText(/Speedtest.net/i));
    
    const startButton = screen.getByRole('button', { name: /Start Test/i });
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Avg Download:/i)).toBeInTheDocument();
      expect(screen.getByText(/Avg Upload:/i)).toBeInTheDocument();
    }, { timeout: 10000 });
  });

  it('clears test history', async () => {
    render(<BandwidthTestTool />);
    
    // Run a test first
    const serverSelect = screen.getByLabelText(/Test Server/i);
    fireEvent.mouseDown(serverSelect);
    fireEvent.click(screen.getByText(/Speedtest.net/i));
    
    const startButton = screen.getByRole('button', { name: /Start Test/i });
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Test History/i)).toBeInTheDocument();
    }, { timeout: 10000 });
    
    // Clear history
    const clearButton = screen.getByRole('button', { name: /Clear History/i });
    fireEvent.click(clearButton);
    
    await waitFor(() => {
      expect(screen.getByText(/No Bandwidth Tests/i)).toBeInTheDocument();
    });
  });

  it('exports test results', async () => {
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn();
    
    render(<BandwidthTestTool />);
    
    // Run a test first
    const serverSelect = screen.getByLabelText(/Test Server/i);
    fireEvent.mouseDown(serverSelect);
    fireEvent.click(screen.getByText(/Speedtest.net/i));
    
    const startButton = screen.getByRole('button', { name: /Start Test/i });
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Test History/i)).toBeInTheDocument();
    }, { timeout: 10000 });
    
    // Export results
    const exportButton = screen.getByRole('button', { name: /Export Results/i });
    fireEvent.click(exportButton);
    
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it('stops test when stop button clicked', async () => {
    render(<BandwidthTestTool />);
    
    const serverSelect = screen.getByLabelText(/Test Server/i);
    fireEvent.mouseDown(serverSelect);
    fireEvent.click(screen.getByText(/Speedtest.net/i));
    
    const startButton = screen.getByRole('button', { name: /Start Test/i });
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Testing/i)).toBeInTheDocument();
    });
    
    const stopButton = screen.getByRole('button', { name: /Stop Test/i });
    fireEvent.click(stopButton);
    
    await waitFor(() => {
      expect(screen.queryByText(/Testing/i)).not.toBeInTheDocument();
    });
  });

  it('formats speed correctly', async () => {
    render(<BandwidthTestTool />);
    
    const serverSelect = screen.getByLabelText(/Test Server/i);
    fireEvent.mouseDown(serverSelect);
    fireEvent.click(screen.getByText(/Speedtest.net/i));
    
    const startButton = screen.getByRole('button', { name: /Start Test/i });
    fireEvent.click(startButton);
    
    await waitFor(() => {
      // Should show Mbps format
      const mbpsElements = screen.getAllByText(/Mbps/i);
      expect(mbpsElements.length).toBeGreaterThan(0);
    }, { timeout: 10000 });
  });

  it('shows test phases', async () => {
    render(<BandwidthTestTool />);
    
    const serverSelect = screen.getByLabelText(/Test Server/i);
    fireEvent.mouseDown(serverSelect);
    fireEvent.click(screen.getByText(/Speedtest.net/i));
    
    const startButton = screen.getByRole('button', { name: /Start Test/i });
    fireEvent.click(startButton);
    
    // Should show ping phase
    await waitFor(() => {
      expect(screen.getByText(/Testing latency/i)).toBeInTheDocument();
    }, { timeout: 2000 });
    
    // Should eventually show download phase
    await waitFor(() => {
      expect(screen.getByText(/Testing download speed/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('persists history to localStorage', async () => {
    render(<BandwidthTestTool />);
    
    const serverSelect = screen.getByLabelText(/Test Server/i);
    fireEvent.mouseDown(serverSelect);
    fireEvent.click(screen.getByText(/Speedtest.net/i));
    
    const startButton = screen.getByRole('button', { name: /Start Test/i });
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Test History/i)).toBeInTheDocument();
    }, { timeout: 10000 });
    
    // Check localStorage
    const saved = localStorage.getItem('bandwidth-test-history');
    expect(saved).toBeTruthy();
  });

  it('loads history from localStorage', () => {
    // Pre-populate localStorage
    const mockHistory = [{
      id: 'test-1',
      timestamp: new Date().toISOString(),
      server: {
        id: 'server1',
        name: 'Test Server',
        location: 'Test Location',
        host: 'test.com',
        ping: 10,
      },
      downloadSpeed: 100,
      uploadSpeed: 50,
      ping: 10,
      jitter: 2,
      packetLoss: 0.5,
      duration: 8,
    }];
    
    localStorage.setItem('bandwidth-test-history', JSON.stringify(mockHistory));
    
    render(<BandwidthTestTool />);
    
    expect(screen.getByText(/Test History/i)).toBeInTheDocument();
  });
});
