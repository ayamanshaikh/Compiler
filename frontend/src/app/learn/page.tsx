"use client";

import React, { useState, useEffect, useMemo } from "react";
import NextLink from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { fetchTopics } from "@/lib/api/topics";
import { TopicSummary, TopicDifficulty } from "@/lib/api/types";
import { SYLLABUS_TOPICS } from "@/lib/data/syllabusTopics";
import {
  Search,
  ArrowRight,
  BookOpen,
  Code2,
  CheckCircle2,
  X,
  RotateCcw,
  ArrowDownAZ,
  ListOrdered,
  Lightbulb,
} from "lucide-react";

type TopicCategory =
  | "ALL"
  | "BASICS"
  | "OOP"
  | "EXCEPTIONS"
  | "CONCURRENCY"
  | "COLLECTIONS"
  | "IO"
  | "ENTERPRISE";

const CATEGORIES: { id: TopicCategory; label: string }[] = [
  { id: "ALL", label: "All Topics" },
  { id: "BASICS", label: "Basics & Syntax" },
  { id: "OOP", label: "Object-Oriented Programming" },
  { id: "EXCEPTIONS", label: "Exceptions & Recovery" },
  { id: "CONCURRENCY", label: "Multithreading" },
  { id: "COLLECTIONS", label: "Collections Framework" },
  { id: "IO", label: "Files & Streams" },
  { id: "ENTERPRISE", label: "Servlets & Hibernate" },
];

const ALPHABET_LETTERS = [
  "ALL",
  "A", "B", "C", "D", "E", "F", "H", "I", "L", "M", "O", "P", "R", "S", "T", "U", "V",
];

function getCategoryForTopic(topic: TopicSummary): TopicCategory {
  const unit = topic.internalUnit || "";
  if (unit.includes("Unit 1")) {
    if (["Class", "Object", "Methods", "Constructors", "Constructor Types"].includes(topic.title)) {
      return "OOP";
    }
    return "BASICS";
  }
  if (unit.includes("Unit 2")) return "OOP";
  if (unit.includes("Unit 3")) {
    if (topic.title.toLowerCase().includes("thread")) return "CONCURRENCY";
    return "EXCEPTIONS";
  }
  if (unit.includes("Unit 4")) {
    if (["Files", "Streams", "Byte Streams", "Character Streams", "Text I/O", "Binary I/O", "Random Access File Operations"].includes(topic.title)) {
      return "IO";
    }
    return "COLLECTIONS";
  }
  if (unit.includes("Unit 5")) return "ENTERPRISE";
  return "BASICS";
}

export default function LearnCatalogPage() {
  const [topics, setTopics] = useState<TopicSummary[]>(SYLLABUS_TOPICS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<TopicDifficulty | "ALL">("ALL");
  const [selectedCategory, setSelectedCategory] = useState<TopicCategory>("ALL");
  const [selectedLetter, setSelectedLetter] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<"curriculum" | "alphabetical">("curriculum");

  useEffect(() => {
    let isMounted = true;

    fetchTopics({ sortBy: sortOrder === "alphabetical" ? "title" : "order" })
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setTopics(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setTopics(SYLLABUS_TOPICS);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [sortOrder]);

  const filteredTopics = useMemo(() => {
    return topics
      .filter((topic) => {
        // Difficulty filter
        const matchesDifficulty =
          selectedDifficulty === "ALL" || topic.difficulty === selectedDifficulty;

        // Category filter
        const matchesCategory =
          selectedCategory === "ALL" || getCategoryForTopic(topic) === selectedCategory;

        // Letter filter (Alphabetical browsing)
        const matchesLetter =
          selectedLetter === "ALL" ||
          topic.title.toUpperCase().startsWith(selectedLetter);

        // Search query
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          topic.title.toLowerCase().includes(q) ||
          topic.description.toLowerCase().includes(q) ||
          topic.slug.toLowerCase().includes(q) ||
          (topic.whyItMatters && topic.whyItMatters.toLowerCase().includes(q)) ||
          topic.keyPoints?.some((kp) => kp.toLowerCase().includes(q));

        return matchesDifficulty && matchesCategory && matchesLetter && matchesSearch;
      })
      .sort((a, b) => {
        if (sortOrder === "alphabetical") {
          return a.title.localeCompare(b.title);
        }
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      });
  }, [topics, searchQuery, selectedDifficulty, selectedCategory, selectedLetter, sortOrder]);

  const difficultyCounts = useMemo(() => {
    return {
      ALL: topics.length,
      BEGINNER: topics.filter((t) => t.difficulty === "BEGINNER").length,
      INTERMEDIATE: topics.filter((t) => t.difficulty === "INTERMEDIATE").length,
      ADVANCED: topics.filter((t) => t.difficulty === "ADVANCED").length,
    };
  }, [topics]);

  const difficultyBadgeVariant = (difficulty: TopicDifficulty) => {
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

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedDifficulty !== "ALL" ||
    selectedCategory !== "ALL" ||
    selectedLetter !== "ALL";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedDifficulty("ALL");
    setSelectedCategory("ALL");
    setSelectedLetter("ALL");
    setSortOrder("curriculum");
  };

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Java Topic Explorer"
          description="Master Java through individual topics. Browse conceptual breakdowns, explore architectural significance, run live Java code, and step through runtime execution."
          badge={
            <div className="flex items-center gap-2">
              <Badge variant="default" size="sm" dot>
                {topics.length} Topics
              </Badge>
              <Badge variant="success" size="sm">
                Live Compiler & Tracing
              </Badge>
            </div>
          }
        />

        {/* Category Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 scrollbar-none border-b border-zinc-800/60">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-blue-600 text-white font-semibold shadow-xs"
                  : "bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search, Difficulty & Sort Controls Toolbar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-5">
          {/* Search Input */}
          <div className="relative w-full lg:w-96">
            <Input
              placeholder="Search 78 Java topics (e.g. ArrayList, Loops, super)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-zinc-500" />}
              rightIcon={
                searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="p-1 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : undefined
              }
            />
          </div>

          {/* Difficulty & Sort Buttons */}
          <div className="flex items-center gap-2 flex-wrap justify-between lg:justify-end">
            {/* Difficulty Toggle */}
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
              {(["ALL", "BEGINNER", "INTERMEDIATE", "ADVANCED"] as const).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    selectedDifficulty === diff
                      ? "bg-zinc-800 text-white shadow-xs font-semibold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {diff === "ALL" ? "All Levels" : diff.charAt(0) + diff.slice(1).toLowerCase()}
                  <span className="ml-1 opacity-60 text-[10px] font-mono">
                    ({difficultyCounts[diff]})
                  </span>
                </button>
              ))}
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setSortOrder("curriculum")}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  sortOrder === "curriculum"
                    ? "bg-zinc-800 text-white font-semibold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
                title="Syllabus progression order"
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>Progression</span>
              </button>
              <button
                type="button"
                onClick={() => setSortOrder("alphabetical")}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  sortOrder === "alphabetical"
                    ? "bg-zinc-800 text-white font-semibold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
                title="A to Z Alphabetical browsing"
              >
                <ArrowDownAZ className="w-3.5 h-3.5" />
                <span>A-Z</span>
              </button>
            </div>
          </div>
        </div>

        {/* Alphabetical Browsing Quick Jump Bar */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2.5 mb-6 scrollbar-none">
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider mr-1.5 shrink-0">
            A-Z Jump:
          </span>
          {ALPHABET_LETTERS.map((letter) => (
            <button
              key={letter}
              type="button"
              onClick={() => setSelectedLetter(letter)}
              className={`min-w-6 h-6 px-1.5 rounded text-xs font-mono font-medium transition-colors cursor-pointer flex items-center justify-center shrink-0 ${
                selectedLetter === letter
                  ? "bg-blue-600 text-white font-bold"
                  : "bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800/80"
              }`}
            >
              {letter}
            </button>
          ))}
        </div>

        {/* Results Counter & Active Filter Reset */}
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-6 pb-3 border-b border-zinc-850">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-zinc-200 font-mono">{filteredTopics.length}</strong> of{" "}
              <span className="font-mono">{topics.length}</span> individual topics
            </span>
            {selectedCategory !== "ALL" && (
              <Badge variant="outline" size="sm">
                {CATEGORIES.find((c) => c.id === selectedCategory)?.label}
              </Badge>
            )}
            {selectedLetter !== "ALL" && (
              <Badge variant="outline" size="sm">
                Starts with &apos;{selectedLetter}&apos;
              </Badge>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors cursor-pointer font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>

        {/* Topics Grid */}
        {filteredTopics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTopics.map((topic) => (
              <Card
                key={topic.slug}
                interactive
                className="flex flex-col justify-between group transition-all duration-200 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900/90"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <CardTitle className="text-base group-hover:text-blue-300 transition-colors leading-tight">
                      {topic.title}
                    </CardTitle>
                    <Badge variant={difficultyBadgeVariant(topic.difficulty)} size="sm">
                      {topic.difficulty.toLowerCase()}
                    </Badge>
                  </div>

                  <CardDescription className="text-xs line-clamp-2 mb-3 text-zinc-400 leading-relaxed">
                    {topic.description}
                  </CardDescription>

                  {/* Why It Matters snippet */}
                  {topic.whyItMatters && (
                    <div className="flex items-start gap-1.5 p-2 rounded bg-zinc-950/60 border border-zinc-800/80 mb-3 text-[11px] text-zinc-400">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-relaxed">{topic.whyItMatters}</span>
                    </div>
                  )}

                  {/* Key Points Preview */}
                  {topic.keyPoints && topic.keyPoints.length > 0 && (
                    <div className="space-y-1.5 pt-2.5 border-t border-zinc-850/80 mb-4">
                      {topic.keyPoints.slice(0, 2).map((point, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-[11px] text-zinc-400"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-500/70 shrink-0 mt-0.5" />
                          <span className="truncate">{point}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <CardFooter className="justify-between pt-3 border-t border-zinc-850">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
                    <Code2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Interactive Code</span>
                  </div>

                  <NextLink
                    href={`/learn/${topic.slug}`}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1.5 group-hover:translate-x-0.5 transition-all"
                  >
                    <span>Explore Topic</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </NextLink>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<BookOpen className="w-7 h-7 text-zinc-500" />}
            title="No topics match your criteria"
            description={
              searchQuery
                ? `No topics found matching "${searchQuery}". Try a different keyword, clear the letter filter, or reset all filters.`
                : "No topics found in the selected category or letter range."
            }
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reset Filters
              </Button>
            }
          />
        )}
      </PageContainer>
    </AppShell>
  );
}
