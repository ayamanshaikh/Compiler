"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { animate, stagger } from "animejs";
import {
  Code2,
  Play,
  Eye,
  ArrowRight,
  Sparkles,
  Lightbulb,
  Braces,
  Terminal,
  Layers,
  ChevronRight,
  Zap,
  Shield,
  Cpu,
  BookOpen,
  Atom,
} from "lucide-react";

const HeroScene = dynamic(() => import("@/components/HeroScene"), {
  ssr: false,
  loading: () => <div className="absolute inset-0" />,
});

const LiveDemo = dynamic(() => import("@/components/LiveDemo"), {
  ssr: false,
  loading: () => <div className="h-[400px] animate-pulse" />,
});

const FEATURES = [
  {
    icon: Terminal,
    title: "Real Java Compilation",
    description:
      "Write and compile actual Java code. No simulated environments — real javac compilation and execution.",
    gradient: "from-blue-500 to-cyan-500",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    glowColor: "rgba(59, 130, 246, 0.12)",
  },
  {
    icon: Lightbulb,
    title: "Intelligent Error Explanation",
    description:
      "When the compiler fails, understand why. Every error comes with a beginner-friendly explanation and fix suggestion.",
    gradient: "from-purple-500 to-pink-500",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400",
    glowColor: "rgba(139, 92, 246, 0.12)",
  },
  {
    icon: Eye,
    title: "Step-by-Step Visualization",
    description:
      "Watch your code execute line by line. See variables change, arrays swap, and conditions evaluate in real time.",
    gradient: "from-emerald-500 to-green-400",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    glowColor: "rgba(16, 185, 129, 0.12)",
  },
  {
    icon: Braces,
    title: "Data Structure Visualization",
    description:
      "See arrays, lists, and other data structures transform as your program runs. Visual feedback for every operation.",
    gradient: "from-amber-500 to-orange-400",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    glowColor: "rgba(245, 158, 11, 0.12)",
  },
  {
    icon: Sparkles,
    title: "AI-Style Explanations",
    description:
      "Each execution step includes a human-readable explanation of what is happening and why.",
    gradient: "from-cyan-500 to-blue-400",
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-400",
    glowColor: "rgba(6, 182, 212, 0.12)",
  },
  {
    icon: Layers,
    title: "Interactive Workspace",
    description:
      "A professional IDE-like environment designed for learning. Navigate through execution at your own pace.",
    gradient: "from-rose-500 to-pink-400",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-400",
    glowColor: "rgba(244, 63, 94, 0.12)",
  },
];

const STATS = [
  { value: "8", label: "Algorithm Examples", icon: Code2 },
  { value: "3", label: "Analysis Modes", icon: Cpu },
  { value: "∞", label: "Lines of Code", icon: Terminal },
  { value: "0", label: "Setup Required", icon: Zap },
];

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  // Hero entrance animation
  useEffect(() => {
    if (!heroRef.current) return;
    const els = heroRef.current.querySelectorAll("[data-hero]");
    animate(Array.from(els), {
      opacity: [0, 1],
      translateY: [24, 0],
      duration: 600,
      ease: "outExpo",
      delay: stagger(100, { start: 200 }),
    });
  }, []);

  // Feature cards entrance on scroll
  useEffect(() => {
    if (!featuresRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cards = featuresRef.current?.querySelectorAll("[data-feature]");
            if (cards) {
              animate(Array.from(cards), {
                opacity: [0, 1],
                translateY: [30, 0],
                scale: [0.96, 1],
                duration: 500,
                ease: "outExpo",
                delay: stagger(80),
              });
            }
            observer.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(featuresRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#06090f] text-white">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 mesh-gradient" />
        <div className="absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full bg-blue-500/[0.04] blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-purple-500/[0.03] blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/[0.02] blur-[80px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/[0.04]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20">
              <Code2 size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              CodeVista<span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">AI</span>
            </span>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            {["Features", "How It Works", "About"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-[13px] text-zinc-500 transition-colors hover:text-white"
              >
                {item}
              </a>
            ))}
          </div>

          <Link
            href="/workshop"
            className="btn-3d btn-3d-primary btn-3d-sm"
          >
            Launch Workspace
            <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-20 pb-32 md:pt-28 md:pb-40">
        {/* 3D Scene */}
        <HeroScene />

        <div ref={heroRef} className="relative z-20 mx-auto max-w-5xl text-center">
          {/* Badge */}
          <div data-hero className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-2 text-[12px] text-blue-300 backdrop-blur-sm">
            <Atom size={14} className="animate-spin" style={{ animationDuration: "8s" }} />
            Interactive Java Learning Platform
          </div>

          {/* Main headline */}
          <h1 data-hero className="text-5xl font-bold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl">
            <span className="block">Don&apos;t just run your code.</span>
            <span className="mt-2 block bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Understand what happens.
            </span>
          </h1>

          {/* Subtitle */}
          <p data-hero className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-zinc-400">
            CodeVista AI transforms Java code execution into an interactive
            learning experience — explaining errors, tracking program state,
            and visualizing execution step by step.
          </p>

          {/* CTA Buttons */}
          <div data-hero className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/workshop"
              className="btn-3d btn-3d-primary"
            >
              <Play size={18} />
              Try CodeVista
              <ArrowRight size={16} />
            </Link>
            <a
              href="#how-it-works"
              className="btn-3d btn-3d-ghost"
            >
              See How It Works
              <ChevronRight size={16} />
            </a>
          </div>

          {/* Stats */}
          <div data-hero className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="glass-surface rounded-xl p-4 text-center"
              >
                <stat.icon size={16} className="mx-auto mb-2 text-blue-400/60" />
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="mt-1 text-[11px] text-zinc-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Interactive Demo */}
      <section className="relative z-10 px-6 pb-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold md:text-3xl">
              See It In Action
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-zinc-500">
              Watch bubble sort execute step by step — code, compile, visualize.
            </p>
          </div>
          <div className="card-3d overflow-hidden">
            {/* IDE header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/50 shadow-sm" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/50 shadow-sm" />
                  <div className="h-3 w-3 rounded-full bg-green-500/50 shadow-sm" />
                </div>
                <div className="h-4 w-px bg-white/10" />
                <span className="text-[12px] font-medium text-zinc-400">
                  Main.java — CodeVista AI
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-1 text-[11px] text-blue-300">
                  <Terminal size={11} />
                  Java
                </div>
              </div>
            </div>
            <LiveDemo />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 border-t border-white/[0.04] px-6 py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-[11px] text-zinc-500">
              <Zap size={12} />
              CAPABILITIES
            </div>
            <h2 className="text-3xl font-bold md:text-4xl">
              Built for{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Understanding
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-zinc-500">
              Every feature is designed to help you see what your code actually
              does — from compilation to execution.
            </p>
          </div>

          <div ref={featuresRef} className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, index) => (
              <div
                key={feature.title}
                data-feature
                className="card-3d group p-6"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div
                  className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${feature.iconBg} transition-all group-hover:scale-110`}
                  style={{
                    boxShadow: `0 0 30px ${feature.glowColor}`,
                  }}
                >
                  <feature.icon size={20} className={feature.iconColor} />
                </div>
                <h3 className="text-sm font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2.5 text-[13px] leading-6 text-zinc-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="relative z-10 border-t border-white/[0.04] px-6 py-28"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-[11px] text-zinc-500">
              <BookOpen size={12} />
              WORKFLOW
            </div>
            <h2 className="text-3xl font-bold md:text-4xl">
              From Code to{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Understanding
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-zinc-500">
              Four simple steps to truly understand your code.
            </p>
          </div>

          <div className="relative space-y-6">
            {/* Vertical line connector */}
            <div className="absolute left-[22px] top-12 bottom-12 w-px bg-gradient-to-b from-blue-500/20 via-purple-500/20 to-emerald-500/20" />

            {[
              {
                step: "01",
                title: "Write Java code",
                desc: "Use the professional Monaco editor with syntax highlighting, bracket matching, and auto-completion.",
                icon: Code2,
                color: "blue",
              },
              {
                step: "02",
                title: "Compile and run",
                desc: "Real javac compilation happens on our secure backend. If there are errors, you get the full diagnostic output.",
                icon: Terminal,
                color: "purple",
              },
              {
                step: "03",
                title: "Understand errors",
                desc: "Every compiler error comes with a plain-English explanation, the root cause, and a specific fix suggestion.",
                icon: Lightbulb,
                color: "amber",
              },
              {
                step: "04",
                title: "Visualize execution",
                desc: "Step through your program line by line. Watch variables change, arrays swap, and conditions evaluate.",
                icon: Eye,
                color: "emerald",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="card-3d group relative flex items-start gap-6 p-6"
              >
                <div className="relative z-10 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 font-mono text-sm font-bold text-blue-300 ring-1 ring-white/[0.06]">
                  {item.step}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-semibold text-white">
                      {item.title}
                    </h3>
                    <item.icon size={16} className={`text-${item.color}-400 opacity-60`} />
                  </div>
                  <p className="mt-2 text-[13px] leading-6 text-zinc-500">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative z-10 border-t border-white/[0.04] px-6 py-28">
        <div className="mx-auto max-w-4xl text-center">
          <div className="card-3d mx-auto max-w-2xl p-10">
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 ring-1 ring-white/[0.08]">
                <Atom size={32} className="text-blue-400" />
              </div>
            </div>
            <h2 className="text-3xl font-bold md:text-4xl">
              Programming should be{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                visible.
              </span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-[15px] leading-7 text-zinc-400">
              Traditional compilers show you output. CodeVista AI shows you what
              happens inside. See every variable assignment, every comparison, every
              swap — explained in language you understand.
            </p>
            <div className="mt-10">
              <Link
                href="/workshop"
                className="btn-3d btn-3d-primary"
              >
                <Shield size={16} />
                Start Coding
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.04] px-6 py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 size={16} className="text-zinc-700" />
            <span className="text-[13px] font-medium text-zinc-700">
              CodeVista AI
            </span>
          </div>
          <p className="text-[12px] text-zinc-800">
            Write. Run. Understand. Visualize.
          </p>
        </div>
      </footer>
    </div>
  );
}
