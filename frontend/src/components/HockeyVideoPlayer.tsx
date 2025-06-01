import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
  PanResponder,
} from 'react-native';
import Video, { OnLoadData, OnProgressData } from 'react-native-video';

const { width: screenWidth } = Dimensions.get('window');

interface HockeyVideoPlayerProps {
  videoUri: string;
  onError?: (error: any) => void;
  onLoadStart?: () => void;
  onLoad?: (data: OnLoadData) => void;
}

// Playback speed options optimized for hockey analysis
const PLAYBACK_SPEEDS = [
  { speed: 0.25, label: '0.25x', description: 'Frame Analysis' },
  { speed: 0.5, label: '0.5x', description: 'Slow Motion' },
  { speed: 1.0, label: '1x', description: 'Normal' },
  { speed: 2.0, label: '2x', description: 'Fast' },
];

const FRAME_RATE = 60; // Assuming 60fps recording
const FRAME_DURATION = 1 / FRAME_RATE; // Duration of one frame in seconds

export default function HockeyVideoPlayer({
  videoUri,
  onError,
  onLoadStart,
  onLoad,
}: HockeyVideoPlayerProps) {
  const videoRef = useRef<any>(null);
  
  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    if (showControls && isPlaying) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showControls, isPlaying]);

  // Show controls on interaction
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
  }, []);

  // Video event handlers
  const handleLoadStart = () => {
    setIsLoading(true);
    onLoadStart?.();
  };

  const handleLoad = (data: OnLoadData) => {
    setDuration(data.duration || 0);
    setIsLoading(false);
    onLoad?.(data);
  };

  const handleProgress = (data: OnProgressData) => {
    if (!isDragging) {
      setCurrentTime(data.currentTime || 0);
    }
  };

  const handleError = (error: any) => {
    setIsLoading(false);
    Alert.alert('Video Error', 'Failed to load video. Please try again.');
    onError?.(error);
  };

  // Playback controls
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    showControlsTemporarily();
  };

  const changePlaybackSpeed = (speed: number) => {
    setPlaybackRate(speed);
    setShowSpeedMenu(false);
    showControlsTemporarily();
  };

  // Frame navigation
  const navigateFrames = (direction: 'forward' | 'backward', frameCount: number = 1) => {
    const frameTime = FRAME_DURATION * frameCount;
    const newTime = direction === 'forward' 
      ? Math.min(currentTime + frameTime, duration)
      : Math.max(currentTime - frameTime, 0);
    
    videoRef.current?.seek(newTime);
    setCurrentTime(newTime);
    showControlsTemporarily();
  };

  // Quick navigation
  const seekToTime = (time: number) => {
    const clampedTime = Math.max(0, Math.min(time, duration));
    videoRef.current?.seek(clampedTime);
    setCurrentTime(clampedTime);
  };

  // Format time display with safe number handling
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00.00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * FRAME_RATE);
    
    return `${mins}:${secs.toString().padStart(2, '0')}.${frames.toString().padStart(2, '0')}`;
  };

  // Seek bar pan responder
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      setIsDragging(true);
      showControlsTemporarily();
    },
    onPanResponderMove: (evt) => {
      const seekBarWidth = screenWidth - 80; // Account for padding
      const progress = Math.max(0, Math.min(1, evt.nativeEvent.locationX / seekBarWidth));
      const newTime = progress * duration;
      setCurrentTime(newTime);
    },
    onPanResponderRelease: (evt) => {
      setIsDragging(false);
      const seekBarWidth = screenWidth - 80;
      const progress = Math.max(0, Math.min(1, evt.nativeEvent.locationX / seekBarWidth));
      const newTime = progress * duration;
      seekToTime(newTime);
    },
  });

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <View style={styles.container}>
      {/* Video Component */}
      <TouchableOpacity 
        style={styles.videoContainer} 
        activeOpacity={1}
        onPress={showControlsTemporarily}
      >
        <Video
          ref={videoRef}
          source={{ uri: videoUri }}
          style={styles.video}
          rate={playbackRate}
          paused={!isPlaying}
          onLoadStart={handleLoadStart}
          onLoad={handleLoad}
          onProgress={handleProgress}
          onError={handleError}
          repeat={false}
          resizeMode="contain"
          disableAudioSessionManagement={true}
        />

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066cc" />
            <Text style={styles.loadingText}>Loading Video...</Text>
          </View>
        )}

        {/* Video Controls Overlay */}
        {showControls && (
          <View style={styles.controlsOverlay}>
            {/* Top Controls */}
            <View style={styles.topControls}>
              <Text style={styles.timeDisplay}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </Text>
              <Text style={styles.speedDisplay}>
                {PLAYBACK_SPEEDS.find(s => s.speed === playbackRate)?.label || '1x'}
              </Text>
            </View>

            {/* Center Play/Pause Button */}
            <TouchableOpacity style={styles.centerPlayButton} onPress={togglePlayPause}>
              <Text style={styles.centerPlayIcon}>
                {isPlaying ? '⏸️' : '▶️'}
              </Text>
            </TouchableOpacity>

            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
              {/* Seek Bar */}
              <View style={styles.seekContainer}>
                <View style={styles.seekBar} {...panResponder.panHandlers}>
                  <View style={styles.seekBarBackground} />
                  <View style={[styles.seekBarProgress, { width: `${progressPercentage}%` }]} />
                  <View style={[styles.seekThumb, { left: `${progressPercentage}%` }]} />
                </View>
              </View>

              {/* Control Buttons */}
              <View style={styles.controlButtons}>
                {/* Frame Navigation */}
                <View style={styles.frameControls}>
                  <TouchableOpacity 
                    style={styles.frameButton}
                    onPress={() => navigateFrames('backward', 10)}
                  >
                    <Text style={styles.frameButtonText}>⏪</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.frameButton}
                    onPress={() => navigateFrames('backward', 1)}
                  >
                    <Text style={styles.frameButtonText}>⏮️</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
                    <Text style={styles.playButtonText}>
                      {isPlaying ? '⏸️' : '▶️'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.frameButton}
                    onPress={() => navigateFrames('forward', 1)}
                  >
                    <Text style={styles.frameButtonText}>⏭️</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.frameButton}
                    onPress={() => navigateFrames('forward', 10)}
                  >
                    <Text style={styles.frameButtonText}>⏩</Text>
                  </TouchableOpacity>
                </View>

                {/* Speed Control */}
                <TouchableOpacity 
                  style={styles.speedButton}
                  onPress={() => setShowSpeedMenu(!showSpeedMenu)}
                >
                  <Text style={styles.speedButtonText}>Speed</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Speed Selection Menu */}
        {showSpeedMenu && (
          <View style={styles.speedMenu}>
            <Text style={styles.speedMenuTitle}>Playback Speed</Text>
            {PLAYBACK_SPEEDS.map((speedOption) => (
              <TouchableOpacity
                key={speedOption.speed}
                style={[
                  styles.speedOption,
                  playbackRate === speedOption.speed && styles.selectedSpeedOption
                ]}
                onPress={() => changePlaybackSpeed(speedOption.speed)}
              >
                <Text style={[
                  styles.speedOptionText,
                  playbackRate === speedOption.speed && styles.selectedSpeedOptionText
                ]}>
                  {speedOption.label}
                </Text>
                <Text style={styles.speedOptionDescription}>
                  {speedOption.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  video: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 16,
    fontSize: 16,
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  timeDisplay: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  speedDisplay: {
    color: '#0066cc',
    fontSize: 16,
    fontWeight: '600',
  },
  centerPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -30,
    marginLeft: -30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 102, 204, 0.8)',
    borderRadius: 30,
  },
  centerPlayIcon: {
    fontSize: 24,
    color: '#ffffff',
  },
  bottomControls: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  seekContainer: {
    marginBottom: 20,
  },
  seekBar: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  seekBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  seekBarProgress: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#0066cc',
    borderRadius: 2,
  },
  seekThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    backgroundColor: '#0066cc',
    borderRadius: 8,
    marginTop: -6,
    marginLeft: -8,
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  frameControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  frameButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 22,
    marginHorizontal: 4,
  },
  frameButtonText: {
    fontSize: 18,
    color: '#ffffff',
  },
  playButton: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0066cc',
    borderRadius: 28,
    marginHorizontal: 8,
  },
  playButtonText: {
    fontSize: 24,
    color: '#ffffff',
  },
  speedButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0066cc',
  },
  speedButtonText: {
    color: '#0066cc',
    fontSize: 14,
    fontWeight: '600',
  },
  speedMenu: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    borderRadius: 12,
    padding: 16,
    minWidth: 180,
    borderWidth: 1,
    borderColor: '#333333',
  },
  speedMenuTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  speedOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  selectedSpeedOption: {
    backgroundColor: '#0066cc',
  },
  speedOptionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedSpeedOptionText: {
    color: '#ffffff',
  },
  speedOptionDescription: {
    color: '#888888',
    fontSize: 12,
  },
}); 