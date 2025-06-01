# Mobile Client Requirements - Smart Hockey Coach (Updated January 2025)

## Framework & Core Libraries (✅ Implemented)

### Base Framework
- **React Native**: 0.79.2 with New Architecture (Fabric + TurboModules)
- **React**: 19.0.0 
- **TypeScript**: 5.0.4 for type safety and developer experience
- **Hermes Engine**: Enabled for optimal performance
- **Platform Support**: iOS 13+ and Android 8+ (API 26+)

### Essential Libraries (Current Implementation)
- **Navigation**: React Navigation v7+ (`@react-navigation/native`, `@react-navigation/stack`)
- **Camera**: React Native VisionCamera 4.6.4 with Frame Processors
- **Permissions**: react-native-permissions 5.4.1 for camera/microphone access
- **State Management**: React useState/useEffect (Phase 2), Zustand planned for Phase 3
- **Storage**: react-native-mmkv 3.2.0 for high-performance key-value storage
- **Gestures & Animation**: react-native-reanimated 3.18.0, react-native-gesture-handler 2.25.0

### Development Tools
- **Metro**: React Native bundler with worklets support
- **ESLint & Prettier**: Code quality and formatting
- **TypeScript**: Full type safety across codebase
- **Babel**: Configured with VisionCamera Frame Processor support

## Video Handling (✅ Phase 2 Implementation)

### Camera Integration (VisionCamera)
```typescript
// Current implementation using VisionCamera
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';

// Configuration (implemented)
const device = useCameraDevice('back');
const { hasPermission, requestPermission } = useCameraPermission();

// Recording configuration
{
  video: true,
  audio: true, // with microphone permissions
  quality: '1080p',
  fps: 60, // for slow-motion analysis
}
```

### Video Processing Pipeline (Phase 2 Complete, Phase 3 Planned)

#### ✅ Phase 2: Basic Recording (COMPLETE)
- **Library**: react-native-vision-camera 4.6.4
- **Settings**: 1080p @ 60fps, H.264 encoding
- **Storage**: Local device storage with file management
- **Features**: Record/stop, visual indicators, timestamp-based naming

#### 🔄 Phase 3: Frame Processing & ML (PLANNED)
```typescript
// Frame processor for real-time analysis (Phase 3)
const frameProcessor = useFrameProcessor((frame) => {
  'worklet';
  
  // Real-time shot detection
  const shotDetected = runML(frame, shotDetectionModel);
  
  if (shotDetected) {
    runOnJS(handleShotDetected)(frame.timestamp);
  }
}, []);
```

#### 🔄 Phase 3: Video Segmentation (PLANNED)
```typescript
// Automated segmentation based on ML output
const segmentVideo = async (videoUri: string, shotTimestamps: ShotTimestamp[]) => {
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

## State Management Architecture

### Current Implementation (Phase 2)
```typescript
// Simple React state management (current)
interface CameraState {
  isRecording: boolean;
  recordingDuration: number;
  hasPermission: boolean;
  recordings: Recording[];
}

// Using React hooks
const [isRecording, setIsRecording] = useState(false);
const [recordings, setRecordings] = useState<Recording[]>([]);
```

### Planned Zustand Store (Phase 3)
```typescript
interface AppStore {
  // Shot recording state
  recording: {
    isRecording: boolean;
    duration: number;
    shotDetected: boolean;
    currentVideoPath: string | null;
  };
  
  // Feedback state (Phase 4)
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

### ✅ Current Screen Structure (Phase 2 Complete)
1. **HomeScreen**
   - Hockey-themed interface
   - "Record Shot" and "View Recordings" buttons
   - Professional sports app design

2. **CameraScreen** 
   - VisionCamera preview with device detection
   - Hockey shot guidelines (center circle overlay)
   - Recording controls with visual feedback
   - REC indicator animation
   - Permission handling UI

3. **PlaybackScreen**
   - Video library browsing
   - Recorded video management
   - Future: Analysis results display

### 🔄 Planned Progressive Rendering (Phase 4)
```tsx
// Future: Skeleton loader for feedback sections
<SkeletonPlaceholder>
  <View style={styles.feedbackSection}>
    <View style={styles.title} />
    <View style={styles.content} />
  </View>
</SkeletonPlaceholder>

// Future: Progressive text reveal
<AnimatedText 
  text={feedback.summary} 
  revealDuration={500}
  onComplete={() => setNextSectionVisible(true)}
/>
```

## On-Device ML Setup (Phase 3-4 Roadmap)

### Planned TensorFlow Lite Integration (Phase 3)
```typescript
// Future dependencies
- react-native-fast-tflite: Native TensorFlow Lite
- Custom hockey shot detection models

// Model specifications
- Input: Video frames from VisionCamera (1080p → 640x480 for ML)
- Output: Shot timestamps and type probabilities  
- Model size: Target <20MB for quick loading
```

### ML Models Required (Phase 3)
1. **Shot Detection Model**
   - Detects stick swing and puck impact
   - Returns start/end timestamps
   - Confidence score for shot occurrence

2. **Shot Type Classifier** (Phase 4)
   - Classifies: Wrist, Slap, Snapshot, Backhand
   - Probability distribution output

### Backend AI Integration (Phase 4)
- **Gemini**: Cloud-based advanced analysis
- **Convex**: Real-time sync and storage
- **Vertex AI**: Custom hockey model training

## Performance Requirements

### ✅ Current Performance (Phase 2)
- **App Launch**: <2 seconds to interactive ✅
- **Camera Ready**: <1 second from screen load ✅  
- **Recording Start**: Instant response ✅
- **Memory Usage**: ~150MB during 60fps recording ✅
- **60fps Recording**: Smooth performance ✅

### Target Metrics (Phase 3-4)
- **ML Model Load**: <500ms on first use
- **Video Processing**: <2 seconds for 3-second clip
- **Frame Processing**: Real-time at 60fps
- **Battery Impact**: <10% drain per 30 minutes of use

### Optimization Strategies
1. **✅ Current**: Native modules for camera performance
2. **Phase 3**: Lazy loading for ML models
3. **Phase 3**: Frame processor worklets for real-time analysis
4. **Phase 4**: Background processing for video upload
5. **Phase 4**: Cache management for video storage

## Platform-Specific Considerations

### iOS (✅ Implemented)
- **Permissions**: Camera ✅, Microphone ✅, Photo Library (future)
- **Minimum iOS**: 13.0 for React Native 0.79.2 New Architecture
- **Bundle ID**: com.pskinnertech.smarthockeycoach
- **CocoaPods**: 225 dependencies successfully configured

### Android (🔄 Future)
- **Permissions**: CAMERA, RECORD_AUDIO, READ/WRITE_EXTERNAL_STORAGE
- **Scoped Storage**: Use app-specific directories  
- **Camera2 API**: For advanced camera control
- **Minimum SDK**: 26 (Android 8.0) for React Native 0.79.2

## Current Implementation Status (January 2025)

### ✅ Phase 2 Week 1 Complete
- React Native 0.79.2 foundation with New Architecture
- VisionCamera integration with 60fps recording
- Complete navigation system (Home → Camera → Playback)
- iOS permissions handling (camera + microphone)
- Professional hockey-themed UI
- Video file management and storage

### 🎯 Phase 2 Week 2 (Next)
- Video playback component with controls
- Slow-motion playback for technique analysis
- Video library management
- File organization and metadata

### 🔄 Phase 3 (Weeks 3-4)
- Frame Processors for real-time analysis
- react-native-fast-tflite integration
- Shot detection ML models
- Basic hockey shot recognition

### 🔄 Phase 4 (Weeks 5-6)
- Convex backend integration
- Gemini AI analysis
- Progressive feedback UI
- Cloud storage and sync

---

**Framework**: React Native 0.79.2 + New Architecture  
**Status**: Phase 2 Week 1 Complete ✅  
**Next Milestone**: Video Playback (Phase 2 Week 2)  
**Production Target**: Week 11 (March 2025)