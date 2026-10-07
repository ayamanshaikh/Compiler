"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useTheme } from "@/lib/context/ThemeContext";
import { useAuth } from "@/lib/context/AuthContext";
import {
  changePassword,
  AccentColor,
  AnimationMode,
  VisualizationDetail,
  VisualDensity,
} from "@/lib/api/auth";
import {
  Sun,
  Moon,
  Laptop,
  Sliders,
  User,
  Shield,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
  Gauge,
  BookOpen,
  LogIn,
  LogOut,
  Palette,
  Sparkles,
  Zap,
  WrapText,
  Map,
} from "lucide-react";

const ACCENT_OPTIONS: {
  key: AccentColor;
  label: string;
  description: string;
  swatchBg: string;
  borderRing: string;
}[] = [
  {
    key: "emerald",
    label: "Emerald",
    description: "CodeVista signature emerald green — technical & focused.",
    swatchBg: "bg-emerald-500",
    borderRing: "border-emerald-500",
  },
  {
    key: "indigo",
    label: "Indigo",
    description: "Deep technical indigo — calm & modern IDE aesthetic.",
    swatchBg: "bg-indigo-500",
    borderRing: "border-indigo-500",
  },
  {
    key: "cyan",
    label: "Cyan",
    description: "Vibrant high-contrast cyber cyan for crisp readability.",
    swatchBg: "bg-cyan-500",
    borderRing: "border-cyan-500",
  },
  {
    key: "amber",
    label: "Amber",
    description: "Warm amber glow — easy on the eyes during late night coding.",
    swatchBg: "bg-amber-500",
    borderRing: "border-amber-500",
  },
  {
    key: "rose",
    label: "Rose",
    description: "Vivid neon rose accent for high-energy problem solving.",
    swatchBg: "bg-rose-500",
    borderRing: "border-rose-500",
  },
];

const ANIMATION_MODES: {
  key: AnimationMode;
  label: string;
  tag: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    key: "professional",
    label: "Professional",
    tag: "Minimal & Zero CPU",
    description: "All non-essential animations disabled. Instant UI transitions, zero canvas particles, lowest battery and CPU overhead.",
    icon: Zap,
  },
  {
    key: "balanced",
    label: "Balanced",
    tag: "Recommended",
    description: "Silky smooth UI transitions and subtle interactive hover glows without distraction. Optimized for productivity.",
    icon: Sliders,
  },
  {
    key: "enhanced",
    label: "Enhanced",
    tag: "Interactive & Expressive",
    description: "Dynamic canvas particle networks, mouse-tracking spotlight cards, and ambient luminous glows across the interface.",
    icon: Sparkles,
  },
];

export default function SettingsPage() {
  const {
    theme,
    setTheme,
    accent,
    setAccent,
    animationMode,
    setAnimationMode,
    prefersReducedMotion,
  } = useTheme();

  const {
    user,
    isAuthenticated,
    preferences,
    updatePreferences,
    openAuthModal,
    logout,
    progress,
  } = useAuth();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Reset confirmation state
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleThemeChange = (newTheme: "dark" | "light" | "system") => {
    setTheme(newTheme);
    updatePreferences({ theme: newTheme });
  };

  const handleAccentChange = (newAccent: AccentColor) => {
    setAccent(newAccent);
    updatePreferences({ accent: newAccent });
  };

  const handleAnimationModeChange = (newMode: AnimationMode) => {
    setAnimationMode(newMode);
    updatePreferences({ animationMode: newMode });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus({ type: null, message: "" });

    if (newPassword.length < 6) {
      setPasswordStatus({
        type: "error",
        message: "New password must be at least 6 characters long.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({
        type: "error",
        message: "New password and confirmation do not match.",
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordStatus({
        type: "success",
        message: "Password changed successfully!",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setPasswordStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to change password.",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleExportData = () => {
    const exportData = {
      user: user || { role: "GUEST", username: "guest" },
      preferences,
      progress,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `codevista-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleResetData = () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem("codevista_guest_progress");
      localStorage.removeItem("codevista_guest_preferences");
      localStorage.removeItem("codevista-accent");
      localStorage.removeItem("codevista-animation-mode");
      localStorage.removeItem("codevista-theme");
    }
    setResetMessage("Local learning progress & preferences have been cleared.");
    setResetConfirm(false);
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  return (
    <AppShell>
      <PageContainer narrow>
        <PageHeader
          title="Preferences & Settings"
          description="Manage developer tool appearance, accent colors, animation intensity, editor typography, and AI explanation depth."
          badge={
            isAuthenticated ? (
              <Badge variant="success" size="sm" dot>
                Cloud Synced
              </Badge>
            ) : (
              <Badge variant="warning" size="sm" dot>
                Local Settings
              </Badge>
            )
          }
        />

        <div className="space-y-6">
          {/* Appearance & Theme */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-accent" />
                <CardTitle>Appearance & Theme</CardTitle>
              </div>
              <CardDescription>
                Select your preferred interface color mode, accent color palette, and animation motion budget.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Color Mode */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2.5">
                  Color Mode
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleThemeChange("dark")}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-xs font-medium gap-2 transition-all cursor-pointer ${
                      theme === "dark"
                        ? "border-accent bg-accent/10 text-accent font-semibold"
                        : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    <span>Dark</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleThemeChange("light")}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-xs font-medium gap-2 transition-all cursor-pointer ${
                      theme === "light"
                        ? "border-accent bg-accent/10 text-accent font-semibold"
                        : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span>Light</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleThemeChange("system")}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-xs font-medium gap-2 transition-all cursor-pointer ${
                      theme === "system"
                        ? "border-accent bg-accent/10 text-accent font-semibold"
                        : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    <Laptop className="w-4 h-4" />
                    <span>System</span>
                  </button>
                </div>
              </div>

              {/* Accent Color Palette */}
              <div className="pt-4 border-t border-zinc-800/80">
                <div className="flex items-center justify-between mb-2.5">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Accent Color
                  </label>
                  <span className="text-[11px] text-zinc-500 capitalize font-mono">
                    Current: {accent}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {ACCENT_OPTIONS.map((item) => {
                    const isSelected = accent === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleAccentChange(item.key)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? `border-accent bg-accent/10 text-zinc-100 ring-1 ring-accent`
                            : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          <span
                            className={`w-4 h-4 rounded-full ${item.swatchBg} shadow-sm inline-block`}
                          />
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-accent" />
                          )}
                        </div>
                        <span className="text-xs font-medium block">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Animation Mode Selector */}
              <div className="pt-4 border-t border-zinc-800/80">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Animation & Motion Mode
                  </label>
                  {prefersReducedMotion && (
                    <Badge variant="warning" size="sm">
                      Reduced Motion Detected
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {ANIMATION_MODES.map((mode) => {
                    const isSelected = animationMode === mode.key;
                    const Icon = mode.icon;
                    return (
                      <button
                        key={mode.key}
                        type="button"
                        onClick={() => handleAnimationModeChange(mode.key)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "border-accent bg-accent/10 text-zinc-100 ring-1 ring-accent"
                            : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <Icon className="w-4 h-4 text-accent" />
                              <span className="text-xs font-semibold text-zinc-100">
                                {mode.label}
                              </span>
                            </div>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                              {mode.tag}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">
                            {mode.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {prefersReducedMotion && (
                  <p className="text-[11px] text-amber-400/90 mt-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Your operating system has reduced motion enabled. CodeVista will honor this by using Professional mode at runtime.
                    </span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Editor Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-accent" />
                <CardTitle>Code Editor Preferences</CardTitle>
              </div>
              <CardDescription>
                Configure Monaco code editor typography, formatting width, and editor behavior.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Font Size Selector */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-2">
                  Editor Font Size ({preferences.fontSize}px)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[12, 14, 16, 18, 20].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => updatePreferences({ fontSize: size })}
                      className={`py-2 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                        preferences.fontSize === size
                          ? "border-accent bg-accent/10 text-accent font-bold"
                          : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      {size}px
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Size Selector */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-2">
                  Indentation Width
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[2, 4].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => updatePreferences({ tabSize: size })}
                      className={`py-2 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                        preferences.tabSize === size
                          ? "border-accent bg-accent/10 text-accent font-bold"
                          : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      {size} Spaces
                    </button>
                  ))}
                </div>
              </div>

              {/* Line Wrapping Toggle */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                <div className="flex items-start gap-2">
                  <WrapText className="w-4 h-4 text-zinc-400 mt-0.5" />
                  <div>
                    <span className="text-xs font-medium text-zinc-200 block">
                      Soft Line Wrapping
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Wrap long lines to fit editor viewport width instead of horizontal scrolling
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updatePreferences({
                      lineWrapping: preferences.lineWrapping === undefined ? false : !preferences.lineWrapping,
                    })
                  }
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    preferences.lineWrapping !== false ? "bg-accent" : "bg-zinc-800"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      preferences.lineWrapping !== false ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Minimap Toggle */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                <div className="flex items-start gap-2">
                  <Map className="w-4 h-4 text-zinc-400 mt-0.5" />
                  <div>
                    <span className="text-xs font-medium text-zinc-200 block">
                      Code Minimap
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Display high-level code thumbnail overview on the right side of the editor
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updatePreferences({
                      minimap: !preferences.minimap,
                    })
                  }
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    preferences.minimap ? "bg-accent" : "bg-zinc-800"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      preferences.minimap ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Auto-run Toggle */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                <div>
                  <span className="text-xs font-medium text-zinc-200 block">
                    Auto-Run Code on Edit
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    Automatically trigger compiler checks when source code settles
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => updatePreferences({ autoRunEnabled: !preferences.autoRunEnabled })}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    preferences.autoRunEnabled ? "bg-accent" : "bg-zinc-800"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      preferences.autoRunEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Visualizer Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-accent" />
                <CardTitle>Execution & Trace Visualizer</CardTitle>
              </div>
              <CardDescription>
                Tune the playback speed, memory inspection depth, and visual density of Java runtime traces.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Step Speed Presets */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-zinc-200">
                    Default Step Playback Speed
                  </label>
                  <span className="text-xs text-accent font-mono">
                    {preferences.visualizerSpeed}ms
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[
                    { label: "Fast (300ms)", val: 300 },
                    { label: "Normal (600ms)", val: 600 },
                    { label: "Deliberate (1s)", val: 1000 },
                    { label: "Slow (1.5s)", val: 1500 },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => updatePreferences({ visualizerSpeed: preset.val })}
                      className={`py-2 px-1 text-center rounded-lg border text-[11px] transition-all cursor-pointer ${
                        preferences.visualizerSpeed === preset.val
                          ? "border-accent bg-accent/10 text-accent font-semibold"
                          : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visualization Detail Level */}
              <div className="pt-3 border-t border-zinc-800/80">
                <label className="block text-xs font-medium text-zinc-300 mb-2">
                  Trace Visualization Detail
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      key: "compact" as VisualizationDetail,
                      title: "Compact",
                      desc: "Variables and active call stack only. Ideal for quick algorithmic logic reviews.",
                    },
                    {
                      key: "standard" as VisualizationDetail,
                      title: "Standard",
                      desc: "Variables, call frames, heap objects, and reference pointers.",
                    },
                    {
                      key: "detailed" as VisualizationDetail,
                      title: "Detailed",
                      desc: "Full memory layout, JVM stack mechanics, operand evaluations, and object addresses.",
                    },
                  ].map((item) => {
                    const isSelected =
                      (preferences.visualizationDetail || "standard") === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() =>
                          updatePreferences({ visualizationDetail: item.key })
                        }
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-accent bg-accent/10 text-zinc-100 ring-1 ring-accent"
                            : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                      >
                        <div className="font-semibold text-xs text-zinc-100 mb-1 flex items-center justify-between">
                          <span>{item.title}</span>
                          {isSelected && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          {item.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Visual Density */}
              <div className="pt-3 border-t border-zinc-800/80">
                <label className="block text-xs font-medium text-zinc-300 mb-2">
                  Visual Layout Density
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    {
                      key: "comfortable" as VisualDensity,
                      title: "Comfortable",
                      desc: "Spacious diagram cards and relaxed memory node margins.",
                    },
                    {
                      key: "compact" as VisualDensity,
                      title: "Compact",
                      desc: "Dense memory diagrams with maximized viewport data capacity.",
                    },
                  ].map((item) => {
                    const isSelected =
                      (preferences.visualDensity || "comfortable") === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => updatePreferences({ visualDensity: item.key })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-accent bg-accent/10 text-zinc-100 ring-1 ring-accent"
                            : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                      >
                        <div className="font-semibold text-xs text-zinc-100 mb-1 flex items-center justify-between">
                          <span>{item.title}</span>
                          {isSelected && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          {item.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Educational Explanation Depth */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-accent" />
                <CardTitle>AI Explanation Depth</CardTitle>
              </div>
              <CardDescription>
                Calibrate how compiler errors and trace stepping explanations are tailored to your learning stage.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    key: "BEGINNER",
                    title: "Beginner",
                    desc: "Plain English explanations, clear analogies, and step-by-step guidance.",
                  },
                  {
                    key: "STANDARD",
                    title: "Standard",
                    desc: "Balanced technical reasoning with syntax rules and common pitfalls.",
                  },
                  {
                    key: "DETAILED",
                    title: "Detailed",
                    desc: "JVM stack & heap mechanics, bytecode nuances, and memory semantics.",
                  },
                ].map((tier) => (
                  <button
                    key={tier.key}
                    type="button"
                    onClick={() =>
                      updatePreferences({
                        explanationDepth: tier.key as "BEGINNER" | "STANDARD" | "DETAILED",
                      })
                    }
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      preferences.explanationDepth === tier.key
                        ? "border-accent bg-accent/10 text-zinc-100 ring-1 ring-accent"
                        : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    <div className="font-semibold text-xs text-zinc-100 mb-1 flex items-center justify-between">
                      <span>{tier.title}</span>
                      {preferences.explanationDepth === tier.key && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{tier.desc}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Account & Security Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <CardTitle>Account & Security</CardTitle>
              </div>
              <CardDescription>
                {isAuthenticated
                  ? "Manage credentials and account access."
                  : "Sign in or create an account to sync preferences across devices."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAuthenticated ? (
                <div className="space-y-6">
                  {/* Account overview */}
                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white font-bold text-sm">
                        {user?.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-zinc-100">{user?.username}</div>
                        <div className="text-xs text-zinc-400 font-mono">{user?.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" size="sm">
                        {user?.role.replace("ROLE_", "")}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={logout} className="text-xs gap-1 text-red-400 hover:text-red-300">
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </Button>
                    </div>
                  </div>

                  {/* Password Change Form */}
                  <form onSubmit={handlePasswordSubmit} className="space-y-3.5 pt-2">
                    <h4 className="text-xs font-semibold text-zinc-200">Change Password</h4>

                    {passwordStatus.message && (
                      <div
                        className={`flex items-start gap-2 p-3 rounded-lg text-xs ${
                          passwordStatus.type === "success"
                            ? "bg-emerald-950/40 border border-emerald-500/30 text-emerald-300"
                            : "bg-red-950/40 border border-red-500/30 text-red-300"
                        }`}
                      >
                        {passwordStatus.type === "success" ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                        )}
                        <span>{passwordStatus.message}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">
                        Current Password
                      </label>
                      <Input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          New Password
                        </label>
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          Confirm New Password
                        </label>
                        <Input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <Button
                        type="submit"
                        variant="secondary"
                        size="sm"
                        disabled={isUpdatingPassword}
                      >
                        {isUpdatingPassword ? "Updating..." : "Update Password"}
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                  <User className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                  <h4 className="text-sm font-semibold text-zinc-200">Browsing as Guest</h4>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 mb-4">
                    Sign in to synchronize your editor preferences, completed topics, and solved challenges across any browser or computer.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openAuthModal("register")}
                    className="gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Create Free Account / Sign In</span>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data & Backup */}
          <Card>
            <CardHeader>
              <CardTitle>Data & Local Cache</CardTitle>
              <CardDescription>
                Export your learning trajectory or clear local browser cached state.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resetMessage && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{resetMessage}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExportData}
                  className="w-full sm:w-auto gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Learning Data (.json)</span>
                </Button>

                <Button
                  variant={resetConfirm ? "danger" : "ghost"}
                  size="sm"
                  onClick={handleResetData}
                  className={`w-full sm:w-auto gap-1.5 ${
                    resetConfirm
                      ? "bg-red-600 text-white hover:bg-red-500"
                      : "text-zinc-400 hover:text-red-400"
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{resetConfirm ? "Confirm Clear Data" : "Clear Local Cache"}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
