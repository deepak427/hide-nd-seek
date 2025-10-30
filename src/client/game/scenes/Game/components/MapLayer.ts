import { Scene } from 'phaser';
import { ObjectManager, HidingObject } from './ObjectManager';
import { VirtualMap, MapObject } from '../../../../../shared/types/game';
import { MapService } from '../../../../../shared/services/MapService';
import { Theme } from '../../../../style/theme';
import { PositionTracker, MapBounds } from '../../../utils/PositionTracker';

export class MapLayer {
  private map!: Phaser.GameObjects.Image;
  private objectManager!: ObjectManager;
  private mapData: VirtualMap | null = null;
  private interactiveObjects: Phaser.GameObjects.Image[] = [];
  private mapService: MapService;
  private positionTracker!: PositionTracker;

  constructor(private scene: Scene, private mapKey: string) {
    console.log(`🗺️ MapLayer constructor called with mapKey: ${mapKey}`);
    this.mapService = MapService.getInstance();
  }

  async create() {
    console.log('🗺️ MapLayer.create() called');
    const { width, height } = this.scene.scale;

    // Skip server loading and use fallback data directly for now
    console.log('📦 Using fallback map data (server disabled)...');
    this.mapData = this.createFallbackMapData();
    console.log('✅ Fallback map data loaded');

    // Create map image
    console.log('🖼️ Creating map image...');
    this.map = this.scene.add.image(width / 2, height / 2, this.mapKey).setOrigin(0.5);

    // Scale map to fit screen while maintaining aspect ratio
    const scaleX = (width * 0.9) / this.map.width;
    const scaleY = (height * 0.8) / this.map.height;
    const scale = Math.min(scaleX, scaleY);
    this.map.setScale(scale);
    console.log(`📏 Map scaled to ${scale.toFixed(2)}`);

    // Skip shadow pipeline for now to avoid issues
    // this.map.setPostPipeline('Shadow');

    // Initialize position tracker (Requirements 1.4, 1.5)
    console.log('📍 Initializing position tracker...');
    this.initializePositionTracker();

    // Create object manager
    console.log('🎯 Creating object manager...');
    this.objectManager = new ObjectManager(this.scene, this.map);

    // Create interactive objects on the map (Requirements 1.1, 1.2)
    console.log('🎮 Creating interactive objects...');
    this.createInteractiveObjects();

    console.log('✅ MapLayer created successfully');

    // Debug: Log object positions for verification
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 Object positions:', this.mapData.objects.map(obj => ({
        key: obj.key,
        relativePos: `(${obj.x}, ${obj.y})`,
        description: this.getPositionDescription(obj.x, obj.y)
      })));
    }
  }

  /**
   * Load map data from MapService
   * Requirements: 1.1 - Display interactive Virtual_Map
   */
  private async loadMapData() {
    try {
      this.mapData = await this.mapService.getMapData(this.mapKey);
      if (!this.mapData) {
        console.warn(`Map data not found for ${this.mapKey}, using fallback`);
        this.mapData = this.createFallbackMapData();
      }
    } catch (error) {
      console.error('Failed to load map data:', error);
      this.mapData = this.createFallbackMapData();
    }
  }

  /**
   * Create interactive objects on the map
   * Requirements: 1.2 - Allow selection of locations as hiding spots
   * Requirements: 1.3 - Provide visual feedback when location is selected
   */
  private createInteractiveObjects() {
    if (!this.mapData?.objects) return;

    const mapBounds = this.map.getBounds();

    this.mapData.objects.forEach((objData: MapObject, index) => {
      if (!objData.interactive) return;

      // Calculate position using relative coordinates (0-1) for proper scaling
      const x = mapBounds.x + (objData.x * mapBounds.width);
      const y = mapBounds.y + (objData.y * mapBounds.height);

      // Create interactive object sprite with appropriate scaling
      const objectSprite = this.scene.add.image(x, y, objData.key);

      // Scale objects appropriately based on map size and object type
      const baseScale = Math.min(mapBounds.width / 1200, mapBounds.height / 800);
      let objectScale = baseScale * 0.25; // Base scale for most objects

      // Adjust scale based on object type for realistic sizing
      switch (objData.key) {
        case 'guard':
          objectScale = baseScale * 0.35; // People should be more visible
          break;
        case 'car':
        case 'truck':
          objectScale = baseScale * 0.4; // Vehicles are larger
          break;
        case 'wardrobe':
          objectScale = baseScale * 0.3; // Furniture is medium-large
          break;
        case 'bush':
        case 'pumpkin':
          objectScale = baseScale * 0.2; // Smaller natural objects
          break;
        default:
          objectScale = baseScale * 0.25;
      }

      objectSprite.setScale(objectScale);
      objectSprite.setDepth(5);
      objectSprite.setData('objectKey', objData.key);
      objectSprite.setData('objectName', objData.name);
      objectSprite.setData('originalScale', objectScale);
      objectSprite.setData('isSelected', false);
      objectSprite.setData('relativeX', objData.x); // Store relative position
      objectSprite.setData('relativeY', objData.y); // Store relative position
      objectSprite.setData('objectIndex', index); // Store index for reference

      // Make it interactive (Requirements 1.2)
      objectSprite.setInteractive({
        pixelPerfect: true,
        useHandCursor: true
      });

      // Add hover effects (Requirements 1.3)
      this.addObjectHoverEffects(objectSprite);

      // Add click handling for selection
      this.addObjectClickHandling(objectSprite);

      this.interactiveObjects.push(objectSprite);
    });
  }

  /**
   * Add hover effects to objects for visual feedback
   * Requirements: 1.3 - Provide visual feedback when location is selected
   */
  private addObjectHoverEffects(objectSprite: Phaser.GameObjects.Image) {
    const originalScale = objectSprite.getData('originalScale');
    const isSelected = () => objectSprite.getData('isSelected');

    // Hover enter - subtle professional effects
    objectSprite.on('pointerover', () => {
      // Don't add hover effects if already selected
      if (isSelected()) return;

      // Subtle scale increase
      this.scene.tweens.add({
        targets: objectSprite,
        scaleX: originalScale * 1.1,
        scaleY: originalScale * 1.1,
        duration: 200,
        ease: 'Power2.easeOut'
      });

      // Subtle highlight tint
      objectSprite.setTint(0xffffff);

      // Minimal glow effect - much more professional
      const glow = this.scene.add.image(objectSprite.x, objectSprite.y, objectSprite.getData('objectKey'));
      glow.setScale(originalScale * 1.15);
      glow.setTintFill(parseInt(Theme.accentCyan.replace('#', ''), 16));
      glow.setAlpha(0.15); // Much more subtle
      glow.setDepth(4);
      glow.setName('hover-glow');

      objectSprite.setData('hoverGlow', glow);
    });

    // Hover exit
    objectSprite.on('pointerout', () => {
      // Don't remove effects if selected
      if (isSelected()) return;

      // Scale back to original
      this.scene.tweens.add({
        targets: objectSprite,
        scaleX: originalScale,
        scaleY: originalScale,
        duration: 200,
        ease: 'Power2.easeOut'
      });

      // Remove tint
      objectSprite.clearTint();

      // Remove glow effect
      const glow = objectSprite.getData('hoverGlow');
      if (glow) {
        glow.destroy();
        objectSprite.setData('hoverGlow', null);
      }
    });
  }

  /**
   * Add click handling for object selection
   * Requirements: 1.2 - Allow selection of locations as hiding spots
   * Requirements: 1.4, 1.5 - Track relative positions and provide visual feedback
   */
  private addObjectClickHandling(objectSprite: Phaser.GameObjects.Image) {
    objectSprite.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const objectKey = objectSprite.getData('objectKey');
      const objectName = objectSprite.getData('objectName');

      // Clear selection from other objects
      this.clearAllSelections();

      // Mark this object as selected
      objectSprite.setData('isSelected', true);

      // Track position using PositionTracker (Requirements 1.4, 1.5)
      const positionData = this.positionTracker.trackSelection(
        objectKey,
        pointer.worldX,
        pointer.worldY
      );

      // Validate position
      if (!positionData.isValid) {
        console.warn(`Invalid position selected for ${objectKey}:`, positionData);
        this.showInvalidPositionFeedback(objectSprite);
        return;
      }

      // Emit selection event for the Game scene to handle
      this.scene.events.emit('objectSelected', {
        objectKey,
        objectName,
        worldX: positionData.worldX,
        worldY: positionData.worldY,
        relX: positionData.relX,
        relY: positionData.relY,
        positionData
      });

      // Visual feedback for selection (Requirements 1.5)
      this.showSelectionFeedback(objectSprite);

      console.log(`🎯 Object selected: ${objectKey} at relative position (${positionData.relX.toFixed(3)}, ${positionData.relY.toFixed(3)})`);
    });
  }

  /**
   * Clear selection state from all objects
   */
  private clearAllSelections() {
    this.interactiveObjects.forEach(obj => {
      obj.setData('isSelected', false);

      // Remove any existing selection effects
      const selectionBorder = obj.getData('selectionBorder');
      if (selectionBorder) {
        selectionBorder.destroy();
        obj.setData('selectionBorder', null);
      }

      // Remove any hover glow effects
      const hoverGlow = obj.getData('hoverGlow');
      if (hoverGlow) {
        hoverGlow.destroy();
        obj.setData('hoverGlow', null);
      }

      // Reset scale and tint to original state
      const originalScale = obj.getData('originalScale');
      obj.setScale(originalScale);
      obj.clearTint();

      // Stop any running tweens on this object
      this.scene.tweens.killTweensOf(obj);
    });
  }

  /**
   * Initialize position tracker with current map bounds
   * Requirements: 1.4 - Track relative positions (relX, relY) for selected objects
   */
  private initializePositionTracker() {
    const mapBounds = this.getMapBounds();
    this.positionTracker = new PositionTracker(mapBounds);
  }

  /**
   * Get current map bounds for position calculations
   */
  private getMapBounds(): MapBounds {
    const bounds = this.map.getBounds();
    return {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height
    };
  }

  /**
   * Show feedback for invalid position selection
   * Requirements: 1.5 - Provide visual feedback for selections
   */
  private showInvalidPositionFeedback(objectSprite: Phaser.GameObjects.Image) {
    // Create error indicator
    const errorRing = this.scene.add.circle(
      objectSprite.x,
      objectSprite.y,
      50,
      parseInt(Theme.error.replace('#', ''), 16)
    );
    errorRing.setStrokeStyle(4, parseInt(Theme.error.replace('#', ''), 16));
    errorRing.setFillStyle(parseInt(Theme.error.replace('#', ''), 16), 0.1);
    errorRing.setDepth(6);

    // Flash animation
    this.scene.tweens.add({
      targets: errorRing,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 600,
      ease: 'Power2.easeOut',
      onComplete: () => {
        errorRing.destroy();
      }
    });

    // Shake the object
    this.scene.tweens.add({
      targets: objectSprite,
      x: objectSprite.x + 5,
      duration: 50,
      yoyo: true,
      repeat: 3,
      ease: 'Power2.easeInOut'
    });
  }

  /**
   * Show visual feedback when an object is selected
   * Requirements: 1.3 - Provide visual feedback when location is selected
   */
  private showSelectionFeedback(objectSprite: Phaser.GameObjects.Image) {
    const originalScale = objectSprite.getData('originalScale');

    // Create persistent selection border/glow
    const selectionBorder = this.scene.add.image(objectSprite.x, objectSprite.y, objectSprite.getData('objectKey'));
    selectionBorder.setScale(originalScale * 1.3);
    selectionBorder.setTintFill(parseInt(Theme.accentCyan.replace('#', ''), 16));
    selectionBorder.setAlpha(0.4);
    selectionBorder.setDepth(4);
    selectionBorder.setName('selection-border');

    // Store reference for cleanup
    objectSprite.setData('selectionBorder', selectionBorder);

    // Animate selection ring (temporary feedback)
    const selectionRing = this.scene.add.circle(
      objectSprite.x,
      objectSprite.y,
      30,
      parseInt(Theme.accentCyan.replace('#', ''), 16)
    );
    selectionRing.setStrokeStyle(2, parseInt(Theme.accentCyan.replace('#', ''), 16));
    selectionRing.setFillStyle(parseInt(Theme.accentCyan.replace('#', ''), 16), 0.1);
    selectionRing.setDepth(6);

    // Animate selection ring
    this.scene.tweens.add({
      targets: selectionRing,
      scaleX: 1.8,
      scaleY: 1.8,
      alpha: 0,
      duration: 600,
      ease: 'Power2.easeOut',
      onComplete: () => {
        selectionRing.destroy();
      }
    });

    // Scale up the selected object slightly and keep it highlighted
    this.scene.tweens.add({
      targets: objectSprite,
      scaleX: originalScale * 1.15,
      scaleY: originalScale * 1.15,
      duration: 300,
      ease: 'Power2.easeOut'
    });

    // Add subtle pulsing to the selection border
    this.scene.tweens.add({
      targets: selectionBorder,
      alpha: { from: 0.4, to: 0.2 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Keep object highlighted
    objectSprite.setTint(0xffffff);
  }

  /**
   * Create fallback map data when server data is unavailable - using only available assets
   * Objects positioned relative to map dimensions for proper scaling
   * Positioned based on the actual map layout:
   * - Top half: Outdoor scene (ground/field left, veranda center, road right)
   * - Bottom half: Indoor hall/mansion interior
   */
  private createFallbackMapData(): VirtualMap {
    return {
      key: this.mapKey,
      name: 'Demo Map',
      theme: 'indoor',
      releaseDate: Date.now(),
      backgroundAsset: this.mapKey,
      objects: [
        // OUTDOOR OBJECTS (Top half of map)
        // Bush - in the ground/field area (top-left)
        { key: 'bush', name: 'Bush', x: 0.15, y: 0.25, width: 40, height: 40, interactive: true },

        // Pumpkin - on the veranda/deck area (top-center)
        { key: 'pumpkin', name: 'Pumpkin', x: 0.5, y: 0.28, width: 35, height: 35, interactive: true },

        // Car - on the road (top-right)
        { key: 'car', name: 'Car', x: 0.75, y: 0.32, width: 60, height: 30, interactive: true },

        // Truck - on the road, slightly different position than car
        { key: 'truck', name: 'Truck', x: 0.85, y: 0.25, width: 70, height: 35, interactive: true },

        // INDOOR OBJECTS (Bottom half of map)
        // Guard - at the door/entrance of the hall (bottom-center)
        { key: 'guard', name: 'Guard', x: 0.5, y: 0.75, width: 25, height: 45, interactive: true },

        // Wardrobe - in the hall near the side (bottom-left area)
        { key: 'wardrobe', name: 'Wardrobe', x: 0.2, y: 0.8, width: 45, height: 80, interactive: true }
      ]
    };
  }

  // Method to add a specific object at a location (for guessing mode)
  addHiddenObject(objectKey: string, relX: number, relY: number) {
    this.objectManager.add(objectKey, relX, relY);
  }

  resize() {
    const { width, height } = this.scene.scale;

    // Reposition and rescale map
    this.map.setPosition(width / 2, height / 2);
    const scaleX = (width * 0.9) / this.map.width;
    const scaleY = (height * 0.8) / this.map.height;
    const scale = Math.min(scaleX, scaleY);
    this.map.setScale(scale);

    // Update position tracker with new bounds (Requirements 1.4)
    if (this.positionTracker) {
      const newBounds = this.getMapBounds();
      this.positionTracker.updateMapBounds(newBounds);
    }

    // Update object positions
    this.objectManager.reposition();

    // Reposition interactive objects
    this.repositionInteractiveObjects();
  }

  /**
   * Reposition interactive objects after resize
   * Requirements: 1.4 - Maintain relative positions during resize
   */
  private repositionInteractiveObjects() {
    if (!this.mapData?.objects) return;

    const mapBounds = this.map.getBounds();

    this.interactiveObjects.forEach((objectSprite) => {
      // Use stored relative coordinates for accurate positioning
      const relativeX = objectSprite.getData('relativeX');
      const relativeY = objectSprite.getData('relativeY');

      if (relativeX !== undefined && relativeY !== undefined) {
        // Recalculate position using stored relative coordinates
        const x = mapBounds.x + (relativeX * mapBounds.width);
        const y = mapBounds.y + (relativeY * mapBounds.height);

        objectSprite.setPosition(x, y);

        // Update scale based on new map size and object type
        const baseScale = Math.min(mapBounds.width / 1200, mapBounds.height / 800);
        const objectKey = objectSprite.getData('objectKey');
        let objectScale = baseScale * 0.25; // Base scale

        // Apply same scaling rules as creation
        switch (objectKey) {
          case 'guard':
            objectScale = baseScale * 0.35;
            break;
          case 'car':
          case 'truck':
            objectScale = baseScale * 0.4;
            break;
          case 'wardrobe':
            objectScale = baseScale * 0.3;
            break;
          case 'bush':
          case 'pumpkin':
            objectScale = baseScale * 0.2;
            break;
          default:
            objectScale = baseScale * 0.25;
        }

        objectSprite.setScale(objectScale);
        objectSprite.setData('originalScale', objectScale);

        // Reposition selection border if it exists
        const selectionBorder = objectSprite.getData('selectionBorder');
        if (selectionBorder) {
          selectionBorder.setPosition(x, y);
          selectionBorder.setScale(objectScale * 1.3);
        }

        // Reposition hover glow if it exists
        const hoverGlow = objectSprite.getData('hoverGlow');
        if (hoverGlow) {
          hoverGlow.setPosition(x, y);
          hoverGlow.setScale(objectScale * 1.15);
        }
      }
    });
  }

  getMap(): Phaser.GameObjects.Image {
    return this.map;
  }

  getObjects(): HidingObject[] {
    return this.objectManager.getAll();
  }

  getMapKey(): string {
    return this.mapKey;
  }

  /**
   * Get position tracker for external access
   * Requirements: 1.4 - Access to position tracking functionality
   */
  getPositionTracker(): PositionTracker {
    return this.positionTracker;
  }

  /**
   * Get tracked position for a specific object
   * Requirements: 1.4 - Track relative positions (relX, relY) for selected objects
   */
  getTrackedPosition(objectKey: string) {
    return this.positionTracker?.getTrackedPosition(objectKey) || null;
  }

  /**
   * Get all tracked positions
   * Requirements: 1.4 - Access to all position tracking data
   */
  getAllTrackedPositions() {
    return this.positionTracker?.getAllTrackedPositions() || new Map();
  }

  /**
   * Export position data for game creation
   * Requirements: 1.4 - Export relative positions for game data
   */
  exportPositionData() {
    return this.positionTracker?.exportPositionData() || [];
  }

  /**
   * Get position tracking statistics
   * Requirements: 1.5 - Position validation and feedback
   */
  getPositionStats() {
    return this.positionTracker?.getPositionStats() || {
      totalTracked: 0,
      validPositions: 0,
      invalidPositions: 0,
      averageRelX: 0,
      averageRelY: 0
    };
  }

  /**
   * Get a description of where an object is positioned on the map
   */
  private getPositionDescription(x: number, y: number): string {
    if (x < 0.3 && y < 0.5) return 'top-left area';
    if (x > 0.7 && y < 0.5) return 'top-right area';
    if (x < 0.3 && y > 0.7) return 'bottom-left area';
    if (x > 0.7 && y > 0.7) return 'bottom-right area';
    if (x >= 0.3 && x <= 0.7 && y < 0.5) return 'top-center area';
    if (x >= 0.3 && x <= 0.7 && y > 0.7) return 'bottom-center area';
    if (x < 0.3) return 'left side';
    if (x > 0.7) return 'right side';
    return 'center area';
  }

  destroy() {
    // Clean up interactive objects
    this.interactiveObjects.forEach(obj => obj.destroy());
    this.interactiveObjects = [];

    // Clean up position tracker
    if (this.positionTracker) {
      this.positionTracker.clearAllTrackedPositions();
    }

    if (this.map) this.map.destroy();
    if (this.objectManager) this.objectManager.destroy();
  }
}