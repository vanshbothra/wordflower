# WordFlower - Advanced Word Game with Analytics

WordFlower is a sophisticated spelling bee-style word game built with Next.js, featuring comprehensive analytics tracking, user persistence, and intelligent game state management. Players create words using a central letter and surrounding letters, with detailed analytics collected throughout the gameplay experience.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables (see Environment Setup)
cp .env.example .env.local

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to start playing.

## 🏗️ Architecture Overview

### Technology Stack
- **Frontend**: Next.js 15 with React 19, TypeScript
- **Database**: MongoDB Atlas with native MongoDB driver
- **Styling**: TailwindCSS with Radix UI components
- **Notifications**: Sonner toast system
- **State Management**: React useState/useEffect with localStorage persistence

### Project Structure
```
src/
├── app/
│   ├── page.tsx                 # Main game component with state management
│   ├── layout.tsx               # Root layout with providers
│   ├── globals.css              # Global styles
│   └── api/
│       ├── analytics/           # Analytics API endpoints
│       ├── game/                # Game data API
│       └── hint/                # Hint system API (disabled)
├── components/
│   ├── flower.tsx               # Interactive letter flower UI
│   ├── word-display.tsx         # Current word input display
│   ├── found-words-list.tsx     # List of discovered words
│   ├── foundWordsAccordion.tsx  # Collapsible found words
│   ├── hint-system.tsx          # Hint functionality (commented out)
│   └── ui/                      # Reusable UI components
├── lib/
│   ├── mongodb.ts               # Database connection utilities
│   ├── word-data.ts             # Word validation and game data
│   ├── mw-api.ts                # Merriam-Webster API integration
│   └── utils.ts                 # Utility functions
├── hooks/
│   ├── use-media-query.ts       # Responsive design hook
│   └── use-isomorphic-layout-effect.tsx
└── data/
    └── WordData.json            # Static word datasets
```

## 🎮 Game States & Flow

### Game State Machine
The game operates through three primary states with detailed transitions:

```typescript
type GameState = 'not-started' | 'playing' | 'ended'
```

#### 1. Not Started (`not-started`)
- **Description**: Initial state when game loads or after reset
- **UI Elements**: Start Game modal with game instructions
- **Available Actions**: Start Game, Load Previous Game (if available)
- **Analytics**: No events logged in this state
- **Persistence**: Previous game data loaded from localStorage if available

#### 2. Playing (`playing`)
- **Description**: Active gameplay state with timer running
- **UI Elements**: 
  - Interactive letter flower for word construction
  - Current word display with input validation
  - Found words list with scoring
  - Active timer with tab visibility detection
  - Shuffle letters button
  - Submit word functionality
- **Available Actions**: 
  - Submit words, shuffle letters, view found words
  - Game auto-saves every 30 seconds
  - Analytics logged for all user interactions
- **Timer Behavior**: 
  - Increments every second
  - Pauses when tab becomes inactive
  - Resumes when tab regains focus
  - Tracks total active play time

#### 3. Ended (`ended`)
- **Description**: Game completion state with final statistics
- **UI Elements**: End Game modal showing comprehensive statistics
- **Available Actions**: Start New Game, Review Statistics
- **Analytics**: Final game summary logged with complete metrics
- **Persistence**: Final game state saved permanently

### State Transitions

```mermaid
graph LR
    A[not-started] -->|Start Game| B[playing]
    B -->|End Game| C[ended]
    C -->|New Game| A
    A -->|Load Game| B
    B -->|Reset| A
```

## 📊 Analytics System

### Overview
The analytics system provides comprehensive tracking of user behavior and game performance using a hierarchical user-based data structure in MongoDB Atlas.

### Data Architecture

#### User Analytics Document Structure
```typescript
interface UserAnalytics {
  userId: string              // Unique user identifier (localStorage persistent)
  createdAt: Date            // User first seen timestamp
  updatedAt: Date            // Last activity timestamp
  gameSessions: GameSession[] // Array of all game sessions
}
```

#### Game Session Structure
```typescript
interface GameSession {
  gameId: string             // Unique game identifier
  createdAt: Date           // Game start timestamp
  updatedAt: Date           // Last game activity
  events: AnalyticsEvent[]  // Chronological event log
  gameMetadata?: {          // Game summary statistics
    totalWords?: number     // Target word count for puzzle
    wordsFound?: number     // Words discovered by player
    totalTime?: number      // Total active play time (seconds)
    gameState?: string      // Final game state
  }
}
```

#### Analytics Event Structure
```typescript
interface AnalyticsEvent {
  gameId: string            // Game session identifier
  eventType: string         // Event category (see Event Types)
  eventData: any           // Event-specific payload
  timestamp: Date          // Precise event occurrence time
}
```

### Event Types & Data Payloads

#### Game Lifecycle Events

**1. `game_started`**
```typescript
{
  gameId: string,
  centerLetter: string,      // Central required letter
  outerLetters: string[],    // Available surrounding letters
  totalWords: number,        // Total possible words in puzzle
  pangramCount: number       // Number of pangrams (words using all letters)
}
```

**2. `game_ended`**
```typescript
{
  gameId: string,
  finalScore: {
    wordsFound: number,      // Words successfully discovered
    totalWords: number,      // Total possible words
    completionRate: number   // Percentage completed (0-100)
  },
  totalTime: number,         // Total active play time in seconds
  endReason: string         // "manual" | "completion" | "timeout"
}
```

**3. `game_resumed`**
```typescript
{
  gameId: string,
  resumedAt: number,        // Timer value at resume
  wordsFound: number,       // Words found in previous session
  timePlayed: number        // Previous session duration
}
```

#### User Interaction Events

**4. `word_found`**
```typescript
{
  word: string,             // Successfully submitted word
  letterCount: number,      // Length of word
  isPangram: boolean,       // Uses all available letters
  timeToFind: number,       // Seconds since game start
  wordsFoundSoFar: number,  // Total words found including this one
  isFirstTime: boolean      // First discovery of this word
}
```

**5. `word_submission_failed`**
```typescript
{
  word: string,             // Attempted word
  reason: string,           // Failure cause:
                           // "too_short" - Less than 4 letters
                           // "missing_center" - Doesn't use center letter
                           // "invalid_letters" - Uses unavailable letters
                           // "already_found" - Previously discovered
                           // "not_in_dictionary" - Invalid word
  currentTimer: number      // Time when attempt was made
}
```

**6. `letters_shuffled`**
```typescript
{
  fromOrder: string[],      // Previous letter arrangement
  toOrder: string[],        // New letter arrangement
  shuffleCount: number      // Total shuffles in this game
}
```

#### System Events

**7. `tab_visibility_changed`**
```typescript
{
  visibility: string,       // "visible" | "hidden"
  timerValue: number,       // Current timer value
  wordsFound: number,       // Current progress
  duration?: number         // Time spent in previous state (if becoming visible)
}
```

### Analytics API Endpoints

#### POST `/api/analytics` - Log Analytics Event
Logs a new analytics event for a user's game session.

**Request Body:**
```typescript
{
  userId: string,           // User identifier
  gameId: string,           // Game session identifier
  eventType: string,        // Event category
  eventData?: any          // Optional event payload
}
```

**Response:**
```typescript
{
  success: boolean,
  eventLogged: AnalyticsEvent
}
```

**Behavior:**
- Creates new user document if first-time user
- Creates new game session if first event for game
- Appends event to existing game session if continuing
- Updates timestamps throughout the hierarchy

#### GET `/api/analytics` - Retrieve Analytics Data
Retrieves analytics data for a user, optionally filtered by game.

**Query Parameters:**
- `userId` (required): User identifier
- `gameId` (optional): Specific game session filter

**Response (All User Data):**
```typescript
{
  userId: string,
  createdAt: Date,
  updatedAt: Date,
  gameSessions: GameSession[]
}
```

**Response (Specific Game):**
```typescript
{
  gameId: string,
  createdAt: Date,
  updatedAt: Date,
  events: AnalyticsEvent[],
  gameMetadata?: GameMetadata
}
```

#### PATCH `/api/analytics` - Update Game Metadata
Updates summary statistics for a completed or ongoing game session.

**Request Body:**
```typescript
{
  userId: string,
  gameId: string,
  gameMetadata: {
    totalWords?: number,
    wordsFound?: number,
    totalTime?: number,
    gameState?: string
  }
}
```

**Usage:** Called every 30 seconds during active gameplay and at game completion to maintain current statistics.

## 💾 Game Persistence System

### localStorage Integration
The game automatically saves state to localStorage for seamless session recovery.

#### Saved Game State Structure
```typescript
interface SavedGameState {
  gameId: string,           // Game session identifier
  foundWords: string[],     // Words discovered so far
  timer: number,            // Elapsed play time (seconds)
  gameState: GameState,     // Current game phase
  currentWord: string,      // Word being constructed
  savedAt: number,          // Save timestamp
  centerLetter: string,     // Central letter
  outerLetters: string[],   // Available letters
  wordCount: number,        // Total possible words
  pangramCount: number      // Total pangrams
}
```

#### Persistence Behavior
- **Auto-save Frequency**: Every 30 seconds during active play
- **Manual Save Triggers**: 
  - Word submission (success or failure)
  - Game state changes
  - Tab visibility changes
  - Letter shuffling
- **Recovery**: Automatic on page load if saved game exists
- **Storage Key**: `wordflower_game_${gameId}`

### User Identity Management
Persistent user identification across browser sessions.

```typescript
// User ID Generation
const generateUserId = () => {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
```

**Storage:** `wordflower_userId` in localStorage
**Lifecycle:** Created once per browser, persists indefinitely
**Purpose:** Enable cross-session analytics and progress tracking

## 🛠️ Environment Setup

### Required Environment Variables

```bash
# .env.local

# Merriam-Webster Dictionary API (for word validation)
NEXT_PUBLIC_MWT_API_KEY=your_mw_api_key_here

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority&appName=YourApp
MONGODB_DB=your_database_name
```

### MongoDB Atlas Setup
1. Create MongoDB Atlas account and cluster
2. Create database user with read/write permissions
3. Configure network access (IP whitelist or 0.0.0.0/0 for development)
4. Get connection string and update `MONGODB_URI`
5. Create database specified in `MONGODB_DB`

### Merriam-Webster API Setup
1. Register at [Merriam-Webster Developer Center](https://dictionaryapi.com/)
2. Subscribe to Collegiate Dictionary API (free tier available)
3. Copy API key to `NEXT_PUBLIC_MWT_API_KEY`

## 🔧 Development Features

### Debug Analytics
Monitor analytics events in real-time:

```javascript
// Browser Console
// View all stored analytics
fetch('/api/analytics?userId=your_user_id')
  .then(r => r.json())
  .then(console.log)

// View specific game
fetch('/api/analytics?userId=your_user_id&gameId=your_game_id')
  .then(r => r.json())
  .then(console.log)
```

### Game State Debugging
```javascript
// View current localStorage state
console.log(localStorage.getItem('wordflower_userId'))
console.log(localStorage.getItem('wordflower_game_current'))
```

### Performance Monitoring
The app includes built-in performance tracking:
- Tab visibility detection for accurate play time
- Optimized re-renders with React.memo and useCallback
- Debounced auto-save to prevent excessive database writes
- Efficient event batching for analytics

## 📱 Responsive Design

### Mobile Optimizations
- Touch-friendly letter selection
- Optimized modal sizing for small screens
- Responsive typography and spacing
- Tab visibility detection for mobile browsers

### Desktop Features
- Keyboard shortcuts for word submission
- Enhanced visual feedback
- Larger interactive elements
- Multi-column layouts for found words

## 🚀 Deployment

### Build Configuration
```bash
# Production build
npm run build

# Start production server
npm start
```

### Environment Considerations
- Ensure MongoDB connection string uses production cluster
- Verify API keys are production-ready
- Configure appropriate CORS settings for your domain
- Set up MongoDB indexes for optimal query performance:

```javascript
// Recommended MongoDB indexes
db.wordflower_collection.createIndex({ "userId": 1 })
db.wordflower_collection.createIndex({ "gameSessions.gameId": 1 })
db.wordflower_collection.createIndex({ "gameSessions.events.timestamp": 1 })
```

## 🧪 Testing Considerations

### Current State
- Hint system is temporarily disabled (commented out) for core functionality testing
- All hint-related code preserved for easy restoration
- Focus on validating: word submission, timer accuracy, analytics logging, game persistence

### To Re-enable Hints
Uncomment all lines containing hint-related functionality:
- State variables: `hintLevel`, `currentHintWordIndex`, etc.
- UI components: `<HintSystem>` import and usage
- API calls: hint fetching and navigation functions

## 📈 Analytics Insights

The comprehensive analytics system enables analysis of:
- Player engagement patterns and session duration
- Word discovery strategies and common failure points
- Game difficulty assessment through completion rates
- User retention and cross-session behavior
- Performance optimization opportunities

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**WordFlower** - Combining the joy of word discovery with the power of comprehensive analytics. Built with ❤️ using Next.js and MongoDB Atlas.
