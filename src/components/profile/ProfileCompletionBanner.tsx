'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ProfileCompletionStatus, getProfileCompletionMessage } from '@/lib/utils/profile-validation';
import { AlertTriangle, CheckCircle, User } from 'lucide-react';
import Link from 'next/link';

interface ProfileCompletionBannerProps {
  status: ProfileCompletionStatus;
  showOnComplete?: boolean;
}

export function ProfileCompletionBanner({ status, showOnComplete = false }: ProfileCompletionBannerProps) {
  // Don't show banner if profile is complete and showOnComplete is false
  if (status.isComplete && !showOnComplete) {
    return null;
  }

  const message = getProfileCompletionMessage(status);
  const variant = status.isComplete ? 'default' : 'destructive';
  const Icon = status.isComplete ? CheckCircle : AlertTriangle;

  return (
    <Alert variant={variant} className='mb-6'>
      <Icon className='h-4 w-4' />
      <AlertTitle>{status.isComplete ? 'الملف الشخصي مكتمل' : 'الملف الشخصي غير مكتمل'}</AlertTitle>
      <AlertDescription className='flex items-center justify-between'>
        <span>{message}</span>
        {!status.isComplete && (
          <Link href='/profile/edit'>
            <Button variant='outline' size='sm' className='mr-4'>
              <User className='w-4 h-4 mr-2' />
              إكمال الملف الشخصي
            </Button>
          </Link>
        )}
      </AlertDescription>
    </Alert>
  );
}
