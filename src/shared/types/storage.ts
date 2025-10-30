/**
 * Redis storage interfaces and data models for Hide & Seek game
 * Defines data persistence structures and operations (Requirements 10.5)
 */

import type { 
  GameSession, 
  GuessData, 
  PlayerProfile, 
  VirtualMap, 
  HidingSpot,
  PlayerRank 
} from './game';

// Redis key patterns
export interface RedisKeyPatterns {
  game: (gameId: string) => string;
  player: (userId: string) => string;
  gameGuesses: (gameId: string) => string;
  map: (mapKey: string) => string;
  postMapping: (postId: string) => string;
  playerStats: (userId: string) => string;
  monthlyRotation: () => string;
  activeGames: () => string;
}

// Storage operations interfaces
export interface GameStorageOperations {
  createGame(gameData: GameSession): Promise<boolean>;
  getGame(gameId: string): Promise<GameSession | null>;
  updateGame(gameId: string, updates: Partial<GameSession>): Promise<boolean>;
  deleteGame(gameId: string): Promise<boolean>;
  getActiveGames(): Promise<string[]>;
}

export interface PlayerStorageOperations {
  createPlayer(playerData: PlayerProfile): Promise<boolean>;
  getPlayer(userId: string): Promise<PlayerProfile | null>;
  updatePlayer(userId: string, updates: Partial<PlayerProfile>): Promise<boolean>;
  updatePlayerRank(userId: string, newRank: PlayerRank): Promise<boolean>;
  getPlayersByRank(rank: PlayerRank): Promise<PlayerProfile[]>;
}

export interface GuessStorageOperations {
  addGuess(guess: GuessData): Promise<boolean>;
  getGameGuesses(gameId: string): Promise<GuessData[]>;
  getPlayerGuesses(userId: string): Promise<GuessData[]>;
  deleteGameGuesses(gameId: string): Promise<boolean>;
}

export interface MapStorageOperations {
  storeMap(mapData: VirtualMap): Promise<boolean>;
  getMap(mapKey: string): Promise<VirtualMap | null>;
  getCurrentMonthlyMap(): Promise<VirtualMap | null>;
  updateMonthlyRotation(mapKey: string): Promise<boolean>;
  getMapHistory(): Promise<VirtualMap[]>;
}

// Redis data structures
export interface RedisGameData {
  creator: string;
  mapKey: string;
  hidingSpot: HidingSpot;
  createdAt: number;
  postId?: string;
  postUrl?: string;
  isActive: boolean;
}

export interface RedisPlayerData {
  username: string;
  rank: PlayerRank;
  totalGuesses: number;
  successfulGuesses: number;
  successRate: number;
  joinedAt: number;
  lastActive: number;
}

export interface RedisGuessData {
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

export interface RedisMapData {
  name: string;
  theme: string;
  releaseDate: number;
  backgroundAsset: string;
  objects: Array<{
    key: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    interactive: boolean;
  }>;
  difficulty?: 'easy' | 'medium' | 'hard';
}

// Post to game mapping
export interface PostGameMapping {
  gameId: string;
  createdAt: number;
}

// Monthly rotation data
export interface MonthlyRotationData {
  currentMapKey: string;
  rotationDate: number;
  previousMaps: string[];
  nextRotationDate: number;
}

// Storage configuration
export interface StorageConfig {
  keyPrefix: string;
  defaultTTL: number;
  gameSessionTTL: number;
  playerDataTTL: number;
  guessDataTTL: number;
  mapDataTTL: number;
}

// Batch operations
export interface BatchOperation {
  type: 'set' | 'get' | 'delete' | 'update';
  key: string;
  value?: any;
  ttl?: number;
}

export interface BatchResult {
  success: boolean;
  results: Array<{
    key: string;
    success: boolean;
    value?: any;
    error?: string;
  }>;
}

// Storage service interface
export interface StorageService {
  // Game operations
  games: GameStorageOperations;
  
  // Player operations
  players: PlayerStorageOperations;
  
  // Guess operations
  guesses: GuessStorageOperations;
  
  // Map operations
  maps: MapStorageOperations;
  
  // Utility operations
  exists(key: string): Promise<boolean>;
  expire(key: string, ttl: number): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  batchExecute(operations: BatchOperation[]): Promise<BatchResult>;
  
  // Health and monitoring
  ping(): Promise<boolean>;
  getStats(): Promise<{
    totalKeys: number;
    memoryUsage: number;
    activeConnections: number;
  }>;
}

// Data validation interfaces
export interface DataValidator {
  validateGameSession(data: any): data is RedisGameData;
  validatePlayerProfile(data: any): data is RedisPlayerData;
  validateGuessData(data: any): data is RedisGuessData;
  validateMapData(data: any): data is RedisMapData;
}

// Migration and versioning
export interface DataMigration {
  version: string;
  description: string;
  up: (storage: StorageService) => Promise<void>;
  down: (storage: StorageService) => Promise<void>;
}

export interface SchemaVersion {
  current: string;
  migrations: DataMigration[];
}