#!/bin/bash

# Smart Hockey Coach Dependencies Installation Script
# This script installs all required dependencies for the project

set -e # Exit on error

echo "🏒 Smart Hockey Coach - Installing Dependencies"
echo "============================================="

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the frontend directory"
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."
if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
echo ""

# Core Framework Dependencies
echo "1️⃣ Installing core framework dependencies..."
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs \
    zustand@^4.5.0 @ui-kitten/components@^5.3.1 @eva-design/eva@^2.2.0 \
    react-native-gesture-handler react-native-reanimated@~3.17.4 \
    react-native-safe-area-context react-native-screens

# Video & Camera Dependencies (Expo compatible)
echo ""
echo "2️⃣ Installing video & camera dependencies..."
npx expo install expo-camera expo-av expo-media-library expo-file-system

# Performance & UI Dependencies
echo ""
echo "3️⃣ Installing performance & UI dependencies..."
npm install @shopify/flash-list expo-image react-native-skeleton-placeholder

# Utility Dependencies
echo ""
echo "4️⃣ Installing utility dependencies..."
npm install zod date-fns expo-device react-native-mmkv

# Development Dependencies
echo ""
echo "5️⃣ Installing development dependencies..."
npm install --save-dev @types/react-native react-native-dotenv

# Clear metro cache
echo ""
echo "🧹 Clearing Metro cache..."
npx expo start --clear

echo ""
echo "✅ All dependencies installed successfully!"
echo ""
echo "📱 Next steps:"
echo "  - For iOS: cd ios && pod install"
echo "  - For Android: cd android && ./gradlew clean"
echo "  - Run the app: npm start"
echo ""
echo "🚀 Happy coding!"