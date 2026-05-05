import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createTheme, Theme } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

// OLED Black Theme Colors
const OLED_THEME = {
  // True black background
  background: {
    default: '#000000',
    paper: '#0a0a0a',
  },
  // High contrast text colors
  text: {
    primary: '#ffffff',
    secondary: '#cccccc',
    disabled: '#666666',
  },
  // Accent colors
  primary: {
    main: '#00ffff', // Cyan
    light: '#33ffff',
    dark: '#00cccc',
    contrastText: '#000000',
  },
  secondary: {
    main: '#ff00ff', // Magenta
    light: '#ff33ff',
    dark: '#cc00cc',
    contrastText: '#000000',
  },
  // Status colors
  success: {
    main: '#00ff00',
    contrastText: '#000000',
  },
  warning: {
    main: '#ffff00',
    contrastText: '#000000',
  },
  error: {
    main: '#ff0000',
    contrastText: '#000000',
  },
  info: {
    main: '#00aaff',
    contrastText: '#000000',
  },
  // Divider
  divider: 'rgba(255, 255, 255, 0.12)',
  // Action colors
  action: {
    active: '#ffffff',
    hover: 'rgba(255, 255, 255, 0.08)',
    selected: 'rgba(255, 255, 255, 0.16)',
    disabled: 'rgba(255, 255, 255, 0.3)',
    disabledBackground: 'rgba(255, 255, 255, 0.12)',
  },
};

// Create OLED theme
export const createOLEDTheme = (mode: PaletteMode = 'dark'): Theme => {
  return createTheme({
    palette: {
      mode,
      ...OLED_THEME,
    },
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: {
        fontSize: '2.5rem',
        fontWeight: 600,
        letterSpacing: '-0.5px',
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
        letterSpacing: '-0.25px',
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 600,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 600,
      },
      body1: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
      },
      body2: {
        fontSize: '0.75rem',
        lineHeight: 1.43,
      },
      button: {
        textTransform: 'none',
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 8,
    },
    spacing: 8,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarColor: '#333333 #000000',
            '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
              backgroundColor: '#000000',
              width: '8px',
              height: '8px',
            },
            '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
              borderRadius: '4px',
              backgroundColor: '#333333',
              minHeight: '24px',
            },
            '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus': {
              backgroundColor: '#444444',
            },
            '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active': {
              backgroundColor: '#444444',
            },
            '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
              backgroundColor: '#444444',
            },
            '&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner': {
              backgroundColor: '#000000',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '8px',
            padding: '8px 16px',
            fontWeight: 500,
            '&:hover': {
              boxShadow: '0 0 12px rgba(0, 255, 255, 0.3)',
            },
          },
          containedPrimary: {
            backgroundColor: OLED_THEME.primary.main,
            color: OLED_THEME.primary.contrastText,
            '&:hover': {
              backgroundColor: OLED_THEME.primary.dark,
            },
          },
          containedSecondary: {
            backgroundColor: OLED_THEME.secondary.main,
            color: OLED_THEME.secondary.contrastText,
            '&:hover': {
              backgroundColor: OLED_THEME.secondary.dark,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: OLED_THEME.background.paper,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: OLED_THEME.background.paper,
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
            },
            '&.Mui-focused': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              boxShadow: `0 0 0 2px ${OLED_THEME.primary.main}`,
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          },
          head: {
            fontWeight: 600,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          },
        },
      },
    },
  });
};

// Theme context type
interface ThemeContextType {
  theme: Theme;
  mode: PaletteMode;
  toggleMode: () => void;
  updateTheme: (updates: Partial<Theme>) => void;
}

// Create context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider props
interface ThemeProviderProps {
  children: ReactNode;
}

// Theme provider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<PaletteMode>('dark');
  const [theme, setTheme] = useState<Theme>(createOLEDTheme(mode));

  // Toggle between light/dark mode (though OLED theme is primarily dark)
  const toggleMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // Update theme with customizations
  const updateTheme = (updates: Partial<Theme>) => {
    setTheme((prevTheme) => ({
      ...prevTheme,
      ...updates,
    }));
  };

  // Update theme when mode changes
  useEffect(() => {
    setTheme(createOLEDTheme(mode));
    
    // Update Electron window theme
    if (window.electronAPI) {
      window.electronAPI.updateTheme({
        backgroundColor: OLED_THEME.background.default,
        mode,
      });
    }
  }, [mode]);

  // Initialize theme on mount
  useEffect(() => {
    // Apply theme to document
    document.documentElement.style.backgroundColor = OLED_THEME.background.default;
    document.documentElement.style.color = OLED_THEME.text.primary;
    
    // Set meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', OLED_THEME.background.default);
    }
  }, []);

  const contextValue: ThemeContextType = {
    theme,
    mode,
    toggleMode,
    updateTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;