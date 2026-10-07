"use client";

import React, { useState } from "react";
import {
  HibernateScenarioResponse,
  HibernateExecuteResponse,
  HibernateStep,
  EntityLifecycleState,
  executeHibernate,
} from "@/lib/api/enterprise";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Database,
  Play,
  RotateCcw,
  Code2,
  Table as TableIcon,
  AlertCircle,
  ArrowRight,
  Terminal,
} from "lucide-react";

interface HibernateWorkbenchProps {
  scenarios: HibernateScenarioResponse[];
  initialScenarioId?: string;
}

const ENTITY_STATE_BADGES: Record<
  EntityLifecycleState,
  { label: string; bg: string; text: string; border: string }
> = {
  TRANSIENT: {
    label: "Transient (New in Memory)",
    bg: "bg-amber-950/60",
    text: "text-amber-300",
    border: "border-amber-700/60",
  },
  PERSISTENT: {
    label: "Persistent (Managed in Session)",
    bg: "bg-emerald-950/60",
    text: "text-emerald-300",
    border: "border-emerald-700/60",
  },
  DETACHED: {
    label: "Detached (Session Closed/Evicted)",
    bg: "bg-blue-950/60",
    text: "text-blue-300",
    border: "border-blue-700/60",
  },
  REMOVED: {
    label: "Removed (Scheduled for Deletion)",
    bg: "bg-rose-950/60",
    text: "text-rose-300",
    border: "border-rose-700/60",
  },
};

export function HibernateWorkbench({
  scenarios,
  initialScenarioId,
}: HibernateWorkbenchProps) {
  const [selectedScenario, setSelectedScenario] = useState<HibernateScenarioResponse>(
    scenarios.find((s) => s.id === initialScenarioId) || scenarios[0]
  );

  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<HibernateExecuteResponse | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSelectScenario = (sc: HibernateScenarioResponse) => {
    setSelectedScenario(sc);
    setSimulationResult(null);
    setCurrentStepIdx(0);
    setErrorMsg(null);
  };

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setErrorMsg(null);
    try {
      const res = await executeHibernate({
        scenarioId: selectedScenario.id,
      });
      setSimulationResult(res);
      setCurrentStepIdx(0);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to run Hibernate ORM simulation"
      );
    } finally {
      setIsSimulating(false);
    }
  };

  const currentStep: HibernateStep | undefined =
    simulationResult?.steps?.[currentStepIdx];

  const stateMeta = currentStep
    ? ENTITY_STATE_BADGES[currentStep.entityState] || {
        label: currentStep.entityState,
        bg: "bg-zinc-800",
        text: "text-zinc-200",
        border: "border-zinc-700",
      }
    : null;

  return (
    <div className="space-y-6">
      {/* 1. Scenario Selector Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {scenarios.map((sc) => {
          const isSelected = selectedScenario.id === sc.id;
          return (
            <button
              key={sc.id}
              type="button"
              onClick={() => handleSelectScenario(sc)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? "bg-indigo-600/15 border-indigo-500 shadow-md shadow-indigo-950/20"
                  : "bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/40 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-zinc-400">
                <Database className="w-3 h-3 text-indigo-400" />
                <span>Hibernate / JPA</span>
              </div>
              <div
                className={`text-xs font-semibold line-clamp-2 ${
                  isSelected ? "text-indigo-300" : "text-zinc-200"
                }`}
              >
                {sc.name}
              </div>
            </button>
          );
        })}
      </div>

      {/* 2. Scenario Description & Run Toolbar */}
      <Card className="p-4 bg-zinc-900/70 border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-zinc-100 mb-1">
            {selectedScenario.name}
          </h3>
          <p className="text-xs text-zinc-300 max-w-3xl leading-relaxed">
            {selectedScenario.description}
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleRunSimulation}
          disabled={isSimulating}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-5 self-start sm:self-auto shrink-0"
        >
          {isSimulating ? "Simulating JPA..." : "Run ORM Simulation"}
          <Play className="w-3.5 h-3.5 ml-1.5 fill-current" />
        </Button>
      </Card>

      {errorMsg && (
        <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-lg text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 3. Main Workspace: Interactive Persistence Context & Generated SQL */}
      {simulationResult && currentStep ? (
        <div className="space-y-6">
          {/* Step Narrative & Entity Lifecycle State Card */}
          <Card className="p-5 bg-zinc-950 border-zinc-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-zinc-300">
                  Step {currentStepIdx + 1} of {simulationResult.steps.length}:
                </span>
                <span className="text-sm font-semibold text-zinc-100">
                  {currentStep.title}
                </span>
              </div>

              {stateMeta && (
                <div
                  className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${stateMeta.bg} ${stateMeta.text} ${stateMeta.border} self-start sm:self-auto`}
                >
                  Entity State: {stateMeta.label}
                </div>
              )}
            </div>

            <p className="text-xs text-zinc-300 font-sans leading-relaxed">
              {currentStep.description}
            </p>

            {/* Stepper Timeline Navigation */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStepIdx(0)}
                  disabled={currentStepIdx === 0}
                  className="text-xs px-2.5"
                >
                  <RotateCcw className="w-3 h-3 mr-1" /> Reset
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStepIdx((prev) => Math.max(0, prev - 1))}
                  disabled={currentStepIdx === 0}
                  className="text-xs px-3"
                >
                  Previous Step
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    setCurrentStepIdx((prev) =>
                      Math.min(simulationResult.steps.length - 1, prev + 1)
                    )
                  }
                  disabled={currentStepIdx >= simulationResult.steps.length - 1}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3"
                >
                  Next Step <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>

              <span className="text-xs font-mono text-zinc-400">
                Queries in this step: {currentStep.sqlStatements.length} | Cumulative:{" "}
                <strong className="text-amber-400">
                  {simulationResult.totalQueriesFired} SQL
                </strong>
              </span>
            </div>
          </Card>

          {/* Dual Panel: Persistence Context (Cache) & Generated SQL Terminal */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: First-Level Cache & Database Snapshot (6 Cols) */}
            <div className="lg:col-span-6 space-y-4">
              {/* Persistence Context / First-Level Cache Inspector */}
              <Card className="p-4 bg-zinc-950 border-zinc-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-300">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span>Persistence Context (First-Level Cache)</span>
                  </div>
                  <Badge variant="neutral" size="sm" className="font-mono text-[10px]">
                    Identity Map
                  </Badge>
                </div>

                {Object.keys(currentStep.firstLevelCache).length === 0 ? (
                  <p className="text-xs text-zinc-500 font-mono italic p-3">
                    [Empty: No managed entities inside Session cache at this step]
                  </p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(currentStep.firstLevelCache).map(([key, val]) => (
                      <div
                        key={key}
                        className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs font-mono space-y-1"
                      >
                        <div className="text-emerald-400 font-bold flex items-center justify-between">
                          <span>Key: {key}</span>
                          <span className="text-[10px] text-zinc-400">Managed</span>
                        </div>
                        <div className="text-zinc-300 text-[11px] whitespace-pre-wrap">
                          {typeof val === "object" ? JSON.stringify(val, null, 2) : String(val)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Relational Database Table Snapshot */}
              <Card className="p-4 bg-zinc-950 border-zinc-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-300">
                    <TableIcon className="w-4 h-4 text-cyan-400" />
                    <span>Database Table State Snapshot</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">
                    PostgreSQL / H2
                  </span>
                </div>

                {currentStep.tableSnapshot.length === 0 ? (
                  <p className="text-xs text-zinc-500 font-mono italic p-3">
                    [No table records available]
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-400 text-[11px]">
                          {Object.keys(currentStep.tableSnapshot[0]).map((col) => (
                            <th key={col} className="pb-2 pr-4 font-semibold uppercase">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900">
                        {currentStep.tableSnapshot.map((row, rIdx) => (
                          <tr key={rIdx} className="text-zinc-200">
                            {Object.values(row).map((val, cIdx) => (
                              <td key={cIdx} className="py-2 pr-4">
                                {typeof val === "object" ? JSON.stringify(val) : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>

            {/* Right: Generated SQL Terminal & Canonical Code (6 Cols) */}
            <div className="lg:col-span-6 space-y-4">
              {/* Generated SQL Terminal */}
              <Card className="bg-zinc-950 border-zinc-800 shadow-xl overflow-hidden">
                <div className="py-2.5 px-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
                    <Terminal className="w-3.5 h-3.5 text-amber-400" />
                    <span>Generated SQL Log (show_sql: true)</span>
                  </div>
                  <Badge variant="neutral" size="sm" className="font-mono text-[10px]">
                    Dialect: PostgreSQL / H2
                  </Badge>
                </div>

                <div className="p-4 font-mono text-xs text-amber-200/95 space-y-2 max-h-[300px] overflow-y-auto">
                  {currentStep.sqlStatements.length === 0 ? (
                    <div className="text-emerald-400 font-medium py-2">
                      {"/* ZERO SQL queries fired in this step! (Handled by First-Level Cache or in-memory state) */"}
                    </div>
                  ) : (
                    currentStep.sqlStatements.map((sql, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800/80 leading-relaxed whitespace-pre-wrap"
                      >
                        {sql}
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Canonical Java @Entity & Session Operation Code */}
              <Card className="bg-zinc-950 border-zinc-800 shadow-xl overflow-hidden">
                <div className="py-2 px-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-300">
                    Java Entity & Session Operation Code
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    Hibernate 7 / Jakarta JPA
                  </span>
                </div>
                <div className="p-4 font-mono text-xs text-zinc-200 overflow-x-auto whitespace-pre leading-relaxed max-h-[300px] overflow-y-auto">
                  {selectedScenario.entityJavaCode}
                  {"\n\n// --- Session / EntityManager Operations ---\n"}
                  {selectedScenario.operationCode}
                </div>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        /* Un-simulated Preview State */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-5 bg-zinc-950 border-zinc-800 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-300">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span>JPA @Entity Definition</span>
            </div>
            <pre className="font-mono text-xs text-zinc-200 overflow-x-auto p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 max-h-96 leading-relaxed">
              {selectedScenario.entityJavaCode}
            </pre>
          </Card>

          <Card className="p-5 bg-zinc-950 border-zinc-800 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-300">
              <Database className="w-4 h-4 text-indigo-400" />
              <span>Hibernate Session Operations</span>
            </div>
            <pre className="font-mono text-xs text-zinc-200 overflow-x-auto p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 max-h-96 leading-relaxed">
              {selectedScenario.operationCode}
            </pre>
            <div className="pt-4 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={handleRunSimulation}
                disabled={isSimulating}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-5"
              >
                {isSimulating ? "Simulating JPA..." : "Run ORM Simulation"}
                <Play className="w-3.5 h-3.5 ml-1.5 fill-current" />
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
