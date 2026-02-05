'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export default function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={cn(
            'w-11 h-6 rounded-full transition-colors',
            checked ? 'bg-green-500' : 'bg-gray-300',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
        <div
          className={cn(
            'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform',
            checked && 'transform translate-x-5'
          )}
        />
      </div>
      {label && (
        <span className={cn('text-sm font-medium', disabled && 'text-gray-400')}>
          {label}
        </span>
      )}
    </label>
  );
}
