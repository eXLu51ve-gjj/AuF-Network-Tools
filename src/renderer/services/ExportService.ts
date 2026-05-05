/**
 * Export Service
 * Handles exporting data in various formats (CSV, PDF, JSON, plain text)
 */

export interface ExportOptions {
  format: 'csv' | 'pdf' | 'json' | 'text';
  filename?: string;
  includeMetadata?: boolean;
  metadata?: {
    timestamp?: Date;
    parameters?: Record<string, any>;
    version?: string;
    [key: string]: any;
  };
}

export interface TableData {
  headers: string[];
  rows: (string | number)[][];
}

export class ExportService {
  /**
   * Export data to CSV format
   */
  static exportToCSV(data: TableData, options: ExportOptions = { format: 'csv' }): void {
    const { filename = 'export.csv', includeMetadata = true, metadata } = options;

    let csvContent = '';

    // Add metadata as comments
    if (includeMetadata && metadata) {
      csvContent += `# Export Date: ${metadata.timestamp?.toISOString() || new Date().toISOString()}\n`;
      if (metadata.version) {
        csvContent += `# Version: ${metadata.version}\n`;
      }
      if (metadata.parameters) {
        csvContent += `# Parameters: ${JSON.stringify(metadata.parameters)}\n`;
      }
      csvContent += '\n';
    }

    // Add headers
    csvContent += data.headers.map((h) => this.escapeCSV(h)).join(',') + '\n';

    // Add rows
    data.rows.forEach((row) => {
      csvContent += row.map((cell) => this.escapeCSV(String(cell))).join(',') + '\n';
    });

    this.downloadFile(csvContent, filename, 'text/csv');
  }

  /**
   * Export data to JSON format
   */
  static exportToJSON(data: any, options: ExportOptions = { format: 'json' }): void {
    const { filename = 'export.json', includeMetadata = true, metadata } = options;

    const exportData = includeMetadata
      ? {
          metadata: {
            exportDate: metadata?.timestamp?.toISOString() || new Date().toISOString(),
            version: metadata?.version || '1.0.0',
            parameters: metadata?.parameters || {},
            ...metadata,
          },
          data,
        }
      : data;

    const jsonContent = JSON.stringify(exportData, null, 2);
    this.downloadFile(jsonContent, filename, 'application/json');
  }

  /**
   * Export data to plain text format
   */
  static exportToText(data: TableData, options: ExportOptions = { format: 'text' }): void {
    const { filename = 'export.txt', includeMetadata = true, metadata } = options;

    let textContent = '';

    // Add metadata
    if (includeMetadata && metadata) {
      textContent += '='.repeat(80) + '\n';
      textContent += 'EXPORT REPORT\n';
      textContent += '='.repeat(80) + '\n\n';
      textContent += `Export Date: ${metadata.timestamp?.toISOString() || new Date().toISOString()}\n`;
      if (metadata.version) {
        textContent += `Version: ${metadata.version}\n`;
      }
      if (metadata.parameters) {
        textContent += `Parameters:\n`;
        Object.entries(metadata.parameters).forEach(([key, value]) => {
          textContent += `  ${key}: ${value}\n`;
        });
      }
      textContent += '\n' + '='.repeat(80) + '\n\n';
    }

    // Calculate column widths
    const columnWidths = data.headers.map((header, i) => {
      const maxDataWidth = Math.max(
        ...data.rows.map((row) => String(row[i] || '').length)
      );
      return Math.max(header.length, maxDataWidth);
    });

    // Add headers
    textContent += data.headers
      .map((header, i) => header.padEnd(columnWidths[i]))
      .join(' | ') + '\n';
    textContent += columnWidths.map((w) => '-'.repeat(w)).join('-+-') + '\n';

    // Add rows
    data.rows.forEach((row) => {
      textContent += row
        .map((cell, i) => String(cell || '').padEnd(columnWidths[i]))
        .join(' | ') + '\n';
    });

    this.downloadFile(textContent, filename, 'text/plain');
  }

  /**
   * Export data to PDF format (simplified HTML-based approach)
   */
  static exportToPDF(data: TableData, options: ExportOptions = { format: 'pdf' }): void {
    const { filename = 'export.pdf', includeMetadata = true, metadata } = options;

    // Create HTML content for PDF
    let htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${filename}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #000;
      background: #fff;
    }
    .header {
      border-bottom: 2px solid #000;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 24px;
    }
    .metadata {
      font-size: 12px;
      color: #666;
      margin-top: 10px;
    }
    .metadata-item {
      margin: 5px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th {
      background-color: #f0f0f0;
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
      font-weight: bold;
    }
    td {
      border: 1px solid #ddd;
      padding: 10px;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 10px;
      color: #999;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Export Report</h1>
`;

    if (includeMetadata && metadata) {
      htmlContent += `
    <div class="metadata">
      <div class="metadata-item"><strong>Export Date:</strong> ${metadata.timestamp?.toLocaleString() || new Date().toLocaleString()}</div>
`;
      if (metadata.version) {
        htmlContent += `      <div class="metadata-item"><strong>Version:</strong> ${metadata.version}</div>\n`;
      }
      if (metadata.parameters) {
        htmlContent += `      <div class="metadata-item"><strong>Parameters:</strong></div>\n`;
        Object.entries(metadata.parameters).forEach(([key, value]) => {
          htmlContent += `      <div class="metadata-item" style="margin-left: 20px;">${key}: ${value}</div>\n`;
        });
      }
      htmlContent += `    </div>\n`;
    }

    htmlContent += `
  </div>
  <table>
    <thead>
      <tr>
`;

    // Add headers
    data.headers.forEach((header) => {
      htmlContent += `        <th>${this.escapeHTML(header)}</th>\n`;
    });

    htmlContent += `
      </tr>
    </thead>
    <tbody>
`;

    // Add rows
    data.rows.forEach((row) => {
      htmlContent += `      <tr>\n`;
      row.forEach((cell) => {
        htmlContent += `        <td>${this.escapeHTML(String(cell || ''))}</td>\n`;
      });
      htmlContent += `      </tr>\n`;
    });

    htmlContent += `
    </tbody>
  </table>
  <div class="footer">
    Generated by WiFi Network Tools
  </div>
</body>
</html>
`;

    // For actual PDF generation, you would use a library like jsPDF or pdfmake
    // For now, we'll download as HTML which can be printed to PDF
    this.downloadFile(htmlContent, filename.replace('.pdf', '.html'), 'text/html');
  }

  /**
   * Copy data to clipboard
   */
  static async copyToClipboard(
    data: TableData | any,
    format: 'text' | 'csv' | 'json' = 'text'
  ): Promise<void> {
    let content = '';

    if (format === 'json') {
      content = JSON.stringify(data, null, 2);
    } else if (format === 'csv' && 'headers' in data) {
      content = data.headers.join(',') + '\n';
      content += data.rows.map((row: any[]) => row.join(',')).join('\n');
    } else if ('headers' in data) {
      // Plain text format
      const columnWidths = data.headers.map((header: string, i: number) => {
        const maxDataWidth = Math.max(
          ...data.rows.map((row: any[]) => String(row[i] || '').length)
        );
        return Math.max(header.length, maxDataWidth);
      });

      content = data.headers
        .map((header: string, i: number) => header.padEnd(columnWidths[i]))
        .join(' | ') + '\n';
      content += columnWidths.map((w: number) => '-'.repeat(w)).join('-+-') + '\n';
      content += data.rows
        .map((row: any[]) =>
          row.map((cell, i) => String(cell || '').padEnd(columnWidths[i])).join(' | ')
        )
        .join('\n');
    } else {
      content = JSON.stringify(data, null, 2);
    }

    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }

  /**
   * Download file
   */
  private static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Escape CSV special characters
   */
  private static escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Escape HTML special characters
   */
  private static escapeHTML(value: string): string {
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
  }

  /**
   * Generate filename with timestamp
   */
  static generateFilename(prefix: string, extension: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `${prefix}-${timestamp}.${extension}`;
  }

  /**
   * Convert object array to table data
   */
  static objectArrayToTableData(objects: Record<string, any>[]): TableData {
    if (objects.length === 0) {
      return { headers: [], rows: [] };
    }

    const headers = Object.keys(objects[0]);
    const rows = objects.map((obj) => headers.map((header) => obj[header]));

    return { headers, rows };
  }

  /**
   * Export with template
   */
  static exportWithTemplate(
    data: any,
    template: {
      title: string;
      sections: Array<{
        title: string;
        data: TableData | any;
        type: 'table' | 'text' | 'json';
      }>;
    },
    options: ExportOptions
  ): void {
    const { format, filename = 'report', includeMetadata = true, metadata } = options;

    if (format === 'json') {
      this.exportToJSON(
        {
          title: template.title,
          sections: template.sections,
        },
        { ...options, filename: filename.replace(/\.[^.]+$/, '.json') }
      );
    } else if (format === 'text') {
      let content = '';
      content += '='.repeat(80) + '\n';
      content += template.title.toUpperCase() + '\n';
      content += '='.repeat(80) + '\n\n';

      if (includeMetadata && metadata) {
        content += `Export Date: ${metadata.timestamp?.toISOString() || new Date().toISOString()}\n`;
        if (metadata.version) {
          content += `Version: ${metadata.version}\n`;
        }
        content += '\n';
      }

      template.sections.forEach((section) => {
        content += '\n' + '-'.repeat(80) + '\n';
        content += section.title + '\n';
        content += '-'.repeat(80) + '\n\n';

        if (section.type === 'table' && 'headers' in section.data) {
          const tableData = section.data as TableData;
          const columnWidths = tableData.headers.map((header, i) => {
            const maxDataWidth = Math.max(
              ...tableData.rows.map((row) => String(row[i] || '').length)
            );
            return Math.max(header.length, maxDataWidth);
          });

          content += tableData.headers
            .map((header, i) => header.padEnd(columnWidths[i]))
            .join(' | ') + '\n';
          content += columnWidths.map((w) => '-'.repeat(w)).join('-+-') + '\n';
          tableData.rows.forEach((row) => {
            content += row
              .map((cell, i) => String(cell || '').padEnd(columnWidths[i]))
              .join(' | ') + '\n';
          });
        } else if (section.type === 'json') {
          content += JSON.stringify(section.data, null, 2) + '\n';
        } else {
          content += String(section.data) + '\n';
        }
      });

      this.downloadFile(content, filename.replace(/\.[^.]+$/, '.txt'), 'text/plain');
    }
  }
}
