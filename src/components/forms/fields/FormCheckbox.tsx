'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FormField } from './FormField';
import { useFormValidation } from '../form-provider';
import { cn } from '@/lib/utils';

export interface FormCheckboxProps {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
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
    <FormField name={name} label={label} description={description} required={required} className={className} error={error}>
      <div className="flex items-start space-x-2 space-x-reverse">
        <Checkbox checked={checked} onCheckedChange={newChecked => setValue(name, newChecked)} disabled={disabled} className={cn(error && 'border-red-500')} />
        <div className="grid gap-1.5 leading-none">
          <Label className={cn('text-sm font-normal cursor-pointer', error && 'text-red-600')}>
            {text}
            {required && <span className="text-red-500 mr-1">*</span>}
          </Label>
        </div>
      </div>
    </FormField>
  );
}
