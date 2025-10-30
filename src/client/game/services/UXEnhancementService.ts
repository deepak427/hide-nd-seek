import { Scene } from 'phaser';
import { Theme } from '../../style/theme';

export interface LoadingConfig {
  message: string;
  showProgress?: boolean;
  showSpinner?: boolean;
  duration?: number;
  position?: 'center' | 'top' | 'bottom';
}

export interface TransitionConfig {
  type: 'fade' | 'slide' | 'scale' | 'blur';
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  easing?: string;
}

export interface ProgressConfig {
  current: number;
  total: number;
  label?: string;
  showPercentage?: boolean;
}

export class UXEnhancementService {
  private scene: Scene;
  private activeLoadingContainer: Phaser.GameObjects.Container | null = null;
  private activeProgressBar: Phaser.GameObjects.Container | null = null;
  private transitionOverlay: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Show loading indicator with customizable options
   */
  showLoading(config: LoadingConfig): void {
    this.hideLoading(); // Clear any existing loading

    const { width, height } = this.scene.scale;
    const {
      message,
      showProgress = false,
      showSpinner = true,
      position = 'center'
    } = config;

    // Calculate position
    let x = width / 2;
    let y = height / 2;

    switch (position) {
      case 'top':
        y = 100;
        break;
      case 'bottom':
        y = height - 100;
        break;
    }

    const elements: Phaser.GameObjects.GameObject[] = [];

    // Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(parseInt(Theme.bgModal.replace('#', ''), 16), 0.95);
    bg.fillRoundedRect(-150, -60, 300, 120, Theme.radiusMedium);
    bg.lineStyle(2, parseInt(Theme.accentPrimary.replace('#', ''), 16), 0.3);
    bg.strokeRoundedRect(-150, -60, 300, 120, Theme.radiusMedium);
    elements.push(bg);

    // Spinner
    if (showSpinner) {
      const spinner = this.scene.add.graphics();
      spinner.lineStyle(4, parseInt(Theme.accentPrimary.replace('#', ''), 16));

      // Create animated spinner
      const spinnerRadius = 20;
      const segments = 8;
      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const alpha = 1 - (i / segments) * 0.8;
        const startAngle = angle - 0.2;
        const endAngle = angle + 0.2;

        spinner.lineStyle(4, parseInt(Theme.accentPrimary.replace('#', ''), 16), alpha);
        spinner.beginPath();
        spinner.arc(0, -20, spinnerRadius, startAngle, endAngle);
        spinner.strokePath();
      }

      elements.push(spinner);

      // Spinning animation
      this.scene.tweens.add({
        targets: spinner,
        rotation: Math.PI * 2,
        duration: 1000,
        repeat: -1,
        ease: 'Linear'
      });
    }

    // Loading text
    const loadingText = this.scene.add.text(0, 20, message, {
      fontSize: '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textPrimary,
      align: 'center',
      wordWrap: { width: 280 }
    }).setOrigin(0.5);
    elements.push(loadingText);

    // Progress bar (if enabled)
    if (showProgress) {
      const progressBg = this.scene.add.graphics();
      progressBg.fillStyle(parseInt(Theme.bgPrimary.replace('#', ''), 16), 0.5);
      progressBg.fillRoundedRect(-120, 35, 240, 8, 4);
      elements.push(progressBg);

      const progressFill = this.scene.add.graphics();
      progressFill.fillStyle(parseInt(Theme.accentPrimary.replace('#', ''), 16));
      progressFill.fillRoundedRect(-120, 35, 0, 8, 4);
      elements.push(progressFill);

      // Store reference for progress updates
      (this.scene as any).loadingProgressFill = progressFill;
    }

    // Create container
    this.activeLoadingContainer = this.scene.add.container(x, y, elements);
    this.activeLoadingContainer.setDepth(Theme.zIndexModal);

    // Entrance animation
    this.activeLoadingContainer.setAlpha(0);
    this.activeLoadingContainer.setScale(0.8);

    this.scene.tweens.add({
      targets: this.activeLoadingContainer,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });
  }

  /**
   * Update loading progress (if progress bar is shown)
   */
  updateLoadingProgress(progress: number): void {
    const progressFill = (this.scene as any).loadingProgressFill;
    if (progressFill) {
      const width = 240 * Math.max(0, Math.min(1, progress));
      progressFill.clear();
      progressFill.fillStyle(parseInt(Theme.accentPrimary.replace('#', ''), 16));
      progressFill.fillRoundedRect(-120, 35, width, 8, 4);
    }
  }

  /**
   * Hide loading indicator
   */
  hideLoading(): void {
    if (this.activeLoadingContainer) {
      this.scene.tweens.add({
        targets: this.activeLoadingContainer,
        alpha: 0,
        scaleX: 0.8,
        scaleY: 0.8,
        duration: 200,
        ease: 'Power2.easeIn',
        onComplete: () => {
          this.activeLoadingContainer?.destroy();
          this.activeLoadingContainer = null;
          delete (this.scene as any).loadingProgressFill;
        }
      });
    }
  }

  /**
   * Show progress indicator for multi-step operations
   */
  showProgress(config: ProgressConfig): void {
    this.hideProgress(); // Clear any existing progress

    const { width, height } = this.scene.scale;
    const { current, total, label, showPercentage = true } = config;

    const progress = Math.max(0, Math.min(1, current / total));
    const percentage = Math.round(progress * 100);

    const elements: Phaser.GameObjects.GameObject[] = [];

    // Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(parseInt(Theme.bgModal.replace('#', ''), 16), 0.95);
    bg.fillRoundedRect(-200, -40, 400, 80, Theme.radiusMedium);
    elements.push(bg);

    // Progress bar background
    const progressBg = this.scene.add.graphics();
    progressBg.fillStyle(parseInt(Theme.bgPrimary.replace('#', ''), 16), 0.5);
    progressBg.fillRoundedRect(-180, -5, 360, 12, 6);
    elements.push(progressBg);

    // Progress bar fill
    const progressFill = this.scene.add.graphics();
    progressFill.fillStyle(parseInt(Theme.accentPrimary.replace('#', ''), 16));
    progressFill.fillRoundedRect(-180, -5, 360 * progress, 12, 6);
    elements.push(progressFill);

    // Progress text
    let progressText = `${current}/${total}`;
    if (showPercentage) {
      progressText += ` (${percentage}%)`;
    }
    if (label) {
      progressText = `${label}: ${progressText}`;
    }

    const text = this.scene.add.text(0, -25, progressText, {
      fontSize: '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textPrimary,
      align: 'center'
    }).setOrigin(0.5);
    elements.push(text);

    // Step indicator
    const stepText = this.scene.add.text(0, 15, `Step ${current} of ${total}`, {
      fontSize: '12px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary,
      align: 'center'
    }).setOrigin(0.5);
    elements.push(stepText);

    // Create container
    this.activeProgressBar = this.scene.add.container(width / 2, height - 100, elements);
    this.activeProgressBar.setDepth(Theme.zIndexUI);

    // Entrance animation
    this.activeProgressBar.setY(height + 50);
    this.scene.tweens.add({
      targets: this.activeProgressBar,
      y: height - 100,
      duration: 400,
      ease: 'Back.easeOut'
    });

    // Progress fill animation
    progressFill.setScale(0, 1);
    this.scene.tweens.add({
      targets: progressFill,
      scaleX: 1,
      duration: 600,
      ease: 'Power2.easeOut'
    });
  }

  /**
   * Hide progress indicator
   */
  hideProgress(): void {
    if (this.activeProgressBar) {
      const { height } = this.scene.scale;

      this.scene.tweens.add({
        targets: this.activeProgressBar,
        y: height + 50,
        duration: 300,
        ease: 'Power2.easeIn',
        onComplete: () => {
          this.activeProgressBar?.destroy();
          this.activeProgressBar = null;
        }
      });
    }
  }

  /**
   * Create smooth transition between scenes or states
   */
  async createTransition(config: TransitionConfig): Promise<void> {
    const { width, height } = this.scene.scale;
    const {
      type = 'fade',
      duration = 500,
      direction = 'up',
      easing = 'Power2.easeInOut'
    } = config;

    return new Promise((resolve) => {
      // Create transition overlay
      this.transitionOverlay = this.scene.add.graphics();
      this.transitionOverlay.setDepth(Theme.zIndexModal + 100);

      switch (type) {
        case 'fade':
          this.transitionOverlay.fillStyle(0x000000, 1);
          this.transitionOverlay.fillRect(0, 0, width, height);
          this.transitionOverlay.setAlpha(0);

          this.scene.tweens.add({
            targets: this.transitionOverlay,
            alpha: 1,
            duration: duration / 2,
            ease: easing,
            onComplete: () => {
              // Transition is at peak, callback can happen here
              this.scene.tweens.add({
                targets: this.transitionOverlay,
                alpha: 0,
                duration: duration / 2,
                ease: easing,
                onComplete: () => {
                  this.transitionOverlay?.destroy();
                  this.transitionOverlay = null;
                  resolve();
                }
              });
            }
          });
          break;

        case 'slide':
          this.transitionOverlay.fillStyle(parseInt(Theme.accentPrimary.replace('#', ''), 16), 1);

          let startX = 0, startY = 0, endX = 0, endY = 0;

          switch (direction) {
            case 'left':
              startX = -width;
              this.transitionOverlay.fillRect(startX, 0, width, height);
              break;
            case 'right':
              startX = width;
              this.transitionOverlay.fillRect(startX, 0, width, height);
              break;
            case 'up':
              startY = -height;
              this.transitionOverlay.fillRect(0, startY, width, height);
              break;
            case 'down':
              startY = height;
              this.transitionOverlay.fillRect(0, startY, width, height);
              break;
          }

          this.scene.tweens.add({
            targets: this.transitionOverlay,
            x: endX,
            y: endY,
            duration: duration / 2,
            ease: easing,
            onComplete: () => {
              // Slide out
              switch (direction) {
                case 'left':
                  endX = width;
                  break;
                case 'right':
                  endX = -width;
                  break;
                case 'up':
                  endY = height;
                  break;
                case 'down':
                  endY = -height;
                  break;
              }

              this.scene.tweens.add({
                targets: this.transitionOverlay,
                x: endX,
                y: endY,
                duration: duration / 2,
                ease: easing,
                onComplete: () => {
                  this.transitionOverlay?.destroy();
                  this.transitionOverlay = null;
                  resolve();
                }
              });
            }
          });
          break;

        case 'scale':
          this.transitionOverlay.fillStyle(parseInt(Theme.accentPrimary.replace('#', ''), 16), 1);
          this.transitionOverlay.fillCircle(width / 2, height / 2, 0);

          const maxRadius = Math.sqrt(width * width + height * height) / 2;

          this.scene.tweens.add({
            targets: this.transitionOverlay,
            scale: maxRadius,
            duration: duration / 2,
            ease: easing,
            onComplete: () => {
              this.scene.tweens.add({
                targets: this.transitionOverlay,
                scale: 0,
                duration: duration / 2,
                ease: easing,
                onComplete: () => {
                  this.transitionOverlay?.destroy();
                  this.transitionOverlay = null;
                  resolve();
                }
              });
            }
          });
          break;

        default:
          // Fallback to fade
          resolve();
      }
    });
  }

  /**
   * Add smooth hover effects to interactive elements
   */
  addHoverEffects(
    gameObject: Phaser.GameObjects.GameObject,
    config: {
      scale?: number;
      tint?: number;
      alpha?: number;
      duration?: number;
    } = {}
  ): void {
    const {
      scale = 1.05,
      tint,
      alpha,
      duration = 150
    } = config;

    const interactive = gameObject as any;

    if (!interactive.setInteractive) {
      console.warn('GameObject is not interactive');
      return;
    }

    // Store original values
    const originalScale = { x: interactive.scaleX || 1, y: interactive.scaleY || 1 };
    const originalTint = interactive.tint;
    const originalAlpha = interactive.alpha || 1;

    interactive.on('pointerover', () => {
      const targets: any = {};

      if (scale !== 1) {
        targets.scaleX = originalScale.x * scale;
        targets.scaleY = originalScale.y * scale;
      }

      if (tint !== undefined) {
        targets.tint = tint;
      }

      if (alpha !== undefined) {
        targets.alpha = alpha;
      }

      this.scene.tweens.add({
        targets: interactive,
        ...targets,
        duration,
        ease: 'Power2.easeOut'
      });
    });

    interactive.on('pointerout', () => {
      this.scene.tweens.add({
        targets: interactive,
        scaleX: originalScale.x,
        scaleY: originalScale.y,
        tint: originalTint,
        alpha: originalAlpha,
        duration,
        ease: 'Power2.easeOut'
      });
    });

    interactive.on('pointerdown', () => {
      this.scene.tweens.add({
        targets: interactive,
        scaleX: originalScale.x * 0.95,
        scaleY: originalScale.y * 0.95,
        duration: 100,
        yoyo: true,
        ease: 'Power2.easeOut'
      });
    });
  }

  /**
   * Create pulsing animation for important elements
   */
  addPulseEffect(
    gameObject: Phaser.GameObjects.GameObject,
    config: {
      scale?: number;
      duration?: number;
      repeat?: number;
    } = {}
  ): Phaser.Tweens.Tween {
    const {
      scale = 1.1,
      duration = 1000,
      repeat = -1
    } = config;

    return this.scene.tweens.add({
      targets: gameObject,
      scaleX: scale,
      scaleY: scale,
      duration: duration / 2,
      yoyo: true,
      repeat,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Create floating animation for UI elements
   */
  addFloatEffect(
    gameObject: Phaser.GameObjects.GameObject,
    config: {
      distance?: number;
      duration?: number;
      repeat?: number;
    } = {}
  ): Phaser.Tweens.Tween {
    const {
      distance = 10,
      duration = 2000,
      repeat = -1
    } = config;

    const originalY = (gameObject as any).y;

    return this.scene.tweens.add({
      targets: gameObject,
      y: originalY - distance,
      duration: duration / 2,
      yoyo: true,
      repeat,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Show toast notification
   */
  showToast(
    message: string,
    config: {
      type?: 'success' | 'error' | 'warning' | 'info';
      duration?: number;
      position?: 'top' | 'bottom';
    } = {}
  ): void {
    const { width, height } = this.scene.scale;
    const {
      type = 'info',
      duration = 3000,
      position = 'top'
    } = config;

    // Get colors based on type
    const colors = {
      success: Theme.success,
      error: Theme.error,
      warning: Theme.warning,
      info: Theme.accentPrimary
    };

    const color = colors[type];
    const y = position === 'top' ? 80 : height - 80;

    // Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(parseInt(Theme.bgModal.replace('#', ''), 16), 0.95);
    bg.fillRoundedRect(-150, -25, 300, 50, 25);
    bg.lineStyle(2, parseInt(color.replace('#', ''), 16));
    bg.strokeRoundedRect(-150, -25, 300, 50, 25);

    // Text
    const text = this.scene.add.text(0, 0, message, {
      fontSize: '14px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textPrimary,
      align: 'center',
      wordWrap: { width: 280 }
    }).setOrigin(0.5);

    // Container
    const toast = this.scene.add.container(width / 2, y, [bg, text]);
    toast.setDepth(Theme.zIndexModal + 50);

    // Entrance animation
    toast.setAlpha(0);
    toast.setY(position === 'top' ? 0 : height);

    this.scene.tweens.add({
      targets: toast,
      alpha: 1,
      y: y,
      duration: 300,
      ease: 'Back.easeOut'
    });

    // Auto hide
    this.scene.time.delayedCall(duration, () => {
      this.scene.tweens.add({
        targets: toast,
        alpha: 0,
        y: position === 'top' ? 0 : height,
        duration: 300,
        ease: 'Power2.easeIn',
        onComplete: () => toast.destroy()
      });
    });
  }

  /**
   * Cleanup all active UX elements
   */
  destroy(): void {
    this.hideLoading();
    this.hideProgress();

    if (this.transitionOverlay) {
      this.transitionOverlay.destroy();
      this.transitionOverlay = null;
    }
  }
}