'use client';

import { useState, useRef, useCallback } from 'react';
import { getSourceName, SOURCE_IDS } from '@/lib/utils/source-names';
import { checkVideoAvailability } from '@/lib/utils/source-checker';
import { calculateRelevanceScore } from '@/lib/utils/search';

interface Video {
  vod_id: string;
  vod_name: string;
  vod_pic?: string;
  vod_remarks?: string;
  vod_year?: string;
  type_name?: string;
  source: string;
  sourceName?: string;
  isNew?: boolean;
  isVerifying?: boolean;
  vod_play_url?: string;
  vod_actor?: string;
  vod_director?: string;
  relevanceScore?: number;
}

export interface ParallelSearchResult {
  loading: boolean;
  results: Video[];
  availableSources: any[];
  completedSources: number;
  totalSources: number;
  totalVideosFound: number;
  performSearch: (query: string) => Promise<void>;
  resetSearch: () => void;
  loadCachedResults: (results: Video[], sources: any[]) => void;
}

export function useParallelSearch(
  onCacheUpdate: (query: string, results: any[], sources: any[]) => void,
  onUrlUpdate: (query: string) => void
): ParallelSearchResult {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Video[]>([]);
  const [availableSources, setAvailableSources] = useState<any[]>([]);
  const [completedSources, setCompletedSources] = useState(0);
  const [totalSources, setTotalSources] = useState(0);
  const [totalVideosFound, setTotalVideosFound] = useState(0);
  const currentQueryRef = useRef<string>('');
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const verificationQueueRef = useRef<Video[]>([]);
  const verifyingCountRef = useRef(0);
  const allVideosReceivedRef = useRef(false);
  const MAX_CONCURRENT_VERIFICATIONS = 15;

  /**
   * Process verification queue
   * Verifies videos in parallel with a max concurrency limit
   */
  const processVerificationQueue = useCallback(async () => {
    while (verificationQueueRef.current.length > 0 && verifyingCountRef.current < MAX_CONCURRENT_VERIFICATIONS) {
      const video = verificationQueueRef.current.shift();
      if (!video) continue;

      verifyingCountRef.current++;

      // Verify in background
      checkVideoAvailability(video)
        .then((isValid) => {
          verifyingCountRef.current--;

          setResults((prev) => {
            if (isValid) {
              // Remove verifying badge, maintain sort order
              const updated = prev.map((v) =>
                v.vod_id === video.vod_id && v.source === video.source
                  ? { ...v, isVerifying: false }
                  : v
              );
              // Re-sort by relevance to maintain order
              return updated.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
            } else {
              // Remove invalid video
              const removedVideo = prev.find(
                (v) => v.vod_id === video.vod_id && v.source === video.source
              );
              
              if (removedVideo && allVideosReceivedRef.current) {
                // Update source count when removing video after search is complete
                setAvailableSources((sources) =>
                  sources.map((s) =>
                    s.id === removedVideo.source
                      ? { ...s, count: Math.max(0, s.count - 1) }
                      : s
                  ).filter(s => s.count > 0)
                );
              }
              
              const filtered = prev.filter(
                (v) => !(v.vod_id === video.vod_id && v.source === video.source)
              );
              // Maintain sort order
              return filtered.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
            }
          });

          // Continue processing queue
          processVerificationQueue();
        })
        .catch((error) => {
          console.error('Verification error:', error);
          verifyingCountRef.current--;
          
          // Remove video on error
          setResults((prev) => {
            const removedVideo = prev.find(
              (v) => v.vod_id === video.vod_id && v.source === video.source
            );
            
            if (removedVideo && allVideosReceivedRef.current) {
              // Update source count when removing video
              setAvailableSources((sources) =>
                sources.map((s) =>
                  s.id === removedVideo.source
                    ? { ...s, count: Math.max(0, s.count - 1) }
                    : s
                ).filter(s => s.count > 0)
              );
            }
            
            const filtered = prev.filter(
              (v) => !(v.vod_id === video.vod_id && v.source === video.source)
            );
            // Maintain sort order
            return filtered.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
          });

          // Continue processing queue
          processVerificationQueue();
        });
    }
  }, []);

  /**
   * Add videos to verification queue
   */
  const queueVideosForVerification = useCallback((videos: Video[]) => {
    verificationQueueRef.current.push(...videos);
    processVerificationQueue();
  }, [processVerificationQueue]);

  /**
   * Perform parallel search with streaming results
   */
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    // Abort any ongoing search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Reset state
    setLoading(true);
    setResults([]);
    setAvailableSources([]);
    setCompletedSources(0);
    setTotalSources(0);
    setTotalVideosFound(0);
    verificationQueueRef.current = [];
    verifyingCountRef.current = 0;
    allVideosReceivedRef.current = false;
    currentQueryRef.current = searchQuery.trim();

    // Update URL
    onUrlUpdate(searchQuery);

    try {
      const response = await fetch('/api/search-parallel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, sources: SOURCE_IDS }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error('Search failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No response stream');

      let buffer = '';
      const sourcesMap = new Map<string, { count: number; name: string }>();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'start') {
              setTotalSources(data.totalSources);
              console.log(`[useParallelSearch] Started search for ${data.totalSources} sources`);
            } 
            else if (data.type === 'videos') {
              const currentQuery = currentQueryRef.current;
              const newVideos: Video[] = data.videos.map((video: any) => ({
                ...video,
                sourceName: video.sourceDisplayName || getSourceName(video.source),
                isNew: true,
                isVerifying: true, // All videos start as verifying
                relevanceScore: calculateRelevanceScore(video, currentQuery),
              }));

              console.log(`[useParallelSearch] Received ${newVideos.length} videos from source ${data.source}`);

              // Add videos and sort by relevance
              setResults((prev) => {
                const combined = [...prev, ...newVideos];
                // Sort by relevance score (highest first)
                return combined.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
              });

              // Queue videos for verification
              queueVideosForVerification(newVideos);

              // Update source stats
              if (!sourcesMap.has(data.source)) {
                sourcesMap.set(data.source, {
                  count: newVideos.length,
                  name: newVideos[0]?.sourceName || data.source,
                });
              }
            } 
            else if (data.type === 'progress') {
              setCompletedSources(data.completedSources);
              setTotalVideosFound(data.totalVideosFound);
            } 
            else if (data.type === 'complete') {
              setLoading(false);
              allVideosReceivedRef.current = true;
              
              console.log(`[useParallelSearch] Search complete: ${data.totalVideosFound} videos found`);
              console.log(`[useParallelSearch] Sources with videos: ${sourcesMap.size}`);
              
              // Update available sources with correct property names
              const sources = Array.from(sourcesMap.entries()).map(([id, info]) => ({
                id: id,  // Changed from sourceId to id
                name: info.name,  // Changed from sourceName to name
                count: info.count,
              }));
              setAvailableSources(sources);

              console.log('[useParallelSearch] Available sources:', sources);

              // Cache results - wait a bit for current results to be in state
              setTimeout(() => {
                setResults((currentResults) => {
                  onCacheUpdate(searchQuery, currentResults, sources);
                  return currentResults;
                });
              }, 100);
            } 
            else if (data.type === 'error') {
              console.error('Search error:', data.message);
              setLoading(false);
            }
          } catch (error) {
            console.error('Error parsing stream data:', error);
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Search aborted');
      } else {
        console.error('Search error:', error);
      }
      setLoading(false);
    }
  }, [loading, onUrlUpdate, onCacheUpdate, queueVideosForVerification]);

  /**
   * Reset search state
   */
  const resetSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLoading(false);
    setResults([]);
    setAvailableSources([]);
    setCompletedSources(0);
    setTotalSources(0);
    setTotalVideosFound(0);
    verificationQueueRef.current = [];
    verifyingCountRef.current = 0;
    allVideosReceivedRef.current = false;
    currentQueryRef.current = '';
  }, []);

  /**
   * Load cached results
   */
  const loadCachedResults = useCallback((cachedResults: Video[], cachedSources: any[]) => {
    console.log('[useParallelSearch] Loading cached results:', cachedResults.length, 'videos');
    setResults(cachedResults);
    setAvailableSources(cachedSources);
    setTotalVideosFound(cachedResults.length);
    allVideosReceivedRef.current = true;
  }, []);

  return {
    loading,
    results,
    availableSources,
    completedSources,
    totalSources,
    totalVideosFound,
    performSearch,
    resetSearch,
    loadCachedResults,
  };
}
