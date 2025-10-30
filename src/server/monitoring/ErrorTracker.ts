/**
 * Error Tracking Service
 * 
 * Provides comprehensive error tracking, logging, and reporting capabilities
 * with integration support for external monitoring services.
 */

import { loadConfig } from '../../shared/config/environment';

// Simple feature flag check
function isFeatureEnabled(feature: string): boolean {
  const config = loadConfig();
  return (config.features as any)[feature] || false;
}

export interface ErrorContext {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
  timestamp: Date;
  environment: string;
  version?: string;
  metadata?: Record<string, any>;
}

export interface ErrorReport {
  id: string;
  error: Error;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'api' | 'database' | 'reddit' | 'validation' | 'system' | 'unknown';
  fingerprint: string;
  stackTrace?: string;
  breadcrumbs?: Breadcrumb[];
}

export interface Breadcrumb {
  timestamp: Date;
  category: string;
  message: string;
  level: 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByCategory: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  errorsByEndpoint: Record<string, number>;
  recentErrors: ErrorReport[];
  errorRate: number; // errors per minute
}

export class ErrorTracker {
  private static instance: ErrorTracker;
  private errors: Map<string, ErrorReport> = new Map();
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs = 100;
  private maxStoredErrors = 1000;
  private errorCounts: Map<string, number> = new Map();
  private lastErrorTime: Date | null = null;

  private constructor() {
    this.setupGlobalErrorHandlers();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.captureError(error, {
        timestamp: new Date(),
        environment: loadConfig().environment,
        metadata: { type: 'uncaughtException' },
      }, 'critical', 'system');
      
      // Log and exit gracefully
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      this.captureError(error, {
        timestamp: new Date(),
        environment: loadConfig().environment,
        metadata: { 
          type: 'unhandledRejection',
          promise: promise.toString(),
        },
      }, 'high', 'system');
    });
  }

  /**
   * Capture an error with context
   */
  public captureError(
    error: Error,
    context: Partial<ErrorContext>,
    severity: ErrorReport['severity'] = 'medium',
    category: ErrorReport['category'] = 'unknown'
  ): string {
    if (!isFeatureEnabled('enableAdvancedErrorHandling')) {
      // Fallback to basic console logging
      console.error('Error:', error.message, error.stack);
      return '';
    }

    const errorId = this.generateErrorId();
    const fullContext: ErrorContext = {
      timestamp: new Date(),
      environment: loadConfig().environment,
      ...context,
    };

    const fingerprint = this.generateFingerprint(error, category);
    
    const errorReport: ErrorReport = {
      id: errorId,
      error,
      context: fullContext,
      severity,
      category,
      fingerprint,
      stackTrace: error.stack,
      breadcrumbs: [...this.breadcrumbs],
    };

    // Store error
    this.errors.set(errorId, errorReport);
    this.lastErrorTime = new Date();

    // Update error counts
    const countKey = `${category}:${fingerprint}`;
    this.errorCounts.set(countKey, (this.errorCounts.get(countKey) || 0) + 1);

    // Cleanup old errors if needed
    this.cleanupOldErrors();

    // Log error based on severity
    this.logError(errorReport);

    // Send to external services if configured
    this.sendToExternalServices(errorReport);

    return errorId;
  }

  /**
   * Add breadcrumb for debugging context
   */
  public addBreadcrumb(
    category: string,
    message: string,
    level: Breadcrumb['level'] = 'info',
    data?: Record<string, any>
  ): void {
    const breadcrumb: Breadcrumb = {
      timestamp: new Date(),
      category,
      message,
      level,
      data,
    };

    this.breadcrumbs.push(breadcrumb);

    // Keep only recent breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate error fingerprint for grouping
   */
  private generateFingerprint(error: Error, category: string): string {
    const message = error.message.replace(/\d+/g, 'N'); // Replace numbers with N
    const stack = error.stack?.split('\n')[1] || ''; // First stack frame
    return `${category}:${error.name}:${message}:${stack}`.replace(/[^a-zA-Z0-9:]/g, '_');
  }

  /**
   * Log error based on severity
   */
  private logError(errorReport: ErrorReport): void {
    const config = loadConfig();
    const { error, context, severity, category } = errorReport;

    const logMessage = `[${severity.toUpperCase()}] ${category} error: ${error.message}`;
    const logData = {
      errorId: errorReport.id,
      fingerprint: errorReport.fingerprint,
      userId: context.userId,
      endpoint: context.endpoint,
      timestamp: context.timestamp.toISOString(),
    };

    switch (severity) {
      case 'critical':
        console.error(logMessage, logData, error.stack);
        break;
      case 'high':
        console.error(logMessage, logData);
        break;
      case 'medium':
        if (config.monitoring.logLevel === 'info' || config.monitoring.logLevel === 'debug') {
          console.warn(logMessage, logData);
        }
        break;
      case 'low':
        if (config.monitoring.logLevel === 'debug') {
          console.info(logMessage, logData);
        }
        break;
    }
  }

  /**
   * Send error to external monitoring services
   */
  private sendToExternalServices(errorReport: ErrorReport): void {
    if (!isFeatureEnabled('enableErrorTracking')) {
      return;
    }

    // Placeholder for external service integration
    // In a real implementation, you would integrate with services like:
    // - Sentry
    // - Rollbar
    // - Bugsnag
    // - Custom logging service

    try {
      // Example: Send to custom logging endpoint
      // await fetch('/api/internal/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(this.serializeErrorReport(errorReport)),
      // });
    } catch (sendError) {
      console.error('Failed to send error to external service:', sendError);
    }
  }

  /**
   * Serialize error report for external services
   */
  private serializeErrorReport(errorReport: ErrorReport): any {
    return {
      id: errorReport.id,
      message: errorReport.error.message,
      name: errorReport.error.name,
      stack: errorReport.stackTrace,
      context: errorReport.context,
      severity: errorReport.severity,
      category: errorReport.category,
      fingerprint: errorReport.fingerprint,
      breadcrumbs: errorReport.breadcrumbs,
    };
  }

  /**
   * Get error metrics
   */
  public getMetrics(): ErrorMetrics {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    
    const recentErrors = Array.from(this.errors.values())
      .filter(error => error.context.timestamp > oneMinuteAgo)
      .sort((a, b) => b.context.timestamp.getTime() - a.context.timestamp.getTime())
      .slice(0, 10);

    const errorsByCategory: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    const errorsByEndpoint: Record<string, number> = {};

    for (const error of this.errors.values()) {
      errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
      
      if (error.context.endpoint) {
        errorsByEndpoint[error.context.endpoint] = (errorsByEndpoint[error.context.endpoint] || 0) + 1;
      }
    }

    return {
      totalErrors: this.errors.size,
      errorsByCategory,
      errorsBySeverity,
      errorsByEndpoint,
      recentErrors,
      errorRate: recentErrors.length, // errors per minute
    };
  }

  /**
   * Get error by ID
   */
  public getError(errorId: string): ErrorReport | null {
    return this.errors.get(errorId) || null;
  }

  /**
   * Get errors by fingerprint
   */
  public getErrorsByFingerprint(fingerprint: string): ErrorReport[] {
    return Array.from(this.errors.values())
      .filter(error => error.fingerprint === fingerprint)
      .sort((a, b) => b.context.timestamp.getTime() - a.context.timestamp.getTime());
  }

  /**
   * Clear all errors (useful for testing)
   */
  public clear(): void {
    this.errors.clear();
    this.breadcrumbs = [];
    this.errorCounts.clear();
    this.lastErrorTime = null;
  }

  /**
   * Cleanup old errors to prevent memory leaks
   */
  private cleanupOldErrors(): void {
    if (this.errors.size <= this.maxStoredErrors) {
      return;
    }

    const sortedErrors = Array.from(this.errors.entries())
      .sort(([, a], [, b]) => a.context.timestamp.getTime() - b.context.timestamp.getTime());

    const toRemove = sortedErrors.slice(0, this.errors.size - this.maxStoredErrors);
    
    for (const [errorId] of toRemove) {
      this.errors.delete(errorId);
    }
  }

  /**
   * Get system health status
   */
  public getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    errorRate: number;
    criticalErrors: number;
    lastError?: Date;
  } {
    const metrics = this.getMetrics();
    const criticalErrors = metrics.errorsBySeverity.critical || 0;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (criticalErrors > 0) {
      status = 'unhealthy';
    } else if (metrics.errorRate > 10) { // More than 10 errors per minute
      status = 'degraded';
    }

    return {
      status,
      errorRate: metrics.errorRate,
      criticalErrors,
      lastError: this.lastErrorTime || undefined,
    };
  }
}

/**
 * Global error tracker instance
 */
export const errorTracker = ErrorTracker.getInstance();

/**
 * Convenience function to capture errors
 */
export function captureError(
  error: Error,
  context?: Partial<ErrorContext>,
  severity?: ErrorReport['severity'],
  category?: ErrorReport['category']
): string {
  return errorTracker.captureError(error, context || {}, severity, category);
}

/**
 * Convenience function to add breadcrumbs
 */
export function addBreadcrumb(
  category: string,
  message: string,
  level?: Breadcrumb['level'],
  data?: Record<string, any>
): void {
  errorTracker.addBreadcrumb(category, message, level, data);
}