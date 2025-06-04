# Secure Credentials Management Guide

This document outlines the secure approach to managing credentials and sensitive information in the Smart Hockey Coach application.

## Overview

We've implemented a secure credential management system that:

1. **Eliminates hardcoded credentials** from all configuration files and scripts
2. **Uses environment variables** for sensitive information
3. **Provides secure scripts** for managing deployment credentials
4. **Integrates with CI/CD systems** securely using GitHub Secrets

## Key Components

### 1. Environment Files

Each environment (development, staging, production) has its own `.env` file:

```
.env.development  # Development environment settings
.env.staging      # Staging environment settings
.env.production   # Production environment settings
```

These files should NEVER be committed to the repository and are added to `.gitignore`.

### 2. Credential Setup Script

The `setup-deployment-env.sh` script helps developers securely set up their environment variables:

```bash
# Run the setup script
./scripts/setup-deployment-env.sh

# Follow the prompts to configure your environment
```

This script:
- Prompts for sensitive information
- Stores credentials in the appropriate `.env` file
- Never hardcodes sensitive values in scripts

### 3. Secure Deployment Script

The `secure-deploy.sh` script handles deployments without hardcoded credentials:

```bash
# Example: Deploy everything to production
./scripts/secure-deploy.sh --env production --ios --android --backend

# Example: Deploy only backend to staging
./scripts/secure-deploy.sh --env staging --backend
```

This script:
- Loads credentials from environment variables
- Validates that required variables are set
- Uses these variables in deployment commands

## CI/CD Integration

For CI/CD environments (GitHub Actions), add all sensitive information as GitHub Secrets:

1. Go to your repository → Settings → Secrets and variables → Actions
2. Add each credential as a separate secret
3. Reference these secrets in your workflow files

Example GitHub Actions workflow snippet:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up environment
        run: |
          echo "APPLE_ID=${{ secrets.APPLE_ID }}" >> .env.production
          echo "APPLE_APP_PASSWORD=${{ secrets.APPLE_APP_PASSWORD }}" >> .env.production
          # Add other secrets here
      
      - name: Deploy
        run: ./scripts/secure-deploy.sh --env production --backend
```

## Required Credentials

### Common for All Environments
- `CONVEX_URL` - Convex deployment URL
- `GCP_PROJECT_ID` - Google Cloud Project ID

### Development Environment
- `GEMINI_API_KEY` - Gemini API key for development

### Staging & Production Environments
- `GCP_SERVICE_ACCOUNT_KEY` - Base64-encoded GCP service account key
- `VERTEX_ENDPOINT_ID` - Vertex AI endpoint ID

### Production Only
- `APPLE_ID` - Apple ID for App Store submission
- `APPLE_APP_PASSWORD` - App-specific password for Apple ID
- `APP_DOMAIN` - App domain for CORS configuration
- `ANDROID_KEYSTORE_PASSWORD` - Android keystore password
- `ANDROID_KEY_ALIAS` - Android key alias
- `ANDROID_KEY_PASSWORD` - Android key password

## Security Best Practices

1. **Never commit credentials** to the repository
2. **Rotate credentials regularly** (every 90 days)
3. **Use least privilege** for all service accounts
4. **Separate credentials** by environment
5. **Audit credential usage** regularly
6. **Enable multi-factor authentication** for all accounts

## Migration Guide

If you've previously used hardcoded credentials:

1. Run the setup script to create secure environment files
2. Update any custom scripts to use environment variables
3. Remove any hardcoded credentials from your local files
4. Use the secure deployment script for all deployments

For detailed instructions on GitHub Secrets configuration, see [GITHUB-SECRETS.md](GITHUB-SECRETS.md).