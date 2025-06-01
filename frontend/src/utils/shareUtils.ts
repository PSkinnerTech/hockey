import Share from 'react-native-share';
import { Alert, Platform } from 'react-native';
import { VideoMetadata } from '../services/VideoStorageService';

export interface ShareOptions {
  title?: string;
  message?: string;
  subject?: string;
  excludedActivityTypes?: string[];
}

/**
 * Share a single hockey video
 */
export const shareVideo = async (
  video: VideoMetadata,
  options: ShareOptions = {}
): Promise<boolean> => {
  try {
    const defaultMessage = `Check out my hockey shot! 🏒\n\nRecorded on ${video.recordedAt.toLocaleDateString()}`;
    
    const shareOptions = {
      title: options.title || 'Hockey Shot Video',
      message: options.message || defaultMessage,
      subject: options.subject || `Hockey Shot - ${video.recordedAt.toLocaleDateString()}`,
      url: Platform.OS === 'ios' ? video.path : `file://${video.path}`,
      type: 'video/mp4',
      excludedActivityTypes: options.excludedActivityTypes || [
        // Exclude some apps that might not handle video well
        'com.apple.UIKit.activity.PostToTwitter',
        'com.apple.UIKit.activity.PostToWeibo',
      ],
    };

    const result = await Share.open(shareOptions);
    
    // Check if sharing was successful
    if (result.success || result.message === 'OK') {
      return true;
    }
    
    return false;
  } catch (error: any) {
    console.error('Failed to share video:', error);
    
    // Handle specific error cases
    if (error.message && error.message.includes('User did not share')) {
      // User cancelled - this is normal, don't show error
      return false;
    }
    
    Alert.alert(
      'Share Failed',
      'Could not share the video. Please try again or check if you have any sharing apps installed.',
      [{ text: 'OK' }]
    );
    
    return false;
  }
};

/**
 * Share multiple hockey videos
 */
export const shareMultipleVideos = async (
  videos: VideoMetadata[],
  options: ShareOptions = {}
): Promise<boolean> => {
  try {
    if (videos.length === 0) {
      Alert.alert('No Videos', 'Please select at least one video to share.');
      return false;
    }

    if (videos.length === 1) {
      return shareVideo(videos[0], options);
    }

    // For multiple videos, we'll create a list and let the user choose how to share
    const videoList = videos.map((video, index) => 
      `${index + 1}. Shot from ${video.recordedAt.toLocaleDateString()} (${formatDuration(video.duration)})`
    ).join('\n');

    const defaultMessage = `Check out my hockey shots! 🏒\n\n${videoList}\n\nTotal shots: ${videos.length}`;

    // For multiple videos, we can only share the message/list for now
    // Individual video files would need to be handled differently
    const shareOptions = {
      title: options.title || `${videos.length} Hockey Shots`,
      message: options.message || defaultMessage,
      subject: options.subject || `Hockey Training Session - ${videos.length} shots`,
    };

    const result = await Share.open(shareOptions);
    
    if (result.success || result.message === 'OK') {
      return true;
    }
    
    return false;
  } catch (error: any) {
    console.error('Failed to share videos:', error);
    
    if (error.message && error.message.includes('User did not share')) {
      return false;
    }
    
    Alert.alert(
      'Share Failed',
      'Could not share the videos. Please try sharing them individually.',
      [{ text: 'OK' }]
    );
    
    return false;
  }
};

/**
 * Share hockey training session summary
 */
export const shareSessionSummary = async (
  videos: VideoMetadata[],
  sessionDate: Date,
  notes?: string
): Promise<boolean> => {
  try {
    const totalDuration = videos.reduce((sum, video) => sum + video.duration, 0);
    const shotsWithAudio = videos.filter(video => video.hasAudio).length;
    
    const summary = `🏒 Hockey Training Session
📅 Date: ${sessionDate.toLocaleDateString()}
⏱️ Total Time: ${formatDuration(totalDuration)}
🎯 Shots Recorded: ${videos.length}
🎤 With Audio: ${shotsWithAudio}/${videos.length}

Shot Details:
${videos.map((video, index) => 
  `${index + 1}. ${video.recordedAt.toLocaleTimeString()} - ${formatDuration(video.duration)}${video.hasAudio ? ' 🎤' : ''}`
).join('\n')}

${notes ? `\nNotes: ${notes}` : ''}

#HockeyTraining #SmartHockeyCoach`;

    const shareOptions = {
      title: 'Hockey Training Session',
      message: summary,
      subject: `Hockey Training - ${sessionDate.toLocaleDateString()}`,
    };

    const result = await Share.open(shareOptions);
    return result.success || result.message === 'OK';
  } catch (error: any) {
    console.error('Failed to share session summary:', error);
    
    if (error.message && error.message.includes('User did not share')) {
      return false;
    }
    
    Alert.alert('Share Failed', 'Could not share session summary.');
    return false;
  }
};

/**
 * Format duration for display
 */
const formatDuration = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get available sharing options for the current platform
 */
export const getAvailableSharingOptions = async (): Promise<string[]> => {
  try {
    // This would return available sharing apps, but react-native-share
    // doesn't expose this directly. For now, return common options.
    return [
      'Messages',
      'Mail',
      'AirDrop', // iOS only
      'WhatsApp',
      'Telegram',
      'Instagram',
      'TikTok',
      'More...',
    ];
  } catch (error) {
    console.error('Failed to get sharing options:', error);
    return ['Share'];
  }
};

/**
 * Show share action sheet with custom options
 */
export const showShareActionSheet = (
  video: VideoMetadata,
  onShareComplete?: (success: boolean) => void
) => {
  Alert.alert(
    'Share Hockey Shot',
    'How would you like to share this video?',
    [
      {
        text: 'Share Video File',
        onPress: async () => {
          const success = await shareVideo(video);
          onShareComplete?.(success);
        },
      },
      {
        text: 'Share Summary',
        onPress: async () => {
          const success = await shareSessionSummary([video], video.recordedAt);
          onShareComplete?.(success);
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => onShareComplete?.(false),
      },
    ]
  );
}; 