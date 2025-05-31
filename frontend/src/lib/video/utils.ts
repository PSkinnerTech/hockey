import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { VideoAsset } from '../camera/RecordingManager';
import { ProcessedVideo } from './VideoProcessor';

export interface ShareOptions {
  includeMetadata?: boolean;
  shareAs?: 'video' | 'analysis' | 'both';
  customMessage?: string;
}

export interface CompressionOptions {
  quality: 'low' | 'medium' | 'high';
  targetSize?: number; // Target file size in bytes
  maxDuration?: number; // Max duration in seconds
}

export interface VideoAnalytics {
  totalVideos: number;
  totalDuration: number;
  totalSize: number;
  averageDuration: number;
  averageSize: number;
  oldestVideo: Date | null;
  newestVideo: Date | null;
}

/**
 * Share a video with optional analysis data
 */
export const shareVideo = async (
  video: VideoAsset,
  processedVideo?: ProcessedVideo,
  options: ShareOptions = {},
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!(await Sharing.isAvailableAsync())) {
      return {
        success: false,
        error: 'Sharing is not available on this device',
      };
    }

    let filesToShare: string[] = [video.uri];
    let message = options.customMessage || 'Check out this hockey shot!';

    // Add analysis data if available and requested
    if (processedVideo && options.shareAs !== 'video') {
      if (processedVideo.thumbnail) {
        filesToShare.push(processedVideo.thumbnail.uri);
      }

      if (options.includeMetadata) {
        const metadataFile = await createMetadataFile(processedVideo);
        if (metadataFile) {
          filesToShare.push(metadataFile);
        }
      }
    }

    // Share the primary video file
    await Sharing.shareAsync(video.uri, {
      mimeType: 'video/mp4',
      dialogTitle: 'Share Hockey Shot',
      UTI: 'public.movie',
    });

    return { success: true };
  } catch (error) {
    console.error('Error sharing video:', error);
    return {
      success: false,
      error: 'Failed to share video',
    };
  }
};

/**
 * Create a metadata file for sharing
 */
const createMetadataFile = async (processedVideo: ProcessedVideo): Promise<string | null> => {
  try {
    const metadata = {
      video: {
        filename: processedVideo.originalVideo.filename,
        duration: processedVideo.originalVideo.duration,
        size: processedVideo.originalVideo.size,
        resolution: `${processedVideo.originalVideo.width}x${processedVideo.originalVideo.height}`,
      },
      analysis: {
        processedAt: processedVideo.processedAt.toISOString(),
        processingTime: processedVideo.processingTime,
        frameRate: processedVideo.metadata.frameRate,
        codec: processedVideo.metadata.codec,
      },
      app: {
        name: 'Smart Hockey Coach',
        version: '1.0.0',
      },
    };

    const metadataJson = JSON.stringify(metadata, null, 2);
    const filename = `hockey_shot_analysis_${Date.now()}.json`;
    const filePath = FileSystem.cacheDirectory + filename;

    await FileSystem.writeAsStringAsync(filePath, metadataJson);
    return filePath;
  } catch (error) {
    console.error('Error creating metadata file:', error);
    return null;
  }
};

/**
 * Compress video to reduce file size
 */
export const compressVideo = async (
  video: VideoAsset,
  options: CompressionOptions,
): Promise<{ success: boolean; compressedVideo?: VideoAsset; error?: string }> => {
  try {
    // Note: Video compression requires native modules like react-native-video-editor
    // For now, return the original video as this is a complex operation
    console.log('Video compression requested but not implemented yet');

    // Simulate compression result
    const compressionRatio =
      options.quality === 'low' ? 0.3 : options.quality === 'medium' ? 0.6 : 0.8;

    const compressedVideo: VideoAsset = {
      ...video,
      size: Math.round(video.size * compressionRatio),
      filename: video.filename.replace('.mp4', '_compressed.mp4'),
    };

    return {
      success: true,
      compressedVideo,
    };
  } catch (error) {
    console.error('Error compressing video:', error);
    return {
      success: false,
      error: 'Failed to compress video',
    };
  }
};

/**
 * Calculate storage requirements for videos
 */
export const calculateStorageRequirements = (videos: VideoAsset[]): VideoAnalytics => {
  if (videos.length === 0) {
    return {
      totalVideos: 0,
      totalDuration: 0,
      totalSize: 0,
      averageDuration: 0,
      averageSize: 0,
      oldestVideo: null,
      newestVideo: null,
    };
  }

  const totalSize = videos.reduce((sum, video) => sum + video.size, 0);
  const totalDuration = videos.reduce((sum, video) => sum + video.duration, 0);

  // For date calculations, we'd need creation timestamps
  // For now, return null for date fields

  return {
    totalVideos: videos.length,
    totalDuration,
    totalSize,
    averageDuration: totalDuration / videos.length,
    averageSize: totalSize / videos.length,
    oldestVideo: null, // Would need creation timestamps
    newestVideo: null, // Would need creation timestamps
  };
};

/**
 * Generate video preview URL for thumbnail display
 */
export const generateVideoPreview = async (video: VideoAsset): Promise<string | null> => {
  try {
    // For React Native, video URIs can be used directly for preview
    // Additional processing could be done here for web platform
    if (Platform.OS === 'web') {
      // Web-specific preview generation if needed
      return video.uri;
    }

    return video.uri;
  } catch (error) {
    console.error('Error generating video preview:', error);
    return null;
  }
};

/**
 * Validate video file integrity
 */
export const validateVideoIntegrity = async (
  video: VideoAsset,
): Promise<{
  isValid: boolean;
  issues: string[];
}> => {
  const issues: string[] = [];

  try {
    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(video.uri);
    if (!fileInfo.exists) {
      issues.push('Video file does not exist');
    }

    // Check file size
    const actualSize = (fileInfo.exists && 'size' in fileInfo) ? fileInfo.size : 0;
    if (actualSize === 0) {
      issues.push('Video file is empty');
    } else if (actualSize !== video.size) {
      issues.push('Video file size mismatch');
    }

    // Check duration validity
    if (video.duration <= 0) {
      issues.push('Invalid video duration');
    }

    // Check resolution
    if (video.width <= 0 || video.height <= 0) {
      issues.push('Invalid video resolution');
    }

    // Check file extension
    const supportedExtensions = ['.mp4', '.mov', '.m4v'];
    const hasValidExtension = supportedExtensions.some((ext) =>
      video.filename.toLowerCase().endsWith(ext),
    );

    if (!hasValidExtension) {
      issues.push('Unsupported video format');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  } catch (error) {
    console.error('Error validating video integrity:', error);
    return {
      isValid: false,
      issues: ['Failed to validate video file'],
    };
  }
};

/**
 * Get optimal playback settings for different scenarios
 */
export const getOptimalPlaybackSettings = (
  video: VideoAsset,
  context: 'preview' | 'analysis' | 'fullscreen',
) => {
  const baseSettings = {
    resizeMode: 'contain' as const,
    shouldPlay: false,
    isLooping: false,
    volume: 1.0,
  };

  switch (context) {
    case 'preview':
      return {
        ...baseSettings,
        resizeMode: 'cover' as const,
        shouldPlay: false,
        volume: 0, // Muted for previews
      };

    case 'analysis':
      return {
        ...baseSettings,
        shouldPlay: true,
        isLooping: true,
        volume: 0.5,
      };

    case 'fullscreen':
      return {
        ...baseSettings,
        resizeMode: 'contain' as const,
        shouldPlay: true,
        volume: 1.0,
      };

    default:
      return baseSettings;
  }
};

/**
 * Extract color palette from video thumbnail
 */
export const extractVideoColorPalette = async (thumbnailUri: string): Promise<string[]> => {
  try {
    // This would require image processing libraries
    // For now, return a default palette
    return [
      '#1a1a1a', // Dark background
      '#ffffff', // White text
      '#4CAF50', // Success green
      '#2196F3', // Primary blue
      '#FF9800', // Warning orange
    ];
  } catch (error) {
    console.error('Error extracting color palette:', error);
    return ['#000000', '#ffffff'];
  }
};

/**
 * Format video information for display
 */
export const formatVideoInfo = (video: VideoAsset, processedVideo?: ProcessedVideo) => {
  const formatFileSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    filename: video.filename,
    duration: formatDuration(video.duration),
    size: formatFileSize(video.size),
    resolution: `${video.width} × ${video.height}`,
    aspectRatio: (video.width / video.height).toFixed(2),
    frameRate: processedVideo?.metadata.frameRate
      ? `${processedVideo.metadata.frameRate} fps`
      : 'Unknown',
    codec: processedVideo?.metadata.codec || 'Unknown',
    bitRate: processedVideo?.metadata.bitRate
      ? `${(processedVideo.metadata.bitRate / 1000000).toFixed(1)} Mbps`
      : 'Unknown',
  };
};
