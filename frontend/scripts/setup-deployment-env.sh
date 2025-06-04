#!/bin/bash
# setup-deployment-env.sh
# This script helps to securely set up deployment environment variables

# Exit on error
set -e

# Function to prompt for sensitive information
prompt_for_secret() {
  local var_name=$1
  local description=$2
  local default_value=${3:-""}
  
  if [[ -n "$default_value" ]]; then
    read -p "$description [$default_value]: " input
    eval "$var_name=\"${input:-$default_value}\""
  else
    read -p "$description: " input
    eval "$var_name=\"$input\""
  fi
}

# Function to store secrets in environment variables
store_env_vars() {
  local env_file=$1
  shift
  local vars=("$@")
  
  # Create .env file if it doesn't exist
  touch "$env_file"
  
  # Add variables to file
  for var in "${vars[@]}"; do
    if grep -q "^$var=" "$env_file"; then
      # Replace existing variable
      sed -i "s|^$var=.*|$var=${!var}|" "$env_file"
    else
      # Add new variable
      echo "$var=${!var}" >> "$env_file"
    fi
  done
  
  echo "Environment variables stored in $env_file"
}

# Welcome message
echo "==============================================="
echo "Smart Hockey Coach - Secure Deployment Setup"
echo "==============================================="
echo "This script will help you set up your environment variables for deployment."
echo "No credentials will be hardcoded in files or scripts."
echo

# Environment selection
PS3="Select environment to configure: "
environments=("Development" "Staging" "Production" "Cancel")
select env in "${environments[@]}"; do
  case $env in
    "Development")
      ENV_FILE=".env.development"
      ENV_SUFFIX="DEV"
      break
      ;;
    "Staging")
      ENV_FILE=".env.staging"
      ENV_SUFFIX="STAGING"
      break
      ;;
    "Production")
      ENV_FILE=".env.production"
      ENV_SUFFIX="PROD"
      break
      ;;
    "Cancel")
      echo "Setup cancelled."
      exit 0
      ;;
    *) 
      echo "Invalid option"
      ;;
  esac
done

echo "Configuring $env environment..."

# Common variables
prompt_for_secret "GCP_PROJECT_ID" "Google Cloud Project ID"
prompt_for_secret "CONVEX_URL" "Convex URL (e.g., https://your-app.convex.site)"

# API Keys
if [[ "$env" == "Development" ]]; then
  prompt_for_secret "GEMINI_API_KEY" "Gemini API Key for development"
else
  prompt_for_secret "GCP_SERVICE_ACCOUNT_KEY" "GCP Service Account Key (base64 encoded)"
  prompt_for_secret "VERTEX_ENDPOINT_ID" "Vertex AI Endpoint ID"
fi

# Mobile app variables
if [[ "$env" == "Production" ]]; then
  # iOS variables
  prompt_for_secret "APPLE_ID" "Apple ID for app submission"
  prompt_for_secret "APPLE_APP_PASSWORD" "App-specific password for Apple ID"
  prompt_for_secret "APP_DOMAIN" "App domain (e.g., https://your-app.com)"
  
  # Android variables
  prompt_for_secret "ANDROID_KEYSTORE_PASSWORD" "Android Keystore Password"
  prompt_for_secret "ANDROID_KEY_ALIAS" "Android Key Alias"
  prompt_for_secret "ANDROID_KEY_PASSWORD" "Android Key Password"
fi

# Create environment variable file
echo "Creating $ENV_FILE..."

# Common variables to store
vars_to_store=(
  "GCP_PROJECT_ID"
  "CONVEX_URL"
)

if [[ "$env" == "Development" ]]; then
  vars_to_store+=("GEMINI_API_KEY")
else
  vars_to_store+=(
    "GCP_SERVICE_ACCOUNT_KEY"
    "VERTEX_ENDPOINT_ID"
  )
fi

if [[ "$env" == "Production" ]]; then
  vars_to_store+=(
    "APPLE_ID"
    "APPLE_APP_PASSWORD"
    "APP_DOMAIN"
    "ANDROID_KEYSTORE_PASSWORD"
    "ANDROID_KEY_ALIAS"
    "ANDROID_KEY_PASSWORD"
  )
fi

# Store variables
store_env_vars "$ENV_FILE" "${vars_to_store[@]}"

# Setup for CI/CD (optional)
if [[ "$env" == "Production" ]]; then
  echo
  echo "For CI/CD environments, add these variables to your GitHub Secrets:"
  for var in "${vars_to_store[@]}"; do
    echo "- $var"
  done
fi

echo
echo "Setup complete! Your environment is now configured securely."
echo "Use environment variables in your deployment scripts instead of hardcoding credentials."