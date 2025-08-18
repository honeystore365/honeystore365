import {
  formatCurrency,
  formatDate,
  formatFileSize,
  formatNumber,
  formatPercentage,
  formatPhoneNumber,
  formatRelativeTime,
  getCurrencyCode,
  getCurrencySymbol,
} from '../formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('should format currency in Arabic locale', () => {
      const result = formatCurrency(1234.56, 'ar');
      expect(result).toContain('1,234.56');
      expect(result).toContain('ر.س');
    });

    it('should format currency in English locale', () => {
      const result = formatCurrency(1234.56, 'en');
      expect(result).toContain('1,234.56');
      expect(result).toContain('$');
    });

    it('should respect custom currency options', () => {
      const result = formatCurrency(1234.5, 'ar', {
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
      expect(result).toContain('1,235');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers in Arabic locale', () => {
      const result = formatNumber(1234567.89, 'ar');
      expect(result).toBe('1,234,567.89');
    });

    it('should format numbers in English locale', () => {
      const result = formatNumber(1234567.89, 'en');
      expect(result).toBe('1,234,567.89');
    });

    it('should respect number formatting options', () => {
      const result = formatNumber(1234.5678, 'ar', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      expect(result).toBe('1,234.57');
    });

    it('should handle grouping option', () => {
      const result = formatNumber(1234567, 'ar', { useGrouping: false });
      expect(result).toBe('1234567');
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2024-01-15T10:30:00Z');

    it('should format date in Arabic locale', () => {
      const result = formatDate(testDate, 'ar', { dateStyle: 'short' });
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should format date in English locale', () => {
      const result = formatDate(testDate, 'en', { dateStyle: 'short' });
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should handle string date input', () => {
      const result = formatDate('2024-01-15', 'ar');
      expect(result).toBeTruthy();
    });

    it('should handle number date input', () => {
      const result = formatDate(testDate.getTime(), 'ar');
      expect(result).toBeTruthy();
    });

    it('should throw error for invalid date', () => {
      expect(() => formatDate('invalid-date', 'ar')).toThrow('Invalid date provided');
    });

    it('should respect custom date options', () => {
      const result = formatDate(testDate, 'ar', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      expect(result).toBeTruthy();
    });
  });

  describe('formatRelativeTime', () => {
    const now = new Date();

    it('should format recent time', () => {
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const result = formatRelativeTime(oneHourAgo, 'en');
      expect(result).toContain('hour');
    });

    it('should format time in Arabic', () => {
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const result = formatRelativeTime(oneHourAgo, 'ar');
      expect(result).toBeTruthy();
    });

    it('should handle different time units', () => {
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const result = formatRelativeTime(oneDayAgo, 'en');
      expect(result).toContain('day');
    });

    it('should handle very recent time', () => {
      const fiveSecondsAgo = new Date(now.getTime() - 5 * 1000);
      const result = formatRelativeTime(fiveSecondsAgo, 'en');
      expect(result).toBeTruthy();
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage in Arabic', () => {
      const result = formatPercentage(75.5, 'ar');
      expect(result).toContain('76');
      expect(result).toContain('%');
    });

    it('should format percentage in English', () => {
      const result = formatPercentage(75.5, 'en');
      expect(result).toContain('76');
      expect(result).toContain('%');
    });

    it('should respect decimal places', () => {
      const result = formatPercentage(75.555, 'en', 0, 2);
      expect(result).toBeTruthy();
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      const result = formatFileSize(512, 'en');
      expect(result).toBe('512 Bytes');
    });

    it('should format zero bytes', () => {
      const result = formatFileSize(0, 'en');
      expect(result).toBe('0 Bytes');
    });

    it('should format kilobytes', () => {
      const result = formatFileSize(1024, 'en');
      expect(result).toBe('1 KB');
    });

    it('should format megabytes', () => {
      const result = formatFileSize(1024 * 1024, 'en');
      expect(result).toBe('1 MB');
    });

    it('should format in Arabic', () => {
      const result = formatFileSize(1024, 'ar');
      expect(result).toContain('كيلوبايت');
    });

    it('should respect decimal places', () => {
      const result = formatFileSize(1536, 'en', 1); // 1.5 KB
      expect(result).toBe('1.5 KB');
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format Saudi international number', () => {
      const result = formatPhoneNumber('966501234567', 'ar');
      expect(result).toBe('+966 50 123 4567');
    });

    it('should format Saudi local number', () => {
      const result = formatPhoneNumber('0501234567', 'ar');
      expect(result).toBe('050 123 4567');
    });

    it('should return original for unrecognized format', () => {
      const result = formatPhoneNumber('123456', 'ar');
      expect(result).toBe('123456');
    });

    it('should handle already formatted numbers', () => {
      const result = formatPhoneNumber('+966 50 123 4567', 'ar');
      expect(result).toBe('+966 50 123 4567');
    });
  });

  describe('getCurrencySymbol', () => {
    it('should return SAR symbol for Arabic', () => {
      expect(getCurrencySymbol('ar')).toBe('ر.س');
    });

    it('should return USD symbol for English', () => {
      expect(getCurrencySymbol('en')).toBe('$');
    });

    it('should default to Arabic', () => {
      expect(getCurrencySymbol()).toBe('ر.س');
    });
  });

  describe('getCurrencyCode', () => {
    it('should return SAR for Arabic', () => {
      expect(getCurrencyCode('ar')).toBe('SAR');
    });

    it('should return USD for English', () => {
      expect(getCurrencyCode('en')).toBe('USD');
    });

    it('should default to Arabic', () => {
      expect(getCurrencyCode()).toBe('SAR');
    });
  });
});
