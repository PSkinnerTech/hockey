# Deployment Guide - Smart Hockey Coach

## Prerequisites

### Required Accounts and Tools
- **Google Cloud Platform** account with billing enabled
- **Convex** account (Pro plan for production)
- **Apple Developer** account ($99/year)
- **Google Play Console** account ($25 one-time)
- **Sentry** account for error monitoring
- **Firebase** account for crash analytics

### Development Environment
```bash
# Required tools
node >= 18.0.0
npm >= 9.0.0
react-native-cli
expo-cli (optional but recommended)
cocoapods >= 1.11.0 (iOS)
java 11 (Android)
android-studio
xcode >= 14.0

# Google Cloud CLI
gcloud CLI
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

## Environment Configuration

### 1. Development Environment
```bash
# .env.development
# Convex
CONVEX_DEPLOYMENT=dev
CONVEX_URL=https://your-app.convex.site

# Gemini API (Development)
GEMINI_API_KEY=your-dev-api-key
GEMINI_MODEL=models/gemini-2.5-pro-preview-0506

# Storage
STORAGE_BUCKET=dev-smart-hockey-coach
STORAGE_REGION=us-central1

# Analytics
SENTRY_DSN=https://dev@sentry.io/project
MIXPANEL_TOKEN=dev-token

# Feature Flags
ENABLE_ON_DEVICE_ML=true
ENABLE_KEYFRAME_FALLBACK=true
MAX_VIDEO_DURATION=30
```

### 2. Staging Environment
```bash
# .env.staging
# Convex
CONVEX_DEPLOYMENT=staging
CONVEX_URL=https://your-app-staging.convex.site

# Vertex AI (Staging)
GCP_PROJECT_ID=smart-hockey-coach-staging
VERTEX_AI_ENDPOINT=projects/PROJECT_ID/locations/us-central1/endpoints/ENDPOINT_ID
VERTEX_AI_MODEL=gemini-2.5-pro

# Storage
STORAGE_BUCKET=staging-smart-hockey-coach
STORAGE_REGION=us-central1

# Monitoring
SENTRY_DSN=https://staging@sentry.io/project
LOG_LEVEL=debug
```

### 3. Production Environment
```bash
# .env.production
# Convex
CONVEX_DEPLOYMENT=prod
CONVEX_URL=https://your-app-prod.convex.site

# Vertex AI (Production)
GCP_PROJECT_ID=smart-hockey-coach-prod
VERTEX_AI_ENDPOINT=projects/PROJECT_ID/locations/us-central1/endpoints/PROD_ENDPOINT_ID
VERTEX_AI_MODEL=gemini-2.5-pro
MIN_REPLICAS=2
MAX_REPLICAS=10

# Storage
STORAGE_BUCKET=prod-smart-hockey-coach
STORAGE_REGION=us-central1

# Monitoring
SENTRY_DSN=https://prod@sentry.io/project
LOG_LEVEL=error
ENABLE_PERFORMANCE_MONITORING=true
```

## Google Cloud Setup

### 1. Create GCP Project
```bash
# Create new project
gcloud projects create smart-hockey-coach-prod \
  --name="Smart Hockey Coach Production"

# Set as active project
gcloud config set project smart-hockey-coach-prod

# Enable required APIs
gcloud services enable \
  aiplatform.googleapis.com \
  storage.googleapis.com \
  cloudbuild.googleapis.com \
  monitoring.googleapis.com \
  logging.googleapis.com
```

### 2. Create Service Account
```bash
# Create service account
gcloud iam service-accounts create smart-hockey-coach-sa \
  --display-name="Smart Hockey Coach Service Account" \
  --description="Service account for Convex backend to access Vertex AI"

# Grant necessary roles
gcloud projects add-iam-policy-binding smart-hockey-coach-prod \
  --member="serviceAccount:smart-hockey-coach-sa@smart-hockey-coach-prod.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding smart-hockey-coach-prod \
  --member="serviceAccount:smart-hockey-coach-sa@smart-hockey-coach-prod.iam.gserviceaccount.com" \
  --role="roles/storage.objectUser"

# Create and download key
gcloud iam service-accounts keys create sa-key.json \
  --iam-account=smart-hockey-coach-sa@smart-hockey-coach-prod.iam.gserviceaccount.com

# Base64 encode for environment variable
base64 sa-key.json > sa-key-base64.txt
```

### 3. Deploy Vertex AI Model
```bash
# Create Vertex AI endpoint
gcloud ai endpoints create \
  --region=us-central1 \
  --display-name="smart-hockey-coach-gemini-prod"

# Get endpoint ID
ENDPOINT_ID=$(gcloud ai endpoints list \
  --region=us-central1 \
  --filter="displayName:smart-hockey-coach-gemini-prod" \
  --format="value(name)")

# Deploy model with provisioned throughput
gcloud ai endpoints deploy-model $ENDPOINT_ID \
  --region=us-central1 \
  --model=projects/PROJECT_ID/locations/us-central1/models/gemini-2-5-pro \
  --display-name="smart-hockey-coach-deployment" \
  --machine-type="n1-standard-8" \
  --accelerator-type="NVIDIA_TESLA_T4" \
  --accelerator-count=1 \
  --min-replica-count=2 \
  --max-replica-count=10 \
  --enable-autoscaling-metric \
  --autoscaling-metric-target=60
```

### 4. Create Storage Buckets
```bash
# Create production bucket
gsutil mb -p smart-hockey-coach-prod \
  -c STANDARD \
  -l US-CENTRAL1 \
  gs://prod-smart-hockey-coach/

# Set lifecycle rules
cat > lifecycle.json << EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {
          "age": 30,
          "matchesPrefix": ["temp/"]
        }
      },
      {
        "action": {"type": "SetStorageClass", "storageClass": "NEARLINE"},
        "condition": {
          "age": 7,
          "matchesPrefix": ["videos/"]
        }
      }
    ]
  }
}
EOF

gsutil lifecycle set lifecycle.json gs://prod-smart-hockey-coach/

# Set CORS policy
cat > cors.json << EOF
[
  {
    "origin": ["https://your-app.com"],
    "method": ["GET", "POST", "PUT"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF

gsutil cors set cors.json gs://prod-smart-hockey-coach/
```

## Convex Deployment

### 1. Initialize Convex Production
```bash
# Login to Convex
npx convex login

# Initialize production deployment
npx convex init --deployment prod

# Set environment variables
npx convex env set VERTEX_AI_ENDPOINT $ENDPOINT_ID --deployment prod
npx convex env set GCP_SERVICE_ACCOUNT_KEY "$(cat sa-key-base64.txt)" --deployment prod
npx convex env set STORAGE_BUCKET "prod-smart-hockey-coach" --deployment prod
```

### 2. Deploy Convex Functions
```bash
# Deploy to production
npx convex deploy --deployment prod

# Run initial setup migrations
npx convex run setup:initialize --deployment prod

# Schedule background tasks
npx convex run scheduling:setupCronJobs --deployment prod
```

### 3. Configure Convex Production Settings
```typescript
// convex/schema.ts - Add production indexes
export default defineSchema({
  users: defineTable({
    // ... fields
  }).index("by_email", ["email"])
    .index("by_created", ["createdAt"]),
    
  shots: defineTable({
    // ... fields
  }).index("by_user_and_time", ["userId", "createdAt"])
    .index("by_status", ["status"])
    .index("by_user_and_status", ["userId", "status"]),
    
  feedbackResults: defineTable({
    // ... fields
  }).index("by_shot", ["shotId"])
    .index("by_shot_and_type", ["shotId", "type"])
});
```

## Mobile App Deployment

### 1. iOS Deployment

#### Configure Xcode Project
```bash
cd ios
pod install

# Update Info.plist
# - Set bundle identifier: com.yourcompany.smarthockeycoach
# - Configure camera permissions
# - Set minimum iOS version to 13.0
```

#### Build and Archive
```bash
# Clean build folder
xcodebuild clean -workspace SmartHockeyCoach.xcworkspace -scheme SmartHockeyCoach

# Archive for App Store
xcodebuild archive \
  -workspace SmartHockeyCoach.xcworkspace \
  -scheme SmartHockeyCoach \
  -configuration Release \
  -archivePath ./build/SmartHockeyCoach.xcarchive

# Export IPA
xcodebuild -exportArchive \
  -archivePath ./build/SmartHockeyCoach.xcarchive \
  -exportPath ./build \
  -exportOptionsPlist exportOptions.plist
```

#### Upload to App Store Connect
```bash
# Using Transporter
xcrun altool --upload-app \
  -f ./build/SmartHockeyCoach.ipa \
  -t ios \
  -u YOUR_APPLE_ID \
  -p YOUR_APP_PASSWORD
```

### 2. Android Deployment

#### Configure Gradle
```gradle
// android/app/build.gradle
android {
    defaultConfig {
        applicationId "com.yourcompany.smarthockeycoach"
        minSdkVersion 26
        targetSdkVersion 33
        versionCode 1
        versionName "1.0.0"
    }
    
    signingConfigs {
        release {
            storeFile file(MYAPP_RELEASE_STORE_FILE)
            storePassword MYAPP_RELEASE_STORE_PASSWORD
            keyAlias MYAPP_RELEASE_KEY_ALIAS
            keyPassword MYAPP_RELEASE_KEY_PASSWORD
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### Build Release APK/AAB
```bash
cd android

# Clean
./gradlew clean

# Build AAB for Play Store
./gradlew bundleRelease

# Or build APK for testing
./gradlew assembleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

## Production Monitoring

### 1. Set Up Cloud Monitoring
```yaml
# monitoring/alerts.yaml
apiVersion: monitoring.googleapis.com/v3
kind: AlertPolicy
metadata:
  name: vertex-ai-high-latency
spec:
  displayName: "Vertex AI High Latency"
  conditions:
    - displayName: "API Latency > 5s"
      conditionThreshold:
        filter: |
          resource.type="aiplatform.googleapis.com/Endpoint"
          metric.type="aiplatform.googleapis.com/prediction/online/latency"
        comparison: COMPARISON_GT
        thresholdValue: 5000
        duration: 300s
  notificationChannels:
    - projects/PROJECT_ID/notificationChannels/CHANNEL_ID
```

### 2. Configure Sentry
```typescript
// Mobile app initialization
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  integrations: [
    new Sentry.ReactNativeTracing({
      routingInstrumentation,
      tracingOrigins: ['localhost', 'your-api.com', /^\//],
    }),
  ],
  beforeSend(event) {
    // Filter sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    return event;
  },
});
```

### 3. Performance Monitoring Dashboard
```typescript
// monitoring/performance-tracker.ts
export class PerformanceTracker {
  static trackAPICall(endpoint: string, duration: number) {
    // Send to monitoring service
    analytics.track('api_performance', {
      endpoint,
      duration,
      timestamp: Date.now(),
      environment: process.env.NODE_ENV,
    });
    
    // Log to Cloud Monitoring
    if (process.env.NODE_ENV === 'production') {
      cloudMonitoring.recordMetric({
        metricType: 'custom.googleapis.com/app/api_latency',
        value: duration,
        labels: { endpoint },
      });
    }
  }
  
  static trackUserFlow(flowName: string, metrics: FlowMetrics) {
    analytics.track('user_flow_completed', {
      flow: flowName,
      ...metrics,
      device: DeviceInfo.getModel(),
      os: Platform.OS,
      osVersion: Platform.Version,
    });
  }
}
```

## Testing Strategy

### 1. Pre-Production Testing
```bash
# Run integration tests against staging
npm run test:integration -- --env=staging

# Load testing with k6
k6 run \
  --vus 100 \
  --duration 30m \
  ./tests/load/vertex-ai-endpoint.js

# Mobile app testing
detox test --configuration ios.release
detox test --configuration android.release
```

### 2. Production Smoke Tests
```typescript
// tests/smoke/production.test.ts
describe('Production Smoke Tests', () => {
  it('should complete full shot analysis flow', async () => {
    const testVideoPath = './fixtures/test-shot.mp4';
    
    // Upload test shot
    const response = await api.uploadShot(testVideoPath);
    expect(response.status).toBe(200);
    
    // Wait for fast feedback
    const fastFeedback = await waitForFeedback(response.shotId, 'fast');
    expect(fastFeedback).toHaveProperty('outcome');
    expect(fastFeedback).toHaveProperty('shotType');
    
    // Wait for full feedback
    const fullFeedback = await waitForFeedback(response.shotId, 'full');
    expect(fullFeedback).toHaveProperty('biomechanics_analysis');
    expect(fullFeedback).toHaveProperty('areas_for_improvement');
  });
});
```

## Rollout Strategy

### 1. Phased Rollout
```javascript
// Phase 1: Internal testing (1 week)
- Deploy to internal testers
- Monitor all metrics closely
- Fix any critical issues

// Phase 2: Beta release (2 weeks)
- 100 beta users
- Gather feedback
- Monitor performance at scale

// Phase 3: Soft launch (1 week)
- 10% of users
- A/B test against old version
- Monitor conversion and retention

// Phase 4: Full launch
- 100% rollout
- Marketing campaign
- Support team ready
```

### 2. Feature Flags
```typescript
// feature-flags.ts
export const FeatureFlags = {
  useVertexAI: process.env.ENABLE_VERTEX_AI === 'true',
  useOnDeviceML: process.env.ENABLE_ON_DEVICE_ML === 'true',
  maxVideoDuration: parseInt(process.env.MAX_VIDEO_DURATION || '30'),
  enableKeyframeFallback: process.env.ENABLE_KEYFRAME_FALLBACK === 'true',
};

// Usage
if (FeatureFlags.useVertexAI) {
  // Use Vertex AI endpoint
} else {
  // Use Developer API fallback
}
```

## Disaster Recovery

### 1. Backup Strategy
```bash
# Automated daily backups
gsutil -m rsync -r gs://prod-smart-hockey-coach/ gs://backup-smart-hockey-coach/

# Database exports
convex export --deployment prod --output ./backups/$(date +%Y%m%d)
```

### 2. Rollback Procedures
```bash
# Convex function rollback
convex deploy --deployment prod --version PREVIOUS_VERSION

# Mobile app rollback
# iOS: Reject binary in App Store Connect and resubmit previous version
# Android: Use staged rollout controls in Play Console

# Vertex AI endpoint rollback
gcloud ai endpoints undeploy-model $ENDPOINT_ID \
  --deployed-model-id=CURRENT_MODEL_ID \
  --region=us-central1

gcloud ai endpoints deploy-model $ENDPOINT_ID \
  --model=PREVIOUS_MODEL_ID \
  --region=us-central1
```

## Post-Deployment Checklist

- [ ] All environment variables configured correctly
- [ ] Vertex AI endpoint responding with correct latency
- [ ] Convex functions deployed and warming schedule active  
- [ ] Mobile apps approved and published to stores
- [ ] Monitoring dashboards configured and accessible
- [ ] Error tracking (Sentry) receiving events
- [ ] Analytics tracking user flows correctly
- [ ] Support documentation updated
- [ ] Team trained on incident response
- [ ] Backup automation verified
- [ ] Load testing completed successfully
- [ ] Security audit passed
- [ ] GDPR/privacy compliance verified