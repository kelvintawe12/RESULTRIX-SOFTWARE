import React from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle, X } from 'lucide-react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  type?: AlertType;
  /** Back-compat alias for `type`. Accepts the canonical types plus a few common synonyms. */
  variant?: AlertType | 'destructive' | 'secondary' | 'danger' | 'neutral';
  title?: string;
  children?: React.ReactNode;
  /** Back-compat: many call sites pass the body as `message`/`description` instead of children. */
  message?: React.ReactNode;
  description?: React.ReactNode;
  /** When provided, renders a dismiss (X) button. */
  onClose?: () => void;
  /** Optional action node rendered on the right (e.g. a retry button). */
  action?: React.ReactNode;
  /** Optional icon node that overrides the default type icon. */
  icon?: React.ReactNode;
  className?: string;
}

// Map synonyms used across the codebase to the four real types.
function normalizeType(type?: AlertType, variant?: AlertProps['variant']): AlertType {
  if (type) return type;
  switch (variant) {
    case 'success':
      return 'success';
    case 'warning':
      return 'warning';
    case 'error':
    case 'destructive':
    case 'danger':
      return 'error';
    case 'info':
    case 'neutral':
    case 'secondary':
      return 'info';
    default:
      return 'info';
  }
}

export function Alert({
  type,
  variant,
  title,
  children,
  message,
  description,
  onClose,
  action,
  icon,
  className = ''
}: AlertProps) {
  const resolvedType = normalizeType(type, variant);
  const body = children ?? message ?? description;

  const styles: Record<AlertType, string> = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    error: 'bg-rose-50 text-rose-800 border-rose-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200'
  };
  const icons: Record<AlertType, typeof Info> = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertCircle,
    info: Info
  };
  const Icon = icons[resolvedType];
  return <div className={`rounded-lg border p-4 ${styles[resolvedType]} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {icon ?? <Icon className="h-5 w-5" aria-hidden="true" />}
        </div>
        <div className="ml-3 flex-1">
          {title && <h3 className="text-sm font-medium">{title}</h3>}
          {body !== undefined && body !== null && body !== '' && (
            <div className={`text-sm ${title ? 'mt-2' : ''}`}>{body}</div>
          )}
        </div>
        {action && <div className="ml-3 flex-shrink-0">{action}</div>}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss"
            className="ml-3 flex-shrink-0 rounded p-1 hover:bg-black/5 focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>;
}
