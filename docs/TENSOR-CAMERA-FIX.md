Integrating Real-Time ML in React Native with VisionCamera and TensorFlow Lite

Recommendation Summary

For real-time on-device ML in a React Native mobile app—specifically the Smart Hockey Coach application—we recommend migrating from Expo’s managed workflow to a bare React Native workflow or using Expo Dev Client with native modules. The ideal setup combines:
	•	React Native VisionCamera for high-performance frame access
	•	TensorFlow Lite via native plugin or wrapper such as react-native-fast-tflite

This setup provides a reliable, cross-platform, high-performance pipeline capable of meeting latency and stability requirements in both development and production.

Why This Approach?
	•	Expo’s managed workflow breaks compatibility with TensorFlow JS (@tensorflow/tfjs-react-native) as of SDK 51 and will be deprecated further in SDK 52
	•	Real-time performance goals (<500ms) cannot be reliably met with Expo Camera and TFJS in managed mode
	•	VisionCamera + TFLite allows for native thread frame processing, GPU acceleration, and stable deployments across Android and iOS

Step-by-Step Implementation

1. Eject or Prebuild

Use either of the following to leave managed-only limitations:

npx expo eject
# or
npx expo prebuild

This creates native iOS/Android projects, enabling native module integration.

2. Install VisionCamera

npm install react-native-vision-camera
cd ios && pod install && cd ..

Follow VisionCamera installation guide, including adding permission strings for camera access.

3. Add Frame Processor Plugin for ML

Use community plugins or create a native module:
	•	Recommended: vision-camera-realtime-object-detection
	•	Or use react-native-fast-tflite

npm install react-native-fast-tflite
cd ios && pod install && cd ..

Use it in a Frame Processor plugin to run inference natively.

4. Resize Frames (Optional but recommended)

If your ML model requires smaller resolution:

npm install vision-camera-resize-plugin

This plugin resizes the camera frame before inference, reducing latency.

5. Load and Run TFLite Model

Bundle the .tflite model in your app or download on launch.

Example with react-native-fast-tflite:

const tflite = useTFLiteModel({ modelPath: 'models/shot_model.tflite' })

const result = await tflite.runModel({ input: resizedFrame })

Handle post-processing and UI updates in JS.

6. Build with EAS or CLI

Use EAS Build or Xcode/Android Studio to build the app with native dependencies:

eas build --platform ios

Ensure native plugins are configured correctly via react-native.config.js or Expo config plugins.

Resources and Research Considered
	•	Expo SDK 51 and expo-camera changelog: removal of legacy camera support
	•	TensorFlow.js GitHub issue #8292
	•	Expo GitHub issue #30060
	•	Performance benchmarks of TFJS + Expo Camera on mid-range devices
	•	React Native VisionCamera documentation
	•	VisionCamera + TFLite community plugin
	•	Software Mansion TFLite tutorial
	•	ONNX Runtime RN alternative
	•	Community demos using pose detection and object detection via VisionCamera

Final Note

This approach ensures:
	•	Stable native access to camera frames
	•	Real-time inference using hardware acceleration
	•	Full control over pipeline customization
	•	Long-term viability beyond Expo SDK 52

For production apps like Smart Hockey Coach requiring tight latency and high reliability, this is the most future-proof and technically sound strategy.