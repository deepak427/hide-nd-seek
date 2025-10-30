import { Scene } from 'phaser';
import { Theme } from '../../../../style/theme';

export interface UIButtonOptions {
  fontSize?: string;
  backgroundColor?: string;
  hoverColor?: string;
  textColor?: string;
  width?: number;
  height?: number;
  borderRadius?: number;
  shadowOffset?: number;
}

export class UIButton {
  public container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;
  private shadow: Phaser.GameObjects.Graphics;
  private options: Required<UIButtonOptions>;
  private clickCallback?: () => void;
  private isHovered = false;
  private isPressed = false;

  constructor(
    private scene: Scene,
    x: number,
    y: number,
    label: string,
    options: UIButtonOptions = {}
  ) {
    // Set default options
    this.options = {
      fontSize: '24px',
      backgroundColor: Theme.accentCyan,
      hoverColor: Theme.accentHover,
      textColor: Theme.lightGray,
      width: 200,
      height: 60,
      borderRadius: Theme.radiusMedium,
      shadowOffset: 4,
      ...options
    };

    this.container = this.scene.add.container(x, y);
    this.createButton(label);
    this.setupInteractions();
  }

  private createButton(label: string) {
    // Create shadow
    this.shadow = this.scene.add.graphics();
    this.shadow.fillStyle(0x000000, 0.3);
    this.shadow.fillRoundedRect(
      -this.options.width / 2 + this.options.shadowOffset,
      -this.options.height / 2 + this.options.shadowOffset,
      this.options.width,
      this.options.height,
      this.options.borderRadius
    );

    // Create background
    this.background = this.scene.add.graphics();
    this.updateBackground(this.options.backgroundColor);

    // Create text
    this.text = this.scene.add.text(0, 0, label, {
      fontSize: this.options.fontSize,
      fontFamily: 'Inter, Arial, sans-serif',
      color: this.options.textColor,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Add to container
    this.container.add([this.shadow, this.background, this.text]);
    this.container.setSize(this.options.width, this.options.height);
  }

  private updateBackground(color: string) {
    this.background.clear();
    this.background.fillStyle(parseInt(color.replace('#', ''), 16));
    this.background.fillRoundedRect(
      -this.options.width / 2,
      -this.options.height / 2,
      this.options.width,
      this.options.height,
      this.options.borderRadius
    );

    // Add subtle gradient effect
    this.background.lineStyle(2, parseInt(color.replace('#', ''), 16), 0.3);
    this.background.strokeRoundedRect(
      -this.options.width / 2,
      -this.options.height / 2,
      this.options.width,
      this.options.height,
      this.options.borderRadius
    );
  }

  private setupInteractions() {
    this.container.setInteractive(
      new Phaser.Geom.Rectangle(
        -this.options.width / 2,
        -this.options.height / 2,
        this.options.width,
        this.options.height
      ),
      Phaser.Geom.Rectangle.Contains
    );

    // Hover effects
    this.container.on('pointerover', () => {
      if (!this.isPressed) {
        this.onHover();
      }
    });

    this.container.on('pointerout', () => {
      if (!this.isPressed) {
        this.onHoverOut();
      }
    });

    // Click effects
    this.container.on('pointerdown', () => {
      this.onPress();
    });

    this.container.on('pointerup', () => {
      this.onRelease();
      if (this.clickCallback) {
        this.clickCallback();
      }
    });
  }

  private onHover() {
    this.isHovered = true;
    this.updateBackground(this.options.hoverColor);
    
    // Scale animation
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: Theme.animationFast,
      ease: 'Power2'
    });

    // Shadow animation
    this.scene.tweens.add({
      targets: this.shadow,
      alpha: 0.5,
      duration: Theme.animationFast,
      ease: 'Power2'
    });
  }

  private onHoverOut() {
    this.isHovered = false;
    this.updateBackground(this.options.backgroundColor);
    
    // Scale animation
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1,
      scaleY: 1,
      duration: Theme.animationFast,
      ease: 'Power2'
    });

    // Shadow animation
    this.scene.tweens.add({
      targets: this.shadow,
      alpha: 0.3,
      duration: Theme.animationFast,
      ease: 'Power2'
    });
  }

  private onPress() {
    this.isPressed = true;
    
    // Press animation
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 0.95,
      scaleY: 0.95,
      duration: 100,
      ease: 'Power2'
    });

    // Move shadow
    this.scene.tweens.add({
      targets: this.shadow,
      x: this.options.shadowOffset / 2,
      y: this.options.shadowOffset / 2,
      duration: 100,
      ease: 'Power2'
    });
  }

  private onRelease() {
    this.isPressed = false;
    
    // Release animation
    const targetScale = this.isHovered ? 1.05 : 1;
    this.scene.tweens.add({
      targets: this.container,
      scaleX: targetScale,
      scaleY: targetScale,
      duration: 150,
      ease: 'Back.easeOut'
    });

    // Reset shadow
    this.scene.tweens.add({
      targets: this.shadow,
      x: 0,
      y: 0,
      duration: 150,
      ease: 'Power2'
    });
  }

  public onClick(callback: () => void) {
    this.clickCallback = callback;
  }

  public setPosition(x: number, y: number) {
    this.container.setPosition(x, y);
  }

  public setVisible(visible: boolean) {
    this.container.setVisible(visible);
  }

  public destroy() {
    this.container.destroy();
  }
}