/**
 * Main types export file for Hide & Seek game
 * Provides centralized access to all type definitions
 */

// Core game types
export * from './game';

// API and network types
export * from './api';

// Phaser.js specific types
export * from './phaser';

// Storage and persistence types
export * from './storage';

// Service interfaces
export * from './services';

// Environment and configuration types
export * from './environment';

// Convenience re-exports for commonly used types
export type {
  // Core game entities
  PlayerRank,
  GameMode,
  EnvironmentMode,
  HidingSpot,
  GameSession,
  GuessData,
  PlayerProfile,
  VirtualMap
} from './game';

export type {
  // API contracts
  CreatePostRequest,
  CreatePostResponse,
  InitResponse,
  SubmitGuessRequest,
  SubmitGuessResponse,
  GetGuessesResponse
} from './api';

export type {
  // Phaser game objects
  InteractiveMapObject,
  SceneKey,
  GameObjectData
} from './phaser';

export type {
  // Service interfaces
  NetworkService,
  GameStateManager,
  EmbeddedGameManager
} from './services';

export type {
  // Storage operations
  StorageService,
  GameStorageOperations,
  PlayerStorageOperations,
  GuessStorageOperations
} from './storage';

// Type guards and utilities
import type { PlayerRank, GameMode, EnvironmentMode } from './game';

export const isValidPlayerRank = (rank: string): rank is PlayerRank => {
  return ['Tyapu', 'GuessMaster', 'Detective', 'FBI'].includes(rank);
};

export const isValidGameMode = (mode: string): mode is GameMode => {
  return ['creation', 'guessing', 'dashboard'].includes(mode);
};

export const isValidEnvironmentMode = (mode: string): mode is EnvironmentMode => {
  return ['standalone', 'embedded'].includes(mode);
};

// Constants
export const PLAYER_RANKS: readonly PlayerRank[] = ['Tyapu', 'GuessMaster', 'Detective', 'FBI'] as const;

export const GAME_MODES: readonly GameMode[] = ['creation', 'guessing', 'dashboard'] as const;

export const ENVIRONMENT_MODES: readonly EnvironmentMode[] = ['standalone', 'embedded'] as const;

export const COLOR_PALETTE = {
  primaryDark: '#222831',
  secondaryDark: '#393E46', 
  accentCyan: '#00ADB5',
  lightGray: '#EEEEEE'
} as const;

// Default configurations
export const DEFAULT_RANK_REQUIREMENTS: Record<PlayerRank, { minSuccessRate: number; minTotalFinds: number }> = {
  Tyapu: { minSuccessRate: 0, minTotalFinds: 0 },
  GuessMaster: { minSuccessRate: 0.3, minTotalFinds: 5 },
  Detective: { minSuccessRate: 0.6, minTotalFinds: 15 },
  FBI: { minSuccessRate: 0.8, minTotalFinds: 50 }
} as const;