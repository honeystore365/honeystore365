'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { TokenCleanupButton } from './TokenCleanupButton';

interface AuthErrorBannerProps {
  error: string;
}

export function AuthErrorBanner({ error }: AuthErrorBannerProps) {
  return (
    <Alert variant='destructive' className='mb-4'>
      <AlertTriangle className='h-4 w-4' />
      <AlertTitle>Authentication Error</AlertTitle>
      <AlertDescription className='flex items-center justify-between'>
        <span>{error}</span>
        <TokenCleanupButton />
      </AlertDescription>
    </Alert>
  );
}
