'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ErrorPageProps {
  title?: string;
  message: string;
  showRetry?: boolean;
  showHome?: boolean;
  onRetry?: () => void;
}

export default function ErrorPage({
  title = 'حدث خطأ',
  message,
  showRetry = false,
  showHome = true,
  onRetry,
}: ErrorPageProps) {
  const router = useRouter();

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      router.refresh();
    }
  };

  return (
    <div className='container mx-auto py-20 px-4'>
      <div className='max-w-md mx-auto text-center'>
        <Card>
          <CardContent className='p-8'>
            <div className='mb-6'>
              <div className='mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center'>
                <AlertTriangle className='w-8 h-8 text-red-600' />
              </div>
            </div>

            <h1 className='text-2xl font-bold text-gray-900 mb-4'>{title}</h1>
            <p className='text-gray-600 mb-8'>{message}</p>

            <div className='space-y-3'>
              {showRetry && (
                <Button onClick={handleRetry} className='w-full bg-honey hover:bg-honey-dark'>
                  <RefreshCw className='w-4 h-4 mr-2' />
                  إعادة المحاولة
                </Button>
              )}

              {showHome && (
                <Button asChild variant='outline' className='w-full'>
                  <Link href='/'>
                    <Home className='w-4 h-4 mr-2' />
                    العودة للرئيسية
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
