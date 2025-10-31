import { Scene } from 'phaser';
import { Theme } from '../../../style/theme';
import { UIButton } from './components/UIButton';
import { SceneTransition } from '../../utils/SceneTransition';
import { SafeResizeHandler } from '../../utils/SafeResizeHandler';

export class MainMenu extends Scene {
  private background!: Phaser.GameObjects.Graphics;
  private title!: Phaser.GameObjects.Text;
  private subtitle!: Phaser.GameObjects.Text;
  private playButton!: UIButton;
  private guessButton!: UIButton;
  private leaderboardButton!: UIButton;
  private profileButton!: UIButton;
  private versionText!: Phaser.GameObjects.Text;
  private resizeTimeout?: NodeJS.Timeout;
  
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
    this.createButtons();
    this.createFooter();
    this.setupAnimations();
    this.setupResize();
    this.setupEventListeners();
    
    // Ensure input is enabled for this scene
    this.input.enabled = true;
    console.log('🏠 MainMenu input enabled:', this.input.enabled);
    
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
    
    // Responsive font sizes
    const isMobile = width < 768;
    const titleFontSize = isMobile ? '36px' : '64px';
    const subtitleFontSize = isMobile ? '16px' : '20px';
    
    // Main title
    this.title = this.add.text(width / 2, height * 0.25, 'HIDE & SEEK', {
      fontSize: titleFontSize,
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.lightGray,
      fontStyle: 'bold',
      stroke: Theme.primaryDark,
      strokeThickness: isMobile ? 2 : 4
    }).setOrigin(0.5);
    
    // Add glow effect using shadow
    this.title.setShadow(0, 0, Theme.accentCyan, isMobile ? 5 : 10);
    
    // Subtitle
    this.subtitle = this.add.text(width / 2, height * 0.32, 'Find the hidden objects and climb the ranks', {
      fontSize: subtitleFontSize,
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary,
      align: 'center',
      wordWrap: { width: width * 0.8 }
    }).setOrigin(0.5);
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
    const isMobile = width < 768;
    
    // Calculate available space for buttons to prevent overflow
    const availableHeight = height * 0.45; // Space from 0.5 to 0.95 (leaving room for footer)
    const buttonCount = 4; // Reduced from 5 to 4 buttons
    const maxButtonSpacing = Math.min(isMobile ? 80 : 90, availableHeight / buttonCount);
    const buttonSpacing = Math.max(60, maxButtonSpacing); // Increased minimum spacing
    
    const startY = height * (isMobile ? 0.45 : 0.5);
    
    // Responsive button sizing
    const primaryButtonWidth = isMobile ? Math.min(280, width * 0.8) : 220;
    const primaryButtonHeight = isMobile ? 60 : 55;
    const secondaryButtonWidth = isMobile ? Math.min(250, width * 0.75) : 200;
    const secondaryButtonHeight = isMobile ? 55 : 50;
    const fontSize = isMobile ? '20px' : '24px';
    const secondaryFontSize = isMobile ? '18px' : '22px';
    
    // Play button - primary action with enhanced styling
    this.playButton = new UIButton(this, centerX, startY, 'HIDE', {
      fontSize: fontSize,
      backgroundColor: Theme.accentCyan,
      hoverColor: Theme.accentHover,
      textColor: Theme.lightGray,
      width: primaryButtonWidth,
      height: primaryButtonHeight
    });
    this.playButton.onClick(() => {
      this.startGame();
    });
    
    // Guess button - new option for guessing games
    this.guessButton = new UIButton(this, centerX, startY + buttonSpacing, 'GUESS', {
      fontSize: secondaryFontSize,
      backgroundColor: Theme.success,
      hoverColor: '#45a049',
      textColor: Theme.lightGray,
      width: secondaryButtonWidth,
      height: secondaryButtonHeight
    });
    this.guessButton.onClick(() => {
      this.startGuessing();
    });
    
    // Leaderboard button
    this.leaderboardButton = new UIButton(this, centerX, startY + buttonSpacing * 2, 'LEADERBOARD', {
      fontSize: secondaryFontSize,
      backgroundColor: Theme.info,
      hoverColor: Theme.accentHover,
      textColor: Theme.lightGray,
      width: secondaryButtonWidth,
      height: secondaryButtonHeight
    });
    this.leaderboardButton.onClick(() => {
      this.openLeaderboard();
    });
    
    // Profile button - view user stats and profile (ensure it stays within bounds)
    const profileY = Math.min(startY + buttonSpacing * 3, height * 0.85);
    this.profileButton = new UIButton(this, centerX, profileY, 'PROFILE', {
      fontSize: secondaryFontSize,
      backgroundColor: Theme.secondaryDark,
      hoverColor: Theme.bgSecondary,
      textColor: Theme.lightGray,
      width: secondaryButtonWidth,
      height: secondaryButtonHeight
    });
    this.profileButton.onClick(() => {
      this.openProfile();
    });
  }

  private createFooter() {
    const { width, height } = this.scale;
    const isMobile = width < 768;
    const fontSize = isMobile ? '12px' : '14px';
    const margin = isMobile ? 10 : 20;
    
    // Version text
    this.versionText = this.add.text(width - margin, height - margin, 'v1.0.0', {
      fontSize: fontSize,
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textMuted
    }).setOrigin(1);
    
    // Made with love by Deepu text
    this.add.text(margin, height - margin, '❤️ Made with love by Deepu', {
      fontSize: fontSize,
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
    
    // Stagger button animations
    const buttons = [this.playButton, this.guessButton, this.leaderboardButton, this.profileButton];
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
      // Use SafeResizeHandler to prevent WebGL context errors
      SafeResizeHandler.getInstance().safeResize(
        this,
        'MainMenu',
        () => this.handleResize(gameSize.width, gameSize.height),
        150
      );
    });
  }

  private handleResize(width: number, height: number) {
    const isMobile = width < 768;
    
    // Update background safely
    SafeResizeHandler.safeUpdateGraphics(this.background, (graphics) => {
      graphics.fillGradientStyle(
        parseInt(Theme.primaryDark.replace('#', ''), 16),
        parseInt(Theme.primaryDark.replace('#', ''), 16),
        parseInt(Theme.secondaryDark.replace('#', ''), 16),
        parseInt(Theme.secondaryDark.replace('#', ''), 16),
        1
      );
      graphics.fillRect(0, 0, width, height);
    });
    
    // Update title safely
    SafeResizeHandler.safeUpdateText(this.title, {
      position: { x: width / 2, y: height * 0.25 },
      fontSize: isMobile ? '36px' : '64px',
      stroke: { color: Theme.primaryDark, thickness: isMobile ? 2 : 4 },
      shadow: { x: 0, y: 0, color: Theme.accentCyan, blur: isMobile ? 5 : 10 }
    });
    
    // Update subtitle safely
    SafeResizeHandler.safeUpdateText(this.subtitle, {
      position: { x: width / 2, y: height * 0.32 },
      fontSize: isMobile ? '16px' : '20px',
      wordWrap: width * 0.8
    });
    
    // Update button positions with proper spacing calculation
    const centerX = width / 2;
    const availableHeight = height * 0.45;
    const buttonCount = 4; // Updated to 4 buttons
    const maxButtonSpacing = Math.min(isMobile ? 80 : 90, availableHeight / buttonCount);
    const buttonSpacing = Math.max(60, maxButtonSpacing);
    const startY = height * (isMobile ? 0.45 : 0.5);
    
    // Update button sizes
    const primaryButtonWidth = isMobile ? Math.min(280, width * 0.8) : 220;
    const primaryButtonHeight = isMobile ? 60 : 55;
    const secondaryButtonWidth = isMobile ? Math.min(250, width * 0.75) : 200;
    const secondaryButtonHeight = isMobile ? 55 : 50;
    
    // Update buttons safely
    if (this.playButton && this.playButton.container && this.playButton.container.scene) {
      this.playButton.setPosition(centerX, startY);
      this.playButton.updateSize(primaryButtonWidth, primaryButtonHeight);
    }
    if (this.guessButton && this.guessButton.container && this.guessButton.container.scene) {
      this.guessButton.setPosition(centerX, startY + buttonSpacing);
      this.guessButton.updateSize(secondaryButtonWidth, secondaryButtonHeight);
    }
    if (this.leaderboardButton && this.leaderboardButton.container && this.leaderboardButton.container.scene) {
      this.leaderboardButton.setPosition(centerX, startY + buttonSpacing * 2);
      this.leaderboardButton.updateSize(secondaryButtonWidth, secondaryButtonHeight);
    }
    if (this.profileButton && this.profileButton.container && this.profileButton.container.scene) {
      const profileY = Math.min(startY + buttonSpacing * 3, height * 0.85);
      this.profileButton.setPosition(centerX, profileY);
      this.profileButton.updateSize(secondaryButtonWidth, secondaryButtonHeight);
    }
    
    // Update footer safely
    SafeResizeHandler.safeUpdateText(this.versionText, {
      position: { x: width - (isMobile ? 10 : 20), y: height - (isMobile ? 10 : 20) },
      fontSize: isMobile ? '12px' : '14px'
    });
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

  private openLeaderboard() {
    console.log('🏆 Opening leaderboard');
    
    // Use smooth transition to dashboard (which contains leaderboard functionality)
    SceneTransition.getInstance().fadeToScene(this, 'Dashboard', undefined, 500);
  }

  private openProfile() {
    console.log('👤 Opening profile');
    
    // Use smooth transition to profile scene
    SceneTransition.getInstance().fadeToScene(this, 'ProfileScene', undefined, 500);
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
    // Stats are now handled in the ProfileScene
    console.log('🔄 Player stats refresh requested - handled by ProfileScene');
  }

  destroy() {
    // Clean up resize timeout
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    // Clean up resize listener
    this.scale.off('resize');
    
    // Clean up event listeners
    this.events.off('refresh-player-stats');
    this.game.events.off('player-stats-updated');
    
    // Scene cleanup is handled by Phaser automatically
  }
}