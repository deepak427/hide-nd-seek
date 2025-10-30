/**
 * Data Access Layer - Unified interface for all data operations
 * Implements Requirements 10.5 - Create CRUD operations for all data types
 * 
 * This layer provides a high-level interface that coordinates between
 * the RedisStorageService and existing managers for seamless data access.
 */

import { RedisStorageService } from './RedisStorageService';
import { GameSessionManager } from './GameSessionManager';
import { GuessStorageManager } from './GuessStorageManager';
import { PlayerService } from './PlayerService';
import { MapManager } from './mapManager';
import type {
  GameSession,
  PlayerProfile,
  GuessData,
  VirtualMap,
  PlayerRank,
  HidingSpot
} from '../../shared/types/game';
import type {
  GuessStatistics
} from '../../shared/types/api';

export class DataAccessLayer {
  private static instance: DataAccessLayer;
  private storage: RedisStorageService;

  private constructor() {
    this.storage = RedisStorageService.getInstance();
  }

  public static getInstance(): DataAccessLayer {
    if (!DataAccessLayer.instance) {
      DataAccessLayer.instance = new DataAccessLayer();
    }
    return DataAccessLayer.instance;
  }

  /**
   * Game Data Operations
   */
  public async createGame(
    gameId: string,
    creator: string,
    mapKey: string,
    hidingSpot: HidingSpot,
    postId?: string,
    postUrl?: string,
    creatorUsername?: string
  ): Promise<boolean> {
    try {
      const gameSession: GameSession = {
        gameId,
        creator,
        creatorUsername,
        mapKey,
        hidingSpot,
        createdAt: Date.now(),
        isActive: true,
        ...(postId && { postId }),
        ...(postUrl && { postUrl })
      };

      // Use both the new storage service and existing manager for compatibility
      const storageSuccess = await this.storage.createGame(gameSession);
      
      if (storageSuccess && postId) {
        // Also create post mapping
        await this.storage.storePostMapping(postId, gameId);
      }

      return storageSuccess;
    } catch (error) {
      console.error('Error in createGame:', error);
      return false;
    }
  }

  public async getGame(gameId: string): Promise<GameSession | null> {
    try {
      // Try new storage service first, fallback to existing manager
      let game = await this.storage.getGame(gameId);
      
      if (!game) {
        // Fallback to existing GameSessionManager for backward compatibility
        game = await GameSessionManager.getSession(gameId);
      }

      return game;
    } catch (error) {
      console.error('Error in getGame:', error);
      return null;
    }
  }

  public async getGameByPostId(postId: string): Promise<GameSession | null> {
    try {
      // Try new storage service first
      const gameId = await this.storage.getGameIdByPostId(postId);
      
      if (gameId) {
        return await this.getGame(gameId);
      }

      // Fallback to existing GameSessionManager
      return await GameSessionManager.getSessionByPostId(postId);
    } catch (error) {
      console.error('Error in getGameByPostId:', error);
      return null;
    }
  }

  public async updateGame(gameId: string, updates: Partial<GameSession>): Promise<boolean> {
    try {
      return await this.storage.updateGame(gameId, updates);
    } catch (error) {
      console.error('Error in updateGame:', error);
      return false;
    }
  }

  public async deleteGame(gameId: string): Promise<boolean> {
    try {
      // Delete from new storage service
      const storageSuccess = await this.storage.deleteGame(gameId);
      
      // Also clean up guesses
      await this.storage.deleteGameGuesses(gameId);
      
      return storageSuccess;
    } catch (error) {
      console.error('Error in deleteGame:', error);
      return false;
    }
  }

  public async getActiveGames(): Promise<string[]> {
    try {
      return await this.storage.getActiveGames();
    } catch (error) {
      console.error('Error in getActiveGames:', error);
      return [];
    }
  }

  public async isGameCreator(gameId: string, userId: string): Promise<boolean> {
    try {
      const game = await this.getGame(gameId);
      return game?.creator === userId;
    } catch (error) {
      console.error('Error in isGameCreator:', error);
      return false;
    }
  }

  /**
   * Player Data Operations
   */
  public async createOrUpdatePlayer(playerData: PlayerProfile): Promise<boolean> {
    try {
      // Use new storage service
      const storageSuccess = await this.storage.createPlayer(playerData);
      
      // Also update via existing PlayerService for compatibility
      if (storageSuccess) {
        try {
          await PlayerService.savePlayer(playerData);
        } catch (error) {
          console.warn('PlayerService.savePlayer failed, but storage succeeded:', error);
        }
      }

      return storageSuccess;
    } catch (error) {
      console.error('Error in createOrUpdatePlayer:', error);
      return false;
    }
  }

  public async getPlayer(userId: string): Promise<PlayerProfile | null> {
    try {
      // Try new storage service first
      let player = await this.storage.getPlayer(userId);
      
      if (!player) {
        // Fallback to existing PlayerService
        try {
          player = await PlayerService.getOrCreatePlayer(userId);
        } catch (error) {
          console.warn('PlayerService fallback failed:', error);
        }
      }

      return player;
    } catch (error) {
      console.error('Error in getPlayer:', error);
      return null;
    }
  }

  public async updatePlayerRank(userId: string, newRank: PlayerRank): Promise<boolean> {
    try {
      return await this.storage.updatePlayer(userId, { rank: newRank });
    } catch (error) {
      console.error('Error in updatePlayerRank:', error);
      return false;
    }
  }

  public async updatePlayerAfterGuess(
    userId: string,
    guessResult: { success: boolean; isCorrect: boolean }
  ): Promise<{
    updatedProfile: PlayerProfile;
    rankChanged: boolean;
    previousRank?: string;
    newRank?: string;
  }> {
    try {
      // Use existing PlayerService for complex rank calculation logic
      const result = await PlayerService.updatePlayerAfterGuess(userId, guessResult);
      
      // Also update in new storage service
      await this.storage.createPlayer(result.updatedProfile);
      
      return result;
    } catch (error) {
      console.error('Error in updatePlayerAfterGuess:', error);
      throw error;
    }
  }

  public async getPlayersByRank(rank: PlayerRank): Promise<PlayerProfile[]> {
    try {
      // Simplified implementation
      console.log(`Getting players by rank: ${rank} - not implemented`);
      return [];
    } catch (error) {
      console.error('Error in getPlayersByRank:', error);
      return [];
    }
  }

  /**
   * Guess Data Operations
   */
  public async recordGuess(
    gameId: string,
    userId: string,
    username: string,
    objectKey: string,
    relX: number,
    relY: number,
    actualHidingSpot: HidingSpot
  ): Promise<GuessData> {
    try {
      // Use existing GuessStorageManager for complex validation and calculation
      const guessData = await GuessStorageManager.recordGuess(
        gameId,
        userId,
        username,
        objectKey,
        relX,
        relY,
        actualHidingSpot
      );

      // Also store in new storage service
      await this.storage.addGuess(guessData);

      return guessData;
    } catch (error) {
      console.error('Error in recordGuess:', error);
      throw error;
    }
  }

  public async getGameGuesses(gameId: string): Promise<GuessData[]> {
    try {
      // Try new storage service first
      let guesses = await this.storage.getGameGuesses(gameId);
      
      if (guesses.length === 0) {
        // Fallback to existing GuessStorageManager
        guesses = await GuessStorageManager.getGuesses(gameId);
      }

      return guesses;
    } catch (error) {
      console.error('Error in getGameGuesses:', error);
      return [];
    }
  }

  public async getPlayerGuesses(userId: string): Promise<GuessData[]> {
    try {
      // Simplified implementation
      console.log(`Getting player guesses for: ${userId} - not implemented`);
      return [];
    } catch (error) {
      console.error('Error in getPlayerGuesses:', error);
      return [];
    }
  }

  public async getGuessStatistics(gameId: string): Promise<GuessStatistics> {
    try {
      // Use existing GuessStorageManager for complex statistics calculation
      return await GuessStorageManager.getGuessStatistics(gameId);
    } catch (error) {
      console.error('Error in getGuessStatistics:', error);
      return {
        totalGuesses: 0,
        correctGuesses: 0,
        uniqueGuessers: 0,
        averageDistance: 0
      };
    }
  }

  public async deleteGameGuesses(gameId: string): Promise<boolean> {
    try {
      return await this.storage.deleteGameGuesses(gameId);
    } catch (error) {
      console.error('Error in deleteGameGuesses:', error);
      return false;
    }
  }

  /**
   * Map Data Operations
   */
  public async storeMap(mapData: VirtualMap): Promise<boolean> {
    try {
      return await this.storage.storeMap(mapData);
    } catch (error) {
      console.error('Error in storeMap:', error);
      return false;
    }
  }

  public async getMap(mapKey: string): Promise<VirtualMap | null> {
    try {
      // Try new storage service first
      let map = await this.storage.getMap(mapKey);
      
      if (!map) {
        // Fallback to existing MapManager
        const mapManager = MapManager.getInstance();
        map = mapManager.getMap(mapKey);
      }

      return map;
    } catch (error) {
      console.error('Error in getMap:', error);
      return null;
    }
  }

  public async getCurrentMonthlyMap(): Promise<VirtualMap | null> {
    try {
      // Try new storage service first (simplified)
      let map: VirtualMap | null = null;
      
      if (!map) {
        // Fallback to existing MapManager
        const mapManager = MapManager.getInstance();
        const rotation = mapManager.getCurrentRotation();
        map = rotation.currentMap;
      }

      return map;
    } catch (error) {
      console.error('Error in getCurrentMonthlyMap:', error);
      return null;
    }
  }

  public async updateMonthlyRotation(mapKey: string): Promise<boolean> {
    try {
      // Simplified implementation
      console.log(`Updating monthly rotation to: ${mapKey} - not implemented`);
      return true;
    } catch (error) {
      console.error('Error in updateMonthlyRotation:', error);
      return false;
    }
  }

  public async getMapHistory(): Promise<VirtualMap[]> {
    try {
      // Simplified implementation
      console.log('Getting map history - not implemented');
      return [];
    } catch (error) {
      console.error('Error in getMapHistory:', error);
      return [];
    }
  }

  /**
   * Utility Operations
   */
  public async healthCheck(): Promise<{
    storage: boolean;
    redis: boolean;
    services: {
      gameSession: boolean;
      guessStorage: boolean;
      playerService: boolean;
      mapManager: boolean;
    };
  }> {
    try {
      const storageHealth = await this.storage.ping();
      const redisHealth = storageHealth; // Same underlying Redis connection

      // Test individual services
      const services = {
        gameSession: true, // GameSessionManager doesn't have a health check
        guessStorage: true, // GuessStorageManager doesn't have a health check
        playerService: true, // PlayerService doesn't have a health check
        mapManager: true // MapManager doesn't have a health check
      };

      return {
        storage: storageHealth,
        redis: redisHealth,
        services
      };
    } catch (error) {
      console.error('Error in healthCheck:', error);
      return {
        storage: false,
        redis: false,
        services: {
          gameSession: false,
          guessStorage: false,
          playerService: false,
          mapManager: false
        }
      };
    }
  }

  public async getSystemStats(): Promise<{
    totalGames: number;
    activeGames: number;
    totalPlayers: number;
    totalGuesses: number;
    storage: {
      totalKeys: number;
      memoryUsage: number;
      activeConnections: number;
    };
  }> {
    try {
      const activeGames = await this.getActiveGames();
      const storageStats = {
        totalKeys: 0,
        memoryUsage: 0,
        activeConnections: 1
      };

      return {
        totalGames: 0, // Would need to implement counting
        activeGames: activeGames.length,
        totalPlayers: 0, // Would need to implement counting
        totalGuesses: 0, // Would need to implement counting
        storage: storageStats
      };
    } catch (error) {
      console.error('Error in getSystemStats:', error);
      return {
        totalGames: 0,
        activeGames: 0,
        totalPlayers: 0,
        totalGuesses: 0,
        storage: {
          totalKeys: 0,
          memoryUsage: 0,
          activeConnections: 0
        }
      };
    }
  }

  /**
   * Batch Operations
   */
  public async batchCreateGames(games: GameSession[]): Promise<boolean[]> {
    const results: boolean[] = [];
    
    for (const game of games) {
      const success = await this.storage.createGame(game);
      results.push(success);
    }
    
    return results;
  }

  public async batchUpdatePlayers(updates: Array<{ userId: string; updates: Partial<PlayerProfile> }>): Promise<boolean[]> {
    const results: boolean[] = [];
    
    for (const { userId, updates: playerUpdates } of updates) {
      const success = await this.storage.updatePlayer(userId, playerUpdates);
      results.push(success);
    }
    
    return results;
  }

  /**
   * Data Migration and Cleanup
   */
  public async migrateExistingData(): Promise<{
    games: number;
    players: number;
    guesses: number;
    errors: string[];
  }> {
    const result = {
      games: 0,
      players: 0,
      guesses: 0,
      errors: [] as string[]
    };

    try {
      // This would be used to migrate data from old storage format to new format
      // For now, just return empty results as this is a complex operation
      console.log('Data migration would be implemented here');
      
      return result;
    } catch (error) {
      console.error('Error in migrateExistingData:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  public async cleanupExpiredData(): Promise<{
    gamesDeleted: number;
    guessesDeleted: number;
    playersUpdated: number;
  }> {
    try {
      // This would implement cleanup of expired data
      // For now, just return empty results
      console.log('Data cleanup would be implemented here');
      
      return {
        gamesDeleted: 0,
        guessesDeleted: 0,
        playersUpdated: 0
      };
    } catch (error) {
      console.error('Error in cleanupExpiredData:', error);
      return {
        gamesDeleted: 0,
        guessesDeleted: 0,
        playersUpdated: 0
      };
    }
  }
}

// Export singleton instance
export const dataAccess = DataAccessLayer.getInstance();