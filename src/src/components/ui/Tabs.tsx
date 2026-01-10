import React, { useState, createContext, useContext } from 'react';
// Context for Tabs state
interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}
const TabsContext = createContext<TabsContextValue | undefined>(undefined);
function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
}
// Main Tabs component
interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}
export function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  className = ''
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const handleValueChange = (newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };
  return <TabsContext.Provider value={{
    value,
    onValueChange: handleValueChange
  }}>
      <div className={`w-full ${className}`}>{children}</div>
    </TabsContext.Provider>;
}
// TabsList component
interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}
export function TabsList({
  children,
  className = ''
}: TabsListProps) {
  return <div className={`inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500 ${className}`} role="tablist">
      {children}
    </div>;
}
// TabsTrigger component
interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}
export function TabsTrigger({
  value,
  children,
  className = ''
}: TabsTriggerProps) {
  const {
    value: selectedValue,
    onValueChange
  } = useTabsContext();
  const isSelected = selectedValue === value;
  return <button type="button" role="tab" aria-selected={isSelected} onClick={() => onValueChange(value)} className={`
        inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5
        text-sm font-medium ring-offset-white transition-all
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2
        disabled:pointer-events-none disabled:opacity-50
        ${isSelected ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'}
        ${className}
      `}>
      {children}
    </button>;
}
// TabsContent component
interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}
export function TabsContent({
  value,
  children,
  className = ''
}: TabsContentProps) {
  const {
    value: selectedValue
  } = useTabsContext();
  if (selectedValue !== value) return null;
  return <div role="tabpanel" className={`mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 ${className}`}>
      {children}
    </div>;
}

Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Content = TabsContent;