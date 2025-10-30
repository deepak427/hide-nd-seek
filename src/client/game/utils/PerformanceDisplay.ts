import { Scene } from 'phaser';
import { Theme } from '../../style/theme';
import { PerformanceManager } from './PerformanceManager';

/**
 * PerformanceDisplay shows real-time performance metrics
 * Requirements: 6.4 - Performance monitoring display
 */
export class PerformanceDisplay {
  private scene: Scene;
  private performanceManager: PerformanceManager;
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Graphics;
  private fpsText: Phaser.GameObjects.Text;
  private memoryText: Phaser.GameObjects.Text;
  private objectsText: Phaser.GameObjects.Text;
  private optimizationText: Phaser.GameObjects.Text;
  private isVisible: boolean = false;
  private updateTimer: number | null = null;

  constructor(scene: Scene, performanceManager: PerformanceManager) {
    this.scene = scene;
    this.performanceManager = performanceManager;
    this.createDisplay();
  }

  /**
   * Create performance display UI
   */
  private createDisplay(): void {
    const { width } = this.scene.scale;
    
    // Create background
    this.background = this.scene.add.graphics();
    this.background.fillStyle(parseInt(Theme.bgPrimary.replace('#', ''), 16), 0.9);
    this.background.fillRoundedRect(0, 0, 200, 120, 8);
    this.background.lineStyle(1, parseInt(Theme.border.replace('#', ''), 16));
    this.background.strokeRoundedRect(0, 0, 200, 120, 8);

    // Create text elements
    this.fpsText = this.scene.add.text(10, 10, 'FPS: --', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: Theme.textPrimary
    });

    this.memoryText = this.scene.add.text(10, 30, 'Memory: --', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: Theme.textPrimary
    });

    this.objectsText = this.scene.add.text(10, 50, 'Objects: --', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: Theme.textPrimary
    });

    this.optimizationText = this.scene.add.text(10, 70, 'Quality: --', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: Theme.accentCyan
    });

    // Create container
    this.container = this.scene.add.container(width - 210, 10, [
      this.background,
      this.fpsText,
      this.memoryText,
      this.objectsText,
      this.optimizationText
    ]);

    this.container.setDepth(Theme.zIndexUI + 1000);
    this.container.setVisible(false);
  }

  /**
   * Show performance display
   */
  public show(): void {
    if (this.isVisible) return;
    
    this.isVisible = true;
    this.container.setVisible(true);
    
    // Start update timer
    this.updateTimer = window.setInterval(() => {
      this.updateDisplay();
    }, 500); // Update every 500ms
    
    console.log('📊 Performance display enabled');
  }

  /**
   * Hide performance display
   */
  public hide(): void {
    if (!this.isVisible) return;
    
    this.isVisible = false;
    this.container.setVisible(false);
    
    // Stop update timer
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    
    console.log('📊 Performance display disabled');
  }

  /**
   * Toggle performance display
   */
  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Update display with current metrics
   */
  private updateDisplay(): void {
    if (!this.isVisible) return;

    const metrics = this.performanceManager.getMetrics();
    const optimizationLevel = this.performanceManager.getOptimizationLevel();

    // Update FPS with color coding
    const fpsColor = metrics.fps >= 50 ? Theme.success : 
                     metrics.fps >= 30 ? Theme.warning : Theme.error;
    this.fpsText.setText(`FPS: ${metrics.fps}`);
    this.fpsText.setColor(fpsColor);

    // Update memory usage
    const memoryMB = metrics.memoryUsage.toFixed(1);
    const memoryColor = metrics.memoryUsage < 50 ? Theme.success :
                        metrics.memoryUsage < 100 ? Theme.warning : Theme.error;
    this.memoryText.setText(`Memory: ${memoryMB}MB`);
    this.memoryText.setColor(memoryColor);

    // Update object count
    const objectColor = metrics.activeObjects < 50 ? Theme.success :
                        metrics.activeObjects < 100 ? Theme.warning : Theme.error;
    this.objectsText.setText(`Objects: ${metrics.activeObjects}`);
    this.objectsText.setColor(objectColor);

    // Update optimization level
    this.optimizationText.setText(`Quality: ${optimizationLevel.level}`);
  }

  /**
   * Resize display
   */
  public resize(): void {
    const { width } = this.scene.scale;
    this.container.setPosition(width - 210, 10);
  }

  /**
   * Cleanup display
   */
  public destroy(): void {
    this.hide();
    this.container.destroy();
  }
}