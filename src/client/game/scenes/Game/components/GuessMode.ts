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

  constructor(scene: Scene, gameId: string, hidingSpot: { objectKey: string; relX: number; relY: number }) {
    this.scene = scene;
    this.gameId = gameId;
    this.hidingSpot = hidingSpot;
    this.errorHandler = new ErrorHandler(scene);
    this.networkService = new NetworkService(scene);
  }

  setupInteractiveObjects(mapBounds: Phaser.Geom.Rectangle): void {
    console.log('🔍 Setting up interactive objects for guessing');
    
    // Define possible object locations throughout the map
    const objectTypes = ['pumpkin', 'wardrobe', 'bush', 'car', 'truck', 'guard'];
    const objectPositions = this.generateObjectPositions(mapBounds, 12); // Generate 12 possible positions
    
    // Create interactive objects at various positions
    objectPositions.forEach((pos, index) => {
      const objectKey = objectTypes[index % objectTypes.length];
      
      // Only create if texture exists
      if (objectKey && this.scene.textures.exists(objectKey)) {
        const obj = this.scene.add.image(pos.x, pos.y, objectKey);
        obj.setScale(0.25);
        obj.setDepth(5);
        obj.setInteractive();
        obj.setAlpha(0.7); // Make them slightly transparent to indicate they're clickable
        
        // Add hover effects
        obj.on('pointerover', () => {
          obj.setScale(0.3);
          obj.setAlpha(1);
          obj.setTint(parseInt(Theme.accentCyan.replace('#', ''), 16));
        });
        
        obj.on('pointerout', () => {
          obj.setScale(0.25);
          obj.setAlpha(0.7);
          obj.clearTint();
        });
        
        // Handle click
        obj.on('pointerdown', () => {
          if (!this.hasGuessed) {
            this.submitGuess(objectKey, pos.relX, pos.relY, pos.x, pos.y);
          }
        });
        
        this.interactiveObjects.push(obj);
      }
    });
    
    // Show instruction
    this.showInstruction();
  }

  private generateObjectPositions(mapBounds: Phaser.Geom.Rectangle, count: number): Array<{x: number, y: number, relX: number, relY: number}> {
    const positions = [];
    const padding = 50; // Padding from edges
    
    for (let i = 0; i < count; i++) {
      const x = mapBounds.x + padding + Math.random() * (mapBounds.width - padding * 2);
      const y = mapBounds.y + padding + Math.random() * (mapBounds.height - padding * 2);
      const relX = (x - mapBounds.x) / mapBounds.width;
      const relY = (y - mapBounds.y) / mapBounds.height;
      
      positions.push({ x, y, relX, relY });
    }
    
    return positions;
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
    
    this.hasGuessed = true;
    console.log(`📤 Submitting guess: ${objectKey} at (${relX.toFixed(2)}, ${relY.toFixed(2)})`);
    
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
      });
      
      // Use rank progression data from server response
      let rankData = undefined;
      if (result.rankProgression) {
        rankData = {
          currentRank: result.rankProgression.currentRank,
          progressPercentage: result.rankProgression.progressPercentage,
          nextRank: result.rankProgression.nextRank,
          rankChanged: false // We'd need to track previous rank to detect changes
        };
      }
      
      this.showGuessResult(screenX, screenY, result.isCorrect, result.message, result.distance, rankData);
      
      if (result.isCorrect) {
        this.revealHiddenObject();
        this.createCelebrationEffect();
      }
      
    } catch (error) {
      console.error('Guess submission error:', error);
      this.showGuessError(screenX, screenY);
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