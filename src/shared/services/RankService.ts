/**
 * Rank Service - Player progression and ranking system
 * Implements Requirements 4.1, 4.2, 4.3, 4.4
 */

import type { 
  PlayerProfile, 
  PlayerRank, 
  RankProgression, 
  RankRequirements,
  GuessData 
} from '../types/game';
import { RANK_REQUIREMENTS } from '../constants/game';

export class RankService {
  /**
   * Calculate the appropriate rank for a player based on their statistics
   * Requirements 4.1, 4.2, 4.3
   */
  static calculatePlayerRank(profile: PlayerProfile): PlayerRank {
    const { successfulGuesses, successRate } = profile;
    
    // Check ranks from highest to lowest
    const ranks: PlayerRank[] = ['FBI', 'Detective', 'GuessMaster', 'Tyapu'];
    
    for (const rank of ranks) {
      const requirements = RANK_REQUIREMENTS[rank];
      if (successfulGuesses >= requirements.minTotalFinds && 
          successRate >= requirements.minSuccessRate) {
        return rank;
      }
    }
    
    return 'Tyapu'; // Default starting rank
  }

  /**
   * Calculate detailed rank progression information
   * Requirements 4.1, 4.2, 4.3, 4.4
   */
  static calculateRankProgression(profile: PlayerProfile): RankProgression {
    const currentRank = profile.rank;
    const ranks: PlayerRank[] = ['Tyapu', 'GuessMaster', 'Detective', 'FBI'];
    const currentRankIndex = ranks.indexOf(currentRank);
    
    // Check if already at max rank
    if (currentRankIndex === ranks.length - 1) {
      return {
        currentRank,
        progressToNext: 1
      };
    }
    
    const nextRank = ranks[currentRankIndex + 1];
    if (!nextRank) {
      return {
        currentRank,
        progressToNext: 1
      };
    }
    const nextRankReqs = RANK_REQUIREMENTS[nextRank];
    
    // Calculate progress towards next rank
    const successRateProgress = nextRankReqs.minSuccessRate > 0 
      ? Math.min(1, profile.successRate / nextRankReqs.minSuccessRate)
      : 1;
    
    const totalFindsProgress = nextRankReqs.minTotalFinds > 0
      ? Math.min(1, profile.successfulGuesses / nextRankReqs.minTotalFinds)
      : 1;
    
    // Overall progress is the minimum of both requirements
    const progressToNext = Math.min(successRateProgress, totalFindsProgress);
    
    return {
      currentRank,
      nextRank,
      progressToNext,
      requirementsForNext: nextRankReqs
    };
  }

  /**
   * Check if a player should be promoted to a higher rank
   * Requirements 4.1, 4.2, 4.3
   */
  static shouldPromotePlayer(profile: PlayerProfile): { 
    shouldPromote: boolean; 
    newRank?: PlayerRank;
    previousRank: PlayerRank;
  } {
    const currentRank = profile.rank;
    const calculatedRank = this.calculatePlayerRank(profile);
    
    const ranks: PlayerRank[] = ['Tyapu', 'GuessMaster', 'Detective', 'FBI'];
    const currentIndex = ranks.indexOf(currentRank);
    const calculatedIndex = ranks.indexOf(calculatedRank);
    
    const shouldPromote = calculatedIndex > currentIndex;
    
    const result: { 
      shouldPromote: boolean; 
      newRank?: PlayerRank;
      previousRank: PlayerRank;
    } = {
      shouldPromote,
      previousRank: currentRank
    };
    
    if (shouldPromote) {
      result.newRank = calculatedRank;
    }
    
    return result;
  }

  /**
   * Update player statistics after a guess
   * Requirements 4.4
   */
  static updatePlayerStats(
    profile: PlayerProfile, 
    guessResult: { success: boolean; isCorrect: boolean }
  ): PlayerProfile {
    const updatedProfile = { ...profile };
    
    // Update total guesses
    updatedProfile.totalGuesses += 1;
    
    // Update successful guesses if the guess was correct
    if (guessResult.isCorrect) {
      updatedProfile.successfulGuesses += 1;
    }
    
    // Recalculate success rate
    updatedProfile.successRate = updatedProfile.totalGuesses > 0 
      ? updatedProfile.successfulGuesses / updatedProfile.totalGuesses 
      : 0;
    
    // Update last active timestamp
    updatedProfile.lastActive = Date.now();
    
    // Calculate new rank based on updated stats
    const newRank = this.calculatePlayerRank(updatedProfile);
    updatedProfile.rank = newRank;
    
    return updatedProfile;
  }

  /**
   * Get rank requirements for display purposes
   * Requirements 4.1, 4.2, 4.3
   */
  static getRankRequirements(rank: PlayerRank): RankRequirements {
    return RANK_REQUIREMENTS[rank];
  }

  /**
   * Get all rank requirements for progression display
   * Requirements 4.1, 4.2, 4.3
   */
  static getAllRankRequirements(): Record<PlayerRank, RankRequirements> {
    return RANK_REQUIREMENTS;
  }

  /**
   * Calculate rank progression percentage for UI display
   * Requirements 4.4
   */
  static calculateProgressPercentage(profile: PlayerProfile): number {
    const progression = this.calculateRankProgression(profile);
    return Math.round(progression.progressToNext * 100);
  }

  /**
   * Get rank display information including colors and icons
   * Requirements 4.1, 4.2, 4.3
   */
  static getRankDisplayInfo(rank: PlayerRank): {
    name: string;
    description: string;
    color: string;
    iconType: 'circle' | 'star' | 'shield' | 'crown';
    order: number;
  } {
    const requirements = RANK_REQUIREMENTS[rank];
    const rankOrder = ['Tyapu', 'GuessMaster', 'Detective', 'FBI'];
    
    const displayInfo = {
      Tyapu: {
        color: '#666666',
        iconType: 'circle' as const,
        name: 'Tyapu'
      },
      GuessMaster: {
        color: '#4CAF50',
        iconType: 'star' as const,
        name: 'Guess Master'
      },
      Detective: {
        color: '#2196F3',
        iconType: 'shield' as const,
        name: 'Detective'
      },
      FBI: {
        color: '#FF9800',
        iconType: 'crown' as const,
        name: 'FBI Agent'
      }
    };
    
    return {
      name: displayInfo[rank].name,
      description: requirements.description,
      color: displayInfo[rank].color,
      iconType: displayInfo[rank].iconType,
      order: rankOrder.indexOf(rank)
    };
  }

  /**
   * Validate rank transition is legitimate
   * Requirements 4.1, 4.2, 4.3
   */
  static validateRankTransition(
    fromRank: PlayerRank, 
    toRank: PlayerRank, 
    profile: PlayerProfile
  ): boolean {
    const ranks: PlayerRank[] = ['Tyapu', 'GuessMaster', 'Detective', 'FBI'];
    const fromIndex = ranks.indexOf(fromRank);
    const toIndex = ranks.indexOf(toRank);
    
    // Can't go backwards in rank
    if (toIndex < fromIndex) {
      return false;
    }
    
    // Can't skip ranks (must progress one at a time)
    if (toIndex > fromIndex + 1) {
      return false;
    }
    
    // Must meet requirements for the target rank
    const calculatedRank = this.calculatePlayerRank(profile);
    const calculatedIndex = ranks.indexOf(calculatedRank);
    
    return toIndex <= calculatedIndex;
  }

  /**
   * Create a new player profile with default rank
   * Requirements 4.1
   */
  static createNewPlayerProfile(userId: string, username: string): PlayerProfile {
    return {
      userId,
      username,
      rank: 'Tyapu',
      totalGuesses: 0,
      successfulGuesses: 0,
      successRate: 0,
      joinedAt: Date.now(),
      lastActive: Date.now()
    };
  }

  /**
   * Calculate statistics from guess history
   * Requirements 4.4
   */
  static calculateStatsFromGuesses(guesses: GuessData[]): {
    totalGuesses: number;
    successfulGuesses: number;
    successRate: number;
  } {
    const totalGuesses = guesses.length;
    const successfulGuesses = guesses.filter(g => g.isCorrect).length;
    const successRate = totalGuesses > 0 ? successfulGuesses / totalGuesses : 0;
    
    return {
      totalGuesses,
      successfulGuesses,
      successRate
    };
  }
}