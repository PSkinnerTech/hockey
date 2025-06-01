// Video utility functions for hockey shot analysis

export interface VideoInfo {
  uri: string;
  duration: number;
  size?: number;
  created: Date;
  name: string;
}

/**
 * Format video duration for display
 */
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format video duration with frame precision for hockey analysis
 */
export const formatDurationWithFrames = (seconds: number, frameRate: number = 60): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * frameRate);
  return `${mins}:${secs.toString().padStart(2, '0')}.${frames.toString().padStart(2, '0')}`;
};

/**
 * Calculate file size in human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Generate a hockey shot filename with timestamp
 */
export const generateShotFilename = (): string => {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  return `hockey-shot-${timestamp}.mp4`;
};

/**
 * Extract filename from URI
 */
export const getFilenameFromUri = (uri: string): string => {
  return uri.split('/').pop() || 'video.mp4';
};

/**
 * Check if video file is supported
 */
export const isSupportedVideoFormat = (uri: string): boolean => {
  const supportedExtensions = ['.mp4', '.mov', '.m4v'];
  return supportedExtensions.some(ext => uri.toLowerCase().includes(ext));
};

/**
 * Calculate frame time for frame-by-frame navigation
 */
export const calculateFrameTime = (frameNumber: number, frameRate: number = 60): number => {
  return frameNumber / frameRate;
};

/**
 * Get frame number from time
 */
export const getFrameFromTime = (time: number, frameRate: number = 60): number => {
  return Math.floor(time * frameRate);
};

/**
 * Hockey-specific playback speeds optimized for analysis
 */
export const HOCKEY_PLAYBACK_SPEEDS = {
  FRAME_ANALYSIS: 0.25,
  SLOW_MOTION: 0.5,
  NORMAL: 1.0,
  FAST_REVIEW: 2.0,
} as const;

/**
 * Get recommended playback speed based on analysis type
 */
export const getRecommendedSpeed = (analysisType: 'technique' | 'review' | 'normal'): number => {
  switch (analysisType) {
    case 'technique':
      return HOCKEY_PLAYBACK_SPEEDS.FRAME_ANALYSIS;
    case 'review':
      return HOCKEY_PLAYBACK_SPEEDS.FAST_REVIEW;
    default:
      return HOCKEY_PLAYBACK_SPEEDS.NORMAL;
  }
};

/**
 * Validate video duration for hockey analysis (should be reasonable length)
 */
export const isValidHockeyVideoDuration = (duration: number): boolean => {
  // Hockey shots typically 3-10 seconds, allow up to 30 seconds
  return duration > 0.5 && duration <= 30;
};

/**
 * Create video thumbnail timestamp (middle of video for best shot representation)
 */
export const getThumbnailTimestamp = (duration: number): number => {
  // For hockey shots, get timestamp at 30% through video (after setup, during/after shot)
  return Math.min(duration * 0.3, duration - 0.5);
}; 