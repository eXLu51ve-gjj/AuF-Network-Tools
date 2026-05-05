import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SSHConnectionTool from '../components/tools/SSHConnectionTool';

describe('SSHConnectionTool', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders SSH connection form', () => {
    render(<SSHConnectionTool />);
    
    expect(screen.getByText('SSH Connection')).toBeInTheDocument();
    expect(screen.getByLabelText(/Host/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Port/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Authentication Method/i)).toBeInTheDocument();
  });

  it('shows password field when password auth is selected', () => {
    render(<SSHConnectionTool />);
    
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  it('shows key path field when key auth is selected', () => {
    render(<SSHConnectionTool />);
    
    const authSelect = screen.getByLabelText(/Authentication Method/i);
    fireEvent.mouseDown(authSelect);
    
    const keyOption = screen.getByText('Private Key');
    fireEvent.click(keyOption);
    
    expect(screen.getByLabelText(/Private Key Path/i)).toBeInTheDocument();
  });

  it('shows SSH agent info when agent auth is selected', () => {
    render(<SSHConnectionTool />);
    
    const authSelect = screen.getByLabelText(/Authentication Method/i);
    fireEvent.mouseDown(authSelect);
    
    const agentOption = screen.getByText('SSH Agent');
    fireEvent.click(agentOption);
    
    expect(screen.getByText(/Using SSH Agent for authentication/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<SSHConnectionTool />);
    
    const connectButton = screen.getByRole('button', { name: /Connect/i });
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByText('Host is required')).toBeInTheDocument();
      expect(screen.getByText('Username is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('validates port range', async () => {
    render(<SSHConnectionTool />);
    
    const portInput = screen.getByLabelText(/Port/i);
    fireEvent.change(portInput, { target: { value: '99999' } });
    
    const connectButton = screen.getByRole('button', { name: /Connect/i });
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Port must be between 1 and 65535/i)).toBeInTheDocument();
    });
  });

  it('validates host format', async () => {
    render(<SSHConnectionTool />);
    
    const hostInput = screen.getByLabelText(/Host/i);
    fireEvent.change(hostInput, { target: { value: 'invalid host!' } });
    
    const connectButton = screen.getByRole('button', { name: /Connect/i });
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByText('Invalid host format')).toBeInTheDocument();
    });
  });

  it('toggles password visibility', () => {
    render(<SSHConnectionTool />);
    
    const passwordInput = screen.getByLabelText(/Password/i) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');
    
    const toggleButton = screen.getByRole('button', { name: '' });
    fireEvent.click(toggleButton);
    
    expect(passwordInput.type).toBe('text');
  });

  it('saves connection profile', async () => {
    render(<SSHConnectionTool />);
    
    // Fill in connection details
    fireEvent.change(screen.getByLabelText(/Host/i), { target: { value: 'example.com' } });
    fireEvent.change(screen.getByLabelText(/Port/i), { target: { value: '22' } });
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'testpass' } });
    
    // Open save profile dialog
    const saveButton = screen.getByRole('button', { name: /Save Profile/i });
    fireEvent.click(saveButton);
    
    // Enter profile name
    const profileNameInput = screen.getByLabelText(/Profile Name/i);
    fireEvent.change(profileNameInput, { target: { value: 'Test Server' } });
    
    // Save profile
    const saveDialogButton = screen.getAllByRole('button', { name: /Save/i })[1];
    fireEvent.click(saveDialogButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Test Server/i)).toBeInTheDocument();
    });
  });

  it('loads saved profile', async () => {
    // Pre-save a profile
    const profile = {
      id: 'test-profile',
      name: 'Test Server',
      host: 'example.com',
      port: 22,
      username: 'testuser',
      authMethod: 'password',
      timeout: 30,
    };
    localStorage.setItem('ssh-profiles', JSON.stringify([profile]));
    
    render(<SSHConnectionTool />);
    
    // Load profile
    const profileSelect = screen.getByLabelText(/Load Profile/i);
    fireEvent.mouseDown(profileSelect);
    
    const profileOption = screen.getByText(/Test Server/i);
    fireEvent.click(profileOption);
    
    await waitFor(() => {
      expect((screen.getByLabelText(/Host/i) as HTMLInputElement).value).toBe('example.com');
      expect((screen.getByLabelText(/Username/i) as HTMLInputElement).value).toBe('testuser');
    });
  });

  it('deletes saved profile', async () => {
    // Pre-save a profile
    const profile = {
      id: 'test-profile',
      name: 'Test Server',
      host: 'example.com',
      port: 22,
      username: 'testuser',
      authMethod: 'password',
      timeout: 30,
    };
    localStorage.setItem('ssh-profiles', JSON.stringify([profile]));
    
    render(<SSHConnectionTool />);
    
    // Find and click delete button
    const deleteButtons = screen.getAllByRole('button', { name: '' });
    const deleteButton = deleteButtons.find(btn => btn.querySelector('[data-testid="DeleteIcon"]'));
    
    if (deleteButton) {
      fireEvent.click(deleteButton);
    }
    
    await waitFor(() => {
      expect(screen.queryByText(/Test Server/i)).not.toBeInTheDocument();
    });
  });

  it('calls onConnect callback when connection succeeds', async () => {
    const onConnect = jest.fn();
    render(<SSHConnectionTool onConnect={onConnect} />);
    
    // Fill in valid connection details
    fireEvent.change(screen.getByLabelText(/Host/i), { target: { value: 'example.com' } });
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'testpass' } });
    
    // Connect
    const connectButton = screen.getByRole('button', { name: /Connect/i });
    fireEvent.click(connectButton);
    
    // Wait for connection (mocked with delay)
    await waitFor(() => {
      expect(onConnect).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('displays connection status', async () => {
    render(<SSHConnectionTool />);
    
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
    
    // Fill in valid connection details
    fireEvent.change(screen.getByLabelText(/Host/i), { target: { value: 'example.com' } });
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'testpass' } });
    
    // Connect
    const connectButton = screen.getByRole('button', { name: /Connect/i });
    fireEvent.click(connectButton);
    
    // Should show connecting status
    await waitFor(() => {
      expect(screen.getByText('Connecting...')).toBeInTheDocument();
    });
  });

  it('displays active connections table', async () => {
    render(<SSHConnectionTool />);
    
    // Fill in valid connection details
    fireEvent.change(screen.getByLabelText(/Host/i), { target: { value: 'example.com' } });
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'testpass' } });
    
    // Connect
    const connectButton = screen.getByRole('button', { name: /Connect/i });
    fireEvent.click(connectButton);
    
    // Wait for connection
    await waitFor(() => {
      expect(screen.getByText('Active Connections')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('disconnects active connection', async () => {
    const onDisconnect = jest.fn();
    render(<SSHConnectionTool onDisconnect={onDisconnect} />);
    
    // Fill in valid connection details and connect
    fireEvent.change(screen.getByLabelText(/Host/i), { target: { value: 'example.com' } });
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'testpass' } });
    
    const connectButton = screen.getByRole('button', { name: /Connect/i });
    fireEvent.click(connectButton);
    
    // Wait for connection
    await waitFor(() => {
      expect(screen.getByText('Active Connections')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Find and click disconnect button
    const disconnectButtons = screen.getAllByRole('button', { name: '' });
    const disconnectButton = disconnectButtons.find(btn => btn.querySelector('[data-testid="StopIcon"]'));
    
    if (disconnectButton) {
      fireEvent.click(disconnectButton);
      expect(onDisconnect).toHaveBeenCalled();
    }
  });
});
