import { Scene } from 'phaser';
import { Theme } from '../../../style/theme';
import { UIButton } from './components/UIButton';
import { RankDisplay } from './components/RankDisplay';
import { PlayerStatsPanel } from './components/PlayerStatsPanel';
import { SceneTransition } from '../../utils/SceneTransition';
import { RankProgressionNotification } from '../../components/RankProgressionNotification';
import type { PlayerProfile, PlayerRank } from '../../../../shared/types/game';

export class MainMenu extends Scene {
  private background!: Phaser.GameObjects.Graphics;
  private title!: Phaser.GameObjects.Text;
  private subtitle!: Phaser.GameObjects.Text;
  private playButton!: UIButton;
  private settingsButton!: UIButton;
  private creditsButton!: UIButton;
  private versionText!: Phaser.GameObjects.Text;
  
  // Player rank and statistics components
  private rankDisplay!: RankDisplay;
  private statsPanel!: PlayerStatsPanel;
  private playerProfile!: PlayerProfile;
  private rankNotification!: RankProgressionNotification;

  constructor() {
    super('MainMenu');
    this.rankNotification = new RankProgressionNotification(this);
  }

  private initializePlayerProfile() {
    // TODO: In real implementation, fetch from API
    // For now, create a mock profile for demonstration
    this.playerProfile = {
      userId: 'demo-user',
      username: 'Player',
      rank: 'GuessMaster' as PlayerRank,
      totalGuesses: 25,
      successfulGuesses: 12,
      successRate: 0.48,
      joinedAt: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
      lastActive: Date.now()
    };
  }

  create() {
    console.log('🏠 MainMenu scene initialized');
    
    // Initialize player profile (in real implementation, this would come from API)
    this.initializePlayerProfile();
    
    this.createBackground();
    this.createTitle();
    this.createPlayerRankDisplay();
    this.createButtons();
    this.createFooter();
    this.setupAnimations();
    this.setupResize();
    
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

  private createPlayerRankDisplay() {
    const { width, height } = this.scale;
    
    // Create rank display component
    this.rankDisplay = new RankDisplay(this, width / 2, height * 0.4, this.playerProfile);
    
    // Create player statistics panel
    this.statsPanel = new PlayerStatsPanel(this, width / 2, height * 0.5, this.playerProfile);
  }

  private createButtons() {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const startY = height * 0.65;
    const buttonSpacing = 70;
    
    // Play button - primary action with enhanced styling
    this.playButton = new UIButton(this, centerX, startY, 'PLAY', {
      fontSize: '28px',
      backgroundColor: Theme.accentCyan,
      hoverColor: Theme.accentHover,
      textColor: Theme.lightGray,
      width: 220,
      height: 65
    });
    this.playButton.onClick(() => {
      this.startGame();
    });
    
    // Settings button
    this.settingsButton = new UIButton(this, centerX, startY + buttonSpacing, 'SETTINGS', {
      fontSize: '22px',
      backgroundColor: Theme.secondaryDark,
      hoverColor: Theme.bgSecondary,
      textColor: Theme.lightGray,
      width: 180,
      height: 50
    });
    this.settingsButton.onClick(() => {
      this.showSettings();
    });
    
    // Credits button
    this.creditsButton = new UIButton(this, centerX, startY + buttonSpacing * 2, 'CREDITS', {
      fontSize: '22px',
      backgroundColor: Theme.secondaryDark,
      hoverColor: Theme.bgSecondary,
      textColor: Theme.lightGray,
      width: 180,
      height: 50
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
    
    // Rank display entrance animation
    if (this.rankDisplay) {
      this.rankDisplay.container.setAlpha(0);
      this.rankDisplay.container.setScale(0.9);
      this.tweens.add({
        targets: this.rankDisplay.container,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 600,
        delay: 500,
        ease: 'Back.easeOut'
      });
    }
    
    // Stats panel entrance animation
    if (this.statsPanel) {
      this.statsPanel.container.setAlpha(0);
      this.statsPanel.container.setY(this.statsPanel.container.y + 30);
      this.tweens.add({
        targets: this.statsPanel.container,
        alpha: 1,
        y: this.statsPanel.container.y - 30,
        duration: 600,
        delay: 700,
        ease: 'Power2.easeOut'
      });
    }
    
    // Stagger button animations
    const buttons = [this.playButton, this.settingsButton, this.creditsButton];
    buttons.forEach((button, index) => {
      button.container.setAlpha(0);
      button.container.setY(button.container.y + 30);
      
      this.tweens.add({
        targets: button.container,
        alpha: 1,
        y: button.container.y - 30,
        duration: 600,
        delay: 900 + index * 150,
        ease: 'Back.easeOut'
      });
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
    
    // Update rank display and stats panel
    if (this.rankDisplay) {
      this.rankDisplay.setPosition(width / 2, height * 0.4);
    }
    if (this.statsPanel) {
      this.statsPanel.setPosition(width / 2, height * 0.5);
    }
    
    // Update button positions
    const centerX = width / 2;
    const startY = height * 0.65;
    const buttonSpacing = 70;
    
    this.playButton.setPosition(centerX, startY);
    this.settingsButton.setPosition(centerX, startY + buttonSpacing);
    this.creditsButton.setPosition(centerX, startY + buttonSpacing * 2);
    
    // Update footer
    this.versionText.setPosition(width - 20, height - 20);
  }

  private startGame() {
    console.log('🗺️ Starting map selection');
    
    // Use smooth transition to map selection
    SceneTransition.getInstance().fadeToScene(this, 'MapSelection', undefined, 500);
  }

  private showSettings() {
    // Placeholder for settings
    console.log('Settings clicked - TODO: Implement settings menu');
  }

  private showCredits() {
    // Placeholder for credits
    console.log('Credits clicked - TODO: Implement credits screen');
  }
}