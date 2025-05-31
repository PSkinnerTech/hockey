import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

type PlaybackScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Playback'>;
type PlaybackScreenRouteProp = RouteProp<RootStackParamList, 'Playback'>;

export default function PlaybackScreen() {
  const navigation = useNavigation<PlaybackScreenNavigationProp>();
  const route = useRoute<PlaybackScreenRouteProp>();
  
  const { videoUri } = route.params || {};

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleRecordNew = () => {
    navigation.navigate('Camera');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Shot Playback</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {videoUri ? (
          <View style={styles.videoContainer}>
            <View style={styles.videoPlaceholder}>
              <Text style={styles.videoPlaceholderText}>📹</Text>
              <Text style={styles.videoPath}>Video recorded:</Text>
              <Text style={styles.videoPathText} numberOfLines={3}>
                {videoUri}
              </Text>
            </View>
            
            <View style={styles.analysisContainer}>
              <Text style={styles.analysisTitle}>🏒 Shot Analysis</Text>
              <Text style={styles.analysisText}>
                Video recorded successfully! In the next phase, we'll add:
              </Text>
              <View style={styles.featureList}>
                <Text style={styles.featureItem}>• Real-time shot detection</Text>
                <Text style={styles.featureItem}>• AI-powered technique analysis</Text>
                <Text style={styles.featureItem}>• Slow-motion playback</Text>
                <Text style={styles.featureItem}>• Frame-by-frame breakdown</Text>
                <Text style={styles.featureItem}>• Coaching recommendations</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📁</Text>
            <Text style={styles.emptyTitle}>No Recordings Yet</Text>
            <Text style={styles.emptyText}>
              Record your first hockey shot to see it here
            </Text>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={handleRecordNew}
        >
          <Text style={styles.primaryButtonText}>📹 Record New Shot</Text>
        </TouchableOpacity>
        
        {videoUri && (
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>📤 Share Video</Text>
          </TouchableOpacity>
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
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  videoContainer: {
    flex: 1,
  },
  videoPlaceholder: {
    backgroundColor: '#333333',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
    minHeight: 200,
    justifyContent: 'center',
  },
  videoPlaceholderText: {
    fontSize: 48,
    marginBottom: 16,
  },
  videoPath: {
    color: '#888888',
    fontSize: 14,
    marginBottom: 8,
  },
  videoPathText: {
    color: '#ffffff',
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  analysisContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
  },
  analysisTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  analysisText: {
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
  },
  controls: {
    padding: 20,
    gap: 12,
  },
  primaryButton: {
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