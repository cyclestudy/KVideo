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
 * Higher score = more relevant to the search query
 */
export function calculateRelevanceScore(item: VideoItem, query: string): number {
  let score = 0;
  const normalizedQuery = query.toLowerCase().trim();
  const normalizedTitle = item.vod_name.toLowerCase();

  // Split query into words for partial matching
  const queryWords = normalizedQuery.split(/\s+/);
  
  // 1. Exact title match (highest priority)
  if (normalizedTitle === normalizedQuery) {
    score += 1000;
    return score; // Early return for perfect match
  }

  // 2. Title starts with query (very high priority)
  if (normalizedTitle.startsWith(normalizedQuery)) {
    score += 500;
  }

  // 3. Title contains full query as substring
  if (normalizedTitle.includes(normalizedQuery)) {
    score += 200;
    
    // Bonus for query appearing earlier in title
    const position = normalizedTitle.indexOf(normalizedQuery);
    score += Math.max(0, 50 - position * 2);
  }

  // 4. All query words present in title
  const allWordsPresent = queryWords.every(word => 
    normalizedTitle.includes(word)
  );
  if (allWordsPresent && queryWords.length > 1) {
    score += 100;
  }

  // 5. Individual word matches
  queryWords.forEach(word => {
    if (word.length < 2) return; // Skip very short words
    
    if (normalizedTitle.includes(word)) {
      score += 30;
      
      // Bonus if word is at the start
      if (normalizedTitle.startsWith(word)) {
        score += 20;
      }
    }
  });

  // 6. Actor match
  if (item.vod_actor) {
    const normalizedActor = item.vod_actor.toLowerCase();
    if (normalizedActor.includes(normalizedQuery)) {
      score += 80;
    }
    queryWords.forEach(word => {
      if (word.length >= 2 && normalizedActor.includes(word)) {
        score += 15;
      }
    });
  }

  // 7. Director match
  if (item.vod_director) {
    const normalizedDirector = item.vod_director.toLowerCase();
    if (normalizedDirector.includes(normalizedQuery)) {
      score += 60;
    }
    queryWords.forEach(word => {
      if (word.length >= 2 && normalizedDirector.includes(word)) {
        score += 10;
      }
    });
  }

  // 8. Content/description match (if available)
  if (item.vod_content) {
    const normalizedContent = item.vod_content.toLowerCase();
    if (normalizedContent.includes(normalizedQuery)) {
      score += 20;
    }
  }

  // 9. Recent year bonus (favor newer content)
  const currentYear = new Date().getFullYear();
  const itemYear = parseInt(item.vod_year || '0');
  if (itemYear > 0) {
    const yearDiff = currentYear - itemYear;
    if (yearDiff === 0) {
      score += 15; // Current year
    } else if (yearDiff === 1) {
      score += 10; // Last year
    } else if (yearDiff <= 3) {
      score += 5; // Within 3 years
    }
  }

  // 10. Penalty for very long titles (might be less relevant)
  if (item.vod_name.length > 50) {
    score -= 5;
  }

  // 11. Bonus for HD/quality indicators in remarks
  if (item.vod_remarks) {
    const remarks = item.vod_remarks.toLowerCase();
    if (remarks.includes('hd') || remarks.includes('1080') || remarks.includes('4k')) {
      score += 5;
    }
    if (remarks.includes('完结') || remarks.includes('全集')) {
      score += 3;
    }
  }

  return Math.max(0, score); // Ensure non-negative
}
