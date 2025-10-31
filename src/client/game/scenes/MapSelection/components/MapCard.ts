import { Scene } from 'phaser';
import { Theme } from '../../../../style/theme';
import type { VirtualMap } from '../../../../../shared/types/game';

export class MapCard {
  public container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Graphics;
  private preview: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics;
  private nameText: Phaser.GameObjects.Text;
  private themeText: Phaser.GameObjects.Text;
  private releaseDateText: Phaser.GameObjects.Text;
  private difficultyBadge: Phaser.GameObjects.Container;
  private objectCountText: Phaser.GameObjects.Text;
  private playButton: Phaser.GameObjects.Container;
  private clickCallback?: () => void;

  constructor(
    private scene: Scene,
    x: number,
    y: number,
    private mapData: VirtualMap,
    private width: number,
    private height: number
  ) {
    this.container = this.scene.add.container(x, y);
    this.createCard();
    this.setupInteractions();
  }

  private createCard() {
    const isMobile = this.width < 400;
    
    // Card background with shadow
    const shadow = this.scene.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillRoundedRect(-this.width / 2 + 4, -this.height / 2 + 4, this.width, this.height, Theme.radiusLarge);
    
    this.background = this.scene.add.graphics();
    this.background.fillStyle(parseInt(Theme.secondaryDark.replace('#', ''), 16));
    this.background.fillRoundedRect(-this.width / 2, -this.height / 2, this.width, this.height, Theme.radiusLarge);
    this.background.lineStyle(2, parseInt(Theme.border.replace('rgba(238, 238, 238, 0.2)', '0xEEEEEE'), 16), 0.2);
    this.background.strokeRoundedRect(-this.width / 2, -this.height / 2, this.width, this.height, Theme.radiusLarge);
    
    // Map preview
    this.createPreview();
    
    // Map name with responsive sizing
    this.nameText = this.scene.add.text(0, -this.height / 2 + 140, this.mapData.name, {
      fontSize: isMobile ? '18px' : '24px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.lightGray,
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: this.width - 40 }
    }).setOrigin(0.5);
    
    // Theme with responsive sizing - removed hard-coded theme display
    this.themeText = this.scene.add.text(0, -this.height / 2 + 170, `Difficulty: ${(this.mapData.difficulty || 'medium').toUpperCase()}`, {
      fontSize: isMobile ? '14px' : '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.accentCyan,
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    
    // Map description instead of release date
    this.releaseDateText = this.scene.add.text(0, -this.height / 2 + 195, `${this.mapData.objects.filter(obj => obj.interactive).length} objects to find`, {
      fontSize: isMobile ? '12px' : '14px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary,
      align: 'center'
    }).setOrigin(0.5);
    
    // Difficulty badge
    this.createDifficultyBadge();
    
    // Object count
    this.createObjectCount();
    
    // Play button
    this.createPlayButton();
    
    // Add all elements to container
    this.container.add([
      shadow,
      this.background,
      this.preview,
      this.nameText,
      this.themeText,
      this.releaseDateText,
      this.difficultyBadge,
      this.objectCountText,
      this.playButton
    ]);
  }

  private createPreview() {
    const previewWidth = this.width - 20;
    const previewHeight = 120;
    const previewY = -this.height / 2 + 60;
    
    // Create preview area background
    const previewBg = this.scene.add.graphics();
    previewBg.fillStyle(parseInt(Theme.primaryDark.replace('#', ''), 16));
    previewBg.fillRoundedRect(-previewWidth / 2, previewY - previewHeight / 2, previewWidth, previewHeight, Theme.radiusMedium);
    
    // Try to load October map asset as preview
    if (this.scene.textures.exists('octmap')) {
      this.preview = this.scene.add.image(0, previewY, 'octmap');
      this.preview.setDisplaySize(previewWidth, previewHeight);
      this.preview.setTint(0xFFAA00); // Orange tint for October theme
    } else if (this.scene.textures.exists(this.mapData.backgroundAsset)) {
      this.preview = this.scene.add.image(0, previewY, this.mapData.backgroundAsset);
      this.preview.setDisplaySize(previewWidth, previewHeight);
      this.preview.setTint(0x888888); // Darken for preview effect
    } else if (this.scene.textures.exists(this.mapData.key)) {
      this.preview = this.scene.add.image(0, previewY, this.mapData.key);
      this.preview.setDisplaySize(previewWidth, previewHeight);
      this.preview.setTint(0x888888);
    } else {
      // Fallback preview with October theme
      this.preview = this.scene.add.graphics();
      (this.preview as Phaser.GameObjects.Graphics).fillStyle(parseInt('#FF6600', 16), 0.4); // Orange background
      (this.preview as Phaser.GameObjects.Graphics).fillRoundedRect(-previewWidth / 2, previewY - previewHeight / 2, previewWidth, previewHeight, Theme.radiusMedium);
      
      // Add October-themed placeholder icon
      const placeholderText = this.scene.add.text(0, previewY, '🎃', {
        fontSize: '48px'
      }).setOrigin(0.5);
      
      this.container.add(placeholderText);
    }
    
    this.container.add(previewBg);
  }

  private getThemeIcon(theme: string): string {
    const themeIcons: Record<string, string> = {
      'indoor': '🏠',
      'outdoor': '🌳',
      'urban': '🏙️',
      'nature': '🌲',
      'fantasy': '🏰',
      'space': '🚀',
      'underwater': '🌊',
      'halloween': '🎃',
      'spooky': '👻'
    };
    
    return themeIcons[theme.toLowerCase()] || '🎃'; // Default to pumpkin for October
  }

  private createDifficultyBadge() {
    const colors = {
      easy: Theme.success,
      medium: Theme.warning,
      hard: Theme.error
    };
    
    const difficulty = this.mapData.difficulty || 'medium';
    const badgeColor = colors[difficulty as keyof typeof colors] || Theme.warning;
    
    const badgeBg = this.scene.add.graphics();
    badgeBg.fillStyle(parseInt(badgeColor.replace('#', ''), 16));
    badgeBg.fillRoundedRect(-35, -12, 70, 24, 12);
    
    const badgeText = this.scene.add.text(0, 0, difficulty.toUpperCase(), {
      fontSize: '12px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.lightGray,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    this.difficultyBadge = this.scene.add.container(this.width / 2 - 45, -this.height / 2 + 25, [badgeBg, badgeText]);
  }

  private createObjectCount() {
    const interactiveCount = this.mapData.objects.filter(obj => obj.interactive).length;
    const isMobile = this.width < 400;
    
    this.objectCountText = this.scene.add.text(0, this.height / 2 - 80, 
      `${interactiveCount} hidden objects to find`, {
      fontSize: isMobile ? '12px' : '14px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary,
      align: 'center'
    }).setOrigin(0.5);
  }

  private createPlayButton() {
    const isMobile = this.width < 400;
    const buttonWidth = isMobile ? 100 : 120;
    const buttonHeight = isMobile ? 35 : 40;
    const fontSize = isMobile ? '14px' : '16px';
    
    // Button background
    const buttonBg = this.scene.add.graphics();
    buttonBg.fillStyle(parseInt(Theme.accentCyan.replace('#', ''), 16));
    buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, Theme.radiusMedium);
    
    // Button text
    const buttonText = this.scene.add.text(0, 0, 'PLAY MAP', {
      fontSize: fontSize,
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.lightGray,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    this.playButton = this.scene.add.container(0, this.height / 2 - 30, [buttonBg, buttonText]);
    this.playButton.setSize(buttonWidth, buttonHeight);
    this.playButton.setInteractive();
    
    // Button hover effects
    this.playButton.on('pointerover', () => {
      this.scene.input.setDefaultCursor('pointer');
      buttonBg.clear();
      buttonBg.fillStyle(parseInt(Theme.accentHover.replace('#', ''), 16));
      buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, Theme.radiusMedium);
      
      this.scene.tweens.add({
        targets: this.playButton,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: Theme.animationFast,
        ease: 'Power2'
      });
    });
    
    this.playButton.on('pointerout', () => {
      this.scene.input.setDefaultCursor('default');
      buttonBg.clear();
      buttonBg.fillStyle(parseInt(Theme.accentCyan.replace('#', ''), 16));
      buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, Theme.radiusMedium);
      
      this.scene.tweens.add({
        targets: this.playButton,
        scaleX: 1,
        scaleY: 1,
        duration: Theme.animationFast,
        ease: 'Power2'
      });
    });
    
    this.playButton.on('pointerdown', () => {
      this.onCardClick();
    });
  }

  private setupInteractions() {
    this.container.setSize(this.width, this.height);
    this.container.setInteractive();
    
    // Hover effects
    this.container.on('pointerover', () => {
      this.onHover();
    });
    
    this.container.on('pointerout', () => {
      this.onHoverOut();
    });
    
    // Click effect
    this.container.on('pointerdown', () => {
      this.onCardClick();
    });
  }

  private onHover() {
    // Scale up animation
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: Theme.animationFast,
      ease: 'Power2'
    });
    
    // Brighten background
    this.background.clear();
    this.background.fillStyle(parseInt(Theme.secondaryDark.replace('#', ''), 16));
    this.background.fillRoundedRect(-this.width / 2, -this.height / 2, this.width, this.height, Theme.radiusLarge);
    this.background.lineStyle(3, parseInt(Theme.accentCyan.replace('#', ''), 16));
    this.background.strokeRoundedRect(-this.width / 2, -this.height / 2, this.width, this.height, Theme.radiusLarge);
  }

  private onHoverOut() {
    // Scale back animation
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1,
      scaleY: 1,
      duration: Theme.animationFast,
      ease: 'Power2'
    });
    
    // Reset background
    this.background.clear();
    this.background.fillStyle(parseInt(Theme.secondaryDark.replace('#', ''), 16));
    this.background.fillRoundedRect(-this.width / 2, -this.height / 2, this.width, this.height, Theme.radiusLarge);
    this.background.lineStyle(2, parseInt(Theme.border.replace('rgba(238, 238, 238, 0.2)', '0xEEEEEE'), 16), 0.2);
    this.background.strokeRoundedRect(-this.width / 2, -this.height / 2, this.width, this.height, Theme.radiusLarge);
  }

  private onCardClick() {
    // Click animation
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 0.95,
      scaleY: 0.95,
      duration: 100,
      ease: 'Power2',
      yoyo: true,
      onComplete: () => {
        if (this.clickCallback) {
          this.clickCallback();
        }
      }
    });
  }

  public onClick(callback: () => void) {
    this.clickCallback = callback;
  }

  public destroy() {
    // Clean up tweens first
    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.killTweensOf(this.playButton);
    
    // Then destroy the container
    this.container.destroy();
  }
}