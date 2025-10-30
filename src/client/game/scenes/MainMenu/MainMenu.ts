import { Scene } from 'phaser';
import { Theme } from '../../../style/theme';
import { UIButton } from './components/UIButton';
import { PlayerStatsPanel } from './components/PlayerStatsPanel';
import { SceneTransition } from '../../utils/SceneTransition';

export class MainMenu extends Scene {
  private background!: Phaser.GameObjects.Graphics;
  private title!: Phaser.GameObjects.Text;
  private subtitle!: Phaser.GameObjects.Text;
  private playButton!: UIButton;
  private guessButton!: UIButton;
  private dashboardButton!: UIButton;
  private leaderboardButton!: UIButton;
  private settingsButton!: UIButton;
  private creditsButton!: UIButton;
  private versionText!: Phaser.GameObjects.Text;
  
  // Player statistics component
  private statsPanel!: PlayerStatsPanel;
  
  // Player profile data (placeholder)
  private playerProfile: any = {
    rank: { name: 'Beginner', icon: '🔍', color: Theme.accentCyan },
    totalGuesses: 0,
    successfulGuesses: 0,
    successRate: 0
  };

  constructor() {
    super('MainMenu');
  }

  create() {
    console.log('🏠 MainMenu scene initialized');
    
    // Initialize player profile (in real implementation, this would come from API)
    this.initializePlayerProfile();
    
    this.createBackground();
    this.createTitle();
    this.createPlayerStatsDisplay();
    this.createButtons();
    this.createFooter();
    this.setupAnimations();
    this.setupResize();
    this.setupEventListeners();
    
    // Create smooth entrance animation
    SceneTransition.getInstance().createSceneEntrance(this, 'fade', 400);
  }

  private createBackground() {
    const { width, height } = this.scale;
    
    // Create gradient background using correct theme properties
    this.background = this.add.graphics();
    this.background.fillGradientStyle(
      parseInt(Theme.primaryDark.replace('#', ''), 16),
      parseInt(Theme.primaryDark.replace('#', ''), 16),
      parseInt(Theme.secondaryDark.replace('#', ''), 16),
      parseInt(Theme.secondaryDark.replace('#', ''), 16),
      1
    );
    this.background.fillRect(0, 0, width, height);
    
    // Add subtle pattern overlay
    const pattern = this.add.graphics();
    pattern.lineStyle(1, parseInt(Theme.accentCyan.replace('#', ''), 16), 0.1);
    
    // Create a subtle grid pattern
    const gridSize = 50;
    for (let x = 0; x < width; x += gridSize) {
      pattern.moveTo(x, 0);
      pattern.lineTo(x, height);
    }
    for (let y = 0; y < height; y += gridSize) {
      pattern.moveTo(0, y);
      pattern.lineTo(width, y);
    }
    pattern.strokePath();
  }

  private createTitle() {
    const { width, height } = this.scale;
    
    // Main title
    this.title = this.add.text(width / 2, height * 0.2, 'HIDE & SEEK', {
      fontSize: '64px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.lightGray,
      fontStyle: 'bold',
      stroke: Theme.primaryDark,
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // Add glow effect using shadow
    this.title.setShadow(0, 0, Theme.accentCyan, 10);
    
    // Subtitle
    this.subtitle = this.add.text(width / 2, height * 0.28, 'Find the hidden objects and climb the ranks', {
      fontSize: '20px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary,
      align: 'center'
    }).setOrigin(0.5);
  }

  private async createPlayerStatsDisplay() {
    const { width, height } = this.scale;
    
    // Create player statistics panel
    this.statsPanel = new PlayerStatsPanel(this);
    await this.statsPanel.create(width / 2, height * 0.4);
  }

  private initializePlayerProfile() {
    // Initialize with default values - in real implementation, this would come from API
    this.playerProfile = {
      rank: { name: 'Beginner', icon: '🔍', color: Theme.accentCyan },
      totalGuesses: 0,
      successfulGuesses: 0,
      successRate: 0
    };
    console.log('👤 Player profile initialized:', this.playerProfile);
  }

  private createButtons() {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const startY = height * 0.6;
    const buttonSpacing = 60;
    
    // Play button - primary action with enhanced styling
    this.playButton = new UIButton(this, centerX, startY, 'CREATE GAME', {
      fontSize: '24px',
      backgroundColor: Theme.accentCyan,
      hoverColor: Theme.accentHover,
      textColor: Theme.lightGray,
      width: 220,
      height: 55
    });
    this.playButton.onClick(() => {
      this.startGame();
    });
    
    // Guess button - new option for guessing games
    this.guessButton = new UIButton(this, centerX, startY + buttonSpacing, 'GUESS GAME', {
      fontSize: '22px',
      backgroundColor: Theme.success,
      hoverColor: '#45a049',
      textColor: Theme.lightGray,
      width: 200,
      height: 50
    });
    this.guessButton.onClick(() => {
      this.startGuessing();
    });
    
    // Dashboard button - view game statistics
    this.dashboardButton = new UIButton(this, centerX, startY + buttonSpacing * 2, 'DASHBOARD', {
      fontSize: '22px',
      backgroundColor: Theme.warning,
      hoverColor: '#e68900',
      textColor: Theme.lightGray,
      width: 200,
      height: 50
    });
    this.dashboardButton.onClick(() => {
      this.openDashboard();
    });
    
    // Leaderboard button
    this.leaderboardButton = new UIButton(this, centerX, startY + buttonSpacing * 3, 'LEADERBOARD', {
      fontSize: '20px',
      backgroundColor: Theme.info,
      hoverColor: Theme.accentHover,
      textColor: Theme.lightGray,
      width: 180,
      height: 45
    });
    this.leaderboardButton.onClick(() => {
      this.openLeaderboard();
    });
    
    // Settings button
    this.settingsButton = new UIButton(this, centerX, startY + buttonSpacing * 4, 'SETTINGS', {
      fontSize: '20px',
      backgroundColor: Theme.secondaryDark,
      hoverColor: Theme.bgSecondary,
      textColor: Theme.lightGray,
      width: 180,
      height: 45
    });
    this.settingsButton.onClick(() => {
      this.showSettings();
    });
    
    // Credits button
    this.creditsButton = new UIButton(this, centerX, startY + buttonSpacing * 5, 'CREDITS', {
      fontSize: '20px',
      backgroundColor: Theme.secondaryDark,
      hoverColor: Theme.bgSecondary,
      textColor: Theme.lightGray,
      width: 180,
      height: 45
    });
    this.creditsButton.onClick(() => {
      this.showCredits();
    });
  }

  private createFooter() {
    const { width, height } = this.scale;
    
    // Version text
    this.versionText = this.add.text(width - 20, height - 20, 'v1.0.0', {
      fontSize: '14px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textMuted
    }).setOrigin(1);
    
    // Made with love text
    this.add.text(20, height - 20, '❤️ Made with Phaser', {
      fontSize: '14px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textMuted
    }).setOrigin(0, 1);
  }

  private setupAnimations() {
    // Title entrance animation
    this.title.setAlpha(0);
    this.title.setScale(0.8);
    this.tweens.add({
      targets: this.title,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 800,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Start subtle pulse animation after entrance
        this.tweens.add({
          targets: this.title,
          scaleX: { from: 1, to: 1.02 },
          scaleY: { from: 1, to: 1.02 },
          duration: 2000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    });
    
    // Subtitle entrance animation
    this.subtitle.setAlpha(0);
    this.subtitle.setY(this.subtitle.y + 20);
    this.tweens.add({
      targets: this.subtitle,
      alpha: 1,
      y: this.subtitle.y - 20,
      duration: 600,
      delay: 300,
      ease: 'Power2.easeOut'
    });
    
    // Stats panel entrance animation
    if (this.statsPanel && this.statsPanel.getContainer()) {
      const container = this.statsPanel.getContainer();
      if (container) {
        container.setAlpha(0);
        container.setY(container.y + 30);
        this.tweens.add({
          targets: container,
          alpha: 1,
          y: container.y - 30,
          duration: 600,
          delay: 500,
          ease: 'Power2.easeOut'
        });
      }
    }
    
    // Stagger button animations
    const buttons = [this.playButton, this.guessButton, this.dashboardButton, this.leaderboardButton, this.settingsButton, this.creditsButton];
    buttons.forEach((button, index) => {
      if (button && button.container) {
        button.container.setAlpha(0);
        button.container.setY(button.container.y + 30);
        
        this.tweens.add({
          targets: button.container,
          alpha: 1,
          y: button.container.y - 30,
          duration: 600,
          delay: 700 + index * 100,
          ease: 'Back.easeOut'
        });
      }
    });
  }

  private setupResize() {
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.handleResize(gameSize.width, gameSize.height);
    });
  }

  private handleResize(width: number, height: number) {
    // Update background
    if (this.background) {
      this.background.clear();
      this.background.fillGradientStyle(
        parseInt(Theme.primaryDark.replace('#', ''), 16),
        parseInt(Theme.primaryDark.replace('#', ''), 16),
        parseInt(Theme.secondaryDark.replace('#', ''), 16),
        parseInt(Theme.secondaryDark.replace('#', ''), 16),
        1
      );
      this.background.fillRect(0, 0, width, height);
    }
    
    // Update title positions
    this.title.setPosition(width / 2, height * 0.2);
    this.subtitle.setPosition(width / 2, height * 0.28);
    
    // Update stats panel position
    if (this.statsPanel && this.statsPanel.getContainer()) {
      const container = this.statsPanel.getContainer();
      if (container) {
        container.setPosition(width / 2, height * 0.4);
      }
    }
    
    // Update button positions
    const centerX = width / 2;
    const startY = height * 0.55;
    const buttonSpacing = 60;
    
    if (this.playButton) this.playButton.setPosition(centerX, startY);
    if (this.guessButton) this.guessButton.setPosition(centerX, startY + buttonSpacing);
    if (this.dashboardButton) this.dashboardButton.setPosition(centerX, startY + buttonSpacing * 2);
    if (this.leaderboardButton) this.leaderboardButton.setPosition(centerX, startY + buttonSpacing * 3);
    if (this.settingsButton) this.settingsButton.setPosition(centerX, startY + buttonSpacing * 4);
    if (this.creditsButton) this.creditsButton.setPosition(centerX, startY + buttonSpacing * 5);
    
    // Update footer
    this.versionText.setPosition(width - 20, height - 20);
  }

  private startGame() {
    console.log('🗺️ Starting map selection');
    
    // Use smooth transition to map selection
    SceneTransition.getInstance().fadeToScene(this, 'MapSelection', undefined, 500);
  }

  private startGuessing() {
    console.log('🔍 Starting guess scene');
    
    // Use smooth transition to guess scene
    SceneTransition.getInstance().fadeToScene(this, 'GuessScene', undefined, 500);
  }

  private openDashboard() {
    console.log('📊 Opening dashboard');
    
    // Use smooth transition to dashboard
    SceneTransition.getInstance().fadeToScene(this, 'Dashboard', undefined, 500);
  }

  private openLeaderboard() {
    console.log('🏆 Opening leaderboard');
    
    // Use smooth transition to leaderboard
    SceneTransition.getInstance().fadeToScene(this, 'LeaderboardScene', undefined, 500);
  }

  private showSettings() {
    // Placeholder for settings
    console.log('Settings clicked - TODO: Implement settings menu');
  }

  private showCredits() {
    // Placeholder for credits
    console.log('Credits clicked - TODO: Implement credits screen');
  }

  private setupEventListeners() {
    // Listen for player stats updates from other scenes
    this.events.on('refresh-player-stats', () => {
      this.refreshPlayerStats();
    });
    
    // Listen for global player stats updates
    this.game.events.on('player-stats-updated', () => {
      this.refreshPlayerStats();
    });
  }

  private async refreshPlayerStats() {
    if (this.statsPanel) {
      try {
        await this.statsPanel.refresh();
        console.log('🔄 Player stats refreshed');
      } catch (error) {
        console.error('Failed to refresh player stats:', error);
      }
    }
  }
}