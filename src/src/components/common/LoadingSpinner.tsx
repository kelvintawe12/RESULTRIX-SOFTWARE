import React from 'react';
import { Loader2 } from 'lucide-react';
export function LoadingSpinner({
  className = 'w-6 h-6'
}: {
  className?: string;
}) {
  return <Loader2 className={`animate-spin text-blue-600 ${className}`} />;
}