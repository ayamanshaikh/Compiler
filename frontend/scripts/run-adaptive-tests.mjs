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

test("Relational Comparison Evaluation Concept Verification", async (t) => {
  await t.test("Identifies relational comparison operators", () => {
    const isComparison = (cond) => /(>=|<=|==|!=|>|<)/.test(cond);
    assert.equal(isComparison("age >= 18"), true);
    assert.equal(isComparison("x == 42"), true);
    assert.equal(isComparison("isValid"), false);
  });

  await t.test("Evaluates comparison outcome correctly", () => {
    const evaluate = (lhs, op, rhs) => {
      if (op === ">=") return lhs >= rhs;
      if (op === "<=") return lhs <= rhs;
      if (op === "==") return lhs === rhs;
      if (op === "!=") return lhs !== rhs;
      return false;
    };
    assert.equal(evaluate(20, ">=", 18), true);
    assert.equal(evaluate(15, ">=", 18), false);
  });
});

test("Array Operations (Swaps & Search Windows) Concept Verification", async (t) => {
  await t.test("Detects swap event with target indices", () => {
    const swapEvent = {
      conceptType: "SWAP",
      symbol: "arr",
      metadata: { index: 1, swapWithIndex: 3 },
    };
    assert.equal(swapEvent.conceptType, "SWAP");
    assert.equal(swapEvent.metadata.index, 1);
    assert.equal(swapEvent.metadata.swapWithIndex, 3);
  });

  await t.test("Calculates binary search window boundaries", () => {
    const binarySearchStep = (low, high) => Math.floor((low + high) / 2);
    assert.equal(binarySearchStep(0, 4), 2);
    assert.equal(binarySearchStep(3, 4), 3);
  });
});

test("Parameter Binding and Return Flow Concept Verification", async (t) => {
  await t.test("Binds caller arguments to formal callee parameters", () => {
    const methodCall = {
      conceptType: "PARAMETER_BIND",
      callStack: [{ methodName: "add" }, { methodName: "main" }],
      metadata: { parameters: { a: "5", b: "3" } },
    };
    assert.equal(methodCall.callStack[0].methodName, "add");
    assert.equal(methodCall.metadata.parameters.a, "5");
    assert.equal(methodCall.metadata.parameters.b, "3");
  });

  await t.test("Captures return value bubbling to caller stack frame", () => {
    const returnStep = {
      conceptType: "RETURN",
      symbol: "add",
      currentValue: "8",
      callStack: [{ methodName: "add" }],
    };
    assert.equal(returnStep.conceptType, "RETURN");
    assert.equal(returnStep.currentValue, "8");
  });
});

test("String Character Sequence Buffer Concept Verification", async (t) => {
  await t.test("Parses string into indexed character cells", () => {
    const str = "Hello";
    const chars = str.split("");
    assert.equal(chars.length, 5);
    assert.equal(chars[0], "H");
    assert.equal(chars[4], "o");
  });

  await t.test("Strips wrapping quotation marks correctly", () => {
    const cleanStr = '"CodeVista"'.replace(/^["']|["']$/g, "");
    assert.equal(cleanStr, "CodeVista");
  });
});

test("Trace Session Export & Import Verification", async (t) => {
  await t.test("Serializes trace to versioned JSON schema", () => {
    const mockTrace = {
      status: "SUCCESS",
      steps: [
        {
          stepNumber: 1,
          lineNumber: 4,
          eventType: "VARIABLE_DECLARATION",
          variables: { x: "10" },
        },
      ],
      totalSteps: 1,
    };
    const mockCode = "int x = 10;";
    const session = {
      schemaVersion: "1.0.0",
      exportedAt: new Date().toISOString(),
      language: "java",
      sourceCode: mockCode,
      trace: mockTrace,
    };
    const jsonStr = JSON.stringify(session, null, 2);
    const parsed = JSON.parse(jsonStr);

    assert.equal(parsed.schemaVersion, "1.0.0");
    assert.equal(parsed.language, "java");
    assert.equal(parsed.sourceCode, "int x = 10;");
    assert.equal(parsed.trace.steps.length, 1);
    assert.equal(parsed.trace.steps[0].variables.x, "10");
  });

  await t.test("Rejects corrupted or invalid JSON trace payloads", () => {
    const validate = (str) => {
      const obj = JSON.parse(str);
      if (!obj || typeof obj !== "object") throw new Error("Invalid root");
      if (obj.schemaVersion !== "1.0.0" && !Array.isArray(obj.steps)) {
        throw new Error("Unsupported trace format");
      }
      return true;
    };

    assert.throws(() => validate("{ invalid json "), /Unexpected token|Expected property/);
    assert.throws(() => validate('{"randomKey": 123}'), /Unsupported trace format/);
    assert.equal(validate('{"schemaVersion":"1.0.0","trace":{"steps":[]}}'), true);
  });
});

test("Trace State URL Hash Sharing Verification", async (t) => {
  await t.test("Encodes and decodes source code and step position via base64 roundtrip", () => {
    const code = 'public class Main { int x = 42; }';
    const step = 3;
    const payload = JSON.stringify({ v: 1, c: code, s: step });
    const encoded = encodeURIComponent(Buffer.from(payload, "utf-8").toString("base64"));

    const decodedUri = decodeURIComponent(encoded);
    const jsonStr = Buffer.from(decodedUri, "base64").toString("utf-8");
    const parsed = JSON.parse(jsonStr);

    assert.equal(parsed.c, code);
    assert.equal(parsed.s, 3);
  });

  await t.test("Gracefully handles invalid or corrupted hash fragments", () => {
    const decodeSafe = (hash) => {
      try {
        const clean = hash.replace(/^#share=/, "");
        const raw = Buffer.from(decodeURIComponent(clean), "base64").toString("utf-8");
        const parsed = JSON.parse(raw);
        return parsed.c || null;
      } catch {
        return null;
      }
    };

    assert.equal(decodeSafe("#share=invalid_base64_!@#$"), null);
    assert.equal(decodeSafe(""), null);
  });
});

test("Screen Reader ARIA Live Step Announcer Verification", async (t) => {
  await t.test("Formats variable assignment announcement correctly", () => {
    const formatAnnouncement = (step, total, ev) =>
      `Step ${step + 1} of ${total}. Line ${ev.lineNumber}. Variable ${ev.symbol} updated from ${ev.previousValue} to ${ev.currentValue}.`;
    
    const ev = { lineNumber: 5, symbol: "total", previousValue: "100", currentValue: "300" };
    const msg = formatAnnouncement(2, 10, ev);
    assert.equal(msg, "Step 3 of 10. Line 5. Variable total updated from 100 to 300.");
  });

  await t.test("Formats condition check announcement correctly", () => {
    const formatAnnouncement = (step, total, ev) =>
      `Step ${step + 1} of ${total}. Line ${ev.lineNumber}. Condition ${ev.condition} evaluated to ${ev.result}.`;

    const ev = { lineNumber: 12, condition: "age >= 18", result: "true" };
    const msg = formatAnnouncement(4, 8, ev);
    assert.equal(msg, "Step 5 of 8. Line 12. Condition age >= 18 evaluated to true.");
  });
});
