import { Scene } from 'phaser';
import { Theme } from '../../../../style/theme';

export class Background {
  private bg!: Phaser.GameObjects.Graphics;
  private ambientParticles!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(private scene: Scene) {}

  create() {
    const { width, height } = this.scene.scale;
    
    // Create gradient background
    this.bg = this.scene.add.graphics();
    this.updateBackground(width, height);
    
    // Add ambient particles for atmosphere
    this.createAmbientParticles();
  }

  private updateBackground(width: number, height: number) {
    this.bg.clear();
    
    // Create a subtle gradient
    this.bg.fillGradientStyle(
      parseInt(Theme.primaryDark.replace('#', ''), 16),
      parseInt(Theme.primaryDark.replace('#', ''), 16),
      parseInt(Theme.secondaryDark.replace('#', ''), 16),
      parseInt(Theme.secondaryDark.replace('#', ''), 16),
      1
    );
    this.bg.fillRect(0, 0, width, height);
    
    // Add subtle texture overlay
    this.bg.fillStyle(parseInt(Theme.accentCyan.replace('#', ''), 16), 0.02);
    this.bg.fillRect(0, 0, width, height);
  }

  private createAmbientParticles() {
    const { width, height } = this.scene.scale;
    
    // Check if particle texture exists, skip if not available
    if (!this.scene.textures.exists('pumpkin')) {
      console.log('⚠️ Particle texture not available, skipping ambient particles');
      return;
    }
    
    // Create very subtle floating particles
    this.ambientParticles = this.scene.add.particles(0, 0, 'pumpkin', {
      x: { min: 0, max: width },
      y: { min: height + 10, max: height + 50 },
      scale: { start: 0.01, end: 0 },
      alpha: { start: 0.1, end: 0 },
      speed: { min: 10, max: 30 },
      lifespan: 8000,
      frequency: 2000,
      gravityY: -20,
      tint: parseInt(Theme.accentCyan.replace('#', ''), 16)
    });
    
    this.ambientParticles.setDepth(-1); // Behind everything
  }

  resize() {
    const { width, height } = this.scene.scale;
    this.updateBackground(width, height);
    
    // Update particle emitter bounds
    if (this.ambientParticles && this.ambientParticles.active) {
      this.ambientParticles.setConfig({
        x: { min: 0, max: width },
        y: { min: height + 10, max: height + 50 }
      });
    }
  }

  destroy() {
    if (this.bg) this.bg.destroy();
    if (this.ambientParticles && this.ambientParticles.active) {
      this.ambientParticles.destroy();
    }
  }
}