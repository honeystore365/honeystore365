import { AuthError, PermissionError, ValidationError } from '@/lib/errors/custom-errors';
import { logger } from '@/lib/logger';
import { AuthUser } from '@/types/business';
import { UserRole } from '@/types/enums';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from './auth-utils';
import { Permission, hasPermission } from './rbac';

/**
 * Secure API Route Wrapper
 * Provides authentication, authorization, validation, and rate limiting for API routes
 */

export interface SecureAPIOptions<TInput = any> {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  requireAuth?: boolean;
  requiredRole?: UserRole;
  requiredPermissions?: Permission[];
  schema?: z.ZodSchema<TInput>;
  rateLimitKey?: string;
  rateLimitMax?: number;
  rateLimitWindow?: number; // in milliseconds
}

export interface APIContext {
  user?: AuthUser;
  method: string;
  url: string;
  timestamp: Date;
}

// Simple in-memory rate limiter (in production, use Redis)
const apiRateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting for API routes
 */
function checkAPIRateLimit(
  key: string,
  max: number = 100,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now();
  const record = apiRateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    apiRateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= max) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Sanitize API input data
 */
function sanitizeAPIInput(data: any): any {
  if (typeof data === 'string') {
    return data
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeAPIInput);
  }

  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeAPIInput(value);
    }
    return sanitized;
  }

  return data;
}

/**
 * Extract client IP from request
 */
function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-client-ip') ||
    'unknown'
  );
}

/**
 * Create error response
 */
function createErrorResponse(
  error: string,
  status: number,
  code?: string,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      error,
      code: code || (status === 401 ? 'UNAUTHORIZED' : status === 403 ? 'FORBIDDEN' : 'ERROR'),
      ...(details && { details }),
    },
    { status }
  );
}

/**
 * Create success response
 */
function createSuccessResponse(data: any, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Creates a secure API route handler
 */
export function createSecureAPIRoute<TInput = any, TOutput = any>(
  options: SecureAPIOptions<TInput> = {}
) {
  return function secureAPIWrapper(
    handler: (input: TInput, context: APIContext, request: NextRequest) => Promise<TOutput>
  ) {
    return async function secureAPIHandler(request: NextRequest): Promise<NextResponse> {
      const startTime = Date.now();
      const method = request.method;
      const url = request.url;
      const clientIP = getClientIP(request);

      try {
        // 1. Method validation
        if (options.method && method !== options.method) {
          return createErrorResponse(
            `Method ${method} not allowed`,
            405,
            'METHOD_NOT_ALLOWED'
          );
        }

        // 2. Rate limiting
        if (options.rateLimitKey) {
          const rateLimitKey = `${options.rateLimitKey}:${clientIP}`;
          const isAllowed = checkAPIRateLimit(
            rateLimitKey,
            options.rateLimitMax || 100,
            options.rateLimitWindow || 60000
          );

          if (!isAllowed) {
            logger.warn('API rate limit exceeded', {
              action: 'secureAPIRoute',
              method,
              url,
              clientIP,
              rateLimitKey,
            });
            
            return createErrorResponse(
              'Too many requests. Please try again later.',
              429,
              'RATE_LIMITED'
            );
          }
        }

        // 3. Authentication
        let user: AuthUser | undefined;
        if (options.requireAuth) {
          const userResult = await getCurrentUser();
          if (!userResult.success || !userResult.data) {
            logger.warn('API access denied - not authenticated', {
              action: 'secureAPIRoute',
              method,
              url,
              clientIP,
            });
            
            return createErrorResponse(
              'Authentication required',
              401,
              'NOT_AUTHENTICATED'
            );
          }
          user = userResult.data;
        }

        // 4. Role validation
        if (options.requiredRole && user) {
          const roleHierarchy = {
            [UserRole.ADMIN]: 3,
            [UserRole.MODERATOR]: 2,
            [UserRole.CUSTOMER]: 1,
          };
          
          if (roleHierarchy[user.role] < roleHierarchy[options.requiredRole]) {
            logger.warn('API access denied - insufficient role', {
              action: 'secureAPIRoute',
              method,
              url,
              userId: user.id,
              userRole: user.role,
              requiredRole: options.requiredRole,
            });
            
            return createErrorResponse(
              `Role ${options.requiredRole} required`,
              403,
              'INSUFFICIENT_ROLE'
            );
          }
        }

        // 5. Permission validation
        if (options.requiredPermissions && user) {
          for (const permission of options.requiredPermissions) {
            if (!hasPermission(user.role, permission)) {
              logger.warn('API access denied - missing permission', {
                action: 'secureAPIRoute',
                method,
                url,
                userId: user.id,
                userRole: user.role,
                requiredPermission: permission,
              });
              
              return createErrorResponse(
                `Permission ${permission} required`,
                403,
                'INSUFFICIENT_PERMISSIONS'
              );
            }
          }
        }

        // 6. Input parsing and validation
        let input: TInput;
        try {
          if (method === 'GET') {
            // Parse query parameters
            const searchParams = new URL(request.url).searchParams;
            const queryParams: any = {};
            searchParams.forEach((value, key) => {
              queryParams[key] = value;
            });
            input = queryParams as TInput;
          } else {
            // Parse JSON body
            const body = await request.json();
            input = sanitizeAPIInput(body) as TInput;
          }
        } catch (error) {
          return createErrorResponse(
            'Invalid request body',
            400,
            'INVALID_REQUEST_BODY'
          );
        }

        // 7. Schema validation
        if (options.schema) {
          try {
            input = options.schema.parse(input);
          } catch (error) {
            if (error instanceof z.ZodError) {
              const errorMessages = error.errors.map(err => 
                `${err.path.join('.')}: ${err.message}`
              ).join(', ');
              
              logger.warn('API input validation failed', {
                action: 'secureAPIRoute',
                method,
                url,
                errors: error.errors,
              });
              
              return createErrorResponse(
                `Validation failed: ${errorMessages}`,
                400,
                'VALIDATION_ERROR',
                error.errors
              );
            }
            throw error;
          }
        }

        // 8. Create context
        const context: APIContext = {
          user,
          method,
          url,
          timestamp: new Date(),
        };

        // 9. Log API call
        logger.info('API call started', {
          action: 'secureAPIRoute',
          method,
          url,
          userId: user?.id,
          userRole: user?.role,
          clientIP,
        });

        // 10. Execute handler
        const result = await handler(input, context, request);

        // 11. Log success
        logger.info('API call completed successfully', {
          action: 'secureAPIRoute',
          method,
          url,
          userId: user?.id,
          duration: Date.now() - startTime,
        });

        return createSuccessResponse(result);

      } catch (error) {
        // Log error
        logger.error('API call failed', error as Error, {
          action: 'secureAPIRoute',
          method,
          url,
          duration: Date.now() - startTime,
        });

        // Handle known errors
        if (error instanceof AuthError) {
          return createErrorResponse(error.message, 401, error.code);
        }
        
        if (error instanceof PermissionError) {
          return createErrorResponse(error.message, 403, error.code);
        }
        
        if (error instanceof ValidationError) {
          return createErrorResponse(error.message, 400, error.code);
        }

        // Handle unknown errors
        return createErrorResponse(
          'Internal server error',
          500,
          'INTERNAL_ERROR'
        );
      }
    };
  };
}

/**
 * Convenience wrappers for common API patterns
 */

// Public API route (no auth required)
export function createPublicAPIRoute<TInput = any, TOutput = any>(
  schema?: z.ZodSchema<TInput>
) {
  return createSecureAPIRoute<TInput, TOutput>({
    requireAuth: false,
    schema,
  });
}

// Authenticated API route
export function createAuthenticatedAPIRoute<TInput = any, TOutput = any>(
  schema?: z.ZodSchema<TInput>
) {
  return createSecureAPIRoute<TInput, TOutput>({
    requireAuth: true,
    schema,
  });
}

// Admin-only API route
export function createAdminAPIRoute<TInput = any, TOutput = any>(
  schema?: z.ZodSchema<TInput>
) {
  return createSecureAPIRoute<TInput, TOutput>({
    requireAuth: true,
    requiredRole: UserRole.ADMIN,
    schema,
  });
}

// Moderator or admin API route
export function createModeratorAPIRoute<TInput = any, TOutput = any>(
  schema?: z.ZodSchema<TInput>
) {
  return createSecureAPIRoute<TInput, TOutput>({
    requireAuth: true,
    requiredRole: UserRole.MODERATOR,
    schema,
  });
}

// API route with specific permissions
export function createPermissionAPIRoute<TInput = any, TOutput = any>(
  permissions: Permission[],
  schema?: z.ZodSchema<TInput>
) {
  return createSecureAPIRoute<TInput, TOutput>({
    requireAuth: true,
    requiredPermissions: permissions,
    schema,
  });
}