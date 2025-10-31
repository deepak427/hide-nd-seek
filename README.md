# Hide & Seek - Interactive Object Finding Game

A social puzzle game built with Phaser.js for Reddit's Devvit platform. Create hiding challenges by clicking on objects in virtual scenes, then share them as interactive Reddit posts for others to solve!

## 🎮 What is Hide & Seek?

Hide & Seek is a digital version of the classic childhood game. Players create hiding challenges by clicking directly on objects in virtual environments, then share these challenges as Reddit posts. Other players must find the hidden objects by exploring the same scene and making guesses.

**Key Features:**
- **Simple Click-to-Hide**: Click any object in the scene to hide behind it
- **6 Interactive Objects**: Choose from Pumpkin, Bush, Car, Truck, Wardrobe, or Guard
- **Reddit Integration**: Share challenges as interactive Reddit posts
- **Smart Feedback**: Get distance-based hints when guessing
- **Mobile Optimized**: Responsive design works on all devices

## 🎮 How to Play

### 🫥 Creating a Challenge (Hide Mode)

1. **Start the Game**: Click "HIDE" from the main menu
2. **Choose Your Map**: Select from available themed maps (currently featuring October Halloween map)
3. **Pick Your Hiding Spot**: Click directly on any of the 6 interactive objects:
   - **🎃 Pumpkin** - Outdoor veranda decoration
   - **🌿 Bush** - Natural field camouflage  
   - **🚗 Car** - Road vehicle
   - **🚛 Truck** - Larger road vehicle
   - **🚪 Wardrobe** - Indoor hall furniture
   - **👮 Guard** - Human figure at entrance
4. **Share Your Challenge**: Click "POST GAME" to create a Reddit post with your challenge
5. **Get Your Game ID**: Share the 5-character Game ID with others

### 🔍 Playing a Challenge (Guess Mode)

1. **Access the Game**: 
   - Click "GUESS" from main menu and enter a Game ID
   - Or click "Launch App" on a Reddit hide-and-seek post
2. **Find the Hidden Object**: Look for the instruction "Find the hidden object!"
3. **Make Your Guess**: Click on objects throughout the scene
4. **Get Feedback**: 
   - ✅ **Correct**: Celebration effects and confetti!
   - ❌ **Wrong**: Distance hint showing how close you were
5. **Improve Your Rank**: Successful guesses advance your detective rank

### 📊 Viewing Results (Dashboard Mode)

1. **Check Your Challenges**: Enter your Game ID in the dashboard
2. **See All Attempts**: View everyone who tried to find your hidden object
3. **Track Success Rates**: Monitor how challenging your hiding spots are
4. **Real-time Updates**: Watch new guesses appear as players discover your challenges

## 🌟 Game Features

- **Simple Gameplay**: One-click hiding system - just click any object to hide behind it
- **Social Integration**: Share challenges as interactive Reddit posts
- **Smart Feedback**: Distance-based hints help players improve their guessing
- **Rank Progression**: Advance through detective ranks as you succeed
- **Mobile Optimized**: Responsive design works perfectly on phones and tablets
- **Real-time Analytics**: Track how players perform on your challenges

## �️ mDevelopment

### Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Deploy to Reddit
npm run deploy
```

### Project Structure
```
src/
├── client/          # Frontend Phaser.js game
│   ├── game/        # Game scenes and components
│   ├── style/       # CSS and theme files
│   └── main.ts      # Entry point
├── server/          # Express.js backend
│   └── index.ts     # API endpoints
└── shared/          # Shared types and utilities
```

## 🛠️ Technology Stack

- **[Devvit](https://developers.reddit.com/)**: Reddit's developer platform
- **[Phaser.js](https://phaser.io/)**: 2D game engine with WebGL/Canvas rendering
- **[TypeScript](https://www.typescriptlang.org/)**: Full type safety across client and server
- **[Vite](https://vitejs.dev/)**: Modern build tool with hot module replacement
- **[Express.js](https://expressjs.com/)**: Server-side HTTP framework for API endpoints

## 📝 License

This project is licensed under the BSD-3-Clause License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

This is a Reddit Devvit application. To contribute:

1. Set up the Devvit development environment
2. Clone this repository
3. Run `npm install` to install dependencies
4. Use `npm run dev` to start the development server
5. Test your changes using the Devvit playtest environment

For more information about Devvit development, visit the [official documentation](https://developers.reddit.com/).