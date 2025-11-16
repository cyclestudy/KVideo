# KVideo Platform - Implementation Guide

## Overview

KVideo is a Next.js-based video aggregation platform that fetches content from multiple third-party APIs, provides intelligent source switching, and implements advanced M3U8 ad filtering for seamless video playback.

## Architecture

### 1. Core Type System (`lib/types/`)

**Purpose**: Centralized TypeScript type definitions for the entire application.

**Key Types**:
- `VideoSource`: Configuration for third-party API sources
- `VideoItem`: Search result structure
- `VideoDetail`: Full video information with episodes
- `PlayerState`: Current playback state
- `VideoHistoryItem`: Viewing history with progress
- `ApiResponse`: Standardized API response formats

### 2. API Layer

#### `lib/api/video-sources.ts`
**Manages video source configuration**:
- Stores multiple API endpoints with headers
- Validates source configurations
- Health checks for source availability
- Custom source management via localStorage
- Priority-based source ordering

**Key Functions**:
- `getAllSources()`: Get all available sources
- `getEnabledSources()`: Get enabled sources sorted by priority
- `healthCheckSource(source)`: Test source availability and response time
- `addCustomSource(source)`: Add user-defined API sources

#### `lib/api/client.ts`
**HTTP client for video data fetching**:
- Parallel requests to multiple sources
- 15-second timeout with abort controller
- 3-attempt retry mechanism with exponential backoff
- Response normalization across different API formats
- M3U8 URL extraction from various formats

**Key Functions**:
- `searchVideos(query, sources, page)`: Search across multiple sources
- `getVideoDetail(id, source)`: Fetch video details with episodes
- `testVideoUrl(url)`: Check video URL accessibility
- `normalizeVideoData(data, sourceId)`: Standardize API responses

### 3. Server API Routes

#### `app/api/search/route.ts`
**Handles video search requests**:
- POST and GET endpoints
- Validates query and source parameters
- Aggregates results from multiple sources
- Returns merged results with source attribution

**Request Format**:
```json
{
  "query": "search term",
  "sources": ["source_1", "source_2"],
  "page": 1
}
```

**Response Format**:
```json
{
  "success": true,
  "query": "search term",
  "page": 1,
  "sources": [
    {
      "results": [...],
      "source": "source_1",
      "responseTime": 234
    }
  ],
  "totalResults": 42
}
```

#### `app/api/detail/route.ts`
**Fetches video details**:
- GET and POST endpoints
- Extracts episode lists and M3U8 URLs
- Supports custom API URLs
- Returns structured video data with episodes

**Query Parameters**:
- `id`: Video ID
- `source`: Source identifier
- `customApi`: (Optional) Custom API URL

### 4. State Management

#### `lib/store/player-store.ts` (Zustand)
**Manages video playback state**:
```typescript
State: {
  currentVideo: { id, title, url, source, episodeIndex }
  episodes: Episode[]
  playbackPosition: number
  duration: number
  isPlaying: boolean
  autoplayNext: boolean
  volume: number (0-1)
  playbackRate: number
}

Actions: {
  setVideo(video)
  updatePosition(position)
  nextEpisode() // Returns next episode or null
  prevEpisode() // Returns previous episode or null
  toggleAutoplay()
  setVolume(volume)
  setPlaybackRate(rate)
}
```

**Persistence**: Saves volume, playback rate, and autoplay settings to localStorage.

#### `lib/store/history-store.ts` (Zustand)
**Manages viewing history**:
- Stores last 50 watched videos
- Deduplicates by show identifier
- Updates progress and timestamp
- Moves recently watched to top
- Persists to localStorage

**Key Functions**:
- `addToHistory(...)`: Add or update history entry
- `updateProgress(videoId, source, episodeIndex, position, duration)`
- `getHistoryItem(videoId, source)`: Retrieve specific history entry
- `clearHistory()`: Clear all history

### 5. Utility Modules

#### `lib/utils/progress-tracker.ts`
**LocalStorage-based progress management**:
- Auto-saves progress every 5 seconds (throttled)
- Skips if position < 10s or video almost finished (< 2min remaining)
- Clears progress when video completes
- Provides resume position on reload
- Auto-cleans entries older than 30 days

**Key Functions**:
- `saveProgress(videoId, source, position, duration, episodeIndex)`
- `getProgress(videoId, source)`: Returns stored progress or null
- `shouldResumeProgress(progress)`: Check if position is valid for resume
- `createProgressSaver(interval)`: Returns throttled save function

#### `lib/utils/error-handler.ts`
**Comprehensive error handling**:
- Categorizes errors: NETWORK, MEDIA, HLS, API, TIMEOUT
- HLS.js error recovery strategies:
  - `networkError`: Retry with `hls.startLoad()`
  - `mediaError`: Call `hls.recoverMediaError()`
  - `bufferAppendError`: Ignore if playback started
  - `fatal`: Destroy and recreate player
- Exponential backoff retry logic
- User-friendly error messages

**Key Functions**:
- `handleHLSError(hls, errorData, retryCount)`: Returns recovery action
- `retryWithBackoff(fn, maxRetries, initialDelay)`
- `isRetryableError(error)`: Check if error can be retried
- `ErrorRecovery.recoverNetwork(retryFn, maxAttempts)`

#### `lib/utils/search.ts`
**Search optimization utilities**:
- Debounce search input (500ms default)
- Merge and deduplicate results from multiple sources
- Normalize titles for comparison
- Filter by year, area, type, keyword
- Sort by relevance, year, name, or update time
- Search history management (max 20 entries)

**Key Functions**:
- `debounce(func, delay)`: Debounce function calls
- `mergeSearchResults(results)`: Deduplicate and merge
- `filterResults(results, filters)`: Apply search filters
- `sortResults(results, sortBy)`: Sort by criteria
- `saveSearchQuery(query)`: Save to history

#### `lib/utils/episode-manager.ts`
**Episode navigation logic**:
- Builds player URLs with episode parameters
- Parses URL query parameters
- Validates episode indices
- Groups episodes into sections (20 per section)
- Supports episode order toggle (normal/reversed)
- Formats episode names and tracks progress

**Key Functions**:
- `buildPlayerUrl(params)`: Create player URL with episode info
- `parsePlayerParams(searchParams)`: Extract episode params from URL
- `getNextEpisodeParams(currentParams, episodes)`: Get next episode
- `groupEpisodesIntoSections(episodes, sectionSize)`: Paginate episodes
- `toggleEpisodeOrder()`: Switch between normal/reversed order

#### `lib/utils/source-switcher.ts`
**Multi-source speed testing**:
- Tests all sources in parallel
- Measures API response time + video URL accessibility
- Sorts by: current source → speed (fast to slow) → errors
- Speed indicators: <1000ms=Fast, <2000ms=Medium, >2000ms=Slow
- Caches test results for 5 minutes
- Recommends switch if alternative is 50%+ faster

**Key Functions**:
- `testAllSources(videoTitle, sources, currentSource)`: Test all sources
- `getSpeedIndicator(speed)`: Return color-coded speed level
- `findBestSource(results)`: Get fastest available source
- `shouldSwitchSource(current, best)`: Check if switch is beneficial
- `buildSourceSwitchUrl(...)`: Create URL with new source

#### `lib/utils/m3u8-filter.ts`
**Ad filtering for M3U8 playlists**:
- Custom HLS loader extending HLS.js
- Intercepts M3U8 manifest requests
- Parses playlist line-by-line
- Filters segments containing ad patterns:
  - `/ad/`, `/ads/`, `/advertisement/`, `_ad_`, `-ad-`
  - Keywords: 'commercial', 'sponsored', 'promo'
- Removes discontinuity tags around filtered segments
- Preserves valid video segments

**Key Classes/Functions**:
- `AdFilteringHLSLoader`: Custom HLS loader class
- `filterM3U8Playlist(content, baseUrl)`: Remove ad segments
- `createAdFilteringConfig(hlsConfig)`: Create HLS config with filtering
- `detectAdsInM3U8(url)`: Analyze playlist for ads
- `addCustomAdPattern(pattern)`: Add user-defined ad patterns

## Data Flow

### 1. Search Flow
```
User Input → Debounce (500ms) → API Route (/api/search)
  → Parallel requests to sources → Normalize responses
  → Merge & deduplicate → Display results
```

### 2. Video Selection Flow
```
User clicks video → Navigate to detail page → API Route (/api/detail)
  → Fetch video details → Extract episodes → Parse M3U8 URLs
  → Initialize player store → Navigate to player page
```

### 3. Playback Flow
```
Player page loads → Create HLS instance with AdFilteringLoader
  → Load M3U8 URL → Filter ads → Initialize Artplayer
  → Resume from saved position (if valid)
  → Auto-save progress every 5s
  → On video end: Clear progress, auto-play next if enabled
```

### 4. Source Switching Flow
```
User clicks "Switch Source" → Search video title across all sources
  → Test each source speed (parallel):
    - Fetch detail API
    - HEAD request to first episode URL
    - Calculate response time
  → Sort by speed → Display with color indicators
  → User selects source → Navigate to new URL with updated params
```

## Error Handling

### HLS Errors
- **Network Error**: Retry with `hls.startLoad()` (max 3 attempts)
- **Media Error**: Call `hls.recoverMediaError()` (max 3 attempts)
- **Buffer Stalled**: Restart loading
- **Fatal Error**: Destroy player and suggest alternative source

### API Errors
- **Timeout**: Retry with exponential backoff
- **404/500**: Mark source as unavailable
- **Network Failure**: Show user-friendly message, suggest alternative

### Recovery Strategies
1. Auto-retry with exponential backoff (1s, 2s, 4s)
2. Switch to alternative source if current fails
3. Resume from last saved position after recovery
4. Clear corrupted localStorage data and reset

## Configuration

### Adding Custom Sources
```typescript
import { addCustomSource } from '@/lib/api/video-sources';

addCustomSource({
  id: 'custom_source',
  name: 'My Custom API',
  baseUrl: 'https://api.example.com',
  searchPath: '/api.php/provide/vod',
  detailPath: '/api.php/provide/vod',
  headers: { 'User-Agent': 'Mozilla/5.0' },
  enabled: true,
  priority: 3
});
```

### Customizing Ad Filters
```typescript
import { addCustomAdPattern } from '@/lib/utils/m3u8-filter';

addCustomAdPattern('/custom-ad-path/');
```

## Performance Optimizations

1. **Parallel API Requests**: Fetch from all sources simultaneously
2. **Request Timeout**: 15s timeout prevents hanging requests
3. **Result Caching**: Speed test results cached for 5 minutes
4. **Throttled Progress Saving**: Auto-save limited to every 5 seconds
5. **Lazy Loading**: Episodes loaded only when needed
6. **Ad Filtering**: Reduces bandwidth and loading time
7. **Source Priority**: Faster sources prioritized automatically

## Local Storage Keys

- `kvideo_custom_sources`: Custom API sources
- `kvideo-player-store`: Player settings (volume, rate, autoplay)
- `kvideo-history-store`: Viewing history
- `kvideo_progress_{source}_{videoId}`: Video progress
- `kvideo_search_history`: Search query history
- `kvideo_speed_test_cache`: Source speed test cache
- `kvideo_episode_order`: Episode order preference
- `kvideo_custom_ad_patterns`: Custom ad filter patterns

## API Compatibility

The platform expects third-party APIs to return JSON in this format:

### Search Response
```json
{
  "code": 1,
  "list": [
    {
      "vod_id": 123,
      "vod_name": "Video Title",
      "vod_pic": "https://...",
      "type_name": "Movie",
      "vod_remarks": "HD",
      "vod_year": "2024"
    }
  ]
}
```

### Detail Response
```json
{
  "code": 1,
  "list": [
    {
      "vod_id": 123,
      "vod_name": "Video Title",
      "vod_pic": "https://...",
      "vod_play_url": "Episode1$url1#Episode2$url2",
      "vod_play_from": "m3u8"
    }
  ]
}
```

## Next Steps

1. **Install Dependencies**:
```bash
npm install zustand hls.js artplayer
```

2. **Configure API Sources**: Edit `lib/api/video-sources.ts` with real API endpoints

3. **Build UI Components**: Create React components using the logic layers

4. **Add Player Component**: Integrate HLS.js and Artplayer with the stores

5. **Test Error Recovery**: Simulate network failures and verify recovery

## Security Considerations

- Never expose API keys in client-side code
- Validate all user inputs before API requests
- Sanitize video URLs before loading
- Implement rate limiting on API routes
- Use CORS properly for third-party API calls
