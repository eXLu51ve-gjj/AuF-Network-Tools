/**
 * Configuration Parser Service
 * Handles parsing, validation, and pretty-printing of configuration files
 */

export interface ValidationError {
  line: number;
  column: number;
  message: string;
  suggestion?: string;
}

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

export interface ConfigurationSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  required?: boolean;
  properties?: Record<string, ConfigurationSchema>;
  items?: ConfigurationSchema;
  enum?: any[];
  min?: number;
  max?: number;
  pattern?: RegExp;
  description?: string;
}

export class ConfigurationParser {
  /**
   * Parse JSON configuration with error handling
   */
  static parseJSON<T = any>(content: string): ParseResult<T> {
    try {
      const data = JSON.parse(content);
      return {
        success: true,
        data,
      };
    } catch (error) {
      if (error instanceof SyntaxError) {
        const match = error.message.match(/position (\d+)/);
        const position = match ? parseInt(match[1], 10) : 0;
        const { line, column } = this.getLineAndColumn(content, position);

        return {
          success: false,
          errors: [
            {
              line,
              column,
              message: error.message,
              suggestion: this.getSyntaxSuggestion(content, position),
            },
          ],
        };
      }

      return {
        success: false,
        errors: [
          {
            line: 0,
            column: 0,
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        ],
      };
    }
  }

  /**
   * Validate configuration against schema
   */
  static validate<T = any>(
    data: any,
    schema: ConfigurationSchema,
    path: string = 'root'
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Type validation
    const actualType = Array.isArray(data) ? 'array' : typeof data;
    if (actualType !== schema.type) {
      errors.push({
        line: 0,
        column: 0,
        message: `Expected type '${schema.type}' at '${path}', got '${actualType}'`,
        suggestion: `Change the value to a ${schema.type}`,
      });
      return errors;
    }

    // Object validation
    if (schema.type === 'object' && schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        const value = data[key];

        if (value === undefined) {
          if (propSchema.required) {
            errors.push({
              line: 0,
              column: 0,
              message: `Missing required property '${key}' at '${path}'`,
              suggestion: `Add "${key}": ${this.getDefaultValue(propSchema)}`,
            });
          }
        } else {
          errors.push(...this.validate(value, propSchema, `${path}.${key}`));
        }
      }

      // Check for unknown properties
      for (const key of Object.keys(data)) {
        if (!schema.properties[key]) {
          errors.push({
            line: 0,
            column: 0,
            message: `Unknown property '${key}' at '${path}'`,
            suggestion: `Remove this property or check for typos`,
          });
        }
      }
    }

    // Array validation
    if (schema.type === 'array' && schema.items) {
      if (Array.isArray(data)) {
        data.forEach((item, index) => {
          errors.push(...this.validate(item, schema.items!, `${path}[${index}]`));
        });
      }
    }

    // String validation
    if (schema.type === 'string') {
      if (schema.enum && !schema.enum.includes(data)) {
        errors.push({
          line: 0,
          column: 0,
          message: `Invalid value '${data}' at '${path}'. Must be one of: ${schema.enum.join(', ')}`,
          suggestion: `Use one of: ${schema.enum.join(', ')}`,
        });
      }

      if (schema.pattern && !schema.pattern.test(data)) {
        errors.push({
          line: 0,
          column: 0,
          message: `Value '${data}' at '${path}' does not match pattern ${schema.pattern}`,
          suggestion: `Ensure the value matches the required format`,
        });
      }
    }

    // Number validation
    if (schema.type === 'number') {
      if (schema.min !== undefined && data < schema.min) {
        errors.push({
          line: 0,
          column: 0,
          message: `Value ${data} at '${path}' is less than minimum ${schema.min}`,
          suggestion: `Use a value >= ${schema.min}`,
        });
      }

      if (schema.max !== undefined && data > schema.max) {
        errors.push({
          line: 0,
          column: 0,
          message: `Value ${data} at '${path}' is greater than maximum ${schema.max}`,
          suggestion: `Use a value <= ${schema.max}`,
        });
      }
    }

    return errors;
  }

  /**
   * Pretty print configuration object
   */
  static prettyPrint(data: any, indent: number = 2): string {
    return JSON.stringify(data, null, indent);
  }

  /**
   * Minify configuration (remove whitespace)
   */
  static minify(data: any): string {
    return JSON.stringify(data);
  }

  /**
   * Get line and column from position
   */
  private static getLineAndColumn(content: string, position: number): { line: number; column: number } {
    const lines = content.substring(0, position).split('\n');
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1,
    };
  }

  /**
   * Get syntax suggestion based on error position
   */
  private static getSyntaxSuggestion(content: string, position: number): string {
    const char = content[position];
    const prevChar = content[position - 1];

    if (char === ',') {
      return 'Remove trailing comma';
    }

    if (prevChar === ',') {
      return 'Add a value after the comma';
    }

    if (char === '}' || char === ']') {
      return 'Check for missing or extra commas';
    }

    if (char === '"' || char === "'") {
      return 'Check for unclosed string';
    }

    return 'Check syntax near this position';
  }

  /**
   * Get default value for schema type
   */
  private static getDefaultValue(schema: ConfigurationSchema): string {
    switch (schema.type) {
      case 'string':
        return schema.enum ? `"${schema.enum[0]}"` : '""';
      case 'number':
        return schema.min !== undefined ? String(schema.min) : '0';
      case 'boolean':
        return 'false';
      case 'array':
        return '[]';
      case 'object':
        return '{}';
      default:
        return 'null';
    }
  }

  /**
   * Format configuration with custom formatting rules
   */
  static format(
    data: any,
    options: {
      indent?: number;
      sortKeys?: boolean;
      maxLineLength?: number;
    } = {}
  ): string {
    const { indent = 2, sortKeys = false, maxLineLength = 80 } = options;

    const formatValue = (value: any, depth: number): string => {
      const indentStr = ' '.repeat(indent * depth);
      const nextIndentStr = ' '.repeat(indent * (depth + 1));

      if (value === null) return 'null';
      if (typeof value === 'boolean') return String(value);
      if (typeof value === 'number') return String(value);
      if (typeof value === 'string') return JSON.stringify(value);

      if (Array.isArray(value)) {
        if (value.length === 0) return '[]';

        const items = value.map((item) => `${nextIndentStr}${formatValue(item, depth + 1)}`);
        return `[\n${items.join(',\n')}\n${indentStr}]`;
      }

      if (typeof value === 'object') {
        const keys = sortKeys ? Object.keys(value).sort() : Object.keys(value);
        if (keys.length === 0) return '{}';

        const items = keys.map((key) => {
          const formattedValue = formatValue(value[key], depth + 1);
          return `${nextIndentStr}${JSON.stringify(key)}: ${formattedValue}`;
        });

        return `{\n${items.join(',\n')}\n${indentStr}}`;
      }

      return String(value);
    };

    return formatValue(data, 0);
  }

  /**
   * Merge configurations with conflict resolution
   */
  static merge(base: any, override: any, strategy: 'override' | 'merge' = 'merge'): any {
    if (strategy === 'override') {
      return override;
    }

    if (typeof base !== 'object' || typeof override !== 'object') {
      return override;
    }

    if (Array.isArray(base) && Array.isArray(override)) {
      return [...base, ...override];
    }

    const result = { ...base };

    for (const key of Object.keys(override)) {
      if (key in base) {
        result[key] = this.merge(base[key], override[key], strategy);
      } else {
        result[key] = override[key];
      }
    }

    return result;
  }

  /**
   * Extract schema from example configuration
   */
  static inferSchema(data: any): ConfigurationSchema {
    const type = Array.isArray(data) ? 'array' : typeof data;

    const schema: ConfigurationSchema = {
      type: type as any,
    };

    if (type === 'object' && data !== null) {
      schema.properties = {};
      for (const [key, value] of Object.entries(data)) {
        schema.properties[key] = this.inferSchema(value);
      }
    }

    if (type === 'array' && data.length > 0) {
      schema.items = this.inferSchema(data[0]);
    }

    return schema;
  }

  /**
   * Diff two configurations
   */
  static diff(
    oldConfig: any,
    newConfig: any,
    path: string = 'root'
  ): Array<{ path: string; type: 'added' | 'removed' | 'changed'; oldValue?: any; newValue?: any }> {
    const changes: Array<{
      path: string;
      type: 'added' | 'removed' | 'changed';
      oldValue?: any;
      newValue?: any;
    }> = [];

    if (typeof oldConfig !== typeof newConfig) {
      changes.push({
        path,
        type: 'changed',
        oldValue: oldConfig,
        newValue: newConfig,
      });
      return changes;
    }

    if (typeof oldConfig === 'object' && oldConfig !== null && newConfig !== null) {
      const oldKeys = new Set(Object.keys(oldConfig));
      const newKeys = new Set(Object.keys(newConfig));

      // Check for removed keys
      for (const key of oldKeys) {
        if (!newKeys.has(key)) {
          changes.push({
            path: `${path}.${key}`,
            type: 'removed',
            oldValue: oldConfig[key],
          });
        }
      }

      // Check for added keys
      for (const key of newKeys) {
        if (!oldKeys.has(key)) {
          changes.push({
            path: `${path}.${key}`,
            type: 'added',
            newValue: newConfig[key],
          });
        }
      }

      // Check for changed keys
      for (const key of oldKeys) {
        if (newKeys.has(key)) {
          const oldValue = oldConfig[key];
          const newValue = newConfig[key];

          if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changes.push(...this.diff(oldValue, newValue, `${path}.${key}`));
          }
        }
      }
    } else if (oldConfig !== newConfig) {
      changes.push({
        path,
        type: 'changed',
        oldValue: oldConfig,
        newValue: newConfig,
      });
    }

    return changes;
  }
}
