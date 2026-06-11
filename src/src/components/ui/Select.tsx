import React, { useState, createContext, useContext } from 'react';
import { ChevronDown, Check } from 'lucide-react';

// Context for Select state
interface SelectContextValue {
  value: string;
  onValueChange: (value: string, displayValue?: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  displayValue: string;
  setDisplayValue: (value: string) => void;
}

const SelectContext = createContext<SelectContextValue | undefined>(undefined);

function useSelectContext() {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('Select components must be used within a Select provider');
  }
  return context;
}

export interface SelectOption {
  value: string;
  label: string;
}

// Main Select component.
// Supports two usage styles:
//  1. Compound: <Select value onValueChange><SelectTrigger/>…<SelectItem/></Select>
//  2. Simple:   <Select label options value onChange /> (renders a native <select>)
interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  children?: React.ReactNode;
  // Simple-mode props:
  label?: string;
  options?: SelectOption[];
  onChange?: (e: any) => void;
  placeholder?: string;
  required?: boolean;
  name?: string;
  id?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
}

export function Select({
  value: controlledValue,
  onValueChange,
  defaultValue = '',
  children,
  label,
  options,
  onChange,
  placeholder,
  required,
  name,
  id,
  error,
  className = '',
  disabled,
  leftIcon
}: SelectProps) {
  // Simple mode: render a native <select> when `options` are provided.
  // (No hooks here — keeps the compound mode's hooks unconditional.)
  if (options) {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
              {leftIcon}
            </span>
          )}
          <select
            id={id}
            name={name}
            value={controlledValue ?? defaultValue}
            required={required}
            disabled={disabled}
            onChange={(e) => {
              onChange?.(e);
              onValueChange?.(e.target.value);
            }}
            className={`w-full px-3 py-2 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              error ? 'border-red-500' : 'border-slate-300'
            } ${leftIcon ? 'pl-10' : ''} ${className}`}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <CompoundSelect value={controlledValue} onValueChange={onValueChange} defaultValue={defaultValue}>
      {children}
    </CompoundSelect>
  );
}

// Compound (custom dropdown) implementation. Hooks live here so they are never
// conditional relative to the simple-mode early return above.
function CompoundSelect({
  value: controlledValue,
  onValueChange,
  defaultValue = '',
  children
}: {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  children?: React.ReactNode;
}) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [displayValue, setDisplayValue] = useState('');
  const [open, setOpen] = useState(false);

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleValueChange = (newValue: string, newDisplayValue?: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    setDisplayValue(newDisplayValue ?? newValue);
    onValueChange?.(newValue);
    setOpen(false);
  };

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange: handleValueChange,
        open,
        setOpen,
        displayValue,
        setDisplayValue
      }}
    >
      <div className="relative w-full">{children}</div>
    </SelectContext.Provider>
  );
}

// SelectTrigger component
interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export function SelectTrigger({ children, className = '' }: SelectTriggerProps) {
  const { open, setOpen } = useSelectContext();

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={`
        w-full px-3 py-2 pr-10 rounded-lg border bg-white text-sm text-left
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        border-slate-300 hover:border-slate-400 transition-all
        ${className}
      `}
    >
      <div className="flex items-center justify-between">
        {children}
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform absolute right-3 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </div>
    </button>
  );
}

// SelectValue component
interface SelectValueProps {
  placeholder?: string;
}

export function SelectValue({ placeholder = 'Select...' }: SelectValueProps) {
  const { displayValue } = useSelectContext();

  return <span className="text-slate-900">{displayValue || placeholder}</span>;
}

// SelectContent component
interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

export function SelectContent({ children, className = '' }: SelectContentProps) {
  const { open, setOpen } = useSelectContext();

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      <div
        className={`
          absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg
          max-h-60 overflow-auto
          ${className}
        `}
      >
        {children}
      </div>
    </>
  );
}

// SelectItem component
interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function SelectItem({ value, children, className = '' }: SelectItemProps) {
  const { value: selectedValue, onValueChange } = useSelectContext();

  const isSelected = selectedValue === value;

  const handleClick = () => {
    // Pass both value and display text
    const displayText = typeof children === 'string' ? children : value;
    onValueChange(value, displayText);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        w-full px-3 py-2 text-left text-sm hover:bg-slate-100 transition-colors
        flex items-center justify-between
        ${isSelected ? 'bg-slate-50 font-medium' : ''}
        ${className}
      `}
    >
      <span>{children}</span>
      {isSelected && <Check className="h-4 w-4 text-blue-600" />}
    </button>
  );
}
