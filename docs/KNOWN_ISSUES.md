# 🐛 Known Issues - Smart Hockey Coach

## Current Issues

### 🔊 **Audio Session Error (AVFoundationErrorDomain Code=-11800)**

**Status**: 🟡 **ONGOING** - Partially resolved but still occurs in some scenarios

**Description**: 
Audio session conflicts between `react-native-vision-camera` and `react-native-video` causing playback failures.

**Error Details**:
```
AVFoundationErrorDomain Code=-11800 "The operation could not be completed"
- Occurs during video playback after camera recording
- Related to audio session management conflicts
- Most common on iOS devices
```

**Current Workarounds**:
- ✅ Added `disableAudioSessionManagement={true}` to video player
- ✅ Improved error handling with graceful fallbacks
- ⚠️ Still occurs occasionally in edge cases

**Reproduction Steps**:
1. Record a video using camera
2. Navigate to playback immediately 
3. Start/stop playback multiple times
4. Error may appear intermittently

**Impact**:
- 🔴 **User Experience**: Video may fail to play
- 🟡 **Frequency**: Occasional, not consistent
- 🟢 **Workaround**: Users can retry playback successfully

**Potential Solutions Being Investigated**:
- [ ] Implement audio session coordination between camera/video
- [ ] Add delay between recording completion and playback
- [ ] Explore alternative video playback libraries
- [ ] Implement more robust audio session management

**Related Files**:
- `frontend/src/components/HockeyVideoPlayer.tsx`
- `frontend/src/screens/CameraScreen.tsx`
- `frontend/src/screens/PlaybackScreen.tsx`

**Last Updated**: January 2025

---

## Issue Template

Use this template when adding new issues:

### 🔧 **[Issue Title]**

**Status**: 🔴 **CRITICAL** / 🟡 **ONGOING** / 🟢 **MINOR** / ✅ **RESOLVED**

**Description**: 
Brief description of the issue

**Error Details**:
```
Exact error messages, stack traces, or symptoms
```

**Current Workarounds**:
- List any temporary fixes or workarounds

**Reproduction Steps**:
1. Step-by-step instructions to reproduce
2. Include device/platform specifics if relevant

**Impact**:
- 🔴/🟡/🟢 **User Experience**: How it affects users
- 🔴/🟡/🟢 **Frequency**: How often it occurs  
- 🔴/🟡/🟢 **Workaround**: Availability of workarounds

**Potential Solutions Being Investigated**:
- [ ] List possible solutions
- [ ] Include research or investigation notes

**Related Files**:
- List relevant source files

**Last Updated**: Date

---

## Resolved Issues Archive

### ✅ **[Example] Navigation Stack Memory Leak**
**Status**: ✅ **RESOLVED** - Fixed in Phase 2
**Solution**: Proper cleanup of video refs and navigation listeners
**Date Resolved**: January 2025

---

## Issue Priorities

### 🔴 **Critical** 
Issues that prevent core functionality or cause app crashes

### 🟡 **High Priority**
Issues that impact user experience but have workarounds

### 🟢 **Low Priority** 
Minor issues or nice-to-have improvements

### ✅ **Resolved**
Issues that have been fixed and verified

---

## Reporting New Issues

When reporting new issues:

1. **Check existing issues** first to avoid duplicates
2. **Use the issue template** above for consistency
3. **Include reproduction steps** with specific devices/versions
4. **Add relevant error logs** and screenshots if applicable
5. **Update the issue status** as work progresses
6. **Move to resolved section** when fixed and verified

---

**Document Maintained By**: Development Team  
**Last Updated**: January 2025 