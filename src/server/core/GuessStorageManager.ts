import { redis } from '@devvit/web/server';
import { GuessData, GuessStatistics, HidingSpot } from '../../shared/types/api';
import { RedisSchemaManager } from './RedisSchemaManager';
import { ErrorHandlingService, DatabaseError, RateLimitError, Validators } from './ErrorHandlingService';
import { PlayerService } from './PlayerService';

export class GuessStorageManager {
  private static readonly GUESS_PREFIX = 'game:';
  private static readonly GUESS_SUFFIX = ':guesses';
  private static readonly STATS_SUFFIX = ':stats';
  private static readonly EXPIRATION_DAYS = 30;
  private static readonly EXPIRATION_SECONDS = GuessStorageManager.EXPIRATION_DAYS * 24 * 60 * 60;
  private static readonly ACCURACY_THRESHOLD = 0.05; // 5% tolerance for correct guesses

  /**
   * Record a user's guess and calculate accuracy
   */
  static async recordGuess(
    gameId: string,
    userId: string,
    username: string,
    objectKey: string,
    relX: number,
    relY: number,
    actualHidingSpot: HidingSpot
  ): Promise<GuessData> {
    // Validate inputs
    Validators.gameId(gameId);
    Validators.userId(userId);
    Validators.objectKey(objectKey);
    Validators.coordinates(relX, relY);

    if (!username || typeof username !== 'string') {
      username = 'Anonymous'; // Fallback for missing username
    }

    // Check for rate limiting
    const hasRecentGuess = await GuessStorageManager.hasRecentGuess(gameId, userId, 2000);
    if (hasRecentGuess) {
      throw new RateLimitError('Please wait before making another guess');
    }

    try {
      // Calculate distance and accuracy
      const distance = GuessStorageManager.calculateDistance(
        relX, relY,
        actualHidingSpot.relX, actualHidingSpot.relY
      );

      // Check if guess is correct (object matches and within threshold)
      const isCorrect = objectKey === actualHidingSpot.objectKey && 
                       distance < GuessStorageManager.ACCURACY_THRESHOLD;

      const guessData: GuessData = {
        gameId,
        userId,
        username,
        objectKey,
        relX,
        relY,
        isCorrect,
        distance,
        timestamp: Date.now()
      };

      // Store the guess using schema manager for validation
      await RedisSchemaManager.storeGuess(guessData);

      // Update game statistics
      await GuessStorageManager.updateStatistics(gameId, guessData);

      // Update player statistics and check for rank progression
      try {
        const playerUpdate = await PlayerService.updatePlayerAfterGuess(userId, {
          success: isCorrect,
          isCorrect: isCorrect
        });

        if (playerUpdate.rankChanged) {
          console.log(`🎉 Player ${username} promoted from ${playerUpdate.previousRank} to ${playerUpdate.newRank}!`);
        }
      } catch (error) {
        console.error('Error updating player statistics:', error);
        // Don't fail the guess if player stats update fails
      }

      console.log(`🎯 Recorded guess for game ${gameId} by ${username}: ${isCorrect ? 'CORRECT' : 'INCORRECT'} (distance: ${Math.round(distance * 100)}%)`);

      return guessData;
    } catch (error) {
      console.error('Error recording guess:', error);
      ErrorHandlingService.handleDatabaseError(error, 'recordGuess');
      throw error; // This line will never be reached, but TypeScript needs it
    }
  }

  /**
   * Get all guesses for a game
   */
  static async getGuesses(gameId: string): Promise<GuessData[]> {
    Validators.gameId(gameId);

    try {
      // Use schema manager for validation and retrieval
      return await RedisSchemaManager.getGameGuesses(gameId);
    } catch (error) {
      console.error('Error getting guesses:', error);
      ErrorHandlingService.handleDatabaseError(error, 'getGuesses');
    }
  }

  /**
   * Get unique guessers (latest guess per user)
   */
  static async getUniqueGuessers(gameId: string): Promise<GuessData[]> {
    try {
      const allGuesses = await GuessStorageManager.getGuesses(gameId);
      const uniqueGuessers = new Map<string, GuessData>();

      // Keep only the latest guess per user
      for (const guess of allGuesses) {
        const existing = uniqueGuessers.get(guess.userId);
        if (!existing || guess.timestamp > existing.timestamp) {
          uniqueGuessers.set(guess.userId, guess);
        }
      }

      return Array.from(uniqueGuessers.values())
        .sort((a, b) => {
          // Sort by correctness first, then by distance, then by timestamp
          if (a.isCorrect && !b.isCorrect) return -1;
          if (!a.isCorrect && b.isCorrect) return 1;
          if (a.isCorrect && b.isCorrect) return a.timestamp - b.timestamp;
          return a.distance - b.distance;
        });
    } catch (error) {
      console.error('Error getting unique guessers:', error);
      return [];
    }
  }

  /**
   * Get guess statistics for a game
   */
  static async getGuessStatistics(gameId: string): Promise<GuessStatistics> {
    try {
      // Try to get cached stats first
      const cachedStats = await RedisSchemaManager.getGameStatistics(gameId);
      
      if (cachedStats) {
        return cachedStats;
      }

      // If no cached stats, calculate from guesses
      return await GuessStorageManager.calculateStatistics(gameId);
    } catch (error) {
      console.error('Error getting guess statistics:', error);
      return {
        totalGuesses: 0,
        correctGuesses: 0,
        uniqueGuessers: 0,
        averageDistance: 0
      };
    }
  }

  /**
   * Update statistics after a new guess
   */
  private static async updateStatistics(gameId: string, _newGuess: GuessData): Promise<void> {
    try {
      const stats = await GuessStorageManager.calculateStatistics(gameId);
      
      // Use schema manager for validation and storage
      await RedisSchemaManager.storeGameStatistics(gameId, stats);
    } catch (error) {
      console.error('Error updating statistics:', error);
    }
  }

  /**
   * Calculate statistics from all guesses
   */
  private static async calculateStatistics(gameId: string): Promise<GuessStatistics> {
    try {
      const allGuesses = await GuessStorageManager.getGuesses(gameId);
      const uniqueGuessers = await GuessStorageManager.getUniqueGuessers(gameId);

      const correctGuesses = allGuesses.filter(g => g.isCorrect).length;
      const totalDistance = allGuesses.reduce((sum, g) => sum + g.distance, 0);
      const averageDistance = allGuesses.length > 0 ? totalDistance / allGuesses.length : 0;

      return {
        totalGuesses: allGuesses.length,
        correctGuesses,
        uniqueGuessers: uniqueGuessers.length,
        averageDistance: Math.round(averageDistance * 10000) / 10000 // Round to 4 decimal places
      };
    } catch (error) {
      console.error('Error calculating statistics:', error);
      return {
        totalGuesses: 0,
        correctGuesses: 0,
        uniqueGuessers: 0,
        averageDistance: 0
      };
    }
  }

  /**
   * Calculate Euclidean distance between two points
   */
  private static calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  /**
   * Validate guess coordinates (delegated to schema manager)
   */
  static validateGuessCoordinates(relX: number, relY: number): void {
    // Use the schema manager's validation which is more comprehensive
    try {
      const dummyGuess: GuessData = {
        gameId: '00000000-0000-4000-8000-000000000000', // Dummy UUID for validation
        userId: 'test',
        username: 'test',
        objectKey: 'test',
        relX,
        relY,
        isCorrect: false,
        distance: 0,
        timestamp: Date.now()
      };
      
      // This will validate coordinates as part of the full validation
      RedisSchemaManager['validateGuessData'](dummyGuess);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Coordinates')) {
        throw error;
      }
      // If it's not a coordinate error, just do basic validation
      if (typeof relX !== 'number' || typeof relY !== 'number') {
        throw new Error('Coordinates must be numbers');
      }
      if (relX < 0 || relX > 1 || relY < 0 || relY > 1) {
        throw new Error('Coordinates must be between 0 and 1');
      }
    }
  }

  /**
   * Validate object key (delegated to schema manager)
   */
  static validateObjectKey(objectKey: string): void {
    if (!objectKey || typeof objectKey !== 'string') {
      throw new Error('Object key is required and must be a string');
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(objectKey)) {
      throw new Error('Invalid object key format');
    }
  }

  /**
   * Check if user has already made a guess (for rate limiting)
   */
  static async hasRecentGuess(gameId: string, userId: string, timeWindowMs: number = 5000): Promise<boolean> {
    try {
      const guesses = await GuessStorageManager.getGuesses(gameId);
      const userGuesses = guesses.filter(g => g.userId === userId);
      
      if (userGuesses.length === 0) {
        return false;
      }

      const latestGuess = userGuesses[0]; // Already sorted by timestamp desc
      return latestGuess ? (Date.now() - latestGuess.timestamp) < timeWindowMs : false;
    } catch (error) {
      console.error('Error checking recent guess:', error);
      return false;
    }
  }

  /**
   * Get leaderboard (top performers)
   */
  static async getLeaderboard(gameId: string, limit: number = 10): Promise<GuessData[]> {
    try {
      const uniqueGuessers = await GuessStorageManager.getUniqueGuessers(gameId);
      return uniqueGuessers.slice(0, limit);
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }

  /**
   * Delete all guesses for a game (cleanup)
   */
  static async deleteGameGuesses(gameId: string): Promise<void> {
    try {
      // Use schema manager for comprehensive cleanup
      await RedisSchemaManager.deleteGameData(gameId);
      
      console.log(`🗑️ Deleted all guesses for game ${gameId}`);
    } catch (error) {
      console.error('Error deleting game guesses:', error);
      throw new Error(`Failed to delete game guesses: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}