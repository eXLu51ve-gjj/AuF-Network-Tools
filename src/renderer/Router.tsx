import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import DashboardPage from './pages/DashboardPage';
import NetworkDiagnosticsPage from './pages/NetworkDiagnosticsPage';
import WiFiScannerPage from './pages/WiFiScannerPage';
import SSHTerminalPage from './pages/SSHTerminalPage';
import PortScannerPage from './pages/PortScannerPage';
import UtilitiesPage from './pages/UtilitiesPage';
import ConfigurationPage from './pages/ConfigurationPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

const Router: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/diagnostics" element={<NetworkDiagnosticsPage />} />
        <Route path="/wifi-scanner" element={<WiFiScannerPage />} />
        <Route path="/ssh-terminal" element={<SSHTerminalPage />} />
        <Route path="/port-scanner" element={<PortScannerPage />} />
        <Route path="/utilities" element={<UtilitiesPage />} />
        <Route path="/configuration" element={<ConfigurationPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
  );
};

export default Router;