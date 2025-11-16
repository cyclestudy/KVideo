/**
 * Error Handler Utility
 * Comprehensive error handling and recovery strategies for video playback
 */

import type { ApiError } from '@/lib/types';

export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  MEDIA_ERROR = 'MEDIA_ERROR',
  HLS_ERROR = 'HLS_ERROR',
  API_ERROR = 'API_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

export interface VideoError {
  type: ErrorType;
  message: string;
  originalError?: Error;
  retryable: boolean;
  retryCount?: number;
}

/**
 * Create a standardized video error
 */
export function createVideoError(
  type: ErrorType,
  message: string,
  originalError?: Error,
  retryable: boolean = true
): VideoError {
  return {
    type,
    message,
    originalError,
    retryable,
    retryCount: 0,
  };
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: VideoError): string {
  switch (error.type) {
    case ErrorType.NETWORK_ERROR:
      return 'Network connection error. Please check your internet connection and try again.';
    
    case ErrorType.MEDIA_ERROR:
      return 'Unable to play this video. The media format may not be supported.';
    
    case ErrorType.HLS_ERROR:
      return 'Video streaming error. Trying to recover...';
    
    case ErrorType.API_ERROR:
      return 'Failed to load video information. Please try again later.';
    
    case ErrorType.TIMEOUT:
      return 'Request timed out. The server may be slow or unreachable.';
    
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Handle HLS.js errors with recovery strategies
 */
export function handleHLSError(
  hls: any,
  errorData: any,
  retryCount: number = 0
): {
  shouldRetry: boolean;
  action: 'recoverMedia' | 'startLoad' | 'destroy' | 'none';
  error: VideoError;
} {
  const maxRetries = 3;
  
  // Network errors
  if (errorData.type === 'networkError') {
    if (retryCount < maxRetries) {
      return {
        shouldRetry: true,
        action: 'startLoad',
        error: createVideoError(
          ErrorType.NETWORK_ERROR,
          'Network error while loading video',
          errorData,
          true
        ),
      };
    }
  }
  
  // Media errors
  if (errorData.type === 'mediaError') {
    if (errorData.details === 'bufferAppendError') {
      // Often recoverable
      if (retryCount < maxRetries) {
        return {
          shouldRetry: true,
          action: 'recoverMedia',
          error: createVideoError(
            ErrorType.MEDIA_ERROR,
            'Buffer append error',
            errorData,
            true
          ),
        };
      }
    }
    
    if (errorData.details === 'bufferStalledError') {
      return {
        shouldRetry: true,
        action: 'startLoad',
        error: createVideoError(
          ErrorType.MEDIA_ERROR,
          'Buffer stalled error',
          errorData,
          true
        ),
      };
    }
    
    // Try to recover
    if (retryCount < maxRetries) {
      return {
        shouldRetry: true,
        action: 'recoverMedia',
        error: createVideoError(
          ErrorType.MEDIA_ERROR,
          'Media error occurred',
          errorData,
          true
        ),
      };
    }
  }
  
  // Fatal errors
  if (errorData.fatal) {
    return {
      shouldRetry: false,
      action: 'destroy',
      error: createVideoError(
        ErrorType.HLS_ERROR,
        'Fatal HLS error',
        errorData,
        false
      ),
    };
  }
  
  // Default: don't retry
  return {
    shouldRetry: false,
    action: 'none',
    error: createVideoError(
      ErrorType.HLS_ERROR,
      errorData.details || 'Unknown HLS error',
      errorData,
      false
    ),
  };
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i < maxRetries) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  if (!error) return false;
  
  // Check for network-related errors
  if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
    return true;
  }
  
  // Check for timeout errors
  if (error.name === 'AbortError' || error.message?.includes('timeout')) {
    return true;
  }
  
  // Check HTTP status codes
  if (error.status) {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    return retryableStatuses.includes(error.status);
  }
  
  return false;
}

/**
 * Log error for debugging
 */
export function logError(error: VideoError, context?: Record<string, any>): void {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    type: error.type,
    message: error.message,
    retryable: error.retryable,
    retryCount: error.retryCount,
    context,
    originalError: error.originalError?.message,
    stack: error.originalError?.stack,
  };
  
  console.error('[KVideo Error]', errorInfo);
  
  // In production, you might want to send this to an error tracking service
  // e.g., Sentry, LogRocket, etc.
}

/**
 * Handle API errors
 */
export function handleAPIError(error: any): ApiError {
  if (error.name === 'AbortError') {
    return {
      code: 'TIMEOUT',
      message: 'Request timed out',
      retryable: true,
    };
  }
  
  if (error.message?.includes('fetch')) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Network error occurred',
      retryable: true,
    };
  }
  
  return {
    code: 'API_ERROR',
    message: error.message || 'Unknown API error',
    retryable: isRetryableError(error),
  };
}

/**
 * Error recovery strategies
 */
export const ErrorRecovery = {
  /**
   * Recover from network errors
   */
  async recoverNetwork(
    retryFn: () => Promise<void>,
    maxAttempts: number = 3
  ): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        await retryFn();
        return true;
      } catch (error) {
        if (i === maxAttempts - 1) {
          return false;
        }
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
      }
    }
    return false;
  },

  /**
   * Recover from media errors
   */
  async recoverMedia(hls: any): Promise<boolean> {
    try {
      hls.recoverMediaError();
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Reload video from scratch
   */
  async reloadVideo(hls: any, url: string): Promise<boolean> {
    try {
      hls.destroy();
      hls.loadSource(url);
      hls.attachMedia(document.querySelector('video'));
      return true;
    } catch {
      return false;
    }
  },
};
