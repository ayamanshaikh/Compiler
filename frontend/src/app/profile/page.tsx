"use client";

import React, { useState, useEffect } from "react";
import NextLink from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/lib/context/AuthContext";
import {
  SavedSnippet,
  fetchSavedSnippets,
  saveSnippet,
  deleteSnippet,
} from "@/lib/api/auth";
import {
  User,
  Award,
  CheckCircle2,
  Bookmark,
  Code2,
  Flame,
  Calendar,
  Sparkles,
  LogIn,
  ExternalLink,
  Trash2,
  Copy,
  Check,
  Plus,
  BookOpen,
  Eye,
  Sliders,
} from "lucide-react";

export default function ProfilePage() {
  const {
    user,
    isAuthenticated,
    isGuest,
    progress,
    openAuthModal,
    markTopicCompleted,
    toggleAlgorithmBookmark,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<"topics" | "algorithms" | "snippets" | "practice">("topics");
  const [snippets, setSnippets] = useState<SavedSnippet[]>([]);
  const [copiedSnippetId, setCopiedSnippetId] = useState<number | null>(null);

  // New snippet form
  const [isAddingSnippet, setIsAddingSnippet] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isSavingSnippet, setIsSavingSnippet] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (isAuthenticated) {
      fetchSavedSnippets()
        .then((data) => {
          if (isMounted) setSnippets(data);
        })
        .catch(() => {
          if (isMounted) setSnippets([]);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const handleCopyCode = (id: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  const handleSaveSnippet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCode.trim()) return;

    setIsSavingSnippet(true);
    try {
      if (isAuthenticated) {
        const created = await saveSnippet(newTitle.trim(), newCode, newDescription.trim());
        setSnippets((prev) => [created, ...prev]);
      } else {
        const fakeSnippet: SavedSnippet = {
          id: Date.now(),
          title: newTitle.trim(),
          code: newCode,
          description: newDescription.trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setSnippets((prev) => [fakeSnippet, ...prev]);
      }
      setNewTitle("");
      setNewCode("");
      setNewDescription("");
      setIsAddingSnippet(false);
    } catch {
      // ignore
    } finally {
      setIsSavingSnippet(false);
    }
  };

  const handleDeleteSnippet = async (id: number) => {
    if (isAuthenticated) {
      try {
        await deleteSnippet(id);
        setSnippets((prev) => prev.filter((s) => s.id !== id));
      } catch {
        // ignore
      }
    } else {
      setSnippets((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const totalTopicsCount = 78;
  const topicsPercent = Math.min(100, Math.round((progress.completedTopicsCount / totalTopicsCount) * 100));

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Developer Profile"
          description="Your learning trajectory, practice problem completions, and personalized code snippets."
          badge={
            isAuthenticated ? (
              <Badge variant="success" size="sm" dot>
                Cloud Synced
              </Badge>
            ) : (
              <Badge variant="warning" size="sm" dot>
                Guest Session (Local)
              </Badge>
            )
          }
        />

        {/* Guest Banner */}
        {isGuest && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-zinc-900 to-zinc-900 border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-100">Exploring as a Guest</h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Your topic progress, practice answers, and preferences are saved locally in this browser.
                  Create a free account to permanently sync your progress across devices.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => openAuthModal("register")}
              className="shrink-0 gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Create Account / Sign In</span>
            </Button>
          </div>
        )}

        {/* Top Grid: Bio Card & 3 Stats Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          {/* User Bio Card */}
          <Card className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 border border-blue-400/30 flex items-center justify-center text-white font-bold text-xl shadow-md">
                  {isAuthenticated ? (
                    user?.username.charAt(0).toUpperCase()
                  ) : (
                    <User className="w-6 h-6 text-zinc-300" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-zinc-100 truncate">
                    {isAuthenticated ? user?.username : "Guest Developer"}
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono truncate">
                    {isAuthenticated ? user?.email : "local.session@codevista.ai"}
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/80 text-xs text-zinc-400">
                <div className="flex items-center justify-between">
                  <span>Role / Tier:</span>
                  <span className="font-medium text-zinc-200">
                    {isAuthenticated ? (
                      <Badge variant="default" size="sm">
                        {user?.role.replace("ROLE_", "")}
                      </Badge>
                    ) : (
                      <Badge variant="neutral" size="sm">
                        GUEST
                      </Badge>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    Joined:
                  </span>
                  <span className="font-mono text-zinc-300 text-[11px]">
                    {isAuthenticated && user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "Today (Browser)"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    Active Streak:
                  </span>
                  <span className="font-bold text-amber-400 font-mono">
                    {progress.currentStreakDays} {progress.currentStreakDays === 1 ? "day" : "days"}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-zinc-800/80 flex items-center justify-between">
              <NextLink
                href="/settings"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Adjust Preferences</span>
              </NextLink>
            </div>
          </Card>

          {/* Metric 1: Curriculum Progress */}
          <Card className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-medium">Curriculum Mastery</span>
                <Award className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-zinc-100 font-mono">
                {progress.completedTopicsCount} / {totalTopicsCount}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Core Java, OOP & Concurrency</p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800/80">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1.5 font-mono">
                <span>Progress</span>
                <span className="text-blue-400 font-semibold">{topicsPercent}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${topicsPercent}%` }}
                />
              </div>
            </div>
          </Card>

          {/* Metric 2: Practice Solves */}
          <Card className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-medium">Practice Solves</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-zinc-100 font-mono">
                {progress.solvedQuestionsCount}
              </div>
              <p className="text-xs text-zinc-500 mt-1">8 Archetype Challenges Passed</p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
              <span className="text-zinc-500">Evaluation:</span>
              <span className="text-emerald-400 font-mono font-medium">100% JVM Verified</span>
            </div>
          </Card>

          {/* Metric 3: Algorithms & Snippets */}
          <Card className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-medium">Bookmarks & Snippets</span>
                <Bookmark className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-zinc-100 font-mono">
                {progress.bookmarkedAlgorithmsCount} / {snippets.length}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Saved Algorithms / Code Snippets</p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
              <span className="text-zinc-500">Quick Tools:</span>
              <NextLink
                href="/workspace"
                className="text-xs text-purple-400 hover:text-purple-300 font-medium"
              >
                Open Workspace &rarr;
              </NextLink>
            </div>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-zinc-800 mb-6 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("topics")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === "topics"
                ? "border-blue-500 text-blue-400 font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Completed Topics ({progress.completedTopicsCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("algorithms")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === "algorithms"
                ? "border-blue-500 text-blue-400 font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Bookmarked Algorithms ({progress.bookmarkedAlgorithmsCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("snippets")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === "snippets"
                ? "border-blue-500 text-blue-400 font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Saved Snippets ({snippets.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("practice")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === "practice"
                ? "border-blue-500 text-blue-400 font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Practice Challenges ({progress.solvedQuestionsCount})</span>
          </button>
        </div>

        {/* Tab 1: Topics */}
        {activeTab === "topics" && (
          <div>
            {progress.completedTopics.length === 0 ? (
              <Card className="text-center py-12">
                <BookOpen className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-zinc-300">No Topics Completed Yet</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-5">
                  Begin your Java journey across 78 carefully structured topics with interactive compilation and line-by-line tracing.
                </p>
                <NextLink href="/learn">
                  <Button variant="primary" size="sm">
                    Explore Curriculum
                  </Button>
                </NextLink>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {progress.completedTopics.map((slug) => (
                  <Card key={slug} className="p-4 flex items-center justify-between hover:border-zinc-700 transition-colors">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-xs font-semibold text-zinc-200 truncate capitalize">
                          {slug.replace(/-/g, " ")}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 font-mono">/learn/{slug}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <NextLink href={`/learn/${slug}`}>
                        <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </NextLink>
                      <button
                        type="button"
                        onClick={() => markTopicCompleted(slug, false)}
                        title="Mark incomplete"
                        className="text-zinc-600 hover:text-zinc-400 p-1 rounded-md text-xs transition-colors cursor-pointer"
                      >
                        &times;
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Algorithms */}
        {activeTab === "algorithms" && (
          <div>
            {progress.bookmarkedAlgorithms.length === 0 ? (
              <Card className="text-center py-12">
                <Eye className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-zinc-300">No Algorithms Bookmarked</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-5">
                  Save your favorite visual sorting, searching, or two-pointer algorithms for rapid stepping and comparison.
                </p>
                <NextLink href="/visualize">
                  <Button variant="primary" size="sm">
                    Browse Visualizer
                  </Button>
                </NextLink>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {progress.bookmarkedAlgorithms.map((slug) => (
                  <Card key={slug} className="p-4 flex items-center justify-between hover:border-zinc-700 transition-colors">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Bookmark className="w-4 h-4 text-purple-400 shrink-0" />
                        <span className="text-xs font-semibold text-zinc-200 capitalize truncate">
                          {slug.replace(/-/g, " ")}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 font-mono">Step Visualizer</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <NextLink href={`/visualize?algo=${slug}`}>
                        <Button variant="secondary" size="sm" className="text-xs h-7 px-2.5 gap-1">
                          <span>Launch</span>
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </NextLink>
                      <button
                        type="button"
                        onClick={() => toggleAlgorithmBookmark(slug)}
                        title="Remove bookmark"
                        className="text-zinc-600 hover:text-zinc-400 p-1 rounded-md text-xs transition-colors cursor-pointer"
                      >
                        &times;
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Saved Snippets */}
        {activeTab === "snippets" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-zinc-400">
                Personalized Java templates and solutions saved to your account.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddingSnippet(!isAddingSnippet)}
                className="gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingSnippet ? "Cancel" : "New Snippet"}</span>
              </Button>
            </div>

            {/* New snippet form */}
            {isAddingSnippet && (
              <Card className="mb-6 border-blue-500/30 bg-blue-950/10">
                <form onSubmit={handleSaveSnippet} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Title</label>
                    <Input
                      type="text"
                      placeholder="e.g. QuickSort Partition Invariant"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Description (Optional)</label>
                    <Input
                      type="text"
                      placeholder="Notes on usage or edge cases..."
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Java Code</label>
                    <textarea
                      rows={6}
                      className="w-full font-mono text-xs p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-hidden focus:border-blue-500 transition-colors"
                      placeholder="public class Solution { ... }"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAddingSnippet(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={isSavingSnippet}
                    >
                      {isSavingSnippet ? "Saving..." : "Save Snippet"}
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {snippets.length === 0 && !isAddingSnippet ? (
              <Card className="text-center py-12">
                <Code2 className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-zinc-300">No Snippets Saved Yet</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-5">
                  Save reusable Java templates, utility methods, or competitive programming boilerplate.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsAddingSnippet(true)}
                  className="gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Snippet</span>
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {snippets.map((snip) => (
                  <Card key={snip.id} className="p-4">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-200">{snip.title}</h4>
                        {snip.description && (
                          <p className="text-xs text-zinc-400 mt-0.5">{snip.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyCode(snip.id, snip.code)}
                          className="h-7 px-2 text-xs gap-1"
                        >
                          {copiedSnippetId === snip.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-zinc-400" />
                              <span>Copy</span>
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSnippet(snip.id)}
                          className="h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <pre className="p-3 rounded-lg bg-zinc-950 border border-zinc-850 font-mono text-xs text-zinc-300 overflow-x-auto max-h-48 leading-relaxed">
                      <code>{snip.code}</code>
                    </pre>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Practice Solves */}
        {activeTab === "practice" && (
          <div>
            {progress.solvedQuestions.length === 0 ? (
              <Card className="text-center py-12">
                <CheckCircle2 className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-zinc-300">No Challenges Solved Yet</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-5">
                  Test your comprehension across output predictions, bug spotters, and live Java coding challenges.
                </p>
                <NextLink href="/practice">
                  <Button variant="primary" size="sm">
                    Enter Practice Arena
                  </Button>
                </NextLink>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {progress.solvedQuestions.map((qId) => (
                  <Card key={qId} className="p-4 flex items-center justify-between hover:border-zinc-700 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-xs font-semibold text-zinc-200 font-mono">{qId}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500">Solved & Verified</p>
                    </div>
                    <NextLink href="/practice">
                      <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </NextLink>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
