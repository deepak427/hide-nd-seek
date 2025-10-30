import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameSessionManager } from '@server/core/GameSessionManager';
import type { GameSession, HidingSpot } from '@shared/types/api';

// Mock Redis and other dependencies
vi.mock('@server/core/storage', () => ({
  redis: {
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
    exists: vi.fn(),
    expire: vi.fn()
  }
}));

vi.mock('@server/core/RedisSchemaManager', () => ({
  RedisSchemaManager: {
    validateGameSession: vi.fn(),
    validateGameId: vi.fn(),
    getGameSessionKey: vi.fn((gameId: string) => `game_session:${gameId}`),
    getPostMappingKey: vi.fn((postId: string) => `post_mapping:${postId}`)
  }
}));

vi.mock('@server/core/ErrorHandlingService', () => ({
  ErrorHandlingService: {
    handleStorageError: vi.fn(),
    logError: vi.fn()
  }
}));

import { redis } from '@server/core/storage';
import { RedisSchemaManager } from '@server/core/RedisSchemaManager';
import { ErrorHandlingService } from '@server/core/ErrorHandlingService';

describe('GameSessionManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createSession()', () => {
    it('should create a new game session successfully', async () => {
      // Arrange
      const gameId = 'test-game-123';
      const creator = 'user-456';
      const mapKey = 'bedroom';
      const hidingSpot: HidingSpot = {
        objectKey: 'pumpkin',
        relX: 0.5,
        relY: 0.3
      };

      vi.mocked(RedisSchemaManager.validateGameId).mockReturnValue(undefined);
      vi.mocked(RedisSchemaManager.validateGameSession).mockReturnValue(undefined);
      vi.mocked(RedisSchemaManager.getGameSessionKey).mockReturnValue(`game_session:${gameId}`);
      vi.mocked(redis.set).mockResolvedValue('OK');
      vi.mocked(redis.expire).mockResolvedValue(1);

      // Act
      await GameSessionManager.createSession(gameId, creator, mapKey, hidingSpot);

      // Assert
      expect(RedisSchemaManager.validateGameId).toHaveBeenCalledWith(gameId);
      expect(redis.set).toHaveBeenCalledWith(
        `game_session:${gameId}`,
        expect.stringContaining('"gameId":"test-game-123"')
      );
      expect(redis.expire).toHaveBeenCalledWith(`game_session:${gameId}`, 2592000); // 30 days
    });

    it('should handle storage errors gracefully', async () => {
      // Arrange
      const gameId = 'test-game-123';
      const creator = 'user-456';
      const mapKey = 'bedroom';
      const hidingSpot: HidingSpot = {
        objectKey: 'pumpkin',
        relX: 0.5,
        relY: 0.3
      };

      const storageError = new Error('Redis connection failed');
      vi.mocked(redis.set).mockRejectedValue(storageError);
      vi.mocked(ErrorHandlingService.handleStorageError).mockImplementation(() => {
        throw new Error('Storage operation failed');
      });

      // Act & Assert
      await expect(
        GameSessionManager.createSession(gameId, creator, mapKey, hidingSpot)
      ).rejects.toThrow('Storage operation failed');

      expect(ErrorHandlingService.handleStorageError).toHaveBeenCalledWith(
        storageError,
        'Failed to create game session'
      );
    });
  });

  describe('getSession()', () => {
    it('should retrieve existing game session', async () => {
      // Arrange
      const gameId = 'test-game-123';
      const mockSession: GameSession = {
        gameId,
        creator: 'user-456',
        mapKey: 'bedroom',
        hidingSpot: {
          objectKey: 'pumpkin',
          relX: 0.5,
          relY: 0.3
        },
        createdAt: Date.now()
      };

      vi.mocked(RedisSchemaManager.validateGameId).mockReturnValue(undefined);
      vi.mocked(RedisSchemaManager.getGameSessionKey).mockReturnValue(`game_session:${gameId}`);
      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(mockSession));

      // Act
      const result = await GameSessionManager.getSession(gameId);

      // Assert
      expect(result).toEqual(mockSession);
      expect(RedisSchemaManager.validateGameId).toHaveBeenCalledWith(gameId);
      expect(redis.get).toHaveBeenCalledWith(`game_session:${gameId}`);
    });

    it('should return null when session does not exist', async () => {
      // Arrange
      const gameId = 'nonexistent-game';
      
      vi.mocked(RedisSchemaManager.validateGameId).mockReturnValue(undefined);
      vi.mocked(RedisSchemaManager.getGameSessionKey).mockReturnValue(`game_session:${gameId}`);
      vi.mocked(redis.get).mockResolvedValue(null);

      // Act
      const result = await GameSessionManager.getSession(gameId);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle corrupted session data', async () => {
      // Arrange
      const gameId = 'test-game-123';
      
      vi.mocked(RedisSchemaManager.validateGameId).mockReturnValue(undefined);
      vi.mocked(RedisSchemaManager.getGameSessionKey).mockReturnValue(`game_session:${gameId}`);
      vi.mocked(redis.get).mockResolvedValue('invalid-json');

      // Act
      const result = await GameSessionManager.getSession(gameId);

      // Assert
      expect(result).toBeNull();
      expect(ErrorHandlingService.logError).toHaveBeenCalled();
    });
  });

  describe('getSessionByPostId()', () => {
    it('should retrieve session by post ID', async () => {
      // Arrange
      const postId = 'reddit-post-123';
      const gameId = 'game-456';
      const mockSession: GameSession = {
        gameId,
        creator: 'user-789',
        mapKey: 'kitchen',
        hidingSpot: {
          objectKey: 'cup',
          relX: 0.2,
          relY: 0.8
        },
        createdAt: Date.now()
      };

      vi.mocked(RedisSchemaManager.getPostMappingKey).mockReturnValue(`post_mapping:${postId}`);
      vi.mocked(redis.get)
        .mockResolvedValueOnce(gameId) // First call for post mapping
        .mockResolvedValueOnce(JSON.stringify(mockSession)); // Second call for session

      // Act
      const result = await GameSessionManager.getSessionByPostId(postId);

      // Assert
      expect(result).toEqual(mockSession);
      expect(redis.get).toHaveBeenCalledWith(`post_mapping:${postId}`);
      expect(redis.get).toHaveBeenCalledWith(`game_session:${gameId}`);
    });

    it('should return null when post mapping does not exist', async () => {
      // Arrange
      const postId = 'nonexistent-post';
      
      vi.mocked(RedisSchemaManager.getPostMappingKey).mockReturnValue(`post_mapping:${postId}`);
      vi.mocked(redis.get).mockResolvedValue(null);

      // Act
      const result = await GameSessionManager.getSessionByPostId(postId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('updatePostMapping()', () => {
    it('should create post to game mapping', async () => {
      // Arrange
      const gameId = 'game-123';
      const postId = 'post-456';

      vi.mocked(RedisSchemaManager.validateGameId).mockReturnValue(undefined);
      vi.mocked(RedisSchemaManager.getPostMappingKey).mockReturnValue(`post_mapping:${postId}`);
      vi.mocked(redis.set).mockResolvedValue('OK');
      vi.mocked(redis.expire).mockResolvedValue(1);

      // Act
      await GameSessionManager.updatePostMapping(gameId, postId);

      // Assert
      expect(RedisSchemaManager.validateGameId).toHaveBeenCalledWith(gameId);
      expect(redis.set).toHaveBeenCalledWith(`post_mapping:${postId}`, gameId);
      expect(redis.expire).toHaveBeenCalledWith(`post_mapping:${postId}`, 2592000);
    });

    it('should handle mapping creation errors', async () => {
      // Arrange
      const gameId = 'game-123';
      const postId = 'post-456';
      const storageError = new Error('Redis connection failed');

      vi.mocked(redis.set).mockRejectedValue(storageError);
      vi.mocked(ErrorHandlingService.handleStorageError).mockImplementation(() => {
        throw new Error('Mapping creation failed');
      });

      // Act & Assert
      await expect(
        GameSessionManager.updatePostMapping(gameId, postId)
      ).rejects.toThrow('Mapping creation failed');
    });
  });
});