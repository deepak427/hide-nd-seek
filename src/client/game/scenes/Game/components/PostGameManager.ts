import { Scene } from 'phaser';
import { Theme } from '../../../../style/theme';
import { CreatePostRequest, CreatePostResponse } from '../../../../../shared/types/api';
import { ErrorHandler } from '../../../services/ErrorHandler';
import { NetworkService } from '../../../services/NetworkService';

/**
 * PostGameManager - Handles Reddit post creation for hide-and-seek challenges
 * Requirements 7.1, 7.2: Implement "Post Game" button and success popup functionality
 */
export class PostGameManager {
  private isPosting: boolean = false;
  private errorHandler: ErrorHandler;
  private networkService: NetworkService;

  constructor(private scene: Scene) {
    this.errorHandler = new ErrorHandler(scene);
    this.networkService = new NetworkService(scene);
  }

  /**
   * Show post creation dialog and handle the posting process
   * Requirements 7.1: Create post creation dialog interface
   */
  async showPostGameDialog(gameData: {
    mapKey: string;
    objectKey: string;
    relX: number;
    relY: number;
  }) {
    // Prevent multiple simultaneous post attempts
    if (this.isPosting) {
      this.errorHandler.showError({
        title: 'Post In Progress',
        message: 'A post is already being created. Please wait...',
        type: 'info',
        autoHide: true
      });
      return;
    }

    // Validate game data before showing dialog
    if (!this.validateGameData(gameData)) {
      return;
    }

    // Get UI manager from scene
    const ui = (this.scene as any).ui;
    if (!ui) {
      console.error('UI manager not found');
      return;
    }

    // Show post creation dialog
    ui.showPostCreationDialog(
      gameData,
      () => this.confirmPostCreation(gameData), // onConfirm
      () => this.cancelPostCreation() // onCancel
    );
  }

  /**
   * Handle post creation confirmation
   * Requirements 7.1: Replace share button with post game functionality
   */
  private async confirmPostCreation(gameData: {
    mapKey: string;
    objectKey: string;
    relX: number;
    relY: number;
  }) {
    try {
      this.isPosting = true;
      
      // Hide the dialog first
      this.hidePostCreationDialog();
      
      console.log('📤 Creating Reddit post for hiding challenge...');
      
      // Prepare post data for Reddit
      const postData: CreatePostRequest = {
        mapKey: gameData.mapKey,
        objectKey: gameData.objectKey,
        relX: gameData.relX,
        relY: gameData.relY
      };
      
      // Send to server to create Reddit post
      const response = await this.networkService.post<CreatePostResponse>(
        '/api/create-post',
        postData,
        {
          showLoading: true,
          loadingMessage: 'Creating Reddit post...',
          retries: 3
        }
      );
      
      if (response.success) {
        // Requirements 7.2: Show success popup with post URL and gameId
        this.showPostSuccess(response.postUrl, response.gameId);
        
        // Redirect to the new Reddit post after a short delay
        this.scene.time.delayedCall(3000, () => {
          console.log('🔗 Redirecting to Reddit post:', response.postUrl);
          window.location.href = response.postUrl;
        });
      } else {
        this.errorHandler.showError({
          title: 'Post Creation Failed',
          message: 'Failed to create Reddit post. Please try again.',
          type: 'error',
          showRetry: true,
          retryCallback: () => this.confirmPostCreation(gameData)
        });
      }
      
    } catch (error) {
      console.error('Post creation error:', error);
      // Error is already handled by NetworkService
    } finally {
      this.isPosting = false;
    }
  }

  /**
   * Handle post creation cancellation
   */
  private cancelPostCreation() {
    console.log('📤 Post creation cancelled by user');
    this.hidePostCreationDialog();
  }

  /**
   * Hide the post creation dialog
   */
  private hidePostCreationDialog() {
    const ui = (this.scene as any).ui;
    if (ui && ui.hidePostCreationDialog) {
      ui.hidePostCreationDialog();
    }
  }

  /**
   * Validate game data before posting
   */
  private validateGameData(gameData: {
    mapKey: string;
    objectKey: string;
    relX: number;
    relY: number;
  }): boolean {
    const validationResult = this.performComprehensiveValidation(gameData);
    
    if (!validationResult.isValid) {
      this.showValidationError(validationResult.errors, validationResult.suggestions);
      return false;
    }

    return true;
  }

  /**
   * Perform comprehensive validation of game data
   */
  private performComprehensiveValidation(gameData: {
    mapKey: string;
    objectKey: string;
    relX: number;
    relY: number;
  }) {
    const errors: string[] = [];
    const suggestions: string[] = [];
    
    // Validate map key
    const validMaps = ['cozy-bedroom', 'modern-kitchen', 'enchanted-forest', 'octmap'];
    if (!gameData.mapKey || gameData.mapKey.trim() === '') {
      errors.push('No map selected');
      suggestions.push('Please select a map from the map selection screen');
    } else if (!validMaps.includes(gameData.mapKey)) {
      errors.push('Invalid map selected');
      suggestions.push('Please select a valid map');
    }

    // Validate object key
    const validObjects = ['pumpkin', 'wardrobe', 'bush', 'car', 'truck', 'guard'];
    if (!gameData.objectKey || gameData.objectKey.trim() === '') {
      errors.push('No object selected');
      suggestions.push('Please select an object to hide using the object selector');
    } else if (!validObjects.includes(gameData.objectKey)) {
      errors.push('Invalid object selected');
      suggestions.push('Please select a valid object from the available options');
    }

    // Validate coordinate bounds (must be within 0-1 range)
    if (gameData.relX < 0 || gameData.relX > 1 || gameData.relY < 0 || gameData.relY > 1) {
      errors.push('Object placed outside map boundaries');
      suggestions.push('Click within the map area to place your object');
    }

    // Validate coordinate precision (avoid extreme edges for better gameplay)
    const edgeMargin = 0.02; // 2% margin from edges - more lenient
    if (gameData.relX < edgeMargin || gameData.relX > (1 - edgeMargin) || 
        gameData.relY < edgeMargin || gameData.relY > (1 - edgeMargin)) {
      errors.push('Object too close to map edges');
      suggestions.push('Place the object further from the edges for better gameplay experience');
    }

    // Validate coordinate reasonableness (not in obvious spots)
    const centerX = 0.5;
    const centerY = 0.5;
    const distanceFromCenter = Math.sqrt(Math.pow(gameData.relX - centerX, 2) + Math.pow(gameData.relY - centerY, 2));
    
    if (distanceFromCenter < 0.1) {
      suggestions.push('Consider placing the object in a less obvious location for a better challenge');
    }

    return {
      isValid: errors.length === 0,
      errors,
      suggestions
    };
  }

  /**
   * Show validation error with helpful guidance
   */
  private showValidationError(errors: string[], suggestions: string[]) {
    let message = errors.join('\n• ');
    
    if (suggestions.length > 0) {
      message += '\n\n💡 Suggestions:\n• ' + suggestions.join('\n• ');
    }

    this.errorHandler.showError({
      title: 'Game Setup Incomplete',
      message,
      type: 'warning',
      autoHide: false
    });
  }

  /**
   * Show post creation success popup
   * Requirements 7.2: Display post creation confirmation with "Post created! Open on Reddit" message
   */
  private showPostSuccess(postUrl: string, gameId: string) {
    const { width, height } = this.scene.scale;
    
    // Success icon with animation
    const successIcon = this.scene.add.text(width / 2, height / 2 - 80, '🎉', {
      fontSize: '64px'
    }).setOrigin(0.5);
    
    // Success message - Requirements 7.2: Show "Post created! Open on Reddit" message
    const successTitle = this.scene.add.text(width / 2, height / 2 - 30, 'Post Created!', {
      fontSize: '28px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.success,
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    
    const successSubtitle = this.scene.add.text(width / 2, height / 2 - 5, 'Your hide-and-seek challenge is now live on Reddit!\nRedirecting you to the post...', {
      fontSize: '18px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textPrimary,
      align: 'center'
    }).setOrigin(0.5);
    
    // Game ID display
    const gameIdText = this.scene.add.text(width / 2, height / 2 + 20, `Game ID: ${gameId}`, {
      fontSize: '14px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary,
      align: 'center',
      fontStyle: 'italic'
    }).setOrigin(0.5);
    
    // Action buttons - Requirements 7.2: Show link to open on Reddit
    const openBtn = this.createOpenRedditButton(postUrl);
    const copyBtn = this.createCopyLinkButton(postUrl);
    const closeBtn = this.createCloseButton();
    
    // Button container
    const buttonContainer = this.scene.add.container(0, 80, [openBtn, copyBtn, closeBtn]);
    
    // Background with enhanced styling
    const bg = this.scene.add.graphics();
    bg.fillStyle(parseInt(Theme.bgModal.replace('#', ''), 16), 0.98);
    bg.fillRoundedRect(-300, -120, 600, 240, Theme.radiusLarge);
    bg.lineStyle(4, parseInt(Theme.success.replace('#', ''), 16));
    bg.strokeRoundedRect(-300, -120, 600, 240, Theme.radiusLarge);
    
    // Add celebration glow effect
    const glow = this.scene.add.graphics();
    glow.fillStyle(parseInt(Theme.success.replace('#', ''), 16), 0.15);
    glow.fillRoundedRect(-310, -130, 620, 260, Theme.radiusLarge);
    
    const container = this.scene.add.container(width / 2, height / 2, [
      glow, bg, successIcon, successTitle, successSubtitle, gameIdText, buttonContainer
    ]);
    container.setDepth(Theme.zIndexModal);
    
    // Celebration entrance animation
    container.setScale(0);
    successIcon.setScale(0);
    
    this.scene.tweens.add({
      targets: container,
      scaleX: 1,
      scaleY: 1,
      duration: 700,
      ease: 'Back.easeOut'
    });
    
    // Icon celebration animation
    this.scene.tweens.add({
      targets: successIcon,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 500,
      delay: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: successIcon,
          scaleX: 1,
          scaleY: 1,
          duration: 300,
          ease: 'Power2.easeOut'
        });
      }
    });
    
    // Store container reference for manual closing
    (this.scene as any).successContainer = container;
    
    // Auto hide after 12 seconds (longer for success celebration)
    this.scene.time.delayedCall(12000, () => {
      this.hideSuccessPopup();
    });
    
    console.log(`🎉 Game posted successfully: ${postUrl} (Game ID: ${gameId})`);
  }

  /**
   * Create "Open on Reddit" button
   * Requirements 7.2: Provide link to open Reddit post
   */
  private createOpenRedditButton(postUrl: string): Phaser.GameObjects.Container {
    // Button background
    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(parseInt(Theme.accentCyan.replace('#', ''), 16));
    btnBg.fillRoundedRect(-100, -20, 200, 40, Theme.radiusMedium);
    
    // Button text
    const btnText = this.scene.add.text(0, 0, '🔗 Open on Reddit', {
      fontSize: '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textPrimary,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    const button = this.scene.add.container(-130, 0, [btnBg, btnText]);
    button.setSize(200, 40);
    button.setInteractive();
    
    // Hover effects
    button.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(parseInt(Theme.primaryDark.replace('#', ''), 16));
      btnBg.fillRoundedRect(-100, -20, 200, 40, Theme.radiusMedium);
      this.scene.tweens.add({
        targets: button,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 150,
        ease: 'Power2.easeOut'
      });
    });
    
    button.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(parseInt(Theme.accentCyan.replace('#', ''), 16));
      btnBg.fillRoundedRect(-100, -20, 200, 40, Theme.radiusMedium);
      this.scene.tweens.add({
        targets: button,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
        ease: 'Power2.easeOut'
      });
    });
    
    button.on('pointerdown', () => {
      // Add click feedback
      this.scene.tweens.add({
        targets: button,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        yoyo: true,
        ease: 'Power2.easeOut',
        onComplete: () => {
          try {
            // Redirect to the Reddit post immediately
            console.log('🔗 Redirecting to Reddit post:', postUrl);
            window.location.href = postUrl;
          } catch (error) {
            console.error('Failed to open Reddit link:', error);
            this.errorHandler.showError({
              title: 'Link Error',
              message: 'Failed to open Reddit. Please copy the link manually.',
              type: 'error'
            });
          }
        }
      });
    });
    
    return button;
  }

  /**
   * Create "Copy Link" button
   */
  private createCopyLinkButton(postUrl: string): Phaser.GameObjects.Container {
    // Button background
    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(parseInt(Theme.bgSecondary.replace('#', ''), 16));
    btnBg.fillRoundedRect(-80, -20, 160, 40, Theme.radiusMedium);
    
    // Button text
    const btnText = this.scene.add.text(0, 0, '📋 Copy Link', {
      fontSize: '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textPrimary,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    const button = this.scene.add.container(0, 0, [btnBg, btnText]);
    button.setSize(160, 40);
    button.setInteractive();
    
    // Hover effects
    button.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(parseInt(Theme.accentCyan.replace('#', ''), 16), 0.3);
      btnBg.fillRoundedRect(-80, -20, 160, 40, Theme.radiusMedium);
      this.scene.tweens.add({
        targets: button,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 150,
        ease: 'Power2.easeOut'
      });
    });
    
    button.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(parseInt(Theme.bgSecondary.replace('#', ''), 16));
      btnBg.fillRoundedRect(-80, -20, 160, 40, Theme.radiusMedium);
      this.scene.tweens.add({
        targets: button,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
        ease: 'Power2.easeOut'
      });
    });
    
    button.on('pointerdown', () => {
      // Add click feedback
      this.scene.tweens.add({
        targets: button,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        yoyo: true,
        ease: 'Power2.easeOut',
        onComplete: () => {
          this.copyToClipboard(postUrl, btnText);
        }
      });
    });
    
    return button;
  }

  /**
   * Create "Close" button
   */
  private createCloseButton(): Phaser.GameObjects.Container {
    // Button background
    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(parseInt(Theme.bgSecondary.replace('#', ''), 16));
    btnBg.fillRoundedRect(-60, -20, 120, 40, Theme.radiusMedium);
    
    // Button text
    const btnText = this.scene.add.text(0, 0, '✕ Close', {
      fontSize: '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    const button = this.scene.add.container(130, 0, [btnBg, btnText]);
    button.setSize(120, 40);
    button.setInteractive();
    
    // Hover effects
    button.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(parseInt(Theme.error.replace('#', ''), 16), 0.2);
      btnBg.fillRoundedRect(-60, -20, 120, 40, Theme.radiusMedium);
      btnText.setColor(Theme.error);
    });
    
    button.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(parseInt(Theme.bgSecondary.replace('#', ''), 16));
      btnBg.fillRoundedRect(-60, -20, 120, 40, Theme.radiusMedium);
      btnText.setColor(Theme.textSecondary);
    });
    
    button.on('pointerdown', () => {
      this.hideSuccessPopup();
    });
    
    return button;
  }

  /**
   * Copy URL to clipboard with user feedback
   */
  private async copyToClipboard(url: string, buttonText: Phaser.GameObjects.Text) {
    try {
      await navigator.clipboard.writeText(url);
      
      // Show success feedback
      const originalText = buttonText.text;
      buttonText.setText('✅ Copied!');
      buttonText.setColor(Theme.success);
      
      // Reset after 2 seconds
      this.scene.time.delayedCall(2000, () => {
        buttonText.setText(originalText);
        buttonText.setColor(Theme.textPrimary);
      });
      
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      
      // Fallback: show URL in a prompt
      const fallbackText = `Copy this link: ${url}`;
      if (window.prompt) {
        window.prompt(fallbackText, url);
      } else {
        console.log('Reddit post URL:', url);
        buttonText.setText('❌ Failed');
        buttonText.setColor(Theme.error);
        
        this.scene.time.delayedCall(2000, () => {
          buttonText.setText('📋 Copy Link');
          buttonText.setColor(Theme.textPrimary);
        });
      }
    }
  }

  /**
   * Hide success popup with animation
   */
  private hideSuccessPopup() {
    const container = (this.scene as any).successContainer;
    if (container) {
      this.scene.tweens.add({
        targets: container,
        alpha: 0,
        scaleX: 0.8,
        scaleY: 0.8,
        duration: 400,
        ease: 'Power2.easeIn',
        onComplete: () => {
          container.destroy();
          delete (this.scene as any).successContainer;
        }
      });
    }
  }

  /**
   * Cleanup resources when component is destroyed
   */
  destroy(): void {
    this.errorHandler.destroy();
    this.networkService.destroy();
  }
}