/**
 * Server-side type definitions
 * Extends shared types with server-specific interfaces
 */

export * from '../../shared/types';

import type { Request, Response } from 'express';
import type { GameSession, GuessData, PlayerProfile } from '../../shared/types';

// Express request/response extensions
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    t2_id: string;
  };
  context?: {
    postId?: string;
    subredditName?: string;
  };
}

export interface ApiResponse<T = any> extends Response {
  success: (data: T) => void;
  error: (message: string, code?: number) => void;
}

// Server-side game management
export interface ServerGameManager {
  createGame(creator: string, mapKey: string, hidingSpot: any): Promise<GameSession>;
  getGame(gameId: string): Promise<GameSession | null>;
  validateGuess(gameId: string, guess: any): Promise<{ isCorrect: boolean; distance: number }>;
  storeGuess(guess: GuessData): Promise<boolean>;
  getGameGuesses(gameId: string): Promise<GuessData[]>;
}

// Reddit integration types
export interface RedditContext {
  postId: string;
  userId: string;
  username: string;
  subredditName: string;
  userType: 'moderator' | 'member' | 'guest';
}

export interface RedditPostData {
  title: string;
  text?: string;
  url?: string;
  subreddit: string;
  flair?: {
    text: string;
    cssClass: string;
  };
}

// Server configuration
export interface ServerConfig {
  port: number;
  redis: {
    url: string;
    keyPrefix: string;
    defaultTTL: number;
  };
  devvit: {
    appId: string;
    version: string;
  };
  game: {
    maxGuessesPerGame: number;
    guessTimeoutMs: number;
    gameSessionTTL: number;
  };
}

// Middleware types
export interface ErrorMiddleware {
  (error: Error, req: AuthenticatedRequest, res: ApiResponse, next: Function): void;
}

export interface AuthMiddleware {
  (req: AuthenticatedRequest, res: ApiResponse, next: Function): void;
}

// Background job types
export interface ScheduledJob {
  name: string;
  schedule: string; // cron expression
  handler: () => Promise<void>;
  enabled: boolean;
}

export interface CleanupJob extends ScheduledJob {
  cleanupType: 'expired_games' | 'old_guesses' | 'inactive_players';
  retentionDays: number;
}