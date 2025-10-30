/**
 * Rank Progression Notification Component
 * Implements Requirements 4.4 - Display rank-up celebrations and animations
 */

import { Scene } from 'phaser';
import { Theme } from '../../style/theme';
import type { PlayerRank } from '../../../shared/types/game';
import { RankService } from '../../../shared/services/RankService';

export class RankProgressionNotification {
  private container?: Phaser.GameObjects.Container;
  private isShowing = false;

  constructor(private scene: Scene) {}

  /**
   * Show rank progression notification with celebration animation
   * Requirements 4.4
   */
  showRankUp(previousRank: PlayerRank, newRank: PlayerRank): void {
    if (this.isShowing) {
      return; // Don't show multiple notifications at once
    }

    this.isShowing = true;
    const { width, height } = this.scene.scale;

    // Get rank display information
    const previousRankInfo = RankService.getRankDisplayInfo(previousRank);
    const newRankInfo = RankService.getRankDisplayInfo(newRank);

    // Create notification container
    this.container = this.scene.add.container(width / 2, height / 2);
    this.container.setDepth(1000); // High z-index for notifications

    // Background overlay
    const overlay = this.scene.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(-width / 2, -height / 2, width, height);

    // Main notification panel
    const panelBg = this.scene.add.graphics();
    panelBg.fillStyle(parseInt(Theme.bgModal.replace('#', ''), 16), 0.98);
    panelBg.fillRoundedRect(-300, -200, 600, 400, Theme.radiusLarge);
    panelBg.lineStyle(4, parseInt(newRankInfo.color.replace('#', ''), 16));
    panelBg.strokeRoundedRect(-300, -200, 600, 400, Theme.radiusLarge);

    // Celebration title
    const celebrationTitle = this.scene.add.text(0, -150, '🎉 RANK UP! 🎉', {
      fontSize: '36px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.accentCyan,
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);

    // Rank transition display
    const rankTransition = this.scene.add.text(0, -80, 
      `${previousRankInfo.name} → ${newRankInfo.name}`, {
      fontSize: '28px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: newRankInfo.color,
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);

    // Previous rank icon
    const prevRankIcon = this.createRankIcon(-120, -20, previousRank, previousRankInfo);
    
    // Arrow
    const arrow = this.scene.add.text(0, -20, '→', {
      fontSize: '48px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.accentCyan,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // New rank icon
    const newRankIcon = this.createRankIcon(120, -20, newRank, newRankInfo);

    // Achievement description
    const description = this.scene.add.text(0, 40, newRankInfo.description, {
      fontSize: '18px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textPrimary,
      align: 'center',
      wordWrap: { width: 500 }
    }).setOrigin(0.5);

    // Requirements met text
    const requirements = RankService.getRankRequirements(newRank);
    const reqText = `Requirements: ${requirements.minTotalFinds} successful finds, ${Math.round(requirements.minSuccessRate * 100)}% success rate`;
    const requirementsDisplay = this.scene.add.text(0, 90, reqText, {
      fontSize: '14px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary,
      align: 'center'
    }).setOrigin(0.5);

    // Continue button
    const continueBtn = this.createContinueButton();

    // Add all elements to container
    this.container.add([
      overlay,
      panelBg,
      celebrationTitle,
      rankTransition,
      prevRankIcon,
      arrow,
      newRankIcon,
      description,
      requirementsDisplay,
      continueBtn
    ]);

    // Create celebration particles
    this.createCelebrationParticles();

    // Entrance animation
    this.animateEntrance();
  }

  /**
   * Show progress notification (not a rank up, but progress towards next rank)
   * Requirements 4.4
   */
  showProgress(_currentRank: PlayerRank, progressPercentage: number, nextRank?: PlayerRank): void {
    if (this.isShowing || !nextRank) {
      return;
    }

    this.isShowing = true;
    const { width } = this.scene.scale;

    // Create smaller notification for progress
    this.container = this.scene.add.container(width - 200, 100);
    this.container.setDepth(999);

    // Background panel
    const panelBg = this.scene.add.graphics();
    panelBg.fillStyle(parseInt(Theme.bgSecondary.replace('#', ''), 16), 0.95);
    panelBg.fillRoundedRect(-150, -60, 300, 120, Theme.radiusMedium);
    panelBg.lineStyle(2, parseInt(Theme.accentCyan.replace('#', ''), 16));
    panelBg.strokeRoundedRect(-150, -60, 300, 120, Theme.radiusMedium);

    // Progress title
    const title = this.scene.add.text(0, -35, 'Progress Update!', {
      fontSize: '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.accentCyan,
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);

    // Progress bar background
    const progressBg = this.scene.add.graphics();
    progressBg.fillStyle(parseInt(Theme.primaryDark.replace('#', ''), 16));
    progressBg.fillRoundedRect(-120, -5, 240, 12, 6);

    // Progress bar fill
    const progressFill = this.scene.add.graphics();
    progressFill.fillStyle(parseInt(Theme.accentCyan.replace('#', ''), 16));
    const fillWidth = 240 * (progressPercentage / 100);
    progressFill.fillRoundedRect(-120, -5, fillWidth, 12, 6);

    // Progress text
    const progressText = this.scene.add.text(0, 25, 
      `${progressPercentage}% to ${RankService.getRankDisplayInfo(nextRank).name}`, {
      fontSize: '14px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textPrimary,
      align: 'center'
    }).setOrigin(0.5);

    this.container.add([panelBg, title, progressBg, progressFill, progressText]);

    // Slide in from right
    this.container.setX(width + 200);
    this.scene.tweens.add({
      targets: this.container,
      x: width - 200,
      duration: 500,
      ease: 'Back.easeOut'
    });

    // Auto hide after 3 seconds
    this.scene.time.delayedCall(3000, () => {
      this.hide();
    });
  }

  /**
   * Create rank icon with appropriate symbol
   */
  private createRankIcon(x: number, y: number, _rank: PlayerRank, rankInfo: any): Phaser.GameObjects.Container {
    const iconContainer = this.scene.add.container(x, y);

    // Icon background circle
    const iconBg = this.scene.add.graphics();
    iconBg.fillStyle(parseInt(rankInfo.color.replace('#', ''), 16));
    iconBg.fillCircle(0, 0, 35);
    iconBg.lineStyle(3, parseInt(Theme.lightGray.replace('#', ''), 16));
    iconBg.strokeCircle(0, 0, 35);

    // Icon symbol
    const iconSymbol = this.scene.add.graphics();
    const lightGrayColor = Theme.lightGray || '#EEEEEE';
    iconSymbol.lineStyle(4, parseInt(lightGrayColor.replace('#', ''), 16));

    switch (rankInfo.iconType) {
      case 'circle':
        iconSymbol.strokeCircle(0, 0, 20);
        break;
      case 'star':
        this.drawStar(iconSymbol, 0, 0, 5, 20, 12);
        break;
      case 'shield':
        this.drawShield(iconSymbol, 0, 0, 20);
        break;
      case 'crown':
        this.drawCrown(iconSymbol, 0, 0, 20);
        break;
    }

    // Rank name below icon
    const rankName = this.scene.add.text(0, 50, rankInfo.name, {
      fontSize: '14px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: rankInfo.color,
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);

    iconContainer.add([iconBg, iconSymbol, rankName]);
    return iconContainer;
  }

  /**
   * Draw star shape for GuessMaster rank
   */
  private drawStar(graphics: Phaser.GameObjects.Graphics, x: number, y: number, points: number, outerRadius: number, innerRadius: number): void {
    const angle = Math.PI / points;
    graphics.beginPath();
    
    for (let i = 0; i < 2 * points; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const currentAngle = i * angle - Math.PI / 2;
      const px = x + Math.cos(currentAngle) * radius;
      const py = y + Math.sin(currentAngle) * radius;
      
      if (i === 0) {
        graphics.moveTo(px, py);
      } else {
        graphics.lineTo(px, py);
      }
    }
    
    graphics.closePath();
    graphics.strokePath();
  }

  /**
   * Draw shield shape for Detective rank
   */
  private drawShield(graphics: Phaser.GameObjects.Graphics, x: number, y: number, size: number): void {
    graphics.beginPath();
    graphics.moveTo(x, y - size);
    graphics.lineTo(x + size * 0.7, y - size * 0.5);
    graphics.lineTo(x + size * 0.7, y + size * 0.3);
    graphics.lineTo(x, y + size);
    graphics.lineTo(x - size * 0.7, y + size * 0.3);
    graphics.lineTo(x - size * 0.7, y - size * 0.5);
    graphics.closePath();
    graphics.strokePath();
  }

  /**
   * Draw crown shape for FBI rank
   */
  private drawCrown(graphics: Phaser.GameObjects.Graphics, x: number, y: number, size: number): void {
    graphics.beginPath();
    graphics.moveTo(x - size, y + size * 0.3);
    graphics.lineTo(x - size * 0.5, y - size * 0.5);
    graphics.lineTo(x - size * 0.2, y);
    graphics.lineTo(x, y - size);
    graphics.lineTo(x + size * 0.2, y);
    graphics.lineTo(x + size * 0.5, y - size * 0.5);
    graphics.lineTo(x + size, y + size * 0.3);
    graphics.lineTo(x - size, y + size * 0.3);
    graphics.strokePath();
  }

  /**
   * Create continue button for rank up notification
   */
  private createContinueButton(): Phaser.GameObjects.Container {
    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(parseInt(Theme.accentCyan.replace('#', ''), 16));
    btnBg.fillRoundedRect(-80, -20, 160, 40, Theme.radiusMedium);

    const btnText = this.scene.add.text(0, 0, 'Continue', {
      fontSize: '18px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textPrimary,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const button = this.scene.add.container(0, 150, [btnBg, btnText]);
    button.setSize(160, 40);
    button.setInteractive();

    // Hover effects
    button.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(parseInt(Theme.primaryDark.replace('#', ''), 16));
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
      btnBg.fillStyle(parseInt(Theme.accentCyan.replace('#', ''), 16));
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
      this.hide();
    });

    return button;
  }

  /**
   * Create celebration particle effects
   */
  private createCelebrationParticles(): void {
    if (!this.container) return;

    const { width, height } = this.scene.scale;

    // Create confetti particles
    for (let i = 0; i < 20; i++) {
      const colors = [Theme.accentCyan, Theme.success, '#FFD700', '#FF6B6B'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      const particle = this.scene.add.graphics();
      particle.fillStyle(parseInt(color.replace('#', ''), 16));
      particle.fillRect(-3, -3, 6, 6);
      
      const startX = Math.random() * width - width / 2;
      const startY = -height / 2 - 50;
      
      particle.setPosition(startX, startY);
      this.container.add(particle);
      
      // Animate particle falling
      this.scene.tweens.add({
        targets: particle,
        y: height / 2 + 100,
        x: startX + (Math.random() - 0.5) * 200,
        rotation: Math.random() * Math.PI * 4,
        duration: 2000 + Math.random() * 1000,
        delay: Math.random() * 500,
        ease: 'Power2.easeIn'
      });
    }

    // Create sparkle effects around the new rank icon
    for (let i = 0; i < 8; i++) {
      const sparkle = this.scene.add.graphics();
      sparkle.lineStyle(2, parseInt(Theme.accentCyan.replace('#', ''), 16));
      sparkle.strokeCircle(0, 0, 3);
      
      const angle = (i / 8) * Math.PI * 2;
      const radius = 80;
      const x = 120 + Math.cos(angle) * radius;
      const y = -20 + Math.sin(angle) * radius;
      
      sparkle.setPosition(x, y);
      sparkle.setAlpha(0);
      this.container.add(sparkle);
      
      // Animate sparkles
      this.scene.tweens.add({
        targets: sparkle,
        alpha: 1,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 300,
        delay: i * 100,
        yoyo: true,
        ease: 'Power2.easeOut'
      });
    }
  }

  /**
   * Animate notification entrance
   */
  private animateEntrance(): void {
    if (!this.container) return;

    // Start with container scaled down and transparent
    this.container.setScale(0);
    this.container.setAlpha(0);

    // Animate entrance
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 600,
      ease: 'Back.easeOut'
    });

    // Add bounce effect to celebration title
    const celebrationTitle = this.container.list[2]; // Third element is the title
    this.scene.tweens.add({
      targets: celebrationTitle,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 300,
      delay: 400,
      yoyo: true,
      repeat: 2,
      ease: 'Power2.easeInOut'
    });
  }

  /**
   * Hide the notification
   */
  hide(): void {
    if (!this.container || !this.isShowing) return;

    const containerToDestroy = this.container;
    this.scene.tweens.add({
      targets: containerToDestroy,
      alpha: 0,
      scaleX: 0.8,
      scaleY: 0.8,
      duration: 400,
      ease: 'Power2.easeIn',
      onComplete: () => {
        containerToDestroy.destroy();
        this.isShowing = false;
      }
    });
    
    this.container = undefined;
  }

  /**
   * Check if notification is currently showing
   */
  isVisible(): boolean {
    return this.isShowing;
  }

  /**
   * Destroy the notification component
   */
  destroy(): void {
    if (this.container) {
      this.container.destroy();
    }
    this.container = undefined;
    this.isShowing = false;
  }
}