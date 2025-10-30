import { redis } from '@devvit/web/server';
import { GameSession, HidingSpot } from '../../shared/types/api';
import { RedisSchemaManager } from './RedisSchemaManager';
import { ErrorHandlingService, DatabaseError, NotFoundError, Validators } from './ErrorHandlingService';

export class GameSessionManager {
  private static readonly SESSION_PREFIX = 'game_session:';
  private static readonly POST_MAPPING_PREFIX = 'post_mapping:';
  private static readonly EXPIRATION_DAYS = 30;
  private static readonly EXPIRATION_SECONDS = GameSessionManager.EXPIRATION_DAYS * 24 * 60 * 60;

  /**
   * Create a new game session
   */
  static async createSession(
    gameId: string,
    creator: string,
    mapKey: string,
    hidingSpot: HidingSpot
  ): Promise<void> {
    // Validate inputs
    Validators.gameId(gameId);
    Validators.userId(creator);
    Validators.mapKey(mapKey);
    Validators.objectKey(hidingSpot.objectKey);
    Validators.coordinates(hidingSpot.relX, hidingSpot.relY);

    try {
      const session: GameSession = {
        gameId,
        creator,
        mapKey,
        hidingSpot,
        createdAt: Date.now()
      };

      // Use the new Redis schema manager for validation and storage
      await RedisSchemaManager.storeGameSession(session);

      console.log(`💾 Created game session ${gameId} for creator ${creator}`);
    } catch (error) {
      console.error('Error creating game session:', error);
      ErrorHandlingService.handleDatabaseError(error, 'createSession');
    }
  }

  /**
   * Retrieve a game session by gameId
   */
  static async getSession(gameId: string): Promise<GameSession | null> {
    Validators.gameId(gameId);

    try {
      // Use the new Redis schema manager for validation and retrieval
      return await RedisSchemaManager.getGameSession(gameId);
    } catch (error) {
      console.error('Error getting game session:', error);
      ErrorHandlingService.handleDatabaseError(error, 'getSession');
    }
  }

  /**
   * Retrieve a game session by postId
   */
  static async getSessionByPostId(postId: string): Promise<GameSession | null> {
    if (!postId || typeof postId !== 'string') {
      throw new NotFoundError('Post ID is required');
    }

    try {
      // First get the gameId from post mapping using schema manager
      const gameId = await RedisSchemaManager.getGameIdByPostId(postId);

      if (!gameId) {
        throw new NotFoundError(`No game session found for post ${postId}`);
      }

      // Then get the session
      return await GameSessionManager.getSession(gameId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error getting game session by postId:', error);
      ErrorHandlingService.handleDatabaseError(error, 'getSessionByPostId');
    }
  }

  /**
   * Update the post mapping for a game session
   */
  static async updatePostMapping(gameId: string, postId: string): Promise<void> {
    Validators.gameId(gameId);
    
    if (!postId || typeof postId !== 'string') {
      throw new NotFoundError('Post ID is required');
    }

    try {
      // Update the session with postId
      const session = await GameSessionManager.getSession(gameId);
      if (!session) {
        throw new NotFoundError(`Game session ${gameId} not found`);
      }

      session.postId = postId;
      
      // Store updated session using schema manager
      await RedisSchemaManager.storeGameSession(session);

      // Create post mapping using schema manager
      await RedisSchemaManager.storePostMapping(postId, gameId);

      console.log(`🔗 Updated post mapping: ${postId} -> ${gameId}`);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error updating post mapping:', error);
      ErrorHandlingService.handleDatabaseError(error, 'updatePostMapping');
    }
  }

  /**
   * Update an existing game session
   */
  static async updateSession(session: GameSession): Promise<void> {
    if (!session || !session.gameId) {
      throw new NotFoundError('Valid game session is required');
    }

    Validators.gameId(session.gameId);

    try {
      // Use schema manager for validation and storage
      await RedisSchemaManager.storeGameSession(session);

      console.log(`📝 Updated game session ${session.gameId}`);
    } catch (error) {
      console.error('Error updating game session:', error);
      ErrorHandlingService.handleDatabaseError(error, 'updateSession');
    }
  }

  /**
   * Check if a user is the creator of a game session
   */
  static async isCreator(gameId: string, userId: string): Promise<boolean> {
    try {
      Validators.gameId(gameId);
      Validators.userId(userId);
      
      const session = await GameSessionManager.getSession(gameId);
      return session?.creator === userId;
    } catch (error) {
      console.error('Error checking creator status:', error);
      return false;
    }
  }

  /**
   * Get all game sessions (for debugging/admin purposes)
   */
  static async getAllSessions(): Promise<GameSession[]> {
    try {
      // Note: This is a simplified implementation
      // In production, you might want to use SCAN instead of getting all keys
      const sessions: GameSession[] = [];
      
      // Since Redis client doesn't have keys method, we'll implement a different approach
      // This is a placeholder - in real implementation, you'd need to track session IDs
      console.log('getAllSessions: Not implemented - Redis client limitations');
      return sessions;
    } catch (error) {
      console.error('Error getting all sessions:', error);
      return [];
    }
  }
}