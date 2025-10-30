import { Scene } from 'phaser';
import { Theme } from '../../../../style/theme';
import { RelativePosition } from '../../../../shared/types/game';

export type HidingObject = {
  key: string;
  relX: number;
  relY: number;
  sprite: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
  found: boolean;
  selected: boolean;
  interactive: boolean;
};

export class ObjectManager {
  private objects: HidingObject[] = [];
  private selectedObject: HidingObject | null = null;

  constructor(private scene: Scene, private map: Phaser.GameObjects.Image) {}

  add(key: string, relX: number, relY: number, interactive: boolean = true) {
    const { x, y, width, height } = this.map.getBounds();

    // Create main sprite
    const sprite = this.scene.add.image(x + width * relX, y + height * relY, key);
    sprite.setDepth(3);
    sprite.setData('objectKey', key);
    sprite.setData('relX', relX);
    sprite.setData('relY', relY);
    
    // Scale based on map scale
    const baseScale = this.map.scale * 0.25;
    sprite.setScale(baseScale);
    
    // Create glow effect
    const glow = this.scene.add.image(sprite.x, sprite.y, key)
      .setTintFill(parseInt(Theme.accentCyan.replace('#', ''), 16))
      .setAlpha(0)
      .setDepth(2)
      .setScale(baseScale * 1.2);

    // Make interactive if specified (Requirements 1.2)
    if (interactive) {
      sprite.setInteractive({ pixelPerfect: true, useHandCursor: true });
      
      // Add hover effects (Requirements 1.3)
      sprite.on('pointerover', () => {
        const obj = this.objects.find(o => o.sprite === sprite);
        if (obj && !obj.found && !obj.selected) {
          this.showHoverEffect(sprite, glow);
        }
      });

      sprite.on('pointerout', () => {
        const obj = this.objects.find(o => o.sprite === sprite);
        if (obj && !obj.found && !obj.selected) {
          this.hideHoverEffect(sprite, glow);
        }
      });

      // Add click handling for selection
      sprite.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        this.selectObject(key, pointer);
      });
    }

    // Add subtle idle animation
    this.scene.tweens.add({
      targets: sprite,
      scaleX: baseScale * 1.05,
      scaleY: baseScale * 1.05,
      duration: 2000 + Math.random() * 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const hidingObject: HidingObject = { 
      key, 
      relX, 
      relY, 
      sprite, 
      glow, 
      found: false,
      selected: false,
      interactive
    };

    this.objects.push(hidingObject);
    return hidingObject;
  }

  /**
   * Select an object and provide visual feedback
   * Requirements: 1.4, 1.5 - Track relative positions and provide visual feedback
   */
  selectObject(key: string, pointer?: Phaser.Input.Pointer) {
    // Deselect previous object
    if (this.selectedObject) {
      this.deselectObject(this.selectedObject.key);
    }

    const obj = this.objects.find(o => o.key === key);
    if (!obj || !obj.interactive) return;

    obj.selected = true;
    this.selectedObject = obj;

    // Visual feedback for selection
    this.showSelectionEffect(obj.sprite, obj.glow);

    // Calculate position data
    const mapBounds = this.map.getBounds();
    const worldX = obj.sprite.x;
    const worldY = obj.sprite.y;

    // Emit selection event with position data (Requirements 1.4, 1.5)
    this.scene.events.emit('objectSelected', {
      objectKey: key,
      worldX,
      worldY,
      relX: obj.relX,
      relY: obj.relY,
      mapBounds
    });

    return obj;
  }

  /**
   * Deselect an object
   */
  deselectObject(key: string) {
    const obj = this.objects.find(o => o.key === key);
    if (!obj) return;

    obj.selected = false;
    if (obj === this.selectedObject) {
      this.selectedObject = null;
    }

    // Remove selection effects
    this.hideSelectionEffect(obj.sprite, obj.glow);
  }

  /**
   * Show selection visual effects
   * Requirements: 1.3 - Provide visual feedback when location is selected
   */
  private showSelectionEffect(sprite: Phaser.GameObjects.Image, glow: Phaser.GameObjects.Image) {
    // Show persistent glow for selected object
    this.scene.tweens.add({
      targets: glow,
      alpha: 0.6,
      duration: 300,
      ease: 'Power2.easeOut'
    });

    // Scale up selected object
    this.scene.tweens.add({
      targets: sprite,
      scaleX: sprite.scaleX * 1.2,
      scaleY: sprite.scaleY * 1.2,
      duration: 300,
      ease: 'Power2.easeOut'
    });

    // Add selection ring
    const selectionRing = this.scene.add.circle(
      sprite.x, 
      sprite.y, 
      50, 
      parseInt(Theme.accentCyan.replace('#', ''), 16)
    );
    selectionRing.setStrokeStyle(4, parseInt(Theme.accentCyan.replace('#', ''), 16));
    selectionRing.setFillStyle(parseInt(Theme.accentCyan.replace('#', ''), 16), 0.1);
    selectionRing.setDepth(1);
    selectionRing.setName(`selection-ring-${sprite.getData('objectKey')}`);

    // Pulse animation for selection ring
    this.scene.tweens.add({
      targets: selectionRing,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0.8,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Hide selection visual effects
   */
  private hideSelectionEffect(sprite: Phaser.GameObjects.Image, glow: Phaser.GameObjects.Image) {
    // Hide glow
    this.scene.tweens.add({
      targets: glow,
      alpha: 0,
      duration: 300,
      ease: 'Power2.easeOut'
    });

    // Reset scale
    const baseScale = this.map.scale * 0.25;
    this.scene.tweens.add({
      targets: sprite,
      scaleX: baseScale,
      scaleY: baseScale,
      duration: 300,
      ease: 'Power2.easeOut'
    });

    // Remove selection ring
    const selectionRing = this.scene.children.getByName(`selection-ring-${sprite.getData('objectKey')}`);
    if (selectionRing) {
      selectionRing.destroy();
    }
  }

  private showHoverEffect(sprite: Phaser.GameObjects.Image, glow: Phaser.GameObjects.Image) {
    // Glow animation
    this.scene.tweens.add({
      targets: glow,
      alpha: 0.4,
      duration: Theme.animationFast,
      ease: 'Power2'
    });
    
    // Scale animation
    this.scene.tweens.add({
      targets: sprite,
      scaleX: sprite.scaleX * 1.1,
      scaleY: sprite.scaleY * 1.1,
      duration: Theme.animationFast,
      ease: 'Power2'
    });
  }

  private hideHoverEffect(sprite: Phaser.GameObjects.Image, glow: Phaser.GameObjects.Image) {
    // Hide glow
    this.scene.tweens.add({
      targets: glow,
      alpha: 0,
      duration: Theme.animationFast,
      ease: 'Power2'
    });
    
    // Reset scale
    const baseScale = this.map.scale * 0.25;
    this.scene.tweens.add({
      targets: sprite,
      scaleX: baseScale,
      scaleY: baseScale,
      duration: Theme.animationFast,
      ease: 'Power2'
    });
  }

  reposition() {
    const { x, y, width, height } = this.map.getBounds();
    const baseScale = this.map.scale * 0.25;
    
    this.objects.forEach(obj => {
      const nx = x + width * obj.relX;
      const ny = y + height * obj.relY;
      
      obj.sprite.setPosition(nx, ny);
      obj.glow.setPosition(nx, ny);
      obj.sprite.setScale(baseScale);
      obj.glow.setScale(baseScale * 1.2);
    });
  }

  markAsFound(key: string) {
    const obj = this.objects.find(o => o.key === key);
    if (obj) {
      obj.found = true;
      
      // Visual feedback for found object
      obj.sprite.setTint(parseInt(Theme.success.replace('#', ''), 16));
      obj.sprite.setAlpha(0.7);
      
      // Disable further interactions
      obj.sprite.disableInteractive();
    }
  }

  /**
   * Get the currently selected object
   */
  getSelectedObject(): HidingObject | null {
    return this.selectedObject;
  }

  /**
   * Get object by key
   */
  getObject(key: string): HidingObject | null {
    return this.objects.find(obj => obj.key === key) || null;
  }

  /**
   * Clear all selections
   */
  clearSelections() {
    if (this.selectedObject) {
      this.deselectObject(this.selectedObject.key);
    }
  }

  /**
   * Get all objects
   */
  getAll(): HidingObject[] {
    return this.objects;
  }

  /**
   * Get interactive objects only
   */
  getInteractiveObjects(): HidingObject[] {
    return this.objects.filter(obj => obj.interactive);
  }

  getFoundCount(): number {
    return this.objects.filter(obj => obj.found).length;
  }

  getTotalCount(): number {
    return this.objects.length;
  }

  /**
   * Enable/disable interactivity for all objects
   */
  setInteractivity(enabled: boolean) {
    this.objects.forEach(obj => {
      if (obj.interactive) {
        if (enabled) {
          obj.sprite.setInteractive();
        } else {
          obj.sprite.disableInteractive();
        }
      }
    });
  }

  destroy() {
    this.objects.forEach(obj => {
      // Clean up selection rings
      const selectionRing = this.scene.children.getByName(`selection-ring-${obj.key}`);
      if (selectionRing) {
        selectionRing.destroy();
      }
      
      obj.sprite.destroy();
      obj.glow.destroy();
    });
    this.objects = [];
    this.selectedObject = null;
  }
}