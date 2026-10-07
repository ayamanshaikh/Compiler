import {
  TraceStep,
  TraceEventType,
  NormalizedConceptType,
  NormalizedExecutionEvent,
} from "@/lib/api/types";

/**
 * Maps a raw TraceEventType and optional step attributes to a NormalizedConceptType.
 */
export function classifyConceptType(
  eventType: TraceEventType,
  hasPreviousValue: boolean,
  operation?: string
): NormalizedConceptType {
  switch (eventType) {
    case "VARIABLE_DECLARATION":
      return "VARIABLE_DECLARATION";
    case "VARIABLE_ASSIGNMENT":
      return hasPreviousValue ? "VALUE_CHANGE" : "VARIABLE_ASSIGNMENT";
    case "CONDITION_EVALUATION":
      return "CONDITION_CHECK";
    case "LOOP_ITERATION":
      return "LOOP_ITERATION";
    case "LOOP_TERMINATION":
      return "LOOP_END";
    case "ARRAY_MUTATION":
      return "ARRAY_MUTATION";
    case "ARRAY_ACCESS":
      return "ARRAY_ACCESS";
    case "OBJECT_CREATION":
      return "OBJECT_CREATE";
    case "FIELD_MUTATION":
      return "FIELD_UPDATE";
    case "METHOD_ENTRY":
      return "METHOD_CALL";
    case "METHOD_EXIT":
      return "RETURN";
    case "COLLECTION_OPERATION":
      return "COLLECTION_OPERATION";
    case "EXCEPTION_THROWN":
    case "EXCEPTION_CAUGHT":
      return "EXCEPTION";
    case "OUTPUT_PRINT":
      return "OUTPUT";
    case "LINE":
      return operation === "EXECUTE_LINE" ? "LINE_EXECUTION" : "LINE_EXECUTION";
    default:
      return "GENERIC_STEP";
  }
}

/**
 * Normalizes a TraceStep into a uniform NormalizedExecutionEvent contract.
 * Derives missing symbols and values gracefully without cloning deep data.
 */
export function normalizeTraceStep(step: TraceStep): NormalizedExecutionEvent {
  const variables = step.variables || {};
  let symbol = step.symbol;
  let prevVal = step.previousValue;
  let currVal = step.currentValue;
  let operation = step.operation;

  // Infer symbol and values if not explicitly provided by backend collector
  if (!symbol) {
    // Check if exactly one variable changed or exists
    const varKeys = Object.keys(variables);
    for (const key of varKeys) {
      const v = variables[key];
      if (v.previousValue !== undefined && v.previousValue !== null) {
        symbol = v.name;
        prevVal = v.previousValue;
        currVal = v.value;
        break;
      }
    }

    if (!symbol && varKeys.length > 0) {
      const lastVar = variables[varKeys[varKeys.length - 1]];
      symbol = lastVar.name;
      currVal = lastVar.value;
      prevVal = lastVar.previousValue;
    }
  }

  // Fallback for current / previous values from resolved symbol
  if (symbol && variables[symbol]) {
    if (currVal === undefined) currVal = variables[symbol].value;
    if (prevVal === undefined) prevVal = variables[symbol].previousValue;
  }

  // Infer operation if not provided
  if (!operation) {
    switch (step.eventType) {
      case "VARIABLE_DECLARATION":
        operation = "DECLARE";
        break;
      case "VARIABLE_ASSIGNMENT":
        operation = prevVal ? "ASSIGN" : "INIT";
        break;
      case "ARRAY_MUTATION":
        operation = "ARRAY_SET";
        break;
      case "OUTPUT_PRINT":
        operation = "PRINT";
        break;
      case "LOOP_ITERATION":
        operation = "LOOP_ITER";
        break;
      case "CONDITION_EVALUATION":
        operation = "BRANCH";
        break;
      default:
        operation = "STEP";
        break;
    }
  }

  const hasPrevious = Boolean(prevVal !== undefined && prevVal !== null);
  const conceptType = classifyConceptType(step.eventType, hasPrevious, operation);

  // Derive active scope (top of call stack or default)
  const scope =
    step.scope ||
    (step.callStack && step.callStack.length > 0
      ? step.callStack[0].methodName
      : "main");

  return {
    sequence: step.stepIndex,
    eventType: step.eventType,
    conceptType,
    sourceLine: step.line,
    sourceColumn: step.column,
    scope,
    symbol,
    previousValue: prevVal,
    currentValue: currVal,
    operation,
    relatedEvent: step.relatedEvent,
    metadata: step.metadata || {},
    description: step.description,
    output: step.output || "",
    variables,
    callStack: step.callStack || [],
    heapObjects: step.heapObjects || {},
  };
}

/**
 * Normalizes an array of raw TraceSteps into NormalizedExecutionEvents.
 */
export function normalizeTraceSteps(steps: TraceStep[]): NormalizedExecutionEvent[] {
  if (!steps || steps.length === 0) return [];
  return steps.map(normalizeTraceStep);
}
