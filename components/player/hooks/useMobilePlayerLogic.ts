import { useMobilePlaybackControls } from './mobile/useMobilePlaybackControls';
import { useMobileProgressControls } from './mobile/useMobileProgressControls';
import { useMobileSkipControls } from './mobile/useMobileSkipControls';
import { useMobileFullscreenControls } from './mobile/useMobileFullscreenControls';
import { useMobileMenuControls } from './mobile/useMobileMenuControls';
import { useMobileUtilities } from './mobile/useMobileUtilities';
import {
    buildPlaybackParams,
    buildProgressParams,
    buildSkipParams,
    buildFullscreenParams,
    buildUtilitiesParams,
    buildMenuParams,
} from './mobile/mobile-player-params';

interface UseMobilePlayerLogicProps {
    src: string;
    poster?: string;
    initialTime: number;
    shouldAutoPlay: boolean;
    onError?: (error: string) => void;
    onTimeUpdate?: (currentTime: number, duration: number) => void;
    refs: any;
    state: any;
}

export function useMobilePlayerLogic({
    src,
    initialTime,
    shouldAutoPlay,
    onError,
    onTimeUpdate,
    refs,
    state
}: UseMobilePlayerLogicProps) {
    const {
        videoRef,
        containerRef,
        progressBarRef,
        controlsTimeoutRef,
        skipTimeoutRef,
        isDraggingProgressRef,
        menuIdleTimeoutRef,
        isTogglingRef,
        toastTimeoutRef
    } = refs;

    const {
        isPlaying, setIsPlaying,
        currentTime, setCurrentTime,
        duration, setDuration,
        volume, setVolume,
        isMuted, setIsMuted,
        isFullscreen, setIsFullscreen,
        setShowControls,
        setIsLoading,
        setPlaybackRate,
        showSpeedMenu, setShowSpeedMenu,
        showVolumeMenu, setShowVolumeMenu,
        showMoreMenu, setShowMoreMenu,
        isPiPSupported, setIsPiPSupported,
        skipAmount, setSkipAmount,
        skipSide, setSkipSide,
        setShowSkipIndicator,
        wasPlayingBeforeMenu, setWasPlayingBeforeMenu,
        setToastMessage,
        setShowToast,
        setViewportWidth
    } = state;

    const playbackControls = useMobilePlaybackControls(buildPlaybackParams({
        videoRef, isPlaying, setIsPlaying, setIsLoading, initialTime, shouldAutoPlay, setDuration,
        setCurrentTime, setPlaybackRate, setShowMoreMenu, setShowVolumeMenu,
        setShowSpeedMenu, onTimeUpdate, onError, isDraggingProgressRef, isTogglingRef
    }));

    const progressControls = useMobileProgressControls(buildProgressParams({
        videoRef, progressBarRef, duration, setCurrentTime, isDraggingProgressRef
    }));

    const skipControls = useMobileSkipControls(buildSkipParams({
        videoRef, duration, setCurrentTime, skipAmount, skipSide, setSkipAmount,
        setSkipSide, setShowSkipIndicator, skipTimeoutRef
    }));

    const fullscreenControls = useMobileFullscreenControls(buildFullscreenParams({
        containerRef, videoRef, isFullscreen, setIsFullscreen, isPiPSupported, setIsPiPSupported
    }));

    const utilities = useMobileUtilities(buildUtilitiesParams({
        src, volume, isMuted, videoRef, setVolume, setIsMuted, setViewportWidth,
        setToastMessage, setShowToast, toastTimeoutRef
    }));

    useMobileMenuControls(buildMenuParams({
        videoRef, isPlaying, showMoreMenu, showVolumeMenu, showSpeedMenu,
        wasPlayingBeforeMenu, setShowControls, setShowMoreMenu, setShowVolumeMenu,
        setShowSpeedMenu, setWasPlayingBeforeMenu, controlsTimeoutRef, menuIdleTimeoutRef
    }));

    return {
        skipVideo: skipControls.skipVideo,
        togglePlay: playbackControls.togglePlay,
        handlePlay: playbackControls.handlePlay,
        handlePause: playbackControls.handlePause,
        handleTimeUpdateEvent: playbackControls.handleTimeUpdateEvent,
        handleLoadedMetadata: playbackControls.handleLoadedMetadata,
        handleVideoError: playbackControls.handleVideoError,
        handleProgressTouchStart: progressControls.handleProgressTouchStart,
        handleProgressTouchMove: progressControls.handleProgressTouchMove,
        handleProgressTouchEnd: progressControls.handleProgressTouchEnd,
        handleProgressClick: progressControls.handleProgressClick,
        toggleMute: utilities.toggleMute,
        toggleFullscreen: fullscreenControls.toggleFullscreen,
        togglePictureInPicture: fullscreenControls.togglePictureInPicture,
        changePlaybackSpeed: playbackControls.changePlaybackSpeed,
        showToastNotification: utilities.showToastNotification,
        handleCopyLink: utilities.handleCopyLink,
        formatTime: playbackControls.formatTime
    };
}
