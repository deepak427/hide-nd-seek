import { Scene } from 'phaser';
import { Theme } from '../../../style/theme';
import { NetworkService } from '../../services/NetworkService';
import { ErrorHandler } from '../../services/ErrorHandler';
import { GetLeaderboardResponse, LeaderboardEntry } from '../../../../shared/types/api';

/**
 * Leaderboard scene showing top players
 */
export class LeaderboardScene extends Scene {
  private networkService!: NetworkService;
  private errorHandler!: ErrorHandler;
  private leaderboardData: GetLeaderboardResponse | null = null;
  private scrollContainer: Phaser.GameObjects.Container | null = null;
  private scrollY = 0;
  private maxScrollY = 0;

  constructor() {
    super({ key: 'LeaderboardScene' });
  }

  create(): void {
    this.networkService = new NetworkService(this);
    this.errorHandler = new ErrorHandler(this);

    this.createBackground();
    this.loadLeaderboard();
  }

  private createBackground(): void {
    const { width, height } = this.scale;

    // Background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(
      parseInt(Theme.bgPrimary.replace('#', ''), 16),
      parseInt(Theme.bgPrimary.replace('#', ''), 16),
      parseInt(Theme.bgSecondary.replace('#', ''), 16),
      parseInt(Theme.bgSecondary.replace('#', ''), 16),
      1
    );
    bg.fillRect(0, 0, width, height);

    // Header
    const headerBg = this.add.graphics();
    headerBg.fillStyle(parseInt(Theme.bgPanel.replace('#', ''), 16), 0.9);
    headerBg.fillRect(0, 0, width, 100);
    headerBg.lineStyle(2, parseInt(Theme.borderLight.replace('#', ''), 16), 0.3);
    headerBg.lineBetween(0, 100, width, 100);

    // Title
    this.add.text(width / 2, 30, '🏆 Leaderboard', {
      fontSize: '32px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.accentCyan,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Back button
    this.createBackButton();
  }

  private createBackButton(): void {
    
    const backBg = this.add.graphics();
    backBg.fillStyle(parseInt(Theme.accentCyan.replace('#', ''), 16));
    backBg.fillRoundedRect(20, 20, 100, 40, 8);
    
    const backText = this.add.text(70, 40, '← Back', {
      fontSize: '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textPrimary,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    const backButton = this.add.container(0, 0, [backBg, backText]);
    backButton.setSize(100, 40);
    backButton.setInteractive();
    
    // Hover effects
    backButton.on('pointerover', () => {
      backBg.clear();
      backBg.fillStyle(parseInt(Theme.accentHover.replace('#', ''), 16));
      backBg.fillRoundedRect(20, 20, 100, 40, 8);
    });
    
    backButton.on('pointerout', () => {
      backBg.clear();
      backBg.fillStyle(parseInt(Theme.accentCyan.replace('#', ''), 16));
      backBg.fillRoundedRect(20, 20, 100, 40, 8);
    });
    
    backButton.on('pointerdown', () => {
      this.scene.start('MainMenuScene');
    });
  }

  private async loadLeaderboard(): Promise<void> {
    try {
      // Show loading
      this.showLoading();

      this.leaderboardData = await this.networkService.get('/api/leaderboard', {
        showLoading: false,
        retries: 2
      }) as GetLeaderboardResponse;

      this.displayLeaderboard();

    } catch (error: any) {
      this.errorHandler.showError({
        title: 'Leaderboard Error',
        message: 'Failed to load leaderboard. Please try again.',
        type: 'error',
        showRetry: true,
        retryCallback: () => this.loadLeaderboard()
      });
    }
  }

  private showLoading(): void {
    const { width, height } = this.scale;
    
    const loadingText = this.add.text(width / 2, height / 2, 'Loading leaderboard...', {
      fontSize: '18px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary
    }).setOrigin(0.5);

    // Spinning icon
    const spinner = this.add.text(width / 2, height / 2 - 40, '⏳', {
      fontSize: '32px'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: spinner,
      rotation: Math.PI * 2,
      duration: 1000,
      repeat: -1,
      ease: 'Linear'
    });

    // Store for cleanup
    this.data.set('loadingElements', [loadingText, spinner]);
  }

  private displayLeaderboard(): void {
    // Clean up loading elements
    const loadingElements = this.data.get('loadingElements');
    if (loadingElements) {
      loadingElements.forEach((element: Phaser.GameObjects.GameObject) => element.destroy());
    }

    if (!this.leaderboardData) return;

    const { width, height } = this.scale;
    const { leaderboard, playerPosition, totalPlayers } = this.leaderboardData;

    // Create scrollable container
    const scrollElements: Phaser.GameObjects.GameObject[] = [];

    // Player position info (if not in top list)
    if (playerPosition && playerPosition > leaderboard.length) {
      const playerInfoBg = this.add.graphics();
      playerInfoBg.fillStyle(parseInt(Theme.bgPanel.replace('#', ''), 16), 0.8);
      playerInfoBg.fillRoundedRect(20, 0, width - 40, 50, 8);
      playerInfoBg.lineStyle(2, parseInt(Theme.accentCyan.replace('#', ''), 16), 0.5);
      playerInfoBg.strokeRoundedRect(20, 0, width - 40, 50, 8);
      scrollElements.push(playerInfoBg);

      const playerInfoText = this.add.text(width / 2, 25, `Your Rank: #${playerPosition} of ${totalPlayers}`, {
        fontSize: '16px',
        fontFamily: 'Inter, Arial, sans-serif',
        color: Theme.accentCyan,
        fontStyle: 'bold'
      }).setOrigin(0.5);
      scrollElements.push(playerInfoText);
    }

    // Leaderboard entries
    const startY = playerPosition && playerPosition > leaderboard.length ? 70 : 20;
    
    leaderboard.forEach((entry: LeaderboardEntry, index: number) => {
      const entryElements = this.createLeaderboardEntry(entry, index, startY + (index * 80), width);
      scrollElements.push(...entryElements);
    });

    // Create scroll container
    this.scrollContainer = this.add.container(0, 120, scrollElements);
    
    // Calculate max scroll
    const contentHeight = startY + (leaderboard.length * 80);
    const viewHeight = height - 120;
    this.maxScrollY = Math.max(0, contentHeight - viewHeight);

    // Enable scrolling if needed
    if (this.maxScrollY > 0) {
      this.enableScrolling();
    }

    // Show total players count
    this.add.text(width / 2, height - 30, `Total Players: ${totalPlayers}`, {
      fontSize: '14px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary
    }).setOrigin(0.5);
  }

  private createLeaderboardEntry(entry: LeaderboardEntry, _index: number, y: number, width: number): Phaser.GameObjects.GameObject[] {
    const elements: Phaser.GameObjects.GameObject[] = [];
    const isTopThree = entry.rank <= 3;
    const isPlayer = this.leaderboardData?.playerPosition === entry.rank;

    // Background
    const entryBg = this.add.graphics();
    
    if (isPlayer) {
      entryBg.fillStyle(parseInt(Theme.bgPanel.replace('#', ''), 16), 0.3);
      entryBg.fillRoundedRect(20, y, width - 40, 70, 8);
      entryBg.lineStyle(2, parseInt(Theme.accentCyan.replace('#', ''), 16), 0.8);
      entryBg.strokeRoundedRect(20, y, width - 40, 70, 8);
    } else if (isTopThree) {
      entryBg.fillStyle(parseInt(Theme.bgSecondary.replace('#', ''), 16), 0.8);
      entryBg.fillRoundedRect(20, y, width - 40, 70, 8);
      entryBg.lineStyle(2, parseInt(Theme.borderLight.replace('#', ''), 16), 0.5);
      entryBg.strokeRoundedRect(20, y, width - 40, 70, 8);
    } else {
      entryBg.fillStyle(parseInt(Theme.bgPanel.replace('#', ''), 16), 0.8);
      entryBg.fillRoundedRect(20, y, width - 40, 70, 8);
      entryBg.lineStyle(2, parseInt(Theme.borderLight.replace('#', ''), 16), 0.5);
      entryBg.strokeRoundedRect(20, y, width - 40, 70, 8);
    }
    elements.push(entryBg);

    // Rank with special icons for top 3
    let rankText = `#${entry.rank}`;
    let rankColor = Theme.textPrimary;
    
    if (entry.rank === 1) {
      rankText = '🥇';
    } else if (entry.rank === 2) {
      rankText = '🥈';
    } else if (entry.rank === 3) {
      rankText = '🥉';
    }

    const rank = this.add.text(50, y + 35, rankText, {
      fontSize: entry.rank <= 3 ? '24px' : '18px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: rankColor,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    elements.push(rank);

    // Rank icon and name
    const rankIcon = this.add.text(90, y + 20, entry.currentRank.icon, {
      fontSize: '20px'
    });
    elements.push(rankIcon);

    const username = this.add.text(120, y + 20, entry.username, {
      fontSize: '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: isPlayer ? Theme.accentCyan : Theme.textPrimary,
      fontStyle: isPlayer ? 'bold' : 'normal'
    });
    elements.push(username);

    const rankName = this.add.text(120, y + 40, entry.currentRank.name, {
      fontSize: '12px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: entry.currentRank.color
    });
    elements.push(rankName);

    // Stats on the right
    const statsX = width - 150;
    
    const winRate = this.add.text(statsX, y + 15, `${Math.round(entry.winRate)}%`, {
      fontSize: '18px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.success,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    elements.push(winRate);

    const winRateLabel = this.add.text(statsX, y + 30, 'Win Rate', {
      fontSize: '10px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary
    }).setOrigin(0.5);
    elements.push(winRateLabel);

    const gamesPlayed = this.add.text(statsX, y + 45, `${entry.totalGamesPlayed} games`, {
      fontSize: '12px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary
    }).setOrigin(0.5);
    elements.push(gamesPlayed);

    const rankPoints = this.add.text(statsX, y + 58, `${entry.rankPoints} pts`, {
      fontSize: '10px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary
    }).setOrigin(0.5);
    elements.push(rankPoints);

    return elements;
  }

  private enableScrolling(): void {
    if (!this.scrollContainer) return;

    // Mouse wheel scrolling
    this.input.on('wheel', (_pointer: any, _gameObjects: any, _deltaX: number, deltaY: number) => {
      this.scroll(deltaY * 0.5);
    });

    // Touch scrolling
    let startY = 0;
    let isDragging = false;

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      startY = pointer.y;
      isDragging = true;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!isDragging) return;
      
      const deltaY = startY - pointer.y;
      this.scroll(deltaY * 0.5);
      startY = pointer.y;
    });

    this.input.on('pointerup', () => {
      isDragging = false;
    });
  }

  private scroll(deltaY: number): void {
    if (!this.scrollContainer) return;

    this.scrollY = Phaser.Math.Clamp(this.scrollY + deltaY, 0, this.maxScrollY);
    this.scrollContainer.setY(120 - this.scrollY);
  }

  shutdown(): void {
    if (this.networkService) {
      this.networkService.destroy();
    }
    if (this.errorHandler) {
      this.errorHandler.destroy();
    }
  }
}