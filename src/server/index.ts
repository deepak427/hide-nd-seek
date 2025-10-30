import express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { 
  InitResponse, 
  CreatePostRequest, 
  CreatePostResponse,
  SubmitGuessRequest,
  SubmitGuessResponse,
  GetGuessesResponse
} from '../shared/types/api';
import { createServer, context, reddit } from '@devvit/web/server';
import { createPost } from './core/post';
import { saveHidingSpot, getGameLeaderboard } from './core/storage';
import { RedditIntegrationService } from './core/RedditIntegrationService';
import { PlayerService } from './core/PlayerService';
import { RankService } from '../shared/services/RankService';

import { MapManager } from './core/mapManager';
import { 
  ErrorHandlingService, 
  AuthorizationError,
  NotFoundError,
  Validators
} from './core/ErrorHandlingService';
import { redditAuth } from './core/RedditAuthService';
import { dataAccess } from './core/DataAccessLayer';
import { media } from '@devvit/media';
import { v4 as uuidv4 } from 'uuid';
import { loadConfig } from '../shared/config/environment';

// Initialize configuration system
const config = loadConfig();
console.log('Configuration loaded: Basic config loaded');

const app = express();

// Storage system initializes automatically within request context in Devvit
console.log('Storage system ready for requests');

// Middleware for request logging and ID generation
app.use(ErrorHandlingService.requestLogger);

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

// GET /api/init - Initialize embedded game
router.get('/api/init', ErrorHandlingService.asyncHandler(async (_req, res): Promise<void> => {
  const { postId } = context;

  if (!postId) {
    throw new NotFoundError('postId is required but missing from context');
  }

  // Authenticate user using Reddit auth service
  const authResult = await redditAuth.authenticateUser();
  const { user, playerProfile } = authResult;

  // Get game session by postId using data access layer
  const gameSession = await dataAccess.getGameByPostId(postId);
  
  if (!gameSession) {
    throw new NotFoundError(`Game session not found for post ${postId}`);
  }

  // Determine user role
  const userRole = gameSession.creator === user.id ? 'creator' : 'guesser';
  
  const response: InitResponse = {
    gameId: gameSession.gameId,
    mapKey: gameSession.mapKey,
    userRole
  };

  // Only include hiding spot for creator
  if (userRole === 'creator') {
    response.hidingSpot = gameSession.hidingSpot;
  }

  // Include player profile information
  response.playerProfile = {
    rank: playerProfile.rank,
    totalGuesses: playerProfile.totalGuesses,
    successfulGuesses: playerProfile.successfulGuesses,
    successRate: playerProfile.successRate
  };

  res.json(response);
}));

// POST /api/create-post - Create new game and Reddit post
router.post('/api/create-post', ErrorHandlingService.asyncHandler(async (req, res): Promise<void> => {
  // Authenticate user using Reddit auth service
  const authResult = await redditAuth.authenticateUser();
  const { user } = authResult;

  const { mapKey, objectKey, relX, relY }: CreatePostRequest = req.body;

  // Validate input using centralized validators
  ErrorHandlingService.validateRequired(req.body, ['mapKey', 'objectKey', 'relX', 'relY']);
  Validators.mapKey(mapKey);
  Validators.objectKey(objectKey);
  Validators.coordinates(relX, relY);

  // Generate unique game ID
  const gameId = uuidv4();

  // Create Reddit post first
  const postResponse = await RedditIntegrationService.createGamePost({
    gameId,
    mapKey,
    objectKey
  });

  // Extract post ID from URL
  const postIdMatch = postResponse.postUrl.match(/\/comments\/([a-zA-Z0-9]+)\//);
  const postId = postIdMatch ? postIdMatch[1] : undefined;

  // Create game session using data access layer
  const gameCreated = await dataAccess.createGame(
    gameId,
    user.id,
    mapKey,
    { objectKey, relX, relY },
    postId,
    postResponse.postUrl
  );

  if (!gameCreated) {
    throw new Error('Failed to create game session');
  }

  const response: CreatePostResponse = {
    success: true,
    postUrl: postResponse.postUrl,
    gameId
  };

  res.json(response);
}));

// Legacy endpoint for backward compatibility
router.post('/api/share', async (req, res): Promise<void> => {
  const { imageData, challengeData } = req.body;
  if (!imageData || !challengeData) {
    res.status(400).json({ error: 'imageData and challengeData are required.' });
    return;
  }

  try {
    const { subredditName } = context;
    if (!subredditName) {
      throw new Error('subredditName is required');
    }

    const gameId = uuidv4();
    await saveHidingSpot(gameId, challengeData);

    const mediaAsset = await media.upload({
      url: imageData,
      type: 'image',
    });

    const post = await reddit.submitPost({
      subredditName,
      title: `🔍 Hide & Seek Challenge - Can you find the hidden ${challengeData.objectKey} in ${challengeData.mapKey}?`,
      url: mediaAsset.mediaUrl,
    });

    res.json({
      success: true,
      postUrl: `https://www.reddit.com${post.permalink}`,
      gameId
    });
  } catch (error) {
    console.error('Error sharing post:', error);
    res.status(500).json({ error: 'Failed to share post.' });
  }
});

// POST /api/guess - Submit a guess
router.post('/api/guess', ErrorHandlingService.asyncHandler(async (req, res): Promise<void> => {
  // Authenticate user using Reddit auth service
  const authResult = await redditAuth.authenticateUser();
  const { user } = authResult;

  const { gameId, objectKey, relX, relY }: SubmitGuessRequest = req.body;

  // Validate input using centralized validators
  ErrorHandlingService.validateRequired(req.body, ['gameId', 'objectKey', 'relX', 'relY']);
  Validators.gameId(gameId);
  Validators.objectKey(objectKey);
  Validators.coordinates(relX, relY);

  // Get game session using data access layer
  const gameSession = await dataAccess.getGame(gameId);
  if (!gameSession) {
    throw new NotFoundError('Game not found');
  }

  // Record the guess using data access layer
  const guessData = await dataAccess.recordGuess(
    gameId,
    user.id,
    user.username,
    objectKey,
    relX,
    relY,
    gameSession.hidingSpot
  );

  // Prepare response
  let message = '';
  if (guessData.isCorrect) {
    message = `Correct! You found the ${gameSession.hidingSpot.objectKey}!`;
  } else if (objectKey === gameSession.hidingSpot.objectKey) {
    message = `Right object, but not quite the right spot. Distance: ${Math.round(guessData.distance * 100)}%`;
  } else {
    message = `Not quite! The hidden object is a ${gameSession.hidingSpot.objectKey}.`;
  }

  // Get updated player stats for rank progression info
  let rankProgression = undefined;
  try {
    const playerStats = await PlayerService.getPlayerStats(user.id);
    const progressPercentage = RankService.calculateProgressPercentage(playerStats.profile);
    
    rankProgression = {
      currentRank: playerStats.profile.rank,
      progressPercentage,
      nextRank: playerStats.progression.nextRank,
      totalGuesses: playerStats.profile.totalGuesses,
      successfulGuesses: playerStats.profile.successfulGuesses,
      successRate: Math.round(playerStats.profile.successRate * 100)
    };
  } catch (error) {
    console.warn('Could not fetch rank progression info:', error);
  }

  const response: SubmitGuessResponse = {
    success: true,
    isCorrect: guessData.isCorrect,
    message,
    distance: Math.round(guessData.distance * 100),
    ...(rankProgression && { rankProgression })
  };

  res.json(response);
}));

// GET /api/game/:gameId - Get game data by gameId
router.get('/api/game/:gameId', ErrorHandlingService.asyncHandler(async (req, res): Promise<void> => {
  const { gameId } = req.params;
  
  // Validate gameId
  Validators.gameId(gameId);
  
  // Get game session using data access layer
  const gameSession = await dataAccess.getGame(gameId);
  
  if (!gameSession) {
    throw new NotFoundError(`Game not found: ${gameId}`);
  }
  
  // Return game data (hiding spot is included for guessing)
  const response = {
    gameId: gameSession.gameId,
    mapKey: gameSession.mapKey,
    hidingSpot: gameSession.hidingSpot,
    creator: gameSession.creator,
    createdAt: gameSession.createdAt
  };
  
  res.json(response);
}));

// GET /api/guesses - Get all guesses for a game (creator only)
router.get('/api/guesses', ErrorHandlingService.asyncHandler(async (req, res): Promise<void> => {
  // Authenticate user using Reddit auth service
  const authResult = await redditAuth.authenticateUser();
  const { user } = authResult;

  const { gameId } = req.query;

  if (!gameId || typeof gameId !== 'string') {
    throw new NotFoundError('gameId query parameter is required');
  }

  Validators.gameId(gameId);

  // Check authorization using Reddit auth service
  const authorized = await redditAuth.checkAuthorization(user.id, 'view_guesses', gameId);
  if (!authorized) {
    throw new AuthorizationError('Only the game creator can view guesses');
  }

  // Get guesses and statistics using data access layer
  const guesses = await dataAccess.getGameGuesses(gameId);
  const stats = await dataAccess.getGuessStatistics(gameId);

  const response: GetGuessesResponse = {
    guesses,
    totalGuesses: stats.totalGuesses,
    correctGuesses: stats.correctGuesses
  };

  res.json(response);
}));

// GET /api/player - Get current player profile and statistics
router.get('/api/player', ErrorHandlingService.asyncHandler(async (_req, res): Promise<void> => {
  // Authenticate user using Reddit auth service
  const authResult = await redditAuth.authenticateUser();
  const { user } = authResult;

  const playerStats = await PlayerService.getPlayerStats(user.id);

  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      isAuthenticated: user.isAuthenticated,
      isModerator: user.isModerator
    },
    ...playerStats
  });
}));

// GET /api/player/stats - Get detailed player statistics
router.get('/api/player/stats', ErrorHandlingService.asyncHandler(async (_req, res): Promise<void> => {
  // Authenticate user using Reddit auth service
  const authResult = await redditAuth.authenticateUser();
  const { user } = authResult;

  const playerStats = await PlayerService.getPlayerStats(user.id);

  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      isAuthenticated: user.isAuthenticated,
      isModerator: user.isModerator
    },
    profile: playerStats.profile,
    progression: playerStats.progression,
    displayInfo: playerStats.displayInfo,
    progressPercentage: RankService.calculateProgressPercentage(playerStats.profile)
  });
}));

// POST /api/player/recalculate - Recalculate player statistics (admin/debug)
router.post('/api/player/recalculate', ErrorHandlingService.asyncHandler(async (_req, res): Promise<void> => {
  // Authenticate user using Reddit auth service
  const authResult = await redditAuth.authenticateUser();
  const { user } = authResult;

  const updatedProfile = await PlayerService.recalculatePlayerStats(user.id);

  res.json({
    success: true,
    message: 'Player statistics recalculated',
    profile: updatedProfile
  });
}));

// GET /api/auth/user - Get current authenticated user
router.get('/api/auth/user', ErrorHandlingService.asyncHandler(async (_req, res): Promise<void> => {
  const authResult = await redditAuth.authenticateUser();

  res.json({
    success: true,
    user: authResult.user,
    session: {
      sessionId: authResult.session.sessionId,
      expiresAt: authResult.session.expiresAt
    },
    playerProfile: authResult.playerProfile,
    isNewUser: authResult.isNewUser
  });
}));

// POST /api/auth/check - Check authorization for specific action
router.post('/api/auth/check', ErrorHandlingService.asyncHandler(async (req, res): Promise<void> => {
  const authResult = await redditAuth.authenticateUser();
  const { action, resourceId } = req.body;

  if (!action) {
    throw new Error('Action is required');
  }

  const authorized = await redditAuth.checkAuthorization(authResult.user.id, action, resourceId);

  res.json({
    success: true,
    authorized,
    message: authorized ? 'Authorized' : 'Not authorized for this action'
  });
}));

// POST /api/auth/logout - Logout user (delete sessions)
router.post('/api/auth/logout', ErrorHandlingService.asyncHandler(async (_req, res): Promise<void> => {
  const authResult = await redditAuth.authenticateUser();
  
  const loggedOut = await redditAuth.logoutUser(authResult.user.id);

  res.json({
    success: loggedOut,
    message: loggedOut ? 'Successfully logged out' : 'Logout failed'
  });
}));

// GET /api/map - Get current monthly map and rotation info
router.get('/api/map', ErrorHandlingService.asyncHandler(async (_req, res): Promise<void> => {
  const mapManager = MapManager.getInstance();
  const rotation = mapManager.getCurrentRotation();
  
  res.json({
    success: true,
    currentMap: rotation.currentMap,
    rotation
  });
}));

// GET /api/map/rotation - Get detailed rotation information
router.get('/api/map/rotation', ErrorHandlingService.asyncHandler(async (_req, res): Promise<void> => {
  const mapManager = MapManager.getInstance();
  const rotation = mapManager.getCurrentRotation();
  
  res.json({
    success: true,
    rotation
  });
}));

// GET /api/map/:mapKey - Get specific map data
router.get('/api/map/:mapKey', ErrorHandlingService.asyncHandler(async (req, res): Promise<void> => {
  const { mapKey } = req.params;
  
  if (!mapKey) {
    throw new NotFoundError('mapKey parameter is required');
  }

  Validators.mapKey(mapKey);

  const mapManager = MapManager.getInstance();
  const mapData = mapManager.getMap(mapKey);
  
  if (!mapData) {
    throw new NotFoundError(`Map '${mapKey}' not found`);
  }

  res.json({
    success: true,
    map: mapData
  });
}));

// GET /api/maps - Get all available maps
router.get('/api/maps', ErrorHandlingService.asyncHandler(async (_req, res): Promise<void> => {
  const mapManager = MapManager.getInstance();
  const maps = mapManager.getAllMaps();
  
  res.json({
    success: true,
    maps,
    total: maps.length
  });
}));

// GET /api/map/stats - Get map system statistics
router.get('/api/map/stats', ErrorHandlingService.asyncHandler(async (_req, res): Promise<void> => {
  const mapManager = MapManager.getInstance();
  const stats = mapManager.getStats();
  
  res.json({
    success: true,
    stats
  });
}));

// Legacy endpoint for backward compatibility
router.get('/api/leaderboard/:gameId', async (req, res): Promise<void> => {
  const { gameId } = req.params;
  
  try {
    const leaderboard = await getGameLeaderboard(gameId);
    res.json({ success: true, leaderboard });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ error: 'Failed to get leaderboard.' });
  }
});

router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

// Administrative endpoints removed for Devvit compatibility
// Storage operations must be called within request context

// Health check endpoint
router.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Ping endpoint for connectivity checks
router.head('/api/ping', (_req, res) => {
  res.status(200).end();
});

// Serve game with embedded data for Reddit posts
router.get('/game/:gameId', ErrorHandlingService.asyncHandler(async (req, res): Promise<void> => {
  const { gameId } = req.params;
  
  try {
    // Get game data
    const gameSession = await dataAccess.getGame(gameId);
    
    if (!gameSession) {
      // Redirect to main game if game not found
      res.redirect('/');
      return;
    }
    
    // Read the HTML template
    const htmlPath = path.join(__dirname, '../client/index.html');
    let html = fs.readFileSync(htmlPath, 'utf8');
    
    // Determine user role - need to authenticate user first
    const authResult = await redditAuth.authenticateUser();
    const { user } = authResult;
    const userRole = gameSession.creator === user.id ? 'creator' : 'guesser';
    const mode = userRole === 'creator' ? 'dashboard' : 'guessing';
    
    // Inject game data into the HTML
    const gameData = {
      gameId: gameSession.gameId,
      mapKey: gameSession.mapKey,
      objectKey: gameSession.hidingSpot.objectKey,
      mode: mode,
      userRole: userRole,
      // Include hiding spot for creator (for dashboard view)
      ...(userRole === 'creator' && { 
        hidingSpot: {
          objectKey: gameSession.hidingSpot.objectKey,
          relX: gameSession.hidingSpot.relX,
          relY: gameSession.hidingSpot.relY
        }
      })
    };
    
    // Replace the empty postData script with actual data
    console.log('🔧 SERVER: Attempting to inject game data:', gameData);
    const originalHtml = html;
    html = html.replace(
      /<script id="post-data" type="application\/json">\s*\{\}\s*<\/script>/,
      `<script id="post-data" type="application/json">\n      ${JSON.stringify(gameData, null, 2)}\n    </script>`
    );
    
    // Check if replacement worked
    if (html === originalHtml) {
      console.error('❌ SERVER: HTML replacement failed - script tag not found or not replaced');
      console.log('🔍 SERVER: Looking for script tag in HTML...');
      const scriptMatch = html.match(/<script id="post-data"[^>]*>[\s\S]*?<\/script>/);
      console.log('🔍 SERVER: Found script tag:', scriptMatch ? scriptMatch[0] : 'NOT FOUND');
    } else {
      console.log('✅ SERVER: HTML replacement successful');
    }
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error serving game:', error);
    res.redirect('/');
  }
}));

// Use router middleware
app.use(router);

// Error handling middleware (must be last)
app.use(ErrorHandlingService.errorHandler);

// Get port from configuration
const port = config.server.port;

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port, () => console.log(`http://localhost:${port}`));

// Graceful shutdown handling (simplified for Devvit)
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
