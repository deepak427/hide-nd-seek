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
    
    // Title
    this.title = this.add.text(width / 2, height * 0.08, 'MONTHLY MAP', {
      fontSize: '42px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.lightGray,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Add glow effect to title
    this.title.setShadow(0, 0, Theme.accentCyan, 8);
    
    // Subtitle
    this.subtitle = this.add.text(width / 2, height * 0.12, 'Discover this month\'s featured map', {
      fontSize: '18px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary,
      align: 'center'
    }).setOrigin(0.5);
    
    // Back button
    this.createBackButton();
  }

  private createLoadingState() {
    const { width, height } = this.scale;
    
    // Loading text
    this.loadingText = this.add.text(width / 2, height / 2, 'Loading monthly map...', {
      fontSize: '24px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary,
      align: 'center'
    }).setOrigin(0.5);
    
    // Error text (initially hidden)
    this.errorText = this.add.text(width / 2, height / 2 + 50, '', {
      fontSize: '18px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.error,
      align: 'center',
      wordWrap: { width: width - 100 }
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
    
    // Back button background
    const backBg = this.add.graphics();
    backBg.fillStyle(parseInt(Theme.secondaryDark.replace('#', ''), 16));
    backBg.fillRoundedRect(-50, -20, 100, 40, Theme.radiusMedium);
    backBg.lineStyle(2, parseInt(Theme.border.replace('rgba(238, 238, 238, 0.2)', '0xEEEEEE'), 16), 0.2);
    backBg.strokeRoundedRect(-50, -20, 100, 40, Theme.radiusMedium);
    
    // Back button text
    const backText = this.add.text(0, 0, '← BACK', {
      fontSize: '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.lightGray,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Container
    this.backButton = this.add.container(width * 0.08, height * 0.05, [backBg, backText]);
    this.backButton.setSize(100, 40);
    this.backButton.setInteractive();
    
    // Hover effects
    this.backButton.on('pointerover', () => {
      backBg.clear();
      backBg.fillStyle(parseInt(Theme.accentCyan.replace('#', ''), 16));
      backBg.fillRoundedRect(-50, -20, 100, 40, Theme.radiusMedium);
      
      this.tweens.add({
        targets: this.backButton,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: Theme.animationFast,
        ease: 'Power2'
      });
    });
    
    this.backButton.on('pointerout', () => {
      backBg.clear();
      backBg.fillStyle(parseInt(Theme.secondaryDark.replace('#', ''), 16));
      backBg.fillRoundedRect(-50, -20, 100, 40, Theme.radiusMedium);
      backBg.lineStyle(2, parseInt(Theme.border.replace('rgba(238, 238, 238, 0.2)', '0xEEEEEE'), 16), 0.2);
      backBg.strokeRoundedRect(-50, -20, 100, 40, Theme.radiusMedium);
      
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
    // Create a fallback map for demo purposes
    this.currentMonthlyMap = {
      key: 'demo-bedroom',
      name: 'Cozy Bedroom',
      theme: 'indoor',
      releaseDate: Date.now(),
      backgroundAsset: 'bedroom-bg',
      objects: [
        { key: 'pumpkin', name: 'Pumpkin', x: 100, y: 200, width: 32, height: 32, interactive: true },
        { key: 'wardrobe', name: 'Wardrobe', x: 300, y: 150, width: 64, height: 128, interactive: true },
        { key: 'bed', name: 'Bed', x: 500, y: 300, width: 128, height: 64, interactive: true }
      ],
      difficulty: 'easy'
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
    
    // Create info panel background
    const infoBg = this.add.graphics();
    infoBg.fillStyle(parseInt(Theme.secondaryDark.replace('#', ''), 16), 0.9);
    infoBg.fillRoundedRect(-200, -40, 400, 80, Theme.radiusLarge);
    infoBg.lineStyle(2, parseInt(Theme.accentCyan.replace('#', ''), 16), 0.5);
    infoBg.strokeRoundedRect(-200, -40, 400, 80, Theme.radiusLarge);
    
    // Map theme and release info
    const releaseDate = new Date(this.currentMonthlyMap.releaseDate);
    const monthName = releaseDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const themeText = this.add.text(0, -15, `Theme: ${this.currentMonthlyMap.theme.toUpperCase()}`, {
      fontSize: '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.accentCyan,
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    
    const releaseText = this.add.text(0, 10, `Released: ${monthName}`, {
      fontSize: '14px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary,
      align: 'center'
    }).setOrigin(0.5);
    
    // Next rotation info
    const nextRotation = this.getNextRotationDate();
    const nextRotationText = this.add.text(0, 30, `Next map: ${nextRotation}`, {
      fontSize: '12px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textMuted,
      align: 'center'
    }).setOrigin(0.5);
    
    this.monthlyMapInfo = this.add.container(width / 2, height * 0.25, [
      infoBg, themeText, releaseText, nextRotationText
    ]);
  }

  private getNextRotationDate(): string {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
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
      this.handleResize(gameSize.width, gameSize.height);
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
    
    // Update header positions
    this.title.setPosition(width / 2, height * 0.08);
    this.subtitle.setPosition(width / 2, height * 0.12);
    
    // Update back button position
    this.backButton.setPosition(width * 0.08, height * 0.05);
    
    // Update loading/error text positions
    this.loadingText.setPosition(width / 2, height / 2);
    this.errorText.setPosition(width / 2, height / 2 + 50);
    
    // Update monthly map info position
    if (this.monthlyMapInfo) {
      this.monthlyMapInfo.setPosition(width / 2, height * 0.25);
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
}