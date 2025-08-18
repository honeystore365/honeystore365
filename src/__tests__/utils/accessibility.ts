import { RenderResult } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

/**
 * Test accessibility of a rendered component
 * @param container - The container element from render result
 * @param axeOptions - Optional axe configuration
 */
export const testAccessibility = async (
  container: Element,
  axeOptions?: any
) => {
  const results = await axe(container, axeOptions)
  expect(results).toHaveNoViolations()
}

/**
 * Test accessibility with custom rules
 * @param container - The container element from render result
 * @param rules - Specific accessibility rules to test
 */
export const testAccessibilityWithRules = async (
  container: Element,
  rules: string[]
) => {
  const results = await axe(container, {
    rules: rules.reduce((acc, rule) => {
      acc[rule] = { enabled: true }
      return acc
    }, {} as Record<string, { enabled: boolean }>)
  })
  expect(results).toHaveNoViolations()
}

/**
 * Common accessibility test configurations
 */
export const accessibilityConfigs = {
  // Test only WCAG 2.1 AA rules
  wcag21aa: {
    tags: ['wcag2a', 'wcag2aa', 'wcag21aa']
  },
  
  // Test keyboard navigation
  keyboard: {
    rules: {
      'keyboard': { enabled: true },
      'focus-order-semantics': { enabled: true },
      'tabindex': { enabled: true }
    }
  },
  
  // Test color contrast
  colorContrast: {
    rules: {
      'color-contrast': { enabled: true },
      'color-contrast-enhanced': { enabled: true }
    }
  },
  
  // Test ARIA usage
  aria: {
    rules: {
      'aria-allowed-attr': { enabled: true },
      'aria-required-attr': { enabled: true },
      'aria-valid-attr': { enabled: true },
      'aria-valid-attr-value': { enabled: true }
    }
  }
}

/**
 * Test component accessibility with common scenarios
 * @param renderResult - Result from render function
 */
export const runAccessibilityTests = async (renderResult: RenderResult) => {
  const { container } = renderResult
  
  // Test general accessibility
  await testAccessibility(container)
  
  // Test WCAG 2.1 AA compliance
  await testAccessibility(container, accessibilityConfigs.wcag21aa)
  
  // Test keyboard navigation
  await testAccessibility(container, accessibilityConfigs.keyboard)
  
  // Test color contrast
  await testAccessibility(container, accessibilityConfigs.colorContrast)
  
  // Test ARIA usage
  await testAccessibility(container, accessibilityConfigs.aria)
}