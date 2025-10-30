import { Scene } from 'phaser';
import { Theme } from '../../../../style/theme';

export class ParticleBackground {
  private particles: Phaser.GameObjects.Graphics[] = [];
  private particleCount = 50;

  constructor(private scene: Scene) {}

  create() {
    const { width, height } = this.scene.scale;
    
    for (let i = 0; i < this.particleCount; i++) {
      this.createParticle(width, height);
    }
  }

  private createParticle(width: number, height: number) {
    const particle = this.scene.add.graphics();
    const size = Phaser.Math.Between(1, 3);
    const alpha = Phaser.Math.FloatBetween(0.1, 0.3);
    
    // Random color from theme
    const colors = [Theme.primary, Theme.primaryDark, Theme.accent];
    const color = colors[Phaser.Math.Between(0, colors.length - 1)];
    
    particle.fillStyle(parseInt(color.replace('#', ''), 16), alpha);
    particle.fillCircle(0, 0, size);
    
    // Random position
    particle.setPosition(
      Phaser.Math.Between(0, width),
      Phaser.Math.Between(0, height)
    );
    
    // Add floating animation
    this.scene.tweens.add({
      targets: particle,
      y: particle.y - Phaser.Math.Between(50, 150),
      x: particle.x + Phaser.Math.Between(-30, 30),
      alpha: { from: alpha, to: 0 },
      duration: Phaser.Math.Between(3000, 8000),
      ease: 'Sine.easeInOut',
      repeat: -1,
      yoyo: false,
      onRepeat: () => {
        // Reset position
        particle.setPosition(
          Phaser.Math.Between(0, width),
          height + 10
        );
        particle.setAlpha(alpha);
      }
    });
    
    this.particles.push(particle);
  }

  resize(width: number, height: number) {
    // Adjust particle positions for new screen size
    this.particles.forEach(particle => {
      if (particle.x > width) {
        particle.setX(Phaser.Math.Between(0, width));
      }
      if (particle.y > height) {
        particle.setY(Phaser.Math.Between(0, height));
      }
    });
  }

  destroy() {
    this.particles.forEach(particle => particle.destroy());
    this.particles = [];
  }
}