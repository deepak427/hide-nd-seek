import { ScheduledCleanupService } from './ScheduledCleanupService';
import { DataExpirationManager } from './DataExpirationManager';

/**
 * Storage Initializer
 * 
 * Handles initialization of the storage system including:
 * - Starting scheduled cleanup services
 * - Performing initial health checks
 * - Setting up monitoring
 */
export class StorageInitializer {
  private static initialized = false;
  private static cleanupService: ScheduledCleanupService | null = null;

  /**
   * Initialize the storage system
   */
  static async initialize(options?: {
    enableScheduledCleanup?: boolean;
    cleanupIntervalHours?: number;
    performInitialHealthCheck?: boolean;
  }): Promise<void> {
    if (StorageInitializer.initialized) {
      console.log('⚠️ Storage system already initialized');
      return;
    }

    console.log('🚀 Initializing storage system...');

    const config = {
      enableScheduledCleanup: true,
      cleanupIntervalHours: 24,
      performInitialHealthCheck: true,
      ...options
    };

    try {
      // Perform initial health check
      if (config.performInitialHealthCheck) {
        await StorageInitializer.performInitialHealthCheck();
      }

      // Start scheduled cleanup service
      if (config.enableScheduledCleanup) {
        StorageInitializer.cleanupService = ScheduledCleanupService.getInstance();
        StorageInitializer.cleanupService.start(config.cleanupIntervalHours);
        console.log(`✅ Scheduled cleanup service started (${config.cleanupIntervalHours}h interval)`);
      }

      StorageInitializer.initialized = true;
      console.log('✅ Storage system initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize storage system:', error);
      throw new Error(`Storage initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Shutdown the storage system
   */
  static async shutdown(): Promise<void> {
    if (!StorageInitializer.initialized) {
      console.log('⚠️ Storage system not initialized');
      return;
    }

    console.log('🛑 Shutting down storage system...');

    try {
      // Stop cleanup service
      if (StorageInitializer.cleanupService) {
        StorageInitializer.cleanupService.stop();
        console.log('✅ Scheduled cleanup service stopped');
      }

      StorageInitializer.initialized = false;
      StorageInitializer.cleanupService = null;

      console.log('✅ Storage system shutdown complete');

    } catch (error) {
      console.error('❌ Error during storage system shutdown:', error);
      throw new Error(`Storage shutdown failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform initial health check
   */
  private static async performInitialHealthCheck(): Promise<void> {
    console.log('🏥 Performing initial storage health check...');

    try {
      const healthResult = await DataExpirationManager.healthCheck();

      console.log(`🏥 Health check status: ${healthResult.status}`);
      console.log(`🔗 Connectivity: ${healthResult.checks.connectivity ? '✅' : '❌'}`);
      console.log(`⚡ Response time: ${healthResult.checks.responseTime}ms`);
      console.log(`⏰ Expiration compliance: ${healthResult.checks.expirationCompliance ? '✅' : '⚠️'}`);
      console.log(`💾 Storage usage: ${healthResult.checks.storageUsage}`);

      if (healthResult.recommendations.length > 0) {
        console.log('📋 Recommendations:');
        healthResult.recommendations.forEach((rec, index) => {
          console.log(`   ${index + 1}. ${rec}`);
        });
      }

      if (healthResult.status === 'error') {
        throw new Error('Storage health check failed - system not ready');
      }

      if (healthResult.status === 'warning') {
        console.warn('⚠️ Storage health check passed with warnings');
      }

    } catch (error) {
      console.error('❌ Initial health check failed:', error);
      throw error;
    }
  }

  /**
   * Get initialization status
   */
  static isInitialized(): boolean {
    return StorageInitializer.initialized;
  }

  /**
   * Get cleanup service instance
   */
  static getCleanupService(): ScheduledCleanupService | null {
    return StorageInitializer.cleanupService;
  }

  /**
   * Force cleanup execution
   */
  static async forceCleanup(): Promise<void> {
    if (!StorageInitializer.cleanupService) {
      throw new Error('Cleanup service not initialized');
    }

    console.log('🔧 Forcing cleanup execution...');
    await StorageInitializer.cleanupService.forceCleanup();
  }

  /**
   * Get storage system status
   */
  static async getSystemStatus(): Promise<{
    initialized: boolean;
    cleanupService: any;
    healthCheck: any;
  }> {
    const status = {
      initialized: StorageInitializer.initialized,
      cleanupService: null as any,
      healthCheck: null as any
    };

    // Get cleanup service status
    if (StorageInitializer.cleanupService) {
      status.cleanupService = StorageInitializer.cleanupService.getStatus();
    }

    // Perform health check
    try {
      status.healthCheck = await DataExpirationManager.healthCheck();
    } catch (error) {
      status.healthCheck = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    return status;
  }

  /**
   * Reconfigure cleanup service
   */
  static reconfigureCleanup(options: {
    intervalHours?: number;
    maxHistoryEntries?: number;
    retryAttempts?: number;
    retryDelayMs?: number;
  }): void {
    if (!StorageInitializer.cleanupService) {
      throw new Error('Cleanup service not initialized');
    }

    const wasRunning = StorageInitializer.cleanupService.isServiceRunning();
    
    if (wasRunning) {
      StorageInitializer.cleanupService.stop();
    }

    StorageInitializer.cleanupService.configure(options);

    if (wasRunning) {
      StorageInitializer.cleanupService.start(options.intervalHours);
    }

    console.log('⚙️ Cleanup service reconfigured');
  }

  /**
   * Get storage performance metrics
   */
  static async getPerformanceMetrics(): Promise<any> {
    try {
      return await DataExpirationManager.getPerformanceMetrics();
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get storage usage statistics
   */
  static async getStorageStatistics(): Promise<any> {
    try {
      return await DataExpirationManager.getStorageStats();
    } catch (error) {
      console.error('Error getting storage statistics:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}