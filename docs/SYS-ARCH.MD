# System Architecture - Smart Hockey Coach

## Architecture Overview

The system implements a staged feedback loop designed to achieve perceived real-time coaching through progressive updates.

## Component Architecture

### 1. Mobile Client (React Native)
- **Video Capture**: Records hockey shots using device camera
- **On-Device ML**: TensorFlow Lite for immediate shot detection
- **Data Processing**: Video segmentation and compression
- **Real-time Updates**: Subscribes to Convex for progressive feedback
- **UI Rendering**: Progressive display of analysis results

### 2. On-Device ML Processor
- **Shot Detection**: Identifies shot attempts in real-time
- **Video Segmentation**: Extracts relevant video portions
- **Instant Feedback**: Provides immediate UI confirmation
- **Data Optimization**: Prepares video for efficient upload

### 3. Convex Backend
- **HTTP Endpoints**: Receives video uploads
- **Job Queue**: Manages Fast Path and Full Path analysis tasks
- **Real-time Sync**: Pushes updates to connected clients
- **Data Storage**: Stores shots metadata and feedback results
- **Worker Functions**: Handles Gemini API communication

### 4. Gemini Integration
- **Development**: Gemini 2.5 Pro Developer API
- **Production**: Vertex AI with provisioned throughput
- **Streaming**: JSON responses for progressive rendering
- **Error Handling**: Retry logic and fallback strategies

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile App (React Native)                 │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────┐     ┌──────────────────┐                │
│  │ Video Capture │ ──> │ On-Device ML     │                │
│  │    Module     │     │   Processor      │                │
│  └───────────────┘     └────────┬─────────┘                │
│                                  │                           │
│                      ┌───────────▼──────────────┐           │
│                      │  Shot Detected:          │           │
│                      │  • Instant UI Feedback   │           │
│                      │  • Video Segmentation    │           │
│                      └───────────┬──────────────┘           │
│                                  │                           │
│              ┌───────────────────┴────────────────┐         │
│              │           Upload Module            │         │
│              │  • Fast Path: 0.5-1.5s clip       │         │
│              │  • Full Path: 1-3s clip           │         │
│              └───────────────────┬────────────────┘         │
└──────────────────────────────────┼──────────────────────────┘
                                   │ HTTPS/gRPC
                                   ▼
┌─────────────────────────────────────────────────────────────┐
│                        Convex Backend                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐     ┌────────────────────┐           │
│  │ HTTP Endpoint:   │ ──> │    Job Queue:      │           │
│  │ receiveShotData  │     │ • Fast Feedback    │           │
│  └──────────────────┘     │ • Full Feedback    │           │
│                           └─────────┬──────────┘           │
│                                     │                       │
│              ┌──────────────────────┴────────────┐         │
│              │         Worker Functions          │         │
│              │  • processFastFeedback           │         │
│              │  • processFullFeedback           │         │
│              └──────────────────────┬────────────┘         │
└─────────────────────────────────────┼───────────────────────┘
                                      │ API Calls
                                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Gemini 2.5 Pro API                        │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────────┐     ┌─────────────────────┐        │
│  │  Developer API     │     │    Vertex AI        │        │
│  │  (Prototyping)     │     │ (Production Scale)  │        │
│  └────────────────────┘     └─────────────────────┘        │
│                                                              │
│  • Streamed JSON responses                                  │
│  • Fast Path: <100 tokens                                   │
│  • Full Path: ~1500 tokens                                  │
└──────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. Staged Feedback Approach
- **Instant**: On-device confirmation (<500ms)
- **Fast**: Basic analysis from minimal data (<3s)
- **Full**: Comprehensive coaching feedback (<15s)

### 2. Real-time Architecture
- Convex provides real-time database synchronization
- Streaming responses enable progressive UI updates
- Subscriptions eliminate polling overhead

### 3. Dual Processing Paths
- **Fast Path**: Ultra-short clips for immediate insights
- **Full Path**: Longer clips for detailed analysis
- Paths can run concurrently for optimal UX

### 4. Production Scalability
- Vertex AI provisioned throughput ensures consistent latency
- Convex serverless functions scale automatically
- On-device processing reduces server load