/**
 * Progress Tracker Utility
 * Manages video playback progress with localStorage persistence
 */

import type { VideoProgress } from '@/lib/types';

const STORAGE_PREFIX = 'kvideo_progress_';
const PROGRESS_SAVE_THRESHOLD = 10; // seconds
const RESUME_MIN_POSITION = 10; // seconds
const RESUME_MAX_REMAINING = 120; // seconds

/**
 * Get progress key for a video
 */
function getProgressKey(videoId: string | number, source: string): string {
  return `${STORAGE_PREFIX}${source}_${videoId}`;
}

/**
 * Save video progress to localStorage
 */
export function saveProgress(
  videoId: string | number,
  source: string,
  position: number,
  duration: number,
  episodeIndex: number = 0
): void {
  if (typeof window === 'undefined') return;

  // Don't save if position is too early or too late
  if (position < PROGRESS_SAVE_THRESHOLD) return;
  if (duration > 0 && duration - position < RESUME_MAX_REMAINING) {
    // Video is almost finished, clear progress
    clearProgress(videoId, source);
    return;
  }

  try {
    const progress: VideoProgress = {
      videoId,
      position,
      duration,
      timestamp: Date.now(),
      episodeIndex,
    };

    const key = getProgressKey(videoId, source);
    localStorage.setItem(key, JSON.stringify(progress));
  } catch (error) {
    console.error('Failed to save progress:', error);
  }
}

/**
 * Get video progress from localStorage
 */
export function getProgress(
  videoId: string | number,
  source: string
): VideoProgress | null {
  if (typeof window === 'undefined') return null;

  try {
    const key = getProgressKey(videoId, source);
    const stored = localStorage.getItem(key);

    if (!stored) return null;

    const progress: VideoProgress = JSON.parse(stored);

    // Validate progress data
    if (!progress.position || !progress.timestamp) {
      return null;
    }

    return progress;
  } catch (error) {
    console.error('Failed to get progress:', error);
    return null;
  }
}

/**
 * Check if progress should be resumed
 */
export function shouldResumeProgress(progress: VideoProgress | null): boolean {
  if (!progress) return false;

  const { position, duration } = progress;

  // Don't resume if position is too early
  if (position < RESUME_MIN_POSITION) return false;

  // Don't resume if video is almost finished
  if (duration > 0 && duration - position < RESUME_MAX_REMAINING) return false;

  return true;
}

/**
 * Clear video progress
 */
export function clearProgress(videoId: string | number, source: string): void {
  if (typeof window === 'undefined') return;

  try {
    const key = getProgressKey(videoId, source);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear progress:', error);
  }
}

/**
 * Get all stored progress entries
 */
export function getAllProgress(): VideoProgress[] {
  if (typeof window === 'undefined') return [];

  const allProgress: VideoProgress[] = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key && key.startsWith(STORAGE_PREFIX)) {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const progress: VideoProgress = JSON.parse(stored);
            allProgress.push(progress);
          } catch {
            // Invalid progress entry, skip
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to get all progress:', error);
  }

  return allProgress;
}

/**
 * Clear old progress entries (older than 30 days)
 */
export function clearOldProgress(daysOld: number = 30): number {
  if (typeof window === 'undefined') return 0;

  const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
  let clearedCount = 0;

  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key && key.startsWith(STORAGE_PREFIX)) {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const progress: VideoProgress = JSON.parse(stored);
            if (progress.timestamp < cutoffTime) {
              keysToRemove.push(key);
            }
          } catch {
            // Invalid entry, mark for removal
            keysToRemove.push(key);
          }
        }
      }
    }

    // Remove old entries
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      clearedCount++;
    });
  } catch (error) {
    console.error('Failed to clear old progress:', error);
  }

  return clearedCount;
}

/**
 * Throttle function for saving progress
 */
export function createProgressSaver(
  saveInterval: number = 5000
): (
  videoId: string | number,
  source: string,
  position: number,
  duration: number,
  episodeIndex?: number
) => void {
  let lastSaveTime = 0;
  let pendingSave: ReturnType<typeof setTimeout> | null = null;

  return (videoId, source, position, duration, episodeIndex = 0) => {
    const now = Date.now();

    // Clear any pending save
    if (pendingSave) {
      clearTimeout(pendingSave);
    }

    // Save immediately if enough time has passed
    if (now - lastSaveTime >= saveInterval) {
      saveProgress(videoId, source, position, duration, episodeIndex);
      lastSaveTime = now;
    } else {
      // Schedule a save for later
      pendingSave = setTimeout(() => {
        saveProgress(videoId, source, position, duration, episodeIndex);
        lastSaveTime = Date.now();
      }, saveInterval - (now - lastSaveTime));
    }
  };
}
