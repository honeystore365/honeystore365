'use client';

import { useSession } from '@/context/SessionProvider';
import { AuthErrorBanner } from './AuthErrorBanner';

export function GlobalAuthErrorHandler() {
  // Note: authError is not available in the current SessionProvider
  // This component is disabled until authError is properly implemented
  return null;
}
