/**
 * Validation utilities for Hide & Seek game
 * Type guards and validation functions
 */

import type { 
  PlayerRank, 
  GameMode, 
  EnvironmentMode, 
  HidingSpot, 
  GuessData, 
  PlayerProfile,
  GameSession,
  VirtualMap
} from '../types/game';

import { RANK_REQUIREMENTS, GAME_CONFIG } from '../constants/game';
import { RankService } from '../services/RankService';

// Type guards
export const isValidPlayerRank = (rank: unknown): rank is PlayerRank => {
  return typeof rank === 'string' && rank in RANK_REQUIREMENTS;
};

export const isValidGameMode = (mode: unknown): mode is GameMode => {
  return typeof mode === 'string' && ['creation', 'guessing', 'dashboard'].includes(mode);
};

export const isValidEnvironmentMode = (mode: unknown): mode is EnvironmentMode => {
  return typeof mode === 'string' && ['standalone', 'embedded'].includes(mode);
};

// Data validation functions
export const validateHidingSpot = (spot: unknown): spot is HidingSpot => {
  if (!spot || typeof spot !== 'object') return false;
  
  const s = spot as any;
  return (
    typeof s.objectKey === 'string' &&
    s.objectKey.length > 0 &&
    typeof s.relX === 'number' &&
    typeof s.relY === 'number' &&
    s.relX >= 0 && s.relX <= 1 &&
    s.relY >= 0 && s.relY <= 1
  );
};

export const validateGuessData = (guess: unknown): guess is GuessData => {
  if (!guess || typeof guess !== 'object') return false;
  
  const g = guess as any;
  return (
    typeof g.gameId === 'string' &&
    typeof g.userId === 'string' &&
    typeof g.username === 'string' &&
    typeof g.objectKey === 'string' &&
    typeof g.relX === 'number' &&
    typeof g.relY === 'number' &&
    typeof g.timestamp === 'number' &&
    typeof g.success === 'boolean' &&
    typeof g.distance === 'number' &&
    typeof g.isCorrect === 'boolean' &&
    g.relX >= 0 && g.relX <= 1 &&
    g.relY >= 0 && g.relY <= 1 &&
    g.distance >= 0 &&
    g.timestamp > 0
  );
};

export const validatePlayerProfile = (profile: unknown): profile is PlayerProfile => {
  if (!profile || typeof profile !== 'object') return false;
  
  const p = profile as any;
  return (
    typeof p.userId === 'string' &&
    typeof p.username === 'string' &&
    isValidPlayerRank(p.rank) &&
    typeof p.totalGuesses === 'number' &&
    typeof p.successfulGuesses === 'number' &&
    typeof p.successRate === 'number' &&
    typeof p.joinedAt === 'number' &&
    typeof p.lastActive === 'number' &&
    p.totalGuesses >= 0 &&
    p.successfulGuesses >= 0 &&
    p.successfulGuesses <= p.totalGuesses &&
    p.successRate >= 0 && p.successRate <= 1 &&
    p.joinedAt > 0 &&
    p.lastActive > 0
  );
};

export const validateGameSession = (session: unknown): session is GameSession => {
  if (!session || typeof session !== 'object') return false;
  
  const s = session as any;
  return (
    typeof s.gameId === 'string' &&
    typeof s.creator === 'string' &&
    typeof s.mapKey === 'string' &&
    validateHidingSpot(s.hidingSpot) &&
    typeof s.createdAt === 'number' &&
    typeof s.isActive === 'boolean' &&
    s.gameId.length > 0 &&
    s.creator.length > 0 &&
    s.mapKey.length > 0 &&
    s.createdAt > 0
  );
};

export const validateVirtualMap = (map: unknown): map is VirtualMap => {
  if (!map || typeof map !== 'object') return false;
  
  const m = map as any;
  return (
    typeof m.key === 'string' &&
    typeof m.name === 'string' &&
    typeof m.theme === 'string' &&
    typeof m.releaseDate === 'number' &&
    typeof m.backgroundAsset === 'string' &&
    Array.isArray(m.objects) &&
    m.key.length > 0 &&
    m.name.length > 0 &&
    m.theme.length > 0 &&
    m.releaseDate > 0 &&
    m.backgroundAsset.length > 0 &&
    m.objects.every((obj: any) => 
      typeof obj.key === 'string' &&
      typeof obj.name === 'string' &&
      typeof obj.x === 'number' &&
      typeof obj.y === 'number' &&
      typeof obj.width === 'number' &&
      typeof obj.height === 'number' &&
      typeof obj.interactive === 'boolean' &&
      obj.key.length > 0 &&
      obj.name.length > 0 &&
      obj.x >= 0 && obj.y >= 0 &&
      obj.width > 0 && obj.height > 0
    )
  );
};

// Business logic validation
export const validateGuessDistance = (distance: number): boolean => {
  return distance >= 0 && distance <= Math.sqrt(2); // Max distance in normalized coordinates
};

export const isSuccessfulGuess = (distance: number): boolean => {
  return distance <= GAME_CONFIG.MAX_DISTANCE_FOR_SUCCESS / 1000; // Convert to normalized units
};

export const canPlayerGuess = (_gameId: string, userId: string, existingGuesses: GuessData[]): boolean => {
  const userGuesses = existingGuesses.filter(g => g.userId === userId);
  return userGuesses.length < GAME_CONFIG.MAX_GUESSES_PER_GAME;
};

// Re-export rank progression calculation from RankService
export { RankService } from '../services/RankService';

export const calculateRankProgression = (profile: PlayerProfile): { 
  canPromote: boolean; 
  nextRank?: PlayerRank;
  progress: number;
} => {
  const progression = RankService.calculateRankProgression(profile);
  const promotion = RankService.shouldPromotePlayer(profile);
  
  return {
    canPromote: promotion.shouldPromote,
    nextRank: progression.nextRank,
    progress: progression.progressToNext
  };
};

// Input sanitization
export const sanitizeString = (input: unknown, maxLength: number = 100): string => {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLength);
};

export const sanitizeNumber = (input: unknown, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): number => {
  const num = typeof input === 'number' ? input : parseFloat(String(input));
  if (isNaN(num)) return min;
  return Math.max(min, Math.min(max, num));
};

export const sanitizeRelativePosition = (x: unknown, y: unknown): { relX: number; relY: number } => {
  return {
    relX: sanitizeNumber(x, 0, 1),
    relY: sanitizeNumber(y, 0, 1)
  };
};