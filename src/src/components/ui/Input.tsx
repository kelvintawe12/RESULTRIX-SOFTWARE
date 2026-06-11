import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isTextarea?: boolean;
  rows?: number;
}

export function Input({
  label,
  error,
  helpText,
  leftIcon,
  rightIcon,
  type,
  className = '',
  isTextarea = false,
  rows = 3,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  if (isTextarea) {
    // Filter out input-only and custom props for textarea to avoid React warnings
    const { min, max, pattern, step, ...textareaProps } = props as any;
    
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {label}
          </label>
        )}
        <textarea
          rows={rows}
          className={`
            w-full px-4 py-2 border rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
            resize-none font-inherit
            ${error ? 'border-red-500' : 'border-slate-300'}
            ${className}
          `}
          {...(textareaProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
        {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
        {helpText && <p className="mt-1.5 text-xs text-slate-500">{helpText}</p>}
      </div>
    );
  }

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          type={inputType}
          className={`
            w-full px-4 py-2 border rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
            ${error ? 'border-red-500' : 'border-slate-300'}
            ${leftIcon ? 'pl-10' : ''}
            ${isPassword || rightIcon ? 'pr-10' : ''}
            ${className}
          `}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
        {!isPassword && rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {rightIcon}
          </span>
        )}
      </div>
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
      {helpText && <p className="mt-1.5 text-xs text-slate-500">{helpText}</p>}
    </div>
  );
}
