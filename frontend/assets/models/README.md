# Hockey Shot Detection Models

This directory contains TensorFlow Lite models for hockey shot detection.

## Model Files

### shot_detection.tflite (Placeholder)
- **Input**: 224x224x3 RGB image
- **Output**: 2-class probability (no_shot, shot)
- **Size**: ~2MB
- **Inference time**: <50ms on modern devices

## Model Development

When the real model is ready:

1. Place the `.tflite` file in this directory
2. Update the model path in `src/lib/ml/tflite-setup.ts`
3. Verify input/output shapes match the model
4. Test on target devices for performance

## Model Training Data

The model should be trained on:
- Hockey shot videos (positive samples)
- Hockey gameplay without shots (negative samples)
- Various lighting conditions
- Different camera angles
- Multiple players and environments

## Performance Requirements

- Inference time: <100ms
- Accuracy: >90% on test set
- Model size: <5MB for mobile deployment
- Compatible with TensorFlow Lite 2.x

## Current Status

🔄 **Development Mode**: Using mock predictions until real model is available.

The app currently uses mock detection logic that simulates shot detection based on frame variance. This allows for complete UI and performance testing while the ML model is being developed.