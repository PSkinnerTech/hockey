import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  Camera,
  useCameraDevices,
  useCameraPermission,
  VideoFile,
  CameraDevice,
} from 'react-native-vision-camera';
import { request, check, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { RootStackParamList } from '../types/navigation';

type CameraScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Camera'>;

const { width, height } = Dimensions.get('window');

export default function CameraScreen() {
  const navigation = useNavigation<CameraScreenNavigationProp>();
  const { hasPermission, requestPermission } = useCameraPermission();
  const devices = useCameraDevices();
  const camera = useRef<Camera>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [device, setDevice] = useState<CameraDevice | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Check initial microphone permission status
  useEffect(() => {
    const checkInitialMicrophonePermission = async () => {
      if (Platform.OS === 'ios') {
        try {
          const result = await check(PERMISSIONS.IOS.MICROPHONE);
          console.log('Initial microphone permission status:', result);
          
          if (result === RESULTS.GRANTED) {
            setAudioEnabled(true);
          } else {
            setAudioEnabled(false);
          }
        } catch (error) {
          console.error('Error checking microphone permission:', error);
          setAudioEnabled(false);
        }
      }
    };
    
    checkInitialMicrophonePermission();
  }, []);

  // Get the best back camera
  useEffect(() => {
    console.log('Available devices:', devices);
    console.log('Device count:', devices.length);
    
    // Check if running in simulator
    const isSimulator = devices.length === 0;
    
    if (isSimulator) {
      console.log('Running in iOS Simulator - cameras not available');
      // For simulator, we'll show a mock camera view
      setDevice({
        id: 'simulator-camera',
        position: 'back',
        hasFlash: false,
        hasTorch: false,
        minFocusDistance: 0,
        isMultiCam: false,
        name: 'Simulator Camera',
        neutralZoom: 1,
        maxZoom: 10,
        minZoom: 1,
        formats: [],
        supportsConcurrentCameraUse: false,
        supportsDepthCapture: false,
        supportsLowLightBoost: false,
        supportsRawCapture: false,
        hardwareLevel: 'full',
        sensorOrientation: 90,
        pixelFormat: 'yuv',
      } as any);
      setIsReady(true); // Simulator is always ready
      return;
    }
    
    // Try to get the best back camera
    const backCamera = devices.find(device => device.position === 'back');
    
    if (backCamera) {
      console.log('Found back camera:', backCamera.id);
      setDevice(backCamera);
    } else {
      console.log('No back camera found, checking all devices...');
      // If no back camera, try any available camera
      const anyCamera = devices.find(d => d != null);
      if (anyCamera) {
        console.log('Using fallback camera:', anyCamera.id);
        setDevice(anyCamera);
      } else {
        console.log('No cameras available');
      }
    }
  }, [devices]);

  useEffect(() => {
    console.log('Camera permission status:', hasPermission);
    if (hasPermission === false) {
      console.log('Requesting camera permission...');
      requestPermission().then((granted) => {
        console.log('Permission granted:', granted);
      });
    }
  }, [hasPermission, requestPermission]);

  const handleStartRecording = async () => {
    if (!device) return;

    // Handle simulator recording
    if (device.id === 'simulator-camera') {
      setIsRecording(true);
      console.log('Simulating recording start...');
      
      // Simulate a 3-second recording
      setTimeout(() => {
        console.log('Simulating recording finish...');
        setIsRecording(false);
        Alert.alert(
          'Simulator Recording', 
          'This was a simulated recording. Use a physical device for actual video recording.',
          [{ text: 'OK', onPress: () => {} }]
        );
      }, 3000);
      return;
    }

    if (!camera.current) return;

    try {
      setIsRecording(true);
      
      console.log('Starting recording with audio:', audioEnabled);
      
      camera.current.startRecording({
        flash: 'off',
        fileType: 'mp4',
        onRecordingFinished: (video: VideoFile) => {
          console.log('Recording finished:', video.path);
          setIsRecording(false);
          // Navigate to playback with the recorded video
          navigation.navigate('Playback', { videoUri: video.path });
        },
        onRecordingError: (error) => {
          console.error('Recording error:', error);
          
          setIsRecording(false);
          Alert.alert('Recording Error', 'Failed to record video');
        },
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    // Handle simulator recording
    if (device?.id === 'simulator-camera') {
      setIsRecording(false);
      return;
    }
    
    if (!camera.current || !isRecording) return;
    
    try {
      await camera.current.stopRecording();
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const handleBackPress = () => {
    if (isRecording) {
      handleStopRecording();
    }
    navigation.goBack();
  };

  const handleAudioToggle = () => {
    if (audioEnabled) {
      // Simply disable audio
      setAudioEnabled(false);
    } else {
      // Use react-native-permissions to request microphone permission
      if (Platform.OS === 'ios') {
        request(PERMISSIONS.IOS.MICROPHONE).then((result) => {
          console.log("permission is--------", result);
          
          if (result === RESULTS.GRANTED) {
            console.log('Microphone permission granted');
            setAudioEnabled(true);
          } else if (result === RESULTS.DENIED) {
            console.log('Microphone permission denied');
            Alert.alert(
              'Microphone Permission',
              'Microphone access was denied. Recording will continue without audio.',
              [{ text: 'OK' }]
            );
            setAudioEnabled(false);
          } else if (result === RESULTS.BLOCKED) {
            console.log('Microphone permission blocked');
            Alert.alert(
              'Microphone Access Blocked',
              'Microphone access is blocked. To enable audio recording, please go to Settings → Privacy & Security → Microphone → Smart Hockey Coach and enable access.',
              [{ text: 'OK' }]
            );
            setAudioEnabled(false);
          } else {
            console.log('Microphone permission unavailable');
            setAudioEnabled(false);
          }
        }).catch((error) => {
          console.error('Error requesting microphone permission:', error);
          setAudioEnabled(false);
        });
      } else {
        // For Android, enable audio directly (can add Android permission handling later)
        setAudioEnabled(true);
      }
    }
  };

  // Show permission screen if no permission
  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            Smart Hockey Coach needs camera access to record your shots
          </Text>
          <TouchableOpacity 
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show loading if no device
  if (!device) {
    const hasDevices = devices && devices.length > 0;
    
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {hasDevices ? 'Setting up camera...' : 'Looking for cameras...'}
          </Text>
          <Text style={styles.loadingSubtext}>
            {hasDevices 
              ? `Found ${devices.length} camera(s), initializing...`
              : 'Make sure camera permissions are granted'
            }
          </Text>
          {!hasDevices && (
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                console.log('Retrying camera setup...');
                requestPermission();
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* Camera View */}
      <View style={styles.cameraContainer}>
        {device?.id === 'simulator-camera' ? (
          // Simulator mock camera view
          <View style={styles.simulatorCamera}>
            <View style={styles.simulatorOverlay}>
              <Text style={styles.simulatorText}>📱 iOS Simulator</Text>
              <Text style={styles.simulatorSubtext}>Camera Preview</Text>
              <Text style={styles.simulatorNote}>
                Use a physical device for actual camera functionality
              </Text>
            </View>
          </View>
        ) : (
          // Real camera
          <Camera
            ref={camera}
            style={styles.camera}
            device={device}
            isActive={true}
            video={true}
            audio={audioEnabled}
            onInitialized={() => setIsReady(true)}
            onError={(error) => {
              console.log('Camera error:', error);
              
              // Handle microphone permission denial
              if (error.code === 'permission/microphone-permission-denied') {
                console.log('Microphone permission denied - disabling audio');
                setAudioEnabled(false);
                
                Alert.alert(
                  'Microphone Access',
                  'Microphone access was denied. Recording will continue without audio. To enable audio recording, please allow microphone access in Settings > Privacy & Security > Microphone > Smart Hockey Coach.',
                  [{ text: 'OK' }]
                );
              }
            }}
          />
        )}
        
        {/* Recording Indicator */}
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>REC</Text>
          </View>
        )}

        {/* Hockey Shot Guidelines */}
        <View style={styles.guidelines}>
          <View style={styles.centerCircle} />
          <Text style={styles.guidelineText}>
            Position the puck in the center circle
          </Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording && styles.recordButtonActive,
            !isReady && styles.recordButtonDisabled,
          ]}
          onPress={isRecording ? handleStopRecording : handleStartRecording}
          disabled={!isReady}
        >
          <View style={[
            styles.recordButtonInner,
            isRecording && styles.recordButtonInnerActive
          ]} />
        </TouchableOpacity>

        <View style={styles.placeholder} />
      </View>

      {/* Audio Permission Control */}
      {device?.id !== 'simulator-camera' && (
        <View style={styles.audioControls}>
          <View style={styles.audioStatus}>
            <Text style={styles.audioStatusText}>
              Audio Recording: {audioEnabled ? '✅ Enabled' : '❌ Disabled'}
            </Text>
            {!audioEnabled && (
              <Text style={styles.audioHelpText}>
                📱 Tap "Enable Audio Recording" below. iOS may prompt for microphone permission.
              </Text>
            )}
          </View>
          
          <TouchableOpacity
            style={[styles.audioButton, !audioEnabled && styles.audioButtonDisabled]}
            onPress={handleAudioToggle}
          >
            <Text style={styles.audioButtonText}>
              {audioEnabled ? '🎤 Disable Audio Recording' : '🎤 Enable Audio Recording'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          {isReady 
            ? isRecording 
              ? `Recording your shot${audioEnabled ? ' with audio' : ' (video only)'}...` 
              : 'Tap the red button to start recording'
            : 'Setting up camera...'
          }
        </Text>
        {!audioEnabled && device?.id !== 'simulator-camera' && (
          <Text style={styles.settingsHint}>
            💡 If microphone access was denied, enable it in Settings {'->'} Privacy & Security {'->'} Microphone {'->'} Smart Hockey Coach
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
  },
  loadingSubtext: {
    color: '#888888',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  recordingIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff0000',
    marginRight: 8,
  },
  recordingText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  guidelines: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -40 }],
    alignItems: 'center',
  },
  centerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderStyle: 'dashed',
  },
  guidelineText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#1a1a1a',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#666666',
  },
  recordButtonActive: {
    borderColor: '#ff0000',
  },
  recordButtonDisabled: {
    opacity: 0.5,
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff0000',
  },
  recordButtonInnerActive: {
    borderRadius: 8,
    width: 40,
    height: 40,
  },
  placeholder: {
    width: 48,
  },
  instructions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#1a1a1a',
  },
  instructionText: {
    color: '#888888',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  simulatorCamera: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
  },
  simulatorOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  simulatorText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  simulatorSubtext: {
    color: '#888888',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  simulatorNote: {
    color: '#666666',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#1a1a1a',
  },
  audioStatus: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#333333',
  },
  audioStatusText: {
    color: '#ffffff',
    fontSize: 14,
  },
  audioHelpText: {
    color: '#888888',
    fontSize: 12,
    marginTop: 4,
  },
  audioButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#0066cc',
  },
  audioButtonDisabled: {
    opacity: 0.5,
  },
  audioButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsHint: {
    color: '#888888',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
}); 