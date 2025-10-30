import { Scene } from 'phaser';

export interface ResponsiveConfig {
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
  baseWidth: number;
  baseHeight: number;
}

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  touchSupported: boolean;
}

export interface ResponsiveBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
}

/**
 * ResponsiveManager handles responsive design and mobile optimization
 * Requirements: 6.4 - Ensure responsive design that works on both desktop and mobile devices
 */
export class ResponsiveManager {
  private scene: Scene;
  private config: ResponsiveConfig;
  private deviceInfo: DeviceInfo;
  private breakpoints: ResponsiveBreakpoints;
  private resizeCallbacks: Array<() => void> = [];
  private orientationChangeCallbacks: Array<(isPortrait: boolean) => void> = [];

  constructor(scene: Scene, config?: Partial<ResponsiveConfig>) {
    this.scene = scene;
    this.config = {
      minWidth: 320,
      minHeight: 240,
      maxWidth: 2560,
      maxHeight: 1440,
      baseWidth: 1024,
      baseHeight: 768,
      ...config
    };

    this.breakpoints = {
      mobile: 768,
      tablet: 1024,
      desktop: 1200
    };

    this.deviceInfo = this.detectDevice();
    this.setupResponsiveHandlers();
  }

  /**
   * Detect device capabilities and characteristics
   * Requirements: 6.4 - Optimize touch interactions for mobile
   */
  private detectDevice(): DeviceInfo {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;
    const touchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    const isPortrait = screenHeight > screenWidth;
    const isLandscape = !isPortrait;
    
    const isMobile = screenWidth <= this.breakpoints.mobile && touchSupported;
    const isTablet = screenWidth > this.breakpoints.mobile && 
                     screenWidth <= this.breakpoints.tablet && 
                     touchSupported;
    const isDesktop = screenWidth > this.breakpoints.tablet || !touchSupported;

    return {
      isMobile,
      isTablet,
      isDesktop,
      isPortrait,
      isLandscape,
      screenWidth,
      screenHeight,
      pixelRatio,
      touchSupported
    };
  }

  /**
   * Setup responsive event handlers
   * Requirements: 6.4 - Ensure responsive design works on both desktop and mobile
   */
  private setupResponsiveHandlers(): void {
    // Handle window resize
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Handle orientation change
    window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
    
    // Handle visibility change (for mobile app switching)
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Setup Phaser scale manager
    this.setupPhaserScaling();
  }

  /**
   * Setup Phaser scaling configuration
   * Requirements: 6.4 - Responsive design implementation
   */
  private setupPhaserScaling(): void {
    const scaleManager = this.scene.scale;
    
    // Configure scale mode based on device
    if (this.deviceInfo.isMobile) {
      scaleManager.setGameSize(
        Math.min(this.deviceInfo.screenWidth, this.config.maxWidth),
        Math.min(this.deviceInfo.screenHeight, this.config.maxHeight)
      );
    }

    // Listen to scale events
    scaleManager.on('resize', this.onPhaserResize.bind(this));
  }

  /**
   * Handle window resize events
   */
  private handleResize(): void {
    // Update device info
    this.deviceInfo = this.detectDevice();
    
    // Debounce resize handling
    clearTimeout((this as any).resizeTimeout);
    (this as any).resizeTimeout = setTimeout(() => {
      this.executeResize();
    }, 100);
  }

  /**
   * Execute resize logic
   */
  private executeResize(): void {
    console.log('📱 Responsive resize:', this.deviceInfo);
    
    // Update Phaser game size
    this.updateGameSize();
    
    // Call registered callbacks
    this.resizeCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Resize callback error:', error);
      }
    });
  }

  /**
   * Handle orientation change
   */
  private handleOrientationChange(): void {
    // Wait for orientation change to complete
    setTimeout(() => {
      this.deviceInfo = this.detectDevice();
      console.log('🔄 Orientation changed:', this.deviceInfo.isPortrait ? 'Portrait' : 'Landscape');
      
      // Update game size
      this.updateGameSize();
      
      // Call orientation callbacks
      this.orientationChangeCallbacks.forEach(callback => {
        try {
          callback(this.deviceInfo.isPortrait);
        } catch (error) {
          console.error('Orientation callback error:', error);
        }
      });
    }, 200);
  }

  /**
   * Handle visibility change (mobile app switching)
   */
  private handleVisibilityChange(): void {
    if (document.hidden) {
      // Game is hidden - pause or reduce performance
      this.scene.scene.pause();
    } else {
      // Game is visible - resume
      this.scene.scene.resume();
      
      // Refresh device info in case screen changed
      this.deviceInfo = this.detectDevice();
      this.updateGameSize();
    }
  }

  /**
   * Handle Phaser scale manager resize
   */
  private onPhaserResize(gameSize: any, baseSize: any, displaySize: any, resolution: any): void {
    console.log('🎮 Phaser resize:', { gameSize, baseSize, displaySize, resolution });
  }

  /**
   * Update game size based on current device
   * Requirements: 6.4 - Responsive design implementation
   */
  private updateGameSize(): void {
    const scaleManager = this.scene.scale;
    
    let targetWidth = this.config.baseWidth;
    let targetHeight = this.config.baseHeight;
    
    if (this.deviceInfo.isMobile) {
      // Mobile: Use screen dimensions with constraints
      targetWidth = Math.min(
        Math.max(this.deviceInfo.screenWidth, this.config.minWidth),
        this.config.maxWidth
      );
      targetHeight = Math.min(
        Math.max(this.deviceInfo.screenHeight, this.config.minHeight),
        this.config.maxHeight
      );
      
      // Adjust for mobile viewport
      if (this.deviceInfo.isPortrait) {
        targetWidth = Math.min(targetWidth, 480);
        targetHeight = Math.min(targetHeight, 800);
      } else {
        targetWidth = Math.min(targetWidth, 800);
        targetHeight = Math.min(targetHeight, 480);
      }
    } else if (this.deviceInfo.isTablet) {
      // Tablet: Use larger base size
      targetWidth = Math.min(this.deviceInfo.screenWidth * 0.9, this.config.maxWidth);
      targetHeight = Math.min(this.deviceInfo.screenHeight * 0.9, this.config.maxHeight);
    }
    
    // Update Phaser scale
    scaleManager.setGameSize(targetWidth, targetHeight);
  }

  /**
   * Get responsive scale factor for UI elements
   * Requirements: 6.4 - Responsive design implementation
   */
  public getUIScale(): number {
    const baseScale = 1.0;
    
    if (this.deviceInfo.isMobile) {
      // Scale UI elements larger on mobile for better touch targets
      return baseScale * 1.2;
    } else if (this.deviceInfo.isTablet) {
      return baseScale * 1.1;
    }
    
    return baseScale;
  }

  /**
   * Get responsive font size
   * Requirements: 6.4 - Responsive design implementation
   */
  public getResponsiveFontSize(baseSize: number): number {
    const scale = this.getUIScale();
    return Math.round(baseSize * scale);
  }

  /**
   * Get touch-optimized button size
   * Requirements: 6.4 - Optimize touch interactions for mobile
   */
  public getTouchButtonSize(): { width: number; height: number } {
    const baseWidth = 120;
    const baseHeight = 40;
    
    if (this.deviceInfo.isMobile) {
      // Minimum 44px touch target (iOS guidelines)
      return {
        width: Math.max(baseWidth * 1.2, 132),
        height: Math.max(baseHeight * 1.2, 44)
      };
    }
    
    return { width: baseWidth, height: baseHeight };
  }

  /**
   * Get responsive spacing
   * Requirements: 6.4 - Responsive design implementation
   */
  public getResponsiveSpacing(baseSpacing: number): number {
    const scale = this.getUIScale();
    return Math.round(baseSpacing * scale);
  }

  /**
   * Check if device supports hover interactions
   * Requirements: 6.4 - Optimize touch interactions for mobile
   */
  public supportsHover(): boolean {
    return !this.deviceInfo.touchSupported || this.deviceInfo.isDesktop;
  }

  /**
   * Get optimal interaction area size for touch
   * Requirements: 6.4 - Optimize touch interactions for mobile
   */
  public getTouchInteractionArea(baseSize: number): number {
    if (this.deviceInfo.touchSupported) {
      // Minimum 44px touch target
      return Math.max(baseSize, 44);
    }
    return baseSize;
  }

  /**
   * Register resize callback
   */
  public onResize(callback: () => void): void {
    this.resizeCallbacks.push(callback);
  }

  /**
   * Register orientation change callback
   */
  public onOrientationChange(callback: (isPortrait: boolean) => void): void {
    this.orientationChangeCallbacks.push(callback);
  }

  /**
   * Remove resize callback
   */
  public offResize(callback: () => void): void {
    const index = this.resizeCallbacks.indexOf(callback);
    if (index > -1) {
      this.resizeCallbacks.splice(index, 1);
    }
  }

  /**
   * Remove orientation change callback
   */
  public offOrientationChange(callback: (isPortrait: boolean) => void): void {
    const index = this.orientationChangeCallbacks.indexOf(callback);
    if (index > -1) {
      this.orientationChangeCallbacks.splice(index, 1);
    }
  }

  /**
   * Get current device information
   */
  public getDeviceInfo(): DeviceInfo {
    return { ...this.deviceInfo };
  }

  /**
   * Get responsive configuration
   */
  public getConfig(): ResponsiveConfig {
    return { ...this.config };
  }

  /**
   * Check if current device is mobile
   */
  public isMobile(): boolean {
    return this.deviceInfo.isMobile;
  }

  /**
   * Check if current device is tablet
   */
  public isTablet(): boolean {
    return this.deviceInfo.isTablet;
  }

  /**
   * Check if current device is desktop
   */
  public isDesktop(): boolean {
    return this.deviceInfo.isDesktop;
  }

  /**
   * Check if device is in portrait orientation
   */
  public isPortrait(): boolean {
    return this.deviceInfo.isPortrait;
  }

  /**
   * Check if device supports touch
   */
  public isTouchDevice(): boolean {
    return this.deviceInfo.touchSupported;
  }

  /**
   * Cleanup responsive manager
   */
  public destroy(): void {
    window.removeEventListener('resize', this.handleResize.bind(this));
    window.removeEventListener('orientationchange', this.handleOrientationChange.bind(this));
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    this.resizeCallbacks.length = 0;
    this.orientationChangeCallbacks.length = 0;
    
    clearTimeout((this as any).resizeTimeout);
  }
}