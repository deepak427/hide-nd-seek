import { Scene } from 'phaser';
import { Theme } from '../../style/theme';

export interface ErrorConfig {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
  showRetry?: boolean;
  retryCallback?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export interface NetworkErrorConfig extends ErrorConfig {
  endpoint?: string;
  statusCode?: number | undefined;
  retryAttempts?: number;
  maxRetries?: number;
}

export class ErrorHandler {
  private scene: Scene;
  private activeErrorContainer: Phaser.GameObjects.Container | null = null;
  private retryAttempts: Map<string, number> = new Map();

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Show a generic error message
   */
  showError(config: ErrorConfig): void {
    this.hideCurrentError();

    const { width, height } = this.scene.scale;
    const {
      title = 'Error',
      message,
      type = 'error',
      showRetry = false,
      retryCallback,
      autoHide = true,
      autoHideDelay = 5000
    } = config;

    // Get theme colors based on error type
    const colors = this.getErrorColors(type);

    // Error icon
    const icon = this.getErrorIcon(type);
    const errorIcon = this.scene.add.text(0, -40, icon, {
      fontSize: '32px'
    }).setOrigin(0.5);

    // Error title
    const errorTitle = this.scene.add.text(0, -10, title, {
      fontSize: '20px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: colors.primary,
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);

    // Error message
    const errorText = this.scene.add.text(0, 15, message, {
      fontSize: '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary,
      align: 'center',
      wordWrap: { width: 350 }
    }).setOrigin(0.5);

    // Create buttons
    const buttons: Phaser.GameObjects.Container[] = [];
    
    if (showRetry && retryCallback) {
      const retryBtn = this.createRetryButton(retryCallback);
      buttons.push(retryBtn);
    }

    const closeBtn = this.createCloseButton();
    buttons.push(closeBtn);

    // Position buttons
    if (buttons && buttons.length > 0) {
      this.positionButtons(buttons);
    }

    // Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(parseInt(Theme.bgModal.replace('#', ''), 16), 0.98);
    bg.fillRoundedRect(-220, -70, 440, 140, Theme.radiusLarge);
    bg.lineStyle(3, parseInt(colors.primary.replace('#', ''), 16));
    bg.strokeRoundedRect(-220, -70, 440, 140, Theme.radiusLarge);

    // Create container
    this.activeErrorContainer = this.scene.add.container(width / 2, height / 2, [
      bg, errorIcon, errorTitle, errorText, ...buttons
    ]);
    this.activeErrorContainer.setDepth(Theme.zIndexModal);

    // Entrance animation
    this.animateErrorIn(this.activeErrorContainer);

    // Auto hide if enabled
    if (autoHide && !showRetry) {
      this.scene.time.delayedCall(autoHideDelay, () => {
        this.hideCurrentError();
      });
    }
  }

  /**
   * Show network-specific error with retry logic
   */
  showNetworkError(config: NetworkErrorConfig): void {
    const {
      endpoint,
      statusCode,
      retryAttempts = 0,
      maxRetries = 3,
      message,
      retryCallback
    } = config;

    let errorMessage = message;
    let title = 'Network Error';

    // Customize message based on status code
    if (statusCode) {
      switch (statusCode) {
        case 429:
          title = 'Rate Limited';
          errorMessage = 'Too many requests. Please wait a moment and try again.';
          break;
        case 401:
          title = 'Authentication Error';
          errorMessage = 'Please refresh the page and try again.';
          break;
        case 403:
          title = 'Access Denied';
          errorMessage = 'You don\'t have permission to perform this action.';
          break;
        case 404:
          title = 'Not Found';
          errorMessage = 'The requested resource was not found.';
          break;
        case 500:
          title = 'Server Error';
          errorMessage = 'Server error occurred. Please try again later.';
          break;
        default:
          if (statusCode >= 500) {
            title = 'Server Error';
            errorMessage = 'Server is experiencing issues. Please try again later.';
          } else if (statusCode >= 400) {
            title = 'Request Error';
            errorMessage = 'There was a problem with your request.';
          }
      }
    }

    // Add retry information if applicable
    if (retryAttempts > 0) {
      errorMessage += `\n\nRetry attempt ${retryAttempts}/${maxRetries}`;
    }

    // Show retry button if we haven't exceeded max retries
    const showRetry = retryCallback && retryAttempts < maxRetries;

    const errorConfig: ErrorConfig = {
      title,
      message: errorMessage,
      type: 'error',
      showRetry: showRetry || false,
      autoHide: !showRetry
    };

    if (showRetry && retryCallback) {
      errorConfig.retryCallback = () => this.handleRetry(endpoint || 'unknown', retryCallback);
    }

    this.showError(errorConfig);
  }

  /**
   * Show loading state with error fallback
   */
  showLoadingWithFallback(
    loadingMessage: string,
    operation: () => Promise<void>,
    fallbackMessage?: string
  ): void {
    this.showLoading(loadingMessage);

    operation()
      .catch((error) => {
        this.hideCurrentError();
        this.showError({
          title: 'Operation Failed',
          message: fallbackMessage || 'An unexpected error occurred.',
          type: 'error',
          showRetry: true,
          retryCallback: () => this.showLoadingWithFallback(loadingMessage, operation, fallbackMessage)
        });
        console.error('Operation failed:', error);
      });
  }

  /**
   * Show loading indicator
   */
  showLoading(message: string): void {
    this.hideCurrentError();

    const { width, height } = this.scene.scale;

    // Loading spinner
    const spinner = this.scene.add.graphics();
    spinner.lineStyle(4, parseInt(Theme.accentCyan.replace('#', ''), 16));
    spinner.strokeCircle(0, -20, 20);
    spinner.lineStyle(4, parseInt(Theme.accentCyan.replace('#', ''), 16), 0.3);
    spinner.strokeCircle(0, -20, 20);

    // Loading text
    const loadingText = this.scene.add.text(0, 20, message, {
      fontSize: '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textPrimary,
      align: 'center'
    }).setOrigin(0.5);

    // Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(parseInt(Theme.bgModal.replace('#', ''), 16), 0.95);
    bg.fillRoundedRect(-150, -50, 300, 100, Theme.radiusMedium);

    // Create container
    this.activeErrorContainer = this.scene.add.container(width / 2, height / 2, [
      bg, spinner, loadingText
    ]);
    this.activeErrorContainer.setDepth(Theme.zIndexModal);

    // Spinning animation
    this.scene.tweens.add({
      targets: spinner,
      rotation: Math.PI * 2,
      duration: 1000,
      repeat: -1,
      ease: 'Linear'
    });

    // Entrance animation
    this.animateErrorIn(this.activeErrorContainer);
  }

  /**
   * Show connection status indicator
   */
  showConnectionStatus(isOnline: boolean): void {
    const { width } = this.scene.scale;

    const statusColor = isOnline ? Theme.success : Theme.error;
    const statusIcon = isOnline ? '🟢' : '🔴';
    const statusText = isOnline ? 'Connected' : 'Offline';

    // Create status indicator
    const statusIndicator = this.scene.add.container(width - 100, 30);

    const bg = this.scene.add.graphics();
    bg.fillStyle(parseInt(Theme.bgModal.replace('#', ''), 16), 0.9);
    bg.fillRoundedRect(-50, -15, 100, 30, 15);

    const icon = this.scene.add.text(-20, 0, statusIcon, {
      fontSize: '12px'
    }).setOrigin(0.5);

    const text = this.scene.add.text(10, 0, statusText, {
      fontSize: '12px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: statusColor,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    statusIndicator.add([bg, icon, text]);
    statusIndicator.setDepth(Theme.zIndexUI);

    // Auto hide after 3 seconds if online
    if (isOnline) {
      this.scene.time.delayedCall(3000, () => {
        this.scene.tweens.add({
          targets: statusIndicator,
          alpha: 0,
          duration: 500,
          onComplete: () => statusIndicator.destroy()
        });
      });
    }
  }

  /**
   * Handle retry logic with exponential backoff
   */
  private handleRetry(endpoint: string, retryCallback: () => void): void {
    const currentAttempts = this.retryAttempts.get(endpoint) || 0;
    const newAttempts = currentAttempts + 1;
    this.retryAttempts.set(endpoint, newAttempts);

    // Calculate delay with exponential backoff
    const delay = Math.min(1000 * Math.pow(2, currentAttempts), 10000); // Max 10 seconds

    this.hideCurrentError();
    this.showLoading(`Retrying in ${Math.ceil(delay / 1000)} seconds...`);

    this.scene.time.delayedCall(delay, () => {
      this.hideCurrentError();
      retryCallback();
    });
  }

  /**
   * Reset retry attempts for an endpoint
   */
  resetRetryAttempts(endpoint: string): void {
    this.retryAttempts.delete(endpoint);
  }

  /**
   * Get error colors based on type
   */
  private getErrorColors(type: 'error' | 'warning' | 'info') {
    switch (type) {
      case 'error':
        return { primary: Theme.error, secondary: Theme.error };
      case 'warning':
        return { primary: Theme.warning, secondary: Theme.warning };
      case 'info':
        return { primary: Theme.accentCyan, secondary: Theme.accentHover };
      default:
        return { primary: Theme.error, secondary: Theme.error };
    }
  }

  /**
   * Get error icon based on type
   */
  private getErrorIcon(type: 'error' | 'warning' | 'info'): string {
    switch (type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❌';
    }
  }

  /**
   * Create retry button
   */
  private createRetryButton(retryCallback: () => void): Phaser.GameObjects.Container {
    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(parseInt(Theme.accentCyan.replace('#', ''), 16));
    btnBg.fillRoundedRect(-60, -18, 120, 36, Theme.radiusMedium);

    const btnText = this.scene.add.text(0, 0, '🔄 Retry', {
      fontSize: '14px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const button = this.scene.add.container(0, 50, [btnBg, btnText]);
    button.setSize(120, 36);
    button.setInteractive();

    // Hover effects
    button.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(parseInt(Theme.primaryDark.replace('#', ''), 16));
      btnBg.fillRoundedRect(-60, -18, 120, 36, Theme.radiusMedium);
      this.scene.tweens.add({
        targets: button,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 150
      });
    });

    button.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(parseInt(Theme.accentCyan.replace('#', ''), 16));
      btnBg.fillRoundedRect(-60, -18, 120, 36, Theme.radiusMedium);
      this.scene.tweens.add({
        targets: button,
        scaleX: 1,
        scaleY: 1,
        duration: 150
      });
    });

    button.on('pointerdown', () => {
      this.scene.tweens.add({
        targets: button,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          this.hideCurrentError();
          retryCallback();
        }
      });
    });

    return button;
  }

  /**
   * Create close button
   */
  private createCloseButton(): Phaser.GameObjects.Container {
    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(parseInt(Theme.bgSecondary.replace('#', ''), 16));
    btnBg.fillRoundedRect(-60, -18, 120, 36, Theme.radiusMedium);

    const btnText = this.scene.add.text(0, 0, '✕ Close', {
      fontSize: '14px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const button = this.scene.add.container(0, 50, [btnBg, btnText]);
    button.setSize(120, 36);
    button.setInteractive();

    // Hover effects
    button.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(parseInt(Theme.error.replace('#', ''), 16), 0.2);
      btnBg.fillRoundedRect(-60, -18, 120, 36, Theme.radiusMedium);
      btnText.setColor(Theme.error);
    });

    button.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(parseInt(Theme.bgSecondary.replace('#', ''), 16));
      btnBg.fillRoundedRect(-60, -18, 120, 36, Theme.radiusMedium);
      btnText.setColor(Theme.textSecondary);
    });

    button.on('pointerdown', () => {
      this.hideCurrentError();
    });

    return button;
  }

  /**
   * Position buttons in a row
   */
  private positionButtons(buttons: Phaser.GameObjects.Container[]): void {
    if (buttons.length === 1) {
      buttons[0].setPosition(0, 50);
    } else if (buttons.length === 2) {
      buttons[0].setPosition(-80, 50);
      buttons[1].setPosition(80, 50);
    } else {
      // For more than 2 buttons, distribute evenly
      const spacing = 160 / (buttons.length - 1);
      buttons.forEach((button, index) => {
        button.setPosition(-80 + (index * spacing), 50);
      });
    }
  }

  /**
   * Animate error container entrance
   */
  private animateErrorIn(container: Phaser.GameObjects.Container): void {
    container.setScale(0);
    container.setAlpha(0);
    
    this.scene.tweens.add({
      targets: container,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 400,
      ease: 'Back.easeOut'
    });
  }

  /**
   * Hide current error with animation
   */
  hideCurrentError(): void {
    if (this.activeErrorContainer) {
      this.scene.tweens.add({
        targets: this.activeErrorContainer,
        alpha: 0,
        scaleX: 0.8,
        scaleY: 0.8,
        duration: 300,
        ease: 'Power2.easeIn',
        onComplete: () => {
          this.activeErrorContainer?.destroy();
          this.activeErrorContainer = null;
        }
      });
    }
  }

  /**
   * Cleanup when scene is destroyed
   */
  destroy(): void {
    this.hideCurrentError();
    this.retryAttempts.clear();
  }
}