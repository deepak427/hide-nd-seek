/**
 * Performance Monitoring Service
 * 
 * Tracks application performance metrics including response times,
 * throughput, resource usage, and custom performance markers.
 */

import { loadConfig } from '../../shared/config/environment';

// Simple feature flag check
function isFeatureEnabled(feature: string): boolean {
  const config = loadConfig();
  return (config.features as any)[feature] || false;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface RequestMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: Date;
  userId?: string;
  userAgent?: string;
  contentLength?: number;
}

export interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number; // percentage
    loadAverage: number[];
  };
  memory: {
    used: number; // bytes
    total: number; // bytes
    percentage: number;
    heapUsed: number;
    heapTotal: number;
  };
  process: {
    uptime: number; // seconds
    pid: number;
    version: string;
  };
  eventLoop: {
    delay: number; // milliseconds
    utilization: number; // percentage
  };
}

export interface PerformanceStats {
  requests: {
    total: number;
    averageResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
    slowestEndpoints: Array<{ endpoint: string; averageTime: number }>;
  };
  system: {
    current: SystemMetrics;
    averages: {
      cpuUsage: number;
      memoryUsage: number;
      responseTime: number;
    };
  };
  custom: {
    metrics: PerformanceMetric[];
    counters: Record<string, number>;
  };
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private requestMetrics: RequestMetrics[] = [];
  private systemMetrics: SystemMetrics[] = [];
  private customCounters: Map<string, number> = new Map();
  private activeRequests: Map<string, { startTime: Date; metadata: any }> = new Map();
  private maxMetricsHistory = 10000;
  private collectionInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startSystemMetricsCollection();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start collecting system metrics
   */
  private startSystemMetricsCollection(): void {
    if (!isFeatureEnabled('enablePerformanceMonitoring')) {
      return;
    }

    const config = loadConfig();
    const interval = config.monitoring.metricsCollectionInterval;

    this.collectionInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, interval);
  }

  /**
   * Stop collecting system metrics
   */
  public stopCollection(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
  }

  /**
   * Collect current system metrics
   */
  private collectSystemMetrics(): void {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      const systemMetric: SystemMetrics = {
        timestamp: new Date(),
        cpu: {
          usage: this.calculateCpuUsage(cpuUsage),
          loadAverage: require('os').loadavg(),
        },
        memory: {
          used: memUsage.rss,
          total: require('os').totalmem(),
          percentage: (memUsage.rss / require('os').totalmem()) * 100,
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
        },
        process: {
          uptime: process.uptime(),
          pid: process.pid,
          version: process.version,
        },
        eventLoop: {
          delay: this.measureEventLoopDelay(),
          utilization: this.calculateEventLoopUtilization(),
        },
      };

      this.systemMetrics.push(systemMetric);
      this.cleanupOldMetrics();
    } catch (error) {
      console.error('Error collecting system metrics:', error);
    }
  }

  /**
   * Calculate CPU usage percentage
   */
  private calculateCpuUsage(cpuUsage: NodeJS.CpuUsage): number {
    // This is a simplified calculation
    // In a real implementation, you'd track the delta between measurements
    const totalUsage = cpuUsage.user + cpuUsage.system;
    return Math.min(100, (totalUsage / 1000000) * 100); // Convert microseconds to percentage
  }

  /**
   * Measure event loop delay
   */
  private measureEventLoopDelay(): number {
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const delay = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds
      return delay;
    });
    return 0; // Placeholder - real implementation would use async measurement
  }

  /**
   * Calculate event loop utilization
   */
  private calculateEventLoopUtilization(): number {
    // Placeholder - real implementation would use perf_hooks.eventLoopUtilization()
    return Math.random() * 100; // Mock value for now
  }

  /**
   * Start tracking a request
   */
  public startRequest(requestId: string, metadata: any = {}): void {
    if (!isFeatureEnabled('enablePerformanceMonitoring')) {
      return;
    }

    this.activeRequests.set(requestId, {
      startTime: new Date(),
      metadata,
    });
  }

  /**
   * End tracking a request and record metrics
   */
  public endRequest(
    requestId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    additionalData: Partial<RequestMetrics> = {}
  ): void {
    if (!isFeatureEnabled('enablePerformanceMonitoring')) {
      return;
    }

    const requestData = this.activeRequests.get(requestId);
    if (!requestData) {
      return;
    }

    const duration = Date.now() - requestData.startTime.getTime();
    
    const requestMetric: RequestMetrics = {
      endpoint,
      method,
      statusCode,
      duration,
      timestamp: new Date(),
      ...additionalData,
    };

    this.requestMetrics.push(requestMetric);
    this.activeRequests.delete(requestId);

    // Record as custom metric as well
    this.recordMetric(`request.${endpoint}.duration`, duration, 'ms', {
      method,
      status: statusCode.toString(),
    });

    this.cleanupOldMetrics();
  }

  /**
   * Record a custom performance metric
   */
  public recordMetric(
    name: string,
    value: number,
    unit: string = 'count',
    tags?: Record<string, string>,
    metadata?: Record<string, any>
  ): void {
    if (!isFeatureEnabled('enablePerformanceMonitoring')) {
      return;
    }

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      tags,
      metadata,
    };

    this.metrics.push(metric);
    this.cleanupOldMetrics();
  }

  /**
   * Increment a counter
   */
  public incrementCounter(name: string, value: number = 1): void {
    if (!isFeatureEnabled('enablePerformanceMonitoring')) {
      return;
    }

    const currentValue = this.customCounters.get(name) || 0;
    this.customCounters.set(name, currentValue + value);
  }

  /**
   * Record timing for a function execution
   */
  public async timeFunction<T>(
    name: string,
    fn: () => Promise<T> | T,
    tags?: Record<string, string>
  ): Promise<T> {
    if (!isFeatureEnabled('enablePerformanceMonitoring')) {
      return await fn();
    }

    const startTime = process.hrtime.bigint();
    
    try {
      const result = await fn();
      const duration = Number(process.hrtime.bigint() - startTime) / 1000000; // Convert to milliseconds
      
      this.recordMetric(`function.${name}.duration`, duration, 'ms', tags);
      this.recordMetric(`function.${name}.success`, 1, 'count', tags);
      
      return result;
    } catch (error) {
      const duration = Number(process.hrtime.bigint() - startTime) / 1000000;
      
      this.recordMetric(`function.${name}.duration`, duration, 'ms', tags);
      this.recordMetric(`function.${name}.error`, 1, 'count', tags);
      
      throw error;
    }
  }

  /**
   * Get performance statistics
   */
  public getStats(): PerformanceStats {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    
    // Request statistics
    const recentRequests = this.requestMetrics.filter(r => r.timestamp > oneMinuteAgo);
    const totalRequests = this.requestMetrics.length;
    const averageResponseTime = recentRequests.length > 0
      ? recentRequests.reduce((sum, r) => sum + r.duration, 0) / recentRequests.length
      : 0;
    const requestsPerSecond = recentRequests.length / 60;
    const errorRequests = recentRequests.filter(r => r.statusCode >= 400);
    const errorRate = recentRequests.length > 0 ? errorRequests.length / recentRequests.length : 0;

    // Slowest endpoints
    const endpointTimes: Record<string, number[]> = {};
    for (const request of this.requestMetrics) {
      if (!endpointTimes[request.endpoint]) {
        endpointTimes[request.endpoint] = [];
      }
      endpointTimes[request.endpoint].push(request.duration);
    }

    const slowestEndpoints = Object.entries(endpointTimes)
      .map(([endpoint, times]) => ({
        endpoint,
        averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 5);

    // System statistics
    const recentSystemMetrics = this.systemMetrics.slice(-10);
    const currentSystemMetrics = this.systemMetrics[this.systemMetrics.length - 1] || {
      timestamp: new Date(),
      cpu: { usage: 0, loadAverage: [0, 0, 0] },
      memory: { used: 0, total: 0, percentage: 0, heapUsed: 0, heapTotal: 0 },
      process: { uptime: 0, pid: 0, version: '' },
      eventLoop: { delay: 0, utilization: 0 },
    };

    const averageCpuUsage = recentSystemMetrics.length > 0
      ? recentSystemMetrics.reduce((sum, m) => sum + m.cpu.usage, 0) / recentSystemMetrics.length
      : 0;

    const averageMemoryUsage = recentSystemMetrics.length > 0
      ? recentSystemMetrics.reduce((sum, m) => sum + m.memory.percentage, 0) / recentSystemMetrics.length
      : 0;

    return {
      requests: {
        total: totalRequests,
        averageResponseTime,
        requestsPerSecond,
        errorRate,
        slowestEndpoints,
      },
      system: {
        current: currentSystemMetrics,
        averages: {
          cpuUsage: averageCpuUsage,
          memoryUsage: averageMemoryUsage,
          responseTime: averageResponseTime,
        },
      },
      custom: {
        metrics: this.metrics.slice(-100), // Last 100 custom metrics
        counters: Object.fromEntries(this.customCounters.entries()),
      },
    };
  }

  /**
   * Get metrics by name pattern
   */
  public getMetricsByName(namePattern: string): PerformanceMetric[] {
    const regex = new RegExp(namePattern);
    return this.metrics.filter(metric => regex.test(metric.name));
  }

  /**
   * Get request metrics for specific endpoint
   */
  public getRequestMetrics(endpoint?: string): RequestMetrics[] {
    if (endpoint) {
      return this.requestMetrics.filter(r => r.endpoint === endpoint);
    }
    return [...this.requestMetrics];
  }

  /**
   * Clear all metrics (useful for testing)
   */
  public clear(): void {
    this.metrics = [];
    this.requestMetrics = [];
    this.systemMetrics = [];
    this.customCounters.clear();
    this.activeRequests.clear();
  }

  /**
   * Cleanup old metrics to prevent memory leaks
   */
  private cleanupOldMetrics(): void {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const cutoff = new Date(Date.now() - maxAge);

    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    this.requestMetrics = this.requestMetrics.filter(r => r.timestamp > cutoff);
    this.systemMetrics = this.systemMetrics.filter(s => s.timestamp > cutoff);

    // Keep only recent metrics if we have too many
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }
    if (this.requestMetrics.length > this.maxMetricsHistory) {
      this.requestMetrics = this.requestMetrics.slice(-this.maxMetricsHistory);
    }
    if (this.systemMetrics.length > 1000) {
      this.systemMetrics = this.systemMetrics.slice(-1000);
    }
  }

  /**
   * Export metrics for external monitoring systems
   */
  public exportMetrics(): {
    metrics: PerformanceMetric[];
    requests: RequestMetrics[];
    system: SystemMetrics[];
    counters: Record<string, number>;
  } {
    return {
      metrics: [...this.metrics],
      requests: [...this.requestMetrics],
      system: [...this.systemMetrics],
      counters: Object.fromEntries(this.customCounters.entries()),
    };
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = PerformanceMonitor.getInstance();

/**
 * Convenience function to record metrics
 */
export function recordMetric(
  name: string,
  value: number,
  unit?: string,
  tags?: Record<string, string>
): void {
  performanceMonitor.recordMetric(name, value, unit, tags);
}

/**
 * Convenience function to time function execution
 */
export function timeFunction<T>(
  name: string,
  fn: () => Promise<T> | T,
  tags?: Record<string, string>
): Promise<T> {
  return performanceMonitor.timeFunction(name, fn, tags);
}

/**
 * Convenience function to increment counters
 */
export function incrementCounter(name: string, value?: number): void {
  performanceMonitor.incrementCounter(name, value);
}