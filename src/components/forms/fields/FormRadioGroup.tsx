'use client';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FormField } from './FormField';
import { useFormValidation } from '../form-provider';
import { cn } from '@/lib/utils';

export interface FormRadioGroupProps {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
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
    <FormField name={name} label={label} description={description} required={required} className={className} error={error}>
      <RadioGroup value={value || ''} onValueChange={newValue => setValue(name, newValue)} disabled={disabled} className={orientation === 'horizontal' ? 'flex flex-wrap gap-6' : 'space-y-3'}>
        {options.map(option => (
          <div key={option.value} className="flex items-start space-x-2 space-x-reverse">
            <RadioGroupItem value={option.value} disabled={option.disabled || disabled} className={cn(error && 'border-red-500')} />
            <div className="grid gap-1.5 leading-none">
              <Label className="text-sm font-normal cursor-pointer">{option.label}</Label>
              {option.description && <p className="text-xs text-gray-600">{option.description}</p>}
            </div>
          </div>
        ))}
      </RadioGroup>
    </FormField>
  );
}
