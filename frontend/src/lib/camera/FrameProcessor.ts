import { useRef, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
// TODO: Re-enable when TensorFlow.js camera compatibility is resolved
// import * as tf from '@tensorflow/tfjs';
// import '@tensorflow/tfjs-react-native';

export interface FrameData {
  width: number;
  height: number;
  data: Uint8Array;
  timestamp: number;
}

export interface DetectionResult {
  confidence: number;
  detected: boolean;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  timestamp: number;
}

export interface FrameProcessorConfig {
  targetFPS: number;
  detectionThreshold: number;
  maxProcessingTime: number;
  enableDebugging: boolean;
}

export interface FrameProcessorCallbacks {
  onDetection?: (result: DetectionResult) => void;
  onFrameProcessed?: (processingTime: number) => void;
  onError?: (error: Error) => void;
}

const DEFAULT_CONFIG: FrameProcessorConfig = {
  targetFPS: 60,
  detectionThreshold: 0.7,
  maxProcessingTime: 16, // ~60fps budget
  enableDebugging: false,
};

export class FrameProcessor {
  private config: FrameProcessorConfig;
  private callbacks: FrameProcessorCallbacks;
  private isProcessing = false;
  private lastProcessTime = 0;
  private frameQueue: FrameData[] = [];
  private processingStats = {
    framesProcessed: 0,
    averageProcessingTime: 0,
    droppedFrames: 0,
  };

  // ML Model (placeholder for now)
  private model: any = null;
  private isModelLoaded = false;

  // Performance throttling
  private readonly frameBudget: number;
  private readonly maxQueueSize = 3;

  constructor(config: Partial<FrameProcessorConfig> = {}, callbacks: FrameProcessorCallbacks = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.callbacks = callbacks;
    this.frameBudget = 1000 / this.config.targetFPS;

    this.initializeTensorFlow();
  }

  /**
   * Initialize TensorFlow.js for the platform
   */
  private async initializeTensorFlow(): Promise<void> {
    try {
      // TODO: Re-enable TensorFlow.js initialization
      console.log('TensorFlow.js temporarily disabled due to camera version conflict');
      
      // For now, use mock model
      this.createMockModel();
      this.isModelLoaded = true;
    } catch (error) {
      console.error('Failed to initialize TensorFlow:', error);
      this.callbacks.onError?.(error as Error);
    }
  }

  /**
   * Load the hockey shot detection model
   */
  private async loadModel(): Promise<void> {
    try {
      // TODO: Replace with actual model URL when available
      // For now, create a dummy model for development
      const modelUrl = 'https://example.com/hockey-shot-model.json';

      if (this.config.enableDebugging) {
        console.log('Loading hockey shot detection model...');
      }

      // In development, create a mock model
      if (__DEV__) {
        this.createMockModel();
        this.isModelLoaded = true;
        console.log('Mock model loaded for development');
        return;
      }

      // TODO: Production model loading when TensorFlow.js is re-enabled
      // this.model = await tf.loadGraphModel(modelUrl);
      this.createMockModel();
      this.isModelLoaded = true;

      if (this.config.enableDebugging) {
        console.log('Hockey shot detection model loaded successfully');
      }
    } catch (error) {
      console.error('Failed to load model:', error);
      this.callbacks.onError?.(error as Error);
    }
  }

  /**
   * Create a mock model for development
   */
  private createMockModel(): void {
    // Mock model that randomly detects shots for development
    this.model = {
      predict: () => {
        const confidence = Math.random();
        return {
          data: () => Promise.resolve([confidence, 1 - confidence]),
          dispose: () => {},
        };
      },
    } as any;
  }

  /**
   * Process camera frame for shot detection
   */
  processFrame = (frameData: FrameData): void => {
    const now = performance.now();

    // Throttle processing to maintain target FPS
    if (now - this.lastProcessTime < this.frameBudget) {
      this.processingStats.droppedFrames++;
      return;
    }

    // Check if we're already processing
    if (this.isProcessing) {
      this.processingStats.droppedFrames++;
      return;
    }

    // Manage frame queue to prevent memory buildup
    if (this.frameQueue.length >= this.maxQueueSize) {
      this.frameQueue.shift(); // Remove oldest frame
      this.processingStats.droppedFrames++;
    }

    this.frameQueue.push(frameData);
    this.processNextFrame();
  };

  /**
   * Process the next frame in the queue
   */
  private async processNextFrame(): Promise<void> {
    if (this.isProcessing || this.frameQueue.length === 0 || !this.isModelLoaded) {
      return;
    }

    this.isProcessing = true;
    const startTime = performance.now();

    try {
      const frameData = this.frameQueue.shift()!;
      const result = await this.analyzeFrame(frameData);

      // Update processing stats
      const processingTime = performance.now() - startTime;
      this.updateProcessingStats(processingTime);

      // Call callbacks
      this.callbacks.onFrameProcessed?.(processingTime);
      if (result.detected) {
        this.callbacks.onDetection?.(result);
      }

      this.lastProcessTime = performance.now();
    } catch (error) {
      console.error('Frame processing error:', error);
      this.callbacks.onError?.(error as Error);
    } finally {
      this.isProcessing = false;

      // Process next frame if available
      if (this.frameQueue.length > 0) {
        setTimeout(() => this.processNextFrame(), 0);
      }
    }
  }

  /**
   * Analyze a single frame for hockey shot detection
   */
  private async analyzeFrame(frameData: FrameData): Promise<DetectionResult> {
    if (!this.model) {
      throw new Error('Model not loaded');
    }

    try {
      // Convert frame data to tensor
      const tensor = this.frameToTensor(frameData);

      // Mock inference for now
      const prediction = this.model.predict(tensor);
      const predictionData = await prediction.data();
      
      // Extract confidence score (assuming binary classification)
      const confidence = predictionData[0];
      const detected = confidence > this.config.detectionThreshold;

      // Generate mock bounding box for detected shots
      const boundingBox = detected
        ? {
            x: frameData.width * 0.3,
            y: frameData.height * 0.2,
            width: frameData.width * 0.4,
            height: frameData.height * 0.6,
          }
        : undefined;

      // TODO: Re-enable tensor cleanup when TensorFlow.js is restored
      // tensor.dispose();
      prediction.dispose();

      return {
        confidence,
        detected,
        boundingBox,
        timestamp: frameData.timestamp,
      };
    } catch (error) {
      console.error('Frame analysis error:', error);
      throw error;
    }
  }

  /**
   * Convert frame data to tensor for ML processing
   */
  private frameToTensor(frameData: FrameData): any {
    try {
      // TODO: Re-enable when TensorFlow.js is restored
      // For now, return mock tensor data
      return {
        data: frameData.data,
        width: frameData.width,
        height: frameData.height,
        dispose: () => {}, // Mock dispose method
      };
    } catch (error) {
      console.error('Tensor conversion error:', error);
      throw error;
    }
  }

  /**
   * Update processing statistics
   */
  private updateProcessingStats(processingTime: number): void {
    this.processingStats.framesProcessed++;

    // Calculate running average
    const alpha = 0.1; // Smoothing factor
    this.processingStats.averageProcessingTime =
      alpha * processingTime + (1 - alpha) * this.processingStats.averageProcessingTime;

    if (this.config.enableDebugging && this.processingStats.framesProcessed % 30 === 0) {
      console.log('Frame processing stats:', {
        framesProcessed: this.processingStats.framesProcessed,
        averageProcessingTime: this.processingStats.averageProcessingTime.toFixed(2),
        droppedFrames: this.processingStats.droppedFrames,
        queueSize: this.frameQueue.length,
      });
    }
  }

  /**
   * Extract key frames for detailed analysis
   */
  extractKeyFrame(frameData: FrameData): FrameData | null {
    // Simple key frame extraction based on motion detection
    // In a real implementation, this would use more sophisticated algorithms

    if (this.frameQueue.length < 2) {
      return null;
    }

    // For now, return every 10th frame as a key frame
    if (this.processingStats.framesProcessed % 10 === 0) {
      return frameData;
    }

    return null;
  }

  /**
   * Get current processing statistics
   */
  getProcessingStats() {
    return {
      ...this.processingStats,
      isProcessing: this.isProcessing,
      queueSize: this.frameQueue.length,
      modelLoaded: this.isModelLoaded,
    };
  }

  /**
   * Update processor configuration
   */
  updateConfig(newConfig: Partial<FrameProcessorConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Update callbacks
   */
  updateCallbacks(newCallbacks: FrameProcessorCallbacks): void {
    this.callbacks = { ...this.callbacks, ...newCallbacks };
  }

  /**
   * Clear the frame queue
   */
  clearQueue(): void {
    this.frameQueue = [];
    this.processingStats.droppedFrames += this.frameQueue.length;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    // Clear queue
    this.frameQueue = [];

    // Dispose of model
    if (this.model && !__DEV__) {
      this.model.dispose();
    }
    this.model = null;
    this.isModelLoaded = false;

    // Reset state
    this.isProcessing = false;
    this.processingStats = {
      framesProcessed: 0,
      averageProcessingTime: 0,
      droppedFrames: 0,
    };

    console.log('FrameProcessor disposed');
  }
}

/**
 * React hook for using FrameProcessor
 */
export const useFrameProcessor = (
  config?: Partial<FrameProcessorConfig>,
  callbacks?: FrameProcessorCallbacks,
) => {
  const processorRef = useRef<FrameProcessor | null>(null);

  const processor = useMemo(() => {
    if (!processorRef.current) {
      processorRef.current = new FrameProcessor(config, callbacks);
    }
    return processorRef.current;
  }, []);

  const processFrame = useCallback(
    (frameData: FrameData) => {
      processor.processFrame(frameData);
    },
    [processor],
  );

  const updateConfig = useCallback(
    (newConfig: Partial<FrameProcessorConfig>) => {
      processor.updateConfig(newConfig);
    },
    [processor],
  );

  const updateCallbacks = useCallback(
    (newCallbacks: FrameProcessorCallbacks) => {
      processor.updateCallbacks(newCallbacks);
    },
    [processor],
  );

  const getStats = useCallback(() => {
    return processor.getProcessingStats();
  }, [processor]);

  const dispose = useCallback(() => {
    processor.dispose();
    processorRef.current = null;
  }, [processor]);

  return {
    processFrame,
    updateConfig,
    updateCallbacks,
    getStats,
    dispose,
  };
};
