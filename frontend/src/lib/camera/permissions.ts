import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { Alert, Linking, Platform } from 'react-native';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

interface PermissionResult {
  camera: PermissionStatus;
  microphone: PermissionStatus;
  mediaLibrary: PermissionStatus;
}

/**
 * Request camera permissions for video recording
 */
export const requestCameraPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Camera.requestCameraPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Failed to request camera permission:', error);
    return false;
  }
};

/**
 * Request microphone permissions for audio recording
 */
export const requestMicrophonePermission = async (): Promise<boolean> => {
  try {
    const { status } = await Camera.requestMicrophonePermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Failed to request microphone permission:', error);
    return false;
  }
};

/**
 * Request media library permissions for saving videos
 */
export const requestMediaLibraryPermission = async (): Promise<boolean> => {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Failed to request media library permission:', error);
    return false;
  }
};

/**
 * Check all permissions status
 */
export const checkPermissions = async (): Promise<PermissionResult> => {
  const [cameraStatus, microphoneStatus, mediaLibraryStatus] = await Promise.all([
    Camera.getCameraPermissionsAsync(),
    Camera.getMicrophonePermissionsAsync(),
    MediaLibrary.getPermissionsAsync(),
  ]);

  return {
    camera: cameraStatus.status,
    microphone: microphoneStatus.status,
    mediaLibrary: mediaLibraryStatus.status,
  };
};

/**
 * Request all required permissions
 */
export const requestAllPermissions = async (): Promise<boolean> => {
  const results = await Promise.all([
    requestCameraPermission(),
    requestMicrophonePermission(),
    requestMediaLibraryPermission(),
  ]);

  return results.every((result) => result === true);
};

/**
 * Show permission denied alert with settings option
 */
export const showPermissionDeniedAlert = (permissionType: string) => {
  Alert.alert(
    'Permission Required',
    `Smart Hockey Coach needs ${permissionType} permission to record and analyze your shots. Please enable it in your device settings.`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Open Settings',
        onPress: () => {
          if (Platform.OS === 'ios') {
            Linking.openURL('app-settings:');
          } else {
            Linking.openSettings();
          }
        },
      },
    ],
  );
};

/**
 * Handle permission flow with user feedback
 */
export const handlePermissionFlow = async (): Promise<boolean> => {
  const permissions = await checkPermissions();

  // Check if all permissions are already granted
  if (
    permissions.camera === 'granted' &&
    permissions.microphone === 'granted' &&
    permissions.mediaLibrary === 'granted'
  ) {
    return true;
  }

  // Request permissions that are not granted
  const needsCamera = permissions.camera !== 'granted';
  const needsMicrophone = permissions.microphone !== 'granted';
  const needsMediaLibrary = permissions.mediaLibrary !== 'granted';

  if (needsCamera) {
    const granted = await requestCameraPermission();
    if (!granted) {
      showPermissionDeniedAlert('camera');
      return false;
    }
  }

  if (needsMicrophone) {
    const granted = await requestMicrophonePermission();
    if (!granted) {
      showPermissionDeniedAlert('microphone');
      return false;
    }
  }

  if (needsMediaLibrary) {
    const granted = await requestMediaLibraryPermission();
    if (!granted) {
      showPermissionDeniedAlert('media library');
      return false;
    }
  }

  return true;
};
