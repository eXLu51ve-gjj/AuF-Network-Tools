import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Checkbox,
  Box,
  Typography,
  Alert,
  Chip,
  styled,
} from '@mui/material';
import {
  FileDownload as FileDownloadIcon,
  ContentCopy as ContentCopyIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { Button } from './Button';
import { ExportService, ExportOptions, TableData } from '../services/ExportService';

const ExportSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const FormatOption = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: theme.spacing(1),
  marginBottom: theme.spacing(1),
  cursor: 'pointer',
  transition: 'all 0.2s',
  '&:hover': {
    backgroundColor: 'rgba(0, 255, 255, 0.05)',
    borderColor: 'rgba(0, 255, 255, 0.3)',
  },
  '&.selected': {
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    borderColor: '#00FFFF',
  },
}));

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  data: TableData | any;
  title?: string;
  defaultFilename?: string;
  metadata?: {
    timestamp?: Date;
    parameters?: Record<string, any>;
    version?: string;
    [key: string]: any;
  };
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onClose,
  data,
  title = 'Export Data',
  defaultFilename = 'export',
  metadata,
}) => {
  const [format, setFormat] = useState<'csv' | 'json' | 'text' | 'pdf'>('csv');
  const [filename, setFilename] = useState(defaultFilename);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [copied, setCopied] = useState(false);

  const formatDescriptions = {
    csv: 'Comma-separated values, compatible with Excel and spreadsheet applications',
    json: 'JavaScript Object Notation, ideal for programmatic processing',
    text: 'Plain text with formatted tables, human-readable',
    pdf: 'Portable Document Format (exported as HTML for printing)',
  };

  const handleExport = () => {
    const options: ExportOptions = {
      format,
      filename: `${filename}.${format === 'pdf' ? 'html' : format}`,
      includeMetadata,
      metadata: {
        ...metadata,
        timestamp: metadata?.timestamp || new Date(),
        version: metadata?.version || '1.0.0',
      },
    };

    switch (format) {
      case 'csv':
        ExportService.exportToCSV(data as TableData, options);
        break;
      case 'json':
        ExportService.exportToJSON(data, options);
        break;
      case 'text':
        ExportService.exportToText(data as TableData, options);
        break;
      case 'pdf':
        ExportService.exportToPDF(data as TableData, options);
        break;
    }

    onClose();
  };

  const handleCopyToClipboard = async () => {
    try {
      await ExportService.copyToClipboard(
        data,
        format === 'json' ? 'json' : format === 'csv' ? 'csv' : 'text'
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const getFileExtension = () => {
    return format === 'pdf' ? 'html' : format;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <ExportSection>
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend" sx={{ mb: 2 }}>
              Export Format
            </FormLabel>
            <RadioGroup value={format} onChange={(e) => setFormat(e.target.value as any)}>
              {(['csv', 'json', 'text', 'pdf'] as const).map((fmt) => (
                <FormatOption
                  key={fmt}
                  className={format === fmt ? 'selected' : ''}
                  onClick={() => setFormat(fmt)}
                >
                  <FormControlLabel
                    value={fmt}
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {fmt.toUpperCase()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDescriptions[fmt]}
                        </Typography>
                      </Box>
                    }
                  />
                </FormatOption>
              ))}
            </RadioGroup>
          </FormControl>
        </ExportSection>

        <ExportSection>
          <TextField
            label="Filename"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            fullWidth
            helperText={`File will be saved as: ${filename}.${getFileExtension()}`}
            InputProps={{
              endAdornment: (
                <Chip label={`.${getFileExtension()}`} size="small" variant="outlined" />
              ),
            }}
          />
        </ExportSection>

        <ExportSection>
          <FormControlLabel
            control={
              <Checkbox
                checked={includeMetadata}
                onChange={(e) => setIncludeMetadata(e.target.checked)}
              />
            }
            label={
              <Box>
                <Typography variant="body2">Include Metadata</Typography>
                <Typography variant="caption" color="text.secondary">
                  Add export date, parameters, and version information
                </Typography>
              </Box>
            }
          />
        </ExportSection>

        {includeMetadata && metadata && (
          <ExportSection>
            <Alert severity="info" icon={<CheckCircleIcon />}>
              <Typography variant="caption" component="div">
                <strong>Metadata to include:</strong>
              </Typography>
              <Typography variant="caption" component="div">
                • Export Date: {metadata.timestamp?.toLocaleString() || new Date().toLocaleString()}
              </Typography>
              {metadata.version && (
                <Typography variant="caption" component="div">
                  • Version: {metadata.version}
                </Typography>
              )}
              {metadata.parameters && (
                <Typography variant="caption" component="div">
                  • Parameters: {Object.keys(metadata.parameters).length} items
                </Typography>
              )}
            </Alert>
          </ExportSection>
        )}

        {copied && (
          <Alert severity="success" icon={<CheckCircleIcon />}>
            Copied to clipboard!
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="outlined"
          startIcon={<ContentCopyIcon />}
          onClick={handleCopyToClipboard}
        >
          Copy to Clipboard
        </Button>
        <Button
          variant="contained"
          startIcon={<FileDownloadIcon />}
          onClick={handleExport}
          disabled={!filename.trim()}
        >
          Export
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportDialog;
