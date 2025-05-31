# Smart Hockey Coach - Navigation Structure

## Overview

The Smart Hockey Coach app uses a simple yet effective stack-based navigation structure with three main screens optimized for the hockey shot analysis workflow.

## Navigation Architecture

### Stack Navigator
- **Type**: React Navigation Stack Navigator
- **Root Container**: NavigationContainer in `app/_layout.tsx`
- **Navigator**: RootNavigator in `src/navigation/RootNavigator.tsx`

### Screen Flow
```
Home → Recording → Analysis
  ↑        ↓         ↓
  ←────────┴─────────┘
```

## Screen Definitions

### 1. HomeScreen (`src/screens/HomeScreen.tsx`)
**Route**: `Home` (no parameters)

**Features**:
- App branding and welcome message
- Large "Start Recording" CTA button
- Quick stats display (total shots, best accuracy, sessions)
- Recent shots list with thumbnails (FlashList)
- MMKV cached data for offline performance

**Navigation**:
- → Recording: Taps "Start Recording" button
- → Analysis: Taps on recent shot thumbnail

### 2. RecordingScreen (`src/screens/RecordingScreen.tsx`)
**Route**: `Recording` (optional `sessionId?: string`)

**Features**:
- Full-screen camera view with CameraView
- ML overlay grid for shot guidance
- Real-time shot detection indicator
- Recording controls (start/stop with visual feedback)
- Timer and duration display
- Camera flip and overlay toggle
- Custom back handler during recording

**Navigation**:
- ← Home: Back button or custom back handler
- → Analysis: Automatic after recording completion

### 3. AnalysisScreen (`src/screens/AnalysisScreen.tsx`)
**Route**: `Analysis` (required `shotId: string`, `videoUri: string`)

**Features**:
- Video playback with native controls
- Progressive feedback system (3 stages):
  1. Instant detection (< 500ms)
  2. Fast analysis (< 3s)
  3. Full analysis (< 15s)
- Technique scoring and feedback
- AI insights from analysis
- Share functionality
- Action buttons (new recording, share, home)

**Navigation**:
- ← Home: "Back to Home" button
- → Recording: "Record Another Shot" button

## Type Safety

### Navigation Types (`src/types/navigation.ts`)
```typescript
export type RootStackParamList = {
  Home: undefined;
  Recording: { sessionId?: string } | undefined;
  Analysis: { shotId: string; videoUri: string };
};
```

### Typed Hooks (`src/hooks/useTypedNavigation.ts`)
- `useTypedNavigation()`: Type-safe navigation hook
- `useTypedRoute<T>()`: Type-safe route params hook
- `useNavigationHelpers()`: Pre-built navigation functions
- `useCustomBackHandler()`: Custom back button handling

## Design System Integration

### Theme Integration
- Uses `getThemeColors()` for dark/light mode support
- Consistent spacing from `src/theme/spacing.ts`
- Typography system for text styling
- Shadow system for depth

### Performance Optimizations
- `React.memo()` on all screen components
- FlashList for efficient list rendering
- Lazy loading considerations for Analysis screen
- Proper cleanup in useEffect hooks

## Navigation Features

### Screen Options
- **Home**: No header (custom branding)
- **Recording**: No header (full-screen camera)
- **Analysis**: Modal presentation with header

### Gestures & Transitions
- Smooth horizontal slide transitions
- Gesture-enabled navigation
- Disabled gestures during recording
- Custom back handling for Recording screen

### Deep Linking Ready
- Type-safe parameter structure
- Supports future deep link implementation
- Proper parameter validation

## State Management Integration

### MMKV Storage
- Recent shots cached locally
- User statistics persistence
- Performance metrics tracking

### Zustand Stores
- User state management
- Session state tracking
- UI state (theme, loading states)

## Error Handling

### Camera Permissions
- Permission flow integration
- Graceful permission denied handling
- Settings redirect for denied permissions

### Navigation Errors
- Fallback navigation to Home
- Error boundaries from Expo Router
- Loading states during navigation

## Testing Checklist

### Navigation Flows ✅
- [x] Home → Recording → Analysis → Home
- [x] Home → Recording → Home (back button)
- [x] Analysis → Recording (new shot)
- [x] Deep navigation parameter passing

### Performance ✅
- [x] No memory leaks in navigation
- [x] Smooth 60fps transitions
- [x] Proper component cleanup
- [x] Efficient re-renders

### Platform Support ✅
- [x] iOS navigation behavior
- [x] Android back button handling
- [x] Screen rotation support
- [x] Safe area handling

## Future Enhancements

### Planned Features
- Deep linking implementation
- Navigation state persistence
- Advanced gesture navigation
- Screen transition customization

### Performance Monitoring
- Navigation timing metrics
- Screen render performance
- Memory usage tracking

---

The navigation structure is optimized for the hockey analysis workflow while maintaining excellent performance and user experience.