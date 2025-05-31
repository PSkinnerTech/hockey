// TODO: Re-enable when TensorFlow.js camera compatibility is resolved
// import * as tf from '@tensorflow/tfjs';
// import '@tensorflow/tfjs-react-native';
import { Platform } from 'react-native';

interface TFStatus {
  isInitialized: boolean;
  backend: string;
  version: string;
  error?: Error;
}

let tfStatus: TFStatus = {
  isInitialized: false,
  backend: 'mock',
  version: '4.22.0', // Mock version
};

/**
 * Initialize TensorFlow.js for React Native
 * Currently disabled due to camera version conflicts
 */
export const initializeTensorFlow = async (): Promise<TFStatus> => {
  if (tfStatus.isInitialized) {
    return tfStatus;
  }

  try {
    console.log('TensorFlow.js initialization temporarily disabled');
    console.log('Using mock ML implementation for development');
    console.log(`Platform: ${Platform.OS}`);

    // Update status
    tfStatus = {
      isInitialized: true,
      backend: 'mock',
      version: '4.22.0',
    };

    return tfStatus;
  } catch (error) {
    console.error('Failed to initialize TensorFlow.js:', error);
    tfStatus = {
      isInitialized: false,
      backend: '',
      version: '4.22.0',
      error: error as Error,
    };
    throw error;
  }
};

/**
 * Load a TensorFlow.js model from a URL or bundled asset
 * Currently returns mock model
 */
export const loadModel = async (modelUrl: string): Promise<any> => {
  if (!tfStatus.isInitialized) {
    throw new Error('TensorFlow.js is not initialized. Call initializeTensorFlow() first.');
  }

  try {
    console.log('Mock model loaded successfully');
    return {
      predict: (input: any) => ({
        data: () => Promise.resolve([Math.random(), Math.random()]),
        dispose: () => {},
      }),
      dispose: () => {},
    };
  } catch (error) {
    console.error('Failed to load model:', error);
    throw new Error(`Failed to load model from ${modelUrl}`);
  }
};

/**
 * Process a video frame for ML inference
 * Currently returns mock tensor
 */
export const preprocessFrame = (
  imageData: Uint8Array,
  width: number,
  height: number,
  targetSize: [number, number] = [224, 224],
): any => {
  // Mock tensor
  return {
    data: imageData,
    width,
    height,
    shape: [targetSize[0], targetSize[1], 3],
    dispose: () => {},
    expandDims: () => ({
      dispose: () => {},
    }),
    rank: 3,
  };
};

/**
 * Run inference on a preprocessed frame
 * Currently returns mock prediction
 */
export const runInference = async (
  model: any,
  inputTensor: any,
): Promise<any> => {
  if (!tfStatus.isInitialized) {
    throw new Error('TensorFlow.js is not initialized');
  }

  // Mock prediction
  return {
    data: () => Promise.resolve([Math.random(), Math.random()]),
    dispose: () => {},
  };
};

/**
 * Dispose of a model and free memory
 */
export const disposeModel = (model: any): void => {
  if (model && 'dispose' in model) {
    model.dispose();
  }
};

/**
 * Get TensorFlow.js status
 */
export const getTFStatus = (): TFStatus => tfStatus;

/**
 * Memory management utilities
 */
export const memoryStats = () => {
  if (!tfStatus.isInitialized) {
    return null;
  }

  return {
    numTensors: 0,
    numBytes: 0,
    numDataBuffers: 0,
  };
};

/**
 * Clean up all tensors that are not disposed
 */
export const cleanupTensors = (): void => {
  if (!tfStatus.isInitialized) {
    return;
  }

  console.log('Mock tensor cleanup');
};

/**
 * Performance monitoring
 */
export const profileInference = async (
  fn: () => Promise<any>,
  name: string = 'Inference',
): Promise<{ result: any; timeMs: number }> => {
  const start = performance.now();
  const result = await fn();
  const timeMs = performance.now() - start;

  console.log(`${name} took ${timeMs.toFixed(2)}ms`);

  return { result, timeMs };
};