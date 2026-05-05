import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DNSResolverTool from '../components/tools/DNSResolverTool';

describe('DNSResolverTool', () => {
  it('renders DNS resolver form', () => {
    render(<DNSResolverTool />);
    
    expect(screen.getByText('DNS Resolver')).toBeInTheDocument();
    expect(screen.getByLabelText(/Domain Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Record Type/i)).toBeInTheDocument();
  });

  it('performs DNS lookup', async () => {
    render(<DNSResolverTool />);
    
    const domainInput = screen.getByLabelText(/Domain Name/i);
    fireEvent.change(domainInput, { target: { value: 'example.com' } });
    
    const resolveButton = screen.getByRole('button', { name: /Resolve/i });
    fireEvent.click(resolveButton);
    
    await waitFor(() => {
      expect(screen.getByText('example.com')).toBeInTheDocument();
    });
  });

  it('displays A records', async () => {
    render(<DNSResolverTool />);
    
    fireEvent.change(screen.getByLabelText(/Domain Name/i), { target: { value: 'example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Resolve/i }));
    
    await waitFor(() => {
      expect(screen.getByText('93.184.216.34')).toBeInTheDocument();
    });
  });

  it('displays AAAA records', async () => {
    render(<DNSResolverTool />);
    
    fireEvent.change(screen.getByLabelText(/Domain Name/i), { target: { value: 'example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Resolve/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/2606:2800:220:1:248:1893:25c8:1946/i)).toBeInTheDocument();
    });
  });

  it('displays MX records with priority', async () => {
    render(<DNSResolverTool />);
    
    fireEvent.change(screen.getByLabelText(/Domain Name/i), { target: { value: 'example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Resolve/i }));
    
    await waitFor(() => {
      expect(screen.getByText('mail.example.com')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  it('displays TXT records', async () => {
    render(<DNSResolverTool />);
    
    fireEvent.change(screen.getByLabelText(/Domain Name/i), { target: { value: 'example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Resolve/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/v=spf1/i)).toBeInTheDocument();
    });
  });

  it('filters by record type', async () => {
    render(<DNSResolverTool />);
    
    // Select A records only
    const recordTypeSelect = screen.getByLabelText(/Record Type/i);
    fireEvent.mouseDown(recordTypeSelect);
    const aRecordOption = screen.getByText(/A \(IPv4 Address\)/i);
    fireEvent.click(aRecordOption);
    
    fireEvent.change(screen.getByLabelText(/Domain Name/i), { target: { value: 'example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Resolve/i }));
    
    await waitFor(() => {
      expect(screen.getByText('93.184.216.34')).toBeInTheDocument();
      // Should not show AAAA records
      expect(screen.queryByText(/2606:2800/i)).not.toBeInTheDocument();
    });
  });

  it('validates domain format', async () => {
    render(<DNSResolverTool />);
    
    fireEvent.change(screen.getByLabelText(/Domain Name/i), { target: { value: 'invalid domain!' } });
    fireEvent.click(screen.getByRole('button', { name: /Resolve/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid domain name format/i)).toBeInTheDocument();
    });
  });

  it('shows error for non-existent domain', async () => {
    render(<DNSResolverTool />);
    
    fireEvent.change(screen.getByLabelText(/Domain Name/i), { target: { value: 'nonexistent.domain' } });
    fireEvent.click(screen.getByRole('button', { name: /Resolve/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Domain not found/i)).toBeInTheDocument();
    });
  });

  it('switches to reverse lookup mode', () => {
    render(<DNSResolverTool />);
    
    const swapButton = screen.getByRole('button', { name: /Switch to Reverse Lookup/i });
    fireEvent.click(swapButton);
    
    expect(screen.getByLabelText(/IP Address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reverse Lookup/i })).toBeInTheDocument();
  });

  it('performs reverse DNS lookup', async () => {
    render(<DNSResolverTool />);
    
    // Switch to reverse mode
    const swapButton = screen.getByRole('button', { name: /Switch to Reverse Lookup/i });
    fireEvent.click(swapButton);
    
    fireEvent.change(screen.getByLabelText(/IP Address/i), { target: { value: '8.8.8.8' } });
    fireEvent.click(screen.getByRole('button', { name: /Reverse Lookup/i }));
    
    await waitFor(() => {
      expect(screen.getByText('dns.google')).toBeInTheDocument();
    });
  });

  it('validates IP address in reverse mode', async () => {
    render(<DNSResolverTool />);
    
    // Switch to reverse mode
    const swapButton = screen.getByRole('button', { name: /Switch to Reverse Lookup/i });
    fireEvent.click(swapButton);
    
    fireEvent.change(screen.getByLabelText(/IP Address/i), { target: { value: 'invalid.ip' } });
    fireEvent.click(screen.getByRole('button', { name: /Reverse Lookup/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid IP address format/i)).toBeInTheDocument();
    });
  });

  it('clears results', async () => {
    render(<DNSResolverTool />);
    
    // Perform lookup
    fireEvent.change(screen.getByLabelText(/Domain Name/i), { target: { value: 'example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Resolve/i }));
    
    await waitFor(() => {
      expect(screen.getByText('example.com')).toBeInTheDocument();
    });
    
    // Clear results
    const clearButton = screen.getByRole('button', { name: /Clear Results/i });
    fireEvent.click(clearButton);
    
    await waitFor(() => {
      expect(screen.getByText(/No DNS Results/i)).toBeInTheDocument();
    });
  });

  it('copies record value to clipboard', async () => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(),
      },
    });
    
    render(<DNSResolverTool />);
    
    fireEvent.change(screen.getByLabelText(/Domain Name/i), { target: { value: 'example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Resolve/i }));
    
    await waitFor(() => {
      expect(screen.getByText('93.184.216.34')).toBeInTheDocument();
    });
    
    // Find and click copy button
    const copyButtons = screen.getAllByRole('button', { name: /Copy/i });
    fireEvent.click(copyButtons[0]);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it('switches to cache tab', async () => {
    render(<DNSResolverTool />);
    
    // Perform lookup to populate cache
    fireEvent.change(screen.getByLabelText(/Domain Name/i), { target: { value: 'example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Resolve/i }));
    
    await waitFor(() => {
      expect(screen.getByText('example.com')).toBeInTheDocument();
    });
    
    // Switch to cache tab
    const cacheTab = screen.getByRole('tab', { name: /Cache/i });
    fireEvent.click(cacheTab);
    
    expect(screen.getByText('DNS Cache')).toBeInTheDocument();
  });

  it('displays cache entries', async () => {
    render(<DNSResolverTool />);
    
    // Perform lookup
    fireEvent.change(screen.getByLabelText(/Domain Name/i), { target: { value: 'example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Resolve/i }));
    
    await waitFor(() => {
      const cacheTab = screen.getByRole('tab', { name: /Cache \(1\)/i });
      fireEvent.click(cacheTab);
    });
    
    expect(screen.getByText(/example.com/i)).toBeInTheDocument();
  });

  it('clears cache', async () => {
    render(<DNSResolverTool />);
    
    // Perform lookup
    fireEvent.change(screen.getByLabelText(/Domain Name/i), { target: { value: 'example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Resolve/i }));
    
    await waitFor(() => {
      const cacheTab = screen.getByRole('tab', { name: /Cache/i });
      fireEvent.click(cacheTab);
    });
    
    // Clear cache
    const clearCacheButton = screen.getByRole('button', { name: /Clear Cache/i });
    fireEvent.click(clearCacheButton);
    
    await waitFor(() => {
      expect(screen.getByText(/DNS cache is empty/i)).toBeInTheDocument();
    });
  });

  it('switches to history tab', async () => {
    render(<DNSResolverTool />);
    
    // Perform lookup
    fireEvent.change(screen.getByLabelText(/Domain Name/i), { target: { value: 'example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Resolve/i }));
    
    await waitFor(() => {
      const historyTab = screen.getByRole('tab', { name: /History/i });
      fireEvent.click(historyTab);
    });
    
    expect(screen.getByText('Query History')).toBeInTheDocument();
  });

  it('displays query history', async () => {
    render(<DNSResolverTool />);
    
    // Perform lookup
    fireEvent.change(screen.getByLabelText(/Domain Name/i), { target: { value: 'example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Resolve/i }));
    
    await waitFor(() => {
      const historyTab = screen.getByRole('tab', { name: /History \(1\)/i });
      fireEvent.click(historyTab);
    });
    
    expect(screen.getByText('example.com')).toBeInTheDocument();
  });

  it('loads domain from history', async () => {
    render(<DNSResolverTool />);
    
    // Perform lookup
    fireEvent.change(screen.getByLabelText(/Domain Name/i), { target: { value: 'example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Resolve/i }));
    
    await waitFor(() => {
      const historyTab = screen.getByRole('tab', { name: /History/i });
      fireEvent.click(historyTab);
    });
    
    // Click on history item
    const historyChip = screen.getByText('example.com');
    fireEvent.click(historyChip);
    
    // Should switch back to results tab
    await waitFor(() => {
      const resultsTab = screen.getByRole('tab', { name: /Results/i });
      expect(resultsTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  it('formats TTL correctly', async () => {
    render(<DNSResolverTool />);
    
    fireEvent.change(screen.getByLabelText(/Domain Name/i), { target: { value: 'example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Resolve/i }));
    
    await waitFor(() => {
      // Should show formatted TTL (e.g., "1h" for 3600 seconds)
      expect(screen.getByText(/1h/i)).toBeInTheDocument();
    });
  });

  it('displays query time', async () => {
    render(<DNSResolverTool />);
    
    fireEvent.change(screen.getByLabelText(/Domain Name/i), { target: { value: 'example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Resolve/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Query time: \d+ms/i)).toBeInTheDocument();
    });
  });

  it('exports results', async () => {
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn();
    
    render(<DNSResolverTool />);
    
    fireEvent.change(screen.getByLabelText(/Domain Name/i), { target: { value: 'example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Resolve/i }));
    
    await waitFor(() => {
      expect(screen.getByText('example.com')).toBeInTheDocument();
    });
    
    const exportButton = screen.getByRole('button', { name: /Export/i });
    fireEvent.click(exportButton);
    
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });
});
