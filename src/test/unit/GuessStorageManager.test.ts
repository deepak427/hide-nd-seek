import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GuessStorageManager } from '@server/core/GuessStorageManager';
import type { GuessData, HidingSpot, GuessStatistics } from '@shared/types/api';

// Mock dependencies
vi.mock('@server/core/storage', () => ({
  redis: {
    zadd: vi.fn(),
    zrevrange: vi.fn(),
    zrange: vi.fn(),
    set: vi.fn(),
    get: vi.fn(),
    expire: vi.fn()
  }
}));

vi.mock('@server/core/RedisSchemaManager', () => ({
  RedisSchemaManager: {
    validateGuessData: vi.fn(),
    validateGameId: vi.fn(),
    getGuessKey: vi.fn(),
    getStatsKey: vi.fn()
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

describe('GuessStorageManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recordGuess()', () => {
    it('should record a correct guess successfully', async () => {
      // Arrange
      const gameId = 'game-123';
      const userId = 'user-456';
      const username = 'testuser';
      const objectKey = 'pumpkin';
      const relX = 0.5;
      const relY = 0.3;
      const actualHidingSpot: HidingSpot = {
        objectKey: 'pumpkin',
        relX: 0.5,
        relY: 0.3
      };

      vi.mocked(RedisSchemaManager.validateGameId).mockReturnValue(undefined);
      vi.mocked(RedisSchemaManager.validateGuessData).mockReturnValue(undefined);
      vi.mocked(RedisSchemaManager.getGuessKey).mockReturnValue(`game:${gameId}:guess:${userId}:123456789`);
      vi.mocked(redis.zadd).mockResolvedValue(1);
      vi.mocked(redis.expire).mockResolvedValue(1);

      // Mock updateStatistics method
      const updateStatsSpy = vi.spyOn(GuessStorageManager as any, 'updateStatistics').mockResolvedValue(undefined);

      // Act
      const result = await GuessStorageManager.recordGuess(
        gameId, userId, username, objectKey, relX, relY, actualHidingSpot
      );

      // Assert
      expect(result.isCorrect).toBe(true);
      expect(result.distance).toBe(0);
      expect(result.gameId).toBe(gameId);
      expect(result.userId).toBe(userId);
      expect(result.username).toBe(username);
      expect(result.objectKey).toBe(objectKey);
      expect(result.relX).toBe(relX);
      expect(result.relY).toBe(relY);

      expect(redis.zadd).toHaveBeenCalled();
      expect(updateStatsSpy).toHaveBeenCalledWith(gameId, result);
    });

    it('should record an incorrect guess with distance calculation', async () => {
      // Arrange
      const gameId = 'game-123';
      const userId = 'user-456';
      const username = 'testuser';
      const objectKey = 'teddy'; // Different object
      const relX = 0.7;
      const relY = 0.4;
      const actualHidingSpot: HidingSpot = {
        objectKey: 'pumpkin',
        relX: 0.5,
        relY: 0.3
      };

      vi.mocked(RedisSchemaManager.validateGameId).mockReturnValue(undefined);
      vi.mocked(RedisSchemaManager.validateGuessData).mockReturnValue(undefined);
      vi.mocked(RedisSchemaManager.getGuessKey).mockReturnValue(`game:${gameId}:guess:${userId}:123456789`);
      vi.mocked(redis.zadd).mockResolvedValue(1);
      vi.mocked(redis.expire).mockResolvedValue(1);

      const updateStatsSpy = vi.spyOn(GuessStorageManager as any, 'updateStatistics').mockResolvedValue(undefined);

      // Act
      const result = await GuessStorageManager.recordGuess(
        gameId, userId, username, objectKey, relX, relY, actualHidingSpot
      );

      // Assert
      expect(result.isCorrect).toBe(false);
      expect(result.distance).toBeGreaterThan(0);
      expect(result.objectKey).toBe(objectKey);
      expect(updateStatsSpy).toHaveBeenCalled();
    });

    it('should calculate distance correctly for same object different position', async () => {
      // Arrange
      const gameId = 'game-123';
      const userId = 'user-456';
      const username = 'testuser';
      const objectKey = 'pumpkin'; // Same object
      const relX = 0.8; // Different position
      const relY = 0.6;
      const actualHidingSpot: HidingSpot = {
        objectKey: 'pumpkin',
        relX: 0.5,
        relY: 0.3
      };

      vi.mocked(RedisSchemaManager.validateGameId).mockReturnValue(undefined);
      vi.mocked(RedisSchemaManager.validateGuessData).mockReturnValue(undefined);
      vi.mocked(RedisSchemaManager.getGuessKey).mockReturnValue(`game:${gameId}:guess:${userId}:123456789`);
      vi.mocked(redis.zadd).mockResolvedValue(1);
      vi.mocked(redis.expire).mockResolvedValue(1);

      const updateStatsSpy = vi.spyOn(GuessStorageManager as any, 'updateStatistics').mockResolvedValue(undefined);

      // Act
      const result = await GuessStorageManager.recordGuess(
        gameId, userId, username, objectKey, relX, relY, actualHidingSpot
      );

      // Assert
      expect(result.isCorrect).toBe(false); // Different position
      expect(result.distance).toBeCloseTo(0.36, 2); // Euclidean distance
      expect(updateStatsSpy).toHaveBeenCalled();
    });
  });

  describe('getGuesses()', () => {
    it('should retrieve all guesses for a game', async () => {
      // Arrange
      const gameId = 'game-123';
      const mockGuessData: GuessData[] = [
        {
          gameId,
          userId: 'user-1',
          username: 'user1',
          objectKey: 'pumpkin',
          relX: 0.5,
          relY: 0.3,
          isCorrect: true,
          distance: 0,
          timestamp: 1234567890
        },
        {
          gameId,
          userId: 'user-2',
          username: 'user2',
          objectKey: 'teddy',
          relX: 0.7,
          relY: 0.4,
          isCorrect: false,
          distance: 0.5,
          timestamp: 1234567891
        }
      ];

      vi.mocked(RedisSchemaManager.validateGameId).mockReturnValue(undefined);
      vi.mocked(redis.zrevrange).mockResolvedValue(mockGuessData.map(g => JSON.stringify(g)));

      // Act
      const result = await GuessStorageManager.getGuesses(gameId);

      // Assert
      expect(result).toEqual(mockGuessData);
      expect(redis.zrevrange).toHaveBeenCalledWith(`game:${gameId}:guesses`, 0, -1);
    });

    it('should return empty array when no guesses exist', async () => {
      // Arrange
      const gameId = 'game-empty';
      
      vi.mocked(RedisSchemaManager.validateGameId).mockReturnValue(undefined);
      vi.mocked(redis.zrevrange).mockResolvedValue([]);

      // Act
      const result = await GuessStorageManager.getGuesses(gameId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getUniqueGuessers()', () => {
    it('should return latest guess per user', async () => {
      // Arrange
      const gameId = 'game-123';
      const allGuesses: GuessData[] = [
        {
          gameId,
          userId: 'user-1',
          username: 'user1',
          objectKey: 'pumpkin',
          relX: 0.5,
          relY: 0.3,
          isCorrect: false,
          distance: 0.1,
          timestamp: 1234567890
        },
        {
          gameId,
          userId: 'user-1',
          username: 'user1',
          objectKey: 'teddy',
          relX: 0.7,
          relY: 0.4,
          isCorrect: true,
          distance: 0,
          timestamp: 1234567891 // Later timestamp
        },
        {
          gameId,
          userId: 'user-2',
          username: 'user2',
          objectKey: 'cup',
          relX: 0.2,
          relY: 0.8,
          isCorrect: false,
          distance: 0.3,
          timestamp: 1234567892
        }
      ];

      vi.mocked(RedisSchemaManager.validateGameId).mockReturnValue(undefined);
      vi.mocked(redis.zrevrange).mockResolvedValue(allGuesses.map(g => JSON.stringify(g)));

      // Act
      const result = await GuessStorageManager.getUniqueGuessers(gameId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe('user-1');
      expect(result[0].timestamp).toBe(1234567891); // Latest guess for user-1
      expect(result[1].userId).toBe('user-2');
    });
  });

  describe('getGuessStatistics()', () => {
    it('should return cached statistics when available', async () => {
      // Arrange
      const gameId = 'game-123';
      const mockStats: GuessStatistics = {
        totalGuesses: 5,
        correctGuesses: 2,
        uniqueGuessers: 3,
        averageDistance: 0.25
      };

      vi.mocked(RedisSchemaManager.validateGameId).mockReturnValue(undefined);
      vi.mocked(RedisSchemaManager.getStatsKey).mockReturnValue(`game:${gameId}:stats`);
      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(mockStats));

      // Act
      const result = await GuessStorageManager.getGuessStatistics(gameId);

      // Assert
      expect(result).toEqual(mockStats);
    });

    it('should calculate statistics when cache is empty', async () => {
      // Arrange
      const gameId = 'game-123';
      const mockGuesses: GuessData[] = [
        {
          gameId,
          userId: 'user-1',
          username: 'user1',
          objectKey: 'pumpkin',
          relX: 0.5,
          relY: 0.3,
          isCorrect: true,
          distance: 0,
          timestamp: 1234567890
        },
        {
          gameId,
          userId: 'user-2',
          username: 'user2',
          objectKey: 'teddy',
          relX: 0.7,
          relY: 0.4,
          isCorrect: false,
          distance: 0.5,
          timestamp: 1234567891
        }
      ];

      vi.mocked(RedisSchemaManager.validateGameId).mockReturnValue(undefined);
      vi.mocked(RedisSchemaManager.getStatsKey).mockReturnValue(`game:${gameId}:stats`);
      vi.mocked(redis.get).mockResolvedValue(null); // No cached stats
      vi.mocked(redis.zrevrange).mockResolvedValue(mockGuesses.map(g => JSON.stringify(g)));

      // Act
      const result = await GuessStorageManager.getGuessStatistics(gameId);

      // Assert
      expect(result.totalGuesses).toBe(2);
      expect(result.correctGuesses).toBe(1);
      expect(result.uniqueGuessers).toBe(2);
      expect(result.averageDistance).toBe(0.25);
    });
  });
});