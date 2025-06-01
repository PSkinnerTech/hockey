import { Frame } from 'react-native-vision-camera';

export interface ExtractedFrame {
  data: Uint8Array;
  width: number;
  height: number;
  format: 'RGB' | 'YUV' | 'GRAY';
  timestamp: number;
  frameNumber: number;
}

export interface FrameExtractionConfig {
  targetFormat: 'RGB' | 'YUV' | 'GRAY';
  downscaleFactor?: number; // 1 = full size, 2 = half size, etc.
  quality?: 'high' | 'medium' | 'low';
}

/**
 * Extract frame data for ML processing
 */
export const extractFrameData = (
  frame: Frame, 
  config: FrameExtractionConfig = { targetFormat: 'RGB' }
): ExtractedFrame | null => {
  'worklet';
  
  try {
    // Calculate target dimensions
    const targetWidth = config.downscaleFactor 
      ? Math.floor(frame.width / config.downscaleFactor)
      : frame.width;
    const targetHeight = config.downscaleFactor 
      ? Math.floor(frame.height / config.downscaleFactor)
      : frame.height;
    
    // For now, we'll create a mock extracted frame
    // In a real implementation, this would use frame.toArrayBuffer() or similar
    // when VisionCamera Frame API supports it fully
    
    const bytesPerPixel = config.targetFormat === 'RGB' ? 3 : 
                         config.targetFormat === 'YUV' ? 1.5 : 1;
    const dataSize = Math.floor(targetWidth * targetHeight * bytesPerPixel);
    
    // Create mock data - this will be replaced with actual frame extraction
    const data = new Uint8Array(dataSize);
    
    return {
      data,
      width: targetWidth,
      height: targetHeight,
      format: config.targetFormat,
      timestamp: frame.timestamp,
      frameNumber: 0, // Will be set by frame processor
    };
    
  } catch (error) {
    console.warn('Frame extraction error:', error);
    return null;
  }
};

/**
 * Convert YUV to RGB format for ML processing
 * This is a simplified conversion - production would use native implementation
 */
export const convertYUVtoRGB = (
  yuvData: Uint8Array, 
  width: number, 
  height: number
): Uint8Array => {
  'worklet';
  
  const rgbData = new Uint8Array(width * height * 3);
  const ySize = width * height;
  const uvSize = ySize / 4;
  
  // Simplified YUV420 to RGB conversion
  // Production implementation would use native code for performance
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const yIndex = i * width + j;
      const uvIndex = Math.floor(i / 2) * Math.floor(width / 2) + Math.floor(j / 2);
      
      const y = yuvData[yIndex];
      const u = yuvData[ySize + uvIndex] || 128;
      const v = yuvData[ySize + uvSize + uvIndex] || 128;
      
      // YUV to RGB conversion matrix
      const c = y - 16;
      const d = u - 128;
      const e = v - 128;
      
      const r = Math.max(0, Math.min(255, Math.round((298 * c + 409 * e + 128) >> 8)));
      const g = Math.max(0, Math.min(255, Math.round((298 * c - 100 * d - 208 * e + 128) >> 8)));
      const b = Math.max(0, Math.min(255, Math.round((298 * c + 516 * d + 128) >> 8)));
      
      const rgbIndex = (i * width + j) * 3;
      rgbData[rgbIndex] = r;
      rgbData[rgbIndex + 1] = g;
      rgbData[rgbIndex + 2] = b;
    }
  }
  
  return rgbData;
};

/**
 * Downscale frame data for performance
 */
export const downscaleFrameData = (
  data: Uint8Array,
  originalWidth: number,
  originalHeight: number,
  scaleFactor: number,
  channels: number = 3
): { data: Uint8Array; width: number; height: number } => {
  'worklet';
  
  const newWidth = Math.floor(originalWidth / scaleFactor);
  const newHeight = Math.floor(originalHeight / scaleFactor);
  const newData = new Uint8Array(newWidth * newHeight * channels);
  
  // Simple nearest neighbor downscaling
  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      const srcX = Math.floor(x * scaleFactor);
      const srcY = Math.floor(y * scaleFactor);
      const srcIndex = (srcY * originalWidth + srcX) * channels;
      const dstIndex = (y * newWidth + x) * channels;
      
      for (let c = 0; c < channels; c++) {
        newData[dstIndex + c] = data[srcIndex + c];
      }
    }
  }
  
  return {
    data: newData,
    width: newWidth,
    height: newHeight,
  };
};

/**
 * Convert frame to grayscale for certain ML models
 */
export const convertToGrayscale = (
  rgbData: Uint8Array,
  width: number,
  height: number
): Uint8Array => {
  'worklet';
  
  const grayData = new Uint8Array(width * height);
  
  for (let i = 0; i < width * height; i++) {
    const rgbIndex = i * 3;
    const r = rgbData[rgbIndex];
    const g = rgbData[rgbIndex + 1];
    const b = rgbData[rgbIndex + 2];
    
    // Standard grayscale conversion
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    grayData[i] = gray;
  }
  
  return grayData;
};

/**
 * Normalize frame data for ML input (0-1 range)
 */
export const normalizeFrameData = (data: Uint8Array): Float32Array => {
  'worklet';
  
  const normalized = new Float32Array(data.length);
  
  for (let i = 0; i < data.length; i++) {
    normalized[i] = data[i] / 255.0;
  }
  
  return normalized;
};

/**
 * Get optimal extraction config based on performance mode
 */
export const getOptimalExtractionConfig = (
  performanceMode: 'battery' | 'balanced' | 'performance'
): FrameExtractionConfig => {
  switch (performanceMode) {
    case 'battery':
      return {
        targetFormat: 'GRAY',
        downscaleFactor: 4, // Quarter resolution
        quality: 'low',
      };
    case 'balanced':
      return {
        targetFormat: 'RGB',
        downscaleFactor: 2, // Half resolution
        quality: 'medium',
      };
    case 'performance':
      return {
        targetFormat: 'RGB',
        downscaleFactor: 1, // Full resolution
        quality: 'high',
      };
    default:
      return {
        targetFormat: 'RGB',
        downscaleFactor: 2,
        quality: 'medium',
      };
  }
}; 