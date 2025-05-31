# GitHub Secrets Configuration Guide

This document outlines all the GitHub Secrets required for the Smart Hockey Coach CI/CD pipeline.

## Required Secrets

### 1. Code Coverage
- **`CODECOV_TOKEN`** (Optional but recommended)
  - Purpose: Upload test coverage reports to Codecov
  - How to get: Sign up at [codecov.io](https://codecov.io), add your repository, and copy the upload token
  - Required for: `ci.yml` workflow

### 2. Convex Backend
- **`CONVEX_DEPLOY_KEY`** (Required for production)
  - Purpose: Deploy and validate Convex functions
  - How to get: 
    1. Run `npx convex dev` in the frontend directory
    2. Go to your Convex dashboard
    3. Navigate to Settings → Deploy Keys
    4. Create a new deploy key for production
  - Required for: `ci.yml` workflow, future deployment workflows

### 3. Security Scanning
- **`SNYK_TOKEN`** (Optional but recommended)
  - Purpose: Advanced vulnerability scanning
  - How to get:
    1. Sign up at [snyk.io](https://snyk.io)
    2. Go to Account Settings → General
    3. Copy your API token
  - Required for: `security.yml` workflow

### 4. Mobile App Signing (Future)
- **`ANDROID_KEYSTORE_BASE64`** (Required for Android release builds)
  - Purpose: Sign Android APKs
  - How to get: Base64 encode your keystore file
  - Required for: Future Android release workflow

- **`ANDROID_KEYSTORE_PASSWORD`** (Required for Android release builds)
  - Purpose: Password for the keystore
  - Required for: Future Android release workflow

- **`IOS_CERTIFICATE_BASE64`** (Required for iOS release builds)
  - Purpose: Sign iOS apps
  - How to get: Export from Keychain, base64 encode
  - Required for: Future iOS release workflow

- **`IOS_CERTIFICATE_PASSWORD`** (Required for iOS release builds)
  - Purpose: Password for the certificate
  - Required for: Future iOS release workflow

- **`IOS_PROVISIONING_PROFILE_BASE64`** (Required for iOS release builds)
  - Purpose: iOS provisioning profile
  - How to get: Download from Apple Developer portal, base64 encode
  - Required for: Future iOS release workflow

### 5. API Keys (Future)
- **`GEMINI_API_KEY`** (Required for production)
  - Purpose: Google Gemini API for AI analysis
  - How to get: From Google AI Studio or GCP Console
  - Required for: Production environment

- **`GCP_SERVICE_ACCOUNT_KEY`** (Required for production)
  - Purpose: Access GCP services (Vertex AI, Cloud Storage)
  - How to get: Create service account in GCP Console, download JSON key
  - Required for: Production deployment

## Environment-Specific Secrets

### Development
- `CONVEX_URL_DEV`
- `CONVEX_DEPLOY_KEY_DEV`

### Staging
- `CONVEX_URL_STAGING`
- `CONVEX_DEPLOY_KEY_STAGING`

### Production
- `CONVEX_URL_PROD`
- `CONVEX_DEPLOY_KEY_PROD`
- `GEMINI_API_KEY_PROD`
- `GCP_SERVICE_ACCOUNT_KEY_PROD`

## How to Add Secrets to GitHub

1. Go to your repository on GitHub
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Enter the secret name (exactly as listed above)
5. Paste the secret value
6. Click "Add secret"

## Branch Protection Rules

After setting up secrets, configure branch protection:

1. Go to Settings → Branches
2. Add rule for `main` branch:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (1-2 reviewers)
   - ✅ Dismiss stale pull request approvals when new commits are pushed
   - ✅ Require status checks to pass before merging:
     - `CI Pipeline / Code Quality`
     - `CI Pipeline / Unit Tests`
     - `CI Pipeline / Convex Validation`
     - `CI Pipeline / Android Build`
     - `CI Pipeline / iOS Build`
     - `Security Scanning / Secret Scanning`
   - ✅ Require branches to be up to date before merging
   - ✅ Include administrators

3. Add similar rule for `develop` branch (if using git-flow)

## Security Best Practices

1. **Rotate secrets regularly** (every 90 days)
2. **Never commit secrets** to the repository
3. **Use least privilege** - only grant necessary permissions
4. **Audit secret usage** regularly in GitHub's security tab
5. **Enable secret scanning** in repository settings
6. **Use environment-specific secrets** to limit exposure

## Troubleshooting

### Secret not found errors
- Ensure secret name matches exactly (case-sensitive)
- Check if secret is added to the correct repository
- Verify workflow has access to secrets (not available in PRs from forks)

### Invalid secret format
- For base64 secrets: `base64 -i file.keystore -o output.txt` (macOS)
- For JSON secrets: Ensure proper escaping or use base64 encoding
- Remove any trailing newlines or spaces

### Access denied
- Check if the secret has correct permissions
- Verify service accounts have necessary roles
- Ensure API keys are enabled for the service