# Smart Hockey Coach - Project Overview

## Vision

The Smart Hockey Coach is a mobile-native application designed to revolutionize how hockey players analyze and improve their shooting skills. Players can upload or record videos of their various shot types (wrist shots, snapshots, slap shots, backhands).

## Core Features

### AI-Powered Analysis
Using **Gemini 2.5 Pro**'s multi-modal capabilities, the app provides:
- **Shot Outcome Detection**: Goal, miss, save, post, or blocked
- **Technique Analysis**: Form, stick positioning, release mechanics, shooting angles, and footwork
- **Biomechanics Review**: Weight transfer, core engagement, hand positioning
- **Real-time Feedback**: Initial feedback within 3 seconds of shot attempt

### Personalized Experience
- **Coaching Styles**: Choose from serious, motivational, or pro-level feedback delivery
- **Progress Tracking**: Monitor improvement over time
- **Drill Recommendations**: Targeted exercises for specific improvement areas

## Technical Architecture

### Technology Stack
- **Mobile**: React Native (iOS & Android)
- **Backend**: Convex (real-time serverless)
- **AI**: Gemini 2.5 Pro via Vertex AI (production) or Developer API (prototype)
- **On-Device ML**: TensorFlow Lite for shot detection

### Performance Goals
- **Instant Feedback**: <500ms on-device shot detection
- **Fast Feedback**: <3 seconds for basic analysis (outcome/type)
- **Full Analysis**: <8 seconds for first detailed insights
- **Complete Results**: <15 seconds for comprehensive feedback

## Development Phases

### Phase 1: MVP
- Basic shot recording and upload
- Fast feedback implementation
- Core UI/UX flow

### Phase 2: Enhanced Features
- On-device ML integration
- Progressive feedback rendering
- Multiple coaching styles

### Phase 3: Production Scale
- Vertex AI deployment with provisioned throughput
- Performance optimization
- User progress tracking

## Success Metrics
- User engagement with feedback
- Shot improvement over time
- App performance benchmarks
- User retention rates