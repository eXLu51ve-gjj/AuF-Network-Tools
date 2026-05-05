import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SSHAdvancedFeatures from '../components/tools/SSHAdvancedFeatures';
import { SSHConnection } from '../types';

const mockConnection: SSHConnection = {
  id: 'test-connection-1',
  host: 'example.com',
  port: 22,
  username: 'testuser',
  authMethod: 'password',
  connected: true,
  lastActivity: new Date(),
};

const mockConnection2: SSHConnection = {
  id: 'test-connection-2',
  host: 'server2.com',
  port: 22,
  username: 'admin',
  authMethod: 'key',
  connected: true,
  lastActivity: new Date(),
};

describe('SSHAdvancedFeatures', () => {
  it('shows message when no connections', () => {
    render(<SSHAdvancedFeatures connections={[]} />);
    
    expect(screen.getByText('No Active SSH Connections')).toBeInTheDocument();
  });

  it('renders tabs for advanced features', () => {
    render(<SSHAdvancedFeatures connections={[mockConnection]} />);
    
    expect(screen.getByText('Port Forwarding')).toBeInTheDocument();
    expect(screen.getByText('File Transfer (SCP)')).toBeInTheDocument();
    expect(screen.getByText('Session Logs')).toBeInTheDocument();
    expect(screen.getByText('Session Recovery')).toBeInTheDocument();
  });

  it('opens port forward dialog', () => {
    render(<SSHAdvancedFeatures connections={[mockConnection]} />);
    
    const addButton = screen.getByRole('button', { name: /Add Forward/i });
    fireEvent.click(addButton);
    
    expect(screen.getByText('Add Port Forward')).toBeInTheDocument();
  });

  it('adds port forward', async () => {
    render(<SSHAdvancedFeatures connections={[mockConnection]} />);
    
    // Open dialog
    const addButton = screen.getByRole('button', { name: /Add Forward/i });
    fireEvent.click(addButton);
    
    // Select connection
    const connectionSelect = screen.getByLabelText(/Connection/i);
    fireEvent.mouseDown(connectionSelect);
    const connectionOption = screen.getByText(/testuser@example.com/i);
    fireEvent.click(connectionOption);
    
    // Click Add button in dialog
    const addDialogButton = screen.getAllByRole('button', { name: /Add/i })[1];
    fireEvent.click(addDialogButton);
    
    await waitFor(() => {
      expect(screen.getByText(/8080/)).toBeInTheDocument();
    });
  });

  it('removes port forward', async () => {
    render(<SSHAdvancedFeatures connections={[mockConnection]} />);
    
    // Add a forward first
    const addButton = screen.getByRole('button', { name: /Add Forward/i });
    fireEvent.click(addButton);
    
    const connectionSelect = screen.getByLabelText(/Connection/i);
    fireEvent.mouseDown(connectionSelect);
    const connectionOption = screen.getByText(/testuser@example.com/i);
    fireEvent.click(connectionOption);
    
    const addDialogButton = screen.getAllByRole('button', { name: /Add/i })[1];
    fireEvent.click(addDialogButton);
    
    await waitFor(() => {
      expect(screen.getByText(/8080/)).toBeInTheDocument();
    });
    
    // Remove the forward
    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(btn => btn.querySelector('[data-testid="DeleteIcon"]'));
    
    if (deleteButton) {
      fireEvent.click(deleteButton);
      await waitFor(() => {
        expect(screen.queryByText(/8080/)).not.toBeInTheDocument();
      });
    }
  });

  it('switches to file transfer tab', () => {
    render(<SSHAdvancedFeatures connections={[mockConnection]} />);
    
    const fileTransferTab = screen.getByText('File Transfer (SCP)');
    fireEvent.click(fileTransferTab);
    
    expect(screen.getByRole('button', { name: /New Transfer/i })).toBeInTheDocument();
  });

  it('opens file transfer dialog', () => {
    render(<SSHAdvancedFeatures connections={[mockConnection]} />);
    
    // Switch to file transfer tab
    const fileTransferTab = screen.getByText('File Transfer (SCP)');
    fireEvent.click(fileTransferTab);
    
    // Open dialog
    const newTransferButton = screen.getByRole('button', { name: /New Transfer/i });
    fireEvent.click(newTransferButton);
    
    expect(screen.getByText('New File Transfer')).toBeInTheDocument();
  });

  it('starts file transfer', async () => {
    render(<SSHAdvancedFeatures connections={[mockConnection]} />);
    
    // Switch to file transfer tab
    const fileTransferTab = screen.getByText('File Transfer (SCP)');
    fireEvent.click(fileTransferTab);
    
    // Open dialog
    const newTransferButton = screen.getByRole('button', { name: /New Transfer/i });
    fireEvent.click(newTransferButton);
    
    // Fill in form
    const connectionSelect = screen.getByLabelText(/Connection/i);
    fireEvent.mouseDown(connectionSelect);
    const connectionOption = screen.getByText(/testuser@example.com/i);
    fireEvent.click(connectionOption);
    
    const localPathInput = screen.getByLabelText(/Local Path/i);
    fireEvent.change(localPathInput, { target: { value: '/local/file.txt' } });
    
    const remotePathInput = screen.getByLabelText(/Remote Path/i);
    fireEvent.change(remotePathInput, { target: { value: '/remote/file.txt' } });
    
    // Start transfer
    const startButton = screen.getByRole('button', { name: /Start Transfer/i });
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Upload/i)).toBeInTheDocument();
    });
  });

  it('shows file transfer progress', async () => {
    render(<SSHAdvancedFeatures connections={[mockConnection]} />);
    
    // Switch to file transfer tab
    const fileTransferTab = screen.getByText('File Transfer (SCP)');
    fireEvent.click(fileTransferTab);
    
    // Start a transfer
    const newTransferButton = screen.getByRole('button', { name: /New Transfer/i });
    fireEvent.click(newTransferButton);
    
    const connectionSelect = screen.getByLabelText(/Connection/i);
    fireEvent.mouseDown(connectionSelect);
    const connectionOption = screen.getByText(/testuser@example.com/i);
    fireEvent.click(connectionOption);
    
    fireEvent.change(screen.getByLabelText(/Local Path/i), { target: { value: '/local/file.txt' } });
    fireEvent.change(screen.getByLabelText(/Remote Path/i), { target: { value: '/remote/file.txt' } });
    
    const startButton = screen.getByRole('button', { name: /Start Transfer/i });
    fireEvent.click(startButton);
    
    await waitFor(() => {
      // Should show progress bar
      const progressBars = document.querySelectorAll('[role="progressbar"]');
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });

  it('switches to session logs tab', () => {
    render(<SSHAdvancedFeatures connections={[mockConnection]} />);
    
    const logsTab = screen.getByText('Session Logs');
    fireEvent.click(logsTab);
    
    expect(screen.getByText(/Filter/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export/i })).toBeInTheDocument();
  });

  it('displays session logs', async () => {
    render(<SSHAdvancedFeatures connections={[mockConnection]} />);
    
    const logsTab = screen.getByText('Session Logs');
    fireEvent.click(logsTab);
    
    await waitFor(() => {
      expect(screen.getByText(/Connected to example.com:22/i)).toBeInTheDocument();
    });
  });

  it('filters session logs', async () => {
    render(<SSHAdvancedFeatures connections={[mockConnection, mockConnection2]} />);
    
    const logsTab = screen.getByText('Session Logs');
    fireEvent.click(logsTab);
    
    // Open filter dropdown
    const filterSelect = screen.getByLabelText(/Filter/i);
    fireEvent.mouseDown(filterSelect);
    
    // Select specific connection
    const filterOption = screen.getByText(/testuser@example.com/i);
    fireEvent.click(filterOption);
    
    await waitFor(() => {
      expect(screen.getByText(/Connected to example.com:22/i)).toBeInTheDocument();
    });
  });

  it('switches to session recovery tab', () => {
    render(<SSHAdvancedFeatures connections={[mockConnection]} />);
    
    const recoveryTab = screen.getByText('Session Recovery');
    fireEvent.click(recoveryTab);
    
    expect(screen.getByText(/All sessions are active/i)).toBeInTheDocument();
  });

  it('simulates disconnection', async () => {
    render(<SSHAdvancedFeatures connections={[mockConnection]} />);
    
    const recoveryTab = screen.getByText('Session Recovery');
    fireEvent.click(recoveryTab);
    
    // Simulate disconnection
    const disconnectSelect = screen.getByLabelText(/Select Connection to Disconnect/i);
    fireEvent.mouseDown(disconnectSelect);
    
    const connectionOption = screen.getByText(/testuser@example.com:22/i);
    fireEvent.click(connectionOption);
    
    await waitFor(() => {
      expect(screen.getByText(/session\(s\) disconnected/i)).toBeInTheDocument();
    });
  });

  it('recovers disconnected session', async () => {
    render(<SSHAdvancedFeatures connections={[mockConnection]} />);
    
    const recoveryTab = screen.getByText('Session Recovery');
    fireEvent.click(recoveryTab);
    
    // Simulate disconnection first
    const disconnectSelect = screen.getByLabelText(/Select Connection to Disconnect/i);
    fireEvent.mouseDown(disconnectSelect);
    const connectionOption = screen.getByText(/testuser@example.com:22/i);
    fireEvent.click(connectionOption);
    
    await waitFor(() => {
      expect(screen.getByText(/session\(s\) disconnected/i)).toBeInTheDocument();
    });
    
    // Recover session
    const recoverButton = screen.getByRole('button', { name: /Recover/i });
    fireEvent.click(recoverButton);
    
    await waitFor(() => {
      expect(screen.getByText(/All sessions are active/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('displays port forward types', async () => {
    render(<SSHAdvancedFeatures connections={[mockConnection]} />);
    
    const addButton = screen.getByRole('button', { name: /Add Forward/i });
    fireEvent.click(addButton);
    
    const typeSelect = screen.getByLabelText(/Forward Type/i);
    fireEvent.mouseDown(typeSelect);
    
    expect(screen.getByText(/Local \(-L\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Remote \(-R\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Dynamic \(-D\)/i)).toBeInTheDocument();
  });

  it('displays transfer types', async () => {
    render(<SSHAdvancedFeatures connections={[mockConnection]} />);
    
    const fileTransferTab = screen.getByText('File Transfer (SCP)');
    fireEvent.click(fileTransferTab);
    
    const newTransferButton = screen.getByRole('button', { name: /New Transfer/i });
    fireEvent.click(newTransferButton);
    
    const typeSelect = screen.getByLabelText(/Transfer Type/i);
    fireEvent.mouseDown(typeSelect);
    
    expect(screen.getByText(/Upload \(Local → Remote\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Download \(Remote → Local\)/i)).toBeInTheDocument();
  });

  it('toggles port forward status', async () => {
    render(<SSHAdvancedFeatures connections={[mockConnection]} />);
    
    // Add a forward
    const addButton = screen.getByRole('button', { name: /Add Forward/i });
    fireEvent.click(addButton);
    
    const connectionSelect = screen.getByLabelText(/Connection/i);
    fireEvent.mouseDown(connectionSelect);
    const connectionOption = screen.getByText(/testuser@example.com/i);
    fireEvent.click(connectionOption);
    
    const addDialogButton = screen.getAllByRole('button', { name: /Add/i })[1];
    fireEvent.click(addDialogButton);
    
    await waitFor(() => {
      expect(screen.getByText('active')).toBeInTheDocument();
    });
    
    // Toggle status
    const toggleButtons = screen.getAllByRole('button');
    const stopButton = toggleButtons.find(btn => btn.querySelector('[data-testid="StopIcon"]'));
    
    if (stopButton) {
      fireEvent.click(stopButton);
      await waitFor(() => {
        expect(screen.getByText('inactive')).toBeInTheDocument();
      });
    }
  });
});
