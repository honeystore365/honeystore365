'use client';

// import { useLocaleSwitch } from '@/lib/i18n/hooks'; // TODO: Implement useLocaleSwitch hook
import { logger } from '@/lib/logger';
import { Globe } from 'lucide-react';
import { Button } from './button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu';

interface LanguageSwitcherProps {
  variant?: 'button' | 'dropdown';
  showIcon?: boolean;
  className?: string;
}

export function LanguageSwitcher({ variant = 'dropdown', showIcon = true, className }: LanguageSwitcherProps) {
  // TODO: Implement useLocaleSwitch hook
  const currentLocale = 'ar';
  const switchLocale = (locale: string) => logger.debug(`Switching to locale: ${locale}`);
  const availableLocales = ['ar', 'en'];

  const localeLabels: Record<string, string> = {
    ar: 'العربية',
    en: 'English',
  };

  if (variant === 'button') {
    return (
      <Button
        variant='ghost'
        size='sm'
        onClick={() => switchLocale(currentLocale === 'ar' ? 'en' : 'ar')}
        className={className}
      >
        {showIcon && <Globe className='h-4 w-4 mr-2' />}
        {localeLabels[currentLocale === 'ar' ? 'en' : 'ar']}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='sm' className={className}>
          {showIcon && <Globe className='h-4 w-4 mr-2' />}
          {localeLabels[currentLocale]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {availableLocales.map(locale => (
          <DropdownMenuItem
            key={locale}
            onClick={() => switchLocale(locale)}
            className={currentLocale === locale ? 'bg-accent' : ''}
          >
            {localeLabels[locale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
