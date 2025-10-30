import { Request, Response, NextFunction } from 'express';

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: any;
  timestamp: string;
  requestId?: string;
}

export interface LogContext {
  requestId?: string;
  userId?: string;
  endpoint?: string;
  method?: string;
  userAgent?: string | undefined;
  ip?: string | undefined;
}

export class ErrorHandlingService {
  private static requestIdCounter = 0;

  /**
   * Generate a unique request ID for tracking
   */
  static generateRequestId(): string {
    return `req_${Date.now()}_${++this.requestIdCounter}`;
  }

  /**
   * Express middleware to add request ID and logging context
   */
  static requestLogger(req: Request, res: Response, next: NextFunction): void {
    const requestId = ErrorHandlingService.generateRequestId();
    
    // Add request ID to request object
    (req as any).requestId = requestId;
    
    // Log incoming request
    const logContext: LogContext = {
      requestId,
      endpoint: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress
    };
    
    console.log(`📥 [${requestId}] ${req.method} ${req.path}`, logContext);
    
    // Log response when finished
    const originalSend = res.send;
    res.send = function(body) {
      console.log(`📤 [${requestId}] ${res.statusCode} ${req.method} ${req.path}`);
      return originalSend.call(this, body);
    };
    
    next();
  }

  /**
   * Express error handling middleware
   */
  static errorHandler(error: any, req: Request, res: Response, _next: NextFunction): void {
    const requestId = (req as any).requestId || 'unknown';
    
    // Log the error with context
    ErrorHandlingService.logError(error, {
      requestId,
      endpoint: req.path,
      method: req.method,
      userId: (req as any).userId,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    // Determine error type and response
    const errorResponse = ErrorHandlingService.createErrorResponse(error, requestId);
    
    // Send appropriate HTTP status code
    const statusCode = ErrorHandlingService.getStatusCode(error);
    res.status(statusCode).json(errorResponse);
  }

  /**
   * Async wrapper for route handlers to catch errors
   */
  static asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Validate request parameters and throw appropriate errors
   */
  static validateRequired(params: Record<string, any>, requiredFields: string[]): void {
    const missing = requiredFields.filter(field => 
      params[field] === undefined || params[field] === null || params[field] === ''
    );
    
    if (missing.length > 0) {
      throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
    }
  }

  /**
   * Validate coordinate values
   */
  static validateCoordinates(relX: number, relY: number): void {
    if (typeof relX !== 'number' || typeof relY !== 'number') {
      throw new ValidationError('Coordinates must be numbers');
    }
    
    if (relX < 0 || relX > 1 || relY < 0 || relY > 1) {
      throw new ValidationError('Coordinates must be between 0 and 1');
    }
    
    if (isNaN(relX) || isNaN(relY)) {
      throw new ValidationError('Coordinates cannot be NaN');
    }
  }

  /**
   * Validate string format (alphanumeric with dashes/underscores)
   */
  static validateStringFormat(value: string, fieldName: string): void {
    if (typeof value !== 'string') {
      throw new ValidationError(`${fieldName} must be a string`);
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      throw new ValidationError(`${fieldName} contains invalid characters`);
    }
  }

  /**
   * Handle database connection errors
   */
  static handleDatabaseError(error: any, operation: string): never {
    console.error(`Database error during ${operation}:`, error);
    
    if (error.message?.includes('connection')) {
      throw new DatabaseError('Database connection failed', 'DB_CONNECTION_ERROR');
    }
    
    if (error.message?.includes('timeout')) {
      throw new DatabaseError('Database operation timed out', 'DB_TIMEOUT');
    }
    
    throw new DatabaseError(`Database operation failed: ${operation}`, 'DB_OPERATION_ERROR');
  }

  /**
   * Handle Reddit API errors with retry logic
   */
  static handleRedditError(error: any, operation: string): never {
    console.error(`Reddit API error during ${operation}:`, error);
    
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('rate limit')) {
      throw new ExternalServiceError('Reddit API rate limit exceeded', 'REDDIT_RATE_LIMIT', 429);
    }
    
    if (message.includes('unauthorized') || message.includes('permission')) {
      throw new ExternalServiceError('Reddit API authentication failed', 'REDDIT_AUTH_ERROR', 401);
    }
    
    if (message.includes('network') || message.includes('timeout')) {
      throw new ExternalServiceError('Reddit API network error', 'REDDIT_NETWORK_ERROR', 503);
    }
    
    throw new ExternalServiceError(`Reddit API error: ${operation}`, 'REDDIT_API_ERROR', 500);
  }

  /**
   * Log errors with structured format
   */
  private static logError(error: any, context: LogContext): void {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      error: {
        name: error.name || 'Error',
        message: error.message || 'Unknown error',
        stack: error.stack,
        code: error.code
      },
      context
    };
    
    console.error(`🚨 [${context.requestId}] Error:`, errorInfo);
    
    // In production, you might want to send this to an external logging service
    // like Sentry, LogRocket, or CloudWatch
  }

  /**
   * Create standardized error response
   */
  private static createErrorResponse(error: any, requestId: string): ErrorResponse {
    const timestamp = new Date().toISOString();
    
    // Don't expose internal error details in production
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (error instanceof ValidationError) {
      return {
        error: error.message,
        code: 'VALIDATION_ERROR',
        timestamp,
        requestId
      };
    }
    
    if (error instanceof DatabaseError) {
      return {
        error: isProduction ? 'Database error occurred' : error.message,
        code: error.code,
        timestamp,
        requestId
      };
    }
    
    if (error instanceof ExternalServiceError) {
      return {
        error: error.message,
        code: error.code,
        timestamp,
        requestId
      };
    }
    
    if (error instanceof AuthenticationError) {
      return {
        error: error.message,
        code: 'AUTH_ERROR',
        timestamp,
        requestId
      };
    }
    
    // Generic error
    return {
      error: isProduction ? 'Internal server error' : error.message || 'Unknown error',
      code: 'INTERNAL_ERROR',
      timestamp,
      requestId
    };
  }

  /**
   * Determine HTTP status code from error type
   */
  private static getStatusCode(error: any): number {
    if (error instanceof ValidationError) {
      return 400;
    }
    
    if (error instanceof AuthenticationError) {
      return 401;
    }
    
    if (error instanceof AuthorizationError) {
      return 403;
    }
    
    if (error instanceof NotFoundError) {
      return 404;
    }
    
    if (error instanceof RateLimitError) {
      return 429;
    }
    
    if (error instanceof ExternalServiceError) {
      return error.statusCode || 503;
    }
    
    if (error instanceof DatabaseError) {
      return 503;
    }
    
    return 500;
  }
}

// Custom error classes
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends Error {
  constructor(message: string, public code: string, public statusCode: number = 503) {
    super(message);
    this.name = 'ExternalServiceError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

// Utility functions for common validations
export const Validators = {
  gameId: (gameId: string) => {
    if (!gameId || typeof gameId !== 'string') {
      throw new ValidationError('Game ID is required');
    }
    
    // UUID v4 format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(gameId)) {
      throw new ValidationError('Invalid game ID format');
    }
  },
  
  objectKey: (objectKey: string) => {
    ErrorHandlingService.validateStringFormat(objectKey, 'Object key');
    
    const validObjects = ['pumpkin', 'wardrobe', 'bush', 'car', 'truck', 'guard'];
    if (!validObjects.includes(objectKey)) {
      throw new ValidationError(`Invalid object key. Must be one of: ${validObjects.join(', ')}`);
    }
  },
  
  mapKey: (mapKey: string) => {
    ErrorHandlingService.validateStringFormat(mapKey, 'Map key');
    
    const validMaps = ['cozy-bedroom', 'modern-kitchen', 'enchanted-forest', 'octmap'];
    if (!validMaps.includes(mapKey)) {
      throw new ValidationError(`Invalid map key. Must be one of: ${validMaps.join(', ')}`);
    }
  },
  
  coordinates: (relX: number, relY: number) => {
    ErrorHandlingService.validateCoordinates(relX, relY);
  },
  
  userId: (userId: string) => {
    if (!userId || typeof userId !== 'string') {
      throw new AuthenticationError('User ID is required');
    }
  }
};