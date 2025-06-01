import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ML-related interfaces for Phase 3
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
  id: string;
  filename: string;
  path: string;
  recordedAt: Date;
  duration: number;
  hasAudio: boolean;
  fileSize: number;
  quality: string;
  thumbnail?: string;
  
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

export interface VideoSession {
  id: string;
  name: string;
  date: Date;
  videos: string[]; // Array of video IDs
  notes?: string;
}

const STORAGE_KEYS = {
  VIDEOS_INDEX: '@hockey_coach_videos_index',
  SESSIONS_INDEX: '@hockey_coach_sessions_index',
};

class VideoStorageService {
  
  /**
   * Initialize storage directories (simplified version)
   */
  async initialize(): Promise<void> {
    try {
      console.log('VideoStorageService initialized');
    } catch (error) {
      console.error('Failed to initialize storage directories:', error);
      throw error;
    }
  }

  /**
   * Generate unique filename for video
   */
  private generateVideoFilename(): string {
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[-:]/g, '')
      .replace(/\..+/, '')
      .replace('T', '_');
    
    return `hockey_shot_${timestamp}.mp4`;
  }

  /**
   * Save a newly recorded video to the storage system (simplified version)
   */
  async saveVideo(
    sourcePath: string,
    duration: number,
    hasAudio: boolean = false
  ): Promise<VideoMetadata> {
    try {
      await this.initialize();
      
      const videoId = this.generateUUID();
      const timestamp = new Date();
      const filename = this.generateVideoFilename();
      
      // For now, we'll keep the original path and estimate file size
      const estimatedFileSize = duration * 1000000; // Rough estimate: 1MB per second
      
      // Create video metadata with ML fields
      const metadata: VideoMetadata = {
        id: videoId,
        filename,
        path: sourcePath, // Keep original path for now
        recordedAt: timestamp,
        duration,
        hasAudio,
        fileSize: estimatedFileSize,
        quality: '1080p',
        
        // Initialize ML fields
        shotDetections: [],
        mlProcessingStatus: 'pending',
        frameAnalysisData: {
          processedFrames: 0,
          totalFrames: Math.floor(duration * 60), // Assuming 60fps
          detectedShots: [],
        },
        mlVersion: '1.0.0-mock', // Will be updated when real ML is implemented
      };
      
      // Save to index
      await this.addVideoToIndex(metadata);
      
      console.log(`Video saved: ${filename} (estimated ${this.formatFileSize(estimatedFileSize)})`);
      
      return metadata;
    } catch (error) {
      console.error('Failed to save video:', error);
      throw error;
    }
  }

  /**
   * Save shot detection result to video metadata
   */
  async saveShotDetection(videoPath: string, detection: ShotDetectionResult): Promise<void> {
    try {
      const metadata = await this.getVideoByPath(videoPath);
      if (!metadata) {
        console.warn('Video not found for shot detection:', videoPath);
        return;
      }
      
      const shotDetections = metadata.shotDetections || [];
      
      // Add new detection with unique ID
      const detectionWithId = {
        ...detection,
        id: `shot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      
      shotDetections.push(detection);
      
      // Update metadata
      const updatedMetadata: VideoMetadata = {
        ...metadata,
        shotDetections,
        mlProcessingStatus: 'processing',
      };
      
      await this.saveMetadata(videoPath, updatedMetadata);
      console.log('Shot detection saved:', detection.shotType, detection.confidence);
    } catch (error) {
      console.error('Error saving shot detection:', error);
    }
  }
  
  /**
   * Update ML processing status for a video
   */
  async updateMLProcessingStatus(
    videoPath: string, 
    status: VideoMetadata['mlProcessingStatus'],
    analysisData?: Partial<VideoMetadata['frameAnalysisData']>
  ): Promise<void> {
    try {
      const metadata = await this.getVideoByPath(videoPath);
      if (!metadata) {
        console.warn('Video not found for ML status update:', videoPath);
        return;
      }
      
      const currentFrameAnalysisData = metadata.frameAnalysisData || {
        processedFrames: 0,
        totalFrames: Math.floor(metadata.duration * 60),
        detectedShots: [],
      };
      
      const updatedMetadata: VideoMetadata = {
        ...metadata,
        mlProcessingStatus: status,
        frameAnalysisData: {
          processedFrames: analysisData?.processedFrames ?? currentFrameAnalysisData.processedFrames,
          totalFrames: analysisData?.totalFrames ?? currentFrameAnalysisData.totalFrames,
          detectedShots: analysisData?.detectedShots ?? currentFrameAnalysisData.detectedShots,
          processingStartTime: 
            status === 'processing' && !currentFrameAnalysisData.processingStartTime 
              ? Date.now() 
              : currentFrameAnalysisData.processingStartTime,
          processingEndTime: 
            status === 'complete' 
              ? Date.now() 
              : currentFrameAnalysisData.processingEndTime,
        },
      };
      
      await this.saveMetadata(videoPath, updatedMetadata);
      console.log('ML processing status updated:', status);
    } catch (error) {
      console.error('Error updating ML processing status:', error);
    }
  }
  
  /**
   * Get videos that have shot detections
   */
  async getVideosWithShotDetections(): Promise<VideoMetadata[]> {
    const allVideos = await this.getAllVideos();
    return allVideos.filter(video => 
      video.shotDetections && 
      video.shotDetections.length > 0
    );
  }
  
  /**
   * Get ML processing statistics
   */
  async getMLProcessingStats(): Promise<{
    totalVideos: number;
    processedVideos: number;
    pendingVideos: number;
    totalShotsDetected: number;
  }> {
    const allVideos = await this.getAllVideos();
    
    return {
      totalVideos: allVideos.length,
      processedVideos: allVideos.filter(v => v.mlProcessingStatus === 'complete').length,
      pendingVideos: allVideos.filter(v => v.mlProcessingStatus === 'pending').length,
      totalShotsDetected: allVideos.reduce((total, video) => 
        total + (video.shotDetections?.length || 0), 0
      ),
    };
  }
  
  /**
   * Save metadata to storage
   */
  private async saveMetadata(videoPath: string, metadata: VideoMetadata): Promise<void> {
    try {
      const videos = await this.getAllVideos();
      const videoIndex = videos.findIndex(v => v.path === videoPath);
      
      if (videoIndex >= 0) {
        videos[videoIndex] = metadata;
        await AsyncStorage.setItem(STORAGE_KEYS.VIDEOS_INDEX, JSON.stringify(videos));
      } else {
        console.warn('Video not found in index for metadata update:', videoPath);
      }
    } catch (error) {
      console.error('Failed to save metadata:', error);
      throw error;
    }
  }

  /**
   * Get all saved videos
   */
  async getAllVideos(): Promise<VideoMetadata[]> {
    try {
      const indexData = await AsyncStorage.getItem(STORAGE_KEYS.VIDEOS_INDEX);
      if (!indexData) return [];
      
      const videos: VideoMetadata[] = JSON.parse(indexData).map((video: any) => ({
        ...video,
        recordedAt: new Date(video.recordedAt),
      }));
      
      // Sort by most recent first
      return videos.sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
      
    } catch (error) {
      console.error('Failed to get videos:', error);
      return [];
    }
  }

  /**
   * Get video by ID
   */
  async getVideo(id: string): Promise<VideoMetadata | null> {
    try {
      const videos = await this.getAllVideos();
      return videos.find(video => video.id === id) || null;
    } catch (error) {
      console.error('Failed to get video:', error);
      return null;
    }
  }

  /**
   * Delete video and its metadata (simplified version)
   */
  async deleteVideo(id: string): Promise<boolean> {
    try {
      const video = await this.getVideo(id);
      if (!video) return false;
      
      // For now, we'll just remove from index
      // TODO: Add actual file deletion when file operations are working
      await this.removeVideoFromIndex(id);
      
      console.log('Video deleted from index:', id);
      return true;
      
    } catch (error) {
      console.error('Failed to delete video:', error);
      return false;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalVideos: number;
    totalSize: number;
    totalDuration: number;
  }> {
    try {
      const videos = await this.getAllVideos();
      
      const stats = videos.reduce(
        (acc, video) => ({
          totalVideos: acc.totalVideos + 1,
          totalSize: acc.totalSize + video.fileSize,
          totalDuration: acc.totalDuration + video.duration,
        }),
        { totalVideos: 0, totalSize: 0, totalDuration: 0 }
      );
      
      return stats;
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return { totalVideos: 0, totalSize: 0, totalDuration: 0 };
    }
  }

  /**
   * Add video to index
   */
  private async addVideoToIndex(metadata: VideoMetadata): Promise<void> {
    try {
      const videos = await this.getAllVideos();
      videos.push(metadata);
      await AsyncStorage.setItem(STORAGE_KEYS.VIDEOS_INDEX, JSON.stringify(videos));
    } catch (error) {
      console.error('Failed to add video to index:', error);
      throw error;
    }
  }

  /**
   * Remove video from index
   */
  private async removeVideoFromIndex(id: string): Promise<void> {
    try {
      const videos = await this.getAllVideos();
      const filteredVideos = videos.filter(video => video.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.VIDEOS_INDEX, JSON.stringify(filteredVideos));
    } catch (error) {
      console.error('Failed to remove video from index:', error);
      throw error;
    }
  }

  /**
   * Generate UUID
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format duration for display
   */
  formatDuration(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Get video metadata by file path
   */
  async getVideoByPath(path: string): Promise<VideoMetadata | null> {
    try {
      const videos = await this.getAllVideos();
      return videos.find(video => video.path === path) || null;
    } catch (error) {
      console.error('Failed to get video by path:', error);
      return null;
    }
  }
}

// Export singleton instance
export const videoStorageService = new VideoStorageService(); 