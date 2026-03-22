'use client';

import { FormField } from './FormField';
import { useFormValidation } from '../form-provider';
import { cn } from '@/lib/utils';
import React from 'react';

export interface FormFileInputProps {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
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
    if (onFileChange) onFileChange(files);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <FormField name={name} label={label} description={description} required={required} className={className} error={error}>
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleFileChange}
          className={cn(
            'block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'file:bg-red-50 file:text-red-700'
          )}
        />
        {maxSize && <p className="text-xs text-gray-500">الحد الأقصى لحجم الملف: {formatFileSize(maxSize)}</p>}
      </div>
    </FormField>
  );
}
