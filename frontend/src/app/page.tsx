"use client";

import NextLink from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageContainer } from "@/components/layout/PageContainer";
import { CardTitle, CardDescription, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { GridPattern } from "@/components/reactbits/GridPattern";
import { Particles } from "@/components/reactbits/Particles";
import { DecryptedText } from "@/components/reactbits/DecryptedText";
import { ShinyText } from "@/components/reactbits/ShinyText";
import { SpotlightCard } from "@/components/reactbits/SpotlightCard";
import { ScrollReveal } from "@/components/reactbits/ScrollReveal";
import {
  Terminal,
  BookOpen,
  Eye,
  Code2,
  ArrowRight,
  Cpu,
  Layers,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export default function HomePage() {
  return (
    <AppShell showSidebar={false}>
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-zinc-800/80 bg-zinc-950 pt-20 pb-24">
        <GridPattern className="opacity-60" />
        <Particles className="opacity-35" quantity={28} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/80 backdrop-blur-xs">
            <Badge variant="default" size="sm" dot>
              Java-First Educational Platform
            </Badge>
            <span className="text-zinc-600">•</span>
            <span className="text-xs font-mono text-zinc-400">JDK 25 LTS Sandbox</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-zinc-100 max-w-4xl mx-auto">
            CodeVista{" "}
            <span className="text-accent">
              <ShinyText text="AI" />
            </span>
          </h1>

          <div className="mt-5 text-xl sm:text-2xl font-medium text-zinc-300 italic tracking-tight min-h-[36px] flex items-center justify-center">
            &ldquo;
            <DecryptedText
              text="Don't just run your code. Understand what happens."
              speed={25}
              animateOn="view"
              className="text-zinc-200 not-italic font-medium"
            />
            &rdquo;
          </div>

          <p className="mt-4 text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Beyond standard online compilers. Step-by-step JVM execution tracing,
            beginner-friendly compiler error intelligence, and interactive algorithm memory visualization.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <NextLink href="/workspace">
              <Button
                variant="primary"
                size="lg"
                leftIcon={<Terminal className="w-4 h-4" />}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Launch Workspace
              </Button>
            </NextLink>
            <NextLink href="/learn">
              <Button
                variant="secondary"
                size="lg"
                leftIcon={<BookOpen className="w-4 h-4" />}
              >
                Browse Curriculum
              </Button>
            </NextLink>
          </div>
        </div>
      </div>

      {/* Core Architectural Pillars */}
      <PageContainer>
        <ScrollReveal>
          <div className="text-center mb-10">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">
              System Modules
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Integrated architecture engineered for deep Java comprehension and algorithmic intuition.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Workspace Module */}
          <ScrollReveal delayMs={50}>
            <SpotlightCard className="h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                  <Terminal className="w-5 h-5" />
                </div>
                <CardTitle>IDE Workspace</CardTitle>
                <CardDescription className="mt-2 text-zinc-400">
                  Full Monaco-powered Java IDE with real-time compilation, standard input streaming, and intelligent error remediation.
                </CardDescription>
              </div>
              <CardFooter className="justify-between px-0 pt-4 pb-0 mt-4 border-t border-zinc-800/80">
                <span className="font-mono text-[11px] text-zinc-500">/workspace</span>
                <NextLink
                  href="/workspace"
                  className="text-accent hover:opacity-80 font-medium inline-flex items-center gap-1 text-xs"
                >
                  Open <ArrowRight className="w-3.5 h-3.5" />
                </NextLink>
              </CardFooter>
            </SpotlightCard>
          </ScrollReveal>

          {/* Learn Module */}
          <ScrollReveal delayMs={100}>
            <SpotlightCard className="h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                  <BookOpen className="w-5 h-5" />
                </div>
                <CardTitle>Curriculum Track</CardTitle>
                <CardDescription className="mt-2 text-zinc-400">
                  Step-by-step syllabus covering OOP fundamentals, Collections, Multithreading, Servlets, Hibernate, and PostgreSQL.
                </CardDescription>
              </div>
              <CardFooter className="justify-between px-0 pt-4 pb-0 mt-4 border-t border-zinc-800/80">
                <span className="font-mono text-[11px] text-zinc-500">/learn</span>
                <NextLink
                  href="/learn"
                  className="text-accent hover:opacity-80 font-medium inline-flex items-center gap-1 text-xs"
                >
                  Explore <ArrowRight className="w-3.5 h-3.5" />
                </NextLink>
              </CardFooter>
            </SpotlightCard>
          </ScrollReveal>

          {/* Visualize Module */}
          <ScrollReveal delayMs={150}>
            <SpotlightCard className="h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
                  <Eye className="w-5 h-5" />
                </div>
                <CardTitle>Execution Visualizer</CardTitle>
                <CardDescription className="mt-2 text-zinc-400">
                  Step through bytecode-accurate JVM stack frames, heap references, object allocations, and data structure mutations.
                </CardDescription>
              </div>
              <CardFooter className="justify-between px-0 pt-4 pb-0 mt-4 border-t border-zinc-800/80">
                <span className="font-mono text-[11px] text-zinc-500">/visualize</span>
                <NextLink
                  href="/visualize"
                  className="text-accent hover:opacity-80 font-medium inline-flex items-center gap-1 text-xs"
                >
                  Inspect <ArrowRight className="w-3.5 h-3.5" />
                </NextLink>
              </CardFooter>
            </SpotlightCard>
          </ScrollReveal>

          {/* Practice Module */}
          <ScrollReveal delayMs={200}>
            <SpotlightCard className="h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                  <Code2 className="w-5 h-5" />
                </div>
                <CardTitle>Practice Sandbox</CardTitle>
                <CardDescription className="mt-2 text-zinc-400">
                  Battle-tested coding challenges ranging from Easy to Hard with real JUnit-grade test suites and test case breakdowns.
                </CardDescription>
              </div>
              <CardFooter className="justify-between px-0 pt-4 pb-0 mt-4 border-t border-zinc-800/80">
                <span className="font-mono text-[11px] text-zinc-500">/practice</span>
                <NextLink
                  href="/practice"
                  className="text-accent hover:opacity-80 font-medium inline-flex items-center gap-1 text-xs"
                >
                  Solve <ArrowRight className="w-3.5 h-3.5" />
                </NextLink>
              </CardFooter>
            </SpotlightCard>
          </ScrollReveal>
        </div>

        {/* Real-time Compilation Pipeline Highlight */}
        <div className="mt-16">
          <ScrollReveal>
            <div className="p-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 relative overflow-hidden">
              <div className="max-w-2xl mb-8">
                <Badge variant="outline" size="sm" className="mb-2">
                  Architecture Overview
                </Badge>
                <h3 className="text-xl sm:text-2xl font-bold text-zinc-100">
                  How CodeVista Understands Java Code
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
                  Every run undergoes real operating system process isolation with high-security sandboxing, AST inspection, and state extraction.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/90 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-blue-400">
                      <Cpu className="w-4 h-4" />
                      <span className="text-xs font-semibold">1. Isolated Subprocess</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Compiles and executes against authentic JDK 25 LTS with strict time and memory limits.
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Real javac & java runtime</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/90 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-indigo-400">
                      <Layers className="w-4 h-4" />
                      <span className="text-xs font-semibold">2. Memory Snapshotting</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Captures step-by-step call stacks, local variable scope, and heap object structures.
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Deterministic trace timeline</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/90 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-accent">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-xs font-semibold">3. Pedagogical AI Feedback</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Converts cryptic compiler errors into beginner-friendly explanations with fix diffs.
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Multi-depth learning tiers</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </PageContainer>
    </AppShell>
  );
}
