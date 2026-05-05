import React from 'react';
import { Box, Typography } from '@mui/material';
import { Container, Section } from '../components/Layout';
import ConfigurationEditor from '../components/ConfigurationEditor';
import { ConfigurationSchema } from '../services/ConfigurationParser';
import PageTransition from '../components/PageTransition';

// Define application configuration schema
const appConfigSchema: ConfigurationSchema = {
  type: 'object',
  properties: {
    theme: {
      type: 'string',
      enum: ['oled-black', 'dark', 'light'],
      description: 'Application theme',
      required: true,
    },
    network: {
      type: 'object',
      properties: {
        timeout: {
          type: 'number',
          min: 1000,
          max: 30000,
          description: 'Network timeout in milliseconds',
          required: true,
        },
        retries: {
          type: 'number',
          min: 0,
          max: 10,
          description: 'Number of retries for failed requests',
          required: true,
        },
      },
      required: true,
    },
    tools: {
      type: 'object',
      properties: {
        ping: {
          type: 'object',
          properties: {
            count: {
              type: 'number',
              min: 1,
              max: 100,
              description: 'Number of ping requests',
            },
            timeout: {
              type: 'number',
              min: 100,
              max: 10000,
              description: 'Ping timeout in milliseconds',
            },
          },
        },
        traceroute: {
          type: 'object',
          properties: {
            maxHops: {
              type: 'number',
              min: 1,
              max: 64,
              description: 'Maximum number of hops',
            },
          },
        },
        portScanner: {
          type: 'object',
          properties: {
            timeout: {
              type: 'number',
              min: 100,
              max: 10000,
              description: 'Port scan timeout in milliseconds',
            },
          },
        },
      },
    },
  },
};

const ConfigurationPage: React.FC = () => {
  const handleSave = (profile: any) => {
    console.log('Configuration saved:', profile);
    // Here you would apply the configuration to the application
  };

  return (
    <PageTransition>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Configuration Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage application configuration profiles with validation and syntax highlighting.
          </Typography>
        </Box>

        <ConfigurationEditor schema={appConfigSchema} onSave={handleSave} />
      </Container>
    </PageTransition>
  );
};

export default ConfigurationPage;
