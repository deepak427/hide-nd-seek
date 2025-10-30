import { Scene } from 'phaser';
import { Theme } from '../../style/theme';

export class Preloader extends Scene {
  private fadeOverlay!: Phaser.GameObjects.Graphics;

  constructor() {
    super('Preloader');
  }

  init() {
    const { width, height } = this.scale;
    
    // Set background color to match theme
    this.cameras.main.setBackgroundColor(Theme.primaryDark);

    // Create fade overlay for smooth transitions
    this.fadeOverlay = this.add.graphics();
    this.fadeOverlay.fillStyle(parseInt(Theme.primaryDark.replace('#', ''), 16));
    this.fadeOverlay.fillRect(0, 0, width, height);
    this.fadeOverlay.setAlpha(1);

    // Fade in from splash screen
    this.tweens.add({
      targets: this.fadeOverlay,
      alpha: 0,
      duration: 500,
      ease: 'Power2.easeInOut'
    });

    // Handle resize for fade overlay
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      const { width, height } = gameSize;
      this.fadeOverlay.clear();
      this.fadeOverlay.fillStyle(parseInt(Theme.primaryDark.replace('#', ''), 16));
      this.fadeOverlay.fillRect(0, 0, width, height);
    });
  }

  preload() {
    // Load the assets for the game
    this.load.setPath('assets');

    // Load essential game assets - using available assets
    this.load.image('background', 'assets/background.png');
    this.load.image('splash-bg', 'assets/splash.png');
    
    // Load any additional assets needed for the main menu and game
    // This is where you would load map assets, UI elements, etc.
  }

  create() {
    // When all the assets have loaded, create global animations and objects
    console.log('🎨 Assets loaded, transitioning to main menu');
    
    // Create smooth transition to MainMenu with fade effect
    this.transitionToMainMenu();
  }

  private transitionToMainMenu() {
    const { width, height } = this.scale;
    
    // Create fade out overlay
    const fadeOut = this.add.graphics();
    fadeOut.fillStyle(parseInt(Theme.primaryDark.replace('#', ''), 16));
    fadeOut.fillRect(0, 0, width, height);
    fadeOut.setAlpha(0);

    // Fade out transition
    this.tweens.add({
      targets: fadeOut,
      alpha: 1,
      duration: 300,
      ease: 'Power2.easeInOut',
      onComplete: () => {
        // Start MainMenu scene
        this.scene.start('MainMenu');
      }
    });
  }

  destroy() {
    this.scale.off('resize');
  }
}