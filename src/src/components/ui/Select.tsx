import React, { useState, forwardRef, createContext, useContext } from 'react';
import { ChevronDown, Check } from 'lucide-react';
// Context for Select state
interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
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
// Main Select component
interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  children: React.ReactNode;
}
export function Select({
  value: controlledValue,
  onValueChange,
  defaultValue = '',
  children
}: SelectProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [displayValue, setDisplayValue] = useState('');
  const [open, setOpen] = useState(false);
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const handleValueChange = (newValue: string, newDisplayValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    setDisplayValue(newDisplayValue);
    onValueChange?.(newValue);
    setOpen(false);
  };
  return <SelectContext.Provider value={{
    value,
    onValueChange: handleValueChange,
    open,
    setOpen,
    displayValue,
    setDisplayValue
  }}>
      <div className="relative w-full">{children}</div>
    </SelectContext.Provider>;
}
// SelectTrigger component
interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}
export function SelectTrigger({
  children,
  className = ''
}: SelectTriggerProps) {
  const {
    open,
    setOpen
  } = useSelectContext();
  return <button type="button" onClick={() => setOpen(!open)} className={`
        w-full px-3 py-2 pr-10 rounded-lg border bg-white text-sm text-left
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        border-slate-300 hover:border-slate-400 transition-all
        ${className}
      `}>
      <div className="flex items-center justify-between">
        {children}
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform absolute right-3 ${open ? 'rotate-180' : ''}`} />
      </div>
    </button>;
}
// SelectValue component
interface SelectValueProps {
  placeholder?: string;
}
export function SelectValue({
  placeholder = 'Select...'
}: SelectValueProps) {
  const {
    displayValue
  } = useSelectContext();
  return <span className="text-slate-900">{displayValue || placeholder}</span>;
}
// SelectContent component
interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}
export function SelectContent({
  children,
  className = ''
}: SelectContentProps) {
  const {
    open,
    setOpen
  } = useSelectContext();
  if (!open) return null;
  return <>
      <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      <div className={`
          absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg
          max-h-60 overflow-auto
          ${className}
        `}>
        {children}
      </div>
    </>;
}
// SelectItem component
interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}
export function SelectItem({
  value,
  children,
  className = ''
}: SelectItemProps) {
  const {
    value: selectedValue,
    onValueChange
  } = useSelectContext();
  const isSelected = selectedValue === value;
  const handleClick = () => {
    // Pass both value and display text
    const displayText = typeof children === 'string' ? children : value;
    onValueChange(value, displayText);
  };
  return <button type="button" onClick={handleClick} className={`
        w-full px-3 py-2 text-left text-sm hover:bg-slate-100 transition-colors
        flex items-center justify-between
        ${isSelected ? 'bg-slate-50 font-medium' : ''}
        ${className}
      `}>
      <span>{children}</span>
      {isSelected && <Check className="h-4 w-4 text-blue-600" />}
    </button>;
}