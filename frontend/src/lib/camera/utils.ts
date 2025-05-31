import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as FileSystem from 'expo-file-system';

export interface DeviceCapabilities {
  supportsVideoRecording: boolean;
  maxResolution: {
    width: number;
    height: number;
  };
  supportedFrameRates: number[];
  hasFlash: boolean;
  supportsFrontCamera: boolean;
  supportsVideoStabilization: boolean;
}

export interface VideoConstraints {
  width: number;
  height: number;
  frameRate: number;
  bitRate: number;
  codec: 'h264' | 'hevc';
  maxDuration: number;
  maxFileSize: number;
}

/**
 * Optimal video constraints for ML analysis
 */
export const ML_OPTIMIZED_CONSTRAINTS: VideoConstraints = {
  width: 1280,
  height: 720,
  frameRate: 30,
  bitRate: 5000000, // 5 Mbps
  codec: 'h264',
  maxDuration: 30, // 30 seconds
  maxFileSize: 100 * 1024 * 1024, // 100MB
};

/**
 * Check device camera capabilities
 */
export const getDeviceCapabilities = async (): Promise<DeviceCapabilities> => {
  // Note: Expo Camera doesn't provide detailed capability detection
  // These are conservative estimates based on device type
  const isHighEndDevice = Device.totalMemory ? Device.totalMemory > 3 * 1024 * 1024 * 1024 : false; // 3GB+

  return {
    supportsVideoRecording: true, // All modern devices support this
    maxResolution: isHighEndDevice ? { width: 1920, height: 1080 } : { width: 1280, height: 720 },
    supportedFrameRates: [24, 30, 60],
    hasFlash: Platform.OS === 'ios' || Platform.OS === 'android', // Most devices have flash
    supportsFrontCamera: true, // All modern devices have front camera
    supportsVideoStabilization: isHighEndDevice,
  };
};

/**
 * Format video duration from seconds to MM:SS
 */
export const formatVideoDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format file size to human readable string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);

  return `${size.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
};

/**
 * Get available storage space
 */
export const getAvailableStorage = async (): Promise<number> => {
  try {
    const storageInfo = await FileSystem.getFreeDiskStorageAsync();
    return storageInfo;
  } catch (error) {
    console.error('Failed to get storage info:', error);
    return 0;
  }
};

/**
 * Check if device has enough storage for recording
 */
export const hasEnoughStorage = async (estimatedSize: number): Promise<boolean> => {
  const availableSpace = await getAvailableStorage();
  const bufferSpace = 500 * 1024 * 1024; // 500MB buffer
  return availableSpace > estimatedSize + bufferSpace;
};

/**
 * Estimate video file size based on constraints
 */
export const estimateVideoSize = (constraints: VideoConstraints): number => {
  // Rough estimation: bitRate * duration / 8 (bits to bytes)
  const estimatedBytes = (constraints.bitRate * constraints.maxDuration) / 8;
  return Math.min(estimatedBytes, constraints.maxFileSize);
};

/**
 * Generate unique video filename
 */
export const generateVideoFilename = (): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `hockey_shot_${timestamp}.mp4`;
};

/**
 * Get temporary directory for video storage
 */
export const getTempVideoDirectory = async (): Promise<string> => {
  const tempDir = FileSystem.cacheDirectory + 'videos/';

  // Ensure directory exists
  const dirInfo = await FileSystem.getInfoAsync(tempDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
  }

  return tempDir;
};

/**
 * Clean up old temporary videos
 */
export const cleanupTempVideos = async (maxAge: number = 24 * 60 * 60 * 1000): Promise<void> => {
  try {
    const tempDir = await getTempVideoDirectory();
    const files = await FileSystem.readDirectoryAsync(tempDir);
    const now = Date.now();

    for (const file of files) {
      const filePath = tempDir + file;
      const fileInfo = await FileSystem.getInfoAsync(filePath);

      if (fileInfo.exists && fileInfo.modificationTime) {
        const fileAge = now - fileInfo.modificationTime;
        if (fileAge > maxAge) {
          await FileSystem.deleteAsync(filePath);
          console.log(`Cleaned up old video: ${file}`);
        }
      }
    }
  } catch (error) {
    console.error('Failed to cleanup temp videos:', error);
  }
};

/**
 * Validate video file
 */
export const validateVideoFile = async (uri: string): Promise<boolean> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    return fileInfo.exists && (fileInfo.size || 0) > 0;
  } catch {
    return false;
  }
};

/**
 * Platform-specific video processing options
 */
export const getPlatformVideoOptions = () => {
  if (Platform.OS === 'ios') {
    return {
      codec: 'h264' as const,
      quality: 'high' as const,
      supportsHEVC: true,
      preferredOutputFormat: 'mp4',
    };
  } else {
    return {
      codec: 'h264' as const,
      quality: 'high' as const,
      supportsHEVC: false,
      preferredOutputFormat: 'mp4',
    };
  }
};

/**
 * Calculate optimal recording settings based on device capabilities
 */
export const getOptimalRecordingSettings = async (): Promise<VideoConstraints> => {
  const capabilities = await getDeviceCapabilities();
  const hasEnoughSpace = await hasEnoughStorage(estimateVideoSize(ML_OPTIMIZED_CONSTRAINTS));

  // Adjust settings based on device capabilities and storage
  if (!hasEnoughSpace) {
    // Reduce quality if storage is limited
    return {
      ...ML_OPTIMIZED_CONSTRAINTS,
      width: 960,
      height: 540,
      bitRate: 3000000, // 3 Mbps
      maxFileSize: 50 * 1024 * 1024, // 50MB
    };
  }

  // Use lower resolution for older devices
  if (capabilities.maxResolution.width < 1280) {
    return {
      ...ML_OPTIMIZED_CONSTRAINTS,
      width: capabilities.maxResolution.width,
      height: capabilities.maxResolution.height,
      bitRate: 3000000, // 3 Mbps
    };
  }

  return ML_OPTIMIZED_CONSTRAINTS;
};
