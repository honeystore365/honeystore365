'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField } from './FormField';
import { useFormValidation } from '../form-provider';
import { cn } from '@/lib/utils';

export interface FormSelectProps {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
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
    <FormField name={name} label={label} description={description} required={required} className={className} error={error}>
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
