import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnvironmentDetector } from '@client/game/services/EnvironmentDetector';
import { EmbeddedGameManager } from '@client/game/services/EmbeddedGameManager';
import { GameSessionManager } from '@server/core/GameSessionManager';
import { GuessStorageManager } from '@server/core/GuessStorageManager';
import { RedditIntegrationService } from '@server/core/RedditIntegrationService';
import type { DevvitContext, EmbeddedGameConfig } from '@shared/types/environment';
import type { GameSession, HidingSpot } from '@shared/types/api';

// Mock all external dependencies
vi.mock('@server/core/storage', () => ({
  redis: {
    set: vi.fn().mockResolvedValue('OK'),
    get: vi.fn(),
    zadd: vi.fn().mockResolvedValue(1),
    zrevrange: vi.fn().mockResolvedValue([]),
    expire: vi.fn().mockResolvedValue(1)
  }
}));

// Mock fetch for client-side API calls
global.fetch = vi.fn();

describe('Cross-Component Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Game Creation Flow', () => {
    it('should handle full game creation from standalone to Reddit post', async () => {
      // Arrange - Standalone game creation
      const gameData = {
        mapKey: 'bedroom',
        objectKey: 'pumpkin',
        relX: 0.5,
        relY: 0.3
      };

      const gameId = 'integration-flow-123';
      const creator = 'creator-user-456';
      const postId = 'reddit-post-789';

      // Mock Reddit API response
      const mockRedditResponse = {
        id: postId,
        url: 'https://reddit.com/r/testsubreddit/comments/789/hide_and_seek_challenge'
      };

      // Mock devvit context
      (global as any).devvit = {
        context: {
          reddit: {
            submitPost: vi.fn().mockResolvedValue(mockRedditResponse)
          },
          subredditName: 'testsubreddit'
        }
      };

      // Act - Simulate complete flow
      // 1. Create game session (backend)
      await GameSessionManager.createSession(gameId, creator, gameData.mapKey, {
        objectKey: gameData.objectKey,
        relX: gameData.relX,
        relY: gameData.relY
      });

      // 2. Create Reddit post (backend)
      const postResult = await RedditIntegrationService.createGamePost(gameId, gameData);

      // 3. Update post mapping (backend)
      await GameSessionManager.updatePostMapping(gameId, postId);

      // Assert - Complete flow validation
      expect(postResult.success).toBe(true);
      expect(postResult.gameId).toBe(gameId);
      expect(postResult.postUrl).toBe(mockRedditResponse.url);
    });
  });

  describe('Embedded Game Initialization Flow', () => {
    it('should handle complete embedded game initialization for creator', async () => {
      // Arrange
      const mockContext: DevvitContext = {
        postId: 'reddit-post-123',
        user: {
          id: 'creator-user-456',
          username: 'creator'
        },
        subreddit: {
          name: 'testsubreddit'
        }
      };

      const mockSession: GameSession = {
        gameId: 'game-789',
        creator: 'creator-user-456',
        mapKey: 'kitchen',
        hidingSpot: {
          objectKey: 'cup',
          relX: 0.2,
          relY: 0.8
        },
        createdAt: Date.now()
      };

      // Mock environment detection
      (global as any).devvit = { context: mockContext };

      // Mock API response for initialization
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          gameId: mockSession.gameId,
          mapKey: mockSession.mapKey,
          userRole: 'creator',
          hidingSpot: mockSession.hidingSpot
        })
      } as Response);

      // Act - Complete embedded initialization flow
      // 1. Detect environment
      const detector = new EnvironmentDetector();
      const detection = detector.detect();

      // 2. Initialize embedded game manager
      const embeddedManager = new EmbeddedGameManager();
      const config = await embeddedManager.initialize();

      // Assert - Environment detection
      expect(detection.mode).toBe('embedded');
      expect(detection.context).toEqual(mockContext);
      expect(detection.postId).toBe('reddit-post-123');
      expect(detection.userId).toBe('creator-user-456');

      // Assert - Embedded game configuration
      expect(config.gameId).toBe('game-789');
      expect(config.mapKey).toBe('kitchen');
      expect(config.userRole).toBe('creator');
      expect(config.hidingSpot).toEqual(mockSession.hidingSpot);

      // Assert - API call was made correctly
      expect(fetch).toHaveBeenCalledWith('/api/init', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Post-Id': 'reddit-post-123',
          'X-User-Id': 'creator-user-456'
        }
      });
    });

    it('should handle complete embedded game initialization for guesser', async () => {
      // Arrange
      const mockContext: DevvitContext = {
        postId: 'reddit-post-123',
        user: {
          id: 'guesser-user-789',
          username: 'guesser'
        },
        subreddit: {
          name: 'testsubreddit'
        }
      };

      // Mock environment detection
      (global as any).devvit = { context: mockContext };

      // Mock API response for guesser initialization
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          gameId: 'game-789',
          mapKey: 'kitchen',
          userRole: 'guesser'
          // No hidingSpot for guesser
        })
      } as Response);

      // Act - Complete embedded initialization flow for guesser
      const detector = new EnvironmentDetector();
      const detection = detector.detect();

      const embeddedManager = new EmbeddedGameManager();
      const config = await embeddedManager.initialize();

      // Assert - Guesser-specific configuration
      expect(detection.userId).toBe('guesser-user-789');
      expect(config.userRole).toBe('guesser');
      expect(config.hidingSpot).toBeUndefined();
      expect(embeddedManager.isCreator()).toBe(false);
    });
  });

  describe('Guess Submission Flow', () => {
    it('should handle complete guess submission and validation flow', async () => {
      // Arrange
      const gameId = 'integration-guess-123';
      const userId = 'guesser-user-456';
      const username = 'guesser';
      const hidingSpot: HidingSpot = {
        objectKey: 'teddy',
        relX: 0.7,
        relY: 0.4
      };

      // Mock guess submission API call
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          isCorrect: true,
          message: 'Correct! You found the hidden object!',
          distance: 0
        })
      } as Response);

      // Act - Complete guess submission flow
      // 1. Submit guess via API (client-side)
      const guessResponse = await fetch('/api/guess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
          'X-Username': username
        },
        body: JSON.stringify({
          gameId,
          objectKey: 'teddy',
          relX: 0.7,
          relY: 0.4
        })
      });

      const guessResult = await guessResponse.json();

      // 2. Record guess in storage (backend simulation)
      const recordedGuess = await GuessStorageManager.recordGuess(
        gameId,
        userId,
        username,
        'teddy',
        0.7,
        0.4,
        hidingSpot
      );

      // Assert - Guess submission flow
      expect(guessResult.success).toBe(true);
      expect(guessResult.isCorrect).toBe(true);
      expect(recordedGuess.isCorrect).toBe(true);
      expect(recordedGuess.distance).toBe(0);
      expect(recordedGuess.gameId).toBe(gameId);
      expect(recordedGuess.userId).toBe(userId);
    });

    it('should handle incorrect guess with distance calculation', async () => {
      // Arrange
      const gameId = 'integration-incorrect-guess';
      const userId = 'guesser-user-789';
      const username = 'guesser2';
      const hidingSpot: HidingSpot = {
        objectKey: 'pumpkin',
        relX: 0.5,
        relY: 0.3
      };

      // Mock incorrect guess API response
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          isCorrect: false,
          message: 'Not quite right. Try again!',
          distance: 0.36
        })
      } as Response);

      // Act - Submit incorrect guess
      const guessResponse = await fetch('/api/guess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
          'X-Username': username
        },
        body: JSON.stringify({
          gameId,
          objectKey: 'teddy', // Wrong object
          relX: 0.8,           // Wrong position
          relY: 0.6
        })
      });

      const guessResult = await guessResponse.json();

      // Simulate backend guess recording
      const recordedGuess = await GuessStorageManager.recordGuess(
        gameId,
        userId,
        username,
        'teddy',
        0.8,
        0.6,
        hidingSpot
      );

      // Assert - Incorrect guess handling
      expect(guessResult.success).toBe(true);
      expect(guessResult.isCorrect).toBe(false);
      expect(recordedGuess.isCorrect).toBe(false);
      expect(recordedGuess.distance).toBeGreaterThan(0);
    });
  });

  describe('Creator Dashboard Flow', () => {
    it('should handle complete creator dashboard data flow', async () => {
      // Arrange
      const gameId = 'integration-dashboard-123';
      const mockGuesses = [
        {
          gameId,
          userId: 'user-1',
          username: 'player1',
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
          username: 'player2',
          objectKey: 'teddy',
          relX: 0.7,
          relY: 0.4,
          isCorrect: false,
          distance: 0.3,
          timestamp: Date.now() - 500
        }
      ];

      // Mock guesses API response
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          guesses: mockGuesses,
          totalGuesses: 2,
          correctGuesses: 1
        })
      } as Response);

      // Act - Load dashboard data
      const dashboardResponse = await fetch(`/api/guesses?gameId=${gameId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const dashboardData = await dashboardResponse.json();

      // Simulate backend data retrieval
      const retrievedGuesses = await GuessStorageManager.getGuesses(gameId);
      const statistics = await GuessStorageManager.getGuessStatistics(gameId);

      // Assert - Dashboard data flow
      expect(dashboardData.guesses).toHaveLength(2);
      expect(dashboardData.totalGuesses).toBe(2);
      expect(dashboardData.correctGuesses).toBe(1);
      
      // Verify data consistency between API and storage
      expect(retrievedGuesses).toEqual(mockGuesses);
      expect(statistics.totalGuesses).toBe(2);
      expect(statistics.correctGuesses).toBe(1);
    });
  });

  describe('Error Handling Across Components', () => {
    it('should handle network errors gracefully across the system', async () => {
      // Arrange - Simulate network failure
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      const embeddedManager = new EmbeddedGameManager();

      // Act & Assert - Network error handling
      await expect(embeddedManager.initialize()).rejects.toThrow('No context available');
    });

    it('should handle invalid game data across components', async () => {
      // Arrange - Invalid game data
      const invalidGameData = {
        mapKey: '', // Invalid
        objectKey: 'invalid-object',
        relX: 1.5, // Invalid coordinate
        relY: -0.1 // Invalid coordinate
      };

      // Act & Assert - Validation should fail
      await expect(
        RedditIntegrationService.createGamePost('test-game', invalidGameData)
      ).rejects.toThrow();
    });
  });

  describe('Data Consistency Across Components', () => {
    it('should maintain data consistency between client and server operations', async () => {
      // Arrange
      const gameId = 'consistency-test-123';
      const postId = 'reddit-post-456';
      const creator = 'creator-user';
      const mapKey = 'bathroom';
      const hidingSpot: HidingSpot = {
        objectKey: 'book',
        relX: 0.3,
        relY: 0.6
      };

      // Mock context for embedded game
      const mockContext: DevvitContext = {
        postId,
        user: { id: creator, username: 'creator' },
        subreddit: { name: 'testsubreddit' }
      };

      (global as any).devvit = { context: mockContext };

      // Mock API responses
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          gameId,
          mapKey,
          userRole: 'creator',
          hidingSpot
        })
      } as Response);

      // Act - Complete data flow
      // 1. Create session (server)
      await GameSessionManager.createSession(gameId, creator, mapKey, hidingSpot);
      
      // 2. Update post mapping (server)
      await GameSessionManager.updatePostMapping(gameId, postId);
      
      // 3. Initialize embedded game (client)
      const embeddedManager = new EmbeddedGameManager();
      const config = await embeddedManager.initialize();

      // Assert - Data consistency
      expect(config.gameId).toBe(gameId);
      expect(config.mapKey).toBe(mapKey);
      expect(config.hidingSpot).toEqual(hidingSpot);
      expect(config.userRole).toBe('creator');
    });
  });
});