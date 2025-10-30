/**
 * Feature Flags Service
 * 
 * Provides runtime feature flag management with gradual rollout capabilities
 * and A/B testing support.
 */

import { getConfig } from './ConfigLoader';
import { FeatureFlags as FeatureFlagsConfig } from './environment';

export interface FeatureRollout {
  enabled: boolean;
  percentage: number; // 0-100
  userGroups?: string[];
  startDate?: Date;
  endDate?: Date;
}

export interface FeatureContext {
  userId?: string;
  userGroup?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export class FeatureFlagsService {
  private static instance: FeatureFlagsService;
  private rolloutConfig: Map<keyof FeatureFlagsConfig, FeatureRollout> = new Map();
  private overrides: Map<string, Partial<FeatureFlagsConfig>> = new Map();

  private constructor() {
    this.initializeRollouts();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): FeatureFlagsService {
    if (!FeatureFlagsService.instance) {
      FeatureFlagsService.instance = new FeatureFlagsService();
    }
    return FeatureFlagsService.instance;
  }

  /**
   * Initialize default rollout configurations
   */
  private initializeRollouts(): void {
    // Example rollout configurations
    this.rolloutConfig.set('enableUserAnalytics', {
      enabled: true,
      percentage: 50, // 50% rollout
      startDate: new Date('2024-01-01'),
    });

    this.rolloutConfig.set('enableCaching', {
      enabled: true,
      percentage: 25, // 25% rollout
      userGroups: ['beta', 'premium'],
    });

    this.rolloutConfig.set('enablePerformanceMetrics', {
      enabled: true,
      percentage: 100, // Full rollout
    });
  }

  /**
   * Check if a feature is enabled for a given context
   */
  public isEnabled(
    feature: keyof FeatureFlagsConfig,
    context?: FeatureContext
  ): boolean {
    // Check for user-specific overrides first
    if (context?.userId) {
      const userOverride = this.overrides.get(context.userId);
      if (userOverride && feature in userOverride) {
        return userOverride[feature] as boolean;
      }
    }

    // Get base configuration
    const config = getConfig();
    const baseEnabled = config.features[feature] as boolean;

    // If feature is disabled in base config, respect that
    if (!baseEnabled) {
      return false;
    }

    // Check rollout configuration
    const rollout = this.rolloutConfig.get(feature);
    if (!rollout) {
      return baseEnabled;
    }

    // Check if rollout is enabled
    if (!rollout.enabled) {
      return false;
    }

    // Check date range
    const now = context?.timestamp || new Date();
    if (rollout.startDate && now < rollout.startDate) {
      return false;
    }
    if (rollout.endDate && now > rollout.endDate) {
      return false;
    }

    // Check user group restrictions
    if (rollout.userGroups && context?.userGroup) {
      if (!rollout.userGroups.includes(context.userGroup)) {
        return false;
      }
    }

    // Check percentage rollout
    if (rollout.percentage < 100 && context?.userId) {
      const hash = this.hashUserId(context.userId, feature);
      const userPercentile = hash % 100;
      return userPercentile < rollout.percentage;
    }

    return rollout.percentage === 100;
  }

  /**
   * Hash user ID for consistent percentage-based rollouts
   */
  private hashUserId(userId: string, feature: keyof FeatureFlagsConfig): number {
    const str = `${userId}:${feature}`;
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash);
  }

  /**
   * Set user-specific feature override
   */
  public setUserOverride(
    userId: string,
    overrides: Partial<FeatureFlagsConfig>
  ): void {
    this.overrides.set(userId, overrides);
  }

  /**
   * Remove user-specific feature override
   */
  public removeUserOverride(userId: string): void {
    this.overrides.delete(userId);
  }

  /**
   * Update rollout configuration for a feature
   */
  public updateRollout(
    feature: keyof FeatureFlagsConfig,
    rollout: FeatureRollout
  ): void {
    this.rolloutConfig.set(feature, rollout);
  }

  /**
   * Get current rollout status for a feature
   */
  public getRolloutStatus(feature: keyof FeatureFlagsConfig): FeatureRollout | null {
    return this.rolloutConfig.get(feature) || null;
  }

  /**
   * Get all enabled features for a context
   */
  public getEnabledFeatures(context?: FeatureContext): Partial<FeatureFlagsConfig> {
    const config = getConfig();
    const enabled: Partial<FeatureFlagsConfig> = {};

    for (const feature in config.features) {
      const featureKey = feature as keyof FeatureFlagsConfig;
      enabled[featureKey] = this.isEnabled(featureKey, context) as any;
    }

    return enabled;
  }

  /**
   * Get feature flag statistics
   */
  public getStatistics(): {
    totalFeatures: number;
    enabledFeatures: number;
    rolloutsActive: number;
    userOverrides: number;
  } {
    const config = getConfig();
    const totalFeatures = Object.keys(config.features).length;
    const enabledFeatures = Object.values(config.features).filter(Boolean).length;
    const rolloutsActive = this.rolloutConfig.size;
    const userOverrides = this.overrides.size;

    return {
      totalFeatures,
      enabledFeatures,
      rolloutsActive,
      userOverrides,
    };
  }

  /**
   * Export configuration for debugging
   */
  public exportConfig(): {
    baseConfig: FeatureFlagsConfig;
    rollouts: Record<string, FeatureRollout>;
    overrides: Record<string, Partial<FeatureFlagsConfig>>;
  } {
    const config = getConfig();
    
    return {
      baseConfig: config.features,
      rollouts: Object.fromEntries(this.rolloutConfig.entries()),
      overrides: Object.fromEntries(this.overrides.entries()),
    };
  }

  /**
   * Reset all rollouts and overrides (useful for testing)
   */
  public reset(): void {
    this.rolloutConfig.clear();
    this.overrides.clear();
    this.initializeRollouts();
  }
}

/**
 * Global feature flags instance
 */
export const featureFlags = FeatureFlagsService.getInstance();

/**
 * Convenience function to check if a feature is enabled
 */
export function isFeatureEnabled(
  feature: keyof FeatureFlagsConfig,
  context?: FeatureContext
): boolean {
  return featureFlags.isEnabled(feature, context);
}

/**
 * Convenience function to get all enabled features
 */
export function getEnabledFeatures(context?: FeatureContext): Partial<FeatureFlagsConfig> {
  return featureFlags.getEnabledFeatures(context);
}

/**
 * Create feature context from user information
 */
export function createFeatureContext(
  userId?: string,
  userGroup?: string,
  metadata?: Record<string, any>
): FeatureContext {
  return {
    userId,
    userGroup,
    timestamp: new Date(),
    metadata,
  };
}