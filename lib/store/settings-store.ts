/**
 * Settings Store - Manages application settings and preferences
 */

import type { VideoSource } from '@/lib/types';
import { DEFAULT_SOURCES } from '@/lib/api/default-sources';

export type SortOption =
  | 'default'
  | 'relevance'
  | 'latency-asc'
  | 'date-desc'
  | 'date-asc'
  | 'rating-desc'
  | 'name-asc'
  | 'name-desc';

export interface AppSettings {
  sources: VideoSource[];
  sortBy: SortOption;
  searchHistory: boolean;
  watchHistory: boolean;
}

import { exportSettings, importSettings, SEARCH_HISTORY_KEY, WATCH_HISTORY_KEY } from './settings-helpers';

const SETTINGS_KEY = 'kvideo-settings';

export const getDefaultSources = (): VideoSource[] => DEFAULT_SOURCES;

export const settingsStore = {
  getSettings(): AppSettings {
    if (typeof window === 'undefined') {
      return {
        sources: getDefaultSources(),
        sortBy: 'default',
        searchHistory: true,
        watchHistory: true,
      };
    }

    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) {
      return {
        sources: getDefaultSources(),
        sortBy: 'default',
        searchHistory: true,
        watchHistory: true,
      };
    }

    try {
      const parsed = JSON.parse(stored);
      // Validate that parsed data has all required properties
      return {
        sources: Array.isArray(parsed.sources) ? parsed.sources : getDefaultSources(),
        sortBy: parsed.sortBy || 'default',
        searchHistory: parsed.searchHistory !== undefined ? parsed.searchHistory : true,
        watchHistory: parsed.watchHistory !== undefined ? parsed.watchHistory : true,
      };
    } catch {
      return {
        sources: getDefaultSources(),
        sortBy: 'default',
        searchHistory: true,
        watchHistory: true,
      };
    }
  },

  listeners: new Set<() => void>(),

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  },

  notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  },

  saveSettings(settings: AppSettings): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      this.notifyListeners();
    }
  },

  exportSettings(includeHistory: boolean = true): string {
    return exportSettings(this.getSettings(), includeHistory);
  },

  importSettings(jsonString: string): boolean {
    return importSettings(jsonString, (s) => this.saveSettings(s));
  },

  resetToDefaults(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SETTINGS_KEY);
      localStorage.removeItem(SEARCH_HISTORY_KEY);
      localStorage.removeItem(WATCH_HISTORY_KEY);

      // Clear all cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      // Clear cache if available
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach(name => caches.delete(name));
        });
      }
    }
  },
};
