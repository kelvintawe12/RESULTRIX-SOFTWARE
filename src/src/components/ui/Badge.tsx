import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
// Synonyms used across the codebase, mapped to the five real variants below.
type BadgeVariantInput = BadgeVariant | 'primary' | 'secondary' | 'default' | 'error' | 'destructive' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariantInput;
  size?: 'sm' | 'md';
  className?: string;
}

function normalizeVariant(variant: BadgeVariantInput): BadgeVariant {
  switch (variant) {
    case 'primary':
      return 'info';
    case 'error':
    case 'destructive':
      return 'danger';
    case 'secondary':
    case 'default':
    case 'outline':
      return 'neutral';
    default:
      return variant;
  }
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  className = ''
}: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    danger: 'bg-rose-100 text-rose-700 border-rose-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200'
  };
  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5'
  };
  return <span className={`
      inline-flex items-center font-medium rounded-full border
      ${variants[normalizeVariant(variant)]}
      ${sizes[size]}
      ${className}
    `}>
      {children}
    </span>;
}