import { z } from 'zod';

// Environment validation schema
const envSchema = z.object({
  // App configuration
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  NEXT_PUBLIC_APP_NAME: z.string().default('مناحل الرحيق'),
  NEXT_PUBLIC_APP_VERSION: z.string().default('1.0.0'),

  // Supabase configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),

  // External services
  UPLOADTHING_TOKEN: z.string().min(1, 'UploadThing token is required'),

  // Optional configurations
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  DATABASE_URL: z.string().url().optional(),

  // Feature flags
  NEXT_PUBLIC_ENABLE_CHATBOT: z
    .string()
    .transform(val => val === 'true')
    .default('true'),
  NEXT_PUBLIC_ENABLE_ANALYTICS: z
    .string()
    .transform(val => val === 'true')
    .default('false'),
  NEXT_PUBLIC_ENABLE_A11Y: z
    .string()
    .transform(val => val === 'true')
    .default('true'),

  // Security
  JWT_SECRET: z.string().optional(),
  NEXTAUTH_SECRET: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  ENABLE_REQUEST_LOGGING: z
    .string()
    .transform(val => val === 'true')
    .default('false'),

  // Monitoring and Observability
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  ENABLE_PERFORMANCE_MONITORING: z
    .string()
    .transform(val => val === 'true')
    .default('true'),
  ENABLE_ERROR_TRACKING: z
    .string()
    .transform(val => val === 'true')
    .default('true'),
});

// Infer the type from the schema
export type EnvConfig = z.infer<typeof envSchema>;

// Validate and parse environment variables
function validateEnv(): EnvConfig {
  // Skip validation on client side to avoid errors
  if (typeof window !== 'undefined') {
    return {
      NODE_ENV: (process.env.NODE_ENV as any) || 'development',
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'مناحل الرحيق',
      NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN || '',
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      DATABASE_URL: process.env.DATABASE_URL,
      NEXT_PUBLIC_ENABLE_CHATBOT: process.env.NEXT_PUBLIC_ENABLE_CHATBOT !== 'false',
      NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
      NEXT_PUBLIC_ENABLE_A11Y: process.env.NEXT_PUBLIC_ENABLE_A11Y !== 'false',
      JWT_SECRET: process.env.JWT_SECRET,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      LOG_LEVEL: (process.env.LOG_LEVEL as any) || 'info',
      ENABLE_REQUEST_LOGGING: process.env.ENABLE_REQUEST_LOGGING === 'true',
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
      SENTRY_ORG: process.env.SENTRY_ORG,
      SENTRY_PROJECT: process.env.SENTRY_PROJECT,
      SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
      ENABLE_PERFORMANCE_MONITORING: process.env.ENABLE_PERFORMANCE_MONITORING !== 'false',
      ENABLE_ERROR_TRACKING: process.env.ENABLE_ERROR_TRACKING !== 'false',
    } as EnvConfig;
  }

  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      console.error(`Environment validation failed:\n${errorMessages.join('\n')}`);
      // Return a default configuration instead of throwing
      return envSchema.parse({
        ...process.env,
        NODE_ENV: process.env.NODE_ENV || 'development',
        NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'مناحل الرحيق',
        NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        LOG_LEVEL: process.env.LOG_LEVEL || 'info',
      });
    }
    throw error;
  }
}

// Export validated configuration
export const env = validateEnv();

// Application configuration interface
export interface AppConfig {
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
    siteUrl?: string;
  };
  database: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  auth: {
    jwtSecret?: string;
    nextAuthSecret?: string;
    sessionTimeout: number;
  };
  external: {
    uploadthingToken: string;
  };
  features: {
    enableChatbot: boolean;
    enableAnalytics: boolean;
    enableA11y: boolean;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableRequestLogging: boolean;
  };
  monitoring: {
    sentryDsn?: string;
    sentryOrg?: string;
    sentryProject?: string;
    sentryAuthToken?: string;
    enablePerformanceMonitoring: boolean;
    enableErrorTracking: boolean;
  };
}

// Create application configuration from environment
export const config: AppConfig = {
  app: {
    name: env.NEXT_PUBLIC_APP_NAME,
    version: env.NEXT_PUBLIC_APP_VERSION,
    environment: env.NODE_ENV,
    siteUrl: env.NEXT_PUBLIC_SITE_URL,
  },
  database: {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  },
  auth: {
    jwtSecret: env.JWT_SECRET,
    nextAuthSecret: env.NEXTAUTH_SECRET,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  },
  external: {
    uploadthingToken: env.UPLOADTHING_TOKEN,
  },
  features: {
    enableChatbot: env.NEXT_PUBLIC_ENABLE_CHATBOT,
    enableAnalytics: env.NEXT_PUBLIC_ENABLE_ANALYTICS,
    enableA11y: env.NEXT_PUBLIC_ENABLE_A11Y,
  },
  logging: {
    level: env.LOG_LEVEL,
    enableRequestLogging: env.ENABLE_REQUEST_LOGGING,
  },
  monitoring: {
    sentryDsn: env.NEXT_PUBLIC_SENTRY_DSN,
    sentryOrg: env.SENTRY_ORG,
    sentryProject: env.SENTRY_PROJECT,
    sentryAuthToken: env.SENTRY_AUTH_TOKEN,
    enablePerformanceMonitoring: env.ENABLE_PERFORMANCE_MONITORING,
    enableErrorTracking: env.ENABLE_ERROR_TRACKING,
  },
};

// Utility functions for configuration
export const isDevelopment = () => config.app.environment === 'development';
export const isProduction = () => config.app.environment === 'production';
export const isStaging = () => config.app.environment === 'staging';

// Configuration validation function for runtime checks
export function validateConfig(): void {
  const requiredConfigs = [
    { key: 'database.url', value: config.database.url },
    { key: 'database.anonKey', value: config.database.anonKey },
    { key: 'database.serviceRoleKey', value: config.database.serviceRoleKey },
    { key: 'external.uploadthingToken', value: config.external.uploadthingToken },
  ];

  const missingConfigs = requiredConfigs.filter(({ value }) => !value);

  if (missingConfigs.length > 0) {
    const missingKeys = missingConfigs.map(({ key }) => key).join(', ');
    throw new Error(`Missing required configuration: ${missingKeys}`);
  }
}

// Export default configuration
export default config;
