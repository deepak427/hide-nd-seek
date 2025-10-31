import { Scene } from 'phaser';
import { Theme } from '../../style/theme';

export class SplashScene extends Scene {
  private loadingSprite!: Phaser.GameObjects.Sprite;
  private titleText!: Phaser.GameObjects.Text;
  private loadingText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBarBg!: Phaser.GameObjects.Graphics;
  private loadingProgress: number = 0;
  private animationComplete: boolean = false;
  private assetsLoaded: boolean = false;

  constructor() {
    super('SplashScene');
  }

  preload() {
    try {
      // Set background color
      this.cameras.main.setBackgroundColor(Theme.primaryDark);

      // Create loading animation sprite sheet programmatically
      this.createLoadingSprite();

      // Load any additional assets needed for the splash screen
      this.load.image('splash-bg', 'assets/splash.png');
      
      // Track loading progress
      this.load.on('progress', (progress: number) => {
        this.updateProgress(progress * 100);
      });

      this.load.on('complete', () => {
        this.assetsLoaded = true;
        this.checkTransitionReady();
      });

      // Add error handling for asset loading
      this.load.on('loaderror', (file: any) => {
        console.warn(`Failed to load asset: ${file.key}`);
      });
    } catch (error) {
      console.error('❌ SplashScene preload failed:', error);
      // Continue anyway - we can work without assets
      this.assetsLoaded = true;
    }
  }

  create() {
    try {
      const { width, height } = this.scale;

      // Create fade-in overlay for smooth entrance
      const fadeIn = this.add.graphics();
      fadeIn.fillStyle(parseInt(Theme.primaryDark.replace('#', ''), 16));
      fadeIn.fillRect(0, 0, width, height);
      fadeIn.setAlpha(1);

      // Create background
      this.createBackground(width, height);

    // Create title
    this.createTitle(width, height);

    // Create loading animation
    this.createLoadingAnimation(width, height);

    // Create progress bar
    this.createProgressBar(width, height);

    // Create loading text
    this.createLoadingText(width, height);

    // Fade in the scene
    this.tweens.add({
      targets: fadeIn,
      alpha: 0,
      duration: 500,
      ease: 'Power2.easeInOut',
      onComplete: () => {
        fadeIn.destroy();
      }
    });

    // Start the loading animation sequence
    this.startLoadingSequence();

    // Handle resize
    this.scale.on('resize', this.handleResize, this);

      // Allow click/tap to skip after animation completes
      this.input.once('pointerdown', () => {
        if (this.animationComplete && this.assetsLoaded) {
          this.transitionToMainMenu();
        }
      });
    } catch (error) {
      console.error('❌ SplashScene create failed:', error);
      // Fallback: go directly to preloader
      this.time.delayedCall(1000, () => {
        this.scene.start('Preloader');
      });
    }
  }

  private createLoadingSprite() {
    // Create individual frame textures for animation
    for (let frame = 0; frame < 8; frame++) {
      const canvas = this.textures.createCanvas(`loading-frame-${frame}`, 64, 64);
      if (!canvas) continue;
      
      const context = canvas.getContext();
      
      // Clear canvas
      context.clearRect(0, 0, 64, 64);
      
      // Draw rotating circles
      const centerX = 32;
      const centerY = 32;
      const radius = 20;
      
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8 + (frame * Math.PI * 2) / 8;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        // Fade effect based on position
        const alpha = (i + frame) % 8 / 8;
        context.globalAlpha = alpha;
        
        // Draw circle
        context.fillStyle = Theme.accentCyan;
        context.beginPath();
        context.arc(x, y, 4, 0, Math.PI * 2);
        context.fill();
      }
      
      canvas.refresh();
    }
  }

  private createBackground(width: number, height: number) {
    // Create gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(
      parseInt(Theme.primaryDark.replace('#', ''), 16),
      parseInt(Theme.primaryDark.replace('#', ''), 16),
      parseInt(Theme.secondaryDark.replace('#', ''), 16),
      parseInt(Theme.secondaryDark.replace('#', ''), 16),
      1
    );
    bg.fillRect(0, 0, width, height);
  }

  private createTitle(width: number, height: number) {
    this.titleText = this.add.text(width / 2, height / 2 - 100, 'HIDE & SEEK', {
      fontSize: '48px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.lightGray,
      fontStyle: 'bold',
      stroke: Theme.primaryDark,
      strokeThickness: 2
    }).setOrigin(0.5);

    // Add glow effect using setShadow method
    this.titleText.setShadow(0, 0, Theme.accentCyan, 10);

    // Animate title entrance
    this.titleText.setAlpha(0);
    this.titleText.setScale(0.8);
    
    this.tweens.add({
      targets: this.titleText,
      alpha: 1,
      scale: 1,
      duration: 1000,
      ease: 'Back.easeOut'
    });
  }

  private createLoadingAnimation(width: number, height: number) {
    // Create loading sprite using first frame
    this.loadingSprite = this.add.sprite(width / 2, height / 2, 'loading-frame-0');
    this.loadingSprite.setScale(1.5);
    this.loadingSprite.setAlpha(0);

    // Create animation using individual frame textures
    const frames = [];
    for (let i = 0; i < 8; i++) {
      frames.push({ key: `loading-frame-${i}` });
    }

    this.anims.create({
      key: 'loading-spin',
      frames: frames,
      frameRate: 12,
      repeat: -1
    });

    // Animate sprite entrance
    this.tweens.add({
      targets: this.loadingSprite,
      alpha: 1,
      duration: 500,
      delay: 500,
      onComplete: () => {
        this.loadingSprite.play('loading-spin');
      }
    });
  }

  private createProgressBar(width: number, height: number) {
    const barWidth = 300;
    const barHeight = 8;
    const barX = width / 2 - barWidth / 2;
    const barY = height / 2 + 80;

    // Background
    this.progressBarBg = this.add.graphics();
    this.progressBarBg.fillStyle(parseInt(Theme.secondaryDark.replace('#', ''), 16), 0.5);
    this.progressBarBg.fillRoundedRect(barX, barY, barWidth, barHeight, 4);

    // Progress bar
    this.progressBar = this.add.graphics();
    this.updateProgressBar(0, barX, barY, barWidth, barHeight);
  }

  private createLoadingText(width: number, height: number) {
    this.loadingText = this.add.text(width / 2, height / 2 + 120, 'Loading...', {
      fontSize: '18px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.lightGray
    }).setOrigin(0.5).setAlpha(0.8);

    // Animate loading text
    this.tweens.add({
      targets: this.loadingText,
      alpha: { from: 0.8, to: 0.4 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Add "Made with love by Deepu" text at bottom
    this.add.text(width / 2, height - 30, '❤️ Made with love by Deepu', {
      fontSize: '14px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textMuted
    }).setOrigin(0.5);
  }

  private updateProgressBar(progress: number, x: number, y: number, width: number, height: number) {
    // Check if progress bar is initialized before trying to use it
    if (!this.progressBar) {
      return;
    }
    
    this.progressBar.clear();
    
    if (progress > 0) {
      // Create gradient effect
      const progressWidth = (width * progress) / 100;
      this.progressBar.fillGradientStyle(
        parseInt(Theme.accentCyan.replace('#', ''), 16),
        parseInt(Theme.accentCyan.replace('#', ''), 16),
        parseInt('#007a80', 16),
        parseInt('#007a80', 16),
        1
      );
      this.progressBar.fillRoundedRect(x, y, progressWidth, height, 4);
    }
  }

  private updateProgress(progress: number) {
    this.loadingProgress = Math.min(100, progress);
    
    // Only update progress bar if it's been created
    if (!this.progressBar) {
      return;
    }
    
    const { width, height } = this.scale;
    const barWidth = 300;
    const barX = width / 2 - barWidth / 2;
    const barY = height / 2 + 80;
    
    this.updateProgressBar(this.loadingProgress, barX, barY, barWidth, 8);

    // Update loading text based on progress
    if (progress < 30) {
      this.loadingText.setText('Initializing game engine...');
    } else if (progress < 60) {
      this.loadingText.setText('Loading assets...');
    } else if (progress < 90) {
      this.loadingText.setText('Setting up scenes...');
    } else {
      this.loadingText.setText('Ready to play!');
    }
  }

  private startLoadingSequence() {
    // Simulate loading progress
    let progress = 0;
    const progressInterval = this.time.addEvent({
      delay: 100,
      callback: () => {
        progress += Math.random() * 15;
        this.updateProgress(progress);
        
        if (progress >= 100) {
          progressInterval.destroy();
          this.animationComplete = true;
          this.checkTransitionReady();
        }
      },
      loop: true
    });
  }

  private checkTransitionReady() {
    if (this.animationComplete && this.assetsLoaded) {
      // Add a brief delay before allowing transition
      this.time.delayedCall(500, () => {
        this.loadingText.setText('Tap to continue');
        
        // Add pulsing effect to indicate interactivity
        this.tweens.add({
          targets: this.loadingText,
          scale: { from: 1, to: 1.1 },
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      });
    }
  }

  private transitionToMainMenu() {
    const { width, height } = this.scale;
    
    // Create fade out overlay
    const fadeOut = this.add.graphics();
    fadeOut.fillStyle(parseInt(Theme.primaryDark.replace('#', ''), 16));
    fadeOut.fillRect(0, 0, width, height);
    fadeOut.setAlpha(0);

    // Fade out all elements and overlay
    this.tweens.add({
      targets: [this.titleText, this.loadingSprite, this.loadingText, this.progressBar, this.progressBarBg],
      alpha: 0,
      duration: 300,
      ease: 'Power2.easeInOut'
    });

    this.tweens.add({
      targets: fadeOut,
      alpha: 1,
      duration: 500,
      ease: 'Power2.easeInOut',
      onComplete: () => {
        this.scene.start('Preloader');
      }
    });
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    const { width, height } = gameSize;
    
    // Reposition elements
    if (this.titleText) {
      this.titleText.setPosition(width / 2, height / 2 - 100);
    }
    
    if (this.loadingSprite) {
      this.loadingSprite.setPosition(width / 2, height / 2);
    }
    
    if (this.loadingText) {
      this.loadingText.setPosition(width / 2, height / 2 + 120);
    }
    
    // Recreate progress bar with new dimensions
    if (this.progressBar && this.progressBarBg) {
      const barWidth = Math.min(300, width * 0.6);
      const barHeight = 8;
      const barX = width / 2 - barWidth / 2;
      const barY = height / 2 + 80;
      
      this.progressBarBg.clear();
      this.progressBarBg.fillStyle(parseInt(Theme.secondaryDark.replace('#', ''), 16), 0.5);
      this.progressBarBg.fillRoundedRect(barX, barY, barWidth, barHeight, 4);
      
      this.updateProgressBar(this.loadingProgress, barX, barY, barWidth, barHeight);
    }
  }

  destroy() {
    this.scale.off('resize', this.handleResize, this);
  }
}