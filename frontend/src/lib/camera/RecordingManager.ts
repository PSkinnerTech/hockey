import { RefObject } from 'react';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { CameraView } from 'expo-camera';
import {
  VideoConstraints,
  ML_OPTIMIZED_CONSTRAINTS,
  getTempVideoDirectory,
  generateVideoFilename,
  validateVideoFile,
  getOptimalRecordingSettings,
  hasEnoughStorage,
  estimateVideoSize,
} from './utils';

export interface VideoAsset {
  uri: string;
  width: number;
  height: number;
  duration: number;
  size: number;
  filename: string;
}

export interface RecordingError {
  code:
    | 'PERMISSION_DENIED'
    | 'STORAGE_FULL'
    | 'RECORDING_FAILED'
    | 'INVALID_FILE'
    | 'DURATION_EXCEEDED';
  message: string;
  details?: any;
}

export type Result<T, E = RecordingError> =
  | { success: true; data: T }
  | { success: false; error: E };

export interface RecordingOptions {
  maxDuration?: number;
  maxFileSize?: number;
  quality?: 'low' | 'medium' | 'high';
  audioEnabled?: boolean;
}

export class RecordingManager {
  private cameraRef: RefObject<CameraView>;
  private constraints: VideoConstraints;
  private recordingStartTime: number | null = null;
  private recordingTimer: NodeJS.Timeout | null = null;
  private tempVideoPath: string | null = null;

  // Callbacks
  public onRecordingStart?: () => void;
  public onRecordingStop?: (asset: VideoAsset) => void;
  public onRecordingError?: (error: RecordingError) => void;
  public onDurationUpdate?: (duration: number) => void;
  public onRecordingComplete?: (asset: VideoAsset) => void;

  constructor(cameraRef: RefObject<CameraView>, options: RecordingOptions = {}) {
    this.cameraRef = cameraRef;
    this.constraints = {
      ...ML_OPTIMIZED_CONSTRAINTS,
      maxDuration: options.maxDuration || ML_OPTIMIZED_CONSTRAINTS.maxDuration,
      maxFileSize: options.maxFileSize || ML_OPTIMIZED_CONSTRAINTS.maxFileSize,
    };
  }

  /**
   * Start video recording
   */
  async startRecording(): Promise<Result<void, RecordingError>> {
    try {
      // Validate camera ref
      if (!this.cameraRef.current) {
        return {
          success: false,
          error: {
            code: 'RECORDING_FAILED',
            message: 'Camera not available',
          },
        };
      }

      // Check storage space
      const estimatedSize = estimateVideoSize(this.constraints);
      const hasStorage = await hasEnoughStorage(estimatedSize);

      if (!hasStorage) {
        return {
          success: false,
          error: {
            code: 'STORAGE_FULL',
            message: 'Insufficient storage space for recording',
            details: { estimatedSize },
          },
        };
      }

      // Get optimal settings for device
      this.constraints = await getOptimalRecordingSettings();

      // Generate temp file path
      const tempDir = await getTempVideoDirectory();
      const filename = generateVideoFilename();
      this.tempVideoPath = tempDir + filename;

      // Start recording with optimal settings
      const recordingOptions = {
        maxDuration: this.constraints.maxDuration,
        maxFileSize: this.constraints.maxFileSize,
        videoBitrate: this.constraints.bitRate,
        videoCodec: this.constraints.codec,
        videoStabilizationMode: 'auto' as const,
      };

      // Start the recording
      await this.cameraRef.current.recordAsync(recordingOptions);

      this.recordingStartTime = Date.now();
      this.startDurationTimer();
      this.onRecordingStart?.();

      return { success: true, data: undefined };
    } catch (error) {
      const recordingError: RecordingError = {
        code: 'RECORDING_FAILED',
        message: 'Failed to start recording',
        details: error,
      };

      this.onRecordingError?.(recordingError);
      return { success: false, error: recordingError };
    }
  }

  /**
   * Stop video recording
   */
  async stopRecording(): Promise<Result<VideoAsset, RecordingError>> {
    try {
      if (!this.cameraRef.current || !this.recordingStartTime) {
        return {
          success: false,
          error: {
            code: 'RECORDING_FAILED',
            message: 'No active recording to stop',
          },
        };
      }

      this.stopDurationTimer();

      // Stop recording
      this.cameraRef.current.stopRecording();

      // Wait a bit for the file to be written
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (!this.tempVideoPath) {
        return {
          success: false,
          error: {
            code: 'RECORDING_FAILED',
            message: 'Recording path not available',
          },
        };
      }

      // Validate the recorded file
      const isValid = await validateVideoFile(this.tempVideoPath);
      if (!isValid) {
        return {
          success: false,
          error: {
            code: 'INVALID_FILE',
            message: 'Recorded file is invalid or corrupted',
          },
        };
      }

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(this.tempVideoPath);
      const duration = (Date.now() - this.recordingStartTime) / 1000;

      const videoAsset: VideoAsset = {
        uri: this.tempVideoPath,
        width: this.constraints.width,
        height: this.constraints.height,
        duration,
        size: (fileInfo.exists && 'size' in fileInfo) ? fileInfo.size : 0,
        filename: this.tempVideoPath.split('/').pop() || 'unknown.mp4',
      };

      // Validate constraints
      const isValidAsset = this.validateVideoConstraints(videoAsset);
      if (!isValidAsset.success) {
        return isValidAsset;
      }

      // Save to media library
      await this.saveToMediaLibrary(videoAsset);

      this.onRecordingStop?.(videoAsset);
      this.onRecordingComplete?.(videoAsset);
      this.cleanup();

      return { success: true, data: videoAsset };
    } catch (error) {
      const recordingError: RecordingError = {
        code: 'RECORDING_FAILED',
        message: 'Failed to stop recording',
        details: error,
      };

      this.onRecordingError?.(recordingError);
      this.cleanup();
      return { success: false, error: recordingError };
    }
  }

  /**
   * Cancel ongoing recording
   */
  async cancelRecording(): Promise<void> {
    try {
      if (this.cameraRef.current && this.recordingStartTime) {
        this.cameraRef.current.stopRecording();
      }

      this.stopDurationTimer();

      // Clean up temp file
      if (this.tempVideoPath) {
        await FileSystem.deleteAsync(this.tempVideoPath, { idempotent: true });
      }

      this.cleanup();
    } catch (error) {
      console.error('Failed to cancel recording:', error);
    }
  }

  /**
   * Get current recording duration
   */
  getCurrentDuration(): number {
    if (!this.recordingStartTime) return 0;
    return (Date.now() - this.recordingStartTime) / 1000;
  }

  /**
   * Check if recording is active
   */
  isRecording(): boolean {
    return this.recordingStartTime !== null;
  }

  /**
   * Update recording constraints
   */
  updateConstraints(constraints: Partial<VideoConstraints>): void {
    this.constraints = { ...this.constraints, ...constraints };
  }

  /**
   * Private: Start duration timer
   */
  private startDurationTimer(): void {
    this.recordingTimer = setInterval(() => {
      if (this.recordingStartTime) {
        const duration = this.getCurrentDuration();
        this.onDurationUpdate?.(duration);

        // Auto-stop at max duration
        if (duration >= this.constraints.maxDuration) {
          this.stopRecording().then((result) => {
            if (result.success) {
              // Duration exceeded, but recording completed successfully
              console.log('Recording auto-stopped at max duration');
            }
          });
        }
      }
    }, 100); // Update every 100ms for smooth UI
  }

  /**
   * Private: Stop duration timer
   */
  private stopDurationTimer(): void {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
  }

  /**
   * Private: Validate video constraints
   */
  private validateVideoConstraints(video: VideoAsset): Result<VideoAsset, RecordingError> {
    // Check file size
    if (video.size > this.constraints.maxFileSize) {
      return {
        success: false,
        error: {
          code: 'RECORDING_FAILED',
          message: 'Video file exceeds maximum size limit',
          details: { actualSize: video.size, maxSize: this.constraints.maxFileSize },
        },
      };
    }

    // Check duration
    if (video.duration > this.constraints.maxDuration + 1) {
      // +1 second tolerance
      return {
        success: false,
        error: {
          code: 'DURATION_EXCEEDED',
          message: 'Video duration exceeds maximum limit',
          details: { actualDuration: video.duration, maxDuration: this.constraints.maxDuration },
        },
      };
    }

    return { success: true, data: video };
  }

  /**
   * Private: Save video to media library
   */
  private async saveToMediaLibrary(video: VideoAsset): Promise<void> {
    try {
      const asset = await MediaLibrary.createAssetAsync(video.uri);

      // Create Smart Hockey Coach album if it doesn't exist
      let album = await MediaLibrary.getAlbumAsync('Smart Hockey Coach');
      if (!album) {
        album = await MediaLibrary.createAlbumAsync('Smart Hockey Coach', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      console.log('Video saved to media library:', asset.id);
    } catch (error) {
      console.error('Failed to save video to media library:', error);
      // Don't throw error - video is still available in temp location
    }
  }

  /**
   * Private: Cleanup recording state
   */
  private cleanup(): void {
    this.recordingStartTime = null;
    this.tempVideoPath = null;
    this.stopDurationTimer();
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.cleanup();
    this.onRecordingStart = undefined;
    this.onRecordingStop = undefined;
    this.onRecordingError = undefined;
    this.onDurationUpdate = undefined;
    this.onRecordingComplete = undefined;
  }
}
