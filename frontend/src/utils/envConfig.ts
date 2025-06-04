/**
 * Environment configuration utility for secure credential management
 * Provides safe access to environment variables and credentials
 */
import Config from 'react-native-config';

// Define all environment variables with default placeholders
// DO NOT put actual credentials here!
export interface EnvConfig {
  // API configuration
  GEMINI_API_KEY: string;
  GEMINI_MODEL: string;
  GEMINI_ENDPOINT: string;
  
  // Vertex AI configuration (Production)
  GCP_PROJECT_ID: string;
  VERTEX_AI_ENDPOINT: string;
  GCP_SERVICE_ACCOUNT_KEY: string;

  // Convex backend
  CONVEX_URL: string;
  CONVEX_DEPLOY_KEY: string;

  // App configuration
  API_TIMEOUT: number;
  MAX_RETRIES: number;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  
  // Feature flags
  ENABLE_CLOUD_STORAGE: boolean;
  ENABLE_VIDEO_COMPRESSION: boolean;
  ENABLE_ADVANCED_ANALYSIS: boolean;
}

// Process.env fallback for when react-native-config isn't available (e.g., in tests)
const getEnv = (key: string, defaultValue?: string): string => {
  // Try to get from react-native-config first
  if (Config && Config[key] !== undefined && Config[key] !== null) {
    return Config[key];
  }
  
  // Fall back to process.env if available
  if (typeof process !== 'undefined' && 
      process.env && 
      process.env[key] !== undefined && 
      process.env[key] !== null) {
    return process.env[key] as string;
  }
  
  // Return default value or empty string
  return defaultValue || '';
};

// Boolean parser for environment variables
const parseBooleanEnv = (value: string | undefined | null): boolean => {
  if (!value) return false;
  return ['true', '1', 'yes'].includes(value.toLowerCase());
};

// Number parser with fallback
const parseNumberEnv = (value: string | undefined | null, defaultValue: number): number => {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Create the environment configuration with safe defaults
const envConfig: EnvConfig = {
  // API configuration
  GEMINI_API_KEY: getEnv('GEMINI_API_KEY'),
  GEMINI_MODEL: getEnv('GEMINI_MODEL', 'models/gemini-2.5-pro-preview-0506'),
  GEMINI_ENDPOINT: getEnv('GEMINI_ENDPOINT', 'https://generativelanguage.googleapis.com/v1beta'),
  
  // Vertex AI configuration (Production)
  GCP_PROJECT_ID: getEnv('GCP_PROJECT_ID'),
  VERTEX_AI_ENDPOINT: getEnv('VERTEX_AI_ENDPOINT'),
  GCP_SERVICE_ACCOUNT_KEY: getEnv('GCP_SERVICE_ACCOUNT_KEY'),

  // Convex backend
  CONVEX_URL: getEnv('CONVEX_URL'),
  CONVEX_DEPLOY_KEY: getEnv('CONVEX_DEPLOY_KEY'),

  // App configuration
  API_TIMEOUT: parseNumberEnv(getEnv('API_TIMEOUT'), 30000),
  MAX_RETRIES: parseNumberEnv(getEnv('MAX_RETRIES'), 3),
  LOG_LEVEL: getEnv('LOG_LEVEL', 'info') as 'debug' | 'info' | 'warn' | 'error',
  
  // Feature flags
  ENABLE_CLOUD_STORAGE: parseBooleanEnv(getEnv('ENABLE_CLOUD_STORAGE')),
  ENABLE_VIDEO_COMPRESSION: parseBooleanEnv(getEnv('ENABLE_VIDEO_COMPRESSION')),
  ENABLE_ADVANCED_ANALYSIS: parseBooleanEnv(getEnv('ENABLE_ADVANCED_ANALYSIS')),
};

/**
 * Validate that a required credential exists
 * @param key The credential key to check
 * @returns True if credential exists, false otherwise
 */
export const hasCredential = (key: keyof EnvConfig): boolean => {
  return !!envConfig[key] && envConfig[key] !== '';
};

/**
 * Get a credential safely, with missing credential handling
 * @param key The credential to retrieve
 * @param required Whether to throw an error if missing (default: false)
 * @returns The credential value
 */
export const getCredential = <K extends keyof EnvConfig>(
  key: K, 
  required = false
): EnvConfig[K] => {
  if (required && !hasCredential(key)) {
    throw new Error(`Required credential ${key} is missing. Please check your environment configuration.`);
  }
  return envConfig[key];
};

/**
 * Checks if all required credentials are available
 * @param keys List of required credential keys
 * @returns Object with validation result and missing keys
 */
export const validateRequiredCredentials = (
  keys: Array<keyof EnvConfig>
): { valid: boolean; missing: Array<keyof EnvConfig> } => {
  const missing = keys.filter(key => !hasCredential(key));
  return {
    valid: missing.length === 0,
    missing
  };
};

export default envConfig;