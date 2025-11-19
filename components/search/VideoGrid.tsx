'use client';

import { useState, useRef, useCallback, useMemo, memo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icon';
import { LatencyBadge } from '@/components/ui/LatencyBadge';

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
  latency?: number; // Response time in milliseconds
}

interface VideoGridProps {
  videos: Video[];
  className?: string;
}

// Memoized VideoCard component to prevent unnecessary re-renders
const VideoCard = memo(({ 
  video, 
  videoUrl, 
  cardId, 
  isActive, 
  onCardClick 
}: { 
  video: Video; 
  videoUrl: string; 
  cardId: string; 
  isActive: boolean; 
  onCardClick: (e: React.MouseEvent, cardId: string, videoUrl: string) => void;
}) => {
  return (
    <div
      style={{ 
        // CSS containment for better performance
        contain: 'layout style paint',
        contentVisibility: 'auto',
      }}
    >
      <Link 
        key={cardId}
        href={videoUrl}
        onClick={(e) => onCardClick(e, cardId, videoUrl)}
        role="listitem"
        aria-label={`${video.vod_name}${video.vod_remarks ? ` - ${video.vod_remarks}` : ''}`}
        prefetch={false}
      >
        <Card
          className="p-0 overflow-hidden group cursor-pointer flex flex-col h-full bg-[var(--bg-color)]/50 backdrop-blur-none saturate-100 shadow-sm border-[var(--glass-border)] hover:shadow-lg transition-shadow"
          hover={false} // Disable default hover scale to improve performance
          style={{ 
            willChange: 'transform',
            transform: 'translate3d(0,0,0)',
            backfaceVisibility: 'hidden',
          }}
        >
          {/* Poster */}
          <div className="relative aspect-[2/3] bg-[color-mix(in_srgb,var(--glass-bg)_50%,transparent)] overflow-hidden rounded-[var(--radius-2xl)]">
            {video.vod_pic ? (
              <Image
                src={video.vod_pic}
                alt={video.vod_name}
                fill
                className="object-cover rounded-[var(--radius-2xl)]"
                sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 16vw"
                loading="lazy"
                unoptimized={true} // Skip server-side optimization for better scroll performance on localhost
                onError={(e) => {
                  // Fallback for next/image error is tricky because it doesn't expose the img element directly in the same way
                  // But we can try to hide it or show a placeholder
                  const target = e.currentTarget as HTMLImageElement;
                  // Since next/image manages the src, we might need a state or a different approach for fallback
                  // For simplicity in this performance fix, we'll rely on the parent div background or a separate placeholder component
                  // But actually, we can just use a simple img tag for fallback if next/image fails, 
                  // or better: use a state to switch to fallback. 
                  // However, inside a memoized component, adding state might be heavy.
                  // Let's stick to a simple CSS hide for now or use the unoptimized prop if it fails? No.
                  // Let's just hide it and let the background icon show.
                  target.style.opacity = '0';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Icons.Film size={64} className="text-[var(--text-color-secondary)]" />
              </div>
            )}
            
            {/* Fallback Icon (always rendered behind image, visible if image fails/loads) */}
            <div className="absolute inset-0 flex items-center justify-center -z-10">
               <Icons.Film size={64} className="text-[var(--text-color-secondary)] opacity-20" />
            </div>
          
            {/* Badge Container - Top, spans full width with proper spacing */}
            <div className="absolute top-2 left-2 right-2 z-10 flex items-start justify-between gap-1">
              {/* Source Badge - Left */}
              {video.sourceName && (
                <Badge variant="primary" className="text-[10px] px-1.5 py-0.5 bg-[var(--accent-color)] flex-shrink-0 max-w-[50%] truncate">
                  {video.sourceName}
                </Badge>
              )}
              
              {/* Latency Badge - Right */}
              {video.latency !== undefined && (
                <div className="flex-shrink-0">
                  <LatencyBadge latency={video.latency} className="text-[10px] px-1.5 py-0.5" />
                </div>
              )}
            </div>
          
            {/* Overlay - Show on hover (desktop) or when active (mobile) */}
            <div 
              className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
                isActive ? 'opacity-100 lg:opacity-0 lg:group-hover:opacity-100' : 'opacity-0 lg:group-hover:opacity-100'
              }`}
              style={{ 
                willChange: 'opacity',
              }}
            >
              <div className="absolute bottom-0 left-0 right-0 p-3">
                {/* Mobile indicator when active */}
                {isActive && (
                  <div className="lg:hidden text-white/90 text-xs mb-2 font-medium">
                    再次点击播放 →
                  </div>
                )}
                {video.type_name && (
                  <Badge variant="secondary" className="text-xs mb-2">
                    {video.type_name}
                  </Badge>
                )}
                {video.vod_year && (
                  <div className="flex items-center gap-1 text-white/80 text-xs">
                    <Icons.Calendar size={12} />
                    <span>{video.vod_year}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

        {/* Info - Fixed height section */}
        <div className="p-3 flex-1 flex flex-col">
          <h4 className="font-semibold text-sm text-[var(--text-color)] line-clamp-2 min-h-[2.5rem]">
            {video.vod_name}
          </h4>
          {video.vod_remarks && (
            <p className="text-xs text-[var(--text-color-secondary)] mt-1 line-clamp-1">
              {video.vod_remarks}
            </p>
          )}
        </div>
      </Card>
    </Link>
    </div>
  );
});

VideoCard.displayName = 'VideoCard';

export const VideoGrid = memo(function VideoGrid({ videos, className = '' }: VideoGridProps) {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(24);
  const gridRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  if (videos.length === 0) {
    return null;
  }

  // Callback ref for the load more trigger to handle dynamic mounting/unmounting
  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();
    
    if (node) {
      observerRef.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => prev + 24);
        }
      }, { rootMargin: '400px' });
      
      observerRef.current.observe(node);
    }
  }, []);

  // Memoize the click handler to prevent re-renders
  const handleCardClick = useCallback((e: React.MouseEvent, videoId: string, videoUrl: string) => {
    // Check if it's a mobile device
    const isMobile = window.innerWidth < 1024; // lg breakpoint
    
    if (isMobile) {
      // On mobile, first click shows details, second click navigates
      if (activeCardId === videoId) {
        // Already active, allow navigation
        window.location.href = videoUrl;
      } else {
        // First click, show details
        e.preventDefault();
        setActiveCardId(videoId);
      }
    }
    // On desktop, let the Link work normally
  }, [activeCardId]);

  // Memoize video items to prevent unnecessary re-computations
  const videoItems = useMemo(() => {
    return videos.map((video, index) => {
      const videoUrl = `/player?${new URLSearchParams({
        id: video.vod_id,
        source: video.source,
        title: video.vod_name,
      }).toString()}`;
      
      const cardId = `${video.vod_id}-${index}`;
      
      return {
        video,
        videoUrl,
        cardId,
      };
    });
  }, [videos]);

  const visibleItems = videoItems.slice(0, visibleCount);

  return (
    <>
      <div 
        ref={gridRef}
        className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-3 md:gap-4 lg:gap-6 max-w-[1920px] mx-auto ${className}`}
        role="list"
        aria-label="视频搜索结果"
        style={{
          // Optimize rendering performance
          willChange: 'auto',
          contain: 'layout style paint',
          contentVisibility: 'auto',
        }}
      >
        {visibleItems.map(({ video, videoUrl, cardId }) => {
          const isActive = activeCardId === cardId;
          
          return (
            <VideoCard
              key={cardId}
              video={video}
              videoUrl={videoUrl}
              cardId={cardId}
              isActive={isActive}
              onCardClick={handleCardClick}
            />
          );
        })}
      </div>
      
      {/* Load more trigger */}
      {visibleCount < videoItems.length && (
        <div 
          ref={loadMoreRef} 
          className="h-20 w-full flex items-center justify-center opacity-0 pointer-events-none"
          aria-hidden="true"
        />
      )}
    </>
  );
});
