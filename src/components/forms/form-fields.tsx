'use client';

// Enhanced reusable form field components with integrated validation and improved UX

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import React from 'react';
import { useFormValidation } from './form-provider';

// Base form field props
interface BaseFormFieldProps {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

// Enhanced form field wrapper component with improved UX
interface FormFieldProps extends BaseFormFieldProps {
  children: React.ReactNode;
  error?: string;
  showValidationIcon?: boolean;
  validationState?: 'idle' | 'validating' | 'valid' | 'invalid';
}

export function FormField({
  name,
  label,
  description,
  required = false,
  className = '',
  children,
  error,
  showValidationIcon = true,
  validationState = 'idle',
}: FormFieldProps) {
  const fieldId = `field-${name}`;
  const errorId = `${fieldId}-error`;
  const descriptionId = `${fieldId}-description`;
  const [isFocused, setIsFocused] = React.useState(false);

  const getValidationIcon = () => {
    if (!showValidationIcon || validationState === 'idle') return null;

    switch (validationState) {
      case 'validating':
        return (
          <div className='absolute left-3 top-1/2 transform -translate-y-1/2'>
            <svg className='w-4 h-4 text-gray-400 animate-spin' fill='none' viewBox='0 0 24 24'>
              <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
              <path
                className='opacity-75'
                fill='currentColor'
                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              />
            </svg>
          </div>
        );
      case 'valid':
        return (
          <div className='absolute left-3 top-1/2 transform -translate-y-1/2'>
            <svg className='w-4 h-4 text-green-500' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                clipRule='evenodd'
              />
            </svg>
          </div>
        );
      case 'invalid':
        return (
          <div className='absolute left-3 top-1/2 transform -translate-y-1/2'>
            <svg className='w-4 h-4 text-red-500' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                clipRule='evenodd'
              />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn('space-y-2 transition-all duration-200', isFocused && 'scale-[1.01]', className)}>
      {label && (
        <Label
          htmlFor={fieldId}
          className={cn(
            'text-sm font-medium transition-colors duration-200',
            error && 'text-red-600',
            isFocused && !error && 'text-blue-600',
            required && "after:content-['*'] after:text-red-500 after:mr-1"
          )}
        >
          {label}
        </Label>
      )}

      <div className='relative'>
        {React.cloneElement(children as React.ReactElement, {
          id: fieldId,
          'aria-describedby':
            [description ? descriptionId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined,
          'aria-invalid': !!error,
          onFocus: (e: React.FocusEvent) => {
            setIsFocused(true);
            if (React.isValidElement(children)) {
              children.props.onFocus?.(e);
            }
          },
          onBlur: (e: React.FocusEvent) => {
            setIsFocused(false);
            if (React.isValidElement(children)) {
              children.props.onBlur?.(e);
            }
          },
          className: cn(
            React.isValidElement(children) ? children.props.className : '',
            showValidationIcon && validationState !== 'idle' && 'pl-10',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            validationState === 'valid' && !error && 'border-green-500 focus:border-green-500 focus:ring-green-500'
          ),
        })}
        {getValidationIcon()}
      </div>

      {description && (
        <p id={descriptionId} className='text-sm text-gray-600 transition-colors duration-200'>
          {description}
        </p>
      )}

      {error && (
        <div
          id={errorId}
          className='text-sm text-red-600 flex items-center animate-in slide-in-from-top-1 duration-200'
          role='alert'
          aria-live='polite'
        >
          <svg className='w-4 h-4 mr-1 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20' aria-hidden='true'>
            <path
              fillRule='evenodd'
              d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
              clipRule='evenodd'
            />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}

// Enhanced form input component with real-time validation
export interface FormInputProps extends BaseFormFieldProps {
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
  const { errors, isValidating } = formState;
  const fieldRegistration = register(name);
  const error = errors[name];
  const currentValue = watch(name);

  const [showPassword, setShowPassword] = React.useState(false);
  const [validationState, setValidationState] = React.useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const debounceRef = React.useRef<NodeJS.Timeout>();

  // Handle real-time validation
  React.useEffect(() => {
    if (!validateOnChange || !currentValue) {
      setValidationState('idle');
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setValidationState('validating');

    debounceRef.current = setTimeout(async () => {
      try {
        // Simple validation based on error state
        const isValid = !error;
        setValidationState(isValid ? 'valid' : 'invalid');
      } catch {
        setValidationState('invalid');
      }
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [currentValue, validateOnChange, debounceMs, name, error]);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <FormField
      name={name}
      label={label}
      description={description}
      required={required}
      className={className}
      error={error}
      validationState={validationState}
      showValidationIcon={type !== 'password'}
    >
      <div className='relative'>
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
            type='button'
            className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600'
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          >
            {showPassword ? (
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21'
                />
              </svg>
            ) : (
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                />
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                />
              </svg>
            )}
          </button>
        )}
      </div>
    </FormField>
  );
}

// Enhanced form textarea component with real-time validation and character count
export interface FormTextareaProps extends BaseFormFieldProps {
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

  // Handle real-time validation
  React.useEffect(() => {
    if (!validateOnChange || !currentValue) {
      setValidationState('idle');
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setValidationState('validating');

    debounceRef.current = setTimeout(async () => {
      try {
        // Simple validation based on error state
        const isValid = !error;
        setValidationState(isValid ? 'valid' : 'invalid');
      } catch {
        setValidationState('invalid');
      }
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [currentValue, validateOnChange, debounceMs, name, error]);

  const getCharacterCountColor = () => {
    if (!maxLength) return 'text-gray-500';
    const percentage = (currentValue.length / maxLength) * 100;
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 75) return 'text-yellow-500';
    return 'text-gray-500';
  };

  const resizeClasses = {
    none: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x',
    both: 'resize',
  };

  return (
    <FormField
      name={name}
      label={label}
      description={description}
      required={required}
      className={className}
      error={error}
      validationState={validationState}
      showValidationIcon={false}
    >
      <div className='relative'>
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
          <div className='absolute bottom-2 left-2 flex items-center space-x-2 space-x-reverse text-xs'>
            {maxLength && (
              <span className={getCharacterCountColor()}>
                {currentValue.length}/{maxLength}
              </span>
            )}
            {minLength && currentValue.length < minLength && (
              <span className='text-yellow-500'>الحد الأدنى: {minLength} حرف</span>
            )}
          </div>
        )}

        {validationState === 'validating' && (
          <div className='absolute top-2 left-2'>
            <svg className='w-4 h-4 text-gray-400 animate-spin' fill='none' viewBox='0 0 24 24'>
              <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
              <path
                className='opacity-75'
                fill='currentColor'
                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              />
            </svg>
          </div>
        )}
      </div>
    </FormField>
  );
}

// Form select component
export interface FormSelectProps extends BaseFormFieldProps {
  placeholder?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

export function FormSelect({
  name,
  label,
  description,
  required = false,
  className = '',
  disabled = false,
  placeholder = 'اختر خيار...',
  options,
}: FormSelectProps) {
  const { setValue, getValue, formState } = useFormValidation();
  const { errors } = formState;
  const error = errors[name];
  const value = getValue(name);

  return (
    <FormField
      name={name}
      label={label}
      description={description}
      required={required}
      className={className}
      error={error}
    >
      <Select value={value || ''} onValueChange={newValue => setValue(name, newValue)} disabled={disabled}>
        <SelectTrigger className={cn(error && 'border-red-500 focus:border-red-500 focus:ring-red-500')}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}

// Form checkbox component
export interface FormCheckboxProps extends BaseFormFieldProps {
  text: string;
}

export function FormCheckbox({
  name,
  label,
  description,
  required = false,
  className = '',
  disabled = false,
  text,
}: FormCheckboxProps) {
  const { setValue, getValue, formState } = useFormValidation();
  const { errors } = formState;
  const error = errors[name];
  const checked = getValue(name) || false;

  return (
    <FormField
      name={name}
      label={label}
      description={description}
      required={required}
      className={className}
      error={error}
    >
      <div className='flex items-start space-x-2 space-x-reverse'>
        <Checkbox
          checked={checked}
          onCheckedChange={newChecked => setValue(name, newChecked)}
          disabled={disabled}
          className={cn(error && 'border-red-500')}
        />
        <div className='grid gap-1.5 leading-none'>
          <Label className={cn('text-sm font-normal cursor-pointer', error && 'text-red-600')}>
            {text}
            {required && <span className='text-red-500 mr-1'>*</span>}
          </Label>
        </div>
      </div>
    </FormField>
  );
}

// Form radio group component
export interface FormRadioGroupProps extends BaseFormFieldProps {
  options: Array<{ value: string; label: string; description?: string; disabled?: boolean }>;
  orientation?: 'horizontal' | 'vertical';
}

export function FormRadioGroup({
  name,
  label,
  description,
  required = false,
  className = '',
  disabled = false,
  options,
  orientation = 'vertical',
}: FormRadioGroupProps) {
  const { setValue, getValue, formState } = useFormValidation();
  const { errors } = formState;
  const error = errors[name];
  const value = getValue(name);

  return (
    <FormField
      name={name}
      label={label}
      description={description}
      required={required}
      className={className}
      error={error}
    >
      <RadioGroup
        value={value || ''}
        onValueChange={newValue => setValue(name, newValue)}
        disabled={disabled}
        className={orientation === 'horizontal' ? 'flex flex-wrap gap-6' : 'space-y-3'}
      >
        {options.map(option => (
          <div key={option.value} className='flex items-start space-x-2 space-x-reverse'>
            <RadioGroupItem
              value={option.value}
              disabled={option.disabled || disabled}
              className={cn(error && 'border-red-500')}
            />
            <div className='grid gap-1.5 leading-none'>
              <Label className='text-sm font-normal cursor-pointer'>{option.label}</Label>
              {option.description && <p className='text-xs text-gray-600'>{option.description}</p>}
            </div>
          </div>
        ))}
      </RadioGroup>
    </FormField>
  );
}

// Form file input component
export interface FormFileInputProps extends BaseFormFieldProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  onFileChange?: (files: FileList | null) => void;
}

export function FormFileInput({
  name,
  label,
  description,
  required = false,
  className = '',
  disabled = false,
  accept,
  multiple = false,
  maxSize,
  onFileChange,
}: FormFileInputProps) {
  const { setValue, formState } = useFormValidation();
  const { errors } = formState;
  const error = errors[name];
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    setValue(name, files);
    if (onFileChange) {
      onFileChange(files);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <FormField
      name={name}
      label={label}
      description={description}
      required={required}
      className={className}
      error={error}
    >
      <div className='space-y-2'>
        <input
          ref={fileInputRef}
          type='file'
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleFileChange}
          className={cn(
            'block w-full text-sm text-gray-500',
            'file:mr-4 file:py-2 file:px-4',
            'file:rounded-md file:border-0',
            'file:text-sm file:font-medium',
            'file:bg-blue-50 file:text-blue-700',
            'hover:file:bg-blue-100',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'file:bg-red-50 file:text-red-700'
          )}
        />

        {maxSize && <p className='text-xs text-gray-500'>الحد الأقصى لحجم الملف: {formatFileSize(maxSize)}</p>}
      </div>
    </FormField>
  );
}

// Enhanced FormError component for displaying validation errors
export interface FormErrorProps {
  error?: string | string[];
  className?: string;
  showIcon?: boolean;
}

export function FormError({ error, className = '', showIcon = true }: FormErrorProps) {
  if (!error) return null;

  const errors = Array.isArray(error) ? error : [error];

  return (
    <div className={cn('text-sm text-red-600 space-y-1', className)} role='alert' aria-live='polite'>
      {errors.map((err, index) => (
        <div key={index} className='flex items-center animate-in slide-in-from-top-1 duration-200'>
          {showIcon && (
            <svg className='w-4 h-4 mr-1 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20' aria-hidden='true'>
              <path
                fillRule='evenodd'
                d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                clipRule='evenodd'
              />
            </svg>
          )}
          {err}
        </div>
      ))}
    </div>
  );
}

// Enhanced FormSection component for organizing form fields
export interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  required?: boolean;
  error?: string;
}

export function FormSection({
  title,
  description,
  children,
  className = '',
  collapsible = false,
  defaultCollapsed = false,
  required = false,
  error,
}: FormSectionProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  return (
    <div className={cn('space-y-4', className)}>
      {title && (
        <div className='space-y-1'>
          {collapsible ? (
            <button
              type='button'
              onClick={() => setIsCollapsed(!isCollapsed)}
              className='flex items-center justify-between w-full text-left'
              aria-expanded={!isCollapsed}
            >
              <h3
                className={cn(
                  'text-lg font-medium text-gray-900 transition-colors duration-200',
                  error && 'text-red-600',
                  required && "after:content-['*'] after:text-red-500 after:mr-1"
                )}
              >
                {title}
              </h3>
              <svg
                className={cn('w-5 h-5 text-gray-500 transition-transform duration-200', isCollapsed && 'rotate-180')}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
              </svg>
            </button>
          ) : (
            <h3
              className={cn(
                'text-lg font-medium text-gray-900',
                error && 'text-red-600',
                required && "after:content-['*'] after:text-red-500 after:mr-1"
              )}
            >
              {title}
            </h3>
          )}

          {description && <p className='text-sm text-gray-600'>{description}</p>}

          {error && <FormError error={error} />}
        </div>
      )}

      <div className={cn('space-y-4 transition-all duration-300', collapsible && isCollapsed && 'hidden')}>
        {children}
      </div>
    </div>
  );
}

export type { FormFieldProps };
