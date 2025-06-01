import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  Alert,
  RefreshControl,
  Dimensions,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { VideoMetadata, videoStorageService } from '../services/VideoStorageService';
import { shareMultipleVideos, shareVideo } from '../utils/shareUtils';

type VideoLibraryNavigationProp = StackNavigationProp<RootStackParamList, 'VideoLibrary'>;

const { width: screenWidth } = Dimensions.get('window');
const GRID_COLUMNS = 2;
const CARD_MARGIN = 12;
const CARD_WIDTH = (screenWidth - (CARD_MARGIN * 3)) / GRID_COLUMNS;

export default function VideoLibraryScreen() {
  const navigation = useNavigation<VideoLibraryNavigationProp>();
  
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [storageStats, setStorageStats] = useState({
    totalVideos: 0,
    totalSize: 0,
    totalDuration: 0,
  });

  // Load videos when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadVideos();
    }, [])
  );

  const loadVideos = async () => {
    try {
      setIsLoading(true);
      const [videoList, stats] = await Promise.all([
        videoStorageService.getAllVideos(),
        videoStorageService.getStorageStats(),
      ]);
      
      setVideos(videoList);
      setStorageStats(stats);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load videos:', error);
      setIsLoading(false);
      Alert.alert('Error', 'Failed to load videos. Please try again.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVideos();
    setRefreshing(false);
  };

  const handleVideoPress = (video: VideoMetadata) => {
    if (isSelectionMode) {
      toggleVideoSelection(video.id);
    } else {
      // Navigate to playback with video ID
      navigation.navigate('Playback', { videoUri: video.path });
    }
  };

  const handleVideoLongPress = (video: VideoMetadata) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedVideos(new Set([video.id]));
    }
  };

  const toggleVideoSelection = (videoId: string) => {
    const newSelection = new Set(selectedVideos);
    if (newSelection.has(videoId)) {
      newSelection.delete(videoId);
    } else {
      newSelection.add(videoId);
    }
    setSelectedVideos(newSelection);
    
    if (newSelection.size === 0) {
      setIsSelectionMode(false);
    }
  };

  const handleDeleteSelected = () => {
    const selectedCount = selectedVideos.size;
    Alert.alert(
      'Delete Videos',
      `Are you sure you want to delete ${selectedCount} video${selectedCount > 1 ? 's' : ''}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const deletePromises = Array.from(selectedVideos).map(videoId =>
                videoStorageService.deleteVideo(videoId)
              );
              await Promise.all(deletePromises);
              
              setSelectedVideos(new Set());
              setIsSelectionMode(false);
              await loadVideos();
              
              Alert.alert('Success', `${selectedCount} video${selectedCount > 1 ? 's' : ''} deleted successfully.`);
            } catch (error) {
              console.error('Failed to delete videos:', error);
              Alert.alert('Error', 'Failed to delete some videos. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleShareSelected = async () => {
    try {
      const selectedVideoList = videos.filter(video => selectedVideos.has(video.id));
      
      if (selectedVideoList.length === 0) {
        Alert.alert('No Videos Selected', 'Please select at least one video to share.');
        return;
      }

      const success = await shareMultipleVideos(selectedVideoList);
      
      if (success) {
        // Clear selection after successful share
        setSelectedVideos(new Set());
        setIsSelectionMode(false);
      }
    } catch (error) {
      console.error('Failed to share videos:', error);
      Alert.alert('Error', 'Failed to share videos. Please try again.');
    }
  };

  const cancelSelection = () => {
    setSelectedVideos(new Set());
    setIsSelectionMode(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderVideoCard = ({ item }: { item: VideoMetadata }) => {
    const isSelected = selectedVideos.has(item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.videoCard,
          isSelected && styles.videoCardSelected,
        ]}
        onPress={() => handleVideoPress(item)}
        onLongPress={() => handleVideoLongPress(item)}
        activeOpacity={0.7}
      >
        {/* Video Thumbnail Placeholder */}
        <View style={styles.thumbnailContainer}>
          <View style={styles.thumbnailPlaceholder}>
            <Text style={styles.thumbnailIcon}>🏒</Text>
            <Text style={styles.thumbnailText}>Hockey Shot</Text>
          </View>
          
          {/* Duration Badge */}
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>
              {videoStorageService.formatDuration(item.duration)}
            </Text>
          </View>
          
          {/* Audio Indicator */}
          {item.hasAudio && (
            <View style={styles.audioBadge}>
              <Text style={styles.audioIcon}>🎤</Text>
            </View>
          )}
          
          {/* Selection Indicator */}
          {isSelectionMode && (
            <View style={[styles.selectionIndicator, isSelected && styles.selectionIndicatorSelected]}>
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </View>
          )}
        </View>
        
        {/* Video Info */}
        <View style={styles.videoInfo}>
          <Text style={styles.videoDate} numberOfLines={1}>
            {formatDate(item.recordedAt)}
          </Text>
          <Text style={styles.videoSize} numberOfLines={1}>
            {videoStorageService.formatFileSize(item.fileSize)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🏒</Text>
      <Text style={styles.emptyTitle}>No Hockey Shots Yet</Text>
      <Text style={styles.emptyText}>
        Record your first hockey shot to build your video library and track your progress over time.
      </Text>
      <TouchableOpacity 
        style={styles.emptyButton}
        onPress={() => navigation.navigate('Camera')}
      >
        <Text style={styles.emptyButtonText}>📹 Record First Shot</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{storageStats.totalVideos}</Text>
        <Text style={styles.statLabel}>Total Shots</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>
          {videoStorageService.formatDuration(storageStats.totalDuration)}
        </Text>
        <Text style={styles.statLabel}>Total Duration</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>
          {videoStorageService.formatFileSize(storageStats.totalSize)}
        </Text>
        <Text style={styles.statLabel}>Storage Used</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        
        <Text style={styles.title}>
          {isSelectionMode ? `${selectedVideos.size} Selected` : 'Shot Library'}
        </Text>
        
        {isSelectionMode ? (
          <TouchableOpacity onPress={cancelSelection}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => navigation.navigate('Camera')}>
            <Text style={styles.recordButton}>+ Record</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Selection Actions */}
      {isSelectionMode && (
        <View style={styles.selectionActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleShareSelected}
          >
            <Text style={styles.actionButtonText}>📤 Share</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDeleteSelected}
          >
            <Text style={styles.actionButtonText}>🗑️ Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your hockey shots...</Text>
        </View>
      ) : videos.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={videos}
          renderItem={renderVideoCard}
          keyExtractor={(item) => item.id}
          numColumns={GRID_COLUMNS}
          contentContainerStyle={styles.gridContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0066cc"
            />
          }
          ListHeaderComponent={renderHeader}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  backButton: {
    color: '#0066cc',
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  recordButton: {
    color: '#0066cc',
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: '500',
  },
  selectionActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#2a2a2a',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888888',
    fontSize: 12,
    marginTop: 4,
  },
  gridContainer: {
    paddingHorizontal: CARD_MARGIN,
  },
  videoCard: {
    width: CARD_WIDTH,
    marginHorizontal: CARD_MARGIN / 2,
    marginBottom: CARD_MARGIN,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  videoCardSelected: {
    borderWidth: 2,
    borderColor: '#0066cc',
  },
  thumbnailContainer: {
    position: 'relative',
    aspectRatio: 16 / 9,
  },
  thumbnailPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333333',
  },
  thumbnailIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  thumbnailText: {
    color: '#888888',
    fontSize: 12,
    fontWeight: '500',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  audioBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 102, 204, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  audioIcon: {
    fontSize: 10,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionIndicatorSelected: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  videoInfo: {
    padding: 12,
  },
  videoDate: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  videoSize: {
    color: '#888888',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888888',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    color: '#888888',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 