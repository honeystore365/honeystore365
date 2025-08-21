import {
    createFieldValidator,
    createFormValidator,
    formatPhoneNumber,
    formatPrice,
    normalizeArabicText,
    sanitizeInput,
    validateArabicText,
    validateBusinessRules,
    validateEmail,
    validateEnglishText,
    validateFileUpload,
    validateMixedText,
    validateMultipleFiles,
    validatePassword,
    validatePhoneNumber,
    validatePostalCode,
    validatePrice,
    validateQuantity,
    validateRating,
    validateUrl,
} from '@/lib/validation/utils';
import { z } from 'zod';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@example.co.uk')).toBe(true);
      expect(validateEmail('user-name@domain.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('test')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('test@domain')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('test@domain.')).toBe(false);
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate correct phone numbers', () => {
      expect(validatePhoneNumber('+966501234567')).toBe(true);
      expect(validatePhoneNumber('0501234567')).toBe(true);
      expect(validatePhoneNumber('966501234567')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhoneNumber('123')).toBe(false);
      expect(validatePhoneNumber('abcdefghijk')).toBe(false);
      expect(validatePhoneNumber('+9665012345')).toBe(false); // Too short
      expect(validatePhoneNumber('+96650123456789')).toBe(false); // Too long
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const result = validatePassword('StrongP@ss1');
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('strong');
      expect(result.issues.length).toBe(0);
    });

    it('should identify medium strength passwords', () => {
      const result = validatePassword('StrongP1');
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('medium');
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.length).toBeLessThan(3);
    });

    it('should identify weak passwords', () => {
      const result = validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('weak');
      expect(result.issues.length).toBeGreaterThan(2);
    });

    it('should check for minimum length', () => {
      const result = validatePassword('Sh@1');
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('يجب أن تحتوي على 8 أحرف على الأقل');
    });

    it('should check for lowercase letters', () => {
      const result = validatePassword('STRONG@123');
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('يجب أن تحتوي على حرف صغير واحد على الأقل');
    });

    it('should check for uppercase letters', () => {
      const result = validatePassword('strong@123');
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('يجب أن تحتوي على حرف كبير واحد على الأقل');
    });

    it('should check for numbers', () => {
      const result = validatePassword('StrongPass@');
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('يجب أن تحتوي على رقم واحد على الأقل');
    });

    it('should check for special characters', () => {
      const result = validatePassword('StrongPass1');
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('يجب أن تحتوي على رمز خاص واحد على الأقل');
    });
  });

  describe('validateUrl', () => {
    it('should validate correct URLs', () => {
      expect(validateUrl('https://example.com')).toBe(true);
      expect(validateUrl('http://example.co.uk/path')).toBe(true);
      expect(validateUrl('https://sub.domain.org:8080/path?query=value')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(validateUrl('example')).toBe(false);
      expect(validateUrl('example.com')).toBe(false); // Missing protocol
      expect(validateUrl('http://')).toBe(false);
      expect(validateUrl('http://.')).toBe(false);
    });
  });

  describe('validatePostalCode', () => {
    it('should validate correct postal codes', () => {
      expect(validatePostalCode('12345')).toBe(true);
      expect(validatePostalCode('12345-6789')).toBe(true);
    });

    it('should reject invalid postal codes', () => {
      expect(validatePostalCode('123')).toBe(false);
      expect(validatePostalCode('1234a')).toBe(false);
      expect(validatePostalCode('123456')).toBe(false);
      expect(validatePostalCode('12345-')).toBe(false);
    });
  });

  describe('validatePrice', () => {
    it('should validate valid prices', () => {
      expect(validatePrice(10)).toBe(true);
      expect(validatePrice(0)).toBe(true);
      expect(validatePrice(99.99)).toBe(true);
    });

    it('should reject invalid prices', () => {
      expect(validatePrice(-1)).toBe(false);
      expect(validatePrice(NaN)).toBe(false);
      expect(validatePrice(Infinity)).toBe(false);
    });
  });

  describe('validateQuantity', () => {
    it('should validate valid quantities', () => {
      expect(validateQuantity(1)).toBe(true);
      expect(validateQuantity(100)).toBe(true);
      expect(validateQuantity(1000)).toBe(true);
    });

    it('should reject invalid quantities', () => {
      expect(validateQuantity(0)).toBe(false);
      expect(validateQuantity(-1)).toBe(false);
      expect(validateQuantity(1001)).toBe(false);
      expect(validateQuantity(1.5)).toBe(false);
    });
  });

  describe('validateRating', () => {
    it('should validate valid ratings', () => {
      expect(validateRating(1)).toBe(true);
      expect(validateRating(3)).toBe(true);
      expect(validateRating(5)).toBe(true);
    });

    it('should reject invalid ratings', () => {
      expect(validateRating(0)).toBe(false);
      expect(validateRating(6)).toBe(false);
      expect(validateRating(3.5)).toBe(false);
      expect(validateRating(-1)).toBe(false);
    });
  });

  describe('validateArabicText', () => {
    it('should validate Arabic text', () => {
      expect(validateArabicText('مرحبا بالعالم')).toBe(true);
      expect(validateArabicText('هذا نص باللغة العربية')).toBe(true);
    });

    it('should reject non-Arabic text', () => {
      expect(validateArabicText('Hello')).toBe(false);
      expect(validateArabicText('مرحبا Hello')).toBe(false);
      expect(validateArabicText('123')).toBe(false);
    });
  });

  describe('validateEnglishText', () => {
    it('should validate English text', () => {
      expect(validateEnglishText('Hello world')).toBe(true);
      expect(validateEnglishText('This is English text')).toBe(true);
    });

    it('should reject non-English text', () => {
      expect(validateEnglishText('مرحبا')).toBe(false);
      expect(validateEnglishText('Hello مرحبا')).toBe(false);
    });
  });

  describe('validateMixedText', () => {
    it('should validate mixed text', () => {
      expect(validateMixedText('Hello مرحبا')).toBe(true);
      expect(validateMixedText('مرحبا 123')).toBe(true);
      expect(validateMixedText('Hello 123')).toBe(true);
    });

    it('should reject invalid characters', () => {
      expect(validateMixedText('Hello@world')).toBe(false);
      expect(validateMixedText('مرحبا!')).toBe(false);
    });
  });

  describe('createFieldValidator', () => {
    it('should create a validator that validates correctly', () => {
      const schema = z.string().email();
      const validator = createFieldValidator(schema);

      expect(validator('test@example.com').success).toBe(true);
      expect(validator('invalid').success).toBe(false);
      expect(validator('invalid').error).toBeTruthy();
    });
  });

  describe('createFormValidator', () => {
    it('should create a form validator that validates correctly', () => {
      const schema = z.object({
        email: z.string().email(),
        name: z.string().min(2),
      });
      const validator = createFormValidator(schema);

      const validResult = validator({
        email: 'test@example.com',
        name: 'Test',
      });
      expect(validResult.success).toBe(true);
      expect(validResult.data).toEqual({
        email: 'test@example.com',
        name: 'Test',
      });

      const invalidResult = validator({
        email: 'invalid',
        name: '',
      });
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.errors?.length).toBeGreaterThan(0);
    });
  });

  describe('sanitizeInput', () => {
    it('should trim whitespace', () => {
      expect(sanitizeInput('  test  ')).toBe('test');
    });

    it('should replace multiple spaces with single space', () => {
      expect(sanitizeInput('test    example')).toBe('test example');
    });

    it('should remove potential HTML tags', () => {
      expect(sanitizeInput('test<script>alert("xss")</script>')).toBe('testscriptalert("xss")/script');
    });
  });

  describe('normalizeArabicText', () => {
    it('should normalize Arabic characters', () => {
      expect(normalizeArabicText('يوسف')).toBe('ىوسف');
      expect(normalizeArabicText('فاطمة')).toBe('فاطمه');
      expect(normalizeArabicText('أحمد')).toBe('احمد');
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format Saudi phone numbers correctly', () => {
      expect(formatPhoneNumber('501234567')).toBe('+966501234567');
      expect(formatPhoneNumber('0501234567')).toBe('+966501234567');
      expect(formatPhoneNumber('966501234567')).toBe('+966501234567');
    });

    it('should return original if not recognized format', () => {
      expect(formatPhoneNumber('123456789')).toBe('123456789');
    });
  });

  describe('formatPrice', () => {
    it('should format prices in Saudi Riyal', () => {
      const formatted = formatPrice(100);
      expect(formatted).toContain('100');
      expect(formatted).toContain('SAR');
    });

    it('should use specified currency', () => {
      const formatted = formatPrice(100, 'USD');
      expect(formatted).toContain('100');
      expect(formatted).toContain('USD');
    });
  });

  describe('validateFileUpload', () => {
    it('should validate files within size limit', () => {
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

      const result = validateFileUpload(file);
      expect(result.isValid).toBe(true);
    });

    it('should reject files exceeding size limit', () => {
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 }); // 10MB

      const result = validateFileUpload(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('حجم الملف كبير جداً');
    });

    it('should reject files with unsupported types', () => {
      const file = new File(['test content'], 'test.exe', { type: 'application/octet-stream' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

      const result = validateFileUpload(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('نوع الملف غير مدعوم');
    });
  });

  describe('validateMultipleFiles', () => {
    it('should validate multiple files within limits', () => {
      const file1 = new File(['test content'], 'test1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['test content'], 'test2.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file1, 'size', { value: 1024 * 1024 }); // 1MB
      Object.defineProperty(file2, 'size', { value: 1024 * 1024 }); // 1MB

      const result = validateMultipleFiles([file1, file2]);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject if too many files', () => {
      const files = Array(6).fill(null).map((_, i) => {
        const file = new File(['test content'], `test${i}.jpg`, { type: 'image/jpeg' });
        Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB
        return file;
      });

      const result = validateMultipleFiles(files);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('يمكن رفع 5 ملفات كحد أقصى');
    });

    it('should report errors for individual files', () => {
      const file1 = new File(['test content'], 'test1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['test content'], 'test2.exe', { type: 'application/octet-stream' });
      Object.defineProperty(file1, 'size', { value: 1024 * 1024 }); // 1MB
      Object.defineProperty(file2, 'size', { value: 1024 * 1024 }); // 1MB

      const result = validateMultipleFiles([file1, file2]);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('الملف 2');
    });
  });

  describe('validateBusinessRules', () => {
    describe('productInStock', () => {
      it('should validate when stock is sufficient', () => {
        expect(validateBusinessRules.productInStock(10, 5)).toBe(true);
        expect(validateBusinessRules.productInStock(5, 5)).toBe(true);
      });

      it('should reject when stock is insufficient', () => {
        expect(validateBusinessRules.productInStock(3, 5)).toBe(false);
      });
    });

    describe('canReviewProduct', () => {
      it('should allow review when purchased and no existing review', () => {
        expect(validateBusinessRules.canReviewProduct(true, false)).toBe(true);
      });

      it('should reject review when not purchased', () => {
        expect(validateBusinessRules.canReviewProduct(false, false)).toBe(false);
      });

      it('should reject review when already reviewed', () => {
        expect(validateBusinessRules.canReviewProduct(true, true)).toBe(false);
      });
    });

    describe('canCancelOrder', () => {
      it('should allow cancellation for pending orders within 24 hours', () => {
        const orderDate = new Date(Date.now() - 12 * 60 * 60 * 1000); // 12 hours ago
        expect(validateBusinessRules.canCancelOrder('pending', orderDate)).toBe(true);
      });

      it('should reject cancellation for non-pending orders', () => {
        const orderDate = new Date(Date.now() - 12 * 60 * 60 * 1000); // 12 hours ago
        expect(validateBusinessRules.canCancelOrder('processing', orderDate)).toBe(false);
      });

      it('should reject cancellation for orders older than 24 hours', () => {
        const orderDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
        expect(validateBusinessRules.canCancelOrder('pending', orderDate)).toBe(false);
      });
    });

    describe('isDiscountValid', () => {
      it('should validate active discounts within expiry and usage limits', () => {
        const code = {
          isActive: true,
          expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day in future
          usageLimit: 100,
          usageCount: 50,
        };
        expect(validateBusinessRules.isDiscountValid(code, 200)).toBe(true);
      });

      it('should reject inactive discounts', () => {
        const code = {
          isActive: false,
          expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          usageLimit: 100,
          usageCount: 50,
        };
        expect(validateBusinessRules.isDiscountValid(code, 200)).toBe(false);
      });

      it('should reject expired discounts', () => {
        const code = {
          isActive: true,
          expiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day in past
          usageLimit: 100,
          usageCount: 50,
        };
        expect(validateBusinessRules.isDiscountValid(code, 200)).toBe(false);
      });

      it('should reject discounts that reached usage limit', () => {
        const code = {
          isActive: true,
          expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          usageLimit: 100,
          usageCount: 100,
        };
        expect(validateBusinessRules.isDiscountValid(code, 200)).toBe(false);
      });

      it('should check minimum order amount if specified', () => {
        const code = {
          isActive: true,
          expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          usageLimit: 100,
          usageCount: 50,
        };
        expect(validateBusinessRules.isDiscountValid(code, 150, 200)).toBe(false);
        expect(validateBusinessRules.isDiscountValid(code, 250, 200)).toBe(true);
      });
    });
  });
});