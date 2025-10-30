# Hide & Seek Game Design Document

## Overview

Hide & Seek is a Reddit-integrated game built with Devvit and Phaser.js that recreates the classic hide-and-seek experience in a digital format. The game features two distinct modes: a full standalone game for creating challenges and an embedded Reddit version for playing and guessing. Players progress through ranks based on their success rate and participate in monthly rotating maps.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Reddit Post   │    │  Full Game App  │    │   Devvit API    │
│  (Embedded)     │◄──►│  (Standalone)   │◄──►│   & Redis       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

- **Frontend**: Phaser.js 3.x for game rendering and interactions
- **Backend**: Express.js server with Devvit integration
- **Database**: Redis for game state and player data
- **Platform**: Reddit Devvit for hosting and authentication
- **Build**: Vite for client/server bundling

### Game Flow Architecture

```
Full Game Flow:
Splash → Main Menu → Map Select → Game Scene → Object Selection → Post Creation

Embedded Game Flow:
Direct to Game Scene → Guess Mode OR Creator Dashboard
```

## Components and Interfaces

### Frontend Components

#### 1. Game Scenes (Phaser.js)

**SplashScene**
- Creative loading animation using provided sprite sheet
- Color palette implementation: #222831, #393E46, #00ADB5, #EEEEEE
- Smooth transition to MainMenu

**MainMenuScene**
- Player rank display and statistics
- Navigation to map selection
- Settings and profile management

**MapSelectScene**
- Monthly map display with preview
- Map metadata (difficulty, theme, release date)
- Selection confirmation

**GameScene**
- Interactive map rendering
- Object placement and selection
- Dual mode support (creation vs guessing)

**UIComponents**
- RankProgressBar: Visual rank progression indicator
- GuessesPanel: Dashboard for creators to view guesses
- SuccessPopup: Feedback for successful actions
- PostCreationDialog: Interface for creating Reddit posts

#### 2. Game Modes

**FullGameMode**
- Complete game flow from splash to post creation
- "Post Game" button integration
- Local state management

**EmbeddedGameMode**
- Direct game scene loading
- Context-aware UI (creator vs guesser)
- Reddit integration for user identification

### Backend Components

#### 1. API Endpoints

**POST /api/create-post**
```typescript
interface CreatePostRequest {
  mapKey: string;
  objectKey: string;
  relX: number;
  relY: number;
}

interface CreatePostResponse {
  postUrl: string;
  gameId: string;
}
```

**GET /api/init**
```typescript
interface InitResponse {
  gameId: string;
  mapKey: string;
  isCreator: boolean;
  hidingSpot?: {
    objectKey: string;
    relX: number;
    relY: number;
  };
}
```

**POST /api/guess**
```typescript
interface GuessRequest {
  gameId: string;
  objectKey: string;
  relX: number;
  relY: number;
}

interface GuessResponse {
  success: boolean;
  distance: number;
  message: string;
}
```

**GET /api/guesses**
```typescript
interface GuessesResponse {
  guesses: Array<{
    userId: string;
    username: string;
    objectKey: string;
    relX: number;
    relY: number;
    timestamp: number;
    success: boolean;
    distance: number;
  }>;
}
```

#### 2. Data Services

**GameService**
- Game creation and management
- Guess validation and scoring
- Rank calculation and progression

**RedditService**
- Post creation via Devvit API
- User authentication and context
- Subreddit management

**MapService**
- Monthly map rotation
- Map data management
- Asset loading and caching

## Data Models

### Redis Data Structure

```typescript
// Game instances
game:<gameId> = {
  creator: string;
  mapKey: string;
  hidingSpot: {
    objectKey: string;
    relX: number;
    relY: number;
  };
  createdAt: number;
  postId: string;
}

// Player profiles
player:<userId> = {
  username: string;
  rank: 'Tyapu' | 'GuessMaster' | 'Detective' | 'FBI';
  totalGuesses: number;
  successfulGuesses: number;
  successRate: number;
  joinedAt: number;
}

// Game guesses
game:<gameId>:guesses = [
  {
    userId: string;
    username: string;
    objectKey: string;
    relX: number;
    relY: number;
    timestamp: number;
    success: boolean;
    distance: number;
  }
]

// Monthly maps
map:<mapKey> = {
  name: string;
  theme: string;
  releaseDate: number;
  objects: Array<{
    key: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  backgroundAsset: string;
}

// Post to game mapping
post:<postId> = {
  gameId: string;
}
```

### Phaser Game Objects

```typescript
interface MapObject {
  key: string;
  name: string;
  sprite: Phaser.GameObjects.Sprite;
  bounds: Phaser.Geom.Rectangle;
  interactive: boolean;
}

interface GameState {
  mode: 'creation' | 'guessing' | 'dashboard';
  currentMap: string;
  selectedObject?: string;
  selectedPosition?: { x: number; y: number };
  isCreator: boolean;
  gameId?: string;
}
```

## Error Handling

### Client-Side Error Handling

**Network Errors**
- Retry mechanism for API calls
- Offline state detection
- User-friendly error messages

**Game State Errors**
- Invalid object selection validation
- Map loading failure recovery
- Session timeout handling

**UI Error States**
- Loading state indicators
- Error boundary components
- Graceful degradation for missing assets

### Server-Side Error Handling

**API Error Responses**
```typescript
interface ErrorResponse {
  error: string;
  message: string;
  code: number;
}
```

**Common Error Scenarios**
- Invalid game ID (404)
- Unauthorized access (403)
- Redis connection failures (500)
- Reddit API errors (502)
- Validation errors (400)

**Error Recovery**
- Automatic retry for transient failures
- Circuit breaker pattern for external APIs
- Graceful degradation for non-critical features

## Testing Strategy

### Unit Testing

**Frontend Tests**
- Phaser scene initialization and transitions
- UI component rendering and interactions
- Game state management
- API client functionality

**Backend Tests**
- API endpoint functionality
- Data validation and sanitization
- Redis operations
- Game logic and scoring

### Integration Testing

**API Integration**
- End-to-end API workflows
- Reddit Devvit integration
- Redis data persistence
- Error handling scenarios

**Game Flow Testing**
- Complete game creation workflow
- Embedded game initialization
- Guess submission and validation
- Rank progression logic

### Visual Testing

**UI/UX Testing**
- Color palette consistency
- Responsive design validation
- Animation smoothness
- Loading state appearances

**Game Testing**
- Map rendering accuracy
- Object interaction responsiveness
- Visual feedback clarity
- Cross-device compatibility

### Performance Testing

**Load Testing**
- Concurrent game sessions
- Redis performance under load
- API response times
- Asset loading optimization

**Memory Testing**
- Phaser memory management
- Asset cleanup and disposal
- Long-running session stability
- Mobile device performance

## Visual Design System

### Color Palette Implementation

```css
:root {
  --primary-dark: #222831;    /* Main backgrounds, headers */
  --secondary-dark: #393E46;  /* Secondary backgrounds, panels */
  --accent-cyan: #00ADB5;     /* Interactive elements, highlights */
  --light-gray: #EEEEEE;      /* Text, borders, icons */
}
```

### UI Component Styling

**Buttons**
- Primary: Cyan background (#00ADB5) with light text
- Secondary: Dark gray background (#393E46) with light text
- Hover states with subtle color transitions

**Panels and Modals**
- Dark backgrounds (#222831) with cyan accents
- Light gray text (#EEEEEE) for readability
- Subtle shadows and borders for depth

**Game Elements**
- Map objects with cyan highlights when interactive
- Progress bars using gradient from dark to cyan
- Status indicators with color-coded feedback

### Animation and Transitions

**Loading Animation**
- Sprite sheet-based animation for splash screen
- Smooth fade transitions between scenes
- Particle effects for successful actions

**Interactive Feedback**
- Hover animations for clickable objects
- Success/failure popup animations
- Rank progression celebration effects