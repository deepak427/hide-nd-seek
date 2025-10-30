import { Scene } from 'phaser';
import { Theme } from '../../../../style/theme';
import { ErrorHandler } from '../../../services/ErrorHandler';
import { NetworkService } from '../../../services/NetworkService';

interface GuessData {
  gameId: string;
  userId: string;
  username: string;
  objectKey: string;
  relX: number;
  relY: number;
  isCorrect: boolean;
  distance: number;
  timestamp: number;
}

interface GuessStatistics {
  totalGuesses: number;
  correctGuesses: number;
  uniqueGuessers: number;
  averageDistance: number;
  guesses: GuessData[];
}

export class GuessDashboard {
  private scene: Scene;
  private gameId: string;
  private dashboardContainer: Phaser.GameObjects.Container | null = null;
  private autoRefreshTimer: Phaser.Time.TimerEvent | null = null;
  private errorHandler: ErrorHandler;
  private networkService: NetworkService;

  constructor(scene: Scene, gameId: string) {
    this.scene = scene;
    this.gameId = gameId;
    this.errorHandler = new ErrorHandler(scene);
    this.networkService = new NetworkService(scene);
  }

  async loadGuesses(): Promise<void> {
    try {
      console.log('📊 Loading guess dashboard data...');
      
      const guessData: GuessStatistics = await this.networkService.get(
        `/api/guesses?gameId=${this.gameId}`,
        {
          showLoading: true,
          loadingMessage: 'Loading dashboard...',
          retries: 2
        }
      );
      
      this.displayGuesses(guessData);
      
    } catch (error) {
      console.error('Failed to load guess dashboard:', error);
      this.errorHandler.showError({
        title: 'Dashboard Error',
        message: 'Failed to load guess data. Please try refreshing.',
        type: 'error',
        showRetry: true,
        retryCallback: () => this.loadGuesses()
      });
    }
  }

  displayGuesses(guessData: GuessStatistics): void {
    // Clear existing dashboard
    if (this.dashboardContainer) {
      this.dashboardContainer.destroy();
    }

    const { width, height } = this.scene.scale;
    
    // Create main dashboard panel
    const panelBg = this.scene.add.graphics();
    panelBg.fillStyle(parseInt(Theme.bgCard.replace('#', ''), 16), 0.95);
    panelBg.fillRoundedRect(-300, -250, 600, 500, Theme.radiusMedium);
    panelBg.lineStyle(2, parseInt(Theme.borderLight.replace('#', ''), 16));
    panelBg.strokeRoundedRect(-300, -250, 600, 500, Theme.radiusMedium);
    
    // Title
    const title = this.scene.add.text(0, -220, '📊 Guess Dashboard', {
      fontSize: '28px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.primary,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Statistics section
    const statsElements = this.createStatisticsSection(guessData);
    
    // Recent guesses section
    const guessElements = this.createGuessesSection(guessData.guesses);
    
    // Refresh info
    const lastUpdate = this.scene.add.text(0, 220, `Last updated: ${new Date().toLocaleTimeString()}`, {
      fontSize: '12px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary
    }).setOrigin(0.5);
    
    // Combine all elements
    const allElements = [panelBg, title, lastUpdate, ...statsElements, ...guessElements];
    
    // Create dashboard container
    this.dashboardContainer = this.scene.add.container(width / 2, height / 2, allElements);
    this.dashboardContainer.setDepth(Theme.zIndexUI);
    
    // Entrance animation
    this.dashboardContainer.setAlpha(0);
    this.dashboardContainer.setScale(0.9);
    this.scene.tweens.add({
      targets: this.dashboardContainer,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: 'Back.easeOut'
    });
    
    // Set up auto-refresh
    this.setupAutoRefresh();
  }

  private createStatisticsSection(guessData: GuessStatistics): Phaser.GameObjects.GameObject[] {
    const elements: Phaser.GameObjects.GameObject[] = [];
    
    // Statistics title
    const statsTitle = this.scene.add.text(0, -170, 'Statistics', {
      fontSize: '20px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textPrimary,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    elements.push(statsTitle);
    
    // Statistics grid
    const stats = [
      { label: 'Total Guesses', value: guessData.totalGuesses.toString(), color: Theme.primary },
      { label: 'Correct Guesses', value: guessData.correctGuesses.toString(), color: Theme.success },
      { label: 'Unique Players', value: guessData.uniqueGuessers.toString(), color: Theme.accent },
      { label: 'Success Rate', value: `${guessData.totalGuesses > 0 ? Math.round((guessData.correctGuesses / guessData.totalGuesses) * 100) : 0}%`, color: Theme.warning }
    ];
    
    stats.forEach((stat, index) => {
      const x = (index % 2) * 200 - 100; // Two columns
      const y = -130 + Math.floor(index / 2) * 40;
      
      const statLabel = this.scene.add.text(x, y, stat.label, {
        fontSize: '14px',
        fontFamily: 'Inter, Arial, sans-serif',
        color: Theme.textSecondary
      }).setOrigin(0.5);
      
      const statValue = this.scene.add.text(x, y + 18, stat.value, {
        fontSize: '20px',
        fontFamily: 'Inter, Arial, sans-serif',
        color: stat.color,
        fontStyle: 'bold'
      }).setOrigin(0.5);
      
      elements.push(statLabel, statValue);
    });
    
    return elements;
  }

  private createGuessesSection(guesses: GuessData[]): Phaser.GameObjects.GameObject[] {
    const elements: Phaser.GameObjects.GameObject[] = [];
    
    // Guesses title
    const guessesTitle = this.scene.add.text(0, -40, 'Recent Guesses', {
      fontSize: '20px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textPrimary,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    elements.push(guessesTitle);
    
    if (guesses.length === 0) {
      const noGuesses = this.scene.add.text(0, 20, 'No guesses yet...\nShare your post to get players!', {
        fontSize: '16px',
        fontFamily: 'Inter, Arial, sans-serif',
        color: Theme.textSecondary,
        align: 'center'
      }).setOrigin(0.5);
      elements.push(noGuesses);
      return elements;
    }
    
    // Show last 6 guesses
    const recentGuesses = guesses.slice(-6).reverse();
    
    recentGuesses.forEach((guess, index) => {
      const y = -5 + (index * 30);
      
      // Guess status icon
      const statusIcon = this.scene.add.text(-250, y, guess.isCorrect ? '✅' : '❌', {
        fontSize: '16px'
      });
      
      // Player name
      const playerName = this.scene.add.text(-220, y, guess.username, {
        fontSize: '14px',
        fontFamily: 'Inter, Arial, sans-serif',
        color: Theme.textPrimary,
        fontStyle: 'bold'
      });
      
      // Guessed object
      const guessedObject = this.scene.add.text(-100, y, guess.objectKey, {
        fontSize: '14px',
        fontFamily: 'Inter, Arial, sans-serif',
        color: Theme.textSecondary
      });
      
      // Distance/accuracy
      let accuracyText = '';
      if (guess.isCorrect) {
        accuracyText = 'Perfect!';
      } else {
        const distancePercent = Math.round(guess.distance * 100);
        accuracyText = `${distancePercent}% off`;
      }
      
      const accuracy = this.scene.add.text(50, y, accuracyText, {
        fontSize: '12px',
        fontFamily: 'Inter, Arial, sans-serif',
        color: guess.isCorrect ? Theme.success : Theme.warning
      });
      
      // Time ago
      const timeAgo = this.getTimeAgo(guess.timestamp);
      const timeText = this.scene.add.text(150, y, timeAgo, {
        fontSize: '12px',
        fontFamily: 'Inter, Arial, sans-serif',
        color: Theme.textSecondary
      });
      
      elements.push(statusIcon, playerName, guessedObject, accuracy, timeText);
      
      // Add separator line (except for last item)
      if (index < recentGuesses.length - 1) {
        const separator = this.scene.add.graphics();
        separator.lineStyle(1, parseInt(Theme.borderLight.replace('#', ''), 16), 0.3);
        separator.lineBetween(-250, y + 15, 250, y + 15);
        elements.push(separator);
      }
    });
    
    return elements;
  }

  private getTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  private setupAutoRefresh(): void {
    // Auto-refresh every 30 seconds
    this.autoRefreshTimer = this.scene.time.addEvent({
      delay: 30000,
      callback: () => {
        this.refreshData();
      },
      loop: true
    });
  }

  async refreshData(): Promise<void> {
    console.log('🔄 Refreshing dashboard data...');
    
    // Show refresh indicator
    this.showRefreshIndicator();
    
    try {
      const guessData: GuessStatistics = await this.networkService.get(
        `/api/guesses?gameId=${this.gameId}`,
        {
          retries: 1,
          timeout: 5000
        }
      );
      
      this.displayGuesses(guessData);
      
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
      // Don't show error popup for refresh failures, just log
    }
  }

  private showRefreshIndicator(): void {
    if (!this.dashboardContainer) return;
    
    // Create refresh spinner
    const spinner = this.scene.add.graphics();
    spinner.lineStyle(3, parseInt(Theme.primary.replace('#', ''), 16));
    spinner.strokeCircle(250, -220, 12);
    spinner.setDepth(Theme.zIndexUI + 1);
    
    // Add to dashboard
    this.dashboardContainer.add(spinner);
    
    // Spinning animation
    this.scene.tweens.add({
      targets: spinner,
      rotation: Math.PI * 2,
      duration: 1000,
      repeat: 1,
      ease: 'Linear',
      onComplete: () => {
        spinner.destroy();
      }
    });
  }



  destroy(): void {
    // Clean up dashboard
    if (this.dashboardContainer) {
      this.dashboardContainer.destroy();
      this.dashboardContainer = null;
    }
    
    // Clean up auto-refresh timer
    if (this.autoRefreshTimer) {
      this.autoRefreshTimer.destroy();
      this.autoRefreshTimer = null;
    }
    
    // Clean up error handling services
    this.errorHandler.destroy();
    this.networkService.destroy();
  }
}