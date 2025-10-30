import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameSessionManager } from '@server/core/GameSessionManager';
import { GuessStorageManager } from '@server/core/GuessStorageManager';
import { DataExpirationManager } from '@server/core/DataExpirationManager';
import type { GameSession, GuessData, HidingSpot } from '@shared/types/api';

// Mock Redis client for integration testing
const mockRedisClient = {
  set: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
  exists: vi.fn(),
  expire: vi.fn(),
  zadd: vi.fn(),
  zrevrange: vi.fn(),
  zrange: vi.fn(),
  keys: vi.fn(),
  scan: vi.fn(),
  pipeline: vi.fn(() => ({
    del: vi.fn(),
    exec: vi.fn()
  })),
  quit: vi.fn(),
  ping: vi.fn()
};

// Mock the storage module
vi.mock('@server/core/storage', () => ({
  redis: mockRedisClient
}));

describe('Database Operations Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Game Session Lifecycle', () => {
    it('should create, retrieve, and manage game session lifecycle', async () => {
      // Arrange
      const gameId = 'integration-game-123';
      const creator = 'creator-user-456';
      const mapKey = 'bedroom';
      const hidingSpot: HidingSpot = {
        objectKey: 'pumpkin',
        relX: 0.5,
        relY: 0.3
      };

      const expectedSession: GameSession = {
        gameId,
        creator,
        mapKey,
        hidingSpot,
        createdAt: expect.any(Number)
      };

      // Mock successful Redis operations
      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.expire.mockResolvedValue(1);
      mockRedisClient.get.mockResolvedValue(JSON.stringify(expectedSession));

      // Act - Create session
      await GameSessionManager.createSession(gameId, creator, mapKey, hidingSpot);

      // Assert - Session creation
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        `game_session:${gameId}`,
        expect.stringContaining(gameId)
      );
      expect(mockRedisClient.expire).toHaveBeenCalledWith(
        `game_session:${gameId}`,
        2592000 // 30 days
      );

      // Act - Retrieve session
      const retrievedSession = await GameSessionManager.getSession(gameId);

      // Assert - Session retrieval
      expect(mockRedisClient.get).toHaveBeenCalledWith(`game_session:${gameId}`);
      expect(retrievedSession).toMatchObject({
        gameId,
        creator,
        mapKey,
        hidingSpot
      });
    });

    it('should handle post mapping creation and retrieval', async () => {
      // Arrange
      const gameId = 'integration-game-456';
      const postId = 'reddit-post-789';
      const mockSession: GameSession = {
        gameId,
        creator: 'creator-user',
        mapKey: 'kitchen',
        hidingSpot: {
          objectKey: 'cup',
          relX: 0.2,
          relY: 0.8
        },
        createdAt: Date.now()
      };

      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.expire.mockResolvedValue(1);
      mockRedisClient.get
        .mockResolvedValueOnce(gameId) // Post mapping lookup
        .mockResolvedValueOnce(JSON.stringify(mockSession)); // Session lookup

      // Act - Create post mapping
      await GameSessionManager.updatePostMapping(gameId, postId);

      // Assert - Post mapping creation
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        `post_mapping:${postId}`,
        gameId
      );
      expect(mockRedisClient.expire).toHaveBeenCalledWith(
        `post_mapping:${postId}`,
        2592000
      );

      // Act - Retrieve session by post ID
      const retrievedSession = await GameSessionManager.getSessionByPostId(postId);

      // Assert - Session retrieval by post ID
      expect(mockRedisClient.get).toHaveBeenCalledWith(`post_mapping:${postId}`);
      expect(mockRedisClient.get).toHaveBeenCalledWith(`game_session:${gameId}`);
      expect(retrievedSession).toEqual(mockSession);
    });
  });

  describe('Guess Storage and Retrieval', () => {
    it('should record and retrieve guesses with proper ordering', async () => {
      // Arrange
      const gameId = 'integration-game-guesses';
      const hidingSpot: HidingSpot = {
        objectKey: 'teddy',
        relX: 0.7,
        relY: 0.4
      };

      const guess1: Omit<GuessData, 'timestamp' | 'isCorrect' | 'distance'> = {
        gameId,
        userId: 'user-1',
        username: 'user1',
        objectKey: 'pumpkin',
        relX: 0.5,
        relY: 0.3
      };

      const guess2: Omit<GuessData, 'timestamp' | 'isCorrect' | 'distance'> = {
        gameId,
        userId: 'user-2',
        username: 'user2',
        objectKey: 'teddy',
        relX: 0.7,
        relY: 0.4
      };

      mockRedisClient.zadd.mockResolvedValue(1);
      mockRedisClient.expire.mockResolvedValue(1);
      mockRedisClient.set.mockResolvedValue('OK'); // For statistics

      // Act - Record first guess (incorrect)
      const recordedGuess1 = await GuessStorageManager.recordGuess(
        guess1.gameId,
        guess1.userId,
        guess1.username,
        guess1.objectKey,
        guess1.relX,
        guess1.relY,
        hidingSpot
      );

      // Act - Record second guess (correct)
      const recordedGuess2 = await GuessStorageManager.recordGuess(
        guess2.gameId,
        guess2.userId,
        guess2.username,
        guess2.objectKey,
        guess2.relX,
        guess2.relY,
        hidingSpot
      );

      // Assert - Guess recording
      expect(recordedGuess1.isCorrect).toBe(false);
      expect(recordedGuess1.distance).toBeGreaterThan(0);
      expect(recordedGuess2.isCorrect).toBe(true);
      expect(recordedGuess2.distance).toBe(0);

      expect(mockRedisClient.zadd).toHaveBeenCalledTimes(2);
      expect(mockRedisClient.expire).toHaveBeenCalled();

      // Mock retrieval
      const mockGuesses = [recordedGuess2, recordedGuess1]; // Reverse chronological order
      mockRedisClient.zrevrange.mockResolvedValue(
        mockGuesses.map(g => JSON.stringify(g))
      );

      // Act - Retrieve guesses
      const retrievedGuesses = await GuessStorageManager.getGuesses(gameId);

      // Assert - Guess retrieval
      expect(mockRedisClient.zrevrange).toHaveBeenCalledWith(
        `game:${gameId}:guesses`,
        0,
        -1
      );
      expect(retrievedGuesses).toHaveLength(2);
      expect(retrievedGuesses[0].timestamp).toBeGreaterThanOrEqual(retrievedGuesses[1].timestamp);
    });

    it('should calculate and cache statistics correctly', async () => {
      // Arrange
      const gameId = 'integration-game-stats';
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
          timestamp: Date.now() - 1000
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
          timestamp: Date.now() - 500
        },
        {
          gameId,
          userId: 'user-1',
          username: 'user1',
          objectKey: 'cup',
          relX: 0.2,
          relY: 0.8,
          isCorrect: false,
          distance: 0.3,
          timestamp: Date.now()
        }
      ];

      // Mock no cached stats, then return guesses for calculation
      mockRedisClient.get
        .mockResolvedValueOnce(null) // No cached stats
        .mockResolvedValueOnce(null); // No cached stats for update
      
      mockRedisClient.zrevrange.mockResolvedValue(
        mockGuesses.map(g => JSON.stringify(g))
      );
      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.expire.mockResolvedValue(1);

      // Act
      const statistics = await GuessStorageManager.getGuessStatistics(gameId);

      // Assert
      expect(statistics.totalGuesses).toBe(3);
      expect(statistics.correctGuesses).toBe(1);
      expect(statistics.uniqueGuessers).toBe(2);
      expect(statistics.averageDistance).toBeCloseTo(0.27, 2); // (0 + 0.5 + 0.3) / 3

      // Verify statistics were cached
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        `game:${gameId}:stats`,
        expect.stringContaining('"totalGuesses":3')
      );
    });
  });

  describe('Data Expiration and Cleanup', () => {
    it('should properly set expiration times on all data', async () => {
      // Arrange
      const gameId = 'integration-game-expiry';
      const creator = 'creator-user';
      const mapKey = 'livingroom';
      const hidingSpot: HidingSpot = {
        objectKey: 'book',
        relX: 0.3,
        relY: 0.6
      };

      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.expire.mockResolvedValue(1);
      mockRedisClient.zadd.mockResolvedValue(1);

      // Act - Create session and record guess
      await GameSessionManager.createSession(gameId, creator, mapKey, hidingSpot);
      await GuessStorageManager.recordGuess(
        gameId,
        'guesser-user',
        'guesser',
        'book',
        0.3,
        0.6,
        hidingSpot
      );

      // Assert - All data has expiration set
      expect(mockRedisClient.expire).toHaveBeenCalledWith(
        `game_session:${gameId}`,
        2592000 // 30 days
      );
      expect(mockRedisClient.expire).toHaveBeenCalledWith(
        expect.stringMatching(/^game:.*:guess:/),
        2592000
      );
    });

    it('should handle cleanup operations for expired data', async () => {
      // Arrange
      const expiredKeys = [
        'game_session:expired-game-1',
        'game:expired-game-1:guesses',
        'game:expired-game-1:stats',
        'post_mapping:expired-post-1'
      ];

      mockRedisClient.scan.mockResolvedValue(['0', expiredKeys]);
      mockRedisClient.exists.mockResolvedValue(0); // Keys don't exist (expired)
      
      const mockPipeline = {
        del: vi.fn(),
        exec: vi.fn().mockResolvedValue([])
      };
      mockRedisClient.pipeline.mockReturnValue(mockPipeline);

      // Act
      const cleanupResult = await DataExpirationManager.performCleanup();

      // Assert
      expect(mockRedisClient.scan).toHaveBeenCalled();
      expect(cleanupResult.deletedKeys).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Cross-Component Data Integrity', () => {
    it('should maintain data consistency across game session and guess operations', async () => {
      // Arrange
      const gameId = 'integration-consistency-test';
      const creator = 'creator-user';
      const guesser = 'guesser-user';
      const mapKey = 'bathroom';
      const hidingSpot: HidingSpot = {
        objectKey: 'shoe',
        relX: 0.8,
        relY: 0.2
      };

      const mockSession: GameSession = {
        gameId,
        creator,
        mapKey,
        hidingSpot,
        createdAt: Date.now()
      };

      // Mock all Redis operations
      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.expire.mockResolvedValue(1);
      mockRedisClient.zadd.mockResolvedValue(1);
      mockRedisClient.get.mockResolvedValue(JSON.stringify(mockSession));
      mockRedisClient.zrevrange.mockResolvedValue([]);

      // Act - Complete workflow
      // 1. Create game session
      await GameSessionManager.createSession(gameId, creator, mapKey, hidingSpot);
      
      // 2. Retrieve session to verify creation
      const retrievedSession = await GameSessionManager.getSession(gameId);
      
      // 3. Record a guess
      const guessResult = await GuessStorageManager.recordGuess(
        gameId,
        guesser,
        'guesser',
        'shoe',
        0.8,
        0.2,
        hidingSpot
      );
      
      // 4. Get guesses to verify storage
      const guesses = await GuessStorageManager.getGuesses(gameId);

      // Assert - Data consistency
      expect(retrievedSession?.gameId).toBe(gameId);
      expect(guessResult.gameId).toBe(gameId);
      expect(guessResult.isCorrect).toBe(true);
      
      // Verify all operations used consistent game ID
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        `game_session:${gameId}`,
        expect.any(String)
      );
      expect(mockRedisClient.zadd).toHaveBeenCalledWith(
        `game:${gameId}:guesses`,
        expect.any(Number),
        expect.any(String)
      );
    });

    it('should handle concurrent operations gracefully', async () => {
      // Arrange
      const gameId = 'integration-concurrent-test';
      const hidingSpot: HidingSpot = {
        objectKey: 'wardrobe',
        relX: 0.1,
        relY: 0.9
      };

      mockRedisClient.zadd.mockResolvedValue(1);
      mockRedisClient.expire.mockResolvedValue(1);
      mockRedisClient.set.mockResolvedValue('OK');

      // Act - Simulate concurrent guess submissions
      const concurrentGuesses = Promise.all([
        GuessStorageManager.recordGuess(gameId, 'user-1', 'user1', 'pumpkin', 0.5, 0.3, hidingSpot),
        GuessStorageManager.recordGuess(gameId, 'user-2', 'user2', 'teddy', 0.7, 0.4, hidingSpot),
        GuessStorageManager.recordGuess(gameId, 'user-3', 'user3', 'wardrobe', 0.1, 0.9, hidingSpot)
      ]);

      const results = await concurrentGuesses;

      // Assert - All operations completed successfully
      expect(results).toHaveLength(3);
      expect(results[0].userId).toBe('user-1');
      expect(results[1].userId).toBe('user-2');
      expect(results[2].userId).toBe('user-3');
      expect(results[2].isCorrect).toBe(true); // Only user-3 guessed correctly

      // Verify Redis operations were called for each guess
      expect(mockRedisClient.zadd).toHaveBeenCalledTimes(3);
    });
  });
});