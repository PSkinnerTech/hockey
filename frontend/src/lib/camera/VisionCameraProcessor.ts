import { useCallback, useRef, useState } from 'react';
import { runOnJS } from 'react-native-reanimated';
import { useFrameProcessor } from 'react-native-vision-camera';
// import { resize } from 'vision-camera-resize-plugin'; // Will be implemented natively
import type { Frame } from 'react-native-vision-camera';
import { useHockeyShotModel, profileInference } from '../ml/tflite-setup';

export interface VisionFrameData {
  width: number;
  height: number;
  timestamp: number;
  pixelFormat: string;
}

export interface VisionDetectionResult {
  confidence: number;
  detected: boolean;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  timestamp: number;
  processingTime: number;
}

export interface VisionProcessorConfig {
  targetFPS: number;
  detectionThreshold: number;
  enableDebugging: boolean;
  resizeWidth: number;
  resizeHeight: number;
  maxProcessingTime: number;
}

export interface VisionProcessorCallbacks {
  onDetection?: (result: VisionDetectionResult) => void;
  onFrameProcessed?: (processingTime: number) => void;
  onError?: (error: Error) => void;
  onPerformanceUpdate?: (stats: ProcessingStats) => void;
}

interface ProcessingStats {
  framesProcessed: number;
  averageProcessingTime: number;
  droppedFrames: number;
  detectionRate: number;
  lastProcessingTime: number;
}

const DEFAULT_CONFIG: VisionProcessorConfig = {
  targetFPS: 60,
  detectionThreshold: 0.7,
  enableDebugging: __DEV__,
  resizeWidth: 224,
  resizeHeight: 224,
  maxProcessingTime: 100, // 100ms max for real-time performance
};

/**
 * VisionCamera Frame Processor for real-time shot detection
 * Uses TensorFlow Lite for high-performance on-device ML inference
 */
export const useVisionCameraProcessor = (
  config: Partial<VisionProcessorConfig> = {},
  callbacks: VisionProcessorCallbacks = {}
) => {
  const processorConfig = { ...DEFAULT_CONFIG, ...config };
  const statsRef = useRef<ProcessingStats>({
    framesProcessed: 0,
    averageProcessingTime: 0,
    droppedFrames: 0,
    detectionRate: 0,
    lastProcessingTime: 0,
  });
  
  const lastProcessTimeRef = useRef(0);
  const frameSkipInterval = Math.round(60 / processorConfig.targetFPS);
  const frameCountRef = useRef(0);

  // Load the hockey shot detection model
  const { model, runInference, isLoaded } = useHockeyShotModel({
    threshold: processorConfig.detectionThreshold,
  });

  // Main detection function (runs on JS thread)
  const detectShot = useCallback((frameData: VisionFrameData, resizedData: number[]) => {
    'worklet';
    
    try {
      const startTime = performance.now();
      
      // Run TensorFlow Lite inference
      const result = runInference(resizedData);
      
      const processingTime = performance.now() - startTime;
      
      // Update statistics
      const stats = statsRef.current;
      stats.framesProcessed++;
      stats.lastProcessingTime = processingTime;
      
      // Calculate running averages
      const alpha = 0.1;
      stats.averageProcessingTime = 
        alpha * processingTime + (1 - alpha) * stats.averageProcessingTime;
      
      if (result.detected) {
        stats.detectionRate = alpha * 1 + (1 - alpha) * stats.detectionRate;
      } else {
        stats.detectionRate = (1 - alpha) * stats.detectionRate;
      }

      const detectionResult: VisionDetectionResult = {
        ...result,
        processingTime,
      };

      // Call callbacks on JS thread
      if (callbacks.onFrameProcessed) {
        runOnJS(callbacks.onFrameProcessed)(processingTime);
      }
      
      if (result.detected && callbacks.onDetection) {
        runOnJS(callbacks.onDetection)(detectionResult);
      }

      // Performance monitoring
      if (processorConfig.enableDebugging && stats.framesProcessed % 30 === 0 && callbacks.onPerformanceUpdate) {
        runOnJS(callbacks.onPerformanceUpdate)(stats);
      }

      // Log performance warnings
      if (processingTime > processorConfig.maxProcessingTime) {
        runOnJS(console.warn)(`Slow frame processing: ${processingTime.toFixed(2)}ms`);
      }

    } catch (error) {
      if (callbacks.onError) {
        runOnJS(callbacks.onError)(error as Error);
      }
      runOnJS(console.error)('Frame processing error:', error);
    }
  }, [runInference, callbacks, processorConfig]);

  // Frame processor worklet
  const frameProcessor = useFrameProcessor((frame: Frame) => {
    'worklet';
    
    const now = performance.now();
    frameCountRef.current++;

    // Skip frames to maintain target FPS
    if (frameCountRef.current % frameSkipInterval !== 0) {
      statsRef.current.droppedFrames++;
      return;
    }

    // Throttle processing based on time
    if (now - lastProcessTimeRef.current < (1000 / processorConfig.targetFPS)) {
      statsRef.current.droppedFrames++;
      return;
    }

    lastProcessTimeRef.current = now;

    try {
      // For now, use mock frame processing until resize plugin is properly configured
      const frameData: VisionFrameData = {
        width: frame.width,
        height: frame.height,
        timestamp: frame.timestamp,
        pixelFormat: frame.pixelFormat,
      };

      // Generate mock pixel data for now
      // TODO: Implement actual frame resizing and pixel extraction
      const pixelData = new Array(processorConfig.resizeWidth * processorConfig.resizeHeight * 3)
        .fill(0)
        .map(() => Math.random()); // Mock data for now

      // Run detection
      detectShot(frameData, pixelData);

    } catch (error) {
      if (callbacks.onError) {
        runOnJS(callbacks.onError)(error as Error);
      }
      runOnJS(console.error)('Frame processor error:', error);
    }
  }, [detectShot, processorConfig]);

  // Get current processing statistics
  const getProcessingStats = useCallback(() => {
    return { ...statsRef.current };
  }, []);

  // Reset statistics
  const resetStats = useCallback(() => {
    statsRef.current = {
      framesProcessed: 0,
      averageProcessingTime: 0,
      droppedFrames: 0,
      detectionRate: 0,
      lastProcessingTime: 0,
    };
    frameCountRef.current = 0;
    lastProcessTimeRef.current = 0;
  }, []);

  return {
    frameProcessor,
    isModelLoaded: isLoaded,
    getProcessingStats,
    resetStats,
    config: processorConfig,
  };
};

/**
 * High-level hook for shot detection with VisionCamera
 * Provides a simple interface for shot detection
 */
export const useShotDetection = (
  onShotDetected: (result: VisionDetectionResult) => void,
  options: Partial<VisionProcessorConfig> = {}
) => {
  const [detectionEnabled, setDetectionEnabled] = useState(true);
  const [lastDetection, setLastDetection] = useState<VisionDetectionResult | null>(null);
  const [stats, setStats] = useState<ProcessingStats>({
    framesProcessed: 0,
    averageProcessingTime: 0,
    droppedFrames: 0,
    detectionRate: 0,
    lastProcessingTime: 0,
  });

  const callbacks: VisionProcessorCallbacks = {
    onDetection: useCallback((result: VisionDetectionResult) => {
      if (detectionEnabled) {
        setLastDetection(result);
        onShotDetected(result);
      }
    }, [detectionEnabled, onShotDetected]),

    onPerformanceUpdate: useCallback((newStats: ProcessingStats) => {
      setStats(newStats);
    }, []),

    onError: useCallback((error: Error) => {
      console.error('Shot detection error:', error);
    }, []),
  };

  const {
    frameProcessor,
    isModelLoaded,
    getProcessingStats,
    resetStats,
    config,
  } = useVisionCameraProcessor(options, callbacks);

  const toggleDetection = useCallback(() => {
    setDetectionEnabled(prev => !prev);
  }, []);

  const clearLastDetection = useCallback(() => {
    setLastDetection(null);
  }, []);

  return {
    frameProcessor,
    isModelLoaded,
    detectionEnabled,
    lastDetection,
    stats,
    toggleDetection,
    clearLastDetection,
    resetStats,
    config,
  };
};

/**
 * Development utilities for frame processing
 */
export const createMockFrameProcessor = (
  callbacks: VisionProcessorCallbacks,
  config: VisionProcessorConfig = DEFAULT_CONFIG
) => {
  return useFrameProcessor((frame: Frame) => {
    'worklet';
    
    // Mock processing delay
    const processingTime = Math.random() * 50 + 10;
    
    // Mock detection based on frame properties
    const confidence = Math.random() * 0.8 + 0.1;
    const detected = confidence > config.detectionThreshold;
    
    const result: VisionDetectionResult = {
      confidence,
      detected,
      timestamp: frame.timestamp,
      processingTime,
      boundingBox: detected ? {
        x: 0.3,
        y: 0.2,
        width: 0.4,
        height: 0.6,
      } : undefined,
    };

    if (callbacks.onFrameProcessed) {
      runOnJS(callbacks.onFrameProcessed)(processingTime);
    }
    
    if (detected && callbacks.onDetection) {
      runOnJS(callbacks.onDetection)(result);
    }
  }, [callbacks, config]);
};

