'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  min?: number;
  max?: number;
  className?: string;
  showIcon?: boolean;
}

export default function CurrencyInput({
  value,
  onChange,
  label,
  placeholder = 'R$ 0,00',
  error,
  required = false,
  disabled = false,
  min,
  max,
  className = '',
  showIcon = true,
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Format number to Brazilian currency display
  const formatCurrency = (num: number): string => {
    if (isNaN(num)) num = 0;

    const formatted = num.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return `R$ ${formatted}`;
  };

  // Parse display value to number
  const parseCurrency = (str: string): number => {
    // Remove R$, spaces, and dots (thousand separators)
    const cleaned = str.replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  // Update display value when prop value changes (skip while focused to avoid overwriting user input)
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatCurrency(value));
    }
  }, [value, isFocused]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // Select all text on focus for easier editing
    e.target.select();
  };

  const handleBlur = () => {
    setIsFocused(false);

    // Validate and update value
    let num = parseCurrency(displayValue);

    // Apply min/max constraints
    if (min !== undefined && num < min) {
      num = min;
    }
    if (max !== undefined && num > max) {
      num = max;
    }

    // Update parent component
    onChange(num);

    // Format display value
    setDisplayValue(formatCurrency(num));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;

    // Remove all non-numeric characters except comma
    input = input.replace(/[^\d,]/g, '');

    // Allow only one comma
    const parts = input.split(',');
    if (parts.length > 2) {
      input = parts[0] + ',' + parts.slice(1).join('');
    }

    // Limit decimal places to 2
    if (parts.length === 2 && parts[1].length > 2) {
      input = parts[0] + ',' + parts[1].slice(0, 2);
    }

    // Format with thousand separators
    if (parts[0].length > 3) {
      const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      input = parts.length === 2 ? `${integerPart},${parts[1]}` : integerPart;
    }

    // Add R$ prefix
    const formatted = input ? `R$ ${input}` : '';
    setDisplayValue(formatted);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter
    if (
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === 'Tab' ||
      e.key === 'Escape' ||
      e.key === 'Enter'
    ) {
      return;
    }

    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (e.ctrlKey || e.metaKey) {
      return;
    }

    // Allow: home, end, left, right, up, down
    if (
      e.key === 'Home' ||
      e.key === 'End' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown'
    ) {
      return;
    }

    // Allow: comma (only one)
    if (e.key === ',') {
      if (displayValue.includes(',')) {
        e.preventDefault();
      }
      return;
    }

    // Allow: numbers 0-9
    if (e.key >= '0' && e.key <= '9') {
      return;
    }

    // Block everything else
    e.preventDefault();
  };

  const handleIncrement = () => {
    if (disabled) return;
    let newValue = value + 1;
    if (max !== undefined && newValue > max) {
      newValue = max;
    }
    onChange(newValue);
  };

  const handleDecrement = () => {
    if (disabled) return;
    let newValue = value - 1;
    if (min !== undefined && newValue < min) {
      newValue = min;
    }
    onChange(newValue);
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {showIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <DollarSign className="w-5 h-5 text-gray-400" />
          </div>
        )}

        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full ${showIcon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 border rounded-lg
            transition-colors duration-200 font-medium
            ${disabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
            }
            ${error ? 'border-red-500' : 'border-gray-300'}
          `}
        />

        {/* Optional increment/decrement buttons */}
        {!disabled && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
            <button
              type="button"
              onClick={handleIncrement}
              className="px-1 py-0.5 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleDecrement}
              className="px-1 py-0.5 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}

      {/* Helper text showing min/max if provided */}
      {(min !== undefined || max !== undefined) && !error && (
        <p className="mt-1 text-xs text-gray-500">
          {min !== undefined && max !== undefined
            ? `Valor entre ${formatCurrency(min)} e ${formatCurrency(max)}`
            : min !== undefined
            ? `Valor mínimo: ${formatCurrency(min)}`
            : max !== undefined
            ? `Valor máximo: ${formatCurrency(max)}`
            : ''}
        </p>
      )}
    </div>
  );
}

// Variant without icon for compact forms
export function CompactCurrencyInput(props: CurrencyInputProps) {
  return <CurrencyInput {...props} showIcon={false} />;
}
