/**
 * Position Tracker Utility
 * Handles relative position calculations and tracking for hide-and-seek game
 * Requirements: 1.4, 1.5 - Track relative positions and provide visual feedback
 */

import { RelativePosition } from '../../../shared/types/game';

export interface WorldPosition {
  x: number;
  y: number;
}

export interface MapBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PositionData {
  worldX: number;
  worldY: number;
  relX: number;
  relY: number;
  isValid: boolean;
}

export class PositionTracker {
  private mapBounds: MapBounds;
  private selectedPositions: Map<string, PositionData> = new Map();

  constructor(mapBounds: MapBounds) {
    this.mapBounds = mapBounds;
  }

  /**
   * Convert world coordinates to relative coordinates
   * Requirements: 1.4 - Track relative positions (relX, relY) for selected objects
   */
  worldToRelative(worldX: number, worldY: number): RelativePosition {
    const relX = (worldX - this.mapBounds.x) / this.mapBounds.width;
    const relY = (worldY - this.mapBounds.y) / this.mapBounds.height;

    return {
      relX: Math.max(0, Math.min(1, relX)), // Clamp between 0 and 1
      relY: Math.max(0, Math.min(1, relY))  // Clamp between 0 and 1
    };
  }

  /**
   * Convert relative coordinates to world coordinates
   * Requirements: 1.4 - Track relative positions (relX, relY) for selected objects
   */
  relativeToWorld(relX: number, relY: number): WorldPosition {
    const worldX = this.mapBounds.x + (relX * this.mapBounds.width);
    const worldY = this.mapBounds.y + (relY * this.mapBounds.height);

    return { x: worldX, y: worldY };
  }

  /**
   * Track a position selection for an object
   * Requirements: 1.4, 1.5 - Track relative positions and provide visual feedback
   */
  trackSelection(objectKey: string, worldX: number, worldY: number): PositionData {
    const isValid = this.isPositionValid(worldX, worldY);
    const relativePos = this.worldToRelative(worldX, worldY);

    const positionData: PositionData = {
      worldX,
      worldY,
      relX: relativePos.relX,
      relY: relativePos.relY,
      isValid
    };

    this.selectedPositions.set(objectKey, positionData);
    return positionData;
  }

  /**
   * Get tracked position for an object
   */
  getTrackedPosition(objectKey: string): PositionData | null {
    return this.selectedPositions.get(objectKey) || null;
  }

  /**
   * Get all tracked positions
   */
  getAllTrackedPositions(): Map<string, PositionData> {
    return new Map(this.selectedPositions);
  }

  /**
   * Clear tracked position for an object
   */
  clearTrackedPosition(objectKey: string): boolean {
    return this.selectedPositions.delete(objectKey);
  }

  /**
   * Clear all tracked positions
   */
  clearAllTrackedPositions(): void {
    this.selectedPositions.clear();
  }

  /**
   * Check if a world position is valid (within map bounds)
   * Requirements: 1.4 - Validate position selections
   */
  isPositionValid(worldX: number, worldY: number): boolean {
    return (
      worldX >= this.mapBounds.x &&
      worldX <= this.mapBounds.x + this.mapBounds.width &&
      worldY >= this.mapBounds.y &&
      worldY <= this.mapBounds.y + this.mapBounds.height
    );
  }

  /**
   * Calculate distance between two positions (in relative coordinates)
   * Requirements: 1.5 - Position validation and feedback
   */
  calculateRelativeDistance(pos1: RelativePosition, pos2: RelativePosition): number {
    const deltaX = pos1.relX - pos2.relX;
    const deltaY = pos1.relY - pos2.relY;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }

  /**
   * Calculate distance between two world positions
   */
  calculateWorldDistance(pos1: WorldPosition, pos2: WorldPosition): number {
    const deltaX = pos1.x - pos2.x;
    const deltaY = pos1.y - pos2.y;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }

  /**
   * Update map bounds (for resize handling)
   */
  updateMapBounds(newBounds: MapBounds): void {
    this.mapBounds = newBounds;
    
    // Recalculate world positions for all tracked positions
    this.selectedPositions.forEach((posData, objectKey) => {
      const newWorldPos = this.relativeToWorld(posData.relX, posData.relY);
      posData.worldX = newWorldPos.x;
      posData.worldY = newWorldPos.y;
      posData.isValid = this.isPositionValid(newWorldPos.x, newWorldPos.y);
    });
  }

  /**
   * Get position statistics for debugging/analytics
   */
  getPositionStats(): {
    totalTracked: number;
    validPositions: number;
    invalidPositions: number;
    averageRelX: number;
    averageRelY: number;
  } {
    const positions = Array.from(this.selectedPositions.values());
    const validPositions = positions.filter(pos => pos.isValid);
    
    const avgRelX = positions.length > 0 
      ? positions.reduce((sum, pos) => sum + pos.relX, 0) / positions.length 
      : 0;
    
    const avgRelY = positions.length > 0 
      ? positions.reduce((sum, pos) => sum + pos.relY, 0) / positions.length 
      : 0;

    return {
      totalTracked: positions.length,
      validPositions: validPositions.length,
      invalidPositions: positions.length - validPositions.length,
      averageRelX: avgRelX,
      averageRelY: avgRelY
    };
  }

  /**
   * Export position data for saving/sharing
   * Requirements: 1.4 - Track relative positions for game data
   */
  exportPositionData(): Array<{
    objectKey: string;
    relX: number;
    relY: number;
    isValid: boolean;
  }> {
    return Array.from(this.selectedPositions.entries()).map(([objectKey, posData]) => ({
      objectKey,
      relX: posData.relX,
      relY: posData.relY,
      isValid: posData.isValid
    }));
  }

  /**
   * Import position data from saved/shared data
   */
  importPositionData(data: Array<{
    objectKey: string;
    relX: number;
    relY: number;
  }>): void {
    this.clearAllTrackedPositions();
    
    data.forEach((item, index) => {
      const worldPos = this.relativeToWorld(item.relX, item.relY);
      this.trackSelection(`${item.objectKey}_${index}`, worldPos.x, worldPos.y);
    });
  }
}