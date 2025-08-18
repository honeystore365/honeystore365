// Main exports for the validation system

// Base validation utilities
export {
    createValidationResult,
    formatValidationErrors,
    validateField,
    validateSchema,
    type FieldValidationResult,
    type ValidationOptions,
    type ValidationResult
} from './types';

// Schema validators
export {
    AddressSchema,
    CartItemSchema,
    CartSchema,
    CategorySchema,
    CustomerSchema,
    OrderItemSchema,
    OrderSchema,
    PaymentSchema,
    ProductSchema,
    ProfileSchema,
    ReviewSchema,
    UserRoleSchema,
    WishlistItemSchema,
    WishlistSchema,
    type AddressInput,
    type CartInput,
    type CartItemInput,
    type CategoryInput,
    type CustomerInput,
    type OrderInput,
    type OrderItemInput,
    type PaymentInput,
    type ProductInput,
    type ProfileInput,
    type ReviewInput,
    type UserRoleInput,
    type WishlistInput,
    type WishlistItemInput
} from './schemas';

// Form validation schemas
export {
    AddressFormSchema,
    ContactFormSchema,
    LoginFormSchema,
    ProfileFormSchema,
    RegisterFormSchema,
    ReviewFormSchema,
    SearchFormSchema,
    type AddressFormInput,
    type ContactFormInput,
    type LoginFormInput,
    type ProfileFormInput,
    type RegisterFormInput,
    type ReviewFormInput,
    type SearchFormInput
} from './forms';

// Validation hooks
export {
    useFormValidation,
    useSchemaValidation,
    type UseFormValidationOptions,
    type UseFormValidationReturn,
    type UseSchemaValidationOptions,
    type UseSchemaValidationReturn
} from './hooks';

// Validation utilities
export {
    createFieldValidator,
    createFormValidator,
    validateEmail,
    validatePassword,
    validatePhoneNumber,
    validatePostalCode,
    validatePrice,
    validateQuantity,
    validateRating,
    validateUrl
} from './utils';

// Re-export commonly used Zod utilities
export { z } from 'zod';
