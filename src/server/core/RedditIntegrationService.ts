import { reddit, context } from '@devvit/web/server';
import { CreatePostResponse } from '../../shared/types/api';
import { ErrorHandlingService, ExternalServiceError } from './ErrorHandlingService';

export interface GameData {
  gameId: string;
  mapKey: string;
  objectKey: string;
}

export class RedditIntegrationService {
  private static readonly MAX_RETRIES = 3;
  private static readonly BASE_DELAY = 1000; // 1 second

  /**
   * Create a Reddit post with embedded Devvit app
   */
  static async createGamePost(gameData: GameData): Promise<CreatePostResponse> {
    const { subredditName } = context;
    
    if (!subredditName) {
      throw new ExternalServiceError('Subreddit context is required but missing', 'REDDIT_CONTEXT_ERROR', 500);
    }

    // Validate game data
    RedditIntegrationService.validatePostData(gameData);

    try {
      const post = await RedditIntegrationService.retryRedditCall(
        async () => {
          return await reddit.submitCustomPost({
            subredditName: subredditName!,
            title: RedditIntegrationService.generatePostTitle(gameData.mapKey, gameData.objectKey, gameData.gameId),
            splash: {
              appDisplayName: 'Hide & Seek',
              backgroundUri: 'splash.png',
              buttonLabel: 'Play Game',
              description: RedditIntegrationService.generateSplashDescription(gameData.mapKey, gameData.objectKey),
              heading: 'Hide & Seek Challenge',
              appIconUri: 'splash.png',
            },
            postData: {
              gameId: gameData.gameId,
              mapKey: gameData.mapKey,
              objectKey: gameData.objectKey,
              mode: 'guessing'
            }
          });
        },
        RedditIntegrationService.MAX_RETRIES,
        RedditIntegrationService.BASE_DELAY
      );

      const postUrl = `https://www.reddit.com${post.permalink ?? '/unknown'}`;
      
      console.log(`📝 Created Reddit post: ${postUrl} for game ${gameData.gameId}`);

      return {
        success: true,
        postUrl,
        gameId: gameData.gameId
      };
    } catch (error) {
      ErrorHandlingService.handleRedditError(error, 'createGamePost');
      throw error; // Re-throw after handling
    }
  }

  /**
   * Generate a compelling post title with Game ID
   */
  private static generatePostTitle(mapKey: string, objectKey: string, gameId?: string): string {
    const mapName = RedditIntegrationService.formatMapName(mapKey);
    const objectName = RedditIntegrationService.formatObjectName(objectKey);
    
    // Generate short game ID for title (first 5 characters, uppercase)
    const shortGameId = gameId ? gameId.substring(0, 5).toUpperCase() : '';
    
    const titles = [
      `🔍 [${shortGameId}] Hide & Seek - Find the hidden ${objectName} in ${mapName}!`,
      `🎯 [${shortGameId}] Spot the ${objectName}! Hidden in ${mapName}`,
      `🕵️ [${shortGameId}] Detective Challenge: Find the ${objectName} in ${mapName}`,
      `🎮 [${shortGameId}] Hide & Seek: Where's the ${objectName} in ${mapName}?`,
      `🔎 [${shortGameId}] Can you spot the hidden ${objectName} in ${mapName}?`
    ];

    // Use a simple hash to pick a consistent title for the same map/object combo
    const hash = (mapKey + objectKey).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return titles[Math.abs(hash) % titles.length] || titles[0];
  }

  /**
   * Generate post description text
   */
  private static generatePostText(mapKey: string, objectKey: string): string {
    const mapName = RedditIntegrationService.formatMapName(mapKey);
    const objectName = RedditIntegrationService.formatObjectName(objectKey);

    return `🎮 **Hide & Seek Challenge**

I've hidden a ${objectName} somewhere in ${mapName}. Can you find it?

**How to play:**
- Click on objects in the scene to make your guess
- Get instant feedback on your accuracy
- See how you compare to other players!

Good luck, detective! 🕵️‍♂️

*This is an interactive game - click the app below to start playing!*`;
  }

  /**
   * Generate splash screen description
   */
  private static generateSplashDescription(mapKey: string, objectKey: string): string {
    const mapName = RedditIntegrationService.formatMapName(mapKey);
    const objectName = RedditIntegrationService.formatObjectName(objectKey);
    
    return `Find the hidden ${objectName} in ${mapName}!`;
  }

  /**
   * Format map key to human-readable name
   */
  private static formatMapName(mapKey: string): string {
    return mapKey
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Format object key to human-readable name
   */
  private static formatObjectName(objectKey: string): string {
    return objectKey
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }



  /**
   * Retry Reddit API calls with exponential backoff
   */
  static async retryRedditCall<T>(
    fn: () => Promise<T>,
    maxRetries: number,
    baseDelay: number
  ): Promise<T> {
    let lastError: Error = new Error('No attempts made');
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Don't retry on certain errors
        const message = lastError.message.toLowerCase();
        if (message.includes('permission') || 
            message.includes('unauthorized') ||
            message.includes('forbidden')) {
          console.log(`Reddit API call failed with non-retryable error: ${lastError.message}`);
          break;
        }
        
        // Calculate delay with exponential backoff (max 30 seconds)
        const delay = Math.min(baseDelay * Math.pow(2, attempt), 30000);
        console.log(`Reddit API call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Validate post creation parameters
   */
  static validatePostData(gameData: GameData): void {
    if (!gameData.gameId) {
      throw new ExternalServiceError('Game ID is required for post creation', 'REDDIT_VALIDATION_ERROR', 400);
    }
    
    if (!gameData.mapKey) {
      throw new ExternalServiceError('Map key is required for post creation', 'REDDIT_VALIDATION_ERROR', 400);
    }
    
    if (!gameData.objectKey) {
      throw new ExternalServiceError('Object key is required for post creation', 'REDDIT_VALIDATION_ERROR', 400);
    }
    
    // Validate format using centralized validation
    try {
      ErrorHandlingService.validateStringFormat(gameData.mapKey, 'Map key');
      ErrorHandlingService.validateStringFormat(gameData.objectKey, 'Object key');
    } catch (error) {
      throw new ExternalServiceError(
        `Post validation failed: ${error instanceof Error ? error.message : 'Invalid format'}`,
        'REDDIT_VALIDATION_ERROR',
        400
      );
    }
  }
}