import { Scene } from 'phaser';
import { Theme } from '../../../../style/theme';
import { ErrorHandler } from '../../../services/ErrorHandler';
import { NetworkService } from '../../../services/NetworkService';

export class GuessMode {
  private scene: Scene;
  private gameId: string;
  private hidingSpot: { objectKey: string; relX: number; relY: number };
  private interactiveObjects: Phaser.GameObjects.Image[] = [];
  private guessMarkers: Phaser.GameObjects.Graphics[] = [];
  private hasGuessed: boolean = false;
  private errorHandler: ErrorHandler;
  private networkService: NetworkService;
  private userRole: string;

  constructor(scene: Scene, gameId: string, hidingSpot: { objectKey: string; relX: number; relY: number }, userRole: string = 'guesser') {
    this.scene = scene;
    this.gameId = gameId;
    this.hidingSpot = hidingSpot;
    this.userRole = userRole;
    this.errorHandler = new ErrorHandler(scene);
    this.networkService = new NetworkService(scene);
  }

  setupInteractiveObjects(mapBounds: Phaser.Geom.Rectangle): void {
    console.log('🔍 Setting up interactive objects for guessing');
    
    // Use the same object positions as MapLayer for consistency
    const objectData = this.getFixedObjectPositions();
    
    // Create interactive objects at the same positions as in creation mode
    objectData.forEach((objData) => {
      // Only create if texture exists
      if (objData.key && this.scene.textures.exists(objData.key)) {
        // Calculate position using relative coordinates (same as MapLayer)
        const x = mapBounds.x + (objData.x * mapBounds.width);
        const y = mapBounds.y + (objData.y * mapBounds.height);
        
        const obj = this.scene.add.image(x, y, objData.key);
        
        // Use the same scaling logic as MapLayer
        const baseScale = Math.min(mapBounds.width / 1200, mapBounds.height / 800);
        let objectScale = baseScale * 0.25; // Base scale
        
        // Apply same scaling rules as MapLayer
        switch (objData.key) {
          case 'guard':
            objectScale = baseScale * 0.35;
            break;
          case 'car':
          case 'truck':
            objectScale = baseScale * 0.4;
            break;
          case 'wardrobe':
            objectScale = baseScale * 0.3;
            break;
          case 'bush':
          case 'pumpkin':
            objectScale = baseScale * 0.2;
            break;
          default:
            objectScale = baseScale * 0.25;
        }
        
        obj.setScale(objectScale);
        obj.setDepth(5);
        obj.setInteractive();
        obj.setAlpha(0.8); // Slightly transparent to indicate they're clickable
        
        // Store data for click handling
        obj.setData('objectKey', objData.key);
        obj.setData('relativeX', objData.x);
        obj.setData('relativeY', objData.y);
        obj.setData('originalScale', objectScale);
        
        // Add hover effects
        obj.on('pointerover', () => {
          obj.setScale(objectScale * 1.15);
          obj.setAlpha(1);
          obj.setTint(parseInt(Theme.accentCyan.replace('#', ''), 16));
        });
        
        obj.on('pointerout', () => {
          obj.setScale(objectScale);
          obj.setAlpha(0.8);
          obj.clearTint();
        });
        
        // Handle click
        obj.on('pointerdown', () => {
          if (!this.hasGuessed) {
            this.submitGuess(objData.key, objData.x, objData.y, x, y);
          }
        });
        
        this.interactiveObjects.push(obj);
      }
    });
    
    // Show instruction
    this.showInstruction();
  }

  /**
   * Get the same fixed object positions as used in MapLayer
   * This ensures consistency between creation and guessing modes
   */
  private getFixedObjectPositions() {
    return [
      // OUTDOOR OBJECTS (Top half of map)
      // Bush - in the ground/field area (top-left)
      { key: 'bush', name: 'Bush', x: 0.15, y: 0.25, width: 40, height: 40, interactive: true },
      
      // Pumpkin - on the veranda/deck area (top-center)
      { key: 'pumpkin', name: 'Pumpkin', x: 0.5, y: 0.28, width: 35, height: 35, interactive: true },
      
      // Car - on the road (top-right)
      { key: 'car', name: 'Car', x: 0.75, y: 0.32, width: 60, height: 30, interactive: true },
      
      // Truck - on the road, slightly different position than car
      { key: 'truck', name: 'Truck', x: 0.85, y: 0.25, width: 70, height: 35, interactive: true },
      
      // INDOOR OBJECTS (Bottom half of map)
      // Guard - at the door/entrance of the hall (bottom-center)
      { key: 'guard', name: 'Guard', x: 0.5, y: 0.75, width: 25, height: 45, interactive: true },
      
      // Wardrobe - in the hall near the side (bottom-left area)
      { key: 'wardrobe', name: 'Wardrobe', x: 0.2, y: 0.8, width: 45, height: 80, interactive: true }
    ];
  }

  private showInstruction(): void {
    const { width } = this.scene.scale;
    
    const instruction = this.scene.add.text(
      width / 2, 
      60, 
      `🔍 Find the hidden ${this.hidingSpot.objectKey}!\nClick on objects to make your guess.`, 
      {
        fontSize: '18px',
        fontFamily: 'Inter, Arial, sans-serif',
        color: Theme.accentCyan,
        fontStyle: 'bold',
        align: 'center',
        backgroundColor: Theme.bgSecondary,
        padding: { x: 15, y: 10 }
      }
    );
    instruction.setOrigin(0.5);
    instruction.setDepth(Theme.zIndexUI);
    
    // Add object icon if available
    if (this.hidingSpot.objectKey && this.scene.textures.exists(this.hidingSpot.objectKey)) {
      const icon = this.scene.add.image(width / 2 - 100, 60, this.hidingSpot.objectKey);
      icon.setDisplaySize(30, 30);
      icon.setDepth(Theme.zIndexUI);
    }
  }

  async submitGuess(objectKey: string, relX: number, relY: number, screenX: number, screenY: number): Promise<void> {
    if (this.hasGuessed) return;
    
    // Prevent creators from guessing their own games
    if (this.userRole === 'creator') {
      this.showCreatorCannotGuessMessage();
      return;
    }
    
    this.hasGuessed = true;
    
    try {
      // Show loading indicator at guess location
      this.showGuessLoading(screenX, screenY);
      
      // Submit guess to server with automatic error handling
      const result = await this.networkService.post('/api/guess', {
        gameId: this.gameId,
        objectKey,
        relX,
        relY
      }, {
        retries: 2,
        timeout: 5000
      }) as any; // Type assertion for now
      
      this.showGuessResult(screenX, screenY, result.isCorrect, result.message);
      
      if (result.isCorrect) {
        this.revealHiddenObject();
        this.createCelebrationEffect();
      }
      
      // Trigger stats refresh in main menu if available
      this.triggerStatsRefresh();
      
      // Disable all further interactions
      this.disableAllInteractions();
      
    } catch (error: any) {
      // Check if it's an "already guessed" error
      if (error?.message?.includes('already guessed')) {
        this.showAlreadyGuessedMessage();
      } else {
        this.showGuessError(screenX, screenY);
      }
    }
  }

  private showGuessLoading(x: number, y: number): void {
    // Create loading spinner at guess location
    const spinner = this.scene.add.graphics();
    spinner.lineStyle(3, parseInt(Theme.accentCyan.replace('#', ''), 16));
    spinner.strokeCircle(x, y, 15);
    spinner.setDepth(20);
    
    // Spinning animation
    this.scene.tweens.add({
      targets: spinner,
      rotation: Math.PI * 2,
      duration: 1000,
      repeat: 2,
      ease: 'Linear',
      onComplete: () => spinner.destroy()
    });
  }

  private showGuessResult(x: number, y: number, isCorrect: boolean, message: string, distance?: number, rankData?: any): void {
    // Create result marker
    const marker = this.scene.add.graphics();
    const color = isCorrect ? Theme.success : Theme.error;
    marker.fillStyle(parseInt(color.replace('#', ''), 16));
    marker.fillCircle(x, y, 12);
    marker.setDepth(15);
    
    // Add result icon
    const icon = this.scene.add.text(x, y, isCorrect ? '✅' : '❌', {
      fontSize: '20px'
    }).setOrigin(0.5).setDepth(16);
    
    this.guessMarkers.push(marker);
    
    // Show result message
    this.showResultMessage(message, isCorrect, distance);
    
    // Show rank progression if applicable
    if (rankData && (this.scene as any).ui) {
      const ui = (this.scene as any).ui;
      if (rankData.rankChanged) {
        // Show rank up notification after a delay
        this.scene.time.delayedCall(2000, () => {
          ui.showRankUpNotification(rankData.previousRank, rankData.newRank);
        });
      } else if (rankData.progressPercentage && [25, 50, 75].includes(Math.floor(rankData.progressPercentage))) {
        // Show progress notification for milestones
        this.scene.time.delayedCall(1500, () => {
          ui.showProgressNotification(rankData.currentRank, rankData.progressPercentage, rankData.nextRank);
        });
      }
    }
    
    // Pulse animation
    this.scene.tweens.add({
      targets: [marker, icon],
      scaleX: { from: 1, to: 1.3 },
      scaleY: { from: 1, to: 1.3 },
      duration: 300,
      yoyo: true,
      ease: 'Power2'
    });
  }

  private showResultMessage(message: string, isCorrect: boolean, distance?: number): void {
    const { width, height } = this.scene.scale;
    
    let displayMessage = message;
    if (!isCorrect && distance !== undefined) {
      const distancePercent = Math.round(distance * 100);
      displayMessage += `\nYou were ${distancePercent}% away from the target.`;
    }
    
    const messageText = this.scene.add.text(width / 2, height / 2, displayMessage, {
      fontSize: '20px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: isCorrect ? Theme.success : Theme.error,
      fontStyle: 'bold',
      align: 'center',
      backgroundColor: Theme.bgSecondary,
      padding: { x: 20, y: 15 }
    }).setOrigin(0.5).setDepth(Theme.zIndexModal);
    
    // Entrance animation
    messageText.setAlpha(0);
    messageText.setScale(0.8);
    this.scene.tweens.add({
      targets: messageText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });
    
    // Auto hide after 3 seconds
    this.scene.time.delayedCall(3000, () => {
      this.scene.tweens.add({
        targets: messageText,
        alpha: 0,
        duration: 500,
        onComplete: () => messageText.destroy()
      });
    });
  }

  private showGuessError(x: number, y: number): void {
    this.hasGuessed = false; // Allow retry
    
    const errorMarker = this.scene.add.graphics();
    errorMarker.lineStyle(3, parseInt(Theme.error.replace('#', ''), 16));
    errorMarker.strokeCircle(x, y, 15);
    errorMarker.setDepth(15);
    
    // Flash animation
    this.scene.tweens.add({
      targets: errorMarker,
      alpha: { from: 1, to: 0 },
      duration: 200,
      repeat: 3,
      yoyo: true,
      onComplete: () => errorMarker.destroy()
    });
    
    this.errorHandler.showError({
      title: 'Guess Failed',
      message: 'Failed to submit guess. Please check your connection and try again.',
      type: 'error',
      showRetry: true,
      retryCallback: () => {
        // Reset state for retry
        this.hasGuessed = false;
      }
    });
  }

  private revealHiddenObject(): void {
    // Get map bounds to calculate actual position
    const mapLayer = (this.scene as any).mapLayer;
    if (!mapLayer) return;
    
    const mapBounds = mapLayer.getMap().getBounds();
    const actualX = mapBounds.x + mapBounds.width * this.hidingSpot.relX;
    const actualY = mapBounds.y + mapBounds.height * this.hidingSpot.relY;
    
    // Show the actual hidden object
    const hiddenObject = this.scene.add.image(actualX, actualY, this.hidingSpot.objectKey);
    hiddenObject.setScale(0.4);
    hiddenObject.setDepth(25);
    
    // Add glow effect
    const glow = this.scene.add.image(actualX, actualY, this.hidingSpot.objectKey);
    glow.setTintFill(parseInt(Theme.success.replace('#', ''), 16));
    glow.setScale(0.45);
    glow.setAlpha(0.5);
    glow.setDepth(24);
    
    // Entrance animation
    hiddenObject.setAlpha(0);
    hiddenObject.setScale(0);
    glow.setAlpha(0);
    glow.setScale(0);
    
    this.scene.tweens.add({
      targets: [hiddenObject, glow],
      alpha: { hiddenObject: 1, glow: 0.5 },
      scaleX: { hiddenObject: 0.4, glow: 0.45 },
      scaleY: { hiddenObject: 0.4, glow: 0.45 },
      duration: 800,
      ease: 'Back.easeOut'
    });
    
    // Pulse animation
    this.scene.tweens.add({
      targets: [hiddenObject, glow],
      scaleX: { from: 0.4, to: 0.45 },
      scaleY: { from: 0.4, to: 0.45 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createCelebrationEffect(): void {
    const { width } = this.scene.scale;
    
    // Confetti particles
    const confetti = this.scene.add.particles(width / 2, 0, this.hidingSpot.objectKey, {
      scale: { start: 0.3, end: 0 },
      speed: { min: 150, max: 400 },
      lifespan: 3000,
      quantity: 3,
      frequency: 100,
      gravityY: 300,
      tint: [
        parseInt(Theme.accentCyan.replace('#', ''), 16),
        parseInt(Theme.accentPrimary.replace('#', ''), 16),
        parseInt(Theme.success.replace('#', ''), 16)
      ]
    });
    
    // Clean up after celebration
    this.scene.time.delayedCall(4000, () => {
      confetti.destroy();
    });
  }

  private triggerStatsRefresh(): void {
    // Emit an event that the main menu can listen to for stats refresh
    this.scene.events.emit('player-stats-updated');
    
    // Also try to refresh any active stats panels
    this.scene.scene.get('MainMenuScene')?.events.emit('refresh-player-stats');
  }

  private showCreatorCannotGuessMessage(): void {
    const { width, height } = this.scene.scale;
    
    // Create modal background
    const modalBg = this.scene.add.graphics();
    modalBg.fillStyle(parseInt(Theme.bgModal.replace('#', ''), 16), 0.9);
    modalBg.fillRect(0, 0, width, height);
    modalBg.setDepth(25);
    
    // Create message panel
    const panelBg = this.scene.add.graphics();
    panelBg.fillStyle(parseInt(Theme.bgPanel.replace('#', ''), 16), 0.95);
    panelBg.fillRoundedRect(-200, -100, 400, 200, 12);
    panelBg.lineStyle(2, parseInt(Theme.info.replace('#', ''), 16));
    panelBg.strokeRoundedRect(-200, -100, 400, 200, 12);
    
    const messageTitle = this.scene.add.text(0, -50, '👑 Creator Mode', {
      fontSize: '24px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.info,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    const messageText = this.scene.add.text(0, -10, 'You cannot guess on your own game.\nView the dashboard to see all guesses!', {
      fontSize: '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textPrimary,
      align: 'center'
    }).setOrigin(0.5);
    
    const okButton = this.scene.add.text(0, 40, 'OK', {
      fontSize: '18px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.accentCyan,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    okButton.setInteractive();
    okButton.on('pointerdown', () => {
      modalBg.destroy();
      panelBg.destroy();
      messageTitle.destroy();
      messageText.destroy();
      okButton.destroy();
    });
    
    // Create container and position at center
    const container = this.scene.add.container(width / 2, height / 2, [
      panelBg, messageTitle, messageText, okButton
    ]);
    container.setDepth(26);
    
    // Entrance animation
    container.setAlpha(0);
    container.setScale(0.8);
    this.scene.tweens.add({
      targets: container,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });
  }

  private disableAllInteractions(): void {
    // Disable all interactive objects
    this.interactiveObjects.forEach(obj => {
      obj.disableInteractive();
      obj.setAlpha(0.5); // Visual indication that they're disabled
    });
  }

  private showAlreadyGuessedMessage(): void {
    const { width, height } = this.scene.scale;
    
    // Create modal background
    const modalBg = this.scene.add.graphics();
    modalBg.fillStyle(parseInt(Theme.bgModal.replace('#', ''), 16), 0.9);
    modalBg.fillRect(0, 0, width, height);
    modalBg.setDepth(25);
    
    // Create message panel
    const panelBg = this.scene.add.graphics();
    panelBg.fillStyle(parseInt(Theme.bgPanel.replace('#', ''), 16), 0.95);
    panelBg.fillRoundedRect(-200, -100, 400, 200, 12);
    panelBg.lineStyle(2, parseInt(Theme.warning.replace('#', ''), 16));
    panelBg.strokeRoundedRect(-200, -100, 400, 200, 12);
    
    const messageTitle = this.scene.add.text(0, -50, '⚠️ Already Guessed', {
      fontSize: '24px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.warning,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    const messageText = this.scene.add.text(0, -10, 'You have already made a guess\non this game.', {
      fontSize: '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textPrimary,
      align: 'center'
    }).setOrigin(0.5);
    
    const okButton = this.scene.add.text(0, 40, 'OK', {
      fontSize: '18px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.accentCyan,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    okButton.setInteractive();
    okButton.on('pointerdown', () => {
      modalBg.destroy();
      panelBg.destroy();
      messageTitle.destroy();
      messageText.destroy();
      okButton.destroy();
    });
    
    // Create container and position at center
    const container = this.scene.add.container(width / 2, height / 2, [
      panelBg, messageTitle, messageText, okButton
    ]);
    container.setDepth(26);
    
    // Entrance animation
    container.setAlpha(0);
    container.setScale(0.8);
    this.scene.tweens.add({
      targets: container,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });
  }

  destroy(): void {
    // Clean up interactive objects
    this.interactiveObjects.forEach(obj => obj.destroy());
    this.interactiveObjects = [];
    
    // Clean up guess markers
    this.guessMarkers.forEach(marker => marker.destroy());
    this.guessMarkers = [];
    
    // Clean up error handling services
    this.errorHandler.destroy();
    this.networkService.destroy();
  }
}