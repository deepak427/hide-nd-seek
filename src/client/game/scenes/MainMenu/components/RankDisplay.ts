import { Scene } from 'phaser';
import { Theme } from '../../../../style/theme';
import type { PlayerProfile, PlayerRank } from '../../../../../shared/types/game';
import { RANK_REQUIREMENTS } from '../../../../../shared/constants/game';
import { calculateRankProgression } from '../../../../../shared/utils/validation';

export class RankDisplay {
  public container: Phaser.GameObjects.Container;
  private rankIcon: Phaser.GameObjects.Graphics;
  private rankText: Phaser.GameObjects.Text;
  private rankDescription: Phaser.GameObjects.Text;
  private progressBar: Phaser.GameObjects.Graphics;
  private progressBarBg: Phaser.GameObjects.Graphics;
  private progressText: Phaser.GameObjects.Text;

  constructor(
    private scene: Scene,
    x: number,
    y: number,
    private playerProfile: PlayerProfile
  ) {
    this.container = this.scene.add.container(x, y);
    this.createRankDisplay();
  }

  private createRankDisplay() {
    // Create rank icon background
    this.rankIcon = this.scene.add.graphics();
    this.drawRankIcon(this.playerProfile.rank);
    
    // Create rank text
    this.rankText = this.scene.add.text(0, -40, this.playerProfile.rank, {
      fontSize: '32px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.accentCyan,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Create rank description
    const rankInfo = RANK_REQUIREMENTS[this.playerProfile.rank];
    this.rankDescription = this.scene.add.text(0, -10, rankInfo.description, {
      fontSize: '14px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary,
      align: 'center',
      wordWrap: { width: 300 }
    }).setOrigin(0.5);

    // Create progress to next rank
    this.createProgressDisplay();

    // Add all elements to container
    this.container.add([
      this.rankIcon,
      this.rankText,
      this.rankDescription,
      this.progressBarBg,
      this.progressBar,
      this.progressText
    ]);
  }

  private drawRankIcon(rank: PlayerRank) {
    this.rankIcon.clear();
    
    // Get rank-specific colors
    const colors = this.getRankColors(rank);
    
    // Draw rank badge
    this.rankIcon.fillStyle(colors.primary);
    this.rankIcon.fillCircle(0, -70, 25);
    
    // Draw rank symbol based on rank
    this.rankIcon.lineStyle(3, colors.accent);
    switch (rank) {
      case 'Tyapu':
        // Simple circle
        this.rankIcon.strokeCircle(0, -70, 15);
        break;
      case 'GuessMaster':
        // Star shape
        this.drawStar(0, -70, 5, 15, 8);
        break;
      case 'Detective':
        // Shield shape
        this.drawShield(0, -70, 15);
        break;
      case 'FBI':
        // Crown shape
        this.drawCrown(0, -70, 15);
        break;
    }
  }

  private getRankColors(rank: PlayerRank) {
    switch (rank) {
      case 'Tyapu':
        return { primary: 0x666666, accent: 0x999999 };
      case 'GuessMaster':
        return { primary: 0x4CAF50, accent: 0x8BC34A };
      case 'Detective':
        return { primary: 0x2196F3, accent: 0x03DAC6 };
      case 'FBI':
        return { primary: 0xFF9800, accent: 0xFFD700 };
      default:
        return { primary: 0x666666, accent: 0x999999 };
    }
  }

  private drawStar(x: number, y: number, points: number, outerRadius: number, innerRadius: number) {
    const angle = Math.PI / points;
    this.rankIcon.beginPath();
    
    for (let i = 0; i < 2 * points; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const currentAngle = i * angle - Math.PI / 2;
      const px = x + Math.cos(currentAngle) * radius;
      const py = y + Math.sin(currentAngle) * radius;
      
      if (i === 0) {
        this.rankIcon.moveTo(px, py);
      } else {
        this.rankIcon.lineTo(px, py);
      }
    }
    
    this.rankIcon.closePath();
    this.rankIcon.strokePath();
  }

  private drawShield(x: number, y: number, size: number) {
    this.rankIcon.beginPath();
    this.rankIcon.moveTo(x, y - size);
    this.rankIcon.lineTo(x + size * 0.7, y - size * 0.5);
    this.rankIcon.lineTo(x + size * 0.7, y + size * 0.3);
    this.rankIcon.lineTo(x, y + size);
    this.rankIcon.lineTo(x - size * 0.7, y + size * 0.3);
    this.rankIcon.lineTo(x - size * 0.7, y - size * 0.5);
    this.rankIcon.closePath();
    this.rankIcon.strokePath();
  }

  private drawCrown(x: number, y: number, size: number) {
    this.rankIcon.beginPath();
    this.rankIcon.moveTo(x - size, y + size * 0.3);
    this.rankIcon.lineTo(x - size * 0.5, y - size * 0.5);
    this.rankIcon.lineTo(x - size * 0.2, y);
    this.rankIcon.lineTo(x, y - size);
    this.rankIcon.lineTo(x + size * 0.2, y);
    this.rankIcon.lineTo(x + size * 0.5, y - size * 0.5);
    this.rankIcon.lineTo(x + size, y + size * 0.3);
    this.rankIcon.lineTo(x - size, y + size * 0.3);
    this.rankIcon.strokePath();
  }

  private createProgressDisplay() {
    const progression = calculateRankProgression(this.playerProfile);
    
    if (!progression.nextRank) {
      // Max rank achieved
      this.progressText = this.scene.add.text(0, 20, 'Maximum Rank Achieved!', {
        fontSize: '16px',
        fontFamily: 'Inter, Arial, sans-serif',
        color: Theme.accentCyan,
        fontStyle: 'bold'
      }).setOrigin(0.5);
      
      // Create empty graphics for consistency
      this.progressBarBg = this.scene.add.graphics();
      this.progressBar = this.scene.add.graphics();
      return;
    }

    // Progress bar background
    this.progressBarBg = this.scene.add.graphics();
    this.progressBarBg.fillStyle(parseInt(Theme.secondaryDark.replace('#', ''), 16), 0.5);
    this.progressBarBg.fillRoundedRect(-100, 15, 200, 8, 4);

    // Progress bar fill
    this.progressBar = this.scene.add.graphics();
    const progressWidth = 200 * progression.progress;
    this.progressBar.fillStyle(parseInt(Theme.accentCyan.replace('#', ''), 16));
    this.progressBar.fillRoundedRect(-100, 15, progressWidth, 8, 4);

    // Progress text
    const nextRankReqs = RANK_REQUIREMENTS[progression.nextRank];
    const progressPercent = Math.round(progression.progress * 100);
    
    this.progressText = this.scene.add.text(0, 35, 
      `${progressPercent}% to ${progression.nextRank}`, {
      fontSize: '14px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textSecondary
    }).setOrigin(0.5);

    // Requirements text
    const reqText = `Need: ${nextRankReqs.minTotalFinds} finds, ${Math.round(nextRankReqs.minSuccessRate * 100)}% success rate`;
    this.scene.add.text(0, 50, reqText, {
      fontSize: '12px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: Theme.textMuted
    }).setOrigin(0.5);
  }

  public setPosition(x: number, y: number) {
    this.container.setPosition(x, y);
  }

  public destroy() {
    this.container.destroy();
  }
}