import { useRef, useState, useCallback, useEffect } from 'react';
import { useCameraPermissions } from 'expo-camera';

type CameraType = 'front' | 'back';
import * as MediaLibrary from 'expo-media-library';
import { handlePermissionFlow } from '../lib/camera/permissions';
import { PerformanceStorage } from '../lib/storage/mmkv-setup';

export interface CameraConfig {
  type?: CameraType;
  quality?: 'low' | 'medium' | 'high' | '720p' | '1080p' | '4K';
  maxDuration?: number;
  maxFileSize?: number;
  mute?: boolean;
}

export interface UseCameraResult {
  // Refs
  cameraRef: React.RefObject<any>;

  // State
  hasPermission: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  cameraType: CameraType;
  recordingDuration: number;

  // Methods
  requestPermissions: () => Promise<boolean>;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  takePicture: () => Promise<string | null>;
  flipCamera: () => void;

  // Error
  error: Error | null;
}

const DEFAULT_CONFIG: CameraConfig = {
  type: 'back' as CameraType,
  quality: '720p',
  maxDuration: 60,
  maxFileSize: 100 * 1024 * 1024, // 100MB
  mute: false,
};

export const useCamera = (config: CameraConfig = {}): UseCameraResult => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // Refs
  const cameraRef = useRef<any>(null);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  // State
  const [hasPermission, setHasPermission] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraType, setCameraType] = useState<CameraType>(mergedConfig.type!);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  // Request permissions
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await handlePermissionFlow();
      setHasPermission(granted);
      return granted;
    } catch (err) {
      setError(err as Error);
      return false;
    }
  }, []);

  // Check permissions on mount
  useEffect(() => {
    requestPermissions();
  }, [requestPermissions]);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    };
  }, []);

  // Start recording
  const startRecording = useCallback(async (): Promise<void> => {
    if (!cameraRef.current || isRecording) {
      return;
    }

    try {
      setIsRecording(true);
      setRecordingDuration(0);
      setError(null);

      // Start duration timer
      recordingTimer.current = setInterval(() => {
        setRecordingDuration((prev) => {
          const newDuration = prev + 1;

          // Auto-stop at max duration
          if (newDuration >= mergedConfig.maxDuration!) {
            stopRecording();
          }

          return newDuration;
        });
      }, 1000);

      const recordingOptions = {
        maxDuration: mergedConfig.maxDuration,
        maxFileSize: mergedConfig.maxFileSize,
      };

      const startTime = Date.now();
      await cameraRef.current.recordAsync(recordingOptions);

      // Track performance
      const recordTime = Date.now() - startTime;
      PerformanceStorage.track('camera_record_duration', recordTime);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError(err as Error);
      setIsRecording(false);

      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    }
  }, [isRecording, mergedConfig]);

  // Stop recording
  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!cameraRef.current || !isRecording) {
      return null;
    }

    try {
      setIsProcessing(true);

      // Clear timer
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }

      // Stop recording
      cameraRef.current.stopRecording();

      // Note: The actual URI is returned in the recordAsync promise
      // For now, we just return null and handle the URI in startRecording
      setIsRecording(false);
      setIsProcessing(false);

      return null;
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setError(err as Error);
      setIsRecording(false);
      setIsProcessing(false);
      return null;
    }
  }, [isRecording]);

  // Take picture
  const takePicture = useCallback(async (): Promise<string | null> => {
    if (!cameraRef.current || isRecording) {
      return null;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const options = {
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      };

      const startTime = Date.now();
      const photo = await cameraRef.current.takePictureAsync(options);

      // Track performance
      const captureTime = Date.now() - startTime;
      PerformanceStorage.track('camera_capture_time', captureTime);

      // Save to media library
      if (photo.uri) {
        const asset = await MediaLibrary.createAssetAsync(photo.uri);
        await MediaLibrary.createAlbumAsync('Smart Hockey Coach', asset, false);

        setIsProcessing(false);
        return photo.uri;
      }

      setIsProcessing(false);
      return null;
    } catch (err) {
      console.error('Failed to take picture:', err);
      setError(err as Error);
      setIsProcessing(false);
      return null;
    }
  }, [isRecording]);

  // Flip camera
  const flipCamera = useCallback(() => {
    setCameraType((current: CameraType) => (current === 'back' ? 'front' : 'back'));
  }, []);

  return {
    // Refs
    cameraRef,

    // State
    hasPermission,
    isRecording,
    isProcessing,
    cameraType,
    recordingDuration,

    // Methods
    requestPermissions,
    startRecording,
    stopRecording,
    takePicture,
    flipCamera,

    // Error
    error,
  };
};

/**
 * Hook for camera with ML frame processing
 */
export const useCameraWithML = (config: CameraConfig = {}) => {
  const camera = useCamera(config);
  const [isMLReady, setIsMLReady] = useState(false);

  // Frame processor for ML (placeholder - actual implementation depends on ML model)
  const processFrame = useCallback(async (imageData: any) => {
    // This would be implemented with actual ML processing
    console.log('Processing frame for ML...');
  }, []);

  return {
    ...camera,
    isMLReady,
    processFrame,
  };
};
