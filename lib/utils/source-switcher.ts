/**
 * Source Switcher Utility
 * Tests source speeds and provides switching logic
 */

import type { VideoSource, VideoDetail, SourceSpeedResult } from '@/lib/types';
import { getVideoDetail, testVideoUrl } from '@/lib/api/client';
import { searchVideos } from '@/lib/api/client';

const SPEED_TEST_TIMEOUT = 10000;

/**
 * Test source speed by fetching video detail
 */
async function testSourceSpeed(
  videoTitle: string,
  source: VideoSource
): Promise<SourceSpeedResult> {
  const startTime = Date.now();

  try {
    // First, search for the video by title
    const searchResults = await searchVideos(videoTitle, [source]);
    
    if (searchResults.length === 0 || searchResults[0].results.length === 0) {
      return {
        source: source.id,
        sourceName: source.name,
        speed: Infinity,
        available: false,
        error: 'Video not found in this source',
      };
    }

    const firstResult = searchResults[0].results[0];
    
    // Fetch video detail
    const videoDetail = await getVideoDetail(firstResult.vod_id, source);

    if (!videoDetail.episodes || videoDetail.episodes.length === 0) {
      return {
        source: source.id,
        sourceName: source.name,
        speed: Infinity,
        available: false,
        error: 'No episodes available',
      };
    }

    // Test first episode URL
    const firstEpisodeUrl = videoDetail.episodes[0].url;
    const urlTestStartTime = Date.now();
    
    const isAccessible = await Promise.race([
      testVideoUrl(firstEpisodeUrl),
      new Promise<boolean>((resolve) => 
        setTimeout(() => resolve(false), 5000)
      ),
    ]);

    if (!isAccessible) {
      return {
        source: source.id,
        sourceName: source.name,
        speed: Infinity,
        available: false,
        error: 'Video URL not accessible',
        videoDetail,
      };
    }

    const urlTestTime = Date.now() - urlTestStartTime;
    const totalTime = Date.now() - startTime;

    return {
      source: source.id,
      sourceName: source.name,
      speed: totalTime,
      available: true,
      videoDetail,
    };
  } catch (error) {
    return {
      source: source.id,
      sourceName: source.name,
      speed: Infinity,
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test multiple sources in parallel
 */
export async function testAllSources(
  videoTitle: string,
  sources: VideoSource[],
  currentSource?: string
): Promise<SourceSpeedResult[]> {
  const testPromises = sources.map(source =>
    Promise.race([
      testSourceSpeed(videoTitle, source),
      new Promise<SourceSpeedResult>((resolve) =>
        setTimeout(
          () =>
            resolve({
              source: source.id,
              sourceName: source.name,
              speed: Infinity,
              available: false,
              error: 'Timeout',
            }),
          SPEED_TEST_TIMEOUT
        )
      ),
    ])
  );

  const results = await Promise.all(testPromises);

  // Sort results: current source first, then by speed, errors last
  return results.sort((a, b) => {
    // Current source always first
    if (currentSource) {
      if (a.source === currentSource) return -1;
      if (b.source === currentSource) return 1;
    }

    // Errors last
    if (!a.available && b.available) return 1;
    if (a.available && !b.available) return -1;

    // Sort by speed
    return a.speed - b.speed;
  });
}

/**
 * Get speed indicator
 */
export function getSpeedIndicator(
  speed: number
): {
  label: string;
  color: string;
  level: 'fast' | 'medium' | 'slow' | 'error';
} {
  if (speed === Infinity) {
    return {
      label: 'Error',
      color: 'red',
      level: 'error',
    };
  }

  if (speed < 1000) {
    return {
      label: 'Fast',
      color: 'green',
      level: 'fast',
    };
  }

  if (speed < 2000) {
    return {
      label: 'Medium',
      color: 'yellow',
      level: 'medium',
    };
  }

  return {
    label: 'Slow',
    color: 'red',
    level: 'slow',
  };
}

/**
 * Format speed for display
 */
export function formatSpeed(speed: number): string {
  if (speed === Infinity) {
    return 'N/A';
  }

  if (speed < 1000) {
    return `${speed}ms`;
  }

  return `${(speed / 1000).toFixed(2)}s`;
}

/**
 * Find best source based on speed test results
 */
export function findBestSource(results: SourceSpeedResult[]): SourceSpeedResult | null {
  const availableSources = results.filter(r => r.available);

  if (availableSources.length === 0) {
    return null;
  }

  // Return fastest available source
  return availableSources.reduce((best, current) =>
    current.speed < best.speed ? current : best
  );
}

/**
 * Get alternative sources
 */
export function getAlternativeSources(
  results: SourceSpeedResult[],
  currentSource: string
): SourceSpeedResult[] {
  return results
    .filter(r => r.source !== currentSource && r.available)
    .sort((a, b) => a.speed - b.speed);
}

/**
 * Check if source switch is recommended
 */
export function shouldSwitchSource(
  currentResult: SourceSpeedResult,
  bestResult: SourceSpeedResult
): boolean {
  if (!currentResult.available) {
    return true; // Current source not available
  }

  if (!bestResult.available) {
    return false; // No better alternative
  }

  // Switch if best source is significantly faster (at least 50% faster)
  const improvement = (currentResult.speed - bestResult.speed) / currentResult.speed;
  return improvement > 0.5;
}

/**
 * Build source switch URL
 */
export function buildSourceSwitchUrl(
  currentUrl: string,
  newSource: string,
  videoDetail: VideoDetail,
  episodeIndex: number = 0
): string {
  const url = new URL(currentUrl, window.location.origin);
  const searchParams = url.searchParams;

  // Update source
  searchParams.set('source', newSource);
  searchParams.set('id', videoDetail.vod_id.toString());

  // Keep same episode if available
  if (videoDetail.episodes && videoDetail.episodes[episodeIndex]) {
    searchParams.set('index', episodeIndex.toString());
    searchParams.set('url', encodeURIComponent(videoDetail.episodes[episodeIndex].url));
  }

  return `${url.pathname}?${searchParams.toString()}`;
}

/**
 * Cache speed test results
 */
const SPEED_TEST_CACHE_KEY = 'kvideo_speed_test_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface SpeedTestCache {
  [key: string]: {
    results: SourceSpeedResult[];
    timestamp: number;
  };
}

export function getCachedSpeedTest(videoTitle: string): SourceSpeedResult[] | null {
  if (typeof window === 'undefined') return null;

  try {
    const cache: SpeedTestCache = JSON.parse(
      localStorage.getItem(SPEED_TEST_CACHE_KEY) || '{}'
    );

    const cached = cache[videoTitle];

    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      return null;
    }

    return cached.results;
  } catch {
    return null;
  }
}

export function setCachedSpeedTest(
  videoTitle: string,
  results: SourceSpeedResult[]
): void {
  if (typeof window === 'undefined') return;

  try {
    const cache: SpeedTestCache = JSON.parse(
      localStorage.getItem(SPEED_TEST_CACHE_KEY) || '{}'
    );

    cache[videoTitle] = {
      results,
      timestamp: Date.now(),
    };

    // Keep only recent entries (max 10)
    const entries = Object.entries(cache);
    if (entries.length > 10) {
      const sorted = entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      const keep = Object.fromEntries(sorted.slice(0, 10));
      localStorage.setItem(SPEED_TEST_CACHE_KEY, JSON.stringify(keep));
    } else {
      localStorage.setItem(SPEED_TEST_CACHE_KEY, JSON.stringify(cache));
    }
  } catch (error) {
    console.error('Failed to cache speed test:', error);
  }
}
