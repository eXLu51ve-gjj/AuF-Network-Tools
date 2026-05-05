import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import { NetworkCheck as NetworkCheckIcon, Public as PublicIcon } from '@mui/icons-material';
import PortScannerTool from '../components/tools/PortScannerTool';
import ExternalPortScanner from '../components/tools/ExternalPortScanner';
import { useLanguage } from '../contexts/LanguageContext';
import PageTransition from '../components/PageTransition';

const PortScannerPage: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(0);

  return (
    <PageTransition>
      <Box sx={{ height: '100%', overflow: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          {t('portScanner')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Сканирование портов в локальной сети и проверка внешней доступности из интернета.
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab
            icon={<NetworkCheckIcon />}
            iconPosition="start"
            label="Локальный сканер"
          />
          <Tab
            icon={<PublicIcon />}
            iconPosition="start"
            label="Внешний сканер (из интернета)"
          />
        </Tabs>
      </Box>

      {activeTab === 0 && <PortScannerTool />}
      {activeTab === 1 && <ExternalPortScanner />}
    </Box>
    </PageTransition>
  );
};

export default PortScannerPage;
