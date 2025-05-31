import { Platform } from 'react-native';
import { useTensorflowModel } from 'react-native-fast-tflite';

interface TFLiteStatus {
  isInitialized: boolean;
  modelLoaded: boolean;
  error?: Error;
}

interface ShotDetectionResult {
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

interface ModelConfig {
  modelPath: string;
  inputShape: [number, number, number, number]; // [batch, height, width, channels]
  outputShape: [number, number]; // [batch, classes]
  threshold: number;
}

let tfliteStatus: TFLiteStatus = {
  isInitialized: false,
  modelLoaded: false,
};

// Default model configuration for hockey shot detection
const DEFAULT_MODEL_CONFIG: ModelConfig = {
  modelPath: 'models/shot_detection.tflite',
  inputShape: [1, 224, 224, 3], // Standard mobile ML input size
  outputShape: [1, 2], // Binary classification: [no_shot, shot]
  threshold: 0.7,
};

/**
 * Initialize TensorFlow Lite for React Native
 * Uses native TFLite for optimal performance
 */
export const initializeTensorFlowLite = async (): Promise<TFLiteStatus> => {
  try {
    console.log('Initializing TensorFlow Lite for hockey shot detection');
    console.log(`Platform: ${Platform.OS}`);

    // TensorFlow Lite initialization is handled by react-native-fast-tflite
    // No explicit initialization needed - models are loaded on demand
    
    tfliteStatus = {
      isInitialized: true,
      modelLoaded: false, // Will be set when model is loaded
    };

    console.log('TensorFlow Lite initialized successfully');
    return tfliteStatus;
  } catch (error) {
    console.error('Failed to initialize TensorFlow Lite:', error);
    tfliteStatus = {
      isInitialized: false,
      modelLoaded: false,
      error: error as Error,
    };
    throw error;
  }
};

/**
 * React hook to load and use the hockey shot detection model
 */
export const useHockeyShotModel = (modelConfig: Partial<ModelConfig> = {}) => {
  const config = { ...DEFAULT_MODEL_CONFIG, ...modelConfig };
  
  // Load the TensorFlow Lite model
  const model = useTensorflowModel(
    Platform.OS === 'android' 
      ? { modelPath: config.modelPath } 
      : require(`../../../assets/${config.modelPath}`)
  );

  const runInference = (inputData: number[]): ShotDetectionResult => {
    try {
      if (!model) {
        throw new Error('Model not loaded');
      }

      // Validate input shape
      if (inputData.length !== config.inputShape[1] * config.inputShape[2] * config.inputShape[3]) {
        throw new Error(`Invalid input size. Expected ${config.inputShape[1] * config.inputShape[2] * config.inputShape[3]}, got ${inputData.length}`);
      }

      // Run inference (mock for now until model is properly loaded)
      const result = model?.model ? model.model.run([new Float32Array(inputData)]) : [Math.random(), Math.random()];
      
      // Extract confidence scores
      const scores = result as number[];
      const shotConfidence = scores[1]; // Index 1 for 'shot' class
      const detected = shotConfidence > config.threshold;

      return {
        confidence: shotConfidence,
        detected,
        timestamp: Date.now(),
        boundingBox: detected ? generateMockBoundingBox() : undefined,
      };
    } catch (error) {
      console.error('TensorFlow Lite inference error:', error);
      throw error;
    }
  };

  return {
    model,
    runInference,
    isLoaded: !!model,
    config,
  };
};

/**
 * Process camera frame for shot detection
 * Preprocesses the frame and runs inference
 */
export const processFrameForDetection = (
  frameData: Uint8Array,
  width: number,
  height: number,
  model: any,
  config: ModelConfig = DEFAULT_MODEL_CONFIG
): ShotDetectionResult => {
  try {
    // Preprocess the frame
    const preprocessedData = preprocessFrame(frameData, width, height, config.inputShape);
    
    // Run inference
    const result = model.run(preprocessedData);
    
    // Process results
    const scores = result as number[];
    const shotConfidence = scores[1]; // Index 1 for 'shot' class
    const detected = shotConfidence > config.threshold;

    return {
      confidence: shotConfidence,
      detected,
      timestamp: Date.now(),
      boundingBox: detected ? generateMockBoundingBox() : undefined,
    };
  } catch (error) {
    console.error('Frame processing error:', error);
    throw error;
  }
};

/**
 * Preprocess camera frame for model input
 * Resizes, normalizes, and formats the frame data
 */
export const preprocessFrame = (
  frameData: Uint8Array,
  width: number,
  height: number,
  targetShape: [number, number, number, number]
): Float32Array => {
  const [, targetHeight, targetWidth, channels] = targetShape;
  
  try {
    // For now, implement basic preprocessing
    // In a production app, you would use native image processing
    
    // Calculate resize ratios
    const widthRatio = width / targetWidth;
    const heightRatio = height / targetHeight;
    
    // Create output array
    const output = new Float32Array(targetHeight * targetWidth * channels);
    
    // Simple nearest neighbor resize and normalization
    for (let y = 0; y < targetHeight; y++) {
      for (let x = 0; x < targetWidth; x++) {
        const sourceX = Math.floor(x * widthRatio);
        const sourceY = Math.floor(y * heightRatio);
        const sourceIndex = (sourceY * width + sourceX) * 4; // RGBA
        const targetIndex = (y * targetWidth + x) * channels;
        
        // Copy RGB channels and normalize to [0, 1]
        for (let c = 0; c < Math.min(channels, 3); c++) {
          output[targetIndex + c] = frameData[sourceIndex + c] / 255.0;
        }
      }
    }
    
    return output;
  } catch (error) {
    console.error('Frame preprocessing error:', error);
    throw error;
  }
};

/**
 * Generate mock bounding box for detected shots
 * In production, this would come from the model
 */
const generateMockBoundingBox = () => ({
  x: 0.3,
  y: 0.2,
  width: 0.4,
  height: 0.6,
});

/**
 * Get TensorFlow Lite status
 */
export const getTFLiteStatus = (): TFLiteStatus => tfliteStatus;

/**
 * Performance monitoring for inference
 */
export const profileInference = async (
  fn: () => ShotDetectionResult,
  name: string = 'TFLite Inference'
): Promise<{ result: ShotDetectionResult; timeMs: number }> => {
  const start = performance.now();
  const result = fn();
  const timeMs = performance.now() - start;

  if (__DEV__) {
    console.log(`${name} took ${timeMs.toFixed(2)}ms`);
    
    // Log warning if inference is too slow
    if (timeMs > 100) {
      console.warn(`Slow inference detected: ${timeMs.toFixed(2)}ms (target: <100ms)`);
    }
  }

  return { result, timeMs };
};

/**
 * Create placeholder model for development
 * Returns mock predictions until real model is available
 */
export const createMockModel = () => ({
  run: (inputData: number[] | Float32Array): number[] => {
    // Simulate processing delay
    const processingTime = Math.random() * 50 + 10; // 10-60ms
    
    // Mock detection logic based on input variance
    const variance = calculateVariance(Array.from(inputData).slice(0, 100));
    const baseConfidence = Math.min(variance * 2, 0.9);
    const noise = (Math.random() - 0.5) * 0.2;
    const shotConfidence = Math.max(0, Math.min(1, baseConfidence + noise));
    
    return [1 - shotConfidence, shotConfidence];
  },
  isLoaded: true,
  dispose: () => {},
});

/**
 * Calculate variance of input data for mock detection
 */
const calculateVariance = (data: number[]): number => {
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  return Math.sqrt(variance);
};

/**
 * Model asset management
 */
export const getModelAssetPath = (modelName: string): string => {
  return Platform.OS === 'android' 
    ? `file:///android_asset/${modelName}`
    : `${__dirname}/../../assets/models/${modelName}`;
};

/**
 * Validate model file exists
 */
export const validateModelFile = async (modelPath: string): Promise<boolean> => {
  try {
    // This would check if the model file exists
    // For now, return true for development
    console.log(`Validating model at path: ${modelPath}`);
    return true;
  } catch (error) {
    console.error('Model validation error:', error);
    return false;
  }
};