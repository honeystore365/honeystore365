import React, { useState, useEffect } from 'react';
import { useDropzone, FileWithPath } from 'react-dropzone';
import { ControllerRenderProps } from 'react-hook-form'; // To type the field prop

// Define props for the new component
interface ImageUploadFieldProps {
  field: ControllerRenderProps<any, any>; // Pass the field object from RHF render prop
}

export function ImageUploadField({ field }: ImageUploadFieldProps) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const currentFile = field.value;
    // Check if it's a File object for preview generation (Added null check and typeof)
    if (typeof currentFile === 'object' && currentFile !== null && currentFile instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(currentFile);
    } else {
       // If the value is not a File (e.g., initially undefined or maybe a URL string if editing), clear preview
       // Or potentially display existing image URL if passed as prop? For now, just clear.
       setPreview(null);
    }
    // No cleanup needed for FileReader data URLs
  }, [field.value]); // Re-run effect if file changes

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles: FileWithPath[]) => {
      if (acceptedFiles.length > 0) {
        field.onChange(acceptedFiles[0]); // Update RHF state with the File object
      }
    },
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    multiple: false
  });

  return (
    <div className="border border-dashed rounded-lg p-4 text-center">
      <div {...getRootProps({ className: 'cursor-pointer p-6' })}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Déposez l'image ici...</p>
        ) : (
          <p>Glissez-déposez une image ici, ou cliquez pour sélectionner</p>
        )}
      </div>
      {preview && (
        <div className="mt-4">
          <img src={preview} alt="Aperçu de l'image" className="max-h-48 rounded mx-auto" />
        </div>
      )}
      {/* Display filename if a file is selected but preview isn't generated (e.g., non-image) - Added null check and typeof */}
      {field.value && typeof field.value === 'object' && field.value instanceof File && !preview && (
         <p className="mt-2 text-sm text-gray-500">Fichier sélectionné: {field.value.name}</p>
      )}
    </div>
  );
}
