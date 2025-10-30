/**
 * Environment Configuration Management
 * 
 * Provides centralized configuration management for different environments
 * with type safety and validation.
 */

export type Environment = 'development' | 'production' | 'test';

export interface DatabaseConfig {
  host: string;
  port: number;
  password?: string;
  database: number;
  keyPrefix: string;
  maxRetries: number;
  retryDelayMs: number;
  connectionTimeout: number;
}

export interface RedditConfig {
  maxRetries: number;
  retryDelayMs: number;
  baseDelay: number;
  maxDelay: number;
  timeout: number;
}

export interface ServerConfig {
  port: number;
  host: string;
  corsOrigins: string[];
  requestTimeout: number;
  bodyLimit: string;
}

export interface StorageConfig {
  dataExpirationDays: number;
  cleanupIntervalHours: number;
  enableScheduledCleanup: boolean;
  performInitialHealthCheck: boolean;
  maxGuessesPerUser: number;
  rateLimitWindowMs: number;
}

export interface MonitoringConfig {
  enableErrorTracking: boolean;
  enablePerformanceMonitoring: boolean;
  enableAnalytics: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  metricsCollectionInterval: number;
}

export interface FeatureFlags {
  enableGuessDashboard: boolean;
  enableRateLimiting: boolean;
  enableDataCleanup: boolean;
  enablePerformanceMetrics: boolean;
  enableUserAnalytics: boolean;
  enableAdvancedErrorHandling: boolean;
  enableCaching: boolean;
  maxConcurrentGames: number;
}

export interface AppConfig {
  environment: Environment;
  database: DatabaseConfig;
  reddit: RedditConfig;
  server: ServerConfig;
  storage: StorageConfig;
  monitoring: MonitoringConfig;
  features: FeatureFlags;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: AppConfig = {
  environment: 'development',
  database: {
    host: 'localhost',
    port: 6379,
    database: 0,
    keyPrefix: 'hide_seek:',
    maxRetries: 3,
    retryDelayMs: 1000,
    connectionTimeout: 5000,
  },
  reddit: {
    maxRetries: 3,
    retryDelayMs: 1000,
    baseDelay: 1000,
    maxDelay: 10000,
    timeout: 30000,
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    corsOrigins: ['*'],
    requestTimeout: 30000,
    bodyLimit: '10mb',
  },
  storage: {
    dataExpirationDays: 30,
    cleanupIntervalHours: 24,
    enableScheduledCleanup: true,
    performInitialHealthCheck: true,
    maxGuessesPerUser: 10,
    rateLimitWindowMs: 60000,
  },
  monitoring: {
    enableErrorTracking: false,
    enablePerformanceMonitoring: false,
    enableAnalytics: false,
    logLevel: 'info',
    metricsCollectionInterval: 60000,
  },
  features: {
    enableGuessDashboard: true,
    enableRateLimiting: true,
    enableDataCleanup: true,
    enablePerformanceMetrics: false,
    enableUserAnalytics: false,
    enableAdvancedErrorHandling: true,
    enableCaching: false,
    maxConcurrentGames: 1000,
  },
};

/**
 * Environment-specific configuration overrides
 */
const ENVIRONMENT_CONFIGS: Record<Environment, Partial<AppConfig>> = {
  development: {
    monitoring: {
      enableErrorTracking: false,
      enablePerformanceMonitoring: false,
      enableAnalytics: false,
      logLevel: 'debug',
      metricsCollectionInterval: 30000,
    },
    features: {
      enablePerformanceMetrics: true,
      enableUserAnalytics: false,
      enableCaching: false,
      maxConcurrentGames: 100,
    },
    server: {
      corsOrigins: ['http://localhost:3000', 'http://localhost:5173'],
    },
  },
  production: {
    monitoring: {
      enableErrorTracking: true,
      enablePerformanceMonitoring: true,
      enableAnalytics: true,
      logLevel: 'warn',
      metricsCollectionInterval: 300000,
    },
    features: {
      enablePerformanceMetrics: true,
      enableUserAnalytics: true,
      enableCaching: true,
      maxConcurrentGames: 10000,
    },
    server: {
      corsOrigins: ['https://reddit.com', 'https://www.reddit.com'],
    },
    database: {
      maxRetries: 5,
      retryDelayMs: 2000,
      connectionTimeout: 10000,
    },
  },
  test: {
    database: {
      database: 1, // Use different Redis database for tests
      keyPrefix: 'test_hide_seek:',
    },
    storage: {
      dataExpirationDays: 1,
      cleanupIntervalHours: 1,
      enableScheduledCleanup: false,
      performInitialHealthCheck: false,
    },
    monitoring: {
      enableErrorTracking: false,
      enablePerformanceMonitoring: false,
      enableAnalytics: false,
      logLevel: 'error',
      metricsCollectionInterval: 10000,
    },
    features: {
      enablePerformanceMetrics: false,
      enableUserAnalytics: false,
      enableCaching: false,
      maxConcurrentGames: 10,
    },
  },
};

/**
 * Deep merge utility for configuration objects
 */
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] !== undefined) {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key] || {}, source[key] as any);
      } else {
        result[key] = source[key] as any;
      }
    }
  }
  
  return result;
}

/**
 * Environment variable mapping and validation
 */
function loadEnvironmentVariables(): Partial<AppConfig> {
  const env = process.env;
  
  return {
    environment: (env.NODE_ENV as Environment) || 'development',
    database: {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT ? parseInt(env.REDIS_PORT, 10) : undefined,
      password: env.REDIS_PASSWORD,
      database: env.REDIS_DATABASE ? parseInt(env.REDIS_DATABASE, 10) : undefined,
      keyPrefix: env.REDIS_KEY_PREFIX,
      maxRetries: env.REDIS_MAX_RETRIES ? parseInt(env.REDIS_MAX_RETRIES, 10) : undefined,
      retryDelayMs: env.REDIS_RETRY_DELAY ? parseInt(env.REDIS_RETRY_DELAY, 10) : undefined,
      connectionTimeout: env.REDIS_CONNECTION_TIMEOUT ? parseInt(env.REDIS_CONNECTION_TIMEOUT, 10) : undefined,
    },
    server: {
      port: env.WEBBIT_PORT ? parseInt(env.WEBBIT_PORT, 10) : env.PORT ? parseInt(env.PORT, 10) : undefined,
      host: env.SERVER_HOST,
      corsOrigins: env.CORS_ORIGINS ? env.CORS_ORIGINS.split(',') : undefined,
      requestTimeout: env.REQUEST_TIMEOUT ? parseInt(env.REQUEST_TIMEOUT, 10) : undefined,
      bodyLimit: env.BODY_LIMIT,
    },
    storage: {
      dataExpirationDays: env.DATA_EXPIRATION_DAYS ? parseInt(env.DATA_EXPIRATION_DAYS, 10) : undefined,
      cleanupIntervalHours: env.CLEANUP_INTERVAL_HOURS ? parseInt(env.CLEANUP_INTERVAL_HOURS, 10) : undefined,
      enableScheduledCleanup: env.ENABLE_SCHEDULED_CLEANUP ? env.ENABLE_SCHEDULED_CLEANUP === 'true' : undefined,
      performInitialHealthCheck: env.PERFORM_INITIAL_HEALTH_CHECK ? env.PERFORM_INITIAL_HEALTH_CHECK === 'true' : undefined,
      maxGuessesPerUser: env.MAX_GUESSES_PER_USER ? parseInt(env.MAX_GUESSES_PER_USER, 10) : undefined,
      rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS ? parseInt(env.RATE_LIMIT_WINDOW_MS, 10) : undefined,
    },
    monitoring: {
      enableErrorTracking: env.ENABLE_ERROR_TRACKING ? env.ENABLE_ERROR_TRACKING === 'true' : undefined,
      enablePerformanceMonitoring: env.ENABLE_PERFORMANCE_MONITORING ? env.ENABLE_PERFORMANCE_MONITORING === 'true' : undefined,
      enableAnalytics: env.ENABLE_ANALYTICS ? env.ENABLE_ANALYTICS === 'true' : undefined,
      logLevel: env.LOG_LEVEL as any,
      metricsCollectionInterval: env.METRICS_COLLECTION_INTERVAL ? parseInt(env.METRICS_COLLECTION_INTERVAL, 10) : undefined,
    },
    features: {
      enableGuessDashboard: env.ENABLE_GUESS_DASHBOARD ? env.ENABLE_GUESS_DASHBOARD === 'true' : undefined,
      enableRateLimiting: env.ENABLE_RATE_LIMITING ? env.ENABLE_RATE_LIMITING === 'true' : undefined,
      enableDataCleanup: env.ENABLE_DATA_CLEANUP ? env.ENABLE_DATA_CLEANUP === 'true' : undefined,
      enablePerformanceMetrics: env.ENABLE_PERFORMANCE_METRICS ? env.ENABLE_PERFORMANCE_METRICS === 'true' : undefined,
      enableUserAnalytics: env.ENABLE_USER_ANALYTICS ? env.ENABLE_USER_ANALYTICS === 'true' : undefined,
      enableAdvancedErrorHandling: env.ENABLE_ADVANCED_ERROR_HANDLING ? env.ENABLE_ADVANCED_ERROR_HANDLING === 'true' : undefined,
      enableCaching: env.ENABLE_CACHING ? env.ENABLE_CACHING === 'true' : undefined,
      maxConcurrentGames: env.MAX_CONCURRENT_GAMES ? parseInt(env.MAX_CONCURRENT_GAMES, 10) : undefined,
    },
  };
}

/**
 * Configuration validation
 */
function validateConfig(config: AppConfig): void {
  const errors: string[] = [];
  
  // Validate database config
  if (config.database.port < 1 || config.database.port > 65535) {
    errors.push('Database port must be between 1 and 65535');
  }
  
  if (config.database.database < 0 || config.database.database > 15) {
    errors.push('Redis database must be between 0 and 15');
  }
  
  // Validate server config
  if (config.server.port < 1 || config.server.port > 65535) {
    errors.push('Server port must be between 1 and 65535');
  }
  
  // Validate storage config
  if (config.storage.dataExpirationDays < 1) {
    errors.push('Data expiration days must be at least 1');
  }
  
  if (config.storage.cleanupIntervalHours < 1) {
    errors.push('Cleanup interval hours must be at least 1');
  }
  
  // Validate feature flags
  if (config.features.maxConcurrentGames < 1) {
    errors.push('Max concurrent games must be at least 1');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Load and build the final configuration
 */
export function loadConfig(): AppConfig {
  const environment = (process.env.NODE_ENV as Environment) || 'development';
  
  // Start with default config
  let config = { ...DEFAULT_CONFIG };
  
  // Apply environment-specific overrides
  if (ENVIRONMENT_CONFIGS[environment]) {
    config = deepMerge(config, ENVIRONMENT_CONFIGS[environment]);
  }
  
  // Apply environment variables
  const envConfig = loadEnvironmentVariables();
  config = deepMerge(config, envConfig);
  
  // Set the final environment
  config.environment = environment;
  
  // Validate the final configuration
  validateConfig(config);
  
  return config;
}

/**
 * Get configuration for a specific environment (useful for testing)
 */
export function getConfigForEnvironment(env: Environment): AppConfig {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = env;
  
  try {
    return loadConfig();
  } finally {
    if (originalEnv) {
      process.env.NODE_ENV = originalEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  }
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags, config?: AppConfig): boolean {
  const currentConfig = config || loadConfig();
  return currentConfig.features[feature] as boolean;
}

/**
 * Get environment-specific configuration value
 */
export function getConfigValue<T extends keyof AppConfig>(
  section: T,
  config?: AppConfig
): AppConfig[T] {
  const currentConfig = config || loadConfig();
  return currentConfig[section];
}