'use client';

import { LucideProps, ShoppingCart } from 'lucide-react';
import { memo } from 'react';

interface LazyIconProps extends LucideProps {
  fallback?: React.ReactNode;
}

const LazyIcon = memo<LazyIconProps>(({ fallback = null, ...props }) => {
  return <ShoppingCart {...props} />;
});

LazyIcon.displayName = 'LazyIcon';

export { LazyIcon };
