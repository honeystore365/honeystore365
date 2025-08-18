import { AlertCircle } from 'lucide-react';

interface ErrorBannerProps {
  error: string | Error;
  className?: string;
}

export function ErrorBanner({ error, className = '' }: ErrorBannerProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <div className={`flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 ${className}`}>
      <AlertCircle className="w-5 h-5 flex-shrink-0" />
      <p className="text-sm">{errorMessage}</p>
    </div>
  );
}