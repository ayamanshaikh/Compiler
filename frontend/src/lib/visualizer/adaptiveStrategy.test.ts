import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeTraceStep,
  normalizeTraceSteps,
  classifyConceptType,
} from "./traceNormalizer";
import {
  canVisualizeVariable,
  canVisualizeCondition,
  canVisualizeLoop,
  canVisualizeArray,
  canVisualizeCallStack,
  resolveVisualizationStrategy,
  analyzeProgramTraceStrategies,
} from "./adaptiveStrategy";
import { TraceStep } from "@/lib/api/types";

// Helper mock trace step generator
function createMockStep(overrides: Partial<TraceStep> = {}): TraceStep {
  return {
    stepIndex: 0,
    line: 10,
    eventType: "LINE",
    description: "Executed line 10",
    variables: {},
    callStack: [{ methodName: "main", className: "Main", line: 10 }],
    heapObjects: {},
    output: "",
    ...overrides,
  };
}

test("1. Concept type classification maps events accurately", () => {
  assert.equal(classifyConceptType("VARIABLE_DECLARATION", false), "VARIABLE_DECLARATION");
  assert.equal(classifyConceptType("VARIABLE_ASSIGNMENT", true), "VALUE_CHANGE");
  assert.equal(classifyConceptType("VARIABLE_ASSIGNMENT", false), "VARIABLE_ASSIGNMENT");
  assert.equal(classifyConceptType("CONDITION_EVALUATION", false), "CONDITION_CHECK");
  assert.equal(classifyConceptType("LOOP_ITERATION", false), "LOOP_ITERATION");
  assert.equal(classifyConceptType("ARRAY_MUTATION", false), "ARRAY_MUTATION");
  assert.equal(classifyConceptType("OUTPUT_PRINT", false), "OUTPUT");
});

test("2. Variable assignment routes to VISUAL_EXECUTION with VARIABLE renderer", () => {
  const step = createMockStep({
    eventType: "VARIABLE_ASSIGNMENT",
    symbol: "count",
    previousValue: "0",
    currentValue: "1",
    variables: {
      count: { name: "count", type: "int", value: "1", previousValue: "0" },
    },
  });

  const event = normalizeTraceStep(step);
  assert.equal(event.conceptType, "VALUE_CHANGE");
  assert.equal(canVisualizeVariable(event), true);

  const decision = resolveVisualizationStrategy(event);
  assert.equal(decision.mode, "VISUAL_EXECUTION");
  assert.equal(decision.rendererType, "VARIABLE");
  assert.equal(decision.confidence, "FULL");
  assert.match(decision.reason, /mutated from 0 to 1/);
});

test("3. Condition evaluation routes to VISUAL_EXECUTION with CONDITION renderer", () => {
  const step = createMockStep({
    eventType: "CONDITION_EVALUATION",
    symbol: "age >= 18",
    currentValue: "true",
    metadata: { condition: "age >= 18", result: "true" },
  });

  const event = normalizeTraceStep(step);
  assert.equal(event.conceptType, "CONDITION_CHECK");
  assert.equal(canVisualizeCondition(event), true);

  const decision = resolveVisualizationStrategy(event);
  assert.equal(decision.mode, "VISUAL_EXECUTION");
  assert.equal(decision.rendererType, "CONDITION");
  assert.equal(decision.confidence, "FULL");
});

test("4. Loop iteration routes to VISUAL_EXECUTION with LOOP renderer", () => {
  const step = createMockStep({
    eventType: "LOOP_ITERATION",
    operation: "LOOP_ITER",
    metadata: { iteration: "3" },
  });

  const event = normalizeTraceStep(step);
  assert.equal(event.conceptType, "LOOP_ITERATION");
  assert.equal(canVisualizeLoop(event), true);

  const decision = resolveVisualizationStrategy(event);
  assert.equal(decision.mode, "VISUAL_EXECUTION");
  assert.equal(decision.rendererType, "LOOP");
});

test("5. Array mutation routes to VISUAL_EXECUTION with ARRAY renderer", () => {
  const step = createMockStep({
    eventType: "ARRAY_MUTATION",
    symbol: "arr",
    currentValue: "42",
    heapObjects: {
      "arr[0]": { id: "arr[0]", type: "ARRAY_ELEMENT", state: { value: "42" } },
    },
  });

  const event = normalizeTraceStep(step);
  assert.equal(event.conceptType, "ARRAY_MUTATION");
  assert.equal(canVisualizeArray(event), true);

  const decision = resolveVisualizationStrategy(event);
  assert.equal(decision.mode, "VISUAL_EXECUTION");
  assert.equal(decision.rendererType, "ARRAY");
});

test("6. Multi-frame call stack routes to VISUAL_EXECUTION with CALL_STACK renderer", () => {
  const step = createMockStep({
    eventType: "METHOD_ENTRY",
    callStack: [
      { methodName: "calculateTotal", className: "Service", line: 45 },
      { methodName: "main", className: "Main", line: 12 },
    ],
  });

  const event = normalizeTraceStep(step);
  assert.equal(event.conceptType, "METHOD_CALL");
  assert.equal(canVisualizeCallStack(event), true);

  const decision = resolveVisualizationStrategy(event);
  assert.equal(decision.mode, "VISUAL_EXECUTION");
  assert.equal(decision.rendererType, "CALL_STACK");
});

test("7. Non-visual or generic step gracefully routes to EXPLANATION_FALLBACK", () => {
  const step = createMockStep({
    eventType: "LINE",
    description: "Complex thread synchronization lock acquire",
  });

  const event = normalizeTraceStep(step);
  const decision = resolveVisualizationStrategy(event);

  assert.equal(decision.mode, "EXPLANATION_FALLBACK");
  assert.equal(decision.rendererType, "NONE");
  assert.equal(decision.confidence, "FALLBACK");
  assert.match(decision.reason, /presenting structured step explanation/);
});

test("8. Program analysis correctly identifies MIXED programs", () => {
  const steps = [
    createMockStep({
      stepIndex: 0,
      eventType: "VARIABLE_DECLARATION",
      symbol: "x",
      currentValue: "10",
      variables: { x: { name: "x", type: "int", value: "10" } },
    }),
    createMockStep({
      stepIndex: 1,
      eventType: "LINE",
      description: "Thread synchronization barrier",
    }),
    createMockStep({
      stepIndex: 2,
      eventType: "OUTPUT_PRINT",
      currentValue: "done",
      output: "done\n",
    }),
  ];

  const events = normalizeTraceSteps(steps);
  const summary = analyzeProgramTraceStrategies(events);

  assert.equal(summary.totalEvents, 3);
  assert.equal(summary.visualEventCount, 2);
  assert.equal(summary.fallbackEventCount, 1);
  assert.equal(summary.primaryMode, "MIXED");
  assert.ok(summary.activeRenderers.includes("VARIABLE"));
  assert.ok(summary.activeRenderers.includes("OUTPUT"));
});
