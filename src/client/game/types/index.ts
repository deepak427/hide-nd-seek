/**
 * Client-side game type definitions
 * Extends shared types with client-specific interfaces
 */

export * from '../../../shared/types';

// Client-specific extensions
export interface ClientGameState {
  isInitialized: boolean;
  currentScene: string;
  loadingProgress: number;
  errorState?: {
    message: string;
    recoverable: boolean;
  };
}

export interface PhaserGameConfig extends Phaser.Types.Core.GameConfig {
  parent: string;
  backgroundColor: string;
  scale: {
    mode: Phaser.Scale.ScaleModes;
    autoCenter: Phaser.Scale.Center;
    width: number;
    height: number;
  };
  physics?: {
    default: string;
    arcade?: {
      gravity: { y: number };
      debug: boolean;
    };
  };
}

export interface ClientEventData {
  type: string;
  payload: any;
  timestamp: number;
  source: 'user' | 'system' | 'network';
}