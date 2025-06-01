# Frame Processor Setup - Smart Hockey Coach

## Overview

### Purpose
Frame processing enables real-time hockey shot detection by analyzing video frames as they're captured. This allows for immediate feedback to players (<500ms) while maintaining smooth 60fps recording performance.

### Performance Targets
- **Frame Processing Time**: <16ms per frame (60fps target)
- **Shot Detection Latency**: <500ms from shot occurrence
- **Memory Usage**: <50MB additional during processing
- **CPU Usage**: <30% additional load on main thread

### Architecture Flow
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   VisionCamera  │───▶│  Frame Processor │───▶│   ML Analysis   │
│  (60fps stream) │    │    (Worklet)     │    │  (TensorFlow)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │  Frame Buffer    │    │ Shot Detection  │
                       │   Management     │    │    Results      │
                       └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │ Skip Rate Logic  │    │   UI Updates    │
                       │ (Performance)    │    │  (Main Thread)  │
                       └──────────────────┘    └─────────────────┘
```

---

## Step 1: Basic Frame Processor

### Creating the Worklet Frame Processor

```typescript
// src/lib/camera/FrameProcessor.ts
import { useFrameProcessor } from 'react-native-vision-camera';
import { Worklets } from 'react-native-worklets-core';

export interface FrameProcessorConfig {
  enableShotDetection: boolean;
  skipFrames: number;
  confidence: number;
}

export interface ShotDetectionResult {
  shotDetected: boolean;
  confidence: number;
  timestamp: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
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
      };
      
      // Process frame for shot detection
      const result = processFrameForShot(frameData);
      
      if (result.shotDetected && result.confidence > config.confidence) {
        // Run callback on main thread
        Worklets.defaultContext.runOnJS(onShotDetected)(result);
      }
    } catch (error) {
      console.warn('Frame processing error:', error);
    }
  }, [config.enableShotDetection, config.skipFrames, config.confidence]);
  
  return frameProcessor;
};

// Worklet function for shot detection
const processFrameForShot = (frameData: any): ShotDetectionResult => {
  'worklet';
  
  // Placeholder for actual ML processing
  // This will be replaced with TensorFlow Lite inference
  const mockShotDetection = Math.random() > 0.98; // Simulate rare shot detection
  
  return {
    shotDetected: mockShotDetection,
    confidence: mockShotDetection ? Math.random() * 0.3 + 0.7 : 0,
    timestamp: frameData.timestamp,
    boundingBox: mockShotDetection ? {
      x: Math.random() * 0.3,
      y: Math.random() * 0.3,
      width: 0.4,
      height: 0.4,
    } : undefined,
  };
};
```

### Integration with VisionCamera

```typescript
// src/lib/camera/VisionCameraProcessor.ts
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useHockeyFrameProcessor } from './FrameProcessor';

export const VisionCameraProcessor: React.FC<{
  isRecording: boolean;
  onShotDetected: (result: ShotDetectionResult) => void;
}> = ({ isRecording, onShotDetected }) => {
  const device = useCameraDevice('back');
  
  const frameProcessor = useHockeyFrameProcessor(
    {
      enableShotDetection: isRecording,
      skipFrames: 2, // Process every 3rd frame (20fps analysis)
      confidence: 0.7,
    },
    onShotDetected
  );
  
  if (!device) return null;
  
  return (
    <Camera
      style={{ flex: 1 }}
      device={device}
      isActive={true}
      frameProcessor={frameProcessor}
      video={true}
      audio={true}
      pixelFormat="yuv"
      fps={60}
    />
  );
};
```

---

## Step 2: Frame Extraction

### Converting Frame Data for ML Processing

```typescript
// src/lib/camera/FrameExtractor.ts
import { Frame } from 'react-native-vision-camera';

export interface ExtractedFrame {
  data: Uint8Array;
  width: number;
  height: number;
  format: 'RGB' | 'YUV' | 'GRAY';
  timestamp: number;
}

export const extractFrameData = (frame: Frame): ExtractedFrame => {
  'worklet';
  
  // Access frame buffer data
  const buffer = frame.toArrayBuffer();
  const uint8Array = new Uint8Array(buffer);
  
  // Convert YUV to RGB if needed for ML model
  let processedData: Uint8Array;
  
  if (frame.pixelFormat === 'yuv') {
    processedData = convertYUVtoRGB(uint8Array, frame.width, frame.height);
  } else {
    processedData = uint8Array;
  }
  
  return {
    data: processedData,
    width: frame.width,
    height: frame.height,
    format: frame.pixelFormat === 'yuv' ? 'RGB' : 'YUV',
    timestamp: frame.timestamp,
  };
};

// YUV to RGB conversion for ML processing
const convertYUVtoRGB = (yuvData: Uint8Array, width: number, height: number): Uint8Array => {
  'worklet';
  
  const rgbData = new Uint8Array(width * height * 3);
  const ySize = width * height;
  const uvSize = ySize / 4;
  
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const yIndex = i * width + j;
      const uvIndex = Math.floor(i / 2) * Math.floor(width / 2) + Math.floor(j / 2);
      
      const y = yuvData[yIndex];
      const u = yuvData[ySize + uvIndex];
      const v = yuvData[ySize + uvSize + uvIndex];
      
      // YUV to RGB conversion
      const r = Math.max(0, Math.min(255, y + 1.402 * (v - 128)));
      const g = Math.max(0, Math.min(255, y - 0.344136 * (u - 128) - 0.714136 * (v - 128)));
      const b = Math.max(0, Math.min(255, y + 1.772 * (u - 128)));
      
      const rgbIndex = (i * width + j) * 3;
      rgbData[rgbIndex] = r;
      rgbData[rgbIndex + 1] = g;
      rgbData[rgbIndex + 2] = b;
    }
  }
  
  return rgbData;
};
```

### Memory Management for Frame Buffers

```typescript
// src/lib/camera/FrameBufferManager.ts
export class FrameBufferManager {
  private bufferPool: Uint8Array[] = [];
  private maxPoolSize = 5;
  private frameWidth: number;
  private frameHeight: number;
  
  constructor(frameWidth: number, frameHeight: number) {
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.initializePool();
  }
  
  private initializePool(): void {
    const bufferSize = this.frameWidth * this.frameHeight * 3; // RGB
    
    for (let i = 0; i < this.maxPoolSize; i++) {
      this.bufferPool.push(new Uint8Array(bufferSize));
    }
  }
  
  getBuffer(): Uint8Array | null {
    return this.bufferPool.pop() || null;
  }
  
  returnBuffer(buffer: Uint8Array): void {
    if (this.bufferPool.length < this.maxPoolSize) {
      this.bufferPool.push(buffer);
    }
    // If pool is full, let the buffer be garbage collected
  }
  
  cleanup(): void {
    this.bufferPool = [];
  }
}

// Usage in frame processor
let bufferManager: FrameBufferManager | null = null;

export const processFrameWithBufferManagement = (frame: Frame): ExtractedFrame | null => {
  'worklet';
  
  if (!bufferManager) {
    bufferManager = new FrameBufferManager(frame.width, frame.height);
  }
  
  const buffer = bufferManager.getBuffer();
  if (!buffer) {
    console.warn('No available buffers, skipping frame');
    return null;
  }
  
  try {
    const extractedFrame = extractFrameData(frame);
    
    // Copy data to managed buffer
    buffer.set(extractedFrame.data.subarray(0, buffer.length));
    
    return {
      ...extractedFrame,
      data: buffer,
    };
  } catch (error) {
    // Return buffer to pool on error
    bufferManager.returnBuffer(buffer);
    throw error;
  }
};
```

---

## Step 3: Frame Rate Optimization

### Dynamic Frame Skipping Implementation

```typescript
// src/lib/camera/FrameRateOptimizer.ts
export class FrameRateOptimizer {
  private targetProcessingTime = 16; // 16ms for 60fps
  private recentProcessingTimes: number[] = [];
  private maxHistorySize = 10;
  private currentSkipRate = 0;
  private maxSkipRate = 5;
  
  updateProcessingTime(processingTime: number): void {
    this.recentProcessingTimes.push(processingTime);
    
    if (this.recentProcessingTimes.length > this.maxHistorySize) {
      this.recentProcessingTimes.shift();
    }
    
    this.adjustSkipRate();
  }
  
  private adjustSkipRate(): void {
    const avgProcessingTime = this.recentProcessingTimes.reduce((a, b) => a + b, 0) / this.recentProcessingTimes.length;
    
    if (avgProcessingTime > this.targetProcessingTime * 1.5) {
      // Processing too slow, increase skip rate
      this.currentSkipRate = Math.min(this.maxSkipRate, this.currentSkipRate + 1);
    } else if (avgProcessingTime < this.targetProcessingTime * 0.8 && this.currentSkipRate > 0) {
      // Processing fast enough, decrease skip rate
      this.currentSkipRate = Math.max(0, this.currentSkipRate - 1);
    }
  }
  
  shouldProcessFrame(frameCount: number): boolean {
    return frameCount % (this.currentSkipRate + 1) === 0;
  }
  
  getCurrentSkipRate(): number {
    return this.currentSkipRate;
  }
  
  getEffectiveFPS(): number {
    return 60 / (this.currentSkipRate + 1);
  }
}
```

### Configurable Skip Rate Implementation

```typescript
// src/lib/camera/AdaptiveFrameProcessor.ts
import { useFrameProcessor } from 'react-native-vision-camera';
import { FrameRateOptimizer } from './FrameRateOptimizer';

export interface AdaptiveProcessorConfig {
  targetFPS: number;
  enableAdaptiveSkipping: boolean;
  minSkipRate: number;
  maxSkipRate: number;
  performanceMode: 'battery' | 'performance' | 'balanced';
}

export const useAdaptiveFrameProcessor = (
  config: AdaptiveProcessorConfig,
  onShotDetected: (result: ShotDetectionResult) => void
) => {
  const optimizer = useRef(new FrameRateOptimizer()).current;
  let frameCount = 0;
  
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    
    frameCount++;
    
    // Check if we should process this frame
    const shouldProcess = config.enableAdaptiveSkipping
      ? optimizer.shouldProcessFrame(frameCount)
      : frameCount % getStaticSkipRate(config.performanceMode) === 0;
    
    if (!shouldProcess) {
      return;
    }
    
    const startTime = Date.now();
    
    try {
      // Process frame for shot detection
      const result = processFrameForShot(extractFrameData(frame));
      
      if (result.shotDetected) {
        Worklets.defaultContext.runOnJS(onShotDetected)(result);
      }
      
      // Update optimizer with processing time
      const processingTime = Date.now() - startTime;
      if (config.enableAdaptiveSkipping) {
        optimizer.updateProcessingTime(processingTime);
      }
      
    } catch (error) {
      console.warn('Adaptive frame processing error:', error);
    }
  }, [config]);
  
  return frameProcessor;
};

const getStaticSkipRate = (mode: 'battery' | 'performance' | 'balanced'): number => {
  switch (mode) {
    case 'battery': return 4; // 12fps processing
    case 'performance': return 1; // 30fps processing
    case 'balanced': return 2; // 20fps processing
    default: return 2;
  }
};
```

---

## Step 4: Performance Testing

### Performance Monitoring Implementation

```typescript
// src/lib/camera/PerformanceMonitor.ts
export interface PerformanceMetrics {
  frameProcessingTime: number[];
  averageProcessingTime: number;
  droppedFrames: number;
  totalFrames: number;
  memoryUsage: number;
  cpuUsage?: number;
}

export class FrameProcessorPerformanceMonitor {
  private metrics: PerformanceMetrics = {
    frameProcessingTime: [],
    averageProcessingTime: 0,
    droppedFrames: 0,
    totalFrames: 0,
    memoryUsage: 0,
  };
  
  private maxMetricsHistory = 100;
  private startTime: number = Date.now();
  
  recordFrameProcessing(processingTime: number): void {
    this.metrics.frameProcessingTime.push(processingTime);
    this.metrics.totalFrames++;
    
    if (this.metrics.frameProcessingTime.length > this.maxMetricsHistory) {
      this.metrics.frameProcessingTime.shift();
    }
    
    this.updateAverageProcessingTime();
  }
  
  recordDroppedFrame(): void {
    this.metrics.droppedFrames++;
  }
  
  private updateAverageProcessingTime(): void {
    const sum = this.metrics.frameProcessingTime.reduce((a, b) => a + b, 0);
    this.metrics.averageProcessingTime = sum / this.metrics.frameProcessingTime.length;
  }
  
  updateMemoryUsage(): void {
    // Note: Actual memory monitoring would require native module
    // This is a placeholder for memory tracking
    this.metrics.memoryUsage = performance.memory?.usedJSHeapSize || 0;
  }
  
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
  
  getFrameRate(): number {
    const elapsedTime = (Date.now() - this.startTime) / 1000;
    return this.metrics.totalFrames / elapsedTime;
  }
  
  reset(): void {
    this.metrics = {
      frameProcessingTime: [],
      averageProcessingTime: 0,
      droppedFrames: 0,
      totalFrames: 0,
      memoryUsage: 0,
    };
    this.startTime = Date.now();
  }
}
```

### Performance Testing Tools

```typescript
// src/lib/camera/PerformanceTester.ts
import { FrameProcessorPerformanceMonitor } from './PerformanceMonitor';

export class FrameProcessorTester {
  private monitor = new FrameProcessorPerformanceMonitor();
  
  async runPerformanceTest(duration: number = 30000): Promise<PerformanceMetrics> {
    console.log('Starting frame processor performance test...');
    this.monitor.reset();
    
    // Simulate frame processing for test duration
    const startTime = Date.now();
    let frameCount = 0;
    
    const testInterval = setInterval(() => {
      const processingStart = Date.now();
      
      // Simulate frame processing work
      this.simulateFrameProcessing();
      
      const processingTime = Date.now() - processingStart;
      this.monitor.recordFrameProcessing(processingTime);
      
      frameCount++;
      
      if (Date.now() - startTime >= duration) {
        clearInterval(testInterval);
        this.reportResults();
      }
    }, 16); // Target 60fps
    
    return new Promise((resolve) => {
      setTimeout(() => {
        clearInterval(testInterval);
        resolve(this.monitor.getMetrics());
      }, duration);
    });
  }
  
  private simulateFrameProcessing(): void {
    // Simulate CPU-intensive work
    const iterations = Math.random() * 1000 + 500;
    for (let i = 0; i < iterations; i++) {
      Math.sin(Math.random() * Math.PI);
    }
  }
  
  private reportResults(): void {
    const metrics = this.monitor.getMetrics();
    
    console.log('=== Frame Processor Performance Results ===');
    console.log(`Total Frames Processed: ${metrics.totalFrames}`);
    console.log(`Average Processing Time: ${metrics.averageProcessingTime.toFixed(2)}ms`);
    console.log(`Dropped Frames: ${metrics.droppedFrames}`);
    console.log(`Frame Rate: ${this.monitor.getFrameRate().toFixed(2)} fps`);
    console.log(`Drop Rate: ${((metrics.droppedFrames / metrics.totalFrames) * 100).toFixed(2)}%`);
    
    // Performance assessment
    if (metrics.averageProcessingTime < 16) {
      console.log('✅ Performance: EXCELLENT (< 16ms target)');
    } else if (metrics.averageProcessingTime < 25) {
      console.log('⚠️ Performance: GOOD (within acceptable range)');
    } else {
      console.log('❌ Performance: POOR (optimization needed)');
    }
  }
}
```

### Benchmarking Implementation

```typescript
// src/lib/camera/PerformanceBenchmarks.ts
export interface BenchmarkTargets {
  maxProcessingTime: number; // 16ms for 60fps
  minFrameRate: number; // 55fps minimum
  maxDropRate: number; // 5% maximum
  maxMemoryIncrease: number; // 50MB maximum
}

export const PERFORMANCE_BENCHMARKS: BenchmarkTargets = {
  maxProcessingTime: 16,
  minFrameRate: 55,
  maxDropRate: 5,
  maxMemoryIncrease: 50 * 1024 * 1024, // 50MB in bytes
};

export const validatePerformance = (metrics: PerformanceMetrics): boolean => {
  const benchmarks = PERFORMANCE_BENCHMARKS;
  
  const processingTimeOK = metrics.averageProcessingTime <= benchmarks.maxProcessingTime;
  const frameRateOK = (metrics.totalFrames / 30) >= benchmarks.minFrameRate; // Assuming 30s test
  const dropRateOK = (metrics.droppedFrames / metrics.totalFrames) * 100 <= benchmarks.maxDropRate;
  const memoryOK = metrics.memoryUsage <= benchmarks.maxMemoryIncrease;
  
  console.log('Performance Validation:');
  console.log(`Processing Time: ${processingTimeOK ? '✅' : '❌'} ${metrics.averageProcessingTime.toFixed(2)}ms`);
  console.log(`Frame Rate: ${frameRateOK ? '✅' : '❌'} ${(metrics.totalFrames / 30).toFixed(1)}fps`);
  console.log(`Drop Rate: ${dropRateOK ? '✅' : '❌'} ${((metrics.droppedFrames / metrics.totalFrames) * 100).toFixed(2)}%`);
  console.log(`Memory: ${memoryOK ? '✅' : '❌'} ${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB`);
  
  return processingTimeOK && frameRateOK && dropRateOK && memoryOK;
};
```

---

## Complete Integration Example

### Full Implementation in Recording Screen

```typescript
// src/screens/RecordingScreen.tsx
import React, { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useAdaptiveFrameProcessor } from '../lib/camera/AdaptiveFrameProcessor';
import { FrameProcessorPerformanceMonitor } from '../lib/camera/PerformanceMonitor';
import { ShotDetectionResult } from '../lib/camera/FrameProcessor';

export const RecordingScreen: React.FC = () => {
  const device = useCameraDevice('back');
  const [isRecording, setIsRecording] = useState(false);
  const [shotDetections, setShotDetections] = useState<ShotDetectionResult[]>([]);
  const performanceMonitor = useRef(new FrameProcessorPerformanceMonitor()).current;
  
  const handleShotDetected = useCallback((result: ShotDetectionResult) => {
    console.log('Shot detected!', result);
    setShotDetections(prev => [...prev.slice(-9), result]); // Keep last 10
    
    // Haptic feedback
    if (result.confidence > 0.8) {
      // Add haptic feedback here
      Alert.alert('Shot Detected!', `Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    }
  }, []);
  
  const frameProcessor = useAdaptiveFrameProcessor(
    {
      targetFPS: 20,
      enableAdaptiveSkipping: true,
      minSkipRate: 1,
      maxSkipRate: 5,
      performanceMode: 'balanced',
    },
    handleShotDetected
  );
  
  if (!device) {
    return (
      <View style={styles.container}>
        <Text>No camera device available</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        device={device}
        isActive={true}
        frameProcessor={isRecording ? frameProcessor : undefined}
        video={true}
        audio={true}
        pixelFormat="yuv"
        fps={60}
      />
      
      {/* Shot Detection Overlay */}
      <View style={styles.overlay}>
        <Text style={styles.detectionText}>
          Shots Detected: {shotDetections.length}
        </Text>
        {shotDetections.slice(-3).map((detection, index) => (
          <Text key={index} style={styles.shotInfo}>
            Shot {shotDetections.length - 2 + index}: {(detection.confidence * 100).toFixed(1)}%
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 10,
  },
  detectionText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  shotInfo: {
    color: '#4CAF50',
    fontSize: 14,
  },
});
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Frame Processor Not Working
```typescript
// Check babel.config.js includes worklets plugin
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['react-native-worklets-core/plugin'],
    // VisionCamera required plugins
    ['@babel/plugin-proposal-optional-chaining'],
    ['@babel/plugin-proposal-nullish-coalescing-operator'],
  ],
};
```

#### 2. Performance Issues
```typescript
// Add performance monitoring to identify bottlenecks
const frameProcessor = useFrameProcessor((frame) => {
  'worklet';
  
  const start = Date.now();
  
  try {
    // Your processing logic
    processFrame(frame);
  } finally {
    const duration = Date.now() - start;
    if (duration > 16) {
      console.warn(`Slow frame processing: ${duration}ms`);
    }
  }
}, []);
```

#### 3. Memory Leaks
```typescript
// Implement proper cleanup
useEffect(() => {
  return () => {
    // Cleanup frame buffers
    bufferManager?.cleanup();
    performanceMonitor.reset();
  };
}, []);
```

#### 4. iOS-Specific Considerations
- Ensure iOS deployment target is 11.0+
- Add camera permissions to Info.plist
- Test on physical device (frame processors don't work in simulator)

#### 5. Android-Specific Considerations
- Enable Hermes in android/app/build.gradle
- Add camera permissions to AndroidManifest.xml
- Test memory usage on lower-end devices

### Platform-Specific Memory Management

```typescript
// iOS: Use autorelease pools for memory management
const processFrameIOS = (frame: Frame) => {
  'worklet';
  
  // iOS automatically manages memory for most operations
  // Focus on minimizing object creation in hot paths
  return extractFrameData(frame);
};

// Android: More aggressive memory management needed
const processFrameAndroid = (frame: Frame) => {
  'worklet';
  
  try {
    const result = extractFrameData(frame);
    return result;
  } finally {
    // Explicit cleanup for Android
    if (global.gc) {
      global.gc();
    }
  }
};
```

### Performance Optimization Tips

1. **Minimize Object Creation**: Reuse buffers and objects in hot paths
2. **Use Appropriate Skip Rates**: Start with processing every 3rd frame (20fps)
3. **Profile Regularly**: Use performance monitor during development
4. **Test on Target Devices**: Always test on the slowest supported device
5. **Monitor Memory**: Watch for memory growth during extended recording

---

## Next Steps

After implementing this frame processor setup:

1. **Integrate TensorFlow Lite**: Replace mock detection with actual ML models
2. **Add Shot Segmentation**: Use detection results to extract shot clips
3. **Implement UI Feedback**: Show real-time detection results to users
4. **Optimize for Production**: Fine-tune performance for target devices
5. **Add Analytics**: Track detection accuracy and performance metrics

## References

- **VisionCamera Documentation**: [Frame Processors Guide](https://react-native-vision-camera.com/docs/guides/frame-processors)
- **Worklets Documentation**: [react-native-worklets-core](https://github.com/margelo/react-native-worklets-core)
- **Performance Optimization**: [React Native Performance](https://reactnative.dev/docs/performance)
- **Memory Management**: [JavaScript Memory Management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_Management) 