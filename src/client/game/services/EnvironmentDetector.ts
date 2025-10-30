import { EnvironmentDetection, DevvitContext } from '../../../shared/types/environment';

/**
 * Environment Detector Service
 * Detects whether the game is running in standalone mode or embedded in Reddit
 */
export class EnvironmentDetector {
  private static instance: EnvironmentDetector;
  private cachedDetection: EnvironmentDetection | null = null;

  private constructor() {}

  public static getInstance(): EnvironmentDetector {
    if (!EnvironmentDetector.instance) {
      EnvironmentDetector.instance = new EnvironmentDetector();
    }
    return EnvironmentDetector.instance;
  }

  /**
   * Detect the current environment and return detection result
   */
  public detect(): EnvironmentDetection {
    if (this.cachedDetection) {
      return this.cachedDetection;
    }

    console.log('🔍 Detecting environment...');

    // Check for Devvit context in window object
    const devvitContext = this.getDevvitContext();
    
    if (devvitContext) {
      console.log('📱 Embedded mode detected - Reddit Devvit context found');
      this.cachedDetection = {
        mode: 'embedded',
        context: devvitContext,
        postId: devvitContext.postId,
        userId: devvitContext.userId,
        username: devvitContext.username,
        subredditName: devvitContext.subredditName
      };
    } else {
      console.log('🖥️ Standalone mode detected - No Devvit context');
      this.cachedDetection = {
        mode: 'standalone'
      };
    }

    return this.cachedDetection;
  }

  /**
   * Check if currently running in embedded mode
   */
  public isEmbedded(): boolean {
    return this.detect().mode === 'embedded';
  }

  /**
   * Check if currently running in standalone mode
   */
  public isStandalone(): boolean {
    return this.detect().mode === 'standalone';
  }

  /**
   * Get the Devvit context if available
   */
  public getContext(): DevvitContext | null {
    return this.detect().context || null;
  }

  /**
   * Get the post ID if in embedded mode
   */
  public getPostId(): string | null {
    const detection = this.detect();
    return detection.postId || null;
  }

  /**
   * Get the user ID if in embedded mode
   */
  public getUserId(): string | null {
    const detection = this.detect();
    return detection.userId || null;
  }

  /**
   * Get the username if in embedded mode
   */
  public getUsername(): string | null {
    const detection = this.detect();
    return detection.username || null;
  }

  /**
   * Get the subreddit name if in embedded mode
   */
  public getSubredditName(): string | null {
    const detection = this.detect();
    return detection.subredditName || null;
  }

  /**
   * Reset cached detection (useful for testing)
   */
  public resetCache(): void {
    this.cachedDetection = null;
  }

  /**
   * Check for Devvit context in various possible locations
   */
  private getDevvitContext(): DevvitContext | null {
    try {
      // Check for Devvit context in window object
      // This is where Reddit would inject the context
      const windowAny = window as any;
      
      // Check multiple possible locations where Devvit might inject context
      const possibleContexts = [
        windowAny.devvit,
        windowAny.reddit,
        windowAny.__DEVVIT_CONTEXT__,
        windowAny.__REDDIT_CONTEXT__
      ];

      for (const context of possibleContexts) {
        if (this.isValidDevvitContext(context)) {
          return context;
        }
      }

      // Check for context in URL parameters (fallback method)
      const urlParams = new URLSearchParams(window.location.search);
      const postId = urlParams.get('postId');
      const userId = urlParams.get('userId');
      const username = urlParams.get('username');
      const subredditName = urlParams.get('subreddit');

      if (postId && userId) {
        console.log('📋 Found Devvit context in URL parameters');
        return {
          postId,
          userId,
          username: username || 'unknown',
          subredditName: subredditName || 'unknown'
        };
      }

      // Check for context in localStorage (development/testing)
      const storedContext = localStorage.getItem('devvit_context');
      if (storedContext) {
        try {
          const parsed = JSON.parse(storedContext);
          if (this.isValidDevvitContext(parsed)) {
            console.log('💾 Found Devvit context in localStorage');
            return parsed;
          }
        } catch (e) {
          console.warn('Failed to parse stored Devvit context:', e);
        }
      }

      return null;
    } catch (error) {
      console.warn('Error detecting Devvit context:', error);
      return null;
    }
  }

  /**
   * Validate that an object is a valid Devvit context
   */
  private isValidDevvitContext(context: any): context is DevvitContext {
    return (
      context &&
      typeof context === 'object' &&
      typeof context.postId === 'string' &&
      typeof context.userId === 'string' &&
      context.postId.length > 0 &&
      context.userId.length > 0
    );
  }

  /**
   * Set a mock context for testing purposes
   */
  public setMockContext(context: DevvitContext): void {
    console.log('🧪 Setting mock Devvit context for testing');
    this.cachedDetection = {
      mode: 'embedded',
      context,
      postId: context.postId,
      userId: context.userId,
      username: context.username,
      subredditName: context.subredditName
    };
  }

  /**
   * Clear mock context and return to normal detection
   */
  public clearMockContext(): void {
    console.log('🧹 Clearing mock context');
    this.resetCache();
  }
}