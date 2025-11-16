/**
 * M3U8 Ad Filtering Utility
 * Custom HLS loader with ad segment filtering
 */

// Ad detection patterns
const AD_PATTERNS = [
  '/ad/',
  '/ads/',
  '/advertisement/',
  '/advert/',
  '_ad_',
  '_ads_',
  '-ad-',
  '-ads-',
  'ad.ts',
  'ad.m3u8',
  'ads.ts',
  'ads.m3u8',
  'advert',
  'commercial',
  '/promo/',
];

// Additional keywords to filter
const AD_KEYWORDS = [
  'advertisement',
  'commercial',
  'sponsored',
  'promo',
  'banner',
];

/**
 * Check if URL contains ad patterns
 */
function isAdSegment(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  
  // Check URL patterns
  if (AD_PATTERNS.some(pattern => lowerUrl.includes(pattern))) {
    return true;
  }
  
  // Check keywords
  if (AD_KEYWORDS.some(keyword => lowerUrl.includes(keyword))) {
    return true;
  }
  
  return false;
}

/**
 * Parse M3U8 playlist content
 */
interface M3U8Segment {
  duration?: number;
  url: string;
  metadata: string[];
  isAd: boolean;
}

function parseM3U8(content: string, baseUrl: string): {
  header: string[];
  segments: M3U8Segment[];
} {
  const lines = content.split('\n');
  const header: string[] = [];
  const segments: M3U8Segment[] = [];
  
  let currentMetadata: string[] = [];
  let inHeader = true;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) continue;
    
    // Header lines
    if (line.startsWith('#EXTM3U')) {
      header.push(line);
      continue;
    }
    
    // Check if we're still in header
    if (inHeader && line.startsWith('#EXT-X-')) {
      header.push(line);
      continue;
    }
    
    if (line.startsWith('#EXTINF')) {
      inHeader = false;
      currentMetadata.push(line);
      
      // Extract duration
      const durationMatch = line.match(/#EXTINF:([\d.]+)/);
      const duration = durationMatch ? parseFloat(durationMatch[1]) : undefined;
      
      // Next line should be the URL
      if (i + 1 < lines.length) {
        i++;
        const urlLine = lines[i].trim();
        
        if (urlLine && !urlLine.startsWith('#')) {
          // Resolve URL
          const resolvedUrl = resolveUrl(urlLine, baseUrl);
          const isAd = isAdSegment(resolvedUrl);
          
          segments.push({
            duration,
            url: urlLine, // Keep original URL
            metadata: [...currentMetadata],
            isAd,
          });
          
          currentMetadata = [];
        }
      }
    } else if (line.startsWith('#')) {
      if (inHeader) {
        header.push(line);
      } else {
        currentMetadata.push(line);
      }
    }
  }
  
  return { header, segments };
}

/**
 * Resolve relative URL
 */
function resolveUrl(url: string, baseUrl: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  try {
    const base = new URL(baseUrl);
    return new URL(url, base).href;
  } catch {
    return url;
  }
}

/**
 * Filter M3U8 playlist to remove ads
 */
export function filterM3U8Playlist(content: string, baseUrl: string): string {
  const { header, segments } = parseM3U8(content, baseUrl);
  
  // Filter out ad segments
  const filteredSegments = segments.filter(segment => !segment.isAd);
  
  // Rebuild playlist
  const output: string[] = [...header];
  
  let needsDiscontinuity = false;
  
  for (let i = 0; i < filteredSegments.length; i++) {
    const segment = filteredSegments[i];
    const prevSegment = i > 0 ? filteredSegments[i - 1] : null;
    
    // Check if we need discontinuity tag
    if (prevSegment && needsDiscontinuity) {
      // Find discontinuity in metadata
      const hasDiscontinuity = segment.metadata.some(line =>
        line.includes('DISCONTINUITY')
      );
      
      if (!hasDiscontinuity) {
        // Add discontinuity if needed
        output.push('#EXT-X-DISCONTINUITY');
      }
      needsDiscontinuity = false;
    }
    
    // Add segment metadata (excluding discontinuity tags)
    segment.metadata.forEach(line => {
      if (!line.includes('DISCONTINUITY')) {
        output.push(line);
      }
    });
    
    // Add segment URL
    output.push(segment.url);
  }
  
  return output.join('\n');
}

/**
 * Custom HLS loader with ad filtering
 */
export class AdFilteringHLSLoader {
  private baseUrl: string = '';
  
  load(
    context: any,
    config: any,
    callbacks: any
  ): void {
    const url = context.url;
    
    // Store base URL for resolving relative URLs
    if (url.includes('.m3u8')) {
      this.baseUrl = url.substring(0, url.lastIndexOf('/'));
    }
    
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.text();
      })
      .then(content => {
        // Check if it's a playlist
        if (content.includes('#EXTM3U') && content.includes('#EXTINF')) {
          // Filter ads from playlist
          const filtered = filterM3U8Playlist(content, url);
          
          // Convert to response format
          const blob = new Blob([filtered], { type: 'application/vnd.apple.mpegurl' });
          const reader = new FileReader();
          
          reader.onload = () => {
            callbacks.onSuccess(
              {
                url,
                data: reader.result,
              },
              {
                url,
              },
              context
            );
          };
          
          reader.onerror = () => {
            callbacks.onError(
              {
                code: 500,
                text: 'Failed to process playlist',
              },
              context
            );
          };
          
          reader.readAsText(blob);
        } else {
          // Not a playlist, pass through
          callbacks.onSuccess(
            {
              url,
              data: content,
            },
            {
              url,
            },
            context
          );
        }
      })
      .catch(error => {
        callbacks.onError(
          {
            code: 500,
            text: error.message,
          },
          context
        );
      });
  }
  
  abort(): void {
    // Implement abort logic if needed
  }
}

/**
 * Create HLS config with ad filtering
 */
export function createAdFilteringConfig(hlsConfig: any = {}): any {
  return {
    ...hlsConfig,
    loader: AdFilteringHLSLoader,
    debug: false,
    enableWorker: true,
    lowLatencyMode: false,
    backBufferLength: 90,
  };
}

/**
 * Detect if M3U8 contains ads
 */
export async function detectAdsInM3U8(url: string): Promise<{
  hasAds: boolean;
  adCount: number;
  totalSegments: number;
}> {
  try {
    const response = await fetch(url);
    const content = await response.text();
    
    const { segments } = parseM3U8(content, url);
    const adSegments = segments.filter(s => s.isAd);
    
    return {
      hasAds: adSegments.length > 0,
      adCount: adSegments.length,
      totalSegments: segments.length,
    };
  } catch (error) {
    console.error('Failed to detect ads:', error);
    return {
      hasAds: false,
      adCount: 0,
      totalSegments: 0,
    };
  }
}

/**
 * Add custom ad pattern
 */
const CUSTOM_AD_PATTERNS_KEY = 'kvideo_custom_ad_patterns';

export function addCustomAdPattern(pattern: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const patterns = getCustomAdPatterns();
    if (!patterns.includes(pattern)) {
      patterns.push(pattern);
      localStorage.setItem(CUSTOM_AD_PATTERNS_KEY, JSON.stringify(patterns));
    }
  } catch (error) {
    console.error('Failed to add custom ad pattern:', error);
  }
}

export function getCustomAdPatterns(): string[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(CUSTOM_AD_PATTERNS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function removeCustomAdPattern(pattern: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const patterns = getCustomAdPatterns();
    const filtered = patterns.filter(p => p !== pattern);
    localStorage.setItem(CUSTOM_AD_PATTERNS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove custom ad pattern:', error);
  }
}
