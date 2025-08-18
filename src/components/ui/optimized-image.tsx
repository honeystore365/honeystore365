'use client';

import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  fallbackSrc?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  fill = false,
  priority = false,
  sizes,
  fallbackSrc = '/images/placeholder.svg',
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
      setHasError(true);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // Si l'image utilise fill, ne pas spécifier width/height
  const imageProps = fill
    ? {
        fill: true,
        sizes: sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
      }
    : {
        width: width || 400,
        height: height || 300,
      };

  return (
    <div className={`relative ${className || ''}`}>
      {isLoading && !hasError && <div className='absolute inset-0 bg-gray-200 animate-pulse rounded' />}

      <Image
        src={imgSrc}
        alt={alt}
        {...imageProps}
        priority={priority}
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className || ''}`}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          objectFit: 'cover',
        }}
      />

      {hasError && (
        <div className='absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 text-sm'>
          صورة غير متاحة
        </div>
      )}
    </div>
  );
}
