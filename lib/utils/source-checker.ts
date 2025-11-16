/**
 * Source Availability Checker
 * Pre-validates video sources during search to filter out unavailable ones
 */

import { isValidUrlFormat } from './url-validator';

const CHECK_TIMEOUT = 3000; // 3 seconds per check
const MAX_RETRIES = 2;

export interface SourceCheckResult {
  sourceId: string;
  sourceName: string;
  isAvailable: boolean;
  sampleUrl?: string;
  error?: string;
  checkedAt: number;
}

/**
 * Check if a single video URL is accessible and actually contains video content
 */
async function checkVideoUrl(url: string, retries = MAX_RETRIES): Promise<boolean> {
  if (!isValidUrlFormat(url)) {
    return false;
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CHECK_TIMEOUT);

      // Use GET with Range header to check if it's actually a video
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer': new URL(url).origin,
          'Range': 'bytes=0-1024', // Only fetch first 1KB to check
        },
      });

      clearTimeout(timeoutId);

      // Only accept successful responses (200 OK or 206 Partial Content)
      // Reject 403 Forbidden as it means we can't actually access the video
      if (response.ok || response.status === 206) {
        // Check content-type to ensure it's actually a video
        const contentType = response.headers.get('content-type');
        if (contentType && (
          contentType.includes('video') || 
          contentType.includes('mpegurl') || 
          contentType.includes('m3u8') ||
          contentType.includes('octet-stream')
        )) {
          return true;
        }
      }
    } catch (error) {
      // If last attempt, return false
      if (attempt === retries) {
        return false;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return false;
}

/**
 * Extract first playable URL from video data
 */
function extractFirstVideoUrl(video: any): string | null {
  if (!video.vod_play_url) return null;

  try {
    // Format: "Episode1$url1#Episode2$url2#..."
    const episodes = video.vod_play_url.split('#');
    
    for (const episode of episodes) {
      const [, url] = episode.split('$');
      if (url && isValidUrlFormat(url)) {
        return url;
      }
    }
  } catch (error) {
    // Silent error
  }

  return null;
}

/**
 * Check if a single video is playable
 */
export async function checkVideoAvailability(video: any): Promise<boolean> {
  const videoUrl = extractFirstVideoUrl(video);
  
  if (!videoUrl) {
    return false;
  }

  return await checkVideoUrl(videoUrl);
}

/**
 * Check multiple videos in parallel with concurrency limit
 */
export async function checkMultipleVideos(
  videos: any[],
  concurrency: number = 10,
  onProgress?: (checked: number, total: number) => void
): Promise<any[]> {
  const availableVideos: any[] = [];
  let checkedCount = 0;
  
  // Process videos in batches to avoid overwhelming the system
  for (let i = 0; i < videos.length; i += concurrency) {
    const batch = videos.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(async (video) => {
        const isAvailable = await checkVideoAvailability(video);
        checkedCount++;
        
        // Report progress
        if (onProgress) {
          onProgress(checkedCount, videos.length);
        }
        
        return isAvailable ? video : null;
      })
    );
    
    // Add available videos to result
    availableVideos.push(...results.filter(v => v !== null));
  }
  
  return availableVideos;
}

/**
 * Check if a source is available by testing a sample video
 */
export async function checkSourceAvailability(
  sourceId: string,
  sourceName: string,
  sampleVideos: any[]
): Promise<SourceCheckResult> {
  const startTime = Date.now();

  // If no videos from this source, mark as unavailable
  if (!sampleVideos || sampleVideos.length === 0) {
    return {
      sourceId,
      sourceName,
      isAvailable: false,
      error: 'No videos found',
      checkedAt: Date.now(),
    };
  }

  // Try to find a video with a valid URL
  for (const video of sampleVideos.slice(0, 3)) { // Check up to 3 videos
    const videoUrl = extractFirstVideoUrl(video);
    
    if (!videoUrl) continue;

    const isAvailable = await checkVideoUrl(videoUrl);

    if (isAvailable) {
      return {
        sourceId,
        sourceName,
        isAvailable: true,
        sampleUrl: videoUrl,
        checkedAt: Date.now(),
      };
    }
  }

  return {
    sourceId,
    sourceName,
    isAvailable: false,
    error: 'All sample videos failed to load',
    checkedAt: Date.now(),
  };
}

/**
 * Check multiple sources in parallel
 */
export async function checkMultipleSources(
  sourcesWithVideos: Array<{ sourceId: string; sourceName: string; videos: any[] }>
): Promise<SourceCheckResult[]> {
  const checkPromises = sourcesWithVideos.map(({ sourceId, sourceName, videos }) =>
    checkSourceAvailability(sourceId, sourceName, videos)
  );

  return Promise.all(checkPromises);
}

/**
 * Filter search results to only include videos from available sources
 */
export function filterByAvailableSources(
  videos: any[],
  availableSources: SourceCheckResult[]
): any[] {
  const availableSourceIds = new Set(
    availableSources
      .filter(s => s.isAvailable)
      .map(s => s.sourceId)
  );

  return videos.filter(video => availableSourceIds.has(video.source));
}
