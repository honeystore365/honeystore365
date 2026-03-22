'use client';

import { Input } from '@/components/ui/input';
import { FormField } from './FormField';
import { useFormValidation } from '../form-provider';
import { cn } from '@/lib/utils';
import React from 'react';

export interface FormInputProps {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number' | 'date' | 'datetime-local' | 'time';
  placeholder?: string;
  autoComplete?: string;
  dir?: 'ltr' | 'rtl' | 'auto';
  min?: string | number;
  max?: string | number;
  step?: string | number;
  pattern?: string;
  showPasswordToggle?: boolean;
  debounceMs?: number;
  validateOnChange?: boolean;
}

export function FormInput({
  name,
  label,
  description,
  required = false,
  className = '',
  disabled = false,
  type = 'text',
  placeholder,
  autoComplete,
  dir = 'auto',
  min,
  max,
  step,
  pattern,
  showPasswordToggle = false,
  debounceMs = 300,
  validateOnChange = true,
}: FormInputProps) {
  const { register, formState, watch } = useFormValidation();
  const { errors } = formState;
  const fieldRegistration = register(name);
  const error = errors[name];
  const currentValue = watch(name);

  const [showPassword, setShowPassword] = React.useState(false);
  const [validationState, setValidationState] = React.useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const debounceRef = React.useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    if (!validateOnChange || !currentValue) {
      setValidationState('idle');
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setValidationState('validating');
    debounceRef.current = setTimeout(() => {
      const isValid = !error;
      setValidationState(isValid ? 'valid' : 'invalid');
    }, debounceMs);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [currentValue, validateOnChange, debounceMs, name, error]);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <FormField name={name} label={label} description={description} required={required} className={className} error={error} validationState={validationState} showValidationIcon={type !== 'password'}>
      <div className="relative">
        <Input
          type={inputType}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          dir={dir}
          min={min}
          max={max}
          step={step}
          pattern={pattern}
          className={cn(
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            validationState === 'valid' && !error && 'border-green-500 focus:border-green-500 focus:ring-green-500',
            showPasswordToggle && type === 'password' && 'pr-10'
          )}
          {...fieldRegistration}
        />
        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          >
            {showPassword ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
      </div>
    </FormField>
  );
}
