# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Smart Hockey Coach - A React Native mobile app for real-time hockey shot analysis using AI (Gemini 2.5 Pro). The app provides instant shooting technique feedback through on-device ML and cloud-based analysis.

## Development Commands

```bash
# Initial setup
npx react-native init SmartHockeyCoach --template react-native-template-typescript
npx convex init

# Development
npm start                   # Start Metro bundler
npm run ios                 # Run on iOS simulator
npm run android            # Run on Android emulator
npx convex dev             # Start Convex dev server

# Testing
npm test                   # Run unit tests
npm run test:integration   # Run integration tests
npm run test:e2e          # Run E2E tests with Detox

# Build
npm run build:ios         # Build iOS app
npm run build:android     # Build Android app

# Deployment
npx convex deploy --deployment prod
```

## Architecture

### Tech Stack
- **Mobile**: React Native + TypeScript
- **State**: Zustand with subscribeWithSelector
- **Backend**: Convex (real-time serverless)
- **AI**: Gemini 2.5 Pro (dev) / Vertex AI (prod)
- **On-Device ML**: TensorFlow Lite

### Code Organization
```
src/
├── components/     # Reusable UI components
├── screens/        # App screens (Home, Recording, Analysis)
├── hooks/          # Custom React hooks
├── stores/         # Zustand state stores
├── lib/            # Utilities and helpers
├── types/          # TypeScript type definitions
└── constants/      # App constants

convex/
├── schema.ts       # Database schema
├── _generated/     # Auto-generated types
└── [features]/     # Feature-based organization
```

### Key Patterns

1. **Result Pattern** - Use for all async operations:
```typescript
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };
```

2. **Progressive Feedback System**:
   - Instant (<500ms): On-device ML detection
   - Fast (<3s): Minimal video analysis
   - Full (<15s): Comprehensive coaching

3. **Performance Requirements**:
   - 60 FPS animations
   - <2s app launch time
   - <200MB memory during recording

### Critical Rules
- Never use `any` type or `@ts-ignore`
- Always use Result pattern for async operations
- Test on both iOS 13+ and Android 8+
- Follow progressive rendering strategies

## Current Status

Project is in documentation phase. Implementation follows the 12-week roadmap in docs/ROADMAP.MD starting with MVP (weeks 1-3):
- Week 1: Core infrastructure setup
- Week 2: MVP features (recording, basic analysis)
- Week 3: Testing and polish

Refer to docs/ for detailed specifications on architecture, deployment, and requirements.