'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cleanupCorruptedTokens } from '@/lib/auth/token-cleanup';
import { useState } from 'react';

export function TokenCleanupButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCleanup = async () => {
    setIsLoading(true);
    try {
      await cleanupCorruptedTokens();
      toast({
        title: 'Success',
        description: 'Auth tokens cleaned up. Please refresh the page.',
      });
      // Refresh the page after cleanup
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cleanup tokens. Please try refreshing the page.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleCleanup} disabled={isLoading} variant='outline' size='sm'>
      {isLoading ? 'Cleaning...' : 'Fix Auth Error'}
    </Button>
  );
}
