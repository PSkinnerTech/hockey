# Phase 3 Integration Guide - Frame Processing with Existing Infrastructure

## Overview

This guide shows how to integrate the Frame Processor Setup with your existing Phase 2 infrastructure (VideoStorageService, HockeyVideoPlayer, VideoLibraryScreen) for a seamless experience.

## 🔧 **Enhanced Video Storage Integration**

### Extended VideoStorageService for ML Results

```typescript
// src/services/VideoStorageService.ts - Enhanced for ML
export interface ShotDetectionResult {
  shotDetected: boolean;
  confidence: number;
  timestamp: number;
  videoOffset: number; // Time in video (seconds)
  frameNumber: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  shotType?: 'wrist' | 'slap' | 'snap' | 'backhand';
}

export interface ShotMarker {
  id: string;
  timestamp: number;
  confidence: number;
  shotType: string;
  processed: boolean;
}

export interface VideoMetadata {
  // ... existing fields from Phase 2
  id: string;
  filename: string;
  duration: number;
  createdAt: string;
  fileSize: number;
  hasAudio: boolean;
  
  // New ML fields for Phase 3
  shotDetections?: ShotDetectionResult[];
  mlProcessingStatus?: 'pending' | 'processing' | 'complete' | 'error';
  frameAnalysisData?: {
    processedFrames: number;
    totalFrames: number;
    detectedShots: ShotMarker[];
    processingStartTime?: number;
    processingEndTime?: number;
  };
  mlVersion?: string; // Track which ML model version was used
}

// Enhanced VideoStorageService class
export class VideoStorageService {
  // ... existing methods from Phase 2
  
  // New ML-specific methods for Phase 3
  async saveShotDetection(videoPath: string, detection: ShotDetectionResult): Promise<void> {
    try {
      const metadata = await this.getVideoMetadata(videoPath);
      const shotDetections = metadata.shotDetections || [];
      
      // Add new detection
      shotDetections.push({
        ...detection,
        id: `shot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      });
      
      // Update metadata
      const updatedMetadata: VideoMetadata = {
        ...metadata,
        shotDetections,
        mlProcessingStatus: 'processing',
      };
      
      await this.saveMetadata(videoPath, updatedMetadata);
    } catch (error) {
      console.error('Error saving shot detection:', error);
    }
  }
  
  async updateMLProcessingStatus(
    videoPath: string, 
    status: VideoMetadata['mlProcessingStatus'],
    analysisData?: Partial<VideoMetadata['frameAnalysisData']>
  ): Promise<void> {
    try {
      const metadata = await this.getVideoMetadata(videoPath);
      
      const updatedMetadata: VideoMetadata = {
        ...metadata,
        mlProcessingStatus: status,
        frameAnalysisData: {
          ...metadata.frameAnalysisData,
          ...analysisData,
          ...(status === 'complete' && { processingEndTime: Date.now() }),
          ...(status === 'processing' && !metadata.frameAnalysisData?.processingStartTime && { 
            processingStartTime: Date.now() 
          }),
        },
      };
      
      await this.saveMetadata(videoPath, updatedMetadata);
    } catch (error) {
      console.error('Error updating ML processing status:', error);
    }
  }
  
  async getVideosWithShotDetections(): Promise<SavedVideo[]> {
    const allVideos = await this.getAllVideos();
    return allVideos.filter(video => 
      video.metadata?.shotDetections && 
      video.metadata.shotDetections.length > 0
    );
  }
  
  async getMLProcessingStats(): Promise<{
    totalVideos: number;
    processedVideos: number;
    pendingVideos: number;
    totalShotsDetected: number;
  }> {
    const allVideos = await this.getAllVideos();
    
    return {
      totalVideos: allVideos.length,
      processedVideos: allVideos.filter(v => v.metadata?.mlProcessingStatus === 'complete').length,
      pendingVideos: allVideos.filter(v => v.metadata?.mlProcessingStatus === 'pending').length,
      totalShotsDetected: allVideos.reduce((total, video) => 
        total + (video.metadata?.shotDetections?.length || 0), 0
      ),
    };
  }
}
```

## 🎮 **Enhanced HockeyVideoPlayer with ML Overlay**

### Adding Shot Detection Markers to Video Player

```typescript
// src/components/HockeyVideoPlayer.tsx - Enhanced for ML
import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Video from 'react-native-video';
import { SavedVideo, ShotDetectionResult } from '../services/VideoStorageService';

interface HockeyVideoPlayerProps {
  video: SavedVideo;
  // ... existing props
}

export const HockeyVideoPlayer: React.FC<HockeyVideoPlayerProps> = ({ 
  video, 
  ...existingProps 
}) => {
  const [showMLOverlay, setShowMLOverlay] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const shotDetections = video.metadata?.shotDetections || [];
  const videoRef = useRef<Video>(null);
  
  // Find shots near current playback time
  const nearbyShots = shotDetections.filter(shot => 
    Math.abs(shot.videoOffset - currentTime) < 2 // Within 2 seconds
  );
  
  const renderShotMarkers = () => {
    if (!showMLOverlay || shotDetections.length === 0) return null;
    
    return (
      <View style={styles.timelineContainer}>
        <View style={styles.timeline}>
          {shotDetections.map((detection, index) => {
            const leftPosition = (detection.videoOffset / video.duration) * 100;
            const isActive = Math.abs(detection.videoOffset - currentTime) < 0.5;
            
            return (
              <TouchableOpacity
                key={`shot_${index}`}
                style={[
                  styles.shotMarker,
                  {
                    left: `${leftPosition}%`,
                    backgroundColor: isActive ? '#00ff00' : '#0066cc',
                    height: isActive ? 8 : 6,
                  }
                ]}
                onPress={() => {
                  videoRef.current?.seek(detection.videoOffset);
                }}
              >
                {isActive && (
                  <View style={styles.shotTooltip}>
                    <Text style={styles.shotTooltipText}>
                      {detection.shotType || 'Shot'} - {(detection.confidence * 100).toFixed(0)}%
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };
  
  const renderShotOverlay = () => {
    if (!showMLOverlay || nearbyShots.length === 0) return null;
    
    const currentShot = nearbyShots[0];
    
    return (
      <View style={styles.shotOverlay}>
        <View style={styles.shotIndicator}>
          <Text style={styles.shotType}>
            {currentShot.shotType?.toUpperCase() || 'SHOT DETECTED'}
          </Text>
          <Text style={styles.shotConfidence}>
            {(currentShot.confidence * 100).toFixed(1)}% confidence
          </Text>
          
          {currentShot.boundingBox && (
            <View 
              style={[
                styles.boundingBox,
                {
                  left: `${currentShot.boundingBox.x * 100}%`,
                  top: `${currentShot.boundingBox.y * 100}%`,
                  width: `${currentShot.boundingBox.width * 100}%`,
                  height: `${currentShot.boundingBox.height * 100}%`,
                }
              ]}
            />
          )}
        </View>
      </View>
    );
  };
  
  const renderMLControls = () => (
    <View style={styles.mlControls}>
      <TouchableOpacity
        style={[styles.mlButton, { opacity: showMLOverlay ? 1 : 0.5 }]}
        onPress={() => setShowMLOverlay(!showMLOverlay)}
      >
        <Text style={styles.mlButtonText}>
          ML ({shotDetections.length})
        </Text>
      </TouchableOpacity>
      
      {shotDetections.length > 0 && (
        <TouchableOpacity
          style={styles.mlButton}
          onPress={() => {
            // Jump to next shot
            const nextShot = shotDetections.find(shot => shot.videoOffset > currentTime);
            if (nextShot) {
              videoRef.current?.seek(nextShot.videoOffset - 1); // Start 1s before shot
            } else {
              videoRef.current?.seek(shotDetections[0].videoOffset - 1); // Loop to first
            }
          }}
        >
          <Text style={styles.mlButtonText}>Next Shot</Text>
        </TouchableOpacity>
      )}
    </View>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={{ uri: video.path }}
          style={styles.video}
          onProgress={(data) => {
            setCurrentTime(data.currentTime);
            // ... existing onProgress logic
          }}
          {...existingProps}
        />
        
        {/* ML Overlays */}
        {renderShotOverlay()}
      </View>
      
      {/* Enhanced Controls */}
      <View style={styles.controlsContainer}>
        {/* ... existing controls */}
        {renderMLControls()}
      </View>
      
      {/* Shot Timeline */}
      {renderShotMarkers()}
    </View>
  );
};

const styles = StyleSheet.create({
  // ... existing styles
  
  // New ML-specific styles
  timelineContainer: {
    height: 30,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  timeline: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 5,
    position: 'relative',
  },
  shotMarker: {
    position: 'absolute',
    width: 4,
    borderRadius: 2,
    top: 0,
    zIndex: 10,
  },
  shotTooltip: {
    position: 'absolute',
    bottom: 20,
    left: -30,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 5,
    borderRadius: 5,
    minWidth: 60,
  },
  shotTooltipText: {
    color: 'white',
    fontSize: 10,
    textAlign: 'center',
  },
  shotOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
  },
  shotIndicator: {
    backgroundColor: 'rgba(0, 102, 204, 0.9)',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  shotType: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  shotConfidence: {
    color: 'white',
    fontSize: 12,
    marginTop: 2,
  },
  boundingBox: {
    position: 'absolute',
    borderColor: '#00ff00',
    borderWidth: 2,
    borderRadius: 5,
  },
  mlControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    gap: 10,
  },
  mlButton: {
    backgroundColor: 'rgba(0, 102, 204, 0.8)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  mlButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
```

## 📚 **Enhanced VideoLibraryScreen with ML Status**

### Adding ML Processing Status to Video Cards

```typescript
// src/screens/VideoLibraryScreen.tsx - Enhanced for ML
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { VideoStorageService, SavedVideo } from '../services/VideoStorageService';

const VideoCard: React.FC<{ 
  video: SavedVideo; 
  onPress: () => void;
  onStartMLProcessing?: (video: SavedVideo) => void;
}> = ({ 
  video, 
  onPress,
  onStartMLProcessing 
}) => {
  const mlStatus = video.metadata?.mlProcessingStatus;
  const shotCount = video.metadata?.shotDetections?.length || 0;
  const frameAnalysis = video.metadata?.frameAnalysisData;
  
  const renderMLStatus = () => {
    switch (mlStatus) {
      case 'processing':
        return (
          <View style={styles.mlStatusContainer}>
            <ActivityIndicator size="small" color="#0066cc" />
            <Text style={styles.mlStatusText}>
              Processing... {frameAnalysis?.processedFrames || 0}/{frameAnalysis?.totalFrames || '?'}
            </Text>
          </View>
        );
        
      case 'complete':
        return (
          <View style={styles.mlStatusContainer}>
            <Text style={styles.shotBadge}>
              ✅ {shotCount} shot{shotCount !== 1 ? 's' : ''} detected
            </Text>
          </View>
        );
        
      case 'error':
        return (
          <View style={styles.mlStatusContainer}>
            <Text style={styles.errorBadge}>❌ Processing failed</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => onStartMLProcessing?.(video)}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        );
        
      default: // 'pending' or undefined
        return (
          <TouchableOpacity 
            style={styles.processButton}
            onPress={() => onStartMLProcessing?.(video)}
          >
            <Text style={styles.processButtonText}>🔍 Analyze Shots</Text>
          </TouchableOpacity>
        );
    }
  };
  
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {/* ... existing video card content */}
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle}>{video.filename}</Text>
        <Text style={styles.videoDuration}>{formatDuration(video.duration)}</Text>
      </View>
      
      {/* ML Status Section */}
      {renderMLStatus()}
    </TouchableOpacity>
  );
};

// Enhanced VideoLibraryScreen with ML stats
export const VideoLibraryScreen: React.FC = () => {
  const [videos, setVideos] = useState<SavedVideo[]>([]);
  const [mlStats, setMLStats] = useState<any>(null);
  const [showMLStatsOnly, setShowMLStatsOnly] = useState(false);
  
  useEffect(() => {
    loadVideosAndStats();
  }, []);
  
  const loadVideosAndStats = async () => {
    const allVideos = await VideoStorageService.getAllVideos();
    const stats = await VideoStorageService.getMLProcessingStats();
    
    setVideos(showMLStatsOnly ? 
      await VideoStorageService.getVideosWithShotDetections() : 
      allVideos
    );
    setMLStats(stats);
  };
  
  const startMLProcessing = async (video: SavedVideo) => {
    await VideoStorageService.updateMLProcessingStatus(video.path, 'processing');
    
    // Here you would trigger your frame processing
    // This connects to your Frame Processor Setup
    processVideoForShots(video);
    
    loadVideosAndStats(); // Refresh
  };
  
  const renderMLStats = () => (
    <View style={styles.statsContainer}>
      <Text style={styles.statsTitle}>🏒 Shot Analysis Stats</Text>
      <View style={styles.statsRow}>
        <Text style={styles.statItem}>📹 {mlStats?.totalVideos || 0} Total Videos</Text>
        <Text style={styles.statItem}>✅ {mlStats?.processedVideos || 0} Analyzed</Text>
      </View>
      <View style={styles.statsRow}>
        <Text style={styles.statItem}>⏳ {mlStats?.pendingVideos || 0} Pending</Text>
        <Text style={styles.statItem}>🎯 {mlStats?.totalShotsDetected || 0} Shots Found</Text>
      </View>
      
      <TouchableOpacity
        style={[styles.filterButton, { backgroundColor: showMLStatsOnly ? '#0066cc' : '#666' }]}
        onPress={() => {
          setShowMLStatsOnly(!showMLStatsOnly);
          loadVideosAndStats();
        }}
      >
        <Text style={styles.filterButtonText}>
          {showMLStatsOnly ? 'Show All Videos' : 'Show Analyzed Only'}
        </Text>
      </TouchableOpacity>
    </View>
  );
  
  return (
    <View style={styles.container}>
      {/* ML Stats Header */}
      {mlStats && renderMLStats()}
      
      {/* Video Grid */}
      <FlatList
        data={videos}
        renderItem={({ item }) => (
          <VideoCard
            video={item}
            onPress={() => {/* Navigate to player */}}
            onStartMLProcessing={startMLProcessing}
          />
        )}
        // ... existing FlatList props
      />
    </View>
  );
};
```

## 🧪 **Leveraging Phase 2 Features for ML Testing**

### Using Existing Frame Navigation for ML Development

```typescript
// src/utils/mlTestingUtils.ts
import { VideoStorageService, SavedVideo } from '../services/VideoStorageService';
import { processFrameForShot } from '../lib/camera/FrameProcessor';

export const testFrameProcessingOnExistingVideo = async (
  video: SavedVideo,
  onProgress?: (progress: number) => void
): Promise<void> => {
  try {
    await VideoStorageService.updateMLProcessingStatus(video.path, 'processing', {
      processedFrames: 0,
      totalFrames: Math.floor(video.duration * 60), // Assuming 60fps
    });
    
    // Use your existing frame-by-frame navigation capability
    const totalFrames = Math.floor(video.duration * 60);
    const skipFrames = 3; // Process every 3rd frame (20fps analysis)
    
    for (let frame = 0; frame < totalFrames; frame += skipFrames) {
      const timeOffset = frame / 60; // Convert frame to seconds
      
      // This would integrate with your HockeyVideoPlayer's seek capability
      const frameData = await extractFrameAtTime(video.path, timeOffset);
      const detection = await processFrameForShot(frameData);
      
      if (detection.shotDetected) {
        // Save detection using your existing storage system
        await VideoStorageService.saveShotDetection(video.path, {
          ...detection,
          videoOffset: timeOffset,
          frameNumber: frame,
        });
      }
      
      // Update progress using your existing metadata system
      const progress = frame / totalFrames;
      await VideoStorageService.updateMLProcessingStatus(video.path, 'processing', {
        processedFrames: frame,
        totalFrames,
      });
      
      onProgress?.(progress);
    }
    
    // Mark as complete
    await VideoStorageService.updateMLProcessingStatus(video.path, 'complete');
    
  } catch (error) {
    console.error('ML processing error:', error);
    await VideoStorageService.updateMLProcessingStatus(video.path, 'error');
  }
};

// Helper function to extract frame data from video file
const extractFrameAtTime = async (videoPath: string, timeOffset: number): Promise<any> => {
  // This would use your existing video processing capabilities
  // Could integrate with react-native-ffmpeg or native video processing
  
  // Placeholder implementation
  return {
    width: 1920,
    height: 1080,
    timestamp: timeOffset,
    data: new Uint8Array(1920 * 1080 * 3), // RGB data
  };
};

// Integration function to process existing video library
export const processVideoForShots = async (video: SavedVideo): Promise<void> => {
  // This bridges your Frame Processor Setup with existing videos
  await testFrameProcessingOnExistingVideo(video);
};
```

## 📋 **Phase 3 Implementation Schedule**

### Week 1: Frame Processing Foundation
- **Day 1-2**: Implement basic frame processor (mock detection)
  - Set up worklets and frame extraction
  - Test performance monitoring
  - Integrate with existing CameraScreen

- **Day 3-4**: Connect to VideoStorageService
  - Add ML metadata fields
  - Implement shot detection storage
  - Test with existing video library

- **Day 5**: Test with existing 60fps frame navigation
  - Verify frame processing doesn't impact playback
  - Test ML overlay in HockeyVideoPlayer

### Week 2: ML Integration & Polish
- **Day 1-2**: Integrate TensorFlow Lite with mock model
  - Replace mock detection with actual ML
  - Test performance benchmarks

- **Day 3-4**: Enhanced UI integration
  - Add ML controls to HockeyVideoPlayer
  - Update VideoLibraryScreen with processing status
  - Implement batch processing

- **Day 5**: Polish and testing
  - Test complete workflow: Record → Process → Analyze → Share
  - Performance optimization
  - Error handling and edge cases

## 🎯 **Action Plan Summary**

1. **Start with Frame Processor Setup** - The technical foundation is solid
2. **Add these integration points** - Connect to your Phase 2 infrastructure  
3. **Test incrementally** - Use your existing video library for ML testing
4. **Monitor performance** - Your ErrorBoundary will catch ML processing issues
5. **Leverage existing features** - Use frame navigation, storage, and sharing systems

This integration approach ensures that Phase 3 builds seamlessly on your completed Phase 2 foundation, creating a cohesive video analysis experience! 🏒 