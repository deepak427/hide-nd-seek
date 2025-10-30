import { Scene } from 'phaser';
import { Theme } from '../../style/theme';

export class SceneTransition {
  private static instance: SceneTransition;
  
  public static getInstance(): SceneTransition {
    if (!SceneTransition.instance) {
      SceneTransition.instance = new SceneTransition();
    }
    return SceneTransition.instance;
  }

  /**
   * Performs a smooth fade transition between scenes
   */
  public fadeToScene(
    currentScene: Scene, 
    targetScene: string, 
    data?: any,
    duration: number = 500
  ): void {
    // Create fade overlay
    const { width, height } = currentScene.scale;
    const fadeOverlay = currentScene.add.graphics();
    fadeOverlay.fillStyle(parseInt(Theme.primaryDark.replace('#', ''), 16));
    fadeOverlay.fillRect(0, 0, width, height);
    fadeOverlay.setAlpha(0);
    fadeOverlay.setDepth(1000); // Ensure it's on top

    // Fade out current scene
    currentScene.tweens.add({
      targets: fadeOverlay,
      alpha: 1,
      duration: duration,
      ease: 'Power2.easeInOut',
      onComplete: () => {
        // Start the new scene
        currentScene.scene.start(targetScene, data);
      }
    });
  }

  /**
   * Performs a slide transition between scenes
   */
  public slideToScene(
    currentScene: Scene,
    targetScene: string,
    direction: 'left' | 'right' | 'up' | 'down' = 'left',
    data?: any,
    duration: number = 600
  ): void {
    const { width, height } = currentScene.scale;
    
    // Get all scene objects
    const sceneObjects = currentScene.children.list;
    
    // Calculate slide distance
    let slideX = 0;
    let slideY = 0;
    
    switch (direction) {
      case 'left':
        slideX = -width;
        break;
      case 'right':
        slideX = width;
        break;
      case 'up':
        slideY = -height;
        break;
      case 'down':
        slideY = height;
        break;
    }

    // Animate all objects out
    currentScene.tweens.add({
      targets: sceneObjects,
      x: `+=${slideX}`,
      y: `+=${slideY}`,
      duration: duration,
      ease: 'Power2.easeInOut',
      onComplete: () => {
        currentScene.scene.start(targetScene, data);
      }
    });
  }

  /**
   * Performs a zoom transition between scenes
   */
  public zoomToScene(
    currentScene: Scene,
    targetScene: string,
    zoomOut: boolean = true,
    data?: any,
    duration: number = 500
  ): void {
    const { width, height } = currentScene.scale;
    
    // Create fade overlay for smooth transition
    const fadeOverlay = currentScene.add.graphics();
    fadeOverlay.fillStyle(parseInt(Theme.primaryDark.replace('#', ''), 16));
    fadeOverlay.fillRect(0, 0, width, height);
    fadeOverlay.setAlpha(0);
    fadeOverlay.setDepth(1000);

    // Get camera for zoom effect
    const camera = currentScene.cameras.main;
    
    const targetZoom = zoomOut ? 0.1 : 3;
    const targetAlpha = 1;

    // Animate zoom and fade simultaneously
    currentScene.tweens.add({
      targets: camera,
      zoom: targetZoom,
      duration: duration,
      ease: 'Power2.easeInOut'
    });

    currentScene.tweens.add({
      targets: fadeOverlay,
      alpha: targetAlpha,
      duration: duration * 0.8,
      delay: duration * 0.2,
      ease: 'Power2.easeInOut',
      onComplete: () => {
        currentScene.scene.start(targetScene, data);
      }
    });
  }

  /**
   * Performs a circular wipe transition
   */
  public circularWipeToScene(
    currentScene: Scene,
    targetScene: string,
    centerX?: number,
    centerY?: number,
    data?: any,
    duration: number = 800
  ): void {
    const { width, height } = currentScene.scale;
    
    // Default to center of screen
    const wipeX = centerX ?? width / 2;
    const wipeY = centerY ?? height / 2;
    
    // Calculate maximum radius needed to cover entire screen
    const maxRadius = Math.sqrt(
      Math.max(wipeX, width - wipeX) ** 2 + 
      Math.max(wipeY, height - wipeY) ** 2
    );

    // Create circular mask
    const mask = currentScene.add.graphics();
    mask.fillStyle(parseInt(Theme.primaryDark.replace('#', ''), 16));
    mask.fillCircle(wipeX, wipeY, 0);
    mask.setDepth(1000);

    // Animate the circular wipe
    currentScene.tweens.add({
      targets: mask,
      duration: duration,
      ease: 'Power2.easeInOut',
      onUpdate: (tween) => {
        const progress = tween.progress;
        const currentRadius = maxRadius * progress;
        
        mask.clear();
        mask.fillStyle(parseInt(Theme.primaryDark.replace('#', ''), 16));
        mask.fillCircle(wipeX, wipeY, currentRadius);
      },
      onComplete: () => {
        currentScene.scene.start(targetScene, data);
      }
    });
  }

  /**
   * Creates an entrance animation for a new scene
   */
  public createSceneEntrance(
    scene: Scene,
    animationType: 'fade' | 'slide' | 'zoom' | 'bounce' = 'fade',
    duration: number = 600
  ): void {
    const { width, height } = scene.scale;
    
    switch (animationType) {
      case 'fade':
        this.createFadeEntrance(scene, duration);
        break;
      case 'slide':
        this.createSlideEntrance(scene, duration);
        break;
      case 'zoom':
        this.createZoomEntrance(scene, duration);
        break;
      case 'bounce':
        this.createBounceEntrance(scene, duration);
        break;
    }
  }

  private createFadeEntrance(scene: Scene, duration: number): void {
    const { width, height } = scene.scale;
    
    // Create fade overlay
    const fadeOverlay = scene.add.graphics();
    fadeOverlay.fillStyle(parseInt(Theme.primaryDark.replace('#', ''), 16));
    fadeOverlay.fillRect(0, 0, width, height);
    fadeOverlay.setDepth(1000);

    // Fade in the scene
    scene.tweens.add({
      targets: fadeOverlay,
      alpha: 0,
      duration: duration,
      ease: 'Power2.easeOut',
      onComplete: () => {
        fadeOverlay.destroy();
      }
    });
  }

  private createSlideEntrance(scene: Scene, duration: number): void {
    const sceneObjects = scene.children.list.filter(obj => 
      (obj as any).depth !== undefined && (obj as any).depth < 1000
    );
    const { width } = scene.scale;

    // Start objects off-screen to the right
    sceneObjects.forEach(obj => {
      const gameObj = obj as any;
      if (gameObj.x !== undefined) {
        gameObj.x += width;
      }
    });

    // Slide objects in
    scene.tweens.add({
      targets: sceneObjects,
      x: `-=${width}`,
      duration: duration,
      ease: 'Power2.easeOut'
    });
  }

  private createZoomEntrance(scene: Scene, duration: number): void {
    const camera = scene.cameras.main;
    camera.setZoom(0.1);

    scene.tweens.add({
      targets: camera,
      zoom: 1,
      duration: duration,
      ease: 'Back.easeOut'
    });
  }

  private createBounceEntrance(scene: Scene, duration: number): void {
    const sceneObjects = scene.children.list.filter(obj => 
      (obj as any).depth !== undefined && (obj as any).depth < 1000
    );

    sceneObjects.forEach((obj, index) => {
      const gameObj = obj as any;
      if (gameObj.setScale) {
        gameObj.setScale(0);
        
        scene.tweens.add({
          targets: obj,
          scaleX: 1,
          scaleY: 1,
          duration: duration,
          delay: index * 50,
          ease: 'Back.easeOut'
        });
      }
    });
  }
}