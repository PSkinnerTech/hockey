# Mobile Client Requirements - Smart Hockey Coach

## Framework & Core Libraries

### Base Framework
- **React Native**: Latest stable version
- **TypeScript**: For type safety and better developer experience
- **Platform Support**: iOS 13+ and Android 8+ (API 26+)

### Essential Libraries
- **Navigation**: React Navigation v6+
- **State Management**: Zustand (recommended) or Redux Toolkit
- **UI Components**: 
  - UI Kitten for consistent theming
  - React Native Elements for common components
  - Custom components for specialized hockey UI

### Development Tools
- **Flipper**: For debugging and performance monitoring
- **React Native Debugger**: For state inspection
- **ESLint & Prettier**: Code quality and formatting

## On-Device ML Setup

### TensorFlow Lite Integration
```javascript
// Required packages
- react-native-tensorflow-lite
- Platform-specific native modules (Swift/Kotlin)

// Model specifications
- Input: Video frames (640x480 @ 30fps)
- Output: Shot timestamps and type probabilities
- Model size: Target <20MB for quick loading
```

### ML Models Required
1. **Shot Detection Model**
   - Detects stick swing and puck impact
   - Returns start/end timestamps
   - Confidence score for shot occurrence

2. **Shot Type Classifier** (Optional for v1)
   - Classifies: Wrist, Slap, Snapshot, Backhand
   - Probability distribution output

### Future: Gemini Nano
- Monitor availability for on-device inference
- Potential replacement for TFLite models
- Would enable more sophisticated on-device analysis

## Video Handling

### Camera Integration
```javascript
// Camera setup
import { RNCamera } from 'react-native-camera';

// Configuration
{
  type: RNCamera.Constants.Type.back,
  flashMode: RNCamera.Constants.FlashMode.off,
  ratio: '16:9',
  quality: RNCamera.Constants.VideoQuality['720p'],
  maxDuration: 30 // seconds
}
```

### Video Processing Pipeline

#### 1. Capture
- **Library**: react-native-camera or expo-camera
- **Settings**: 720p @ 30fps, H.264 encoding
- **Storage**: Temporary local storage during processing

#### 2. Segmentation
```javascript
// Automated segmentation based on ML output
const segmentVideo = async (videoUri, shotTimestamps) => {
  // Extract clips around detected shots
  const fastClip = await extractClip(videoUri, {
    start: shotTimestamps.impact - 0.5,
    duration: 1.0, // 0.5s before + 0.5s after
    targetSize: '< 1MB'
  });
  
  const fullClip = await extractClip(videoUri, {
    start: shotTimestamps.start,
    duration: 3.0, // Full shot sequence
    targetSize: '< 5MB'
  });
  
  return { fastClip, fullClip };
};
```

#### 3. Compression & Optimization
- **Fast Path**: 
  - Duration: 0.5-1.5 seconds
  - Resolution: 720p
  - Bitrate: 2-4 Mbps
  - Target size: <1MB
  - Alternative: 3-5 keyframes as JPEGs

- **Full Path**:
  - Duration: 1-3 seconds
  - Resolution: 720p
  - Bitrate: 4-6 Mbps
  - Target size: <5MB

### Upload Management
```javascript
// Background upload configuration
const uploadConfig = {
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data',
  },
  background: true,
  notification: {
    enabled: false
  }
};

// Upload with retry logic
const uploadWithRetry = async (uri, endpoint, maxRetries = 3) => {
  // Implementation with exponential backoff
};
```

## State Management Architecture

### Zustand Store Structure
```typescript
interface AppStore {
  // Shot recording state
  recording: {
    isRecording: boolean;
    duration: number;
    shotDetected: boolean;
  };
  
  // Feedback state
  feedback: {
    instantFeedback: string;
    fastFeedback: {
      outcome: string | null;
      shotType: string | null;
      isLoading: boolean;
    };
    fullFeedback: {
      rawStream: string;
      parsed: FullFeedbackType | null;
      sections: {
        outcome: boolean;
        technique: boolean;
        biomechanics: boolean;
        drills: boolean;
      };
      isLoading: boolean;
    };
  };
  
  // Actions
  actions: {
    startRecording: () => void;
    stopRecording: () => void;
    updateFeedback: (type: string, data: any) => void;
    resetFeedback: () => void;
  };
}
```

## UI/UX Requirements

### Screen Structure
1. **Home Screen**
   - Record button (prominent)
   - Recent shots carousel
   - Quick stats summary

2. **Recording Screen**
   - Camera preview
   - Shot detection indicator
   - Recording timer
   - Cancel/Stop controls

3. **Analysis Screen**
   - Progressive feedback display
   - Skeleton loaders for pending sections
   - Video replay with controls
   - Share/Save options

### Progressive Rendering Components
```jsx
// Skeleton loader for feedback sections
<SkeletonPlaceholder>
  <View style={styles.feedbackSection}>
    <View style={styles.title} />
    <View style={styles.content} />
  </View>
</SkeletonPlaceholder>

// Progressive text reveal
<AnimatedText 
  text={feedback.summary} 
  revealDuration={500}
  onComplete={() => setNextSectionVisible(true)}
/>
```

## Performance Requirements

### Target Metrics
- **App Launch**: <2 seconds to interactive
- **Camera Ready**: <1 second from screen load
- **ML Model Load**: <500ms on first use
- **Video Processing**: <2 seconds for 3-second clip
- **Memory Usage**: <200MB during recording
- **Battery Impact**: <10% drain per 30 minutes of use

### Optimization Strategies
1. **Lazy Loading**: Load ML models on demand
2. **Video Chunking**: Process video in segments
3. **Background Processing**: Use WorkManager/Background Tasks
4. **Cache Management**: Limit stored videos to last 10 shots
5. **Network Optimization**: Queue uploads for WiFi when possible

## Platform-Specific Considerations

### iOS
- **Permissions**: Camera, Microphone (optional), Photo Library
- **Background Modes**: Background fetch, Background processing
- **Minimum iOS**: 13.0 for optimal ML performance

### Android
- **Permissions**: CAMERA, RECORD_AUDIO, READ/WRITE_EXTERNAL_STORAGE
- **Scoped Storage**: Use app-specific directories
- **Camera2 API**: For advanced camera control
- **Minimum SDK**: 26 (Android 8.0)