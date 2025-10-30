import { Scene } from 'phaser';
import { Theme } from '../../../../style/theme';
import { NetworkService } from '../../../services/NetworkService';
import { GetPlayerStatsResponse } from '../../../../../shared/types/api';

/**
 * Player stats panel for main menu
 */
export class PlayerStatsPanel {
  private scene: Scene;
  private networkService: NetworkService;
  private container: Phaser.GameObjects.Container | null = null;
  private statsData: GetPlayerStatsResponse | null = null;

  constructor(scene: Scene) {
    this.scene = scene;
    this.networkService = new NetworkService(scene);
  }

  async create(x: number, y: number): Promise<void> {
    try {
      // Load player stats
      this.statsData = await this.networkService.get('/api/player/stats', {
        showLoading: false,
        retries: 1
      }) as GetPlayerStatsResponse;

      this.createStatsPanel(x, y);
    } catch (error) {
      this.createErrorPanel(x, y);
    }
  }

  private createStatsPanel(x: number, y: number): void {
    if (!this.statsData) return;

    const elements: Phaser.GameObjects.GameObject[] = [];
    const { profile, progression } = this.statsData;

    // Background panel
    const panelBg = this.scene.add.graphics();
    panelBg.fillStyle(parseInt(Theme.bgPanel.replace('#', ''), 16), 0.9);
    panelBg.fillRoundedRect(-150, -80, 300, 160, 12);
    panelBg.lineStyle(2, parseInt(Theme.borderLight.replace('#', ''), 16), 0.5);
    panelBg.strokeRoundedRect(-150, -80, 300, 160, 12);
    elements.push(panelBg);

    // Title
    const title = this.scene.add.text(0, -65, 'Your Stats', {
      fontSize: '18px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textPrimary,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    elements.push(title);

    // Rank display
    const rankIcon = this.scene.add.text(-120, -35, '🏆', {
      fontSize: '24px'
    });
    elements.push(rankIcon);

    const rankName = this.scene.add.text(-90, -35, progression.currentRank, {
      fontSize: '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.accentCyan,
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    elements.push(rankName);

    // Rank progress bar
    if (progression.nextRank) {
      const progressBg = this.scene.add.graphics();
      progressBg.fillStyle(parseInt(Theme.bgSecondary.replace('#', ''), 16));
      progressBg.fillRoundedRect(-120, -10, 240, 8, 4);
      elements.push(progressBg);

      const progressFill = this.scene.add.graphics();
      const progressWidth = (240 * progression.progressToNext) / 100;
      progressFill.fillStyle(parseInt(Theme.accentCyan.replace('#', ''), 16));
      progressFill.fillRoundedRect(-120, -10, progressWidth, 8, 4);
      elements.push(progressFill);

      const progressText = this.scene.add.text(0, 5, `${Math.round(progression.progressToNext)}% to ${progression.nextRank}`, {
        fontSize: '12px',
        fontFamily: 'Inter, Arial, sans-serif',
        color: Theme.textSecondary
      }).setOrigin(0.5);
      elements.push(progressText);
    } else {
      const maxRankText = this.scene.add.text(0, -5, 'MAX RANK ACHIEVED!', {
        fontSize: '14px',
        fontFamily: 'Inter, Arial, sans-serif',
        color: Theme.success,
        fontStyle: 'bold'
      }).setOrigin(0.5);
      elements.push(maxRankText);
    }

    // Stats grid
    const statsY = 25;

    // Games Played
    const gamesPlayedLabel = this.scene.add.text(-100, statsY, 'Games', {
      fontSize: '12px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary
    }).setOrigin(0.5);
    const gamesPlayedValue = this.scene.add.text(-100, statsY + 15, profile.totalGuesses.toString(), {
      fontSize: '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.accentCyan,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    elements.push(gamesPlayedLabel, gamesPlayedValue);

    // Games Won
    const gamesWonLabel = this.scene.add.text(0, statsY, 'Won', {
      fontSize: '12px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary
    }).setOrigin(0.5);
    const gamesWonValue = this.scene.add.text(0, statsY + 15, profile.successfulGuesses.toString(), {
      fontSize: '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.success,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    elements.push(gamesWonLabel, gamesWonValue);

    // Win Rate
    const winRateLabel = this.scene.add.text(100, statsY, 'Win Rate', {
      fontSize: '12px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary
    }).setOrigin(0.5);
    const winRateValue = this.scene.add.text(100, statsY + 15, `${Math.round(profile.successRate)}%`, {
      fontSize: '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.warning,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    elements.push(winRateLabel, winRateValue);

    // Rank Points (smaller text at bottom)
    const rankPointsText = this.scene.add.text(0, 65, `${profile.totalGuesses} Total Guesses`, {
      fontSize: '11px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary
    }).setOrigin(0.5);
    elements.push(rankPointsText);

    // Create container
    this.container = this.scene.add.container(x, y, elements);
    this.container.setDepth(Theme.zIndexUI);

    // Entrance animation
    this.container.setAlpha(0);
    this.container.setScale(0.9);
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Back.easeOut'
    });
  }

  private createErrorPanel(x: number, y: number): void {
    const elements: Phaser.GameObjects.GameObject[] = [];

    // Background panel
    const panelBg = this.scene.add.graphics();
    panelBg.fillStyle(parseInt(Theme.bgPanel.replace('#', ''), 16), 0.9);
    panelBg.fillRoundedRect(-150, -40, 300, 80, 12);
    panelBg.lineStyle(2, parseInt(Theme.borderLight.replace('#', ''), 16), 0.5);
    panelBg.strokeRoundedRect(-150, -40, 300, 80, 12);
    elements.push(panelBg);

    // Error message
    const errorText = this.scene.add.text(0, -10, 'Stats Unavailable', {
      fontSize: '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary
    }).setOrigin(0.5);
    elements.push(errorText);

    const subText = this.scene.add.text(0, 10, 'Play a game to see your stats!', {
      fontSize: '12px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary
    }).setOrigin(0.5);
    elements.push(subText);

    // Create container
    this.container = this.scene.add.container(x, y, elements);
    this.container.setDepth(Theme.zIndexUI);

    // Entrance animation
    this.container.setAlpha(0);
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 300
    });
  }

  async refresh(): Promise<void> {
    const x = this.container?.x || 0;
    const y = this.container?.y || 0;
    
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
    
    await this.create(x, y);
  }

  destroy(): void {
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
  }

  getContainer(): Phaser.GameObjects.Container | null {
    return this.container;
  }
}