/**
 * RTL (Right-to-Left) utilities for Arabic language support
 */

export type Direction = 'ltr' | 'rtl';

/**
 * Determines if a locale uses RTL direction
 */
export function isRTL(locale: string): boolean {
  const rtlLocales = ['ar', 'he', 'fa', 'ur'];
  return rtlLocales.includes(locale);
}

/**
 * Gets the text direction for a given locale
 */
export function getDirection(locale: string): Direction {
  return isRTL(locale) ? 'rtl' : 'ltr';
}

/**
 * RTL-aware margin and padding utilities
 */
export interface SpacingProps {
  marginStart?: string | number;
  marginEnd?: string | number;
  paddingStart?: string | number;
  paddingEnd?: string | number;
}

/**
 * Converts logical spacing properties to physical ones based on direction
 */
export function getPhysicalSpacing(props: SpacingProps, direction: Direction): Record<string, string | number> {
  const isRtl = direction === 'rtl';

  return {
    ...(props.marginStart && {
      [isRtl ? 'marginRight' : 'marginLeft']: props.marginStart,
    }),
    ...(props.marginEnd && {
      [isRtl ? 'marginLeft' : 'marginRight']: props.marginEnd,
    }),
    ...(props.paddingStart && {
      [isRtl ? 'paddingRight' : 'paddingLeft']: props.paddingStart,
    }),
    ...(props.paddingEnd && {
      [isRtl ? 'paddingLeft' : 'paddingRight']: props.paddingEnd,
    }),
  };
}

/**
 * RTL-aware class name utilities for Tailwind CSS
 */
export interface RTLClassNames {
  /** Classes for LTR direction */
  ltr?: string;
  /** Classes for RTL direction */
  rtl?: string;
  /** Classes for both directions */
  common?: string;
}

/**
 * Returns appropriate class names based on direction
 */
export function getRTLClasses(classes: RTLClassNames, direction: Direction): string {
  const { ltr = '', rtl = '', common = '' } = classes;
  const directionClasses = direction === 'rtl' ? rtl : ltr;

  return [common, directionClasses].filter(Boolean).join(' ');
}

/**
 * Common RTL-aware Tailwind class mappings
 */
export const RTL_CLASSES = {
  // Text alignment
  textLeft: { ltr: 'text-left', rtl: 'text-right' },
  textRight: { ltr: 'text-right', rtl: 'text-left' },

  // Margins
  ml: (size: string) => ({ ltr: `ml-${size}`, rtl: `mr-${size}` }),
  mr: (size: string) => ({ ltr: `mr-${size}`, rtl: `ml-${size}` }),

  // Padding
  pl: (size: string) => ({ ltr: `pl-${size}`, rtl: `pr-${size}` }),
  pr: (size: string) => ({ ltr: `pr-${size}`, rtl: `pl-${size}` }),

  // Positioning
  left: (size: string) => ({ ltr: `left-${size}`, rtl: `right-${size}` }),
  right: (size: string) => ({ ltr: `right-${size}`, rtl: `left-${size}` }),

  // Borders
  borderL: (size: string) => ({ ltr: `border-l-${size}`, rtl: `border-r-${size}` }),
  borderR: (size: string) => ({ ltr: `border-r-${size}`, rtl: `border-l-${size}` }),

  // Rounded corners
  roundedL: (size: string) => ({ ltr: `rounded-l-${size}`, rtl: `rounded-r-${size}` }),
  roundedR: (size: string) => ({ ltr: `rounded-r-${size}`, rtl: `rounded-l-${size}` }),

  // Flex direction
  flexRow: { ltr: 'flex-row', rtl: 'flex-row-reverse' },
  flexRowReverse: { ltr: 'flex-row-reverse', rtl: 'flex-row' },
};

/**
 * Helper function to get RTL-aware class for common patterns
 */
export function rtlClass(pattern: keyof typeof RTL_CLASSES, size?: string, direction: Direction = 'rtl'): string {
  const classMap = RTL_CLASSES[pattern];

  if (typeof classMap === 'function' && size) {
    const classes = classMap(size);
    return direction === 'rtl' ? classes.rtl : classes.ltr;
  }

  if (typeof classMap === 'object') {
    return direction === 'rtl' ? classMap.rtl : classMap.ltr;
  }

  return '';
}

/**
 * Utility to flip transform values for RTL
 */
export function flipTransform(transform: string, direction: Direction): string {
  if (direction !== 'rtl') return transform;

  // Flip translateX values
  return transform.replace(/translateX\((-?\d+(?:\.\d+)?(?:px|%|rem|em)?)\)/g, (match, value) => {
    const numericValue = parseFloat(value);
    const unit = value.replace(numericValue.toString(), '');
    return `translateX(${-numericValue}${unit})`;
  });
}

/**
 * Utility to get appropriate arrow direction for RTL
 */
export function getArrowDirection(
  baseDirection: 'left' | 'right' | 'up' | 'down',
  textDirection: Direction
): 'left' | 'right' | 'up' | 'down' {
  if (textDirection !== 'rtl' || baseDirection === 'up' || baseDirection === 'down') {
    return baseDirection;
  }

  return baseDirection === 'left' ? 'right' : 'left';
}

/**
 * Utility to get appropriate icon rotation for RTL
 */
export function getIconRotation(direction: Direction): string {
  return direction === 'rtl' ? 'rotate-180' : '';
}

/**
 * Utility for RTL-aware sorting
 */
export function sortForDirection<T>(array: T[], direction: Direction, compareFn?: (a: T, b: T) => number): T[] {
  const sorted = compareFn ? [...array].sort(compareFn) : [...array];
  return direction === 'rtl' ? sorted.reverse() : sorted;
}

/**
 * CSS-in-JS helper for RTL styles
 */
export function rtlStyle(
  ltrStyles: Record<string, any>,
  rtlStyles: Record<string, any>,
  direction: Direction
): Record<string, any> {
  return direction === 'rtl' ? { ...ltrStyles, ...rtlStyles } : ltrStyles;
}

/**
 * Utility to get appropriate text alignment based on direction
 */
export function getTextAlign(
  align: 'left' | 'right' | 'center' | 'justify',
  direction: Direction
): 'left' | 'right' | 'center' | 'justify' {
  if (align === 'center' || align === 'justify') return align;
  if (direction !== 'rtl') return align;

  return align === 'left' ? 'right' : 'left';
}

/**
 * Utility to get appropriate flex justify content for RTL
 */
export function getJustifyContent(
  justify: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly',
  direction: Direction
): string {
  if (
    direction !== 'rtl' ||
    justify === 'center' ||
    justify === 'between' ||
    justify === 'around' ||
    justify === 'evenly'
  ) {
    return `justify-${justify}`;
  }

  const flipped = justify === 'start' ? 'end' : 'start';
  return `justify-${flipped}`;
}
