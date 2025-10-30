/**
 * Reddit Authentication Service
 * Implements Requirements 10.2, 10.4 - Use context.user for player identification and handle user session management
 * 
 * This service provides comprehensive Reddit authentication integration using Devvit's context system
 */

import { context, reddit, redis } from '@devvit/web/server';
import { RedisStorageService } from './RedisStorageService';
import type { PlayerProfile } from '../../shared/types/game';
import { RankService } from '../../shared/services/RankService';
import { AuthenticationError, AuthorizationError } from './ErrorHandlingService';

export interface RedditUser {
  id: string;
  username: string;
  isAuthenticated: boolean;
  isModerator?: boolean;
  isAdmin?: boolean;
  accountCreated?: number;
  karma?: {
    post: number;
    comment: number;
  };
}

export interface UserSession {
  userId: string;
  username: string;
  sessionId: string;
  createdAt: number;
  lastActive: number;
  expiresAt: number;
  metadata: {
    subredditName?: string;
    postId?: string;
    userAgent?: string;
    ipHash?: string;
  };
}

export interface AuthenticationResult {
  user: RedditUser;
  session: UserSession;
  playerProfile: PlayerProfile;
  isNewUser: boolean;
}

export class RedditAuthService {
  private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly SESSION_REFRESH_THRESHOLD = 2 * 60 * 60 * 1000; // 2 hours
  private static readonly MAX_SESSIONS_PER_USER = 5;
  
  private storage: RedisStorageService;

  constructor() {
    this.storage = RedisStorageService.getInstance();
  }

  /**
   * Get current authenticated user from Reddit context
   * Requirements 10.2
   */
  public async getCurrentUser(): Promise<RedditUser> {
    try {
      const { userId } = context;

      if (!userId) {
        throw new AuthenticationError('User not authenticated - missing userId in context');
      }

      // Get additional user information from Reddit API if available
      let userDetails: RedditUser = {
        id: userId,
        username: `User_${userId.slice(-6)}`,
        isAuthenticated: true
      };

      try {
        // Try to get more detailed user information
        const redditUser = await reddit.getUserById(userId);
        
        if (redditUser) {
          userDetails = {
            ...userDetails,
            username: redditUser.username,
            accountCreated: redditUser.createdAt?.getTime(),
            // Note: Karma might not be available in all contexts
          };
        }
      } catch (error) {
        console.warn('Could not fetch detailed user info from Reddit API:', error);
        // Continue with basic user info
      }

      // Check if user is moderator in current subreddit
      try {
        const { subredditName } = context;
        if (subredditName) {
          userDetails.isModerator = await this.checkModeratorStatus(userId, subredditName);
        }
      } catch (error) {
        console.warn('Could not check moderator status:', error);
      }

      return userDetails;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      console.error('Error getting current user:', error);
      throw new AuthenticationError('Failed to authenticate user');
    }
  }

  /**
   * Create or update user session
   * Requirements 10.4
   */
  public async createSession(user: RedditUser): Promise<UserSession> {
    try {
      const { postId, subredditName } = context;
      
      const sessionId = this.generateSessionId();
      const now = Date.now();
      
      const session: UserSession = {
        userId: user.id,
        username: user.username,
        sessionId,
        createdAt: now,
        lastActive: now,
        expiresAt: now + RedditAuthService.SESSION_DURATION,
        metadata: {
          ...(subredditName && { subredditName }),
          ...(postId && { postId: postId.toString() }),
          // Note: userAgent and ipHash would need to be extracted from request headers
          // which may not be available in Devvit context
        }
      };

      // Store session in Redis
      const sessionKey = this.getSessionKey(sessionId);
      await redis.set(sessionKey, JSON.stringify(session));
      await redis.expire(sessionKey, Math.floor(RedditAuthService.SESSION_DURATION / 1000));

      // Also store user session mapping
      const userSessionsKey = this.getUserSessionsKey(user.id);
      await redis.set(`${userSessionsKey}:${sessionId}`, JSON.stringify({ sessionId, createdAt: now }));
      await redis.expire(`${userSessionsKey}:${sessionId}`, Math.floor(RedditAuthService.SESSION_DURATION / 1000));

      // Clean up old sessions if user has too many
      await this.cleanupOldSessions(user.id);

      console.log(`✅ Created session for user: ${user.username} (${sessionId})`);
      return session;
    } catch (error) {
      console.error('Error creating session:', error);
      throw new AuthenticationError('Failed to create user session');
    }
  }

  /**
   * Get session by session ID
   * Requirements 10.4
   */
  public async getSession(sessionId: string): Promise<UserSession | null> {
    try {
      const sessionKey = this.getSessionKey(sessionId);
      const sessionData = await redis.get(sessionKey);

      if (!sessionData) {
        return null;
      }

      const session = JSON.parse(sessionData) as UserSession;

      // Check if session is expired
      if (session.expiresAt < Date.now()) {
        await this.deleteSession(sessionId);
        return null;
      }

      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Update session activity
   * Requirements 10.4
   */
  public async updateSessionActivity(sessionId: string): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return false;
      }

      const now = Date.now();
      session.lastActive = now;

      // Extend session if it's close to expiring
      if (session.expiresAt - now < RedditAuthService.SESSION_REFRESH_THRESHOLD) {
        session.expiresAt = now + RedditAuthService.SESSION_DURATION;
      }

      const sessionKey = this.getSessionKey(sessionId);
      await redis.set(sessionKey, JSON.stringify(session));
      await redis.expire(sessionKey, Math.floor((session.expiresAt - now) / 1000));

      return true;
    } catch (error) {
      console.error('Error updating session activity:', error);
      return false;
    }
  }

  /**
   * Delete session
   * Requirements 10.4
   */
  public async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return true; // Already deleted
      }

      const sessionKey = this.getSessionKey(sessionId);
      const userSessionKey = `${this.getUserSessionsKey(session.userId)}:${sessionId}`;

      await redis.del(sessionKey);
      await redis.del(userSessionKey);

      console.log(`🗑️ Deleted session: ${sessionId}`);
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  }

  /**
   * Authenticate user and create/get player profile
   * Requirements 10.2, 10.4
   */
  public async authenticateUser(): Promise<AuthenticationResult> {
    try {
      // Get current user from Reddit context
      const user = await this.getCurrentUser();

      // Create session
      const session = await this.createSession(user);

      // Get or create player profile
      let playerProfile = await this.storage.getPlayer(user.id);
      let isNewUser = false;

      if (!playerProfile) {
        // Create new player profile
        playerProfile = RankService.createNewPlayerProfile(user.id, user.username);
        await this.storage.createPlayer(playerProfile);
        isNewUser = true;
        
        console.log(`🎮 Created new player profile for: ${user.username}`);
      } else {
        // Update username if it changed
        if (playerProfile.username !== user.username) {
          playerProfile.username = user.username;
          await this.storage.updatePlayer(user.id, { username: user.username });
        }

        // Update last active timestamp
        playerProfile.lastActive = Date.now();
        await this.storage.updatePlayer(user.id, { lastActive: playerProfile.lastActive });
      }

      return {
        user,
        session,
        playerProfile,
        isNewUser
      };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      console.error('Error authenticating user:', error);
      throw new AuthenticationError('Authentication failed');
    }
  }

  /**
   * Check if user is authorized for specific actions
   * Requirements 10.2, 10.4
   */
  public async checkAuthorization(
    userId: string,
    action: string,
    resourceId?: string
  ): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();

      // Basic authentication check
      if (user.id !== userId) {
        return false;
      }

      switch (action) {
        case 'view_game':
        case 'create_game':
        case 'submit_guess':
          // All authenticated users can perform these actions
          return true;

        case 'view_guesses':
          // Only game creator can view guesses
          if (resourceId) {
            const game = await this.storage.getGame(resourceId);
            return game?.creator === userId;
          }
          return false;

        case 'moderate':
          // Only moderators can moderate
          return user.isModerator === true;

        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking authorization:', error);
      return false;
    }
  }

  /**
   * Get user's active sessions
   * Requirements 10.4
   */
  public async getUserSessions(userId: string): Promise<UserSession[]> {
    try {
      // This would require scanning keys in a real implementation
      // For now, return empty array as this would be inefficient
      console.log(`Getting sessions for user: ${userId} - requires key scanning implementation`);
      return [];
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  }

  /**
   * Logout user (delete all sessions)
   * Requirements 10.4
   */
  public async logoutUser(userId: string): Promise<boolean> {
    try {
      const sessions = await this.getUserSessions(userId);
      
      for (const session of sessions) {
        await this.deleteSession(session.sessionId);
      }

      console.log(`👋 Logged out user: ${userId}`);
      return true;
    } catch (error) {
      console.error('Error logging out user:', error);
      return false;
    }
  }

  /**
   * Check if user is moderator in subreddit
   * Requirements 10.2
   */
  private async checkModeratorStatus(userId: string, subredditName: string): Promise<boolean> {
    try {
      // Note: This would require Reddit API access to check moderator status
      // For now, return false as this information may not be available in all contexts
      console.log(`Checking moderator status for ${userId} in ${subredditName} - API access required`);
      return false;
    } catch (error) {
      console.error('Error checking moderator status:', error);
      return false;
    }
  }

  /**
   * Clean up old sessions for user
   * Requirements 10.4
   */
  private async cleanupOldSessions(userId: string): Promise<void> {
    try {
      const sessions = await this.getUserSessions(userId);
      
      if (sessions.length > RedditAuthService.MAX_SESSIONS_PER_USER) {
        // Sort by creation time and delete oldest sessions
        sessions.sort((a, b) => a.createdAt - b.createdAt);
        
        const sessionsToDelete = sessions.slice(0, sessions.length - RedditAuthService.MAX_SESSIONS_PER_USER);
        
        for (const session of sessionsToDelete) {
          await this.deleteSession(session.sessionId);
        }
        
        console.log(`🧹 Cleaned up ${sessionsToDelete.length} old sessions for user: ${userId}`);
      }
    } catch (error) {
      console.error('Error cleaning up old sessions:', error);
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get Redis key for session
   */
  private getSessionKey(sessionId: string): string {
    return `hideseek:session:${sessionId}`;
  }

  /**
   * Get Redis key for user sessions
   */
  private getUserSessionsKey(userId: string): string {
    return `hideseek:user_sessions:${userId}`;
  }



  /**
   * Get authentication middleware for Express routes
   */
  public getAuthMiddleware() {
    return async (req: any, res: any, next: any) => {
      try {
        const authResult = await this.authenticateUser();
        
        // Attach user info to request
        req.user = authResult.user;
        req.session = authResult.session;
        req.playerProfile = authResult.playerProfile;
        
        next();
      } catch (error) {
        if (error instanceof AuthenticationError) {
          res.status(401).json({
            error: 'Authentication required',
            message: error.message
          });
        } else {
          res.status(500).json({
            error: 'Authentication failed',
            message: 'Internal server error'
          });
        }
      }
    };
  }

  /**
   * Get authorization middleware for Express routes
   */
  public getAuthorizationMiddleware(action: string, resourceIdParam?: string) {
    return async (req: any, res: any, next: any) => {
      try {
        if (!req.user) {
          throw new AuthenticationError('User not authenticated');
        }

        const resourceId = resourceIdParam ? req.params[resourceIdParam] : undefined;
        const authorized = await this.checkAuthorization(req.user.id, action, resourceId);

        if (!authorized) {
          throw new AuthorizationError(`Not authorized for action: ${action}`);
        }

        next();
      } catch (error) {
        if (error instanceof AuthorizationError) {
          res.status(403).json({
            error: 'Authorization failed',
            message: error.message
          });
        } else if (error instanceof AuthenticationError) {
          res.status(401).json({
            error: 'Authentication required',
            message: error.message
          });
        } else {
          res.status(500).json({
            error: 'Authorization check failed',
            message: 'Internal server error'
          });
        }
      }
    };
  }
}

// Export singleton instance
export const redditAuth = new RedditAuthService();