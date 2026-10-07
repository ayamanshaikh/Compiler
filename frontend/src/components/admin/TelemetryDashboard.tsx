"use client";

import React from "react";
import { AdminMetricsResponse } from "@/lib/api/admin";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Cpu,
  Layers,
  Users,
  Activity,
  HardDrive,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Zap,
  Database,
} from "lucide-react";

interface TelemetryDashboardProps {
  metrics: AdminMetricsResponse | null;
  isLoading: boolean;
}

export function TelemetryDashboard({ metrics }: TelemetryDashboardProps) {
  if (!metrics) {
    return (
      <div className="p-8 text-center text-zinc-500 font-mono text-sm border border-zinc-800 rounded-xl bg-zinc-900/40">
        Loading system telemetry and runtime metrics...
      </div>
    );
  }

  const heapPercentage =
    metrics.heapMaxBytes > 0
      ? Math.round((metrics.heapUsedBytes / metrics.heapMaxBytes) * 100)
      : 0;

  const heapColor =
    heapPercentage > 85
      ? "bg-rose-500"
      : heapPercentage > 65
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <div className="space-y-6">
      {/* Top Telemetry KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Memory Heap */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">JVM Heap Memory</span>
              <HardDrive className="w-4 h-4 text-emerald-400" />
            </div>
            <CardTitle className="text-2xl font-bold font-mono text-zinc-100">
              {metrics.heapUsedMb} <span className="text-xs font-normal text-zinc-400">MB</span>
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Max alloc: {metrics.heapMaxMb} MB ({heapPercentage}%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${heapColor}`}
                style={{ width: `${Math.min(heapPercentage, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Uptime */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">System Uptime</span>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <CardTitle className="text-2xl font-bold font-mono text-zinc-100 truncate">
              {metrics.uptimeFormatted}
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Active threads: {metrics.threadCount}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Processors: {metrics.availableProcessors} vCPU</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Topics */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">Curriculum Content</span>
              <Layers className="w-4 h-4 text-purple-400" />
            </div>
            <CardTitle className="text-2xl font-bold font-mono text-zinc-100">
              {metrics.totalTopics} <span className="text-xs font-normal text-zinc-400">Topics</span>
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              {metrics.totalQuestions} Practice Questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="neutral" size="sm">
              All Units Active
            </Badge>
          </CardContent>
        </Card>

        {/* Registered Users */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">User Directory</span>
              <Users className="w-4 h-4 text-amber-400" />
            </div>
            <CardTitle className="text-2xl font-bold font-mono text-zinc-100">
              {metrics.totalUsers} <span className="text-xs font-normal text-zinc-400">Accounts</span>
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              {metrics.studentsCount} Students · {metrics.instructorsCount} Instructors · {metrics.adminsCount} Admins
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="success" size="sm">
                {metrics.adminsCount} Super Admin
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engine & Telemetry Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OpenJDK Process Engine */}
        <Card className="border-zinc-800 bg-zinc-900/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-400" />
                <CardTitle className="text-base text-zinc-100">Execution Sandbox Engine</CardTitle>
              </div>
              <Badge variant="success" size="sm" dot>
                {metrics.compilationEngineStatus}
              </Badge>
            </div>
            <CardDescription className="text-xs text-zinc-400">
              JDK subprocess security sandbox & execution isolation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between py-2 border-b border-zinc-800 text-zinc-300">
                <span className="text-zinc-500">Engine Type:</span>
                <span className="text-indigo-300">{metrics.compilationEngineName}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-zinc-800 text-zinc-300">
                <span className="text-zinc-500">Target JDK:</span>
                <span>OpenJDK 25 (Preview Enabled)</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-zinc-800 text-zinc-300">
                <span className="text-zinc-500">Process Timeouts:</span>
                <span>5,000 ms Max Execution</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-zinc-800 text-zinc-300">
                <span className="text-zinc-500">Memory Per Subprocess:</span>
                <span>256 MB Xmx Sandbox</span>
              </div>
              <div className="flex items-center justify-between py-2 text-zinc-300">
                <span className="text-zinc-500">Security Policy:</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> File/Network Access Restricted
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Practice Assessment Telemetry */}
        <Card className="border-zinc-800 bg-zinc-900/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <CardTitle className="text-base text-zinc-100">Practice Submission Telemetry</CardTitle>
              </div>
              <Badge variant="neutral" size="sm">
                Session Counters
              </Badge>
            </div>
            <CardDescription className="text-xs text-zinc-400">
              Evaluation metrics across code executions and question submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 bg-zinc-950/60 rounded-lg border border-zinc-800/80 text-center">
                <div className="text-xs text-zinc-500 mb-1">Total Attempts</div>
                <div className="text-xl font-bold font-mono text-zinc-100">{metrics.guestAttempts}</div>
              </div>
              <div className="p-3 bg-zinc-950/60 rounded-lg border border-zinc-800/80 text-center">
                <div className="text-xs text-emerald-500 mb-1 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Correct
                </div>
                <div className="text-xl font-bold font-mono text-emerald-400">{metrics.guestCorrect}</div>
              </div>
              <div className="p-3 bg-zinc-950/60 rounded-lg border border-zinc-800/80 text-center">
                <div className="text-xs text-rose-500 mb-1 flex items-center justify-center gap-1">
                  <XCircle className="w-3 h-3" /> Incorrect
                </div>
                <div className="text-xl font-bold font-mono text-rose-400">{metrics.guestIncorrect}</div>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono text-zinc-400">
              <div className="flex justify-between py-1.5 border-b border-zinc-800">
                <span>Success Rate:</span>
                <span className="text-zinc-200">
                  {metrics.guestAttempts > 0
                    ? `${Math.round((metrics.guestCorrect / metrics.guestAttempts) * 100)}%`
                    : "N/A (No submissions yet)"}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-800">
                <span>Active JVM Threads:</span>
                <span className="text-zinc-200">{metrics.threadCount} threads</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span>Backend Architecture:</span>
                <span className="text-zinc-200">Spring Boot 4.1.1 + Next.js 16</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Production Cache & Performance Acceleration */}
      <Card className="border-zinc-800 bg-zinc-900/40">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <CardTitle className="text-base text-zinc-100">Production Caching & Acceleration</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="neutral" size="sm">
                ETag ShallowFilter Active
              </Badge>
              <Badge variant="success" size="sm" dot>
                Gzip Compressed
              </Badge>
            </div>
          </div>
          <CardDescription className="text-xs text-zinc-400">
            Multi-tiered caching: SHA-256 compilation results, execution traces, and curriculum endpoints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-zinc-950/60 rounded-lg border border-zinc-800/80">
              <div className="text-xs text-zinc-500 mb-1">Cache Hit Ratio</div>
              <div className="text-xl font-bold font-mono text-amber-400">
                {metrics.cacheHitRatio !== undefined ? `${metrics.cacheHitRatio}%` : "0%"}
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">
                Hits / (Hits + Misses)
              </div>
            </div>

            <div className="p-3 bg-zinc-950/60 rounded-lg border border-zinc-800/80">
              <div className="text-xs text-emerald-500 mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Cache Hits
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400">
                {metrics.cacheHits ?? 0}
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">
                Zero-latency responses
              </div>
            </div>

            <div className="p-3 bg-zinc-950/60 rounded-lg border border-zinc-800/80">
              <div className="text-xs text-zinc-400 mb-1 flex items-center gap-1">
                <Database className="w-3 h-3" /> Cache Misses
              </div>
              <div className="text-xl font-bold font-mono text-zinc-300">
                {metrics.cacheMisses ?? 0}
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">
                Database / process executions
              </div>
            </div>

            <div className="p-3 bg-zinc-950/60 rounded-lg border border-zinc-800/80">
              <div className="text-xs text-indigo-400 mb-1">Cached Entries</div>
              <div className="text-xl font-bold font-mono text-indigo-300">
                {metrics.totalCacheEntries ?? 0}
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">
                Live in JVM memory
              </div>
            </div>
          </div>

          <div className="space-y-2 font-mono text-xs text-zinc-400 border-t border-zinc-800/80 pt-4">
            <div className="text-xs font-semibold text-zinc-300 mb-2">Active Cache Partitions:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              <div className="flex justify-between p-2 rounded bg-zinc-950/40 border border-zinc-800/60">
                <span className="text-zinc-500">topics:</span>
                <span className="text-zinc-200">{metrics.cacheEntryCounts?.["topics"] ?? 0} items</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-zinc-950/40 border border-zinc-800/60">
                <span className="text-zinc-500">topic-summaries:</span>
                <span className="text-zinc-200">{metrics.cacheEntryCounts?.["topic-summaries"] ?? 0} items</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-zinc-950/40 border border-zinc-800/60">
                <span className="text-zinc-500">practice-questions:</span>
                <span className="text-zinc-200">{metrics.cacheEntryCounts?.["practice-questions"] ?? 0} items</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-zinc-950/40 border border-zinc-800/60">
                <span className="text-zinc-500">compilation-results:</span>
                <span className="text-zinc-200">{metrics.cacheEntryCounts?.["compilation-results"] ?? 0} items</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-zinc-950/40 border border-zinc-800/60">
                <span className="text-zinc-500">trace-results:</span>
                <span className="text-zinc-200">{metrics.cacheEntryCounts?.["trace-results"] ?? 0} items</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-zinc-950/40 border border-zinc-800/60">
                <span className="text-zinc-500">process throttle:</span>
                <span className="text-emerald-400">8 permits (safe)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
