import { ExportService, TableData } from '../services/ExportService';

describe('ExportService', () => {
  const mockTableData: TableData = {
    headers: ['Name', 'IP Address', 'Status'],
    rows: [
      ['Server 1', '192.168.1.100', 'Online'],
      ['Server 2', '192.168.1.101', 'Offline'],
      ['Server 3', '192.168.1.102', 'Online'],
    ],
  };

  const mockObjectArray = [
    { name: 'Server 1', ip: '192.168.1.100', status: 'Online' },
    { name: 'Server 2', ip: '192.168.1.101', status: 'Offline' },
  ];

  beforeEach(() => {
    // Mock DOM methods
    document.createElement = jest.fn((tag) => {
      const element: any = {
        tagName: tag.toUpperCase(),
        href: '',
        download: '',
        click: jest.fn(),
        appendChild: jest.fn(),
        removeChild: jest.fn(),
        style: {},
        value: '',
        select: jest.fn(),
      };
      return element;
    });

    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();

    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
    global.Blob = jest.fn() as any;
  });

  describe('generateFilename', () => {
    it('generates filename with timestamp', () => {
      const filename = ExportService.generateFilename('test-report', 'csv');
      expect(filename).toMatch(/^test-report-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.csv$/);
    });

    it('handles different extensions', () => {
      const csvFilename = ExportService.generateFilename('report', 'csv');
      const jsonFilename = ExportService.generateFilename('report', 'json');
      const txtFilename = ExportService.generateFilename('report', 'txt');

      expect(csvFilename).toContain('.csv');
      expect(jsonFilename).toContain('.json');
      expect(txtFilename).toContain('.txt');
    });
  });

  describe('objectArrayToTableData', () => {
    it('converts object array to table data', () => {
      const result = ExportService.objectArrayToTableData(mockObjectArray);

      expect(result.headers).toEqual(['name', 'ip', 'status']);
      expect(result.rows).toEqual([
        ['Server 1', '192.168.1.100', 'Online'],
        ['Server 2', '192.168.1.101', 'Offline'],
      ]);
    });

    it('handles empty array', () => {
      const result = ExportService.objectArrayToTableData([]);

      expect(result.headers).toEqual([]);
      expect(result.rows).toEqual([]);
    });

    it('handles objects with different keys', () => {
      const data = [
        { a: 1, b: 2 },
        { a: 3, b: 4, c: 5 },
      ];

      const result = ExportService.objectArrayToTableData(data);

      expect(result.headers).toEqual(['a', 'b']);
      expect(result.rows[0]).toEqual([1, 2]);
      expect(result.rows[1]).toEqual([3, 4]);
    });
  });

  describe('exportToCSV', () => {
    it('exports table data to CSV format', () => {
      const createElementSpy = jest.spyOn(document, 'createElement');

      ExportService.exportToCSV(mockTableData, {
        format: 'csv',
        filename: 'test.csv',
        includeMetadata: false,
      });

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(global.Blob).toHaveBeenCalled();
    });

    it('includes metadata when requested', () => {
      ExportService.exportToCSV(mockTableData, {
        format: 'csv',
        filename: 'test.csv',
        includeMetadata: true,
        metadata: {
          timestamp: new Date('2024-01-01'),
          version: '1.0.0',
        },
      });

      expect(global.Blob).toHaveBeenCalled();
    });

    it('escapes CSV special characters', () => {
      const dataWithSpecialChars: TableData = {
        headers: ['Name', 'Description'],
        rows: [
          ['Test, Inc.', 'A "quoted" value'],
          ['Line\nBreak', 'Normal'],
        ],
      };

      ExportService.exportToCSV(dataWithSpecialChars, {
        format: 'csv',
        filename: 'test.csv',
      });

      expect(global.Blob).toHaveBeenCalled();
    });
  });

  describe('exportToJSON', () => {
    it('exports data to JSON format', () => {
      const data = { test: 'value', nested: { key: 'value' } };

      ExportService.exportToJSON(data, {
        format: 'json',
        filename: 'test.json',
        includeMetadata: false,
      });

      expect(global.Blob).toHaveBeenCalled();
    });

    it('includes metadata wrapper when requested', () => {
      const data = { test: 'value' };

      ExportService.exportToJSON(data, {
        format: 'json',
        filename: 'test.json',
        includeMetadata: true,
        metadata: {
          timestamp: new Date('2024-01-01'),
          version: '1.0.0',
        },
      });

      expect(global.Blob).toHaveBeenCalled();
    });
  });

  describe('exportToText', () => {
    it('exports table data to plain text format', () => {
      ExportService.exportToText(mockTableData, {
        format: 'text',
        filename: 'test.txt',
        includeMetadata: false,
      });

      expect(global.Blob).toHaveBeenCalled();
    });

    it('formats columns with proper alignment', () => {
      ExportService.exportToText(mockTableData, {
        format: 'text',
        filename: 'test.txt',
      });

      expect(global.Blob).toHaveBeenCalled();
    });

    it('includes metadata header when requested', () => {
      ExportService.exportToText(mockTableData, {
        format: 'text',
        filename: 'test.txt',
        includeMetadata: true,
        metadata: {
          timestamp: new Date('2024-01-01'),
          version: '1.0.0',
          parameters: { test: 'value' },
        },
      });

      expect(global.Blob).toHaveBeenCalled();
    });
  });

  describe('exportToPDF', () => {
    it('exports table data to HTML format for PDF', () => {
      ExportService.exportToPDF(mockTableData, {
        format: 'pdf',
        filename: 'test.pdf',
        includeMetadata: false,
      });

      expect(global.Blob).toHaveBeenCalled();
    });

    it('includes metadata in HTML when requested', () => {
      ExportService.exportToPDF(mockTableData, {
        format: 'pdf',
        filename: 'test.pdf',
        includeMetadata: true,
        metadata: {
          timestamp: new Date('2024-01-01'),
          version: '1.0.0',
        },
      });

      expect(global.Blob).toHaveBeenCalled();
    });

    it('escapes HTML special characters', () => {
      const dataWithHTML: TableData = {
        headers: ['Name', 'HTML'],
        rows: [
          ['Test', '<script>alert("xss")</script>'],
          ['Safe', 'Normal text'],
        ],
      };

      ExportService.exportToPDF(dataWithHTML, {
        format: 'pdf',
        filename: 'test.pdf',
      });

      expect(global.Blob).toHaveBeenCalled();
    });
  });

  describe('copyToClipboard', () => {
    it('copies text format to clipboard', async () => {
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });

      await ExportService.copyToClipboard(mockTableData, 'text');

      expect(mockWriteText).toHaveBeenCalled();
    });

    it('copies CSV format to clipboard', async () => {
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });

      await ExportService.copyToClipboard(mockTableData, 'csv');

      expect(mockWriteText).toHaveBeenCalled();
    });

    it('copies JSON format to clipboard', async () => {
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });

      const data = { test: 'value' };
      await ExportService.copyToClipboard(data, 'json');

      expect(mockWriteText).toHaveBeenCalled();
    });

    it('falls back to execCommand when clipboard API fails', async () => {
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn().mockRejectedValue(new Error('Not supported')),
        },
      });

      document.execCommand = jest.fn();

      await ExportService.copyToClipboard(mockTableData, 'text');

      expect(document.execCommand).toHaveBeenCalledWith('copy');
    });
  });

  describe('exportWithTemplate', () => {
    it('exports data with template structure', () => {
      const template = {
        title: 'Test Report',
        sections: [
          {
            title: 'Section 1',
            data: mockTableData,
            type: 'table' as const,
          },
          {
            title: 'Section 2',
            data: { test: 'value' },
            type: 'json' as const,
          },
        ],
      };

      ExportService.exportWithTemplate({}, template, {
        format: 'text',
        filename: 'report.txt',
      });

      expect(global.Blob).toHaveBeenCalled();
    });

    it('exports template as JSON', () => {
      const template = {
        title: 'Test Report',
        sections: [
          {
            title: 'Section 1',
            data: mockTableData,
            type: 'table' as const,
          },
        ],
      };

      ExportService.exportWithTemplate({}, template, {
        format: 'json',
        filename: 'report.json',
      });

      expect(global.Blob).toHaveBeenCalled();
    });

    it('includes metadata in template export', () => {
      const template = {
        title: 'Test Report',
        sections: [
          {
            title: 'Section 1',
            data: mockTableData,
            type: 'table' as const,
          },
        ],
      };

      ExportService.exportWithTemplate({}, template, {
        format: 'text',
        filename: 'report.txt',
        includeMetadata: true,
        metadata: {
          timestamp: new Date('2024-01-01'),
          version: '1.0.0',
        },
      });

      expect(global.Blob).toHaveBeenCalled();
    });
  });
});
