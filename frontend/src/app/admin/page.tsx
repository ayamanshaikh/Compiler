"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/context/AuthContext";
import { AdminMetricsResponse, fetchAdminMetrics } from "@/lib/api/admin";
import { TelemetryDashboard } from "@/components/admin/TelemetryDashboard";
import { TopicCms } from "@/components/admin/TopicCms";
import { PracticeCms } from "@/components/admin/PracticeCms";
import { AuditLogViewer } from "@/components/admin/AuditLogViewer";
import { UserDirectory } from "@/components/admin/UserDirectory";
import {
  Activity,
  Layers,
  Code2,
  FileText,
  Users,
  RefreshCw,
  ShieldAlert,
  LogIn,
  Lock,
} from "lucide-react";

type AdminTab = "telemetry" | "curriculum" | "practice" | "audit" | "users";

export default function AdminPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading, openAuthModal, login, register } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("telemetry");
  const [metrics, setMetrics] = useState<AdminMetricsResponse | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [devActionLoading, setDevActionLoading] = useState(false);

  const isAdminOrInstructor =
    user?.role === "ROLE_ADMIN" || user?.role === "ROLE_INSTRUCTOR";

  const loadMetrics = useCallback(async () => {
    if (!isAdminOrInstructor) return;
    setIsLoadingMetrics(true);
    setErrorMsg(null);
    try {
      const data = await fetchAdminMetrics();
      setMetrics(data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load metrics");
    } finally {
      setIsLoadingMetrics(false);
    }
  }, [isAdminOrInstructor]);

  useEffect(() => {
    let isMounted = true;
    if (isAdminOrInstructor) {
      fetchAdminMetrics()
        .then((data) => {
          if (isMounted) {
            setMetrics(data);
            setIsLoadingMetrics(false);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setErrorMsg(err instanceof Error ? err.message : "Failed to load metrics");
            setIsLoadingMetrics(false);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isAdminOrInstructor]);

  // Dev shortcut to quickly authenticate as admin for local verification
  const handleQuickDevAdminLogin = async () => {
    setDevActionLoading(true);
    setErrorMsg(null);
    try {
      // Attempt login first
      await login("admin_super", "AdminPass123!");
    } catch {
      try {
        // If account doesn't exist, register it
        await register("admin_super", "admin@codevista.ai", "AdminPass123!");
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Quick admin login failed");
      }
    } finally {
      setDevActionLoading(false);
    }
  };

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Admin Content Management & Telemetry"
          description="Live JVM system health, curriculum curriculum topics CMS, practice question editor, and user directory."
          badge={
            <Badge
              variant={user?.role === "ROLE_ADMIN" ? "danger" : user?.role === "ROLE_INSTRUCTOR" ? "warning" : "neutral"}
              size="sm"
            >
              {user?.role ? user.role.replace("ROLE_", "") : "Protected CMS"}
            </Badge>
          }
          actions={
            isAdminOrInstructor ? (
              <Button
                variant="outline"
                size="sm"
                onClick={loadMetrics}
                isLoading={isLoadingMetrics}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Refresh Telemetry
              </Button>
            ) : null
          }
        />

        {/* 1. Unauthenticated or Non-Privileged Access Check */}
        {isAuthLoading ? (
          <div className="p-12 text-center text-zinc-500 font-mono text-sm">
            Verifying administrative authorization...
          </div>
        ) : !isAuthenticated ? (
          <Card className="border-zinc-800 bg-zinc-900/50 max-w-xl mx-auto my-8">
            <CardHeader className="text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2">
                <Lock className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg">Administrative Authentication Required</CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                The CodeVista CMS and Telemetry dashboard is restricted to instructors and system administrators.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="primary"
                size="md"
                onClick={() => openAuthModal("login")}
                className="w-full justify-center"
                leftIcon={<LogIn className="w-4 h-4" />}
              >
                Sign In to CodeVista
              </Button>

              <div className="p-3 bg-zinc-950/70 border border-zinc-850 rounded-lg text-xs space-y-2">
                <div className="font-semibold text-zinc-300">Local Development Environment:</div>
                <p className="text-zinc-500 text-[11px]">
                  Use the quick dev shortcut to automatically sign in or create a local administrator session:
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleQuickDevAdminLogin}
                  isLoading={devActionLoading}
                  className="w-full justify-center text-xs"
                >
                  Quick Sign-In as Admin (admin_super)
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : !isAdminOrInstructor ? (
          <Card className="border-rose-500/20 bg-rose-500/5 max-w-xl mx-auto my-8">
            <CardHeader className="text-center">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-2">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg text-rose-300">403 Forbidden: Student Privileges</CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Your account (<span className="text-zinc-200 font-mono">@{user?.username}</span>) is assigned the role{" "}
                <Badge variant="neutral" size="sm">
                  {user?.role}
                </Badge>
                . Administrative management requires <span className="text-amber-300">ROLE_INSTRUCTOR</span> or{" "}
                <span className="text-rose-300">ROLE_ADMIN</span>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-zinc-400 text-center">
                Please sign in with an instructor or admin account, or have an existing administrator elevate your role.
              </p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" size="sm" onClick={() => openAuthModal("login")}>
                  Switch Account
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* 2. Full Admin CMS Panel */
          <div className="space-y-6">
            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg flex items-center justify-between">
                <span>{errorMsg}</span>
                <Button variant="ghost" size="sm" onClick={() => setErrorMsg(null)} className="h-6 text-xs">
                  Dismiss
                </Button>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-zinc-950/70 rounded-xl border border-zinc-800/80 overflow-x-auto w-full sm:w-fit">
              <button
                type="button"
                onClick={() => setActiveTab("telemetry")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === "telemetry"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>System Telemetry</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("curriculum")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === "curriculum"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Curriculum CMS</span>
                {metrics && (
                  <span className="px-1.5 py-0.2 bg-zinc-800 text-[10px] rounded-full text-zinc-300 font-mono">
                    {metrics.totalTopics}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("practice")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === "practice"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                }`}
              >
                <Code2 className="w-4 h-4" />
                <span>Practice Arena CMS</span>
                {metrics && (
                  <span className="px-1.5 py-0.2 bg-zinc-800 text-[10px] rounded-full text-zinc-300 font-mono">
                    {metrics.totalQuestions}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("audit")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === "audit"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Audit Logs</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("users")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === "users"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>User Directory</span>
                {metrics && (
                  <span className="px-1.5 py-0.2 bg-zinc-800 text-[10px] rounded-full text-zinc-300 font-mono">
                    {metrics.totalUsers}
                  </span>
                )}
              </button>
            </div>

            {/* Active Tab View */}
            {activeTab === "telemetry" && (
              <TelemetryDashboard metrics={metrics} isLoading={isLoadingMetrics} />
            )}

            {activeTab === "curriculum" && <TopicCms />}

            {activeTab === "practice" && <PracticeCms />}

            {activeTab === "audit" && <AuditLogViewer />}

            {activeTab === "users" && <UserDirectory />}
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
