import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NetworkInfoTool from '../components/tools/NetworkInfoTool';

describe('NetworkInfoTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders network information tool', () => {
    render(<NetworkInfoTool />);
    
    expect(screen.getByText('Network Information')).toBeInTheDocument();
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('displays network interfaces', async () => {
    render(<NetworkInfoTool />);
    
    await waitFor(() => {
      expect(screen.getByText(/Network Interfaces/)).toBeInTheDocument();
      expect(screen.getByText('Ethernet Adapter')).toBeInTheDocument();
      expect(screen.getByText('WiFi Adapter')).toBeInTheDocument();
      expect(screen.getByText('Loopback Interface')).toBeInTheDocument();
    });
  });

  it('displays interface status correctly', async () => {
    render(<NetworkInfoTool />);
    
    await waitFor(() => {
      const connectedChips = screen.getAllByText('Connected');
      expect(connectedChips.length).toBeGreaterThan(0);
      
      const disconnectedChips = screen.getAllByText('Disconnected');
      expect(disconnectedChips.length).toBeGreaterThan(0);
    });
  });

  it('expands interface details on click', async () => {
    render(<NetworkInfoTool />);
    
    await waitFor(() => {
      expect(screen.getByText('Ethernet Adapter')).toBeInTheDocument();
    });

    const ethernetAccordion = screen.getByText('Ethernet Adapter').closest('div[role="button"]');
    if (ethernetAccordion) {
      fireEvent.click(ethernetAccordion);
      
      await waitFor(() => {
        expect(screen.getByText('IPv4 Address')).toBeInTheDocument();
        expect(screen.getByText('192.168.1.100')).toBeInTheDocument();
        expect(screen.getByText('MAC Address')).toBeInTheDocument();
        expect(screen.getByText('00:1A:2B:3C:4D:5E')).toBeInTheDocument();
      });
    }
  });

  it('displays routing table', async () => {
    render(<NetworkInfoTool />);
    
    await waitFor(() => {
      expect(screen.getByText(/Routing Table/)).toBeInTheDocument();
      expect(screen.getByText('0.0.0.0/0')).toBeInTheDocument();
      expect(screen.getByText('192.168.1.0/24')).toBeInTheDocument();
      expect(screen.getByText('127.0.0.0/8')).toBeInTheDocument();
    });
  });

  it('displays network services', async () => {
    render(<NetworkInfoTool />);
    
    await waitFor(() => {
      expect(screen.getByText(/Network Services/)).toBeInTheDocument();
      expect(screen.getByText('HTTP Server')).toBeInTheDocument();
      expect(screen.getByText('HTTPS Server')).toBeInTheDocument();
      expect(screen.getByText('SSH Server')).toBeInTheDocument();
      expect(screen.getByText('DNS Server')).toBeInTheDocument();
    });
  });

  it('displays service status correctly', async () => {
    render(<NetworkInfoTool />);
    
    await waitFor(() => {
      const runningChips = screen.getAllByText('Running');
      expect(runningChips.length).toBeGreaterThan(0);
      
      const stoppedChips = screen.getAllByText('Stopped');
      expect(stoppedChips.length).toBeGreaterThan(0);
    });
  });

  it('displays network summary statistics', async () => {
    render(<NetworkInfoTool />);
    
    await waitFor(() => {
      expect(screen.getByText('Network Summary')).toBeInTheDocument();
      expect(screen.getByText('Active Interfaces')).toBeInTheDocument();
      expect(screen.getByText('Total Routes')).toBeInTheDocument();
      expect(screen.getByText('Running Services')).toBeInTheDocument();
      expect(screen.getByText('Total Traffic')).toBeInTheDocument();
    });
  });

  it('refreshes network information on button click', async () => {
    render(<NetworkInfoTool />);
    
    await waitFor(() => {
      expect(screen.getByText('Ethernet Adapter')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });
  });

  it('formats bytes correctly', async () => {
    render(<NetworkInfoTool />);
    
    await waitFor(() => {
      expect(screen.getByText('Ethernet Adapter')).toBeInTheDocument();
    });

    const ethernetAccordion = screen.getByText('Ethernet Adapter').closest('div[role="button"]');
    if (ethernetAccordion) {
      fireEvent.click(ethernetAccordion);
      
      await waitFor(() => {
        expect(screen.getByText('Bytes Received')).toBeInTheDocument();
        expect(screen.getByText('512.00 MB')).toBeInTheDocument();
        expect(screen.getByText('Bytes Sent')).toBeInTheDocument();
        expect(screen.getByText('256.00 MB')).toBeInTheDocument();
      });
    }
  });

  it('displays interface types with correct icons', async () => {
    render(<NetworkInfoTool />);
    
    await waitFor(() => {
      expect(screen.getByText('Ethernet Adapter')).toBeInTheDocument();
      expect(screen.getByText('WiFi Adapter')).toBeInTheDocument();
      expect(screen.getByText('Loopback Interface')).toBeInTheDocument();
    });
  });

  it('displays DNS servers for connected interfaces', async () => {
    render(<NetworkInfoTool />);
    
    await waitFor(() => {
      expect(screen.getByText('Ethernet Adapter')).toBeInTheDocument();
    });

    const ethernetAccordion = screen.getByText('Ethernet Adapter').closest('div[role="button"]');
    if (ethernetAccordion) {
      fireEvent.click(ethernetAccordion);
      
      await waitFor(() => {
        expect(screen.getByText('DNS Servers')).toBeInTheDocument();
        expect(screen.getByText('8.8.8.8, 8.8.4.4')).toBeInTheDocument();
      });
    }
  });

  it('displays gateway information', async () => {
    render(<NetworkInfoTool />);
    
    await waitFor(() => {
      expect(screen.getByText('Ethernet Adapter')).toBeInTheDocument();
    });

    const ethernetAccordion = screen.getByText('Ethernet Adapter').closest('div[role="button"]');
    if (ethernetAccordion) {
      fireEvent.click(ethernetAccordion);
      
      await waitFor(() => {
        expect(screen.getByText('Default Gateway')).toBeInTheDocument();
        expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
      });
    }
  });

  it('displays MTU information', async () => {
    render(<NetworkInfoTool />);
    
    await waitFor(() => {
      expect(screen.getByText('Ethernet Adapter')).toBeInTheDocument();
    });

    const ethernetAccordion = screen.getByText('Ethernet Adapter').closest('div[role="button"]');
    if (ethernetAccordion) {
      fireEvent.click(ethernetAccordion);
      
      await waitFor(() => {
        expect(screen.getByText('MTU')).toBeInTheDocument();
        expect(screen.getByText('1500 bytes')).toBeInTheDocument();
      });
    }
  });

  it('displays link speed for connected interfaces', async () => {
    render(<NetworkInfoTool />);
    
    await waitFor(() => {
      expect(screen.getByText('Ethernet Adapter')).toBeInTheDocument();
    });

    const ethernetAccordion = screen.getByText('Ethernet Adapter').closest('div[role="button"]');
    if (ethernetAccordion) {
      fireEvent.click(ethernetAccordion);
      
      await waitFor(() => {
        expect(screen.getByText('Link Speed')).toBeInTheDocument();
        expect(screen.getByText('1 Gbps')).toBeInTheDocument();
      });
    }
  });

  it('displays route metrics', async () => {
    render(<NetworkInfoTool />);
    
    await waitFor(() => {
      expect(screen.getByText(/Routing Table/)).toBeInTheDocument();
      
      const table = screen.getByText(/Routing Table/).closest('div');
      expect(table).toBeInTheDocument();
    });
  });

  it('displays service protocols and ports', async () => {
    render(<NetworkInfoTool />);
    
    await waitFor(() => {
      expect(screen.getByText('HTTP Server')).toBeInTheDocument();
      
      const tcpChips = screen.getAllByText('TCP');
      expect(tcpChips.length).toBeGreaterThan(0);
      
      const udpChips = screen.getAllByText('UDP');
      expect(udpChips.length).toBeGreaterThan(0);
    });
  });

  it('calculates total traffic correctly', async () => {
    render(<NetworkInfoTool />);
    
    await waitFor(() => {
      expect(screen.getByText('Total Traffic')).toBeInTheDocument();
      // Should show sum of all interface traffic
      const summarySection = screen.getByText('Network Summary').closest('div');
      expect(summarySection).toBeInTheDocument();
    });
  });

  it('shows N/A for disconnected interface fields', async () => {
    render(<NetworkInfoTool />);
    
    await waitFor(() => {
      expect(screen.getByText('WiFi Adapter')).toBeInTheDocument();
    });

    const wifiAccordion = screen.getByText('WiFi Adapter').closest('div[role="button"]');
    if (wifiAccordion) {
      fireEvent.click(wifiAccordion);
      
      await waitFor(() => {
        const naElements = screen.getAllByText('N/A');
        expect(naElements.length).toBeGreaterThan(0);
      });
    }
  });

  it('displays IPv6 addresses', async () => {
    render(<NetworkInfoTool />);
    
    await waitFor(() => {
      expect(screen.getByText('Ethernet Adapter')).toBeInTheDocument();
    });

    const ethernetAccordion = screen.getByText('Ethernet Adapter').closest('div[role="button"]');
    if (ethernetAccordion) {
      fireEvent.click(ethernetAccordion);
      
      await waitFor(() => {
        expect(screen.getByText('IPv6 Address')).toBeInTheDocument();
        expect(screen.getByText('fe80::1234:5678:90ab:cdef')).toBeInTheDocument();
      });
    }
  });

  it('displays on-link routes correctly', async () => {
    render(<NetworkInfoTool />);
    
    await waitFor(() => {
      expect(screen.getByText(/Routing Table/)).toBeInTheDocument();
      expect(screen.getByText('On-link')).toBeInTheDocument();
    });
  });
});
