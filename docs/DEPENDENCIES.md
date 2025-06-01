# Smart Hockey Coach - Dependencies Documentation (Updated January 2025)

## Core Framework Dependencies

### React Native Foundation
- **react-native** (v0.79.2): React Native framework with New Architecture (Fabric + TurboModules)
- **react** (v19.0.0): React library
- **metro-react-native-babel-preset** (v0.77.0): Metro bundler configuration

### Navigation
- **@react-navigation/native** (v7.1.10): Core navigation library
- **@react-navigation/stack** (v7.3.3): Stack navigator for screen transitions
- **react-native-screens** (v4.11.1): Native screen components for navigation optimization
- **react-native-safe-area-context** (v5.4.1): Safe area handling for all devices
- **@react-native-community/masked-view** (v0.1.11): Required for stack navigation

### State Management & Storage
- **react-native-mmkv** (v3.2.0): Fast key-value storage for high-performance state persistence
- **@react-native-async-storage/async-storage** (v2.1.2): Async storage for compatibility and non-critical data

### Animations & Gestures
- **react-native-reanimated** (v3.18.0): High-performance animations and worklets
- **react-native-gesture-handler** (v2.25.0): Native gesture handling

### Permissions System
- **react-native-permissions** (v5.4.1): Cross-platform permissions handling (critical for camera/microphone)

## Video & Camera Dependencies
- **react-native-vision-camera** (v4.6.4): High-performance camera with Frame Processors
- **react-native-worklets-core** (v1.5.0): JavaScript worklets for real-time frame processing

## Performance & UI
- **Future**: @shopify/flash-list for high-performance list rendering
- **Future**: Custom UI components for hockey-specific interface

## Development Dependencies

### Babel Configuration (Critical)
- **@babel/core** (v7.25.2): Babel transpiler core
- **@react-native/babel-preset** (v0.79.2): React Native babel preset
- **@babel/plugin-proposal-optional-chaining** (v7.21.0): Required for VisionCamera compatibility
- **@babel/plugin-proposal-nullish-coalescing-operator** (v7.18.6): Required for VisionCamera compatibility
- **react-native-worklets-core/plugin**: Frame processor babel plugin

### TypeScript & Testing
- **typescript** (v5.0.4): TypeScript language support
- **@types/react** (v19.0.0): React TypeScript definitions
- **@types/react-test-renderer** (v19.0.0): Testing type definitions
- **jest** (v29.6.3): Testing framework
- **@react-native/eslint-config** (v0.79.2): ESLint configuration
- **prettier** (v2.8.8): Code formatting

## Babel Configuration (babel.config.js)
```javascript
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['react-native-worklets-core/plugin'],
    // VisionCamera required plugins (legacy names)
    ['@babel/plugin-proposal-optional-chaining'],
    ['@babel/plugin-proposal-nullish-coalescing-operator'],
  ],
};
```

## iOS CocoaPods Dependencies
- **Total Pods Installed**: 225 dependencies (includes React Native core + VisionCamera dependencies)
- **Key iOS Dependencies**: VisionCamera native modules, React Native core libraries, navigation components

## Setup Instructions

### 1. Install Node Dependencies
```bash
cd frontend
npm install
```

### 2. Install Babel Plugins (Required for VisionCamera)
```bash
npm install --save-dev @babel/plugin-proposal-optional-chaining @babel/plugin-proposal-nullish-coalescing-operator
```

### 3. iOS Setup
```bash
# Configure New Architecture
echo "export RCT_NEW_ARCH_ENABLED=1" > .xcode.env.local

# Install iOS dependencies
cd ios
pod install
cd ..
```

### 4. Run Development
```bash
# iOS (use .xcworkspace, not .xcodeproj)
npx react-native run-ios

# Android  
npx react-native run-android

# Start Metro bundler
npx react-native start
```

### 5. iOS Permissions Configuration
Ensure `Info.plist` includes:
```xml
<key>NSCameraUsageDescription</key>
<string>This app needs camera access to record hockey shots for analysis</string>
<key>NSMicrophoneUsageDescription</key>
<string>This app needs microphone access to record audio with hockey shot videos</string>
```

## Performance Optimizations

### Bundle Size
- React Native 0.79.2 with New Architecture: Optimized bundle size
- VisionCamera: Minimal overhead for camera functionality
- Navigation: Native screen optimization

### Memory Usage
- Max memory during recording: ~200MB
- VisionCamera Frame Processors: ~50MB
- Video buffer: ~100MB max during 60fps recording

### Camera Configuration (Optimized for Hockey)
- Resolution: 1080p (optimal for analysis)
- Frame rate: 60fps for slow-motion analysis
- Frame processing: Real-time worklets for shot detection

## Platform Permissions

### iOS (Info.plist)
- **Camera**: Required for video recording
- **Microphone**: Required for audio recording
- **Photo Library**: For saving recorded videos

### Android (android/app/src/main/AndroidManifest.xml)
- **CAMERA**: Camera access
- **RECORD_AUDIO**: Microphone access
- **READ_EXTERNAL_STORAGE**: Video file access
- **WRITE_EXTERNAL_STORAGE**: Video file saving

## Migration Notes (Expo → React Native)

### ✅ Successfully Added
- **react-native-vision-camera**: Advanced camera capabilities
- **react-native-worklets-core**: Real-time frame processing
- **react-native-permissions**: Comprehensive permissions system
- **React Native New Architecture**: Fabric + TurboModules for performance

### ❌ Removed from Original Plan  
- **expo-camera**: Replaced with react-native-vision-camera
- **@tensorflow/tfjs**: Will be replaced with react-native-fast-tflite (Phase 3)
- **expo-gl**: Not needed with Frame Processors

### 🔄 Architecture Changes
- **Expo Managed** → **React Native CLI** for native module access
- **JavaScript ML** → **Native TensorFlow Lite** (planned Phase 3)
- **expo-camera** → **VisionCamera Frame Processors** for real-time analysis

## Troubleshooting

### Common Issues
1. **VisionCamera build errors**: Ensure babel plugins are installed
2. **iOS build fails**: Use `.xcworkspace` file, not `.xcodeproj`
3. **Permission errors**: Check react-native-permissions configuration
4. **Frame processor errors**: Verify worklets babel plugin is configured

### Build Commands
```bash
# Clean iOS build
cd ios && rm -rf build Pods Podfile.lock && pod install && cd ..

# Clean Metro cache
npx react-native start --reset-cache
```

## Next Phase Dependencies (Phase 3-4)
- **react-native-fast-tflite**: Native TensorFlow Lite for ML inference
- **Convex**: Backend database and real-time sync
- **Google Vertex AI**: Advanced hockey analysis models

---

**Last Updated**: January 2025  
**React Native Version**: 0.79.2  
**Status**: Phase 2 Week 1 Complete ✅  
**Dependencies Count**: 23 npm packages, 225 CocoaPods