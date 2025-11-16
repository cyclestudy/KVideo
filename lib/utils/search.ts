/**
 * Search Utilities
 * Debouncing, result merging, and search optimization
 */

import type { VideoItem, SearchResult } from '@/lib/types';

/**
 * Debounce function for search input
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Throttle function for limiting function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Merge and deduplicate search results from multiple sources
 */
export function mergeSearchResults(results: SearchResult[]): VideoItem[] {
  const seenTitles = new Set<string>();
  const mergedResults: VideoItem[] = [];

  // Process results by response time (fastest first)
  const sortedResults = [...results].sort((a, b) => {
    const timeA = a.responseTime || Infinity;
    const timeB = b.responseTime || Infinity;
    return timeA - timeB;
  });

  for (const result of sortedResults) {
    if (result.error) continue;

    for (const item of result.results) {
      // Normalize title for comparison
      const normalizedTitle = normalizeTitle(item.vod_name);

      if (!seenTitles.has(normalizedTitle)) {
        seenTitles.add(normalizedTitle);
        mergedResults.push(item);
      }
    }
  }

  return mergedResults;
}

/**
 * Normalize title for deduplication
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Group search results by source
 */
export function groupResultsBySource(
  results: SearchResult[]
): Map<string, VideoItem[]> {
  const grouped = new Map<string, VideoItem[]>();

  for (const result of results) {
    if (!result.error && result.results.length > 0) {
      grouped.set(result.source, result.results);
    }
  }

  return grouped;
}

/**
 * Filter search results by criteria
 */
export interface SearchFilters {
  year?: string;
  area?: string;
  type?: string;
  keyword?: string;
}

export function filterResults(
  results: VideoItem[],
  filters: SearchFilters
): VideoItem[] {
  return results.filter(item => {
    if (filters.year && item.vod_year !== filters.year) {
      return false;
    }

    if (filters.area && item.vod_area !== filters.area) {
      return false;
    }

    if (filters.type && item.type_name !== filters.type) {
      return false;
    }

    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      const searchText = `${item.vod_name} ${item.vod_actor || ''} ${item.vod_director || ''}`.toLowerCase();
      if (!searchText.includes(keyword)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort search results
 */
export type SortOption = 'relevance' | 'year' | 'name' | 'updated';

export function sortResults(
  results: VideoItem[],
  sortBy: SortOption = 'relevance'
): VideoItem[] {
  const sorted = [...results];

  switch (sortBy) {
    case 'year':
      sorted.sort((a, b) => {
        const yearA = parseInt(a.vod_year || '0');
        const yearB = parseInt(b.vod_year || '0');
        return yearB - yearA;
      });
      break;

    case 'name':
      sorted.sort((a, b) => a.vod_name.localeCompare(b.vod_name));
      break;

    case 'updated':
      // Assuming vod_remarks contains update info
      sorted.sort((a, b) => {
        const remarkA = a.vod_remarks || '';
        const remarkB = b.vod_remarks || '';
        return remarkB.localeCompare(remarkA);
      });
      break;

    case 'relevance':
    default:
      // Keep original order (sorted by API)
      break;
  }

  return sorted;
}

/**
 * Highlight search query in text
 */
export function highlightQuery(text: string, query: string): string {
  if (!query || !text) return text;

  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract search suggestions from query
 */
export function getSearchSuggestions(
  query: string,
  history: string[]
): string[] {
  if (!query) return [];

  const normalizedQuery = query.toLowerCase();
  
  return history
    .filter(item => item.toLowerCase().includes(normalizedQuery))
    .slice(0, 5);
}

/**
 * Save search query to history
 */
const SEARCH_HISTORY_KEY = 'kvideo_search_history';
const MAX_SEARCH_HISTORY = 20;

export function saveSearchQuery(query: string): void {
  if (typeof window === 'undefined' || !query.trim()) return;

  try {
    const history = getSearchHistory();
    
    // Remove duplicate
    const filtered = history.filter(
      item => item.toLowerCase() !== query.toLowerCase()
    );
    
    // Add to front
    const updated = [query, ...filtered].slice(0, MAX_SEARCH_HISTORY);
    
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save search query:', error);
  }
}

/**
 * Get search history
 */
export function getSearchHistory(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Clear search history
 */
export function clearSearchHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SEARCH_HISTORY_KEY);
}

/**
 * Calculate search relevance score
 */
export function calculateRelevanceScore(item: VideoItem, query: string): number {
  let score = 0;
  const normalizedQuery = query.toLowerCase();

  // Exact title match
  if (item.vod_name.toLowerCase() === normalizedQuery) {
    score += 100;
  }
  // Title starts with query
  else if (item.vod_name.toLowerCase().startsWith(normalizedQuery)) {
    score += 50;
  }
  // Title contains query
  else if (item.vod_name.toLowerCase().includes(normalizedQuery)) {
    score += 25;
  }

  // Actor match
  if (item.vod_actor?.toLowerCase().includes(normalizedQuery)) {
    score += 10;
  }

  // Director match
  if (item.vod_director?.toLowerCase().includes(normalizedQuery)) {
    score += 10;
  }

  // Recent year bonus
  const currentYear = new Date().getFullYear();
  const itemYear = parseInt(item.vod_year || '0');
  if (itemYear >= currentYear - 2) {
    score += 5;
  }

  return score;
}
