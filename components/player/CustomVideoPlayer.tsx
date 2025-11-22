'use client';

import { useIsMobile } from '@/lib/hooks/useMobilePlayer';
import { DesktopVideoPlayer } from './DesktopVideoPlayer';
import { MobileVideoPlayer } from './MobileVideoPlayer';

interface CustomVideoPlayerProps {
  src: string;
  poster?: string;
  onError?: (error: string) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  initialTime?: number;
  shouldAutoPlay?: boolean;
}

/**
 * Smart Video Player that renders different versions based on device
 * - Mobile/Tablet: Optimized touch controls, double-tap gestures, orientation lock
 * - Desktop: Full-featured player with hover interactions
 */
export function CustomVideoPlayer(props: CustomVideoPlayerProps) {
  const isMobile = useIsMobile();

  return isMobile
    ? <MobileVideoPlayer {...props} />
    : <DesktopVideoPlayer {...props} />;
}
