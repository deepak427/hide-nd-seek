import { Scene } from 'phaser';
import { Theme } from '../../style/theme';
import { MapLayer } from './Game/components/MapLayer';
import { GuessMode } from './Game/components/GuessMode';

export class GuessScene extends Scene {
  private background!: Phaser.GameObjects.Graphics;
  private title!: Phaser.GameObjects.Text;
  private inputBox!: Phaser.GameObjects.DOMElement;
  private loadButton!: Phaser.GameObjects.Container;
  private backButton!: Phaser.GameObjects.Container;
  
  // Game components
  private mapLayer: MapLayer | null = null;
  private guessMode: GuessMode | null = null;
  private gameLoaded = false;

  constructor() {
    super('GuessScene');
  }

  create() {
    console.log('🔍 Guess scene initialized');
    console.log('🔍 Scene scale:', this.scale.width, 'x', this.scale.height);
    console.log('🔍 DOM support:', !!this.add.dom);
    
    this.createBackground();
    this.createTitle();
    this.createInputSection();
    this.createButtons();
    this.setupResize();
  }

  private createBackground() {
    const { width, height } = this.scale;
    
    // Create gradient background
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

  private createTitle() {
    const { width, height } = this.scale;
    
    // Main title
    this.title = this.add.text(width / 2, height * 0.2, '🔍 GUESS GAME', {
      fontSize: '48px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.accentCyan,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Subtitle
    this.add.text(width / 2, height * 0.28, 'Enter a Game ID to start guessing', {
      fontSize: '18px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary,
      align: 'center'
    }).setOrigin(0.5);
  }

  private createInputSection() {
    const { width, height } = this.scale;
    
    // Input label
    this.add.text(width / 2, height * 0.4, 'Game ID:', {
      fontSize: '20px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textPrimary,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Create HTML input element
    const inputElement = document.createElement('input');
    inputElement.type = 'text';
    inputElement.placeholder = 'Enter Game ID (e.g. SKJ7D)';
    inputElement.maxLength = 5;
    inputElement.style.cssText = `
      width: 300px;
      height: 50px;
      font-size: 20px;
      font-family: 'Inter', Arial, sans-serif;
      font-weight: bold;
      text-align: center;
      background: ${Theme.bgSecondary};
      color: ${Theme.textPrimary};
      border: 3px solid ${Theme.accentCyan};
      border-radius: 12px;
      padding: 0 15px;
      outline: none;
      text-transform: uppercase;
      letter-spacing: 2px;
      box-sizing: border-box;
      z-index: 1000;
      position: relative;
    `;
    
    // Add focus styles
    inputElement.addEventListener('focus', () => {
      inputElement.style.borderColor = Theme.accentHover;
      inputElement.style.boxShadow = `0 0 15px ${Theme.accentCyan}80`;
      inputElement.style.transform = 'scale(1.05)';
    });
    
    inputElement.addEventListener('blur', () => {
      inputElement.style.borderColor = Theme.accentCyan;
      inputElement.style.boxShadow = 'none';
      inputElement.style.transform = 'scale(1)';
    });
    
    // Add input validation
    inputElement.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      target.value = target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5);
    });
    
    // Add enter key support
    inputElement.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.loadGame();
      }
    });
    
    this.inputBox = this.add.dom(width / 2, height * 0.5, inputElement);
    this.inputBox.setDepth(1000);
    
    console.log('🔍 GuessScene input box created:', this.inputBox);
    console.log('🔍 Input element:', inputElement);
  }

  private createButtons() {
    const { width, height } = this.scale;
    
    // Load Game button
    this.loadButton = this.createButton(
      width / 2, 
      height * 0.6, 
      '🎮 Start Guessing', 
      Theme.accentCyan,
      () => this.loadGame()
    );
    
    // Back button
    this.backButton = this.createButton(
      width / 2, 
      height * 0.75, 
      '← Back to Menu', 
      Theme.bgSecondary,
      () => this.goBack()
    );
  }

  private createButton(
    x: number, 
    y: number, 
    text: string, 
    color: string, 
    callback: () => void
  ): Phaser.GameObjects.Container {
    // Button background
    const btnBg = this.add.graphics();
    btnBg.fillStyle(parseInt(color.replace('#', ''), 16));
    btnBg.fillRoundedRect(-120, -25, 240, 50, Theme.radiusMedium);
    
    // Button text
    const btnText = this.add.text(0, 0, text, {
      fontSize: '18px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textPrimary,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    const button = this.add.container(x, y, [btnBg, btnText]);
    button.setSize(240, 50);
    button.setInteractive();
    
    // Hover effects
    button.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(parseInt(color.replace('#', ''), 16), 0.8);
      btnBg.fillRoundedRect(-120, -25, 240, 50, Theme.radiusMedium);
      this.tweens.add({
        targets: button,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 150,
        ease: 'Power2.easeOut'
      });
    });
    
    button.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(parseInt(color.replace('#', ''), 16));
      btnBg.fillRoundedRect(-120, -25, 240, 50, Theme.radiusMedium);
      this.tweens.add({
        targets: button,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
        ease: 'Power2.easeOut'
      });
    });
    
    button.on('pointerdown', () => {
      this.tweens.add({
        targets: button,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        yoyo: true,
        ease: 'Power2.easeOut',
        onComplete: callback
      });
    });
    
    return button;
  }

  private async loadGame() {
    const inputElement = this.inputBox.node as HTMLInputElement;
    const gameId = inputElement.value.trim().toUpperCase();
    
    if (!gameId) {
      this.showError('Please enter a Game ID');
      return;
    }
    
    if (gameId.length !== 5) {
      this.showError('Game ID must be 5 characters long');
      return;
    }
    
    console.log('🔍 Loading game for Game ID:', gameId);
    
    try {
      // Convert short ID back to full UUID for API call
      const fullGameId = await this.resolveGameId(gameId);
      
      // Fetch game data from server
      const gameData = await this.fetchGameData(fullGameId);
      
      if (!gameData || !gameData.hidingSpot) {
        throw new Error('Invalid game data received');
      }
      
      // Hide input section
      this.hideInputSection();
      
      // Create game components
      await this.createGameComponents(gameData);
      
      // Show success message
      this.showSuccessMessage(gameData.hidingSpot.objectKey);
      
    } catch (error) {
      console.error('Failed to load game:', error);
      this.showError('Game not found or invalid Game ID');
    }
  }

  private async resolveGameId(shortId: string): Promise<string> {
    // For now, we'll use the short ID directly
    // In a real implementation, you'd have a mapping service
    return shortId;
  }

  private async fetchGameData(gameId: string) {
    const response = await fetch(`/api/game/${gameId}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  }

  private async createGameComponents(gameData: any) {
    console.log('🎮 Creating game components with data:', gameData);
    
    // Create map layer
    this.mapLayer = new MapLayer(this, gameData.mapKey || 'octmap');
    await this.mapLayer.create();
    
    // Create guess mode
    // In GuessScene, always assume guesser role
    this.guessMode = new GuessMode(this, gameData.gameId, gameData.hidingSpot, 'guesser');
    
    // Setup interactive objects for guessing
    const mapBounds = this.mapLayer.getMap().getBounds();
    this.guessMode.setupInteractiveObjects(mapBounds);
    
    this.gameLoaded = true;
    
    // Add back button overlay
    this.createGameBackButton();
  }

  private createGameBackButton() {
    const { width } = this.scale;
    
    // Back button for when game is loaded
    const backBtn = this.createButton(
      width - 120, 
      50, 
      '← Menu', 
      Theme.bgSecondary,
      () => this.goBack()
    );
    
    backBtn.setDepth(1000); // High depth to appear over game
  }

  private showSuccessMessage(objectKey: string) {
    const { width, height } = this.scale;
    
    // Success message
    const successText = this.add.text(width / 2, 60, `Find the hidden ${objectKey}!`, {
      fontSize: '24px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.success,
      fontStyle: 'bold',
      backgroundColor: Theme.bgPrimary,
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5);
    
    successText.setDepth(1000);
    
    // Fade in success message
    successText.setAlpha(0);
    this.tweens.add({
      targets: successText,
      alpha: 1,
      duration: 500,
      ease: 'Power2.easeOut'
    });
    
    // Auto-hide after 4 seconds
    this.time.delayedCall(4000, () => {
      this.tweens.add({
        targets: successText,
        alpha: 0,
        duration: 500,
        ease: 'Power2.easeOut',
        onComplete: () => successText.destroy()
      });
    });
  }

  private hideInputSection() {
    // Hide input elements with animation
    this.tweens.add({
      targets: [this.title, this.inputBox, this.loadButton, this.backButton],
      alpha: 0,
      y: '-=50',
      duration: 500,
      ease: 'Power2.easeOut'
    });
  }

  private showError(message: string) {
    const { width, height } = this.scale;
    
    // Create error message
    const errorText = this.add.text(width / 2, height * 0.65, message, {
      fontSize: '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.error,
      align: 'center'
    }).setOrigin(0.5);
    
    // Fade in error
    errorText.setAlpha(0);
    this.tweens.add({
      targets: errorText,
      alpha: 1,
      duration: 300,
      ease: 'Power2.easeOut'
    });
    
    // Auto-hide after 3 seconds
    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: errorText,
        alpha: 0,
        duration: 300,
        ease: 'Power2.easeOut',
        onComplete: () => errorText.destroy()
      });
    });
  }

  private goBack() {
    console.log('🔙 Going back to main menu');
    this.scene.start('MainMenu');
  }

  private setupResize() {
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.handleResize(gameSize.width, gameSize.height);
    });
  }

  private handleResize(width: number, height: number) {
    // Update background
    if (this.background) {
      this.background.clear();
      this.background.fillGradientStyle(
        parseInt(Theme.primaryDark.replace('#', ''), 16),
        parseInt(Theme.primaryDark.replace('#', ''), 16),
        parseInt(Theme.secondaryDark.replace('#', ''), 16),
        parseInt(Theme.secondaryDark.replace('#', ''), 16),
        1
      );
      this.background.fillRect(0, 0, width, height);
    }
    
    // Only update positions if game is not loaded
    if (!this.gameLoaded) {
      this.title.setPosition(width / 2, height * 0.2);
      if (this.inputBox) this.inputBox.setPosition(width / 2, height * 0.5);
      if (this.loadButton) this.loadButton.setPosition(width / 2, height * 0.6);
      if (this.backButton) this.backButton.setPosition(width / 2, height * 0.75);
    }
  }

  destroy() {
    if (this.guessMode) {
      this.guessMode.destroy();
      this.guessMode = null;
    }
    
    if (this.mapLayer) {
      // MapLayer cleanup would go here if it has a destroy method
      this.mapLayer = null;
    }
  }
}