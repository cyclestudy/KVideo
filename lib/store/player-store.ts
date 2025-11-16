/**
 * Player State Store using Zustand
 * Manages video playback state including current video, episodes, and playback settings
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlayerState, Episode } from '@/lib/types';

interface PlayerStore extends PlayerState {
  // Actions
  setVideo: (video: {
    id: string | number;
    title: string;
    url: string;
    source: string;
    episodeIndex: number;
  }) => void;
  setEpisodes: (episodes: Episode[]) => void;
  updatePosition: (position: number) => void;
  updateDuration: (duration: number) => void;
  setPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  toggleAutoplay: () => void;
  nextEpisode: () => Episode | null;
  prevEpisode: () => Episode | null;
  clearVideo: () => void;
  reset: () => void;
}

const initialState: PlayerState = {
  currentVideo: null,
  episodes: [],
  playbackPosition: 0,
  duration: 0,
  isPlaying: false,
  autoplayNext: true,
  volume: 1,
  playbackRate: 1,
};

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setVideo: (video) => {
        set({
          currentVideo: video,
          playbackPosition: 0,
        });
      },

      setEpisodes: (episodes) => {
        set({ episodes });
      },

      updatePosition: (position) => {
        set({ playbackPosition: position });
      },

      updateDuration: (duration) => {
        set({ duration });
      },

      setPlaying: (isPlaying) => {
        set({ isPlaying });
      },

      setVolume: (volume) => {
        // Clamp volume between 0 and 1
        const clampedVolume = Math.max(0, Math.min(1, volume));
        set({ volume: clampedVolume });
      },

      setPlaybackRate: (rate) => {
        // Support common playback rates
        const validRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
        const clampedRate = validRates.reduce((prev, curr) =>
          Math.abs(curr - rate) < Math.abs(prev - rate) ? curr : prev
        );
        set({ playbackRate: clampedRate });
      },

      toggleAutoplay: () => {
        set((state) => ({ autoplayNext: !state.autoplayNext }));
      },

      nextEpisode: () => {
        const { currentVideo, episodes } = get();
        
        if (!currentVideo || episodes.length === 0) {
          return null;
        }

        const nextIndex = currentVideo.episodeIndex + 1;
        
        if (nextIndex >= episodes.length) {
          return null; // No more episodes
        }

        const nextEpisode = episodes[nextIndex];
        
        // Update current video
        set({
          currentVideo: {
            ...currentVideo,
            episodeIndex: nextIndex,
            url: nextEpisode.url,
          },
          playbackPosition: 0,
        });

        return nextEpisode;
      },

      prevEpisode: () => {
        const { currentVideo, episodes } = get();
        
        if (!currentVideo || episodes.length === 0) {
          return null;
        }

        const prevIndex = currentVideo.episodeIndex - 1;
        
        if (prevIndex < 0) {
          return null; // Already at first episode
        }

        const prevEpisode = episodes[prevIndex];
        
        // Update current video
        set({
          currentVideo: {
            ...currentVideo,
            episodeIndex: prevIndex,
            url: prevEpisode.url,
          },
          playbackPosition: 0,
        });

        return prevEpisode;
      },

      clearVideo: () => {
        set({
          currentVideo: null,
          playbackPosition: 0,
          duration: 0,
          isPlaying: false,
        });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'kvideo-player-store',
      // Only persist certain fields
      partialize: (state) => ({
        autoplayNext: state.autoplayNext,
        volume: state.volume,
        playbackRate: state.playbackRate,
      }),
    }
  )
);

// Selector hooks for optimized re-renders
export const useCurrentVideo = () => usePlayerStore((state) => state.currentVideo);
export const useEpisodes = () => usePlayerStore((state) => state.episodes);
export const usePlaybackPosition = () => usePlayerStore((state) => state.playbackPosition);
export const useIsPlaying = () => usePlayerStore((state) => state.isPlaying);
export const useAutoplayNext = () => usePlayerStore((state) => state.autoplayNext);
export const useVolume = () => usePlayerStore((state) => state.volume);
export const usePlaybackRate = () => usePlayerStore((state) => state.playbackRate);
