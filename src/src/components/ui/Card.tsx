import React from 'react';
interface CardProps {
  children: React.ReactNode;
  className?: string;
}
export function Card({
  children,
  className = ''
}: CardProps) {
  return <div className={`bg-white rounded-lg border border-slate-200 shadow-sm ${className}`}>
      {children}
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