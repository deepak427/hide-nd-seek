import { Scene, GameObjects } from 'phaser';
import { Theme } from '../../style/theme';

export interface TouchConfig {
  enableHapticFeedback?: boolean;
  doubleTapDelay?: number;
  longPressDelay?: number;
  swipeThreshold?: number;
  preventContextMenu?: boolean;
}

export interface TouchEvent {
  type: 'tap' | 'doubletap' | 'longpress' | 'swipe' | 'pinch';
  x: number;
  y: number;
  target?: GameObjects.GameObject;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  scale?: number;
}

/**
 * TouchHandler provides mobile-optimized touch interactions
 * Requirements: 6.4 - Optimize touch interactions for mobile
 */
export class TouchHandler {
  private scene: Scene;
  private config: TouchConfig;
  private touchStartTime: number = 0;
  private touchStartPos: { x: number; y: number } = { x: 0, y: 0 };
  private lastTapTime: number = 0;
  private lastTapPos: { x: number; y: number } = { x: 0, y: 0 };
  private isLongPressing: boolean = false;
  private longPressTimer: number | null = null;
  private touchCallbacks: Map<string, Array<(event: TouchEvent) => void>> = new Map();

  constructor(scene: Scene, config?: TouchConfig) {
    this.scene = scene;
    this.config = {
      enableHapticFeedback: true,
      doubleTapDelay: 300,
      longPressDelay: 500,
      swipeThreshold: 50,
      preventContextMenu: true,
      ...config
    };

    this.setupTouchHandlers();
  }

  /**
   * Setup touch event handlers
   * Requirements: 6.4 - Optimize touch interactions for mobile
   */
  private setupTouchHandlers(): void {
    // Prevent context menu on touch devices
    if (this.config.preventContextMenu) {
      this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (pointer.rightButtonDown()) {
          pointer.event.preventDefault();
        }
      });
    }

    // Setup touch start
    this.scene.input.on('pointerdown', this.handleTouchStart.bind(this));
    
    // Setup touch end
    this.scene.input.on('pointerup', this.handleTouchEnd.bind(this));
    
    // Setup touch move
    this.scene.input.on('pointermove', this.handleTouchMove.bind(this));
    
    // Setup multi-touch for pinch gestures
    this.scene.input.on('pointerdown', this.handleMultiTouch.bind(this));
    this.scene.input.on('pointerup', this.handleMultiTouchEnd.bind(this));
  }

  /**
   * Handle touch start events
   */
  private handleTouchStart(pointer: Phaser.Input.Pointer): void {
    this.touchStartTime = Date.now();
    this.touchStartPos = { x: pointer.x, y: pointer.y };
    this.isLongPressing = false;

    // Clear any existing long press timer
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }

    // Start long press timer
    this.longPressTimer = window.setTimeout(() => {
      this.isLongPressing = true;
      this.triggerLongPress(pointer);
    }, this.config.longPressDelay);

    // Add visual feedback for touch
    this.addTouchFeedback(pointer.x, pointer.y);
  }

  /**
   * Handle touch end events
   */
  private handleTouchEnd(pointer: Phaser.Input.Pointer): void {
    const distance = Phaser.Math.Distance.Between(
      this.touchStartPos.x, this.touchStartPos.y,
      pointer.x, pointer.y
    );

    // Clear long press timer
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    // Don't process tap if it was a long press
    if (this.isLongPressing) {
      this.isLongPressing = false;
      return;
    }

    // Check for swipe gesture
    if (distance > this.config.swipeThreshold!) {
      this.handleSwipe(pointer);
      return;
    }

    // Check for double tap
    const timeSinceLastTap = Date.now() - this.lastTapTime;
    const distanceFromLastTap = Phaser.Math.Distance.Between(
      this.lastTapPos.x, this.lastTapPos.y,
      pointer.x, pointer.y
    );

    if (timeSinceLastTap < this.config.doubleTapDelay! && distanceFromLastTap < 50) {
      this.triggerDoubleTap(pointer);
    } else {
      this.triggerTap(pointer);
    }

    // Update last tap info
    this.lastTapTime = Date.now();
    this.lastTapPos = { x: pointer.x, y: pointer.y };
  }

  /**
   * Handle touch move events
   */
  private handleTouchMove(pointer: Phaser.Input.Pointer): void {
    // Cancel long press if finger moves too much
    if (this.longPressTimer) {
      const distance = Phaser.Math.Distance.Between(
        this.touchStartPos.x, this.touchStartPos.y,
        pointer.x, pointer.y
      );

      if (distance > 20) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
    }
  }

  /**
   * Handle multi-touch for pinch gestures
   */
  private handleMultiTouch(_pointer: Phaser.Input.Pointer): void {
    // Multi-touch handling would go here for pinch-to-zoom
    // Currently not implemented as the game doesn't require it
  }

  /**
   * Handle multi-touch end
   */
  private handleMultiTouchEnd(_pointer: Phaser.Input.Pointer): void {
    // Multi-touch end handling
  }

  /**
   * Trigger tap event
   */
  private triggerTap(pointer: Phaser.Input.Pointer): void {
    const touchEvent: TouchEvent = {
      type: 'tap',
      x: pointer.x,
      y: pointer.y,
      target: pointer.camera?.getWorldPoint(pointer.x, pointer.y) as any
    };

    this.emitTouchEvent('tap', touchEvent);
    this.provideTouchFeedback();
  }

  /**
   * Trigger double tap event
   */
  private triggerDoubleTap(pointer: Phaser.Input.Pointer): void {
    const touchEvent: TouchEvent = {
      type: 'doubletap',
      x: pointer.x,
      y: pointer.y,
      target: pointer.camera?.getWorldPoint(pointer.x, pointer.y) as any
    };

    this.emitTouchEvent('doubletap', touchEvent);
    this.provideTouchFeedback('double');
  }

  /**
   * Trigger long press event
   */
  private triggerLongPress(pointer: Phaser.Input.Pointer): void {
    const touchEvent: TouchEvent = {
      type: 'longpress',
      x: pointer.x,
      y: pointer.y,
      target: pointer.camera?.getWorldPoint(pointer.x, pointer.y) as any
    };

    this.emitTouchEvent('longpress', touchEvent);
    this.provideTouchFeedback('long');
  }

  /**
   * Handle swipe gestures
   */
  private handleSwipe(pointer: Phaser.Input.Pointer): void {
    const deltaX = pointer.x - this.touchStartPos.x;
    const deltaY = pointer.y - this.touchStartPos.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    let direction: 'up' | 'down' | 'left' | 'right';
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    const touchEvent: TouchEvent = {
      type: 'swipe',
      x: pointer.x,
      y: pointer.y,
      direction,
      distance,
      target: pointer.camera?.getWorldPoint(pointer.x, pointer.y) as any
    };

    this.emitTouchEvent('swipe', touchEvent);
    this.provideTouchFeedback('swipe');
  }

  /**
   * Add visual feedback for touch
   * Requirements: 6.4 - Optimize touch interactions for mobile
   */
  private addTouchFeedback(x: number, y: number): void {
    // Create ripple effect
    const ripple = this.scene.add.graphics();
    ripple.lineStyle(2, parseInt(Theme.accentCyan.replace('#', ''), 16), 0.8);
    ripple.strokeCircle(0, 0, 10);
    ripple.setPosition(x, y);
    ripple.setDepth(Theme.zIndexUI + 100);

    // Animate ripple
    this.scene.tweens.add({
      targets: ripple,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 300,
      ease: 'Power2.easeOut',
      onComplete: () => {
        ripple.destroy();
      }
    });
  }

  /**
   * Provide haptic feedback for touch interactions
   * Requirements: 6.4 - Optimize touch interactions for mobile
   */
  private provideTouchFeedback(type: 'tap' | 'double' | 'long' | 'swipe' = 'tap'): void {
    if (!this.config.enableHapticFeedback) return;

    // Use Web Vibration API if available
    if ('vibrate' in navigator) {
      switch (type) {
        case 'tap':
          navigator.vibrate(10);
          break;
        case 'double':
          navigator.vibrate([10, 50, 10]);
          break;
        case 'long':
          navigator.vibrate(50);
          break;
        case 'swipe':
          navigator.vibrate(20);
          break;
      }
    }
  }

  /**
   * Make a game object touch-optimized
   * Requirements: 6.4 - Optimize touch interactions for mobile
   */
  public makeTouchOptimized(
    gameObject: GameObjects.GameObject, 
    minTouchArea: number = 44
  ): void {
    if (!gameObject.input) {
      (gameObject as any).setInteractive();
    }

    // Expand hit area for better touch targets
    const bounds = (gameObject as any).getBounds?.() || { width: 32, height: 32 };
    const expandX = Math.max(0, (minTouchArea - bounds.width) / 2);
    const expandY = Math.max(0, (minTouchArea - bounds.height) / 2);

    if (expandX > 0 || expandY > 0) {
      (gameObject as any).input.hitArea = new Phaser.Geom.Rectangle(
        -expandX, -expandY,
        bounds.width + expandX * 2,
        bounds.height + expandY * 2
      );
    }

    // Add touch feedback
    gameObject.on('pointerdown', () => {
      this.addTouchFeedback(
        (gameObject as any).x || 0,
        (gameObject as any).y || 0
      );
    });

    // Add hover effects for non-touch devices
    if (!('ontouchstart' in window)) {
      gameObject.on('pointerover', () => {
        this.scene.tweens.add({
          targets: gameObject,
          scaleX: (gameObject as any).scaleX * 1.05,
          scaleY: (gameObject as any).scaleY * 1.05,
          duration: 150,
          ease: 'Power2.easeOut'
        });
      });

      gameObject.on('pointerout', () => {
        this.scene.tweens.add({
          targets: gameObject,
          scaleX: (gameObject as any).scaleX / 1.05,
          scaleY: (gameObject as any).scaleY / 1.05,
          duration: 150,
          ease: 'Power2.easeOut'
        });
      });
    }
  }

  /**
   * Create touch-optimized button
   * Requirements: 6.4 - Optimize touch interactions for mobile
   */
  public createTouchButton(
    x: number,
    y: number,
    text: string,
    callback: () => void,
    style?: any
  ): GameObjects.Container {
    const defaultStyle = {
      fontSize: '18px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textPrimary,
      backgroundColor: Theme.accentCyan,
      padding: { x: 20, y: 12 }
    };

    const buttonStyle = { ...defaultStyle, ...style };
    
    // Create button background
    const bg = this.scene.add.graphics();
    bg.fillStyle(parseInt(Theme.accentCyan.replace('#', ''), 16));
    bg.fillRoundedRect(-60, -22, 120, 44, 8);

    // Create button text
    const buttonText = this.scene.add.text(0, 0, text, buttonStyle).setOrigin(0.5);

    // Create container
    const button = this.scene.add.container(x, y, [bg, buttonText]);
    
    // Make it interactive with optimized touch area
    this.makeTouchOptimized(button, 44);
    
    // Add click handler
    button.on('pointerdown', () => {
      this.provideTouchFeedback();
      callback();
    });

    // Add press animation
    button.on('pointerdown', () => {
      this.scene.tweens.add({
        targets: button,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        yoyo: true,
        ease: 'Power2.easeOut'
      });
    });

    return button;
  }

  /**
   * Register touch event callback
   */
  public on(eventType: string, callback: (event: TouchEvent) => void): void {
    if (!this.touchCallbacks.has(eventType)) {
      this.touchCallbacks.set(eventType, []);
    }
    this.touchCallbacks.get(eventType)!.push(callback);
  }

  /**
   * Unregister touch event callback
   */
  public off(eventType: string, callback: (event: TouchEvent) => void): void {
    const callbacks = this.touchCallbacks.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit touch event to registered callbacks
   */
  private emitTouchEvent(eventType: string, event: TouchEvent): void {
    const callbacks = this.touchCallbacks.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error(`Touch event callback error for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Cleanup touch handler
   */
  public destroy(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }
    
    this.touchCallbacks.clear();
    
    // Remove event listeners
    this.scene.input.off('pointerdown');
    this.scene.input.off('pointerup');
    this.scene.input.off('pointermove');
  }
}