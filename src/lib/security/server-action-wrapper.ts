import { AuthError, PermissionError, ValidationError } from '@/lib/errors/custom-errors';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { AuthOptions, validateAuthRequirements } from './auth-utils';

/**
 * Server Action Security Wrapper
 * Provides authentication, authorization, and validation for server actions
 */

export interface SecureActionOptions<TInput = any> extends AuthOptions {
  name: string;
  schema?: z.ZodSchema<TInput>;
  rateLimitKey?: string;
  rateLimitMax?: number;
  rateLimitWindow?: number; // in milliseconds
}

export interface ActionContext {
  userId?: string;
  userRole?: string;
  timestamp: Date;
  actionName: string;
}

// Simple in-memory rate limiter (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting utility
 */
function checkRateLimit(
  key: string,
  max: number = 100,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= max) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Sanitizes input data to prevent XSS and injection attacks
 */
function sanitizeInput(data: any): any {
  if (typeof data === 'string') {
    // Basic HTML sanitization - remove script tags and dangerous attributes
    return data
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeInput);
  }

  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }

  return data;
}

/**
 * Creates a secure server action wrapper
 */
export function createSecureAction<TInput = any, TOutput = any>(
  options: SecureActionOptions<TInput>
) {
  return function secureActionWrapper(
    handler: (input: TInput, context: ActionContext) => Promise<TOutput>
  ) {
    return async function secureAction(input: TInput): Promise<TOutput> {
      const startTime = Date.now();
      const actionName = options.name;

      try {
        // 1. Rate limiting
        if (options.rateLimitKey) {
          const rateLimitKey = options.rateLimitKey;
          const isAllowed = checkRateLimit(
            rateLimitKey,
            options.rateLimitMax || 100,
            options.rateLimitWindow || 60000
          );

          if (!isAllowed) {
            logger.warn('Rate limit exceeded', {
              action: actionName,
              rateLimitKey,
            });
            throw new ValidationError(
              'Too many requests. Please try again later.',
              'rate_limit',
              'RATE_LIMITED'
            );
          }
        }

        // 2. Input sanitization
        const sanitizedInput = sanitizeInput(input);

        // 3. Input validation
        let validatedInput = sanitizedInput;
        if (options.schema) {
          try {
            validatedInput = options.schema.parse(sanitizedInput);
          } catch (error) {
            if (error instanceof z.ZodError) {
              const errorMessages = error.errors.map(err => 
                `${err.path.join('.')}: ${err.message}`
              ).join(', ');
              
              logger.warn('Input validation failed', {
                action: actionName,
                errors: error.errors,
              });
              
              throw new ValidationError(
                `Validation failed: ${errorMessages}`,
                'input',
                'VALIDATION_ERROR'
              );
            }
            throw error;
          }
        }

        // 4. Authentication and authorization
        const user = await validateAuthRequirements(options);

        // 5. Create action context
        const context: ActionContext = {
          userId: user?.id,
          userRole: user?.role,
          timestamp: new Date(),
          actionName,
        };

        // 6. Log action start
        logger.info('Server action started', {
          action: actionName,
          userId: user?.id,
          userRole: user?.role,
        });

        // 7. Execute handler
        const result = await handler(validatedInput, context);

        // 8. Log success
        logger.info('Server action completed successfully', {
          action: actionName,
          userId: user?.id,
          duration: Date.now() - startTime,
        });

        return result;

      } catch (error) {
        // Log error
        logger.error('Server action failed', error as Error, {
          action: actionName,
          duration: Date.now() - startTime,
        });

        // Re-throw known errors
        if (
          error instanceof AuthError ||
          error instanceof PermissionError ||
          error instanceof ValidationError
        ) {
          throw error;
        }

        // Wrap unknown errors
        throw new Error(`Server action failed: ${actionName}`);
      }
    };
  };
}

/**
 * Convenience wrapper for actions that require authentication
 */
export function createAuthenticatedAction<TInput = any, TOutput = any>(
  name: string,
  schema?: z.ZodSchema<TInput>
) {
  return createSecureAction<TInput, TOutput>({
    name,
    schema,
    requireAuth: true,
  });
}

/**
 * Convenience wrapper for actions that require admin role
 */
export function createAdminAction<TInput = any, TOutput = any>(
  name: string,
  schema?: z.ZodSchema<TInput>
) {
  return createSecureAction<TInput, TOutput>({
    name,
    schema,
    requireAuth: true,
    requiredRole: 'admin' as any,
  });
}

/**
 * Convenience wrapper for actions with specific permissions
 */
export function createPermissionAction<TInput = any, TOutput = any>(
  name: string,
  permissions: string[],
  schema?: z.ZodSchema<TInput>
) {
  return createSecureAction<TInput, TOutput>({
    name,
    schema,
    requireAuth: true,
    requiredPermissions: permissions,
  });
}

/**
 * Convenience wrapper for public actions (no auth required)
 */
export function createPublicAction<TInput = any, TOutput = any>(
  name: string,
  schema?: z.ZodSchema<TInput>
) {
  return createSecureAction<TInput, TOutput>({
    name,
    schema,
    requireAuth: false,
  });
}