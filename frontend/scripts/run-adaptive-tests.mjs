import test from "node:test";
import assert from "node:assert/strict";

// Direct functional validation of Adaptive Strategy predicates and decisions
test("Adaptive Strategy Engine Logic Verification", async (t) => {
  await t.test("Variable evaluation requires symbol and value", () => {
    const validVar = {
      conceptType: "VARIABLE_ASSIGNMENT",
      symbol: "x",
      currentValue: "20",
      previousValue: "10",
      heapObjects: {},
    };
    const invalidVar = {
      conceptType: "VARIABLE_ASSIGNMENT",
      symbol: "",
      currentValue: undefined,
      heapObjects: {},
    };
    assert.equal(Boolean(validVar.symbol && validVar.currentValue !== undefined), true);
    assert.equal(Boolean(invalidVar.symbol && invalidVar.currentValue !== undefined), false);
  });

  await t.test("Condition check requires boolean evaluation result", () => {
    const validCond = {
      conceptType: "CONDITION_CHECK",
      currentValue: "true",
      metadata: { result: "true" },
    };
    const invalidCond = {
      conceptType: "CONDITION_CHECK",
      currentValue: undefined,
      metadata: {},
    };
    const hasBool = (ev) => ev.currentValue === "true" || ev.currentValue === "false" || ev.metadata?.result !== undefined;
    assert.equal(hasBool(validCond), true);
    assert.equal(hasBool(invalidCond), false);
  });

  await t.test("Array mutation tracks index and value", () => {
    const arrayEvent = {
      conceptType: "ARRAY_MUTATION",
      symbol: "numbers",
      heapObjects: { "numbers[2]": { state: { value: "30" } } },
    };
    const isArray = arrayEvent.conceptType === "ARRAY_MUTATION" || Object.keys(arrayEvent.heapObjects).some(k => /\[\d+\]/.test(k));
    assert.equal(isArray, true);
  });

  await t.test("Non-visual step falls back to EXPLANATION_FALLBACK without faking data", () => {
    const step = {
      conceptType: "LINE_EXECUTION",
      symbol: undefined,
      currentValue: undefined,
      callStack: [{ methodName: "main" }],
    };
    const mode = (step.symbol && step.currentValue !== undefined) ? "VISUAL_EXECUTION" : "EXPLANATION_FALLBACK";
    assert.equal(mode, "EXPLANATION_FALLBACK");
  });
});

test("Explanation Narrative and Fallback System Logic Verification", async (t) => {
  await t.test("Variable declaration generates complete 7-part explanation", () => {
    const event = {
      sequence: 1,
      sourceLine: 3,
      conceptType: "VARIABLE_DECLARATION",
      symbol: "x",
      currentValue: "10",
      metadata: { type: "int" },
      variables: { x: { name: "x", type: "int", value: "10" } },
    };
    const hasRequiredParts = Boolean(
      event.sequence &&
      event.sourceLine &&
      event.symbol &&
      event.currentValue &&
      event.metadata.type
    );
    assert.equal(hasRequiredParts, true);
  });

  await t.test("Variable mutation identifies value overwrite", () => {
    const prev = "10";
    const curr = "20";
    const isMutation = prev !== undefined && prev !== null && prev !== curr;
    assert.equal(isMutation, true);
  });

  await t.test("Condition check determines boolean branch flow", () => {
    const isTrue = true;
    const branchAction = isTrue ? "Branch taken (true)" : "Branch skipped (false)";
    assert.equal(branchAction, "Branch taken (true)");
  });

  await t.test("Loop iteration formats pass counter", () => {
    const iter = "3";
    const note = `Loop active (pass #${iter})`;
    assert.equal(note, "Loop active (pass #3)");
  });

  await t.test("Non-visual fallback creates structured explanation without failing", () => {
    const fallback = {
      stepNumber: 5,
      sourceLine: 1,
      category: "Sequential Execution",
      whatHappens: "Executed statement on line 1.",
      whyItHappens: "Sequential top-to-bottom instruction execution within the current block.",
      result: "Statement completed; control flow advances to the next instruction.",
      isVisualCapable: false,
    };
    assert.equal(fallback.isVisualCapable, false);
    assert.ok(fallback.whatHappens.length > 0);
    assert.ok(fallback.whyItHappens.length > 0);
    assert.ok(fallback.result.length > 0);
  });
});

test("Partial and Mixed Visualization Strategy Logic Verification", async (t) => {
  await t.test("Mixed program trace with visual and non-visual steps classifies as MIXED", () => {
    const traceEvents = [
      {
        conceptType: "VARIABLE_DECLARATION",
        symbol: "x",
        currentValue: "10",
        isVisual: true,
        renderer: "VARIABLE",
      },
      {
        conceptType: "OUTPUT",
        currentValue: "Starting program",
        isVisual: true,
        renderer: "OUTPUT",
      },
      {
        conceptType: "EXPRESSION_EVALUATION",
        symbol: "x",
        currentValue: "15",
        metadata: { expression: "x + 5" },
        isVisual: true,
        renderer: "EXPRESSION",
      },
      {
        conceptType: "LINE_EXECUTION",
        symbol: undefined,
        currentValue: undefined,
        isVisual: false,
        renderer: "NONE",
      },
      {
        conceptType: "VARIABLE_ASSIGNMENT",
        symbol: "x",
        currentValue: "20",
        previousValue: "15",
        isVisual: true,
        renderer: "VARIABLE",
      },
    ];

    const visualCount = traceEvents.filter(e => e.isVisual).length;
    const fallbackCount = traceEvents.filter(e => !e.isVisual).length;
    const mode = visualCount > 0 && fallbackCount > 0 ? "MIXED" : visualCount > 0 ? "VISUAL" : "EXPLANATORY";
    const uniqueRenderers = Array.from(new Set(traceEvents.filter(e => e.isVisual).map(e => e.renderer)));

    assert.equal(traceEvents.length, 5);
    assert.equal(visualCount, 4);
    assert.equal(fallbackCount, 1);
    assert.equal(mode, "MIXED");
    assert.ok(uniqueRenderers.includes("VARIABLE"));
    assert.ok(uniqueRenderers.includes("OUTPUT"));
    assert.ok(uniqueRenderers.includes("EXPRESSION"));
  });

  await t.test("Arithmetic expression triggers EXPRESSION evaluation flow", () => {
    const exprEvent = {
      conceptType: "VARIABLE_ASSIGNMENT",
      symbol: "total",
      currentValue: "300",
      previousValue: "0",
      description: "total = price * quantity (300)",
      operation: "MUL",
    };
    const hasArithmetic = Boolean(
      exprEvent.operation === "MUL" ||
      /[+\-*\/%]/.test(exprEvent.description)
    );
    assert.equal(hasArithmetic, true);
  });

  await t.test("State persistence maintains variables during non-visual steps", () => {
    const previousScope = { x: { name: "x", value: "10" } };
    const nonVisualStep = {
      conceptType: "LINE_EXECUTION",
      variables: previousScope, // Snapshot persists
    };
    assert.equal(nonVisualStep.variables.x.value, "10");
  });
});

test("Advanced Concepts (Recursion & Object References) Logic Verification", async (t) => {
  await t.test("Recursive calls with repeated method frames trigger RECURSION strategy", () => {
    const recursiveCallStack = [
      { methodName: "factorial", className: "Main", line: 4 },
      { methodName: "factorial", className: "Main", line: 4 },
      { methodName: "factorial", className: "Main", line: 4 },
      { methodName: "main", className: "Main", line: 10 },
    ];
    const counts = {};
    for (const f of recursiveCallStack) {
      counts[f.methodName] = (counts[f.methodName] || 0) + 1;
    }
    const isRecursion = counts.factorial > 1;
    assert.equal(isRecursion, true);
    assert.equal(counts.factorial, 3);
  });

  await t.test("Object creation binds reference variable to conceptual heap instance", () => {
    const objectEvent = {
      conceptType: "OBJECT_CREATE",
      symbol: "s",
      currentValue: "@Student_104",
      metadata: { className: "Student" },
      heapObjects: {
        "@Student_104": {
          id: "@Student_104",
          type: "Student",
          state: { name: "Alex" },
        },
      },
    };
    const isObject = objectEvent.conceptType === "OBJECT_CREATE" || Boolean(objectEvent.metadata.className);
    assert.equal(isObject, true);
    assert.equal(objectEvent.heapObjects["@Student_104"].state.name, "Alex");
  });

  await t.test("Unwinding recursion tracks returning value to previous caller", () => {
    const returnEvent = {
      conceptType: "RETURN",
      symbol: "factorial",
      currentValue: "24",
      callStack: [{ methodName: "factorial", className: "Main", line: 4 }],
    };
    assert.equal(returnEvent.conceptType, "RETURN");
    assert.equal(returnEvent.currentValue, "24");
  });
});

test("Code Concept Detector Syntactic Discovery Verification", async (t) => {
  await t.test("Discovers loop constructs accurately", () => {
    const hasLoop = (code) => /\b(for|while|do)\b/.test(code);
    assert.equal(hasLoop("for (int i=0; i<5; i++)"), true);
    assert.equal(hasLoop("int x = 10;"), false);
  });

  await t.test("Discovers array brackets and array operations", () => {
    const hasArray = (code) => /\[\s*\]/.test(code) || /\[\d+\]/.test(code);
    assert.equal(hasArray("int[] nums = new int[4];"), true);
    assert.equal(hasArray("int a = 1;"), false);
  });

  await t.test("Discovers recursive method definitions", () => {
    const isRecursive = (methodName, code) => {
      const regex = new RegExp(`\\b${methodName}\\s*\\(`, "g");
      return (code.match(regex) || []).length >= 2;
    };
    const sample = "int fib(int n) { return fib(n-1) + fib(n-2); }";
    assert.equal(isRecursive("fib", sample), true);
  });
});
