# Audio Session Conflict Fix

## Issue Description

The app was experiencing `AVFoundationErrorDomain Code=-11800` with underlying `Code=-10868` errors when recording video with audio. This caused:

- Audio recording to fail on second and subsequent recordings
- "Cannot Record" errors in production
- Audio session conflicts between react-native-video and react-native-vision-camera

## Root Cause

**react-native-video version 6.11+** introduced an `audioSessionManager` that conflicts with react-native-vision-camera's audio session management.

Reference: [GitHub Issue #3524](https://github.com/mrousavy/react-native-vision-camera/issues/3524)

## Solution Implemented

### Primary Fix: Disable Audio Session Management in react-native-video

Added `disableAudioSessionManagement={true}` to the Video component in `HockeyVideoPlayer.tsx`:

```tsx
<Video
  ref={videoRef}
  source={{ uri: videoUri }}
  style={styles.video}
  rate={playbackRate}
  paused={!isPlaying}
  onLoadStart={handleLoadStart}
  onLoad={handleLoad}
  onProgress={handleProgress}
  onError={handleError}
  repeat={false}
  resizeMode="contain"
  disableAudioSessionManagement={true} // 🔧 This fixes the conflict
/>
```

### Code Cleanup

Since the root cause was fixed, we also:

1. **Simplified audio permission handling** - Now enables audio by default when permission is granted
2. **Removed complex workarounds** - No more auto-disable after recording or session reset delays
3. **Cleaned up error handling** - Removed audio session specific error detection and recovery
4. **Simplified UI feedback** - Cleaner status messages without error recovery options

## Alternative Solution

If needed, you can downgrade react-native-video to the last version without audioSessionManager:

```bash
yarn add react-native-video@6.10.2
```

## Testing

The fix resolves:
- ✅ First recording with audio works
- ✅ Subsequent recordings with audio work
- ✅ No more `-11800` / `-10868` errors
- ✅ Cleaner audio session management
- ✅ Better user experience

## Prevention

To prevent similar issues in future:
1. Check for audio session conflicts when updating audio/video libraries
2. Monitor for `AVFoundationErrorDomain` errors in production
3. Test audio recording functionality thoroughly after library updates

## Related Issues

- [react-native-vision-camera #3524](https://github.com/mrousavy/react-native-vision-camera/issues/3524)
- [react-native-vision-camera #1923](https://github.com/mrousavy/react-native-vision-camera/issues/1923)
- [react-native-vision-camera #3210](https://github.com/mrousavy/react-native-vision-camera/issues/3210) 