/**
 * Game constants and configuration values
 * Centralized constants for the Hide & Seek game
 */

import type { PlayerRank, RankRequirements, ColorPalette } from '../types/game';

// Player rank system constants (Requirements 4.1, 4.2, 4.3)
export const RANK_REQUIREMENTS: Record<PlayerRank, RankRequirements> = {
  Tyapu: {
    rank: 'Tyapu',
    minSuccessRate: 0,
    minTotalFinds: 0,
    description: 'Starting rank for new players'
  },
  GuessMaster: {
    rank: 'GuessMaster', 
    minSuccessRate: 0.3,
    minTotalFinds: 5,
    description: 'Achieved after 5 successful finds with 30% success rate'
  },
  Detective: {
    rank: 'Detective',
    minSuccessRate: 0.6, 
    minTotalFinds: 15,
    description: 'Achieved after 15 successful finds with 60% success rate'
  },
  FBI: {
    rank: 'FBI',
    minSuccessRate: 0.8,
    minTotalFinds: 50, 
    description: 'Elite rank requiring 50 successful finds with 80% success rate'
  }
};

// Color palette (Requirements 6.1)
export const COLOR_PALETTE: ColorPalette = {
  primaryDark: '#222831',
  secondaryDark: '#393E46',
  accentCyan: '#00ADB5', 
  lightGray: '#EEEEEE'
};

// Game mechanics constants
export const GAME_CONFIG = {
  // Guess validation
  MAX_DISTANCE_FOR_SUCCESS: 50, // pixels
  GUESS_ACCURACY_THRESHOLD: 0.8,
  
  // Timing
  GUESS_TIMEOUT_MS: 30000, // 30 seconds
  GAME_SESSION_DURATION_MS: 24 * 60 * 60 * 1000, // 24 hours
  
  // Limits
  MAX_GUESSES_PER_GAME: 100,
  MAX_GAMES_PER_USER_PER_DAY: 10,
  MAX_OBJECTS_PER_MAP: 50,
  
  // Map rotation (Requirements 5.1, 5.4)
  MONTHLY_ROTATION_DAY: 1, // First day of month
  MAP_ARCHIVE_RETENTION_MONTHS: 12,
  
  // Performance
  MAX_CONCURRENT_GAMES: 1000,
  REDIS_KEY_TTL_SECONDS: 86400 * 7, // 7 days
  
  // UI/UX
  ANIMATION_DURATION_MS: 300,
  LOADING_TIMEOUT_MS: 10000,
  ERROR_MESSAGE_DURATION_MS: 5000
} as const;

// Phaser.js configuration constants
export const PHASER_CONFIG = {
  GAME_WIDTH: 1024,
  GAME_HEIGHT: 768,
  BACKGROUND_COLOR: COLOR_PALETTE.primaryDark,
  
  // Scene keys
  SCENES: {
    SPLASH: 'SplashScene',
    MAIN_MENU: 'MainMenuScene', 
    MAP_SELECT: 'MapSelectScene',
    GAME: 'GameScene',
    UI: 'UIScene'
  },
  
  // Asset keys
  ASSETS: {
    SPLASH_SPRITESHEET: 'splash_animation',
    UI_ATLAS: 'ui_atlas',
    BUTTON_ATLAS: 'button_atlas'
  },
  
  // Animation settings
  ANIMATIONS: {
    SPLASH_FRAME_RATE: 12,
    OBJECT_HOVER_DURATION: 200,
    SCENE_TRANSITION_DURATION: 500
  }
} as const;

// API endpoint constants
export const API_ENDPOINTS = {
  CREATE_POST: '/api/create-post',
  INIT_GAME: '/api/init', 
  SUBMIT_GUESS: '/api/guess',
  GET_GUESSES: '/api/guesses',
  GET_PLAYER: '/api/player',
  GET_MAP: '/api/map',
  HEALTH_CHECK: '/api/health'
} as const;

// Redis key patterns
export const REDIS_KEYS = {
  GAME: (gameId: string) => `game:${gameId}`,
  PLAYER: (userId: string) => `player:${userId}`,
  GAME_GUESSES: (gameId: string) => `game:${gameId}:guesses`,
  MAP: (mapKey: string) => `map:${mapKey}`,
  POST_MAPPING: (postId: string) => `post:${postId}`,
  MONTHLY_ROTATION: () => 'monthly_rotation',
  ACTIVE_GAMES: () => 'active_games',
  PLAYER_STATS: (userId: string) => `player:${userId}:stats`
} as const;

// Error codes and messages
export const ERROR_CODES = {
  // Game errors
  GAME_NOT_FOUND: 'GAME_NOT_FOUND',
  INVALID_GAME_STATE: 'INVALID_GAME_STATE',
  GAME_EXPIRED: 'GAME_EXPIRED',
  
  // Player errors  
  PLAYER_NOT_FOUND: 'PLAYER_NOT_FOUND',
  INVALID_PLAYER_DATA: 'INVALID_PLAYER_DATA',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  
  // Guess errors
  INVALID_GUESS: 'INVALID_GUESS',
  DUPLICATE_GUESS: 'DUPLICATE_GUESS',
  GUESS_TIMEOUT: 'GUESS_TIMEOUT',
  
  // System errors
  REDIS_CONNECTION_ERROR: 'REDIS_CONNECTION_ERROR',
  REDDIT_API_ERROR: 'REDDIT_API_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR'
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  GAME_CREATED: 'Game created successfully!',
  GUESS_SUBMITTED: 'Guess submitted successfully!',
  CORRECT_GUESS: 'Congratulations! You found the hiding spot!',
  RANK_PROMOTED: 'Congratulations! You have been promoted to {rank}!',
  POST_CREATED: 'Post created! Open on Reddit'
} as const;

// Map themes and metadata
export const MAP_THEMES = {
  URBAN: 'urban',
  NATURE: 'nature', 
  INDOOR: 'indoor',
  FANTASY: 'fantasy',
  SPACE: 'space'
} as const;

// Default map configuration
export const DEFAULT_MAP_CONFIG = {
  OBJECT_COUNT: 20,
  MIN_OBJECT_SIZE: 32,
  MAX_OBJECT_SIZE: 128,
  INTERACTIVE_OBJECTS_RATIO: 0.7
} as const;

// Performance monitoring thresholds
export const PERFORMANCE_THRESHOLDS = {
  MIN_FPS: 30,
  MAX_MEMORY_MB: 256,
  MAX_LOAD_TIME_MS: 5000,
  MAX_API_RESPONSE_TIME_MS: 2000
} as const;