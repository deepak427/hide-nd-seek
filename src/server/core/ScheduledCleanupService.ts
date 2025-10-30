import { DataExpirationManager } from './DataExpirationManager';

/**
 * Scheduled Cleanup Service
 * 
 * Provides automated cleanup scheduling and background maintenance
 * for the Redis data storage system.
 * 
 * Features:
 * - Configurable cleanup intervals
 * - Background cleanup execution
 * - Error handling and retry logic
 * - Cleanup history tracking
 */
export class ScheduledCleanupService {
  private static instance: ScheduledCleanupService | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private cleanupHistory: CleanupResult[] = [];
  
  // Configuration
  private readonly defaultIntervalHours = 24; // Run cleanup daily
  private readonly maxHistoryEntries = 100;
  private readonly retryAttempts = 3;
  private readonly retryDelayMs = 60000; // 1 minute

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ScheduledCleanupService {
    if (!ScheduledCleanupService.instance) {
      ScheduledCleanupService.instance = new ScheduledCleanupService();
    }
    return ScheduledCleanupService.instance;
  }

  /**
   * Start scheduled cleanup with specified interval
   */
  start(intervalHours?: number): void {
    if (this.isRunning) {
      console.log('⚠️ Scheduled cleanup is already running');
      return;
    }

    const interval = intervalHours || this.defaultIntervalHours;
    const intervalMs = interval * 60 * 60 * 1000;

    console.log(`🚀 Starting scheduled cleanup service (interval: ${interval} hours)`);

    // Run initial cleanup
    this.executeCleanup();

    // Schedule recurring cleanup
    this.cleanupInterval = setInterval(() => {
      this.executeCleanup();
    }, intervalMs);

    this.isRunning = true;
  }

  /**
   * Stop scheduled cleanup
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('⚠️ Scheduled cleanup is not running');
      return;
    }

    console.log('🛑 Stopping scheduled cleanup service');

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.isRunning = false;
  }

  /**
   * Execute cleanup with retry logic
   */
  private async executeCleanup(): Promise<void> {
    console.log('🧹 Executing scheduled cleanup...');

    const startTime = Date.now();
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < this.retryAttempts) {
      try {
        attempt++;
        console.log(`🔄 Cleanup attempt ${attempt}/${this.retryAttempts}`);

        const result = await DataExpirationManager.cleanupExpiredData();
        const duration = Date.now() - startTime;

        const cleanupResult: CleanupResult = {
          timestamp: new Date(),
          success: true,
          deletedKeys: result.deletedKeys,
          errors: result.errors,
          duration,
          attempt
        };

        this.addToHistory(cleanupResult);

        console.log(`✅ Scheduled cleanup completed successfully in ${duration}ms`);
        console.log(`📊 Results: ${result.deletedKeys} keys deleted, ${result.errors} errors`);

        return;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown cleanup error');
        console.error(`❌ Cleanup attempt ${attempt} failed:`, lastError.message);

        if (attempt < this.retryAttempts) {
          console.log(`⏳ Retrying in ${this.retryDelayMs / 1000} seconds...`);
          await this.delay(this.retryDelayMs);
        }
      }
    }

    // All attempts failed
    const duration = Date.now() - startTime;
    const cleanupResult: CleanupResult = {
      timestamp: new Date(),
      success: false,
      deletedKeys: 0,
      errors: 1,
      duration,
      attempt,
      error: lastError?.message || 'Unknown error'
    };

    this.addToHistory(cleanupResult);

    console.error(`💥 Scheduled cleanup failed after ${this.retryAttempts} attempts`);
    console.error(`🕐 Total duration: ${duration}ms`);
  }

  /**
   * Add cleanup result to history
   */
  private addToHistory(result: CleanupResult): void {
    this.cleanupHistory.unshift(result);

    // Keep only the most recent entries
    if (this.cleanupHistory.length > this.maxHistoryEntries) {
      this.cleanupHistory = this.cleanupHistory.slice(0, this.maxHistoryEntries);
    }
  }

  /**
   * Get cleanup history
   */
  getHistory(limit?: number): CleanupResult[] {
    const maxLimit = limit || this.cleanupHistory.length;
    return this.cleanupHistory.slice(0, maxLimit);
  }

  /**
   * Get cleanup statistics
   */
  getStatistics(): CleanupStatistics {
    if (this.cleanupHistory.length === 0) {
      return {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        successRate: 0,
        totalKeysDeleted: 0,
        totalErrors: 0,
        averageDuration: 0,
        lastRun: null,
        lastSuccessfulRun: null
      };
    }

    const totalRuns = this.cleanupHistory.length;
    const successfulRuns = this.cleanupHistory.filter(r => r.success).length;
    const failedRuns = totalRuns - successfulRuns;
    const successRate = (successfulRuns / totalRuns) * 100;

    const totalKeysDeleted = this.cleanupHistory.reduce((sum, r) => sum + r.deletedKeys, 0);
    const totalErrors = this.cleanupHistory.reduce((sum, r) => sum + r.errors, 0);
    const averageDuration = this.cleanupHistory.reduce((sum, r) => sum + r.duration, 0) / totalRuns;

    const lastRun = this.cleanupHistory[0] || null;
    const lastSuccessfulRun = this.cleanupHistory.find(r => r.success) || null;

    return {
      totalRuns,
      successfulRuns,
      failedRuns,
      successRate: Math.round(successRate * 100) / 100,
      totalKeysDeleted,
      totalErrors,
      averageDuration: Math.round(averageDuration),
      lastRun,
      lastSuccessfulRun
    };
  }

  /**
   * Check if cleanup service is running
   */
  isServiceRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Force immediate cleanup execution
   */
  async forceCleanup(): Promise<CleanupResult> {
    console.log('🔧 Forcing immediate cleanup execution...');

    const startTime = Date.now();

    try {
      const result = await DataExpirationManager.cleanupExpiredData();
      const duration = Date.now() - startTime;

      const cleanupResult: CleanupResult = {
        timestamp: new Date(),
        success: true,
        deletedKeys: result.deletedKeys,
        errors: result.errors,
        duration,
        attempt: 1,
        forced: true
      };

      this.addToHistory(cleanupResult);

      console.log(`✅ Forced cleanup completed in ${duration}ms`);
      return cleanupResult;

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      const cleanupResult: CleanupResult = {
        timestamp: new Date(),
        success: false,
        deletedKeys: 0,
        errors: 1,
        duration,
        attempt: 1,
        forced: true,
        error: errorMessage
      };

      this.addToHistory(cleanupResult);

      console.error(`❌ Forced cleanup failed: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get service status
   */
  getStatus(): ServiceStatus {
    const stats = this.getStatistics();
    const recentFailures = this.cleanupHistory
      .slice(0, 5)
      .filter(r => !r.success).length;

    let health: 'healthy' | 'warning' | 'error' = 'healthy';

    if (!this.isRunning) {
      health = 'error';
    } else if (recentFailures >= 3 || stats.successRate < 80) {
      health = 'warning';
    }

    return {
      isRunning: this.isRunning,
      health,
      statistics: stats,
      recentFailures,
      nextCleanupEstimate: this.getNextCleanupEstimate()
    };
  }

  /**
   * Estimate when the next cleanup will run
   */
  private getNextCleanupEstimate(): Date | null {
    if (!this.isRunning || !this.cleanupHistory.length) {
      return null;
    }

    const lastRun = this.cleanupHistory[0];
    if (!lastRun) {
      return null;
    }
    
    const intervalMs = this.defaultIntervalHours * 60 * 60 * 1000;
    
    return new Date(lastRun.timestamp.getTime() + intervalMs);
  }

  /**
   * Utility method for delays
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup service configuration
   */
  configure(options: {
    intervalHours?: number;
    maxHistoryEntries?: number;
    retryAttempts?: number;
    retryDelayMs?: number;
  }): void {
    if (this.isRunning) {
      throw new Error('Cannot configure service while it is running. Stop the service first.');
    }

    if (options.intervalHours !== undefined) {
      if (options.intervalHours <= 0) {
        throw new Error('Interval hours must be positive');
      }
      (this as any).defaultIntervalHours = options.intervalHours;
    }

    if (options.maxHistoryEntries !== undefined) {
      if (options.maxHistoryEntries <= 0) {
        throw new Error('Max history entries must be positive');
      }
      (this as any).maxHistoryEntries = options.maxHistoryEntries;
    }

    if (options.retryAttempts !== undefined) {
      if (options.retryAttempts <= 0) {
        throw new Error('Retry attempts must be positive');
      }
      (this as any).retryAttempts = options.retryAttempts;
    }

    if (options.retryDelayMs !== undefined) {
      if (options.retryDelayMs <= 0) {
        throw new Error('Retry delay must be positive');
      }
      (this as any).retryDelayMs = options.retryDelayMs;
    }

    console.log('⚙️ Cleanup service configuration updated');
  }
}

/**
 * Type definitions
 */
interface CleanupResult {
  timestamp: Date;
  success: boolean;
  deletedKeys: number;
  errors: number;
  duration: number;
  attempt: number;
  forced?: boolean;
  error?: string;
}

interface CleanupStatistics {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  successRate: number;
  totalKeysDeleted: number;
  totalErrors: number;
  averageDuration: number;
  lastRun: CleanupResult | null;
  lastSuccessfulRun: CleanupResult | null;
}

interface ServiceStatus {
  isRunning: boolean;
  health: 'healthy' | 'warning' | 'error';
  statistics: CleanupStatistics;
  recentFailures: number;
  nextCleanupEstimate: Date | null;
}

// Export types for external use
export type { CleanupResult, CleanupStatistics, ServiceStatus };