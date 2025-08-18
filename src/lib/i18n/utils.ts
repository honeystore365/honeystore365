import { defaultLocale, type Locale, locales } from '../../i18n';

/**
 * Check if a locale is valid
 */
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

/**
 * Get the locale from a pathname
 */
export function getLocaleFromPathname(pathname: string): Locale {
  const segments = pathname.split('/');
  const potentialLocale = segments[1];

  if (potentialLocale && isValidLocale(potentialLocale)) {
    return potentialLocale;
  }

  return defaultLocale;
}

/**
 * Remove locale prefix from pathname
 */
export function removeLocaleFromPathname(pathname: string): string {
  const segments = pathname.split('/');
  const potentialLocale = segments[1];

  if (potentialLocale && isValidLocale(potentialLocale)) {
    return '/' + segments.slice(2).join('/');
  }

  return pathname;
}

/**
 * Add locale prefix to pathname
 */
export function addLocaleToPathname(pathname: string, locale: Locale): string {
  // Don't add locale prefix for default locale unless explicitly needed
  if (locale === defaultLocale) {
    return pathname;
  }

  // Remove existing locale if present
  const cleanPath = removeLocaleFromPathname(pathname);
  return `/${locale}${cleanPath}`;
}

/**
 * Get the opposite locale (for language switcher)
 */
export function getOppositeLocale(currentLocale: Locale): Locale {
  return currentLocale === 'ar' ? 'en' : 'ar';
}

/**
 * Check if locale is RTL
 */
export function isRTL(locale: Locale): boolean {
  return locale === 'ar';
}

/**
 * Get text direction for locale
 */
export function getTextDirection(locale: Locale): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}

/**
 * Get HTML lang attribute value
 */
export function getHtmlLang(locale: Locale): string {
  return locale === 'ar' ? 'ar-SA' : 'en-US';
}
