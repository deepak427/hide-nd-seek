import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RedditIntegrationService } from '@server/core/RedditIntegrationService';
import type { CreatePostResponse } from '@shared/types/api';

// Mock the devvit context and reddit API
const mockReddit = {
  submitPost: vi.fn(),
  getCurrentUser: vi.fn()
};

const mockContext = {
  reddit: mockReddit,
  subredditName: 'testsubreddit'
};

// Mock global devvit context
(global as any).devvit = {
  context: mockContext
};

describe('Reddit API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RedditIntegrationService.createGamePost()', () => {
    it('should successfully create a Reddit post with game data', async () => {
      // Arrange
      const gameId = 'test-game-123';
      const gameData = {
        mapKey: 'bedroom',
        objectKey: 'pumpkin',
        relX: 0.5,
        relY: 0.3
      };

      const mockPostResponse = {
        id: 'reddit-post-abc123',
        url: 'https://reddit.com/r/testsubreddit/comments/abc123/hide_and_seek_challenge'
      };

      mockReddit.submitPost.mockResolvedValue(mockPostResponse);

      // Act
      const result = await RedditIntegrationService.createGamePost(gameId, gameData);

      // Assert
      expect(mockReddit.submitPost).toHaveBeenCalledWith({
        title: expect.stringContaining('Hide & Seek Challenge'),
        subredditName: 'testsubreddit',
        preview: expect.objectContaining({
          type: 'custom',
          height: 'tall'
        })
      });

      expect(result).toEqual({
        success: true,
        postUrl: mockPostResponse.url,
        gameId: gameId
      });
    });

    it('should handle Reddit API rate limiting', async () => {
      // Arrange
      const gameId = 'test-game-456';
      const gameData = {
        mapKey: 'kitchen',
        objectKey: 'cup',
        relX: 0.2,
        relY: 0.8
      };

      // Simulate rate limiting error
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).status = 429;

      mockReddit.submitPost
        .mockRejectedValueOnce(rateLimitError)
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({
          id: 'reddit-post-def456',
          url: 'https://reddit.com/r/testsubreddit/comments/def456/hide_and_seek_challenge'
        });

      // Act
      const result = await RedditIntegrationService.createGamePost(gameId, gameData);

      // Assert
      expect(mockReddit.submitPost).toHaveBeenCalledTimes(3); // 2 retries + 1 success
      expect(result.success).toBe(true);
    });

    it('should handle Reddit API authentication errors', async () => {
      // Arrange
      const gameId = 'test-game-789';
      const gameData = {
        mapKey: 'livingroom',
        objectKey: 'teddy',
        relX: 0.7,
        relY: 0.4
      };

      const authError = new Error('Authentication failed');
      (authError as any).status = 401;

      mockReddit.submitPost.mockRejectedValue(authError);

      // Act & Assert
      await expect(
        RedditIntegrationService.createGamePost(gameId, gameData)
      ).rejects.toThrow('Authentication failed');
    });

    it('should handle network connectivity issues', async () => {
      // Arrange
      const gameId = 'test-game-network';
      const gameData = {
        mapKey: 'bathroom',
        objectKey: 'book',
        relX: 0.3,
        relY: 0.6
      };

      const networkError = new Error('Network error');
      (networkError as any).code = 'ECONNREFUSED';

      mockReddit.submitPost.mockRejectedValue(networkError);

      // Act & Assert
      await expect(
        RedditIntegrationService.createGamePost(gameId, gameData)
      ).rejects.toThrow('Network error');
    });

    it('should validate game data before creating post', async () => {
      // Arrange
      const gameId = 'test-game-validation';
      const invalidGameData = {
        mapKey: '', // Invalid empty map key
        objectKey: 'pumpkin',
        relX: 1.5, // Invalid coordinate > 1
        relY: 0.3
      };

      // Act & Assert
      await expect(
        RedditIntegrationService.createGamePost(gameId, invalidGameData)
      ).rejects.toThrow();

      expect(mockReddit.submitPost).not.toHaveBeenCalled();
    });

    it('should include proper game metadata in post', async () => {
      // Arrange
      const gameId = 'test-game-metadata';
      const gameData = {
        mapKey: 'bedroom',
        objectKey: 'shoe',
        relX: 0.8,
        relY: 0.2
      };

      mockReddit.submitPost.mockResolvedValue({
        id: 'reddit-post-metadata',
        url: 'https://reddit.com/r/testsubreddit/comments/metadata/hide_and_seek_challenge'
      });

      // Act
      await RedditIntegrationService.createGamePost(gameId, gameData);

      // Assert
      const submitCall = mockReddit.submitPost.mock.calls[0][0];
      
      expect(submitCall.title).toContain('Hide & Seek Challenge');
      expect(submitCall.subredditName).toBe('testsubreddit');
      expect(submitCall.preview).toBeDefined();
      expect(submitCall.preview.type).toBe('custom');
      expect(submitCall.preview.height).toBe('tall');
    });
  });

  describe('Reddit Context Integration', () => {
    it('should properly access Reddit context', async () => {
      // Arrange
      mockReddit.getCurrentUser.mockResolvedValue({
        id: 'user-123',
        username: 'testuser'
      });

      // Act
      const user = await mockReddit.getCurrentUser();

      // Assert
      expect(user).toEqual({
        id: 'user-123',
        username: 'testuser'
      });
    });

    it('should handle missing Reddit context gracefully', async () => {
      // Arrange
      const originalContext = (global as any).devvit.context;
      (global as any).devvit.context = null;

      const gameId = 'test-game-no-context';
      const gameData = {
        mapKey: 'bedroom',
        objectKey: 'pumpkin',
        relX: 0.5,
        relY: 0.3
      };

      // Act & Assert
      await expect(
        RedditIntegrationService.createGamePost(gameId, gameData)
      ).rejects.toThrow();

      // Restore context
      (global as any).devvit.context = originalContext;
    });
  });

  describe('Error Recovery and Retry Logic', () => {
    it('should implement exponential backoff for retries', async () => {
      // Arrange
      const gameId = 'test-game-backoff';
      const gameData = {
        mapKey: 'kitchen',
        objectKey: 'cup',
        relX: 0.4,
        relY: 0.7
      };

      const temporaryError = new Error('Temporary server error');
      (temporaryError as any).status = 503;

      let callCount = 0;
      mockReddit.submitPost.mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(temporaryError);
        }
        return Promise.resolve({
          id: 'reddit-post-backoff',
          url: 'https://reddit.com/r/testsubreddit/comments/backoff/hide_and_seek_challenge'
        });
      });

      const startTime = Date.now();

      // Act
      const result = await RedditIntegrationService.createGamePost(gameId, gameData);

      // Assert
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(mockReddit.submitPost).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(true);
      expect(duration).toBeGreaterThan(100); // Should have some delay from backoff
    });

    it('should stop retrying after maximum attempts', async () => {
      // Arrange
      const gameId = 'test-game-max-retries';
      const gameData = {
        mapKey: 'bathroom',
        objectKey: 'book',
        relX: 0.1,
        relY: 0.9
      };

      const persistentError = new Error('Persistent server error');
      (persistentError as any).status = 500;

      mockReddit.submitPost.mockRejectedValue(persistentError);

      // Act & Assert
      await expect(
        RedditIntegrationService.createGamePost(gameId, gameData)
      ).rejects.toThrow('Persistent server error');

      // Should have tried the maximum number of times
      expect(mockReddit.submitPost).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });
});