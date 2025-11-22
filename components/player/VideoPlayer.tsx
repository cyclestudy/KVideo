'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icon';
import { useHistoryStore } from '@/lib/store/history-store';
import { CustomVideoPlayer } from './CustomVideoPlayer';

interface VideoPlayerProps {
  playUrl: string;
  videoId?: string;
  currentEpisode: number;
  onBack: () => void;
}

export function VideoPlayer({ playUrl, videoId, currentEpisode, onBack }: VideoPlayerProps) {
  const [videoError, setVideoError] = useState<string>('');
  const [useProxy, setUseProxy] = useState(false);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);
  // Use reactive hook to subscribe to history updates
  // This ensures the component re-renders when history is hydrated from localStorage
  const viewingHistory = useHistoryStore(state => state.viewingHistory);
  const searchParams = useSearchParams();
  const { addToHistory } = useHistoryStore();

  // Get video metadata from URL params
  const source = searchParams.get('source') || '';
  const title = searchParams.get('title') || '未知视频';

  // Get saved progress for this video
  const getSavedProgress = () => {
    if (!videoId) return 0;

    // Directly check HistoryStore for progress
    // This is the single source of truth for playback resumption
    const historyItem = viewingHistory.find(item =>
      // Loose match for videoId (string vs number)
      item.videoId.toString() === videoId?.toString() &&
      item.source === source &&
      item.episodeIndex === currentEpisode
    );

    return historyItem ? historyItem.playbackPosition : 0;
  };

  // Handle time updates and save progress
  const handleTimeUpdate = (currentTime: number, duration: number) => {
    if (!videoId || !playUrl || duration === 0) return;

    // Save progress every few seconds
    if (currentTime > 1) {
      addToHistory(
        videoId,
        title,
        playUrl,
        currentEpisode,
        source,
        currentTime,
        duration,
        undefined,
        []
      );
    }
  };

  // Handle video errors
  const handleVideoError = (error: string) => {
    console.error('Video playback error:', error);

    // Auto-retry with proxy if not already using it
    if (!useProxy) {
      console.log('Attempting to retry with proxy...');
      setUseProxy(true);
      setShouldAutoPlay(true); // Force autoplay after proxy retry
      setVideoError('');
      return;
    }

    setVideoError(error);
  };

  const finalPlayUrl = useProxy
    ? `/api/proxy?url=${encodeURIComponent(playUrl)}`
    : playUrl;

  if (!playUrl) {
    return (
      <Card hover={false} className="p-0 overflow-hidden">
        <div className="aspect-video bg-[var(--glass-bg)] backdrop-blur-[25px] saturate-[180%] rounded-[var(--radius-2xl)] flex items-center justify-center border border-[var(--glass-border)]">
          <div className="text-center text-[var(--text-secondary)]">
            <Icons.TV size={64} className="text-[var(--text-color-secondary)] mx-auto mb-4" />
            <p>暂无播放源</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card hover={false} className="p-0 overflow-hidden">
      {videoError ? (
        <div className="aspect-video bg-black rounded-[var(--radius-2xl)] flex items-center justify-center">
          <div
            className="text-center text-white max-w-md px-4"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <Icons.AlertTriangle size={48} className="mx-auto mb-4 text-red-500" />
            <p className="text-lg font-semibold mb-2">播放失败</p>
            <p className="text-sm text-gray-300 mb-4">{videoError}</p>
            <div className="flex gap-2 justify-center flex-wrap">
              <Button
                variant="secondary"
                onClick={onBack}
                className="flex items-center gap-2"
              >
                <Icons.ChevronLeft size={16} />
                <span>返回</span>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <CustomVideoPlayer
          key={useProxy ? 'proxy' : 'direct'} // Force remount when switching modes
          src={finalPlayUrl}
          onError={handleVideoError}
          onTimeUpdate={handleTimeUpdate}
          initialTime={getSavedProgress()}
          shouldAutoPlay={shouldAutoPlay}
        />
      )}
    </Card>
  );
}
