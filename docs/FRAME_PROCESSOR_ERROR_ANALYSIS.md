# Frame Processor Error Analysis

**Date**: December 2024  
**Error Type**: Worklet Context Violations & Reanimated Integration Issues  
**Severity**: High - Blocking core functionality  
**Status**: Critical Bug  

## 🚨 **Error Summary**

When attempting to start video recording with frame processing enabled, the app crashes with multiple related errors pointing to worklet context violations and `runOnJS` import issues.

## 📋 **Error Details**

### **Primary Errors:**

1. **ReferenceError: Property '_toString' doesn't exist**
   - **Location**: `SimpleFrameProcessor.ts:28`
   - **Engine**: Hermes
   - **Context**: Worklet execution

2. **TypeError: Cannot read property 'runOnJS' of undefined**
   - **Location**: Frame processor hook usage
   - **Context**: React component rendering

3. **Metro Disconnection**
   - **Symptom**: "Disconnected from Metro (1001: Stream end encountered)"
   - **Potential Cause**: Worklet compilation failures

## 🔍 **Root Cause Analysis**

### **Issue 1: Worklet Context Violations**

**Problem**: Accessing non-serializable objects in worklet context
```typescript
// ❌ PROBLEMATIC CODE (Line 28)
if (frame.timestamp % (config.skipFrames + 1) !== 0) {
  return;
}
```

**Root Cause**: 
- The `config` object is being accessed directly inside the worklet
- Worklets run on the UI thread and cannot access JavaScript objects directly
- Properties like `config.skipFrames` must be extracted outside worklet or passed as primitive values

### **Issue 2: runOnJS Import/Availability**

**Problem**: `runOnJS` is undefined at runtime
```typescript
// ❌ PROBLEMATIC IMPORT
import { runOnJS } from 'react-native-reanimated';
```

**Potential Causes**:
1. **Version Mismatch**: react-native-reanimated version incompatibility
2. **Babel Configuration**: Worklets plugin not properly configured
3. **Import Resolution**: Module not found or corrupted installation
4. **Context Isolation**: runOnJS not available in frame processor context

### **Issue 3: VisionCamera + Reanimated Integration**

**Problem**: Conflicting worklet contexts between VisionCamera and Reanimated

**Technical Details**:
- VisionCamera uses its own worklet runtime via `react-native-worklets-core`
- Reanimated has its own worklet system
- The two systems may not be fully compatible in all scenarios
- Frame processors require specific worklet context setup

## 📊 **Error Impact Assessment**

### **Affected Features**:
- ✅ Basic camera preview (working)
- ✅ Video recording without frame processing (working)
- ❌ Real-time shot detection (broken)
- ❌ Frame processing during recording (broken)
- ❌ AI overlay feedback (broken)

### **User Impact**:
- **Severity**: High - Core Phase 3 features unusable
- **Workaround**: Recording works without frame processing
- **Data Loss**: No video data loss, but no ML insights

## 🛠 **Technical Investigation**

### **Dependency Versions**
```json
{
  "react-native": "0.79.2",
  "react-native-vision-camera": "4.6.4",
  "react-native-reanimated": "~3.16.1",
  "react-native-worklets-core": "1.3.3"
}
```

### **Known Compatibility Issues**

1. **VisionCamera 4.x + Reanimated 3.x**
   - VisionCamera 4.6.4 uses worklets-core 1.3.3
   - Reanimated 3.16.1 has its own worklet runtime
   - Potential runtime conflicts

2. **Hermes Engine Limitations**
   - Stricter object property access
   - Limited debugging capabilities in worklets
   - Serialization restrictions

3. **React Native 0.79.2**
   - New architecture (Fabric) enabled
   - Bridgeless mode may affect worklet behavior
   - TurboModules interaction with worklets

## 🔧 **Potential Solutions**

### **Solution 1: Worklet Context Isolation**
```typescript
// ✅ SAFE APPROACH
export const useSimpleFrameProcessor = (
  config: SimpleFrameProcessorConfig,
  onShotDetected: (result: SimpleShotDetectionResult) => void
) => {
  // Extract primitives outside worklet
  const skipFrames = config.skipFrames;
  const enableShotDetection = config.enableShotDetection;
  const confidenceThreshold = config.confidence;
  
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    
    // Use primitives only
    if (frame.timestamp % (skipFrames + 1) !== 0) {
      return;
    }
    // ... rest of logic
  }, [skipFrames, enableShotDetection, confidenceThreshold]);
  
  return frameProcessor;
};
```

### **Solution 2: Reanimated Alternative**
```typescript
// Use VisionCamera's runOnJS instead
import { VisionCameraProxy } from 'react-native-vision-camera';

// Inside worklet:
VisionCameraProxy.runOnJS(onShotDetected)(result);
```

### **Solution 3: Dependency Downgrade**
- Test with Reanimated 3.15.x
- Test with VisionCamera 4.5.x
- Verify worklets-core compatibility

### **Solution 4: Pure VisionCamera Approach**
- Remove Reanimated dependency from frame processors
- Use only VisionCamera's worklet system
- Implement shot detection without Reanimated

## 📋 **Immediate Action Plan**

### **Phase 1: Error Isolation (30 minutes)**
1. ✅ Disable frame processing to confirm basic recording works
2. ✅ Test simple worklet without config objects
3. ✅ Verify runOnJS import availability

### **Phase 2: Quick Fix (1 hour)**
1. 🔄 Extract config values as primitives
2. 🔄 Replace Reanimated runOnJS with VisionCamera runOnJS
3. 🔄 Simplify worklet to minimal viable functionality

### **Phase 3: Long-term Solution (2-4 hours)**
1. ⏳ Investigate dependency compatibility matrix
2. ⏳ Implement robust error handling
3. ⏳ Add fallback mechanisms
4. ⏳ Performance optimization

## 🚀 **Success Criteria**

### **Minimum Viable Fix**:
- [ ] Recording works with basic frame processing
- [ ] No worklet context errors
- [ ] Simple shot detection functional
- [ ] App doesn't crash on record button

### **Full Resolution**:
- [ ] All frame processing features working
- [ ] Performance metrics collection
- [ ] Adaptive frame rate optimization
- [ ] Comprehensive error handling

## 📚 **References**

- [VisionCamera Frame Processors](https://react-native-vision-camera.com/docs/guides/frame-processors)
- [Reanimated Worklets](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/worklets/)
- [React Native 0.79 New Architecture](https://reactnative.dev/docs/new-architecture-intro)
- [Hermes Engine Limitations](https://hermesengine.dev/docs/language-features/)

## 📝 **Notes**

- Error reproduction: 100% consistent on record button press
- Environment: iOS Simulator + iPhone 15
- Metro server: Multiple disconnections during worklet compilation
- Performance impact: None when frame processing disabled

---

**Next Steps**: Implement Phase 1 fixes immediately, then proceed with context isolation solution. 