/**
 * Phaser.js specific types and interfaces for Hide & Seek game
 * Defines game objects, scenes, and engine-specific data structures
 */

import type { MapObject, RelativePosition, GameState } from './game';

// Phaser scene types
export type SceneKey = 'SplashScene' | 'MainMenuScene' | 'MapSelectScene' | 'GameScene' | 'UIScene';

// Phaser game object interfaces
export interface InteractiveMapObject {
  key: string;
  name: string;
  sprite: any; // Phaser.GameObjects.Sprite when Phaser is available
  bounds: any; // Phaser.Geom.Rectangle when Phaser is available
  interactive: boolean;
  highlighted: boolean;
  selected: boolean;
}

export interface GameObjectData extends MapObject {
  sprite?: any; // Phaser.GameObjects.Sprite when Phaser is available
  hitArea?: any; // Phaser.Geom.Rectangle when Phaser is available
  isHovered: boolean;
  isSelected: boolean;
}

// Scene data and configuration
export interface SceneData {
  gameState?: GameState;
  mapKey?: string;
  gameId?: string;
  playerRole?: 'creator' | 'guesser';
  hidingSpot?: RelativePosition;
}

export interface SplashSceneConfig {
  spriteSheetKey: string;
  animationFrames: number;
  animationDuration: number;
  transitionDelay: number;
}

export interface GameSceneConfig {
  mapKey: string;
  backgroundKey: string;
  objects: MapObject[];
  mode: 'creation' | 'guessing' | 'dashboard';
}

// Animation and visual effects
export interface AnimationConfig {
  key: string;
  frames: any[]; // Phaser.Types.Animations.AnimationFrame[] when Phaser is available
  frameRate: number;
  repeat: number;
  yoyo?: boolean;
}

export interface TransitionConfig {
  duration: number;
  ease: string;
  alpha?: { from: number; to: number };
  scale?: { from: number; to: number };
  position?: { from: { x: number; y: number }; to: { x: number; y: number } };
}

// Input and interaction
export interface PointerEventData {
  x: number;
  y: number;
  worldX: number;
  worldY: number;
  button: number;
  isDown: boolean;
}

export interface ObjectInteraction {
  objectKey: string;
  interactionType: 'hover' | 'click' | 'select' | 'deselect';
  position: RelativePosition;
  timestamp: number;
}

// UI components for Phaser scenes
export interface UIButton {
  key: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: any; // Phaser.Types.GameObjects.Text.TextStyle when Phaser is available
  callback: () => void;
  enabled: boolean;
}

export interface UIPanel {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor: number;
  borderColor?: number;
  borderWidth?: number;
  alpha: number;
}

export interface ProgressBar {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor: number;
  fillColor: number;
  progress: number; // 0-1
  animated: boolean;
}

// Asset loading and management
export interface AssetConfig {
  key: string;
  url: string;
  type: 'image' | 'spritesheet' | 'audio' | 'json';
  frameConfig?: {
    frameWidth: number;
    frameHeight: number;
    startFrame?: number;
    endFrame?: number;
  };
}

export interface LoadingProgress {
  filesLoaded: number;
  totalFiles: number;
  bytesLoaded: number;
  totalBytes: number;
  percentage: number;
}

// Camera and viewport
export interface CameraConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ViewportConfig {
  width: number;
  height: number;
  scale: number;
  centerX: number;
  centerY: number;
}

// Game physics and collision (if needed)
export interface CollisionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HitTestResult {
  hit: boolean;
  object?: InteractiveMapObject;
  position: RelativePosition;
  distance: number;
}

// Scene management
export interface SceneTransition {
  from: SceneKey;
  to: SceneKey;
  data?: SceneData;
  transition?: TransitionConfig;
}

export interface SceneManager {
  currentScene: SceneKey;
  previousScene?: SceneKey;
  sceneStack: SceneKey[];
  transitionInProgress: boolean;
}

// Performance and optimization
export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  drawCalls: number;
  activeObjects: number;
  lastUpdateTime: number;
}

export interface OptimizationSettings {
  maxActiveObjects: number;
  cullingEnabled: boolean;
  textureAtlasEnabled: boolean;
  audioCompressionEnabled: boolean;
}