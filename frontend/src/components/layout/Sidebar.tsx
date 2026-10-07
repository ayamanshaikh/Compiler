"use client";

import React, { useState } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import {
  Terminal,
  BookOpen,
  Eye,
  Code2,
  User,
  Settings,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const mainItems: SidebarItem[] = [
  { label: "Workspace", href: "/workspace", icon: Terminal },
  { label: "Learn", href: "/learn", icon: BookOpen },
  { label: "Visualize", href: "/visualize", icon: Eye },
  { label: "Practice", href: "/practice", icon: Code2 },
];

const secondaryItems: SidebarItem[] = [
  { label: "Profile", href: "/profile", icon: User },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Admin", href: "/admin", icon: ShieldAlert },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`hidden lg:flex flex-col justify-between border-r border-zinc-800/80 bg-zinc-950/50 transition-all duration-200 select-none ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      <div className="p-3 space-y-6">
        {/* Navigation list */}
        <div className="space-y-1">
          <div
            className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold ${
              collapsed ? "sr-only" : "block"
            }`}
          >
            Modules
          </div>
          {mainItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            const linkContent = (
              <NextLink
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600/10 text-blue-400 border border-blue-500/20 font-semibold shadow-2xs"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                } ${collapsed ? "justify-center px-0" : ""}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NextLink>
            );

            return collapsed ? (
              <Tooltip key={item.href} content={item.label} position="right">
                {linkContent}
              </Tooltip>
            ) : (
              <div key={item.href}>{linkContent}</div>
            );
          })}
        </div>

        {/* Management list */}
        <div className="space-y-1">
          <div
            className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold ${
              collapsed ? "sr-only" : "block"
            }`}
          >
            Account & System
          </div>
          {secondaryItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            const linkContent = (
              <NextLink
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-zinc-800 text-zinc-100 font-semibold shadow-2xs"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                } ${collapsed ? "justify-center px-0" : ""}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NextLink>
            );

            return collapsed ? (
              <Tooltip key={item.href} content={item.label} position="right">
                {linkContent}
              </Tooltip>
            ) : (
              <div key={item.href}>{linkContent}</div>
            );
          })}
        </div>
      </div>

      {/* Collapse / Expand Footer Button */}
      <div className="p-3 border-t border-zinc-850">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className={`flex items-center gap-2 w-full p-2 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer ${
            collapsed ? "justify-center" : "justify-between"
          }`}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {!collapsed && <span className="text-[11px] font-mono text-zinc-500">Collapse</span>}
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
