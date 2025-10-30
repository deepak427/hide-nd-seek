import { EnvironmentDetector } from './EnvironmentDetector';
import { EmbeddedGameConfig, DevvitContext } from '../../../shared/types/environment';

/**
 * Embedded Game Manager
 * Handles Reddit context and manages embedded game configuration
 */
export class EmbeddedGameManager {
  private static instance: EmbeddedGameManager;
  private environmentDetector: EnvironmentDetector;
  private gameConfig: EmbeddedGameConfig | null = null;
  private isInitialized: boolean = false;

  private constructor() {
    this.environmentDetector = EnvironmentDetector.getInstance();
  }

  public static getInstance(): EmbeddedGameManager {
    if (!EmbeddedGameManager.instance) {
      EmbeddedGameManager.instance = new EmbeddedGameManager();
    }
    return EmbeddedGameManager.instance;
  }

  /**
   * Initialize the embedded game configuration
   */
  public async initialize(): Promise<EmbeddedGameConfig> {
    if (this.isInitialized && this.gameConfig) {
      return this.gameConfig;
    }

    console.log('🚀 Initializing embedded game manager...');

    if (!this.environmentDetector.isEmbedded()) {
      throw new Error('Cannot initialize embedded game manager in standalone mode');
    }

    const context = this.environmentDetector.getContext();
    if (!context) {
      throw new Error('No Devvit context available for embedded game initialization');
    }

    try {
      // Fetch game configuration from server
      this.gameConfig = await this.fetchGameConfig(context);
      this.isInitialized = true;
      
      console.log('✅ Embedded game manager initialized successfully');
      console.log('🎮 Game config:', this.gameConfig);
      
      return this.gameConfig;
    } catch (error) {
      console.error('❌ Failed to initialize embedded game manager:', error);
      throw error;
    }
  }

  /**
   * Check if the current user is the creator of the game
   */
  public isCreator(): boolean {
    if (!this.gameConfig) {
      console.warn('Game config not initialized, cannot determine creator status');
      return false;
    }
    return this.gameConfig.userRole === 'creator';
  }

  /**
   * Check if the current user is a guesser
   */
  public isGuesser(): boolean {
    if (!this.gameConfig) {
      console.warn('Game config not initialized, cannot determine guesser status');
      return false;
    }
    return this.gameConfig.userRole === 'guesser';
  }

  /**
   * Get the current game configuration
   */
  public getGameConfig(): EmbeddedGameConfig | null {
    return this.gameConfig;
  }

  /**
   * Get the game ID
   */
  public getGameId(): string | null {
    return this.gameConfig?.gameId || null;
  }

  /**
   * Get the map key for the current game
   */
  public getMapKey(): string | null {
    return this.gameConfig?.mapKey || null;
  }

  /**
   * Get the hiding spot (only available for creators)
   */
  public getHidingSpot(): { objectKey: string; relX: number; relY: number } | null {
    if (!this.isCreator()) {
      return null;
    }
    return this.gameConfig?.hidingSpot || null;
  }

  /**
   * Get the user role
   */
  public getUserRole(): 'creator' | 'guesser' | null {
    return this.gameConfig?.userRole || null;
  }

  /**
   * Setup user interface based on role
   */
  public setupUserInterface(scene: Phaser.Scene): void {
    if (!this.gameConfig) {
      console.error('Cannot setup UI - game config not initialized');
      return;
    }

    console.log(`🎨 Setting up UI for ${this.gameConfig.userRole} role`);

    if (this.isCreator()) {
      this.setupCreatorInterface(scene);
    } else {
      this.setupGuesserInterface(scene);
    }
  }

  /**
   * Reset the manager state
   */
  public reset(): void {
    this.gameConfig = null;
    this.isInitialized = false;
    console.log('🔄 Embedded game manager reset');
  }

  /**
   * Fetch game configuration from the server
   */
  private async fetchGameConfig(context: DevvitContext): Promise<EmbeddedGameConfig> {
    console.log('📡 Fetching game config from server...');
    
    try {
      const response = await fetch('/api/init', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Post-Id': context.postId,
          'X-User-Id': context.userId,
          'X-Username': context.username || '',
          'X-Subreddit': context.subredditName || ''
        }
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!this.isValidGameConfig(data)) {
        throw new Error('Invalid game configuration received from server');
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch game config:', error);
      
      // Fallback to mock data for development/testing
      if (this.isDevelopmentMode()) {
        console.warn('🧪 Using mock game config for development');
        return this.getMockGameConfig(context);
      }
      
      throw error;
    }
  }

  /**
   * Validate game configuration structure
   */
  private isValidGameConfig(config: any): config is EmbeddedGameConfig {
    return (
      config &&
      typeof config === 'object' &&
      typeof config.gameId === 'string' &&
      typeof config.mapKey === 'string' &&
      (config.userRole === 'creator' || config.userRole === 'guesser') &&
      config.gameId.length > 0 &&
      config.mapKey.length > 0
    );
  }

  /**
   * Check if running in development mode
   */
  private isDevelopmentMode(): boolean {
    return (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('dev') ||
      process.env.NODE_ENV === 'development'
    );
  }

  /**
   * Get mock game configuration for development/testing
   */
  private getMockGameConfig(context: DevvitContext): EmbeddedGameConfig {
    // Determine role based on user ID (simple logic for testing)
    const isCreator = context.userId.endsWith('1') || context.userId === 'creator';
    
    const config: EmbeddedGameConfig = {
      gameId: `mock_game_${context.postId}`,
      mapKey: 'bedroom', // Default map for testing
      userRole: isCreator ? 'creator' : 'guesser'
    };

    // Add hiding spot for creators
    if (isCreator) {
      config.hidingSpot = {
        objectKey: 'pumpkin',
        relX: 0.3,
        relY: 0.7
      };
    }

    return config;
  }

  /**
   * Setup creator-specific interface
   */
  private setupCreatorInterface(scene: Phaser.Scene): void {
    console.log('👑 Setting up creator interface');
    
    // Creator sees:
    // - Dashboard with guess statistics
    // - List of users who have guessed
    // - Refresh button to update data
    // - Option to reveal the answer
    
    // This will be implemented in the UI components
    // For now, just log the setup
    console.log('📊 Creator dashboard will be initialized');
  }

  /**
   * Setup guesser-specific interface
   */
  private setupGuesserInterface(scene: Phaser.Scene): void {
    console.log('🔍 Setting up guesser interface');
    
    // Guesser sees:
    // - Interactive map to click and guess
    // - Information about what object to find
    // - Feedback on their guess
    // - Option to make another guess
    
    // This will be implemented in the UI components
    // For now, just log the setup
    console.log('🎯 Guesser interface will be initialized');
  }

  /**
   * Handle errors during initialization
   */
  private handleInitializationError(error: Error): void {
    console.error('Embedded game initialization failed:', error);
    
    // Could implement fallback strategies here:
    // - Retry with exponential backoff
    // - Show error message to user
    // - Fallback to standalone mode
    // - Report error to analytics
  }
}