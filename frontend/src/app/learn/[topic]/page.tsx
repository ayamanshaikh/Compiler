"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import NextLink from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TraceVisualizer } from "@/components/visualizer/TraceVisualizer";
import { fetchTopicBySlug } from "@/lib/api/topics";
import { executionApi } from "@/lib/api/execution";
import { traceApi } from "@/lib/api/trace";
import {
  TopicDetail,
  TopicSummary,
  TopicDifficulty,
  ExecuteResponsePayload,
  TraceResponsePayload,
} from "@/lib/api/types";
import { SYLLABUS_TOPICS } from "@/lib/data/syllabusTopics";
import { useAuth } from "@/lib/context/AuthContext";
import {
  ArrowLeft,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Code2,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Play,
  Sparkles,
  RotateCcw,
  Lightbulb,
  Milestone,
  Layers,
  HelpCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

// Historical timeline for theoretical topics like History of Java
const JAVA_HISTORY_TIMELINE = [
  { year: "1991", title: "The Green Project", desc: "James Gosling, Mike Sheridan, and Patrick Naughton initiate the Oak project at Sun Microsystems for consumer devices." },
  { year: "1995", title: "Java 1.0 & WORA", desc: "Renamed Java and announced at SunWorld with the revolutionary 'Write Once, Run Anywhere' (WORA) bytecode architecture." },
  { year: "1998", title: "Java 2 (J2SE 1.2)", desc: "Introduces the Java Collections Framework, Swing GUI, and the HotSpot JIT compiler." },
  { year: "2004", title: "Java 5 (Tiger)", desc: "Major language leap: Generics, Enums, Annotations, Autoboxing, and Enhanced for-each loops." },
  { year: "2014", title: "Java 8 (LTS)", desc: "Revolutionary functional release: Lambda expressions, Stream API, java.time, and Interface Default Methods." },
  { year: "2021", title: "Java 17 (LTS)", desc: "Modern Java milestone: Sealed classes, Records, Pattern matching, and modern Garbage Collectors (ZGC)." },
  { year: "Present", title: "Modern Java & LTS Cadence", desc: "Virtual Threads (Project Loom), foreign memory interop (Panama), and 6-month release agility with modern LTS versions." },
];

export default function TopicDetailPage() {
  const params = useParams();
  const slug = typeof params?.topic === "string" ? params.topic : "";
  const { progress, markTopicCompleted } = useAuth();

  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Interactive Code State
  const [editableCode, setEditableCode] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [isTracing, setIsTracing] = useState(false);
  const [execResult, setExecResult] = useState<ExecuteResponsePayload | null>(null);
  const [traceResult, setTraceResult] = useState<TraceResponsePayload | null>(null);
  const [activeTab, setActiveTab] = useState<"code" | "visualizer">("code");

  useEffect(() => {
    if (!slug) return;

    let isMounted = true;

    fetchTopicBySlug(slug)
      .then((data) => {
        if (!isMounted) return;
        setTopic(data);
        setExecResult(null);
        setTraceResult(null);
        setActiveTab("code");
        setErrorMsg(null);
        const initialCode =
          data.codeExamples && data.codeExamples.length > 0
            ? data.codeExamples[0].code
            : `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Exploring ${data.title} in CodeVista AI");\n    }\n}`;
        setEditableCode(initialCode);
      })
      .catch(() => {
        // Fallback to static syllabus dataset if backend is loading/offline
        const fallback = SYLLABUS_TOPICS.find((t) => t.slug === slug);
        if (fallback) {
          const detail: TopicDetail = {
            id: fallback.id,
            title: fallback.title,
            slug: fallback.slug,
            description: fallback.description,
            explanation: `Comprehensive educational overview of ${fallback.title} in Java. Understanding ${fallback.title.toLowerCase()} is essential for building structured, efficient, and robust software systems on the Java Platform.`,
            whyItMatters: fallback.whyItMatters || `Mastering ${fallback.title.toLowerCase()} enables writing clean, idiomatic Java with strong type safety and predictable runtime performance.`,
            syntax: `// Java syntax reference for ${fallback.title}\npublic class ${fallback.title.replace(/[\s\W]+/g, "")}Demo {\n    public static void main(String[] args) {\n        // Demonstration of ${fallback.title}\n    }\n}`,
            difficulty: fallback.difficulty,
            internalUnit: fallback.internalUnit,
            sortOrder: fallback.sortOrder,
            keyPoints: fallback.keyPoints,
            commonMistakes: [
              `Overlooking edge cases and bounds validation when working with ${fallback.title.toLowerCase()}`,
              `Neglecting proper resource management and exception propagation`,
            ],
            relatedTopicSlugs: SYLLABUS_TOPICS.filter(
              (t) => t.id !== fallback.id && Math.abs(t.id - fallback.id) <= 2
            ).map((t) => t.slug),
            codeExamples: [
              {
                title: `${fallback.title} Core Usage Example`,
                code: `public class Main {\n    public static void main(String[] args) {\n        // Demonstration of ${fallback.title}\n        System.out.println("${fallback.title} in CodeVista AI");\n    }\n}`,
                explanation: `Canonical code structure demonstrating proper idioms and execution lifecycle for ${fallback.title}.`,
              },
            ],
            practiceQuestionCount: fallback.practiceQuestionCount,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          if (isMounted) {
            setTopic(detail);
            setEditableCode(detail.codeExamples[0].code);
          }
        } else {
          if (isMounted) setErrorMsg(`Topic "${slug}" was not found in curriculum.`);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Real Execution Engine Call
  const handleRunCode = async () => {
    if (!editableCode.trim()) return;
    setIsExecuting(true);
    setExecResult(null);
    try {
      const response = await executionApi.execute({
        language: "java",
        sourceCode: editableCode,
      });
      setExecResult(response);
    } catch (err: unknown) {
      setExecResult({
        success: false,
        status: "RUNTIME_ERROR",
        output: "",
        runtimeError: err instanceof Error ? err.message : "Execution request failed",
        executionTimeMs: 0,
        exitCode: 1,
        diagnostics: [],
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Real Trace Engine Call
  const handleTraceCode = async () => {
    if (!editableCode.trim()) return;
    setIsTracing(true);
    try {
      const response = await traceApi.trace({
        language: "java",
        sourceCode: editableCode,
      });
      setTraceResult(response);
      setActiveTab("visualizer");
    } catch (err: unknown) {
      alert("Trace error: " + (err instanceof Error ? err.message : "Failed to trace"));
    } finally {
      setIsTracing(false);
    }
  };

  const handleResetCode = () => {
    if (topic && topic.codeExamples && topic.codeExamples.length > 0) {
      setEditableCode(topic.codeExamples[0].code);
    }
    setExecResult(null);
    setTraceResult(null);
    setActiveTab("code");
  };

  if (isLoading) {
    return (
      <AppShell>
        <PageContainer>
          <div className="min-h-[50vh] flex items-center justify-center">
            <LoadingState message="Loading Java Topic Specification..." />
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  if (errorMsg || !topic) {
    return (
      <AppShell>
        <PageContainer>
          <div className="py-12">
            <ErrorState
              title="Topic Not Found"
              message={errorMsg || `Could not find learning module for slug "${slug}".`}
              onRetry={() => window.location.reload()}
            />
            <div className="mt-6 text-center">
              <NextLink href="/learn">
                <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                  Return to Topic Explorer
                </Button>
              </NextLink>
            </div>
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  const difficultyVariant = (difficulty: TopicDifficulty) => {
    switch (difficulty) {
      case "BEGINNER":
        return "success";
      case "INTERMEDIATE":
        return "default";
      case "ADVANCED":
        return "warning";
      default:
        return "neutral";
    }
  };

  const currentIdx = SYLLABUS_TOPICS.findIndex((t) => t.slug === topic.slug);
  const prevTopic: TopicSummary | undefined = currentIdx > 0 ? SYLLABUS_TOPICS[currentIdx - 1] : undefined;
  const nextTopic: TopicSummary | undefined =
    currentIdx >= 0 && currentIdx < SYLLABUS_TOPICS.length - 1
      ? SYLLABUS_TOPICS[currentIdx + 1]
      : undefined;

  const isHistoryTopic = topic.slug === "history-of-java";

  return (
    <AppShell>
      <PageContainer>
        {/* Header with Breadcrumb and Actions */}
        <PageHeader
          breadcrumbs={
            <NextLink
              href="/learn"
              className="hover:text-zinc-200 inline-flex items-center gap-1.5 transition-colors text-zinc-400 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All 78 Topics</span>
            </NextLink>
          }
          title={topic.title}
          description={topic.description}
          badge={
            <div className="flex items-center gap-2">
              <Badge variant={difficultyVariant(topic.difficulty)} size="sm">
                {topic.difficulty.toLowerCase()}
              </Badge>
              {topic.internalUnit && (
                <span className="text-[11px] font-mono text-zinc-500">
                  {topic.internalUnit}
                </span>
              )}
            </div>
          }
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant={progress.completedTopics.includes(topic.slug) ? "primary" : "outline"}
                size="sm"
                onClick={() => markTopicCompleted(topic.slug, !progress.completedTopics.includes(topic.slug))}
                leftIcon={<CheckCircle2 className={`w-3.5 h-3.5 ${progress.completedTopics.includes(topic.slug) ? "text-emerald-300" : "text-zinc-400"}`} />}
              >
                {progress.completedTopics.includes(topic.slug) ? "Completed" : "Mark Complete"}
              </Button>
              <NextLink href={`/practice?topic=${topic.slug}`}>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<HelpCircle className="w-3.5 h-3.5 text-blue-400" />}
                >
                  Practice Topic
                </Button>
              </NextLink>
              <NextLink href="/workspace">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Terminal className="w-3.5 h-3.5" />}
                  rightIcon={<ExternalLink className="w-3 h-3 text-zinc-500" />}
                >
                  Full IDE
                </Button>
              </NextLink>
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* What is it? / Explanation */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <CardTitle className="text-base">What is {topic.title}?</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-zinc-300 leading-relaxed text-sm">
                <p>{topic.explanation || topic.description}</p>
              </CardContent>
            </Card>

            {/* Why It Matters */}
            {topic.whyItMatters && (
              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <CardTitle className="text-base text-zinc-200">Why It Matters in Software Engineering</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-zinc-300 leading-relaxed text-sm">
                  <p>{topic.whyItMatters}</p>
                </CardContent>
              </Card>
            )}

            {/* Historical Timeline for History of Java */}
            {isHistoryTopic && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Milestone className="w-4 h-4 text-emerald-400" />
                    <CardTitle className="text-base">Java Evolution Timeline</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
                    {JAVA_HISTORY_TIMELINE.map((item, idx) => (
                      <div key={idx} className="relative group">
                        <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-zinc-950" />
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono text-xs font-bold text-blue-400">{item.year}</span>
                          <span className="text-xs font-semibold text-zinc-200">{item.title}</span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Syntax Reference (if present) */}
            {topic.syntax && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-indigo-400" />
                    <CardTitle className="text-base">Syntax & Signature Specification</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono text-xs overflow-x-auto leading-relaxed">
                    <code>{topic.syntax}</code>
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Interactive Code Playground (Runs with real OpenJDK and Real Tracing) */}
            <Card className="border-zinc-800 bg-zinc-950/80">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <CardTitle className="text-base">Interactive Code Playground</CardTitle>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-md p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveTab("code")}
                      className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                        activeTab === "code"
                          ? "bg-zinc-800 text-white font-medium"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Editor & Run
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!traceResult) {
                          handleTraceCode();
                        } else {
                          setActiveTab("visualizer");
                        }
                      }}
                      className={`px-2.5 py-1 rounded transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                        activeTab === "visualizer"
                          ? "bg-zinc-800 text-white font-medium"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <Layers className="w-3 h-3 text-purple-400" />
                      <span>Trace Visualizer</span>
                    </button>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetCode}
                    title="Reset to default code"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                {activeTab === "code" ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                        <span>Main.java (Editable)</span>
                        <span>OpenJDK 25 Runtime</span>
                      </div>
                      <textarea
                        value={editableCode}
                        onChange={(e) => setEditableCode(e.target.value)}
                        className="w-full h-56 p-4 rounded-lg bg-black/80 border border-zinc-800 font-mono text-xs text-blue-200 focus:outline-none focus:border-blue-500 leading-relaxed resize-y"
                        spellCheck={false}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleRunCode}
                        isLoading={isExecuting}
                        leftIcon={<Play className="w-3.5 h-3.5" />}
                      >
                        Run Code
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleTraceCode}
                        isLoading={isTracing}
                        leftIcon={<Sparkles className="w-3.5 h-3.5 text-purple-400" />}
                      >
                        Visualize Execution
                      </Button>
                    </div>

                    {/* Live Execution Output Panel */}
                    {execResult && (
                      <div className="mt-4 p-4 rounded-lg bg-zinc-900 border border-zinc-800 space-y-3">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-zinc-300">Terminal Output:</span>
                            <Badge
                              variant={
                                execResult.status === "SUCCESS"
                                  ? "success"
                                  : execResult.status === "COMPILATION_ERROR"
                                  ? "danger"
                                  : "warning"
                              }
                              size="sm"
                            >
                              {execResult.status}
                            </Badge>
                          </div>
                          {execResult.executionTimeMs > 0 && (
                            <span className="text-zinc-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {execResult.executionTimeMs}ms
                            </span>
                          )}
                        </div>

                        {/* Standard Output */}
                        {execResult.output && (
                          <pre className="p-3 rounded bg-black/60 border border-zinc-800/80 font-mono text-xs text-emerald-300 whitespace-pre-wrap">
                            {execResult.output}
                          </pre>
                        )}

                        {/* Runtime Error */}
                        {execResult.runtimeError && (
                          <pre className="p-3 rounded bg-red-950/40 border border-red-500/30 font-mono text-xs text-red-300 whitespace-pre-wrap">
                            {execResult.runtimeError}
                          </pre>
                        )}

                        {/* Intelligent Error Explanation (Phase 6 Integration) */}
                        {execResult.diagnostics && execResult.diagnostics.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-zinc-800">
                            <span className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Compiler Diagnostics ({execResult.diagnostics.length})
                            </span>
                            {execResult.diagnostics.map((diag, dIdx) => (
                              <div
                                key={dIdx}
                                className="p-3 rounded bg-red-950/30 border border-red-500/30 text-xs space-y-1.5 font-sans"
                              >
                                <div className="flex items-center justify-between font-mono text-[11px] text-zinc-400">
                                  <span>Line {diag.line}, Column {diag.column}</span>
                                  <span className="text-red-400 font-semibold">{diag.diagnosticType}</span>
                                </div>
                                <p className="text-zinc-200 font-medium">{diag.message}</p>
                                {diag.explanation && (
                                  <div className="pt-1.5 mt-1.5 border-t border-red-500/20 text-zinc-300 space-y-1 text-xs">
                                    <p><strong className="text-amber-400">Explanation:</strong> {diag.explanation.simpleExplanation}</p>
                                    <p><strong className="text-blue-400">Why it happened:</strong> {diag.explanation.whyItHappened}</p>
                                    <p><strong className="text-emerald-400">How to fix:</strong> {diag.explanation.howToFix}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    {traceResult ? (
                      <TraceVisualizer trace={traceResult} sourceCode={editableCode} />
                    ) : (
                      <div className="p-8 text-center text-xs text-zinc-400">
                        <Layers className="w-8 h-8 text-purple-400 mx-auto mb-2 animate-pulse" />
                        <p>Executing runtime trace...</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Next / Prev Navigation */}
            <div className="pt-6 border-t border-zinc-850 flex items-center justify-between gap-4">
              {prevTopic ? (
                <NextLink
                  href={`/learn/${prevTopic.slug}`}
                  className="flex flex-col items-start gap-1 p-3 rounded-lg border border-zinc-850 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900 transition-all text-left"
                >
                  <span className="text-[10px] uppercase font-mono text-zinc-500">
                    &larr; Previous Topic
                  </span>
                  <span className="text-xs font-semibold text-zinc-200">
                    {prevTopic.title}
                  </span>
                </NextLink>
              ) : (
                <div />
              )}

              {nextTopic && (
                <NextLink
                  href={`/learn/${nextTopic.slug}`}
                  className="flex flex-col items-end gap-1 p-3 rounded-lg border border-zinc-850 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900 transition-all text-right"
                >
                  <span className="text-[10px] uppercase font-mono text-zinc-500">
                    Next Topic &rarr;
                  </span>
                  <span className="text-xs font-semibold text-zinc-200">
                    {nextTopic.title}
                  </span>
                </NextLink>
              )}
            </div>
          </div>

          {/* Sidebar Info Column (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Key Principles */}
            {topic.keyPoints && topic.keyPoints.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <CardTitle className="text-sm">Key Principles</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2.5 text-xs text-zinc-300">
                    {topic.keyPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Common Mistakes */}
            {topic.commonMistakes && topic.commonMistakes.length > 0 && (
              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <CardTitle className="text-sm text-amber-300">Common Pitfalls</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2.5 text-xs text-zinc-300">
                    {topic.commonMistakes.map((mistake, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{mistake}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Related Topics */}
            {topic.relatedTopicSlugs && topic.relatedTopicSlugs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Related Topics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {topic.relatedTopicSlugs.map((relSlug) => {
                      const rel = SYLLABUS_TOPICS.find((t) => t.slug === relSlug);
                      const title = rel ? rel.title : relSlug.replace(/-/g, " ");
                      return (
                        <NextLink
                          key={relSlug}
                          href={`/learn/${relSlug}`}
                          className="px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors inline-flex items-center gap-1"
                        >
                          <span>{title}</span>
                          <ArrowRight className="w-2.5 h-2.5 opacity-60" />
                        </NextLink>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Practice CTA Card */}
            <Card className="border-blue-500/30 bg-gradient-to-b from-blue-950/20 to-zinc-900">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-400" />
                  <CardTitle className="text-sm">Test Your Knowledge</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Practice questions for <strong>{topic.title}</strong>, including code prediction, error identification, and debugging exercises.
                </p>
                <NextLink href={`/practice?topic=${topic.slug}`} className="block">
                  <Button variant="primary" size="sm" className="w-full">
                    Start Practice ({topic.practiceQuestionCount || 3} Questions)
                  </Button>
                </NextLink>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
