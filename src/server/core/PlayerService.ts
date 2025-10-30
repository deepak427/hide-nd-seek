/**
 * Player Service - Handles player statistics tracking and management
 * Implements Requirements 4.4 - Track successful and total guesses, calculate success percentages
 */

import { context, redis } from '@devvit/web/server';
import type { PlayerProfile, GuessData } from '../../shared/types/game';
import { RankService } from '../../shared/services/RankService';
import { REDIS_KEYS } from '../../shared/constants/game';
import { validatePlayerProfile } from '../../shared/utils/validation';

export class PlayerService {
  /**
   * Get or create player profile
   * Requirements 4.4
   */
  static async getOrCreatePlayer(userId: string, username?: string): Promise<PlayerProfile> {
    const playerKey = REDIS_KEYS.PLAYER(userId);
    
    try {
      // Try to get existing player
      const existingData = await redis.get(playerKey);
      
      if (existingData) {
        const playerData = JSON.parse(existingData);
        if (validatePlayerProfile(playerData)) {
          return playerData;
        }
      }
      
      // Create new player profile
      const newPlayer = RankService.createNewPlayerProfile(
        userId, 
        username || `Player_${userId.slice(-6)}`
      );
      
      await this.savePlayer(newPlayer);
      return newPlayer;
      
    } catch (error) {
      console.error('Error getting/creating player:', error);
      // Return default profile if Redis fails
      return RankService.createNewPlayerProfile(
        userId, 
        username || `Player_${userId.slice(-6)}`
      );
    }
  }

  /**
   * Save player profile to Redis
   * Requirements 4.4
   */
  static async savePlayer(profile: PlayerProfile): Promise<void> {
    const playerKey = REDIS_KEYS.PLAYER(profile.userId);
    
    try {
      await redis.set(playerKey, JSON.stringify(profile));
      
      // Also save to player stats key for easier querying
      const statsKey = REDIS_KEYS.PLAYER_STATS(profile.userId);
      const stats = {
        rank: profile.rank,
        totalGuesses: profile.totalGuesses,
        successfulGuesses: profile.successfulGuesses,
        successRate: profile.successRate,
        lastActive: profile.lastActive
      };
      
      await redis.set(statsKey, JSON.stringify(stats));
      
    } catch (error) {
      console.error('Error saving player:', error);
      throw new Error('Failed to save player data');
    }
  }

  /**
   * Update player statistics after a guess
   * Requirements 4.4
   */
  static async updatePlayerAfterGuess(
    userId: string, 
    guessResult: { success: boolean; isCorrect: boolean }
  ): Promise<{ 
    updatedProfile: PlayerProfile; 
    rankChanged: boolean; 
    previousRank?: string;
    newRank?: string;
  }> {
    try {
      // Get current player profile
      const currentProfile = await this.getOrCreatePlayer(userId);
      
      // Store previous rank for comparison
      const previousRank = currentProfile.rank;
      
      // Update statistics using RankService
      const updatedProfile = RankService.updatePlayerStats(currentProfile, guessResult);
      
      // Check if rank changed
      const rankChanged = previousRank !== updatedProfile.rank;
      
      // Save updated profile
      await this.savePlayer(updatedProfile);
      
      const result: { 
        updatedProfile: PlayerProfile; 
        rankChanged: boolean; 
        previousRank?: string;
        newRank?: string;
      } = {
        updatedProfile,
        rankChanged
      };
      
      if (rankChanged) {
        result.previousRank = previousRank;
        result.newRank = updatedProfile.rank;
      }
      
      return result;
      
    } catch (error) {
      console.error('Error updating player after guess:', error);
      throw new Error('Failed to update player statistics');
    }
  }

  /**
   * Get player statistics for display
   * Requirements 4.4
   */
  static async getPlayerStats(userId: string): Promise<{
    profile: PlayerProfile;
    progression: any;
    displayInfo: any;
  }> {
    try {
      const profile = await this.getOrCreatePlayer(userId);
      const progression = RankService.calculateRankProgression(profile);
      const displayInfo = RankService.getRankDisplayInfo(profile.rank);
      
      return {
        profile,
        progression,
        displayInfo
      };
      
    } catch (error) {
      console.error('Error getting player stats:', error);
      throw new Error('Failed to get player statistics');
    }
  }

  /**
   * Recalculate player statistics from guess history
   * Requirements 4.4
   */
  static async recalculatePlayerStats(userId: string): Promise<PlayerProfile> {
    try {
      // Get all games where this user has made guesses
      // Note: This is a simplified implementation
      
      // This is a simplified approach - in a real implementation, 
      // you might want to maintain an index of user guesses
      // For now, we'll work with the current profile and update incrementally
      
      const currentProfile = await this.getOrCreatePlayer(userId);
      
      // Validate current statistics are consistent
      if (currentProfile.totalGuesses > 0) {
        const calculatedSuccessRate = currentProfile.successfulGuesses / currentProfile.totalGuesses;
        
        // Update success rate if it's inconsistent (with small tolerance for floating point)
        if (Math.abs(calculatedSuccessRate - currentProfile.successRate) > 0.001) {
          currentProfile.successRate = calculatedSuccessRate;
        }
      } else {
        currentProfile.successRate = 0;
      }
      
      // Recalculate rank based on current stats
      const newRank = RankService.calculatePlayerRank(currentProfile);
      currentProfile.rank = newRank;
      
      // Save updated profile
      await this.savePlayer(currentProfile);
      
      return currentProfile;
      
    } catch (error) {
      console.error('Error recalculating player stats:', error);
      throw new Error('Failed to recalculate player statistics');
    }
  }

  /**
   * Get leaderboard data
   * Requirements 4.4
   */
  static async getLeaderboard(_limit: number = 10): Promise<Array<{
    userId: string;
    username: string;
    rank: string;
    successRate: number;
    totalGuesses: number;
    successfulGuesses: number;
  }>> {
    try {
      
      // This is a simplified implementation
      // In a production system, you'd want to maintain sorted sets for efficient leaderboards
      
      // For now, return empty array as this would require scanning all player keys
      // which is not efficient in Redis
      
      return [];
      
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }

  /**
   * Get player count by rank
   * Requirements 4.4
   */
  static async getRankDistribution(): Promise<Record<string, number>> {
    try {
      // This would require scanning all player keys in a production system
      // For now, return empty distribution
      
      return {
        Tyapu: 0,
        GuessMaster: 0,
        Detective: 0,
        FBI: 0
      };
      
    } catch (error) {
      console.error('Error getting rank distribution:', error);
      return {
        Tyapu: 0,
        GuessMaster: 0,
        Detective: 0,
        FBI: 0
      };
    }
  }

  /**
   * Update player's last active timestamp
   * Requirements 4.4
   */
  static async updateLastActive(userId: string): Promise<void> {
    try {
      const profile = await this.getOrCreatePlayer(userId);
      profile.lastActive = Date.now();
      await this.savePlayer(profile);
      
    } catch (error) {
      console.error('Error updating last active:', error);
      // Don't throw error for this non-critical operation
    }
  }

  /**
   * Validate player profile integrity
   * Requirements 4.4
   */
  static validateProfileIntegrity(profile: PlayerProfile): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Check basic validation
    if (!validatePlayerProfile(profile)) {
      errors.push('Profile fails basic validation');
    }
    
    // Check success rate calculation
    if (profile.totalGuesses > 0) {
      const expectedSuccessRate = profile.successfulGuesses / profile.totalGuesses;
      if (Math.abs(expectedSuccessRate - profile.successRate) > 0.001) {
        errors.push('Success rate calculation is inconsistent');
      }
    } else if (profile.successRate !== 0) {
      errors.push('Success rate should be 0 when no guesses made');
    }
    
    // Check successful guesses don't exceed total
    if (profile.successfulGuesses > profile.totalGuesses) {
      errors.push('Successful guesses cannot exceed total guesses');
    }
    
    // Check rank is appropriate for statistics
    const calculatedRank = RankService.calculatePlayerRank(profile);
    if (calculatedRank !== profile.rank) {
      errors.push(`Rank should be ${calculatedRank} based on statistics, but is ${profile.rank}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}