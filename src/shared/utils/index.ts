/**
 * Utility functions export file
 * Centralized access to all utility functions
 */

export * from './validation';

// Common utility functions
export const generateGameId = (): string => {
  return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const calculateDistance = (
  x1: number, 
  y1: number, 
  x2: number, 
  y2: number
): number => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

export const normalizePosition = (
  x: number, 
  y: number, 
  width: number, 
  height: number
): { relX: number; relY: number } => {
  return {
    relX: Math.max(0, Math.min(1, x / width)),
    relY: Math.max(0, Math.min(1, y / height))
  };
};

export const denormalizePosition = (
  relX: number, 
  relY: number, 
  width: number, 
  height: number
): { x: number; y: number } => {
  return {
    x: relX * width,
    y: relY * height
  };
};

export const formatSuccessRate = (rate: number): string => {
  return `${Math.round(rate * 100)}%`;
};

export const formatDistance = (distance: number): string => {
  if (distance < 0.01) return 'Perfect!';
  if (distance < 0.05) return 'Very close';
  if (distance < 0.1) return 'Close';
  if (distance < 0.2) return 'Nearby';
  return 'Far away';
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};