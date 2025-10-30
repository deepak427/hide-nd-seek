# Data Storage and Management Implementation

This document describes the comprehensive data storage and management system implemented for the Reddit Devvit Hide & Seek game.

## Overview

The implementation provides a robust Redis-based storage system with automatic data expiration, cleanup mechanisms, and comprehensive error handling. The system follows the requirements specified in the design document and ensures data integrity and performance.

## Components

### 1. RedisSchemaManager (`RedisSchemaManager.ts`)

**Purpose**: Centralized Redis schema management with validation and data integrity checks.

**Key Features**:
- Standardized Redis key patterns following the design specification
- Comprehensive data validation for all stored objects
- Automatic 30-day expiration for all keys
- Type-safe serialization/deserialization
- Input validation and sanitization

**Redis Key Patterns**:
- `game_session:{gameId}` → GameSession JSON
- `post_mapping:{postId}` → gameId string  
- `game:{gameId}:guess:{userId}:{timestamp}` → GuessData JSON
- `game:{gameId}:stats` → GuessStatistics JSON

**Validation Features**:
- UUID v4 validation for game IDs
- Coordinate range validation (0-1)
- Object key pattern validation (alphanumeric, underscore, hyphen)
- Username length limits
- Data structure integrity checks

### 2. DataExpirationManager (`DataExpirationManager.ts`)

**Purpose**: Handles data expiration, cleanup mechanisms, and storage monitoring.

**Key Features**:
- 30-day automatic expiration for all game data
- Manual cleanup of expired data
- Storage usage monitoring
- Performance metrics tracking
- Health check functionality

**Cleanup Operations**:
- Batch processing to avoid overwhelming Redis
- Pattern-based key scanning
- Configurable cleanup intervals
- Error handling and retry logic

**Monitoring Capabilities**:
- Storage statistics collection
- Performance metrics tracking
- Health status reporting
- Expiration compliance checking

### 3. ScheduledCleanupService (`ScheduledCleanupService.ts`)

**Purpose**: Automated cleanup scheduling and background maintenance.

**Key Features**:
- Configurable cleanup intervals (default: 24 hours)
- Background cleanup execution
- Error handling and retry logic
- Cleanup history tracking
- Service status monitoring

**Configuration Options**:
- Cleanup interval (hours)
- Maximum history entries
- Retry attempts
- Retry delay

**Statistics Tracking**:
- Total cleanup runs
- Success/failure rates
- Keys deleted counts
- Average execution duration
- Last run timestamps

### 4. StorageInitializer (`StorageInitializer.ts`)

**Purpose**: System initialization and lifecycle management.

**Key Features**:
- Storage system initialization
- Health check execution
- Cleanup service management
- Graceful shutdown handling
- Administrative endpoints

**Initialization Process**:
1. Perform initial health check
2. Start scheduled cleanup service
3. Configure monitoring
4. Set up administrative endpoints

## Integration

### Updated Existing Components

**GameSessionManager**: Now uses RedisSchemaManager for validation and storage
**GuessStorageManager**: Integrated with new schema and expiration management
**storage.ts**: Updated to use DataExpirationManager for consistent expiration

### Server Integration

**Server Startup**:
- Automatic storage system initialization
- Health check execution
- Cleanup service startup

**Administrative Endpoints**:
- `/api/admin/storage/status` - System status
- `/api/admin/storage/stats` - Storage statistics  
- `/api/admin/storage/performance` - Performance metrics
- `/api/admin/storage/cleanup` - Force cleanup execution

**Graceful Shutdown**:
- SIGTERM/SIGINT handling
- Cleanup service shutdown
- Resource cleanup

## Data Expiration Strategy

### Automatic Expiration
- All keys automatically expire after 30 days
- Expiration set on every write operation
- Consistent expiration across all data types

### Manual Cleanup
- Scheduled daily cleanup (configurable)
- Pattern-based key scanning
- Batch processing for performance
- Error handling and retry logic

### Monitoring
- Expiration compliance checking
- Storage usage tracking
- Performance metrics collection
- Health status reporting

## Error Handling

### Validation Errors
- Input sanitization and validation
- Type checking and format validation
- Boundary checking for coordinates
- Pattern validation for keys

### Storage Errors
- Redis connection failure handling
- Data corruption detection
- Automatic retry mechanisms
- Graceful degradation

### Cleanup Errors
- Retry logic with exponential backoff
- Error logging and tracking
- Partial failure handling
- Service health monitoring

## Performance Considerations

### Efficient Operations
- Batch processing for cleanup
- Minimal Redis operations
- Connection reuse
- Optimized key patterns

### Monitoring
- Response time tracking
- Operation counting
- Memory usage monitoring
- Error rate tracking

### Scalability
- Configurable batch sizes
- Adjustable cleanup intervals
- Resource usage monitoring
- Performance metrics collection

## Security Features

### Input Validation
- Coordinate boundary checking
- Object key pattern validation
- User ID validation
- Data sanitization

### Access Control
- Creator verification for dashboards
- Rate limiting for guesses
- Authentication checks
- Administrative endpoint protection

### Data Privacy
- Automatic data expiration
- Secure data deletion
- User data anonymization options
- GDPR compliance considerations

## Usage Examples

### Basic Storage Operations
```typescript
// Store a game session
await RedisSchemaManager.storeGameSession(session);

// Retrieve a game session
const session = await RedisSchemaManager.getGameSession(gameId);

// Store a guess
await RedisSchemaManager.storeGuess(guessData);
```

### Cleanup Operations
```typescript
// Force immediate cleanup
await DataExpirationManager.cleanupExpiredData();

// Get storage statistics
const stats = await DataExpirationManager.getStorageStats();

// Perform health check
const health = await DataExpirationManager.healthCheck();
```

### Service Management
```typescript
// Start cleanup service
const cleanupService = ScheduledCleanupService.getInstance();
cleanupService.start(24); // 24-hour interval

// Get service status
const status = cleanupService.getStatus();

// Force cleanup
await cleanupService.forceCleanup();
```

## Configuration

### Environment Variables
- `CLEANUP_INTERVAL_HOURS`: Cleanup interval (default: 24)
- `MAX_HISTORY_ENTRIES`: Maximum cleanup history entries (default: 100)
- `RETRY_ATTEMPTS`: Cleanup retry attempts (default: 3)

### Runtime Configuration
```typescript
// Configure cleanup service
cleanupService.configure({
  intervalHours: 12,
  maxHistoryEntries: 50,
  retryAttempts: 5,
  retryDelayMs: 30000
});
```

## Monitoring and Maintenance

### Health Checks
- Connectivity testing
- Response time monitoring
- Expiration compliance checking
- Storage usage tracking

### Administrative Tasks
- Manual cleanup execution
- Configuration updates
- Performance monitoring
- Error investigation

### Alerts and Notifications
- High error rates
- Storage usage warnings
- Performance degradation
- Service failures

## Future Enhancements

### Planned Features
- Advanced key scanning with SCAN command
- Memory usage optimization
- Performance analytics dashboard
- Automated scaling recommendations

### Monitoring Improvements
- Real-time metrics collection
- Advanced alerting system
- Performance trend analysis
- Capacity planning tools

## Requirements Compliance

This implementation satisfies all requirements from the specification:

**Requirement 7.1**: ✅ Redis key structures implemented as specified
**Requirement 7.2**: ✅ Guess data structure and storage implemented  
**Requirement 7.3**: ✅ Game session key format implemented
**Requirement 7.4**: ✅ Guess collection keys implemented
**Requirement 7.5**: ✅ 30-day expiration implemented for all data
**Requirement 6.6**: ✅ Storage monitoring and performance tracking implemented

The system provides a robust, scalable, and maintainable data storage solution that meets all specified requirements while providing additional features for monitoring, maintenance, and operational excellence.