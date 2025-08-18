// Main lib exports
// export * from './config'; // Config disabled
export * from './errors';
// Export logger but exclude logError to avoid conflict with errors
export {
    LogLevel,
    createRequestLogger,
    logBusinessEvent,
    logDebug,
    logInfo,
    logPerformance,
    logSecurityEvent,
    logWarn, logger, type ILogger,
    type LogEntry,
    type LogMetadata
} from './logger';
export * from './supabase';
export * from './utils';
export * from './validation';

// Legacy exports for backward compatibility (will be removed in future tasks)
export { createClientComponent } from './supabase/client';
export { createClientServer } from './supabase/server';
export { createClientServerReadOnly } from './supabase/server-readonly';
