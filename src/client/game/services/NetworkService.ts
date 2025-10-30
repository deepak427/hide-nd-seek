import { ErrorHandler, NetworkErrorConfig } from './ErrorHandler';
import { Scene } from 'phaser';

export interface NetworkConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  showErrors?: boolean;
  errorHandler?: ErrorHandler;
}

export interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  showLoading?: boolean;
  loadingMessage?: string;
}

export class NetworkService {
  private errorHandler?: ErrorHandler;
  private defaultConfig: NetworkConfig;
  private abortControllers: Map<string, AbortController> = new Map();

  constructor(scene?: Scene, config: NetworkConfig = {}) {
    this.defaultConfig = {
      timeout: 10000, // 10 seconds
      retries: 3,
      retryDelay: 1000,
      showErrors: true,
      ...config
    };

    if (scene && this.defaultConfig.showErrors) {
      this.errorHandler = new ErrorHandler(scene);
    }
  }

  /**
   * Make a network request with automatic error handling and retries
   */
  async request<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const {
      timeout = this.defaultConfig.timeout,
      retries = this.defaultConfig.retries,
      showLoading = false,
      loadingMessage = 'Loading...',
      ...fetchOptions
    } = options;

    const requestId = `${Date.now()}-${Math.random()}`;
    
    // Show loading if requested
    if (showLoading && this.errorHandler) {
      this.errorHandler.showLoading(loadingMessage);
    }

    try {
      const result = await this.executeRequestWithRetry<T>(
        url,
        fetchOptions,
        timeout!,
        retries!,
        requestId
      );

      // Hide loading on success
      if (showLoading && this.errorHandler) {
        this.errorHandler.hideCurrentError();
      }

      // Reset retry attempts on success
      if (this.errorHandler) {
        this.errorHandler.resetRetryAttempts(url);
      }

      return result;
    } catch (error) {
      // Hide loading on error
      if (showLoading && this.errorHandler) {
        this.errorHandler.hideCurrentError();
      }

      // Show error if error handler is available
      if (this.errorHandler && this.defaultConfig.showErrors) {
        this.handleNetworkError(url, error, retries!);
      }

      throw error;
    } finally {
      // Clean up abort controller
      this.abortControllers.delete(requestId);
    }
  }

  /**
   * GET request with error handling
   */
  async get<T>(url: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'GET'
    });
  }

  /**
   * POST request with error handling
   */
  async post<T>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: data ? JSON.stringify(data) : null
    });
  }

  /**
   * PUT request with error handling
   */
  async put<T>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: data ? JSON.stringify(data) : null
    });
  }

  /**
   * DELETE request with error handling
   */
  async delete<T>(url: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'DELETE'
    });
  }

  /**
   * Check network connectivity
   */
  async checkConnectivity(): Promise<boolean> {
    try {
      // Try to fetch a small resource or ping endpoint
      const response = await fetch('/api/ping', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Monitor network status and show indicators
   */
  startNetworkMonitoring(): void {
    if (!this.errorHandler) return;

    // Initial check
    this.checkConnectivity().then(isOnline => {
      this.errorHandler!.showConnectionStatus(isOnline);
    });

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.errorHandler!.showConnectionStatus(true);
    });

    window.addEventListener('offline', () => {
      this.errorHandler!.showConnectionStatus(false);
    });

    // Periodic connectivity check
    setInterval(async () => {
      const isOnline = await this.checkConnectivity();
      if (!isOnline) {
        this.errorHandler!.showConnectionStatus(false);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Cancel all pending requests
   */
  cancelAllRequests(): void {
    this.abortControllers.forEach(controller => {
      controller.abort();
    });
    this.abortControllers.clear();
  }

  /**
   * Execute request with retry logic
   */
  private async executeRequestWithRetry<T>(
    url: string,
    options: RequestInit,
    timeout: number,
    maxRetries: number,
    requestId: string
  ): Promise<T> {
    let lastError: Error = new Error('No attempts made');

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Create abort controller for this attempt
        const abortController = new AbortController();
        this.abortControllers.set(requestId, abortController);

        // Set up timeout
        const timeoutId = setTimeout(() => {
          abortController.abort();
        }, timeout);

        // Make the request
        const response = await fetch(url, {
          ...options,
          signal: abortController.signal
        });

        clearTimeout(timeoutId);

        // Check if response is ok
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Parse response
        const contentType = response.headers.get('content-type');
        let result: T;

        if (contentType && contentType.includes('application/json')) {
          result = await response.json();
        } else {
          result = await response.text() as unknown as T;
        }

        return result;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        // Don't retry on certain errors
        if (this.shouldNotRetry(lastError)) {
          break;
        }

        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retrying with exponential backoff
        const delay = this.defaultConfig.retryDelay! * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));

        console.log(`Request to ${url} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);
      }
    }

    throw lastError;
  }

  /**
   * Determine if an error should not be retried
   */
  private shouldNotRetry(error: Error): boolean {
    const message = error.message.toLowerCase();
    
    // Don't retry on client errors (4xx) except for specific cases
    if (message.includes('http 4')) {
      // Retry on 408 (timeout), 429 (rate limit)
      return !message.includes('408') && !message.includes('429');
    }

    // Don't retry on abort errors
    if (message.includes('abort')) {
      return true;
    }

    // Retry on network errors and server errors (5xx)
    return false;
  }

  /**
   * Handle network errors with user-friendly messages
   */
  private handleNetworkError(url: string, error: any, maxRetries: number): void {
    if (!this.errorHandler) return;

    let statusCode: number | undefined;
    let message = 'Network request failed';

    if (error instanceof Error) {
      message = error.message;
      
      // Extract status code from error message
      const statusMatch = message.match(/HTTP (\d+):/);
      if (statusMatch) {
        statusCode = parseInt(statusMatch[1]);
      }

      // Handle specific error types
      if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
        message = 'Unable to connect to server. Please check your internet connection.';
      } else if (message.includes('timeout') || message.includes('abort')) {
        message = 'Request timed out. Please try again.';
      }
    }

    const config: NetworkErrorConfig = {
      title: 'Network Error',
      message,
      endpoint: url,
      maxRetries,
      retryCallback: () => {
        // This would need to be implemented by the calling code
        console.log('Retry requested for:', url || 'unknown');
      }
    };

    if (statusCode !== undefined) {
      config.statusCode = statusCode;
    }

    this.errorHandler.showNetworkError(config);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.cancelAllRequests();
    this.errorHandler?.destroy();
  }
}

// Singleton instance for global use
let globalNetworkService: NetworkService | null = null;

export function getNetworkService(scene?: Scene): NetworkService {
  if (!globalNetworkService && scene) {
    globalNetworkService = new NetworkService(scene);
  }
  return globalNetworkService || new NetworkService();
}

export function destroyNetworkService(): void {
  if (globalNetworkService) {
    globalNetworkService.destroy();
    globalNetworkService = null;
  }
}