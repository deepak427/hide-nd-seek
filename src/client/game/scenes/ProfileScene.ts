import { Scene } from 'phaser';
import { Theme } from '../../style/theme';
import { UIButton } from './MainMenu/components/UIButton';
import { PlayerStatsPanel } from './MainMenu/components/PlayerStatsPanel';
import { SceneTransition } from '../utils/SceneTransition';

export class ProfileScene extends Scene {
  private background!: Phaser.GameObjects.Graphics;
  private title!: Phaser.GameObjects.Text;
  private backButton!: UIButton;
  private statsPanel!: PlayerStatsPanel;
  private achievementsTitle!: Phaser.GameObjects.Text;
  private achievementsContainer!: Phaser.GameObjects.Container;
  private resizeTimeout?: NodeJS.Timeout;

  constructor() {
    super('ProfileScene');
  }

  create() {
    console.log('👤 ProfileScene initialized');
    
    // Add a test element to see if scene is working
    const testText = this.add.text(100, 100, 'PROFILE SCENE LOADED', {
      fontSize: '24px',
      color: '#00FF00'
    });
    console.log('🧪 Test text created:', testText);
    
    this.createBackground();
    this.createHeader();
    this.createAchievements();
    this.createBackButton();
    this.setupResize();
    
    // Create player stats asynchronously
    this.createPlayerStats().catch(error => {
      console.error('Failed to create player stats:', error);
    });
    
    // Create smooth entrance animation
    SceneTransition.getInstance().createSceneEntrance(this, 'fade', 400);
  }

  private createBackground() {
    const { width, height } = this.scale;
    
    // Create gradient background
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
    pattern.lineStyle(1, parseInt(Theme.accentCyan.replace('#', ''), 16), 0.05);
    
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

  private createHeader() {
    const { width, height } = this.scale;
    const isMobile = width < 768;
    
    // Title
    this.title = this.add.text(width / 2, height * 0.15, 'YOUR PROFILE', {
      fontSize: isMobile ? '28px' : '36px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.lightGray,
      fontStyle: 'bold',
      stroke: Theme.primaryDark,
      strokeThickness: isMobile ? 2 : 3
    }).setOrigin(0.5);
    
    // Add glow effect
    this.title.setShadow(0, 0, Theme.accentCyan, isMobile ? 5 : 8);
  }

  private async createPlayerStats() {
    const { width, height } = this.scale;
    
    console.log('🔄 Creating player stats directly...');
    
    // Use direct API call method for reliability
    await this.createStatsDirectly(width / 2, height * 0.35);
  }

  private async createStatsDirectly(x: number, y: number) {
    const { width } = this.scale;
    const isMobile = width < 768;
    
    console.log('📊 createStatsDirectly called with position:', x, y);
    console.log('📱 isMobile:', isMobile, 'width:', width);
    
    try {
      console.log('🔄 Fetching player stats from API...');
      const response = await fetch('/api/player/stats');
      
      if (response.ok) {
        const statsData = await response.json();
        console.log('✅ Player stats loaded:', statsData);
        console.log('🎯 Calling createRealStatsDisplay...');
        this.createRealStatsDisplay(x, y, statsData, isMobile);
        return;
      } else {
        console.warn('❌ API returned error:', response.status, response.statusText);
      }
    } catch (error) {
      console.warn('❌ Failed to fetch player stats:', error);
    }
    
    // Fallback to demo stats if API fails
    console.log('📊 Using demo stats as fallback');
    console.log('🎯 Calling createDemoStatsDisplay...');
    this.createDemoStatsDisplay(x, y, isMobile);
  }

  private createRealStatsDisplay(x: number, y: number, statsData: any, isMobile: boolean) {
    const elements: Phaser.GameObjects.GameObject[] = [];
    const { profile, progression, displayInfo } = statsData;

    // Background panel
    const panelBg = this.add.graphics();
    panelBg.fillStyle(parseInt(Theme.bgPanel.replace('#', ''), 16), 0.9);
    panelBg.fillRoundedRect(-150, -80, 300, 160, 12);
    panelBg.lineStyle(2, parseInt(Theme.borderLight.replace('#', ''), 16), 0.5);
    panelBg.strokeRoundedRect(-150, -80, 300, 160, 12);
    elements.push(panelBg);

    // Title
    const title = this.add.text(0, -65, 'Your Stats', {
      fontSize: isMobile ? '16px' : '18px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textPrimary,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    elements.push(title);

    // Rank display with real data
    const rankIcon = this.add.text(-120, -35, this.getRankIcon(progression.currentRank), {
      fontSize: isMobile ? '20px' : '24px'
    });
    elements.push(rankIcon);

    const rankName = this.add.text(-90, -35, progression.currentRank, {
      fontSize: isMobile ? '14px' : '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: displayInfo?.color || Theme.accentCyan,
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    elements.push(rankName);

    // Progress bar (only if not max rank)
    if (progression.nextRank) {
      const progressBg = this.add.graphics();
      progressBg.fillStyle(parseInt(Theme.bgSecondary.replace('#', ''), 16));
      progressBg.fillRoundedRect(-120, -10, 240, 8, 4);
      elements.push(progressBg);

      const progressFill = this.add.graphics();
      const progressWidth = (240 * progression.progressToNext) / 100;
      progressFill.fillStyle(parseInt(Theme.accentCyan.replace('#', ''), 16));
      progressFill.fillRoundedRect(-120, -10, progressWidth, 8, 4);
      elements.push(progressFill);

      const progressText = this.add.text(0, 5, `${Math.round(progression.progressToNext)}% to ${progression.nextRank}`, {
        fontSize: isMobile ? '10px' : '12px',
        fontFamily: 'Inter, Arial, sans-serif',
        color: Theme.textSecondary
      }).setOrigin(0.5);
      elements.push(progressText);
    } else {
      const maxRankText = this.add.text(0, -5, 'MAX RANK ACHIEVED!', {
        fontSize: isMobile ? '12px' : '14px',
        fontFamily: 'Inter, Arial, sans-serif',
        color: Theme.success,
        fontStyle: 'bold'
      }).setOrigin(0.5);
      elements.push(maxRankText);
    }

    // Stats grid with real data
    const statsY = 25;

    // Games Played
    const gamesPlayedLabel = this.add.text(-100, statsY, 'Games', {
      fontSize: isMobile ? '10px' : '12px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary
    }).setOrigin(0.5);
    const gamesPlayedValue = this.add.text(-100, statsY + 15, profile.totalGuesses.toString(), {
      fontSize: isMobile ? '14px' : '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.accentCyan,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    elements.push(gamesPlayedLabel, gamesPlayedValue);

    // Games Won
    const gamesWonLabel = this.add.text(0, statsY, 'Won', {
      fontSize: isMobile ? '10px' : '12px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary
    }).setOrigin(0.5);
    const gamesWonValue = this.add.text(0, statsY + 15, profile.successfulGuesses.toString(), {
      fontSize: isMobile ? '14px' : '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.success,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    elements.push(gamesWonLabel, gamesWonValue);

    // Win Rate
    const winRateLabel = this.add.text(100, statsY, 'Win Rate', {
      fontSize: isMobile ? '10px' : '12px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary
    }).setOrigin(0.5);
    const winRateValue = this.add.text(100, statsY + 15, `${Math.round(profile.successRate * 100)}%`, {
      fontSize: isMobile ? '14px' : '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.warning,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    elements.push(winRateLabel, winRateValue);

    // Total objects found
    const totalFoundText = this.add.text(0, 65, `${profile.successfulGuesses} Objects Found`, {
      fontSize: isMobile ? '10px' : '11px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary
    }).setOrigin(0.5);
    elements.push(totalFoundText);

    // Create container
    const statsContainer = this.add.container(x, y, elements);

    // Entrance animation
    statsContainer.setAlpha(0);
    statsContainer.setScale(0.9);
    this.tweens.add({
      targets: statsContainer,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Back.easeOut'
    });
  }

  private createDemoStatsDisplay(x: number, y: number, isMobile: boolean) {
    console.log('🎨 Creating demo stats display at:', x, y);
    const elements: Phaser.GameObjects.GameObject[] = [];

    // Background panel
    const panelBg = this.add.graphics();
    panelBg.fillStyle(parseInt(Theme.secondaryDark.replace('#', ''), 16), 0.9);
    panelBg.fillRoundedRect(-150, -80, 300, 160, 12);
    panelBg.lineStyle(2, parseInt(Theme.accentCyan.replace('#', ''), 16), 0.5);
    panelBg.strokeRoundedRect(-150, -80, 300, 160, 12);
    elements.push(panelBg);

    // Title
    const title = this.add.text(0, -65, 'Your Stats', {
      fontSize: isMobile ? '16px' : '18px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.lightGray,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    elements.push(title);

    // Rank display
    const rankIcon = this.add.text(-120, -35, '🔍', {
      fontSize: isMobile ? '20px' : '24px'
    });
    elements.push(rankIcon);

    const rankName = this.add.text(-90, -35, 'Beginner', {
      fontSize: isMobile ? '14px' : '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.accentCyan,
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    elements.push(rankName);

    // Progress bar
    const progressBg = this.add.graphics();
    progressBg.fillStyle(parseInt(Theme.primaryDark.replace('#', ''), 16));
    progressBg.fillRoundedRect(-120, -10, 240, 8, 4);
    elements.push(progressBg);

    const progressFill = this.add.graphics();
    const progressWidth = 240 * 0.3; // 30% progress
    progressFill.fillStyle(parseInt(Theme.accentCyan.replace('#', ''), 16));
    progressFill.fillRoundedRect(-120, -10, progressWidth, 8, 4);
    elements.push(progressFill);

    const progressText = this.add.text(0, 5, '30% to Advanced', {
      fontSize: isMobile ? '10px' : '12px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary
    }).setOrigin(0.5);
    elements.push(progressText);

    // Stats grid
    const statsY = 25;

    // Games Played
    const gamesPlayedLabel = this.add.text(-100, statsY, 'Games', {
      fontSize: isMobile ? '10px' : '12px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary
    }).setOrigin(0.5);
    const gamesPlayedValue = this.add.text(-100, statsY + 15, '15', {
      fontSize: isMobile ? '14px' : '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.accentCyan,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    elements.push(gamesPlayedLabel, gamesPlayedValue);

    // Games Won
    const gamesWonLabel = this.add.text(0, statsY, 'Won', {
      fontSize: isMobile ? '10px' : '12px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary
    }).setOrigin(0.5);
    const gamesWonValue = this.add.text(0, statsY + 15, '8', {
      fontSize: isMobile ? '14px' : '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.success,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    elements.push(gamesWonLabel, gamesWonValue);

    // Win Rate
    const winRateLabel = this.add.text(100, statsY, 'Win Rate', {
      fontSize: isMobile ? '10px' : '12px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary
    }).setOrigin(0.5);
    const winRateValue = this.add.text(100, statsY + 15, '53%', {
      fontSize: isMobile ? '14px' : '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.warning,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    elements.push(winRateLabel, winRateValue);

    // Total objects found
    const totalFoundText = this.add.text(0, 65, '42 Objects Found', {
      fontSize: isMobile ? '10px' : '11px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary
    }).setOrigin(0.5);
    elements.push(totalFoundText);

    // Create container
    console.log('📦 Creating demo stats container with', elements.length, 'elements');
    const demoStatsContainer = this.add.container(x, y, elements);
    console.log('✅ Demo stats container created:', demoStatsContainer);

    // Entrance animation
    demoStatsContainer.setAlpha(0);
    demoStatsContainer.setScale(0.9);
    this.tweens.add({
      targets: demoStatsContainer,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Back.easeOut'
    });
    
    console.log('🎬 Demo stats animation started');
  }

  private getRankIcon(rank: string): string {
    const rankIcons: Record<string, string> = {
      'Beginner': '🔍',
      'Novice': '🎯',
      'Advanced': '⭐',
      'Expert': '🏆',
      'Master': '👑',
      'Grandmaster': '💎'
    };
    return rankIcons[rank] || '🔍';
  }

  private createAchievements() {
    const { width, height } = this.scale;
    const isMobile = width < 768;
    
    // Achievements title
    this.achievementsTitle = this.add.text(width / 2, height * 0.55, 'ACHIEVEMENTS', {
      fontSize: isMobile ? '20px' : '24px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.lightGray,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Create achievements container
    const achievements = [
      { icon: '🎯', title: 'First Find', description: 'Found your first hidden object', unlocked: true },
      { icon: '🔥', title: 'On Fire', description: 'Found 5 objects in a row', unlocked: false },
      { icon: '👑', title: 'Master Seeker', description: 'Reached Master rank', unlocked: false },
      { icon: '⚡', title: 'Speed Demon', description: 'Found an object in under 10 seconds', unlocked: false }
    ];
    
    const achievementElements: Phaser.GameObjects.GameObject[] = [];
    const startY = height * 0.65;
    const spacing = isMobile ? 60 : 80;
    const cols = isMobile ? 2 : 4;
    const achievementWidth = isMobile ? (width * 0.8) / cols : 150;
    
    achievements.forEach((achievement, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const x = (width / 2) - ((cols - 1) * achievementWidth / 2) + (col * achievementWidth);
      const y = startY + (row * spacing);
      
      // Achievement background
      const bg = this.add.graphics();
      const bgColor = achievement.unlocked ? Theme.accentCyan : Theme.secondaryDark;
      bg.fillStyle(parseInt(bgColor.replace('#', ''), 16), achievement.unlocked ? 0.2 : 0.1);
      bg.fillRoundedRect(-achievementWidth/2 + 10, -25, achievementWidth - 20, 50, 8);
      bg.lineStyle(2, parseInt(bgColor.replace('#', ''), 16), achievement.unlocked ? 0.8 : 0.3);
      bg.strokeRoundedRect(-achievementWidth/2 + 10, -25, achievementWidth - 20, 50, 8);
      bg.setPosition(x, y);
      achievementElements.push(bg);
      
      // Achievement icon
      const icon = this.add.text(x, y - 8, achievement.icon, {
        fontSize: isMobile ? '20px' : '24px'
      }).setOrigin(0.5);
      if (!achievement.unlocked) {
        icon.setAlpha(0.5);
      }
      achievementElements.push(icon);
      
      // Achievement title
      const title = this.add.text(x, y + 8, achievement.title, {
        fontSize: isMobile ? '10px' : '12px',
        fontFamily: 'Inter, Arial, sans-serif',
        color: achievement.unlocked ? Theme.lightGray : Theme.textSecondary,
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: achievementWidth - 20 }
      }).setOrigin(0.5);
      achievementElements.push(title);
    });
    
    this.achievementsContainer = this.add.container(0, 0, achievementElements);
  }

  private createBackButton() {
    const { width, height } = this.scale;
    const isMobile = width < 768;
    
    // Ensure button stays within screen bounds
    const buttonY = Math.min(height * 0.9, height - 60);
    
    this.backButton = new UIButton(this, width / 2, buttonY, 'BACK TO MENU', {
      fontSize: isMobile ? '18px' : '20px',
      backgroundColor: Theme.secondaryDark,
      hoverColor: Theme.bgSecondary,
      textColor: Theme.lightGray,
      width: isMobile ? Math.min(200, width * 0.6) : 180,
      height: isMobile ? 50 : 45
    });
    
    this.backButton.onClick(() => {
      this.goBackToMainMenu();
    });
  }

  private setupResize() {
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      // Debounce resize calls to prevent rapid updates
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }
      
      this.resizeTimeout = setTimeout(() => {
        this.handleResize(gameSize.width, gameSize.height);
      }, 150);
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
    
    const isMobile = width < 768;
    
    // Update title safely
    if (this.title) {
      this.title.setPosition(width / 2, height * 0.15);
      this.title.setFontSize(isMobile ? '28px' : '36px');
      this.title.setStroke(Theme.primaryDark, isMobile ? 2 : 3);
      
      // Safely update title shadow
      try {
        this.title.setShadow(0, 0, Theme.accentCyan, isMobile ? 5 : 8);
      } catch (error) {
        console.warn('Failed to update title shadow during resize:', error);
      }
    }
    
    // Update stats panel position
    if (this.statsPanel && this.statsPanel.getContainer()) {
      const container = this.statsPanel.getContainer();
      if (container) {
        container.setPosition(width / 2, height * 0.35);
      }
    }
    
    // Update achievements title
    if (this.achievementsTitle) {
      this.achievementsTitle.setPosition(width / 2, height * 0.55);
      this.achievementsTitle.setFontSize(isMobile ? '20px' : '24px');
    }
    
    // Update back button with bounds checking - preserve interactivity
    if (this.backButton) {
      const buttonY = Math.min(height * 0.9, height - 60);
      this.backButton.setPosition(width / 2, buttonY);
      this.backButton.updateSize(
        isMobile ? Math.min(200, width * 0.6) : 180,
        isMobile ? 50 : 45
      );
    }
    
    // Update achievements layout without destroying - just reposition
    if (this.achievementsContainer) {
      const achievements = this.achievementsContainer.list;
      const startY = height * 0.65;
      const spacing = isMobile ? 60 : 80;
      const cols = isMobile ? 2 : 4;
      const achievementWidth = isMobile ? (width * 0.8) / cols : 150;
      
      // Reposition existing achievement elements
      let achievementIndex = 0;
      for (let i = 0; i < achievements.length; i += 3) { // Each achievement has 3 elements (bg, icon, title)
        const row = Math.floor(achievementIndex / cols);
        const col = achievementIndex % cols;
        const x = (width / 2) - ((cols - 1) * achievementWidth / 2) + (col * achievementWidth);
        const y = startY + (row * spacing);
        
        // Update positions of the 3 elements for this achievement
        const bgElement = achievements[i];
        const iconElement = achievements[i + 1];
        const titleElement = achievements[i + 2];
        
        if (bgElement && 'setPosition' in bgElement) (bgElement as any).setPosition(x, y); // background
        if (iconElement && 'setPosition' in iconElement) (iconElement as any).setPosition(x, y - 8); // icon
        if (titleElement && 'setPosition' in titleElement) (titleElement as any).setPosition(x, y + 8); // title
        
        achievementIndex++;
      }
    }
  }

  private goBackToMainMenu() {
    console.log('🏠 Returning to main menu');
    
    // Use smooth transition back to main menu
    SceneTransition.getInstance().fadeToScene(this, 'MainMenu', undefined, 500);
  }

  destroy() {
    this.scale.off('resize');
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    if (this.statsPanel) {
      this.statsPanel.destroy();
    }
  }
}