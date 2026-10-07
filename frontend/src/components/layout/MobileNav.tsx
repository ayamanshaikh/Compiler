"use client";

import React, { useEffect } from "react";
import NextLink from "next/link";
import { X, Code2, Settings, User, ShieldAlert, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  pathname: string;
}

export function MobileNav({
  isOpen,
  onClose,
  navItems,
  pathname,
}: MobileNavProps) {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xs animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out drawer */}
      <div className="fixed inset-y-0 right-0 w-3/4 max-w-xs bg-zinc-950 border-l border-zinc-800 p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
        <div>
          <div className="flex items-center justify-between pb-5 border-b border-zinc-850">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Code2 className="h-4 w-4" />
              </div>
              <span className="font-bold text-sm text-zinc-100">CodeVista AI</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="mt-6 flex flex-col gap-1.5">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <NextLink
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NextLink>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-zinc-850 flex flex-col gap-2">
          {isAuthenticated ? (
            <div className="p-3 mb-2 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs text-white font-bold shrink-0">
                  {user?.username.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-zinc-200 truncate">{user?.username}</div>
                  <div className="text-[10px] text-zinc-500 truncate">{user?.email}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  onClose();
                }}
                title="Sign Out"
                className="p-1.5 text-zinc-400 hover:text-red-400 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                openAuthModal("login");
              }}
              className="flex items-center justify-center gap-2 w-full py-2 mb-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Register</span>
            </button>
          )}

          <NextLink
            href="/settings"
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium ${
              pathname === "/settings" ? "text-white bg-zinc-900" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </NextLink>
          <NextLink
            href="/profile"
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium ${
              pathname === "/profile" ? "text-white bg-zinc-900" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </NextLink>
          <NextLink
            href="/admin"
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium ${
              pathname === "/admin" ? "text-white bg-zinc-900" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Admin</span>
          </NextLink>
        </div>
      </div>
    </div>
  );
}
