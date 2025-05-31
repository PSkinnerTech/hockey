# Smart Hockey Coach - Development Roadmap

## Phase 0: Project Setup (Week 1)

### Environment Setup
- [x] Create GCP account and enable billing
- [x] Create Convex account (start with free tier)
- [ ] Set up GitHub repository with branch protection
- [ ] Install development tools (Node.js, React Native CLI, Android Studio, Xcode)
- [ ] Create Apple Developer and Google Play Console accounts

### Initial Configuration
- [ ] Initialize React Native project: `npx react-native init SmartHockeyCoach --template react-native-template-typescript`
- [ ] Set up Convex: `npx convex init`
- [ ] Configure ESLint, Prettier, and Husky for code quality
- [ ] Set up environment files (.env.development, .env.staging, .env.production)
- [ ] Create basic CI/CD pipeline (GitHub Actions)

## Phase 1: MVP Foundation (Weeks 2-3)

### Mobile App Base
- [ ] Install core dependencies (React Navigation, Zustand, UI Kitten)
- [ ] Create navigation structure (Home, Recording, Analysis screens)
- [ ] Implement camera module with react-native-camera
- [ ] Build basic video recording functionality (30s max)
- [ ] Create simple video playback component

### Convex Backend Base
- [ ] Define initial database schema (users, shots, feedbackResults)
- [ ] Create HTTP endpoint for video upload (receiveShotData)
- [ ] Implement basic authentication (Clerk or Convex Auth)
- [ ] Set up file storage integration (Convex storage or GCS)
- [ ] Deploy to Convex dev environment

### Gemini Integration v1
- [ ] Obtain Gemini Developer API key
- [ ] Create Gemini client wrapper in Convex
- [ ] Implement basic shot analysis action (analyzeShotBasic)
- [ ] Test with simple prompt returning JSON
- [ ] Display basic feedback in mobile app

**Milestone: Basic video upload and AI analysis working end-to-end**

## Phase 2: Real-time Feedback (Weeks 4-5)

### On-Device ML
- [ ] Research and select TFLite model for shot detection
- [ ] Integrate react-native-tensorflow-lite
- [ ] Implement frame-by-frame shot detection during recording
- [ ] Add visual indicator when shot detected
- [ ] Extract video segments based on detection

### Fast Path Implementation
- [ ] Create video segmentation logic (0.5-1.5s clips)
- [ ] Implement dual upload paths (fast + full)
- [ ] Create analyzeShotFastPath action with streaming
- [ ] Design and implement fast feedback prompts
- [ ] Build progressive UI for fast feedback display

### Streaming Infrastructure
- [ ] Implement Convex streaming updates
- [ ] Create Zustand store for progressive state
- [ ] Build React components with skeleton loaders
- [ ] Add real-time subscriptions in mobile app
- [ ] Test end-to-end streaming latency

**Milestone: <3 second fast feedback working**

## Phase 3: Full Analysis (Weeks 6-7)

### Comprehensive Feedback
- [ ] Create detailed analysis prompts (technical, motivational, pro styles)
- [ ] Implement analyzeShotFullPath with all feedback sections
- [ ] Build progressive parsing for complex JSON
- [ ] Create UI components for each feedback section
- [ ] Add drill recommendations and biomechanics display

### Performance Optimization
- [ ] Implement video compression (target sizes: fast <1MB, full <5MB)
- [ ] Add network-aware quality selection
- [ ] Optimize Convex function cold starts
- [ ] Implement caching for common responses
- [ ] Profile and optimize React Native rendering

### User Experience
- [ ] Add haptic feedback for shot detection
- [ ] Implement smooth animations (React Native Reanimated)
- [ ] Create error states and offline handling
- [ ] Add video replay with analysis overlay
- [ ] Build settings screen for coaching style selection

**Milestone: Full analysis with <15s complete feedback**

## Phase 4: Production Prep (Weeks 8-9)

### Vertex AI Migration
- [ ] Create GCP project for production
- [ ] Deploy Gemini 2.5 Pro to Vertex AI endpoint
- [ ] Configure provisioned throughput (min: 2 replicas)
- [ ] Create service account with proper permissions
- [ ] Update Convex to use Vertex AI in production

### Testing Suite
- [ ] Write unit tests for critical functions (>80% coverage)
- [ ] Create integration tests for API endpoints
- [ ] Implement E2E tests with Detox
- [ ] Perform load testing on Vertex AI endpoint
- [ ] Conduct security audit and penetration testing

### Monitoring Setup
- [ ] Configure Sentry for error tracking
- [ ] Set up Google Cloud Monitoring dashboards
- [ ] Implement custom performance metrics
- [ ] Create alerting rules for critical issues
- [ ] Build admin dashboard for system health

**Milestone: Production-ready infrastructure with monitoring**

## Phase 5: Beta Testing (Weeks 10-11)

### Beta Release Preparation
- [ ] Create beta testing plan and recruit 50-100 testers
- [ ] Set up TestFlight (iOS) and Play Console beta track (Android)
- [ ] Implement analytics tracking (Mixpanel/Amplitude)
- [ ] Create in-app feedback mechanism
- [ ] Prepare beta onboarding materials

### Beta Deployment
- [ ] Deploy Convex to production environment
- [ ] Configure production environment variables
- [ ] Build and submit beta apps to stores
- [ ] Monitor initial user sessions closely
- [ ] Create feedback collection spreadsheet

### Beta Iterations
- [ ] Fix critical bugs within 24 hours
- [ ] Implement top 3 user-requested features
- [ ] Optimize based on performance data
- [ ] A/B test coaching styles and UI elements
- [ ] Prepare production launch plan

**Milestone: Stable beta with positive user feedback**

## Phase 6: Production Launch (Week 12)

### Final Preparations
- [ ] Conduct final security review
- [ ] Optimize Vertex AI autoscaling settings
- [ ] Prepare App Store and Play Store listings
- [ ] Create demo video and screenshots
- [ ] Write press release and launch materials

### Production Deployment
- [ ] Deploy final Convex functions
- [ ] Submit apps for App Store review
- [ ] Configure production monitoring alerts
- [ ] Brief support team on common issues
- [ ] Set up automated backup procedures

### Launch Day
- [ ] Monitor all systems closely
- [ ] Respond to user reviews quickly
- [ ] Track key metrics (installs, retention, feedback latency)
- [ ] Address any critical issues immediately
- [ ] Celebrate with the team! 🎉

**Milestone: App live in both stores with stable performance**

## Post-Launch (Ongoing)

### Week 13-14: Stabilization
- [ ] Fix any launch issues
- [ ] Optimize based on real usage patterns
- [ ] Improve low-rated features
- [ ] Plan v1.1 features based on feedback

### Month 2-3: Growth
- [ ] Implement user-requested features
- [ ] Add social sharing capabilities
- [ ] Create coaching progression system
- [ ] Explore team/coach accounts
- [ ] Consider subscription model

### Future Enhancements
- [ ] Multi-angle video analysis
- [ ] Slow-motion replay integration
- [ ] Historical progress tracking
- [ ] Competitive benchmarking
- [ ] Integration with smart pucks/sensors

## Key Success Metrics

### Technical Metrics
- Fast feedback latency: <3 seconds (p95)
- Full analysis completion: <15 seconds (p95)
- App crash rate: <0.5%
- API success rate: >99.5%

### User Metrics
- Day 1 retention: >60%
- Day 7 retention: >30%
- Average session length: >5 minutes
- User satisfaction: >4.5 stars

### Business Metrics
- Beta conversion rate: >40%
- Monthly active users: Growth >20% MoM
- Feature adoption: >70% use detailed analysis
- Support tickets: <5% of DAU

## Risk Mitigation

### Technical Risks
- **Gemini API changes**: Maintain abstraction layer
- **Vertex AI costs**: Monitor usage, implement caps
- **App Store rejection**: Follow guidelines strictly
- **Performance issues**: Extensive testing, gradual rollout

### Business Risks
- **Low user adoption**: Strong beta program, iterate quickly
- **Competitive threats**: Focus on unique AI capabilities
- **Scaling challenges**: Plan infrastructure early
- **Support overwhelm**: Build comprehensive FAQ/docs

## Resource Requirements

### Team (Minimum)
- 1 Full-stack developer (React Native + backend)
- 1 ML/AI engineer (part-time after Phase 1)
- 1 UI/UX designer (part-time)
- 1 QA tester (full-time from Phase 4)
- 1 Product manager (coordinating)

### Budget Estimates
- Development tools/services: $500/month
- GCP/Vertex AI (production): $2,000-5,000/month
- Convex (production): $250/month
- App store fees: $125/year
- Testing devices: $3,000 one-time

## Critical Path Dependencies

```
Phase 0 → Phase 1 → Phase 2 → Phase 3
                      ↓
                   Phase 4 → Phase 5 → Phase 6
```

**Blocking dependencies:**
- Vertex AI setup blocks production deployment
- On-device ML blocks fast feedback
- Beta feedback blocks production features
- App store approval blocks launch

---

Remember: This roadmap is a guide. Adjust timelines based on your team's velocity and user feedback. The key is maintaining momentum while ensuring quality at each milestone.