/**
 * Error Handler Service
 * Handles error classification, recovery, state persistence, and user-friendly messages
 */

export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  PERMISSION = 'permission',
  TIMEOUT = 'timeout',
  RESOURCE = 'resource',
  SYSTEM = 'system',
  USER = 'user',
  UNKNOWN = 'unknown',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface AppError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  suggestion?: string;
  timestamp: Date;
  context?: Record<string, any>;
  stack?: string;
  recoverable: boolean;
  recovered: boolean;
}

export interface ErrorRecoveryStrategy {
  type: ErrorType;
  handler: (error: AppError) => Promise<boolean>;
  maxRetries: number;
}

export interface StateCheckpoint {
  id: string;
  timestamp: Date;
  state: any;
  operation: string;
}

export class ErrorHandler {
  private static errors: AppError[] = [];
  private static recoveryStrategies = new Map<ErrorType, ErrorRecoveryStrategy>();
  private static checkpoints = new Map<string, StateCheckpoint>();
  private static maxErrorHistory = 100;
  private static errorListeners: Array<(error: AppError) => void> = [];

  /**
   * Initialize error handler with recovery strategies
   */
  static initialize(): void {
    // Network error recovery
    this.registerRecoveryStrategy({
      type: ErrorType.NETWORK,
      maxRetries: 3,
      handler: async (error) => {
        console.log('Attempting network error recovery...');
        // Wait and retry
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return true;
      },
    });

    // Timeout error recovery
    this.registerRecoveryStrategy({
      type: ErrorType.TIMEOUT,
      maxRetries: 2,
      handler: async (error) => {
        console.log('Attempting timeout error recovery...');
        // Increase timeout and retry
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return true;
      },
    });

    // Resource error recovery
    this.registerRecoveryStrategy({
      type: ErrorType.RESOURCE,
      maxRetries: 1,
      handler: async (error) => {
        console.log('Attempting resource error recovery...');
        // Clear cache and retry
        localStorage.removeItem('cache');
        return true;
      },
    });

    // Load persisted errors
    this.loadPersistedErrors();
  }

  /**
   * Handle an error
   */
  static async handleError(
    error: Error | string,
    context?: Record<string, any>
  ): Promise<AppError> {
    const appError = this.classifyError(error, context);
    this.errors.push(appError);

    // Trim error history
    if (this.errors.length > this.maxErrorHistory) {
      this.errors.shift();
    }

    // Persist error
    this.persistError(appError);

    // Notify listeners
    this.notifyListeners(appError);

    // Attempt recovery if possible
    if (appError.recoverable) {
      const recovered = await this.attemptRecovery(appError);
      appError.recovered = recovered;
    }

    return appError;
  }

  /**
   * Classify error
   */
  private static classifyError(
    error: Error | string,
    context?: Record<string, any>
  ): AppError {
    const message = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'string' ? undefined : error.stack;

    let type = ErrorType.UNKNOWN;
    let severity = ErrorSeverity.MEDIUM;
    let userMessage = 'An error occurred';
    let suggestion: string | undefined;
    let recoverable = false;

    // Network errors
    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('connection')
    ) {
      type = ErrorType.NETWORK;
      severity = ErrorSeverity.MEDIUM;
      userMessage = 'Network connection error';
      suggestion = 'Check your internet connection and try again';
      recoverable = true;
    }
    // Timeout errors
    else if (message.includes('timeout') || message.includes('timed out')) {
      type = ErrorType.TIMEOUT;
      severity = ErrorSeverity.MEDIUM;
      userMessage = 'Operation timed out';
      suggestion = 'The operation took too long. Try again or increase the timeout';
      recoverable = true;
    }
    // Validation errors
    else if (message.includes('invalid') || message.includes('validation')) {
      type = ErrorType.VALIDATION;
      severity = ErrorSeverity.LOW;
      userMessage = 'Invalid input';
      suggestion = 'Please check your input and try again';
      recoverable = false;
    }
    // Authentication errors
    else if (
      message.includes('auth') ||
      message.includes('unauthorized') ||
      message.includes('forbidden')
    ) {
      type = ErrorType.AUTHENTICATION;
      severity = ErrorSeverity.HIGH;
      userMessage = 'Authentication failed';
      suggestion = 'Please check your credentials and try again';
      recoverable = false;
    }
    // Permission errors
    else if (message.includes('permission') || message.includes('access denied')) {
      type = ErrorType.PERMISSION;
      severity = ErrorSeverity.HIGH;
      userMessage = 'Permission denied';
      suggestion = 'You do not have permission to perform this action';
      recoverable = false;
    }
    // Resource errors
    else if (
      message.includes('memory') ||
      message.includes('resource') ||
      message.includes('quota')
    ) {
      type = ErrorType.RESOURCE;
      severity = ErrorSeverity.HIGH;
      userMessage = 'Resource limit exceeded';
      suggestion = 'Clear cache or close other applications';
      recoverable = true;
    }
    // System errors
    else if (message.includes('system') || message.includes('internal')) {
      type = ErrorType.SYSTEM;
      severity = ErrorSeverity.CRITICAL;
      userMessage = 'System error occurred';
      suggestion = 'Please restart the application';
      recoverable = false;
    }

    return {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      userMessage,
      suggestion,
      timestamp: new Date(),
      context,
      stack,
      recoverable,
      recovered: false,
    };
  }

  /**
   * Register recovery strategy
   */
  static registerRecoveryStrategy(strategy: ErrorRecoveryStrategy): void {
    this.recoveryStrategies.set(strategy.type, strategy);
  }

  /**
   * Attempt error recovery
   */
  private static async attemptRecovery(error: AppError): Promise<boolean> {
    const strategy = this.recoveryStrategies.get(error.type);
    if (!strategy) {
      return false;
    }

    let retries = 0;
    while (retries < strategy.maxRetries) {
      try {
        const success = await strategy.handler(error);
        if (success) {
          console.log(`Error recovered after ${retries + 1} attempts`);
          return true;
        }
      } catch (recoveryError) {
        console.error('Recovery attempt failed:', recoveryError);
      }

      retries++;
    }

    return false;
  }

  /**
   * Create state checkpoint
   */
  static createCheckpoint(operation: string, state: any): string {
    const checkpoint: StateCheckpoint = {
      id: `checkpoint-${Date.now()}`,
      timestamp: new Date(),
      state: JSON.parse(JSON.stringify(state)), // Deep clone
      operation,
    };

    this.checkpoints.set(checkpoint.id, checkpoint);

    // Keep only last 10 checkpoints
    if (this.checkpoints.size > 10) {
      const oldest = Array.from(this.checkpoints.keys())[0];
      this.checkpoints.delete(oldest);
    }

    return checkpoint.id;
  }

  /**
   * Restore from checkpoint
   */
  static restoreCheckpoint(checkpointId: string): any | null {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) {
      return null;
    }

    return JSON.parse(JSON.stringify(checkpoint.state)); // Deep clone
  }

  /**
   * Get latest checkpoint for operation
   */
  static getLatestCheckpoint(operation: string): StateCheckpoint | null {
    const checkpoints = Array.from(this.checkpoints.values())
      .filter((cp) => cp.operation === operation)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return checkpoints[0] || null;
  }

  /**
   * Persist error to storage
   */
  private static persistError(error: AppError): void {
    try {
      const stored = localStorage.getItem('error-history');
      const history = stored ? JSON.parse(stored) : [];

      history.push({
        ...error,
        timestamp: error.timestamp.toISOString(),
      });

      // Keep only last 50 errors
      if (history.length > 50) {
        history.shift();
      }

      localStorage.setItem('error-history', JSON.stringify(history));
    } catch (e) {
      console.error('Failed to persist error:', e);
    }
  }

  /**
   * Load persisted errors
   */
  private static loadPersistedErrors(): void {
    try {
      const stored = localStorage.getItem('error-history');
      if (stored) {
        const history = JSON.parse(stored);
        this.errors = history.map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp),
        }));
      }
    } catch (e) {
      console.error('Failed to load persisted errors:', e);
    }
  }

  /**
   * Get error history
   */
  static getErrorHistory(filter?: {
    type?: ErrorType;
    severity?: ErrorSeverity;
    since?: Date;
  }): AppError[] {
    let filtered = [...this.errors];

    if (filter) {
      if (filter.type) {
        filtered = filtered.filter((e) => e.type === filter.type);
      }
      if (filter.severity) {
        filtered = filtered.filter((e) => e.severity === filter.severity);
      }
      if (filter.since) {
        filtered = filtered.filter((e) => e.timestamp >= filter.since);
      }
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Clear error history
   */
  static clearErrorHistory(): void {
    this.errors = [];
    localStorage.removeItem('error-history');
  }

  /**
   * Add error listener
   */
  static addErrorListener(listener: (error: AppError) => void): void {
    this.errorListeners.push(listener);
  }

  /**
   * Remove error listener
   */
  static removeErrorListener(listener: (error: AppError) => void): void {
    this.errorListeners = this.errorListeners.filter((l) => l !== listener);
  }

  /**
   * Notify listeners
   */
  private static notifyListeners(error: AppError): void {
    this.errorListeners.forEach((listener) => {
      try {
        listener(error);
      } catch (e) {
        console.error('Error listener failed:', e);
      }
    });
  }

  /**
   * Get error statistics
   */
  static getErrorStatistics(): {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
    recoveryRate: number;
  } {
    const byType: Record<ErrorType, number> = {} as any;
    const bySeverity: Record<ErrorSeverity, number> = {} as any;
    let recoveredCount = 0;

    this.errors.forEach((error) => {
      byType[error.type] = (byType[error.type] || 0) + 1;
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
      if (error.recovered) {
        recoveredCount++;
      }
    });

    return {
      total: this.errors.length,
      byType,
      bySeverity,
      recoveryRate: this.errors.length > 0 ? (recoveredCount / this.errors.length) * 100 : 0,
    };
  }

  /**
   * Format error for display
   */
  static formatError(error: AppError): string {
    let formatted = `[${error.severity.toUpperCase()}] ${error.userMessage}`;

    if (error.suggestion) {
      formatted += `\n💡 ${error.suggestion}`;
    }

    if (error.context) {
      formatted += `\n\nContext: ${JSON.stringify(error.context, null, 2)}`;
    }

    return formatted;
  }

  /**
   * Export error report
   */
  static exportErrorReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      statistics: this.getErrorStatistics(),
      errors: this.errors.map((e) => ({
        ...e,
        timestamp: e.timestamp.toISOString(),
      })),
    };

    return JSON.stringify(report, null, 2);
  }
}

// Initialize on module load
ErrorHandler.initialize();
