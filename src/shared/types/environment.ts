/**
 * Environment detection types for Reddit Devvit integration
 */

export interface DevvitContext {
  postId: string;
  userId: string;
  username: string;
  subredditName: string;
  [key: string]: any;
}

export interface EnvironmentDetection {
  mode: 'standalone' | 'embedded';
  context?: DevvitContext;
  postId?: string;
  userId?: string;
  username?: string;
  subredditName?: string;
}

export interface EmbeddedGameConfig {
  gameId: string;
  mapKey: string;
  userRole: 'creator' | 'guesser';
  hidingSpot?: {
    objectKey: string;
    relX: number;
    relY: number;
  };
}

export interface GameInitData {
  mapKey: string;
  mode?: 'hiding' | 'guessing' | 'dashboard';
  gameId?: string;
  postId?: string;
  userId?: string;
  objectKey?: string;
  userRole?: 'creator' | 'guesser';
  hidingSpot?: {
    objectKey: string;
    relX: number;
    relY: number;
  };
  gameData?: any;
  environment?: EnvironmentDetection;
  embeddedConfig?: EmbeddedGameConfig;
}