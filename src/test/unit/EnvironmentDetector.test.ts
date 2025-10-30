import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnvironmentDetector } from '@client/game/services/EnvironmentDetector';
import type { DevvitContext } from '@shared/types/environment';

describe('EnvironmentDetector', () => {
  let detector: EnvironmentDetector;

  beforeEach(() => {
    detector = new EnvironmentDetector();
    detector.resetCache();
    vi.clearAllMocks();
  });

  describe('detect()', () => {
    it('should detect standalone mode when no devvit context exists', () => {
      // Arrange
      delete (global as any).devvit;
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      // Act
      const result = detector.detect();

      // Assert
      expect(result.mode).toBe('standalone');
      expect(result.context).toBeUndefined();
      expect(result.postId).toBeUndefined();
      expect(result.userId).toBeUndefined();
    });

    it('should detect embedded mode when devvit context exists', () => {
      // Arrange
      const mockContext: DevvitContext = {
        postId: 'test-post-123',
        user: {
          id: 'user-456',
          username: 'testuser'
        },
        subreddit: {
          name: 'testsubreddit'
        }
      };

      (global as any).devvit = {
        context: mockContext
      };

      // Act
      const result = detector.detect();

      // Assert
      expect(result.mode).toBe('embedded');
      expect(result.context).toEqual(mockContext);
      expect(result.postId).toBe('test-post-123');
      expect(result.userId).toBe('user-456');
    });

    it('should detect embedded mode from localStorage context', () => {
      // Arrange
      const mockContext: DevvitContext = {
        postId: 'stored-post-789',
        user: {
          id: 'stored-user-123',
          username: 'storeduser'
        },
        subreddit: {
          name: 'storedsubreddit'
        }
      };

      delete (global as any).devvit;
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(mockContext));

      // Act
      const result = detector.detect();

      // Assert
      expect(result.mode).toBe('embedded');
      expect(result.context).toEqual(mockContext);
      expect(result.postId).toBe('stored-post-789');
      expect(result.userId).toBe('stored-user-123');
    });

    it('should cache detection results', () => {
      // Arrange
      delete (global as any).devvit;
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      // Act
      const result1 = detector.detect();
      const result2 = detector.detect();

      // Assert
      expect(result1).toEqual(result2);
      expect(localStorage.getItem).toHaveBeenCalledTimes(1);
    });
  });

  describe('isEmbedded()', () => {
    it('should return true when in embedded mode', () => {
      // Arrange
      (global as any).devvit = {
        context: {
          postId: 'test-post',
          user: { id: 'user-1', username: 'test' },
          subreddit: { name: 'test' }
        }
      };

      // Act & Assert
      expect(detector.isEmbedded()).toBe(true);
    });

    it('should return false when in standalone mode', () => {
      // Arrange
      delete (global as any).devvit;
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      // Act & Assert
      expect(detector.isEmbedded()).toBe(false);
    });
  });

  describe('getContext()', () => {
    it('should return context when available', () => {
      // Arrange
      const mockContext: DevvitContext = {
        postId: 'test-post',
        user: { id: 'user-1', username: 'test' },
        subreddit: { name: 'test' }
      };

      (global as any).devvit = { context: mockContext };

      // Act
      const result = detector.getContext();

      // Assert
      expect(result).toEqual(mockContext);
    });

    it('should return null when no context available', () => {
      // Arrange
      delete (global as any).devvit;
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      // Act
      const result = detector.getContext();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('setMockContext()', () => {
    it('should set mock context for testing', () => {
      // Arrange
      const mockContext: DevvitContext = {
        postId: 'mock-post',
        user: { id: 'mock-user', username: 'mockuser' },
        subreddit: { name: 'mocksubreddit' }
      };

      // Act
      detector.setMockContext(mockContext);
      const result = detector.detect();

      // Assert
      expect(result.mode).toBe('embedded');
      expect(result.context).toEqual(mockContext);
    });

    it('should clear mock context when passed null', () => {
      // Arrange
      const mockContext: DevvitContext = {
        postId: 'mock-post',
        user: { id: 'mock-user', username: 'mockuser' },
        subreddit: { name: 'mocksubreddit' }
      };

      detector.setMockContext(mockContext);
      
      // Act
      detector.setMockContext(null);
      const result = detector.detect();

      // Assert
      expect(result.mode).toBe('standalone');
    });
  });
});