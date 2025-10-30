import { Scene } from 'phaser';
import { Background } from './components/Background';
import { MapLayer } from './components/MapLayer';
import { UIManager } from './components/UIManager';
import { ShareManager } from './components/ShareManager';
import { PostGameManager } from './components/PostGameManager';
import { GuessMode } from './components/GuessMode';
import { GuessDashboard } from './components/GuessDashboard';
import { Theme } from '../../../style/theme';
import { EnvironmentDetector } from '../../services/EnvironmentDetector';
import { EmbeddedGameManager } from '../../services/EmbeddedGameManager';
import { UXEnhancementService } from '../../services/UXEnhancementService';
import { PerformanceManager } from '../../utils/PerformanceManager';
import { AssetOptimizer } from '../../utils/AssetOptimizer';
import { GameInitData, EnvironmentDetection, EmbeddedGameConfig } from '../../../../shared/types/environment';

export class Game extends Scene {
  private bg!: Background;
  private mapLayer!: MapLayer;
  private ui!: UIManager;
  private shareManager!: ShareManager;
  private postGameManager!: PostGameManager;
  private guessMode: GuessMode | null = null;
  private guessDashboard: GuessDashboard | null = null;
  private gameMode: 'hiding' | 'guessing' | 'dashboard' = 'hiding';
  private selectedHidingSpot: { x: number; y: number; relX: number; relY: number } | null = null;
  private selectedObject: string | null = null;

  
  // Environment detection and embedded game support
  private environmentDetector: EnvironmentDetector;
  private embeddedGameManager: EmbeddedGameManager;
  private uxService: UXEnhancementService;
  private environmentDetection: EnvironmentDetection | null = null;
  private embeddedConfig: EmbeddedGameConfig | null = null;
  private isEmbeddedMode: boolean = false;
  
  // Performance optimization components
  private performanceManager: PerformanceManager;
  private assetOptimizer: AssetOptimizer;
  private performanceDisplay?: any; // Lazy loaded in development

  constructor() {
    super('Game');
    this.environmentDetector = EnvironmentDetector.getInstance();
    this.embeddedGameManager = EmbeddedGameManager.getInstance();
    this.uxService = new UXEnhancementService(this);
  }

  init(data: GameInitData = { mapKey: 'octmap' }) {
    console.log(`🚀 GAME: Game scene init called`);
    console.log(`🚀 GAME: Raw data received:`, data);
    console.log(`🚀 GAME: Data properties breakdown:`, {
      mapKey: data.mapKey,
      mode: data.mode,
      gameId: data.gameId,
      objectKey: data.objectKey,
      postId: data.postId,
      userId: data.userId,
      environment: data.environment,
      embeddedConfig: data.embeddedConfig
    });
    
    // Ensure required data is present
    if (!data.mapKey) {
      data.mapKey = 'octmap'; // Default fallback map
    }
    
    // Detect environment first
    this.environmentDetection = data.environment || this.environmentDetector.detect();
    this.isEmbeddedMode = this.environmentDetection.mode === 'embedded';
    
    console.log(`🌍 Environment: ${this.environmentDetection.mode}`);
    
    // Initialize based on environment
    if (this.isEmbeddedMode) {
      this.initEmbeddedMode(data);
    } else {
      this.initStandaloneMode(data);
    }
  }

  preload() {
    console.log('📦 Starting simplified asset loading...');
    
    // Initialize performance optimization components first
    // Requirements: 6.4 - Optimize performance for mobile devices
    this.performanceManager = new PerformanceManager(this, {
      targetFPS: 60,
      lowFPSThreshold: 30,
      enableAutoOptimization: true,
      enablePerformanceMonitoring: true
    });
    
    this.assetOptimizer = new AssetOptimizer(this, {
      enableTextureCompression: false, // Disable to avoid issues
      maxTextureSize: 1024,
      enableAssetCaching: false, // Disable to avoid issues
      preloadCriticalAssets: false, // Disable to avoid infinite loop
      lazyLoadNonCritical: false, // Disable to avoid issues
      compressionQuality: 0.8
    });

    // Show loading indicator with performance info
    this.uxService.showLoading({
      message: 'Loading game...',
      showProgress: true,
      showSpinner: true
    });

    // Create fallback textures for missing assets
    this.createFallbackTextures();
    
    console.log('✅ Fallback textures created');
    
    // Create a simple 1x1 pixel image to ensure the loader has something to load
    // This ensures Phaser's preload -> create lifecycle works properly
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 1, 1);
    
    // Load this dummy asset to trigger the loader
    this.load.image('dummy', canvas.toDataURL());
    
    // Handle completion
    this.load.on('complete', () => {
      console.log('📦 Preload complete, calling onAssetsLoaded');
      this.onAssetsLoaded();
    });
    
    console.log('🚀 Starting Phaser loader...');
  }

  /**
   * Setup asset optimization based on device capabilities
   * Requirements: 6.4 - Asset optimization for mobile devices
   */
  private setupAssetOptimization(): void {
    const optimizationLevel = this.performanceManager.getOptimizationLevel();
    
    // Adjust asset optimizer settings based on performance level
    switch (optimizationLevel.level) {
      case 'potato':
        this.assetOptimizer.setMaxTextureSize(512);
        this.assetOptimizer.setCompressionQuality(0.6);
        break;
      case 'low':
        this.assetOptimizer.setMaxTextureSize(1024);
        this.assetOptimizer.setCompressionQuality(0.7);
        break;
      case 'medium':
        this.assetOptimizer.setMaxTextureSize(1536);
        this.assetOptimizer.setCompressionQuality(0.8);
        break;
      case 'high':
        this.assetOptimizer.setMaxTextureSize(2048);
        this.assetOptimizer.setCompressionQuality(0.9);
        break;
    }
    
    console.log(`🎮 Asset optimization configured for ${optimizationLevel.level} quality`);
  }

  /**
   * Create fallback textures for missing assets
   */
  private createFallbackTextures(): void {
    const fallbackAssets = ['octmap', 'cozy-bedroom', 'pumpkin', 'wardrobe', 'bush', 'car', 'truck', 'guard'];
    
    fallbackAssets.forEach(key => {
      if (!this.textures.exists(key)) {
        this.createFallbackTexture(key);
      }
    });
  }

  /**
   * Create a simple fallback texture
   */
  private createFallbackTexture(key: string): void {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    
    const ctx = canvas.getContext('2d')!;
    
    // Different colors for different asset types
    const colors = {
      'octmap': '#2c3e50',
      'cozy-bedroom': '#34495e',
      'pumpkin': '#e67e22',
      'wardrobe': '#8b4513',
      'bush': '#27ae60',
      'car': '#3498db',
      'truck': '#9b59b6',
      'guard': '#e74c3c'
    };
    
    ctx.fillStyle = colors[key as keyof typeof colors] || '#95a5a6';
    ctx.fillRect(0, 0, 64, 64);
    
    // Add simple shape indicator
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(key.charAt(0).toUpperCase(), 32, 36);
    
    const fallbackImage = new Image();
    fallbackImage.src = canvas.toDataURL();
    
    this.textures.addImage(key, fallbackImage);
    console.log(`🔄 Created fallback texture for: ${key}`);
  }

  /**
   * Load only available assets
   */
  private loadAvailableAssets(): void {
    // Load essential assets only - don't try to load assets that don't exist
    console.log('📦 Loading essential assets...');
    
    // Only load if we actually need these assets and they exist
    // For now, skip loading external assets and rely on fallback textures
    
    // Mark fallback textures as loaded
    this.assetOptimizer.addCriticalAsset('octmap');
    this.assetOptimizer.addCriticalAsset('pumpkin');
    this.assetOptimizer.addCriticalAsset('wardrobe');
    
    console.log('✅ Using fallback textures for all assets');
  }

  /**
   * Handle assets loaded completion
   * Requirements: 6.4 - Asset loading completion with optimization
   */
  private async onAssetsLoaded(): Promise<void> {
    try {
      console.log('✅ Assets loaded, proceeding to create scene');
      
      // Show optimization report in development
      if (process.env.NODE_ENV === 'development') {
        console.log(this.assetOptimizer.getOptimizationReport());
        console.log(this.performanceManager.getPerformanceReport());
      }
      
      this.uxService.hideLoading();
      
      // Show optimization level to user
      const optimizationLevel = this.performanceManager.getOptimizationLevel();
      this.uxService.showToast(`Game optimized for ${optimizationLevel.description}`, {
        type: 'info',
        duration: 2000
      });
      
      // Force scene creation immediately since Phaser's create() might not be called
      console.log('🚀 Assets loaded, forcing scene creation immediately');
      
      this.time.delayedCall(100, () => {
        console.log('🔧 Forcing scene creation now');
        this.createStandaloneMode();
      });
      
    } catch (error) {
      console.error('Asset optimization failed:', error);
      this.uxService.hideLoading();
      this.uxService.showToast('Assets loaded with basic optimization', {
        type: 'warning',
        duration: 3000
      });
    }
  }

  async create() {
    console.log('🏗️ Phaser create() method called');
    
    // Only prevent if scene is already fully created
    if (this.bg && this.mapLayer && this.ui) {
      console.log('⚠️ Scene already fully created, skipping...');
      return;
    }
    
    console.log('🔧 Proceeding with scene creation from create() method');
    
    try {
      if (this.isEmbeddedMode) {
        await this.createEmbeddedMode();
      } else {
        await this.createStandaloneMode();
      }
    } catch (error) {
      console.error('❌ Failed to create game scene:', error);
      this.handleInitializationError(error);
    }
  }

  /**
   * Initialize standalone mode with traditional game flow
   * Requirements: 8.4, 8.5 - Handle different interaction patterns for each mode
   */
  private initStandaloneMode(data: GameInitData) {
    console.log('🖥️ Initializing standalone mode');
    
    // Always use octmap for now since we have fallback textures for it
    const mapKey = 'octmap';
    console.log(`🗺️ Using map: ${mapKey}`);
    this.mapLayer = new MapLayer(this, mapKey);
    this.shareManager = new ShareManager(this);
    this.postGameManager = new PostGameManager(this);
    
    // Mode detection and setup (Requirements 8.4, 8.5)
    this.gameMode = this.detectGameMode(data);
    console.log(`🎮 Game mode detected: ${this.gameMode}`);

    this.selectedHidingSpot = null;
    this.selectedObject = null;
    
    // Initialize mode-specific data
    this.initializeModeSpecificData(data);
  }

  /**
   * Detect game mode based on initialization data
   * Requirements: 8.4, 8.5 - Implement mode detection and UI adaptation
   */
  private detectGameMode(data: GameInitData): 'hiding' | 'guessing' | 'dashboard' {
    console.log(`🚀 GAME: detectGameMode called with data:`, data);
    
    // Check if mode is explicitly provided (from URL detection or server injection)
    if (data.mode) {
      console.log(`🚀 GAME: Explicit mode provided: ${data.mode}`);
      return data.mode;
    }
    
    // Check userRole to determine mode (new logic for server-injected data)
    if (data.userRole) {
      const mode = data.userRole === 'creator' ? 'dashboard' : 'guessing';
      console.log(`🚀 GAME: UserRole detected: ${data.userRole} - switching to ${mode} mode`);
      return mode;
    }
    
    // If we have embedded config with hiding spot, we're in guessing mode
    if (data.embeddedConfig?.hidingSpot) {
      console.log(`🚀 GAME: Embedded config with hiding spot detected - guessing mode`);
      return 'guessing';
    }
    
    // If we have a gameId, we're in guessing mode (Reddit post)
    if (data.gameId) {
      console.log(`🚀 GAME: GameId detected: ${data.gameId} - switching to guessing mode`);
      return 'guessing';
    }
    
    // If we have a gameId but no hiding spot, we might be the creator viewing dashboard
    if (data.embeddedConfig?.gameId && !data.embeddedConfig?.hidingSpot) {
      console.log(`🚀 GAME: Embedded config with gameId but no hiding spot - dashboard mode`);
      return 'dashboard';
    }
    
    // Default to hiding mode for standalone
    console.log(`🚀 GAME: No special conditions met - defaulting to hiding mode`);
    return 'hiding';
  }

  /**
   * Initialize mode-specific data and configuration
   * Requirements: 8.4, 8.5 - Handle different interaction patterns for each mode
   */
  private initializeModeSpecificData(data: GameInitData) {
    switch (this.gameMode) {
      case 'hiding':
        console.log('🫥 Initializing hiding mode - player will create challenge');
        // No additional setup needed for hiding mode
        break;
        
      case 'guessing':
        console.log('🔍 Initializing guessing mode - player will find hidden object');
        // Check for hiding spot data from server injection or embedded config
        const hidingSpotData = data.hidingSpot || data.embeddedConfig?.hidingSpot;
        if (hidingSpotData) {
          // Store the hiding spot data for guessing validation
          this.selectedHidingSpot = {
            x: 0, // Will be calculated from relX/relY
            y: 0, // Will be calculated from relX/relY
            relX: hidingSpotData.relX,
            relY: hidingSpotData.relY
          };
          this.selectedObject = hidingSpotData.objectKey;
          console.log('🎯 Hiding spot data loaded for guessing:', hidingSpotData);
        }
        break;
        
      case 'dashboard':
        console.log('👑 Initializing dashboard mode - creator viewing guesses');
        // Store hiding spot data for dashboard display
        const creatorHidingSpot = data.hidingSpot || data.embeddedConfig?.hidingSpot;
        if (creatorHidingSpot) {
          this.selectedHidingSpot = {
            x: 0, // Will be calculated from relX/relY
            y: 0, // Will be calculated from relX/relY
            relX: creatorHidingSpot.relX,
            relY: creatorHidingSpot.relY
          };
          this.selectedObject = creatorHidingSpot.objectKey;
          console.log('👑 Creator hiding spot data loaded for dashboard:', creatorHidingSpot);
        }
        break;
    }
  }

  /**
   * Initialize embedded mode with Reddit context
   */
  private initEmbeddedMode(data: GameInitData) {
    console.log('📱 Initializing embedded mode');
    
    // In embedded mode, we'll get the config from the embedded game manager
    // For now, set up basic properties that will be updated after initialization
    this.embeddedConfig = data.embeddedConfig || null;
    this.selectedHidingSpot = null;
    this.selectedObject = null;
  }

  /**
   * Create standalone mode scene
   */
  private async createStandaloneMode() {
    console.log('🖥️ Creating standalone mode scene');
    
    try {
      // Ensure components are initialized with correct mapKey
      console.log('🔧 Reinitializing mapLayer with octmap...');
      try {
        this.mapLayer = new MapLayer(this, 'octmap'); // Always use fallback map
        console.log('✅ MapLayer initialized with octmap');
      } catch (error) {
        console.error('❌ Failed to initialize MapLayer:', error);
        throw error;
      }
      
      if (!this.shareManager) {
        console.log('🔧 Initializing shareManager...');
        try {
          this.shareManager = new ShareManager(this);
          console.log('✅ ShareManager initialized');
        } catch (error) {
          console.error('❌ Failed to initialize ShareManager:', error);
          // Don't throw, this is not critical
        }
      }
      
      if (!this.postGameManager) {
        console.log('🔧 Initializing postGameManager...');
        try {
          this.postGameManager = new PostGameManager(this);
          console.log('✅ PostGameManager initialized');
        } catch (error) {
          console.error('❌ Failed to initialize PostGameManager:', error);
          // Don't throw, this is not critical
        }
      }
      
      // Set default game mode
      if (!this.gameMode) {
        this.gameMode = 'hiding';
        console.log('🎮 Set default game mode: hiding');
      }
      
      console.log('1️⃣ Creating background...');
      this.createBackground();
      
      console.log('2️⃣ Creating map layer...');
      await this.createMapLayer();
      
      console.log('3️⃣ Creating UI...');
      this.createUI();
      
      console.log('4️⃣ Setting up game logic...');
      this.setupGameLogic();
      this.setupResize();
      
      console.log('5️⃣ Starting game intro...');
      this.startGameIntro();
      
      console.log('✅ Standalone mode scene created successfully');
      
    } catch (error) {
      console.error('❌ Error in createStandaloneMode:', error);
      console.log('🔧 Creating minimal fallback scene...');
      this.createMinimalScene();
    }
  }

  /**
   * Create embedded mode scene
   */
  private async createEmbeddedMode() {
    console.log('📱 Creating embedded mode scene');
    
    try {
      // Show loading for initialization
      this.uxService.showLoading({
        message: 'Connecting to Reddit...',
        showSpinner: true
      });

      // Initialize embedded game manager
      this.embeddedConfig = await this.embeddedGameManager.initialize();
      
      // Set up game properties based on embedded config
      this.gameMode = this.embeddedGameManager.isCreator() ? 'dashboard' : 'guessing';
      
      // Create map layer with config from server
      this.mapLayer = new MapLayer(this, this.embeddedConfig.mapKey);
      this.shareManager = new ShareManager(this);
      this.postGameManager = new PostGameManager(this);

      this.uxService.hideLoading();

      // Show smooth transition
      await this.uxService.createTransition({
        type: 'slide',
        direction: 'up',
        duration: 800
      });

      // Create scene components with progress
      this.uxService.showProgress({
        current: 1,
        total: 4,
        label: 'Setting up embedded game'
      });

      this.createBackground();
      
      this.uxService.showProgress({
        current: 2,
        total: 4,
        label: 'Loading game map'
      });

      this.createMapLayer();
      
      this.uxService.showProgress({
        current: 3,
        total: 4,
        label: 'Creating interface'
      });

      this.createEmbeddedUI();
      
      this.uxService.showProgress({
        current: 4,
        total: 4,
        label: 'Ready!'
      });

      this.setupEmbeddedGameLogic();
      this.setupResize();

      // Hide progress and start intro
      setTimeout(() => {
        this.uxService.hideProgress();
        this.startEmbeddedGameIntro();
      }, 500);
      
    } catch (error) {
      console.error('❌ Failed to initialize embedded mode:', error);
      this.uxService.hideLoading();
      this.handleEmbeddedInitializationError(error);
    }
  }

  /**
   * Create UI for embedded mode
   */
  private createEmbeddedUI() {
    this.ui = new UIManager(this);
    
    if (this.embeddedGameManager.isCreator()) {
      // Creator sees dashboard interface
      this.ui.create(
        () => this.goBackEmbedded(),
        () => this.refreshDashboard(),
        'dashboard' // Special mode for creator dashboard
      );
    } else {
      // Guesser sees guessing interface
      this.ui.create(
        () => this.goBackEmbedded(),
        () => this.submitGuessEmbedded(),
        'guessing'
      );
    }
    
    // Setup embedded-specific UI
    this.embeddedGameManager.setupUserInterface(this);
  }

  /**
   * Setup game logic for embedded mode
   */
  private setupEmbeddedGameLogic() {
    if (this.embeddedGameManager.isCreator()) {
      console.log('👑 Setting up creator dashboard logic');
      this.setupCreatorDashboard();
    } else {
      console.log('🔍 Setting up guesser logic');
      this.setupGuessingMode();
    }
  }

  /**
   * Setup creator dashboard
   */
  private setupCreatorDashboard() {
    this.gameMode = 'dashboard';
    
    // Creator can see all guesses and statistics
    // The map shows where the object is hidden
    if (this.embeddedConfig?.hidingSpot) {
      this.showCreatorHidingSpot();
    }
    
    // Create and load dashboard
    this.guessDashboard = new GuessDashboard(this, this.embeddedConfig!.gameId);
    this.guessDashboard.loadGuesses();
  }

  /**
   * Show the hiding spot to the creator
   */
  private showCreatorHidingSpot() {
    if (!this.embeddedConfig?.hidingSpot) return;
    
    const mapBounds = this.mapLayer.getMap().getBounds();
    const x = mapBounds.x + mapBounds.width * this.embeddedConfig.hidingSpot.relX;
    const y = mapBounds.y + mapBounds.height * this.embeddedConfig.hidingSpot.relY;
    
    // Show the hidden object to the creator
    const hiddenObject = this.add.image(x, y, this.embeddedConfig.hidingSpot.objectKey);
    hiddenObject.setScale(0.3);
    hiddenObject.setDepth(10);
    hiddenObject.setAlpha(0.8);
    
    // Add a special glow for creator view
    const glow = this.add.image(x, y, this.embeddedConfig.hidingSpot.objectKey);
    glow.setTintFill(parseInt(Theme.accentCyan.replace('#', ''), 16));
    glow.setScale(0.35);
    glow.setAlpha(0.3);
    glow.setDepth(9);
  }



  /**
   * Start intro for embedded mode
   */
  private async startEmbeddedGameIntro() {
    // Smooth fade in effect
    this.cameras.main.fadeIn(800, 0, 0, 0);
    
    // Show welcome toast
    if (this.embeddedGameManager.isCreator()) {
      this.uxService.showToast('Welcome back! Here are your challenge results.', {
        type: 'info',
        duration: 4000
      });
      this.ui.showObjective('View guesses on your hiding challenge!');
    } else {
      const objectKey = this.embeddedConfig?.hidingSpot?.objectKey || 'object';
      this.uxService.showToast(`Challenge: Find the hidden ${objectKey}!`, {
        type: 'info',
        duration: 4000
      });
      this.ui.showObjective(`Find the hidden ${objectKey}!`);
    }

    // Add floating animation to key UI elements
    this.time.delayedCall(1000, () => {
      this.addUIAnimations();
    });
  }

  /**
   * Handle embedded mode back navigation
   */
  private goBackEmbedded() {
    // In embedded mode, we might not have a back option
    // or it might refresh the Reddit post
    console.log('🔙 Back pressed in embedded mode');
    // Could implement Reddit-specific navigation here
  }

  /**
   * Refresh dashboard for creators
   */
  private refreshDashboard() {
    if (this.embeddedGameManager.isCreator() && this.guessDashboard) {
      console.log('🔄 Refreshing dashboard');
      this.guessDashboard.refreshData();
    }
  }

  /**
   * Submit guess in embedded mode
   */
  private async submitGuessEmbedded() {
    // This is handled by the GuessMode component
    console.log('📤 Guess submission handled by GuessMode component');
  }



  /**
   * Create minimal scene as fallback
   */
  private createMinimalScene() {
    console.log('🔧 Creating minimal fallback scene');
    
    const { width, height } = this.scale;
    
    // Create simple background
    const bg = this.add.graphics();
    bg.fillStyle(parseInt(Theme.primaryDark.replace('#', ''), 16));
    bg.fillRect(0, 0, width, height);
    
    // Add title
    const title = this.add.text(width / 2, height / 2 - 100, '🎮 Hide & Seek', {
      fontSize: '48px',
      fontFamily: 'Arial, sans-serif',
      color: Theme.accentCyan,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Add status
    const status = this.add.text(width / 2, height / 2, 'Game loaded successfully!\nMinimal mode active.', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: Theme.textPrimary,
      align: 'center'
    }).setOrigin(0.5);
    
    // Add instructions
    const instructions = this.add.text(width / 2, height / 2 + 100, 'Click anywhere to continue', {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: Theme.textSecondary,
      align: 'center'
    }).setOrigin(0.5);
    
    // Make it interactive
    this.input.once('pointerdown', () => {
      console.log('🖱️ User clicked, attempting full scene creation...');
      this.children.removeAll();
      this.createStandaloneMode();
    });
    
    // Add pulsing animation to instructions
    this.tweens.add({
      targets: instructions,
      alpha: { from: 1, to: 0.5 },
      duration: 1000,
      yoyo: true,
      repeat: -1
    });
    
    console.log('✅ Minimal scene created');
  }

  private createBackground() {
    console.log('🎨 Creating Background component...');
    this.bg = new Background(this);
    this.bg.create();
    console.log('✅ Background created successfully');
  }

  private async createMapLayer() {
    console.log('🗺️ Creating MapLayer component...');
    if (!this.mapLayer) {
      throw new Error('MapLayer not initialized');
    }
    
    await this.mapLayer.create();
    console.log('✅ MapLayer created successfully');
    
    // Listen for object selection events from MapLayer (Requirements 1.2, 1.4, 1.5)
    this.events.on('objectSelected', this.onObjectSelected, this);
    
    if (this.gameMode === 'hiding') {
      // In hiding mode, objects are interactive for selection
      console.log('🫥 Hiding mode: Interactive objects ready for selection');
    } else {
      // In guessing mode, show the hidden object location for guessing
      this.setupGuessingMode();
    }
  }

  /**
   * Handle object selection from MapLayer
   * Requirements: 1.4, 1.5 - Track relative positions and provide visual feedback
   */
  private onObjectSelected(selectionData: {
    objectKey: string;
    objectName: string;
    worldX: number;
    worldY: number;
    relX: number;
    relY: number;
    positionData?: any;
  }) {
    console.log(`🎯 Object selected:`, selectionData);
    
    // Validate position data (Requirements 1.4, 1.5)
    if (!this.validateSelectionData(selectionData)) {
      this.uxService.showToast('Invalid selection. Please try again.', {
        type: 'error',
        duration: 2000
      });
      return;
    }
    
    // Clear previous selection if different object
    if (this.selectedObject && this.selectedObject !== selectionData.objectKey) {
      console.log(`🔄 Switching selection from ${this.selectedObject} to ${selectionData.objectKey}`);
    }
    
    // Store selection data with position tracking
    this.selectedObject = selectionData.objectKey;
    this.selectedHidingSpot = {
      x: selectionData.worldX,
      y: selectionData.worldY,
      relX: selectionData.relX,
      relY: selectionData.relY
    };

    // Log position tracking data for debugging (Requirements 1.4)
    console.log(`📍 Position tracked: Object=${selectionData.objectKey}, RelPos=(${selectionData.relX.toFixed(3)}, ${selectionData.relY.toFixed(3)}), WorldPos=(${selectionData.worldX.toFixed(1)}, ${selectionData.worldY.toFixed(1)})`);

    // Show success feedback with position info (Requirements 1.5)
    this.uxService.showToast(`Great hiding spot! You're hiding behind the ${selectionData.objectName}. Now post your challenge for others to find you!`, {
      type: 'success',
      duration: 4000
    });

    // Enable share/post functionality (only show once)
    if (this.ui) {
      this.ui.showShare();
    }

    // Update objective with position feedback
    if (this.ui) {
      this.ui.showObjective(`You're hiding behind the ${selectionData.objectName}! Ready to post your hide-and-seek challenge.`);
    }

    // Show position tracking statistics in debug mode
    this.showPositionTrackingStats();
  }

  /**
   * Validate selection data for position tracking
   * Requirements: 1.4, 1.5 - Validate relative positions and provide feedback
   */
  private validateSelectionData(selectionData: any): boolean {
    // Check required fields
    if (!selectionData.objectKey || !selectionData.objectName) {
      console.error('Missing object identification in selection data');
      return false;
    }

    // Validate relative coordinates (Requirements 1.4)
    if (selectionData.relX < 0 || selectionData.relX > 1 || 
        selectionData.relY < 0 || selectionData.relY > 1) {
      console.error('Invalid relative coordinates:', selectionData.relX, selectionData.relY);
      return false;
    }

    // Validate world coordinates
    if (typeof selectionData.worldX !== 'number' || typeof selectionData.worldY !== 'number') {
      console.error('Invalid world coordinates:', selectionData.worldX, selectionData.worldY);
      return false;
    }

    return true;
  }

  /**
   * Show position tracking statistics for debugging
   * Requirements: 1.4, 1.5 - Position tracking and feedback
   */
  private showPositionTrackingStats() {
    if (!this.mapLayer) return;

    const stats = this.mapLayer.getPositionStats();
    console.log('📊 Position Tracking Stats:', stats);

    // Show stats in development mode
    if (process.env.NODE_ENV === 'development') {
      const statsText = `Tracked: ${stats.totalTracked}, Valid: ${stats.validPositions}, Avg: (${stats.averageRelX.toFixed(2)}, ${stats.averageRelY.toFixed(2)})`;
      
      // Create temporary stats display
      const { width } = this.scale;
      const statsDisplay = this.add.text(width - 10, 10, statsText, {
        fontSize: '12px',
        fontFamily: 'monospace',
        color: Theme.textSecondary,
        backgroundColor: Theme.bgPrimary,
        padding: { x: 5, y: 3 }
      }).setOrigin(1, 0).setDepth(Theme.zIndexUI);

      // Auto-hide after 3 seconds
      this.time.delayedCall(3000, () => {
        statsDisplay.destroy();
      });
    }
  }

  /**
   * Create UI adapted for the current game mode
   * Requirements: 8.4, 8.5 - Implement mode detection and UI adaptation
   */
  private createUI() {
    this.ui = new UIManager(this);
    this.ui.create(
      () => this.goBack(),
      () => this.handlePrimaryAction(),
      this.gameMode
    );
    
    // Mode-specific UI setup (Requirements 8.4, 8.5)
    this.setupModeSpecificUI();
  }

  /**
   * Setup UI elements specific to each game mode
   * Requirements: 8.4, 8.5 - Handle different interaction patterns for each mode
   */
  private setupModeSpecificUI() {
    switch (this.gameMode) {
      case 'hiding':
        console.log('🫥 Setting up hiding mode UI');
        // Objects are directly on the map - no separate selector needed
        this.ui.showObjective('Choose where to hide! Click on any object on the map to hide behind it.');
        break;
        
      case 'guessing':
        console.log('🔍 Setting up guessing mode UI');
        // Get object to find from initialization data
        const initData = (this.game as any).gameInitData;
        const objectToFind = initData?.objectKey || this.selectedObject || 'hidden object';
        this.ui.showObjective(`Find the hidden ${objectToFind}! Click on objects to make your guess.`);
        break;
        
      case 'dashboard':
        console.log('👑 Setting up dashboard mode UI');
        // Show dashboard-specific UI
        this.ui.showObjective('View all guesses on your hiding challenge');
        // Change primary action button to refresh
        this.ui.setPrimaryActionText('Refresh Dashboard');
        break;
    }
  }

  /**
   * Handle primary action based on current mode
   * Requirements: 8.4, 8.5 - Handle different interaction patterns for each mode
   */
  private handlePrimaryAction() {
    switch (this.gameMode) {
      case 'hiding':
        this.shareGame();
        break;
        
      case 'guessing':
        // In guessing mode, primary action might be to view results or hints
        this.showGuessingHelp();
        break;
        
      case 'dashboard':
        this.refreshDashboard();
        break;
    }
  }

  /**
   * Show help for guessing mode
   */
  private showGuessingHelp() {
    const objectToFind = this.selectedObject || 'object';
    this.uxService.showToast(`Look for the hidden ${objectToFind}. Click on any object you think might be the hiding spot!`, {
      type: 'info',
      duration: 4000
    });
  }

  /**
   * Switch between game modes dynamically
   * Requirements: 8.4, 8.5 - Handle different interaction patterns for each mode
   */
  public switchGameMode(newMode: 'hiding' | 'guessing' | 'dashboard', data?: any) {
    console.log(`🔄 Switching from ${this.gameMode} to ${newMode}`);
    
    // Clean up current mode
    this.cleanupCurrentMode();
    
    // Set new mode
    this.gameMode = newMode;
    
    // Initialize new mode
    this.initializeModeSpecificData(data || {});
    this.setupGameLogic();
    this.setupModeSpecificUI();
    
    // Show transition feedback
    this.uxService.showToast(`Switched to ${newMode} mode`, {
      type: 'info',
      duration: 2000
    });
  }

  /**
   * Clean up resources from current mode
   */
  private cleanupCurrentMode() {
    // Clean up guess mode
    if (this.guessMode) {
      this.guessMode.destroy();
      this.guessMode = null;
    }
    
    // Clean up dashboard
    if (this.guessDashboard) {
      this.guessDashboard.destroy();
      this.guessDashboard = null;
    }
    
    // Re-enable map object interactions
    this.enableMapObjectInteractions();
  }

  /**
   * Enable map object interactions
   */
  private enableMapObjectInteractions() {
    const objects = this.mapLayer.getObjects();
    objects.forEach(obj => {
      if (obj.sprite && obj.interactive) {
        obj.sprite.setInteractive();
      }
    });
  }

  /**
   * Get current game mode
   */
  public getCurrentMode(): 'hiding' | 'guessing' | 'dashboard' {
    return this.gameMode;
  }

  /**
   * Check if mode switching is allowed
   */
  public canSwitchMode(): boolean {
    // Don't allow mode switching in embedded mode
    if (this.isEmbeddedMode) {
      return false;
    }
    
    // Don't allow switching if game is in progress
    if (this.gameMode === 'guessing' && this.guessMode) {
      return false;
    }
    
    return true;
  }

  /**
   * Setup game logic based on current mode
   * Requirements: 8.4, 8.5 - Handle different interaction patterns for each mode
   */
  private setupGameLogic() {
    switch (this.gameMode) {
      case 'hiding':
        this.setupHidingMode();
        break;
        
      case 'guessing':
        this.setupGuessingMode();
        break;
        
      case 'dashboard':
        this.setupCreatorDashboard();
        break;
    }
  }

  /**
   * Setup hiding mode logic
   * Requirements: 8.4 - Handle creation mode interaction patterns
   */
  private setupHidingMode() {
    console.log('🫥 Setting up hiding mode logic');
    
    // In hiding mode, objects on the map are interactive for selection
    // The MapLayer handles object interactions and emits selection events
    // No additional setup needed - objects are already interactive on the map
    
    console.log('✅ Hiding mode ready - click any object on the map to hide behind it');
  }

  private setupResize() {
    this.scale.on('resize', this.resizeAll, this);
  }

  private async startGameIntro() {
    // Smooth fade in effect
    this.cameras.main.fadeIn(800, 0, 0, 0);
    
    // Show welcome animation
    await this.uxService.createTransition({
      type: 'scale',
      duration: 1000
    });
    
    // Show objective based on mode
    if (this.gameMode === 'hiding') {
      this.uxService.showToast('Welcome to Hide & Seek! Choose an object to hide behind, then challenge others to find you!', {
        type: 'success',
        duration: 4000
      });
      this.ui.showObjective('Choose where to hide! Click on any object to hide behind it.');
      
      // Skip automatic tutorial popup for now to avoid issues
      // Players can access help through the UI if needed
      console.log('ℹ️ Tutorial popup disabled - players can access help through UI');
    } else if (this.gameMode === 'guessing') {
      // Get object to find from initialization data
      const initData = (this.game as any).gameInitData;
      const objectToFind = initData?.objectKey || 'hidden object';
      
      this.uxService.showToast(`Challenge: Find the hidden ${objectToFind}!`, {
        type: 'info',
        duration: 4000
      });
      this.ui.showObjective(`Find the hidden ${objectToFind}! Click on objects to make your guess.`);
    } else {
      this.uxService.showToast('Good luck!', {
        type: 'info',
        duration: 3000
      });
      this.ui.showObjective('Complete the challenge!');
    }

    // Add UI animations
    this.time.delayedCall(1000, () => {
      this.addUIAnimations();
    });
    
    // Setup performance display in development mode
    this.setupPerformanceDisplay();
  }



  private selectObject(objectKey: string) {
    this.selectedObject = objectKey;
    console.log(`🎯 Selected object: ${objectKey}`);
    
    // Show selection feedback with toast
    this.uxService.showToast(`You're hiding behind the ${objectKey}! Click 'Share Challenge' to post it.`, {
      type: 'info',
      duration: 4000
    });

    // Skip pulse effect to avoid UXEnhancementService errors
    console.log('🎯 Object selected and ready for sharing');
  }

  private showHidingPreview() {
    if (!this.selectedHidingSpot || !this.selectedObject) return;

    // Remove any existing preview
    const existingPreview = this.children.getByName('hidingPreview');
    if (existingPreview) {
      existingPreview.destroy();
    }

    // Create preview sprite
    const preview = this.add.image(
      this.selectedHidingSpot.x, 
      this.selectedHidingSpot.y, 
      this.selectedObject
    );
    preview.setName('hidingPreview');
    preview.setScale(0.3);
    preview.setAlpha(0.8);
    preview.setDepth(10);

    // Add glow effect
    const glow = this.add.image(
      this.selectedHidingSpot.x, 
      this.selectedHidingSpot.y, 
      this.selectedObject
    );
    glow.setName('hidingGlow');
    glow.setTintFill(parseInt(Theme.accentCyan.replace('#', ''), 16));
    glow.setScale(0.35);
    glow.setAlpha(0.3);
    glow.setDepth(9);

    // Pulse animation
    this.tweens.add({
      targets: [preview, glow],
      scaleX: { from: preview.scaleX, to: preview.scaleX * 1.1 },
      scaleY: { from: preview.scaleY, to: preview.scaleY * 1.1 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Setup guessing mode logic
   * Requirements: 8.5 - Handle guessing mode interaction patterns
   */
  private async setupGuessingMode() {
    console.log('🔍 Setting up guessing mode logic');
    
    // Get gameId from initialization data
    const initData = (this.game as any).gameInitData;
    const gameId = initData?.gameId;
    
    if (gameId) {
      console.log(`🎯 Fetching game data for gameId: ${gameId}`);
      try {
        // Fetch game data from server
        const gameData = await this.fetchGameData(gameId);
        
        if (gameData && gameData.hidingSpot) {
          console.log('✅ Game data fetched successfully:', gameData);
          
          // Create guess mode component with server data
          this.guessMode = new GuessMode(this, gameId, gameData.hidingSpot);
          
          // Setup interactive objects for guessing
          const mapBounds = this.mapLayer.getMap().getBounds();
          this.guessMode.setupInteractiveObjects(mapBounds);
          
          // Disable map layer object interactions (GuessMode handles its own objects)
          this.disableMapObjectInteractions();
          
          // Update UI with game info
          if (this.ui) {
            this.ui.showObjective(`Find the hidden ${gameData.hidingSpot.objectKey}!`);
          }
          
          return;
        }
      } catch (error) {
        console.error('❌ Failed to fetch game data:', error);
      }
    }
    
    // Fallback to embedded config or local data
    let hidingSpotData;
    let fallbackGameId;
    
    if (this.embeddedConfig?.hidingSpot) {
      // Embedded mode - data from server
      hidingSpotData = this.embeddedConfig.hidingSpot;
      fallbackGameId = this.embeddedConfig.gameId;
    } else if (this.selectedHidingSpot && this.selectedObject) {
      // Standalone mode - local data for testing
      hidingSpotData = {
        objectKey: this.selectedObject,
        relX: this.selectedHidingSpot.relX,
        relY: this.selectedHidingSpot.relY
      };
      fallbackGameId = 'local-test-game';
    } else {
      console.error('No hiding spot data available for guessing mode');
      this.showGuessingModeError();
      return;
    }

    // Create guess mode component with fallback data
    this.guessMode = new GuessMode(this, fallbackGameId, hidingSpotData);
    
    // Setup interactive objects for guessing
    const mapBounds = this.mapLayer.getMap().getBounds();
    this.guessMode.setupInteractiveObjects(mapBounds);
    
    // Disable map layer object interactions (GuessMode handles its own objects)
    this.disableMapObjectInteractions();
  }

  /**
   * Fetch game data from server
   */
  private async fetchGameData(gameId: string) {
    try {
      const response = await fetch(`/api/game/${gameId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch game data:', error);
      throw error;
    }
  }

  /**
   * Disable map object interactions when in guessing mode
   */
  private disableMapObjectInteractions() {
    // The MapLayer objects should not be interactive in guessing mode
    // GuessMode creates its own interactive objects
    const objects = this.mapLayer.getObjects();
    objects.forEach(obj => {
      if (obj.sprite && obj.sprite.input) {
        obj.sprite.disableInteractive();
      }
    });
  }

  /**
   * Show error when guessing mode cannot be initialized
   */
  private showGuessingModeError() {
    this.uxService.showToast('Unable to load guessing data. Please try again.', {
      type: 'error',
      duration: 5000
    });
    
    // Fallback to hiding mode
    this.gameMode = 'hiding';
    this.setupHidingMode();
    this.setupModeSpecificUI();
  }





  /**
   * Share game with enhanced position tracking data
   * Requirements: 1.4 - Use tracked relative positions for game creation
   * Requirements: 7.1 - Replace share button with post game functionality
   */
  private shareGame() {
    if (this.gameMode === 'hiding') {
      if (!this.selectedHidingSpot || !this.selectedObject) {
        this.ui.showMessage('Please select an object and place it first!', Theme.warning);
        return;
      }
      
      // Requirements 7.1: Use PostGameManager instead of ShareManager for posting
      const gameData = {
        mapKey: this.mapLayer.getMapKey(),
        objectKey: this.selectedObject,
        relX: this.selectedHidingSpot.relX,
        relY: this.selectedHidingSpot.relY
      };
      
      console.log('📮 Showing post game dialog with data:', gameData);
      this.postGameManager.showPostGameDialog(gameData);
    } else {
      // In guessing mode, sharing might show leaderboard or results
      console.log('📊 Viewing results...');
      // TODO: Show leaderboard or results
    }
  }

  /**
   * Get enhanced position data for sharing
   * Requirements: 1.4 - Export relative positions and tracking data
   */
  private getEnhancedPositionData() {
    if (!this.mapLayer || !this.selectedObject) {
      return null;
    }

    // Get tracked position data
    const trackedPosition = this.mapLayer.getTrackedPosition(this.selectedObject);
    const allPositions = this.mapLayer.exportPositionData();
    const stats = this.mapLayer.getPositionStats();

    return {
      selectedObject: {
        key: this.selectedObject,
        relX: this.selectedHidingSpot?.relX || 0,
        relY: this.selectedHidingSpot?.relY || 0,
        worldX: this.selectedHidingSpot?.x || 0,
        worldY: this.selectedHidingSpot?.y || 0,
        isValid: trackedPosition?.isValid || false
      },
      allTrackedPositions: allPositions,
      trackingStats: stats,
      mapKey: this.mapLayer.getMapKey(),
      timestamp: Date.now()
    };
  }

  /**
   * Get current selection data for external access
   * Requirements: 1.4, 1.5 - Access to position tracking data
   */
  public getCurrentSelectionData() {
    return {
      selectedObject: this.selectedObject,
      selectedHidingSpot: this.selectedHidingSpot,
      gameMode: this.gameMode,
      positionData: this.selectedObject ? this.mapLayer?.getTrackedPosition(this.selectedObject) : null,
      allPositions: this.mapLayer?.getAllTrackedPositions() || new Map(),
      isValid: this.selectedHidingSpot && this.selectedObject
    };
  }

  private goBack() {
    if (this.isEmbeddedMode) {
      this.goBackEmbedded();
    } else {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MapSelection');
      });
    }
  }

  resizeAll = () => {
    this.bg.resize();
    this.mapLayer.resize();
    this.ui.resize();
  };

  /**
   * Add UI animations for better user experience
   */
  private addUIAnimations() {
    // Skip UI animations to avoid UXEnhancementService errors
    // The UI components handle their own hover effects
    console.log('🎨 UI animations ready (handled by individual components)');
  }

  /**
   * Create celebration effect when object is placed
   */
  private createPlacementCelebration(x: number, y: number) {
    // Create particle effect
    const particles = this.add.particles(x, y, this.selectedObject!, {
      scale: { start: 0.2, end: 0 },
      speed: { min: 50, max: 150 },
      lifespan: 1000,
      quantity: 5,
      frequency: 200,
      gravityY: 100,
      tint: [
        parseInt(Theme.accentCyan.replace('#', ''), 16),
        parseInt(Theme.accentPrimary.replace('#', ''), 16),
        parseInt(Theme.success.replace('#', ''), 16)
      ]
    });

    // Clean up particles after animation
    this.time.delayedCall(2000, () => {
      particles.destroy();
    });

    // Add screen shake for impact
    this.cameras.main.shake(200, 0.005);
  }

  /**
   * Enhanced error handling with user-friendly messages
   */
  private handleInitializationError(error: any) {
    console.error('Game initialization failed:', error);
    
    this.uxService.hideLoading();
    this.uxService.hideProgress();

    // Show user-friendly error message
    const { width, height } = this.scale;
    
    const errorContainer = this.add.container(width / 2, height / 2);
    
    // Error icon
    const errorIcon = this.add.text(0, -40, '⚠️', {
      fontSize: '48px'
    }).setOrigin(0.5);
    
    // Error message
    const errorText = this.add.text(0, 0, 'Failed to load game', {
      fontSize: '24px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.error,
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    
    const errorSubtext = this.add.text(0, 30, 'Please refresh the page and try again', {
      fontSize: '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary,
      align: 'center'
    }).setOrigin(0.5);

    // Retry button
    const retryButton = this.add.text(0, 70, '🔄 Retry', {
      fontSize: '18px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.accentCyan,
      fontStyle: 'bold',
      backgroundColor: Theme.bgSecondary,
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive();

    // Handle hover effects manually to avoid UXEnhancementService errors
    retryButton.on('pointerover', () => {
      retryButton.setTint(parseInt(Theme.primaryDark.replace('#', ''), 16));
      this.tweens.add({
        targets: retryButton,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 200,
        ease: 'Power2.easeOut'
      });
    });
    
    retryButton.on('pointerout', () => {
      retryButton.clearTint();
      this.tweens.add({
        targets: retryButton,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
        ease: 'Power2.easeOut'
      });
    });

    retryButton.on('pointerdown', () => {
      this.scene.restart();
    });

    errorContainer.add([errorIcon, errorText, errorSubtext, retryButton]);
    errorContainer.setDepth(Theme.zIndexModal);

    // Entrance animation
    errorContainer.setAlpha(0);
    this.tweens.add({
      targets: errorContainer,
      alpha: 1,
      duration: 500,
      ease: 'Power2.easeOut'
    });
  }

  /**
   * Enhanced embedded error handling
   */
  private handleEmbeddedInitializationError(error: any) {
    console.error('Embedded game initialization failed:', error);
    
    this.uxService.hideLoading();
    this.uxService.hideProgress();

    // Show Reddit-specific error message
    const { width, height } = this.scale;
    
    const errorContainer = this.add.container(width / 2, height / 2);
    
    // Error icon
    const errorIcon = this.add.text(0, -40, '🔗', {
      fontSize: '48px'
    }).setOrigin(0.5);
    
    // Error message
    const errorText = this.add.text(0, 0, 'Failed to load Reddit game', {
      fontSize: '20px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.error,
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    
    const errorSubtext = this.add.text(0, 25, 'Try refreshing the Reddit post', {
      fontSize: '14px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary,
      align: 'center'
    }).setOrigin(0.5);

    errorContainer.add([errorIcon, errorText, errorSubtext]);
    errorContainer.setDepth(Theme.zIndexModal);

    // Entrance animation
    errorContainer.setAlpha(0);
    this.tweens.add({
      targets: errorContainer,
      alpha: 1,
      duration: 500,
      ease: 'Power2.easeOut'
    });
  }

  /**
   * Setup performance display for development mode
   * Requirements: 6.4 - Performance monitoring for development
   */
  private setupPerformanceDisplay(): void {
    // Only enable in development mode
    if (process.env.NODE_ENV !== 'development') return;

    // Lazy load performance display
    import('../../utils/PerformanceDisplay').then(({ PerformanceDisplay }) => {
      this.performanceDisplay = new PerformanceDisplay(this, this.performanceManager);
      
      // Add keyboard shortcut to toggle performance display (F1 key)
      this.input.keyboard?.on('keydown-F1', () => {
        this.performanceDisplay?.toggle();
      });
      
      // Add keyboard shortcut for manual optimization (F2 key)
      this.input.keyboard?.on('keydown-F2', () => {
        this.performanceManager.optimize('manual');
      });
      
      console.log('🔧 Performance display available (F1 to toggle, F2 to optimize)');
    }).catch(error => {
      console.warn('Failed to load performance display:', error);
    });
  }

  shutdown() {
    // Clean up UX service
    this.uxService.destroy();
    
    // Clean up performance optimization components
    // Requirements: 6.4 - Cleanup performance optimization
    this.performanceManager.destroy();
    this.assetOptimizer.destroy();
    
    // Clean up performance display
    if (this.performanceDisplay) {
      this.performanceDisplay.destroy();
    }
    
    // Clean up post game manager
    if (this.postGameManager) {
      this.postGameManager.destroy();
    }
    
    // Clean up embedded game components
    if (this.guessMode) {
      this.guessMode.destroy();
      this.guessMode = null;
    }
    
    if (this.guessDashboard) {
      this.guessDashboard.destroy();
      this.guessDashboard = null;
    }
  }
}