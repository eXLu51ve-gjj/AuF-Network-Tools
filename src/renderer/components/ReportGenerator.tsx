import React, { useState } from 'react';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  Select,
  MenuItem,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  styled,
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Settings as SettingsIcon,
  Preview as PreviewIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import { Grid, Section } from './Layout';
import { Button } from './Button';
import { ExportService, TableData } from '../services/ExportService';

const StepperSection = styled(Section)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const ContentSection = styled(Box)(({ theme }) => ({
  minHeight: '400px',
  padding: theme.spacing(3),
}));

const PreviewBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  maxHeight: '400px',
  overflow: 'auto',
  fontFamily: 'monospace',
  fontSize: '0.75rem',
  whiteSpace: 'pre-wrap',
}));

interface ReportSection {
  id: string;
  title: string;
  description: string;
  data: TableData | any;
  type: 'table' | 'text' | 'json';
  enabled: boolean;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: string[]; // section IDs
}

interface ReportGeneratorProps {
  availableSections: ReportSection[];
  onGenerate?: (report: any) => void;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  availableSections,
  onGenerate,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [reportTitle, setReportTitle] = useState('Network Diagnostics Report');
  const [reportDescription, setReportDescription] = useState('');
  const [selectedSections, setSelectedSections] = useState<string[]>(
    availableSections.map((s) => s.id)
  );
  const [selectedTemplate, setSelectedTemplate] = useState<string>('custom');
  const [exportFormat, setExportFormat] = useState<'text' | 'json' | 'pdf'>('text');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [includeParameters, setIncludeParameters] = useState(true);

  const templates: ReportTemplate[] = [
    {
      id: 'full',
      name: 'Full Report',
      description: 'Include all available sections',
      sections: availableSections.map((s) => s.id),
    },
    {
      id: 'summary',
      name: 'Summary Report',
      description: 'Include only key metrics and summaries',
      sections: availableSections.filter((s) => s.type !== 'json').map((s) => s.id),
    },
    {
      id: 'technical',
      name: 'Technical Report',
      description: 'Include detailed technical data',
      sections: availableSections.map((s) => s.id),
    },
    {
      id: 'custom',
      name: 'Custom Report',
      description: 'Select specific sections to include',
      sections: [],
    },
  ];

  const steps = ['Select Template', 'Configure Report', 'Preview & Export'];

  const handleNext = () => {
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template && templateId !== 'custom') {
      setSelectedSections(template.sections);
    }
  };

  const handleSectionToggle = (sectionId: string) => {
    setSelectedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const generateReport = () => {
    const sections = availableSections
      .filter((s) => selectedSections.includes(s.id))
      .map((s) => ({
        title: s.title,
        data: s.data,
        type: s.type,
      }));

    const metadata = {
      timestamp: includeTimestamp ? new Date() : undefined,
      parameters: includeParameters
        ? {
            reportTitle,
            reportDescription,
            sectionsIncluded: selectedSections.length,
            template: selectedTemplate,
          }
        : undefined,
      version: '1.0.0',
    };

    ExportService.exportWithTemplate(
      { sections },
      {
        title: reportTitle,
        sections,
      },
      {
        format: exportFormat,
        filename: ExportService.generateFilename(
          reportTitle.toLowerCase().replace(/\s+/g, '-'),
          exportFormat
        ),
        includeMetadata,
        metadata,
      }
    );

    if (onGenerate) {
      onGenerate({ title: reportTitle, sections, metadata });
    }
  };

  const getPreviewContent = (): string => {
    const sections = availableSections.filter((s) => selectedSections.includes(s.id));

    let preview = '';
    preview += '='.repeat(80) + '\n';
    preview += reportTitle.toUpperCase() + '\n';
    preview += '='.repeat(80) + '\n\n';

    if (reportDescription) {
      preview += reportDescription + '\n\n';
    }

    if (includeMetadata) {
      preview += `Export Date: ${new Date().toLocaleString()}\n`;
      preview += `Sections: ${sections.length}\n`;
      preview += `Format: ${exportFormat.toUpperCase()}\n\n`;
    }

    sections.forEach((section, index) => {
      preview += '\n' + '-'.repeat(80) + '\n';
      preview += `${index + 1}. ${section.title}\n`;
      preview += '-'.repeat(80) + '\n';
      preview += section.description + '\n';
      preview += `Type: ${section.type}\n`;
    });

    return preview;
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <ContentSection>
            <Typography variant="h6" gutterBottom>
              Select Report Template
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Choose a predefined template or create a custom report
            </Typography>

            <FormControl component="fieldset" fullWidth>
              <Grid gap={2} direction="column">
                {templates.map((template) => (
                  <Paper
                    key={template.id}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor:
                        selectedTemplate === template.id
                          ? '#00FFFF'
                          : 'rgba(255, 255, 255, 0.1)',
                      backgroundColor:
                        selectedTemplate === template.id
                          ? 'rgba(0, 255, 255, 0.1)'
                          : 'rgba(0, 0, 0, 0.3)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 255, 255, 0.05)',
                        borderColor: 'rgba(0, 255, 255, 0.3)',
                      },
                    }}
                    onClick={() => handleTemplateChange(template.id)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {template.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {template.description}
                        </Typography>
                        <Chip
                          label={`${template.sections.length || availableSections.length} sections`}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </Box>
                      {selectedTemplate === template.id && (
                        <CheckCircleIcon sx={{ color: '#00FFFF' }} />
                      )}
                    </Box>
                  </Paper>
                ))}
              </Grid>
            </FormControl>
          </ContentSection>
        );

      case 1:
        return (
          <ContentSection>
            <Typography variant="h6" gutterBottom>
              Configure Report
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Customize report details and select sections to include
            </Typography>

            <Grid gap={3} direction="column">
              <TextField
                label="Report Title"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                fullWidth
                required
              />

              <TextField
                label="Report Description"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                fullWidth
                multiline
                rows={3}
              />

              <FormControl fullWidth>
                <FormLabel>Export Format</FormLabel>
                <Select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                  size="small"
                >
                  <MenuItem value="text">Plain Text (.txt)</MenuItem>
                  <MenuItem value="json">JSON (.json)</MenuItem>
                  <MenuItem value="pdf">PDF (HTML)</MenuItem>
                </Select>
              </FormControl>

              <FormControl component="fieldset">
                <FormLabel>Metadata Options</FormLabel>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={includeMetadata}
                        onChange={(e) => setIncludeMetadata(e.target.checked)}
                      />
                    }
                    label="Include metadata"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={includeTimestamp}
                        onChange={(e) => setIncludeTimestamp(e.target.checked)}
                        disabled={!includeMetadata}
                      />
                    }
                    label="Include timestamp"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={includeParameters}
                        onChange={(e) => setIncludeParameters(e.target.checked)}
                        disabled={!includeMetadata}
                      />
                    }
                    label="Include parameters"
                  />
                </FormGroup>
              </FormControl>

              <FormControl component="fieldset">
                <FormLabel>Report Sections</FormLabel>
                <List dense>
                  {availableSections.map((section) => (
                    <ListItem key={section.id} disablePadding>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedSections.includes(section.id)}
                            onChange={() => handleSectionToggle(section.id)}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2">{section.title}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {section.description}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </FormControl>
            </Grid>
          </ContentSection>
        );

      case 2:
        return (
          <ContentSection>
            <Typography variant="h6" gutterBottom>
              Preview & Export
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Review your report configuration before exporting
            </Typography>

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Report Summary:</strong>
              </Typography>
              <Typography variant="caption" component="div">
                • Title: {reportTitle}
              </Typography>
              <Typography variant="caption" component="div">
                • Sections: {selectedSections.length}
              </Typography>
              <Typography variant="caption" component="div">
                • Format: {exportFormat.toUpperCase()}
              </Typography>
              <Typography variant="caption" component="div">
                • Metadata: {includeMetadata ? 'Included' : 'Not included'}
              </Typography>
            </Alert>

            <Typography variant="subtitle2" gutterBottom>
              Report Preview:
            </Typography>
            <PreviewBox elevation={0}>
              {getPreviewContent()}
            </PreviewBox>
          </ContentSection>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <StepperSection background="paper" bordered>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </StepperSection>

      <Section background="paper" bordered>
        {renderStepContent()}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, pt: 3, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
          >
            Back
          </Button>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={generateReport}
                startIcon={<FileDownloadIcon />}
                disabled={selectedSections.length === 0 || !reportTitle.trim()}
              >
                Generate Report
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForwardIcon />}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Section>
    </Box>
  );
};

export default ReportGenerator;
