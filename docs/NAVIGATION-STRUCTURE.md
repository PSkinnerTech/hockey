# Smart Hockey Coach - Navigation Structure (Updated January 2025)

## Overview

The Smart Hockey Coach app uses React Navigation Stack Navigator with three main screens optimized for the hockey recording and playback workflow. This document reflects the current Phase 2 implementation and planned Phase 3-4 enhancements.

## Navigation Architecture (✅ Phase 2 Implementation)

### Stack Navigator
- **Type**: React Navigation Stack Navigator (@react-navigation/stack v7.3.3)
- **Root Container**: NavigationContainer in `App.tsx`
- **Navigator**: Stack.Navigator with three screens
- **Safe Area**: react-native-safe-area-context integration

### Current Screen Flow (Phase 2)
```
HomeScreen → CameraScreen → PlaybackScreen
     ↑           ↓              ↓
     ←───────────┴──────────────┘
```

## Screen Definitions (Current Implementation)

### 1. HomeScreen (`src/screens/HomeScreen.tsx`) ✅
**Route**: `Home` (no parameters)

**Current Features (Phase 2)**:
- Hockey-themed welcome interface
- "Record Shot" button (navigates to Camera)
- "View Recordings" button (navigates to Playback)
- Professional sports app design
- Safe area handling

**Future Features (Phase 3-4)**:
- Quick stats display (total shots, accuracy, sessions)
- Recent shots list with thumbnails
- MMKV cached data for offline performance

**Navigation**:
- → Camera: Taps "Record Shot" button
- → Playback: Taps "View Recordings" button

### 2. CameraScreen (`src/screens/CameraScreen.tsx`) ✅
**Route**: `Camera` (no parameters currently)

**Current Features (Phase 2)**:
- VisionCamera integration with device detection
- Camera permissions handling (camera + microphone)
- 60fps video recording at 1080p
- Hockey shot guidelines (center circle overlay)
- Recording controls with REC indicator animation
- Visual feedback during recording
- Back navigation to Home

**Future Features (Phase 3)**:
- Real-time ML shot detection overlay
- Frame processor integration
- Shot detection indicator
- Custom back handler during recording
- Session management

**Navigation**:
- ← Home: Stack back navigation
- → Playback: Manual navigation after recording (future automatic)

### 3. PlaybackScreen (`src/screens/PlaybackScreen.tsx`) ✅
**Route**: `Playback` (no parameters currently)

**Current Features (Phase 2)**:
- Video library interface
- List of recorded videos with file paths
- Basic video information display
- Navigation back to Home

**Future Features (Phase 2 Week 2)**:
- Video playback with native controls
- Slow-motion playback for technique analysis
- Video file management (delete, share)

**Future Features (Phase 4)**:
- Progressive analysis feedback system
- AI insights and technique scoring
- Share functionality

**Navigation**:
- ← Home: "Back to Home" button
- → Camera: "Record Another Shot" button (future)

## Type Safety (✅ Implemented)

### Navigation Types (`src/types/navigation.ts`)
```typescript
// Current implementation
export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  Playback: undefined;
};

// Future Phase 3 expansion
export type RootStackParamList = {
  Home: undefined;
  Camera: { sessionId?: string } | undefined;
  Playback: { videoUri?: string; shotId?: string } | undefined;
};
```

### Typed Navigation Hooks
```typescript
// Current implementation using React Navigation hooks
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

type NavigationProp = StackNavigationProp<RootStackParamList>;
const navigation = useNavigation<NavigationProp>();
```

**Future Custom Hooks (Phase 3)**:
- `useTypedNavigation()`: Enhanced type-safe navigation
- `useTypedRoute<T>()`: Type-safe route params
- `useNavigationHelpers()`: Pre-built navigation functions

## Current Navigation Implementation

### Stack Navigator Setup (`App.tsx`)
```typescript
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Home"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Camera" component={CameraScreen} />
          <Stack.Screen name="Playback" component={PlaybackScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
```

### Screen Components Structure
- **HomeScreen**: Simple welcome interface with navigation buttons
- **CameraScreen**: VisionCamera with recording functionality
- **PlaybackScreen**: Video library with file listings

## Performance Optimizations (Current)

### React Native Best Practices ✅
- **No Headers**: `headerShown: false` for full-screen experience
- **Safe Areas**: Proper safe area handling on all screens
- **Navigation**: Smooth stack transitions with gesture support
- **Memory**: Proper component cleanup and state management

### Future Optimizations (Phase 3)
- `React.memo()` on screen components
- FlashList for efficient video library rendering
- Lazy loading for analysis features
- MMKV for performance state caching

## State Management Integration

### Current (Phase 2) ✅
- **React State**: useState/useEffect for component state
- **VisionCamera State**: useCameraDevice, useCameraPermission
- **Simple Navigation**: Basic stack navigation

### Future (Phase 3-4)
```typescript
// Planned Zustand stores
- Recording state management
- Video library state
- Analysis results caching
- User preferences and settings
```

## Camera Integration (✅ Current)

### VisionCamera Setup
```typescript
// Current implementation
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';

const device = useCameraDevice('back');
const { hasPermission, requestPermission } = useCameraPermission();
```

### Permissions Flow ✅
- Camera permission request on CameraScreen mount
- Microphone permission via react-native-permissions
- Graceful permission denied handling
- Settings redirect for blocked permissions

## Error Handling (Current)

### Navigation Errors ✅
- Stack navigation error boundaries
- Fallback to Home screen on errors
- Proper loading states

### Camera Errors ✅
- Permission denied handling
- Device detection fallbacks
- Recording failure recovery

## Testing Status

### Navigation Flows ✅ (Phase 2 Complete)
- [x] Home → Camera → Home
- [x] Home → Playback → Home
- [x] Stack navigation with back gestures
- [x] Safe area handling on all screens

### Camera Integration ✅ (Phase 2 Complete)
- [x] VisionCamera device detection
- [x] Permission request flow
- [x] 60fps recording functionality
- [x] Recording state management

### Future Testing (Phase 2 Week 2)
- [ ] Video playback controls
- [ ] Video library management
- [ ] File deletion and sharing

## Roadmap Integration

### ✅ Phase 2 Week 1 Complete
- React Navigation stack setup
- HomeScreen with hockey-themed UI
- CameraScreen with VisionCamera integration
- PlaybackScreen with video library interface
- TypeScript navigation types
- iOS deployment and testing

### 🎯 Phase 2 Week 2 (Next)
- Video playback component with controls
- Slow-motion playback capabilities
- Enhanced video library management
- File operations (delete, share, metadata)

### 🔄 Phase 3 (Weeks 3-4)
- Frame processor navigation integration
- ML overlay components
- Real-time shot detection UI
- Enhanced state management with Zustand

### 🔄 Phase 4 (Weeks 5-6)
- Analysis results navigation
- Progressive feedback UI
- Backend integration navigation
- Advanced sharing and export features

## Future Enhancements

### Planned Navigation Features (Phase 3-4)
- Deep linking for video sharing
- Navigation state persistence
- Modal presentations for analysis
- Custom transition animations

### Performance Monitoring (Phase 4)
- Navigation timing metrics
- Screen render performance tracking
- Memory usage monitoring

---

**Current Status**: Phase 2 Week 1 Complete ✅  
**Navigation**: React Navigation Stack with 3 screens  
**Framework**: React Native 0.79.2 + TypeScript  
**Next Milestone**: Video Playback (Phase 2 Week 2)