import {
  flipTransform,
  getArrowDirection,
  getDirection,
  getIconRotation,
  getJustifyContent,
  getPhysicalSpacing,
  getRTLClasses,
  getTextAlign,
  isRTL,
  rtlClass,
  rtlStyle,
  sortForDirection,
} from '../rtl-utils';

describe('rtl-utils', () => {
  describe('isRTL', () => {
    it('should return true for RTL locales', () => {
      expect(isRTL('ar')).toBe(true);
      expect(isRTL('he')).toBe(true);
      expect(isRTL('fa')).toBe(true);
      expect(isRTL('ur')).toBe(true);
    });

    it('should return false for LTR locales', () => {
      expect(isRTL('en')).toBe(false);
      expect(isRTL('fr')).toBe(false);
      expect(isRTL('de')).toBe(false);
    });
  });

  describe('getDirection', () => {
    it('should return rtl for RTL locales', () => {
      expect(getDirection('ar')).toBe('rtl');
      expect(getDirection('he')).toBe('rtl');
    });

    it('should return ltr for LTR locales', () => {
      expect(getDirection('en')).toBe('ltr');
      expect(getDirection('fr')).toBe('ltr');
    });
  });

  describe('getPhysicalSpacing', () => {
    it('should convert logical spacing for LTR', () => {
      const result = getPhysicalSpacing(
        {
          marginStart: '10px',
          marginEnd: '20px',
          paddingStart: '5px',
          paddingEnd: '15px',
        },
        'ltr'
      );

      expect(result).toEqual({
        marginLeft: '10px',
        marginRight: '20px',
        paddingLeft: '5px',
        paddingRight: '15px',
      });
    });

    it('should convert logical spacing for RTL', () => {
      const result = getPhysicalSpacing(
        {
          marginStart: '10px',
          marginEnd: '20px',
          paddingStart: '5px',
          paddingEnd: '15px',
        },
        'rtl'
      );

      expect(result).toEqual({
        marginRight: '10px',
        marginLeft: '20px',
        paddingRight: '5px',
        paddingLeft: '15px',
      });
    });

    it('should handle partial spacing props', () => {
      const result = getPhysicalSpacing({ marginStart: '10px' }, 'ltr');

      expect(result).toEqual({
        marginLeft: '10px',
      });
    });
  });

  describe('getRTLClasses', () => {
    it('should return LTR classes for LTR direction', () => {
      const result = getRTLClasses(
        {
          common: 'p-4',
          ltr: 'text-left',
          rtl: 'text-right',
        },
        'ltr'
      );

      expect(result).toBe('p-4 text-left');
    });

    it('should return RTL classes for RTL direction', () => {
      const result = getRTLClasses(
        {
          common: 'p-4',
          ltr: 'text-left',
          rtl: 'text-right',
        },
        'rtl'
      );

      expect(result).toBe('p-4 text-right');
    });

    it('should handle missing direction classes', () => {
      const result = getRTLClasses({ common: 'p-4' }, 'rtl');

      expect(result).toBe('p-4');
    });
  });

  describe('rtlClass', () => {
    it('should return correct class for textLeft pattern', () => {
      expect(rtlClass('textLeft', undefined, 'ltr')).toBe('text-left');
      expect(rtlClass('textLeft', undefined, 'rtl')).toBe('text-right');
    });

    it('should return correct class for margin patterns with size', () => {
      expect(rtlClass('ml', '4', 'ltr')).toBe('ml-4');
      expect(rtlClass('ml', '4', 'rtl')).toBe('mr-4');
    });

    it('should return correct class for flexRow pattern', () => {
      expect(rtlClass('flexRow', undefined, 'ltr')).toBe('flex-row');
      expect(rtlClass('flexRow', undefined, 'rtl')).toBe('flex-row-reverse');
    });

    it('should return empty string for invalid pattern', () => {
      expect(rtlClass('invalidPattern' as any, undefined, 'ltr')).toBe('');
    });
  });

  describe('flipTransform', () => {
    it('should flip translateX values for RTL', () => {
      const result = flipTransform('translateX(10px)', 'rtl');
      expect(result).toBe('translateX(-10px)');
    });

    it('should handle negative values', () => {
      const result = flipTransform('translateX(-20px)', 'rtl');
      expect(result).toBe('translateX(20px)');
    });

    it('should handle percentage values', () => {
      const result = flipTransform('translateX(50%)', 'rtl');
      expect(result).toBe('translateX(-50%)');
    });

    it('should not flip for LTR', () => {
      const transform = 'translateX(10px)';
      const result = flipTransform(transform, 'ltr');
      expect(result).toBe(transform);
    });

    it('should handle multiple translateX values', () => {
      const result = flipTransform('translateX(10px) translateX(-5px)', 'rtl');
      expect(result).toBe('translateX(-10px) translateX(5px)');
    });
  });

  describe('getArrowDirection', () => {
    it('should flip horizontal arrows for RTL', () => {
      expect(getArrowDirection('left', 'rtl')).toBe('right');
      expect(getArrowDirection('right', 'rtl')).toBe('left');
    });

    it('should not flip vertical arrows for RTL', () => {
      expect(getArrowDirection('up', 'rtl')).toBe('up');
      expect(getArrowDirection('down', 'rtl')).toBe('down');
    });

    it('should not flip arrows for LTR', () => {
      expect(getArrowDirection('left', 'ltr')).toBe('left');
      expect(getArrowDirection('right', 'ltr')).toBe('right');
      expect(getArrowDirection('up', 'ltr')).toBe('up');
      expect(getArrowDirection('down', 'ltr')).toBe('down');
    });
  });

  describe('getIconRotation', () => {
    it('should return rotation class for RTL', () => {
      expect(getIconRotation('rtl')).toBe('rotate-180');
    });

    it('should return empty string for LTR', () => {
      expect(getIconRotation('ltr')).toBe('');
    });
  });

  describe('sortForDirection', () => {
    const testArray = [1, 2, 3, 4, 5];

    it('should not reverse for LTR', () => {
      const result = sortForDirection(testArray, 'ltr');
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should reverse for RTL', () => {
      const result = sortForDirection(testArray, 'rtl');
      expect(result).toEqual([5, 4, 3, 2, 1]);
    });

    it('should apply custom compare function then reverse for RTL', () => {
      const result = sortForDirection([3, 1, 4, 2], 'rtl', (a, b) => a - b);
      expect(result).toEqual([4, 3, 2, 1]);
    });

    it('should not mutate original array', () => {
      const original = [1, 2, 3];
      const result = sortForDirection(original, 'rtl');
      expect(original).toEqual([1, 2, 3]);
      expect(result).toEqual([3, 2, 1]);
    });
  });

  describe('rtlStyle', () => {
    const ltrStyles = { textAlign: 'left', marginLeft: '10px' };
    const rtlStyles = { textAlign: 'right', marginRight: '10px' };

    it('should return merged styles for RTL', () => {
      const result = rtlStyle(ltrStyles, rtlStyles, 'rtl');
      expect(result).toEqual({
        textAlign: 'right',
        marginLeft: '10px',
        marginRight: '10px',
      });
    });

    it('should return only LTR styles for LTR', () => {
      const result = rtlStyle(ltrStyles, rtlStyles, 'ltr');
      expect(result).toEqual(ltrStyles);
    });
  });

  describe('getTextAlign', () => {
    it('should not change center and justify', () => {
      expect(getTextAlign('center', 'rtl')).toBe('center');
      expect(getTextAlign('justify', 'rtl')).toBe('justify');
      expect(getTextAlign('center', 'ltr')).toBe('center');
      expect(getTextAlign('justify', 'ltr')).toBe('justify');
    });

    it('should flip left and right for RTL', () => {
      expect(getTextAlign('left', 'rtl')).toBe('right');
      expect(getTextAlign('right', 'rtl')).toBe('left');
    });

    it('should not flip for LTR', () => {
      expect(getTextAlign('left', 'ltr')).toBe('left');
      expect(getTextAlign('right', 'ltr')).toBe('right');
    });
  });

  describe('getJustifyContent', () => {
    it('should not change center, between, around, evenly', () => {
      const values = ['center', 'between', 'around', 'evenly'] as const;
      values.forEach(value => {
        expect(getJustifyContent(value, 'rtl')).toBe(`justify-${value}`);
        expect(getJustifyContent(value, 'ltr')).toBe(`justify-${value}`);
      });
    });

    it('should flip start and end for RTL', () => {
      expect(getJustifyContent('start', 'rtl')).toBe('justify-end');
      expect(getJustifyContent('end', 'rtl')).toBe('justify-start');
    });

    it('should not flip for LTR', () => {
      expect(getJustifyContent('start', 'ltr')).toBe('justify-start');
      expect(getJustifyContent('end', 'ltr')).toBe('justify-end');
    });
  });
});
