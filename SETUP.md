# KVideo Platform - Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install:
- **zustand** (v5.0.2): State management
- **hls.js** (v1.5.15): HLS video streaming
- **artplayer** (v5.1.7): Video player UI

### 2. Configure Video Sources

Edit `lib/api/video-sources.ts` and update the `DEFAULT_SOURCES` array with your video API endpoints:

```typescript
export const DEFAULT_SOURCES: VideoSource[] = [
  {
    id: 'source_1',
    name: 'Primary Video API',
    baseUrl: 'https://your-api-domain.com',
    searchPath: '/api.php/provide/vod',
    detailPath: '/api.php/provide/vod',
    headers: {
      'User-Agent': 'Mozilla/5.0',
    },
    enabled: true,
    priority: 1,
  },
  // Add more sources...
];
```

### 3. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Project Structure

```
kvideo/
├── app/
│   ├── api/
│   │   ├── search/route.ts       # Search API endpoint
│   │   └── detail/route.ts       # Detail API endpoint
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── types/
│   │   └── index.ts              # TypeScript type definitions
│   ├── api/
│   │   ├── video-sources.ts      # Source configuration
│   │   └── client.ts             # HTTP client
│   ├── store/
│   │   ├── player-store.ts       # Player state (Zustand)
│   │   └── history-store.ts      # History state (Zustand)
│   └── utils/
│       ├── progress-tracker.ts   # Progress management
│       ├── error-handler.ts      # Error handling
│       ├── search.ts             # Search utilities
│       ├── episode-manager.ts    # Episode navigation
│       ├── source-switcher.ts    # Source testing
│       └── m3u8-filter.ts        # Ad filtering
├── components/
│   └── player/
│       └── VideoPlayer.tsx       # (To be created)
├── IMPLEMENTATION.md             # Detailed architecture guide
└── package.json
```

## Core Functionality

### 1. Multi-Source Video Search

```typescript
// Example: Search across multiple sources
import { searchVideos } from '@/lib/api/client';
import { getEnabledSources } from '@/lib/api/video-sources';

const sources = getEnabledSources();
const results = await searchVideos('movie name', sources, 1);

// Results include response time and source attribution
results.forEach(result => {
  console.log(`Source: ${result.source}`);
  console.log(`Response time: ${result.responseTime}ms`);
  console.log(`Results: ${result.results.length}`);
});
```

### 2. Video Player State Management

```typescript
// Example: Using player store
import { usePlayerStore } from '@/lib/store/player-store';

function VideoPlayer() {
  const { currentVideo, episodes, nextEpisode } = usePlayerStore();
  
  const handleVideoEnd = () => {
    const next = nextEpisode();
    if (next) {
      console.log('Auto-playing next episode:', next.name);
    }
  };
  
  // Player component logic...
}
```

### 3. Progress Tracking

```typescript
// Example: Save and restore progress
import { saveProgress, getProgress, shouldResumeProgress } from '@/lib/utils/progress-tracker';

// Save progress every 5 seconds
const handleTimeUpdate = (currentTime: number) => {
  saveProgress(videoId, source, currentTime, duration, episodeIndex);
};

// Resume on load
const storedProgress = getProgress(videoId, source);
if (shouldResumeProgress(storedProgress)) {
  player.currentTime = storedProgress.position;
}
```

### 4. Source Speed Testing

```typescript
// Example: Test and switch sources
import { testAllSources, getSpeedIndicator } from '@/lib/utils/source-switcher';

const results = await testAllSources(videoTitle, sources, currentSource);

results.forEach(result => {
  const indicator = getSpeedIndicator(result.speed);
  console.log(`${result.sourceName}: ${indicator.label} (${result.speed}ms)`);
});

// Get fastest source
const fastest = results.find(r => r.available);
```

### 5. M3U8 Ad Filtering

```typescript
// Example: Initialize HLS with ad filtering
import Hls from 'hls.js';
import { createAdFilteringConfig } from '@/lib/utils/m3u8-filter';

const hls = new Hls(createAdFilteringConfig());
hls.loadSource(m3u8Url);
hls.attachMedia(videoElement);
```

## API Usage

### Search Endpoint

**POST** `/api/search`

Request:
```json
{
  "query": "movie name",
  "sources": ["source_1", "source_2"],
  "page": 1
}
```

Response:
```json
{
  "success": true,
  "query": "movie name",
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

### Detail Endpoint

**GET** `/api/detail?id=123&source=source_1`

Response:
```json
{
  "success": true,
  "data": {
    "vod_id": 123,
    "vod_name": "Movie Title",
    "vod_pic": "https://...",
    "episodes": [
      {
        "name": "Episode 1",
        "url": "https://...",
        "index": 0
      }
    ],
    "source": "source_1"
  }
}
```

## Environment Variables

Create `.env.local`:

```bash
# Optional: Default video sources
NEXT_PUBLIC_DEFAULT_SOURCE_1=https://api.example1.com
NEXT_PUBLIC_DEFAULT_SOURCE_2=https://api.example2.com

# Optional: Analytics
NEXT_PUBLIC_GA_ID=your-google-analytics-id

# Development
NODE_ENV=development
```

## Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Testing

### Test API Sources

```bash
# Use the health check function
node -e "
const { healthCheckSources, getAllSources } = require('./lib/api/video-sources');
const sources = getAllSources();
healthCheckSources(sources).then(results => {
  results.forEach((result, sourceId) => {
    console.log(sourceId, result);
  });
});
"
```

### Test Search Functionality

```bash
# Test search via API route
curl -X POST http://localhost:3000/api/search \
  -H 'Content-Type: application/json' \
  -d '{"query":"test","sources":["source_1"],"page":1}'
```

### Test Detail Fetch

```bash
# Test detail via API route
curl "http://localhost:3000/api/detail?id=123&source=source_1"
```

## Common Issues

### 1. HLS.js Not Loading

**Solution**: Ensure the video URL is a valid M3U8 playlist and CORS is enabled on the video server.

```typescript
// Add CORS headers in next.config.ts if needed
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },
};
```

### 2. LocalStorage Quota Exceeded

**Solution**: The app auto-cleans old progress entries. You can also manually clear:

```typescript
import { clearOldProgress } from '@/lib/utils/progress-tracker';
clearOldProgress(30); // Clear entries older than 30 days
```

### 3. Source Timeout

**Solution**: Adjust timeout in `lib/api/client.ts`:

```typescript
const REQUEST_TIMEOUT = 15000; // Increase if needed
```

### 4. Ad Filtering Not Working

**Solution**: Add custom patterns:

```typescript
import { addCustomAdPattern } from '@/lib/utils/m3u8-filter';
addCustomAdPattern('/your-ad-path/');
```

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**Requirements**:
- LocalStorage support
- Fetch API
- ES6+ JavaScript

## Performance Tips

1. **Limit Concurrent Sources**: Test with 3-5 sources max for optimal speed
2. **Enable Caching**: Speed test results cached for 5 minutes
3. **Throttle Progress**: Auto-save limited to every 5 seconds
4. **Lazy Load Episodes**: Only fetch episodes when needed
5. **Use CDN**: Serve static assets via CDN for faster loading

## Contributing

See `IMPLEMENTATION.md` for detailed architecture documentation.

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
1. Check `IMPLEMENTATION.md` for detailed documentation
2. Review error logs in browser console
3. Test API sources with health check function
4. Verify CORS configuration on video servers

---

**Next Steps**: Create UI components and integrate with the logic layers! All the core business logic is now implemented and ready to use.
