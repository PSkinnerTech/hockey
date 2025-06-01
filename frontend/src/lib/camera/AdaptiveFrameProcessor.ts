import { useFrameProcessor } from 'react-native-vision-camera';
import { runOnJS } from 'react-native-reanimated';
import { 
  ShotDetectionResult, 
  FrameProcessorConfig,
  processFrameForShot 
} from './FrameProcessor';
import { 
  extractFrameData, 
  getOptimalExtractionConfig,
  FrameExtractionConfig 
} from './FrameExtractor';

export interface AdaptiveProcessorConfig extends FrameProcessorConfig {
  targetFPS: number;
  enableAdaptiveSkipping: boolean;
  minSkipRate: number;
  maxSkipRate: number;
  performanceMode: 'battery' | 'balanced' | 'performance';
}

export interface PerformanceMetrics {
  processingTime: number;
  frameRate: number;
  currentSkipRate: number;
  effectiveFPS: number;
  memoryUsage?: number;
}

export const useAdaptiveFrameProcessor = (
  config: AdaptiveProcessorConfig,
  onShotDetected: (result: ShotDetectionResult) => void,
  onPerformanceUpdate?: (metrics: PerformanceMetrics) => void
) => {
  // Get extraction config based on performance mode
  const extractionConfig = getOptimalExtractionConfig(config.performanceMode);
  
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    
    // All variables must be declared in worklet scope
    const startTime = Date.now();
    
    // Simple frame skipping based on static skip rate
    const staticSkipRate = getStaticSkipRate(config.performanceMode);
    const shouldProcess = frame.timestamp % (staticSkipRate + 1) === 0;
    
    if (!shouldProcess || !config.enableShotDetection) {
      return;
    }
    
    try {
      // Extract frame data for processing
      const extractedFrame = extractFrameData(frame, extractionConfig);
      
      if (!extractedFrame) {
        return;
      }
      
      // Process frame for shot detection
      const frameData = {
        width: extractedFrame.width,
        height: extractedFrame.height,
        pixelFormat: frame.pixelFormat,
        timestamp: extractedFrame.timestamp,
        frameNumber: Math.floor(frame.timestamp / 16.67), // Approximate frame number at 60fps
      };
      
      const result = processFrameForShot(frameData);
      
      if (result.shotDetected && result.confidence > config.confidence) {
        runOnJS(onShotDetected)(result);
      }
      
      // Performance monitoring
      const processingTime = Date.now() - startTime;
      
      // Report performance occasionally
      if (frame.timestamp % 2000 < 100 && onPerformanceUpdate) { // Every ~2 seconds
        const metrics: PerformanceMetrics = {
          processingTime,
          frameRate: 60, // Assume 60fps base rate
          currentSkipRate: staticSkipRate,
          effectiveFPS: 60 / (staticSkipRate + 1),
        };
        
        runOnJS(onPerformanceUpdate)(metrics);
      }
      
    } catch (error) {
      console.warn('Adaptive frame processing error:', error);
    }
  }, [
    config.enableShotDetection, 
    config.confidence, 
    config.performanceMode,
    extractionConfig
  ]);
  
  return frameProcessor;
};

const getStaticSkipRate = (mode: 'battery' | 'performance' | 'balanced'): number => {
  'worklet';
  
  switch (mode) {
    case 'battery': return 4; // 12fps processing
    case 'performance': return 1; // 30fps processing
    case 'balanced': return 2; // 20fps processing
    default: return 2;
  }
};

// Helper function to create recommended config
export const createRecommendedAdaptiveConfig = (
  device: 'low-end' | 'mid-range' | 'high-end' = 'mid-range'
): AdaptiveProcessorConfig => {
  const baseConfig = {
    enableShotDetection: true,
    confidence: 0.7,
  };
  
  switch (device) {
    case 'low-end':
      return {
        ...baseConfig,
        targetFPS: 15,
        enableAdaptiveSkipping: true,
        minSkipRate: 3,
        maxSkipRate: 7,
        performanceMode: 'battery',
        skipFrames: 4,
      };
    
    case 'high-end':
      return {
        ...baseConfig,
        targetFPS: 30,
        enableAdaptiveSkipping: true,
        minSkipRate: 0,
        maxSkipRate: 3,
        performanceMode: 'performance',
        skipFrames: 1,
      };
    
    case 'mid-range':
    default:
      return {
        ...baseConfig,
        targetFPS: 20,
        enableAdaptiveSkipping: true,
        minSkipRate: 1,
        maxSkipRate: 5,
        performanceMode: 'balanced',
        skipFrames: 2,
      };
  }
};

// Performance preset configurations
export const PERFORMANCE_PRESETS = {
  BATTERY_SAVER: createRecommendedAdaptiveConfig('low-end'),
  BALANCED: createRecommendedAdaptiveConfig('mid-range'),
  HIGH_PERFORMANCE: createRecommendedAdaptiveConfig('high-end'),
} as const;

// Function to determine device capability (simplified)
export const detectDeviceCapability = (): 'low-end' | 'mid-range' | 'high-end' => {
  // This is a simplified detection - in production, you might check:
  // - Available memory
  // - Processor type
  // - iOS device model
  // - Performance benchmarks
  
  // For now, assume mid-range as default
  return 'mid-range';
}; 