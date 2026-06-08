import { Loader2 } from 'lucide-react';

type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-10 h-10',
  xl: 'w-12 h-12',
};

export function LoadingSpinner({
  className,
  size,
}: {
  className?: string;
  /** Convenience size preset. Ignored when `className` sets explicit dimensions. */
  size?: SpinnerSize;
}) {
  const dimension = className ?? (size ? sizeClasses[size] : 'w-6 h-6');
  return <Loader2 className={`animate-spin text-blue-600 ${dimension}`} />;
}
