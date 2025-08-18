import { config, validateConfig } from './index';
import { z } from 'zod';

// Runtime configuration validation
export class ConfigurationError extends Error {
  constructor(
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

// Validate configuration at startup
export function validateAppConfiguration(): void {
  try {
    // Validate basic configuration
    validateConfig();

    // Additional runtime validations
    validateDatabaseConnection();
    validateExternalServices();
    validateFeatureFlags();

    // Use a simple console.log for configuration validation as logger depends on config
    console.log('✅ Configuration validation passed');
  } catch (error) {
    console.error('❌ Configuration validation failed:', error);
    throw error;
  }
}

// Validate database configuration
function validateDatabaseConnection(): void {
  const { database } = config;

  if (!database.url.startsWith('https://')) {
    throw new ConfigurationError('Database URL must use HTTPS');
  }

  if (database.anonKey.length < 100) {
    throw new ConfigurationError('Supabase anon key appears to be invalid');
  }

  if (database.serviceRoleKey.length < 100) {
    throw new ConfigurationError('Supabase service role key appears to be invalid');
  }
}

// Validate external services configuration
function validateExternalServices(): void {
  const { external } = config;

  if (!external.uploadthingToken.startsWith('eyJ')) {
    throw new ConfigurationError('UploadThing token appears to be invalid');
  }
}

// Validate feature flags
function validateFeatureFlags(): void {
  const { features } = config;

  // Ensure feature flags are boolean values
  const featureFlags = Object.entries(features);
  for (const [key, value] of featureFlags) {
    if (typeof value !== 'boolean') {
      throw new ConfigurationError(`Feature flag ${key} must be a boolean value`);
    }
  }
}

// Environment-specific validation
export function validateEnvironmentSpecificConfig(): void {
  const { app } = config;

  switch (app.environment) {
    case 'production':
      validateProductionConfig();
      break;
    case 'staging':
      validateStagingConfig();
      break;
    case 'development':
      validateDevelopmentConfig();
      break;
    default:
      throw new ConfigurationError(`Unknown environment: ${app.environment}`);
  }
}

// Production environment validation
function validateProductionConfig(): void {
  const { auth, logging } = config;

  if (!auth.jwtSecret) {
    throw new ConfigurationError('JWT_SECRET is required in production');
  }

  if (!auth.nextAuthSecret) {
    throw new ConfigurationError('NEXTAUTH_SECRET is required in production');
  }

  if (logging.level === 'debug') {
    console.warn('⚠️  Debug logging is enabled in production');
  }
}

// Staging environment validation
function validateStagingConfig(): void {
  const { auth } = config;

  if (!auth.jwtSecret) {
    console.warn('⚠️  JWT_SECRET not set in staging environment');
  }
}

// Development environment validation
function validateDevelopmentConfig(): void {
  // Development-specific validations
  console.log('🔧 Running in development mode');
}

// Configuration health check
export interface ConfigHealthCheck {
  status: 'healthy' | 'warning' | 'error';
  checks: {
    name: string;
    status: 'pass' | 'warn' | 'fail';
    message?: string;
  }[];
}

export function performConfigHealthCheck(): ConfigHealthCheck {
  const checks: ConfigHealthCheck['checks'] = [];
  let overallStatus: ConfigHealthCheck['status'] = 'healthy';

  // Check database configuration
  try {
    validateDatabaseConnection();
    checks.push({ name: 'Database Configuration', status: 'pass' });
  } catch (error) {
    checks.push({
      name: 'Database Configuration',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    overallStatus = 'error';
  }

  // Check external services
  try {
    validateExternalServices();
    checks.push({ name: 'External Services', status: 'pass' });
  } catch (error) {
    checks.push({
      name: 'External Services',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    overallStatus = 'error';
  }

  // Check environment-specific configuration
  try {
    validateEnvironmentSpecificConfig();
    checks.push({ name: 'Environment Configuration', status: 'pass' });
  } catch (error) {
    checks.push({
      name: 'Environment Configuration',
      status: 'warn',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    if (overallStatus === 'healthy') {
      overallStatus = 'warning';
    }
  }

  // Check feature flags
  try {
    validateFeatureFlags();
    checks.push({ name: 'Feature Flags', status: 'pass' });
  } catch (error) {
    checks.push({
      name: 'Feature Flags',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    overallStatus = 'error';
  }

  return {
    status: overallStatus,
    checks,
  };
}

// Export validation schema for external use
export const configValidationSchema = z.object({
  app: z.object({
    name: z.string(),
    version: z.string(),
    environment: z.enum(['development', 'staging', 'production']),
    siteUrl: z.string().url().optional(),
  }),
  database: z.object({
    url: z.string().url(),
    anonKey: z.string().min(1),
    serviceRoleKey: z.string().min(1),
  }),
  auth: z.object({
    jwtSecret: z.string().optional(),
    nextAuthSecret: z.string().optional(),
    sessionTimeout: z.number().positive(),
  }),
  external: z.object({
    uploadthingToken: z.string().min(1),
  }),
  features: z.object({
    enableChatbot: z.boolean(),
    enableAnalytics: z.boolean(),
    enableA11y: z.boolean(),
  }),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']),
    enableRequestLogging: z.boolean(),
  }),
});
