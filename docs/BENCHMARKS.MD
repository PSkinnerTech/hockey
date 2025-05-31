# Latency Benchmarks & Optimization - Smart Hockey Coach

## Performance Targets

### End-to-End Latency Goals
From the moment a shot is detected on device:

| Feedback Stage | Target Latency | Acceptable Range |
|----------------|----------------|------------------|
| On-Device Shot Detection | <500ms | 300-700ms |
| Instant UI Feedback | <500ms | 400-600ms |
| Fast Feedback (Outcome/Type) | <3s | 2-4s |
| Full Feedback (First Chunk) | <8s | 6-10s |
| Full Feedback (Complete) | <15s | 12-18s |

### Component-Level Benchmarks

#### 1. On-Device Processing
```
┌─────────────────────────────────────┐
│ Camera Frame → ML Model → Detection │
├─────────────────────────────────────┤
│ Frame Capture:          50ms        │
│ Preprocessing:          30ms        │
│ Model Inference:        200ms       │
│ Post-processing:        20ms        │
│ TOTAL:                  300ms       │
└─────────────────────────────────────┘
```

#### 2. Video Processing
```
┌─────────────────────────────────────┐
│ Raw Video → Compressed Segments     │
├─────────────────────────────────────┤
│ Fast Path (0.5-1.5s):              │
│   - Extraction:         200ms       │
│   - Compression:        300ms       │
│   - Total:             500ms        │
│                                     │
│ Full Path (1-3s):                  │
│   - Extraction:         400ms       │
│   - Compression:        600ms       │
│   - Total:             1000ms       │
└─────────────────────────────────────┘
```

#### 3. Network Upload
```
┌─────────────────────────────────────┐
│ Video Upload Times by Connection    │
├─────────────────────────────────────┤
│ Fast Path (<1MB):                   │
│   - WiFi (50 Mbps):     200ms       │
│   - 4G LTE (20 Mbps):   500ms      │
│   - 3G (2 Mbps):       4000ms      │
│                                     │
│ Full Path (<5MB):                   │
│   - WiFi (50 Mbps):     1000ms      │
│   - 4G LTE (20 Mbps):   2500ms     │
│   - 3G (2 Mbps):        20000ms    │
└─────────────────────────────────────┘
```

## Video Optimization Specifications

### Fast Path Video Specs
```javascript
const FAST_PATH_CONFIG = {
  duration: {
    min: 0.5,  // seconds
    max: 1.5,  // seconds
    optimal: 1.0
  },
  resolution: {
    width: 1280,
    height: 720
  },
  encoding: {
    codec: 'h264',
    profile: 'baseline',
    level: '3.1',
    bitrate: 3000000, // 3 Mbps
    keyFrameInterval: 10,
    bFrames: 0 // Disable for faster encoding
  },
  container: 'mp4',
  targetSize: 1048576, // 1MB
  qualityPreset: 'ultrafast' // Prioritize speed
};
```

### Full Path Video Specs
```javascript
const FULL_PATH_CONFIG = {
  duration: {
    min: 1.0,   // seconds
    max: 3.0,   // seconds
    optimal: 2.0
  },
  resolution: {
    width: 1280,
    height: 720
  },
  encoding: {
    codec: 'h264',
    profile: 'main',
    level: '4.0',
    bitrate: 5000000, // 5 Mbps
    keyFrameInterval: 30,
    bFrames: 2
  },
  container: 'mp4',
  targetSize: 5242880, // 5MB
  qualityPreset: 'fast'
};
```

### Keyframe Alternative (Ultra-Fast Path)
```javascript
const KEYFRAME_CONFIG = {
  frames: 5,
  format: 'jpeg',
  quality: 85,
  resolution: {
    width: 960,
    height: 540
  },
  targetSizePerFrame: 102400, // 100KB
  extractionPoints: [
    -0.5,  // 0.5s before impact
    -0.25, // 0.25s before impact
    0,     // Impact moment
    0.25,  // 0.25s after impact
    0.5    // 0.5s after impact
  ]
};
```

## Optimization Strategies

### 1. Client-Side Optimizations

#### Parallel Processing
```typescript
async function processShot(videoUri: string, shotTimestamp: number) {
  // Start all processing tasks in parallel
  const [fastClip, fullClip, keyframes] = await Promise.all([
    extractFastClip(videoUri, shotTimestamp),
    extractFullClip(videoUri, shotTimestamp),
    extractKeyframes(videoUri, shotTimestamp)
  ]);
  
  // Upload fast path immediately
  const fastUploadPromise = uploadFastPath(fastClip);
  
  // Continue processing full path while fast uploads
  const compressedFull = await compressVideo(fullClip);
  
  // Wait for fast upload then start full upload
  await fastUploadPromise;
  await uploadFullPath(compressedFull);
}
```

#### Progressive Video Loading
```typescript
class VideoProcessor {
  async extractClipProgressive(
    videoUri: string,
    start: number,
    duration: number
  ): AsyncGenerator<Uint8Array> {
    const reader = await this.openVideoStream(videoUri);
    const encoder = new H264Encoder(FAST_PATH_CONFIG);
    
    let currentTime = 0;
    for await (const frame of reader) {
      if (currentTime >= start && currentTime < start + duration) {
        yield encoder.encodeFrame(frame);
      }
      currentTime += 1 / 30; // 30 fps
      
      if (currentTime > start + duration) break;
    }
  }
}
```

### 2. Network Optimizations

#### Adaptive Quality Selection
```typescript
class NetworkOptimizer {
  async selectVideoQuality(): VideoConfig {
    const bandwidth = await this.measureBandwidth();
    
    if (bandwidth > 50_000_000) { // 50 Mbps
      return HIGH_QUALITY_CONFIG;
    } else if (bandwidth > 20_000_000) { // 20 Mbps
      return MEDIUM_QUALITY_CONFIG;
    } else if (bandwidth > 5_000_000) { // 5 Mbps
      return LOW_QUALITY_CONFIG;
    } else {
      return KEYFRAME_ONLY_CONFIG;
    }
  }
  
  async measureBandwidth(): number {
    const testSize = 100_000; // 100KB test
    const testData = new Uint8Array(testSize);
    const start = performance.now();
    
    await fetch('/api/bandwidth-test', {
      method: 'POST',
      body: testData
    });
    
    const duration = performance.now() - start;
    return (testSize * 8) / (duration / 1000); // bits per second
  }
}
```

#### Request Prioritization
```typescript
class UploadQueue {
  private highPriority: UploadTask[] = [];
  private normalPriority: UploadTask[] = [];
  
  async processTasks() {
    while (true) {
      const task = this.highPriority.shift() || this.normalPriority.shift();
      if (!task) {
        await sleep(100);
        continue;
      }
      
      await this.executeUpload(task);
    }
  }
  
  queueFastPath(task: UploadTask) {
    this.highPriority.push(task);
  }
  
  queueFullPath(task: UploadTask) {
    this.normalPriority.push(task);
  }
}
```

### 3. Backend Optimizations

#### Convex Function Warming
```typescript
// Keep functions warm to avoid cold starts
export const keepWarm = internalMutation({
  handler: async (ctx) => {
    // Scheduled to run every 5 minutes
    const functions = [
      'analyzeShotFastPath',
      'analyzeShotFullPath'
    ];
    
    for (const fn of functions) {
      // Minimal operation to keep function container warm
      await ctx.db.query("_scheduled_functions")
        .filter(q => q.eq(q.field("name"), fn))
        .first();
    }
  }
});

// Schedule the warming function
export const scheduleWarming = cron(
  "*/5 * * * *", // Every 5 minutes
  "functions:keepWarm"
);
```

#### Gemini Response Optimization
```typescript
interface GeminiOptimizations {
  // Use smallest possible token limits
  maxOutputTokens: {
    fast: 100,
    full: 1500
  },
  
  // Optimize generation parameters
  generationConfig: {
    temperature: 0.2,      // Lower = faster, more deterministic
    topP: 0.8,            // Reduce sampling space
    topK: 40,             // Limit token choices
    candidateCount: 1,     // Single response
    stopSequences: ["}"]   // Stop at JSON close
  },
  
  // Stream configuration
  streamOptions: {
    includePartialResults: true,
    chunkSize: 'small'    // Smaller chunks = faster first token
  }
}
```

### 4. Database Optimizations

#### Efficient Data Structure
```typescript
// Instead of storing large JSON blobs, break into indexed fields
export const optimizedSchema = defineSchema({
  shots: defineTable({
    userId: v.id("users"),
    status: v.string(),
    
    // Separate fast and full feedback for efficient queries
    fastOutcome: v.optional(v.string()),
    fastShotType: v.optional(v.string()),
    
    // Index commonly queried fields
    createdAt: v.number(),
  }).index("by_user_and_time", ["userId", "createdAt"])
    .index("by_status", ["status"]),
  
  // Store detailed feedback separately
  detailedFeedback: defineTable({
    shotId: v.id("shots"),
    section: v.string(), // "biomechanics", "improvements", etc.
    content: v.any(),    // JSON content for that section
  }).index("by_shot_and_section", ["shotId", "section"])
});
```

## Benchmarking Process

### 1. Component Isolation Testing
```typescript
class PerformanceBenchmark {
  async runComponentBenchmarks() {
    const results = {
      onDeviceML: await this.benchmarkMLModel(),
      videoProcessing: await this.benchmarkVideoProcessing(),
      networkUpload: await this.benchmarkNetworkUpload(),
      convexLatency: await this.benchmarkConvexFunctions(),
      geminiLatency: await this.benchmarkGeminiAPI(),
      uiRendering: await this.benchmarkUIUpdates()
    };
    
    return this.analyzeBottlenecks(results);
  }
  
  async benchmarkMLModel() {
    const iterations = 100;
    const frames = this.generateTestFrames();
    
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      await this.mlModel.detectShot(frames);
    }
    const total = performance.now() - start;
    
    return {
      avgLatency: total / iterations,
      p95Latency: this.calculateP95(timings),
      throughput: iterations / (total / 1000)
    };
  }
}
```

### 2. End-to-End Testing
```typescript
class E2EBenchmark {
  async runFullFlowBenchmark() {
    const testCases = [
      { network: 'wifi', videoQuality: 'high' },
      { network: '4g', videoQuality: 'medium' },
      { network: '3g', videoQuality: 'low' }
    ];
    
    const results = [];
    for (const testCase of testCases) {
      await this.simulateNetwork(testCase.network);
      const timing = await this.measureFullFlow(testCase.videoQuality);
      results.push({ ...testCase, timing });
    }
    
    return this.generateReport(results);
  }
  
  async measureFullFlow(quality: string) {
    const markers = {
      start: performance.now(),
      shotDetected: 0,
      fastFeedbackReceived: 0,
      fullFeedbackStarted: 0,
      fullFeedbackCompleted: 0
    };
    
    // Run the full flow with timing markers
    await this.runShotAnalysis(quality, markers);
    
    return {
      totalTime: markers.fullFeedbackCompleted - markers.start,
      timeToFastFeedback: markers.fastFeedbackReceived - markers.start,
      timeToFullFeedback: markers.fullFeedbackStarted - markers.start
    };
  }
}
```

### 3. Continuous Monitoring
```typescript
// React Native performance monitoring
import { PerformanceObserver } from 'react-native-performance';

const observer = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach((entry) => {
    if (entry.entryType === 'measure') {
      analytics.track('performance_metric', {
        name: entry.name,
        duration: entry.duration,
        timestamp: entry.startTime
      });
    }
  });
});

observer.observe({ entryTypes: ['measure'] });

// Mark important events
performance.mark('shot_detected');
performance.mark('fast_feedback_rendered');
performance.measure('time_to_fast_feedback', 'shot_detected', 'fast_feedback_rendered');
```

## Performance Monitoring Dashboard

### Key Metrics to Track
1. **User-Facing Latencies**
   - Time to first feedback
   - Time to complete analysis
   - UI responsiveness (frame rate)

2. **System Performance**
   - API response times
   - Video processing duration
   - Network upload speeds

3. **Error Rates**
   - Failed uploads
   - Gemini API errors
   - Timeout occurrences

4. **Resource Usage**
   - Mobile app memory usage
   - Battery consumption
   - Network bandwidth