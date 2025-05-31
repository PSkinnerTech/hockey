import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Dimensions,
  Alert,
  BackHandler,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { Ionicons } from '@expo/vector-icons';
import { RootStackScreenProps } from '../types/navigation';
import { Button } from '../components/ui';
import { Colors, getThemeColors } from '../theme/colors';
import { Layout, Typography, Spacing } from '../theme/spacing';
import { useCamera } from '../hooks/useCamera';
import { handlePermissionFlow } from '../lib/camera/permissions';
import { storage } from '../lib/storage/mmkv-setup';
import { RecordingManager } from '../lib/camera/RecordingManager';
import { useVisionCameraProcessor, VisionDetectionResult } from '../lib/camera/VisionCameraProcessor';
import {
  useRecordingStore,
  useRecordingStatus,
  useMLDetection,
  useCameraSettings,
  useStorageInfo,
} from '../stores/recordingStore';
import {
  getAvailableStorage,
  estimateVideoSize,
  ML_OPTIMIZED_CONSTRAINTS,
  formatFileSize,
} from '../lib/camera/utils';

type Props = RootStackScreenProps<'Recording'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const RECORDING_MAX_DURATION = 30; // 30 seconds

const RecordingScreen: React.FC<Props> = ({ navigation, route }) => {
  const colorScheme = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');
  const sessionId = route.params?.sessionId;

  // Zustand store hooks
  const { isRecording, isPaused, isProcessing, duration } = useRecordingStatus();
  const { confidence, detected, lastDetectionTime } = useMLDetection();
  const { facing, flash, grid, mlOverlay } = useCameraSettings();
  const { available, estimated, videoSize } = useStorageInfo();

  const recordingStore = useRecordingStore();

  // Refs
  const cameraRef = useRef<Camera>(null);
  const recordingManagerRef = useRef<RecordingManager | null>(null);
  const pulseAnimRef = useRef(new Animated.Value(1)).current;

  // Camera permissions and device
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  // VisionCamera frame processor for ML
  const { frameProcessor, isModelLoaded } = useVisionCameraProcessor(
    {
      targetFPS: 30, // Reduced for better performance
      detectionThreshold: 0.7,
      enableDebugging: __DEV__,
    },
    {
      onDetection: (result: VisionDetectionResult) => {
        recordingStore.updateDetection(result.confidence, result.detected);
      },
      onError: (error) => {
        console.error('Frame processing error:', error);
        recordingStore.setError(error.message);
      },
    },
  );

  // Initialize recording manager
  useEffect(() => {
    if (cameraRef.current && !recordingManagerRef.current && device) {
      recordingManagerRef.current = new RecordingManager(cameraRef as React.RefObject<Camera>, {
        maxDuration: RECORDING_MAX_DURATION,
        quality: 'high',
        audioEnabled: true,
      });

      // Set up callbacks
      recordingManagerRef.current.onRecordingStart = () => {
        recordingStore.startRecording();
        startPulseAnimation();
      };

      recordingManagerRef.current.onRecordingStop = (asset) => {
        recordingStore.stopRecording();
        recordingStore.setVideoUri(asset.uri);
        recordingStore.setVideoSize(asset.size);
        stopPulseAnimation();
      };

      recordingManagerRef.current.onDurationUpdate = (duration) => {
        recordingStore.setRecordingDuration(duration);
      };

      recordingManagerRef.current.onRecordingError = (error) => {
        recordingStore.setError(error.message);
      };
    }
  }, [recordingStore]);

  // Request permissions and update storage info on mount
  useEffect(() => {
    checkAndRequestPermissions();
    updateStorageInfo();
  }, []);

  // Update storage info periodically
  useEffect(() => {
    const interval = setInterval(updateStorageInfo, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Handle back button during recording
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isRecording) {
        Alert.alert('Stop Recording?', 'Do you want to stop recording and go back?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Stop & Go Back',
            style: 'destructive',
            onPress: handleStopAndGoBack,
          },
        ]);
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [isRecording]);

  const checkAndRequestPermissions = async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Permissions Required',
          'Camera and microphone permissions are required to record videos.',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
      }
    }
  };

  const updateStorageInfo = async () => {
    try {
      const availableStorage = await getAvailableStorage();
      const estimatedSize = estimateVideoSize(ML_OPTIMIZED_CONSTRAINTS);
      recordingStore.updateStorageInfo(availableStorage, estimatedSize);
    } catch (error) {
      console.error('Failed to update storage info:', error);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimRef, {
          toValue: 0.6,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimRef, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnimRef.stopAnimation();
    Animated.timing(pulseAnimRef, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleStartRecording = useCallback(async () => {
    if (!recordingManagerRef.current) return;

    try {
      recordingStore.clearError();
      const result = await recordingManagerRef.current.startRecording();

      if (!result.success) {
        Alert.alert('Recording Error', result.error.message);
        return;
      }
    } catch (err) {
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  }, [recordingStore]);

  const handleStopRecording = useCallback(async () => {
    if (!recordingManagerRef.current) return;

    try {
      recordingStore.setIsProcessing(true);
      const result = await recordingManagerRef.current.stopRecording();

      if (result.success) {
        const videoAsset = result.data;

        // Save recording info
        const shotId = Date.now().toString();
        const shots = storage.get<any[]>('recent_shots') || [];
        shots.unshift({
          id: shotId,
          timestamp: Date.now(),
          thumbnailUri: videoAsset.uri,
          accuracy: Math.floor(Math.random() * 30) + 70, // Mock accuracy
          confidence: confidence,
          detectionCount: detected ? 1 : 0,
        });
        storage.set('recent_shots', shots.slice(0, 10)); // Keep last 10

        // Navigate to analysis
        navigation.replace('Analysis', {
          shotId,
          videoUri: videoAsset.uri,
        });
      } else {
        Alert.alert('Recording Error', result.error.message);
      }
    } catch (err) {
      Alert.alert('Recording Error', 'Failed to stop recording. Please try again.');
    } finally {
      recordingStore.setIsProcessing(false);
    }
  }, [recordingStore, navigation, confidence, detected]);

  const handleStopAndGoBack = useCallback(async () => {
    if (recordingManagerRef.current && isRecording) {
      await recordingManagerRef.current.cancelRecording();
    }
    recordingStore.resetRecording();
    navigation.goBack();
  }, [recordingStore, navigation, isRecording]);

  // VisionCamera frame processor is automatically applied when frameProcessor prop is set

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Check if camera device is available
  if (!device) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: colors.background.primary },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
          Loading camera...
        </Text>
      </View>
    );
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingManagerRef.current) {
        recordingManagerRef.current.dispose();
      }
      recordingStore.resetRecording();
    };
  }, [recordingStore]);

  if (!hasPermission) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: colors.background.primary },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
          Checking permissions...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        device={device}
        isActive={true}
        video={true}
        audio={true}
        frameProcessor={mlOverlay ? frameProcessor : undefined}
      >
        {/* ML Overlay */}
        {mlOverlay && (
          <View style={styles.mlOverlay}>
            {grid && <View style={[styles.mlGrid, { borderColor: colors.primary[500] + '40' }]} />}

            {/* Detection confidence display */}
            {confidence > 0 && (
              <View style={[styles.confidenceDisplay, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}>
                <Text style={styles.confidenceText}>
                  Confidence: {Math.round(confidence * 100)}%
                </Text>
                <View
                  style={[styles.confidenceBar, { backgroundColor: colors.primary[500] + '30' }]}
                >
                  <View
                    style={[
                      styles.confidenceProgress,
                      {
                        backgroundColor: detected ? colors.success[500] : colors.primary[500],
                        width: `${confidence * 100}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            )}

            {detected && (
              <Animated.View
                style={[
                  styles.shotDetectionBadge,
                  {
                    backgroundColor: colors.success[500],
                    transform: [{ scale: pulseAnimRef }],
                  },
                ]}
              >
                <Ionicons name="checkmark-circle" size={24} color="white" />
                <Text style={styles.shotDetectionText}>Shot Detected!</Text>
              </Animated.View>
            )}
          </View>
        )}

        {/* Top Controls */}
        <View style={styles.topControls}>
          <Button variant="ghost" onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="close" size={28} color={colors.text.inverse} />
          </Button>

          <View style={styles.topRight}>
            <Button variant="ghost" onPress={recordingStore.toggleFlash} style={styles.iconButton}>
              <Ionicons
                name={flash ? 'flash' : 'flash-off'}
                size={28}
                color={colors.text.inverse}
              />
            </Button>

            <Button variant="ghost" onPress={recordingStore.toggleCamera} style={styles.iconButton}>
              <Ionicons name="camera-reverse-outline" size={28} color={colors.text.inverse} />
            </Button>

            <Button variant="ghost" onPress={recordingStore.toggleGrid} style={styles.iconButton}>
              <Ionicons
                name={grid ? 'grid-outline' : 'grid'}
                size={28}
                color={colors.text.inverse}
              />
            </Button>

            <Button
              variant="ghost"
              onPress={recordingStore.toggleMLOverlay}
              style={styles.iconButton}
            >
              <Ionicons
                name={mlOverlay ? 'eye-outline' : 'eye-off-outline'}
                size={28}
                color={colors.text.inverse}
              />
            </Button>
          </View>
        </View>

        {/* Recording Info */}
        {isRecording && (
          <View style={styles.recordingInfo}>
            <Animated.View
              style={[
                styles.recordingDot,
                {
                  backgroundColor: colors.recording?.active || '#FF0000',
                  transform: [{ scale: pulseAnimRef }],
                },
              ]}
            />
            <Text style={styles.recordingText}>
              {formatDuration(duration)} / {formatDuration(RECORDING_MAX_DURATION)}
            </Text>
          </View>
        )}

        {/* Storage Info */}
        <View style={styles.storageInfo}>
          <Text style={styles.storageText}>{formatFileSize(available)} available</Text>
          {estimated > 0 && (
            <Text style={styles.storageEstimate}>~{formatFileSize(estimated)} needed</Text>
          )}
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <View style={styles.recordButtonContainer}>
            <Button
              variant="primary"
              onPress={isRecording ? handleStopRecording : handleStartRecording}
              disabled={isProcessing || available < estimated}
              style={[
                styles.recordButton,
                isRecording && styles.recordButtonActive,
                {
                  backgroundColor: isRecording
                    ? colors.recording?.active || '#FF0000'
                    : colors.primary[500],
                },
                available < estimated && { opacity: 0.5 },
              ]}
            >
              {isProcessing ? (
                <ActivityIndicator color={colors.text.inverse} />
              ) : (
                <View
                  style={[styles.recordButtonInner, isRecording && styles.recordButtonInnerActive]}
                />
              )}
            </Button>

            <Text style={[styles.recordHint, { color: colors.text.inverse }]}>
              {isProcessing
                ? 'Processing...'
                : isRecording
                  ? 'Tap to stop'
                  : available < estimated
                    ? 'Not enough storage'
                    : 'Tap to record'}
            </Text>
          </View>
        </View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.md,
  },
  camera: {
    flex: 1,
  },
  mlOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mlGrid: {
    width: '80%',
    height: '60%',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: Layout.borderRadius.lg,
  },
  shotDetectionBadge: {
    position: 'absolute',
    top: '20%',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.round,
  },
  shotDetectionText: {
    color: 'white',
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  topControls: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  topRight: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  recordingInfo: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.round,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  recordingText: {
    color: 'white',
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  recordButtonContainer: {
    alignItems: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  recordButtonActive: {
    borderWidth: 6,
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  recordButtonInnerActive: {
    width: 30,
    height: 30,
    borderRadius: 8,
  },
  recordHint: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  confidenceDisplay: {
    position: 'absolute',
    top: '15%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.md,
    minWidth: 150,
  },
  confidenceText: {
    color: 'white',
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  confidenceBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  confidenceProgress: {
    height: '100%',
    borderRadius: 2,
  },
  storageInfo: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius.md,
  },
  storageText: {
    color: 'white',
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
  },
  storageEstimate: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: Typography.fontSize.xs,
    textAlign: 'center',
    marginTop: 2,
  },
});

export default React.memo(RecordingScreen);
