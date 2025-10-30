# Hide & Seek Game - Shared Components

This directory contains shared types, constants, and utilities used across both client and server components of the Hide & Seek game.

## Directory Structure

```
src/shared/
├── types/                 # TypeScript type definitions
│   ├── game.ts           # Core game data models and interfaces
│   ├── api.ts            # API request/response types
│   ├── phaser.ts         # Phaser.js specific types
│   ├── storage.ts        # Redis storage interfaces
│   ├── services.ts       # Service interfaces and contracts
│   ├── environment.ts    # Environment detection types
│   └── index.ts          # Main types export file
├── constants/            # Game constants and configuration
│   ├── game.ts          # Game mechanics and configuration constants
│   └── index.ts         # Constants export file
├── utils/               # Utility functions
│   ├── validation.ts    # Type guards and validation functions
│   └── index.ts         # Utils export file
├── config/              # Configuration management (existing)
└── README.md           # This file
```

## Key Components

### Types (`/types`)

- **game.ts**: Core game entities (PlayerRank, GameSession, GuessData, etc.)
- **api.ts**: API contracts for client-server communication
- **phaser.ts**: Phaser.js game engine specific interfaces
- **storage.ts**: Redis data models and storage operations
- **services.ts**: Service abstractions and interfaces
- **environment.ts**: Environment detection and context types

### Constants (`/constants`)

- **game.ts**: Game configuration, rank requirements, color palette, API endpoints
- Centralized configuration values used throughout the application

### Utils (`/utils`)

- **validation.ts**: Type guards, data validation, and business logic validation
- Common utility functions for position calculations, formatting, etc.

## Usage

Import types and utilities from the main index files:

```typescript
// Import types
import type { 
  PlayerRank, 
  GameSession, 
  CreatePostRequest 
} from '../shared/types';

// Import constants
import { 
  RANK_REQUIREMENTS, 
  COLOR_PALETTE, 
  API_ENDPOINTS 
} from '../shared/constants';

// Import utilities
import { 
  validateHidingSpot, 
  calculateDistance, 
  generateGameId 
} from '../shared/utils';
```

## Requirements Addressed

This structure addresses the following requirements:

- **10.5**: Data persistence and Redis integration types
- **4.1-4.3**: Player rank system definitions
- **6.1**: Color palette constants
- **7.2-7.4**: API contract definitions
- **8.1-8.5**: Game initialization and guess handling types

The shared components provide a solid foundation for type-safe development across the entire Hide & Seek game application.