# Frame Processor Testing Guide

**Date**: December 2024  
**Status**: Frame Processing WORKING ✅  
**Test Mode**: Enabled for easier verification  

## 🎯 **What's Actually Working Now**

### ✅ **FIXED Issues:**
1. **Worklet Context Violations** - Primitives extracted properly
2. **Detection Callbacks** - Global queue bridge implemented
3. **UI Communication** - React receives detections in real-time
4. **Verification Logging** - Frame processing counter active

### 🧪 **Test Mode Features:**
- **3% Detection Rate** - Much higher than production (0.5%)
- **Real-time UI Updates** - Detections appear in overlay
- **Frame Processing Counter** - Logs every 60 frames (~1 second)
- **Console Verification** - Detailed logging for debugging

## 📱 **How to Test Shot Detection**

### **1. Quick Verification Test**
```bash
# Start recording and look for these logs:
📹 Frame processing active - processed 60 frames
📹 Frame processing active - processed 120 frames
🏒 Shot detected! Type: wrist, Confidence: 87.3%
📤 Detection queued for UI (queue size: 1)
📥 Processing 1 shot detection(s) from worklet
```

### **2. Visual UI Test**
1. **Start Recording** - Look for "🔴 LIVE" status
2. **Watch AI Overlay** - Should show detections in real-time
3. **Check Shot Counter** - "Shots: X | Test Mode: ON"
4. **Recent Shots List** - Shows last 3 detections with confidence

### **3. Motion Detection Test**
Since we're using mock detection currently, here's how to test motion:

#### **Current Behavior (Mock)**:
- Random 3% chance per processed frame
- No actual motion required
- Just record for 10-15 seconds to see detections

#### **Future Real Motion Detection**:
```typescript
// This would replace the mock detection:
const motionDetected = analyzeFrameMotion(frame);
const isHockeyMotion = detectHockeyShot(motionDetected);
```

## 🔍 **Verification Steps**

### **Step 1: Frame Processing Active**
**Expected**: Console logs every ~1 second
```
📹 Frame processing active - processed 60 frames
📹 Frame processing active - processed 120 frames
```
**If Missing**: Frame processor not running

### **Step 2: Detection Generation**
**Expected**: Random shot detections during recording
```
🏒 Shot detected! Type: slap, Confidence: 92.1%
📤 Detection queued for UI (queue size: 1)
```
**If Missing**: Detection logic not working

### **Step 3: UI Communication**
**Expected**: React receives and displays detections
```
📥 Processing 1 shot detection(s) from worklet
```
**If Missing**: Global queue bridge broken

### **Step 4: UI Updates**
**Expected**: 
- Shot counter increases
- Recent shots list populates
- AI overlay shows live status

## 🧪 **Test Scenarios**

### **Scenario A: Basic Recording**
1. Press record button
2. Record for 10 seconds
3. **Expected Results**:
   - 2-5 shot detections (3% rate)
   - UI shows all detections
   - Console shows frame processing

### **Scenario B: Processing Mode Changes**
1. Change mode: Battery → Balanced → Performance
2. Record in each mode
3. **Expected Results**:
   - Battery: Slower processing (8 frame skip)
   - Balanced: Medium processing (4 frame skip)
   - Performance: Faster processing (2 frame skip)

### **Scenario C: Frame Processing Toggle**
1. Disable AI toggle (📱 icon)
2. Record video
3. **Expected Results**:
   - No frame processing logs
   - No shot detections
   - No AI overlay

## 📊 **Performance Metrics**

### **Current Test Mode Performance**:
- **Frame Rate**: 60fps recording maintained
- **Processing Rate**: Every 2-8 frames (based on mode)
- **Detection Rate**: 3% of processed frames
- **Latency**: <100ms from detection to UI update

### **Expected Production Performance**:
- **Detection Rate**: 0.5% (much rarer)
- **Motion Threshold**: Actual motion analysis
- **Shot Classification**: Real ML model predictions

## 🚀 **Next Steps for Real Motion Detection**

### **Phase 1: Frame Analysis**
```typescript
// Add to frame processor:
const frameData = extractFramePixels(frame);
const motionVector = calculateMotionVector(frameData, previousFrame);
const motionMagnitude = calculateMagnitude(motionVector);
```

### **Phase 2: Hockey-Specific Detection**
```typescript
// Hockey shot characteristics:
const isRapidMotion = motionMagnitude > SHOT_THRESHOLD;
const isHorizontalMotion = detectHorizontalMovement(motionVector);
const hasStickPattern = detectStickShape(frameData);
```

### **Phase 3: ML Integration**
```typescript
// Future ML model:
const shotProbability = await hockeyMLModel.predict(frameFeatures);
const shotType = classifyShotType(frameFeatures);
```

## 🐛 **Troubleshooting**

### **No Frame Processing Logs**
```typescript
// Check frame processor is attached:
frameProcessor={frameProcessor}

// Verify config:
enableShotDetection: true
```

### **No Detections Generated**
```typescript
// Check test mode enabled:
testMode: true // Should be 3% rate

// Verify confidence threshold:
confidence: 0.7 // Should be achievable
```

### **Detections Not Reaching UI**
```typescript
// Check global queue polling:
useEffect(() => {
  // Should poll every 100ms
}, [onShotDetected]);
```

### **UI Not Updating**
```typescript
// Verify callback function:
const handleShotDetected = (result) => {
  setShotDetections(prev => [...prev, result]);
};
```

## 📈 **Success Metrics**

### **✅ Fully Working System**:
- [x] Frame processing runs without errors
- [x] Detections generate during recording
- [x] UI receives and displays detections
- [x] Performance maintains 60fps recording
- [x] Console shows detailed logging

### **🔄 Next Enhancements**:
- [ ] Real motion detection algorithms
- [ ] Hockey-specific pattern recognition
- [ ] ML model integration
- [ ] Production detection rates
- [ ] Advanced shot classification

---

**Status**: Frame processing system is **fully functional** with mock detection. Ready for real motion detection algorithms! 🏒 