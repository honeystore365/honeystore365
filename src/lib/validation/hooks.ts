// React hooks for form validation

import { useCallback, useState } from 'react';
import { z } from 'zod';
import {
    validateSchema,
    type ValidationError,
    type ValidationOptions,
    type ValidationResult
} from './types';

// Hook for schema-based validation
export interface UseSchemaValidationOptions<T> extends ValidationOptions {
  schema: z.ZodSchema<T>;
  initialData?: Partial<T>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export interface UseSchemaValidationReturn<T> {
  data: Partial<T>;
  errors: Record<string, string>;
  isValid: boolean;
  isValidating: boolean;
  setData: (data: Partial<T>) => void;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string) => void;
  clearFieldError: (field: keyof T) => void;
  clearAllErrors: () => void;
  validate: () => Promise<ValidationResult<T>>;
  validateField: (field: keyof T) => Promise<boolean>;
  reset: () => void;
}

export function useSchemaValidation<T>({
  schema,
  initialData = {},
  validateOnChange = false,
  validateOnBlur = true,
  ...options
}: UseSchemaValidationOptions<T>): UseSchemaValidationReturn<T> {
  const [data, setDataState] = useState<Partial<T>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  const setData = useCallback(
    (newData: Partial<T>) => {
      setDataState(newData);
      if (validateOnChange) {
        // Debounce validation on change
        const timeoutId = setTimeout(() => {
          validate();
        }, 300);
        // Note: cleanup function should be handled by useEffect, not returned here
      }
    },
    [validateOnChange]
  );

  const setFieldValue = useCallback(
    (field: keyof T, value: any) => {
      setDataState(prev => ({ ...prev, [field]: value }));

      if (validateOnChange) {
        // Validate single field on change
        setTimeout(() => {
          validateFieldInternal(field);
        }, 300);
      }
    },
    [validateOnChange]
  );

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field as string]: error }));
  }, []);

  const clearFieldError = useCallback((field: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field as string];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const validateFieldInternal = useCallback(
    async (field: keyof T): Promise<boolean> => {
      try {
        // Check if schema has shape property (ZodObject)
        const fieldSchema = (schema as any).shape?.[field as string];
        if (!fieldSchema) return true;

        const fieldValue = data[field];
        const result = fieldSchema.safeParse(fieldValue);

        if (result.success) {
          clearFieldError(field);
          return true;
        } else {
          const errorMessage = result.error.errors[0]?.message || 'قيمة غير صحيحة';
          setFieldError(field, errorMessage);
          return false;
        }
      } catch (error) {
        setFieldError(field, 'خطأ في التحقق من صحة البيانات');
        return false;
      }
    },
    [data, schema, options, setFieldError, clearFieldError]
  );

  const validateFieldPublic = useCallback(
    async (field: keyof T): Promise<boolean> => {
      setIsValidating(true);
      try {
        return await validateFieldInternal(field);
      } finally {
        setIsValidating(false);
      }
    },
    [validateFieldInternal]
  );

  const validate = useCallback(async (): Promise<ValidationResult<T>> => {
    setIsValidating(true);
    clearAllErrors();

    try {
      const result = validateSchema(schema, data, options);

      if (!result.success && result.errors) {
        const errorMap: Record<string, string> = {};
        result.errors.forEach(error => {
          errorMap[error.field] = error.message;
        });
        setErrors(errorMap);
      }

      return result;
    } finally {
      setIsValidating(false);
    }
  }, [schema, data, options, clearAllErrors]);

  const reset = useCallback(() => {
    setDataState(initialData);
    clearAllErrors();
  }, [initialData, clearAllErrors]);

  const isValid = Object.keys(errors).length === 0;

  return {
    data,
    errors,
    isValid,
    isValidating,
    setData,
    setFieldValue,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    validate,
    validateField: validateFieldPublic,
    reset,
  };
}

// Hook for form validation with React Hook Form integration
export interface UseFormValidationOptions<T> extends ValidationOptions {
  schema: z.ZodSchema<T>;
  mode?: 'onChange' | 'onBlur' | 'onSubmit';
  reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit';
  defaultValues?: Partial<T>;
}

export interface UseFormValidationReturn<T> {
  register: (field: keyof T) => {
    name: string;
    onChange: (value: any) => void;
    onBlur: () => void;
    error?: string;
  };
  handleSubmit: (
    onValid: (data: T) => void | Promise<void>,
    onInvalid?: (errors: ValidationError[]) => void
  ) => (e?: React.FormEvent) => Promise<void>;
  formState: {
    errors: Record<string, string>;
    isValid: boolean;
    isSubmitting: boolean;
    isValidating: boolean;
    isDirty: boolean;
    touchedFields: Record<string, boolean>;
  };
  setValue: (field: keyof T, value: any) => void;
  getValue: (field: keyof T) => any;
  getValues: () => Partial<T>;
  setError: (field: keyof T, error: string) => void;
  clearErrors: (field?: keyof T) => void;
  reset: (values?: Partial<T>) => void;
  watch: (field?: keyof T) => any;
}

export function useFormValidation<T>({
  schema,
  mode = 'onSubmit',
  reValidateMode = 'onChange',
  defaultValues = {},
  ...options
}: UseFormValidationOptions<T>): UseFormValidationReturn<T> {
  const [values, setValues] = useState<Partial<T>>(defaultValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const setValue = useCallback(
    (field: keyof T, value: any) => {
      setValues(prev => ({ ...prev, [field]: value }));
      setIsDirty(true);

      if (mode === 'onChange' || (reValidateMode === 'onChange' && touchedFields[field as string])) {
        validateField(field, value);
      }
    },
    [mode, reValidateMode, touchedFields]
  );

  const getValue = useCallback(
    (field: keyof T) => {
      return values[field];
    },
    [values]
  );

  const getValues = useCallback(() => {
    return values;
  }, [values]);

  const setError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field as string]: error }));
  }, []);

  const clearErrors = useCallback((field?: keyof T) => {
    if (field) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    } else {
      setErrors({});
    }
  }, []);

  const validateField = useCallback(
    async (field: keyof T, value?: any) => {
      setIsValidating(true);
      try {
        // Check if schema has shape property (ZodObject)
        const fieldSchema = (schema as any).shape?.[field as string];
        if (!fieldSchema) return true;

        const fieldValue = value !== undefined ? value : values[field];
        const result = fieldSchema.safeParse(fieldValue);

        if (result.success) {
          clearErrors(field);
          return true;
        } else {
          const errorMessage = result.error.errors[0]?.message || 'قيمة غير صحيحة';
          setError(field, errorMessage);
          return false;
        }
      } finally {
        setIsValidating(false);
      }
    },
    [schema, values, options, setError, clearErrors]
  );

  const validateForm = useCallback(async (): Promise<ValidationResult<T>> => {
    setIsValidating(true);
    clearErrors();

    try {
      const result = validateSchema(schema, values, options);

      if (!result.success && result.errors) {
        const errorMap: Record<string, string> = {};
        result.errors.forEach(error => {
          errorMap[error.field] = error.message;
        });
        setErrors(errorMap);
      }

      return result;
    } finally {
      setIsValidating(false);
    }
  }, [schema, values, options, clearErrors]);

  const register = useCallback(
    (field: keyof T) => {
      return {
        name: field as string,
        onChange: (value: any) => setValue(field, value),
        onBlur: () => {
          setTouchedFields(prev => ({ ...prev, [field as string]: true }));
          if (mode === 'onBlur' || reValidateMode === 'onBlur') {
            validateField(field);
          }
        },
        error: errors[field as string],
      };
    },
    [setValue, errors, mode, reValidateMode, validateField]
  );

  const handleSubmit = useCallback(
    (onValid: (data: T) => void | Promise<void>, onInvalid?: (errors: ValidationError[]) => void) => {
      return async (e?: React.FormEvent) => {
        if (e) {
          e.preventDefault();
        }

        setIsSubmitting(true);

        try {
          const result = await validateForm();

          if (result.success && result.data) {
            await onValid(result.data);
          } else if (result.errors && onInvalid) {
            onInvalid(result.errors);
          }
        } finally {
          setIsSubmitting(false);
        }
      };
    },
    [validateForm]
  );

  const reset = useCallback(
    (newValues?: Partial<T>) => {
      setValues(newValues || defaultValues);
      setErrors({});
      setTouchedFields({});
      setIsDirty(false);
      setIsSubmitting(false);
      setIsValidating(false);
    },
    [defaultValues]
  );

  const watch = useCallback(
    (field?: keyof T) => {
      if (field) {
        return values[field];
      }
      return values;
    },
    [values]
  );

  const isValid = Object.keys(errors).length === 0;

  return {
    register,
    handleSubmit,
    formState: {
      errors,
      isValid,
      isSubmitting,
      isValidating,
      isDirty,
      touchedFields,
    },
    setValue,
    getValue,
    getValues,
    setError,
    clearErrors,
    reset,
    watch,
  };
}

// Hook for async validation (e.g., checking if email exists)
export interface UseAsyncValidationOptions {
  debounceMs?: number;
  validateOnMount?: boolean;
}

export interface UseAsyncValidationReturn {
  isValidating: boolean;
  error: string | null;
  isValid: boolean;
  validate: (value: any) => Promise<boolean>;
  reset: () => void;
}

export function useAsyncValidation(
  validator: (value: any) => Promise<{ isValid: boolean; error?: string }>,
  options: UseAsyncValidationOptions = {}
): UseAsyncValidationReturn {
  const { debounceMs = 500, validateOnMount = false } = options;
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  const validate = useCallback(
    async (value: any): Promise<boolean> => {
      setIsValidating(true);
      setError(null);

      try {
        // Debounce the validation
        await new Promise(resolve => setTimeout(resolve, debounceMs));

        const result = await validator(value);

        setIsValid(result.isValid);
        if (!result.isValid && result.error) {
          setError(result.error);
        }

        return result.isValid;
      } catch (err) {
        setError('خطأ في التحقق من صحة البيانات');
        setIsValid(false);
        return false;
      } finally {
        setIsValidating(false);
      }
    },
    [validator, debounceMs]
  );

  const reset = useCallback(() => {
    setIsValidating(false);
    setError(null);
    setIsValid(false);
  }, []);

  return {
    isValidating,
    error,
    isValid,
    validate,
    reset,
  };
}
