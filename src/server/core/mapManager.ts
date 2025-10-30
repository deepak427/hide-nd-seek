/**
 * Map Manager - Server-side map data management
 * Requirements: 5.1, 5.2, 5.4 - Map data management and monthly rotation
 */

import type { VirtualMap, MonthlyMapRotation } from '../../shared/types/game';
import { GAME_CONFIG, MAP_THEMES } from '../../shared/constants/game';

export class MapManager {
  private static instance: MapManager;
  private mapDatabase: Map<string, VirtualMap> = new Map();
  private currentRotation: MonthlyMapRotation | null = null;

  private constructor() {
    this.initializeMaps();
  }

  public static getInstance(): MapManager {
    if (!MapManager.instance) {
      MapManager.instance = new MapManager();
    }
    return MapManager.instance;
  }

  /**
   * Initialize default maps
   */
  private initializeMaps(): void {
    // Create sample maps for each theme
    const maps: VirtualMap[] = [
      {
        key: 'cozy-bedroom',
        name: 'Cozy Bedroom',
        theme: MAP_THEMES.INDOOR,
        releaseDate: this.getCurrentMonthStart(),
        backgroundAsset: 'bedroom-bg',
        objects: [
          { key: 'pumpkin', name: 'Pumpkin', x: 150, y: 200, width: 32, height: 32, interactive: true },
          { key: 'wardrobe', name: 'Wardrobe', x: 300, y: 150, width: 64, height: 128, interactive: true },
          { key: 'bed', name: 'Bed', x: 500, y: 300, width: 128, height: 64, interactive: true },
          { key: 'desk', name: 'Desk', x: 100, y: 400, width: 96, height: 48, interactive: true },
          { key: 'lamp', name: 'Lamp', x: 450, y: 100, width: 24, height: 48, interactive: true },
          { key: 'chair', name: 'Chair', x: 120, y: 380, width: 40, height: 40, interactive: false },
          { key: 'window', name: 'Window', x: 600, y: 50, width: 80, height: 100, interactive: false }
        ],
        difficulty: 'easy'
      },
      {
        key: 'modern-kitchen',
        name: 'Modern Kitchen',
        theme: MAP_THEMES.INDOOR,
        releaseDate: this.getNextMonthStart(),
        backgroundAsset: 'kitchen-bg',
        objects: [
          { key: 'cup', name: 'Coffee Cup', x: 200, y: 150, width: 24, height: 32, interactive: true },
          { key: 'book', name: 'Recipe Book', x: 350, y: 180, width: 48, height: 32, interactive: true },
          { key: 'fridge', name: 'Refrigerator', x: 100, y: 100, width: 80, height: 160, interactive: true },
          { key: 'stove', name: 'Stove', x: 400, y: 200, width: 96, height: 64, interactive: true },
          { key: 'sink', name: 'Kitchen Sink', x: 250, y: 220, width: 80, height: 40, interactive: true },
          { key: 'microwave', name: 'Microwave', x: 500, y: 120, width: 60, height: 40, interactive: false },
          { key: 'toaster', name: 'Toaster', x: 320, y: 200, width: 40, height: 24, interactive: false }
        ],
        difficulty: 'medium'
      },
      {
        key: 'enchanted-forest',
        name: 'Enchanted Forest',
        theme: MAP_THEMES.NATURE,
        releaseDate: this.getMonthStart(2),
        backgroundAsset: 'forest-bg',
        objects: [
          { key: 'mushroom', name: 'Magic Mushroom', x: 180, y: 350, width: 32, height: 40, interactive: true },
          { key: 'tree-hollow', name: 'Tree Hollow', x: 120, y: 200, width: 48, height: 64, interactive: true },
          { key: 'fairy-ring', name: 'Fairy Ring', x: 400, y: 300, width: 80, height: 80, interactive: true },
          { key: 'crystal', name: 'Crystal', x: 300, y: 150, width: 24, height: 32, interactive: true },
          { key: 'owl', name: 'Wise Owl', x: 150, y: 100, width: 40, height: 48, interactive: true },
          { key: 'big-tree', name: 'Ancient Tree', x: 100, y: 50, width: 120, height: 200, interactive: false },
          { key: 'flowers', name: 'Wild Flowers', x: 350, y: 380, width: 60, height: 30, interactive: false }
        ],
        difficulty: 'hard'
      },
      {
        key: 'octmap',
        name: 'Demo Map',
        theme: MAP_THEMES.INDOOR,
        releaseDate: this.getCurrentMonthStart(),
        backgroundAsset: 'octmap',
        objects: [
          { key: 'pumpkin', name: 'Pumpkin', x: 0.82, y: 0.75, width: 32, height: 32, interactive: true },
          { key: 'wardrobe', name: 'Wardrobe', x: 0.15, y: 0.63, width: 64, height: 128, interactive: true },
          { key: 'bush', name: 'Bush', x: 0.25, y: 0.8, width: 32, height: 32, interactive: true },
          { key: 'car', name: 'Car', x: 0.44, y: 0.87, width: 64, height: 32, interactive: true },
          { key: 'truck', name: 'Truck', x: 0.69, y: 0.83, width: 64, height: 32, interactive: true },
          { key: 'guard', name: 'Guard', x: 0.5, y: 0.58, width: 32, height: 48, interactive: true }
        ],
        difficulty: 'easy'
      }
    ];

    // Store maps in database
    maps.forEach(map => {
      this.mapDatabase.set(map.key, map);
    });

    // Set current rotation
    this.updateCurrentRotation();
  }

  /**
   * Get current monthly map rotation
   */
  public getCurrentRotation(): MonthlyMapRotation {
    if (!this.currentRotation || this.shouldRotateMap()) {
      this.updateCurrentRotation();
    }

    return this.currentRotation!;
  }

  /**
   * Get specific map by key
   */
  public getMap(mapKey: string): VirtualMap | null {
    return this.mapDatabase.get(mapKey) || null;
  }

  /**
   * Get all available maps
   */
  public getAllMaps(): VirtualMap[] {
    return Array.from(this.mapDatabase.values());
  }

  /**
   * Check if map rotation should occur
   */
  private shouldRotateMap(): boolean {
    if (!this.currentRotation) return true;

    const now = Date.now();
    const nextRotationDate = this.getNextRotationDate();
    
    return now >= nextRotationDate;
  }

  /**
   * Update current rotation to the appropriate map for this month
   */
  private updateCurrentRotation(): void {
    const allMaps = this.getAllMaps();
    
    if (allMaps.length === 0) {
      throw new Error('No maps available for rotation');
    }
    
    const currentMap = this.getCurrentMonthMap(allMaps);
    const previousMaps = this.getPreviousMaps(allMaps, currentMap);

    this.currentRotation = {
      currentMap,
      previousMaps,
      nextRotationDate: this.getNextRotationDate(),
      rotationHistory: this.generateRotationHistory()
    };
  }

  /**
   * Get the map for the current month
   */
  private getCurrentMonthMap(maps: VirtualMap[]): VirtualMap {
    if (maps.length === 0) {
      throw new Error('No maps available');
    }
    
    // Use month index to cycle through available maps
    const now = new Date();
    const monthIndex = now.getMonth() % maps.length;
    
    // Sort maps by key for consistent ordering
    const sortedMaps = maps.sort((a, b) => a.key.localeCompare(b.key));
    
    const selectedMap = sortedMaps[monthIndex];
    if (!selectedMap) {
      throw new Error(`No map found at index ${monthIndex}`);
    }
    
    return selectedMap;
  }

  /**
   * Get previous maps (excluding current)
   */
  private getPreviousMaps(allMaps: VirtualMap[], currentMap: VirtualMap): VirtualMap[] {
    return allMaps.filter(map => map.key !== currentMap.key);
  }

  /**
   * Generate rotation history for the past year
   */
  private generateRotationHistory(): Array<{ mapKey: string; startDate: number; endDate: number }> {
    const history: Array<{ mapKey: string; startDate: number; endDate: number }> = [];
    const allMaps = this.getAllMaps().sort((a, b) => a.key.localeCompare(b.key));
    
    // Generate history for past 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const mapIndex = date.getMonth() % allMaps.length;
      const map = allMaps[mapIndex];
      
      if (map) {
        history.push({
          mapKey: map.key,
          startDate: startDate.getTime(),
          endDate: endDate.getTime()
        });
      }
    }
    
    return history;
  }

  /**
   * Get next rotation date (first day of next month)
   */
  private getNextRotationDate(): number {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, GAME_CONFIG.MONTHLY_ROTATION_DAY);
    return nextMonth.getTime();
  }

  /**
   * Get start of current month
   */
  private getCurrentMonthStart(): number {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  }

  /**
   * Get start of next month
   */
  private getNextMonthStart(): number {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
  }

  /**
   * Get start of month N months from now
   */
  private getMonthStart(monthsFromNow: number): number {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + monthsFromNow, 1).getTime();
  }

  /**
   * Add a new map to the database
   */
  public addMap(map: VirtualMap): void {
    this.mapDatabase.set(map.key, map);
  }

  /**
   * Remove a map from the database
   */
  public removeMap(mapKey: string): boolean {
    return this.mapDatabase.delete(mapKey);
  }

  /**
   * Force rotation to next map (for testing)
   */
  public forceRotation(): void {
    this.updateCurrentRotation();
  }

  /**
   * Get map statistics
   */
  public getStats(): {
    totalMaps: number;
    currentMapKey: string;
    nextRotationDate: number;
    rotationHistory: number;
  } {
    const rotation = this.getCurrentRotation();
    
    return {
      totalMaps: this.mapDatabase.size,
      currentMapKey: rotation.currentMap.key,
      nextRotationDate: rotation.nextRotationDate,
      rotationHistory: rotation.rotationHistory.length
    };
  }
}