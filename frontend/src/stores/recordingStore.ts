import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

export interface RecordingState {
  // Recording status
  isRecording: boolean;
  isPaused: boolean;
  isProcessing: boolean;

  // Recording data
  recordingDuration: number;
  videoUri: string | null;
  videoSize: number;

  // ML detection
  detectionConfidence: number;
  shotDetected: boolean;
  lastDetectionTime: number | null;

  // Camera settings
  cameraFacing: 'front' | 'back';
  isFlashOn: boolean;
  showGrid: boolean;
  showMLOverlay: boolean;

  // Storage info
  availableStorage: number;
  estimatedFileSize: number;

  // Error state
  error: string | null;
}

export interface RecordingActions {
  // Recording controls
  startRecording: () => void;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  resetRecording: () => void;

  // Recording data
  setRecordingDuration: (duration: number) => void;
  setVideoUri: (uri: string | null) => void;
  setVideoSize: (size: number) => void;
  setIsProcessing: (processing: boolean) => void;

  // ML detection
  updateDetection: (confidence: number, detected: boolean) => void;
  clearDetection: () => void;

  // Camera settings
  toggleCamera: () => void;
  toggleFlash: () => void;
  toggleGrid: () => void;
  toggleMLOverlay: () => void;

  // Storage
  updateStorageInfo: (available: number, estimated: number) => void;

  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
}

export type RecordingStore = RecordingState & RecordingActions;

const initialState: RecordingState = {
  // Recording status
  isRecording: false,
  isPaused: false,
  isProcessing: false,

  // Recording data
  recordingDuration: 0,
  videoUri: null,
  videoSize: 0,

  // ML detection
  detectionConfidence: 0,
  shotDetected: false,
  lastDetectionTime: null,

  // Camera settings
  cameraFacing: 'back',
  isFlashOn: false,
  showGrid: true,
  showMLOverlay: true,

  // Storage info
  availableStorage: 0,
  estimatedFileSize: 0,

  // Error state
  error: null,
};

export const useRecordingStore = create<RecordingStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...initialState,

      // Recording controls
      startRecording: () => {
        set({
          isRecording: true,
          isPaused: false,
          recordingDuration: 0,
          videoUri: null,
          videoSize: 0,
          error: null,
        });
      },

      stopRecording: () => {
        set({
          isRecording: false,
          isPaused: false,
        });
      },

      pauseRecording: () => {
        if (get().isRecording) {
          set({ isPaused: true });
        }
      },

      resumeRecording: () => {
        if (get().isRecording) {
          set({ isPaused: false });
        }
      },

      resetRecording: () => {
        set({
          ...initialState,
          // Preserve camera settings and storage info
          cameraFacing: get().cameraFacing,
          isFlashOn: get().isFlashOn,
          showGrid: get().showGrid,
          showMLOverlay: get().showMLOverlay,
          availableStorage: get().availableStorage,
          estimatedFileSize: get().estimatedFileSize,
        });
      },

      // Recording data
      setRecordingDuration: (duration: number) => {
        set({ recordingDuration: duration });
      },

      setVideoUri: (uri: string | null) => {
        set({ videoUri: uri });
      },

      setVideoSize: (size: number) => {
        set({ videoSize: size });
      },

      setIsProcessing: (processing: boolean) => {
        set({ isProcessing: processing });
      },

      // ML detection
      updateDetection: (confidence: number, detected: boolean) => {
        set({
          detectionConfidence: confidence,
          shotDetected: detected,
          lastDetectionTime: detected ? Date.now() : get().lastDetectionTime,
        });
      },

      clearDetection: () => {
        set({
          detectionConfidence: 0,
          shotDetected: false,
        });
      },

      // Camera settings
      toggleCamera: () => {
        set((state) => ({
          cameraFacing: state.cameraFacing === 'back' ? 'front' : 'back',
        }));
      },

      toggleFlash: () => {
        set((state) => ({
          isFlashOn: !state.isFlashOn,
        }));
      },

      toggleGrid: () => {
        set((state) => ({
          showGrid: !state.showGrid,
        }));
      },

      toggleMLOverlay: () => {
        set((state) => ({
          showMLOverlay: !state.showMLOverlay,
        }));
      },

      // Storage
      updateStorageInfo: (available: number, estimated: number) => {
        set({
          availableStorage: available,
          estimatedFileSize: estimated,
        });
      },

      // Error handling
      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },
    })),
    {
      name: 'recording-store',
    },
  ),
);

// Selectors for commonly used state combinations
export const useRecordingStatus = () =>
  useRecordingStore((state) => ({
    isRecording: state.isRecording,
    isPaused: state.isPaused,
    isProcessing: state.isProcessing,
    duration: state.recordingDuration,
  }));

export const useMLDetection = () =>
  useRecordingStore((state) => ({
    confidence: state.detectionConfidence,
    detected: state.shotDetected,
    lastDetectionTime: state.lastDetectionTime,
  }));

export const useCameraSettings = () =>
  useRecordingStore((state) => ({
    facing: state.cameraFacing,
    flash: state.isFlashOn,
    grid: state.showGrid,
    mlOverlay: state.showMLOverlay,
  }));

export const useStorageInfo = () =>
  useRecordingStore((state) => ({
    available: state.availableStorage,
    estimated: state.estimatedFileSize,
    videoSize: state.videoSize,
  }));
