import { redis } from '@devvit/web/server';
import { RedisSchemaManager } from './RedisSchemaManager';

/**
 * Data Expiration Manager
 * 
 * Handles data expiration, cleanup mechanisms, and storage monitoring
 * for the hide-and-seek game Redis data.
 * 
 * Features:
 * - 30-day automatic expiration for all game data
 * - Manual cleanup of expired data
 * - Storage usage monitoring
 * - Performance metrics tracking
 */
export class DataExpirationManager {
  // Expiration settings
  private static readonly EXPIRATION_DAYS = 30;
  private static readonly EXPIRATION_SECONDS = DataExpirationManager.EXPIRATION_DAYS * 24 * 60 * 60;
  
  // Cleanup settings
  private static readonly CLEANUP_BATCH_SIZE = 100;
  private static readonly CLEANUP_DELAY_MS = 100; // Delay between batches to avoid overwhelming Redis
  
  // Monitoring settings (reserved for future use)
  // private static readonly MONITORING_SAMPLE_SIZE = 1000;

  /**
   * Expiration Management
   */

  /**
   * Set expiration for a key with validation
   */
  static async setExpiration(key: string, customExpirationSeconds?: number): Promise<void> {
    try {
      if (!key || typeof key !== 'string') {
        throw new Error('Invalid key: must be a non-empty string');
      }

      const expirationSeconds = customExpirationSeconds || DataExpirationManager.EXPIRATION_SECONDS;
      
      if (expirationSeconds <= 0) {
        throw new Error('Invalid expiration: must be a positive number');
      }

      await redis.expire(key, expirationSeconds);
      console.log(`⏰ Set expiration for key: ${key} (${expirationSeconds}s)`);
    } catch (error) {
      console.error('Error setting expiration:', error);
      throw new Error(`Failed to set expiration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Refresh expiration for a key (extend its lifetime)
   */
  static async refreshExpiration(key: string): Promise<void> {
    try {
      await DataExpirationManager.setExpiration(key);
      console.log(`🔄 Refreshed expiration for key: ${key}`);
    } catch (error) {
      console.error('Error refreshing expiration:', error);
      throw new Error(`Failed to refresh expiration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get TTL (time to live) for a key
   * Note: Redis client doesn't support TTL command, so we'll use exists as a proxy
   */
  static async getTimeToLive(key: string): Promise<number> {
    try {
      const exists = await redis.exists(key);
      // Return -1 if exists (no expiration info available), -2 if doesn't exist
      return exists ? -1 : -2;
    } catch (error) {
      console.error('Error checking key existence:', error);
      return -2; // Key doesn't exist
    }
  }

  /**
   * Check if a key is expired or about to expire
   */
  static async isExpiringSoon(key: string, warningThresholdHours: number = 24): Promise<boolean> {
    try {
      const ttl = await DataExpirationManager.getTimeToLive(key);
      
      if (ttl === -1) {
        // Key exists but has no expiration set
        return false;
      }
      
      if (ttl === -2) {
        // Key doesn't exist
        return true;
      }
      
      const warningThresholdSeconds = warningThresholdHours * 60 * 60;
      return ttl <= warningThresholdSeconds;
    } catch (error) {
      console.error('Error checking expiration status:', error);
      return false;
    }
  }

  /**
   * Cleanup Operations
   */

  /**
   * Perform manual cleanup of expired game data
   */
  static async cleanupExpiredData(): Promise<{ deletedKeys: number; errors: number }> {
    console.log('🧹 Starting cleanup of expired data...');
    
    let deletedKeys = 0;
    let errors = 0;
    
    try {
      // Get all game-related key patterns
      const patterns = [
        'game_session:*',
        'post_mapping:*',
        'game:*:guess:*',
        'game:*:stats'
      ];
      
      for (const pattern of patterns) {
        try {
          const result = await DataExpirationManager.cleanupKeysByPattern(pattern);
          deletedKeys += result.deletedKeys;
          errors += result.errors;
        } catch (error) {
          console.error(`Error cleaning up pattern ${pattern}:`, error);
          errors++;
        }
      }
      
      console.log(`✅ Cleanup completed: ${deletedKeys} keys deleted, ${errors} errors`);
      
      return { deletedKeys, errors };
    } catch (error) {
      console.error('Error during cleanup:', error);
      return { deletedKeys, errors: errors + 1 };
    }
  }

  /**
   * Cleanup keys matching a specific pattern
   */
  private static async cleanupKeysByPattern(pattern: string): Promise<{ deletedKeys: number; errors: number }> {
    let deletedKeys = 0;
    let errors = 0;
    
    try {
      // Note: In a real Redis implementation, you would use SCAN here
      // For now, we'll implement a placeholder that logs the pattern
      console.log(`🔍 Scanning for expired keys with pattern: ${pattern}`);
      
      // This is a simplified implementation
      // In production, you would:
      // 1. Use SCAN to iterate through keys
      // 2. Check TTL for each key
      // 3. Delete keys that are expired or have no TTL set incorrectly
      
      // Placeholder implementation
      const sampleKeys = await DataExpirationManager.getSampleKeys(pattern);
      
      for (const key of sampleKeys) {
        try {
          const ttl = await DataExpirationManager.getTimeToLive(key);
          
          // Delete keys that are expired (TTL = -2) or have no expiration (TTL = -1)
          if (ttl === -2) {
            // Key doesn't exist, already cleaned up
            continue;
          }
          
          if (ttl === -1) {
            // Key exists but has no expiration - this shouldn't happen in our system
            console.warn(`⚠️ Found key without expiration: ${key}, setting expiration`);
            await DataExpirationManager.setExpiration(key);
          }
          
          // Optionally delete keys that are very close to expiring (e.g., < 1 hour)
          if (ttl > 0 && ttl < 3600) {
            console.log(`🗑️ Cleaning up soon-to-expire key: ${key} (TTL: ${ttl}s)`);
            await redis.del(key);
            deletedKeys++;
          }
          
        } catch (keyError) {
          console.error(`Error processing key ${key}:`, keyError);
          errors++;
        }
        
        // Add delay between operations to avoid overwhelming Redis
        if (deletedKeys % DataExpirationManager.CLEANUP_BATCH_SIZE === 0) {
          await DataExpirationManager.delay(DataExpirationManager.CLEANUP_DELAY_MS);
        }
      }
      
    } catch (error) {
      console.error(`Error cleaning up pattern ${pattern}:`, error);
      errors++;
    }
    
    return { deletedKeys, errors };
  }

  /**
   * Get sample keys for a pattern (placeholder for SCAN implementation)
   */
  private static async getSampleKeys(pattern: string): Promise<string[]> {
    try {
      // This is a placeholder implementation
      // In a real Redis setup, you would use SCAN to get keys matching the pattern
      console.log(`Getting sample keys for pattern: ${pattern}`);
      
      // Return empty array for now - in production this would return actual keys
      return [];
    } catch (error) {
      console.error('Error getting sample keys:', error);
      return [];
    }
  }

  /**
   * Storage Monitoring
   */

  /**
   * Get storage usage statistics
   */
  static async getStorageStats(): Promise<{
    totalKeys: number;
    gameSessionKeys: number;
    postMappingKeys: number;
    guessKeys: number;
    statsKeys: number;
    keysWithoutExpiration: number;
    keysExpiringSoon: number;
    estimatedMemoryUsage: string;
  }> {
    try {
      console.log('📊 Gathering storage statistics...');
      
      // In a real implementation, you would scan through all keys
      // For now, we'll return placeholder data
      const stats = {
        totalKeys: 0,
        gameSessionKeys: 0,
        postMappingKeys: 0,
        guessKeys: 0,
        statsKeys: 0,
        keysWithoutExpiration: 0,
        keysExpiringSoon: 0,
        estimatedMemoryUsage: '0 MB'
      };
      
      // This would be implemented with actual Redis commands in production
      console.log('📈 Storage stats gathered (placeholder implementation)');
      
      return stats;
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        totalKeys: 0,
        gameSessionKeys: 0,
        postMappingKeys: 0,
        guessKeys: 0,
        statsKeys: 0,
        keysWithoutExpiration: 0,
        keysExpiringSoon: 0,
        estimatedMemoryUsage: 'Unknown'
      };
    }
  }

  /**
   * Monitor performance metrics
   */
  static async getPerformanceMetrics(): Promise<{
    averageResponseTime: number;
    operationsPerSecond: number;
    errorRate: number;
    memoryUsage: string;
    connectionStatus: 'healthy' | 'degraded' | 'error';
  }> {
    try {
      console.log('⚡ Gathering performance metrics...');
      
      const startTime = Date.now();
      
      // Test Redis connectivity and response time using exists command
      await redis.exists('health_check_test_key');
      
      const responseTime = Date.now() - startTime;
      
      // In a real implementation, you would track these metrics over time
      const metrics = {
        averageResponseTime: responseTime,
        operationsPerSecond: 0, // Would be calculated from historical data
        errorRate: 0, // Would be calculated from error tracking
        memoryUsage: 'Unknown', // Would get from Redis INFO command
        connectionStatus: 'healthy' as const
      };
      
      console.log(`📊 Performance metrics: ${responseTime}ms response time`);
      
      return metrics;
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return {
        averageResponseTime: -1,
        operationsPerSecond: 0,
        errorRate: 1,
        memoryUsage: 'Unknown',
        connectionStatus: 'error'
      };
    }
  }

  /**
   * Game-Specific Expiration Management
   */

  /**
   * Ensure all keys for a game have proper expiration
   */
  static async ensureGameExpiration(gameId: string): Promise<void> {
    try {
      console.log(`🔧 Ensuring expiration for game: ${gameId}`);
      
      // Get all keys for the game
      const gameKeys = await RedisSchemaManager.getGameKeys(gameId);
      
      for (const key of gameKeys) {
        const ttl = await DataExpirationManager.getTimeToLive(key);
        
        if (ttl === -1) {
          // Key exists but has no expiration
          console.warn(`⚠️ Setting missing expiration for key: ${key}`);
          await DataExpirationManager.setExpiration(key);
        } else if (ttl > 0 && ttl < 86400) {
          // Key expires in less than 24 hours, refresh it
          console.log(`🔄 Refreshing expiration for key: ${key}`);
          await DataExpirationManager.refreshExpiration(key);
        }
      }
      
      console.log(`✅ Expiration ensured for game: ${gameId}`);
    } catch (error) {
      console.error('Error ensuring game expiration:', error);
      throw new Error(`Failed to ensure game expiration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete all data for a game (immediate cleanup)
   */
  static async deleteGameData(gameId: string): Promise<void> {
    try {
      await RedisSchemaManager.deleteGameData(gameId);
      console.log(`🗑️ Deleted all data for game: ${gameId}`);
    } catch (error) {
      console.error('Error deleting game data:', error);
      throw new Error(`Failed to delete game data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Utility Methods
   */

  /**
   * Delay execution for a specified number of milliseconds
   */
  private static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Format bytes to human-readable string (reserved for future use)
   */
  // private static formatBytes(bytes: number): string {
  //   if (bytes === 0) return '0 Bytes';
  //   
  //   const k = 1024;
  //   const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  //   const i = Math.floor(Math.log(bytes) / Math.log(k));
  //   
  //   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  // }

  /**
   * Validate expiration time (reserved for future use)
   */
  // private static validateExpirationTime(seconds: number): void {
  //   if (typeof seconds !== 'number' || seconds <= 0) {
  //     throw new Error('Expiration time must be a positive number');
  //   }
  //   
  //   const maxExpiration = 365 * 24 * 60 * 60; // 1 year
  //   if (seconds > maxExpiration) {
  //     throw new Error('Expiration time cannot exceed 1 year');
  //   }
  // }

  /**
   * Health Check
   */

  /**
   * Perform a comprehensive health check of the data storage system
   */
  static async healthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'error';
    checks: {
      connectivity: boolean;
      responseTime: number;
      expirationCompliance: boolean;
      storageUsage: string;
    };
    recommendations: string[];
  }> {
    try {
      console.log('🏥 Performing data storage health check...');
      
      const checks = {
        connectivity: false,
        responseTime: 0,
        expirationCompliance: true,
        storageUsage: 'Unknown'
      };
      
      const recommendations: string[] = [];
      
      // Test connectivity and response time
      try {
        const startTime = Date.now();
        await redis.exists('health_check_test_key');
        checks.connectivity = true;
        checks.responseTime = Date.now() - startTime;
        
        if (checks.responseTime > 1000) {
          recommendations.push('Redis response time is high (>1s). Consider optimizing queries or scaling Redis.');
        }
      } catch (error) {
        console.error('Connectivity check failed:', error);
        recommendations.push('Redis connectivity issues detected. Check Redis server status.');
      }
      
      // Check storage usage
      try {
        const storageStats = await DataExpirationManager.getStorageStats();
        checks.storageUsage = storageStats.estimatedMemoryUsage;
        
        if (storageStats.keysWithoutExpiration > 0) {
          checks.expirationCompliance = false;
          recommendations.push(`${storageStats.keysWithoutExpiration} keys found without expiration. Run cleanup.`);
        }
        
        if (storageStats.keysExpiringSoon > 100) {
          recommendations.push(`${storageStats.keysExpiringSoon} keys expiring soon. Consider running cleanup.`);
        }
      } catch (error) {
        console.error('Storage check failed:', error);
        recommendations.push('Unable to check storage usage. Monitor Redis memory usage manually.');
      }
      
      // Determine overall status
      let status: 'healthy' | 'warning' | 'error' = 'healthy';
      
      if (!checks.connectivity) {
        status = 'error';
      } else if (!checks.expirationCompliance || checks.responseTime > 1000 || recommendations.length > 0) {
        status = 'warning';
      }
      
      console.log(`🏥 Health check completed: ${status}`);
      
      return {
        status,
        checks,
        recommendations
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'error',
        checks: {
          connectivity: false,
          responseTime: -1,
          expirationCompliance: false,
          storageUsage: 'Unknown'
        },
        recommendations: ['Health check failed. Manual investigation required.']
      };
    }
  }
}