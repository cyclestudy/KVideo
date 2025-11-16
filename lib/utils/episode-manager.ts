/**
 * Episode Manager
 * Handles episode navigation and URL parameter management
 */

import type { Episode } from '@/lib/types';

/**
 * Episode navigation parameters
 */
export interface EpisodeNavParams {
  videoId: string | number;
  title: string;
  source: string;
  episodeIndex: number;
  url: string;
}

/**
 * Build player URL with episode parameters
 */
export function buildPlayerUrl(params: EpisodeNavParams): string {
  const searchParams = new URLSearchParams();
  
  searchParams.set('id', params.videoId.toString());
  searchParams.set('source', params.source);
  searchParams.set('index', params.episodeIndex.toString());
  searchParams.set('url', encodeURIComponent(params.url));
  searchParams.set('title', encodeURIComponent(params.title));

  return `/player?${searchParams.toString()}`;
}

/**
 * Parse episode parameters from URL
 */
export function parsePlayerParams(searchParams: URLSearchParams): EpisodeNavParams | null {
  const id = searchParams.get('id');
  const source = searchParams.get('source');
  const indexStr = searchParams.get('index');
  const url = searchParams.get('url');
  const title = searchParams.get('title');

  if (!id || !source || !indexStr || !url) {
    return null;
  }

  return {
    videoId: id,
    title: title || 'Unknown',
    source,
    episodeIndex: parseInt(indexStr, 10),
    url: decodeURIComponent(url),
  };
}

/**
 * Navigate to next episode
 */
export function getNextEpisodeParams(
  currentParams: EpisodeNavParams,
  episodes: Episode[]
): EpisodeNavParams | null {
  const nextIndex = currentParams.episodeIndex + 1;

  if (nextIndex >= episodes.length) {
    return null; // No more episodes
  }

  const nextEpisode = episodes[nextIndex];

  return {
    ...currentParams,
    episodeIndex: nextIndex,
    url: nextEpisode.url,
  };
}

/**
 * Navigate to previous episode
 */
export function getPrevEpisodeParams(
  currentParams: EpisodeNavParams,
  episodes: Episode[]
): EpisodeNavParams | null {
  const prevIndex = currentParams.episodeIndex - 1;

  if (prevIndex < 0) {
    return null; // Already at first episode
  }

  const prevEpisode = episodes[prevIndex];

  return {
    ...currentParams,
    episodeIndex: prevIndex,
    url: prevEpisode.url,
  };
}

/**
 * Get episode by index
 */
export function getEpisodeByIndex(
  episodes: Episode[],
  index: number
): Episode | null {
  if (index < 0 || index >= episodes.length) {
    return null;
  }

  return episodes[index];
}

/**
 * Validate episode index
 */
export function isValidEpisodeIndex(index: number, episodes: Episode[]): boolean {
  return index >= 0 && index < episodes.length;
}

/**
 * Get episode range for pagination
 */
export function getEpisodeRange(
  episodes: Episode[],
  currentIndex: number,
  rangeSize: number = 10
): Episode[] {
  const halfRange = Math.floor(rangeSize / 2);
  let start = Math.max(0, currentIndex - halfRange);
  let end = Math.min(episodes.length, start + rangeSize);

  // Adjust if we're near the end
  if (end - start < rangeSize) {
    start = Math.max(0, end - rangeSize);
  }

  return episodes.slice(start, end);
}

/**
 * Group episodes into sections
 */
export interface EpisodeSection {
  title: string;
  episodes: Episode[];
  startIndex: number;
  endIndex: number;
}

export function groupEpisodesIntoSections(
  episodes: Episode[],
  sectionSize: number = 20
): EpisodeSection[] {
  const sections: EpisodeSection[] = [];
  
  for (let i = 0; i < episodes.length; i += sectionSize) {
    const end = Math.min(i + sectionSize, episodes.length);
    
    sections.push({
      title: `Episodes ${i + 1}-${end}`,
      episodes: episodes.slice(i, end),
      startIndex: i,
      endIndex: end - 1,
    });
  }

  return sections;
}

/**
 * Reverse episode order
 */
export function reverseEpisodes(episodes: Episode[]): Episode[] {
  return episodes.map((episode, index) => ({
    ...episode,
    index: episodes.length - 1 - index,
  })).reverse();
}

/**
 * Search episodes by name
 */
export function searchEpisodes(episodes: Episode[], query: string): Episode[] {
  if (!query.trim()) return episodes;

  const normalizedQuery = query.toLowerCase();
  
  return episodes.filter(episode =>
    episode.name.toLowerCase().includes(normalizedQuery)
  );
}

/**
 * Get episode progress percentage
 */
export function getEpisodeProgress(
  episodeIndex: number,
  totalEpisodes: number
): number {
  if (totalEpisodes === 0) return 0;
  return Math.round(((episodeIndex + 1) / totalEpisodes) * 100);
}

/**
 * Format episode name
 */
export function formatEpisodeName(episode: Episode, format: 'short' | 'full' = 'full'): string {
  if (format === 'short') {
    // Extract episode number if available
    const match = episode.name.match(/\d+/);
    if (match) {
      return `EP ${match[0]}`;
    }
    return `EP ${episode.index + 1}`;
  }

  return episode.name || `Episode ${episode.index + 1}`;
}

/**
 * Check if episode is watched
 */
export function isEpisodeWatched(
  episodeIndex: number,
  watchedUpTo: number
): boolean {
  return episodeIndex <= watchedUpTo;
}

/**
 * Get unwatched episodes count
 */
export function getUnwatchedCount(
  episodes: Episode[],
  watchedUpTo: number
): number {
  return Math.max(0, episodes.length - watchedUpTo - 1);
}

/**
 * Episode order preference
 */
const EPISODE_ORDER_KEY = 'kvideo_episode_order';

export function saveEpisodeOrder(order: 'normal' | 'reversed'): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(EPISODE_ORDER_KEY, order);
}

export function getEpisodeOrder(): 'normal' | 'reversed' {
  if (typeof window === 'undefined') return 'normal';
  return (localStorage.getItem(EPISODE_ORDER_KEY) as 'normal' | 'reversed') || 'normal';
}

/**
 * Apply episode order preference
 */
export function applyEpisodeOrder(episodes: Episode[]): Episode[] {
  const order = getEpisodeOrder();
  return order === 'reversed' ? reverseEpisodes(episodes) : episodes;
}

/**
 * Toggle episode order
 */
export function toggleEpisodeOrder(): 'normal' | 'reversed' {
  const current = getEpisodeOrder();
  const newOrder = current === 'normal' ? 'reversed' : 'normal';
  saveEpisodeOrder(newOrder);
  return newOrder;
}
