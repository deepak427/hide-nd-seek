/**
 * Configuration Loader Service - Devvit Compatible
 * 
 * Simplified configuration loader that works in Devvit's serverless environment
 * without Node.js filesystem access.
 */

import { loadConfig, AppConfig, Environment } from './environment';

export class ConfigLoader {
  private static instance: ConfigLoader;
  private config: AppConfig | null = null;

  private constructor() {
    // No filesystem operations in constructor
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  /**
   * Initialize configuration
   */
  public initialize(_environment?: Environment): AppConfig {
    // Load and validate configuration using environment variables only
    this.config = loadConfig();
    
    console.log(`Configuration initialized for environment: ${this.config.environment}`);
    
    return this.config;
  }

  /**
   * Get current configuration
   */
  public getConfig(): AppConfig {
    if (!this.config) {
      return this.initialize();
    }
    return this.config;
  }

  /**
   * Reload configuration (useful for testing or runtime changes)
   */
  public reload(_environment?: Environment): AppConfig {
    this.config = null;
    return this.initialize(_environment);
  }

  /**
   * Get configuration value by path
   */
  public getValue<T>(path: string): T | undefined {
    const config = this.getConfig();
    const keys = path.split('.');
    let current: any = config;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }

    return current as T;
  }

  /**
   * Check if configuration is loaded
   */
  public isLoaded(): boolean {
    return this.config !== null;
  }

  /**
   * Get environment name
   */
  public getEnvironment(): Environment {
    return this.getConfig().environment;
  }

  /**
   * Check if running in development mode
   */
  public isDevelopment(): boolean {
    return this.getEnvironment() === 'development';
  }

  /**
   * Check if running in production mode
   */
  public isProduction(): boolean {
    return this.getEnvironment() === 'production';
  }

  /**
   * Check if running in test mode
   */
  public isTest(): boolean {
    return this.getEnvironment() === 'test';
  }

  /**
   * Get configuration summary for logging
   */
  public getConfigSummary(): Record<string, any> {
    const config = this.getConfig();
    
    return {
      environment: config.environment,
      server: {
        port: config.server.port,
        host: config.server.host,
      },
      database: {
        host: config.database.host,
        port: config.database.port,
        database: config.database.database,
        keyPrefix: config.database.keyPrefix,
      },
      features: config.features,
      monitoring: {
        logLevel: config.monitoring.logLevel,
        enableErrorTracking: config.monitoring.enableErrorTracking,
        enablePerformanceMonitoring: config.monitoring.enablePerformanceMonitoring,
      },
    };
  }

  /**
   * Validate configuration at runtime
   */
  public validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    try {
      const config = this.getConfig();
      
      // Validate feature flag combinations
      if (config.features.enableUserAnalytics && !config.monitoring.enableAnalytics) {
        errors.push('User analytics requires analytics monitoring to be enabled');
      }
      
      if (config.features.enablePerformanceMetrics && !config.monitoring.enablePerformanceMonitoring) {
        errors.push('Performance metrics require performance monitoring to be enabled');
      }
      
      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      errors.push(`Configuration validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        isValid: false,
        errors,
      };
    }
  }
}

/**
 * Global configuration instance
 */
export const config = ConfigLoader.getInstance();

/**
 * Convenience function to get configuration
 */
export function getConfig(): AppConfig {
  return config.getConfig();
}

/**
 * Convenience function to get configuration value
 */
export function getConfigValue<T>(path: string): T | undefined {
  return config.getValue<T>(path);
}

/**
 * Initialize configuration with environment detection
 */
export function initializeConfig(environment?: Environment): AppConfig {
  return config.initialize(environment);
}