import { Scene } from 'phaser';
import { Theme } from '../../../../style/theme';
import type { PlayerProfile } from '../../../../../shared/types/game';

export class PlayerStatsPanel {
  public container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Graphics;
  private statsContainer: Phaser.GameObjects.Container;

  constructor(
    private scene: Scene,
    x: number,
    y: number,
    private playerProfile: PlayerProfile
  ) {
    this.container = this.scene.add.container(x, y);
    this.createStatsPanel();
  }

  private createStatsPanel() {
    // Create background panel
    this.background = this.scene.add.graphics();
    this.background.fillStyle(parseInt(Theme.secondaryDark.replace('#', ''), 16), 0.8);
    this.background.lineStyle(2, parseInt(Theme.accentCyan.replace('#', ''), 16), 0.3);
    this.background.fillRoundedRect(-150, -40, 300, 80, 8);
    this.background.strokeRoundedRect(-150, -40, 300, 80, 8);

    // Create stats container
    this.statsContainer = this.scene.add.container(0, 0);
    
    this.createStatItems();

    // Add to main container
    this.container.add([this.background, this.statsContainer]);
  }

  private createStatItems() {
    const stats = [
      {
        label: 'Total Guesses',
        value: this.playerProfile.totalGuesses.toString(),
        x: -100
      },
      {
        label: 'Successful',
        value: this.playerProfile.successfulGuesses.toString(),
        x: 0
      },
      {
        label: 'Success Rate',
        value: `${Math.round(this.playerProfile.successRate * 100)}%`,
        x: 100
      }
    ];

    stats.forEach((stat, index) => {
      // Stat value (large number)
      const valueText = this.scene.add.text(stat.x, -15, stat.value, {
        fontSize: '24px',
        fontFamily: 'Inter, Arial, sans-serif',
        color: Theme.accentCyan,
        fontStyle: 'bold'
      }).setOrigin(0.5);

      // Stat label (small text)
      const labelText = this.scene.add.text(stat.x, 5, stat.label, {
        fontSize: '12px',
        fontFamily: 'Inter, Arial, sans-serif',
        color: Theme.textSecondary
      }).setOrigin(0.5);

      // Add separator lines (except for last item)
      if (index < stats.length - 1) {
        const separator = this.scene.add.graphics();
        separator.lineStyle(1, parseInt(Theme.border.replace('rgba(238, 238, 238, 0.2)', '0xEEEEEE'), 16), 0.2);
        separator.moveTo(stat.x + 50, -30);
        separator.lineTo(stat.x + 50, 30);
        separator.strokePath();
        this.statsContainer.add(separator);
      }

      this.statsContainer.add([valueText, labelText]);
    });

    // Add player name at the top
    const playerNameText = this.scene.add.text(0, -35, `Welcome back, ${this.playerProfile.username}!`, {
      fontSize: '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.lightGray,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.statsContainer.add(playerNameText);

    // Add join date at the bottom
    const joinDate = new Date(this.playerProfile.joinedAt);
    const joinDateText = this.scene.add.text(0, 25, `Playing since ${joinDate.toLocaleDateString()}`, {
      fontSize: '10px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textMuted
    }).setOrigin(0.5);

    this.statsContainer.add(joinDateText);
  }

  public setPosition(x: number, y: number) {
    this.container.setPosition(x, y);
  }

  public updateStats(newProfile: PlayerProfile) {
    this.playerProfile = newProfile;
    
    // Clear existing stats and recreate
    this.statsContainer.removeAll(true);
    this.createStatItems();
  }

  public destroy() {
    this.container.destroy();
  }
}