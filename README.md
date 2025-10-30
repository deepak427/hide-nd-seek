# Hide & Seek - Interactive Object Finding Game

A sophisticated hide-and-seek puzzle game built with Phaser.js for Reddit's Devvit platform. Challenge your observation skills by finding hidden objects in beautifully crafted virtual scenes, or create your own challenges for the community to solve!

## 🎮 What is Hide & Seek?

Hide & Seek is an innovative social puzzle game that transforms the classic childhood game into an engaging digital experience. Players create hiding challenges by directly clicking on objects in virtual environments to hide behind them, then share these challenges as interactive Reddit posts. Other players discover hidden objects by clicking throughout the scene, receiving real-time feedback and earning rank progression based on their detective skills.

**Core Innovation**: This game features a streamlined "click-to-hide" mechanic where players simply click directly on any object in the scene to hide behind it. The game uses precise position tracking with normalized coordinates (0.000-1.000) to ensure pixel-perfect placement across all devices. When others play your challenge, they must find the hidden object by clicking on interactive objects scattered throughout the scene.

## 🌟 What Makes This Game Unique?

### 🎯 Revolutionary "Click-to-Hide" Gameplay
This isn't just another hidden object game. The intuitive one-click system creates engaging strategic gameplay:

1. **Direct Object Interaction**: Simply click on any object in the scene to hide behind it - no separate selection step needed
2. **Strategic Positioning**: Choose from interactive objects including pumpkin, wardrobe, bush, car, truck, and guard, each offering different hiding opportunities
3. **Immediate Visual Feedback**: Real-time cyan glow effects (#00ADB5), scale animations, and position tracking show exactly where you're hiding

### 🎮 Intelligent Multi-Mode Architecture
The game seamlessly operates in three distinct modes:
- **Creation Mode**: Hide behind objects with direct click interaction and position tracking
- **Guessing Mode**: Find hidden objects with intelligent feedback and proximity hints  
- **Dashboard Mode**: View comprehensive analytics of all attempts on your challenges

### 🏆 Advanced Progression & Social Features
- **Rank Progression**: Advance from Tyapu → GuessMaster → Detective → FBI based on success rate and discoveries
- **Reddit Integration**: Automatically creates Reddit posts with embedded game instances for community play
- **Creator Dashboard**: View comprehensive analytics of all guesses made on your challenges with real-time updates

## 🎮 Current Game Status

**✅ FULLY FUNCTIONAL** - This is a complete, playable hide-and-seek game with Reddit integration featuring:

- **Complete Scene Flow**: Animated splash screen with progress tracking → Main menu with rank display → Map selection → Interactive game scene
- **Dual-Mode Architecture**: Standalone creation mode and embedded Reddit gameplay mode with automatic environment detection
- **Advanced Position Tracking**: Pixel-perfect object placement using PositionTracker class with normalized coordinates (relX/relY 0.000-1.000)
- **Intelligent Asset Management**: Smart fallback system that creates colored placeholder textures for missing assets when textures are unavailable
- **Performance Optimization**: 4-tier quality system (Potato/Low/Medium/High) with PerformanceManager and AssetOptimizer classes
- **Reddit Integration**: PostGameManager with dialog system for sharing challenges (ready for Devvit deployment)
- **Progressive Ranking System**: Four detective ranks from Tyapu → GuessMaster → Detective → FBI with RankDisplay component
- **Mobile Optimization**: Touch-optimized interface with responsive scaling, battery-conscious design, and viewport height handling
- **Three Game Modes**: Creation mode (hide objects), Guessing mode (find objects with GuessMode component), and Dashboard mode (view analytics with GuessDashboard component)

### 🎯 Game Modes

**🎮 Creation Mode (Hide Objects)**
- Complete game flow: Animated Splash Screen → Main Menu with Rank Display → Map Selection → Interactive Game Scene
- Rich UI featuring player statistics, rank progression tracking, and achievement celebrations via RankDisplay and PlayerStatsPanel components
- Direct object interaction: Click any object in the scene to hide behind it (no separate selector needed)
- MapLayer component handles 6 interactive objects with hover effects (cyan glow, scale animations)
- Real-time position tracking with coordinate display and validation feedback
- PostGameManager integration for Reddit challenge creation
- Precise position tracking using normalized coordinates (relX/relY from 0.000 to 1.000) for device-independent gameplay
- "Post Game" dialog system for creating Reddit challenges with embedded game instances
- Real-time coordinate display and position validation with comprehensive error handling

**🔍 Guessing Mode (Find Hidden Objects)**
- GuessMode component generates 12 interactive objects scattered throughout the scene at randomized positions
- Distance-based feedback system with Euclidean geometry calculations in normalized coordinate space
- Success celebrations with confetti particle effects, screen shake, and rank progression notifications
- Real-time guess validation with NetworkService integration and automatic retry functionality
- Visual feedback with success markers (✅) and error markers (❌)
- Proximity feedback: "You were X% away from the target"

**👑 Dashboard Mode (View Analytics)**
- GuessDashboard component showing comprehensive analytics with timestamps and accuracy data
- Real-time updates as players attempt your challenges via server integration
- Success rate tracking, popular guess locations, and engagement metrics
- Creator-only view of the actual hidden object location with special cyan glow effects
- Refresh functionality to see new attempts in real-time

**🔄 Dynamic Mode Switching**
- Intelligent mode detection based on game context and user role
- Seamless transitions between creation, guessing, and dashboard modes
- Context-aware UI adaptation for each mode's specific interaction patterns

## 🎯 What Makes This Game Innovative?

### 🎮 Revolutionary "Click-to-Hide" Gameplay Mechanic
- **Direct Object Interaction**: Simply click on any object in the scene to hide behind it - no complex menus or selectors needed
- **Streamlined Challenge Creation**: One-click hiding behind objects (pumpkin, wardrobe, bush, car, truck, guard) creates instant challenges
- **Intelligent Position Tracking**: Advanced system ensures pixel-perfect placement using normalized coordinates (0.000-1.000)
- **Real-Time Visual Feedback**: Cyan glow effects, coordinate display, and position validation provide immediate confirmation

### 🚀 Social Gaming Innovation for Reddit
- **Reddit-Native Design**: Purpose-built for Reddit's Devvit platform with seamless post integration
- **Community-Driven Content**: Players create challenges for each other, building an ever-growing puzzle library
- **Viral Challenge Sharing**: Each game becomes a shareable Reddit post reaching thousands of players
- **Live Creator Analytics**: Watch real-time as players attempt your challenges with detailed performance metrics

### 🎮 Intelligent Multi-Mode Architecture
- **Three Distinct Modes**: Creation (hide objects), Guessing (find objects), and Dashboard (view analytics)
- **Context-Aware Interface**: Automatic environment detection adapting UI based on current mode and user role
- **Smart Environment Detection**: Seamless switching between standalone and embedded Reddit contexts
- **Dynamic Mode Switching**: Intelligent detection based on URL parameters, post data, and Reddit context

### 🎯 Precision Position Tracking Technology
- **Normalized Coordinate System**: Advanced relX/relY positioning (0.000 to 1.000) for perfect device independence
- **Sub-Pixel Accuracy**: Floating-point precision enabling exact object placement and sophisticated distance calculations
- **Intelligent Proximity Detection**: Euclidean geometry calculations in normalized coordinate space for accurate feedback
- **Real-Time Position Validation**: Live tracking with coordinate display, statistics overlay, and comprehensive error handling
- **Universal Responsive Scaling**: Maintains pixel-perfect accuracy across all screen sizes using Phaser's scale manager

### 🏆 Advanced Progression & Ranking System
- **Four Detective Ranks**: Tyapu (starter) → GuessMaster (30% success, 5 finds) → Detective (60% success, 15 finds) → FBI (80% success, 50 finds)
- **Comprehensive Analytics**: Success rate tracking, total guesses, successful discoveries with detailed performance metrics
- **Visual Progression System**: Animated rank badges with unique icons, colors, and dynamic progress bars
- **Achievement Recognition**: Rank progression notification system with celebration effects and milestone tracking
- **Real-Time Updates**: Instant rank progression notifications with visual celebrations and achievement tracking

### ⚡ Advanced Performance & Mobile Optimization
- **Adaptive Quality Engine**: Intelligent 4-tier optimization (Potato → Low → Medium → High) based on real-time device capabilities
- **Mobile-First Design**: Touch-optimized interface with proper touch targets (44px minimum), gesture recognition, and responsive scaling
- **Smart Rendering Fallback**: Automatic WebGL to Canvas fallback with comprehensive error recovery and user-friendly messages
- **Intelligent Asset Management**: Dynamic texture compression, lazy loading, critical asset preloading, and smart memory optimization
- **Battery-Conscious Design**: Adaptive FPS limiting (30-60fps), reduced particle effects, and power-efficient rendering for mobile devices
- **Real-Time Performance Monitoring**: Live FPS tracking, memory usage monitoring, and automatic quality adjustment with developer tools (F1/F2 shortcuts)

## Current Game Features

### 🎮 Complete Game Flow
- **Animated Splash Screen**: Beautiful loading experience with progress tracking and performance optimization hints
- **Main Menu**: Displays player rank badges (Tyapu → GuessMaster → Detective → FBI), statistics, and progression tracking
- **Map Selection**: Map browsing interface with monthly map rotation and theme information
- **Interactive Game Scene**: Full-featured gameplay with three distinct modes (Creation, Guessing, Dashboard)

### 🗺️ Available Content & Smart Asset Management
- **Demo Scene**: The game currently features a demo environment with various interactive objects for hiding
- **Intelligent Map System**: Features robust fallback system that creates demo map data when server maps are unavailable
- **Interactive Objects**: Six distinct objects (pumpkin, wardrobe, bush, car, truck, guard) each with distinct visual characteristics, hover animations, and smart fallback textures
- **Smart Asset Loading**: The game intelligently creates fallback textures for all objects when assets are unavailable, ensuring smooth gameplay regardless of asset availability
- **Performance Optimization**: 4-tier quality system (Potato/Low/Medium/High) with automatic device detection and WebGL/Canvas fallback

### 🎮 Game Modes

**🎮 Standalone Mode (Challenge Creation)**
- Complete game flow: Animated Splash Screen → Main Menu with Rank Display → Map Selection → Interactive Game Scene
- Rich UI featuring player statistics, rank progression tracking, and achievement celebrations
- Interactive object selection with hover effects, cyan glow highlighting (#00ADB5), and visual feedback
- Precise position tracking using normalized coordinates (relX/relY from 0.000 to 1.000) for device-independent gameplay
- "Post Game" functionality to automatically create Reddit challenges with embedded game instances
- Real-time coordinate display and position validation with comprehensive error handling

**📱 Embedded Mode (Reddit Integration)**
- Streamlined gameplay directly within Reddit posts with automatic environment detection
- **Creator Dashboard Mode**: Comprehensive analytics showing all guesses made on your challenges with timestamps and accuracy
- **Guessing Mode**: Interactive object finding with randomly placed objects to choose from, distance-based feedback, and success celebrations
- Automatic user authentication and profile management via Reddit's Devvit platform
- Real-time guess validation with immediate rank progression updates and visual feedback

**🔄 Dynamic Mode Switching**
- Intelligent mode detection based on game context and user role
- Seamless transitions between creation, guessing, and dashboard modes
- Context-aware UI adaptation for each mode's specific interaction patterns

### 🎯 Interactive Elements & Visual Design
- **Interactive Objects**: Various furniture and items in the bedroom scene - each with unique visual characteristics and hover animations
- **Cohesive Design Language**: Carefully crafted dark theme palette (#222831, #393E46, #00ADB5, #EEEEEE) with semantic color mapping
- **Revolutionary Click-to-Hide System**: Direct object interaction with cyan glow effects (#00ADB5), scale animations, and selection feedback
- **Precision Position Tracking**: Sub-pixel accurate placement using normalized coordinates (relX/relY from 0.000 to 1.000 range)
- **Rich Visual Feedback**: Real-time coordinate display, distance calculations, success celebrations, and rank progression notifications
- **Smooth Animations**: Fluid scene transitions, object interactions, and success celebrations with particle effects and confetti

### 🎯 Current Implementation Highlights

**What This Game Actually Does:**
- **Complete Playable Experience**: Full game flow from splash screen to interactive gameplay with three distinct modes
- **Direct Object Interaction**: Click any object in the bedroom scene to hide behind it - no complex menus or selectors needed
- **Smart Fallback System**: Creates placeholder textures automatically when assets are missing, ensuring the game always works
- **Multi-Mode Architecture**: Seamlessly switches between Creation (hide objects), Guessing (find objects), and Dashboard (view analytics) modes
- **Precision Position Tracking**: Uses normalized coordinates for device-independent gameplay with real-time coordinate display
- **Performance Optimization**: Intelligent 4-tier quality system with automatic device detection and WebGL/Canvas fallback
- **Reddit Integration Ready**: Post creation dialog system prepared for Devvit deployment and community sharing

## 📝 License

This project is licensed under the BSD-3-Clause License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

This is a Reddit Devvit application. To contribute or modify the game, you'll need to:

1. Set up the Devvit development environment
2. Clone this repository
3. Run `npm install` to install dependencies
4. Use `npm run dev` to start the development server
5. Test your changes using the Devvit playtest environment

For more information about Devvit development, visit the [official documentation](https://developers.reddit.com/).

## � DDevelopment & Deployment

### Getting Started

To run the game locally for development:

```bash
# Install dependencies
npm install

# Start development server (runs client, server, and Devvit in parallel)
npm run dev

# Build for production
npm run build

# Deploy to Reddit
npm run deploy

# Launch for public review
npm run launch
```

### Development Commands

- `npm run dev` - Start development environment with hot reloading
- `npm run build:client` - Build client-side assets
- `npm run build:server` - Build server-side code
- `npm run check` - Run type checking, linting, and formatting
- `npm run test` - Run test suite

### Project Structure

```
src/
├── client/          # Frontend Phaser.js game
│   ├── game/        # Game scenes and components
│   │   ├── scenes/  # Phaser scenes (Boot, Splash, MainMenu, Game, etc.)
│   │   ├── components/ # Game components (MapLayer, GuessMode, etc.)
│   │   ├── services/   # Game services (EnvironmentDetector, NetworkService)
│   │   └── utils/      # Utilities (PositionTracker, PerformanceManager)
│   ├── style/       # CSS and theme files
│   └── main.ts      # Entry point
├── server/          # Express.js backend
│   ├── core/        # Business logic (MapManager)
│   └── index.ts     # API endpoints
└── shared/          # Shared types and utilities
    ├── types/       # TypeScript definitions
    └── services/    # Shared services
```

## 🔧 Developer-Friendly Architecture
- **Comprehensive Debugging Tools**: Performance monitoring, position tracking statistics, and development shortcuts
- **Intelligent Error Recovery**: Automatic fallback systems and user-friendly error messages
- **Modular Component System**: Clean separation of concerns with reusable UI components and services
- **TypeScript Integration**: Full type safety with comprehensive type definitions across client and server
- **Performance Monitoring**: Real-time FPS tracking, memory usage monitoring, and automatic quality adjustment

## 🎯 What This Game Actually Does

### Complete Hide-and-Seek Experience

This is a **fully functional hide-and-seek game** where players can create challenges by clicking on objects to hide behind them, then share these challenges for others to solve. The game tracks precise positions using normalized coordinates and provides intelligent feedback.

**Core Gameplay Loop:**
1. **Create Mode**: Click any of 6 interactive objects (pumpkin, wardrobe, bush, car, truck, guard) to hide behind them
2. **Share Challenge**: Post your hiding spot as a Reddit challenge for others to find
3. **Guess Mode**: Other players try to find your hidden object by clicking on randomly placed objects
4. **Get Feedback**: Distance-based hints and success celebrations with rank progression

### Three Distinct Game Modes

**🎮 Creation Mode (Hide Objects)**
- Complete game flow: Animated Splash Screen → Main Menu with Rank Display → Map Selection → Interactive Game Scene
- Direct object interaction: Click any object in the scene to hide behind it (no separate selector needed)
- Real-time position tracking with coordinate display and validation feedback
- "Post Game" dialog system for creating Reddit challenges with embedded game instances

**🔍 Guessing Mode (Find Hidden Objects)**
- GuessMode component generates 12 interactive objects scattered throughout the scene at randomized positions
- Distance-based feedback system with Euclidean geometry calculations in normalized coordinate space
- Success celebrations with confetti particle effects, screen shake, and rank progression notifications
- Visual feedback with success markers (✅) and error markers (❌)
- Proximity feedback: "You were X% away from the target"

**👑 Dashboard Mode (View Analytics)**
- GuessDashboard component showing comprehensive analytics with timestamps and accuracy data
- Real-time updates as players attempt your challenges via server integration
- Creator-only view of the actual hidden object location with special cyan glow effects
- Success rate tracking, popular guess locations, and engagement metrics

### Advanced Technical Features

**Streamlined Gameplay**: This game features an intuitive "click-to-hide" mechanic where players simply click directly on objects in the scene to hide behind them. The MapLayer component handles all object interactions with immediate visual feedback through cyan glow effects and scale animations.

**Complete Game Flow**: Experience a full game journey from animated SplashScene with rotating loading elements → MainMenu with rank display → MapSelection → interactive Game scene. Each scene is built with Phaser.js and includes smooth transitions and responsive design.

**Intelligent Environment Detection**: The EnvironmentDetector service automatically detects whether the game is running in standalone mode or embedded within Reddit posts, adapting the interface accordingly. This dual-mode architecture provides optimal experiences for both content creators and players.

**Performance-First Design**: The PerformanceManager implements 4-tier quality optimization (Potato/Low/Medium/High) that automatically adjusts to device capabilities. Mobile users get battery-optimized rendering with adaptive FPS limiting, while desktop users enjoy full visual effects.

**Robust Fallback System**: The AssetOptimizer creates placeholder textures for missing assets and continues functioning seamlessly, ensuring the game works reliably even during development or with incomplete asset libraries.

### 🎮 Reddit Integration & Social Features

**Seamless Reddit Integration**: Built specifically for Reddit's Devvit platform with automatic post creation and embedded gameplay
- **Automatic Post Creation**: When you hide behind an object, the game creates a Reddit post with an embedded playable instance
- **Community Challenges**: Each hiding spot becomes a shareable Reddit post that thousands of players can attempt
- **Live Analytics**: Creators can view real-time statistics of all attempts on their challenges
- **User Authentication**: Automatic Reddit user authentication and profile management

**Social Gaming Innovation**:
- **Viral Challenge Sharing**: Each game becomes a shareable Reddit post reaching community members
- **Creator Dashboard**: Watch real-time as players attempt your challenges with detailed performance metrics
- **Community-Driven Content**: Players create challenges for each other, building an ever-growing puzzle library
- **Cross-Platform Synchronization**: Game sessions and player progress sync via Redis and Express API endpoints

### 🎮 Currently Implemented Features

- ✅ **Complete Scene System**: SplashScene with animated loading, MainMenu with rank display, MapSelection, and Game scenes
- ✅ **Interactive Game Environment**: Demo scene with six interactive objects (pumpkin, wardrobe, bush, car, truck, guard)
- ✅ **Click-to-Hide Mechanics**: Direct object interaction with cyan glow effects (#00ADB5) and scale animations (1.1x on hover)
- ✅ **Advanced Position Tracking**: PositionTracker class with normalized coordinates (0.000-1.000) for device independence
- ✅ **Rank Progression System**: Four-tier ranking (Tyapu → GuessMaster → Detective → FBI) with RankDisplay component
- ✅ **Mobile Optimization**: Touch-optimized interface with responsive scaling and viewport height handling
- ✅ **Performance Management**: PerformanceManager with automatic quality adjustment and WebGL/Canvas fallback
- ✅ **Reddit Integration**: Devvit platform integration with PostGameManager for social gameplay
- ✅ **Multi-Mode Architecture**: Creation, guessing (GuessMode), and dashboard (GuessDashboard) modes with intelligent detection
- ✅ **Smart Asset Management**: AssetOptimizer with fallback texture creation and error recovery

### 🎮 Interactive Objects & Visual Design
- **Hidden Objects**: Pumpkin, Wardrobe, Bush, Car, Truck, Guard - each with unique visual characteristics and hover animations
- **Cohesive Design Language**: Carefully crafted dark theme palette (#222831, #393E46, #00ADB5, #EEEEEE) with semantic color mapping
- **Interactive System**: Click-to-discover mechanics with cyan glow effects (#00ADB5), scale animations, and selection feedback
- **Position Accuracy**: Sub-pixel precise placement using normalized coordinates (relX/relY from 0.000 to 1.000 range)
- **Visual Feedback**: Real-time coordinate display, distance calculations, success celebrations, and rank progression notifications
- **Fluid Animations**: Smooth scene transitions, object interactions, and success celebrations with particle effects

### 🗺️ Current Map & Objects

**Demo Scene**: The game currently features a demo environment with various interactive objects for hiding and seeking gameplay.

**Fallback Map System**: Features a robust fallback system that creates demo map data when server maps are unavailable, ensuring the game always works regardless of server connectivity.

**Interactive Objects**: Six distinct objects (pumpkin, wardrobe, bush, car, truck, guard) positioned strategically throughout the scene, each with distinct visual characteristics and hover animations for engaging gameplay.

**Smart Loading System**: The game intelligently creates fallback textures for all objects when assets are unavailable, ensuring smooth gameplay regardless of asset availability. Each fallback texture uses distinct colors and simple shapes to maintain visual clarity.

## Technology Stack & Architecture

### Core Technologies
- **[Devvit](https://developers.reddit.com/)**: Reddit's developer platform for hosting, authentication, and social integration
- **[Phaser.js 3.88.2](https://phaser.io/)**: 2D game engine with WebGL/Canvas rendering, scene management, and physics
- **[TypeScript](https://www.typescriptlang.org/)**: Strict type checking with comprehensive type definitions across client and server
- **[Vite](https://vite.dev/)**: Lightning-fast build tool with hot module replacement and optimized bundling
- **[Express.js](https://expressjs.com/)**: RESTful API server with comprehensive error handling and middleware
- **Redis (via Devvit)**: High-performance data persistence for game sessions, player profiles, and statistics

### Architectural Highlights

**Dual-Mode Architecture**: The game seamlessly operates in both standalone mode (for creating challenges) and embedded Reddit mode (for playing challenges), with automatic environment detection and context-aware UI adaptation.

**Advanced Scene Management**: Built with Phaser's scene system featuring:
- **SplashScene**: Animated loading with rotating elements, progress tracking, and performance optimization hints
- **MainMenu Scene**: Player statistics and rank display with progression tracking
- **MapSelection Scene**: Map browsing and selection interface with monthly rotation support
- **Game Scene**: Multi-mode gameplay (creation/guessing/dashboard) with intelligent mode detection

**Sophisticated State Management**: 
- **EnvironmentDetector**: Automatic detection of standalone vs embedded Reddit context
- **PerformanceManager**: 4-tier quality optimization (Potato/Low/Medium/High) with automatic device detection
- **PositionTracker**: Real-time position tracking with normalized coordinates (0.000-1.000)
- **AssetOptimizer**: Smart fallback texture creation and asset management

**Reddit Integration Services**:
- **PostGameManager**: Automatic post creation with embedded game instances
- **EmbeddedGameManager**: Player authentication and profile management via Devvit
- **NetworkService**: Real-time guess submission and validation with retry logic
- **GuessDashboard**: Creator dashboard with comprehensive analytics and real-time updates

## 🎮 How to Play

### 🎯 Step-by-Step Gameplay Instructions

**Creating a Hide-and-Seek Challenge:**

1. **Launch the Game**: Start from the animated splash screen featuring the game title and loading animation with progress tracking
2. **Navigate Through Scenes**: Experience the complete game flow:
   - **Splash Screen**: Animated loading with rotating elements and progress bar
   - **Main Menu**: View your current rank badge (Tyapu → GuessMaster → Detective → FBI) and player statistics
   - **Map Selection**: Choose from available maps (currently features a demo scene with bedroom environment)
   - **Game Scene**: Interactive gameplay area with all hiding objects visible

3. **Hide Behind Objects**: In the game scene, simply click directly on any object to hide behind it
   - **Available Objects**: pumpkin, wardrobe, bush, car, truck, and guard
   - **Visual Feedback**: Objects highlight with cyan glow effects (#00ADB5) when you hover over them
   - **Position Tracking**: The game tracks your exact placement using precise relative coordinates (0.000 to 1.000)
   - **Selection Confirmation**: Visual feedback includes selection rings, coordinate display, and position validation
   - **Success Message**: "Great hiding spot! You're hiding behind the [object]. Now post your challenge for others to find you!"

4. **Share Your Challenge**: Click "📮 POST GAME" to open the post creation dialog and prepare your challenge for Reddit sharing

**Playing Someone's Challenge (Guessing Mode):**

1. **Access the Game**: Click "Launch App" on a Reddit hide-and-seek post (embedded mode automatically detected)
2. **Find the Hidden Object**: The game shows you which object to find (e.g., "🔍 Find the hidden pumpkin!")
3. **Click to Guess**: Click on interactive objects scattered throughout the scene (12 randomly placed objects)
4. **Get Feedback**: Receive immediate feedback with distance-based hints and proximity percentages
   - Success markers (✅) for correct guesses
   - Error markers (❌) for incorrect guesses  
   - Distance feedback: "You were X% away from the target"
5. **Celebrate Success**: Enjoy confetti effects, particle animations, and rank progression notifications

**Creator Dashboard (Analytics Mode):**

- View comprehensive analytics of all guesses made on your challenges with timestamps
- See the actual hidden object location with special glow effects (creator-only view)
- Track success rates, popular guess locations, and engagement metrics
- Real-time updates as players attempt your challenges
- Refresh dashboard to see new attempts

### 🎯 Game Mechanics Deep Dive

**The Revolutionary "Click-to-Hide" System:**
- **Direct Object Interaction**: Click directly on any object in the scene to hide behind it - no separate selection menus needed
- **Interactive Objects**: Six distinct objects (pumpkin, wardrobe, bush, car, truck, guard) positioned using relative coordinates (0.0-1.0)
- **Instant Visual Feedback**: Objects highlight with signature cyan glow (#00ADB5) and scale animations (1.1x) on hover via MapLayer component
- **Precision Position Tracking**: Uses PositionTracker class with normalized coordinates (0.000-1.000) for perfect device-independent gameplay
- **Real-Time Validation**: Live coordinate display, position statistics, and comprehensive error handling with invalid position feedback

**Advanced Guessing System:**
- **Smart Object Placement**: GuessMode component generates 12 interactive objects scattered throughout the scene at randomized positions
- **Distance-Based Feedback**: Sophisticated proximity detection using Euclidean geometry calculations in normalized coordinate space
- **Intelligent Hints**: Percentage-based proximity feedback with messages like "You were X% away from the target"
- **Success Celebrations**: Confetti particle effects, screen shake, and immediate rank progression updates via RankProgressionNotification
- **Network Integration**: NetworkService handles real-time guess submission with automatic retry logic and error handling

**Three-Mode Architecture with Dynamic Switching:**
- **Creation Mode (Hiding)**: MapLayer handles object interaction with direct click, position tracking, and PostGameManager for Reddit sharing
- **Guessing Mode**: GuessMode component with 12 interactive objects, distance feedback, and celebration effects
- **Dashboard Mode**: GuessDashboard component showing creator analytics with timestamps, success rates, and hidden object location visualization

**Rank Progression System:**
- **Four Detective Ranks**: Tyapu (starter) → GuessMaster (30% success, 5 finds) → Detective (60% success, 15 finds) → FBI (80% success, 50 finds)
- **Real-Time Progression**: Automatic rank updates based on guess accuracy and total successful discoveries
- **Visual Feedback**: Animated rank badges with unique colors and icons for each tier
- **Progress Tracking**: Detailed statistics showing success rate, total guesses, and progress toward next rank

### 🎮 Complete Gameplay Flow

#### Phase 1: Game Initialization & Setup
1. **Animated Splash Screen**: Experience a beautiful loading screen with rotating animation, progress tracking, and performance optimization hints
2. **Main Menu Navigation**: View your current rank badge (Tyapu → GuessMaster → Detective → FBI), player statistics, and success rate
3. **Performance Optimization**: The game automatically detects your device capabilities and optimizes graphics quality (WebGL/Canvas fallback)
4. **Map Selection**: Choose from available maps with theme information and visual previews

#### Phase 2: Direct Object Hiding (Creation Mode)
1. **Enter Game Scene**: Load into the interactive bedroom map with all objects visible and ready for interaction
   - Various furniture and items in the bedroom scene, each offering unique hiding opportunities

2. **Click-to-Hide Mechanic**: Simply click directly on any object in the scene to hide behind it
   - No separate object selection step needed - the object you click becomes your hiding spot
   - Objects highlight with cyan glow effects (#00ADB5) on hover with smooth scale animations
   - Real-time position tracking using normalized coordinates (0.000 to 1.000) for device independence
   - Visual feedback includes selection rings, coordinate display, and position validation

3. **Position Confirmation**: The system validates your placement and provides immediate feedback
   - ✅ **Success**: Cyan glow effects with position confirmation and coordinate details
   - 📊 **Position statistics**: Real-time tracking data and placement accuracy metrics
   - 🎯 **Visual indicators**: Selection borders and pulsing effects to confirm your choice

#### Phase 3: Challenge Creation & Reddit Integration
1. **Post Game Dialog**: Click "📮 POST GAME" to open the post creation interface with game preview
2. **Reddit Integration**: Automatically generates Reddit posts with embedded game instances via Devvit platform
3. **Community Sharing**: Your challenge becomes immediately available as an interactive Reddit post
4. **Success Confirmation**: Receive post URL and game ID with options to open on Reddit or copy link

#### Phase 4: Playing Challenges (Embedded Reddit Mode)
1. **Seamless Access**: Click "Launch App" on Reddit posts for instant game loading with environment detection
2. **Clear Objective**: See the goal - "🔍 Find the hidden [object]!" with visual object indicators
3. **Interactive Guessing**: Click on randomly placed objects throughout the scene to make guesses
   - 12 interactive objects scattered throughout the map at randomized positions
   - Objects highlight with cyan glow on hover with smooth animations
   - Distance-based feedback system provides proximity hints and accuracy percentages

4. **Intelligent Feedback System**: Receive immediate responses based on your guess accuracy:
   - 🎉 **Perfect Discovery**: Celebration animations with confetti effects and rank progression notifications
   - 📏 **Proximity Feedback**: Distance-based hints showing how close you are to the correct location
   - ❌ **Wrong Selection**: Clear feedback indicating the correct object type with encouragement to continue

#### Phase 5: Creator Dashboard (For Challenge Creators)
1. **Analytics Overview**: View comprehensive data about your challenges with real-time updates and statistics
2. **Guess Tracking**: Monitor every attempt made by community members with detailed timestamps and accuracy data
3. **Performance Metrics**: Review success rates, popular guess locations, and challenge difficulty assessments
4. **Live Updates**: Watch new guesses appear in real-time as players discover your challenges

### 🎯 Creating Hide Challenges (Standalone Mode)

**Step 1: Navigate to Game Scene**
- Follow the complete game flow: Animated Splash Screen → Main Menu with Rank Display → Map Selection → Interactive Game Scene
- Experience smooth scene transitions with fade effects and loading animations
- All interactive objects load automatically with intelligent fallback textures: Pumpkin, Wardrobe, Bush, Car, Truck, Guard
- Each object features unique visual characteristics, hover animations with cyan glow (#00ADB5), and responsive scaling

**Step 2: Direct Object Hiding**
- **Streamlined click-to-hide mechanic** - simply click directly on any object in the scene to hide behind it
- The game displays: "Choose where to hide! Click on any object on the map to hide behind it."
- Click on any interactive object in the bedroom scene to instantly select it as your hiding spot
- Position tracker displays exact relX/relY coordinates (0.000 to 1.000 normalized range) with sub-pixel precision
- Visual feedback includes animated selection rings, cyan glow effects, coordinate display overlay, and position validation
- System performs comprehensive validation and provides detailed position statistics and placement accuracy
- Success confirmation shows selection details with coordinate information and visual celebration effects

**Step 3: Challenge Creation & Reddit Integration**
- "📮 POST GAME" button opens an elegant post creation dialog with game preview and details
- System integrates with Reddit via Devvit platform to create posts with embedded game instances
- Post creation dialog shows game data including map, object, and position coordinates with confirmation options
- Success screen provides Reddit post URL with options to open directly or copy link to clipboard
- Challenge becomes immediately available for community play through embedded game instances

### 🔍 Playing Embedded Challenges (Reddit Posts)

**Step 1: Seamless Challenge Access**
- Click "Launch App" button in Reddit posts containing hide-and-seek challenges for instant access
- Environment detector automatically detects embedded context and provides streamlined experience
- Embedded game manager initializes and retrieves challenge data, player profile, and hiding spot details
- Clear objective display: "🔍 Find the hidden [object]!" with visual object indicators and helpful guidance

**Step 2: Interactive Object Discovery System**
- Guess mode generates 12 interactive objects scattered throughout the map at randomized positions
- Objects include all 6 types (pumpkin, wardrobe, bush, car, truck, guard) with distinct visual characteristics
- Objects highlight with signature cyan glow (#00ADB5) on hover with smooth scale animations
- Click on any object to submit your guess with immediate visual feedback and position validation
- Advanced distance calculations provide sophisticated proximity detection and accuracy metrics

**Step 3: Intelligent Feedback & Progression**
- 🎉 **Perfect Discovery**: Celebration animation with confetti effects, success message, and rank progression notification
- 📏 **Proximity Feedback**: Distance-based hints showing percentage proximity to correct location
- ❌ **Wrong Object Selection**: Clear feedback indicating the correct object type with encouragement
- 🎯 **Smart Guidance System**: Real-time distance calculations help guide players toward the solution
- 🏆 **Instant Rank Updates**: Successful discoveries immediately update your detective rank with visual celebrations and progress tracking

### 👑 Creator Dashboard Mode (Embedded)

**Comprehensive Analytics Dashboard**
- Creators viewing their own challenges see specialized dashboard interface with detailed analytics
- Display every guess made on the challenge with comprehensive data: player usernames, selected objects, coordinates, timestamps, and accuracy
- Success/failure indicators with precise distance calculations, accuracy percentages, and performance metrics
- Total guess statistics, success rate analysis, challenge difficulty assessment, and engagement analytics

**Real-Time Interactive Features**
- 🔄 Live refresh functionality to see new guesses as they arrive from the community
- 👁️ Visual representation of the hidden object location with special creator-only glow effects
- 📊 Player rank information and detailed statistics for each community member who participated
- 📈 Challenge performance metrics, engagement analytics, and comprehensive reporting

## Step-by-Step Gameplay Guide

### 🎯 Creating Your First Hide-and-Seek Challenge

**Step 1: Launch and Navigate**
1. **Splash Screen**: Enjoy the animated loading screen with rotating circles, progress tracking, and performance optimization
2. **Main Menu**: View your current rank badge (Tyapu → GuessMaster → Detective → FBI) and player statistics
3. **Map Selection**: Click "PLAY" to browse available maps with theme information
4. **Game Scene**: Enter the interactive map with all objects visible and ready for interaction

**Step 2: Hide Behind Objects**
1. **Direct Interaction**: Simply click on any object in the scene to hide behind it - no menus needed
2. **Visual Feedback**: Objects highlight with cyan glow effects when you hover over them
3. **Position Tracking**: The game tracks your exact placement using precise coordinates
4. **Confirmation**: See selection rings and position validation when you make your choice

**Step 3: Share Your Challenge**
1. **Post Creation**: Click "📮 POST GAME" to open the post creation dialog
2. **Reddit Integration**: Automatically creates a Reddit post with your embedded challenge
3. **Community Play**: Other players can immediately access and play your challenge**: Enter the interactive game environment with all objects ready for selection

**Step 2: Hide Behind Objects**
1. **Direct Selection**: Click directly on any object in the scene to hide behind it (no separate object selector needed)
2. **Available Objects**: Choose from Pumpkin, Wardrobe, Bush, Car, Truck, or Guard
3. **Visual Feedback**: See cyan glow effects and position tracking as you make your selection
4. **Position Validation**: The system tracks your exact placement with normalized coordinates for perfect gameplay

**Step 3: Share Your Challenge**
1. **Post Game**: Click the "📮 POST GAME" button to create your Reddit challenge
2. **Automatic Integration**: The system generates a Reddit post with your embedded game
3. **Community Play**: Other players can now find and play your hiding challenge
4. **Track Results**: View analytics of all guesses made on your challenge through the creator dashboard with theme information and details
4. **Game Scene**: Select a map to enter the interactive game environment

**Step 2: Choose and Hide Your Object**
1. **Object Selection**: Use the interactive object selector to choose from 6 available objects:
   - **🎃 Pumpkin**: Orange circular object perfect for autumn-themed hiding spots
   - **🚪 Wardrobe**: Brown rectangular object representing large furniture pieces
   - **🌿 Bush**: Green circular object for natural camouflage in outdoor environments
   - **🚗 Car**: Blue rectangular object for vehicle-based hiding
   - **🚛 Truck**: Purple rectangular object for larger vehicle hiding spots
   - **👮 Guard**: Red circular object representing character-based hiding
2. **Hide Behind Elements**: After selecting your object, follow the prompt: "Choose an object to hide behind! Click on any object on the map."
3. **Strategic Placement**: Click anywhere on the map to hide your selected object behind existing scene elements
4. **Position Tracking**: Watch the real-time coordinate display show your exact placement (relX/relY from 0.000 to 1.000)
5. **Visual Feedback**: See cyan glow effects, selection rings, and position validation with comprehensive statistics

**Step 3: Share Your Challenge**
1. **Post Creation**: Click the "📮 POST GAME" button to automatically generate a Reddit post with embedded game functionality
2. **Community Sharing**: Your challenge becomes an interactive Reddit post that others can play directly
3. **Analytics Dashboard**: Return later to view comprehensive analytics on how players performed, including all guesses, timestamps, and accuracy metrics
4. **Real-time Updates**: Watch new attempts appear as players discover your challenges with live refresh functionality

### 🔍 Playing Someone Else's Challenge

**Step 1: Access the Challenge**
1. **Reddit Integration**: Find a Hide & Seek post on Reddit and click "Launch App" to open the embedded game
2. **Automatic Setup**: The game automatically detects embedded context and provides streamlined experience
3. **Clear Objective**: See the goal displayed prominently - "🔍 Find the hidden [object]!" with helpful visual guidance

**Step 2: Interactive Object Discovery**
1. **Scattered Objects**: Explore 12 interactive objects randomly placed throughout the map for strategic guessing
2. **Visual Feedback**: Hover over objects to see them highlight with signature cyan glow (#00ADB5) and smooth scale animations
3. **Smart Guessing**: Click on any object to submit your guess with immediate visual feedback and position validation
4. **Intelligent Responses**: Receive immediate feedback based on your guess accuracy:
   - 🎉 **Perfect Discovery**: Celebration animation with confetti effects, success message, and rank progression
   - 📏 **Proximity Feedback**: Distance-based feedback showing percentage proximity to correct location with helpful hints
   - ❌ **Wrong Object Selection**: Clear indication of the correct object type with encouragement to continue

**Step 3: Celebrate Success and Track Progress**
1. **Victory Celebration**: Enjoy spectacular celebration animations, particle effects, and the reveal of the actual hidden object
2. **Learning Experience**: Gain insights from detailed distance feedback and strategic guidance for improvement
3. **Rank Progression**: Watch your detective rank progress in real-time with visual celebrations and achievement notifications
4. **Continuous Challenge**: Build your success rate and climb through the ranks (Tyapu → GuessMaster → Detective → FBI)

### 👑 Viewing Your Challenge Analytics (Creator Dashboard)

**For Challenge Creators:**
1. **Dashboard Access**: Click "Launch App" on your own Reddit post to automatically access the specialized creator dashboard
2. **Comprehensive Analytics**: View detailed analytics of all guesses made by community members with real-time updates
3. **Detailed Metrics**: See player usernames, selected objects, coordinates, timestamps, accuracy percentages, and success indicators
4. **Performance Tracking**: Monitor success rates, popular guess locations, challenge difficulty assessment, and engagement analytics
5. **Live Updates**: Use the refresh functionality to see new attempts as they arrive from the community with instant notifications
6. **Creator Privileges**: View the hidden object location with special creator-only glow effects and position indicators
7. **Export Data**: Access comprehensive reporting with exportable data for deeper analysis of your challenge performance

### 🎮 Game Controls & Interface

**Complete Scene Flow Experience**
- 🎬 **Animated Splash Screen**: Beautiful loading experience with progress tracking, performance optimization hints, and smooth transitions
- 🏠 **Main Menu**: Displays rank badges, player statistics, and progression tracking with elegant gradient backgrounds
- 🗺️ **Map Selection**: Browse monthly maps with detailed theme information, rotation schedules, and beautiful map cards
- 🎯 **Game Scene**: Multi-mode gameplay supporting creation, guessing, and dashboard views with context-aware UI adaptation

**Intuitive Input Methods & Accessibility**
- 🖱️ **Mouse Controls**: Hover for object highlights, click for selection/guessing with pixel-perfect accuracy and smooth animations
- � ***Touch Optimization**: Carefully designed touch targets (minimum 44px) with gesture support and multi-touch prevention
- ⌨️ **Developer Shortcuts**: F1 for performance display, F2 for manual optimization (development mode only)

**Rich Visual Feedback Systems**
- ✨ **Interactive Hover Effects**: Signature cyan glow (#00ADB5) with smooth scale animations on all interactive objects
- 🎯 **Dynamic Selection Rings**: Animated selection rings with pulsing effects and color transitions around chosen objects
- � **Real -Time Position Display**: Live coordinate feedback during placement with statistics overlay and accuracy metrics
- � T**Animated Progress Indicators**: Beautiful rank progression bars with percentage completion, next rank requirements, and celebration effects
- 🎨 **Scene Transitions**: Smooth fade, slide, and zoom transitions between different game scenes for seamless navigation

**Advanced Responsive Design & Mobile Optimization**
- 📐 Intelligent scaling system with perfect aspect ratio preservation across all screen sizes
- 🔄 Smart orientation change handling with automatic layout reflow and viewport adjustments
- 📱 Mobile browser UI accommodation with dynamic viewport height calculations and safe area detection
- 👆 Touch-optimized interface featuring gesture recognition and optimized button sizing for mobile devices
- 🎭 **Adaptive Performance**: 4-tier quality optimization (Potato/Low/Medium/High) with automatic device capability detection

### 🏆 Comprehensive Ranking System & Progression

**Detailed Rank Requirements & Advancement**
- 🥉 **Tyapu** (Starting Rank): No requirements - welcome to the detective community!
- ⭐ **GuessMaster**: 30% success rate + 5 successful discoveries
- 🛡️ **Detective**: 60% success rate + 15 successful discoveries  
- 👑 **FBI** (Elite Rank): 80% success rate + 50 successful discoveries

**Rich Progression Features & Community Recognition**
- 🎖️ Unique visual rank badges with custom icons, signature colors, and exclusive animation effects
- 📈 Detailed progress bars showing exact advancement toward next rank with percentage display and milestone tracking
- 🎉 Spectacular celebration animations and achievement notifications when ranking up with confetti and particle effects
- 📊 Comprehensive historical statistics tracking across all game sessions and seasonal rotations
- 🌟 Rank-based recognition and special features in creator dashboards and community interactions

### 🔧 Advanced Technical Features & Systems

**Precision Position Tracking & Coordinate System**
- 📍 Advanced relative coordinate system (relX, relY) enabling perfect device-independent placement with sub-pixel accuracy
- 🎯 High-precision floating-point calculations for exact object positioning and sophisticated distance measurements
- ✅ Intelligent coordinate normalization with comprehensive validation, error handling, and user feedback systems
- 📏 Sophisticated distance calculations using Euclidean geometry in normalized coordinate space for accurate proximity detection
- 📊 Detailed position statistics tracking with debugging information, performance metrics, and accuracy analysis

**Intelligent Performance Optimization & Quality Management**
- ⚡ **Adaptive Quality Engine**: Real-time automatic adjustment (Potato → Low → Medium → High) based on device capabilities and performance metrics
- 🗂️ **Smart Asset Management**: Dynamic texture compression (0.6-0.9 quality), intelligent lazy loading, critical asset preloading, and memory optimization
- 🎮 **Advanced Rendering Optimization**: Seamless WebGL/Canvas fallback with comprehensive error recovery and intelligent FPS limiting (30-60fps adaptive)
- 🔋 **Mobile Battery Optimization**: Reduced particle effects, optimized animation complexity, and power-efficient rendering for mobile devices
- 📈 **Real-Time Performance Monitoring**: Live FPS tracking, memory usage monitoring, and automatic quality adjustment with developer tools (F1/F2 shortcuts)

**Robust Error Handling & Recovery Systems**
- 🛡️ Comprehensive error boundaries with user-friendly messages, recovery options, and helpful guidance
- 🔄 Advanced network failure recovery with automatic retry mechanisms, timeout handling, and offline state detection
- 🎯 Intelligent invalid state detection with graceful degradation, fallback systems, and seamless user experience
- 🖼️ **Smart Asset Fallback**: Automatic creation of placeholder textures when assets are missing, ensuring game functionality
- 💬 Rich user feedback systems with toast notifications, contextual help, and interactive error resolution
- 🔧 **Development Tools**: Performance display (F1), manual optimization (F2), and comprehensive debugging information

## Development Setup

### Prerequisites
- **Node.js 22.2.0 or higher** - Required for Devvit compatibility
- **Reddit Developer Account** - For testing and deployment
- **Git** - For version control

### Quick Start
1. Clone this repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Open the provided playtest URL in your browser

### Development Workflow
The game uses Devvit's integrated development environment:
- **Live Testing**: `npm run dev` creates a test subreddit and provides a playtest URL
- **Hot Reloading**: Client and server code updates automatically during development
- **Reddit Integration**: Full Reddit API access and authentication in development mode

---

## 🎯 Game Summary

Hide & Seek is a fully functional, sophisticated puzzle game that brings the classic childhood game into the digital age with modern web technologies. Built with Phaser.js and designed for Reddit's Devvit platform, it features:

**Core Gameplay**: Players click directly on objects (pumpkin, wardrobe, bush, car, truck, guard) to hide behind them, then share challenges as Reddit posts. Other players find hidden objects by clicking on interactive elements scattered throughout the scene.

**Technical Innovation**: The game uses precise position tracking with normalized coordinates (0.000-1.000), intelligent asset management with fallback textures, and a 4-tier performance optimization system. It seamlessly operates in both standalone and embedded Reddit modes.

**Social Features**: Progressive rank system (Tyapu → GuessMaster → Detective → FBI), creator dashboards with real-time analytics, and automatic Reddit post generation for community challenges.

The game is production-ready with comprehensive error handling, mobile optimization, and a complete scene flow from splash screen to interactive gameplay.

---

## Commands

- `npm run dev`: Starts a development server where you can develop your application live on Reddit.
- `npm run build`: Builds your client and server projects
- `npm run deploy`: Uploads a new version of your app
- `npm run launch`: Publishes your app for review
- `npm run login`: Logs your CLI into Reddit
- `npm run check`: Type checks, lints, and prettifies your app

## Cursor Integration

This template comes with a pre-configured cursor environment. To get started, [download cursor](https://www.cursor.com/downloads) and enable the `devvit-mcp` when prompted.

## Credits

Thanks to the Phaser team for [providing a great template](https://github.com/phaserjs/template-vite-ts)!
