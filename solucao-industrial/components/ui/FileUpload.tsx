'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, FileImage, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface FileUploadProps {
  value?: File | string | null; // File object or URL string
  onChange: (file: File | null) => void;
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  preview?: boolean;
  circular?: boolean; // For profile pictures
}

export default function FileUpload({
  value,
  onChange,
  label,
  accept = 'image/*',
  maxSizeMB = 5,
  error,
  required = false,
  disabled = false,
  className = '',
  preview = true,
  circular = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get preview URL
  React.useEffect(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (typeof value === 'string') {
      setPreviewUrl(value);
    } else {
      setPreviewUrl(null);
    }
  }, [value]);

  const validateFile = (file: File): string | null => {
    // Check file type
    const acceptedTypes = accept.split(',').map((t) => t.trim());
    const isAccepted = acceptedTypes.some((type) => {
      if (type === 'image/*') {
        return file.type.startsWith('image/');
      }
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.replace('/*', ''));
      }
      return file.type === type;
    });

    if (!isAccepted) {
      return 'Tipo de arquivo não permitido';
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`;
    }

    return null;
  };

  const handleFile = (file: File) => {
    const validationError = validateFile(file);

    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploadError(null);
    onChange(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = () => {
    onChange(null);
    setUploadError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const displayError = error || uploadError;

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg
          transition-all duration-200
          ${circular ? 'aspect-square max-w-xs mx-auto' : 'min-h-[200px]'}
          ${disabled
            ? 'bg-gray-100 cursor-not-allowed'
            : 'cursor-pointer hover:border-primary-400 hover:bg-primary-50'
          }
          ${isDragging ? 'border-primary-500 bg-primary-50' : displayError ? 'border-red-500' : 'border-gray-300'}
          ${previewUrl && preview ? 'p-0' : 'p-6'}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />

        {previewUrl && preview ? (
          // Preview Mode
          <div className={`relative w-full h-full ${circular ? 'rounded-full overflow-hidden' : 'rounded-lg overflow-hidden'}`}>
            <div className="relative w-full h-full min-h-[200px]">
              <Image
                src={previewUrl}
                alt="Preview"
                fill
                className={`object-cover ${circular ? 'rounded-full' : ''}`}
                unoptimized={value instanceof File}
              />
            </div>

            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className={`
                  absolute ${circular ? 'top-2 right-2' : 'top-2 right-2'}
                  p-2 bg-red-500 text-white rounded-full
                  hover:bg-red-600 transition-colors
                  shadow-lg
                `}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          // Upload Prompt
          <div className="flex flex-col items-center justify-center text-center h-full">
            {isDragging ? (
              <>
                <Upload className="w-12 h-12 text-primary-500 mb-3" />
                <p className="text-sm font-medium text-primary-600">Solte o arquivo aqui</p>
              </>
            ) : (
              <>
                <FileImage className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Clique para selecionar ou arraste o arquivo
                </p>
                <p className="text-xs text-gray-500">
                  {accept === 'image/*'
                    ? `Imagens até ${maxSizeMB}MB`
                    : `Arquivos ${accept} até ${maxSizeMB}MB`
                  }
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {displayError && (
        <div className="mt-2 flex items-center gap-2 text-sm text-red-500">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{displayError}</span>
        </div>
      )}

      {/* File Info */}
      {value instanceof File && (
        <div className="mt-2 text-xs text-gray-500">
          <p>
            {value.name} ({(value.size / 1024).toFixed(1)} KB)
          </p>
        </div>
      )}
    </div>
  );
}

// Compact variant for inline forms
export function CompactFileUpload({
  value,
  onChange,
  accept = 'image/*',
  maxSizeMB = 5,
  disabled = false,
}: Pick<FileUploadProps, 'value' | 'onChange' | 'accept' | 'maxSizeMB' | 'disabled'>) {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const acceptedTypes = accept.split(',').map((t) => t.trim());
    const isAccepted = acceptedTypes.some((type) => {
      if (type === 'image/*') return file.type.startsWith('image/');
      if (type.endsWith('/*')) return file.type.startsWith(type.replace('/*', ''));
      return file.type === type;
    });

    if (!isAccepted) return 'Tipo de arquivo não permitido';

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `Arquivo muito grande. Máximo: ${maxSizeMB}MB`;
    }

    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const error = validateFile(file);
      if (error) {
        setUploadError(error);
        return;
      }
      setUploadError(null);
      onChange(file);
    }
  };

  const handleRemove = () => {
    onChange(null);
    setUploadError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Upload className="w-4 h-4 inline mr-2" />
        Escolher arquivo
      </button>

      {value instanceof File && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{value.name}</span>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {uploadError && (
        <span className="text-sm text-red-500">{uploadError}</span>
      )}
    </div>
  );
}
