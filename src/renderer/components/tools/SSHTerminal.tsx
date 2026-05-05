import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  InputAdornment, 
  IconButton, 
  Chip, 
  Menu,
  MenuItem,
  ListItemText,
  Divider,
  styled 
} from '@mui/material';
import { 
  Send as SendIcon, 
  History as HistoryIcon,
  Clear as ClearIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from '@mui/icons-material';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { SSHConnection } from '../../types';
import { SSHTheme, getTheme } from './SSHThemes';

// ─── Styled ───────────────────────────────────────────────────────────────────

const TerminalWrapper = styled(Box)({
  display: 'flex',
  height: '100%',
  overflow: 'hidden', // Changed back to hidden
  position: 'relative',
});

const XtermContainer = styled(Box)({
  flex: 1,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0, // Важно для правильного сжатия flex элемента
});

const XtermInner = styled(Box)({
  flex: 1,
  overflow: 'hidden',
  padding: '4px 4px 4px 8px',
  '& .xterm': { height: '100%' },
  '& .xterm-viewport': { overflowY: 'scroll !important' },
  '& .xterm-screen': { height: '100%' },
  outline: 'none', // Remove focus outline
  '&:focus': {
    outline: 'none',
  },
});

const InputBar = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px',
  borderTop: '1px solid rgba(255,255,255,0.1)',
  backgroundColor: 'rgba(0,0,0,0.8)',
  minHeight: '48px',
  flexShrink: 0,
});

const StatusBar = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '4px 12px',
  borderTop: '1px solid rgba(255,255,255,0.06)',
  fontSize: '11px',
  fontFamily: 'monospace',
  backgroundColor: 'rgba(0,0,0,0.6)',
  minHeight: '24px',
  flexShrink: 0,
});

// Minimap — right side panel
const MinimapPanel = styled(Box)({
  width: '100px',
  flexShrink: 0,
  backgroundColor: 'rgba(10,10,10,0.98)',
  borderLeft: '1px solid rgba(255,255,255,0.1)',
  position: 'relative',
  overflow: 'hidden', // Changed back to hidden
  cursor: 'pointer',
  userSelect: 'none',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 100,
});

const MinimapHeader = styled(Box)({
  padding: '4px 6px',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
  fontSize: '9px',
  fontFamily: 'monospace',
  textAlign: 'center',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  fontWeight: 600,
  backgroundColor: 'rgba(0,0,0,0.5)',
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface SSHTerminalProps {
  connections: SSHConnection[];
  selectedConnectionId?: string | null;
  onCloseSession?: (id: string) => void;
  onSelectSession?: (id: string) => void;
  theme?: SSHTheme;
  fontFamily?: string;
  showMinimap?: boolean;
}

// ─── Instance ────────────────────────────────────────────────────────────────

const SSHTerminalInstance: React.FC<{
  connectionId: string;
  connection: SSHConnection;
  theme: SSHTheme;
  fontFamily: string;
  visible: boolean;
  showMinimap: boolean;
}> = ({ connectionId, connection, theme, fontFamily, visible, showMinimap }) => {
  const xtermInnerRef = useRef<HTMLDivElement>(null);
  const minimapRef = useRef<HTMLDivElement>(null);
  const minimapContentRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const shellOpenedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [cursorPos, setCursorPos] = useState({ row: 1, col: 1 });
  const [minimapData, setMinimapData] = useState({
    totalLines: 0,
    visibleLines: 0,
    scrollTop: 0,
  });
  // Magnifier lens state
  const [lensVisible, setLensVisible] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [scrollPercent, setScrollPercent] = useState(0);
  
  // Interactive mode detection
  const [isInteractiveMode, setIsInteractiveMode] = useState(false);
  const [interactiveProgram, setInteractiveProgram] = useState<string>('');
  
  // Manual toggle for interactive mode
  const toggleInteractiveMode = useCallback(() => {
    const newMode = !isInteractiveMode;
    setIsInteractiveMode(newMode);
    
    if (newMode) {
      // Entering interactive mode - focus terminal
      // Try to detect what program is running from terminal content
      if (termRef.current) {
        const buf = termRef.current.buffer.active;
        let detectedProgram = '';
        
        // Check last few lines for program indicators
        for (let i = Math.max(0, buf.baseY - 5); i <= buf.baseY; i++) {
          const line = buf.getLine(i);
          if (line) {
            const text = line.translateToString(true);
            if (text.includes('GNU nano')) detectedProgram = 'nano';
            else if (text.includes('VIM')) detectedProgram = 'vim';
            else if (text.includes('htop')) detectedProgram = 'htop';
          }
        }
        
        setInteractiveProgram(detectedProgram || 'interactive');
      }
      
      setTimeout(() => {
        if (xtermInnerRef.current && termRef.current) {
          xtermInnerRef.current.focus();
          termRef.current.focus();
        }
      }, 100);
    } else {
      // Exiting - focus input
      setInteractiveProgram('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isInteractiveMode]);
  
  const [commandInput, setCommandInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isTyping, setIsTyping] = useState(false);
  const [historyMenuAnchor, setHistoryMenuAnchor] = useState<null | HTMLElement>(null);

  // Load command history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem(`ssh-history-${connectionId}`);
    if (savedHistory) {
      try {
        setCommandHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to load command history:', e);
      }
    }
  }, [connectionId]);

  // Save command history to localStorage
  const saveHistory = useCallback((history: string[]) => {
    try {
      localStorage.setItem(`ssh-history-${connectionId}`, JSON.stringify(history.slice(-100))); // Keep last 100
    } catch (e) {
      console.error('Failed to save command history:', e);
    }
  }, [connectionId]);

  const buildXtermTheme = useCallback((t: SSHTheme) => {
    // Generate 256-color palette (colors 16-255)
    const generate256ColorPalette = (): string[] => {
      const colors: string[] = [];
      
      // Colors 16-231: 6x6x6 RGB cube
      for (let r = 0; r < 6; r++) {
        for (let g = 0; g < 6; g++) {
          for (let b = 0; b < 6; b++) {
            const rv = r === 0 ? 0 : 55 + r * 40;
            const gv = g === 0 ? 0 : 55 + g * 40;
            const bv = b === 0 ? 0 : 55 + b * 40;
            colors.push(`#${rv.toString(16).padStart(2, '0')}${gv.toString(16).padStart(2, '0')}${bv.toString(16).padStart(2, '0')}`);
          }
        }
      }
      
      // Colors 232-255: grayscale ramp
      for (let i = 0; i < 24; i++) {
        const gray = 8 + i * 10;
        colors.push(`#${gray.toString(16).padStart(2, '0')}${gray.toString(16).padStart(2, '0')}${gray.toString(16).padStart(2, '0')}`);
      }
      
      return colors;
    };

    return {
      background: t.background,
      foreground: t.foreground,
      cursor: t.cursor,
      cursorAccent: t.background,
      selectionBackground: 'rgba(255,255,255,0.2)',
      
      // Standard 16 ANSI colors (0-15)
      black: t.background,           // 0: Black
      red: t.error,                  // 1: Red
      green: t.success,              // 2: Green
      yellow: t.warning,             // 3: Yellow
      blue: t.info,                  // 4: Blue
      magenta: t.link,               // 5: Magenta
      cyan: t.ip,                    // 6: Cyan
      white: t.foreground,           // 7: White
      
      // Bright colors (8-15)
      brightBlack: '#666666',        // 8: Bright Black (Gray)
      brightRed: t.error,            // 9: Bright Red
      brightGreen: t.success,        // 10: Bright Green
      brightYellow: t.warning,       // 11: Bright Yellow
      brightBlue: t.directory,       // 12: Bright Blue (for directories in ls)
      brightMagenta: t.link,         // 13: Bright Magenta
      brightCyan: t.mac,             // 14: Bright Cyan
      brightWhite: '#ffffff',        // 15: Bright White
      
      // Extended 256-color palette (16-255)
      extendedAnsi: generate256ColorPalette(),
    };
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // DETECT INTERACTIVE PROGRAMS
  // ═══════════════════════════════════════════════════════════════════════════
  const detectInteractiveMode = useCallback((data: string) => {
    // Check for exit from interactive mode FIRST
    if (
      data.includes('\x1b[?1049l') ||  // Exit alternate screen
      data.includes('\x1b[?25h')       // Show cursor (sometimes)
    ) {
      return { isInteractive: false, program: '' };
    }

    // List of interactive programs with STRICT patterns
    const interactivePrograms = [
      { name: 'nano', pattern: 'GNU nano' },
      { name: 'vim', pattern: '\x1b[?1049h' }, // Alternate screen buffer
      { name: 'vi', pattern: '\x1b[?1049h' },
      { name: 'htop', pattern: '\x1b[?1049h' },
      { name: 'top', pattern: '\x1b[?1047h' },
      { name: 'less', pattern: '\x1b[?1049h' },
      { name: 'more', pattern: '--More--' },
      { name: 'man', pattern: '\x1b[?1049h' },
    ];

    // Check for program-specific patterns
    for (const prog of interactivePrograms) {
      if (data.includes(prog.pattern)) {
        return { isInteractive: true, program: prog.name };
      }
    }

    return { isInteractive: false, program: '' };
  }, []);

  // Init xterm
  useEffect(() => {
    if (!xtermInnerRef.current || termRef.current) return;

    const term = new Terminal({
      theme: buildXtermTheme(theme),
      fontFamily: fontFamily,
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: false,
      cursorStyle: 'block',
      scrollback: 10000,
      allowTransparency: true,
      convertEol: true,
      disableStdin: false, // Enable stdin for interactive programs
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());
    term.open(xtermInnerRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    // ═══════════════════════════════════════════════════════════════════════════
    // MINIMAP UPDATE - Like your example code
    // ═══════════════════════════════════════════════════════════════════════════
    const updateMinimapData = () => {
      if (!term) return;
      
      const buf = term.buffer.active;
      const cursorY = buf.cursorY;
      const cursorX = buf.cursorX;
      
      // Get xterm buffer values
      const baseY = buf.baseY;
      const viewportY = buf.viewportY;
      const rows = term.rows;
      
      // Calculate like in your example:
      // scrollHeight = total content
      // scrollTop = where you are looking
      // clientHeight = visible area
      const scrollHeight = baseY + rows;
      const scrollTop = viewportY;
      const clientHeight = rows;
      
      // Update cursor position
      setCursorPos({ row: cursorY + 1, col: cursorX + 1 });
      
      // Update minimap data
      setMinimapData({
        totalLines: scrollHeight,
        visibleLines: clientHeight,
        scrollTop: scrollTop,
      });
    };

    term.onCursorMove(updateMinimapData);
    
    // IMPORTANT: Also update on scroll!
    term.onScroll(() => {
      updateMinimapData();
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // TERMINAL INPUT - Send keystrokes to PTY (ALWAYS enabled)
    // ═══════════════════════════════════════════════════════════════════════════
    term.onData((data) => {
      // Always send data to PTY
      window.electronAPI.sshPtyWrite(connectionId, data);
    });

    // Add keyboard handler for terminal area
    const handleTerminalKeyboard = (e: KeyboardEvent) => {
      // Ctrl+C in terminal area - copy selection
      if (e.ctrlKey && e.key === 'c') {
        const selection = term.getSelection();
        if (selection && selection.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          navigator.clipboard.writeText(selection).then(() => {
            console.log('Copied from terminal:', selection);
          }).catch(err => {
            console.error('Failed to copy:', err);
          });
        }
      }
    };

    // Attach keyboard handler to terminal element
    if (xtermInnerRef.current) {
      xtermInnerRef.current.addEventListener('keydown', handleTerminalKeyboard);
    }

    // Open PTY shell
    if (!shellOpenedRef.current) {
      shellOpenedRef.current = true;
      window.electronAPI.sshOpenShell(connectionId).then((result: any) => {
        if (!result.success) {
          term.writeln(`\r\n\x1b[31mShell error: ${result.error}\x1b[0m`);
        }
      });
    }

    // PTY data → xterm
    const onData = (data: { connectionId: string; data: string }) => {
      if (data.connectionId === connectionId) {
        // ═══════════════════════════════════════════════════════════════════
        // CLIENT-SIDE SYNTAX HIGHLIGHTING
        // ═══════════════════════════════════════════════════════════════════
        // Add colors to elements that servers don't typically colorize
        let processedData = data.data;
        
        // Only apply client-side highlighting if data doesn't already have
        // extensive ANSI codes (to avoid interfering with server colors)
        const ansiCodeCount = (processedData.match(/\x1b\[/g) || []).length;
        const shouldHighlight = ansiCodeCount < 5; // Threshold for "plain text"
        
        if (shouldHighlight) {
          // Split by existing ANSI codes to preserve them
          const parts = processedData.split(/(\x1b\[[0-9;]*m)/);
          
          processedData = parts.map((part, index) => {
            // Skip ANSI codes themselves
            if (part.match(/^\x1b\[[0-9;]*m$/)) {
              return part;
            }
            
            let result = part;
            
            // 1. Highlight IPv4 addresses (xxx.xxx.xxx.xxx)
            result = result.replace(
              /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/g,
              `\x1b[36m$1\x1b[0m`  // Cyan (theme.ip)
            );
            
            // 2. Highlight MAC addresses (xx:xx:xx:xx:xx:xx)
            result = result.replace(
              /\b([0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2})\b/g,
              `\x1b[32m$1\x1b[0m`  // Green (theme.mac)
            );
            
            // 3. Highlight numbers with units (time, bytes, packets, etc.)
            result = result.replace(
              /\b(\d+(?:\.\d+)?)\s*(ms|bytes|KB|MB|GB|TB|packets|packet|%|sec|min|hour)\b/gi,
              (match, num, unit) => `\x1b[33m${num}\x1b[0m ${unit}`  // Yellow (theme.number)
            );
            
            // 4. Highlight ports (after colon, e.g., :22, :80, :443)
            result = result.replace(
              /:(\d{1,5})\b/g,
              `:\x1b[33m$1\x1b[0m`  // Yellow (theme.port)
            );
            
            // 5. Highlight file sizes (e.g., 4096, 22446)
            // Only if followed by typical ls output pattern
            result = result.replace(
              /\b(\d{3,})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/g,
              `\x1b[33m$1\x1b[0m $2`  // Yellow (theme.size)
            );
            
            // 6. Highlight percentages
            result = result.replace(
              /\b(\d+)%/g,
              `\x1b[33m$1\x1b[0m%`  // Yellow
            );
            
            // 7. Highlight TTL values (ttl=xxx)
            result = result.replace(
              /ttl=(\d+)/gi,
              `ttl=\x1b[35m$1\x1b[0m`  // Magenta
            );
            
            // 8. Highlight sequence numbers (seq=xxx)
            result = result.replace(
              /seq=(\d+)/gi,
              `seq=\x1b[35m$1\x1b[0m`  // Magenta
            );
            
            // 9. Highlight time values (time=xx.x ms)
            result = result.replace(
              /time=(\d+(?:\.\d+)?)\s*ms/gi,
              `time=\x1b[33m$1\x1b[0m ms`  // Yellow
            );
            
            return result;
          }).join('');
        }
        
        term.write(processedData);
        updateMinimapData();
      }
    };

    const onClose = (data: { connectionId: string }) => {
      if (data.connectionId === connectionId) {
        term.writeln('\r\n\x1b[33mConnection closed.\x1b[0m');
      }
    };

    window.electronAPI.on('ssh:pty-data', onData);
    window.electronAPI.on('ssh:pty-close', onClose);

    // Resize observer
    const ro = new ResizeObserver(() => {
      if (fitAddonRef.current && termRef.current) {
        try {
          fitAddonRef.current.fit();
          const { cols, rows } = termRef.current;
          window.electronAPI.sshPtyResize(connectionId, cols, rows);
          updateMinimapData();
        } catch {}
      }
    });
    if (xtermInnerRef.current) ro.observe(xtermInnerRef.current);

    return () => {
      ro.disconnect();
      if (xtermInnerRef.current) {
        xtermInnerRef.current.removeEventListener('keydown', handleTerminalKeyboard);
      }
      window.electronAPI.removeAllListeners('ssh:pty-data');
      window.electronAPI.removeAllListeners('ssh:pty-close');
    };
  }, []);

  // Update theme
  useEffect(() => {
    if (termRef.current) {
      termRef.current.options.theme = buildXtermTheme(theme);
    }
  }, [theme, buildXtermTheme]);

  // Update font family
  useEffect(() => {
    if (termRef.current) {
      termRef.current.options.fontFamily = fontFamily;
    }
  }, [fontFamily]);

  // Fit on visibility change
  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        try {
          fitAddonRef.current?.fit();
          if (termRef.current) {
            const { cols, rows } = termRef.current;
            window.electronAPI.sshPtyResize(connectionId, cols, rows);
          }
          // Focus input field instead of terminal
          inputRef.current?.focus();
        } catch {}
      }, 50);
    }
  }, [visible]);

  // Global Ctrl+Shift+C handler for the entire component
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+C anywhere in the component - copy from terminal
      if (e.ctrlKey && e.shiftKey && e.key === 'C' && visible) {
        if (termRef.current) {
          const selection = termRef.current.getSelection();
          if (selection && selection.length > 0) {
            e.preventDefault();
            e.stopPropagation();
            navigator.clipboard.writeText(selection).then(() => {
              console.log('Copied from terminal (global):', selection);
            }).catch(err => {
              console.error('Failed to copy:', err);
            });
            return;
          }
        }
      }
    };

    if (visible) {
      window.addEventListener('keydown', handleGlobalKeyDown, true);
    }

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, true);
    };
  }, [visible]);

  // Handle command submission
  const handleSendCommand = useCallback(() => {
    if (!commandInput.trim() || isInteractiveMode) return;
    
    // Add to history
    const newHistory = [...commandHistory, commandInput];
    setCommandHistory(newHistory);
    saveHistory(newHistory);
    setHistoryIndex(-1);
    
    // Send command to PTY
    window.electronAPI.sshPtyWrite(connectionId, commandInput + '\r');
    
    // Clear input
    setCommandInput('');
    setIsTyping(false);
    
    // Keep focus on input
    inputRef.current?.focus();
  }, [commandInput, commandHistory, connectionId, saveHistory, isInteractiveMode]);

  // Handle special keys
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // In interactive mode, don't handle keys in input field
    if (isInteractiveMode) {
      e.preventDefault();
      return;
    }
    
    // Ctrl+Shift+C - copy from terminal
    if (e.key === 'C' && e.ctrlKey && e.shiftKey) {
      e.preventDefault();
      if (termRef.current) {
        const selection = termRef.current.getSelection();
        if (selection && selection.length > 0) {
          navigator.clipboard.writeText(selection).then(() => {
            console.log('Copied from terminal:', selection);
          }).catch(err => {
            console.error('Failed to copy:', err);
          });
        }
      }
      return;
    }
    
    // Ctrl+Shift+V - paste to terminal/input
    if (e.key === 'V' && e.ctrlKey && e.shiftKey) {
      e.preventDefault();
      navigator.clipboard.readText().then(text => {
        setCommandInput(prev => prev + text);
      }).catch(err => {
        console.error('Failed to paste:', err);
      });
      return;
    }
    
    // Ctrl+C - send interrupt signal (only if input is empty)
    if (e.key === 'c' && e.ctrlKey && !e.shiftKey) {
      if (!commandInput.trim()) {
        e.preventDefault();
        window.electronAPI.sshPtyWrite(connectionId, '\x03');
      }
      return;
    }
    
    // Ctrl+X - cut
    if (e.key === 'x' && e.ctrlKey) {
      // Allow default cut behavior for input field
      return;
    }
    
    // Ctrl+A - select all in input
    if (e.key === 'a' && e.ctrlKey) {
      // Allow default select all behavior for input field
      return;
    }
    
    // Enter - send command
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendCommand();
      return;
    }
    
    // Arrow Up - previous command
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      
      const newIndex = historyIndex === -1 
        ? commandHistory.length - 1 
        : Math.max(0, historyIndex - 1);
      
      setHistoryIndex(newIndex);
      setCommandInput(commandHistory[newIndex]);
      return;
    }
    
    // Arrow Down - next command
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      
      const newIndex = historyIndex + 1;
      if (newIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        setCommandInput('');
      } else {
        setHistoryIndex(newIndex);
        setCommandInput(commandHistory[newIndex]);
      }
      return;
    }
    
    // Tab - send to PTY for autocomplete
    if (e.key === 'Tab') {
      e.preventDefault();
      window.electronAPI.sshPtyWrite(connectionId, '\t');
      return;
    }
    
    // Ctrl+D - send EOF (only if input is empty)
    if (e.key === 'd' && e.ctrlKey && !commandInput.trim()) {
      e.preventDefault();
      window.electronAPI.sshPtyWrite(connectionId, '\x04');
      return;
    }
    
    // Ctrl+L - clear screen
    if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      termRef.current?.clear();
      return;
    }
    
    // Ctrl+U - clear line
    if (e.key === 'u' && e.ctrlKey) {
      e.preventDefault();
      setCommandInput('');
      return;
    }
    
    // Ctrl+K - clear from cursor to end
    if (e.key === 'k' && e.ctrlKey) {
      e.preventDefault();
      const input = inputRef.current;
      if (input) {
        const cursorPos = input.selectionStart || 0;
        setCommandInput(commandInput.slice(0, cursorPos));
      }
      return;
    }
    
    // Ctrl+W - delete word before cursor
    if (e.key === 'w' && e.ctrlKey) {
      e.preventDefault();
      const input = inputRef.current;
      if (input) {
        const cursorPos = input.selectionStart || 0;
        const beforeCursor = commandInput.slice(0, cursorPos);
        const afterCursor = commandInput.slice(cursorPos);
        const lastSpace = beforeCursor.trimEnd().lastIndexOf(' ');
        const newBefore = lastSpace >= 0 ? beforeCursor.slice(0, lastSpace + 1) : '';
        setCommandInput(newBefore + afterCursor);
        setTimeout(() => {
          input.setSelectionRange(newBefore.length, newBefore.length);
        }, 0);
      }
      return;
    }
  }, [commandInput, commandHistory, historyIndex, connectionId, handleSendCommand, isInteractiveMode]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCommandInput(e.target.value);
    setIsTyping(e.target.value.length > 0);
    setHistoryIndex(-1); // Reset history navigation when typing
  }, []);

  // Clear command input
  const handleClearInput = useCallback(() => {
    setCommandInput('');
    setIsTyping(false);
    setHistoryIndex(-1);
    inputRef.current?.focus();
  }, []);

  // Open history menu
  const handleOpenHistoryMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setHistoryMenuAnchor(event.currentTarget);
  }, []);

  // Close history menu
  const handleCloseHistoryMenu = useCallback(() => {
    setHistoryMenuAnchor(null);
  }, []);

  // Select command from history menu
  const handleSelectHistoryCommand = useCallback((command: string) => {
    setCommandInput(command);
    setHistoryMenuAnchor(null);
    setHistoryIndex(-1);
    inputRef.current?.focus();
  }, []);

  // Clear history
  const handleClearHistory = useCallback(() => {
    setCommandHistory([]);
    localStorage.removeItem(`ssh-history-${connectionId}`);
    setHistoryMenuAnchor(null);
  }, [connectionId]);

  // ═══════════════════════════════════════════════════════════════════════════
  // MINIMAP CLICK - Jump to position (like your example)
  // ═══════════════════════════════════════════════════════════════════════════
  const handleMinimapClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!termRef.current || !minimapContentRef.current) return;
    
    const rect = minimapContentRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const clickRatio = Math.max(0, Math.min(1, clickY / rect.height));
    
    // Scroll to clicked position
    const targetLine = Math.floor(clickRatio * minimapData.totalLines);
    termRef.current.scrollToLine(Math.max(0, targetLine));
  }, [minimapData.totalLines]);

  // ═══════════════════════════════════════════════════════════════════════════
  // MAGNIFIER LENS - Show on hover (like your example)
  // ═══════════════════════════════════════════════════════════════════════════
  const handleMinimapMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!minimapContentRef.current || !minimapRef.current) return;
    
    // Get position relative to minimap content area (not including header)
    const contentRect = minimapContentRef.current.getBoundingClientRect();
    const y = e.clientY - contentRect.top;
    
    setLensPos({ x: 0, y });
    
    // Calculate scroll percent for lens content (where in the document we are)
    const percent = y / contentRect.height;
    setScrollPercent(percent);
    setLensVisible(true);
  }, []);

  const handleMinimapMouseLeave = useCallback(() => {
    setLensVisible(false);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // GET TERMINAL TEXT - For minimap and magnifier
  // ═══════════════════════════════════════════════════════════════════════════
  const getTerminalText = useCallback(() => {
    if (!termRef.current) return '';
    
    const buf = termRef.current.buffer.active;
    const lines: string[] = [];
    
    for (let i = 0; i < minimapData.totalLines; i++) {
      const line = buf.getLine(i);
      if (line) {
        lines.push(line.translateToString(false));
      } else {
        lines.push('');
      }
    }
    
    return lines.join('\n');
  }, [minimapData.totalLines]);

  // ═══════════════════════════════════════════════════════════════════════════
  // MINIMAP VIEWPORT CALCULATION (like your example)
  // ═══════════════════════════════════════════════════════════════════════════
  const terminalText = getTerminalText();
  
  // Calculate viewport position and size
  let viewportTopPercent = 0;
  let viewportHeightPercent = 100;
  
  if (minimapData.totalLines > 0) {
    const scrollRatio = minimapData.scrollTop / minimapData.totalLines;
    const visibleRatio = minimapData.visibleLines / minimapData.totalLines;
    
    viewportTopPercent = scrollRatio * 100;
    viewportHeightPercent = visibleRatio * 100;
    
    viewportTopPercent = Math.max(0, Math.min(100, viewportTopPercent));
    viewportHeightPercent = Math.max(1, Math.min(100 - viewportTopPercent, viewportHeightPercent));
  }
  
  const displayScrollPercent = Math.round(viewportTopPercent);

  return (
    <TerminalWrapper sx={{ display: visible ? 'flex' : 'none', backgroundColor: theme.background, flexDirection: 'column' }}>
      {/* Terminal area with minimap */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Main terminal */}
        <XtermContainer>
          <XtermInner 
            ref={xtermInnerRef} 
            tabIndex={0}
            onClick={() => {
              // Click on terminal to focus it
              if (xtermInnerRef.current && termRef.current) {
                xtermInnerRef.current.focus();
                termRef.current.focus();
              }
            }}
            onContextMenu={(e) => {
              // Right-click to paste
              e.preventDefault();
              navigator.clipboard.readText().then(text => {
                if (termRef.current) {
                  window.electronAPI.sshPtyWrite(connectionId, text);
                }
              }).catch(err => {
                console.error('Failed to paste:', err);
              });
            }}
          />
        </XtermContainer>

        {/* Minimap - only for terminal area */}
        {showMinimap && (
          <MinimapPanel ref={minimapRef}>
          <MinimapHeader sx={{ color: theme.info }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Minimap</span>
              <span style={{ fontSize: '8px', opacity: 0.6 }}>{minimapData.totalLines}</span>
            </Box>
          </MinimapHeader>
          
          {/* Minimap content area */}
          <Box
            ref={minimapContentRef}
            onClick={handleMinimapClick}
            onMouseMove={handleMinimapMouseMove}
            onMouseLeave={handleMinimapMouseLeave}
            sx={{
              flex: 1,
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
            }}
          >
            {/* Tiny text preview */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                fontSize: '3px',
                lineHeight: '4px',
                color: 'rgba(255,255,255,0.5)',
                fontFamily: 'monospace',
                padding: '4px',
                opacity: 0.6,
                pointerEvents: 'none',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {terminalText}
            </Box>

            {/* Viewport indicator */}
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                width: '100%',
                top: `${viewportTopPercent}%`,
                height: `${viewportHeightPercent}%`,
                backgroundColor: `${theme.cursor}20`,
                borderTop: `1px solid ${theme.cursor}40`,
                borderBottom: `1px solid ${theme.cursor}40`,
                pointerEvents: 'none',
                transition: 'all 0.075s linear',
              }}
            />
          </Box>

          {/* Magnifier lens */}
          {lensVisible && (
            <Box
              sx={{
                position: 'fixed',
                zIndex: 9999,
                pointerEvents: 'none',
                backgroundColor: theme.background,
                border: `2px solid ${theme.cursor}`,
                borderRadius: '6px',
                boxShadow: `0 4px 30px ${theme.cursor}80`,
                overflow: 'hidden',
                width: '250px',
                height: '80px',
                transform: `translate(-260px, ${lensPos.y - 40}px)`,
                left: minimapRef.current?.getBoundingClientRect().left || 0,
                top: (minimapContentRef.current?.getBoundingClientRect().top || 0),
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  width: '100%',
                  px: 1,
                  fontSize: '11px',
                  lineHeight: '14px',
                  color: theme.foreground,
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  top: '40px',
                  transform: `translateY(-${scrollPercent * 100}%)`,
                }}
              >
                {terminalText}
              </Box>

              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  width: '100%',
                  height: '1px',
                  backgroundColor: `${theme.cursor}80`,
                }}
              />
            </Box>
          )}
        </MinimapPanel>
        )}
      </Box>
        
        {/* Input bar - hidden in interactive mode */}
        {!isInteractiveMode && (
          <InputBar sx={{ backgroundColor: theme.background, borderTopColor: `${theme.cursor}40` }}>
          <TextField
            ref={inputRef}
            fullWidth
            size="small"
            value={commandInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Введите команду... (↑↓ история, Tab автодополнение, Ctrl+Shift+C копировать, Ctrl+Shift+V вставить, Ctrl+C прервать)"
            autoComplete="off"
            sx={{
              '& .MuiOutlinedInput-root': {
                fontFamily: 'monospace',
                fontSize: '13px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: theme.foreground,
                '& fieldset': {
                  borderColor: isTyping ? `${theme.cursor}60` : 'rgba(255,255,255,0.1)',
                },
                '&:hover fieldset': {
                  borderColor: `${theme.cursor}80`,
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.cursor,
                  borderWidth: '2px',
                },
              },
              '& .MuiInputBase-input': {
                color: theme.foreground,
                '&::placeholder': {
                  color: 'rgba(255,255,255,0.25)',
                  opacity: 1,
                  fontSize: '12px',
                },
              },
            }}
            InputProps={{
              startAdornment: commandHistory.length > 0 && (
                <InputAdornment position="start">
                  <Chip
                    icon={<HistoryIcon sx={{ fontSize: 12 }} />}
                    label={commandHistory.length}
                    size="small"
                    onClick={handleOpenHistoryMenu}
                    deleteIcon={<ArrowDownIcon sx={{ fontSize: 14 }} />}
                    onDelete={handleOpenHistoryMenu}
                    sx={{
                      height: '22px',
                      fontSize: '11px',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      color: theme.info,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: `${theme.info}20`,
                      },
                      '& .MuiChip-icon': { color: theme.info },
                      '& .MuiChip-deleteIcon': { 
                        color: theme.info,
                        '&:hover': {
                          color: theme.cursor,
                        },
                      },
                    }}
                  />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {commandInput && (
                      <IconButton
                        size="small"
                        onClick={handleClearInput}
                        sx={{
                          color: 'rgba(255,255,255,0.4)',
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            color: theme.error,
                          },
                        }}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={handleSendCommand}
                      disabled={!commandInput.trim()}
                      sx={{
                        color: commandInput.trim() ? theme.success : 'rgba(255,255,255,0.3)',
                        '&:hover': {
                          backgroundColor: commandInput.trim() ? `${theme.success}20` : 'rgba(255,255,255,0.05)',
                        },
                        '&:disabled': {
                          color: 'rgba(255,255,255,0.2)',
                        },
                      }}
                    >
                      <SendIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </InputAdornment>
              ),
            }}
          />
        </InputBar>
        )}
        
        {/* History Menu */}
        <Menu
          anchorEl={historyMenuAnchor}
          open={Boolean(historyMenuAnchor)}
          onClose={handleCloseHistoryMenu}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          slotProps={{
            paper: {
              sx: {
                marginBottom: '8px', // Gap between menu and anchor
              },
            },
          }}
          PaperProps={{
            sx: {
              backgroundColor: theme.background,
              border: `1px solid ${theme.cursor}40`,
              maxHeight: '400px',
              minWidth: '300px',
              '& .MuiMenuItem-root': {
                fontFamily: 'monospace',
                fontSize: '12px',
                color: theme.foreground,
                '&:hover': {
                  backgroundColor: `${theme.cursor}20`,
                },
              },
            },
          }}
        >
          <Box sx={{ px: 2, py: 1, borderBottom: `1px solid ${theme.cursor}20` }}>
            <Typography variant="caption" sx={{ color: theme.info, fontWeight: 600, textTransform: 'uppercase', fontSize: '10px' }}>
              История команд ({commandHistory.length})
            </Typography>
          </Box>
          {commandHistory.length === 0 ? (
            <MenuItem disabled>
              <ListItemText primary="История пуста" />
            </MenuItem>
          ) : (
            <>
              {[...commandHistory].reverse().map((cmd, index) => (
                <MenuItem
                  key={index}
                  onClick={() => handleSelectHistoryCommand(cmd)}
                  sx={{
                    display: 'flex',
                    gap: 1,
                    alignItems: 'center',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.number,
                      minWidth: '24px',
                      textAlign: 'right',
                      fontSize: '10px',
                    }}
                  >
                    {commandHistory.length - index}
                  </Typography>
                  <ListItemText
                    primary={cmd}
                    primaryTypographyProps={{
                      sx: {
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        color: theme.foreground,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      },
                    }}
                  />
                </MenuItem>
              ))}
              <Divider sx={{ borderColor: `${theme.cursor}20` }} />
              <MenuItem
                onClick={handleClearHistory}
                sx={{
                  color: theme.error,
                  justifyContent: 'center',
                  '&:hover': {
                    backgroundColor: `${theme.error}20`,
                  },
                }}
              >
                <ClearIcon sx={{ fontSize: 14, mr: 0.5 }} />
                Очистить историю
              </MenuItem>
            </>
          )}
        </Menu>
        
        <StatusBar sx={{ color: theme.info }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <span style={{ color: theme.prompt, fontWeight: 600 }}>
              {connection.username}@{connection.host}:{connection.port}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>PTY · xterm-256color</span>
            
            {/* Toggle button for interactive mode */}
            <IconButton
              size="small"
              onClick={toggleInteractiveMode}
              sx={{
                backgroundColor: isInteractiveMode ? `${theme.error}30` : `${theme.cursor}20`,
                color: isInteractiveMode ? theme.error : theme.cursor,
                fontSize: '10px',
                padding: '2px 8px',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: isInteractiveMode ? `${theme.error}40` : `${theme.cursor}30`,
                },
              }}
            >
              {isInteractiveMode 
                ? `🔴 ${interactiveProgram.toUpperCase() || 'DIRECT INPUT'}` 
                : '⚪ Command Mode'}
            </IconButton>
            
            {isTyping && !isInteractiveMode && (
              <Chip
                label="печатает..."
                size="small"
                sx={{
                  height: '16px',
                  fontSize: '9px',
                  backgroundColor: `${theme.cursor}20`,
                  color: theme.cursor,
                  animation: 'pulse 1.5s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                  },
                }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 2, color: 'rgba(255,255,255,0.4)' }}>
            <span>Ln {cursorPos.row}, Col {cursorPos.col}</span>
            <span>{displayScrollPercent}%</span>
            <span>{minimapData.totalLines} lines</span>
          </Box>
        </StatusBar>
    </TerminalWrapper>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const SSHTerminal: React.FC<SSHTerminalProps> = ({
  connections,
  selectedConnectionId,
  onCloseSession,
  onSelectSession,
  theme,
  fontFamily = '"Courier New", Courier, monospace',
  showMinimap = true,
}) => {
  const activeTheme = theme || getTheme('termius-dark');

  if (connections.length === 0) {
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: activeTheme.background }}>
        <Typography sx={{ fontFamily: fontFamily, color: activeTheme.foreground, opacity: 0.3 }}>
          Нет активных сеансов
        </Typography>
      </Box>
    );
  }

  const activeId = selectedConnectionId || connections[0].id;

  return (
    <Box sx={{ height: '100%' }}>
      {connections.map(conn => (
        <SSHTerminalInstance
          key={conn.id}
          connectionId={conn.id}
          connection={conn}
          theme={activeTheme}
          fontFamily={fontFamily}
          visible={conn.id === activeId}
          showMinimap={showMinimap}
        />
      ))}
    </Box>
  );
};

export default SSHTerminal;
