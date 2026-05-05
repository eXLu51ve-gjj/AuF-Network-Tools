import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Mock TextEncoder/TextDecoder for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
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

// Suppress console warnings during tests
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});