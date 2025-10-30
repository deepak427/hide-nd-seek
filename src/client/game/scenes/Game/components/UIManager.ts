import { Scene } from 'phaser';
import { Theme } from '../../../../style/theme';
import { RankProgressionNotification } from '../../../components/RankProgressionNotification';
import { ResponsiveManager } from '../../../utils/ResponsiveManager';
import { TouchHandler } from '../../../utils/TouchHandler';
import type { PlayerRank } from '../../../../../shared/types/game';

export class UIManager {
  private backBtn!: Phaser.GameObjects.Container;
  private shareBtn!: Phaser.GameObjects.Container;
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBg!: Phaser.GameObjects.Graphics;
  private progressText!: Phaser.GameObjects.Text;
  private objectiveText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;
  private completionPanel!: Phaser.GameObjects.Container;
  private objectSelector!: Phaser.GameObjects.Container;
  private selectedObjectDisplay!: Phaser.GameObjects.Text;
  private objectSelectorCallback?: (objectKey: string) => void;
  private rankNotification: RankProgressionNotification;

  // Responsive design components
  private responsiveManager: ResponsiveManager;
  private touchHandler: TouchHandler;

  constructor(private scene: Scene) {
    this.rankNotification = new RankProgressionNotification(scene);
    this.responsiveManager = new ResponsiveManager(scene);
    this.touchHandler = new TouchHandler(scene);

    // Setup responsive callbacks
    this.responsiveManager.onResize(() => this.handleResize());
    this.responsiveManager.onOrientationChange(() => this.handleOrientationChange());
  }

  create(onBack: () => void, onShare: () => void, gameMode: 'hiding' | 'guessing' | 'dashboard' = 'hiding') {
    this.createBackButton(onBack);
    // Remove object selector since objects are now directly on the map
    if (gameMode === 'guessing') {
      this.createProgressBar();
    }
    this.createShareButton(onShare, gameMode);
    this.createMessageSystem();
  }

  private createBackButton(onBack: () => void) {
    const { width, height } = this.scene.scale;

    // Button background - larger and more visible
    const backBg = this.scene.add.graphics();
    backBg.fillStyle(parseInt(Theme.bgSecondary.replace('#', ''), 16), 0.95);
    backBg.fillRoundedRect(-60, -25, 120, 50, Theme.radiusMedium);
    backBg.lineStyle(3, parseInt(Theme.accentCyan.replace('#', ''), 16), 0.8);
    backBg.strokeRoundedRect(-60, -25, 120, 50, Theme.radiusMedium);

    // Button text - larger and more prominent
    const backText = this.scene.add.text(0, 0, '← BACK', {
      fontSize: '18px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textPrimary,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Container - positioned with more margin to ensure visibility
    this.backBtn = this.scene.add.container(Math.max(70, width * 0.1), Math.max(35, height * 0.08), [backBg, backText]);
    this.backBtn.setSize(120, 50);
    this.backBtn.setInteractive();
    this.backBtn.setDepth(Theme.zIndexUI + 10); // Higher depth to ensure visibility

    // Hover effects
    this.backBtn.on('pointerover', () => {
      backBg.clear();
      backBg.fillStyle(parseInt(Theme.accentCyan.replace('#', ''), 16), 0.9);
      backBg.fillRoundedRect(-60, -25, 120, 50, Theme.radiusMedium);
      backBg.lineStyle(3, parseInt(Theme.primaryDark.replace('#', ''), 16));
      backBg.strokeRoundedRect(-60, -25, 120, 50, Theme.radiusMedium);

      this.scene.tweens.add({
        targets: this.backBtn,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: Theme.animationFast,
        ease: 'Power2'
      });
    });

    this.backBtn.on('pointerout', () => {
      backBg.clear();
      backBg.fillStyle(parseInt(Theme.bgSecondary.replace('#', ''), 16), 0.95);
      backBg.fillRoundedRect(-60, -25, 120, 50, Theme.radiusMedium);
      backBg.lineStyle(3, parseInt(Theme.accentCyan.replace('#', ''), 16), 0.8);
      backBg.strokeRoundedRect(-60, -25, 120, 50, Theme.radiusMedium);

      this.scene.tweens.add({
        targets: this.backBtn,
        scaleX: 1,
        scaleY: 1,
        duration: Theme.animationFast,
        ease: 'Power2'
      });
    });

    this.backBtn.on('pointerdown', onBack);
  }

  private createProgressBar() {
    const { width, height } = this.scene.scale;

    // Progress bar background
    this.progressBg = this.scene.add.graphics();
    this.progressBg.fillStyle(parseInt(Theme.bgSecondary.replace('#', ''), 16), 0.8);
    this.progressBg.fillRoundedRect(width / 2 - 150, 30, 300, 20, 10);
    this.progressBg.lineStyle(2, parseInt(Theme.border.replace('#', ''), 16));
    this.progressBg.strokeRoundedRect(width / 2 - 150, 30, 300, 20, 10);
    this.progressBg.setDepth(Theme.zIndexUI);

    // Progress bar fill
    this.progressBar = this.scene.add.graphics();
    this.progressBar.setDepth(Theme.zIndexUI + 1);

    // Progress text
    this.progressText = this.scene.add.text(width / 2, 40, '0 / 0', {
      fontSize: '14px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textPrimary,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(Theme.zIndexUI + 2);
  }

  private createShareButton(onShare: () => void, gameMode: 'hiding' | 'guessing' | 'dashboard' = 'hiding') {
    const { width, height } = this.scene.scale;

    // Button background
    const shareBg = this.scene.add.graphics();
    shareBg.fillStyle(parseInt(Theme.accentCyan.replace('#', ''), 16));
    shareBg.fillRoundedRect(-100, -25, 200, 50, Theme.radiusMedium);

    // Button text based on mode - Requirements 7.1: Replace share button with post game functionality
    let buttonText = '📤 SHARE RESULT';
    if (gameMode === 'hiding') {
      buttonText = '📮 POST GAME';
    } else if (gameMode === 'dashboard') {
      buttonText = '🔄 REFRESH';
    }

    const shareText = this.scene.add.text(0, 0, buttonText, {
      fontSize: '18px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textPrimary,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Container - ensure it's fully visible with proper margin
    const buttonY = Math.max(height - 80, height * 0.9); // Ensure minimum 80px from bottom
    this.shareBtn = this.scene.add.container(width / 2, buttonY, [shareBg, shareText]);
    this.shareBtn.setSize(200, 50);
    this.shareBtn.setInteractive();
    this.shareBtn.setVisible(false);
    this.shareBtn.setDepth(Theme.zIndexUI);

    // Hover effects
    this.shareBtn.on('pointerover', () => {
      shareBg.clear();
      shareBg.fillStyle(parseInt(Theme.primaryDark.replace('#', ''), 16));
      shareBg.fillRoundedRect(-100, -25, 200, 50, Theme.radiusMedium);

      this.scene.tweens.add({
        targets: this.shareBtn,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: Theme.animationFast,
        ease: 'Power2'
      });
    });

    this.shareBtn.on('pointerout', () => {
      shareBg.clear();
      shareBg.fillStyle(parseInt(Theme.accentCyan.replace('#', ''), 16));
      shareBg.fillRoundedRect(-100, -25, 200, 50, Theme.radiusMedium);

      this.scene.tweens.add({
        targets: this.shareBtn,
        scaleX: 1,
        scaleY: 1,
        duration: Theme.animationFast,
        ease: 'Power2'
      });
    });

    this.shareBtn.on('pointerdown', onShare);
  }

  private createObjectSelector() {
    const { width, height } = this.scene.scale;

    // Object selector panel
    const panelBg = this.scene.add.graphics();
    panelBg.fillStyle(parseInt(Theme.bgSecondary.replace('#', ''), 16), 0.9);
    panelBg.fillRoundedRect(-200, -40, 400, 80, Theme.radiusMedium);
    panelBg.lineStyle(2, parseInt(Theme.border.replace('#', ''), 16));
    panelBg.strokeRoundedRect(-200, -40, 400, 80, Theme.radiusMedium);

    // Title
    const title = this.scene.add.text(0, -15, 'Choose object to hide:', {
      fontSize: '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textPrimary,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Object buttons
    const objects = ['pumpkin', 'wardrobe', 'bush', 'car', 'truck', 'guard'];
    const buttonWidth = 50;
    const spacing = 60;
    const startX = -(objects.length - 1) * spacing / 2;

    const objectButtons: Phaser.GameObjects.Container[] = [];

    objects.forEach((objectKey, index) => {
      const x = startX + index * spacing;

      // Button background
      const btnBg = this.scene.add.graphics();
      btnBg.fillStyle(parseInt(Theme.bgSecondary.replace('#', ''), 16));
      btnBg.fillRoundedRect(-25, -15, 50, 30, Theme.radiusSmall);

      // Object icon (or text if image not available)
      let objectDisplay: Phaser.GameObjects.GameObject;
      if (this.scene.textures.exists(objectKey)) {
        objectDisplay = this.scene.add.image(0, 0, objectKey).setDisplaySize(20, 20);
      } else {
        objectDisplay = this.scene.add.text(0, 0, objectKey.charAt(0).toUpperCase(), {
          fontSize: '14px',
          color: Theme.textPrimary
        }).setOrigin(0.5);
      }

      const button = this.scene.add.container(x, 15, [btnBg, objectDisplay]);
      button.setSize(50, 30);
      button.setInteractive();

      // Hover effects
      button.on('pointerover', () => {
        btnBg.clear();
        btnBg.fillStyle(parseInt(Theme.accentCyan.replace('#', ''), 16));
        btnBg.fillRoundedRect(-25, -15, 50, 30, Theme.radiusSmall);
      });

      button.on('pointerout', () => {
        btnBg.clear();
        btnBg.fillStyle(parseInt(Theme.bgSecondary.replace('#', ''), 16));
        btnBg.fillRoundedRect(-25, -15, 50, 30, Theme.radiusSmall);
      });

      button.on('pointerdown', () => {
        if (this.objectSelectorCallback) {
          this.objectSelectorCallback(objectKey);
        }
        this.highlightSelectedObject(button, objectKey);
      });

      objectButtons.push(button);
    });

    this.objectSelector = this.scene.add.container(width / 2, 80, [panelBg, title, ...objectButtons]);
    this.objectSelector.setDepth(Theme.zIndexUI);

    // Selected object display
    this.selectedObjectDisplay = this.scene.add.text(width / 2, 140, 'No object selected', {
      fontSize: '14px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary,
      align: 'center'
    }).setOrigin(0.5).setDepth(Theme.zIndexUI);
  }

  private highlightSelectedObject(selectedButton: Phaser.GameObjects.Container, objectKey: string) {
    // Reset all buttons
    this.objectSelector.list.forEach(child => {
      if (child instanceof Phaser.GameObjects.Container && child !== selectedButton) {
        const bg = child.list[0] as Phaser.GameObjects.Graphics;
        bg.clear();
        bg.fillStyle(parseInt(Theme.bgSecondary.replace('#', ''), 16));
        bg.fillRoundedRect(-25, -15, 50, 30, Theme.radiusSmall);
      }
    });

    // Highlight selected button
    const selectedBg = selectedButton.list[0] as Phaser.GameObjects.Graphics;
    selectedBg.clear();
    selectedBg.fillStyle(parseInt(Theme.success.replace('#', ''), 16));
    selectedBg.fillRoundedRect(-25, -15, 50, 30, Theme.radiusSmall);

    // Update display text
    this.selectedObjectDisplay.setText(`Selected: ${objectKey}`);
    this.selectedObjectDisplay.setColor(Theme.success);
  }

  private createMessageSystem() {
    const { width, height } = this.scene.scale;

    // Objective text (shown at start)
    this.objectiveText = this.scene.add.text(width / 2, height * 0.15, '', {
      fontSize: '24px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.accentCyan,
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5).setDepth(Theme.zIndexUI).setVisible(false);

    // Message text (for feedback)
    this.messageText = this.scene.add.text(width / 2, height / 2, '', {
      fontSize: '20px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textPrimary,
      fontStyle: 'bold',
      align: 'center',
      backgroundColor: Theme.bgModal,
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setDepth(Theme.zIndexUI).setVisible(false);
  }

  updateProgress(found: number, total: number) {
    const { width } = this.scene.scale;
    const progress = total > 0 ? found / total : 0;

    // Update progress bar
    this.progressBar.clear();
    this.progressBar.fillStyle(parseInt(Theme.accentCyan.replace('#', ''), 16));
    this.progressBar.fillRoundedRect(width / 2 - 150, 30, 300 * progress, 20, 10);

    // Update text
    this.progressText.setText(`${found} / ${total}`);

    // Add pulse effect when progress changes
    if (found > 0) {
      this.scene.tweens.add({
        targets: [this.progressBar, this.progressText],
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 200,
        yoyo: true,
        ease: 'Power2'
      });
    }
  }

  showObjective(text: string) {
    this.objectiveText.setText(text);
    this.objectiveText.setVisible(true);

    // Fade in animation
    this.objectiveText.setAlpha(0);
    this.scene.tweens.add({
      targets: this.objectiveText,
      alpha: 1,
      duration: 500,
      ease: 'Power2'
    });

    // Auto hide after 3 seconds
    this.scene.time.delayedCall(3000, () => {
      this.scene.tweens.add({
        targets: this.objectiveText,
        alpha: 0,
        duration: 500,
        ease: 'Power2',
        onComplete: () => {
          this.objectiveText.setVisible(false);
        }
      });
    });
  }

  showFoundMessage(objectKey: string) {
    this.messageText.setText(`Found: ${objectKey}!`);
    this.messageText.setVisible(true);
    this.messageText.setTint(parseInt(Theme.success.replace('#', ''), 16));

    // Bounce in animation
    this.messageText.setScale(0);
    this.scene.tweens.add({
      targets: this.messageText,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });

    // Auto hide after 2 seconds
    this.scene.time.delayedCall(2000, () => {
      this.scene.tweens.add({
        targets: this.messageText,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          this.messageText.setVisible(false);
          this.messageText.setAlpha(1);
        }
      });
    });
  }

  showMessage(text: string, color: string = Theme.textPrimary) {
    this.messageText.setText(text);
    this.messageText.setVisible(true);
    this.messageText.setTint(parseInt(color.replace('#', ''), 16));

    // Show animation
    this.messageText.setAlpha(0);
    this.scene.tweens.add({
      targets: this.messageText,
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    });

    // Auto hide
    this.scene.time.delayedCall(2000, () => {
      this.scene.tweens.add({
        targets: this.messageText,
        alpha: 0,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          this.messageText.setVisible(false);
        }
      });
    });
  }

  showCompletion() {
    const { width, height } = this.scene.scale;

    // Completion message
    const completionText = this.scene.add.text(width / 2, height / 2, '🎉 CONGRATULATIONS!\nYou found all objects!', {
      fontSize: '32px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.accentCyan,
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);

    // Background panel
    const panelBg = this.scene.add.graphics();
    panelBg.fillStyle(parseInt(Theme.bgModal.replace('#', ''), 16), 0.95);
    panelBg.fillRoundedRect(-200, -80, 400, 160, Theme.radiusLarge);
    panelBg.lineStyle(3, parseInt(Theme.accentCyan.replace('#', ''), 16));
    panelBg.strokeRoundedRect(-200, -80, 400, 160, Theme.radiusLarge);

    this.completionPanel = this.scene.add.container(width / 2, height / 2, [panelBg, completionText]);
    this.completionPanel.setDepth(Theme.zIndexModal);

    // Entrance animation
    this.completionPanel.setScale(0);
    this.scene.tweens.add({
      targets: this.completionPanel,
      scaleX: 1,
      scaleY: 1,
      duration: 600,
      ease: 'Back.easeOut'
    });
  }

  showShare() {
    // Don't show again if already visible to prevent positioning issues
    if (this.shareBtn.visible) {
      return;
    }

    this.shareBtn.setVisible(true);

    // Store original position to prevent drift
    const { width, height } = this.scene.scale;
    const originalY = Math.max(height - 80, height * 0.9);

    // Entrance animation from below
    this.shareBtn.setAlpha(0);
    this.shareBtn.setY(originalY + 30);

    this.scene.tweens.add({
      targets: this.shareBtn,
      alpha: 1,
      y: originalY,
      duration: 500,
      ease: 'Back.easeOut'
    });
  }

  hideShare() {
    if (!this.shareBtn.visible) {
      return;
    }

    this.scene.tweens.add({
      targets: this.shareBtn,
      alpha: 0,
      duration: 300,
      ease: 'Power2.easeIn',
      onComplete: () => {
        this.shareBtn.setVisible(false);
      }
    });
  }

  showObjectSelector(callback: (objectKey: string) => void) {
    this.objectSelectorCallback = callback;
    if (this.objectSelector) {
      this.objectSelector.setVisible(true);
    }
  }

  hideObjectSelector() {
    if (this.objectSelector) {
      this.objectSelector.setVisible(false);
    }
    if (this.selectedObjectDisplay) {
      this.selectedObjectDisplay.setVisible(false);
    }
  }

  setPrimaryActionText(text: string) {
    if (this.shareBtn && this.shareBtn.list.length > 1) {
      const shareText = this.shareBtn.list[1] as Phaser.GameObjects.Text;
      shareText.setText(text);
    }
  }

  showObjectToFind(objectKey: string) {
    const { width } = this.scene.scale;

    // Show what object to find
    const findText = this.scene.add.text(width / 2, 60, `Find the hidden: ${objectKey}`, {
      fontSize: '20px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.accentCyan,
      fontStyle: 'bold',
      backgroundColor: Theme.bgModal,
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5).setDepth(Theme.zIndexUI);

    // Add object icon if available
    if (this.scene.textures.exists(objectKey)) {
      const icon = this.scene.add.image(width / 2 - 80, 60, objectKey);
      icon.setDisplaySize(30, 30);
      icon.setDepth(Theme.zIndexUI);
    }
  }

  showGuessDashboard(guessData: any) {
    const { width, height } = this.scene.scale;

    // Create dashboard panel
    const panelBg = this.scene.add.graphics();
    panelBg.fillStyle(parseInt(Theme.bgModal.replace('#', ''), 16), 0.95);
    panelBg.fillRoundedRect(-250, -200, 500, 400, Theme.radiusMedium);
    panelBg.lineStyle(2, parseInt(Theme.borderLight.replace('#', ''), 16));
    panelBg.strokeRoundedRect(-250, -200, 500, 400, Theme.radiusMedium);

    // Title
    const title = this.scene.add.text(0, -170, 'Guess Dashboard', {
      fontSize: '24px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.accentCyan,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Statistics
    const stats = `Total Guesses: ${guessData.totalGuesses || 0}\nCorrect Guesses: ${guessData.correctGuesses || 0}\nUnique Players: ${guessData.uniqueGuessers || 0}`;
    const statsText = this.scene.add.text(0, -120, stats, {
      fontSize: '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textPrimary,
      align: 'center'
    }).setOrigin(0.5);

    // Recent guesses list
    const guessesTitle = this.scene.add.text(0, -60, 'Recent Guesses:', {
      fontSize: '18px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textPrimary,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const guessElements = [panelBg, title, statsText, guessesTitle];

    // Display recent guesses
    if (guessData.guesses && guessData.guesses.length > 0) {
      const recentGuesses = guessData.guesses.slice(-5); // Show last 5 guesses
      recentGuesses.forEach((guess: any, index: number) => {
        const y = -20 + (index * 25);
        const status = guess.isCorrect ? '✅' : '❌';
        const guessText = `${status} ${guess.username}: ${guess.objectKey}`;

        const guessDisplay = this.scene.add.text(0, y, guessText, {
          fontSize: '14px',
          fontFamily: 'Inter, Arial, sans-serif',
          color: guess.isCorrect ? Theme.success : Theme.textSecondary,
          align: 'center'
        }).setOrigin(0.5);

        guessElements.push(guessDisplay);
      });
    } else {
      const noGuesses = this.scene.add.text(0, -20, 'No guesses yet...', {
        fontSize: '16px',
        fontFamily: 'Inter, Arial, sans-serif',
        color: Theme.textSecondary,
        align: 'center'
      }).setOrigin(0.5);

      guessElements.push(noGuesses);
    }

    // Create dashboard container
    const dashboard = this.scene.add.container(width / 2, height / 2, guessElements);
    dashboard.setDepth(Theme.zIndexUI);

    // Store reference for updates
    (this.scene as any).guessDashboard = dashboard;

    // Entrance animation
    dashboard.setAlpha(0);
    dashboard.setScale(0.8);
    this.scene.tweens.add({
      targets: dashboard,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: 'Back.easeOut'
    });
  }

  /**
   * Show post creation dialog interface
   * Requirements 7.1: Create post creation dialog interface
   */
  showPostCreationDialog(gameData: {
    mapKey: string;
    objectKey: string;
    relX: number;
    relY: number;
  }, onConfirm: () => void, onCancel: () => void) {
    const { width, height } = this.scene.scale;

    // Dialog background with overlay
    const overlay = this.scene.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(Theme.zIndexModal);

    // Dialog panel
    const panelBg = this.scene.add.graphics();
    panelBg.fillStyle(parseInt(Theme.bgModal.replace('#', ''), 16), 0.98);
    panelBg.fillRoundedRect(-280, -200, 560, 400, Theme.radiusLarge);
    panelBg.lineStyle(3, parseInt(Theme.accentCyan.replace('#', ''), 16));
    panelBg.strokeRoundedRect(-280, -200, 560, 400, Theme.radiusLarge);

    // Title
    const title = this.scene.add.text(0, -160, '📮 Post Your Hide & Seek Challenge', {
      fontSize: '24px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.accentCyan,
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);

    // Game details
    const detailsText = [
      `Map: ${gameData.mapKey}`,
      `Hidden Object: ${gameData.objectKey}`,
      `Position: (${Math.round(gameData.relX * 100)}%, ${Math.round(gameData.relY * 100)}%)`,
      '',
      'This will create a Reddit post where other players',
      'can try to find your hidden object!'
    ].join('\n');

    const details = this.scene.add.text(0, -80, detailsText, {
      fontSize: '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textPrimary,
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5);

    // Preview section
    const previewTitle = this.scene.add.text(0, 20, '🎯 Challenge Preview', {
      fontSize: '18px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textPrimary,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const previewText = `"Can you find the hidden ${gameData.objectKey} in ${gameData.mapKey}?"`;
    const preview = this.scene.add.text(0, 50, previewText, {
      fontSize: '14px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary,
      align: 'center',
      fontStyle: 'italic',
      backgroundColor: Theme.bgSecondary,
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5);

    // Buttons
    const confirmBtn = this.createDialogButton('✅ Post to Reddit', Theme.accentCyan, onConfirm);
    confirmBtn.setPosition(-120, 130);

    const cancelBtn = this.createDialogButton('❌ Cancel', Theme.bgSecondary, onCancel);
    cancelBtn.setPosition(120, 130);

    // Create dialog container
    const dialogContainer = this.scene.add.container(width / 2, height / 2, [
      panelBg, title, details, previewTitle, preview, confirmBtn, cancelBtn
    ]);
    dialogContainer.setDepth(Theme.zIndexModal + 1);

    // Full dialog with overlay
    const fullDialog = this.scene.add.container(0, 0, [overlay, dialogContainer]);
    fullDialog.setDepth(Theme.zIndexModal);

    // Store reference for cleanup
    (this.scene as any).postCreationDialog = fullDialog;

    // Entrance animation
    dialogContainer.setScale(0);
    overlay.setAlpha(0);

    this.scene.tweens.add({
      targets: overlay,
      alpha: 0.7,
      duration: 300,
      ease: 'Power2.easeOut'
    });

    this.scene.tweens.add({
      targets: dialogContainer,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      delay: 100,
      ease: 'Back.easeOut'
    });
  }

  /**
   * Create a dialog button with consistent styling
   */
  private createDialogButton(text: string, bgColor: string, onClick: () => void): Phaser.GameObjects.Container {
    // Button background
    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(parseInt(bgColor.replace('#', ''), 16));
    btnBg.fillRoundedRect(-80, -20, 160, 40, Theme.radiusMedium);

    // Button text
    const btnText = this.scene.add.text(0, 0, text, {
      fontSize: '16px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: bgColor === Theme.bgSecondary ? Theme.textSecondary : Theme.textPrimary,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const button = this.scene.add.container(0, 0, [btnBg, btnText]);
    button.setSize(160, 40);
    button.setInteractive();

    // Hover effects
    button.on('pointerover', () => {
      const hoverColor = bgColor === Theme.bgSecondary ? Theme.error : Theme.primaryDark;
      btnBg.clear();
      btnBg.fillStyle(parseInt(hoverColor.replace('#', ''), 16));
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
      btnBg.fillStyle(parseInt(bgColor.replace('#', ''), 16));
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
      // Click feedback
      this.scene.tweens.add({
        targets: button,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        yoyo: true,
        ease: 'Power2.easeOut',
        onComplete: onClick
      });
    });

    return button;
  }

  /**
   * Hide post creation dialog
   */
  hidePostCreationDialog() {
    const dialog = (this.scene as any).postCreationDialog;
    if (dialog) {
      this.scene.tweens.add({
        targets: dialog,
        alpha: 0,
        duration: 300,
        ease: 'Power2.easeIn',
        onComplete: () => {
          dialog.destroy();
          delete (this.scene as any).postCreationDialog;
        }
      });
    }
  }

  /**
   * Show rank up celebration notification
   * Requirements 4.4: Display rank-up celebrations and animations
   */
  showRankUpNotification(previousRank: PlayerRank, newRank: PlayerRank) {
    this.rankNotification.showRankUp(previousRank, newRank);
  }

  /**
   * Show progress notification towards next rank
   * Requirements 4.4: Update UI elements to reflect new rank
   */
  showProgressNotification(currentRank: PlayerRank, progressPercentage: number, nextRank?: PlayerRank) {
    this.rankNotification.showProgress(currentRank, progressPercentage, nextRank);
  }

  /**
   * Show success message with optional rank progression check
   * Enhanced to include rank progression notifications
   */
  showSuccessWithRankCheck(
    message: string,
    rankData?: {
      rankChanged: boolean;
      previousRank?: PlayerRank;
      newRank?: PlayerRank;
      progressPercentage?: number;
    }
  ) {
    // Show the success message first
    this.showMessage(message, Theme.success);

    // If rank changed, show rank up notification after a delay
    if (rankData?.rankChanged && rankData.previousRank && rankData.newRank) {
      this.scene.time.delayedCall(1500, () => {
        this.showRankUpNotification(rankData.previousRank!, rankData.newRank!);
      });
    } else if (rankData?.progressPercentage !== undefined) {
      // Show progress notification for significant progress (every 25%)
      const progressMilestones = [25, 50, 75];
      if (progressMilestones.includes(Math.floor(rankData.progressPercentage))) {
        this.scene.time.delayedCall(1000, () => {
          // We need to determine current and next rank - this would come from the API
          // For now, we'll skip the progress notification if we don't have rank info
        });
      }
    }
  }

  /**
   * Enhanced responsive resize method
   * Requirements: 6.4 - Ensure responsive design works on both desktop and mobile
   */
  resize() {
    this.handleResize();
  }

  /**
   * Handle responsive resize with device-specific optimizations
   * Requirements: 6.4 - Responsive design implementation
   */
  private handleResize(): void {
    const { width, height } = this.scene.scale;
    const deviceInfo = this.responsiveManager.getDeviceInfo();
    const uiScale = this.responsiveManager.getUIScale();

    console.log('📱 UI Resize:', { width, height, deviceInfo, uiScale });

    // Update back button with responsive positioning - ensure it's always visible
    const backButtonMargin = Math.max(70, this.responsiveManager.getResponsiveSpacing(35));
    this.backBtn.setPosition(backButtonMargin, Math.max(35, backButtonMargin));
    this.backBtn.setScale(uiScale);

    // Update progress bar with responsive sizing
    if (this.progressBg) {
      const progressWidth = Math.min(300, width * 0.8);
      const progressHeight = this.responsiveManager.isMobile() ? 24 : 20;

      this.progressBg.clear();
      this.progressBg.fillStyle(parseInt(Theme.bgSecondary.replace('#', ''), 16), 0.8);
      this.progressBg.fillRoundedRect(width / 2 - progressWidth / 2, 30, progressWidth, progressHeight, 10);
      this.progressBg.lineStyle(2, parseInt(Theme.borderLight.replace('#', ''), 16));
      this.progressBg.strokeRoundedRect(width / 2 - progressWidth / 2, 30, progressWidth, progressHeight, 10);

      this.progressText.setPosition(width / 2, 30 + progressHeight / 2);
      this.progressText.setFontSize(this.responsiveManager.getResponsiveFontSize(14));
    }

    // Update object selector with responsive layout
    if (this.objectSelector) {
      const selectorY = deviceInfo.isMobile ? 100 : 80;
      this.objectSelector.setPosition(width / 2, selectorY);
      this.objectSelector.setScale(uiScale);

      if (this.selectedObjectDisplay) {
        this.selectedObjectDisplay.setPosition(width / 2, selectorY + 60);
        this.selectedObjectDisplay.setFontSize(this.responsiveManager.getResponsiveFontSize(16));
      }
    }

    // Update share button with responsive positioning and sizing
    const shareButtonMargin = Math.max(80, this.responsiveManager.getResponsiveSpacing(80));
    const buttonY = Math.max(height - shareButtonMargin, height * 0.9);
    this.shareBtn.setPosition(width / 2, buttonY);
    this.shareBtn.setScale(uiScale);

    // Update message positions with responsive spacing
    const objectiveY = deviceInfo.isMobile ? height * 0.18 : height * 0.15;
    this.objectiveText.setPosition(width / 2, objectiveY);
    this.objectiveText.setFontSize(this.responsiveManager.getResponsiveFontSize(18));

    this.messageText.setPosition(width / 2, height / 2);
    this.messageText.setFontSize(this.responsiveManager.getResponsiveFontSize(16));

    // Update completion panel
    if (this.completionPanel) {
      this.completionPanel.setPosition(width / 2, height / 2);
      this.completionPanel.setScale(uiScale);
    }

    // Update touch areas for mobile
    if (deviceInfo.touchSupported) {
      this.updateTouchAreas();
    }
  }

  /**
   * Handle orientation change
   * Requirements: 6.4 - Responsive design implementation
   */
  private handleOrientationChange(): void {
    const deviceInfo = this.responsiveManager.getDeviceInfo();
    console.log('🔄 UI Orientation change:', deviceInfo.isPortrait ? 'Portrait' : 'Landscape');

    // Adjust UI layout for orientation
    if (deviceInfo.isMobile) {
      if (deviceInfo.isPortrait) {
        // Portrait: Stack elements vertically with more spacing
        this.adjustForPortrait();
      } else {
        // Landscape: Compact layout with less vertical spacing
        this.adjustForLandscape();
      }
    }

    // Trigger resize to update positions
    this.handleResize();
  }

  /**
   * Adjust UI for portrait orientation
   * Requirements: 6.4 - Responsive design implementation
   */
  private adjustForPortrait(): void {
    const { width, height } = this.scene.scale;

    // Move objective text higher in portrait
    if (this.objectiveText) {
      this.objectiveText.setPosition(width / 2, height * 0.12);
    }

    // Adjust object selector for portrait
    if (this.objectSelector) {
      this.objectSelector.setPosition(width / 2, height * 0.25);
    }
  }

  /**
   * Adjust UI for landscape orientation
   * Requirements: 6.4 - Responsive design implementation
   */
  private adjustForLandscape(): void {
    const { width, height } = this.scene.scale;

    // Compact layout for landscape
    if (this.objectiveText) {
      this.objectiveText.setPosition(width / 2, height * 0.08);
    }

    // Move object selector higher in landscape
    if (this.objectSelector) {
      this.objectSelector.setPosition(width / 2, height * 0.15);
    }
  }

  /**
   * Update touch areas for mobile optimization
   * Requirements: 6.4 - Optimize touch interactions for mobile
   */
  private updateTouchAreas(): void {
    const touchAreaSize = this.responsiveManager.getTouchInteractionArea(44);

    // Update back button touch area
    if (this.backBtn) {
      this.touchHandler.makeTouchOptimized(this.backBtn, touchAreaSize);
    }

    // Update share button touch area
    if (this.shareBtn) {
      this.touchHandler.makeTouchOptimized(this.shareBtn, touchAreaSize);
    }

    // Update object selector buttons
    if (this.objectSelector) {
      this.objectSelector.list.forEach(child => {
        if ((child as any).input) {
          this.touchHandler.makeTouchOptimized(child as any, touchAreaSize);
        }
      });
    }
  }

  /**
   * Cleanup responsive components
   */
  public destroy(): void {
    this.responsiveManager.destroy();
    this.touchHandler.destroy();
  }
}