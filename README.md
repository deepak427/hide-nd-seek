# Hide & Seek - Interactive Object Finding Game

A sophisticated hide-and-seek puzzle game built with Phaser.js for Reddit's Devvit platform. Create hiding challenges by clicking on objects in virtual scenes, then share them as interactive Reddit posts for the community to solve!

## 🎮 What is Hide & Seek?

Hide & Seek is an innovative social puzzle game that transforms the classic childhood game into an engaging digital experience. Players create hiding challenges by clicking on objects in virtual environments, then share these challenges as interactive Reddit posts. Other players find hidden objects by clicking on the same objects in the scene, receiving real-time feedback and earning rank progression.

**Core Innovation**: This game features a streamlined "click-to-hide" mechanic where players simply click directly on any object in the scene to hide behind it. The game uses precise position tracking with normalized coordinates (0.000-1.000) to ensure pixel-perfect placement across all devices. When others play your challenge, they must find the hidden object by clicking on the same interactive objects positioned throughout the scene.

## 🌟 What Makes This Game Unique?

### 🎯 Revolutionary "Click-to-Hide" Gameplay
This isn't just another hidden object game. The intuitive one-click system creates engaging strategic gameplay:

1. **Direct Object Interaction**: Simply click on any object in the scene to hide behind it - no separate selection step needed
2. **Strategic Positioning**: Choose from 6 interactive objects (pumpkin, wardrobe, bush, car, truck, guard), each positioned strategically across indoor and outdoor areas
3. **Immediate Visual Feedback**: Real-time cyan glow effects (#00ADB5), scale animations, and position tracking show exactly where you're hiding

### 🎮 Intelligent Multi-Mode Architecture
The game seamlessly operates in three distinct modes:
- **Creation Mode (Hiding)**: Hide behind objects with direct click interaction and position tracking
- **Guessing Mode**: Find hidden objects with intelligent feedback, proximity hints, and distance calculations
- **Dashboard Mode**: View comprehensive analytics of all attempts on your challenges with real-time updates

### 🏆 Advanced Progression & Social Features
- **Rank Progression**: Advance through 4 detective ranks (Tyapu → GuessMaster → Detective → FBI) based on success rate and discoveries
- **Reddit Integration**: Automatically creates Reddit posts with embedded game instances for community play
- **Creator Dashboard**: View comprehensive analytics including guess statistics, success rates, and popular guess locations

## 🎮 How to Play Hide & Seek

### 🎯 Step-by-Step Instructions

**For Creating Challenges (Hide Mode):**
1. **Launch the Game**: Click "CREATE GAME" from the main menu
2. **Select Your Map**: Choose from the monthly featured map (currently a cozy indoor/outdoor scene)
3. **Choose Your Hiding Spot**: Click directly on any of the 6 interactive objects:
   - **Pumpkin** (outdoor, on the veranda)
   - **Bush** (outdoor, in the field area)
   - **Car** (outdoor, on the road)
   - **Truck** (outdoor, on the road)
   - **Wardrobe** (indoor, in the hall)
   - **Guard** (indoor, at the entrance)
4. **Confirm Your Choice**: The selected object will glow cyan and show position coordinates
5. **Share Your Challenge**: Click "Post Game" to create a Reddit post with your hiding challenge
6. **Track Results**: Use the dashboard to see who found your hiding spot and view statistics

**For Playing Challenges (Guess Mode):**
1. **Find a Challenge**: Either click "GUESS GAME" and enter a Game ID, or click on a Hide & Seek post in Reddit
2. **Study the Scene**: Look at the same map with the same 6 interactive objects
3. **Make Your Guess**: Click on the object where you think someone is hiding
4. **Get Feedback**: 
   - ✅ **Correct**: Celebration effects, confetti, and the hidden object is revealed
   - ❌ **Wrong**: Distance feedback showing how close you were (e.g., "You were 45% away")
5. **Earn Progression**: Successful guesses advance your detective rank and update your statistics

**For Viewing Your Challenges (Dashboard Mode):**
1. **Access Dashboard**: Click "DASHBOARD" from the main menu or view your own Reddit posts
2. **See All Attempts**: View everyone who tried to find your hidden object
3. **Analyze Performance**: See success rates, popular wrong guesses, and player statistics
4. **Real-time Updates**: The dashboard refreshes automatically as new players attempt your challenge

## 🎮 Current Game Status

**✅ FULLY FUNCTIONAL** - This is a complete, playable hide-and-seek game with Reddit integration featuring:

- **Complete Scene Flow**: Animated splash screen with rotating loading elements → Main menu with rank display → Map selection → Interactive game scene
- **Dual-Mode Architecture**: Standalone creation mode and embedded Reddit gameplay mode with automatic environment detection
- **Advanced Position Tracking**: Pixel-perfect object placement using normalized coordinates (relX/relY 0.000-1.000)
- **Intelligent Asset Management**: Smart fallback system that creates colored placeholder textures for missing assets when textures are unavailable
- **Performance Optimization**: 4-tier quality system (Potato/Low/Medium/High) with PerformanceManager and AssetOptimizer classes
- **Reddit Integration**: PostGameManager with dialog system for sharing challenges (ready for Devvit deployment)
- **Progressive Ranking System**: Four detective ranks from Tyapu → GuessMaster → Detective → FBI with visual progression tracking
- **Mobile Optimization**: Touch-optimized interface with responsive scaling, battery-conscious design, and viewport height handling
- **Three Game Modes**: Creation mode (hide objects), Guessing mode (find objects with GuessMode component), and Dashboard mode (view analytics with GuessDashboard component)

### 🎯 Game Modes Explained

**🎮 Creation Mode (Hide Objects)**
- **Purpose**: Create hiding challenges for other players to solve
- **Flow**: Animated Splash Screen → Main Menu with Rank Display → Map Selection → Interactive Game Scene
- **Gameplay**: Click directly on any of the 6 objects in the scene to hide behind it
- **Visual Feedback**: Selected objects glow cyan (#00ADB5) with scale animations and position coordinates
- **Sharing**: Use the "Post Game" dialog to create Reddit posts with embedded game instances
- **Position Tracking**: Uses normalized coordinates (0.000-1.000) for pixel-perfect placement across all devices

**🔍 Guessing Mode (Find Hidden Objects)**
- **Purpose**: Find objects that other players have hidden behind
- **Access**: Click "GUESS GAME" and enter a Game ID, or click on Hide & Seek Reddit posts
- **Gameplay**: Click on any of the 6 interactive objects to make your guess
- **Feedback System**: 
  - ✅ **Correct Guess**: Confetti celebration, object revelation, rank progression
  - ❌ **Wrong Guess**: Distance feedback (e.g., "You were 32% away from the target")
- **Smart Validation**: Prevents multiple guesses and shows "Already Guessed" message for repeat attempts
- **Creator Protection**: Game creators cannot guess on their own challenges

**👑 Dashboard Mode (View Analytics)**
- **Purpose**: View comprehensive statistics for your created challenges
- **Access**: Click "DASHBOARD" from main menu or view your own Reddit posts as the creator
- **Real-time Data**: Auto-refreshes every 30 seconds with manual refresh option
- **Analytics Include**:
  - Total guesses and correct guesses
  - Unique players who attempted your challenge
  - Success rate percentage
  - Popular wrong guesses (object guess counts)
  - Timestamps and player usernames
- **Creator View**: Shows the actual hidden object location with special cyan glow effects

**🔄 Intelligent Mode Detection**
- **Automatic Switching**: Game detects your role (creator/guesser) and adapts the interface
- **Context Awareness**: Different UI elements and interactions based on whether you're creating, guessing, or viewing analytics
- **Seamless Transitions**: Smooth animations and feedback when switching between modes

## 🌟 What Makes This Game Innovative?

### 🎮 Revolutionary "Click-to-Hide" Gameplay Mechanic
Unlike traditional hidden object games where you search for tiny items in cluttered scenes, Hide & Seek flips the concept:
- **You Create the Challenge**: Instead of finding objects, you choose where to hide, then challenge others to find you
- **Strategic Psychology**: Success depends on thinking like your opponents - where would they least expect you to hide?
- **Direct Object Interaction**: Simply click on any object in the scene to hide behind it - no complex menus or selectors needed
- **Limited Strategic Choices**: Only 6 objects to choose from, making each decision meaningful rather than random

### 🚀 Social Gaming Innovation for Reddit
- **Reddit-Native Design**: Purpose-built for Reddit's Devvit platform with seamless post integration
- **Community-Driven Content**: Players create challenges for each other, building an ever-growing puzzle library
- **Viral Challenge Sharing**: Each game becomes a shareable Reddit post reaching thousands of players
- **Live Creator Analytics**: Watch real-time as players attempt your challenges with detailed performance metrics

### 🎯 Precision Position Tracking Technology
- **Normalized Coordinate System**: Advanced relX/relY positioning (0.000 to 1.000) for perfect device independence
- **Sub-Pixel Accuracy**: Floating-point precision enabling exact object placement and sophisticated distance calculations
- **Intelligent Proximity Detection**: Euclidean geometry calculations provide accurate "You were X% away" feedback
- **Real-Time Position Validation**: Live tracking with coordinate display and comprehensive error handling
- **Universal Responsive Scaling**: Maintains pixel-perfect accuracy across all screen sizes and devices

### 🏆 Advanced Progression & Ranking System
- **Four Detective Ranks**: 
  - 🔍 **Tyapu** (Beginner): Starting rank for new players
  - 🕵️ **GuessMaster**: 30% success rate, 5+ successful finds
  - 🔎 **Detective**: 60% success rate, 15+ successful finds  
  - 🏛️ **FBI**: 80% success rate, 50+ successful finds
- **Comprehensive Analytics**: Success rate tracking, total guesses, successful discoveries with detailed performance metrics
- **Visual Progression System**: Animated rank badges with unique icons, colors, and dynamic progress bars
- **Real-Time Updates**: Instant rank progression notifications with visual celebrations and achievement tracking

### ⚡ Advanced Performance & Mobile Optimization
- **Adaptive Quality Engine**: Intelligent 4-tier optimization (Potato → Low → Medium → High) based on real-time device capabilities
- **Mobile-First Design**: Touch-optimized interface with proper touch targets, gesture recognition, and responsive scaling
- **Smart Rendering Fallback**: Automatic WebGL to Canvas fallback with comprehensive error recovery
- **Intelligent Asset Management**: Smart fallback system creates placeholder textures when assets are missing
- **Battery-Conscious Design**: Adaptive FPS limiting (30-60fps) and power-efficient rendering for mobile devices
- **Real-Time Performance Monitoring**: Live FPS tracking and automatic quality adjustment (F1/F2 shortcuts for developers)

## 🎮 Current Game Features

### 🎯 Complete Game Experience
- **Animated Splash Screen**: Beautiful loading experience with rotating elements and progress tracking
- **Main Menu**: Displays player rank badges, statistics, and progression tracking with PlayerStatsPanel
- **Map Selection**: Monthly featured map with theme information and rotation schedule
- **Interactive Game Scene**: Full-featured gameplay with three distinct modes (Creation, Guessing, Dashboard)
- **Leaderboard**: Global rankings showing top players with win rates and rank progression
- **Guess Scene**: Standalone interface for entering Game IDs and playing specific challenges

### 🗺️ Available Content & Smart Asset Management
- **Featured Map**: Mixed indoor/outdoor scene with strategic object placement
- **Six Interactive Objects**:
  - **Outdoor**: Pumpkin (veranda), Bush (field), Car (road), Truck (road)
  - **Indoor**: Wardrobe (hall), Guard (entrance)
- **Smart Asset Loading**: Automatically creates colored placeholder textures when assets are missing
- **Performance Optimization**: 4-tier quality system (Potato/Low/Medium/High) with automatic device detection
- **Responsive Design**: Adapts perfectly to mobile phones, tablets, and desktop computers

### 🎮 Three Distinct Game Modes

**🎮 Creation Mode (Hide Objects)**
- **Access**: Click "CREATE GAME" from main menu → Select map → Interactive game scene
- **Gameplay**: Click directly on any of the 6 objects to hide behind it
- **Visual Feedback**: Selected objects glow cyan with scale animations and position coordinates
- **Sharing**: "Post Game" dialog creates Reddit posts with embedded game instances
- **Position Tracking**: Normalized coordinates (0.000-1.000) ensure consistent placement across devices

**🔍 Guessing Mode (Find Hidden Objects)**
- **Access**: Click "GUESS GAME" and enter Game ID, or click Hide & Seek Reddit posts
- **Gameplay**: Click on objects to guess where someone is hiding
- **Feedback System**: 
  - ✅ Correct: Confetti celebration, object revelation, rank progression
  - ❌ Wrong: Distance feedback ("You were 32% away from the target")
- **Smart Validation**: Prevents multiple guesses, shows "Already Guessed" for repeat attempts
- **Creator Protection**: Game creators cannot guess on their own challenges

**👑 Dashboard Mode (View Analytics)**
- **Access**: Click "DASHBOARD" from main menu or view your Reddit posts as creator
- **Real-time Updates**: Auto-refreshes every 30 seconds with manual refresh option
- **Comprehensive Analytics**:
  - Total guesses, correct guesses, unique players
  - Success rate percentage and popular wrong guesses
  - Timestamps, player usernames, and guess statistics
- **Creator View**: Shows actual hidden object location with special cyan glow

### 🎯 Advanced Features

**Smart Environment Detection**
- **Standalone Mode**: Full game creation and sharing experience
- **Embedded Mode**: Streamlined gameplay within Reddit posts
- **Automatic Role Detection**: Adapts interface based on creator/guesser role
- **Context-Aware UI**: Different interactions and feedback for each mode

**Performance & Mobile Optimization**
- **WebGL/Canvas Fallback**: Automatic renderer selection based on device capabilities
- **Touch-Optimized Interface**: Proper touch targets and gesture recognition
- **Battery-Conscious Design**: Adaptive FPS limiting and power-efficient rendering
- **Responsive Scaling**: Maintains pixel-perfect accuracy across all screen sizes

**Social Integration Ready**
- **Reddit Integration**: Built for Devvit platform with post creation and embedding
- **Community Features**: Player rankings, statistics tracking, and social sharing
- **Real-time Analytics**: Live updates as players attempt your challenges

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

### Revolutionary Social Gaming Experience

Hide & Seek transforms the classic childhood game into a modern, social digital experience. Unlike traditional hidden object games where you search for predetermined items, this game lets **you create the challenges**. You become both the hider and the seeker, creating puzzles for others while solving challenges created by the community.

**The Innovation**: Instead of searching through cluttered scenes for tiny objects, players engage in strategic gameplay by choosing where to hide behind clearly visible, interactive objects. The challenge isn't finding something small and obscure—it's thinking like your opponent and predicting where they might choose to hide.

## 🎯 Complete Game Experience

### Complete Hide-and-Seek Experience

This is a **fully functional hide-and-seek game** where players can create challenges by clicking on objects to hide behind them, then share these challenges for others to solve. The game tracks precise positions using normalized coordinates and provides intelligent feedback.

**Core Gameplay Loop:**
1. **Create Mode**: Click any of 6 interactive objects (pumpkin, wardrobe, bush, car, truck, guard) to hide behind them
2. **Share Challenge**: Post your hiding spot as a Reddit challenge for others to find
3. **Guess Mode**: Other players try to find your hidden object by clicking on the same 6 objects positioned throughout the scene
4. **Get Feedback**: Distance-based hints and success celebrations with rank progression
5. **Stats Tracking**: Player statistics automatically update after each successful guess

### Three Distinct Game Modes

**🎮 Creation Mode (Hide Objects)**
- Complete game flow: Animated Splash Screen → Main Menu with Rank Display → Map Selection → Interactive Game Scene
- Direct object interaction: Click any object in the scene to hide behind it (no separate selector needed)
- Real-time position tracking with coordinate display and validation feedback
- "Post Game" dialog system for creating Reddit challenges with embedded game instances

**🔍 Guessing Mode (Find Hidden Objects)**
- GuessMode component creates 6 interactive objects at the same positions as creation mode for consistency
- Distance-based feedback system with Euclidean geometry calculations in normalized coordinate space
- Success celebrations with confetti particle effects and rank progression notifications
- Visual feedback with success markers (✅) and error markers (❌)
- Proximity feedback: "You were X% away from the target"
- Reveals the actual hidden object location upon successful guess
- Automatic stats refresh triggers after successful guesses to update player progression

**👑 Dashboard Mode (View Analytics)**
- GuessDashboard component showing comprehensive analytics with timestamps and accuracy data
- Real-time updates as players attempt your challenges via server integration
- Creator-only view of the actual hidden object location with special cyan glow effects
- Success rate tracking, popular guess locations, and engagement metrics
- Auto-refresh every 30 seconds with manual refresh button for real-time monitoring

### Advanced Technical Features

**Streamlined Gameplay**: This game features an intuitive "click-to-hide" mechanic where players simply click directly on objects in the scene to hide behind them. The MapLayer component handles all object interactions with immediate visual feedback through cyan glow effects and scale animations.

**Complete Game Flow**: Experience a full game journey from animated SplashScene with rotating loading elements → MainMenu with rank display → MapSelection → interactive Game scene. Each scene is built with Phaser.js and includes smooth transitions and responsive design.

**Intelligent Environment Detection**: The EnvironmentDetector service automatically detects whether the game is running in standalone mode or embedded within Reddit posts, adapting the interface accordingly. This dual-mode architecture provides optimal experiences for both content creators and players.

**Performance-First Design**: The PerformanceManager implements 4-tier quality optimization (Potato/Low/Medium/High) that automatically adjusts to device capabilities. Mobile users get battery-optimized rendering with adaptive FPS limiting, while desktop users enjoy full visual effects.

**Robust Fallback System**: The AssetOptimizer creates placeholder textures for missing assets and continues functioning seamlessly, ensuring the game works reliably even during development or with incomplete asset libraries.

**Real-time Statistics System**: The game features an event-driven statistics system where successful guesses automatically trigger stats updates across all scenes. The GuessMode component emits 'player-stats-updated' events that the MainMenu's PlayerStatsPanel listens for, ensuring player progression is immediately reflected throughout the game.

## 🎮 Game Mechanics Explained

### The Core Concept
This isn't about finding tiny hidden objects in cluttered scenes. Instead, it's about **strategic thinking and psychology**:

1. **As the Hider**: You choose one of 6 clearly visible objects (pumpkin, wardrobe, bush, car, truck, guard) to hide behind. Your challenge is to pick the object that others are least likely to guess first.

2. **As the Seeker**: You see the same 6 objects and must guess which one the hider chose. You get feedback on how close you were, making each guess a learning experience.

3. **The Strategy**: Success comes from understanding human psychology—where would someone choose to hide? What objects look most appealing? Which locations seem too obvious or too obscure?

### Why This Works
- **Clear Visual Design**: All interactive objects are clearly visible and distinctly styled with hover effects
- **Strategic Depth**: Limited choices (6 objects) create meaningful decisions rather than random searching  
- **Social Learning**: Each guess teaches you about how other players think and choose hiding spots
- **Immediate Feedback**: Distance-based hints help you improve your guessing strategy over time
- **Community Building**: Creating challenges for others builds engagement and social connection

### Technical Excellence
- **Pixel-Perfect Accuracy**: Uses normalized coordinates (0.000-1.000) for consistent gameplay across all devices
- **Responsive Design**: Automatically adapts to mobile phones, tablets, and desktop computers
- **Smart Performance**: 4-tier optimization system ensures smooth gameplay on any device
- **Reddit Integration**: Seamlessly works within Reddit's ecosystem for maximum social reach

### Object Locations & Strategy
**Outdoor Objects (Top half of map):**
- **Bush**: Hidden in the ground/field area (top-left) - Natural camouflage
- **Pumpkin**: Placed on the veranda/deck (top-center) - Seasonal and obvious
- **Car**: Parked on the road (top-right) - Common but expected
- **Truck**: Also on the road (top-right) - Larger, more noticeable

**Indoor Objects (Bottom half of map):**
- **Guard**: Standing at the hall entrance (bottom-center) - Human element, unpredictable
- **Wardrobe**: Located in the side hall (bottom-left) - Classic hiding spot, might be too obvious

**Strategic Considerations:**
- **Psychology**: What would most players choose first? Avoid the obvious.
- **Reverse Psychology**: Sometimes the most obvious choice is overlooked.
- **Location Balance**: Indoor vs outdoor preferences vary by player.
- **Object Size**: Larger objects (truck, wardrobe) vs smaller ones (pumpkin, bush).

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

- ✅ **Complete Scene System**: SplashScene with rotating loading animation, MainMenu with rank display, MapSelection, and Game scenes
- ✅ **Interactive Game Environment**: Demo scene with six interactive objects (pumpkin, wardrobe, bush, car, truck, guard)
- ✅ **Click-to-Hide Mechanics**: Direct object interaction with cyan glow effects (#00ADB5) and scale animations (1.1x on hover)
- ✅ **Advanced Position Tracking**: PositionTracker class with normalized coordinates (0.000-1.000) for device independence
- ✅ **Rank Progression System**: Four-tier ranking (Tyapu → GuessMaster → Detective → FBI) with visual progression tracking
- ✅ **Mobile Optimization**: Touch-optimized interface with responsive scaling and viewport height handling
- ✅ **Performance Management**: PerformanceManager with automatic quality adjustment and WebGL/Canvas fallback
- ✅ **Reddit Integration**: Devvit platform integration with PostGameManager for social gameplay
- ✅ **Multi-Mode Architecture**: Creation, guessing (GuessMode), and dashboard (GuessDashboard) modes with intelligent detection
- ✅ **Smart Asset Management**: AssetOptimizer with fallback texture creation and error recovery
- ✅ **Leaderboard System**: LeaderboardScene with scrollable rankings and player statistics
- ✅ **Guess Scene**: Standalone guessing interface with Game ID input and validation
- ✅ **Real-time Stats Updates**: Player statistics automatically refresh after successful guesses via event system
- ✅ **Comprehensive Analytics**: GuessDashboard shows total guesses, correct guesses, unique players, and success rates
- ✅ **Distance-based Feedback**: Proximity calculations show players how close they were to the target
- ✅ **Celebration Effects**: Confetti particles and visual celebrations for successful discoveries

### 🎮 Interactive Objects & Visual Design
- **Hidden Objects**: Pumpkin, Wardrobe, Bush, Car, Truck, Guard - each with unique visual characteristics and hover animations
- **Cohesive Design Language**: Carefully crafted dark theme palette (#222831, #393E46, #00ADB5, #EEEEEE) with semantic color mapping
- **Interactive System**: Click-to-discover mechanics with cyan glow effects (#00ADB5), scale animations, and selection feedback
- **Position Accuracy**: Sub-pixel precise placement using normalized coordinates (relX/relY from 0.000 to 1.000 range)
- **Visual Feedback**: Real-time coordinate display, distance calculations, success celebrations, and rank progression notifications
- **Fluid Animations**: Smooth scene transitions, object interactions, and success celebrations with particle effects

### 🗺️ Current Map & Objects

**Demo Scene**: The game currently features a demo environment with a mixed indoor/outdoor layout perfect for strategic hiding gameplay.

**Map Layout**: 
- **Top Half (Outdoor)**: Ground/field area, veranda/deck, and road with vehicles
- **Bottom Half (Indoor)**: Entrance hall and side rooms of a mansion-style building

**Interactive Objects**: Six distinct objects positioned strategically across both areas:
- **Bush** - Hidden in the ground/field area (outdoor, top-left)
- **Pumpkin** - Placed on the veranda/deck (outdoor, top-center)  
- **Car** - Parked on the road (outdoor, top-right)
- **Truck** - Also on the road area (outdoor, top-right)
- **Guard** - Standing at the hall entrance (indoor, bottom-center)
- **Wardrobe** - Located in the side hall (indoor, bottom-left)

**Smart Asset System**: The game intelligently creates fallback textures for all objects when assets are unavailable, ensuring smooth gameplay regardless of asset availability. Each fallback texture uses distinct colors and simple shapes to maintain visual clarity.

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

1. **Launch the Game**: Start from the animated splash screen featuring rotating loading elements and progress tracking
2. **Navigate Through Scenes**: Experience the complete game flow:
   - **Splash Screen**: Animated loading with rotating elements and progress bar
   - **Main Menu**: View your current rank badge and player statistics with progression tracking
   - **Map Selection**: Choose from available maps (currently features a demo scene with indoor/outdoor environment)
   - **Game Scene**: Interactive gameplay area with all hiding objects visible

3. **Hide Behind Objects**: In the game scene, simply click directly on any object to hide behind it
   - **Available Objects**: 6 strategically placed objects across the scene:
     - **Outdoor Area (Top)**: Bush (field area), Pumpkin (veranda), Car & Truck (road)
     - **Indoor Area (Bottom)**: Guard (entrance hall), Wardrobe (side hall)
   - **Visual Feedback**: Objects highlight with cyan glow effects (#00ADB5) when you hover over them
   - **Position Tracking**: The game tracks your exact placement using precise relative coordinates (0.000 to 1.000)
   - **Selection Confirmation**: Visual feedback includes selection rings, coordinate display, and position validation
   - **Success Message**: "Great hiding spot! You're hiding behind the [object]. Now create your challenge!"

4. **Share Your Challenge**: Click "📮 POST GAME" to open the post creation dialog and prepare your challenge for Reddit sharing

**Playing Someone's Challenge (Guessing Mode):**

1. **Access the Game**: Click "Launch App" on a Reddit hide-and-seek post (embedded mode automatically detected)
2. **Find the Hidden Object**: The game shows you which object to find (e.g., "🔍 Find the hidden pumpkin!")
3. **Click to Guess**: Click on the same 6 interactive objects positioned throughout the scene
4. **Get Feedback**: Receive immediate feedback with distance-based hints and proximity percentages
   - Success markers (✅) for correct guesses
   - Error markers (❌) for incorrect guesses  
   - Distance feedback: "You were X% away from the target"
5. **Celebrate Success**: Enjoy confetti effects, particle animations, and rank progression notifications
6. **Stats Update**: Your player statistics automatically refresh after each successful guess

**Creator Dashboard (Analytics Mode):**

- View comprehensive analytics of all guesses made on your challenges with timestamps
- See the actual hidden object location highlighted with special cyan glow effects
- Track success rates, popular guess locations, and engagement metrics
- Real-time updates as new players attempt your challenges
- Manual refresh functionality to see the latest attemptsdden object location with special glow effects (creator-only view)
- Track success rates, popular guess locations, and engagement metrics
- Real-time updates as players attempt your challenges
- Refresh dashboard to see new attempts

### 🎯 Game Mechanics Deep Dive

**The Revolutionary "Click-to-Hide" System:**
- **Direct Object Interaction**: Click directly on any object in the scene to hide behind it - no complex menus needed
- **Precise Position Tracking**: Uses normalized coordinates (0.000-1.000) for device-independent gameplay
- **Real-Time Visual Feedback**: Cyan glow effects, scale animations, and selection confirmation
- **Strategic Object Placement**: 6 interactive objects positioned across indoor/outdoor areas for varied gameplay

**Three Distinct Game Modes:**
- **Creation Mode**: Hide behind objects and create challenges for others
- **Guessing Mode**: Find hidden objects with distance-based feedback and celebrations
- **Dashboard Mode**: View analytics and statistics for your created challenges

**Advanced Features:**
- **Rank Progression System**: Four detective ranks with visual progression tracking
- **Performance Optimization**: Adaptive quality settings for smooth gameplay on all devices
- **Mobile-First Design**: Touch-optimized interface with responsive scaling
- **Reddit Integration**: Seamless posting and sharing of challenges within Reddit postsne to hide behind it - no complex menus or selectors needed
- **Streamlined Challenge Creation**: One-click hiding behind objects creates instant challenges ready for Reddit sharing
- **Intelligent Position Tracking**: Advanced system ensures pixel-perfect placement using normalized coordinates (0.000-1.000)
- **Real-Time Visual Feedback**: Cyan glow effects, coordinate display, and position validation provide immediate confirmation

**Three Distinct Game Modes:**
1. **Creation Mode**: Click objects to hide behind them, then share as Reddit challenges
2. **Guessing Mode**: Find hidden objects by clicking on randomly placed interactive objects
3. **Dashboard Mode**: View real-time analytics of all attempts on your challenges

**Advanced Position Tracking:**
- Uses normalized coordinate system (relX/relY from 0.000 to 1.000) for device independence
- Sub-pixel accuracy enabling exact object placement and sophisticated distance calculations
- Real-time position validation with coordinate display and comprehensive error handling
- Universal responsive scaling maintains pixel-perfect accuracy across all screen sizes

## 🎯 Game Innovation Summary

### What Makes This Game Special

**Revolutionary Simplicity**: Unlike traditional hidden object games that require complex menus or selection interfaces, Hide & Seek uses a revolutionary "click-to-hide" system. Players simply click directly on any object in the scene to hide behind it - no additional steps needed.

**Social Gaming Pioneer**: This is one of the first games designed specifically for Reddit's social ecosystem. Every hiding challenge becomes a viral Reddit post that can reach thousands of players, creating a community-driven content library.

**Technical Excellence**: The game features advanced position tracking with normalized coordinates, intelligent performance optimization, and seamless dual-mode architecture that works both as a standalone game and embedded Reddit experience.

**Complete Game Experience**: From animated splash screens to comprehensive analytics dashboards, this is a fully-featured game with professional-grade UI, responsive design, and sophisticated rank progression systems.

### Current Game Status: FULLY PLAYABLE

This is not a prototype or demo - it's a complete, functional hide-and-seek game ready for Reddit deployment. Players can:

✅ **Create Challenges**: Click objects to hide behind them with real-time position tracking  
✅ **Share on Reddit**: Automatic post creation with embedded game instances  
✅ **Play Challenges**: Find hidden objects with intelligent feedback and distance calculations  
✅ **Track Progress**: Comprehensive rank progression system with four detective ranks  
✅ **View Analytics**: Real-time dashboard showing all attempts on your challenges  
✅ **Mobile Optimized**: Touch-friendly interface with responsive scaling and performance optimizationne to hide behind it - no separate selection menus needed
- **Interactive Objects**: Six distinct objects positioned strategically across indoor/outdoor areas:
  - **Bush** (0.15, 0.25) - Ground/field area
  - **Pumpkin** (0.5, 0.28) - Veranda/deck area  
  - **Car** (0.75, 0.32) - Road area
  - **Truck** (0.85, 0.25) - Road area
  - **Guard** (0.5, 0.75) - Hall entrance
  - **Wardrobe** (0.2, 0.8) - Side hall
- **Instant Visual Feedback**: Objects highlight with signature cyan glow (#00ADB5) and scale animations (1.1x) on hover via MapLayer component
- **Precision Position Tracking**: Uses PositionTracker class with normalized coordinates (0.000-1.000) for perfect device-independent gameplay
- **Real-Time Validation**: Live coordinate display, position statistics, and comprehensive error handling with invalid position feedback

**Advanced Guessing System:**
- **Consistent Object Placement**: GuessMode component uses the same 6 fixed object positions as creation mode for fair gameplay
- **Distance-Based Feedback**: Sophisticated proximity detection using Euclidean geometry calculations in normalized coordinate space
- **Intelligent Hints**: Percentage-based proximity feedback with messages like "You were X% away from the target"
- **Success Celebrations**: Confetti particle effects, object revelation, and immediate rank progression updates via RankProgressionNotification
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
