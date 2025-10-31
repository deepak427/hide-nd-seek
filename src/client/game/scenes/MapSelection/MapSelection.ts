import { Scene } from 'phaser';
import { Theme } from '../../../style/theme';
import { MapCard } from './components/MapCard';
import { SceneTransition } from '../../utils/SceneTransition';
import type { VirtualMap } from '../../../../shared/types/game';

export class MapSelection extends Scene {
  private background!: Phaser.GameObjects.Graphics;
  private title!: Phaser.GameObjects.Text;
  private subtitle!: Phaser.GameObjects.Text;
  private backButton!: Phaser.GameObjects.Container;
  private mapCards: MapCard[] = [];
  private loadingText!: Phaser.GameObjects.Text;
  private errorText!: Phaser.GameObjects.Text;
  private monthlyMapInfo!: Phaser.GameObjects.Container;
  
  private currentMonthlyMap: VirtualMap | null = null;
  private isLoading = false;
  private resizeTimeout?: NodeJS.Timeout;

  constructor() {
    super('MapSelection');
  }

  create() {
    console.log('🗺️ MapSelection scene initialized');
    
    this.createBackground();
    this.createHeader();
    this.createLoadingState();
    this.setupResize();
    
    // Load monthly map data
    this.loadMonthlyMapData();
    
    // Create smooth entrance animation
    SceneTransition.getInstance().createSceneEntrance(this, 'slide', 600);
  }

  private createBackground() {
    const { width, height } = this.scale;
    
    // Gradient background using correct theme properties
    this.background = this.add.graphics();
    this.background.fillGradientStyle(
      parseInt(Theme.primaryDark.replace('#', ''), 16),
      parseInt(Theme.primaryDark.replace('#', ''), 16),
      parseInt(Theme.secondaryDark.replace('#', ''), 16),
      parseInt(Theme.secondaryDark.replace('#', ''), 16),
      1
    );
    this.background.fillRect(0, 0, width, height);
  }

  private createHeader() {
    const { width, height } = this.scale;
    const isMobile = width < 768;
    
    // Title with responsive sizing - changed to "SELECT MAP"
    this.title = this.add.text(width / 2, height * 0.08, 'SELECT MAP', {
      fontSize: isMobile ? '28px' : '42px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.lightGray,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Add glow effect to title (safely)
    try {
      this.title.setShadow(0, 0, Theme.accentCyan, isMobile ? 5 : 8);
    } catch (error) {
      console.warn('Failed to set title shadow:', error);
    }
    
    // Subtitle with responsive sizing - removed hard-coded text
    this.subtitle = this.add.text(width / 2, height * 0.12, 'Choose your hiding spot', {
      fontSize: isMobile ? '14px' : '18px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary,
      align: 'center',
      wordWrap: { width: width * 0.8 }
    }).setOrigin(0.5);
    
    // Back button and close button
    this.createBackButton();
    this.createCloseButton();
  }

  private createLoadingState() {
    const { width, height } = this.scale;
    const isMobile = width < 768;
    
    // Loading text with responsive sizing - removed hard-coded "October"
    this.loadingText = this.add.text(width / 2, height / 2, 'Loading maps...', {
      fontSize: isMobile ? '18px' : '24px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary,
      align: 'center'
    }).setOrigin(0.5);
    
    // Error text (initially hidden) with responsive sizing
    this.errorText = this.add.text(width / 2, height / 2 + 50, '', {
      fontSize: isMobile ? '14px' : '18px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.error,
      align: 'center',
      wordWrap: { width: width * 0.8 }
    }).setOrigin(0.5).setVisible(false);
    
    // Loading animation
    this.tweens.add({
      targets: this.loadingText,
      alpha: { from: 1, to: 0.5 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createBackButton() {
    const { width, height } = this.scale;
    const isMobile = width < 768;
    
    // Responsive button sizing
    const buttonWidth = isMobile ? 80 : 100;
    const buttonHeight = isMobile ? 35 : 40;
    const fontSize = isMobile ? '14px' : '16px';
    
    // Back button background
    const backBg = this.add.graphics();
    backBg.fillStyle(parseInt(Theme.secondaryDark.replace('#', ''), 16));
    backBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, Theme.radiusMedium);
    backBg.lineStyle(2, parseInt(Theme.border.replace('rgba(238, 238, 238, 0.2)', '0xEEEEEE'), 16), 0.2);
    backBg.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, Theme.radiusMedium);
    
    // Back button text
    const backText = this.add.text(0, 0, '← BACK', {
      fontSize: fontSize,
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.lightGray,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Container with safe positioning
    const buttonX = Math.max(buttonWidth/2 + 10, width * 0.08);
    const buttonY = Math.max(buttonHeight/2 + 10, height * 0.05);
    
    this.backButton = this.add.container(buttonX, buttonY, [backBg, backText]);
    this.backButton.setSize(buttonWidth, buttonHeight);
    this.backButton.setInteractive();
    
    // Hover effects
    this.backButton.on('pointerover', () => {
      this.input.setDefaultCursor('pointer');
      backBg.clear();
      backBg.fillStyle(parseInt(Theme.accentCyan.replace('#', ''), 16));
      backBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, Theme.radiusMedium);
      
      this.tweens.add({
        targets: this.backButton,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: Theme.animationFast,
        ease: 'Power2'
      });
    });
    
    this.backButton.on('pointerout', () => {
      this.input.setDefaultCursor('default');
      backBg.clear();
      backBg.fillStyle(parseInt(Theme.secondaryDark.replace('#', ''), 16));
      backBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, Theme.radiusMedium);
      backBg.lineStyle(2, parseInt(Theme.border.replace('rgba(238, 238, 238, 0.2)', '0xEEEEEE'), 16), 0.2);
      backBg.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, Theme.radiusMedium);
      
      this.tweens.add({
        targets: this.backButton,
        scaleX: 1,
        scaleY: 1,
        duration: Theme.animationFast,
        ease: 'Power2'
      });
    });
    
    this.backButton.on('pointerdown', () => {
      this.goBack();
    });
  }

  private createCloseButton() {
    const { width, height } = this.scale;
    const isMobile = width < 768;
    
    // Close button (X) in top-right corner
    const closeSize = isMobile ? 35 : 40;
    
    // Close button background
    const closeBg = this.add.graphics();
    closeBg.fillStyle(parseInt(Theme.error.replace('#', ''), 16));
    closeBg.fillCircle(0, 0, closeSize / 2);
    
    // Close button text
    const closeText = this.add.text(0, 0, '✕', {
      fontSize: isMobile ? '18px' : '20px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.lightGray,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Position in top-right corner
    const buttonX = width - closeSize / 2 - 20;
    const buttonY = closeSize / 2 + 20;
    
    const closeButton = this.add.container(buttonX, buttonY, [closeBg, closeText]);
    closeButton.setSize(closeSize, closeSize);
    closeButton.setInteractive();
    
    // Hover effects
    closeButton.on('pointerover', () => {
      this.input.setDefaultCursor('pointer');
      closeBg.clear();
      closeBg.fillStyle(parseInt(Theme.error.replace('#', ''), 16), 0.8);
      closeBg.fillCircle(0, 0, closeSize / 2);
      
      this.tweens.add({
        targets: closeButton,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 150,
        ease: 'Power2'
      });
    });
    
    closeButton.on('pointerout', () => {
      this.input.setDefaultCursor('default');
      closeBg.clear();
      closeBg.fillStyle(parseInt(Theme.error.replace('#', ''), 16));
      closeBg.fillCircle(0, 0, closeSize / 2);
      
      this.tweens.add({
        targets: closeButton,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
        ease: 'Power2'
      });
    });
    
    closeButton.on('pointerdown', () => {
      this.goBack();
    });
  }

  private async loadMonthlyMapData() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.showLoadingState();
    
    try {
      // Fetch current monthly map data
      const response = await fetch('/api/map');
      
      if (!response.ok) {
        throw new Error(`Failed to load map data: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.currentMonthlyMap = data.currentMap;
      
      // Hide loading and show map
      this.hideLoadingState();
      this.createMonthlyMapDisplay();
      this.setupAnimations();
      
    } catch (error) {
      console.error('Failed to load monthly map:', error);
      this.showErrorState(error instanceof Error ? error.message : 'Failed to load map data');
      
      // Fallback to demo map
      this.createFallbackMap();
    } finally {
      this.isLoading = false;
    }
  }

  private createFallbackMap() {
    // Create Octmap fallback
    this.currentMonthlyMap = {
      key: 'octmap',
      name: 'Octmap',
      theme: 'indoor',
      releaseDate: Date.now(),
      backgroundAsset: 'octmap',
      objects: [
        { key: 'pumpkin', name: 'Pumpkin', x: 100, y: 200, width: 32, height: 32, interactive: true },
        { key: 'wardrobe', name: 'Wardrobe', x: 300, y: 150, width: 64, height: 128, interactive: true },
        { key: 'bush', name: 'Bush', x: 500, y: 300, width: 32, height: 32, interactive: true },
        { key: 'car', name: 'Car', x: 200, y: 100, width: 64, height: 32, interactive: true },
        { key: 'truck', name: 'Truck', x: 400, y: 250, width: 64, height: 32, interactive: true },
        { key: 'guard', name: 'Guard', x: 350, y: 180, width: 32, height: 64, interactive: true }
      ],
      difficulty: 'medium'
    };
    
    this.hideLoadingState();
    this.createMonthlyMapDisplay();
    this.setupAnimations();
  }

  private createMonthlyMapDisplay() {
    if (!this.currentMonthlyMap) return;
    
    const { width, height } = this.scale;
    
    // Create monthly map info panel
    this.createMonthlyMapInfo();
    
    // Create the main map card
    const cardWidth = Math.min(600, width * 0.8);
    const cardHeight = Math.min(400, height * 0.5);
    
    const mapCard = new MapCard(
      this, 
      width / 2, 
      height * 0.55, 
      this.currentMonthlyMap, 
      cardWidth, 
      cardHeight
    );
    
    mapCard.onClick(() => {
      this.selectMap(this.currentMonthlyMap!.key);
    });
    
    this.mapCards.push(mapCard);
  }

  private createMonthlyMapInfo() {
    if (!this.currentMonthlyMap) return;
    
    const { width, height } = this.scale;
    const isMobile = width < 768;
    
    // Responsive panel sizing
    const panelWidth = Math.min(400, width * 0.9);
    const panelHeight = isMobile ? 70 : 60;
    
    // Create info panel background
    const infoBg = this.add.graphics();
    infoBg.fillStyle(parseInt(Theme.secondaryDark.replace('#', ''), 16), 0.9);
    infoBg.fillRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, Theme.radiusLarge);
    infoBg.lineStyle(2, parseInt(Theme.accentCyan.replace('#', ''), 16), 0.5);
    infoBg.strokeRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, Theme.radiusLarge);
    
    // Map info with responsive sizing - removed hard-coded theme and dates
    const mapNameText = this.add.text(0, -10, this.currentMonthlyMap.name, {
      fontSize: isMobile ? '16px' : '18px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.accentCyan,
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    
    const objectCountText = this.add.text(0, 10, `${this.currentMonthlyMap.objects.filter(obj => obj.interactive).length} objects to find`, {
      fontSize: isMobile ? '12px' : '14px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary,
      align: 'center'
    }).setOrigin(0.5);
    
    this.monthlyMapInfo = this.add.container(width / 2, height * 0.25, [
      infoBg, mapNameText, objectCountText
    ]);
  }



  private showLoadingState() {
    this.loadingText.setVisible(true);
    this.errorText.setVisible(false);
  }

  private hideLoadingState() {
    this.loadingText.setVisible(false);
    this.tweens.killTweensOf(this.loadingText);
  }

  private showErrorState(message: string) {
    this.hideLoadingState();
    this.errorText.setText(`Error: ${message}\n\nUsing demo map instead.`);
    this.errorText.setVisible(true);
  }

  private setupAnimations() {
    // Title animation
    this.tweens.add({
      targets: this.title,
      alpha: { from: 0, to: 1 },
      y: { from: this.title.y - 30, to: this.title.y },
      duration: 600,
      ease: 'Power2'
    });
    
    // Back button animation
    this.tweens.add({
      targets: this.backButton,
      alpha: { from: 0, to: 1 },
      x: { from: this.backButton.x - 50, to: this.backButton.x },
      duration: 500,
      ease: 'Power2'
    });
    
    // Stagger map card animations
    this.mapCards.forEach((card, index) => {
      card.container.setAlpha(0);
      card.container.setScale(0.8);
      
      this.tweens.add({
        targets: card.container,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 500,
        delay: index * 100 + 300,
        ease: 'Back.easeOut'
      });
    });
  }

  private setupResize() {
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      // Debounce resize calls to prevent rapid updates
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }
      
      this.resizeTimeout = setTimeout(() => {
        this.handleResize(gameSize.width, gameSize.height);
      }, 100);
    });
  }

  private handleResize(width: number, height: number) {
    // Update background
    this.background.clear();
    this.background.fillGradientStyle(
      parseInt(Theme.primaryDark.replace('#', ''), 16),
      parseInt(Theme.primaryDark.replace('#', ''), 16),
      parseInt(Theme.secondaryDark.replace('#', ''), 16),
      parseInt(Theme.secondaryDark.replace('#', ''), 16),
      1
    );
    this.background.fillRect(0, 0, width, height);
    
    const isMobile = width < 768;
    
    // Recreate title to avoid setShadow issues
    if (this.title) {
      this.title.destroy();
    }
    this.title = this.add.text(width / 2, height * 0.08, 'SELECT MAP', {
      fontSize: isMobile ? '28px' : '42px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.lightGray,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Safely add shadow to new title
    try {
      this.title.setShadow(0, 0, Theme.accentCyan, isMobile ? 5 : 8);
    } catch (error) {
      console.warn('Failed to set title shadow during resize:', error);
    }
    
    // Recreate subtitle to avoid font size issues
    if (this.subtitle) {
      this.subtitle.destroy();
    }
    this.subtitle = this.add.text(width / 2, height * 0.12, 'Choose your hiding spot', {
      fontSize: isMobile ? '14px' : '18px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary,
      align: 'center',
      wordWrap: { width: width * 0.8 }
    }).setOrigin(0.5);
    
    // Update back button position with safe bounds
    const buttonWidth = isMobile ? 80 : 100;
    const buttonHeight = isMobile ? 35 : 40;
    const buttonX = Math.max(buttonWidth/2 + 10, width * 0.08);
    const buttonY = Math.max(buttonHeight/2 + 10, height * 0.05);
    this.backButton.setPosition(buttonX, buttonY);
    
    // Recreate loading text to avoid font size issues
    const wasLoadingVisible = this.loadingText.visible;
    if (this.loadingText) {
      this.loadingText.destroy();
    }
    this.loadingText = this.add.text(width / 2, height / 2, 'Loading maps...', {
      fontSize: isMobile ? '18px' : '24px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary,
      align: 'center'
    }).setOrigin(0.5).setVisible(wasLoadingVisible);
    
    // Recreate error text to avoid font size issues
    const wasErrorVisible = this.errorText.visible;
    const errorMessage = this.errorText.text;
    if (this.errorText) {
      this.errorText.destroy();
    }
    this.errorText = this.add.text(width / 2, height / 2 + 50, errorMessage, {
      fontSize: isMobile ? '14px' : '18px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.error,
      align: 'center',
      wordWrap: { width: width * 0.8 }
    }).setOrigin(0.5).setVisible(wasErrorVisible);
    
    // Update monthly map info position
    if (this.monthlyMapInfo) {
      this.monthlyMapInfo.destroy();
      this.createMonthlyMapInfo();
    }
    
    // Recreate map cards with new layout
    this.mapCards.forEach(card => card.destroy());
    this.mapCards = [];
    
    if (this.currentMonthlyMap && !this.isLoading) {
      this.createMonthlyMapDisplay();
    }
  }

  private selectMap(mapKey: string) {
    console.log(`🎯 Selected map: ${mapKey}`);
    
    // Use zoom transition for map selection to create focus effect
    SceneTransition.getInstance().zoomToScene(this, 'Game', false, { mapKey }, 600);
  }

  private goBack() {
    console.log('🏠 Returning to main menu');
    
    // Use slide transition back to main menu
    SceneTransition.getInstance().slideToScene(this, 'MainMenu', 'right', undefined, 500);
  }

  destroy() {
    // Clean up resize listener
    this.scale.off('resize');
    
    // Clean up map cards
    this.mapCards.forEach(card => card.destroy());
    this.mapCards = [];
    
    // Clean up tweens
    this.tweens.killAll();
  }
}