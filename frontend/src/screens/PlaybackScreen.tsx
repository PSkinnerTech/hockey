import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import HockeyVideoPlayer from '../components/HockeyVideoPlayer';
import { VideoMetadata, videoStorageService } from '../services/VideoStorageService';
import { showShareActionSheet } from '../utils/shareUtils';

type PlaybackScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Playback'>;
type PlaybackScreenRouteProp = RouteProp<RootStackParamList, 'Playback'>;

export default function PlaybackScreen() {
  const navigation = useNavigation<PlaybackScreenNavigationProp>();
  const route = useRoute<PlaybackScreenRouteProp>();
  
  const { videoUri } = route.params || {};
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

  // Load video metadata when component mounts
  useEffect(() => {
    if (videoUri) {
      loadVideoMetadata();
    }
  }, [videoUri]);

  const loadVideoMetadata = async () => {
    if (!videoUri) return;
    
    try {
      setIsLoadingMetadata(true);
      const metadata = await videoStorageService.getVideoByPath(videoUri);
      setVideoMetadata(metadata);
    } catch (error) {
      console.error('Failed to load video metadata:', error);
      // Continue without metadata - sharing will still work with basic info
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleRecordNew = () => {
    navigation.navigate('Camera');
  };

  const handleVideoError = (error: any) => {
    console.error('Video playback error:', error);
    Alert.alert(
      'Video Error', 
      'Unable to play this video. The file might be corrupted or in an unsupported format.',
      [
        { text: 'Try Again', onPress: () => {} },
        { text: 'Record New', onPress: handleRecordNew },
      ]
    );
  };

  const handleVideoLoad = (data: any) => {
    console.log('Video loaded successfully:', data);
  };

  const handleShare = () => {
    if (videoMetadata) {
      showShareActionSheet(videoMetadata, (success) => {
        if (success) {
          console.log('Video shared successfully');
        }
      });
    } else {
      Alert.alert(
        'Share Video',
        'Video metadata is still loading. Please try again in a moment.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Shot Analysis</Text>
        <TouchableOpacity onPress={() => navigation.navigate('VideoLibrary')}>
          <Text style={styles.headerAction}>Shot Library</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {videoUri ? (
          <View style={styles.videoContainer}>
            <View style={styles.playerContainer}>
              <HockeyVideoPlayer
                videoUri={videoUri}
                onError={handleVideoError}
                onLoad={handleVideoLoad}
              />
            </View>
            
            <View style={styles.infoPanel}>
              <Text style={styles.infoPanelTitle}>🏒 Shot Recording</Text>
              <Text style={styles.infoText}>
                Use the video controls below to analyze your hockey shot:
              </Text>
              <View style={styles.featureList}>
                <Text style={styles.featureItem}>• Use 0.25x speed for detailed technique analysis</Text>
                <Text style={styles.featureItem}>• Frame-by-frame navigation with ⏮️ ⏭️ buttons</Text>
                <Text style={styles.featureItem}>• Drag the seek bar for precise positioning</Text>
                <Text style={styles.featureItem}>• Tap the video to show/hide controls</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📁</Text>
            <Text style={styles.emptyTitle}>No Recordings Yet</Text>
            <Text style={styles.emptyText}>
              Record your first hockey shot to see it here with advanced playback controls
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={handleRecordNew}
            >
              <Text style={styles.emptyButtonText}>📹 Record First Shot</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {videoUri && (
        <View style={styles.bottomActions}>
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleShare}
          >
            <Text style={styles.secondaryButtonText}>📤 Share</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleRecordNew}
          >
            <Text style={styles.primaryButtonText}>📹 Record New</Text>
          </TouchableOpacity>
        </View>
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
  headerAction: {
    color: '#0066cc',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  videoContainer: {
    flex: 1,
  },
  playerContainer: {
    flex: 1,
    minHeight: 300,
    backgroundColor: '#000000',
  },
  infoPanel: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  infoPanelTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoText: {
    color: '#888888',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  featureList: {
    gap: 8,
  },
  featureItem: {
    color: '#aaaaaa',
    fontSize: 14,
    lineHeight: 20,
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
  bottomActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#0066cc',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#333333',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555555',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
}); 