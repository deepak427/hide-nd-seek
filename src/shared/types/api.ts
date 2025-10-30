/**
 * API types and interfaces for Hide & Seek game
 * Defines request/response contracts for client-server communication
 */

import type { HidingSpot, GameSession, GuessData, PlayerProfile } from './game';

// Re-export core types for API usage
export type { HidingSpot, GameSession, GuessData, PlayerProfile };

export interface GuessStatistics {
  totalGuesses: number;
  correctGuesses: number;
  uniqueGuessers: number;
  averageDistance: number;
}

// API Request/Response types
export interface CreatePostRequest {
  mapKey: string;
  objectKey: string;
  relX: number;
  relY: number;
}

export interface CreatePostResponse {
  success: boolean;
  postUrl: string;
  gameId: string;
}

export interface InitResponse {
  gameId: string;
  mapKey: string;
  userRole: 'creator' | 'guesser';
  hidingSpot?: HidingSpot; // Only for creator
  playerProfile?: {
    rank: string;
    totalGuesses: number;
    successfulGuesses: number;
    successRate: number;
  };
}

export interface SubmitGuessRequest {
  gameId: string;
  objectKey: string;
  relX: number;
  relY: number;
}

export interface SubmitGuessResponse {
  success: boolean;
  isCorrect: boolean;
  message: string;
  distance?: number;
  rankProgression?: {
    currentRank: string;
    progressPercentage: number;
    nextRank?: string;
    totalGuesses: number;
    successfulGuesses: number;
    successRate: number;
  };
}

export interface GetGuessesResponse {
  guesses: GuessData[];
  totalGuesses: number;
  correctGuesses: number;
  uniqueGuessers: number;
  averageDistance: number;
}

// Player statistics API types
export interface GetPlayerStatsResponse {
  success: boolean;
  user?: {
    id: string;
    username: string;
    isAuthenticated: boolean;
    isModerator?: boolean;
  };
  profile: PlayerProfile;
  progression: {
    currentRank: string;
    nextRank?: string;
    progressToNext: number;
    requirementsForNext?: {
      rank: string;
      minSuccessRate: number;
      minTotalFinds: number;
      description: string;
    };
  };
  displayInfo: {
    name: string;
    description: string;
    color: string;
    iconType: 'circle' | 'star' | 'shield' | 'crown';
    order: number;
  };
  progressPercentage?: number;
}

export interface RecalculateStatsResponse {
  success: boolean;
  message: string;
  profile: PlayerProfile;
}

// Authentication API types
export interface AuthenticationResponse {
  success: boolean;
  user: {
    id: string;
    username: string;
    isAuthenticated: boolean;
    isModerator?: boolean;
    isAdmin?: boolean;
    accountCreated?: number;
  };
  session: {
    sessionId: string;
    expiresAt: number;
  };
  playerProfile: PlayerProfile;
  isNewUser: boolean;
}

export interface SessionResponse {
  success: boolean;
  session: {
    userId: string;
    username: string;
    sessionId: string;
    createdAt: number;
    lastActive: number;
    expiresAt: number;
  } | null;
}

export interface AuthorizationRequest {
  action: 'view_game' | 'create_game' | 'submit_guess' | 'view_guesses' | 'moderate';
  resourceId?: string;
}

export interface AuthorizationResponse {
  success: boolean;
  authorized: boolean;
  message?: string;
}

// Leaderboard API types
export interface LeaderboardEntry {
  rank: number;
  username: string;
  totalGamesPlayed: number;
  gamesWon: number;
  winRate: number;
  rankPoints: number;
  currentRank: {
    name: string;
    icon: string;
    color: string;
  };
}

export interface GetLeaderboardResponse {
  success: boolean;
  leaderboard: LeaderboardEntry[];
  playerPosition?: number;
  totalPlayers: number;
}

// Legacy types for backward compatibility (deprecated - use new types above)
export type ShareRequest = {
  imageData: string;
  challengeData: {
    mapKey: string;
    objectKey: string;
    hidingSpot: {
      relX: number;
      relY: number;
    };
    timestamp: number;
    creatorId: string;
  };
};

export type ShareResponse = {
  success: boolean;
  postUrl?: string;
  gameId?: string;
  error?: string;
};

export type GuessRequest = {
  gameId: string;
  guessX: number;
  guessY: number;
  playerId?: string;
};

export type GuessResponse = {
  success: boolean;
  isCorrect: boolean;
  distance: number;
  actualSpot?: {
    relX: number;
    relY: number;
  };
  error?: string;
};
