import { redis } from '@devvit/web/server';
import { DataExpirationManager } from './DataExpirationManager';

export interface HidingSpotData {
  mapKey: string;
  objectKey: string;
  hidingSpot: {
    relX: number;
    relY: number;
  };
  timestamp: number;
  creatorId: string;
}

export interface GuessData {
  playerId: string;
  guessX: number;
  guessY: number;
  isCorrect: boolean;
  distance: number;
  timestamp: number;
}

export async function saveHidingSpot(gameId: string, hidingSpot: HidingSpotData): Promise<void> {
  try {
    const key = `hiding_spot:${gameId}`;
    await redis.set(key, JSON.stringify(hidingSpot));
    
    // Use the expiration manager for consistent expiration handling
    await DataExpirationManager.setExpiration(key);
    
    console.log(`💾 Saved hiding spot for game ${gameId}`);
  } catch (error) {
    console.error('Error saving hiding spot:', error);
    throw error;
  }
}

export async function getHidingSpot(gameId: string): Promise<HidingSpotData | null> {
  try {
    const key = `hiding_spot:${gameId}`;
    const data = await redis.get(key);
    
    if (!data) {
      return null;
    }
    
    return JSON.parse(data) as HidingSpotData;
  } catch (error) {
    console.error('Error getting hiding spot:', error);
    return null;
  }
}

export async function saveGuess(gameId: string, guessData: GuessData): Promise<void> {
  try {
    const key = `guess:${gameId}:${guessData.playerId}:${Date.now()}`;
    await redis.set(key, JSON.stringify(guessData));
    
    // Use the expiration manager for consistent expiration handling
    await DataExpirationManager.setExpiration(key);
    
    console.log(`💾 Saved guess for game ${gameId} by ${guessData.playerId}`);
  } catch (error) {
    console.error('Error saving guess:', error);
    throw error;
  }
}

export async function getGameLeaderboard(gameId: string): Promise<GuessData[]> {
  try {
    const keys = await redis.keys(`guess:${gameId}:*`);
    const guesses: GuessData[] = [];
    
    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        guesses.push(JSON.parse(data) as GuessData);
      }
    }
    
    // Sort by correctness first, then by distance, then by timestamp
    guesses.sort((a, b) => {
      if (a.isCorrect && !b.isCorrect) return -1;
      if (!a.isCorrect && b.isCorrect) return 1;
      if (a.isCorrect && b.isCorrect) return a.timestamp - b.timestamp;
      return a.distance - b.distance;
    });
    
    return guesses;
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
}

export async function getGameStats(): Promise<{ totalGames: number; totalGuesses: number }> {
  try {
    // Get all hiding spot keys
    const gameKeys = await redis.keys('hiding_spot:*');
    const guessKeys = await redis.keys('guess:*');
    
    return {
      totalGames: gameKeys.length,
      totalGuesses: guessKeys.length
    };
  } catch (error) {
    console.error('Error getting game stats:', error);
    return { totalGames: 0, totalGuesses: 0 };
  }
}