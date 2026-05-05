import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import './styles/global.css';

// Create root element
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

// Create React root
const root = ReactDOM.createRoot(rootElement);

// Render application
root.render(
  <React.StrictMode>
    <HashRouter>
      <LanguageProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </LanguageProvider>
    </HashRouter>
  </React.StrictMode>
);

// Handle errors
window.addEventListener('error', (event) => {
  console.error('Application error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});