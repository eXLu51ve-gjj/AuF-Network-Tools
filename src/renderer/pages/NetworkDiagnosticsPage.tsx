import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab, styled } from '@mui/material';
import { Layout, Container, Section, Grid } from '../components/Layout';
import { Card, CardTitle, CardText } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import PingTool from '../components/tools/PingTool';
import TracerouteTool from '../components/tools/TracerouteTool';
import DNSResolverTool from '../components/tools/DNSResolverTool';
import { useLanguage } from '../contexts/LanguageContext';
import PageTransition from '../components/PageTransition';

// Styled components
const PageHeader = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));

const ToolSection = styled(Section)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const TabPanel = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3, 0),
}));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const CustomTabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <TabPanel
      role="tabpanel"
      hidden={value !== index}
      id={`tool-tabpanel-${index}`}
      aria-labelledby={`tool-tab-${index}`}
    >
      {value === index && children}
    </TabPanel>
  );
};

const NetworkDiagnosticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { t } = useLanguage();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const tabs = [
    { label: t('ping'), component: <PingTool /> },
    { label: t('traceroute'), component: <TracerouteTool /> },
    { label: t('dnsResolverTab'), component: <DNSResolverTool /> },
  ];

  return (
    <PageTransition>
      <Container maxWidth="xl">
      <PageHeader>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('networkDiagnosticsTitle')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('networkDiagnosticsSubtitle')}
        </Typography>
      </PageHeader>

      <ToolSection background="paper" bordered>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="network diagnostic tools"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              minHeight: '48px',
            },
          }}
        >
          {tabs.map((tab, index) => (
            <Tab 
              key={tab.label}
              label={tab.label}
              id={`tool-tab-${index}`}
              aria-controls={`tool-tabpanel-${index}`}
            />
          ))}
        </Tabs>

        {tabs.map((tab, index) => (
          <CustomTabPanel key={tab.label} value={activeTab} index={index}>
            {tab.component}
          </CustomTabPanel>
        ))}
      </ToolSection>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card title={t('quickTips')} compact>
            <CardText>
              {t('usePingTip')}
            </CardText>
            <CardText>
              {t('useTracerouteTip')}
            </CardText>
            <CardText>
              {t('useDNSResolverTip')}
            </CardText>
          </Card>
        </Grid>
      </Grid>
    </Container>
    </PageTransition>
  );
};

export default NetworkDiagnosticsPage;