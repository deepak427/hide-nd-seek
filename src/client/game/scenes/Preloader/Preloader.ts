import { Scene } from 'phaser';
import { Theme } from '../../../style/theme';

export class Preloader extends Scene {
  private loadingBar!: Phaser.GameObjects.Graphics;
  private loadingBarBg!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;

  constructor() {
    super('Preloader');
  }

  preload() {
    this.createLoadingScreen();
    this.loadAssets();
    this.setupLoadingEvents();
  }

  private createLoadingScreen() {
    const { width, height } = this.scale;

    // Background
    this.cameras.main.setBackgroundColor(Theme.primaryDark);

    // Title
    const title = this.add.text(width / 2, height / 2 - 120, 'HIDE & SEEK', {
      fontSize: '42px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.accentCyan,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(width / 2, height / 2 - 80, 'Find the hidden objects!', {
      fontSize: '18px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary
    }).setOrigin(0.5);

    // Loading bar background
    this.loadingBarBg = this.add.graphics();
    this.loadingBarBg.fillStyle(parseInt(Theme.secondaryDark.replace('#', ''), 16));
    this.loadingBarBg.fillRoundedRect(width / 2 - 150, height / 2 - 10, 300, 20, 10);

    // Loading bar
    this.loadingBar = this.add.graphics();

    // Loading text
    this.loadingText = this.add.text(width / 2, height / 2 + 50, 'Loading assets...', {
      fontSize: '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary
    }).setOrigin(0.5);

    // Progress percentage
    this.progressText = this.add.text(width / 2, height / 2 - 40, '0%', {
      fontSize: '14px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textMuted
    }).setOrigin(0.5);

    // Add subtle animations
    this.tweens.add({
      targets: [title, subtitle],
      alpha: { from: 0, to: 1 },
      duration: 800,
      ease: 'Power2'
    });

    // Handle resize
    this.scale.on('resize', this.handleResize, this);
  }

  private loadAssets() {
    // Load game assets - using only available assets
    this.load.image('background', 'assets/background.png');
    this.load.image('splash-bg', 'assets/splash.png');

    // Load map - using octmap as the main map
    this.load.image('octmap', 'assets/octmap.png');
    this.load.image('bedroom', 'assets/octmap.png'); // Use octmap as bedroom fallback

    // Load hiding objects - using available assets
    this.load.image('pumpkin', 'assets/pumpkin.png');
    this.load.image('wardrobe', 'assets/wardrobe.png');
    this.load.image('bush', 'assets/bush.png');
    this.load.image('car', 'assets/car.png');
    this.load.image('truck', 'assets/truck.png');
    this.load.image('guard', 'assets/guard.png');

    // Create fallback textures for missing assets
    this.createFallbackTextures();
  }

  private createFallbackTextures() {
    // Create fallback textures for assets that don't exist
    const fallbackAssets = ['button-bg', 'panel-bg'];

    fallbackAssets.forEach(key => {
      this.load.on('loaderror', (file: any) => {
        if (file.key === key) {
          this.createColoredTexture(key, 64, 64, '#393E46');
        }
      });
    });
  }

  private createColoredTexture(key: string, width: number, height: number, color: string) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);

    // Add a simple icon or pattern
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(key.toUpperCase(), width / 2, height / 2);

    const fallbackImage = new Image();
    fallbackImage.onload = () => {
      this.textures.addImage(key, fallbackImage);
    };
    fallbackImage.src = canvas.toDataURL();
  }

  private setupLoadingEvents() {
    // Update loading bar on progress
    this.load.on('progress', (progress: number) => {
      this.updateLoadingBar(progress);
    });

    // Update loading text on file load
    this.load.on('fileprogress', (file: Phaser.Loader.File) => {
      this.loadingText.setText(`Loading ${file.key}...`);
    });

    // Handle load complete
    this.load.on('complete', () => {
      this.loadingText.setText('Ready!');
      this.time.delayedCall(500, () => {
        this.scene.start('MainMenu');
      });
    });
  }

  private updateLoadingBar(progress: number) {
    const { width, height } = this.scale;

    // Clear and redraw loading bar
    this.loadingBar.clear();
    this.loadingBar.fillStyle(parseInt(Theme.accentCyan.replace('#', ''), 16));
    this.loadingBar.fillRoundedRect(
      width / 2 - 150,
      height / 2 - 10,
      300 * progress,
      20,
      10
    );

    // Update progress text
    this.progressText.setText(`${Math.round(progress * 100)}%`);
  }

  private handleResize = (gameSize: Phaser.Structs.Size) => {
    const { width, height } = gameSize;

    // Reposition all elements
    const title = this.children.getByName('title') as Phaser.GameObjects.Text;
    if (title) title.setPosition(width / 2, height / 2 - 120);

    // Update loading bar position
    this.loadingBarBg.clear();
    this.loadingBarBg.fillStyle(parseInt(Theme.secondaryDark.replace('#', ''), 16));
    this.loadingBarBg.fillRoundedRect(width / 2 - 150, height / 2 - 10, 300, 20, 10);

    this.loadingText.setPosition(width / 2, height / 2 + 50);
    this.progressText.setPosition(width / 2, height / 2 - 40);
  };

  create() {
    console.log('📦 Preloader scene initialized');
  }
}