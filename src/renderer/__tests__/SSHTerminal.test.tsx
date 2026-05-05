import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SSHTerminal from '../components/tools/SSHTerminal';
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

describe('SSHTerminal', () => {
  it('shows message when no connections', () => {
    render(<SSHTerminal connections={[]} />);
    
    expect(screen.getByText('No Active SSH Sessions')).toBeInTheDocument();
    expect(screen.getByText(/Connect to a server to start a terminal session/i)).toBeInTheDocument();
  });

  it('renders terminal with connection', () => {
    render(<SSHTerminal connections={[mockConnection]} />);
    
    expect(screen.getByText(/testuser@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/Connected to example.com:22/i)).toBeInTheDocument();
  });

  it('displays welcome message', () => {
    render(<SSHTerminal connections={[mockConnection]} />);
    
    expect(screen.getByText(/Connected to example.com:22/i)).toBeInTheDocument();
    expect(screen.getByText(/Authentication: password/i)).toBeInTheDocument();
    expect(screen.getByText(/User: testuser/i)).toBeInTheDocument();
  });

  it('executes help command', async () => {
    render(<SSHTerminal connections={[mockConnection]} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'help' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText(/Available commands:/i)).toBeInTheDocument();
    });
  });

  it('executes ls command', async () => {
    render(<SSHTerminal connections={[mockConnection]} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'ls' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText(/Documents\//i)).toBeInTheDocument();
      expect(screen.getByText(/Downloads\//i)).toBeInTheDocument();
    });
  });

  it('executes pwd command', async () => {
    render(<SSHTerminal connections={[mockConnection]} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'pwd' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText(/\/home\/testuser/i)).toBeInTheDocument();
    });
  });

  it('executes whoami command', async () => {
    render(<SSHTerminal connections={[mockConnection]} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'whoami' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });
  });

  it('shows error for unknown command', async () => {
    render(<SSHTerminal connections={[mockConnection]} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'unknowncommand' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText(/command not found/i)).toBeInTheDocument();
    });
  });

  it('navigates command history with arrow keys', async () => {
    render(<SSHTerminal connections={[mockConnection]} />);
    
    const input = screen.getByRole('textbox') as HTMLInputElement;
    
    // Execute first command
    fireEvent.change(input, { target: { value: 'ls' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    await waitFor(() => {
      expect(input.value).toBe('');
    });
    
    // Execute second command
    fireEvent.change(input, { target: { value: 'pwd' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    await waitFor(() => {
      expect(input.value).toBe('');
    });
    
    // Navigate up in history
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input.value).toBe('pwd');
    
    // Navigate up again
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input.value).toBe('ls');
    
    // Navigate down
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input.value).toBe('pwd');
  });

  it('supports tab auto-completion', async () => {
    render(<SSHTerminal connections={[mockConnection]} />);
    
    const input = screen.getByRole('textbox') as HTMLInputElement;
    
    // Type partial command
    fireEvent.change(input, { target: { value: 'he' } });
    fireEvent.keyDown(input, { key: 'Tab' });
    
    // Should complete to 'help'
    expect(input.value).toBe('help');
  });

  it('shows multiple matches for tab completion', async () => {
    render(<SSHTerminal connections={[mockConnection]} />);
    
    const input = screen.getByRole('textbox');
    
    // Type partial command that matches multiple
    fireEvent.change(input, { target: { value: 'd' } });
    fireEvent.keyDown(input, { key: 'Tab' });
    
    await waitFor(() => {
      expect(screen.getByText(/date/i)).toBeInTheDocument();
      expect(screen.getByText(/df/i)).toBeInTheDocument();
    });
  });

  it('clears terminal on clear command', async () => {
    render(<SSHTerminal connections={[mockConnection]} />);
    
    const input = screen.getByRole('textbox');
    
    // Execute a command first
    fireEvent.change(input, { target: { value: 'ls' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText(/Documents\//i)).toBeInTheDocument();
    });
    
    // Clear terminal
    fireEvent.change(input, { target: { value: 'clear' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.queryByText(/Documents\//i)).not.toBeInTheDocument();
    });
  });

  it('supports multiple tabbed sessions', () => {
    render(<SSHTerminal connections={[mockConnection, mockConnection2]} />);
    
    expect(screen.getByText(/testuser@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/admin@server2.com/i)).toBeInTheDocument();
  });

  it('switches between tabs', () => {
    render(<SSHTerminal connections={[mockConnection, mockConnection2]} />);
    
    // Click second tab
    const tab2 = screen.getByText(/admin@server2.com/i);
    fireEvent.click(tab2);
    
    // Should show second connection details
    expect(screen.getByText(/server2.com:22/i)).toBeInTheDocument();
  });

  it('closes tab when close button clicked', () => {
    const onCloseSession = jest.fn();
    render(<SSHTerminal connections={[mockConnection, mockConnection2]} onCloseSession={onCloseSession} />);
    
    // Find close buttons
    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find(btn => btn.querySelector('[data-testid="CloseIcon"]'));
    
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(onCloseSession).toHaveBeenCalled();
    }
  });

  it('displays command history count', async () => {
    render(<SSHTerminal connections={[mockConnection]} />);
    
    const input = screen.getByRole('textbox');
    
    // Execute multiple commands
    fireEvent.change(input, { target: { value: 'ls' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText(/1 commands in history/i)).toBeInTheDocument();
    });
    
    fireEvent.change(input, { target: { value: 'pwd' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText(/2 commands in history/i)).toBeInTheDocument();
    });
  });

  it('shows connection info chips', () => {
    render(<SSHTerminal connections={[mockConnection]} />);
    
    expect(screen.getByText('example.com:22')).toBeInTheDocument();
    expect(screen.getByText('password')).toBeInTheDocument();
  });

  it('opens context menu', () => {
    render(<SSHTerminal connections={[mockConnection]} />);
    
    const menuButton = screen.getByRole('button', { name: '' });
    fireEvent.click(menuButton);
    
    expect(screen.getByText('Clear Terminal')).toBeInTheDocument();
    expect(screen.getByText('Copy Output')).toBeInTheDocument();
    expect(screen.getByText('Export Session')).toBeInTheDocument();
  });

  it('executes date command', async () => {
    render(<SSHTerminal connections={[mockConnection]} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'date' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    await waitFor(() => {
      // Should show some date output
      const output = screen.getByText(/\d{4}/); // Year in date
      expect(output).toBeInTheDocument();
    });
  });

  it('executes uptime command', async () => {
    render(<SSHTerminal connections={[mockConnection]} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'uptime' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText(/up \d+ days/i)).toBeInTheDocument();
    });
  });

  it('executes df command', async () => {
    render(<SSHTerminal connections={[mockConnection]} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'df' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText(/Filesystem/i)).toBeInTheDocument();
    });
  });

  it('executes free command', async () => {
    render(<SSHTerminal connections={[mockConnection]} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'free' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText(/Mem:/i)).toBeInTheDocument();
    });
  });

  it('executes ps command', async () => {
    render(<SSHTerminal connections={[mockConnection]} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'ps' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText(/PID/i)).toBeInTheDocument();
    });
  });
});
