import { useFrameProcessor } from 'react-native-vision-camera';
import { runOnJS } from 'react-native-reanimated';

export interface FrameProcessorConfig {
  enableShotDetection: boolean;
  skipFrames: number;
  confidence: number;
}

export interface ShotDetectionResult {
  shotDetected: boolean;
  confidence: number;
  timestamp: number;
  frameNumber: number;
  videoOffset: number; // Time in video (seconds)
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  shotType?: 'wrist' | 'slap' | 'snap' | 'backhand';
}

export const useHockeyFrameProcessor = (
  config: FrameProcessorConfig,
  onShotDetected: (result: ShotDetectionResult) => void
) => {
  let frameCount = 0;
  
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    
    // Skip frames for performance optimization
    frameCount++;
    if (frameCount % (config.skipFrames + 1) !== 0) {
      return;
    }
    
    if (!config.enableShotDetection) {
      return;
    }
    
    try {
      // Extract frame data
      const frameData = {
        width: frame.width,
        height: frame.height,
        bytesPerRow: frame.bytesPerRow,
        pixelFormat: frame.pixelFormat,
        timestamp: frame.timestamp,
        frameNumber: frameCount,
      };
      
      // Process frame for shot detection
      const result = processFrameForShot(frameData);
      
      if (result.shotDetected && result.confidence > config.confidence) {
        // Run callback on main thread
        runOnJS(onShotDetected)(result);
      }
    } catch (error) {
      console.warn('Frame processing error:', error);
    }
  }, [config.enableShotDetection, config.skipFrames, config.confidence]);
  
  return frameProcessor;
};

// Worklet function for shot detection - now exported
export const processFrameForShot = (frameData: any): ShotDetectionResult => {
  'worklet';
  
  // Mock shot detection - will be replaced with TensorFlow Lite inference
  // Simulate rare shot detection based on frame analysis
  const mockShotDetection = Math.random() > 0.995; // Very rare to simulate real shot timing
  
  // Simulate different shot types with different probabilities
  const shotTypes: Array<'wrist' | 'slap' | 'snap' | 'backhand'> = ['wrist', 'slap', 'snap', 'backhand'];
  const randomShotType = shotTypes[Math.floor(Math.random() * shotTypes.length)];
  
  // Calculate video offset from frame number (assuming 60fps)
  const videoOffset = frameData.frameNumber / 60.0; // Convert frame number to seconds
  
  return {
    shotDetected: mockShotDetection,
    confidence: mockShotDetection ? Math.random() * 0.3 + 0.7 : 0, // 70-100% confidence when detected
    timestamp: frameData.timestamp,
    frameNumber: frameData.frameNumber,
    videoOffset: videoOffset,
    shotType: mockShotDetection ? randomShotType : undefined,
    boundingBox: mockShotDetection ? {
      x: Math.random() * 0.3 + 0.1, // 10-40% from left
      y: Math.random() * 0.3 + 0.1, // 10-40% from top
      width: 0.3 + Math.random() * 0.2, // 30-50% width
      height: 0.3 + Math.random() * 0.2, // 30-50% height
    } : undefined,
  };
};

// Helper function to get effective processing frame rate
export const getEffectiveFrameRate = (skipFrames: number, baseFrameRate: number = 60): number => {
  return baseFrameRate / (skipFrames + 1);
};

// Performance monitoring for frame processing
export const createFrameProcessorWithPerformanceMonitoring = (
  config: FrameProcessorConfig,
  onShotDetected: (result: ShotDetectionResult) => void,
  onPerformanceUpdate?: (metrics: { processingTime: number; frameRate: number }) => void
) => {
  let lastFrameTime = 0;
  let frameCount = 0;
  let processingTimes: number[] = [];
  
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    
    const startTime = Date.now();
    
    // Skip frames for performance optimization
    frameCount++;
    if (frameCount % (config.skipFrames + 1) !== 0) {
      return;
    }
    
    if (!config.enableShotDetection) {
      return;
    }
    
    try {
      // Extract frame data
      const frameData = {
        width: frame.width,
        height: frame.height,
        bytesPerRow: frame.bytesPerRow,
        pixelFormat: frame.pixelFormat,
        timestamp: frame.timestamp,
        frameNumber: frameCount,
      };
      
      // Process frame for shot detection
      const result = processFrameForShot(frameData);
      
      if (result.shotDetected && result.confidence > config.confidence) {
        // Run callback on main thread
        runOnJS(onShotDetected)(result);
      }
      
      // Performance monitoring
      const processingTime = Date.now() - startTime;
      processingTimes.push(processingTime);
      
      // Keep only last 10 measurements
      if (processingTimes.length > 10) {
        processingTimes.shift();
      }
      
      // Calculate frame rate
      const currentTime = Date.now();
      const frameRate = lastFrameTime > 0 ? 1000 / (currentTime - lastFrameTime) : 0;
      lastFrameTime = currentTime;
      
      // Report performance every 30 frames
      if (frameCount % 30 === 0 && onPerformanceUpdate) {
        const avgProcessingTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
        runOnJS(onPerformanceUpdate)({
          processingTime: avgProcessingTime,
          frameRate: frameRate,
        });
      }
      
    } catch (error) {
      console.warn('Frame processing error:', error);
    }
  }, [config.enableShotDetection, config.skipFrames, config.confidence]);
  
  return frameProcessor;
}; 