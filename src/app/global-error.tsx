'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className='min-h-screen flex items-center justify-center bg-background'>
          <div className='text-center'>
            <h2 className='text-2xl font-bold mb-4'>حدث خطأ غير متوقع</h2>
            <p className='text-muted-foreground mb-4'>نعتذر، حدث خطأ في التطبيق. يرجى المحاولة مرة أخرى.</p>
            <button
              onClick={reset}
              className='bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90'
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
