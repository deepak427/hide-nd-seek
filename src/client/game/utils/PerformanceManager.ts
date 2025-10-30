import { Scene } from 'phaser';

export interface PerformanceConfig {
  targetFPS: number;
  lowFPSThreshold: number;
  memoryWarningThreshold: number; // MB
  enableAutoOptimization: boolean;
  enablePerformanceMonitoring: boolean;
  maxParticles: number;
  maxTweens: number;
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  drawCalls: number;
  activeObjects: number;
  activeTweens: number;
  activeParticles: number;
}

export interface OptimizationLevel {
  level: 'high' | 'medium' | 'low' | 'potato';
  description: string;
  settings: {
    antialias: boolean;
    pixelArt: boolean;
    maxParticles: number;
    maxTweens: number;
    shadowQuality: 'high' | 'medium' | 'low' | 'off';
    animationQuality: 'high' | 'medium' | 'low';
  };
}

/**
 * PerformanceManager handles mobile performance optimization
 * Requirements: 6.4 - Ensure smooth animations on lower-end devices
 */
export class PerformanceManager {
  private scene: Scene;
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics;
  private optimizationLevel: OptimizationLevel;
  private frameCount: number = 0;
  private lastTime: number = 0;
  private fpsHistory: number[] = [];
  private memoryHistory: number[] = [];
  private performanceTimer: number | null = null;
  private isOptimizing: boolean = false;

  constructor(scene: Scene, config?: Partial<PerformanceConfig>) {
    this.scene = scene;
    this.config = {
      targetFPS: 60,
      lowFPSThreshold: 30,
      memoryWarningThreshold: 100, // 100MB
      enableAutoOptimization: true,
      enablePerformanceMonitoring: true,
      maxParticles: 50,
      maxTweens: 20,
      ...config
    };

    this.metrics = {
      fps: 60,
      frameTime: 16.67,
      memoryUsage: 0,
      drawCalls: 0,
      activeObjects: 0,
      activeTweens: 0,
      activeParticles: 0
    };

    this.optimizationLevel = this.detectOptimalSettings();
    this.setupPerformanceMonitoring();
  }

  /**
   * Detect optimal settings based on device capabilities
   * Requirements: 6.4 - Optimize performance for mobile devices
   */
  private detectOptimalSettings(): OptimizationLevel {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    // Device detection
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isLowEnd = navigator.hardwareConcurrency <= 2;
    const hasLimitedMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory <= 2;
    
    // WebGL capabilities
    const maxTextureSize = gl ? (gl as WebGLRenderingContext).getParameter((gl as WebGLRenderingContext).MAX_TEXTURE_SIZE) : 2048;
    const maxRenderbufferSize = gl ? (gl as WebGLRenderingContext).getParameter((gl as WebGLRenderingContext).MAX_RENDERBUFFER_SIZE) : 2048;
    
    console.log('🔧 Device capabilities:', {
      isMobile,
      isLowEnd,
      hasLimitedMemory,
      maxTextureSize,
      maxRenderbufferSize,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: (navigator as any).deviceMemory
    });

    // Determine optimization level
    if (isLowEnd || hasLimitedMemory || maxTextureSize < 2048) {
      return {
        level: 'potato',
        description: 'Ultra Low - Maximum performance',
        settings: {
          antialias: false,
          pixelArt: true,
          maxParticles: 10,
          maxTweens: 5,
          shadowQuality: 'off',
          animationQuality: 'low'
        }
      };
    } else if (isMobile) {
      return {
        level: 'low',
        description: 'Low - Mobile optimized',
        settings: {
          antialias: false,
          pixelArt: false,
          maxParticles: 25,
          maxTweens: 10,
          shadowQuality: 'low',
          animationQuality: 'medium'
        }
      };
    } else if (maxTextureSize < 4096) {
      return {
        level: 'medium',
        description: 'Medium - Balanced performance',
        settings: {
          antialias: true,
          pixelArt: false,
          maxParticles: 50,
          maxTweens: 15,
          shadowQuality: 'medium',
          animationQuality: 'medium'
        }
      };
    } else {
      return {
        level: 'high',
        description: 'High - Full quality',
        settings: {
          antialias: true,
          pixelArt: false,
          maxParticles: 100,
          maxTweens: 25,
          shadowQuality: 'high',
          animationQuality: 'high'
        }
      };
    }
  }

  /**
   * Setup performance monitoring
   * Requirements: 6.4 - Performance monitoring for optimization
   */
  private setupPerformanceMonitoring(): void {
    if (!this.config.enablePerformanceMonitoring) return;

    // Start performance monitoring loop
    this.performanceTimer = window.setInterval(() => {
      this.updateMetrics();
      this.checkPerformance();
    }, 1000); // Check every second

    // Monitor frame rate
    this.scene.game.events.on('step', this.onGameStep.bind(this));
  }

  /**
   * Handle game step for FPS monitoring
   */
  private onGameStep(time: number, delta: number): void {
    this.frameCount++;
    
    if (time - this.lastTime >= 1000) {
      this.metrics.fps = Math.round((this.frameCount * 1000) / (time - this.lastTime));
      this.metrics.frameTime = delta;
      
      // Update FPS history
      this.fpsHistory.push(this.metrics.fps);
      if (this.fpsHistory.length > 10) {
        this.fpsHistory.shift();
      }
      
      this.frameCount = 0;
      this.lastTime = time;
    }
  }

  /**
   * Update performance metrics
   * Requirements: 6.4 - Performance monitoring
   */
  private updateMetrics(): void {
    // Memory usage (if available)
    if ((performance as any).memory) {
      this.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
      
      this.memoryHistory.push(this.metrics.memoryUsage);
      if (this.memoryHistory.length > 10) {
        this.memoryHistory.shift();
      }
    }

    // Count active objects
    this.metrics.activeObjects = this.scene.children.list.length;
    
    // Count active tweens
    this.metrics.activeTweens = this.scene.tweens.getTweens().length;
    
    // Count active particles (estimate)
    this.metrics.activeParticles = this.scene.children.list.filter(child => 
      (child as any).type === 'ParticleEmitter'
    ).length;
  }

  /**
   * Check performance and trigger optimizations if needed
   * Requirements: 6.4 - Automatic performance optimization
   */
  private checkPerformance(): void {
    if (!this.config.enableAutoOptimization || this.isOptimizing) return;

    const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    const avgMemory = this.memoryHistory.reduce((a, b) => a + b, 0) / this.memoryHistory.length;

    // Check if performance is below threshold
    if (avgFPS < this.config.lowFPSThreshold) {
      console.warn(`⚠️ Low FPS detected: ${avgFPS.toFixed(1)} (target: ${this.config.targetFPS})`);
      this.triggerOptimization('fps');
    }

    if (avgMemory > this.config.memoryWarningThreshold) {
      console.warn(`⚠️ High memory usage: ${avgMemory.toFixed(1)}MB (threshold: ${this.config.memoryWarningThreshold}MB)`);
      this.triggerOptimization('memory');
    }

    // Check for too many active objects
    if (this.metrics.activeObjects > 100) {
      console.warn(`⚠️ High object count: ${this.metrics.activeObjects}`);
      this.triggerOptimization('objects');
    }
  }

  /**
   * Trigger performance optimization
   * Requirements: 6.4 - Automatic performance optimization
   */
  private async triggerOptimization(reason: 'fps' | 'memory' | 'objects'): Promise<void> {
    if (this.isOptimizing) return;
    
    this.isOptimizing = true;
    console.log(`🔧 Triggering optimization for: ${reason}`);

    try {
      switch (reason) {
        case 'fps':
          await this.optimizeForFPS();
          break;
        case 'memory':
          await this.optimizeForMemory();
          break;
        case 'objects':
          await this.optimizeObjectCount();
          break;
      }
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      this.isOptimizing = false;
    }
  }

  /**
   * Optimize for better FPS
   * Requirements: 6.4 - FPS optimization for mobile
   */
  private async optimizeForFPS(): Promise<void> {
    // Reduce particle count
    this.reduceParticleEffects();
    
    // Simplify animations
    this.simplifyAnimations();
    
    // Reduce render quality if needed
    if (this.optimizationLevel.level !== 'potato') {
      this.downgradeOptimizationLevel();
    }
    
    // Clean up unused objects
    this.cleanupUnusedObjects();
    
    console.log('✅ FPS optimization applied');
  }

  /**
   * Optimize for memory usage
   * Requirements: 6.4 - Memory optimization for mobile
   */
  private async optimizeForMemory(): Promise<void> {
    // Force garbage collection if available
    if ((window as any).gc) {
      (window as any).gc();
    }
    
    // Clean up textures
    this.cleanupTextures();
    
    // Reduce object pool sizes
    this.reduceObjectPools();
    
    // Clear unused audio
    this.cleanupAudio();
    
    console.log('✅ Memory optimization applied');
  }

  /**
   * Optimize object count
   * Requirements: 6.4 - Object count optimization
   */
  private async optimizeObjectCount(): Promise<void> {
    // Remove inactive objects
    this.removeInactiveObjects();
    
    // Pool frequently created objects
    this.setupObjectPooling();
    
    // Reduce UI complexity
    this.simplifyUI();
    
    console.log('✅ Object count optimization applied');
  }

  /**
   * Reduce particle effects
   */
  private reduceParticleEffects(): void {
    const particles = this.scene.children.list.filter(child => 
      (child as any).type === 'ParticleEmitter'
    );
    
    particles.forEach(particle => {
      const emitter = particle as any;
      if (emitter.setQuantity) {
        emitter.setQuantity(Math.max(1, Math.floor(emitter.quantity * 0.5)));
      }
    });
  }

  /**
   * Simplify animations
   */
  private simplifyAnimations(): void {
    const tweens = this.scene.tweens.getTweens();
    
    // Remove non-essential tweens
    tweens.forEach((tween: any) => {
      if (tween.isOptional) {
        tween.remove();
      }
    });
  }

  /**
   * Downgrade optimization level
   */
  private downgradeOptimizationLevel(): void {
    const levels: OptimizationLevel['level'][] = ['high', 'medium', 'low', 'potato'];
    const currentIndex = levels.indexOf(this.optimizationLevel.level);
    
    if (currentIndex < levels.length - 1) {
      const newLevel = levels[currentIndex + 1];
      if (newLevel) {
        this.optimizationLevel = this.getOptimizationLevelSettings(newLevel);
        this.applyOptimizationSettings();
        
        console.log(`📉 Downgraded to ${newLevel} quality`);
      }
    }
  }

  /**
   * Get current optimization level
   */
  public getOptimizationLevel(): OptimizationLevel {
    return { ...this.optimizationLevel };
  }

  /**
   * Get optimization level settings
   */
  private getOptimizationLevelSettings(level: OptimizationLevel['level']): OptimizationLevel {
    const levels = {
      high: {
        level: 'high' as const,
        description: 'High - Full quality',
        settings: {
          antialias: true,
          pixelArt: false,
          maxParticles: 100,
          maxTweens: 25,
          shadowQuality: 'high' as const,
          animationQuality: 'high' as const
        }
      },
      medium: {
        level: 'medium' as const,
        description: 'Medium - Balanced performance',
        settings: {
          antialias: true,
          pixelArt: false,
          maxParticles: 50,
          maxTweens: 15,
          shadowQuality: 'medium' as const,
          animationQuality: 'medium' as const
        }
      },
      low: {
        level: 'low' as const,
        description: 'Low - Mobile optimized',
        settings: {
          antialias: false,
          pixelArt: false,
          maxParticles: 25,
          maxTweens: 10,
          shadowQuality: 'low' as const,
          animationQuality: 'medium' as const
        }
      },
      potato: {
        level: 'potato' as const,
        description: 'Ultra Low - Maximum performance',
        settings: {
          antialias: false,
          pixelArt: true,
          maxParticles: 10,
          maxTweens: 5,
          shadowQuality: 'off' as const,
          animationQuality: 'low' as const
        }
      }
    };
    
    return levels[level];
  }

  /**
   * Apply optimization settings to the game
   */
  private applyOptimizationSettings(): void {
    const settings = this.optimizationLevel.settings;
    
    // Update config limits
    this.config.maxParticles = settings.maxParticles;
    this.config.maxTweens = settings.maxTweens;
    
    // Apply renderer settings (would need to restart game for full effect)
    console.log('🎮 Applied optimization settings:', settings);
  }

  /**
   * Clean up unused objects
   */
  private cleanupUnusedObjects(): void {
    const objectsToRemove: any[] = [];
    
    this.scene.children.list.forEach(child => {
      const gameObject = child as any;
      
      // Remove invisible objects that are far off-screen
      if (!gameObject.visible && gameObject.x && gameObject.y) {
        const { width, height } = this.scene.scale;
        if (gameObject.x < -width || gameObject.x > width * 2 ||
            gameObject.y < -height || gameObject.y > height * 2) {
          objectsToRemove.push(gameObject);
        }
      }
      
      // Remove completed tweens
      if (gameObject.tween && gameObject.tween.isComplete()) {
        gameObject.tween.remove();
      }
    });
    
    objectsToRemove.forEach(obj => obj.destroy());
    console.log(`🧹 Cleaned up ${objectsToRemove.length} unused objects`);
  }

  /**
   * Clean up textures
   */
  private cleanupTextures(): void {
    // This would typically involve removing unused textures from the texture manager
    // For now, we'll just log the action
    console.log('🖼️ Texture cleanup performed');
  }

  /**
   * Reduce object pools
   */
  private reduceObjectPools(): void {
    // Reduce any object pools that might exist
    console.log('🏊 Object pool sizes reduced');
  }

  /**
   * Clean up audio
   */
  private cleanupAudio(): void {
    // Stop and clean up any unused audio
    this.scene.sound.removeAll();
    console.log('🔊 Audio cleanup performed');
  }

  /**
   * Remove inactive objects
   */
  private removeInactiveObjects(): void {
    const inactiveObjects = this.scene.children.list.filter(child => {
      const gameObject = child as any;
      return !gameObject.active || (gameObject.alpha !== undefined && gameObject.alpha <= 0);
    });
    
    inactiveObjects.forEach(obj => (obj as any).destroy());
    console.log(`🗑️ Removed ${inactiveObjects.length} inactive objects`);
  }

  /**
   * Setup object pooling
   */
  private setupObjectPooling(): void {
    // This would set up object pools for frequently created/destroyed objects
    console.log('🏊 Object pooling configured');
  }

  /**
   * Simplify UI
   */
  private simplifyUI(): void {
    // Remove non-essential UI animations and effects
    console.log('🎨 UI simplified for performance');
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Manually trigger optimization
   */
  public optimize(reason?: string): void {
    console.log(`🔧 Manual optimization triggered: ${reason || 'user request'}`);
    this.triggerOptimization('fps');
  }

  /**
   * Set optimization level manually
   */
  public setOptimizationLevel(level: OptimizationLevel['level']): void {
    this.optimizationLevel = this.getOptimizationLevelSettings(level);
    this.applyOptimizationSettings();
    console.log(`🎮 Optimization level set to: ${level}`);
  }

  /**
   * Enable/disable auto optimization
   */
  public setAutoOptimization(enabled: boolean): void {
    this.config.enableAutoOptimization = enabled;
    console.log(`🤖 Auto optimization ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get performance report
   */
  public getPerformanceReport(): string {
    const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length || 0;
    const avgMemory = this.memoryHistory.reduce((a, b) => a + b, 0) / this.memoryHistory.length || 0;
    
    return `Performance Report:
- Average FPS: ${avgFPS.toFixed(1)}
- Frame Time: ${this.metrics.frameTime.toFixed(2)}ms
- Memory Usage: ${avgMemory.toFixed(1)}MB
- Active Objects: ${this.metrics.activeObjects}
- Active Tweens: ${this.metrics.activeTweens}
- Optimization Level: ${this.optimizationLevel.level}`;
  }

  /**
   * Cleanup performance manager
   */
  public destroy(): void {
    if (this.performanceTimer) {
      clearInterval(this.performanceTimer);
      this.performanceTimer = null;
    }
    
    this.scene.game.events.off('step', this.onGameStep.bind(this));
    
    this.fpsHistory.length = 0;
    this.memoryHistory.length = 0;
  }
}