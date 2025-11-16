# KVideo - Video Aggregation Platform

A Next.js-based video streaming platform that aggregates content from multiple third-party APIs with intelligent source switching and advanced ad filtering.

## ✨ Features

- 🔍 **Multi-Source Search**: Search across multiple video APIs simultaneously
- ⚡ **Intelligent Source Switching**: Automatic speed testing and source recommendation
- 🎯 **Advanced Ad Filtering**: M3U8 playlist ad segment removal
- 💾 **Progress Tracking**: Auto-save and resume from last watched position
- 📱 **Episode Management**: Smart episode navigation with progress tracking
- 🔄 **Error Recovery**: Automatic retry and fallback mechanisms
- 📊 **Viewing History**: Track last 50 watched videos
- ⚙️ **Custom Sources**: Add your own video API endpoints

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Modern browser with LocalStorage support

### Installation

```bash
# Install dependencies
npm install

# Or run setup script
chmod +x setup.sh
./setup.sh
```

### Configuration

Edit `lib/api/video-sources.ts` with your video API endpoints:

```typescript
export const DEFAULT_SOURCES: VideoSource[] = [
  {
    id: 'source_1',
    name: 'Primary Video API',
    baseUrl: 'https://your-api.com',
    searchPath: '/api.php/provide/vod',
    detailPath: '/api.php/provide/vod',
    enabled: true,
  },
];
```

### Development

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Production

```bash
npm run build
npm start
```

## 📚 Documentation

- **[SETUP.md](SETUP.md)** - Detailed setup instructions and examples
- **[IMPLEMENTATION.md](IMPLEMENTATION.md)** - Architecture and API documentation
- **[SUMMARY.md](SUMMARY.md)** - Implementation overview

## 🏗️ Architecture

```
KVideo Platform
├── API Layer (Multi-source aggregation)
├── State Management (Zustand stores)
├── Utility Layer (Search, Progress, Episodes)
├── Error Handling (Recovery strategies)
└── M3U8 Ad Filtering (Custom HLS loader)
```

### Core Components

#### API Layer
- **video-sources.ts**: Source configuration and health checks
- **client.ts**: HTTP client with retry logic and timeouts
- **search/route.ts**: Search API endpoint
- **detail/route.ts**: Video detail API endpoint

#### State Management
- **player-store.ts**: Video playback state (Zustand)
- **history-store.ts**: Viewing history (Zustand)

#### Utilities
- **progress-tracker.ts**: LocalStorage-based progress management
- **error-handler.ts**: Comprehensive error recovery
- **search.ts**: Search optimization and debouncing
- **episode-manager.ts**: Episode navigation logic
- **source-switcher.ts**: Speed testing and source comparison
- **m3u8-filter.ts**: Ad filtering for HLS streams

## 🎯 Key Features Explained

### Multi-Source Aggregation
Search across multiple video APIs simultaneously with parallel requests, automatic deduplication, and response time tracking.

### Intelligent Source Switching
- Tests all available sources in parallel
- Measures API response time + video URL accessibility
- Provides visual speed indicators (Fast/Medium/Slow)
- Recommends faster alternatives
- Caches results for 5 minutes

### Advanced Ad Filtering
Custom HLS loader that:
- Intercepts M3U8 playlist requests
- Filters segments containing ad patterns
- Removes discontinuity tags
- Preserves valid video segments
- Supports custom ad pattern rules

### Progress Tracking
- Auto-saves progress every 5 seconds (throttled)
- Resumes from last position on reload
- Clears progress when video finishes
- Per-episode progress tracking
- Auto-cleanup of old entries

## 🔧 Configuration

### Timeouts & Limits

```typescript
// lib/api/client.ts
const REQUEST_TIMEOUT = 15000;  // 15 seconds
const MAX_RETRIES = 3;          // 3 attempts

// lib/utils/progress-tracker.ts
const PROGRESS_SAVE_THRESHOLD = 10;   // Skip if < 10s
const RESUME_MIN_POSITION = 10;       // Resume if > 10s
```

### Custom Ad Patterns

```typescript
import { addCustomAdPattern } from '@/lib/utils/m3u8-filter';
addCustomAdPattern('/your-ad-path/');
```

## 📖 API Usage

### Search Videos

```bash
POST /api/search
{
  "query": "movie name",
  "sources": ["source_1", "source_2"],
  "page": 1
}
```

### Get Video Detail

```bash
GET /api/detail?id=123&source=source_1
```

## 🛠️ Tech Stack

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Zustand** - State management
- **HLS.js** - Video streaming
- **Artplayer** - Video player UI

## 📦 Dependencies

```json
{
  "zustand": "^5.0.2",
  "hls.js": "^1.5.15",
  "artplayer": "^5.1.7"
}
```

## 🎨 UI Components Needed

To complete the platform, create these components:

- SearchBar with debouncing
- VideoGrid for search results
- VideoPlayer with HLS.js integration
- EpisodeList with navigation
- SourceSwitcher with speed indicators
- HistoryList with progress bars

## 📄 License

MIT License

## 📞 Support

For detailed documentation:
- Check `IMPLEMENTATION.md` for architecture
- Review `SETUP.md` for setup instructions
- See `SUMMARY.md` for overview

---

**Status**: Core logic implementation complete ✅  
**Next Steps**: Build UI components and integrate with logic layers

Built with ❤️ using Next.js and TypeScript
