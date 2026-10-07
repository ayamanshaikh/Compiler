"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import NextLink from "next/link";
import {
  Terminal,
  Code2,
  BookOpen,
  Eye,
  Layers,
  Settings,
  User,
  Sun,
  Moon,
  Laptop,
  Menu,
  LogIn,
  LogOut,
} from "lucide-react";
import { useTheme, Theme } from "@/lib/context/ThemeContext";
import { useAuth } from "@/lib/context/AuthContext";
import { fetchHealth } from "@/lib/api/health";
import { Badge } from "@/components/ui/Badge";
import { MobileNav } from "./MobileNav";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: "Workspace", href: "/workspace", icon: <Terminal className="w-4 h-4" /> },
  { label: "Learn", href: "/learn", icon: <BookOpen className="w-4 h-4" /> },
  { label: "Visualize", href: "/visualize", icon: <Eye className="w-4 h-4" /> },
  { label: "Practice", href: "/practice", icon: <Code2 className="w-4 h-4" /> },
  { label: "Enterprise", href: "/enterprise", icon: <Layers className="w-4 h-4" /> },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    let isMounted = true;
    fetchHealth()
      .then((res) => {
        if (isMounted) {
          if (res.status === "UP") {
            setBackendStatus("online");
          } else {
            setBackendStatus("offline");
          }
        }
      })
      .catch(() => {
        if (isMounted) setBackendStatus("offline");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const cycleTheme = () => {
    const nextTheme: Record<Theme, Theme> = {
      dark: "light",
      light: "system",
      system: "dark",
    };
    setTheme(nextTheme[theme]);
  };

  const themeIcon = {
    dark: <Moon className="w-4 h-4 text-zinc-300" />,
    light: <Sun className="w-4 h-4 text-amber-500" />,
    system: <Laptop className="w-4 h-4 text-blue-400" />,
  }[theme];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <NextLink
              href="/"
              className="flex items-center gap-2.5 font-semibold text-zinc-100 hover:text-white transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                <Code2 className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-base">CodeVista</span>
                <span className="rounded-md bg-blue-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-blue-400 border border-blue-500/20">
                  AI
                </span>
              </div>
            </NextLink>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <NextLink
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-zinc-850 text-white shadow-2xs font-semibold"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NextLink>
                );
              })}
            </nav>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            {/* Backend Connectivity Status */}
            <div className="hidden sm:flex items-center">
              {backendStatus === "checking" ? (
                <Badge variant="outline" size="sm" dot>
                  API ...
                </Badge>
              ) : backendStatus === "online" ? (
                <Badge variant="success" size="sm" dot>
                  API Online
                </Badge>
              ) : (
                <Badge variant="outline" size="sm" dot>
                  API Standby
                </Badge>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={cycleTheme}
              title={`Current theme: ${theme} (click to cycle)`}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-100 transition-colors cursor-pointer"
            >
              {themeIcon}
            </button>

            {/* Settings & Profile Shortcuts / Auth Controls */}
            {isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-zinc-800">
                <NextLink
                  href="/profile"
                  title={`Signed in as ${user?.username}`}
                  className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    pathname === "/profile"
                      ? "bg-blue-600/20 text-blue-300 border border-blue-500/30"
                      : "text-zinc-300 hover:text-white hover:bg-zinc-900 border border-zinc-800"
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white font-bold">
                    {user?.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[90px] truncate">{user?.username}</span>
                  {user?.role && user.role !== "ROLE_STUDENT" && (
                    <span className="text-[9px] uppercase px-1 py-0.2 bg-amber-500/20 text-amber-300 rounded font-mono">
                      {user.role.replace("ROLE_", "")}
                    </span>
                  )}
                </NextLink>
                <NextLink
                  href="/settings"
                  title="Settings"
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                    pathname === "/settings"
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
                  }`}
                >
                  <Settings className="w-4 h-4" />
                </NextLink>
                <button
                  type="button"
                  onClick={logout}
                  title="Sign Out"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-950/40 hover:text-red-300 border border-transparent hover:border-red-500/20 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-zinc-800">
                <NextLink
                  href="/settings"
                  title="Settings"
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                    pathname === "/settings"
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
                  }`}
                >
                  <Settings className="w-4 h-4" />
                </NextLink>
                <NextLink
                  href="/profile"
                  title="Guest Profile"
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                    pathname === "/profile"
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
                  }`}
                >
                  <User className="w-4 h-4" />
                </NextLink>
                <button
                  type="button"
                  onClick={() => openAuthModal("login")}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              </div>
            )}

            {/* Mobile Nav Toggle */}
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
              className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        navItems={navItems}
        pathname={pathname}
      />
    </>
  );
}
