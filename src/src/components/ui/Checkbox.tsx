import React, { forwardRef } from 'react';
import { Check } from 'lucide-react';
interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
  label,
  error,
  className = '',
  ...props
}, ref) => {
  return <div className="flex items-start">
        <div className="relative flex items-center h-5">
          <input type="checkbox" ref={ref} className="peer h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" {...props} />
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