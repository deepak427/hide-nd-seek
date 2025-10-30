/**
 * Map Service - Handles map data management and monthly rotation
 * Requirements: 5.1, 5.4 - Monthly map rotation and map data management
 */

import type { VirtualMap, MonthlyMapRotation } from '../types/game';
import { GAME_CONFIG, MAP_THEMES } from '../constants/game';

export class MapService {
  private static instance: MapService;
  private mapCache: Map<string, VirtualMap> = new Map();
  private currentRotation: MonthlyMapRotation | null = null;

  private constructor() {}

  public static getInstance(): MapService {
    if (!MapService.instance) {
      MapService.instance = new MapService();
    }
    return MapService.instance;
  }

  /**
   * Get the current monthly map
   * Requirements: 5.1 - Display current monthly map with metadata
   */
  public async getCurrentMonthlyMap(): Promise<VirtualMap | null> {
    try {
      // Check if we have cached rotation data
      if (this.currentRotation && this.isCurrentMapValid()) {
        return this.currentRotation.currentMap;
      }

      // Fetch current rotation from server
      const rotation = await this.fetchCurrentRotation();
      if (rotation) {
        this.currentRotation = rotation;
        return rotation.currentMap;
      }

      // Fallback to demo map
      return this.createDemoMap();
    } catch (error) {
      console.error('Failed to get current monthly map:', error);
      return this.createDemoMap();
    }
  }

  /**
   * Get map rotation information
   * Requirements: 5.2 - Handle monthly map rotation logic
   */
  public async getMapRotation(): Promise<MonthlyMapRotation | null> {
    try {
      if (this.currentRotation && this.isCurrentMapValid()) {
        return this.currentRotation;
      }

      return await this.fetchCurrentRotation();
    } catch (error) {
      console.error('Failed to get map rotation:', error);
      return null;
    }
  }

  /**
   * Get specific map data by key
   * Requirements: 5.2 - Map loading and caching system
   */
  public async getMapData(mapKey: string): Promise<VirtualMap | null> {
    try {
      // Check cache first
      if (this.mapCache.has(mapKey)) {
        return this.mapCache.get(mapKey)!;
      }

      // Fetch from server
      const mapData = await this.fetchMapData(mapKey);
      if (mapData) {
        this.mapCache.set(mapKey, mapData);
        return mapData;
      }

      return null;
    } catch (error) {
      console.error(`Failed to get map data for ${mapKey}:`, error);
      return null;
    }
  }

  /**
   * Check if current map rotation is still valid
   * Requirements: 5.4 - Monthly map rotation logic
   */
  private isCurrentMapValid(): boolean {
    if (!this.currentRotation) return false;

    const now = Date.now();
    const nextRotation = this.getNextRotationDate();
    
    return now < nextRotation;
  }

  /**
   * Get the next rotation date (first day of next month)
   * Requirements: 5.4 - Monthly map rotation logic
   */
  private getNextRotationDate(): number {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, GAME_CONFIG.MONTHLY_ROTATION_DAY);
    return nextMonth.getTime();
  }

  /**
   * Fetch current rotation data from server
   */
  private async fetchCurrentRotation(): Promise<MonthlyMapRotation | null> {
    try {
      const response = await fetch('/api/map/rotation');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.rotation;
    } catch (error) {
      console.error('Failed to fetch rotation data:', error);
      return null;
    }
  }

  /**
   * Fetch specific map data from server
   */
  private async fetchMapData(mapKey: string): Promise<VirtualMap | null> {
    try {
      const response = await fetch(`/api/map/${mapKey}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.map;
    } catch (error) {
      console.error(`Failed to fetch map data for ${mapKey}:`, error);
      return null;
    }
  }

  /**
   * Create a demo map for fallback purposes
   */
  private createDemoMap(): VirtualMap {
    return {
      key: 'demo-bedroom',
      name: 'Cozy Bedroom',
      theme: MAP_THEMES.INDOOR,
      releaseDate: this.getCurrentMonthStart(),
      backgroundAsset: 'bedroom-bg',
      objects: [
        {
          key: 'pumpkin',
          name: 'Pumpkin',
          x: 150,
          y: 200,
          width: 32,
          height: 32,
          interactive: true
        },
        {
          key: 'wardrobe',
          name: 'Wardrobe',
          x: 300,
          y: 150,
          width: 64,
          height: 128,
          interactive: true
        },
        {
          key: 'bed',
          name: 'Bed',
          x: 500,
          y: 300,
          width: 128,
          height: 64,
          interactive: true
        },
        {
          key: 'desk',
          name: 'Desk',
          x: 100,
          y: 400,
          width: 96,
          height: 48,
          interactive: true
        },
        {
          key: 'lamp',
          name: 'Lamp',
          x: 450,
          y: 100,
          width: 24,
          height: 48,
          interactive: true
        }
      ],
      difficulty: 'easy'
    };
  }

  /**
   * Get the start of the current month
   */
  private getCurrentMonthStart(): number {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  }

  /**
   * Clear the map cache
   */
  public clearCache(): void {
    this.mapCache.clear();
    this.currentRotation = null;
  }

  /**
   * Preload map data for better performance
   */
  public async preloadMapData(mapKeys: string[]): Promise<void> {
    const promises = mapKeys.map(key => this.getMapData(key));
    await Promise.allSettled(promises);
  }

  /**
   * Get map statistics for analytics
   */
  public getMapStats(): {
    cachedMaps: number;
    currentMapKey: string | null;
    nextRotationDate: number;
  } {
    return {
      cachedMaps: this.mapCache.size,
      currentMapKey: this.currentRotation?.currentMap.key || null,
      nextRotationDate: this.getNextRotationDate()
    };
  }
}