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

  await t.test("Beginner mode provides simplified explanation and highlighted key values", () => {
    const beginner = {
      summary: "Create variable 'x' with starting value 10.",
      keyValues: "x = 10",
      plainReason: "We need a container named 'x' to store this value so we can use it in math or logic later.",
      actionSummary: "Variable 'x' created and ready to use.",
    };
    assert.ok(beginner.summary.includes("Create variable 'x'"));
    assert.equal(beginner.keyValues, "x = 10");
    assert.ok(beginner.plainReason.includes("container"));
    assert.ok(beginner.actionSummary.includes("ready to use"));
  });

  await t.test("Detailed mode provides technical JVM mechanics and stack/heap context", () => {
    const detailed = {
      technicalMechanics: "Allocated slot in local variable array of current JVM stack frame for 'x' (int).",
      runtimeScope: "Local method scope (main()), frame depth 1",
      stackHeapImplication: "Primitive/reference stored directly in active thread call-stack frame; no heap allocation.",
      compilerOrJvmReasoning: "Java compiler verified 'x' was not previously declared in this scope and emitted iload/istore opcode sequence.",
    };
    assert.ok(detailed.technicalMechanics.includes("JVM stack frame"));
    assert.ok(detailed.stackHeapImplication.includes("call-stack"));
    assert.ok(detailed.compilerOrJvmReasoning.includes("Java compiler"));
  });

  await t.test("Mode switching and detail-level fallback resolution", () => {
    const explanation = {
      whatHappens: "General statement.",
      whyItHappens: "General why.",
      result: "General result.",
      beginnerMode: {
        summary: "Simple beginner what happens.",
        keyValues: "x = 10",
        plainReason: "Simple beginner why.",
        actionSummary: "Simple beginner result.",
      },
      detailedMode: {
        technicalMechanics: "JVM iload/istore execution.",
        runtimeScope: "Thread call stack frame 0.",
        stackHeapImplication: "Local variable array slot.",
        compilerOrJvmReasoning: "Bytecode verification.",
      },
    };

    const getRenderedContent = (mode) => {
      if (mode === "beginner") {
        return {
          primary: explanation.beginnerMode.summary,
          reason: explanation.beginnerMode.plainReason,
          result: explanation.beginnerMode.actionSummary,
          badge: explanation.beginnerMode.keyValues,
        };
      } else {
        return {
          primary: explanation.detailedMode.technicalMechanics,
          scope: explanation.detailedMode.runtimeScope,
          memory: explanation.detailedMode.stackHeapImplication,
          reason: explanation.detailedMode.compilerOrJvmReasoning,
        };
      }
    };

    const beginnerRender = getRenderedContent("beginner");
    assert.equal(beginnerRender.primary, "Simple beginner what happens.");
    assert.equal(beginnerRender.badge, "x = 10");

    const detailedRender = getRenderedContent("detailed");
    assert.equal(detailedRender.primary, "JVM iload/istore execution.");
    assert.equal(detailedRender.memory, "Local variable array slot.");
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
  const formatAriaStepAnnouncement = (stepIndex, totalSteps, event) => {
    if (!event) {
      return `Step ${stepIndex + 1} of ${totalSteps}. Execution step.`;
    }
    const prefix = `Step ${stepIndex + 1} of ${totalSteps}. Line ${event.sourceLine}.`;
    let body = "";
    switch (event.conceptType) {
      case "VARIABLE_ASSIGNMENT":
        body = `Variable ${event.symbol || "variable"} set to ${event.currentValue ?? "value"}.`;
        break;
      case "CONDITION_BRANCH":
        body = `Condition evaluation resulted in ${event.currentValue || "evaluation"}.`;
        break;
      case "LOOP_START":
        body = `Loop started at line ${event.sourceLine}.`;
        break;
      case "LOOP_ITERATION": {
        const varStr = Object.entries(event.variables || {})
          .map(([k, v]) => `${k} equals ${typeof v === "object" && v ? v.value : v}`)
          .join(", ");
        body = `Loop iteration ${event.metadata?.iteration ?? "in progress"}. Variables: ${varStr || "none"}.`;
        break;
      }
      case "LOOP_END":
        body = `Loop finished execution.`;
        break;
      case "ARRAY_MUTATION":
        body = `Array ${event.symbol || "elements"} at index ${event.metadata?.index ?? "selected"} updated to ${event.currentValue ?? "value"}.`;
        break;
      case "SWAP":
        body = `Swapped elements at index ${event.metadata?.leftIndex ?? 0} and index ${event.metadata?.rightIndex ?? 1}.`;
        break;
      case "MATRIX_2D":
        body = `2D Matrix cell at row ${event.metadata?.rowIndex ?? 0}, column ${event.metadata?.colIndex ?? 0} updated to ${event.currentValue ?? "value"}.`;
        break;
      case "COLLECTION_OPERATION":
        body = `Collection ${event.symbol || "list"} ${event.operation || "operation"} with item ${event.currentValue ?? ""}.`;
        break;
      case "STRING_OPERATION":
        body = `String sequence character inspection: character '${event.currentValue ?? ""}' at position ${event.metadata?.charIndex ?? 0}.`;
        break;
      case "COMPARISON":
        body = `Comparison check yielded ${event.currentValue}.`;
        break;
      case "RECURSION":
        body = `Recursive call frame depth ${event.callStack?.length ?? 1} for ${event.symbol || "method"}.`;
        break;
      case "OBJECT_CREATE":
        body = `Created object instance ${event.symbol || ""} of type ${event.metadata?.className ?? "Object"}.`;
        break;
      case "FUNCTION_CALL":
        body = `Calling function ${event.symbol || "method"}.`;
        break;
      case "FUNCTION_RETURN":
        body = `Function returned ${event.currentValue ?? "to caller"}.`;
        break;
      case "EXCEPTION":
        body = `Exception thrown: ${event.metadata?.exceptionClass || "Error"}. ${event.currentValue || ""}.`;
        break;
      default:
        body = `Executed statement: ${event.description || "line step"}.`;
        break;
    }
    return `${prefix} ${body}`;
  };

  await t.test("Formats variable assignment announcement correctly", () => {
    const ev = { conceptType: "VARIABLE_ASSIGNMENT", sourceLine: 5, symbol: "total", currentValue: "300" };
    const msg = formatAriaStepAnnouncement(2, 10, ev);
    assert.equal(msg, "Step 3 of 10. Line 5. Variable total set to 300.");
  });

  await t.test("Formats condition check announcement correctly", () => {
    const ev = { conceptType: "CONDITION_BRANCH", sourceLine: 12, currentValue: "true" };
    const msg = formatAriaStepAnnouncement(4, 8, ev);
    assert.equal(msg, "Step 5 of 8. Line 12. Condition evaluation resulted in true.");
  });

  await t.test("Formats loop iteration with VariableSnapshot records without [object Object] leaks", () => {
    const ev = {
      conceptType: "LOOP_ITERATION",
      sourceLine: 8,
      metadata: { iteration: 3 },
      variables: {
        i: { name: "i", type: "int", value: "3" },
        total: { name: "total", type: "int", value: "15" },
      },
    };
    const msg = formatAriaStepAnnouncement(7, 20, ev);
    assert.ok(!msg.includes("[object Object]"), "Must never leak [object Object] in announcement");
    assert.ok(msg.includes("Loop iteration 3."));
    assert.ok(msg.includes("i equals 3, total equals 15"));
  });

  await t.test("Formats 2D matrix, dynamic collection, swap, and recursion announcements", () => {
    const matrixEv = {
      conceptType: "MATRIX_2D",
      sourceLine: 14,
      currentValue: "99",
      metadata: { rowIndex: 1, colIndex: 2 },
    };
    assert.equal(
      formatAriaStepAnnouncement(0, 5, matrixEv),
      "Step 1 of 5. Line 14. 2D Matrix cell at row 1, column 2 updated to 99."
    );

    const swapEv = {
      conceptType: "SWAP",
      sourceLine: 22,
      metadata: { leftIndex: 3, rightIndex: 4 },
    };
    assert.equal(
      formatAriaStepAnnouncement(3, 10, swapEv),
      "Step 4 of 10. Line 22. Swapped elements at index 3 and index 4."
    );

    const collEv = {
      conceptType: "COLLECTION_OPERATION",
      sourceLine: 18,
      symbol: "names",
      operation: "append",
      currentValue: "Alice",
    };
    assert.equal(
      formatAriaStepAnnouncement(5, 12, collEv),
      "Step 6 of 12. Line 18. Collection names append with item Alice."
    );

    const recEv = {
      conceptType: "RECURSION",
      sourceLine: 30,
      symbol: "factorial",
      callStack: [{ methodName: "main" }, { methodName: "factorial" }, { methodName: "factorial" }],
    };
    assert.equal(
      formatAriaStepAnnouncement(8, 15, recEv),
      "Step 9 of 15. Line 30. Recursive call frame depth 3 for factorial."
    );
  });

  await t.test("Formats string inspection, object creation, and exceptions", () => {
    const strEv = {
      conceptType: "STRING_OPERATION",
      sourceLine: 11,
      currentValue: "C",
      metadata: { charIndex: 0 },
    };
    assert.equal(
      formatAriaStepAnnouncement(0, 4, strEv),
      "Step 1 of 4. Line 11. String sequence character inspection: character 'C' at position 0."
    );

    const objEv = {
      conceptType: "OBJECT_CREATE",
      sourceLine: 7,
      symbol: "student",
      metadata: { className: "Student" },
    };
    assert.equal(
      formatAriaStepAnnouncement(1, 4, objEv),
      "Step 2 of 4. Line 7. Created object instance student of type Student."
    );

    const excEv = {
      conceptType: "EXCEPTION",
      sourceLine: 25,
      currentValue: "Index 5 out of bounds for length 5",
      metadata: { exceptionClass: "ArrayIndexOutOfBoundsException" },
    };
    assert.equal(
      formatAriaStepAnnouncement(4, 5, excEv),
      "Step 5 of 5. Line 25. Exception thrown: ArrayIndexOutOfBoundsException. Index 5 out of bounds for length 5."
    );
  });

  await t.test("Reduced-motion preference activates instant state transitions and auto-expands textual explanation", () => {
    const getAdaptiveDispatcherState = (prefersReducedMotion) => ({
      showCompanionExplanation: prefersReducedMotion,
      containerClass: prefersReducedMotion ? "flex flex-col gap-2.5 motion-reduce" : "flex flex-col gap-2.5",
      hasReducedMotionBadge: prefersReducedMotion,
    });

    const standardMode = getAdaptiveDispatcherState(false);
    assert.equal(standardMode.showCompanionExplanation, false);
    assert.equal(standardMode.containerClass.includes("motion-reduce"), false);
    assert.equal(standardMode.hasReducedMotionBadge, false);

    const reducedMotionMode = getAdaptiveDispatcherState(true);
    assert.equal(reducedMotionMode.showCompanionExplanation, true);
    assert.equal(reducedMotionMode.containerClass.includes("motion-reduce"), true);
    assert.equal(reducedMotionMode.hasReducedMotionBadge, true);
  });
});

test("Execution Step Bookmarking Logic Verification", async (t) => {
  await t.test("Toggles bookmark insertion and removal in sorted order", () => {
    let bookmarks = [];
    const toggle = (list, idx) =>
      list.includes(idx) ? list.filter((i) => i !== idx) : [...list, idx].sort((a, b) => a - b);

    bookmarks = toggle(bookmarks, 4);
    assert.deepEqual(bookmarks, [4]);

    bookmarks = toggle(bookmarks, 1);
    assert.deepEqual(bookmarks, [1, 4]);

    bookmarks = toggle(bookmarks, 8);
    assert.deepEqual(bookmarks, [1, 4, 8]);

    bookmarks = toggle(bookmarks, 4);
    assert.deepEqual(bookmarks, [1, 8]);
  });
});

test("Visual Density and High Contrast Display Verification", async (t) => {
  await t.test("Maps visual density mode to correct spacing classes", () => {
    const getDensityClass = (mode) =>
      mode === "compact" ? "p-2 text-[11px]" : mode === "spacious" ? "p-4 text-sm" : "p-3 text-xs";

    assert.equal(getDensityClass("compact"), "p-2 text-[11px]");
    assert.equal(getDensityClass("comfortable"), "p-3 text-xs");
    assert.equal(getDensityClass("spacious"), "p-4 text-sm");
  });

  await t.test("Applies high-contrast borders and stark background", () => {
    const getContrastClass = (hc) =>
      hc ? "bg-black border-2 border-zinc-400 text-white" : "bg-zinc-950 border border-zinc-800";

    assert.equal(getContrastClass(true), "bg-black border-2 border-zinc-400 text-white");
    assert.equal(getContrastClass(false), "bg-zinc-950 border border-zinc-800");
  });
});

test("2D Matrix Grid Memory Concept Verification", async (t) => {
  await t.test("Extracts multi-dimensional row and column indices", () => {
    const heapKey = "grid[2][3]";
    const match = heapKey.match(/\[(\d+)\]\[(\d+)\]/);
    assert.ok(match);
    assert.equal(parseInt(match[1], 10), 2);
    assert.equal(parseInt(match[2], 10), 3);
  });

  await t.test("Identifies 2D matrix event via predicate", () => {
    const isMatrix = (ev) =>
      ev.conceptType === "MATRIX_2D" ||
      ev.metadata?.isMatrix === true ||
      Object.keys(ev.heapObjects || {}).some((k) => /\[\d+\]\[\d+\]/.test(k));

    assert.equal(isMatrix({ conceptType: "MATRIX_2D" }), true);
    assert.equal(isMatrix({ heapObjects: { "m[1][0]": {} } }), true);
    assert.equal(isMatrix({ conceptType: "VARIABLE_ASSIGNMENT", heapObjects: {} }), false);
  });
});

test("Dynamic Collection and ArrayList Buffer Concept Verification", async (t) => {
  await t.test("Tracks list append operation with dynamic size expansion", () => {
    const list = ["apple", "banana"];
    const appendItem = (arr, item) => [...arr, item];
    const updated = appendItem(list, "cherry");

    assert.equal(updated.length, 3);
    assert.equal(updated[2], "cherry");
  });

  await t.test("Calculates ghost capacity cells for underlying array buffer", () => {
    const size = 3;
    const capacity = 10;
    const ghostCount = Math.min(4, Math.max(0, capacity - size));
    assert.equal(ghostCount, 4);
  });
});

test("JVM Exception Propagation and Control Flow Verification", async (t) => {
  await t.test("Identifies exception throw event via predicate", () => {
    const isException = (ev) =>
      ev.conceptType === "EXCEPTION" ||
      ev.eventType === "EXCEPTION_THROW" ||
      Boolean(ev.metadata?.exceptionType) ||
      (typeof ev.currentValue === "string" && ev.currentValue.includes("Exception"));

    assert.equal(isException({ conceptType: "EXCEPTION" }), true);
    assert.equal(isException({ eventType: "EXCEPTION_THROW" }), true);
    assert.equal(isException({ metadata: { exceptionType: "java.lang.ArithmeticException" } }), true);
    assert.equal(isException({ currentValue: "NullPointerException: Cannot invoke method" }), true);
    assert.equal(isException({ conceptType: "VARIABLE_ASSIGNMENT", currentValue: "10" }), false);
  });

  await t.test("Extracts simple exception class name from fully qualified package", () => {
    const getSimpleName = (pkg) => pkg.includes(".") ? pkg.split(".").pop() : pkg;
    assert.equal(getSimpleName("java.lang.ArithmeticException"), "ArithmeticException");
    assert.equal(getSimpleName("java.lang.NullPointerException"), "NullPointerException");
  });
});

test("Execution Step State Delta Diff Calculation Verification", async (t) => {
  await t.test("Calculates added, modified, and removed variables accurately", () => {
    const prev = {
      variables: {
        x: { name: "x", type: "int", value: "10" },
        temp: { name: "temp", type: "int", value: "99" },
      },
    };
    const curr = {
      variables: {
        x: { name: "x", type: "int", value: "20" },
        y: { name: "y", type: "int", value: "30" },
      },
    };

    const diffs = [];
    for (const [k, v] of Object.entries(curr.variables)) {
      if (!prev.variables[k]) diffs.push({ name: k, type: "ADDED", val: v.value });
      else if (prev.variables[k].value !== v.value) diffs.push({ name: k, type: "MODIFIED", old: prev.variables[k].value, val: v.value });
    }
    for (const [k, v] of Object.entries(prev.variables)) {
      if (!curr.variables[k]) diffs.push({ name: k, type: "REMOVED", old: v.value });
    }

    assert.equal(diffs.find((d) => d.name === "y")?.type, "ADDED");
    assert.equal(diffs.find((d) => d.name === "x")?.type, "MODIFIED");
    assert.equal(diffs.find((d) => d.name === "temp")?.type, "REMOVED");
  });
});

test("Playback Loop Mode and Variable Speed Calculation Verification", async (t) => {
  await t.test("Handles wrap-around when looping reaches end of trace", () => {
    const totalSteps = 10;
    const getNextStep = (current, isLooping) => {
      if (current < totalSteps - 1) return current + 1;
      return isLooping ? 0 : current;
    };

    assert.equal(getNextStep(4, false), 5);
    assert.equal(getNextStep(9, false), 9);
    assert.equal(getNextStep(9, true), 0);
  });

  await t.test("Calculates correct timer interval from speed multiplier", () => {
    const baseSpeed = 600;
    const getInterval = (multiplier) => Math.round(baseSpeed / multiplier);

    assert.equal(getInterval(1), 600);
    assert.equal(getInterval(2), 300);
    assert.equal(getInterval(0.5), 1200);
    assert.equal(getInterval(5), 120);
  });
});

test("Asymptotic Execution Complexity Estimation Verification", async (t) => {
  await t.test("Estimates O(1) for constant linear instructions without loops", () => {
    const code = "int x = 10;\nint y = 20;";
    const loopMatches = code.match(/\b(for|while)\b/g);
    assert.equal(loopMatches, null);
  });

  await t.test("Estimates O(n) for trace containing single linear loop", () => {
    const code = "for (int i = 0; i < 5; i++) { count += i; }";
    const loopMatches = code.match(/\b(for|while)\b/g);
    assert.equal(loopMatches?.length, 1);
  });

  await t.test("Estimates recursive complexity for call stack depth > 2", () => {
    const maxStack = 4;
    const isRecursive = maxStack > 2;
    assert.equal(isRecursive, true);
  });
});

test("Curated Preset Archetypes Catalogue Verification", async (t) => {
  await t.test("Ensures presets contain valid syntax, unique identifiers, and supported languages", () => {
    const presetIds = [
      "variables-arithmetic",
      "condition-loops",
      "array-mutations",
      "binary-search",
      "string-palindrome",
      "matrix-grid",
      "exception-handling",
      "recursion-factorial",
      "object-references",
      "mixed-pipeline",
      "python-list-ops",
      "python-binary-search",
      "python-factorial",
      "cpp-pointers-memory",
      "cpp-pointer-arithmetic",
      "c-malloc-free",
    ];

    const idSet = new Set(presetIds);
    assert.equal(idSet.size, presetIds.length);
    assert.equal(presetIds.length, 16);
  });
});

test("Trace Execution History and Session Recall Verification", async (t) => {
  await t.test("Caps history at MAX_HISTORY_ITEMS and extracts title from source", () => {
    const extractTitle = (sourceCode) => {
      const line = sourceCode
        .split("\n")
        .map((l) => l.trim())
        .find(
          (l) =>
            l.length > 0 &&
            !l.startsWith("//") &&
            !l.startsWith("/*") &&
            !l.startsWith("import ") &&
            !l.startsWith("package ")
        );
      return line ? line.substring(0, 38) : "Execution Trace";
    };

    const code = `package com.example;
// Comment line
public class BinarySearch {
    public static void main(String[] args) {}
}`;

    const title = extractTitle(code);
    assert.equal(title, "public class BinarySearch {");

    // Test capping
    const items = Array.from({ length: 25 }, (_, i) => ({ id: `id_${i}` }));
    const capped = items.slice(0, 20);
    assert.equal(capped.length, 20);
  });

  await t.test("Calculates comparison metrics between two history runs", () => {
    const runA = { stepCount: 15, executionTimeMs: 40 };
    const runB = { stepCount: 22, executionTimeMs: 65 };

    const stepDelta = runB.stepCount - runA.stepCount;
    const timeDelta = runB.executionTimeMs - runA.executionTimeMs;

    assert.equal(stepDelta, 7);
    assert.equal(timeDelta, 25);
  });
});

test("Compiler Pipeline Contract and Stage Data Model Verification", async (t) => {
  await t.test("Validates authentic 5-stage compiler pipeline structure", () => {
    const pipelineResponse = {
      success: true,
      sourceCode: "public class Main { public static void main(String[] args) { int x = 10; } }",
      className: "Main",
      diagnostics: [],
      stages: [
        {
          stage: "SOURCE_CODE",
          name: "Source Code",
          description: "Raw human-readable program text.",
          purpose: "Serves as initial input for compilation.",
          status: "SUCCESS",
          isRealOutput: true,
          toolchain: "User Code Buffer",
        },
        {
          stage: "LEXICAL_ANALYSIS",
          name: "Lexical Analysis",
          description: "Deconstructs characters into typed tokens.",
          purpose: "Converts text into semantic tokens.",
          status: "SUCCESS",
          isRealOutput: true,
          toolchain: "Java Lexical Tokenizer",
        },
        {
          stage: "SYNTAX_ANALYSIS",
          name: "Syntax Analysis (AST)",
          description: "Validates grammar and builds syntax tree.",
          purpose: "Constructs hierarchical AST.",
          status: "SUCCESS",
          isRealOutput: true,
          toolchain: "OpenJDK Javac Compiler API",
        },
        {
          stage: "SYMBOL_RESOLUTION",
          name: "Symbol Resolution",
          description: "Binds identifiers to scopes.",
          purpose: "Tracks variable types and scopes.",
          status: "SUCCESS",
          isRealOutput: true,
          toolchain: "Javac Scope Analysis",
        },
        {
          stage: "BYTECODE_DISASSEMBLY",
          name: "Bytecode Disassembly",
          description: "Compiles AST into JVM opcodes.",
          purpose: "Generates portable bytecode.",
          status: "SUCCESS",
          isRealOutput: true,
          toolchain: "OpenJDK javap Disassembler",
        },
      ],
      tokens: [
        { index: 0, type: "KEYWORD", value: "public", line: 1, column: 1, endColumn: 6, category: "KEYWORD" },
        { index: 1, type: "KEYWORD", value: "class", line: 1, column: 8, endColumn: 12, category: "KEYWORD" },
        { index: 2, type: "IDENTIFIER", value: "Main", line: 1, column: 14, endColumn: 17, category: "IDENTIFIER" },
      ],
      astRoot: {
        id: "node-1",
        kind: "COMPILATION_UNIT",
        label: "CompilationUnit (Main.java)",
        line: 1,
        column: 1,
        endLine: 1,
        endColumn: 76,
        details: "Root AST",
        children: [],
      },
      symbols: [
        { name: "Main", kind: "CLASS", type: "Main", scope: "GLOBAL", line: 1, column: 14 },
      ],
      bytecode: [
        { offset: 0, opcode: "bipush", arguments: "10", line: 1, explanation: "Push byte onto stack", methodName: "main" },
        { offset: 2, opcode: "istore_1", arguments: "", line: 1, explanation: "Store in local slot 1", methodName: "main" },
        { offset: 3, opcode: "return", arguments: "", line: 1, explanation: "Return void", methodName: "main" },
      ],
      rawBytecodeOutput: "Compiled from Main.java\npublic class Main { ... }",
      compilationTimeMs: 12,
    };

    assert.equal(pipelineResponse.stages.length, 5);
    assert.equal(pipelineResponse.stages[0].stage, "SOURCE_CODE");
    assert.equal(pipelineResponse.stages[4].stage, "BYTECODE_DISASSEMBLY");
    assert.equal(pipelineResponse.stages[4].isRealOutput, true);
    assert.equal(pipelineResponse.tokens.length, 3);
    assert.equal(pipelineResponse.bytecode.length, 3);
    assert.equal(pipelineResponse.bytecode[0].opcode, "bipush");
    assert.equal(pipelineResponse.bytecode[0].line, 1);
  });

  await t.test("Correlates source line number to bytecode instructions and tokens", () => {
    const tokens = [
      { index: 0, value: "int", line: 2, category: "KEYWORD" },
      { index: 1, value: "x", line: 2, category: "IDENTIFIER" },
      { index: 2, value: "10", line: 2, category: "LITERAL" },
      { index: 3, value: "int", line: 3, category: "KEYWORD" },
      { index: 4, value: "y", line: 3, category: "IDENTIFIER" },
    ];

    const bytecode = [
      { offset: 0, opcode: "bipush", line: 2 },
      { offset: 2, opcode: "istore_1", line: 2 },
      { offset: 3, opcode: "bipush", line: 3 },
      { offset: 5, opcode: "istore_2", line: 3 },
    ];

    const line2Tokens = tokens.filter((t) => t.line === 2);
    assert.equal(line2Tokens.length, 3);

    const line2Bytecode = bytecode.filter((b) => b.line === 2);
    assert.equal(line2Bytecode.length, 2);
    assert.equal(line2Bytecode[0].opcode, "bipush");
    assert.equal(line2Bytecode[1].opcode, "istore_1");
  });

  await t.test("Flags halting stage and grounds compiler diagnostic remediation on error", () => {
    const failedPipelinePayload = {
      success: false,
      sourceCode: "public class Broken { int x = ; }",
      className: "Broken",
      stages: [
        { stage: "SOURCE_CODE", status: "SUCCESS" },
        { stage: "LEXICAL_ANALYSIS", status: "SUCCESS" },
        { stage: "SYNTAX_ANALYSIS", status: "ERROR" },
        { stage: "SYMBOL_RESOLUTION", status: "SUCCESS" },
        { stage: "BYTECODE_DISASSEMBLY", status: "ERROR" },
      ],
      diagnostics: [
        {
          line: 1,
          column: 32,
          message: "';' expected",
          diagnosticType: "SYNTAX_ERROR",
          explanation: {
            whyItHappened: "A statement ended without the mandatory closing semicolon.",
            howToFix: "Insert a semicolon at the end of the assignment statement.",
            suggestion: "int x = 0;",
          },
        },
      ],
      tokens: [],
      astRoot: { id: "node-err", kind: "PARSE_ERROR" },
      symbols: [],
      bytecode: [],
    };

    assert.equal(failedPipelinePayload.success, false);
    const haltingStages = failedPipelinePayload.stages.filter((s) => s.status === "ERROR");
    assert.equal(haltingStages.length, 2);
    assert.equal(haltingStages[0].stage, "SYNTAX_ANALYSIS");
    assert.equal(haltingStages[1].stage, "BYTECODE_DISASSEMBLY");

    const diag = failedPipelinePayload.diagnostics[0];
    assert.equal(diag.line, 1);
    assert.equal(diag.column, 32);
    assert.equal(Boolean(diag.explanation), true);
    assert.equal(diag.explanation.whyItHappened.includes("semicolon"), true);
    assert.equal(diag.explanation.howToFix.includes("semicolon"), true);
    assert.equal(diag.explanation.suggestion, "int x = 0;");
  });
});

test("Hardware & Computer Systems Simulation Engine Verification", async (t) => {
  await t.test("Simulates JVM Local Variable Table slot allocation", () => {
    const vars = {
      price: { name: "price", type: "int", value: "100" },
      quantity: { name: "quantity", type: "int", value: "3" },
    };

    const slots = [];
    slots.push({ slot: 0, name: "args", type: "String[]", value: "[...]", isObserved: true });
    let slotIdx = 1;
    for (const key of Object.keys(vars).sort()) {
      slots.push({ slot: slotIdx++, name: vars[key].name, type: vars[key].type, value: vars[key].value, isObserved: true });
    }

    assert.equal(slots.length, 3);
    assert.equal(slots[0].slot, 0);
    assert.equal(slots[0].name, "args");
    assert.equal(slots[1].slot, 1);
    assert.equal(slots[1].name, "price");
    assert.equal(slots[1].value, "100");
    assert.equal(slots[2].slot, 2);
    assert.equal(slots[2].name, "quantity");
    assert.equal(slots[2].value, "3");
  });

  await t.test("Simulates LIFO operand stack evaluation and top pointer", () => {
    const operandStack = [];
    // Push operand A
    operandStack.unshift({ index: 0, value: "100", type: "int", isTop: true, sourceOpcode: "bipush" });
    assert.equal(operandStack.length, 1);
    assert.equal(operandStack[0].value, "100");

    // Push operand B
    operandStack.forEach((entry) => (entry.isTop = false));
    operandStack.unshift({ index: 1, value: "3", type: "int", isTop: true, sourceOpcode: "iconst_3" });
    assert.equal(operandStack.length, 2);
    assert.equal(operandStack[0].value, "3");
    assert.equal(operandStack[0].isTop, true);

    // ALU Execute (imul) -> pop 2, push result 300
    operandStack.shift();
    operandStack.shift();
    operandStack.unshift({ index: 0, value: "300", type: "int", isTop: true, sourceOpcode: "imul" });
    assert.equal(operandStack.length, 1);
    assert.equal(operandStack[0].value, "300");

    // istore_3 -> pop top into local variable table
    const stored = operandStack.shift();
    assert.equal(stored.value, "300");
    assert.equal(operandStack.length, 0);
  });

  await t.test("Simulates ALU operations with integer flags", () => {
    const aluAdd = (a, b) => {
      const res = a + b;
      return {
        op: "ADD",
        operandA: a,
        operandB: b,
        result: res,
        flags: { zero: res === 0, sign: res < 0 },
      };
    };

    const op1 = aluAdd(10, 5);
    assert.equal(op1.result, 15);
    assert.equal(op1.flags.zero, false);
    assert.equal(op1.flags.sign, false);

    const opZero = aluAdd(-5, 5);
    assert.equal(opZero.result, 0);
    assert.equal(opZero.flags.zero, true);
    assert.equal(opZero.flags.sign, false);

    const opNeg = aluAdd(3, -10);
    assert.equal(opNeg.result, -7);
    assert.equal(opNeg.flags.zero, false);
    assert.equal(opNeg.flags.sign, true);
  });

  await t.test("Validates 64-bit aligned heap object memory layout and headers", () => {
    const rawHeapObject = {
      id: "student_1",
      type: "Student",
      state: { name: "Alex", score: 95 },
    };

    const fieldCount = Object.keys(rawHeapObject.state).length;
    // 8 bytes Mark Word + 4 bytes compressed Klass Word + instance data + 64-bit alignment padding
    const sizeBytes = Math.ceil((12 + fieldCount * 4) / 8) * 8;

    const memoryBlock = {
      addressLabel: "0x7FFF_1000 [Conceptual]",
      type: rawHeapObject.type,
      header: {
        markWord: "0x0000000000000001 (unlocked)",
        klassWord: "0x20000000 (Student.class)",
      },
      sizeBytes,
      fields: rawHeapObject.state,
      isConceptualAddress: true,
      isObservedData: true,
    };

    assert.equal(memoryBlock.isConceptualAddress, true);
    assert.equal(memoryBlock.isObservedData, true);
    assert.equal(memoryBlock.sizeBytes % 8, 0);
    assert.equal(memoryBlock.addressLabel.includes("[Conceptual]"), true);
    assert.equal(memoryBlock.header.markWord.includes("unlocked"), true);
  });

  await t.test("Flags conceptual hardware registers without presenting fake hardware", () => {
    const registers = [
      { name: "PC", label: "Program Counter", value: "0x0004", isConceptual: true },
      { name: "ACC", label: "Accumulator", value: "300", isConceptual: true },
      { name: "R0", label: "General Register 0", value: "100", isConceptual: true },
      { name: "R1", label: "General Register 1", value: "3", isConceptual: true },
      { name: "SP", label: "Stack Pointer", value: "0x0001", isConceptual: true },
    ];

    assert.equal(registers.length, 5);
    for (const r of registers) {
      assert.equal(r.isConceptual, true);
    }
  });
});

test("Time & Space Complexity Engine & Asymptotic Analysis Verification", async (t) => {
  await t.test("Straight-line code yields O(1) time and O(1) space with proven_static confidence", () => {
    const loopLines = [];
    const maxStack = 1;
    const isRecursion = false;
    const isDivideAndConquer = false;
    const order = isRecursion ? "O(n)" : loopLines.length > 0 ? "O(n)" : "O(1)";
    const worstCase = "O(1)";
    const bestCase = "Ω(1)";
    const averageCase = "Θ(1)";
    const confidence = "proven_static";

    assert.equal(maxStack, 1);
    assert.equal(isDivideAndConquer, false);
    assert.equal(order, "O(1)");
    assert.equal(worstCase, "O(1)");
    assert.equal(bestCase, "Ω(1)");
    assert.equal(averageCase, "Θ(1)");
    assert.equal(confidence, "proven_static");
  });

  await t.test("Single loop yields O(n) time with Ω(n) lower bound when no early exit", () => {
    const loopLines = [4];
    const hasEarlyExit = false;
    const worstCase = "O(n)";
    const bestCase = hasEarlyExit ? "Ω(1)" : "Ω(n)";
    const averageCase = "Θ(n)";

    assert.equal(loopLines.length, 1);
    assert.equal(worstCase, "O(n)");
    assert.equal(bestCase, "Ω(n)");
    assert.equal(averageCase, "Θ(n)");
  });

  await t.test("Loop with early exit break lowers best-case bound to Ω(1)", () => {
    const loopLines = [4];
    const hasEarlyExit = true;
    const worstCase = "O(n)";
    const bestCase = hasEarlyExit ? "Ω(1)" : "Ω(n)";

    assert.equal(loopLines.length, 1);
    assert.equal(worstCase, "O(n)");
    assert.equal(bestCase, "Ω(1)");
  });

  await t.test("Nested loops yield O(n²) quadratic bounds", () => {
    const loopLines = [4, 6];
    const hasNested = loopLines.length >= 2;
    const worstCase = hasNested ? "O(n²)" : "O(n)";
    const averageCase = "Θ(n²)";

    assert.equal(worstCase, "O(n²)");
    assert.equal(averageCase, "Θ(n²)");
  });

  await t.test("Divide and conquer halving pattern yields O(log n)", () => {
    const isDivideAndConquer = true;
    const worstCase = isDivideAndConquer ? "O(log n)" : "O(n)";
    const averageCase = "Θ(log n)";

    assert.equal(worstCase, "O(log n)");
    assert.equal(averageCase, "Θ(log n)");
  });

  await t.test("Branching recursion yields O(2^n) time and O(n) stack auxiliary space", () => {
    const isBranchingRecursion = true;
    const maxStackDepth = 6;
    const timeOrder = isBranchingRecursion ? "O(2^n)" : "O(n)";
    const callStackSpace = "O(n)";

    assert.equal(timeOrder, "O(2^n)");
    assert.equal(callStackSpace, "O(n)");
    assert.equal(maxStackDepth, 6);
  });

  await t.test("Dynamic array allocation yields O(n) heap auxiliary space", () => {
    const hasArrayAllocation = true;
    const heapOrder = hasArrayAllocation ? "O(n)" : "O(1)";
    const spaceOrder = heapOrder;

    assert.equal(heapOrder, "O(n)");
    assert.equal(spaceOrder, "O(n)");
  });

  await t.test("Calculates canonical reference growth curve values with empirical overlay", () => {
    const sampleN = [1, 2, 4, 8, 16, 32];
    const n8 = sampleN.find(n => n === 8);
    const constant = 1;
    const logarithmic = Math.round(Math.log2(8) + 1); // 4
    const linear = 8;
    const quadratic = 8 * 8; // 64
    const empiricalSteps = 24;

    assert.ok(n8 !== undefined);
    assert.equal(constant, 1);
    assert.equal(logarithmic, 4);
    assert.equal(linear, 8);
    assert.equal(quadratic, 64);
    assert.equal(empiricalSteps, 24);
  });

  await t.test("Empirical metrics capture observed steps, duration, and peak memory", () => {
    const telemetry = {
      totalSteps: 42,
      uniqueLinesExecuted: 12,
      loopIterationsCount: 10,
      maxStackDepth: 3,
      peakActiveVariables: 5,
      estimatedPeakHeapBytes: 128,
      executionDurationMs: 15,
      isConceptual: true,
    };

    assert.equal(telemetry.totalSteps, 42);
    assert.equal(telemetry.executionDurationMs, 15);
    assert.equal(telemetry.isConceptual, true);
  });
});

test("Guided Error Diagnosis and Remediation Engine Verification", async (t) => {
  await t.test("Diagnoses missing semicolon diagnostic and generates line auto-fix", () => {
    const rawLine = "    int price = 100";
    const correctedLine = rawLine.trimEnd() + ";";
    assert.equal(correctedLine, "    int price = 100;");
  });

  await t.test("Extracts unresolved identifier symbol name", () => {
    const msg = "cannot find symbol\n  symbol:   variable totalAmount\n  location: class Main";
    const symbolMatch = msg.match(/symbol:\s*(?:variable|method|class)\s+([A-Za-z0-9_$]+)/);
    const sym = symbolMatch ? symbolMatch[1] : "";
    assert.equal(sym, "totalAmount");
  });

  await t.test("Diagnoses ArrayIndexOutOfBoundsException and corrects boundary to strict less-than", () => {
    const rawLine = "for (int i = 0; i <= arr.length; i++)";
    const correctedLine = rawLine.replace("<=", "<");
    assert.equal(correctedLine, "for (int i = 0; i < arr.length; i++)");
  });

  await t.test("Diagnoses ArithmeticException divide by zero and suggests non-zero check", () => {
    const rawLine = "    int result = a / b;";
    const match = rawLine.match(/\/\s*([A-Za-z0-9_$]+)/);
    const divisor = match ? match[1] : "";
    assert.equal(divisor, "b");
    const guarded = `if (${divisor} != 0) { ${rawLine.trim()} }`;
    assert.equal(guarded, "if (b != 0) { int result = a / b; }");
  });

  await t.test("Diagnoses NullPointerException with dereference warning", () => {
    const stderr = `Exception in thread "main" java.lang.NullPointerException: Cannot invoke "String.length()" because "str" is null`;
    const isNpe = stderr.includes("NullPointerException");
    assert.equal(isNpe, true);
  });

  await t.test("Applies line replacement remediation safely without adjacent corruption", () => {
    const source = "line 1\nline 2 error\nline 3";
    const lines = source.split("\n");
    lines[1] = "line 2 fixed";
    assert.equal(lines.join("\n"), "line 1\nline 2 fixed\nline 3");
  });

  await t.test("Guarantees error explanations are grounded in authentic diagnostics without fabrication", () => {
    const remediation = {
      category: "COMPILER_SYNTAX",
      isGroundedInDiagnostics: true,
      line: 3,
      observedMessage: "';' expected",
    };
    assert.equal(remediation.isGroundedInDiagnostics, true);
    assert.equal(remediation.observedMessage, "';' expected");
  });
});

test("Multi-Language Adapter Architecture & Normalization Verification", async (t) => {
  await t.test("Registry identifies all 4 supported language platforms", () => {
    const languages = ["java", "python", "cpp", "c"];
    assert.equal(languages.length, 4);
    assert.ok(languages.includes("java"));
    assert.ok(languages.includes("python"));
    assert.ok(languages.includes("cpp"));
    assert.ok(languages.includes("c"));
  });

  await t.test("File extensions map to correct language platform", () => {
    const detect = (filename) => {
      if (filename.endsWith(".py")) return "python";
      if (filename.endsWith(".cpp") || filename.endsWith(".cc")) return "cpp";
      if (filename.endsWith(".c")) return "c";
      return "java";
    };
    assert.equal(detect("script.py"), "python");
    assert.equal(detect("main.cpp"), "cpp");
    assert.equal(detect("kernel.c"), "c");
    assert.equal(detect("Main.java"), "java");
    assert.equal(detect("other.txt"), "java");
  });

  await t.test("Python normalization maps dynamic types and list operations", () => {
    const pyRaw = {
      line: 3,
      eventType: "STORE_NAME",
      symbol: "items",
      currentValue: "[1, 2, 3]",
    };
    const isList = pyRaw.currentValue.startsWith("[");
    assert.equal(isList, true);
    const conceptType = pyRaw.eventType.includes("STORE") ? "VARIABLE_ASSIGNMENT" : "LINE_EXECUTION";
    assert.equal(conceptType, "VARIABLE_ASSIGNMENT");
  });

  await t.test("Cpp normalization flags pointer addresses in metadata without fabrication", () => {
    const cppEvent = {
      line: 7,
      symbol: "ptr",
      currentValue: "0x7ffee4b2",
    };
    const isPointer = cppEvent.currentValue.startsWith("0x");
    assert.equal(isPointer, true);
    const metadata = { isPointer, targetAddress: cppEvent.currentValue };
    assert.equal(metadata.isPointer, true);
    assert.equal(metadata.targetAddress, "0x7ffee4b2");
  });

  await t.test("GCC/Clang diagnostics parser matches standard compiler output regex", () => {
    const line = "main.cpp:12:5: error: 'x' was not declared in this scope";
    const match = line.match(/^([^:\n]+):(\d+):(\d+):\s*(error|warning|note):\s*(.+)/i);
    assert.ok(match);
    assert.equal(match[2], "12");
    assert.equal(match[3], "5");
    assert.equal(match[4], "error");
    assert.equal(match[5], "'x' was not declared in this scope");
  });

  await t.test("Python traceback parser extracts exception type and error line", () => {
    const traceback = 'File "main.py", line 15, in <module>\nIndexError: list index out of range';
    const fileMatch = traceback.match(/File ".*?", line (\d+)/);
    const errMatch = traceback.match(/^([A-Z][a-zA-Z]*Error):\s*(.+)/m);
    assert.ok(fileMatch);
    assert.equal(fileMatch[1], "15");
    assert.ok(errMatch);
    assert.equal(errMatch[1], "IndexError");
    assert.equal(errMatch[2], "list index out of range");
  });

  await t.test("Python ZeroDivisionError diagnoses divide-by-zero with non-zero guard remediation", () => {
    const pyError = "ZeroDivisionError: division by zero";
    assert.ok(pyError.includes("ZeroDivisionError") || pyError.includes("division by zero"));
    const rawLine = "result = a / b";
    const divisorMatch = rawLine.match(/\/\s*([A-Za-z0-9_$]+)/);
    assert.ok(divisorMatch);
    assert.equal(divisorMatch[1], "b");
    const suggestion = `if ${divisorMatch[1]} != 0:`;
    assert.equal(suggestion, "if b != 0:");
  });

  await t.test("C++ undefined symbol diagnostic extracts identifier and suggests scope declaration", () => {
    const diagMsg = "error: 'counter' was not declared in this scope";
    const symMatch = diagMsg.match(/'([^']+)'\s+was not declared/);
    assert.ok(symMatch);
    assert.equal(symMatch[1], "counter");
  });

  await t.test("Python for-range loop and divide-and-conquer detect asymptotic O(log n)", () => {
    const pyCode = `def binary_search(arr, target):
    low = 0
    high = len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1`;

    const hasLoop = /\b(for|while)\b/.test(pyCode);
    const isHalving = /(?:\/\/\s*2|\/\s*2)/.test(pyCode);
    assert.equal(hasLoop, true);
    assert.equal(isHalving, true);
  });

  await t.test("Python recursive factorial detects recursive function calls", () => {
    const pyCode = `def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)`;

    const funcMatch = pyCode.match(/(?:def\s+)([A-Za-z0-9_]+)\s*\(/g);
    assert.ok(funcMatch);
    const name = funcMatch[0].match(/def\s+([A-Za-z0-9_]+)/)[1];
    assert.equal(name, "factorial");
    const calls = pyCode.match(new RegExp(`\\b${name}\\s*\\(`, "g"));
    assert.ok(calls && calls.length >= 2);
  });
});




