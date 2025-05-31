# Smart Hockey Coach - Development Roadmap (Updated January 2025)

## Phase 0: Project Setup ✅ (Completed)

### Environment Setup
- [x] Create GCP account and enable billing
- [x] Create Convex account (start with free tier)
- [x] Set up GitHub repository with branch protection
- [x] Install development tools (Node.js, Expo CLI, Android Studio, Xcode)
- [x] Create Apple Developer and Google Play Console accounts

### Initial Configuration
- [x] Initialize Expo project with TypeScript
- [x] Set up Convex: `npx convex init`
- [x] Configure ESLint, Prettier, and Husky for code quality
- [x] Set up environment files (.env.development, .env.staging, .env.production)
- [x] Create basic CI/CD pipeline (GitHub Actions)

## Phase 0.5: Expo MVP & Migration Decision ✅ (Completed)

### Expo MVP Development
- [x] Install core dependencies (Expo Router, Zustand, React Native components)
- [x] Create navigation structure (Home, Recording, Analysis screens)
- [x] Implement basic camera adapter with expo-camera fallbacks
- [x] Build mock video recording functionality
- [x] Create compatibility layers for Expo Go limitations
- [x] Set up storage adapters (AsyncStorage → MMKV)
- [x] Implement mock ML/TensorFlow integration

### Architecture Assessment
- [x] Identify Expo limitations for hockey shot analysis
- [x] Document VisionCamera requirements vs expo-camera capabilities
- [x] Evaluate real-time video processing needs
- [x] Research ML performance requirements (TensorFlow Lite vs web)
- [x] Create migration plan to React Native
- [x] Document technical debt and compatibility issues

**Key Finding: Expo cannot deliver core value proposition (real-time shot analysis)**

---

## 🚨 STRATEGIC PIVOT: EXPO → REACT NATIVE MIGRATION

**Decision Date:** January 2025  
**Rationale:** Advanced camera capabilities and real-time ML processing required for hockey coaching  
**Migration Plan:** See `docs/EXPO-TO-RN-MIGRATION.md`

---

## Phase 1: React Native Migration ✅ (COMPLETED - January 2025)

### ✅ Foundation Migration (Completed)
- [x] Initialize new React Native project with TypeScript
- [x] Configure React Native 0.79.2 with New Architecture (Fabric + TurboModules)
- [x] Enable Hermes JavaScript engine for optimal performance
- [x] Set up iOS build pipeline with CocoaPods
- [x] Fix Xcode workspace configuration (.xcworkspace vs .xcodeproj)
- [x] Create Cursor rules to prevent common React Native mistakes

### ✅ Dependencies & Infrastructure (Completed)
- [x] Install and configure react-native-vision-camera (4.6.4)
- [x] Enable Frame Processors with react-native-worklets-core
- [x] Install React Navigation (@react-navigation/native, @react-navigation/stack)
- [x] Set up high-performance storage (react-native-mmkv)
- [x] Configure AsyncStorage for compatibility
- [x] Add safe area handling (react-native-safe-area-context)
- [x] Install react-native-screens for navigation optimization

### ✅ Platform Configuration (Completed)
- [x] Configure iOS permissions (camera, microphone)
- [x] Set up Babel config with worklets plugin
- [x] Configure Metro bundler for Frame Processors
- [x] Test iOS Simulator build pipeline
- [x] Verify VisionCamera integration and Frame Processors enabled

**✅ MIGRATION MILESTONE ACHIEVED: Professional React Native foundation with VisionCamera and real-time processing capabilities**

---

## Phase 2: Core Camera Implementation (Current Phase - Week 1)

### 🔄 Week 1: Basic Camera Functionality
- [ ] **Camera Screen Development**
  - [ ] Create VisionCamera component with device detection
  - [ ] Implement camera permissions flow
  - [ ] Build camera preview UI with hockey-focused controls
  - [ ] Add camera flip (front/back) functionality
  - [ ] Test camera on iOS Simulator and device

- [ ] **Video Recording**
  - [ ] Implement 60fps video recording (1080p)
  - [ ] Add recording start/stop controls with haptic feedback
  - [ ] Create recording indicator UI
  - [ ] Implement video file management (save to documents)
  - [ ] Test video quality and performance

- [ ] **Basic Navigation**
  - [ ] Replace default React Native screen with hockey app structure
  - [ ] Create main navigation (Home → Camera → Playback)
  - [ ] Implement basic screen transitions
  - [ ] Add loading states and error handling

**Week 1 Goal: Working camera app that can record 60fps hockey footage**

### 🔄 Week 2: Video Playback & Storage
- [ ] **Video Playback Component**
  - [ ] Create video player with controls (play/pause/scrub)
  - [ ] Implement slow-motion playback for technique analysis
  - [ ] Add frame-by-frame navigation
  - [ ] Design hockey-focused playback UI

- [ ] **Storage Management**
  - [ ] Implement video file organization (by date/session)
  - [ ] Add video metadata storage (date, duration, quality)
  - [ ] Create video library browsing
  - [ ] Implement delete/share functionality

- [ ] **Performance Optimization**
  - [ ] Optimize video compression for storage
  - [ ] Implement background video processing
  - [ ] Add memory management for large video files
  - [ ] Test with multiple hockey shot recordings

**Week 2 Goal: Complete camera + playback workflow for hockey analysis**

## Phase 3: Frame Processing & Shot Detection (Week 3-4)

### 🔄 Week 3: Basic Frame Processing
- [ ] **Frame Processor Setup**
  - [ ] Create basic frame processor for VisionCamera
  - [ ] Implement frame extraction during recording
  - [ ] Add frame rate optimization (analyze every Nth frame)
  - [ ] Test frame processing performance impact

- [ ] **Motion Detection**
  - [ ] Implement basic motion detection in frames
  - [ ] Create hockey stick movement detection algorithms
  - [ ] Add shot timing detection (windup → release)
  - [ ] Build visual indicators for detected motion

- [ ] **Video Segmentation**
  - [ ] Automatically detect shot moments in recording
  - [ ] Extract 2-3 second clips around detected shots
  - [ ] Create shot timeline visualization
  - [ ] Implement manual shot marking as backup

**Week 3 Goal: Real-time shot detection during recording**

### 🔄 Week 4: Advanced Analysis Preparation
- [ ] **TensorFlow Lite Integration**
  - [ ] Install react-native-fast-tflite
  - [ ] Create basic model runner for frame analysis
  - [ ] Test TFLite performance on hockey footage
  - [ ] Prepare for custom hockey model integration

- [ ] **Hockey-Specific Detection**
  - [ ] Research hockey shot recognition models
  - [ ] Implement puck tracking in frames
  - [ ] Add stick position analysis
  - [ ] Create hockey stance detection

- [ ] **Analysis Data Structure**
  - [ ] Design shot analysis data schema
  - [ ] Create local storage for analysis results
  - [ ] Build analysis result UI components
  - [ ] Prepare for backend integration

**Week 4 Goal: Foundation for AI-powered hockey analysis**

## Phase 4: Backend Integration & AI Analysis (Week 5-6)

### 🔄 Week 5: Convex Backend Setup
- [ ] **Backend Infrastructure**
  - [ ] Update Convex schema for hockey video analysis
  - [ ] Create video upload endpoints
  - [ ] Implement user authentication system
  - [ ] Set up file storage for video clips

- [ ] **Gemini Integration v1**
  - [ ] Obtain Gemini Developer API key
  - [ ] Create hockey analysis prompts
  - [ ] Build basic shot analysis action
  - [ ] Test with real hockey footage

**Week 5 Goal: End-to-end video upload and basic AI analysis**

### 🔄 Week 6: Real-time AI Feedback
- [ ] **Fast Analysis Pipeline**
  - [ ] Implement quick shot analysis for 2-3s clips
  - [ ] Create streaming analysis updates
  - [ ] Build progressive feedback UI
  - [ ] Target <5 second analysis time

- [ ] **Hockey Coaching Intelligence**
  - [ ] Develop hockey-specific analysis prompts
  - [ ] Implement technique scoring system
  - [ ] Add drill recommendations
  - [ ] Create improvement suggestions

**Week 6 Goal: Real-time hockey coaching feedback**

## Phase 5: Professional UX & Polish (Week 7-8)

### 🔄 Week 7: Hockey Coach UX
- [ ] **Professional Interface**
  - [ ] Design hockey-focused UI theme
  - [ ] Add smooth animations (Reanimated)
  - [ ] Implement haptic feedback for shots
  - [ ] Create coaching progression system

- [ ] **Analysis Visualization**
  - [ ] Build shot technique breakdown UI
  - [ ] Add video overlay with analysis markers
  - [ ] Create progress tracking dashboard
  - [ ] Implement skill level assessments

### 🔄 Week 8: Performance & Testing
- [ ] **Optimization**
  - [ ] Optimize video processing pipeline
  - [ ] Improve battery life during recording
  - [ ] Enhance frame processing performance
  - [ ] Memory leak prevention and cleanup

- [ ] **Quality Assurance**
  - [ ] Test with diverse hockey players
  - [ ] Validate analysis accuracy
  - [ ] Performance testing on older devices
  - [ ] User experience testing

**Phase 5 Goal: Professional hockey coaching app ready for beta**

## Phase 6: Beta Testing (Week 9-10)

### 🔄 Week 9: Beta Preparation
- [ ] Recruit 50-100 hockey players for testing
- [ ] Set up TestFlight and Play Console beta
- [ ] Create onboarding for hockey players
- [ ] Implement analytics and feedback collection

### 🔄 Week 10: Beta Iterations
- [ ] Fix critical bugs from hockey community
- [ ] Optimize analysis based on real footage
- [ ] Implement top user-requested features
- [ ] Prepare production launch plan

**Phase 6 Goal: Validated product with positive hockey community feedback**

## Phase 7: Production Launch (Week 11)

### Production Deployment
- [ ] Deploy to App Store and Google Play
- [ ] Launch marketing to hockey community
- [ ] Monitor system performance
- [ ] Support hockey users

**Phase 7 Goal: Smart Hockey Coach live with growing user base**

---

## Current Status (January 2025)

### ✅ What's Complete
- **React Native Foundation**: Professional setup with New Architecture
- **VisionCamera Integration**: 60fps recording capability with Frame Processors
- **Build Pipeline**: iOS builds working, proper workspace configuration
- **Development Workflow**: Cursor rules prevent common mistakes
- **Core Dependencies**: Navigation, storage, camera all installed and configured

### 🎯 What's Next (This Week)
1. **Create camera recording screen** with VisionCamera
2. **Implement basic video recording** (60fps, 1080p)  
3. **Build video playback functionality**
4. **Test with actual hockey shots**

### 📊 Updated Timeline
- **Phase 2-3**: Camera + Frame Processing (Weeks 1-4)
- **Phase 4**: Backend + AI Integration (Weeks 5-6)  
- **Phase 5**: UX Polish (Weeks 7-8)
- **Phase 6**: Beta Testing (Weeks 9-10)
- **Phase 7**: Production Launch (Week 11)

**Total Timeline: 11 weeks from now to production launch**

### 🏒 Success Metrics (Updated)
- **Technical**: 60fps recording, <3s shot detection, <5s AI analysis
- **User**: >4.5 stars, >30% D7 retention, >80% complete analysis
- **Hockey**: >95% shot detection accuracy, meaningful coaching feedback

### 💰 Cost Estimates (Monthly)
- **Development**: Sunk cost (team time)
- **GCP/Vertex AI**: $2,000-5,000 (production)
- **Convex**: $250
- **App Stores**: $25
- **Total**: ~$2,500-5,500/month at scale

---

**Next Action Items:**
1. Create VisionCamera recording screen
2. Implement video file management  
3. Build playback functionality
4. Test with hockey footage

*Roadmap Version: 3.0 (Current Status)*  
*Last Updated: January 2025*  
*Status: Phase 1 Complete ✅, Phase 2 In Progress 🔄*