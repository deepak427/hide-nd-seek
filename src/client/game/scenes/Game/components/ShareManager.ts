import { Scene } from 'phaser';
import { Theme } from '../../../../style/theme';
import { CreatePostRequest, CreatePostResponse } from '../../../../../shared/types/api';
import { ErrorHandler } from '../../../services/ErrorHandler';
import { NetworkService } from '../../../services/NetworkService';

export class ShareManager {
  private isPosting: boolean = false;
  private errorHandler: ErrorHandler;
  private networkService: NetworkService;

  constructor(private scene: Scene) {
    this.errorHandler = new ErrorHandler(scene);
    this.networkService = new NetworkService(scene);
  }

  /**
   * Show setup guidance to help users create better games
   */
  showSetupGuidance() {
    // Prevent multiple popups
    if ((this.scene as any).guidanceContainer) {
      console.log('⚠️ Guidance popup already exists, skipping...');
      return;
    }

    const { width, height } = this.scene.scale;

    // Guide icon
    const guideIcon = this.scene.add.text(width / 2, height / 2 - 60, '💡', {
      fontSize: '32px'
    }).setOrigin(0.5);

    // Title
    const title = this.scene.add.text(width / 2, height / 2 - 30, 'How to Play Hide & Seek', {
      fontSize: '18px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.accentCyan,
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);

    // Tips
    const tips = [
      '1. Look at the objects on the map',
      '2. Click on one to hide behind it',
      '3. Choose a good hiding spot!',
      '4. Share your challenge with others'
    ];

    const tipsText = this.scene.add.text(width / 2, height / 2 + 5, tips.join('\n'), {
      fontSize: '14px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textPrimary,
      align: 'center',
      lineSpacing: 4
    }).setOrigin(0.5);

    // Got it button
    const gotItBtn = this.createGotItButton();

    // Background - make it larger to contain all content
    const bg = this.scene.add.graphics();
    bg.fillStyle(parseInt(Theme.bgSecondary.replace('#', ''), 16), 0.95);
    bg.fillRoundedRect(-200, -120, 400, 240, Theme.radiusLarge);
    bg.lineStyle(2, parseInt(Theme.accentCyan.replace('#', ''), 16));
    bg.strokeRoundedRect(-200, -120, 400, 240, Theme.radiusLarge);

    // Adjust positions to fit within the larger background
    guideIcon.setPosition(0, -80);
    title.setPosition(0, -50);
    tipsText.setPosition(0, -10);

    const container = this.scene.add.container(width / 2, height / 2, [
      bg, guideIcon, title, tipsText, gotItBtn
    ]);
    container.setDepth(1000);

    // Ensure container is properly sized and interactive
    container.setSize(400, 240);

    // Add a semi-transparent overlay behind the popup
    const overlay = this.scene.add.graphics();
    overlay.fillStyle(0x000000, 0.5);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(999);
    container.add(overlay);
    overlay.setPosition(-width / 2, -height / 2);

    // Animation
    container.setScale(0);
    this.scene.tweens.add({
      targets: container,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Back.easeOut'
    });

    // Store container reference
    (this.scene as any).guidanceContainer = container;

    // Auto hide after 8 seconds
    this.scene.time.delayedCall(8000, () => {
      this.hideGuidancePopup();
    });
  }

  /**
   * Create "Got it" button for guidance popup
   */
  private createGotItButton(): Phaser.GameObjects.Container {
    // Button background
    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(parseInt(Theme.accentCyan.replace('#', ''), 16));
    btnBg.fillRoundedRect(-60, -18, 120, 36, Theme.radiusMedium);

    // Button text
    const btnText = this.scene.add.text(0, 0, 'Got it!', {
      fontSize: '14px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const button = this.scene.add.container(0, 60, [btnBg, btnText]);
    button.setSize(120, 36);
    button.setInteractive();

    // Hover effects
    button.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(parseInt(Theme.primaryDark.replace('#', ''), 16));
      btnBg.fillRoundedRect(-60, -18, 120, 36, Theme.radiusMedium);
    });

    button.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(parseInt(Theme.accentCyan.replace('#', ''), 16));
      btnBg.fillRoundedRect(-60, -18, 120, 36, Theme.radiusMedium);
    });

    button.on('pointerdown', () => {
      this.hideGuidancePopup();
    });

    return button;
  }

  /**
   * Hide guidance popup
   */
  private hideGuidancePopup() {
    const container = (this.scene as any).guidanceContainer;
    if (container) {
      console.log('🔄 Hiding guidance popup');
      this.scene.tweens.add({
        targets: container,
        alpha: 0,
        scaleX: 0.8,
        scaleY: 0.8,
        duration: 300,
        ease: 'Power2.easeIn',
        onComplete: () => {
          container.destroy();
          delete (this.scene as any).guidanceContainer;
          console.log('✅ Guidance popup destroyed');
        }
      });
    } else {
      console.log('⚠️ No guidance container found to hide');
    }
  }

  async shareHidingChallenge(mapKey: string, objectKey: string, hidingSpot: { x: number; y: number; relX: number; relY: number }) {
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

    try {
      this.isPosting = true;

      console.log('📤 Preparing to post hiding challenge to Reddit...');

      // Validate game state before posting
      if (!this.validateGameState(mapKey, objectKey, hidingSpot)) {
        return;
      }

      // Prepare hiding challenge data for Reddit post
      const postData: CreatePostRequest = {
        mapKey,
        objectKey,
        relX: hidingSpot.relX,
        relY: hidingSpot.relY
      };

      // Send to server to create Reddit post with automatic error handling
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
          retryCallback: () => this.shareHidingChallenge(mapKey, objectKey, hidingSpot)
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
   * Validate game state before posting
   */
  private validateGameState(mapKey: string, objectKey: string, hidingSpot: { x: number; y: number; relX: number; relY: number }): boolean {
    const validationResult = this.performComprehensiveValidation(mapKey, objectKey, hidingSpot);

    if (!validationResult.isValid) {
      this.showValidationError(validationResult.errors, validationResult.suggestions);
      return false;
    }

    return true;
  }

  /**
   * Perform comprehensive validation of game state
   */
  private performComprehensiveValidation(mapKey: string, objectKey: string, hidingSpot: { x: number; y: number; relX: number; relY: number }) {
    const errors: string[] = [];
    const suggestions: string[] = [];

    // Validate map key
    const validMaps = ['bedroom', 'kitchen', 'livingroom', 'bathroom']; // Add more as needed
    if (!mapKey || mapKey.trim() === '') {
      errors.push('No map selected');
      suggestions.push('Please select a map from the map selection screen');
    } else if (!validMaps.includes(mapKey)) {
      errors.push('Invalid map selected');
      suggestions.push('Please select a valid map');
    }

    // Validate object key
    const validObjects = ['pumpkin', 'wardrobe', 'bush', 'car', 'truck', 'guard'];
    if (!objectKey || objectKey.trim() === '') {
      errors.push('No object selected');
      suggestions.push('Please select an object to hide using the object selector');
    } else if (!validObjects.includes(objectKey)) {
      errors.push('Invalid object selected');
      suggestions.push('Please select a valid object from the available options');
    }

    // Validate hiding spot exists
    if (!hidingSpot) {
      errors.push('No hiding spot selected');
      suggestions.push('Click on the map to place your selected object');
      return { isValid: false, errors, suggestions };
    }

    // Validate coordinate bounds (must be within 0-1 range)
    if (hidingSpot.relX < 0 || hidingSpot.relX > 1 || hidingSpot.relY < 0 || hidingSpot.relY > 1) {
      errors.push('Object placed outside map boundaries');
      suggestions.push('Click within the map area to place your object');
    }

    // Validate coordinate precision (avoid extreme edges for better gameplay)
    const edgeMargin = 0.08; // 8% margin from edges
    if (hidingSpot.relX < edgeMargin || hidingSpot.relX > (1 - edgeMargin) ||
      hidingSpot.relY < edgeMargin || hidingSpot.relY > (1 - edgeMargin)) {
      errors.push('Object too close to map edges');
      suggestions.push('Place the object further from the edges for better gameplay experience');
    }

    // Validate coordinate reasonableness (not in obvious spots)
    const centerX = 0.5;
    const centerY = 0.5;
    const distanceFromCenter = Math.sqrt(Math.pow(hidingSpot.relX - centerX, 2) + Math.pow(hidingSpot.relY - centerY, 2));

    if (distanceFromCenter < 0.1) {
      suggestions.push('Consider placing the object in a less obvious location for a better challenge');
    }

    // Validate corner placement (corners might be too easy/hard)
    const corners = [
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }
    ];

    const cornerThreshold = 0.15;
    for (const corner of corners) {
      const distanceFromCorner = Math.sqrt(
        Math.pow(hidingSpot.relX - corner.x, 2) + Math.pow(hidingSpot.relY - corner.y, 2)
      );
      if (distanceFromCorner < cornerThreshold) {
        suggestions.push('Corner placement detected - consider a more creative hiding spot');
        break;
      }
    }

    // Check for potential overlap with UI elements (approximate)
    if (hidingSpot.relY < 0.15) {
      suggestions.push('Avoid placing objects too close to the top where UI elements might overlap');
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

  private showPostSuccess(postUrl: string, gameId: string) {
    const { width, height } = this.scene.scale;

    // Success icon with animation
    const successIcon = this.scene.add.text(width / 2, height / 2 - 60, '🎉', {
      fontSize: '48px'
    }).setOrigin(0.5);

    // Success message
    const successTitle = this.scene.add.text(width / 2, height / 2 - 20, 'Post Created Successfully!', {
      fontSize: '24px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.success,
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);

    const successSubtitle = this.scene.add.text(width / 2, height / 2 + 5, 'Your hide-and-seek challenge is now live on Reddit', {
      fontSize: '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary,
      align: 'center'
    }).setOrigin(0.5);

    // Game ID display
    const gameIdText = this.scene.add.text(width / 2, height / 2 + 30, `Game ID: ${gameId}`, {
      fontSize: '12px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary,
      align: 'center',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    // Action buttons
    const openBtn = this.createOpenRedditButton(postUrl);
    const copyBtn = this.createCopyLinkButton(postUrl);
    const closeBtn = this.createCloseButton();

    // Button container
    const buttonContainer = this.scene.add.container(0, 70, [openBtn, copyBtn, closeBtn]);

    // Background with gradient effect
    const bg = this.scene.add.graphics();
    bg.fillStyle(parseInt(Theme.bgSecondary.replace('#', ''), 16), 0.98);
    bg.fillRoundedRect(-280, -100, 560, 200, Theme.radiusLarge);
    bg.lineStyle(3, parseInt(Theme.success.replace('#', ''), 16));
    bg.strokeRoundedRect(-280, -100, 560, 200, Theme.radiusLarge);

    // Add subtle glow effect
    const glow = this.scene.add.graphics();
    glow.fillStyle(parseInt(Theme.success.replace('#', ''), 16), 0.1);
    glow.fillRoundedRect(-285, -105, 570, 210, Theme.radiusLarge);

    const container = this.scene.add.container(width / 2, height / 2, [
      glow, bg, successIcon, successTitle, successSubtitle, gameIdText, buttonContainer
    ]);
    container.setDepth(1000);

    // Entrance animation
    container.setScale(0);
    successIcon.setScale(0);

    this.scene.tweens.add({
      targets: container,
      scaleX: 1,
      scaleY: 1,
      duration: 600,
      ease: 'Back.easeOut'
    });

    // Icon bounce animation
    this.scene.tweens.add({
      targets: successIcon,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 400,
      delay: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: successIcon,
          scaleX: 1,
          scaleY: 1,
          duration: 200,
          ease: 'Power2.easeOut'
        });
      }
    });

    // Store container reference for manual closing
    (this.scene as any).successContainer = container;

    // Auto hide after 10 seconds (longer for success)
    this.scene.time.delayedCall(10000, () => {
      this.hideSuccessPopup();
    });

    console.log(`🎉 Game posted successfully: ${postUrl} (Game ID: ${gameId})`);
  }

  private createOpenRedditButton(postUrl: string): Phaser.GameObjects.Container {
    // Button background
    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(parseInt(Theme.accentCyan.replace('#', ''), 16));
    btnBg.fillRoundedRect(-90, -18, 180, 36, Theme.radiusMedium);

    // Button text
    const btnText = this.scene.add.text(0, 0, '🔗 Open on Reddit', {
      fontSize: '14px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const button = this.scene.add.container(-120, 0, [btnBg, btnText]);
    button.setSize(180, 36);
    button.setInteractive();

    // Hover effects
    button.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(parseInt(Theme.primaryDark.replace('#', ''), 16));
      btnBg.fillRoundedRect(-90, -18, 180, 36, Theme.radiusMedium);
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
      btnBg.fillRoundedRect(-90, -18, 180, 36, Theme.radiusMedium);
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
            window.open(postUrl, '_blank');
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

  private createCopyLinkButton(postUrl: string): Phaser.GameObjects.Container {
    // Button background
    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(parseInt(Theme.accentCyan.replace('#', ''), 16));
    btnBg.fillRoundedRect(-70, -18, 140, 36, Theme.radiusMedium);

    // Button text
    const btnText = this.scene.add.text(0, 0, '📋 Copy Link', {
      fontSize: '14px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textPrimary,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const button = this.scene.add.container(0, 0, [btnBg, btnText]);
    button.setSize(140, 36);
    button.setInteractive();

    // Hover effects
    button.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(parseInt(Theme.accentHover.replace('#', ''), 16));
      btnBg.fillRoundedRect(-70, -18, 140, 36, Theme.radiusMedium);
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
      btnBg.fillRoundedRect(-70, -18, 140, 36, Theme.radiusMedium);
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

  private createCloseButton(): Phaser.GameObjects.Container {
    // Button background
    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(parseInt(Theme.bgSecondary.replace('#', ''), 16));
    btnBg.fillRoundedRect(-50, -18, 100, 36, Theme.radiusMedium);

    // Button text
    const btnText = this.scene.add.text(0, 0, '✕ Close', {
      fontSize: '14px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const button = this.scene.add.container(120, 0, [btnBg, btnText]);
    button.setSize(100, 36);
    button.setInteractive();

    // Hover effects
    button.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(parseInt(Theme.error.replace('#', ''), 16), 0.2);
      btnBg.fillRoundedRect(-50, -18, 100, 36, Theme.radiusMedium);
      btnText.setColor(Theme.error);
    });

    button.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(parseInt(Theme.bgSecondary.replace('#', ''), 16));
      btnBg.fillRoundedRect(-50, -18, 100, 36, Theme.radiusMedium);
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
        duration: 300,
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