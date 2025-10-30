import { Scene } from 'phaser';
import { Theme } from '../../style/theme';

export class GameOver extends Scene {
  private background!: Phaser.GameObjects.Graphics;
  private gameOverText!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;
  private restartButton!: Phaser.GameObjects.Container;
  private menuButton!: Phaser.GameObjects.Container;

  constructor() {
    super('GameOver');
  }

  create() {
    console.log('💀 GameOver scene initialized');
    
    this.createBackground();
    this.createTexts();
    this.createButtons();
    this.setupAnimations();
    this.setupResize();
  }

  private createBackground() {
    const { width, height } = this.scale;
    
    // Gradient background
    this.background = this.add.graphics();
    this.background.fillGradientStyle(
      parseInt(Theme.bgDark.replace('#', ''), 16),
      parseInt(Theme.bgDark.replace('#', ''), 16),
      parseInt(Theme.error.replace('#', ''), 16, 0.3),
      parseInt(Theme.error.replace('#', ''), 16, 0.3),
      1
    );
    this.background.fillRect(0, 0, width, height);
  }

  private createTexts() {
    const { width, height } = this.scale;
    
    // Game Over title
    this.gameOverText = this.add.text(width / 2, height * 0.3, 'GAME OVER', {
      fontSize: '64px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.error,
      fontStyle: 'bold',
      stroke: Theme.bgDark,
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // Subtitle
    this.subtitleText = this.add.text(width / 2, height * 0.45, 'Better luck next time!', {
      fontSize: '24px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary,
      align: 'center'
    }).setOrigin(0.5);
  }

  private createButtons() {
    const { width, height } = this.scale;
    
    // Restart button
    this.restartButton = this.createButton(
      width / 2,
      height * 0.65,
      'TRY AGAIN',
      Theme.primary,
      () => this.restartGame()
    );
    
    // Menu button
    this.menuButton = this.createButton(
      width / 2,
      height * 0.75,
      'MAIN MENU',
      Theme.bgLight,
      () => this.goToMenu()
    );
  }

  private createButton(x: number, y: number, text: string, color: string, onClick: () => void): Phaser.GameObjects.Container {
    // Button background
    const bg = this.add.graphics();
    bg.fillStyle(parseInt(color.replace('#', ''), 16));
    bg.fillRoundedRect(-100, -25, 200, 50, Theme.radiusMedium);
    
    // Button text
    const buttonText = this.add.text(0, 0, text, {
      fontSize: '20px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textPrimary,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Container
    const container = this.add.container(x, y, [bg, buttonText]);
    container.setSize(200, 50);
    container.setInteractive();
    
    // Hover effects
    container.on('pointerover', () => {
      bg.clear();
      const hoverColor = color === Theme.primary ? Theme.primaryDark : Theme.bgCard;
      bg.fillStyle(parseInt(hoverColor.replace('#', ''), 16));
      bg.fillRoundedRect(-100, -25, 200, 50, Theme.radiusMedium);
      
      this.tweens.add({
        targets: container,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: Theme.animationFast,
        ease: 'Power2'
      });
    });
    
    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(parseInt(color.replace('#', ''), 16));
      bg.fillRoundedRect(-100, -25, 200, 50, Theme.radiusMedium);
      
      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: Theme.animationFast,
        ease: 'Power2'
      });
    });
    
    container.on('pointerdown', onClick);
    
    return container;
  }

  private setupAnimations() {
    // Title pulse animation
    this.tweens.add({
      targets: this.gameOverText,
      scaleX: { from: 1, to: 1.05 },
      scaleY: { from: 1, to: 1.05 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Entrance animations
    this.gameOverText.setAlpha(0);
    this.subtitleText.setAlpha(0);
    this.restartButton.setAlpha(0);
    this.menuButton.setAlpha(0);
    
    // Stagger entrance
    this.tweens.add({
      targets: this.gameOverText,
      alpha: 1,
      y: this.gameOverText.y - 30,
      duration: 600,
      ease: 'Power2'
    });
    
    this.tweens.add({
      targets: this.subtitleText,
      alpha: 1,
      delay: 300,
      duration: 500,
      ease: 'Power2'
    });
    
    this.tweens.add({
      targets: this.restartButton,
      alpha: 1,
      scaleX: { from: 0, to: 1 },
      scaleY: { from: 0, to: 1 },
      delay: 600,
      duration: 400,
      ease: 'Back.easeOut'
    });
    
    this.tweens.add({
      targets: this.menuButton,
      alpha: 1,
      scaleX: { from: 0, to: 1 },
      scaleY: { from: 0, to: 1 },
      delay: 750,
      duration: 400,
      ease: 'Back.easeOut'
    });
  }

  private setupResize() {
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.handleResize(gameSize.width, gameSize.height);
    });
  }

  private handleResize(width: number, height: number) {
    // Update background
    this.background.clear();
    this.background.fillGradientStyle(
      parseInt(Theme.bgDark.replace('#', ''), 16),
      parseInt(Theme.bgDark.replace('#', ''), 16),
      parseInt(Theme.error.replace('#', ''), 16, 0.3),
      parseInt(Theme.error.replace('#', ''), 16, 0.3),
      1
    );
    this.background.fillRect(0, 0, width, height);
    
    // Update text positions
    this.gameOverText.setPosition(width / 2, height * 0.3);
    this.subtitleText.setPosition(width / 2, height * 0.45);
    
    // Update button positions
    this.restartButton.setPosition(width / 2, height * 0.65);
    this.menuButton.setPosition(width / 2, height * 0.75);
  }

  private restartGame() {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MapSelection');
    });
  }

  private goToMenu() {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MainMenu');
    });
  }
}