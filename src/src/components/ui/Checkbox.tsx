import React, { forwardRef } from 'react';
interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  /** Convenience handler that receives the new checked state directly. */
  onCheckedChange?: (checked: boolean) => void;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
  label,
  error,
  className = '',
  onCheckedChange,
  onChange,
  ...props
}, ref) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    onCheckedChange?.(event.target.checked);
  };
  return <div className="flex items-start">
        <div className="relative flex items-center h-5">
          <input type="checkbox" ref={ref} onChange={handleChange} className={`peer h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer ${className}`} {...props} />
        </div>
        {label && <label className="ml-2 text-sm text-slate-700 cursor-pointer select-none" onClick={e => {
      // Logic to toggle checkbox if clicking label
      const input = e.currentTarget.previousElementSibling?.firstElementChild as HTMLInputElement;
      if (input) input.click();
    }}>
            {label}
          </label>}
        {error && <p className="ml-2 text-xs text-rose-600">{error}</p>}
      </div>;
});
Checkbox.displayName = 'Checkbox';