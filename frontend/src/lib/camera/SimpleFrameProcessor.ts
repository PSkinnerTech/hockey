import { useFrameProcessor } from 'react-native-vision-camera';
import { Worklets, useSharedValue } from 'react-native-worklets-core';
import { useEffect } from 'react';

export interface SimpleFrameProcessorConfig {
  enableShotDetection: boolean;
  skipFrames: number;
  confidence: number;
  testMode?: boolean; // For easier testing
}

export interface SimpleShotDetectionResult {
  shotDetected: boolean;
  confidence: number;
  timestamp: number;
  frameNumber: number;
  videoOffset: number;
  shotType?: 'wrist' | 'slap' | 'snap' | 'backhand';
}

export interface FrameProcessingStats {
  framesProcessed: number;
  detectionsFound: number;
  isActive: boolean;
  lastProcessedTime: number;
}

// ✅ DEBUGGING: Global stats for verification
export const frameProcessingStats = {
  totalFrames: 0,
  lastUpdate: Date.now(),
  startTime: Date.now(),
};

// ✅ VERIFICATION: Frame processing counter for verification
let frameProcessingCounter = 0;

export const useSimpleFrameProcessor = (
  config: SimpleFrameProcessorConfig,
  onShotDetected: (result: SimpleShotDetectionResult) => void,
  onStatsUpdate?: (stats: FrameProcessingStats) => void
) => {
  // ✅ SHARED VALUES: For worklet-to-React communication
  const framesProcessed = useSharedValue(0);
  const detectionsFound = useSharedValue(0);
  const lastProcessedTime = useSharedValue(0);
  const isProcessorActive = useSharedValue(false);
  
  // ✅ FIXED: Use the new Worklets API (no more deprecation warning!)
  const shotDetectedJS = Worklets.createRunOnJS(onShotDetected);
  const statsUpdateJS = onStatsUpdate ? Worklets.createRunOnJS(onStatsUpdate) : null;
  
  // ✅ Extract primitives outside worklet to avoid context violations
  const enableShotDetection = config.enableShotDetection;
  const testMode = config.testMode || false;
  
  // ✅ MONITORING: Poll shared values to update React state
  useEffect(() => {
    const interval = setInterval(() => {
      if (framesProcessed.value > 0) {
        const stats: FrameProcessingStats = {
          framesProcessed: framesProcessed.value,
          detectionsFound: detectionsFound.value,
          isActive: isProcessorActive.value,
          lastProcessedTime: lastProcessedTime.value,
        };
        
        if (onStatsUpdate) {
          onStatsUpdate(stats);
        }
        
        // Log frame processing activity to main thread console
        if (framesProcessed.value > 0 && framesProcessed.value % 30 === 0) {
          const elapsed = (Date.now() - frameProcessingStats.startTime) / 1000;
          const fps = framesProcessed.value / elapsed;
          console.log(`📹 Frame processing verified - ${framesProcessed.value} frames processed in ${elapsed.toFixed(1)}s (${fps.toFixed(1)} FPS)`);
        }
      }
    }, 100); // Check every 100ms
    
    return () => clearInterval(interval);
  }, [framesProcessed, detectionsFound, isProcessorActive, lastProcessedTime, onStatsUpdate]);
  
  // ✅ SIMPLIFIED: Minimal frame processor for maximum compatibility
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    
    try {
      // ✅ DIRECT INCREMENT: No conditions, just count frames
      frameProcessingCounter++;
      framesProcessed.value = framesProcessed.value + 1;
      frameProcessingStats.totalFrames++;
      
      // ✅ MARK ACTIVE: Update activity status
      isProcessorActive.value = true;
      lastProcessedTime.value = Date.now();
      
      // ✅ SIMPLE DETECTION: Every 50 frames (roughly every 1.6 seconds at 30fps)
      if (enableShotDetection && framesProcessed.value > 0 && framesProcessed.value % 50 === 0) {
        detectionsFound.value = detectionsFound.value + 1;
        
        const result: SimpleShotDetectionResult = {
          shotDetected: true,
          confidence: 0.85, // Fixed high confidence for testing
          timestamp: Date.now(),
          frameNumber: framesProcessed.value,
          videoOffset: framesProcessed.value / 30, // Assuming 30fps
          shotType: 'wrist',
        };
        
        // ✅ BRIDGE: Send detection to React
        shotDetectedJS(result);
        
        // ✅ UPDATE: Send stats update
        if (statsUpdateJS) {
          const stats: FrameProcessingStats = {
            framesProcessed: framesProcessed.value,
            detectionsFound: detectionsFound.value,
            isActive: true,
            lastProcessedTime: Date.now(),
          };
          statsUpdateJS(stats);
        }
      }
    } catch (error) {
      // Error handling without console.log (worklet context)
    }
  }, [enableShotDetection, shotDetectedJS, statsUpdateJS]);
  
  // ✅ RETURN: Both frame processor and direct access to shared values
  return {
    frameProcessor,
    sharedValues: {
      framesProcessed,
      detectionsFound,
      isProcessorActive,
      lastProcessedTime,
    },
  };
};

// ✅ UTILITY: Reset frame counter for testing
export const resetFrameProcessingCounter = () => {
  frameProcessingCounter = 0;
  frameProcessingStats.totalFrames = 0;
  frameProcessingStats.startTime = Date.now();
  console.log('🔄 Frame processing counter reset');
};

// ✅ UTILITY: Get current frame count for debugging
export const getFrameProcessingCount = () => frameProcessingCounter;

// ✅ DEBUGGING: Get global stats
export const getFrameProcessingStats = () => frameProcessingStats;

// ✅ DIRECT ACCESS: Get current shared values for final verification
export const getCurrentProcessingStats = (
  framesProcessed: any,
  detectionsFound: any,
  isProcessorActive: any,
  lastProcessedTime: any
): FrameProcessingStats => {
  return {
    framesProcessed: framesProcessed.value,
    detectionsFound: detectionsFound.value,
    isActive: isProcessorActive.value,
    lastProcessedTime: lastProcessedTime.value,
  };
}; 