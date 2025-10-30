import { Scene } from 'phaser';
import { Theme } from '../../style/theme';
import { EnvironmentDetector } from '../services/EnvironmentDetector';

export class Boot extends Scene {
  private environmentDetector: EnvironmentDetector;

  constructor() {
    super('Boot');
    this.environmentDetector = EnvironmentDetector.getInstance();
  }

  preload() {
    // Enhanced boot screen with loading indicator
    this.cameras.main.setBackgroundColor(Theme.bgPrimary);
    
    // Create a simple loading indicator
    const { width, height } = this.scale;
    
    // Add boot logo or title
    const title = this.add.text(width / 2, height / 2 - 50, 'HIDE & SEEK', {
      fontSize: '48px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.accentCyan,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Add loading text
    const loadingText = this.add.text(width / 2, height / 2 + 50, 'Initializing...', {
      fontSize: '18px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary
    }).setOrigin(0.5);
    
    // Add subtle animation to title
    this.tweens.add({
      targets: title,
      alpha: { from: 0.7, to: 1 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Handle resize
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      const { width, height } = gameSize;
      title.setPosition(width / 2, height / 2 - 50);
      loadingText.setPosition(width / 2, height / 2 + 50);
    });
  }

  create() {
    // Enhanced boot sequence with environment detection
    console.log('🔧 Boot scene initialized');
    console.log('🎮 Phaser version:', (this.game as any).version || 'Unknown');
    console.log('🖥️ Renderer type:', this.renderer.type === 0 ? 'Canvas' : 'WebGL');
    
    // Check if renderer is properly initialized
    if (this.renderer) {
      console.log('✅ Renderer initialized successfully');
    } else {
      console.error('❌ Renderer failed to initialize');
    }
    
    // Get game initialization data from global game object
    const gameInitData = (this.game as any).gameInitData;
    console.log('🚀 BOOT: Boot scene starting');
    console.log('🚀 BOOT: Game init data received:', gameInitData);
    console.log('🚀 BOOT: Game init data properties:', {
      mapKey: gameInitData?.mapKey,
      mode: gameInitData?.mode,
      gameId: gameInitData?.gameId,
      objectKey: gameInitData?.objectKey,
      environment: gameInitData?.environment
    });
    
    // Detect environment (use from init data if available, otherwise detect)
    const detection = gameInitData?.environment || this.environmentDetector.detect();
    console.log(`🚀 BOOT: Environment detected:`, detection);
    
    // Add a small delay for better UX
    this.time.delayedCall(500, () => {
      try {
        console.log('🚀 BOOT: Deciding which scene to start...');
        console.log('🚀 BOOT: Detection mode:', detection.mode);
        console.log('🚀 BOOT: GameInitData mode:', gameInitData?.mode);
        console.log('🚀 BOOT: Should go to guessing?', detection.mode === 'embedded' || gameInitData?.mode === 'guessing');
        
        if (detection.mode === 'embedded' || gameInitData?.mode === 'guessing' || gameInitData?.mode === 'dashboard') {
          // Skip splash and menu for embedded mode or guessing/dashboard mode - go directly to game
          console.log('🚀 BOOT: GOING TO EMBEDDED MODE - Starting game directly');
          const gameData = {
            mapKey: gameInitData?.mapKey || 'octmap',
            mode: gameInitData?.mode || 'guessing',
            gameId: gameInitData?.gameId,
            postId: gameInitData?.postId,
            userId: gameInitData?.userId,
            objectKey: gameInitData?.objectKey,
            userRole: gameInitData?.userRole,
            hidingSpot: gameInitData?.hidingSpot,
            environment: detection
          };
          console.log('🚀 BOOT: Game data being passed to Game scene:', gameData);
          this.scene.start('Game', gameData);
        } else {
          // Normal flow for standalone mode
          console.log('🚀 BOOT: GOING TO HIDING MODE - Starting splash screen');
          const splashData = {
            mapKey: gameInitData?.mapKey || 'octmap',
            mode: gameInitData?.mode || 'hiding',
            environment: detection
          };
          console.log('🚀 BOOT: Splash data being passed:', splashData);
          this.scene.start('SplashScene', splashData);
        }
      } catch (error) {
        console.error('❌ BOOT: Failed to start next scene:', error);
      }
    });
  }
}