import StartGame from './game/main';

// Enhanced loading screen management
class LoadingManager {
  private loadingScreen: HTMLElement | null = null;
  private progressBar: HTMLElement | null = null;
  private loadingText: HTMLElement | null = null;

  constructor() {
    this.createLoadingScreen();
  }

  private createLoadingScreen() {
    this.loadingScreen = document.createElement('div');
    this.loadingScreen.className = 'loading-screen';
    this.loadingScreen.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-text">Loading Hide & Seek...</div>
      <div class="loading-progress">
        <div class="loading-progress-bar"></div>
      </div>
    `;
    
    document.body.appendChild(this.loadingScreen);
    this.progressBar = this.loadingScreen.querySelector('.loading-progress-bar');
    this.loadingText = this.loadingScreen.querySelector('.loading-text');
  }

  updateProgress(progress: number, text?: string) {
    if (this.progressBar) {
      this.progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }
    if (text && this.loadingText) {
      this.loadingText.textContent = text;
    }
  }

  hide() {
    if (this.loadingScreen) {
      this.loadingScreen.classList.add('hidden');
      setTimeout(() => {
        if (this.loadingScreen && this.loadingScreen.parentNode) {
          this.loadingScreen.parentNode.removeChild(this.loadingScreen);
        }
      }, 500);
    }
  }
}

// Enhanced mobile optimizations and responsive handling
function setupMobileOptimizations() {
  // Setup viewport height handling for mobile browsers
  setupViewportHeight();
  
  // Prevent context menu on mobile
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
  
  // Prevent double-tap zoom on iOS
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, false);
  
  // Prevent pinch zoom
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  }, { passive: false });
  
  // Enhanced orientation change handling
  window.addEventListener('orientationchange', () => {
    // Update viewport height
    setupViewportHeight();
    
    // Scroll to top and refresh layout
    setTimeout(() => {
      window.scrollTo(0, 0);
      // Trigger resize event for game
      window.dispatchEvent(new Event('resize'));
    }, 100);
  });
  
  // Prevent pull-to-refresh on mobile
  document.body.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1 && window.scrollY === 0) {
      e.preventDefault();
    }
  }, { passive: false });
  
  document.body.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1 && window.scrollY === 0) {
      e.preventDefault();
    }
  }, { passive: false });
  
  // Handle window resize for responsive design
  let resizeTimeout: number;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout(() => {
      setupViewportHeight();
      console.log('📱 Window resized:', window.innerWidth, 'x', window.innerHeight);
    }, 100);
  });
  
  // Handle visibility change for mobile app switching
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      // App became visible - refresh viewport
      setupViewportHeight();
    }
  });
}

/**
 * Setup viewport height for mobile browsers
 * Requirements: 6.4 - Responsive design implementation
 */
function setupViewportHeight() {
  // Calculate actual viewport height (excluding mobile browser UI)
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  
  // Update game container height
  const gameContainer = document.getElementById('game-container');
  if (gameContainer) {
    gameContainer.style.height = `${window.innerHeight}px`;
  }
}

// Performance monitoring
function setupPerformanceMonitoring() {
  // Monitor FPS
  let fps = 0;
  let lastTime = performance.now();
  let frameCount = 0;
  
  function updateFPS() {
    frameCount++;
    const currentTime = performance.now();
    
    if (currentTime >= lastTime + 1000) {
      fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
      frameCount = 0;
      lastTime = currentTime;
      
      // Log performance warnings
      if (fps < 30) {
        console.warn(`Low FPS detected: ${fps}`);
      }
    }
    
    requestAnimationFrame(updateFPS);
  }
  
  requestAnimationFrame(updateFPS);
}

/**
 * Detect game mode from URL parameters and Devvit context
 * This determines if we're in a Reddit post (guessing mode) or main app (hiding mode)
 */
function detectGameMode() {
  console.log('🚀 DETECTGAMEMODE: Starting game mode detection');
  console.log('🚀 DETECTGAMEMODE: Current URL:', window.location.href);
  console.log('🚀 DETECTGAMEMODE: Hostname:', window.location.hostname);
  console.log('🚀 DETECTGAMEMODE: Search params:', window.location.search);
  console.log('🚀 DETECTGAMEMODE: Pathname:', window.location.pathname);
  
  const urlParams = new URLSearchParams(window.location.search);
  const gameId = urlParams.get('gameId') || urlParams.get('game_id');
  const postId = urlParams.get('postId') || urlParams.get('post_id');
  const userId = urlParams.get('userId') || urlParams.get('user_id');
  
  console.log('🚀 DETECTGAMEMODE: URL params extracted:', { gameId, postId, userId });
  
  // Check for postData in various global locations (set by server)
  let postData = null;
  try {
    console.log('🚀 DETECTGAMEMODE: Checking for postData in global locations...');
    
    postData = (window as any).postData || 
               (window as any).__DEVVIT_POST_DATA__ ||
               (window as any).__REDDIT_POST_DATA__ ||
               (document as any).postData;
    
    console.log('🚀 DETECTGAMEMODE: Global postData check result:', postData);
    
    // Also check if it's in a script tag
    if (!postData) {
      console.log('🚀 DETECTGAMEMODE: Checking script tags for postData...');
      const postDataScript = document.querySelector('script#post-data') || 
                            document.querySelector('script[data-post-data]');
      console.log('🚀 DETECTGAMEMODE: Found script tag:', !!postDataScript);
      
      if (postDataScript) {
        console.log('🚀 DETECTGAMEMODE: Script tag content:', postDataScript.textContent);
        console.log('🚀 DETECTGAMEMODE: Script tag innerHTML:', postDataScript.innerHTML);
        console.log('🚀 DETECTGAMEMODE: Script tag outerHTML:', postDataScript.outerHTML);
        try {
          const rawContent = postDataScript.textContent || '{}';
          console.log('🚀 DETECTGAMEMODE: Raw content to parse:', JSON.stringify(rawContent));
          postData = JSON.parse(rawContent);
          console.log('📜 DETECTGAMEMODE: PostData loaded from script tag:', postData);
        } catch (e) {
          console.warn('🚀 DETECTGAMEMODE: Failed to parse postData from script tag:', e);
          console.warn('🚀 DETECTGAMEMODE: Raw content was:', postDataScript.textContent);
        }
      }
    }
    
    // Check meta tags as fallback
    if (!postData) {
      console.log('🚀 DETECTGAMEMODE: Checking meta tags for postData...');
      const gameIdMeta = document.querySelector('meta[name="game-id"]');
      const mapKeyMeta = document.querySelector('meta[name="map-key"]');
      const objectKeyMeta = document.querySelector('meta[name="object-key"]');
      
      console.log('🚀 DETECTGAMEMODE: Meta tags found:', {
        gameIdMeta: !!gameIdMeta,
        mapKeyMeta: !!mapKeyMeta,
        objectKeyMeta: !!objectKeyMeta
      });
      
      if (gameIdMeta || mapKeyMeta || objectKeyMeta) {
        postData = {
          gameId: gameIdMeta?.getAttribute('content'),
          mapKey: mapKeyMeta?.getAttribute('content'),
          objectKey: objectKeyMeta?.getAttribute('content'),
          mode: 'guessing'
        };
        console.log('🚀 DETECTGAMEMODE: PostData from meta tags:', postData);
      }
    }
    
    console.log('🎯 DETECTGAMEMODE: Final postData result:', postData);
  } catch (e) {
    console.warn('🚀 DETECTGAMEMODE: Error accessing postData:', e);
  }
  
  // Check if we're in Reddit environment
  const isRedditPost = gameId || postId || postData?.gameId || 
                      window.location.hostname.includes('reddit') || 
                      window.location.hostname.includes('devvit');
  
  console.log('🔍 DETECTGAMEMODE: Environment detection:', {
    gameId: gameId || postData?.gameId,
    postId,
    userId,
    postData,
    hostname: window.location.hostname,
    search: window.location.search,
    href: window.location.href,
    isRedditPost,
    hasGameId: !!(gameId || postData?.gameId)
  });
  
  // Additional debugging
  console.log('🔍 DETECTGAMEMODE: All URL params:', Object.fromEntries(urlParams.entries()));
  
  if (isRedditPost && (gameId || postData?.gameId)) {
    console.log('🎮 DETECTGAMEMODE: DETECTED REDDIT POST WITH GAME ID - SWITCHING TO GUESSING MODE');
    const result = {
      mode: (postData?.mode || 'guessing') as 'hiding' | 'guessing' | 'dashboard',
      mapKey: postData?.mapKey || 'octmap',
      gameId: gameId || postData?.gameId,
      postId,
      userId,
      objectKey: postData?.objectKey,
      userRole: postData?.userRole,
      hidingSpot: postData?.hidingSpot,
      environment: {
        mode: 'embedded' as const,
        platform: 'reddit',
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    };
    console.log('🎮 DETECTGAMEMODE: Returning guessing mode data:', result);
    return result;
  } else {
    console.log('🎮 DETECTGAMEMODE: NO GAME ID DETECTED - DEFAULTING TO HIDING MODE');
    const result = {
      mode: 'hiding' as 'hiding' | 'guessing' | 'dashboard',
      mapKey: 'octmap',
      environment: {
        mode: 'standalone' as const,
        platform: 'web',
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    };
    console.log('🎮 DETECTGAMEMODE: Returning hiding mode data:', result);
    return result;
  }
}

// Enhanced initialization
document.addEventListener('DOMContentLoaded', () => {
  const loadingManager = new LoadingManager();
  
  // Setup optimizations
  setupMobileOptimizations();
  setupPerformanceMonitoring();
  
  // Simulate loading progress
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress += Math.random() * 15;
    
    if (progress < 30) {
      loadingManager.updateProgress(progress, 'Initializing game engine...');
    } else if (progress < 60) {
      loadingManager.updateProgress(progress, 'Loading assets...');
    } else if (progress < 90) {
      loadingManager.updateProgress(progress, 'Setting up scenes...');
    } else {
      loadingManager.updateProgress(100, 'Ready to play!');
      clearInterval(progressInterval);
      
      // Start the game after a brief delay
      setTimeout(async () => {
        try {
          console.log('🚀 MAIN: Starting game initialization...');
          
          // Detect game mode from URL parameters and Devvit context
          const gameInitData = detectGameMode();
          console.log('🚀 MAIN: Game initialization data from detectGameMode:', gameInitData);
          
          console.log('🚀 MAIN: Calling StartGame with data...');
          await StartGame('game-container', gameInitData);
          console.log('🚀 MAIN: StartGame completed successfully');
          
          loadingManager.hide();
          document.body.classList.add('loaded');
        } catch (error) {
          console.error('🚀 MAIN: Failed to start game:', error);
          loadingManager.hide();
          // Error message will be shown by StartGame function
        }
      }, 500);
    }
  }, 100);
});