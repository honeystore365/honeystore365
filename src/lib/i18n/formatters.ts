/**
 * Currency formatting utilities for Arabic and English locales
 */
export interface CurrencyOptions {
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export function formatCurrency(amount: number, locale: string = 'ar', options: CurrencyOptions = {}): string {
  const { currency = locale === 'ar' ? 'SAR' : 'USD', minimumFractionDigits = 2, maximumFractionDigits = 2 } = options;

  const formatter = new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  });

  return formatter.format(amount);
}

/**
 * Number formatting utilities
 */
export interface NumberOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
}

export function formatNumber(number: number, locale: string = 'ar', options: NumberOptions = {}): string {
  const { minimumFractionDigits = 0, maximumFractionDigits = 3, useGrouping = true } = options;

  const formatter = new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping,
  });

  return formatter.format(number);
}

/**
 * Date formatting utilities with Arabic and English support
 */
export interface DateOptions {
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
  year?: 'numeric' | '2-digit';
  month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
  day?: 'numeric' | '2-digit';
  weekday?: 'long' | 'short' | 'narrow';
  hour?: 'numeric' | '2-digit';
  minute?: 'numeric' | '2-digit';
  second?: 'numeric' | '2-digit';
  timeZone?: string;
}

export function formatDate(date: Date | string | number, locale: string = 'ar', options: DateOptions = {}): string {
  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date provided');
  }

  const formatter = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    timeZone: 'Asia/Riyadh',
    ...options,
  });

  return formatter.format(dateObj);
}

/**
 * Relative time formatting (e.g., "منذ ساعتين", "2 hours ago")
 */
export function formatRelativeTime(date: Date | string | number, locale: string = 'ar'): string {
  const dateObj = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    numeric: 'auto',
    style: 'long',
  });

  // Define time units in seconds
  const units: Array<[string, number]> = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
    ['second', 1],
  ];

  for (const [unit, secondsInUnit] of units) {
    const value = Math.floor(diffInSeconds / secondsInUnit);
    if (Math.abs(value) >= 1) {
      return rtf.format(-value, unit as Intl.RelativeTimeFormatUnit);
    }
  }

  return rtf.format(0, 'second');
}

/**
 * Percentage formatting
 */
export function formatPercentage(
  value: number,
  locale: string = 'ar',
  minimumFractionDigits: number = 0,
  maximumFractionDigits: number = 2
): string {
  const formatter = new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits,
  });

  return formatter.format(value / 100);
}

/**
 * File size formatting
 */
export function formatFileSize(bytes: number, locale: string = 'ar', decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes =
    locale === 'ar' ? ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت', 'تيرابايت'] : ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Phone number formatting for Saudi Arabia
 */
export function formatPhoneNumber(phoneNumber: string, locale: string = 'ar'): string {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');

  // Handle Saudi phone numbers
  if (cleaned.startsWith('966')) {
    // International format: +966 50 123 4567
    const formatted = cleaned.replace(/^966(\d{2})(\d{3})(\d{4})$/, '+966 $1 $2 $3');
    return formatted;
  } else if (cleaned.startsWith('05') && cleaned.length === 10) {
    // Local format: 050 123 4567
    const formatted = cleaned.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1 $2 $3');
    return formatted;
  }

  // Return original if no pattern matches
  return phoneNumber;
}

/**
 * Utility to get the appropriate currency symbol based on locale
 */
export function getCurrencySymbol(locale: string = 'ar'): string {
  return locale === 'ar' ? 'ر.س' : '$';
}

/**
 * Utility to get the appropriate currency code based on locale
 */
export function getCurrencyCode(locale: string = 'ar'): string {
  return locale === 'ar' ? 'SAR' : 'USD';
}
