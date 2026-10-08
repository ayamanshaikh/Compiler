import {
  NormalizedExecutionEvent,
  VisualizationStrategyDecision,
  VisualRendererType,
  ProgramStrategySummary,
} from "@/lib/api/types";

/**
 * Strategy handler interface for registering concept-driven visualizers.
 * Allows adding new visual renderers without rewriting existing engine logic.
 */
export interface ConceptStrategyHandler {
  id: string;
  rendererType: VisualRendererType;
  priority: number;
  match: (event: NormalizedExecutionEvent) => boolean;
  evaluate: (event: NormalizedExecutionEvent) => VisualizationStrategyDecision;
}

// ---------------------------------------------------------------------------
// Concept Predicates - Strictly ground decisions in authentic execution data
// ---------------------------------------------------------------------------

export function canVisualizeVariable(event: NormalizedExecutionEvent): boolean {
  if (
    event.conceptType !== "VARIABLE_DECLARATION" &&
    event.conceptType !== "VARIABLE_ASSIGNMENT" &&
    event.conceptType !== "VALUE_CHANGE"
  ) {
    return false;
  }
  // Must have a real symbol and a concrete runtime value
  return Boolean(event.symbol && event.currentValue !== undefined && event.currentValue !== null);
}

export function canVisualizeArray(event: NormalizedExecutionEvent): boolean {
  if (event.conceptType === "ARRAY_MUTATION" || event.conceptType === "ARRAY_ACCESS") {
    return true;
  }
  // Check if heapObjects contains array index representations like arr[0]
  const hasHeapArray = Object.keys(event.heapObjects || {}).some((k) =>
    /\[\d+\]/.test(k)
  );
  return hasHeapArray;
}

export function canVisualizeCondition(event: NormalizedExecutionEvent): boolean {
  if (event.conceptType !== "CONDITION_CHECK" && event.conceptType !== "BRANCH") {
    return false;
  }
  // Must have boolean evaluation result either in currentValue or metadata
  const hasBooleanVal =
    event.currentValue === "true" ||
    event.currentValue === "false" ||
    event.metadata?.result !== undefined;
  return Boolean(hasBooleanVal);
}

export function canVisualizeLoop(event: NormalizedExecutionEvent): boolean {
  if (event.conceptType !== "LOOP_ITERATION" && event.conceptType !== "LOOP_END") {
    return false;
  }
  return Boolean(event.operation === "LOOP_ITER" || event.metadata?.iteration !== undefined);
}

export function canVisualizeCallStack(event: NormalizedExecutionEvent): boolean {
  if (event.conceptType === "METHOD_CALL" || event.conceptType === "RETURN") {
    return true;
  }
  // If call stack depth is greater than 1, stack visualization is informative
  return Boolean(event.callStack && event.callStack.length > 1);
}

export function canVisualizeOutput(event: NormalizedExecutionEvent): boolean {
  if (event.conceptType !== "OUTPUT" && event.eventType !== "OUTPUT_PRINT") {
    return false;
  }
  return Boolean(event.currentValue !== undefined || event.output.length > 0);
}

export function canVisualizeExpression(event: NormalizedExecutionEvent): boolean {
  if (event.conceptType === "EXPRESSION_EVALUATION") {
    return true;
  }
  if (
    event.operation &&
    /^[+\-*\/%]$|ASSIGN_OP|ADD|SUB|MUL|DIV|MOD/.test(event.operation)
  ) {
    return Boolean(event.currentValue !== undefined);
  }
  if (
    event.metadata?.operation ||
    event.metadata?.operands ||
    event.metadata?.expression
  ) {
    return true;
  }
  if (
    event.conceptType === "VARIABLE_ASSIGNMENT" &&
    event.description &&
    /[+\-*\/%]/.test(event.description) &&
    event.previousValue !== undefined
  ) {
    return Boolean(event.symbol && event.currentValue !== undefined);
  }
  return false;
}

export function canVisualizeRecursion(event: NormalizedExecutionEvent): boolean {
  if (event.conceptType === "RECURSION") return true;
  if (!event.callStack || event.callStack.length < 2) return false;
  const counts: Record<string, number> = {};
  for (const f of event.callStack) {
    counts[f.methodName] = (counts[f.methodName] || 0) + 1;
    if (counts[f.methodName] > 1) return true;
  }
  return false;
}

export function canVisualizeObject(event: NormalizedExecutionEvent): boolean {
  if (
    event.conceptType === "OBJECT_CREATE" ||
    event.conceptType === "CONSTRUCTOR_CALL" ||
    event.conceptType === "FIELD_UPDATE"
  ) {
    return true;
  }
  if (event.metadata?.className || event.metadata?.isConstructor) {
    return true;
  }
  const hasCustomHeapObj = Object.values(event.heapObjects || {}).some(
    (obj) => obj.type !== "Array" && !/\[\d+\]/.test(obj.id)
  );
  return hasCustomHeapObj;
}

export function canVisualizeComparison(event: NormalizedExecutionEvent): boolean {
  if (event.conceptType === "COMPARISON") return true;
  if (
    event.conceptType === "CONDITION_CHECK" &&
    typeof event.metadata?.condition === "string" &&
    /(>=|<=|==|!=|>|<)/.test(event.metadata.condition)
  ) {
    return true;
  }
  return false;
}

export function canVisualizeArrayOperation(event: NormalizedExecutionEvent): boolean {
  if (
    event.conceptType === "SWAP" ||
    event.conceptType === "SEARCH_STEP" ||
    event.conceptType === "SORT_STEP"
  ) {
    return true;
  }
  if (event.metadata?.isSwap || event.metadata?.searchTarget !== undefined) {
    return true;
  }
  return false;
}

export function canVisualizeParameterBinding(event: NormalizedExecutionEvent): boolean {
  if (event.conceptType === "PARAMETER_BIND") return true;
  if (event.conceptType === "RETURN" && event.currentValue !== undefined) return true;
  if (
    event.conceptType === "METHOD_CALL" &&
    (event.metadata?.parameters !== undefined || Object.keys(event.variables).length > 0)
  ) {
    return true;
  }
  return false;
}

export function canVisualizeString(event: NormalizedExecutionEvent): boolean {
  if (event.conceptType === "STRING_OPERATION") return true;
  if (
    event.metadata?.type === "String" &&
    event.currentValue !== undefined &&
    typeof event.currentValue === "string"
  ) {
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Extensible Strategy Handlers Registry
// ---------------------------------------------------------------------------

const STRATEGY_HANDLERS: ConceptStrategyHandler[] = [
  {
    id: "array-operation-handler",
    rendererType: "ARRAY_OPERATION",
    priority: 105,
    match: canVisualizeArrayOperation,
    evaluate: (event) => ({
      mode: "VISUAL_EXECUTION",
      rendererType: "ARRAY_OPERATION",
      confidence: "FULL",
      reason: `Array algorithmic operation (${event.conceptType}) executed with cell highlight indicators.`,
      suggestedDetailLevel: "beginner",
      conceptType: event.conceptType,
    }),
  },
  {
    id: "array-handler",
    rendererType: "ARRAY",
    priority: 100,
    match: canVisualizeArray,
    evaluate: (event) => ({
      mode: "VISUAL_EXECUTION",
      rendererType: "ARRAY",
      confidence: "FULL",
      reason: `Array mutation detected on ${event.symbol || "indexed structure"} with indexed cell tracking.`,
      suggestedDetailLevel: "beginner",
      conceptType: event.conceptType,
    }),
  },
  {
    id: "comparison-handler",
    rendererType: "COMPARISON",
    priority: 92,
    match: canVisualizeComparison,
    evaluate: (event) => ({
      mode: "VISUAL_EXECUTION",
      rendererType: "COMPARISON",
      confidence: "FULL",
      reason: `Relational comparison (${event.metadata?.condition || event.symbol || "a == b"}) evaluated to ${event.currentValue === "true" ? "TRUE" : "FALSE"}.`,
      suggestedDetailLevel: "beginner",
      conceptType: event.conceptType,
    }),
  },
  {
    id: "condition-handler",
    rendererType: "CONDITION",
    priority: 90,
    match: canVisualizeCondition,
    evaluate: (event) => ({
      mode: "VISUAL_EXECUTION",
      rendererType: "CONDITION",
      confidence: "FULL",
      reason: `Branch evaluation evaluated to ${event.currentValue === "true" ? "TRUE (branch taken)" : "FALSE"}.`,
      suggestedDetailLevel: "beginner",
      conceptType: event.conceptType,
    }),
  },
  {
    id: "recursion-handler",
    rendererType: "RECURSION",
    priority: 85,
    match: canVisualizeRecursion,
    evaluate: (event) => ({
      mode: "VISUAL_EXECUTION",
      rendererType: "RECURSION",
      confidence: "FULL",
      reason: `Recursive invocation stack detected for method '${event.callStack?.[0]?.methodName || "function"}' (depth ${event.callStack?.length || 1}).`,
      suggestedDetailLevel: "detailed",
      conceptType: event.conceptType,
    }),
  },
  {
    id: "loop-handler",
    rendererType: "LOOP",
    priority: 80,
    match: canVisualizeLoop,
    evaluate: (event) => ({
      mode: "VISUAL_EXECUTION",
      rendererType: "LOOP",
      confidence: "FULL",
      reason: `Loop iteration progression with active cycle metrics.`,
      suggestedDetailLevel: "beginner",
      conceptType: event.conceptType,
    }),
  },
  {
    id: "string-handler",
    rendererType: "STRING_OPERATION",
    priority: 78,
    match: canVisualizeString,
    evaluate: (event) => ({
      mode: "VISUAL_EXECUTION",
      rendererType: "STRING_OPERATION",
      confidence: "FULL",
      reason: `String character sequence operation on '${event.symbol || "string"}' with immutability model.`,
      suggestedDetailLevel: "beginner",
      conceptType: event.conceptType,
    }),
  },
  {
    id: "object-handler",
    rendererType: "OBJECT",
    priority: 75,
    match: canVisualizeObject,
    evaluate: (event) => ({
      mode: "VISUAL_EXECUTION",
      rendererType: "OBJECT",
      confidence: "FULL",
      reason: `Object instance allocated on heap with reference '${event.symbol || "objectRef"}'.`,
      suggestedDetailLevel: "beginner",
      conceptType: event.conceptType,
    }),
  },
  {
    id: "parameter-bind-handler",
    rendererType: "PARAMETER_BIND",
    priority: 72,
    match: canVisualizeParameterBinding,
    evaluate: (event) => ({
      mode: "VISUAL_EXECUTION",
      rendererType: "PARAMETER_BIND",
      confidence: "FULL",
      reason:
        event.conceptType === "RETURN"
          ? `Return value ${event.currentValue} bubbling to caller frame.`
          : `Method invocation parameter binding for '${event.callStack?.[0]?.methodName || event.symbol || "method"}'.`,
      suggestedDetailLevel: "beginner",
      conceptType: event.conceptType,
    }),
  },
  {
    id: "call-stack-handler",
    rendererType: "CALL_STACK",
    priority: 70,
    match: canVisualizeCallStack,
    evaluate: (event) => ({
      mode: "VISUAL_EXECUTION",
      rendererType: "CALL_STACK",
      confidence: "FULL",
      reason: `Active call frame hierarchy (${event.callStack.length} active frames on thread).`,
      suggestedDetailLevel: "detailed",
      conceptType: event.conceptType,
    }),
  },
  {
    id: "expression-handler",
    rendererType: "EXPRESSION",
    priority: 65,
    match: canVisualizeExpression,
    evaluate: (event) => ({
      mode: "VISUAL_EXECUTION",
      rendererType: "EXPRESSION",
      confidence: "FULL",
      reason: `Expression evaluated with concrete inputs and resulting output.`,
      suggestedDetailLevel: "beginner",
      conceptType: event.conceptType,
    }),
  },
  {
    id: "variable-handler",
    rendererType: "VARIABLE",
    priority: 60,
    match: canVisualizeVariable,
    evaluate: (event) => ({
      mode: "VISUAL_EXECUTION",
      rendererType: "VARIABLE",
      confidence: event.previousValue !== undefined ? "FULL" : "PARTIAL",
      reason: event.previousValue
        ? `Variable '${event.symbol}' mutated from ${event.previousValue} to ${event.currentValue}.`
        : `Variable '${event.symbol}' initialized to ${event.currentValue}.`,
      suggestedDetailLevel: "beginner",
      conceptType: event.conceptType,
    }),
  },
  {
    id: "output-handler",
    rendererType: "OUTPUT",
    priority: 50,
    match: canVisualizeOutput,
    evaluate: (event) => ({
      mode: "VISUAL_EXECUTION",
      rendererType: "OUTPUT",
      confidence: "FULL",
      reason: `Standard output emitted to console.`,
      suggestedDetailLevel: "beginner",
      conceptType: event.conceptType,
    }),
  },
];

/**
 * Resolves the optimal visualization strategy for a given execution event.
 * If no visual renderer can meaningfully display the event without faking data,
 * gracefully routes to EXPLANATION_FALLBACK.
 */
export function resolveVisualizationStrategy(
  event: NormalizedExecutionEvent
): VisualizationStrategyDecision {
  // Sort handlers by priority descending
  const sorted = [...STRATEGY_HANDLERS].sort((a, b) => b.priority - a.priority);

  for (const handler of sorted) {
    if (handler.match(event)) {
      return handler.evaluate(event);
    }
  }

  // Graceful fallback: intentional step-by-step explanation
  return {
    mode: "EXPLANATION_FALLBACK",
    rendererType: "NONE",
    confidence: "FALLBACK",
    reason: `Instruction on line ${event.sourceLine} does not have an active visual model; presenting structured step explanation.`,
    suggestedDetailLevel: "beginner",
    conceptType: event.conceptType,
  };
}

/**
 * Analyzes an entire sequence of normalized trace events to determine
 * overall program characteristics and active visualizer capabilities.
 */
export function analyzeProgramTraceStrategies(
  events: NormalizedExecutionEvent[]
): ProgramStrategySummary {
  if (!events || events.length === 0) {
    return {
      totalEvents: 0,
      visualEventCount: 0,
      fallbackEventCount: 0,
      primaryMode: "EXPLANATORY",
      activeRenderers: [],
    };
  }

  let visualCount = 0;
  let fallbackCount = 0;
  const rendererSet = new Set<VisualRendererType>();

  for (const ev of events) {
    const decision = resolveVisualizationStrategy(ev);
    if (decision.mode === "VISUAL_EXECUTION" && decision.rendererType !== "NONE") {
      visualCount++;
      rendererSet.add(decision.rendererType);
    } else {
      fallbackCount++;
    }
  }

  const primaryMode: "VISUAL" | "MIXED" | "EXPLANATORY" =
    visualCount === 0
      ? "EXPLANATORY"
      : fallbackCount === 0
      ? "VISUAL"
      : "MIXED";

  return {
    totalEvents: events.length,
    visualEventCount: visualCount,
    fallbackEventCount: fallbackCount,
    primaryMode,
    activeRenderers: Array.from(rendererSet),
  };
}
