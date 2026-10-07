"use client";

import React, { useState } from "react";
import {
  ServletScenarioResponse,
  ServletExecuteResponse,
  executeServlet,
} from "@/lib/api/enterprise";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import {
  Send,
  RefreshCw,
  Globe,
  FileCode,
  AlertCircle,
  Clock,
  Layers,
  Database,
  Terminal,
} from "lucide-react";

interface ServletSandboxProps {
  scenarios: ServletScenarioResponse[];
  initialScenarioId?: string;
}

const LIFECYCLE_PHASE_LABELS: Record<string, { label: string; color: string }> = {
  REQUEST_PARSING: { label: "1. HTTP Parsing", color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  FILTER_PRE_HANDLE: { label: "2. Filter Chain", color: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
  CONTAINER_ROUTING: { label: "3. URL Mapping", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" },
  SERVLET_INIT: { label: "4. Servlet init()", color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  SERVICE_DISPATCH: { label: "5. service() Dispatch", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" },
  SERVLET_EXECUTION: { label: "6. Servlet Logic", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  SESSION_MUTATION: { label: "7. Session Update", color: "bg-teal-500/10 text-teal-400 border-teal-500/30" },
  RESPONSE_SERIALIZATION: { label: "8. HTTP Commit", color: "bg-rose-500/10 text-rose-400 border-rose-500/30" },
};

export function ServletSandbox({
  scenarios,
  initialScenarioId,
}: ServletSandboxProps) {
  const [selectedScenario, setSelectedScenario] = useState<ServletScenarioResponse>(
    scenarios.find((s) => s.id === initialScenarioId) || scenarios[0]
  );

  // Request form state
  const [method, setMethod] = useState<string>(selectedScenario.defaultMethod);
  const [path, setPath] = useState<string>(selectedScenario.defaultPath);
  const [queryParams, setQueryParams] = useState<Record<string, string>>(
    selectedScenario.defaultParams || {}
  );
  const [headers, setHeaders] = useState<Record<string, string>>(
    selectedScenario.defaultHeaders || {}
  );
  const [body, setBody] = useState<string>(selectedScenario.defaultBody || "");

  // Execution state
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<ServletExecuteResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Right column tab state: "trace" | "java" | "xml"
  const [activeTab, setActiveTab] = useState<"trace" | "java" | "xml">("trace");

  const handleSelectScenario = (sc: ServletScenarioResponse) => {
    setSelectedScenario(sc);
    setMethod(sc.defaultMethod);
    setPath(sc.defaultPath);
    setQueryParams(sc.defaultParams || {});
    setHeaders(sc.defaultHeaders || {});
    setBody(sc.defaultBody || "");
    setExecutionResult(null);
    setErrorMsg(null);
  };

  const handleSendRequest = async () => {
    setIsExecuting(true);
    setErrorMsg(null);
    try {
      const res = await executeServlet({
        scenarioId: selectedScenario.id,
        method,
        path,
        headers,
        queryParams,
        body,
      });
      setExecutionResult(res);
      setActiveTab("trace");
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to execute simulated servlet request"
      );
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Scenario Selector Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {scenarios.map((sc) => {
          const isSelected = selectedScenario.id === sc.id;
          return (
            <button
              key={sc.id}
              type="button"
              onClick={() => handleSelectScenario(sc)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? "bg-indigo-600/15 border-indigo-500 shadow-md shadow-indigo-950/20"
                  : "bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/40 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    sc.defaultMethod === "GET"
                      ? "bg-emerald-950/60 text-emerald-400"
                      : "bg-blue-950/60 text-blue-400"
                  }`}
                >
                  {sc.defaultMethod}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  {sc.defaultPath}
                </span>
              </div>
              <div
                className={`text-xs font-semibold truncate ${
                  isSelected ? "text-indigo-300" : "text-zinc-200"
                }`}
              >
                {sc.name}
              </div>
            </button>
          );
        })}
      </div>

      {/* 2. Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Simulated HTTP Client & Response (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="p-5 bg-zinc-950 border-zinc-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-300">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span>Simulated HTTP Request</span>
              </div>
              <Badge variant="neutral" size="sm" className="font-mono text-[10px]">
                Jakarta Servlet 6.0
              </Badge>
            </div>

            {/* URL & Method Bar */}
            <div className="flex items-center gap-2">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-zinc-100 font-mono text-xs font-bold rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>

              <div className="flex-1">
                <Input
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="/endpoint"
                  className="font-mono text-xs text-zinc-200"
                />
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleSendRequest}
                disabled={isExecuting}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4"
              >
                {isExecuting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
                ) : (
                  <Send className="w-3.5 h-3.5 mr-1" />
                )}
                Send
              </Button>
            </div>

            {/* Query Parameters */}
            {Object.keys(queryParams).length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] font-mono font-semibold text-zinc-400 block">
                  Query Parameters:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(queryParams).map(([k, v]) => (
                    <div
                      key={k}
                      className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 font-mono text-xs flex items-center justify-between"
                    >
                      <span className="text-zinc-400">{k}:</span>
                      <input
                        type="text"
                        value={v}
                        onChange={(e) =>
                          setQueryParams((prev) => ({ ...prev, [k]: e.target.value }))
                        }
                        className="bg-transparent text-right text-zinc-200 font-mono text-xs outline-none w-28"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Headers Preview */}
            {Object.keys(headers).length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] font-mono font-semibold text-zinc-400 block">
                  Request Headers:
                </span>
                <div className="space-y-1">
                  {Object.entries(headers).map(([k, v]) => (
                    <div
                      key={k}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-900/40 border border-zinc-800/80 font-mono text-[11px] flex items-center justify-between"
                    >
                      <span className="text-zinc-400">{k}</span>
                      <span className="text-zinc-200 truncate max-w-[240px]">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Body Form (For POST) */}
            {method === "POST" && (
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] font-mono font-semibold text-zinc-400 block">
                  Request Body (JSON / Payload):
                </span>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 font-mono text-xs text-zinc-200 outline-none focus:border-indigo-500 leading-relaxed"
                  placeholder='{"key": "value"}'
                />
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-lg text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </Card>

          {/* Response Inspector Panel */}
          {executionResult && (
            <Card className="p-5 bg-zinc-950 border-zinc-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="text-xs font-mono font-bold text-zinc-300">
                  HTTP Response
                </span>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    executionResult.response.statusCode < 300
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                      : executionResult.response.statusCode < 400
                      ? "bg-amber-950 text-amber-400 border border-amber-800"
                      : "bg-rose-950 text-rose-400 border border-rose-800"
                  }`}
                >
                  {executionResult.response.statusCode} {executionResult.response.statusText}
                </span>
              </div>

              {/* Response Headers */}
              {Object.keys(executionResult.response.headers).length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-zinc-400">Headers:</span>
                  <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 font-mono text-[11px] space-y-1">
                    {Object.entries(executionResult.response.headers).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-zinc-400">{k}:</span>
                        <span className="text-zinc-200">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Response Body Preview */}
              {executionResult.response.body && (
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-zinc-400">Body Payload:</span>
                  <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-200 whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {executionResult.response.body}
                  </div>
                </div>
              )}

              {/* Session State Card (If populated) */}
              {executionResult.response.sessionId && (
                <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-900/40 text-xs font-mono space-y-1.5">
                  <div className="flex items-center justify-between text-indigo-300 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5" /> HttpSession Active
                    </span>
                    <span className="text-[10px] text-zinc-400 font-normal">
                      ID: {executionResult.response.sessionId}
                    </span>
                  </div>
                  {Object.keys(executionResult.response.sessionAttributes).length > 0 ? (
                    <div className="text-[11px] text-zinc-300 space-y-0.5 pt-1">
                      {Object.entries(executionResult.response.sessionAttributes).map(
                        ([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <span className="text-zinc-400">{k}:</span>
                            <span className="text-indigo-200">{JSON.stringify(v)}</span>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-400">
                      No attributes stored in session yet.
                    </p>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Right Column: Container Lifecycle Execution Trace & Code (6 Cols) */}
        <div className="lg:col-span-6 space-y-3">
          {/* View Mode Tabs */}
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab("trace")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                activeTab === "trace"
                  ? "bg-zinc-800 text-zinc-100 border border-zinc-700"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Lifecycle Execution Trace
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("java")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                activeTab === "java"
                  ? "bg-zinc-800 text-zinc-100 border border-zinc-700"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                Servlet Java Code
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("xml")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                activeTab === "xml"
                  ? "bg-zinc-800 text-zinc-100 border border-zinc-700"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                web.xml Descriptor
              </span>
            </button>
          </div>

          {/* TAB 1: Lifecycle Execution Trace */}
          {activeTab === "trace" && (
            <Card className="p-4 bg-zinc-950 border-zinc-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-xs font-mono font-bold text-zinc-300">
                  Servlet Container Lifecycle Phases
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  {executionResult ? `${executionResult.lifecycleSteps.length} Steps Trace` : "Awaiting Execution"}
                </span>
              </div>

              {!executionResult ? (
                <div className="p-8 text-center text-zinc-400 space-y-2">
                  <Terminal className="w-8 h-8 mx-auto text-zinc-400 mb-2" />
                  <p className="text-xs font-medium text-zinc-300">
                    Click &ldquo;Send&rdquo; on the HTTP Client to dispatch request.
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    You will see how the container parses, routes, filters, initializes, and dispatches to your Servlet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                  {executionResult.lifecycleSteps.map((step) => {
                    const meta = LIFECYCLE_PHASE_LABELS[step.phase] || {
                      label: step.phase,
                      color: "bg-zinc-800 text-zinc-300 border-zinc-700",
                    };
                    return (
                      <div
                        key={step.stepIndex}
                        className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs space-y-1.5 hover:border-zinc-700 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${meta.color}`}
                          >
                            {meta.label}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400">
                            {step.component}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-200 font-sans leading-relaxed">
                          {step.description}
                        </p>
                        {step.details && Object.keys(step.details).length > 0 && (
                          <div className="pt-1 border-t border-zinc-800/80 font-mono text-[10px] text-zinc-400">
                            {JSON.stringify(step.details)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          {/* TAB 2: Java Source Code */}
          {activeTab === "java" && (
            <Card className="bg-zinc-950 border-zinc-800 shadow-xl overflow-hidden">
              <div className="py-2 px-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-300">
                  {selectedScenario.name}.java
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  Jakarta Servlet 6.0
                </span>
              </div>
              <div className="p-4 font-mono text-xs text-zinc-200 overflow-x-auto whitespace-pre leading-relaxed max-h-[580px] overflow-y-auto">
                {selectedScenario.servletCode}
              </div>
            </Card>
          )}

          {/* TAB 3: web.xml Deployment Descriptor */}
          {activeTab === "xml" && (
            <Card className="bg-zinc-950 border-zinc-800 shadow-xl overflow-hidden">
              <div className="py-2 px-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-300">
                  WEB-INF/web.xml
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  Deployment Descriptor
                </span>
              </div>
              <div className="p-4 font-mono text-xs text-amber-200/90 overflow-x-auto whitespace-pre leading-relaxed max-h-[580px] overflow-y-auto">
                {selectedScenario.webXmlConfig}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
