import React from 'react';

export interface TableColumn {
  header: string;
  accessor?: string;
  render?: (row: any) => React.ReactNode;
  className?: string;
}

interface TableProps {
  children?: React.ReactNode;
  className?: string;
  // Data-driven mode:
  columns?: TableColumn[];
  data?: any[];
}

export function Table({ children, className = '', columns, data }: TableProps) {
  // Data-driven mode: render rows from a column definition + data array.
  if (columns && data) {
    return (
      <div className={`w-full overflow-x-auto ${className}`}>
        <table className="w-full text-left border-collapse">
          <TableHeader>
            <TableRow>
              {columns.map((col, i) => (
                <TableHead key={i} className={col.className}>{col.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, ri) => (
              <TableRow key={row?.id ?? ri}>
                {columns.map((col, ci) => (
                  <TableCell key={ci} className={col.className}>
                    {col.render ? col.render(row) : (col.accessor ? row?.[col.accessor] : null)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </table>
      </div>
    );
  }
  return <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full text-left border-collapse">{children}</table>
    </div>;
}
export function TableHeader({
  children
}: {
  children: React.ReactNode;
}) {
  return <thead className="bg-slate-50 border-b border-slate-200">{children}</thead>;
}
export function TableBody({
  children
}: {
  children: React.ReactNode;
}) {
  return <tbody className="divide-y divide-slate-200">{children}</tbody>;
}
export function TableRow({
  children,
  className = '',
  onClick
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return <tr className={`hover:bg-slate-50 transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`} onClick={onClick}>
      {children}
    </tr>;
}
export function TableHead({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <th className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider ${className}`}>
      {children}
    </th>;
}
export function TableCell({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 text-sm text-slate-700 ${className}`}>
      {children}
    </td>;
}