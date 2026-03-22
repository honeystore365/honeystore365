'use client';

import { Textarea } from '@/components/ui/textarea';
import { FormField } from './FormField';
import { useFormValidation } from '../form-provider';
import { cn } from '@/lib/utils';
import React from 'react';

export interface FormTextareaProps {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  minLength?: number;
  dir?: 'ltr' | 'rtl' | 'auto';
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  showCharacterCount?: boolean;
  debounceMs?: number;
  validateOnChange?: boolean;
}

export function FormTextarea({
  name,
  label,
  description,
  required = false,
  className = '',
  disabled = false,
  placeholder,
  rows = 4,
  maxLength,
  minLength,
  dir = 'auto',
  resize = 'vertical',
  showCharacterCount = true,
  debounceMs = 300,
  validateOnChange = true,
}: FormTextareaProps) {
  const { register, formState, watch } = useFormValidation();
  const { errors } = formState;
  const fieldRegistration = register(name);
  const error = errors[name];
  const currentValue = watch(name) || '';

  const [validationState, setValidationState] = React.useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const debounceRef = React.useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    if (!validateOnChange || !currentValue) { setValidationState('idle'); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setValidationState('validating');
    debounceRef.current = setTimeout(() => {
      setValidationState(!error ? 'valid' : 'invalid');
    }, debounceMs);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [currentValue, validateOnChange, debounceMs, name, error]);

  const getCharacterCountColor = () => {
    if (!maxLength) return 'text-gray-500';
    const percentage = (currentValue.length / maxLength) * 100;
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 75) return 'text-yellow-500';
    return 'text-gray-500';
  };

  const resizeClasses = { none: 'resize-none', vertical: 'resize-y', horizontal: 'resize-x', both: 'resize' };

  return (
    <FormField name={name} label={label} description={description} required={required} className={className} error={error} validationState={validationState} showValidationIcon={false}>
      <div className="relative">
        <Textarea
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          minLength={minLength}
          disabled={disabled}
          dir={dir}
          className={cn(
            resizeClasses[resize],
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            validationState === 'valid' && !error && 'border-green-500 focus:border-green-500 focus:ring-green-500',
            showCharacterCount && maxLength && 'pb-8'
          )}
          {...fieldRegistration}
        />
        {showCharacterCount && (maxLength || minLength) && (
          <div className="absolute bottom-2 left-2 flex items-center space-x-2 space-x-reverse text-xs">
            {maxLength && <span className={getCharacterCountColor()}>{currentValue.length}/{maxLength}</span>}
            {minLength && currentValue.length < minLength && <span className="text-yellow-500">الحد الأدنى: {minLength} حرف</span>}
          </div>
        )}
        {validationState === 'validating' && (
          <div className="absolute top-2 left-2">
            <svg className="w-4 h-4 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}
      </div>
    </FormField>
  );
}
