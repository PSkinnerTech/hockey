import * as FileSystem from 'expo-file-system';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { VideoAsset } from '../camera/RecordingManager';
import { formatFileSize, formatVideoDuration } from '../camera/utils';

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  size: number;
  frameRate: number;
  bitRate: number;
  codec: string;
  createdAt: Date;
}

export interface VideoThumbnail {
  uri: string;
  width: number;
  height: number;
  size: number;
}

export interface VideoProcessingOptions {
  generateThumbnail?: boolean;
  thumbnailTime?: number; // Seconds from start
  extractFrames?: boolean;
  frameInterval?: number; // Seconds between frames
  compressionQuality?: 'low' | 'medium' | 'high';
}

export interface ProcessedVideo {
  originalVideo: VideoAsset;
  metadata: VideoMetadata;
  thumbnail?: VideoThumbnail;
  frames?: string[]; // URIs of extracted frames
  processedAt: Date;
  processingTime: number;
}

export interface VideoProcessingError {
  code: 'INVALID_VIDEO' | 'PROCESSING_FAILED' | 'STORAGE_ERROR' | 'UNSUPPORTED_FORMAT';
  message: string;
  details?: any;
}

export type VideoProcessingResult<T> =
  | { success: true; data: T }
  | { success: false; error: VideoProcessingError };

export class VideoProcessor {
  private processingQueue: Array<{
    video: VideoAsset;
    options: VideoProcessingOptions;
    resolve: (result: VideoProcessingResult<ProcessedVideo>) => void;
  }> = [];

  private isProcessing = false;
  private maxConcurrentProcessing = 1; // Process one video at a time to manage memory

  /**
   * Process a video with specified options
   */
  async processVideo(
    video: VideoAsset,
    options: VideoProcessingOptions = {},
  ): Promise<VideoProcessingResult<ProcessedVideo>> {
    return new Promise((resolve) => {
      this.processingQueue.push({ video, options, resolve });
      this.processNext();
    });
  }

  /**
   * Process the next video in the queue
   */
  private async processNext(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const { video, options, resolve } = this.processingQueue.shift()!;

    const startTime = Date.now();

    try {
      const result = await this.processVideoInternal(video, options);

      if (result.success) {
        result.data.processingTime = Date.now() - startTime;
      }

      resolve(result);
    } catch (error) {
      resolve({
        success: false,
        error: {
          code: 'PROCESSING_FAILED',
          message: 'Unexpected error during video processing',
          details: error,
        },
      });
    } finally {
      this.isProcessing = false;

      // Process next video in queue
      if (this.processingQueue.length > 0) {
        setTimeout(() => this.processNext(), 100);
      }
    }
  }

  /**
   * Internal video processing implementation
   */
  private async processVideoInternal(
    video: VideoAsset,
    options: VideoProcessingOptions,
  ): Promise<VideoProcessingResult<ProcessedVideo>> {
    try {
      // Validate video file
      const isValid = await this.validateVideo(video);
      if (!isValid) {
        return {
          success: false,
          error: {
            code: 'INVALID_VIDEO',
            message: 'Video file is invalid or corrupted',
          },
        };
      }

      // Extract metadata
      const metadata = await this.extractMetadata(video);

      // Generate thumbnail if requested
      let thumbnail: VideoThumbnail | undefined;
      if (options.generateThumbnail !== false) {
        const thumbnailResult = await this.generateThumbnail(video, options.thumbnailTime);
        if (thumbnailResult.success) {
          thumbnail = thumbnailResult.data;
        }
      }

      // Extract frames if requested
      let frames: string[] | undefined;
      if (options.extractFrames) {
        const framesResult = await this.extractFrames(video, options.frameInterval || 1);
        if (framesResult.success) {
          frames = framesResult.data;
        }
      }

      const processedVideo: ProcessedVideo = {
        originalVideo: video,
        metadata,
        thumbnail,
        frames,
        processedAt: new Date(),
        processingTime: 0, // Will be set by caller
      };

      return { success: true, data: processedVideo };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PROCESSING_FAILED',
          message: 'Failed to process video',
          details: error,
        },
      };
    }
  }

  /**
   * Validate video file
   */
  private async validateVideo(video: VideoAsset): Promise<boolean> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(video.uri);

      if (!fileInfo.exists) {
        console.warn('Video file does not exist:', video.uri);
        return false;
      }

      if (!fileInfo.size || fileInfo.size === 0) {
        console.warn('Video file is empty:', video.uri);
        return false;
      }

      // Check file extension
      const supportedFormats = ['.mp4', '.mov', '.m4v'];
      const hasValidExtension = supportedFormats.some((format) =>
        video.filename.toLowerCase().endsWith(format),
      );

      if (!hasValidExtension) {
        console.warn('Unsupported video format:', video.filename);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating video:', error);
      return false;
    }
  }

  /**
   * Extract video metadata
   */
  private async extractMetadata(video: VideoAsset): Promise<VideoMetadata> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(video.uri);

      // For now, return basic metadata from the video asset
      // In a production app, you might use a library like react-native-video-info
      return {
        duration: video.duration,
        width: video.width,
        height: video.height,
        size: video.size,
        frameRate: 30, // Default assumption
        bitRate: Math.round((video.size * 8) / video.duration), // Rough calculation
        codec: 'h264', // Default assumption
        createdAt: (fileInfo.exists && 'modificationTime' in fileInfo && fileInfo.modificationTime) ? new Date(fileInfo.modificationTime) : new Date(),
      };
    } catch (error) {
      console.error('Error extracting metadata:', error);
      throw error;
    }
  }

  /**
   * Generate video thumbnail
   */
  private async generateThumbnail(
    video: VideoAsset,
    time: number = 1,
  ): Promise<VideoProcessingResult<VideoThumbnail>> {
    try {
      const thumbnailTime = Math.min(time * 1000, video.duration * 1000 - 100); // Ensure within video duration

      const { uri, width, height } = await VideoThumbnails.getThumbnailAsync(video.uri, {
        time: thumbnailTime,
        quality: 0.8,
      });

      // Get thumbnail file size
      const fileInfo = await FileSystem.getInfoAsync(uri);

      const thumbnail: VideoThumbnail = {
        uri,
        width,
        height,
        size: (fileInfo.exists && 'size' in fileInfo) ? fileInfo.size : 0,
      };

      return { success: true, data: thumbnail };
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return {
        success: false,
        error: {
          code: 'PROCESSING_FAILED',
          message: 'Failed to generate video thumbnail',
          details: error,
        },
      };
    }
  }

  /**
   * Extract frames from video at specified intervals
   */
  private async extractFrames(
    video: VideoAsset,
    interval: number = 1,
  ): Promise<VideoProcessingResult<string[]>> {
    try {
      const frames: string[] = [];
      const totalDuration = video.duration;
      const frameCount = Math.floor(totalDuration / interval);

      // Limit frame extraction to prevent excessive processing
      const maxFrames = 10;
      const actualFrameCount = Math.min(frameCount, maxFrames);

      for (let i = 0; i < actualFrameCount; i++) {
        const time = i * interval * 1000; // Convert to milliseconds

        try {
          const { uri } = await VideoThumbnails.getThumbnailAsync(video.uri, {
            time,
            quality: 0.6, // Lower quality for frame extraction
          });

          frames.push(uri);
        } catch (frameError) {
          console.warn(`Failed to extract frame at ${time}ms:`, frameError);
          // Continue with other frames
        }
      }

      return { success: true, data: frames };
    } catch (error) {
      console.error('Error extracting frames:', error);
      return {
        success: false,
        error: {
          code: 'PROCESSING_FAILED',
          message: 'Failed to extract video frames',
          details: error,
        },
      };
    }
  }

  /**
   * Get video info summary
   */
  getVideoSummary(video: VideoAsset): {
    formattedDuration: string;
    formattedSize: string;
    resolution: string;
    aspectRatio: string;
  } {
    return {
      formattedDuration: formatVideoDuration(video.duration),
      formattedSize: formatFileSize(video.size),
      resolution: `${video.width}x${video.height}`,
      aspectRatio: (video.width / video.height).toFixed(2),
    };
  }

  /**
   * Cleanup old processed files
   */
  async cleanupProcessedFiles(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const cacheDir = FileSystem.cacheDirectory + 'video_processing/';

      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      if (!dirInfo.exists) {
        return;
      }

      const files = await FileSystem.readDirectoryAsync(cacheDir);
      const now = Date.now();

      for (const file of files) {
        const filePath = cacheDir + file;
        const fileInfo = await FileSystem.getInfoAsync(filePath);

        if (fileInfo.exists && fileInfo.modificationTime) {
          const fileAge = now - fileInfo.modificationTime;
          if (fileAge > maxAge) {
            await FileSystem.deleteAsync(filePath);
            console.log(`Cleaned up processed file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up processed files:', error);
    }
  }

  /**
   * Get processing queue status
   */
  getQueueStatus(): {
    queueLength: number;
    isProcessing: boolean;
  } {
    return {
      queueLength: this.processingQueue.length,
      isProcessing: this.isProcessing,
    };
  }

  /**
   * Clear processing queue
   */
  clearQueue(): void {
    // Reject all pending promises
    this.processingQueue.forEach(({ resolve }) => {
      resolve({
        success: false,
        error: {
          code: 'PROCESSING_FAILED',
          message: 'Processing queue was cleared',
        },
      });
    });

    this.processingQueue = [];
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.clearQueue();
    console.log('VideoProcessor disposed');
  }
}

// Export a singleton instance
export const videoProcessor = new VideoProcessor();
