# Smart Hockey Coach - Dependencies Documentation (Optimized)

## Core Framework Dependencies

### Navigation
- **@react-navigation/native**: Core navigation library
- **@react-navigation/stack**: Stack navigator for screen transitions
- **@react-navigation/bottom-tabs**: Tab navigator for main app navigation

### State Management
- **zustand** (v4.5.0): Lightweight state management with TypeScript support
- **react-native-mmkv**: Fast key-value storage for persisting state

### Animations & Gestures
- **react-native-reanimated** (v3.17.4): High-performance animations
- **react-native-gesture-handler**: Native gesture handling

## AI/ML Dependencies
- **@tensorflow/tfjs**: TensorFlow.js core
- **@tensorflow/tfjs-react-native**: React Native bindings for TensorFlow.js
- **expo-gl**: WebGL implementation for GPU acceleration
- **expo-gl-cpp**: C++ OpenGL bindings for performance

## Video & Camera
- **expo-camera**: High-performance camera access with ML capabilities
- **expo-av**: Audio/Video playback and recording
- **expo-media-library**: Save videos to device gallery
- **expo-file-system**: File system operations

## Performance & UI
- **@shopify/flash-list**: High-performance list rendering
- **expo-image**: Optimized image loading and caching
- **react-native-skeleton-placeholder**: Loading state placeholders
- **Custom UI Components**: Lightweight replacements for UI Kitten

## Background Processing
- **expo-task-manager**: Background task management
- **expo-background-fetch**: Background data fetching

## Utilities
- **zod**: Runtime type validation
- **date-fns**: Date manipulation utilities
- **expo-device**: Device information

## Development
- **@types/react-native**: TypeScript definitions
- **babel-preset-expo**: Babel configuration for Expo

## Removed Dependencies
- ❌ **@ui-kitten/components** - Replaced with custom components
- ❌ **@eva-design/eva** - Replaced with custom theme
- ❌ **react-native-dotenv** - Using Expo's built-in env support
- ❌ **react-native-vision-camera** - Not compatible with Expo managed
- ❌ **react-native-video-processing** - Using Expo AV instead
- ❌ **react-native-worklets-core** - Not needed with Expo

## Setup Instructions

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Clear caches**:
   ```bash
   npx expo start --clear
   ```

3. **Initialize app systems**:
   ```typescript
   import { initializeApp } from './src/lib/setup';
   
   // In your App.tsx
   useEffect(() => {
     initializeApp();
   }, []);
   ```

## Performance Optimizations

### Bundle Size Reduction
- Removed UI Kitten: -2.5MB
- Custom UI components: ~200KB
- Total reduction: ~3MB

### Memory Usage
- Max memory: 200MB during recording
- TensorFlow.js: ~50MB when loaded
- Video buffer: ~100MB max

### Camera Configuration
- Resolution: 720p (optimal for ML)
- Frame rate: 30fps
- ML processing: 5fps (every 6th frame)

## Permissions

The app requires the following permissions:

### iOS (Configured in app.json)
- Camera access for recording
- Microphone access for audio
- Photo library access for saving videos

### Android (Configured in app.json)
- CAMERA
- RECORD_AUDIO
- READ_EXTERNAL_STORAGE
- WRITE_EXTERNAL_STORAGE

## Migration Notes

See [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md) for detailed migration instructions from the old dependencies to the new optimized stack.