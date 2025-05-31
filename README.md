# Smart Hockey Coach 🏒

[![CI Pipeline](https://github.com/pskinnertech/hockey/actions/workflows/ci.yml/badge.svg)](https://github.com/pskinnertech/hockey/actions/workflows/ci.yml)
[![Security Scanning](https://github.com/pskinnertech/hockey/actions/workflows/security.yml/badge.svg)](https://github.com/pskinnertech/hockey/actions/workflows/security.yml)
[![codecov](https://codecov.io/gh/pskinnertech/hockey/branch/main/graph/badge.svg)](https://codecov.io/gh/pskinnertech/hockey)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

AI-powered mobile app for real-time hockey shot analysis and coaching feedback.

## 🚀 Features

- **Real-time Shot Detection**: On-device ML instantly detects when you take a shot
- **AI-Powered Analysis**: Gemini 2.5 Pro provides detailed technique feedback
- **Progressive Feedback**: Get instant, fast, and comprehensive analysis
- **Personal Progress Tracking**: Monitor your improvement over time
- **Offline Capability**: Core features work without internet connection

## 🛠️ Tech Stack

- **Frontend**: React Native + TypeScript
- **Backend**: Convex (real-time serverless)
- **AI/ML**: 
  - Google Gemini 2.5 Pro (development)
  - Vertex AI (production)
  - TensorFlow Lite (on-device)
- **State Management**: Zustand
- **Testing**: Jest, Detox
- **CI/CD**: GitHub Actions

## 📋 Prerequisites

- Node.js 18+ and npm
- React Native development environment
- iOS: Xcode 14+, iOS 13+
- Android: Android Studio, JDK 11+, Android 8+
- Convex account (free tier available)
- Google Cloud account (for Gemini API)

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/pskinnertech/hockey.git
   cd hockey
   ```

2. **Install dependencies**
   ```bash
   cd frontend
   npm install
   
   # iOS only
   cd ios && pod install && cd ..
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.development
   # Edit .env.development with your API keys
   ```

4. **Start development servers**
   ```bash
   # Terminal 1: Start Metro bundler
   npm start
   
   # Terminal 2: Start Convex dev server
   npx convex dev
   
   # Terminal 3: Run on your platform
   npm run ios     # or
   npm run android
   ```

## 🧪 Development

### Code Quality

```bash
npm run lint        # Check code style
npm run lint:fix    # Fix code style issues
npm run format      # Format code with Prettier
npm run typecheck   # Check TypeScript types
npm test           # Run unit tests
```

### Project Structure

```
frontend/
├── app/            # Expo Router screens
├── components/     # Reusable UI components
├── hooks/          # Custom React hooks
├── stores/         # Zustand state management
├── lib/            # Utilities and helpers
├── convex/         # Backend functions and schema
└── assets/         # Images, fonts, etc.
```

## 🚢 Deployment

See [DEPLOYMENT-GUIDE.MD](docs/DEPLOYMENT-GUIDE.MD) for detailed deployment instructions.

### Quick Deploy

```bash
# Build for production
npm run build:ios
npm run build:android

# Deploy backend
npx convex deploy --deployment prod
```

## 📖 Documentation

- [Project Overview](docs/PROJECT-OVERVIEW.md)
- [System Architecture](docs/SYS-ARCH.MD)
- [Development Roadmap](docs/ROADMAP.MD)
- [API Documentation](docs/GEMINI-API.MD)
- [GitHub Secrets Setup](docs/GITHUB-SECRETS.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

We use conventional commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test changes
- `chore:` Build process or auxiliary tool changes

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini team for the powerful AI API
- Convex team for the real-time backend platform
- React Native community for the amazing mobile framework

## 📧 Contact

- Project Link: [https://github.com/pskinnertech/hockey](https://github.com/pskinnertech/hockey)
- Issues: [https://github.com/pskinnertech/hockey/issues](https://github.com/pskinnertech/hockey/issues)

---

Made with ❤️ by [pskinnertech](https://github.com/pskinnertech)