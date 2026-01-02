import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
export function Input({
  label,
  error,
  type,
  className = '',
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;
  return <div className="w-full">
      {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>}
      <div className="relative">
        <input type={inputType} className={`
            w-full px-4 py-2 border rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
            ${error ? 'border-red-500' : 'border-slate-300'}
            ${isPassword ? 'pr-10' : ''}
            ${className}
          `} {...props} />
        {isPassword && <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>}
      </div>
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>;
}