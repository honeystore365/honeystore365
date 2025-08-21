import { setupUnitTest } from '../utils/test-env-setup';

// Setup the test environment
setupUnitTest();

// Simple validation function to test
function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

describe('Email Validation', () => {
  it('should validate correct email formats', () => {
    // Arrange & Act & Assert
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name@domain.co')).toBe(true);
    expect(validateEmail('user+tag@example.org')).toBe(true);
  });

  it('should reject invalid email formats', () => {
    // Arrange & Act & Assert
    expect(validateEmail('test')).toBe(false);
    expect(validateEmail('test@')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
    expect(validateEmail('test@example')).toBe(false);
  });
});