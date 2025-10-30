/**
 * Core game data models and interfaces for Hide & Seek game
 * Based on requirements 10.5 and design specifications
 */

// Player rank system (Requirements 4.1, 4.2, 4.3)
export type PlayerRank = 'Tyapu' | 'GuessMaster' | 'Detective' | 'FBI';

// Game modes and states
export type GameMode = 'creation' | 'guessing' | 'dashboard';
export type EnvironmentMode = 'standalone' | 'embedded';

// Map and object definitions
export interface MapObject {
  key: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  interactive: boolean;
}

export interface VirtualMap {
  key: string;
  name: string;
  theme: string;
  releaseDate: number;
  backgroundAsset: string;
  objects: MapObject[];
  difficulty?: 'easy' | 'medium' | 'hard';
}

// Position and location data
export interface RelativePosition {
  relX: number;
  relY: number;
}

export interface HidingSpot extends RelativePosition {
  objectKey: string;
}

// Player data and statistics (Requirements 4.4)
export interface PlayerProfile {
  userId: string;
  username: string;
  rank: PlayerRank;
  totalGuesses: number;
  successfulGuesses: number;
  successRate: number;
  joinedAt: number;
  lastActive: number;
}

export interface PlayerStatistics {
  totalGames: number;
  gamesWon: number;
  gamesCreated: number;
  averageGuessAccuracy: number;
  bestStreak: number;
  currentStreak: number;
}

// Game session data (Requirements 7.2, 7.3, 7.4)
export interface GameSession {
  gameId: string;
  creator: string;
  mapKey: string;
  hidingSpot: HidingSpot;
  createdAt: number;
  postId?: string;
  postUrl?: string;
  isActive: boolean;
}

// Guess data and validation (Requirements 8.5)
export interface GuessData {
  gameId: string;
  userId: string;
  username: string;
  objectKey: string;
  relX: number;
  relY: number;
  timestamp: number;
  success: boolean;
  distance: number;
  isCorrect: boolean;
}

export interface GuessValidation {
  isValid: boolean;
  distance: number;
  accuracy: number;
  isCorrect: boolean;
  message: string;
}

// Game state management
export interface GameState {
  mode: GameMode;
  environment: EnvironmentMode;
  currentMap?: string;
  selectedObject?: string;
  selectedPosition?: RelativePosition;
  isCreator: boolean;
  gameId?: string;
  playerRole?: 'creator' | 'guesser';
}

// Rank progression system (Requirements 4.1, 4.2, 4.3)
export interface RankRequirements {
  rank: PlayerRank;
  minSuccessRate: number;
  minTotalFinds: number;
  description: string;
}

export interface RankProgression {
  currentRank: PlayerRank;
  nextRank?: PlayerRank;
  progressToNext: number;
  requirementsForNext?: RankRequirements;
}

// Monthly map rotation (Requirements 5.1, 5.2, 5.4)
export interface MonthlyMapRotation {
  currentMap: VirtualMap;
  previousMaps: VirtualMap[];
  nextRotationDate: number;
  rotationHistory: Array<{
    mapKey: string;
    startDate: number;
    endDate: number;
  }>;
}

// UI and visual components
export interface ColorPalette {
  primaryDark: string;    // #222831
  secondaryDark: string;  // #393E46
  accentCyan: string;     // #00ADB5
  lightGray: string;      // #EEEEEE
}

export interface UITheme {
  colors: ColorPalette;
  animations: {
    transitionDuration: number;
    fadeInDuration: number;
    fadeOutDuration: number;
  };
}

// Error handling and validation
export interface GameError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: GameError[];
  warnings?: string[];
}