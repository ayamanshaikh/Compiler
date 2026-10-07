"use client";

import React, { createContext, useContext, useState } from "react";

interface TabsContextType {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (val: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className = "",
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const activeTab = value !== undefined ? value : internalValue;

  const setActiveTab = (id: string) => {
    if (value === undefined) {
      setInternalValue(id);
    }
    onValueChange?.(id);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={`w-full flex flex-col ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabList({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center gap-1 p-1 bg-zinc-950/60 rounded-lg border border-zinc-850/80 w-fit ${className}`}
    >
      {children}
    </div>
  );
}

export interface TabTriggerProps {
  value: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function TabTrigger({
  value,
  children,
  icon,
  className = "",
  disabled = false,
}: TabTriggerProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabTrigger must be used within Tabs");

  const isActive = context.activeTab === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => context.setActiveTab(value)}
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 select-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
        isActive
          ? "bg-zinc-800 text-zinc-100 shadow-xs border border-zinc-700/60"
          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 border border-transparent"
      } ${className}`}
    >
      {icon && <span className="w-3.5 h-3.5 shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

export function TabContent({
  value,
  children,
  className = "",
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabContent must be used within Tabs");

  if (context.activeTab !== value) return null;

  return (
    <div
      role="tabpanel"
      tabIndex={0}
      className={`pt-4 focus-visible:outline-hidden ${className}`}
    >
      {children}
    </div>
  );
}
