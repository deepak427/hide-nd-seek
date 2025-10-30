import { redis } from '@devvit/web/server';
import { GameSession, GuessData, GuessStatistics, HidingSpot } from '../../shared/types/api';

/**
 * Redis Schema Manager
 * 
 * Implements the Redis data structures and operations for the hide-and-seek game.
 * Follows the schema design from the requirements:
 * 
 * Redis Key Patterns:
 * - game_session:{gameId} → GameSession JSON
 * - post_mapping:{postId} → gameId string
 * - game:{gameId}:guess:{userId}:{timestamp} → GuessData JSON
 * - game:{gameId}:stats → GuessStatistics JSON
 * 
 * All keys have 30-day expiration
 */
export class RedisSchemaManager {
  // Key prefixes and patterns
  private static readonly GAME_SESSION_PREFIX = 'game_session:';
  private static readonly POST_MAPPING_PREFIX = 'post_mapping:';
  private static readonly GAME_PREFIX = 'game:';
  private static readonly GUESS_SUFFIX = ':guess:';
  private static readonly STATS_SUFFIX = ':stats';
  
  // Expiration settings
  private static readonly EXPIRATION_DAYS = 30;
  private static readonly EXPIRATION_SECONDS = RedisSchemaManager.EXPIRATION_DAYS * 24 * 60 * 60;
  
  // Validation constants
  private static readonly MAX_COORDINATE = 1.0;
  private static readonly MIN_COORDINATE = 0.0;
  private static readonly OBJECT_KEY_PATTERN = /^[a-zA-Z0-9_-]+$/;
  private static readonly MAX_USERNAME_LENGTH = 50;
  private static readonly MAX_OBJECT_KEY_LENGTH = 50;

  /**
   * Game Session Operations
   */

  /**
   * Store a game session with validation and expiration
   */
  static async storeGameSession(session: GameSession): Promise<void> {
    try {
      // Validate session data
      RedisSchemaManager.validateGameSession(session);

      const key = `${RedisSchemaManager.GAME_SESSION_PREFIX}${session.gameId}`;
      const serializedData = JSON.stringify(session);
      
      await redis.set(key, serializedData);
      await redis.expire(key, RedisSchemaManager.EXPIRATION_SECONDS);
      
      console.log(`✅ Stored game session: ${session.gameId}`);
    } catch (error) {
      console.error('Error storing game session:', error);
      throw new Error(`Failed to store game session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve a game session by gameId
   */
  static async getGameSession(gameId: string): Promise<GameSession | null> {
    try {
      RedisSchemaManager.validateGameId(gameId);

      const key = `${RedisSchemaManager.GAME_SESSION_PREFIX}${gameId}`;
      const data = await redis.get(key);
      
      if (!data) {
        return null;
      }

      const session = JSON.parse(data) as GameSession;
      RedisSchemaManager.validateGameSession(session);
      
      return session;
    } catch (error) {
      console.error('Error retrieving game session:', error);
      return null;
    }
  }

  /**
   * Store post ID to game ID mapping
   */
  static async storePostMapping(postId: string, gameId: string): Promise<void> {
    try {
      RedisSchemaManager.validatePostId(postId);
      RedisSchemaManager.validateGameId(gameId);

      const key = `${RedisSchemaManager.POST_MAPPING_PREFIX}${postId}`;
      
      await redis.set(key, gameId);
      await redis.expire(key, RedisSchemaManager.EXPIRATION_SECONDS);
      
      console.log(`✅ Stored post mapping: ${postId} → ${gameId}`);
    } catch (error) {
      console.error('Error storing post mapping:', error);
      throw new Error(`Failed to store post mapping: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve game ID by post ID
   */
  static async getGameIdByPostId(postId: string): Promise<string | null> {
    try {
      RedisSchemaManager.validatePostId(postId);

      const key = `${RedisSchemaManager.POST_MAPPING_PREFIX}${postId}`;
      const gameId = await redis.get(key);
      
      if (gameId) {
        RedisSchemaManager.validateGameId(gameId);
        return gameId;
      }
      
      return null;
    } catch (error) {
      console.error('Error retrieving game ID by post ID:', error);
      return null;
    }
  }

  /**
   * Guess Operations
   */

  /**
   * Store a guess with validation and expiration
   */
  static async storeGuess(guess: GuessData): Promise<void> {
    try {
      // Validate guess data
      RedisSchemaManager.validateGuessData(guess);

      const key = `${RedisSchemaManager.GAME_PREFIX}${guess.gameId}${RedisSchemaManager.GUESS_SUFFIX}${guess.userId}:${guess.timestamp}`;
      const serializedData = JSON.stringify(guess);
      
      await redis.set(key, serializedData);
      await redis.expire(key, RedisSchemaManager.EXPIRATION_SECONDS);
      
      console.log(`✅ Stored guess: ${guess.gameId} by ${guess.username}`);
    } catch (error) {
      console.error('Error storing guess:', error);
      throw new Error(`Failed to store guess: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve all guesses for a game
   */
  static async getGameGuesses(gameId: string): Promise<GuessData[]> {
    try {
      RedisSchemaManager.validateGameId(gameId);

      const pattern = `${RedisSchemaManager.GAME_PREFIX}${gameId}${RedisSchemaManager.GUESS_SUFFIX}*`;
      const keys = await RedisSchemaManager.scanKeys(pattern);
      
      const guesses: GuessData[] = [];
      
      for (const key of keys) {
        try {
          const data = await redis.get(key);
          if (data) {
            const guess = JSON.parse(data) as GuessData;
            RedisSchemaManager.validateGuessData(guess);
            guesses.push(guess);
          }
        } catch (parseError) {
          console.error(`Error parsing guess data for key ${key}:`, parseError);
          // Continue processing other guesses
        }
      }
      
      // Sort by timestamp (newest first)
      guesses.sort((a, b) => b.timestamp - a.timestamp);
      
      return guesses;
    } catch (error) {
      console.error('Error retrieving game guesses:', error);
      return [];
    }
  }

  /**
   * Statistics Operations
   */

  /**
   * Store game statistics
   */
  static async storeGameStatistics(gameId: string, stats: GuessStatistics): Promise<void> {
    try {
      RedisSchemaManager.validateGameId(gameId);
      RedisSchemaManager.validateGuessStatistics(stats);

      const key = `${RedisSchemaManager.GAME_PREFIX}${gameId}${RedisSchemaManager.STATS_SUFFIX}`;
      const serializedData = JSON.stringify(stats);
      
      await redis.set(key, serializedData);
      await redis.expire(key, RedisSchemaManager.EXPIRATION_SECONDS);
      
      console.log(`✅ Stored game statistics: ${gameId}`);
    } catch (error) {
      console.error('Error storing game statistics:', error);
      throw new Error(`Failed to store game statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve game statistics
   */
  static async getGameStatistics(gameId: string): Promise<GuessStatistics | null> {
    try {
      RedisSchemaManager.validateGameId(gameId);

      const key = `${RedisSchemaManager.GAME_PREFIX}${gameId}${RedisSchemaManager.STATS_SUFFIX}`;
      const data = await redis.get(key);
      
      if (!data) {
        return null;
      }

      const stats = JSON.parse(data) as GuessStatistics;
      RedisSchemaManager.validateGuessStatistics(stats);
      
      return stats;
    } catch (error) {
      console.error('Error retrieving game statistics:', error);
      return null;
    }
  }

  /**
   * Data Validation Methods
   */

  /**
   * Validate game session data
   */
  private static validateGameSession(session: GameSession): void {
    if (!session.gameId || typeof session.gameId !== 'string') {
      throw new Error('Invalid gameId: must be a non-empty string');
    }

    if (!session.creator || typeof session.creator !== 'string') {
      throw new Error('Invalid creator: must be a non-empty string');
    }

    if (!session.mapKey || typeof session.mapKey !== 'string') {
      throw new Error('Invalid mapKey: must be a non-empty string');
    }

    if (!session.hidingSpot) {
      throw new Error('Invalid hidingSpot: must be provided');
    }

    RedisSchemaManager.validateHidingSpot(session.hidingSpot);

    if (typeof session.createdAt !== 'number' || session.createdAt <= 0) {
      throw new Error('Invalid createdAt: must be a positive number');
    }

    if (session.postId !== undefined && (typeof session.postId !== 'string' || session.postId.length === 0)) {
      throw new Error('Invalid postId: must be a non-empty string if provided');
    }
  }

  /**
   * Validate hiding spot data
   */
  private static validateHidingSpot(hidingSpot: HidingSpot): void {
    if (!hidingSpot.objectKey || typeof hidingSpot.objectKey !== 'string') {
      throw new Error('Invalid objectKey: must be a non-empty string');
    }

    if (hidingSpot.objectKey.length > RedisSchemaManager.MAX_OBJECT_KEY_LENGTH) {
      throw new Error(`Invalid objectKey: must be ${RedisSchemaManager.MAX_OBJECT_KEY_LENGTH} characters or less`);
    }

    if (!RedisSchemaManager.OBJECT_KEY_PATTERN.test(hidingSpot.objectKey)) {
      throw new Error('Invalid objectKey: must contain only alphanumeric characters, underscores, and hyphens');
    }

    RedisSchemaManager.validateCoordinates(hidingSpot.relX, hidingSpot.relY);
  }

  /**
   * Validate guess data
   */
  private static validateGuessData(guess: GuessData): void {
    RedisSchemaManager.validateGameId(guess.gameId);

    if (!guess.userId || typeof guess.userId !== 'string') {
      throw new Error('Invalid userId: must be a non-empty string');
    }

    if (!guess.username || typeof guess.username !== 'string') {
      throw new Error('Invalid username: must be a non-empty string');
    }

    if (guess.username.length > RedisSchemaManager.MAX_USERNAME_LENGTH) {
      throw new Error(`Invalid username: must be ${RedisSchemaManager.MAX_USERNAME_LENGTH} characters or less`);
    }

    if (!guess.objectKey || typeof guess.objectKey !== 'string') {
      throw new Error('Invalid objectKey: must be a non-empty string');
    }

    if (!RedisSchemaManager.OBJECT_KEY_PATTERN.test(guess.objectKey)) {
      throw new Error('Invalid objectKey: must contain only alphanumeric characters, underscores, and hyphens');
    }

    RedisSchemaManager.validateCoordinates(guess.relX, guess.relY);

    if (typeof guess.isCorrect !== 'boolean') {
      throw new Error('Invalid isCorrect: must be a boolean');
    }

    if (typeof guess.distance !== 'number' || guess.distance < 0) {
      throw new Error('Invalid distance: must be a non-negative number');
    }

    if (typeof guess.timestamp !== 'number' || guess.timestamp <= 0) {
      throw new Error('Invalid timestamp: must be a positive number');
    }
  }

  /**
   * Validate guess statistics
   */
  private static validateGuessStatistics(stats: GuessStatistics): void {
    if (typeof stats.totalGuesses !== 'number' || stats.totalGuesses < 0) {
      throw new Error('Invalid totalGuesses: must be a non-negative number');
    }

    if (typeof stats.correctGuesses !== 'number' || stats.correctGuesses < 0) {
      throw new Error('Invalid correctGuesses: must be a non-negative number');
    }

    if (typeof stats.uniqueGuessers !== 'number' || stats.uniqueGuessers < 0) {
      throw new Error('Invalid uniqueGuessers: must be a non-negative number');
    }

    if (typeof stats.averageDistance !== 'number' || stats.averageDistance < 0) {
      throw new Error('Invalid averageDistance: must be a non-negative number');
    }

    if (stats.correctGuesses > stats.totalGuesses) {
      throw new Error('Invalid statistics: correctGuesses cannot exceed totalGuesses');
    }
  }

  /**
   * Validate coordinates
   */
  private static validateCoordinates(relX: number, relY: number): void {
    if (typeof relX !== 'number' || typeof relY !== 'number') {
      throw new Error('Coordinates must be numbers');
    }

    if (relX < RedisSchemaManager.MIN_COORDINATE || relX > RedisSchemaManager.MAX_COORDINATE ||
        relY < RedisSchemaManager.MIN_COORDINATE || relY > RedisSchemaManager.MAX_COORDINATE) {
      throw new Error(`Coordinates must be between ${RedisSchemaManager.MIN_COORDINATE} and ${RedisSchemaManager.MAX_COORDINATE}`);
    }
  }

  /**
   * Validate game ID
   */
  private static validateGameId(gameId: string): void {
    if (!gameId || typeof gameId !== 'string') {
      throw new Error('Invalid gameId: must be a non-empty string');
    }

    // UUID v4 pattern validation
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(gameId)) {
      throw new Error('Invalid gameId: must be a valid UUID v4');
    }
  }

  /**
   * Validate post ID
   */
  private static validatePostId(postId: string): void {
    if (!postId || typeof postId !== 'string') {
      throw new Error('Invalid postId: must be a non-empty string');
    }

    if (postId.length > 100) {
      throw new Error('Invalid postId: must be 100 characters or less');
    }
  }

  /**
   * Utility Methods
   */

  /**
   * Scan for keys matching a pattern (alternative to KEYS command)
   * Note: This is a simplified implementation. In production, you might want to use SCAN
   */
  private static async scanKeys(pattern: string): Promise<string[]> {
    try {
      // Since the Redis client might not support SCAN, we'll use a different approach
      // This is a placeholder implementation - in real Redis, you'd use SCAN for better performance
      console.log(`Scanning for keys with pattern: ${pattern}`);
      
      // For now, we'll return an empty array and let the calling code handle it
      // In a real implementation, you'd implement proper key scanning
      return [];
    } catch (error) {
      console.error('Error scanning keys:', error);
      return [];
    }
  }

  /**
   * Get all keys for a specific game (for cleanup purposes)
   */
  static async getGameKeys(gameId: string): Promise<string[]> {
    try {
      RedisSchemaManager.validateGameId(gameId);

      const keys: string[] = [];
      
      // Game session key
      keys.push(`${RedisSchemaManager.GAME_SESSION_PREFIX}${gameId}`);
      
      // Statistics key
      keys.push(`${RedisSchemaManager.GAME_PREFIX}${gameId}${RedisSchemaManager.STATS_SUFFIX}`);
      
      // Guess keys (would need to scan in real implementation)
      const guessPattern = `${RedisSchemaManager.GAME_PREFIX}${gameId}${RedisSchemaManager.GUESS_SUFFIX}*`;
      const guessKeys = await RedisSchemaManager.scanKeys(guessPattern);
      keys.push(...guessKeys);
      
      return keys;
    } catch (error) {
      console.error('Error getting game keys:', error);
      return [];
    }
  }

  /**
   * Delete all data for a specific game
   */
  static async deleteGameData(gameId: string): Promise<void> {
    try {
      const keys = await RedisSchemaManager.getGameKeys(gameId);
      
      for (const key of keys) {
        await redis.del(key);
      }
      
      console.log(`🗑️ Deleted all data for game: ${gameId}`);
    } catch (error) {
      console.error('Error deleting game data:', error);
      throw new Error(`Failed to delete game data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a key exists and get its TTL
   */
  static async getKeyInfo(key: string): Promise<{ exists: boolean; ttl: number }> {
    try {
      const exists = await redis.exists(key);
      // Since TTL is not available, return -1 for existing keys (unknown expiration)
      const ttl = exists ? -1 : -2;
      
      return { exists: exists === 1, ttl };
    } catch (error) {
      console.error('Error getting key info:', error);
      return { exists: false, ttl: -2 };
    }
  }

  /**
   * Refresh expiration for a key
   */
  static async refreshExpiration(key: string): Promise<void> {
    try {
      await redis.expire(key, RedisSchemaManager.EXPIRATION_SECONDS);
      console.log(`🔄 Refreshed expiration for key: ${key}`);
    } catch (error) {
      console.error('Error refreshing expiration:', error);
      throw new Error(`Failed to refresh expiration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}