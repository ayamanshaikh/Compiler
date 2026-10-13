import { describe, it } from "node:test";
import assert from "node:assert";
import { buildStepExplanation } from "./explanationBuilder.js";
import { NormalizedExecutionEvent } from "../api/types.js";

describe("Explanation Builder Educational Narrative Verification", () => {
  it("generates structured explanation for variable declaration with Java type insights", () => {
    const event: NormalizedExecutionEvent = {
      sequence: 1,
      eventType: "VARIABLE_DECLARATION",
      conceptType: "VARIABLE_DECLARATION",
      sourceLine: 3,
      scope: "main",
      symbol: "x",
      currentValue: "10",
      description: "Declared variable x = 10",
      metadata: { type: "int" },
      variables: {
        x: { name: "x", type: "int", value: "10" },
      },
      callStack: [{ methodName: "main", className: "Main", line: 3 }],
      heapObjects: {},
      output: "",
    };

    const explanation = buildStepExplanation(event, ["public class Main {", "  public static void main(String[] args) {", "    int x = 10;", "  }", "}"]);

    assert.strictEqual(explanation.stepNumber, 1);
    assert.strictEqual(explanation.sourceLine, 3);
    assert.strictEqual(explanation.category, "Variable Declaration");
    assert.ok(explanation.whatHappens.includes("variable named 'x'"));
    assert.ok(explanation.whatHappens.includes("10"));
    assert.strictEqual(explanation.currentValues.x, "10");
    assert.ok(explanation.whyItHappens.includes("stack frame"));
    assert.ok(explanation.result.includes("'x' is now initialized"));
    assert.ok(explanation.learnMore?.includes("32-bit signed"));
    assert.strictEqual(explanation.lineContent, "int x = 10;");
  });

  it("explains variable mutation with previous value overwrite", () => {
    const event: NormalizedExecutionEvent = {
      sequence: 2,
      eventType: "VARIABLE_ASSIGNMENT",
      conceptType: "VARIABLE_ASSIGNMENT",
      sourceLine: 4,
      scope: "main",
      symbol: "x",
      previousValue: "10",
      currentValue: "20",
      description: "Assigned x = 20",
      metadata: { type: "int" },
      variables: {
        x: { name: "x", type: "int", value: "20", previousValue: "10" },
      },
      callStack: [{ methodName: "main", className: "Main", line: 4 }],
      heapObjects: {},
      output: "",
    };

    const explanation = buildStepExplanation(event);

    assert.strictEqual(explanation.category, "Value Mutation");
    assert.ok(explanation.whatHappens.includes("updated from 10 to 20"));
    assert.ok(explanation.result.includes("previous value 10 was overwritten"));
  });

  it("explains conditional branch evaluation and control flow direction", () => {
    const event: NormalizedExecutionEvent = {
      sequence: 3,
      eventType: "CONDITION_EVALUATION",
      conceptType: "CONDITION_CHECK",
      sourceLine: 5,
      scope: "main",
      symbol: "age >= 18",
      currentValue: "true",
      description: "Condition evaluated to TRUE",
      metadata: { condition: "age >= 18", result: "true" },
      variables: {
        age: { name: "age", type: "int", value: "20" },
      },
      callStack: [{ methodName: "main", className: "Main", line: 5 }],
      heapObjects: {},
      output: "",
    };

    const explanation = buildStepExplanation(event);

    assert.strictEqual(explanation.category, "Branch Decision");
    assert.ok(explanation.whatHappens.includes("resulting in boolean value true"));
    assert.ok(explanation.result.includes("enters the conditional block"));
    assert.strictEqual(explanation.controlFlowNote, "Branch taken (true)");
  });

  it("explains loop iteration cycle and loop guard boundary", () => {
    const event: NormalizedExecutionEvent = {
      sequence: 4,
      eventType: "LOOP_ITERATION",
      conceptType: "LOOP_ITERATION",
      sourceLine: 6,
      scope: "main",
      symbol: "i",
      currentValue: "2",
      description: "Loop iteration 2",
      metadata: { iteration: "2" },
      variables: {
        i: { name: "i", type: "int", value: "2" },
      },
      callStack: [{ methodName: "main", className: "Main", line: 6 }],
      heapObjects: {},
      output: "",
    };

    const explanation = buildStepExplanation(event);

    assert.strictEqual(explanation.category, "Loop Iteration");
    assert.ok(explanation.whatHappens.includes("Loop iteration #2"));
    assert.ok(explanation.whatHappens.includes("'i' = 2"));
    assert.strictEqual(explanation.controlFlowNote, "Loop active (pass #2)");
  });

  it("provides non-visual fallback explanation without failing", () => {
    const event: NormalizedExecutionEvent = {
      sequence: 5,
      eventType: "LINE",
      conceptType: "GENERIC_STEP",
      sourceLine: 1,
      scope: "global",
      description: "Class declaration Main",
      metadata: {},
      variables: {},
      callStack: [],
      heapObjects: {},
      output: "",
    };

    const explanation = buildStepExplanation(event);

    assert.strictEqual(explanation.category, "Sequential Execution");
    assert.ok(explanation.whatHappens.length > 0);
    assert.ok(explanation.whyItHappens.length > 0);
    assert.ok(explanation.result.length > 0);
    assert.strictEqual(explanation.isVisualCapable, false);
  });

  it("provides distinct beginner and detailed mode explanations from the same underlying event", () => {
    const event: NormalizedExecutionEvent = {
      sequence: 1,
      eventType: "VARIABLE_DECLARATION",
      conceptType: "VARIABLE_DECLARATION",
      sourceLine: 3,
      scope: "main",
      symbol: "price",
      currentValue: "100",
      description: "Declared variable price = 100",
      metadata: { type: "int" },
      variables: {
        price: { name: "price", type: "int", value: "100" },
      },
      callStack: [{ methodName: "main", className: "Main", line: 3 }],
      heapObjects: {},
      output: "",
    };

    const explanation = buildStepExplanation(event);

    // Beginner mode assertions: clear, simple vocabulary, key value highlighted
    assert.ok(explanation.beginnerMode);
    assert.strictEqual(explanation.beginnerMode.keyValues, "price = 100");
    assert.ok(explanation.beginnerMode.summary.includes("Create variable 'price'"));
    assert.ok(explanation.beginnerMode.plainReason.includes("container"));

    // Detailed mode assertions: technical terminology, stack frame, compiler/JVM reasoning
    assert.ok(explanation.detailedMode);
    assert.ok(explanation.detailedMode.technicalMechanics.includes("Allocated slot in local variable array"));
    assert.ok(explanation.detailedMode.runtimeScope.includes("main()"));
    assert.ok(explanation.detailedMode.stackHeapImplication.includes("call-stack frame"));
    assert.ok(explanation.detailedMode.compilerOrJvmReasoning.includes("Java compiler verified"));
  });
});
