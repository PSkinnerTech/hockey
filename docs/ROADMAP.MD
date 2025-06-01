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
- [x] Enable Frame Processors with react-native-worklets-core (1.5.0)
- [x] Install React Navigation (@react-navigation/native v7.1.10, @react-navigation/stack v7.3.3)
- [x] Set up high-performance storage (react-native-mmkv 3.2.0)
- [x] Configure AsyncStorage for compatibility (@react-native-async-storage/async-storage 2.1.2)
- [x] Add safe area handling (react-native-safe-area-context 5.4.1)
- [x] Install react-native-screens (4.11.1) for navigation optimization
- [x] Add react-native-permissions (5.4.1) for comprehensive permission handling

### ✅ Platform Configuration (Completed)
- [x] Configure iOS permissions (camera, microphone)
- [x] Set up Babel config with worklets plugin and VisionCamera compatibility
- [x] Configure Metro bundler for Frame Processors
- [x] Test iOS Simulator build pipeline
- [x] Verify VisionCamera integration and Frame Processors enabled

**✅ MIGRATION MILESTONE ACHIEVED: Professional React Native foundation with VisionCamera and real-time processing capabilities**

---

## Phase 2: Core Camera Implementation ✅ (COMPLETED - January 2025)

### ✅ Week 1: Basic Camera Functionality (COMPLETED)
- [x] **CameraScreen Development**
  - [x] Create VisionCamera component with device detection (back/front camera)
  - [x] Implement camera permissions flow with user-friendly UI
  - [x] Build camera preview UI with hockey-focused controls
  - [x] Add shot guidelines and recording indicator
  - [x] Test camera on iOS Simulator and physical device (Patrick's iPhone 15)

- [x] **Video Recording**
  - [x] Implement 60fps video recording (1080p)
  - [x] Add recording start/stop controls with visual feedback
  - [x] Create recording indicator UI with REC animation
  - [x] Implement video file management (save with timestamps)
  - [x] Test video quality and performance on device

- [x] **Advanced Permissions System**
  - [x] Integrate react-native-permissions (5.4.1) for microphone access
  - [x] Implement explicit permission request flow
  - [x] Handle permission states (granted/denied/blocked/unavailable)
  - [x] Add graceful fallback to video-only recording
  - [x] Provide Settings guidance for blocked permissions

- [x] **Navigation & Project Structure**
  - [x] Replace default React Native screen with hockey app structure
  - [x] Create main navigation (HomeScreen → CameraScreen → PlaybackScreen)
  - [x] Implement TypeScript-safe navigation with RootStackParamList
  - [x] Add loading states and error handling
  - [x] Create HomeScreen with hockey-themed UI

- [x] **iOS Configuration & Deployment**
  - [x] Update bundle identifier to com.pskinnertech.smarthockeycoach
  - [x] Configure Podfile with 225 CocoaPods dependencies
  - [x] Fix iOS build pipeline and deployment
  - [x] Successfully deploy and test on Patrick's iPhone 15
  - [x] Verify camera and microphone functionality on device

**✅ WEEK 1 MILESTONE ACHIEVED: Working camera app that records 60fps hockey footage with professional permissions handling**

### 🎯 Week 2: Video Playback & Storage (✅ COMPLETE - 150% Achievement)
- [x] **Video Playback Component**
  - [x] Create video player with controls (play/pause/scrub)
  - [x] Implement slow-motion playback for technique analysis (0.25x, 0.5x, 1x, 2x speeds)
  - [x] Add frame-by-frame navigation (1-frame and 10-frame precision at 60fps)
  - [x] Design hockey-focused playback UI (hockey blue theme, auto-hiding controls)

- [x] **Storage Management**
  - [x] Implement video file organization (by date/session with VideoStorageService)
  - [x] Add video metadata storage (date, duration, quality, file size, audio status)
  - [x] Create video library browsing (VideoLibraryScreen with grid view, multi-select)
  - [x] Implement delete functionality (batch operations)
  - [x] Implement share functionality (native sharing with react-native-share)

- [x] **Critical Bug Fixes & Optimizations**
  - [x] ⚡ MAJOR FIX: Resolved audio session conflicts between react-native-video and react-native-vision-camera
  - [x] Added `disableAudioSessionManagement={true}` to video player
  - [x] Simplified camera audio session management
  - [x] Installed react-native-fs (2.20.0) for robust file operations
  - [x] Created comprehensive local storage architecture with scalability plan

- [x] **BONUS: Complete Video Management Workflow** 
  - [x] Camera → Auto-save → Library browsing integration
  - [x] Professional VideoLibraryScreen with statistics and empty states
  - [x] Full sharing system (shareUtils) with single/multiple video support
  - [x] Enhanced navigation flow across all screens

**✅ WEEK 2 MILESTONE ACHIEVED: Complete professional video management system with advanced playback, storage, and sharing**

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
  - [ ] Add smooth animations (react-native-reanimated 3.18.0)
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
- **React Native Foundation**: Professional setup with New Architecture (Fabric + TurboModules) + Hermes
- **VisionCamera Integration**: 60fps recording with Frame Processors enabled
- **Complete Camera System**: CameraScreen with recording, permissions, device detection
- **Microphone Permissions**: react-native-permissions (5.4.1) with iOS permission handling
- **Navigation System**: TypeScript-safe React Navigation with HomeScreen/CameraScreen/PlaybackScreen
- **iOS Deployment**: Successfully builds and runs on Patrick's iPhone 15
- **Build Pipeline**: 225 CocoaPods dependencies, proper workspace configuration
- **Phase 2 Week 1**: ✅ COMPLETE - Basic camera functionality working
- **⚡ MAJOR BREAKTHROUGH**: Audio session conflict resolution (react-native-video vs react-native-vision-camera)
- **Advanced Video Playback**: HockeyVideoPlayer with slow-motion (0.25x-2x), frame-by-frame navigation, hockey UI
- **Professional Storage**: VideoStorageService with metadata, file organization, scalability architecture
- **Phase 2 Week 2**: ✅ COMPLETE - 150% Achievement with complete video management workflow
- **Complete Video Management**: VideoLibraryScreen, sharing system, camera integration, professional UX
- **🎯 PHASE 2 FULLY COMPLETE**: Ready for Phase 3 Frame Processing & Shot Detection

### 🎯 What's Next (Phase 3 Ready)
1. **Begin Frame Processing & Shot Detection** - Week 3 implementation
2. **VisionCamera Frame Processors** - Real-time video analysis foundation
3. **Hockey Shot Detection Algorithms** - Motion detection and timing analysis
4. **Performance optimization** - Frame processing without impacting recording
5. **Shot timeline visualization** - UI integration for detected shots

### 📊 Updated Timeline
- **Phase 1**: React Native Migration ✅ COMPLETE
- **Phase 2 Week 1**: Basic Camera Functionality ✅ COMPLETE  
- **Phase 2 Week 2**: Video Playback & Storage ✅ COMPLETE - 150% Achievement
- **🎯 PHASE 3**: Frame Processing (Weeks 3-4) - READY TO BEGIN
- **Phase 4**: Backend + AI Integration (Weeks 5-6)  
- **Phase 5**: UX Polish (Weeks 7-8)
- **Phase 6**: Beta Testing (Weeks 9-10)
- **Phase 7**: Production Launch (Week 11)

**Total Timeline: 10 weeks from now to production launch**

### 🏒 Success Metrics (Updated)
- **Technical**: ✅ 60fps recording achieved, targeting <500ms shot detection, <5s AI analysis
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
1. ✅ Create VisionCamera recording screen - COMPLETE
2. ✅ Implement video file management - COMPLETE  
3. ✅ Build video playback functionality with controls - COMPLETE
4. ✅ Add slow-motion analysis features - COMPLETE
5. ✅ Resolve audio session conflicts - COMPLETE ⚡ MAJOR FIX
6. ✅ Create video library browsing screen - COMPLETE
7. ✅ Complete share functionality implementation - COMPLETE
8. ✅ Test complete camera → storage → playback → library workflow - COMPLETE
9. 🎯 Begin Phase 3: Frame Processing & Shot Detection
10. 🎯 Implement VisionCamera Frame Processors for real-time analysis

*Roadmap Version: 5.0 (Phase 2 Complete - Ready for Real-time Analysis)*  
*Last Updated: January 2025*  
*Status: Phase 2 Complete ✅ | Phase 3 Ready 🎯 | Professional Video Management System Deployed 🏆*