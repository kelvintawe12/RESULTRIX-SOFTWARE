import React from 'react';
interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** When provided, renders a built-in header with this title above the content. */
  title?: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  /** Suppress the default inner padding applied when `title` is set. */
  noPadding?: boolean;
}
export function Card({
  children,
  className = '',
  title,
  onClick,
  style,
  noPadding
}: CardProps) {
  return <div
      className={`bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      style={style}
    >
      {title && (
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        </div>
      )}
      {title && !noPadding ? <div className="p-6">{children}</div> : children}
    </div>;
}
interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}
export function CardHeader({
  children,
  className = ''
}: CardHeaderProps) {
  return <div className={`px-6 py-4 border-b border-slate-100 ${className}`}>
      {children}
    </div>;
}
interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}
export function CardTitle({
  children,
  className = ''
}: CardTitleProps) {
  return <h3 className={`text-lg font-semibold text-slate-900 ${className}`}>
      {children}
    </h3>;
}
interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}
export function CardDescription({
  children,
  className = ''
}: CardDescriptionProps) {
  return <p className={`text-sm text-slate-500 mt-1 ${className}`}>{children}</p>;
}
interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}
export function CardContent({
  children,
  className = ''
}: CardContentProps) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}
interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}
export function CardFooter({
  children,
  className = ''
}: CardFooterProps) {
  return <div className={`px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-lg ${className}`}>
      {children}
    </div>;
}