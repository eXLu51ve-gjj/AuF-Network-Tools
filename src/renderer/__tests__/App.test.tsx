import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';
import { ThemeProvider } from '../contexts/ThemeContext';

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

describe('App Component', () => {
  test('renders without crashing', () => {
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>
    );
    
    // Check for loading spinner initially
    expect(screen.getByRole('presentation')).toBeInTheDocument();
  });

  test('has OLED black theme background', () => {
    const { container } = render(
      <ThemeProvider>
        <App />
      </ThemeProvider>
    );
    
    // Check if the app container has black background
    const appContainer = container.firstChild;
    expect(appContainer).toHaveStyle('background-color: #000000');
  });
});

describe('Theme Context', () => {
  test('provides theme context', () => {
    const TestComponent = () => {
      const { theme } = React.useContext(ThemeContext);
      return <div data-testid="theme-test">{theme.palette.mode}</div>;
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('theme-test')).toHaveTextContent('dark');
  });
});