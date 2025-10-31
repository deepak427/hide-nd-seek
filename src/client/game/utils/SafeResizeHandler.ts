import { Scene } from 'phaser';

/**
 * SafeResizeHandler prevents WebGL context errors during resize operations
 * by ensuring text objects and graphics are updated safely
 */
export class SafeResizeHandler {
  private static instance: SafeResizeHandler;
  private resizeQueue: Map<string, () => void> = new Map();
  private isProcessing = false;
  private processingTimeout?: ReturnType<typeof setTimeout>;

  private constructor() {}

  public static getInstance(): SafeResizeHandler {
    if (!SafeResizeHandler.instance) {
      SafeResizeHandler.instance = new SafeResizeHandler();
    }
    return SafeResizeHandler.instance;
  }

  /**
   * Safely execute a resize operation with error handling and retry logic
   */
  public safeResize(scene: Scene, key: string, resizeFunction: () => void, delay: number = 50): void {
    // Check if scene is valid
    if (!this.isSceneValid(scene)) {
      console.warn(`Scene ${key} is not valid for resize`);
      return;
    }

    // Add to queue
    this.resizeQueue.set(key, resizeFunction);

    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processResizeQueue(scene, delay);
    }
  }

  /**
   * Process the resize queue safely
   */
  private processResizeQueue(scene: Scene, delay: number): void {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    // Clear any existing timeout
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
    }

    this.processingTimeout = setTimeout(() => {
      this.executeResizeQueue(scene);
    }, delay);
  }

  /**
   * Execute all queued resize operations
   */
  private executeResizeQueue(scene: Scene): void {
    if (!this.isSceneValid(scene)) {
      this.clearQueue();
      return;
    }

    // Check if renderer is available
    const renderer = scene.sys.game.renderer;
    if (!renderer) {
      // Retry after a short delay
      this.processingTimeout = setTimeout(() => {
        this.executeResizeQueue(scene);
      }, 50);
      return;
    }

    // For WebGL renderer, check if context is available
    if (renderer.type === Phaser.WEBGL && (renderer as any).gl) {
      const gl = (renderer as any).gl as WebGLRenderingContext;
      if (gl.isContextLost()) {
        console.warn('WebGL context lost during resize, waiting for restore...');
        // Wait for context restore
        this.processingTimeout = setTimeout(() => {
          this.executeResizeQueue(scene);
        }, 100);
        return;
      }
    }

    // Execute all queued resize operations
    const operations = Array.from(this.resizeQueue.entries());
    this.resizeQueue.clear();

    operations.forEach(([key, operation]) => {
      try {
        operation();
      } catch (error) {
        console.warn(`Resize operation failed for ${key}:`, error);
        
        // Retry this specific operation after a delay
        scene.time.delayedCall(100, () => {
          try {
            operation();
          } catch (retryError) {
            console.error(`Resize retry failed for ${key}:`, retryError);
          }
        });
      }
    });

    this.isProcessing = false;
  }

  /**
   * Check if scene is valid for resize operations
   */
  private isSceneValid(scene: Scene): boolean {
    return scene && 
           scene.sys && 
           scene.sys.game && 
           !(scene.sys.game as any).isDestroyed && 
           scene.scene.isActive();
  }

  /**
   * Clear the resize queue
   */
  private clearQueue(): void {
    this.resizeQueue.clear();
    this.isProcessing = false;
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
      this.processingTimeout = undefined as any;
    }
  }

  /**
   * Safely update text object properties
   */
  public static safeUpdateText(
    text: Phaser.GameObjects.Text, 
    updates: {
      position?: { x: number; y: number };
      fontSize?: string;
      stroke?: { color: string; thickness: number };
      shadow?: { x: number; y: number; color: string; blur: number };
      wordWrap?: number;
    }
  ): void {
    if (!text || !text.scene) {
      return;
    }

    try {
      if (updates.position) {
        text.setPosition(updates.position.x, updates.position.y);
      }

      if (updates.fontSize) {
        text.setFontSize(updates.fontSize);
      }

      if (updates.stroke) {
        text.setStroke(updates.stroke.color, updates.stroke.thickness);
      }

      if (updates.wordWrap !== undefined) {
        text.setWordWrapWidth(updates.wordWrap);
      }

      // Handle shadow separately as it's most likely to cause issues
      if (updates.shadow) {
        try {
          text.setShadow(
            updates.shadow.x, 
            updates.shadow.y, 
            updates.shadow.color, 
            updates.shadow.blur
          );
        } catch (shadowError) {
          console.warn('Failed to set text shadow, clearing shadow:', shadowError);
          // Clear shadow if setting fails
          text.setShadow(0, 0, 'transparent', 0);
        }
      }
    } catch (error) {
      console.warn('Failed to update text properties:', error);
    }
  }

  /**
   * Safely update graphics object
   */
  public static safeUpdateGraphics(
    graphics: Phaser.GameObjects.Graphics,
    updateFunction: (graphics: Phaser.GameObjects.Graphics) => void
  ): void {
    if (!graphics || !graphics.scene) {
      return;
    }

    try {
      graphics.clear();
      updateFunction(graphics);
    } catch (error) {
      console.warn('Failed to update graphics:', error);
    }
  }

  /**
   * Destroy the handler
   */
  public destroy(): void {
    this.clearQueue();
    SafeResizeHandler.instance = null as any;
  }
}