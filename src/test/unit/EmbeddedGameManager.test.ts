import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmbeddedGameManager } from '@client/game/services/EmbeddedGameManager';
import type { DevvitContext, EmbeddedGameConfig } from '@shared/types/environment';
import type { InitResponse } from '@shared/types/api';

// Mock the EnvironmentDetector
vi.mock('@client/game/services/EnvironmentDetector', () => ({
  EnvironmentDetector: vi.fn().mockImplementation(() => ({
    detect: vi.fn(),
    getContext: vi.fn()
  }))
}));

// Mock fetch
global.fetch = vi.fn();

describe('EmbeddedGameManager', () => {
  let manager: EmbeddedGameManager;
  let mockContext: DevvitContext;

  beforeEach(() => {
    manager = new EmbeddedGameManager();
    mockContext = {
      postId: 'test-post-123',
      user: {
        id: 'user-456',
        username: 'testuser'
      },
      subreddit: {
        name: 'testsubreddit'
      }
    };
    vi.clearAllMocks();
  });

  describe('initialize()', () => {
    it('should initialize game config for creator', async () => {
      // Arrange
      const mockInitResponse: InitResponse = {
        gameId: 'game-123',
        mapKey: 'bedroom',
        userRole: 'creator',
        hidingSpot: {
          objectKey: 'pumpkin',
          relX: 0.5,
          relY: 0.3
        }
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockInitResponse)
      } as Response);

      manager['context'] = mockContext;

      // Act
      const result = await manager.initialize();

      // Assert
      expect(result).toEqual({
        gameId: 'game-123',
        mapKey: 'bedroom',
        userRole: 'creator',
        hidingSpot: {
          objectKey: 'pumpkin',
          relX: 0.5,
          relY: 0.3
        }
      });

      expect(fetch).toHaveBeenCalledWith('/api/init', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Post-Id': 'test-post-123',
          'X-User-Id': 'user-456'
        }
      });
    });

    it('should initialize game config for guesser', async () => {
      // Arrange
      const mockInitResponse: InitResponse = {
        gameId: 'game-456',
        mapKey: 'kitchen',
        userRole: 'guesser'
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockInitResponse)
      } as Response);

      manager['context'] = mockContext;

      // Act
      const result = await manager.initialize();

      // Assert
      expect(result).toEqual({
        gameId: 'game-456',
        mapKey: 'kitchen',
        userRole: 'guesser'
      });

      expect(result.hidingSpot).toBeUndefined();
    });

    it('should throw error when API call fails', async () => {
      // Arrange
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response);

      manager['context'] = mockContext;

      // Act & Assert
      await expect(manager.initialize()).rejects.toThrow('Failed to initialize embedded game: 404 Not Found');
    });

    it('should throw error when no context is available', async () => {
      // Arrange
      manager['context'] = null;

      // Act & Assert
      await expect(manager.initialize()).rejects.toThrow('No context available for embedded game initialization');
    });
  });

  describe('isCreator()', () => {
    it('should return true when user is creator', () => {
      // Arrange
      manager['config'] = {
        gameId: 'game-123',
        mapKey: 'bedroom',
        userRole: 'creator'
      };

      // Act & Assert
      expect(manager.isCreator()).toBe(true);
    });

    it('should return false when user is guesser', () => {
      // Arrange
      manager['config'] = {
        gameId: 'game-123',
        mapKey: 'bedroom',
        userRole: 'guesser'
      };

      // Act & Assert
      expect(manager.isCreator()).toBe(false);
    });

    it('should return false when no config is available', () => {
      // Arrange
      manager['config'] = null;

      // Act & Assert
      expect(manager.isCreator()).toBe(false);
    });
  });

  describe('getGameId()', () => {
    it('should return game ID when config is available', () => {
      // Arrange
      manager['config'] = {
        gameId: 'game-789',
        mapKey: 'livingroom',
        userRole: 'guesser'
      };

      // Act & Assert
      expect(manager.getGameId()).toBe('game-789');
    });

    it('should return null when no config is available', () => {
      // Arrange
      manager['config'] = null;

      // Act & Assert
      expect(manager.getGameId()).toBeNull();
    });
  });

  describe('getMapKey()', () => {
    it('should return map key when config is available', () => {
      // Arrange
      manager['config'] = {
        gameId: 'game-123',
        mapKey: 'bathroom',
        userRole: 'creator'
      };

      // Act & Assert
      expect(manager.getMapKey()).toBe('bathroom');
    });

    it('should return null when no config is available', () => {
      // Arrange
      manager['config'] = null;

      // Act & Assert
      expect(manager.getMapKey()).toBeNull();
    });
  });

  describe('getHidingSpot()', () => {
    it('should return hiding spot for creator', () => {
      // Arrange
      const hidingSpot = {
        objectKey: 'teddy',
        relX: 0.7,
        relY: 0.4
      };

      manager['config'] = {
        gameId: 'game-123',
        mapKey: 'bedroom',
        userRole: 'creator',
        hidingSpot
      };

      // Act & Assert
      expect(manager.getHidingSpot()).toEqual(hidingSpot);
    });

    it('should return null for guesser', () => {
      // Arrange
      manager['config'] = {
        gameId: 'game-123',
        mapKey: 'bedroom',
        userRole: 'guesser'
      };

      // Act & Assert
      expect(manager.getHidingSpot()).toBeNull();
    });

    it('should return null when no config is available', () => {
      // Arrange
      manager['config'] = null;

      // Act & Assert
      expect(manager.getHidingSpot()).toBeNull();
    });
  });
});