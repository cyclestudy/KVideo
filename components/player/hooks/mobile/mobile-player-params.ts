/**
 * Parameter builder utilities for mobile player hooks
 */

export function buildPlaybackParams(props: any) {
    const {
        videoRef,
        isPlaying,
        setIsPlaying,
        setIsLoading,
        initialTime,
        shouldAutoPlay,
        setDuration,
        setCurrentTime,
        setPlaybackRate,
        setShowMoreMenu,
        setShowVolumeMenu,
        setShowSpeedMenu,
        onTimeUpdate,
        onError,
        isDraggingProgressRef,
        isTogglingRef,
    } = props;

    return {
        videoRef,
        isPlaying,
        setIsPlaying,
        setIsLoading,
        initialTime,
        shouldAutoPlay,
        setDuration,
        setCurrentTime,
        setPlaybackRate,
        setShowMoreMenu,
        setShowVolumeMenu,
        setShowSpeedMenu,
        onTimeUpdate,
        onError,
        isDraggingProgressRef,
        isTogglingRef,
    };
}

export function buildProgressParams(props: any) {
    const { videoRef, progressBarRef, duration, setCurrentTime, isDraggingProgressRef } = props;
    return { videoRef, progressBarRef, duration, setCurrentTime, isDraggingProgressRef };
}

export function buildSkipParams(props: any) {
    const {
        videoRef,
        duration,
        setCurrentTime,
        skipAmount,
        skipSide,
        setSkipAmount,
        setSkipSide,
        setShowSkipIndicator,
        skipTimeoutRef,
    } = props;

    return {
        videoRef,
        duration,
        setCurrentTime,
        skipAmount,
        skipSide,
        setSkipAmount,
        setSkipSide,
        setShowSkipIndicator,
        skipTimeoutRef,
    };
}

export function buildFullscreenParams(props: any) {
    const { containerRef, videoRef, isFullscreen, setIsFullscreen, isPiPSupported, setIsPiPSupported } = props;
    return { containerRef, videoRef, isFullscreen, setIsFullscreen, isPiPSupported, setIsPiPSupported };
}

export function buildUtilitiesParams(props: any) {
    const {
        src,
        volume,
        isMuted,
        videoRef,
        setVolume,
        setIsMuted,
        setViewportWidth,
        setToastMessage,
        setShowToast,
        toastTimeoutRef,
    } = props;

    return {
        src,
        volume,
        isMuted,
        videoRef,
        setVolume,
        setIsMuted,
        setViewportWidth,
        setToastMessage,
        setShowToast,
        toastTimeoutRef,
    };
}

export function buildMenuParams(props: any) {
    const {
        videoRef,
        isPlaying,
        showMoreMenu,
        showVolumeMenu,
        showSpeedMenu,
        wasPlayingBeforeMenu,
        setShowControls,
        setShowMoreMenu,
        setShowVolumeMenu,
        setShowSpeedMenu,
        setWasPlayingBeforeMenu,
        controlsTimeoutRef,
        menuIdleTimeoutRef,
    } = props;

    return {
        videoRef,
        isPlaying,
        showMoreMenu,
        showVolumeMenu,
        showSpeedMenu,
        wasPlayingBeforeMenu,
        setShowControls,
        setShowMoreMenu,
        setShowVolumeMenu,
        setShowSpeedMenu,
        setWasPlayingBeforeMenu,
        controlsTimeoutRef,
        menuIdleTimeoutRef,
    };
}
