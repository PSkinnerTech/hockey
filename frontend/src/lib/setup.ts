import { Platform } from 'react-native';
import { initializeTensorFlow, getTFStatus } from './ml/tensorflow-setup';
import { initializeStorage } from './storage/mmkv-setup';
import { checkPermissions } from './camera/permissions';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

// Background task names
const BACKGROUND_UPLOAD_TASK = 'smart-hockey-coach-upload';
const BACKGROUND_ML_TASK = 'smart-hockey-coach-ml-process';

export interface AppInitStatus {
  tensorflow: boolean;
  storage: boolean;
  permissions: {
    camera: boolean;
    microphone: boolean;
    mediaLibrary: boolean;
  };
  backgroundTasks: boolean;
  errors: string[];
}

/**
 * Initialize all app systems
 */
export const initializeApp = async (): Promise<AppInitStatus> => {
  const status: AppInitStatus = {
    tensorflow: false,
    storage: false,
    permissions: {
      camera: false,
      microphone: false,
      mediaLibrary: false,
    },
    backgroundTasks: false,
    errors: [],
  };

  console.log('🏒 Smart Hockey Coach - Initializing...');

  // 1. Initialize Storage
  try {
    console.log('📦 Initializing storage...');
    initializeStorage();
    status.storage = true;
  } catch (error) {
    console.error('Failed to initialize storage:', error);
    status.errors.push(`Storage: ${error instanceof Error ? error.message : String(error)}`);
  }

  // 2. Initialize TensorFlow.js
  try {
    console.log('🧠 Initializing TensorFlow.js...');
    await initializeTensorFlow();
    const tfStatus = getTFStatus();
    status.tensorflow = tfStatus.isInitialized;

    if (!tfStatus.isInitialized && tfStatus.error) {
      status.errors.push(`TensorFlow: ${tfStatus.error.message}`);
    }
  } catch (error) {
    console.error('Failed to initialize TensorFlow:', error);
    status.errors.push(`TensorFlow: ${error instanceof Error ? error.message : String(error)}`);
  }

  // 3. Check Permissions
  try {
    console.log('🔒 Checking permissions...');
    const permissions = await checkPermissions();
    status.permissions = {
      camera: permissions.camera === 'granted',
      microphone: permissions.microphone === 'granted',
      mediaLibrary: permissions.mediaLibrary === 'granted',
    };
  } catch (error) {
    console.error('Failed to check permissions:', error);
    status.errors.push(`Permissions: ${error instanceof Error ? error.message : String(error)}`);
  }

  // 4. Register Background Tasks
  try {
    console.log('⚡ Registering background tasks...');
    await registerBackgroundTasks();
    status.backgroundTasks = true;
  } catch (error) {
    console.error('Failed to register background tasks:', error);
    status.errors.push(
      `Background Tasks: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // Log final status
  console.log('✅ App initialization complete:');
  console.log('  - Storage:', status.storage ? '✓' : '✗');
  console.log('  - TensorFlow:', status.tensorflow ? '✓' : '✗');
  console.log('  - Camera:', status.permissions.camera ? '✓' : '✗');
  console.log('  - Microphone:', status.permissions.microphone ? '✓' : '✗');
  console.log('  - Media Library:', status.permissions.mediaLibrary ? '✓' : '✗');
  console.log('  - Background Tasks:', status.backgroundTasks ? '✓' : '✗');

  if (status.errors.length > 0) {
    console.warn('⚠️ Initialization errors:', status.errors);
  }

  return status;
};

/**
 * Register background tasks for upload and ML processing
 */
const registerBackgroundTasks = async (): Promise<void> => {
  // Define upload task
  TaskManager.defineTask(BACKGROUND_UPLOAD_TASK, async () => {
    try {
      console.log('🔄 Running background upload task...');
      // TODO: Implement actual upload logic
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (error) {
      console.error('Background upload task failed:', error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });

  // Define ML processing task
  TaskManager.defineTask(BACKGROUND_ML_TASK, async () => {
    try {
      console.log('🤖 Running background ML processing...');
      // TODO: Implement actual ML processing logic
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (error) {
      console.error('Background ML task failed:', error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });

  // Register tasks with system
  if (Platform.OS !== 'web') {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_UPLOAD_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
  }
};

/**
 * Camera format configuration for optimal ML performance
 */
export const getCameraFormat = () => {
  return {
    // Video settings optimized for ML
    video: {
      width: 1280,
      height: 720,
      frameRate: 30,
      codec: Platform.OS === 'ios' ? 'h264' : 'h264',
      bitRate: 5000000, // 5 Mbps
    },

    // Photo settings
    photo: {
      width: 1920,
      height: 1080,
      quality: 0.8,
    },

    // ML processing settings
    ml: {
      inputSize: [224, 224], // Common ML model input size
      preprocessFrameRate: 5, // Process every 6th frame (5 fps for 30fps video)
      batchSize: 1,
    },
  };
};

/**
 * Performance configuration
 */
export const getPerformanceConfig = () => {
  return {
    // Memory limits
    maxMemoryUsage: 200 * 1024 * 1024, // 200MB

    // Cache limits
    maxCacheSize: 100 * 1024 * 1024, // 100MB
    maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7 days

    // Video limits
    maxVideoDuration: 60, // seconds
    maxVideoSize: 100 * 1024 * 1024, // 100MB

    // ML limits
    maxConcurrentInferences: 1,
    inferenceTimeout: 5000, // 5 seconds

    // Network
    uploadTimeout: 30000, // 30 seconds
    downloadTimeout: 30000, // 30 seconds
    maxRetries: 3,
  };
};

/**
 * Clean up app resources
 */
export const cleanupApp = async (): Promise<void> => {
  console.log('🧹 Cleaning up app resources...');

  try {
    // Unregister background tasks
    await TaskManager.unregisterAllTasksAsync();

    // Clean TensorFlow resources
    const tfStatus = getTFStatus();
    if (tfStatus.isInitialized) {
      // TensorFlow cleanup would go here
    }

    console.log('✅ Cleanup complete');
  } catch (error) {
    console.error('Failed to cleanup app:', error);
  }
};
