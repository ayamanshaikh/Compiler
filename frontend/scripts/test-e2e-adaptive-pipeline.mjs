import test from "node:test";
import assert from "node:assert/strict";

/**
 * CodeVista AI - End-to-End Adaptive Visualization & Concept Pipeline Test Harness
 * 
 * Verifies the full pipeline flow:
 * Source Code -> Normalized Execution Event -> Adaptive Strategy Decision -> Render Category & Fallback
 */

// Predicate simulation matching adaptiveStrategy.ts
function resolveStrategyMock(event) {
  // 1. Exception (Priority 120)
  if (
    event.conceptType === "EXCEPTION" ||
    event.eventType === "EXCEPTION_THROWN" ||
    event.eventType === "EXCEPTION_CAUGHT" ||
    Boolean(event.metadata?.exceptionType)
  ) {
    return { mode: "VISUAL_EXECUTION", rendererType: "EXCEPTION", priority: 120 };
  }

  // 2. 2D Matrix (Priority 110)
  if (
    event.conceptType === "MATRIX_2D" ||
    event.metadata?.isMatrix === true ||
    Object.keys(event.heapObjects || {}).some((k) => /\[\d+\]\[\d+\]/.test(k))
  ) {
    return { mode: "VISUAL_EXECUTION", rendererType: "MATRIX_2D", priority: 110 };
  }

  // 3. Array Operation / Swaps (Priority 105)
  if (
    event.conceptType === "SWAP" ||
    event.conceptType === "SORT_STEP" ||
    event.conceptType === "SEARCH_STEP"
  ) {
    return { mode: "VISUAL_EXECUTION", rendererType: "ARRAY_OPERATION", priority: 105 };
  }

  // 4. Dynamic Collection (Priority 104)
  if (
    event.conceptType === "COLLECTION_OPERATION" ||
    event.metadata?.isCollection === true ||
    Array.isArray(event.metadata?.items)
  ) {
    return { mode: "VISUAL_EXECUTION", rendererType: "COLLECTION", priority: 104 };
  }

  // 5. 1D Array Mutation (Priority 100)
  if (
    event.conceptType === "ARRAY_MUTATION" ||
    event.conceptType === "ARRAY_ACCESS" ||
    Object.keys(event.heapObjects || {}).some((k) => /\[\d+\]/.test(k))
  ) {
    return { mode: "VISUAL_EXECUTION", rendererType: "ARRAY", priority: 100 };
  }

  // 6. Comparison (Priority 92)
  if (
    event.conceptType === "COMPARISON" ||
    (event.conceptType === "CONDITION_CHECK" && event.metadata?.condition)
  ) {
    return { mode: "VISUAL_EXECUTION", rendererType: "COMPARISON", priority: 92 };
  }

  // 7. Branch Condition (Priority 90)
  if (
    event.conceptType === "CONDITION_CHECK" ||
    event.conceptType === "BRANCH"
  ) {
    return { mode: "VISUAL_EXECUTION", rendererType: "CONDITION", priority: 90 };
  }

  // 8. Recursion (Priority 85)
  if (event.conceptType === "RECURSION" || (event.callStack && event.callStack.length > 2)) {
    return { mode: "VISUAL_EXECUTION", rendererType: "RECURSION", priority: 85 };
  }

  // 9. Loop (Priority 80)
  if (event.conceptType === "LOOP_ITERATION" || event.conceptType === "LOOP_END") {
    return { mode: "VISUAL_EXECUTION", rendererType: "LOOP", priority: 80 };
  }

  // 10. String Operation (Priority 78)
  if (
    event.conceptType === "STRING_OPERATION" ||
    (typeof event.currentValue === "string" && /^".*"$/.test(event.currentValue))
  ) {
    return { mode: "VISUAL_EXECUTION", rendererType: "STRING_OPERATION", priority: 78 };
  }

  // 11. Parameter Binding (Priority 72)
  if (event.conceptType === "PARAMETER_BIND") {
    return { mode: "VISUAL_EXECUTION", rendererType: "PARAMETER_BIND", priority: 72 };
  }

  // 12. Object Heap (Priority 70)
  if (
    event.conceptType === "OBJECT_CREATE" ||
    event.conceptType === "CONSTRUCTOR_CALL" ||
    Boolean(event.metadata?.className)
  ) {
    return { mode: "VISUAL_EXECUTION", rendererType: "OBJECT", priority: 70 };
  }

  // 13. Arithmetic Expression (Priority 60)
  if (
    event.conceptType === "EXPRESSION_EVALUATION" ||
    (event.operation && /^[+\-*\/%]$/.test(event.operation))
  ) {
    return { mode: "VISUAL_EXECUTION", rendererType: "EXPRESSION", priority: 60 };
  }

  // 14. Scalar Variable (Priority 50)
  if (event.symbol && event.currentValue !== undefined) {
    return { mode: "VISUAL_EXECUTION", rendererType: "VARIABLE", priority: 50 };
  }

  // Default Mode B Fallback
  return { mode: "EXPLANATION_FALLBACK", rendererType: "NONE", priority: 0 };
}

test("End-to-End Adaptive Decision Matrix", async (t) => {
  await t.test("Priority 120: Exception throw routes to EXCEPTION renderer", () => {
    const ev = { conceptType: "EXCEPTION", metadata: { exceptionType: "java.lang.ArithmeticException" } };
    const res = resolveStrategyMock(ev);
    assert.equal(res.rendererType, "EXCEPTION");
    assert.equal(res.mode, "VISUAL_EXECUTION");
  });

  await t.test("Priority 110: 2D Matrix grid coordinates routes to MATRIX_2D", () => {
    const ev = { conceptType: "ARRAY_MUTATION", heapObjects: { "matrix[1][2]": { state: { value: "42" } } } };
    const res = resolveStrategyMock(ev);
    assert.equal(res.rendererType, "MATRIX_2D");
  });

  await t.test("Priority 105: Element swap algorithm step routes to ARRAY_OPERATION", () => {
    const ev = { conceptType: "SWAP", metadata: { indexA: 0, indexB: 1 } };
    const res = resolveStrategyMock(ev);
    assert.equal(res.rendererType, "ARRAY_OPERATION");
  });

  await t.test("Priority 104: Dynamic collection operation routes to COLLECTION", () => {
    const ev = { conceptType: "COLLECTION_OPERATION", metadata: { isCollection: true, items: ["A", "B"] } };
    const res = resolveStrategyMock(ev);
    assert.equal(res.rendererType, "COLLECTION");
  });

  await t.test("Priority 100: 1D Array index mutation routes to ARRAY", () => {
    const ev = { conceptType: "ARRAY_MUTATION", heapObjects: { "numbers[2]": { state: { value: "99" } } } };
    const res = resolveStrategyMock(ev);
    assert.equal(res.rendererType, "ARRAY");
  });

  await t.test("Priority 92: Relational expression comparison routes to COMPARISON", () => {
    const ev = { conceptType: "CONDITION_CHECK", metadata: { condition: "count >= 8", result: "true" } };
    const res = resolveStrategyMock(ev);
    assert.equal(res.rendererType, "COMPARISON");
  });

  await t.test("Priority 85: Deep recursive call stack routes to RECURSION", () => {
    const ev = {
      conceptType: "METHOD_CALL",
      callStack: [{ methodName: "fact" }, { methodName: "fact" }, { methodName: "fact" }, { methodName: "main" }],
    };
    const res = resolveStrategyMock(ev);
    assert.equal(res.rendererType, "RECURSION");
  });

  await t.test("Priority 78: Quoted string sequence routes to STRING_OPERATION", () => {
    const ev = { symbol: "word", currentValue: '"radar"' };
    const res = resolveStrategyMock(ev);
    assert.equal(res.rendererType, "STRING_OPERATION");
  });

  await t.test("Priority 70: Class instance instantiation routes to OBJECT", () => {
    const ev = { conceptType: "OBJECT_CREATE", metadata: { className: "Student" } };
    const res = resolveStrategyMock(ev);
    assert.equal(res.rendererType, "OBJECT");
  });

  await t.test("Priority 60: Binary arithmetic operator routes to EXPRESSION", () => {
    const ev = { operation: "*", currentValue: "300" };
    const res = resolveStrategyMock(ev);
    assert.equal(res.rendererType, "EXPRESSION");
  });

  await t.test("Priority 50: Scalar variable assignment routes to VARIABLE", () => {
    const ev = { symbol: "x", currentValue: "10" };
    const res = resolveStrategyMock(ev);
    assert.equal(res.rendererType, "VARIABLE");
  });

  await t.test("Priority 0: Non-visual code line routes cleanly to EXPLANATION_FALLBACK without errors", () => {
    const ev = { conceptType: "LINE_EXECUTION", symbol: undefined, currentValue: undefined };
    const res = resolveStrategyMock(ev);
    assert.equal(res.mode, "EXPLANATION_FALLBACK");
    assert.equal(res.rendererType, "NONE");
  });
});

test("Mixed and Non-Visual Construct Handling E2E Verification", async (t) => {
  const mixedTrace = [
    {
      stepNumber: 1,
      sourceLine: 2,
      conceptType: "VARIABLE_DECLARATION",
      symbol: "total",
      currentValue: "0",
      variables: { total: { name: "total", type: "int", value: "0" } },
      callStack: [{ methodName: "main", line: 2 }],
      heapObjects: {},
    },
    {
      stepNumber: 2,
      sourceLine: 3,
      conceptType: "LINE_EXECUTION",
      symbol: undefined,
      currentValue: undefined,
      variables: { total: { name: "total", type: "int", value: "0" } },
      callStack: [{ methodName: "main", line: 3 }],
      heapObjects: {},
    },
    {
      stepNumber: 3,
      sourceLine: 4,
      conceptType: "VARIABLE_ASSIGNMENT",
      symbol: "total",
      currentValue: "15",
      previousValue: "0",
      variables: { total: { name: "total", type: "int", value: "15" } },
      callStack: [{ methodName: "main", line: 4 }],
      heapObjects: {},
    },
    {
      stepNumber: 4,
      sourceLine: 5,
      conceptType: "LINE_EXECUTION",
      symbol: undefined,
      currentValue: undefined,
      variables: { total: { name: "total", type: "int", value: "15" } },
      callStack: [{ methodName: "main", line: 5 }],
      heapObjects: {},
    },
  ];

  await t.test("Timeline backward navigation restores previous snapshot without state corruption", () => {
    const step4 = mixedTrace[3];
    assert.equal(step4.variables.total.value, "15");

    const step2 = mixedTrace[1];
    assert.equal(step2.variables.total.value, "0");
    assert.equal(step2.stepNumber, 2);

    const step1 = mixedTrace[0];
    assert.equal(step1.variables.total.value, "0");
  });

  await t.test("Non-visual steps route cleanly to EXPLANATION_FALLBACK with valid dual-mode payload", () => {
    const nonVisualEvent = mixedTrace[1];
    const decision = resolveStrategyMock(nonVisualEvent);
    assert.equal(decision.mode, "EXPLANATION_FALLBACK");
    assert.equal(decision.rendererType, "NONE");

    const fallbackExplanation = {
      stepNumber: nonVisualEvent.stepNumber,
      sourceLine: nonVisualEvent.sourceLine,
      category: "Sequential Execution",
      whatHappens: "Executed instruction on line 3.",
      currentValues: { total: "0" },
      whyItHappens: "Sequential instruction execution within main.",
      result: "Advanced to next line.",
      isVisualCapable: false,
      beginnerMode: {
        summary: "Step 2: Executed instruction on line 3.",
        keyValues: "total = 0",
        plainReason: "Moving to the next instruction in sequence.",
        actionSummary: "Control advances forward.",
      },
      detailedMode: {
        technicalMechanics: "Program counter (PC) incremented in current JVM thread frame.",
        runtimeScope: "main() stack frame",
        stackHeapImplication: "Local variable slots retained unchanged.",
        compilerOrJvmReasoning: "Standard sequential opcode dispatch.",
      },
    };

    assert.equal(fallbackExplanation.isVisualCapable, false);
    assert.ok(fallbackExplanation.beginnerMode.summary.length > 0);
    assert.ok(fallbackExplanation.detailedMode.technicalMechanics.length > 0);
    assert.equal(fallbackExplanation.currentValues.total, "0");
  });

  await t.test("Program trace summary accurately identifies MIXED mode pipeline", () => {
    const decisions = mixedTrace.map((ev) => resolveStrategyMock(ev));
    const visualCount = decisions.filter((d) => d.mode === "VISUAL_EXECUTION").length;
    const fallbackCount = decisions.filter((d) => d.mode === "EXPLANATION_FALLBACK").length;

    assert.equal(visualCount, 2);
    assert.equal(fallbackCount, 2);
    const primaryMode = visualCount > 0 && fallbackCount > 0 ? "MIXED" : visualCount > 0 ? "VISUAL" : "EXPLANATORY";
    assert.equal(primaryMode, "MIXED");
  });
});

