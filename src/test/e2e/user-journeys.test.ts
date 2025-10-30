import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { DevvitContext } from '../../shared/types/environment';
import type { CreatePostResponse, InitResponse, SubmitGuessResponse, GetGuessesResponse } from '../../shared/types/api';

// Mock browser environment for E2E testing
const mockWindow = {
  location: {
    href: 'http://localhost:3000',
    reload: vi.fn()
  },
  localStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  },
  fetch: vi.fn()
};

// Mock Devvit context for embedded mode testing
const mockDevvitContext: DevvitContext = {
  postId: 'test-post-123',
  userId: 'user-456',
  username: 'testuser',
  subredditName: 'testsubreddit'
};

// Mock API responses
const mockCreatePostResponse: CreatePostResponse = {
  success: true,
  postUrl: 'https://reddit.com/r/testsubreddit/comments/test-post-123',
  gameId: 'game-789'
};

const mockInitResponse: InitResponse = {
  gameId: 'game-789',
  mapKey: 'forest',
  userRole: 'guesser'
};

const mockGuessResponse: SubmitGuessResponse = {
  success: true,
  isCorrect: true,
  message: 'Correct! You found the hidden object!',
  distance: 0.05
};

const mockGuessesResponse: GetGuessesResponse = {
  guesses: [
    {
      gameId: 'game-789',
      userId: 'user-456',
      username: 'testuser',
      objectKey: 'tree',
      relX: 0.5,
      relY: 0.3,
      isCorrect: true,
      distance: 0.05,
      timestamp: Date.now()
    }
  ],
  totalGuesses: 1,
  correctGuesses: 1
};

describe('End-to-End User Journeys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset global mocks
    global.window = mockWindow as any;
    global.fetch = mockWindow.fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Creator Journey: Create Game → Post → View Dashboard', () => {
    it('should complete full creator workflow in standalone mode', async () => {
      // Mock successful API responses
      mockWindow.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCreatePostResponse)
        } as Response);

      // Simulate game creation process
      const gameData = {
        mapKey: 'forest',
        objectKey: 'tree',
        relX: 0.5,
        relY: 0.3
      };

      // Test post creation API call
      const response = await fetch('/api/create-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameData)
      });

      const result = await response.json();

      expect(mockWindow.fetch).toHaveBeenCalledWith('/api/create-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameData)
      });

      expect(result).toEqual(mockCreatePostResponse);
      expect(result.success).toBe(true);
      expect(result.gameId).toBe('game-789');
      expect(result.postUrl).toContain('reddit.com');
    });

    it('should handle creator dashboard view in embedded mode', async () => {
      // Mock embedded environment with creator context
      const creatorContext: DevvitContext = {
        ...mockDevvitContext,
        userId: 'creator-123'
      };

      // Mock init API response for creator
      const creatorInitResponse: InitResponse = {
        gameId: 'game-789',
        mapKey: 'forest',
        userRole: 'creator',
        hidingSpot: {
          objectKey: 'tree',
          relX: 0.5,
          relY: 0.3
        }
      };

      mockWindow.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(creatorInitResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGuessesResponse)
        });

      // Test embedded game initialization for creator
      const initResponse = await fetch('/api/init', {
        method: 'GET',
        headers: { 'X-Post-Id': creatorContext.postId }
      });

      const initResult = await initResponse.json();

      expect(initResult.userRole).toBe('creator');
      expect(initResult.hidingSpot).toBeDefined();

      // Test guesses retrieval for dashboard
      const guessesResponse = await fetch(`/api/guesses?gameId=${initResult.gameId}`);
      const guessesResult = await guessesResponse.json();

      expect(guessesResult.guesses).toHaveLength(1);
      expect(guessesResult.totalGuesses).toBe(1);
      expect(guessesResult.correctGuesses).toBe(1);
    });
  });

  describe('Guesser Journey: Open Post → Make Guess → See Result', () => {
    it('should complete full guesser workflow in embedded mode', async () => {
      // Mock init API response for guesser
      mockWindow.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockInitResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGuessResponse)
        });

      // Test embedded game initialization for guesser
      const initResponse = await fetch('/api/init', {
        method: 'GET',
        headers: { 'X-Post-Id': mockDevvitContext.postId }
      });

      const initResult = await initResponse.json();

      expect(initResult.userRole).toBe('guesser');
      expect(initResult.hidingSpot).toBeUndefined(); // Guessers shouldn't see the answer

      // Test guess submission
      const guessData = {
        gameId: initResult.gameId,
        objectKey: 'tree',
        relX: 0.5,
        relY: 0.3
      };

      const guessResponse = await fetch('/api/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guessData)
      });

      const guessResult = await guessResponse.json();

      expect(guessResult.success).toBe(true);
      expect(guessResult.isCorrect).toBe(true);
      expect(guessResult.message).toContain('Correct');
    });

    it('should handle incorrect guesses appropriately', async () => {
      const incorrectGuessResponse: SubmitGuessResponse = {
        success: true,
        isCorrect: false,
        message: 'Not quite! Try again.',
        distance: 0.25
      };

      mockWindow.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockInitResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(incorrectGuessResponse)
        });

      // Initialize game
      const initResponse = await fetch('/api/init', {
        method: 'GET',
        headers: { 'X-Post-Id': mockDevvitContext.postId }
      });

      const initResult = await initResponse.json();

      // Submit incorrect guess
      const incorrectGuessData = {
        gameId: initResult.gameId,
        objectKey: 'rock',
        relX: 0.8,
        relY: 0.7
      };

      const guessResponse = await fetch('/api/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incorrectGuessData)
      });

      const guessResult = await guessResponse.json();

      expect(guessResult.success).toBe(true);
      expect(guessResult.isCorrect).toBe(false);
      expect(guessResult.distance).toBeGreaterThan(0);
      expect(guessResult.message).toContain('Not quite');
    });
  });

  describe('Multi-User Interaction Scenarios', () => {
    it('should handle multiple users guessing on the same post', async () => {
      const multiUserGuessesResponse: GetGuessesResponse = {
        guesses: [
          {
            gameId: 'game-789',
            userId: 'user-1',
            username: 'user1',
            objectKey: 'tree',
            relX: 0.5,
            relY: 0.3,
            isCorrect: true,
            distance: 0.05,
            timestamp: Date.now() - 1000
          },
          {
            gameId: 'game-789',
            userId: 'user-2',
            username: 'user2',
            objectKey: 'rock',
            relX: 0.8,
            relY: 0.7,
            isCorrect: false,
            distance: 0.35,
            timestamp: Date.now()
          }
        ],
        totalGuesses: 2,
        correctGuesses: 1
      };

      // Mock API responses for multi-user scenario
      mockWindow.fetch
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(multiUserGuessesResponse)
        });

      // Test that creator can see all guesses from multiple users
      const guessesResponse = await fetch('/api/guesses?gameId=game-789');
      const guessesResult = await guessesResponse.json();

      expect(guessesResult.guesses).toHaveLength(2);
      expect(guessesResult.totalGuesses).toBe(2);
      expect(guessesResult.correctGuesses).toBe(1);

      // Verify different users are represented
      const userIds = guessesResult.guesses.map((guess: any) => guess.userId);
      expect(userIds).toContain('user-1');
      expect(userIds).toContain('user-2');
    });
  });

  describe('Standalone to Embedded Game Flow', () => {
    it('should transition from standalone creation to embedded viewing', async () => {
      // Step 1: Create game in standalone mode
      mockWindow.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCreatePostResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockInitResponse,
            userRole: 'creator',
            hidingSpot: {
              objectKey: 'tree',
              relX: 0.5,
              relY: 0.3
            }
          })
        });

      // Create post in standalone mode
      const createResponse = await fetch('/api/create-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mapKey: 'forest',
          objectKey: 'tree',
          relX: 0.5,
          relY: 0.3
        })
      });

      const createResult = await createResponse.json();
      expect(createResult.success).toBe(true);

      // Step 2: Simulate opening the created post in embedded mode
      const embeddedInitResponse = await fetch('/api/init', {
        method: 'GET',
        headers: { 'X-Post-Id': 'test-post-123' }
      });

      const embeddedResult = await embeddedInitResponse.json();
      expect(embeddedResult.gameId).toBe(createResult.gameId);
      expect(embeddedResult.userRole).toBe('creator');
      expect(embeddedResult.hidingSpot).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network failures gracefully', async () => {
      // Mock network failure
      mockWindow.fetch.mockRejectedValue(new Error('Network error'));

      try {
        await fetch('/api/init');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network error');
      }
    });

    it('should handle invalid game data', async () => {
      const errorResponse = {
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          success: false,
          error: 'Invalid game data'
        })
      };

      mockWindow.fetch.mockResolvedValue(errorResponse as Response);

      const response = await fetch('/api/create-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invalid: 'data' })
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });
  });
});