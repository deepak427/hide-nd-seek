# Requirements Document

## Introduction

Hide & Seek is a Reddit-integrated game that recreates the nostalgic joy of hide-and-seek in a digital format. Players can hide on virtual maps and create subreddit challenges with riddles or clues for others to find them. The game features a progression system, monthly rotating maps, and community-driven gameplay that encourages creativity and problem-solving.

## Glossary

- **Hide_And_Seek_System**: The complete game application running on Reddit via Devvit
- **Virtual_Map**: Interactive game map where players can select hiding locations
- **Hide_Challenge**: A subreddit post created by a hider containing location clues
- **Hider**: A player who selects a hiding location and creates challenges
- **Seeker**: A player who attempts to find hidden locations using provided clues
- **Rank_System**: Progressive player classification based on success rate and total finds
- **Monthly_Map**: New map released each month to keep gameplay fresh
- **Hint_System**: Clue mechanism allowing hiders to provide riddles or hints

## Requirements

### Requirement 1

**User Story:** As a player, I want to select a hiding location on a virtual map, so that I can create challenges for other players to solve

#### Acceptance Criteria

1. WHEN a player accesses the game, THE Hide_And_Seek_System SHALL display an interactive Virtual_Map
2. WHEN a player clicks on a location on the Virtual_Map, THE Hide_And_Seek_System SHALL allow selection of that location as a hiding spot
3. THE Hide_And_Seek_System SHALL provide visual feedback when a location is selected
4. THE Hide_And_Seek_System SHALL prevent selection of invalid or restricted areas on the Virtual_Map
5. WHEN a hiding location is confirmed, THE Hide_And_Seek_System SHALL proceed to the challenge creation interface

### Requirement 2

**User Story:** As a hider, I want to create a subreddit challenge with hints and riddles, so that seekers have clues to find my hiding location

#### Acceptance Criteria

1. WHEN a hider confirms their location, THE Hide_And_Seek_System SHALL display a challenge creation interface
2. THE Hide_And_Seek_System SHALL allow hiders to input custom hints, riddles, or clues
3. THE Hide_And_Seek_System SHALL provide hint templates and suggestions to assist hiders
4. WHEN a challenge is created, THE Hide_And_Seek_System SHALL generate a subreddit post containing the Hide_Challenge
5. THE Hide_And_Seek_System SHALL include the hider's current rank and challenge difficulty in the post

### Requirement 3

**User Story:** As a seeker, I want to view available hide challenges and submit location guesses, so that I can participate in finding hidden players

#### Acceptance Criteria

1. THE Hide_And_Seek_System SHALL display a list of active Hide_Challenge posts
2. WHEN a seeker selects a challenge, THE Hide_And_Seek_System SHALL show the Virtual_Map with the provided hints
3. THE Hide_And_Seek_System SHALL allow seekers to click on the Virtual_Map to submit location guesses
4. WHEN a guess is submitted, THE Hide_And_Seek_System SHALL validate the guess against the actual hiding location
5. THE Hide_And_Seek_System SHALL provide immediate feedback on guess accuracy with distance indicators

### Requirement 4

**User Story:** As a player, I want to progress through ranks based on my performance, so that I can track my improvement and status in the community

#### Acceptance Criteria

1. THE Hide_And_Seek_System SHALL implement four rank levels: Tyapu, GuessMaster, Detective, and FBI
2. WHEN a seeker successfully finds a location, THE Hide_And_Seek_System SHALL update their success statistics
3. THE Hide_And_Seek_System SHALL calculate rank progression based on success percentage and total number of finds
4. WHEN rank criteria are met, THE Hide_And_Seek_System SHALL promote the player to the next rank level
5. THE Hide_And_Seek_System SHALL display current rank and progress indicators in the player interface

### Requirement 5

**User Story:** As a player, I want to experience new maps monthly, so that the game remains fresh and challenging

#### Acceptance Criteria

1. THE Hide_And_Seek_System SHALL release a new Monthly_Map on the first day of each month
2. WHEN a new Monthly_Map is released, THE Hide_And_Seek_System SHALL archive challenges from the previous map
3. THE Hide_And_Seek_System SHALL notify players when a new Monthly_Map becomes available
4. THE Hide_And_Seek_System SHALL maintain historical statistics across different Monthly_Map periods
5. THE Hide_And_Seek_System SHALL ensure each Monthly_Map offers unique locations and gameplay opportunities

### Requirement 6

**User Story:** As a player, I want an attractive and intuitive game interface, so that I can enjoy a visually appealing gaming experience

#### Acceptance Criteria

1. THE Hide_And_Seek_System SHALL implement the specified color palette: #222831, #393E46, #00ADB5, #EEEEEE
2. THE Hide_And_Seek_System SHALL display a creative loading animation using the provided sprite sheet assets
3. THE Hide_And_Seek_System SHALL provide smooth transitions between game screens and interactions
4. THE Hide_And_Seek_System SHALL ensure responsive design that works on both desktop and mobile devices
5. THE Hide_And_Seek_System SHALL maintain consistent visual styling throughout all game interfaces

### Requirement 7

**User Story:** As a player, I want to create Reddit posts with embedded games, so that I can share my hiding challenges with the Reddit community

#### Acceptance Criteria

1. WHEN playing the full game, THE Hide_And_Seek_System SHALL display a "Post Game" button instead of a "Share" button
2. WHEN the "Post Game" button is clicked, THE Hide_And_Seek_System SHALL send a POST request to /api/create-post with mapKey, objectKey, relX, and relY
3. THE Hide_And_Seek_System SHALL generate a unique gameId and store game data in Redis
4. THE Hide_And_Seek_System SHALL create a Reddit post with the embedded Devvit app
5. THE Hide_And_Seek_System SHALL return the post URL and gameId to display a success popup

### Requirement 8

**User Story:** As a Reddit user, I want to play embedded hide-and-seek games directly in Reddit posts, so that I can participate without leaving the platform

#### Acceptance Criteria

1. WHEN loading an embedded game, THE Hide_And_Seek_System SHALL skip splash and menu screens and jump directly to the game scene
2. THE Hide_And_Seek_System SHALL call /api/init to retrieve gameId based on the Reddit post context
3. IF the current user is the game creator, THE Hide_And_Seek_System SHALL display a "Guesses Dashboard" showing all player guesses
4. IF the current user is not the creator, THE Hide_And_Seek_System SHALL display "Guess Mode" with interactive objects
5. WHEN a guess is made, THE Hide_And_Seek_System SHALL store the guess in Redis and show success/failure feedback

### Requirement 9

**User Story:** As a game creator, I want to view all guesses made on my hiding challenge, so that I can see who found my location and their accuracy

#### Acceptance Criteria

1. THE Hide_And_Seek_System SHALL provide a /api/guesses endpoint that returns all guesses for a specific game
2. WHEN the creator views their embedded game, THE Hide_And_Seek_System SHALL display a dashboard listing all player guesses
3. THE Hide_And_Seek_System SHALL show which objects players guessed and their relative positions
4. THE Hide_And_Seek_System SHALL indicate successful and unsuccessful guesses with visual feedback
5. THE Hide_And_Seek_System SHALL update the dashboard in real-time as new guesses are submitted

### Requirement 10

**User Story:** As a Reddit user, I want the game to integrate seamlessly with Reddit, so that I can play without leaving the platform

#### Acceptance Criteria

1. THE Hide_And_Seek_System SHALL run within Reddit posts using the Devvit platform
2. THE Hide_And_Seek_System SHALL automatically authenticate players using their Reddit accounts via context.user
3. THE Hide_And_Seek_System SHALL detect the environment and load appropriate game modes (full vs embedded)
4. THE Hide_And_Seek_System SHALL use context.postId to identify specific game instances
5. THE Hide_And_Seek_System SHALL store all game data and player interactions using Devvit's Redis capabilities