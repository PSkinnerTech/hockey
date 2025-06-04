#!/bin/bash
# secure-deploy.sh
# A secure deployment script that uses environment variables instead of hardcoded credentials

# Exit on error
set -e

# Function to check if required environment variables are set
check_env_vars() {
  local missing_vars=()
  for var in "$@"; do
    if [[ -z "${!var}" ]]; then
      missing_vars+=("$var")
    fi
  done
  
  if [[ ${#missing_vars[@]} -gt 0 ]]; then
    echo "Error: The following required environment variables are not set:"
    for var in "${missing_vars[@]}"; do
      echo "- $var"
    done
    echo "Please run the setup-deployment-env.sh script first or set these variables manually."
    exit 1
  fi
}

# Display help
show_help() {
  echo "Usage: ./secure-deploy.sh [options]"
  echo ""
  echo "Options:"
  echo "  --env <environment>      Specify environment (development, staging, production)"
  echo "  --ios                    Build and deploy iOS app"
  echo "  --android                Build and deploy Android app"
  echo "  --backend                Deploy Convex backend"
  echo "  --help                   Show this help message"
  echo ""
  echo "Example:"
  echo "  ./secure-deploy.sh --env production --ios --android --backend"
}

# Parse arguments
ENVIRONMENT=""
DEPLOY_IOS=false
DEPLOY_ANDROID=false
DEPLOY_BACKEND=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)
      ENVIRONMENT="$2"
      shift 2
      ;;
    --ios)
      DEPLOY_IOS=true
      shift
      ;;
    --android)
      DEPLOY_ANDROID=true
      shift
      ;;
    --backend)
      DEPLOY_BACKEND=true
      shift
      ;;
    --help)
      show_help
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

# Validate environment
if [[ -z "$ENVIRONMENT" ]]; then
  echo "Error: Environment not specified. Use --env option."
  show_help
  exit 1
fi

case "$ENVIRONMENT" in
  development|staging|production)
    # Valid environment
    ENV_FILE=".env.$ENVIRONMENT"
    ;;
  *)
    echo "Error: Invalid environment '$ENVIRONMENT'. Use development, staging, or production."
    exit 1
    ;;
esac

# Load environment variables
if [[ -f "$ENV_FILE" ]]; then
  echo "Loading environment from $ENV_FILE..."
  export $(grep -v '^#' "$ENV_FILE" | xargs)
else
  echo "Error: Environment file $ENV_FILE not found."
  echo "Please run the setup-deployment-env.sh script first."
  exit 1
fi

# Deploy Convex backend
if [[ "$DEPLOY_BACKEND" == true ]]; then
  echo "=========================================="
  echo "Deploying Convex backend to $ENVIRONMENT"
  echo "=========================================="
  
  # Check required environment variables
  check_env_vars "CONVEX_URL"
  
  # Set deployment target
  CONVEX_DEPLOYMENT_TARGET="dev"
  if [[ "$ENVIRONMENT" == "staging" ]]; then
    CONVEX_DEPLOYMENT_TARGET="staging"
  elif [[ "$ENVIRONMENT" == "production" ]]; then
    CONVEX_DEPLOYMENT_TARGET="prod"
  fi
  
  # Deploy to Convex
  echo "Deploying to Convex ($CONVEX_DEPLOYMENT_TARGET)..."
  npx convex deploy --deployment "$CONVEX_DEPLOYMENT_TARGET"
  
  # Run initial setup if needed
  if [[ "$ENVIRONMENT" == "production" ]]; then
    echo "Running production setup migrations..."
    npx convex run setup:initialize --deployment prod
    
    echo "Setting up cron jobs..."
    npx convex run scheduling:setupCronJobs --deployment prod
  fi
  
  echo "Convex backend deployment complete."
fi

# Deploy iOS app
if [[ "$DEPLOY_IOS" == true ]]; then
  echo "=========================================="
  echo "Building and deploying iOS app"
  echo "=========================================="
  
  if [[ "$ENVIRONMENT" == "production" ]]; then
    # Check required environment variables
    check_env_vars "APPLE_ID" "APPLE_APP_PASSWORD"
    
    echo "Building iOS app for production..."
    cd ios
    
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
    
    # Upload to App Store Connect using environment variables
    echo "Uploading to App Store Connect..."
    xcrun altool --upload-app \
      -f ./build/SmartHockeyCoach.ipa \
      -t ios \
      -u "$APPLE_ID" \
      -p "$APPLE_APP_PASSWORD"
    
    cd ..
    echo "iOS app deployment complete."
  else
    echo "Skipping iOS production deployment for $ENVIRONMENT environment."
    echo "Run 'npm run ios' for development builds."
  fi
fi

# Deploy Android app
if [[ "$DEPLOY_ANDROID" == true ]]; then
  echo "=========================================="
  echo "Building and deploying Android app"
  echo "=========================================="
  
  if [[ "$ENVIRONMENT" == "production" ]]; then
    # Check required environment variables
    check_env_vars "ANDROID_KEYSTORE_PASSWORD" "ANDROID_KEY_ALIAS" "ANDROID_KEY_PASSWORD"
    
    echo "Building Android app for production..."
    cd android
    
    # Clean
    ./gradlew clean
    
    # Build AAB for Play Store
    ANDROID_KEYSTORE_PASSWORD="$ANDROID_KEYSTORE_PASSWORD" \
    ANDROID_KEY_ALIAS="$ANDROID_KEY_ALIAS" \
    ANDROID_KEY_PASSWORD="$ANDROID_KEY_PASSWORD" \
    ./gradlew bundleRelease
    
    echo "Android app build complete."
    echo "AAB file location: android/app/build/outputs/bundle/release/app-release.aab"
    
    cd ..
    echo "Please upload the AAB manually to the Google Play Console."
  else
    echo "Skipping Android production deployment for $ENVIRONMENT environment."
    echo "Run 'npm run android' for development builds."
  fi
fi

echo "=========================================="
echo "Deployment completed successfully!"
echo "=========================================="