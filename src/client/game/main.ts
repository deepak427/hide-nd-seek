import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { Game as MainGame } from './scenes/Game/Game';
import { MainMenu } from './scenes/MainMenu/MainMenu';
import { MapSelection } from './scenes/MapSelection/MapSelection';
import { SplashScene } from './scenes/SplashScene';
import * as Phaser from 'phaser';
import { AUTO, Game } from 'phaser';
import { Preloader } from './scenes/Preloader/Preloader';
import { Theme } from '../style/theme';
import { EnvironmentDetector } from './services/EnvironmentDetector';

// Enhanced Game Config with responsive design and mobile optimization
const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  parent: 'game-container',
  backgroundColor: Theme.bgPrimary,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1024,
    height: 768,
    min: {
      width: 320,
      height: 240
    },
    max: {
      width: 2560,
      height: 1440
    },
    // Enhanced responsive scaling
    expandParent: true,
    fullscreenTarget: 'game-container'
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false,
    transparent: false,
    clearBeforeRender: true,
    preserveDrawingBuffer: false,
    premultipliedAlpha: true,
    failIfMajorPerformanceCaveat: false,
    powerPreference: 'high-performance',
    batchSize: 4096,
    maxLights: 10,
    // Enhanced mobile optimizations
    mipmapFilter: 'LINEAR_MIPMAP_LINEAR',
    desynchronized: true
  },
  fps: {
    target: 60,
    forceSetTimeOut: false,
    deltaHistory: 10,
    panicMax: 120,
    smoothStep: true,
    // Mobile-specific FPS optimizations
    min: 30, // Minimum acceptable FPS
    limit: 60 // Cap FPS to save battery on mobile
  },
  scene: [Boot, SplashScene, Preloader, MainMenu, MapSelection, MainGame, GameOver],
  input: {
    keyboard: true,
    mouse: true,
    touch: true,
    gamepad: false,
    // Enhanced touch configuration for mobile
    activePointers: 3,
    smoothFactor: 0.2,
    windowEvents: false
  },
  disableContextMenu: true,
  banner: {
    hidePhaser: true,
    text: Theme.bgPrimary,
    background: [
      Theme.accentPrimary,
      Theme.primaryDark,
      Theme.bgSecondary,
      Theme.lightGray
    ]
  },
  callbacks: {
    postBoot: (game) => {
      // Enhanced post-boot setup
      console.log('🎮 Hide & Seek game initialized');
      
      // Add global game events
      game.events.on('ready', () => {
        console.log('🚀 Game ready');
      });
      
      game.events.on('blur', () => {
        console.log('⏸️ Game paused (lost focus)');
      });
      
      game.events.on('focus', () => {
        console.log('▶️ Game resumed (gained focus)');
      });
    }
  }
};

// WebGL detection and fallback
function detectWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    const hasWebGL = !!gl;
    
    if (hasWebGL && gl instanceof WebGLRenderingContext) {
      // Test basic WebGL functionality
      const renderer = gl.getParameter(gl.RENDERER);
      const vendor = gl.getParameter(gl.VENDOR);
      console.log(`🎮 WebGL Renderer: ${renderer}`);
      console.log(`🎮 WebGL Vendor: ${vendor}`);
    }
    
    return hasWebGL;
  } catch (e) {
    console.warn('WebGL detection failed:', e);
    return false;
  }
}

const StartGame = async (parent: string, gameInitData?: any) => {
  try {
    // Check WebGL support
    const hasWebGL = detectWebGLSupport();
    console.log(`🎮 WebGL Support: ${hasWebGL ? 'Available' : 'Not Available'}`);
    
    // Detect environment before starting the game
    const environmentDetector = EnvironmentDetector.getInstance();
    const detection = environmentDetector.detect();
    
    // Ensure parent container exists and has proper dimensions
    const container = document.getElementById(parent);
    if (!container) {
      throw new Error(`Container element '${parent}' not found`);
    }
    
    // Check container dimensions
    const containerRect = container.getBoundingClientRect();
    console.log(`📐 Container dimensions: ${containerRect.width}x${containerRect.height}`);
    
    if (containerRect.width === 0 || containerRect.height === 0) {
      console.warn('⚠️ Container has zero dimensions, setting minimum size');
      container.style.width = '100vw';
      container.style.height = '100vh';
      container.style.minWidth = '320px';
      container.style.minHeight = '240px';
      container.style.display = 'block';
      container.style.position = 'relative';
      
      // Wait for layout to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const updatedRect = container.getBoundingClientRect();
      console.log(`📐 Updated container dimensions: ${updatedRect.width}x${updatedRect.height}`);
    }
    
    // Create game config with fallback
    const gameConfig: Phaser.Types.Core.GameConfig = {
      ...config,
      parent,
      type: hasWebGL ? Phaser.WEBGL : Phaser.CANVAS,
      render: {
        ...config.render,
        // Disable advanced features if WebGL is not available
        antialias: hasWebGL && config.render?.antialias === true,
        powerPreference: hasWebGL && config.render?.powerPreference ? config.render.powerPreference : 'default'
      }
    };
    
    console.log(`🎮 Starting game with renderer: ${hasWebGL ? 'WebGL' : 'Canvas'}`);
    
    // Add additional error handling for game creation
    let game: Game;
    try {
      game = new Game(gameConfig);
    } catch (gameError) {
      console.error('❌ Failed to create Phaser game:', gameError);
      
      // Try with Canvas renderer as fallback
      if (hasWebGL) {
        console.log('🔄 Retrying with Canvas renderer...');
        const fallbackConfig = {
          ...gameConfig,
          type: Phaser.CANVAS,
          render: {
            ...gameConfig.render,
            antialias: false,
            powerPreference: 'default'
          }
        };
        game = new Game(fallbackConfig);
      } else {
        throw gameError;
      }
    }
    
    // Store environment detector reference globally for scenes to access
    (game as any).environmentDetector = environmentDetector;
    (game as any).environmentDetection = detection;
    
    // Store game initialization data for scenes to access
    if (gameInitData) {
      (game as any).gameInitData = gameInitData;
      console.log('🎮 Game initialization data stored:', gameInitData);
    }
    
    // Add error handling for game initialization
    game.events.once('ready', () => {
      console.log('✅ Game successfully initialized');
    });
    
    return game;
  } catch (error) {
    console.error('❌ Failed to start game:', error);
    
    // Show user-friendly error message
    const container = document.getElementById(parent);
    if (container) {
      container.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #ffffff;
          font-family: Arial, sans-serif;
          text-align: center;
          padding: 20px;
        ">
          <h2 style="color: #ff6b6b; margin-bottom: 20px;">Game Failed to Load</h2>
          <p style="margin-bottom: 10px;">Sorry, the game couldn't start properly.</p>
          <p style="margin-bottom: 20px;">This might be due to:</p>
          <ul style="text-align: left; margin-bottom: 20px;">
            <li>WebGL not being supported by your browser</li>
            <li>Hardware acceleration being disabled</li>
            <li>Browser compatibility issues</li>
          </ul>
          <button onclick="window.location.reload()" style="
            background: #00ADB5;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
          ">Try Again</button>
        </div>
      `;
    }
    
    throw error;
  }
};

export default StartGame;