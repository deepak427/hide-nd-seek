/**
 * Service interfaces and contracts for Hide & Seek game
 * Defines client-side service abstractions and network communication
 */

import type { 
  GuessData, 
  PlayerProfile, 
  VirtualMap, 
  HidingSpot,
  GameState,
  EnvironmentMode,
  PlayerRank
} from './game';

import type { 
  CreatePostRequest, 
  CreatePostResponse, 
  InitResponse, 
  SubmitGuessRequest, 
  SubmitGuessResponse, 
  GetGuessesResponse 
} from './api';

// Network service interface
export interface NetworkService {
  // Game creation and initialization
  createPost(request: CreatePostRequest): Promise<CreatePostResponse>;
  initializeGame(): Promise<InitResponse>;
  
  // Guess submission and retrieval
  submitGuess(request: SubmitGuessRequest): Promise<SubmitGuessResponse>;
  getGuesses(gameId: string): Promise<GetGuessesResponse>;
  
  // Player and statistics
  getPlayerProfile(userId?: string): Promise<PlayerProfile>;
  updatePlayerStats(userId: string, stats: Partial<PlayerProfile>): Promise<boolean>;
  
  // Map data
  getCurrentMap(): Promise<VirtualMap>;
  getMapData(mapKey: string): Promise<VirtualMap>;
  
  // Health check
  ping(): Promise<boolean>;
}

// Environment detection service
export interface EnvironmentDetector {
  detectEnvironment(): EnvironmentMode;
  isEmbedded(): boolean;
  isStandalone(): boolean;
  getRedditContext(): {
    postId?: string;
    userId?: string;
    username?: string;
    subredditName?: string;
  } | null;
}

// Game state management service
export interface GameStateManager {
  // State management
  getState(): GameState;
  setState(state: Partial<GameState>): void;
  resetState(): void;
  
  // Mode management
  setMode(mode: 'creation' | 'guessing' | 'dashboard'): void;
  getMode(): 'creation' | 'guessing' | 'dashboard';
  
  // Selection management
  setSelectedObject(objectKey: string, position: { relX: number; relY: number }): void;
  getSelectedObject(): { objectKey: string; position: { relX: number; relY: number } } | null;
  clearSelection(): void;
  
  // Game session
  setGameId(gameId: string): void;
  getGameId(): string | null;
  
  // Player role
  setPlayerRole(role: 'creator' | 'guesser'): void;
  getPlayerRole(): 'creator' | 'guesser' | null;
  
  // Event listeners
  onStateChange(callback: (state: GameState) => void): () => void;
}

// Embedded game management service
export interface EmbeddedGameManager {
  // Initialization
  initialize(): Promise<void>;
  isEmbeddedMode(): boolean;
  
  // Game data
  getGameData(): Promise<{
    gameId: string;
    mapKey: string;
    isCreator: boolean;
    hidingSpot?: HidingSpot;
  }>;
  
  // Mode switching
  switchToGuessMode(): void;
  switchToDashboardMode(): void;
  
  // Guess handling
  submitGuess(objectKey: string, relX: number, relY: number): Promise<SubmitGuessResponse>;
  
  // Dashboard data
  getGuessesDashboard(): Promise<GuessData[]>;
  
  // Real-time updates
  startPollingForUpdates(): void;
  stopPollingForUpdates(): void;
}

// Error handling service
export interface ErrorHandler {
  // Error reporting
  reportError(error: Error, context?: any): void;
  reportWarning(message: string, context?: any): void;
  
  // Error recovery
  handleNetworkError(error: Error): Promise<boolean>;
  handleGameStateError(error: Error): void;
  handleRenderError(error: Error): void;
  
  // User feedback
  showErrorMessage(message: string, duration?: number): void;
  showSuccessMessage(message: string, duration?: number): void;
  showWarningMessage(message: string, duration?: number): void;
  
  // Error boundaries
  wrapAsync<T>(fn: () => Promise<T>): Promise<T | null>;
  wrapSync<T>(fn: () => T): T | null;
}

// UX enhancement service
export interface UXEnhancementService {
  // Loading states
  showLoadingSpinner(message?: string): void;
  hideLoadingSpinner(): void;
  updateLoadingProgress(progress: number, message?: string): void;
  
  // Animations and transitions
  animateObjectSelection(objectKey: string): Promise<void>;
  animateSuccessfulGuess(): Promise<void>;
  animateFailedGuess(): Promise<void>;
  animateRankProgression(newRank: PlayerRank): Promise<void>;
  
  // Feedback systems
  showTooltip(element: any, message: string): void; // HTMLElement when DOM is available
  hideTooltip(): void;
  highlightObject(objectKey: string, highlight: boolean): void;
  
  // Mobile optimizations
  optimizeForMobile(): void;
  handleOrientationChange(): void;
  preventZoom(): void;
  
  // Performance monitoring
  startPerformanceMonitoring(): void;
  stopPerformanceMonitoring(): void;
  getPerformanceMetrics(): {
    fps: number;
    memoryUsage: number;
    loadTime: number;
  };
}

// Asset management service
export interface AssetManager {
  // Loading
  loadAssets(assets: Array<{ key: string; url: string; type: string }>): Promise<void>;
  preloadCriticalAssets(): Promise<void>;
  
  // Retrieval
  getAsset(key: string): any;
  hasAsset(key: string): boolean;
  
  // Caching
  cacheAsset(key: string, data: any): void;
  clearCache(): void;
  getCacheSize(): number;
  
  // Progress tracking
  onLoadProgress(callback: (progress: number) => void): () => void;
  onLoadComplete(callback: () => void): () => void;
  onLoadError(callback: (error: Error) => void): () => void;
}

// Audio service
export interface AudioService {
  // Playback
  playSound(key: string, volume?: number): void;
  playMusic(key: string, loop?: boolean, volume?: number): void;
  stopSound(key: string): void;
  stopMusic(): void;
  stopAll(): void;
  
  // Volume control
  setMasterVolume(volume: number): void;
  setSoundVolume(volume: number): void;
  setMusicVolume(volume: number): void;
  
  // State management
  mute(): void;
  unmute(): void;
  isMuted(): boolean;
  
  // Preloading
  preloadAudio(assets: Array<{ key: string; url: string }>): Promise<void>;
}

// Analytics service
export interface AnalyticsService {
  // Event tracking
  trackEvent(eventName: string, properties?: Record<string, any>): void;
  trackGameStart(mapKey: string, mode: 'creation' | 'guessing'): void;
  trackGameComplete(gameId: string, success: boolean, duration: number): void;
  trackGuessSubmitted(gameId: string, accuracy: number): void;
  trackRankProgression(oldRank: PlayerRank, newRank: PlayerRank): void;
  
  // Performance tracking
  trackPerformance(metric: string, value: number): void;
  trackLoadTime(duration: number): void;
  trackError(error: Error, context?: any): void;
  
  // User behavior
  trackUserInteraction(action: string, target: string): void;
  trackTimeSpent(scene: string, duration: number): void;
}

// Service container interface
export interface ServiceContainer {
  network: NetworkService;
  environment: EnvironmentDetector;
  gameState: GameStateManager;
  embeddedGame: EmbeddedGameManager;
  errorHandler: ErrorHandler;
  uxEnhancement: UXEnhancementService;
  assetManager: AssetManager;
  audio: AudioService;
  analytics: AnalyticsService;
  
  // Service lifecycle
  initialize(): Promise<void>;
  dispose(): void;
  
  // Service registration
  register<T>(name: string, service: T): void;
  get<T>(name: string): T;
  has(name: string): boolean;
}