# Smart Hockey Coach - Dependency Migration Guide

## Important Note: Expo Compatibility

This project uses **Expo managed workflow**, which means we cannot use native modules that require linking. The following adjustments have been made to ensure compatibility while maintaining high performance:

## Camera & Video

### ❌ Cannot Use (Requires Native Code)
- `react-native-vision-camera` - Requires custom native code
- `react-native-video-processing` - Not compatible with Expo

### ✅ Using Instead
- **expo-camera** - Expo's optimized camera module with ML capabilities
- **expo-av** - Video recording and playback
- **expo-media-library** - Save videos to device

### Migration Notes
```typescript
// Old: react-native-vision-camera
const device = useCameraDevice('back')

// New: expo-camera
const [permission, requestPermission] = Camera.useCameraPermissions()
```

## Machine Learning

### ❌ Cannot Use (Native Dependencies)
- `@tensorflow/tfjs-react-native-gpu` - Requires native GPU access
- `react-native-worklets-core` - Requires native worklets

### ✅ Using Instead
- **expo-gl** + **expo-gl-cpp** - GPU acceleration for TensorFlow.js
- **@tensorflow/tfjs-react-native** - Works with Expo GL backend
- **expo-task-manager** - Background processing

## File Handling

### ❌ Cannot Use
- `react-native-blob-util` - Native file handling
- `react-native-fs` - Native filesystem
- `react-native-background-upload` - Native background tasks

### ✅ Using Instead
- **expo-file-system** - Full filesystem access
- **expo-background-fetch** - Background tasks
- **expo-task-manager** - Background uploads

## UI Framework Migration

### From UI Kitten to Custom Components

We're moving from UI Kitten to custom components for better performance and smaller bundle size.

#### Button Component
```typescript
// Old: UI Kitten
import { Button } from '@ui-kitten/components'
<Button onPress={handlePress}>Click me</Button>

// New: Custom Component
import { Button } from '@/components/ui'
<Button onPress={handlePress}>Click me</Button>
```

#### Theme System
```typescript
// Old: Eva Design System
import { light, dark } from '@eva-design/eva'

// New: Custom Theme
import { lightTheme, darkTheme } from '@/theme'
```

## Performance Optimizations

### Image Loading
```typescript
// Old: react-native-fast-image
import FastImage from 'react-native-fast-image'

// New: expo-image (better performance)
import { Image } from 'expo-image'
```

### List Rendering
- Continue using `@shopify/flash-list` - Works great with Expo

### State Persistence
- `react-native-mmkv` works with Expo via JSI

## API Changes

### Camera Permissions
```typescript
// New approach with expo-camera
import { Camera } from 'expo-camera'

export const requestCameraPermission = async () => {
  const { status } = await Camera.requestCameraPermissionsAsync()
  return status === 'granted'
}
```

### Video Recording
```typescript
// With expo-camera
const recordVideo = async () => {
  if (cameraRef.current) {
    const video = await cameraRef.current.recordAsync({
      maxDuration: 60,
      quality: Camera.Constants.VideoQuality['720p'],
    })
    return video.uri
  }
}
```

### TensorFlow.js Setup
```typescript
// Expo-compatible setup
import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-react-native'
import * as GL from 'expo-gl'

export const initializeTF = async () => {
  await tf.ready()
  // Use WebGL backend for GPU acceleration
  await tf.setBackend('webgl')
}
```

## Bundle Size Considerations

| Package | Old Size | New Size | Savings |
|---------|----------|----------|---------|
| UI Kitten + Eva | ~2.5MB | Custom UI | ~200KB |
| react-native-camera | ~1.2MB | expo-camera | Included |
| Multiple file libs | ~800KB | expo-file-system | Included |

## Breaking Changes

1. **Camera API** - Complete rewrite needed for camera hooks
2. **UI Components** - All UI Kitten components need replacement
3. **File Uploads** - Background upload logic needs refactoring
4. **ML Processing** - Frame processors work differently

## Migration Checklist

- [ ] Replace all UI Kitten imports with custom components
- [ ] Update camera implementation to use expo-camera
- [ ] Migrate file operations to expo-file-system
- [ ] Update TensorFlow.js initialization
- [ ] Test all permissions on both platforms
- [ ] Verify video recording quality
- [ ] Check bundle size reduction
- [ ] Update TypeScript types

## Benefits After Migration

1. **Smaller Bundle** - ~3MB reduction
2. **Better Performance** - Optimized Expo modules
3. **Easier Maintenance** - No native linking required
4. **OTA Updates** - Full Expo update support
5. **ML Ready** - TensorFlow.js with GPU support