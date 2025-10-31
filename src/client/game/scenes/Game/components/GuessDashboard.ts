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
      const guessData: GuessStatistics = await this.networkService.get(
        `/api/guesses?gameId=${this.gameId}`,
        {
          showLoading: true,
          loadingMessage: 'Loading dashboard...',
          retries: 2
        }
      );

      this.displayGuesses(guessData);

    } catch (error: any) {
      console.error('Failed to load guess dashboard:', error);
      console.error('Error details:', {
        message: error?.message,
        status: error?.status,
        response: error?.response
      });

      // Show more specific error message
      let errorMessage = 'Failed to load guess data. ';
      if (error?.status === 403) {
        errorMessage += 'You do not have permission to view this dashboard.';
      } else if (error?.status === 404) {
        errorMessage += 'Game not found.';
      } else if (error?.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try refreshing.';
      }

      this.errorHandler.showError({
        title: 'Dashboard Error',
        message: errorMessage,
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

    // Calculate responsive panel size
    const scaleFactor = Math.min(width / 1024, height / 768, 1);
    const panelWidth = Math.min(600, width * 0.9);
    const panelHeight = Math.min(500, height * 0.8);

    // Create main dashboard panel
    const panelBg = this.scene.add.graphics();
    panelBg.fillStyle(parseInt(Theme.bgPanel.replace('#', ''), 16), 0.95);
    panelBg.fillRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, Theme.radiusMedium);
    panelBg.lineStyle(2, parseInt(Theme.borderLight.replace('#', ''), 16));
    panelBg.strokeRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, Theme.radiusMedium);

    // Title
    const titleSize = Math.max(20, 28 * scaleFactor);
    const title = this.scene.add.text(0, -panelHeight/2 + 30, '📊 Guess Dashboard', {
      fontSize: `${titleSize}px`,
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.accentCyan,
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

    // Add manual refresh button
    const refreshButton = this.createRefreshButton();

    // Add close button
    const closeButton = this.createCloseButton();

    // Combine all elements
    const allElements = [panelBg, title, lastUpdate, refreshButton, closeButton, ...statsElements, ...guessElements];

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

    // Statistics grid with defensive programming
    const stats = [
      { label: 'Total Guesses', value: (guessData.totalGuesses || 0).toString(), color: Theme.accentCyan },
      { label: 'Correct Guesses', value: (guessData.correctGuesses || 0).toString(), color: Theme.success },
      { label: 'Unique Players', value: (guessData.uniqueGuessers || 0).toString(), color: Theme.accentPrimary },
      { label: 'Success Rate', value: `${(guessData.totalGuesses || 0) > 0 ? Math.round(((guessData.correctGuesses || 0) / (guessData.totalGuesses || 1)) * 100) : 0}%`, color: Theme.warning }
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

    // Show correct answer first
    const correctAnswer = this.getCorrectAnswer(guesses);
    if (correctAnswer) {
      const correctTitle = this.scene.add.text(0, -40, '✅ Correct Answer', {
        fontSize: '18px',
        fontFamily: 'Inter, Arial, sans-serif',
        color: Theme.success,
        fontStyle: 'bold'
      }).setOrigin(0.5);
      elements.push(correctTitle);

      const correctText = this.scene.add.text(0, -15, correctAnswer, {
        fontSize: '20px',
        fontFamily: 'Inter, Arial, sans-serif',
        color: Theme.success,
        fontStyle: 'bold'
      }).setOrigin(0.5);
      elements.push(correctText);
    }

    // Object guess counts section
    const objectCountsTitle = this.scene.add.text(0, 15, 'Guess Counts', {
      fontSize: '18px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textPrimary,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    elements.push(objectCountsTitle);

    // Calculate guess counts by object
    const objectCounts = this.calculateObjectCounts(guesses);
    const objectEntries = Object.entries(objectCounts).sort((a, b) => b[1] - a[1]); // Sort by count descending

    // Display object counts
    objectEntries.forEach((entry, index) => {
      const [objectKey, count] = entry;
      const y = 45 + (index * 25);

      // Object name and count
      const objectText = this.scene.add.text(0, y, `${objectKey} - ${count}`, {
        fontSize: '16px',
        fontFamily: 'Inter, Arial, sans-serif',
        color: Theme.accentCyan,
        fontStyle: 'bold'
      }).setOrigin(0.5);

      elements.push(objectText);
    });

    return elements;
  }

  private getCorrectAnswer(guesses: GuessData[]): string | null {
    const correctGuess = guesses.find(guess => guess.isCorrect);
    return correctGuess ? correctGuess.objectKey : null;
  }

  private calculateObjectCounts(guesses: GuessData[]): Record<string, number> {
    const counts: Record<string, number> = {};

    guesses.forEach(guess => {
      const objectKey = guess.objectKey;
      counts[objectKey] = (counts[objectKey] || 0) + 1;
    });

    return counts;
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
      // Don't show error popup for refresh failures, just log
    }
  }

  private createRefreshButton(): Phaser.GameObjects.Container {
    // Button background
    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(parseInt(Theme.accentCyan.replace('#', ''), 16));
    btnBg.fillRoundedRect(-40, -15, 80, 30, 5);

    // Button text
    const btnText = this.scene.add.text(0, 0, '🔄 Refresh', {
      fontSize: '12px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textPrimary,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const button = this.scene.add.container(200, -220, [btnBg, btnText]);
    button.setSize(80, 30);
    button.setInteractive();

    // Hover effects
    button.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(parseInt(Theme.accentHover.replace('#', ''), 16));
      btnBg.fillRoundedRect(-40, -15, 80, 30, 5);
    });

    button.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(parseInt(Theme.accentCyan.replace('#', ''), 16));
      btnBg.fillRoundedRect(-40, -15, 80, 30, 5);
    });

    button.on('pointerdown', () => {
      console.log('🔄 Manual refresh triggered');
      this.refreshData();
    });

    return button;
  }

  private createCloseButton(): Phaser.GameObjects.Container {
    // Close button background (circular)
    const closeBg = this.scene.add.graphics();
    closeBg.fillStyle(parseInt(Theme.error.replace('#', ''), 16));
    closeBg.fillCircle(0, 0, 18);

    // Close button text (X)
    const closeText = this.scene.add.text(0, 0, '✕', {
      fontSize: '20px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textPrimary,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Position close button at top-right corner of panel
    const { width, height } = this.scene.scale;
    const panelWidth = Math.min(600, width * 0.9);
    const panelHeight = Math.min(500, height * 0.8);
    
    const closeButton = this.scene.add.container(panelWidth/2 - 25, -panelHeight/2 + 25, [closeBg, closeText]);
    closeButton.setSize(36, 36);
    closeButton.setInteractive();

    // Hover effects
    closeButton.on('pointerover', () => {
      closeBg.clear();
      closeBg.fillStyle(parseInt(Theme.error.replace('#', ''), 16), 0.8);
      closeBg.fillCircle(0, 0, 18);
      this.scene.tweens.add({
        targets: closeButton,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 150,
        ease: 'Power2.easeOut'
      });
    });

    closeButton.on('pointerout', () => {
      closeBg.clear();
      closeBg.fillStyle(parseInt(Theme.error.replace('#', ''), 16));
      closeBg.fillCircle(0, 0, 18);
      this.scene.tweens.add({
        targets: closeButton,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
        ease: 'Power2.easeOut'
      });
    });

    closeButton.on('pointerdown', () => {
      console.log('❌ Closing guess dashboard');
      this.closeDashboard();
    });

    return closeButton;
  }

  private closeDashboard(): void {
    if (!this.dashboardContainer) return;

    // Exit animation
    this.scene.tweens.add({
      targets: this.dashboardContainer,
      alpha: 0,
      scaleX: 0.9,
      scaleY: 0.9,
      duration: 300,
      ease: 'Power2.easeIn',
      onComplete: () => {
        this.destroy();
      }
    });
  }

  private showRefreshIndicator(): void {
    if (!this.dashboardContainer) return;

    // Create refresh spinner
    const spinner = this.scene.add.graphics();
    spinner.lineStyle(3, parseInt(Theme.accentCyan.replace('#', ''), 16));
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