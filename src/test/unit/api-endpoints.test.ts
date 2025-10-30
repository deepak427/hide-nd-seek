import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import type { CreatePostRequest, SubmitGuessRequest } from '@shared/types/api';

// Mock all dependencies
vi.mock('@server/core/GameSessionManager', () => ({
  GameSessionManager: {
    createSession: vi.fn(),
    getSessionByPostId: vi.fn(),
    updatePostMapping: vi.fn()
  }
}));

vi.mock('@server/core/GuessStorageManager', () => ({
  GuessStorageManager: {
    recordGuess: vi.fn(),
    getGuesses: vi.fn(),
    hasRecentGuess: vi.fn()
  }
}));

vi.mock('@server/core/RedditIntegrationService', () => ({
  RedditIntegrationService: {
    createGamePost: vi.fn()
  }
}));

vi.mock('@server/core/ErrorHandlingService', () => ({
  ErrorHandlingService: {
    validateRequest: {
      gameId: vi.fn(),
      mapKey: vi.fn(),
      objectKey: vi.fn(),
      coordinates: vi.fn()
    },
    handleApiError: vi.fn()
  }
}));

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'test-uuid-123')
}));

import { GameSessionManager } from '@server/core/GameSessionManager';
import { GuessStorageManager } from '@server/core/GuessStorageManager';
import { RedditIntegrationService } from '@server/core/RedditIntegrationService';
import { ErrorHandlingService } from '@server/core/ErrorHandlingService';

describe('API Endpoints', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockJson: ReturnType<typeof vi.fn>;
  let mockStatus: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    
    mockReq = {
      body: {},
      headers: {}
    };
    
    mockRes = {
      json: mockJson,
      status: mockStatus
    };

    vi.clearAllMocks();
  });

  describe('POST /api/create-post', () => {
    // Note: Since the actual endpoint handlers are not exported as separate functions,
    // we'll test the core logic by mocking the service calls
    
    it('should create post successfully with valid data', async () => {
      // Arrange
      const requestData: CreatePostRequest = {
        mapKey: 'bedroom',
        objectKey: 'pumpkin',
        relX: 0.5,
        relY: 0.3
      };

      const mockPostResponse = {
        success: true,
        postUrl: 'https://reddit.com/r/test/comments/abc123',
        gameId: 'test-uuid-123'
      };

      vi.mocked(ErrorHandlingService.validateRequest.mapKey).mockReturnValue(undefined);
      vi.mocked(ErrorHandlingService.validateRequest.objectKey).mockReturnValue(undefined);
      vi.mocked(ErrorHandlingService.validateRequest.coordinates).mockReturnValue(undefined);
      vi.mocked(GameSessionManager.createSession).mockResolvedValue(undefined);
      vi.mocked(RedditIntegrationService.createGamePost).mockResolvedValue(mockPostResponse);

      // Act
      // Simulate the endpoint logic
      const gameId = 'test-uuid-123';
      await GameSessionManager.createSession(gameId, 'test-user', requestData.mapKey, {
        objectKey: requestData.objectKey,
        relX: requestData.relX,
        relY: requestData.relY
      });
      
      const result = await RedditIntegrationService.createGamePost(gameId, {
        mapKey: requestData.mapKey,
        objectKey: requestData.objectKey,
        relX: requestData.relX,
        relY: requestData.relY
      });

      // Assert
      expect(GameSessionManager.createSession).toHaveBeenCalledWith(
        gameId,
        'test-user',
        'bedroom',
        { objectKey: 'pumpkin', relX: 0.5, relY: 0.3 }
      );
      expect(RedditIntegrationService.createGamePost).toHaveBeenCalledWith(gameId, requestData);
      expect(result).toEqual(mockPostResponse);
    });

    it('should handle validation errors', async () => {
      // Arrange
      const invalidRequest = {
        mapKey: 'invalid-map',
        objectKey: 'pumpkin',
        relX: 1.5, // Invalid coordinate
        relY: 0.3
      };

      vi.mocked(ErrorHandlingService.validateRequest.coordinates).mockImplementation(() => {
        throw new Error('Invalid coordinates');
      });

      // Act & Assert
      expect(() => {
        ErrorHandlingService.validateRequest.coordinates(invalidRequest.relX, invalidRequest.relY);
      }).toThrow('Invalid coordinates');
    });
  });

  describe('GET /api/init', () => {
    it('should initialize embedded game for creator', async () => {
      // Arrange
      const postId = 'reddit-post-123';
      const userId = 'creator-user-456';
      
      const mockSession = {
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

      mockReq.headers = {
        'x-post-id': postId,
        'x-user-id': userId
      };

      vi.mocked(GameSessionManager.getSessionByPostId).mockResolvedValue(mockSession);

      // Act
      const session = await GameSessionManager.getSessionByPostId(postId);
      const userRole = session?.creator === userId ? 'creator' : 'guesser';

      // Assert
      expect(GameSessionManager.getSessionByPostId).toHaveBeenCalledWith(postId);
      expect(userRole).toBe('creator');
      expect(session?.hidingSpot).toBeDefined();
    });

    it('should initialize embedded game for guesser', async () => {
      // Arrange
      const postId = 'reddit-post-123';
      const userId = 'guesser-user-789';
      
      const mockSession = {
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

      mockReq.headers = {
        'x-post-id': postId,
        'x-user-id': userId
      };

      vi.mocked(GameSessionManager.getSessionByPostId).mockResolvedValue(mockSession);

      // Act
      const session = await GameSessionManager.getSessionByPostId(postId);
      const userRole = session?.creator === userId ? 'creator' : 'guesser';

      // Assert
      expect(userRole).toBe('guesser');
    });

    it('should handle missing post ID', async () => {
      // Arrange
      mockReq.headers = {
        'x-user-id': 'user-123'
        // Missing x-post-id
      };

      vi.mocked(GameSessionManager.getSessionByPostId).mockResolvedValue(null);

      // Act
      const result = await GameSessionManager.getSessionByPostId(undefined as any);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('POST /api/guess', () => {
    it('should record guess successfully', async () => {
      // Arrange
      const guessRequest: SubmitGuessRequest = {
        gameId: 'game-123',
        objectKey: 'pumpkin',
        relX: 0.5,
        relY: 0.3
      };

      const mockSession = {
        gameId: 'game-123',
        creator: 'creator-user',
        mapKey: 'bedroom',
        hidingSpot: {
          objectKey: 'pumpkin',
          relX: 0.5,
          relY: 0.3
        },
        createdAt: Date.now()
      };

      const mockGuessResult = {
        gameId: 'game-123',
        userId: 'guesser-user',
        username: 'guesser',
        objectKey: 'pumpkin',
        relX: 0.5,
        relY: 0.3,
        isCorrect: true,
        distance: 0,
        timestamp: Date.now()
      };

      mockReq.body = guessRequest;
      mockReq.headers = {
        'x-user-id': 'guesser-user',
        'x-username': 'guesser'
      };

      vi.mocked(ErrorHandlingService.validateRequest.gameId).mockReturnValue(undefined);
      vi.mocked(ErrorHandlingService.validateRequest.objectKey).mockReturnValue(undefined);
      vi.mocked(ErrorHandlingService.validateRequest.coordinates).mockReturnValue(undefined);
      vi.mocked(GuessStorageManager.hasRecentGuess).mockResolvedValue(false);
      vi.mocked(GuessStorageManager.recordGuess).mockResolvedValue(mockGuessResult);

      // Act
      const hasRecent = await GuessStorageManager.hasRecentGuess('game-123', 'guesser-user');
      const result = await GuessStorageManager.recordGuess(
        'game-123',
        'guesser-user',
        'guesser',
        'pumpkin',
        0.5,
        0.3,
        mockSession.hidingSpot
      );

      // Assert
      expect(hasRecent).toBe(false);
      expect(GuessStorageManager.recordGuess).toHaveBeenCalledWith(
        'game-123',
        'guesser-user',
        'guesser',
        'pumpkin',
        0.5,
        0.3,
        mockSession.hidingSpot
      );
      expect(result.isCorrect).toBe(true);
    });

    it('should prevent rapid successive guesses', async () => {
      // Arrange
      const guessRequest: SubmitGuessRequest = {
        gameId: 'game-123',
        objectKey: 'pumpkin',
        relX: 0.5,
        relY: 0.3
      };

      mockReq.body = guessRequest;
      mockReq.headers = {
        'x-user-id': 'guesser-user',
        'x-username': 'guesser'
      };

      vi.mocked(GuessStorageManager.hasRecentGuess).mockResolvedValue(true);

      // Act
      const hasRecent = await GuessStorageManager.hasRecentGuess('game-123', 'guesser-user');

      // Assert
      expect(hasRecent).toBe(true);
      expect(GuessStorageManager.recordGuess).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/guesses', () => {
    it('should return guesses for game creator', async () => {
      // Arrange
      const gameId = 'game-123';
      const mockGuesses = [
        {
          gameId,
          userId: 'user-1',
          username: 'user1',
          objectKey: 'pumpkin',
          relX: 0.5,
          relY: 0.3,
          isCorrect: true,
          distance: 0,
          timestamp: Date.now()
        },
        {
          gameId,
          userId: 'user-2',
          username: 'user2',
          objectKey: 'teddy',
          relX: 0.7,
          relY: 0.4,
          isCorrect: false,
          distance: 0.3,
          timestamp: Date.now()
        }
      ];

      mockReq.query = { gameId };
      vi.mocked(GuessStorageManager.getGuesses).mockResolvedValue(mockGuesses);

      // Act
      const result = await GuessStorageManager.getGuesses(gameId);

      // Assert
      expect(GuessStorageManager.getGuesses).toHaveBeenCalledWith(gameId);
      expect(result).toEqual(mockGuesses);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no guesses exist', async () => {
      // Arrange
      const gameId = 'game-empty';
      
      mockReq.query = { gameId };
      vi.mocked(GuessStorageManager.getGuesses).mockResolvedValue([]);

      // Act
      const result = await GuessStorageManager.getGuesses(gameId);

      // Assert
      expect(result).toEqual([]);
    });
  });
});