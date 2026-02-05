'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerProps {
  value?: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  minDate?: string; // YYYY-MM-DD
  maxDate?: string; // YYYY-MM-DD
  clearable?: boolean;
  className?: string;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function DatePicker({
  value,
  onChange,
  label,
  placeholder = 'dd/mm/aaaa',
  error,
  required = false,
  disabled = false,
  minDate,
  maxDate,
  clearable = true,
  className = '',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) return new Date(value + 'T00:00:00');
    return new Date();
  });
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Format date for display (dd/mm/yyyy)
  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // Parse display date to YYYY-MM-DD
  const parseDisplayDate = (displayDate: string): string | null => {
    const match = displayDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;
    const [, day, month, year] = match;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (isNaN(date.getTime())) return null;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value ? formatDisplayDate(value) : '');
  }, [value]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); // Remove non-digits

    // Format as dd/mm/yyyy
    if (val.length >= 2) {
      val = val.slice(0, 2) + '/' + val.slice(2);
    }
    if (val.length >= 5) {
      val = val.slice(0, 5) + '/' + val.slice(5, 9);
    }

    setInputValue(val);

    // Try to parse and update value
    if (val.length === 10) {
      const parsedDate = parseDisplayDate(val);
      if (parsedDate && isDateValid(parsedDate)) {
        onChange(parsedDate);
        setViewDate(new Date(parsedDate + 'T00:00:00'));
      }
    } else if (val.length === 0) {
      onChange('');
    }
  };

  const handleInputBlur = () => {
    // Reset to valid value if input is invalid
    if (inputValue && inputValue.length === 10) {
      const parsedDate = parseDisplayDate(inputValue);
      if (!parsedDate || !isDateValid(parsedDate)) {
        setInputValue(value ? formatDisplayDate(value) : '');
      }
    } else if (inputValue && inputValue.length < 10) {
      setInputValue(value ? formatDisplayDate(value) : '');
    }
  };

  const isDateValid = (dateString: string): boolean => {
    if (minDate && dateString < minDate) return false;
    if (maxDate && dateString > maxDate) return false;
    return true;
  };

  const handleDateSelect = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    if (isDateValid(dateString)) {
      onChange(dateString);
      setIsOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setInputValue('');
  };

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    // Add empty cells for days before month starts
    const startDay = firstDay.getDay();
    for (let i = 0; i < startDay; i++) {
      days.push(new Date(year, month, -startDay + i + 1));
    }

    // Add days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    // Add empty cells for days after month ends
    const endDay = lastDay.getDay();
    for (let i = 1; i < 7 - endDay; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  const changeMonth = (delta: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1));
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date): boolean => {
    if (!value) return false;
    const selectedDate = new Date(value + 'T00:00:00');
    return date.toDateString() === selectedDate.toDateString();
  };

  const isDisabled = (date: Date): boolean => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    return !isDateValid(dateString);
  };

  const days = getDaysInMonth(viewDate);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => !disabled && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full pl-4 pr-10 py-2.5 border rounded-lg
            transition-colors duration-200
            ${disabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
            }
            ${error ? 'border-red-500' : 'border-gray-300'}
          `}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {clearable && value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <Calendar className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[280px]">
          {/* Month/Year Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            <span className="text-sm font-semibold text-gray-900">
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>

            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-gray-500 py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              const isCurrentMonth = date.getMonth() === viewDate.getMonth();
              const disabled = isDisabled(date);
              const selected = isSelected(date);
              const today = isToday(date);

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => isCurrentMonth && !disabled && handleDateSelect(date)}
                  disabled={disabled || !isCurrentMonth}
                  className={`
                    w-8 h-8 text-sm rounded-lg
                    transition-colors duration-150
                    ${!isCurrentMonth ? 'text-gray-300 cursor-default' : ''}
                    ${isCurrentMonth && !disabled && !selected
                      ? 'text-gray-700 hover:bg-gray-100'
                      : ''
                    }
                    ${selected
                      ? 'bg-primary-600 text-white font-semibold hover:bg-primary-700'
                      : ''
                    }
                    ${today && !selected
                      ? 'border-2 border-primary-600 font-semibold'
                      : ''
                    }
                    ${disabled ? 'text-gray-300 cursor-not-allowed' : ''}
                  `}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Today Button */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                const dateString = `${year}-${month}-${day}`;

                if (isDateValid(dateString)) {
                  onChange(dateString);
                  setViewDate(today);
                  setIsOpen(false);
                }
              }}
              className="w-full py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              Hoje
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
