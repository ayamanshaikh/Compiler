import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  analyzeProgramComplexity,
  generateGrowthCurveData,
  estimateInputScale,
} from "./complexityAnalyzer";
import { TraceStep } from "@/lib/api/types";

describe("Time & Space Complexity Engine & Asymptotic Analysis", () => {
  it("classifies straight-line code as O(1) time and O(1) space with proven_static confidence", () => {
    const steps: TraceStep[] = [
      {
        stepIndex: 0,
        line: 3,
        eventType: "VARIABLE_ASSIGNMENT",
        description: "Assigned a = 10",
        variables: { a: { name: "a", type: "int", value: "10" } },
        callStack: [{ methodName: "main", className: "Solution", line: 3 }],
        heapObjects: {},
        output: "",
      },
      {
        stepIndex: 1,
        line: 4,
        eventType: "VARIABLE_ASSIGNMENT",
        description: "Assigned b = 20",
        variables: {
          a: { name: "a", type: "int", value: "10" },
          b: { name: "b", type: "int", value: "20" },
        },
        callStack: [{ methodName: "main", className: "Solution", line: 4 }],
        heapObjects: {},
        output: "",
      },
    ];

    const source = `public class Solution {\n  public static void main(String[] args) {\n    int a = 10;\n    int b = 20;\n    System.out.println(a + b);\n  }\n}`;

    const report = analyzeProgramComplexity(steps, source, 12);

    assert.equal(report.timeComplexity.order, "O(1)");
    assert.equal(report.timeComplexity.bounds.worstCase, "O(1)");
    assert.equal(report.timeComplexity.bounds.bestCase, "Ω(1)");
    assert.equal(report.timeComplexity.bounds.averageCase, "Θ(1)");
    assert.equal(report.timeComplexity.confidence, "proven_static");
    assert.equal(report.spaceComplexity.order, "O(1)");
    assert.equal(report.spaceComplexity.callStackOrder, "O(1)");
    assert.equal(report.empiricalMetrics.totalSteps, 2);
    assert.equal(report.empiricalMetrics.maxStackDepth, 1);
    assert.equal(report.empiricalMetrics.executionDurationMs, 12);
    assert.equal(report.isConceptual, true);
  });

  it("classifies single loop as O(n) time with Ω(n) lower bound when no early exit", () => {
    const steps: TraceStep[] = Array.from({ length: 5 }, (_, i) => ({
      stepIndex: i,
      line: 4,
      eventType: "LOOP_ITERATION",
      description: `Loop iteration ${i}`,
      variables: { i: { name: "i", type: "int", value: String(i) } },
      callStack: [{ methodName: "main", className: "Solution", line: 4 }],
      heapObjects: {},
      output: "",
    }));

    const source = `public class Solution {\n  public static void main(String[] args) {\n    for (int i = 0; i < 5; i++) {\n      System.out.println(i);\n    }\n  }\n}`;

    const report = analyzeProgramComplexity(steps, source);

    assert.equal(report.timeComplexity.order, "O(n)");
    assert.equal(report.timeComplexity.bounds.worstCase, "O(n)");
    assert.equal(report.timeComplexity.bounds.bestCase, "Ω(n)");
    assert.equal(report.empiricalMetrics.loopIterationsCount, 5);
    assert.equal(report.spaceComplexity.order, "O(1)");
  });

  it("adjusts best-case bound to Ω(1) when loop contains early exit break or return", () => {
    const steps: TraceStep[] = [
      {
        stepIndex: 0,
        line: 5,
        eventType: "LOOP_ITERATION",
        description: "Loop iteration 0",
        variables: { i: { name: "i", type: "int", value: "0" } },
        callStack: [{ methodName: "main", className: "Solution", line: 5 }],
        heapObjects: {},
        output: "",
      },
    ];

    const source = `public class Solution {\n  public static void main(String[] args) {\n    for (int i = 0; i < 100; i++) {\n      if (i == target) {\n        break;\n      }\n    }\n  }\n}`;

    const report = analyzeProgramComplexity(steps, source);

    assert.equal(report.timeComplexity.order, "O(n)");
    assert.equal(report.timeComplexity.bounds.worstCase, "O(n)");
    assert.equal(report.timeComplexity.bounds.bestCase, "Ω(1)");
    const earlyExitConstruct = report.timeComplexity.contributingConstructs.find(
      (c) => c.type === "early_exit"
    );
    assert.ok(earlyExitConstruct);
  });

  it("classifies nested loops as O(n²) quadratic complexity", () => {
    const steps: TraceStep[] = Array.from({ length: 16 }, (_, i) => ({
      stepIndex: i,
      line: 6,
      eventType: "LOOP_ITERATION",
      description: `Inner loop iteration ${i}`,
      variables: {
        i: { name: "i", type: "int", value: String(Math.floor(i / 4)) },
        j: { name: "j", type: "int", value: String(i % 4) },
      },
      callStack: [{ methodName: "main", className: "Solution", line: 6 }],
      heapObjects: {},
      output: "",
    }));

    const source = `public class Solution {\n  public static void main(String[] args) {\n    for (int i = 0; i < 4; i++) {\n      for (int j = 0; j < 4; j++) {\n        System.out.println(i + j);\n      }\n    }\n  }\n}`;

    const report = analyzeProgramComplexity(steps, source);

    assert.equal(report.timeComplexity.order, "O(n²)");
    assert.equal(report.timeComplexity.bounds.worstCase, "O(n²)");
    assert.ok(report.timeComplexity.rationale.includes("Nested"));
  });

  it("detects logarithmic divide-and-conquer pattern O(log n)", () => {
    const steps: TraceStep[] = [
      {
        stepIndex: 0,
        line: 5,
        eventType: "VARIABLE_ASSIGNMENT",
        description: "mid calculated",
        variables: { mid: { name: "mid", type: "int", value: "4" } },
        callStack: [{ methodName: "main", className: "Solution", line: 5 }],
        heapObjects: {},
        output: "",
      },
    ];

    const source = `public class Solution {\n  public static int binarySearch(int[] arr, int target) {\n    int low = 0, high = arr.length - 1;\n    while (low <= high) {\n      int mid = (low + high) / 2;\n      if (arr[mid] == target) return mid;\n      else if (arr[mid] < target) low = mid + 1;\n      else high = mid - 1;\n    }\n    return -1;\n  }\n}`;

    const report = analyzeProgramComplexity(steps, source);

    assert.equal(report.timeComplexity.order, "O(log n)");
    assert.equal(report.timeComplexity.bounds.worstCase, "O(log n)");
    const dcConstruct = report.timeComplexity.contributingConstructs.find(
      (c) => c.type === "divide_conquer"
    );
    assert.ok(dcConstruct);
  });

  it("classifies branching recursion as O(2^n) time with O(n) call stack space", () => {
    const steps: TraceStep[] = [
      {
        stepIndex: 0,
        line: 3,
        eventType: "METHOD_ENTRY",
        description: "fib(4)",
        variables: { n: { name: "n", type: "int", value: "4" } },
        callStack: [
          { methodName: "main", className: "Solution", line: 8 },
          { methodName: "fib", className: "Solution", line: 3 },
          { methodName: "fib", className: "Solution", line: 4 },
          { methodName: "fib", className: "Solution", line: 4 },
        ],
        heapObjects: {},
        output: "",
      },
    ];

    const source = `public class Solution {\n  public static int fib(int n) {\n    if (n <= 1) return n;\n    return fib(n - 1) + fib(n - 2);\n  }\n  public static void main(String[] args) {\n    fib(4);\n  }\n}`;

    const report = analyzeProgramComplexity(steps, source);

    assert.equal(report.timeComplexity.order, "O(2^n)");
    assert.equal(report.spaceComplexity.callStackOrder, "O(n)");
    assert.equal(report.spaceComplexity.order, "O(n)");
    assert.equal(report.empiricalMetrics.maxStackDepth, 4);
  });

  it("detects dynamic array allocation and assigns O(n) heap space complexity", () => {
    const steps: TraceStep[] = [
      {
        stepIndex: 0,
        line: 3,
        eventType: "VARIABLE_ASSIGNMENT",
        description: "Allocated new int[100]",
        variables: { buffer: { name: "buffer", type: "int[]", value: "[0,0,0,0]" } },
        callStack: [{ methodName: "main", className: "Solution", line: 3 }],
        heapObjects: {},
        output: "",
      },
    ];

    const source = `public class Solution {\n  public static void main(String[] args) {\n    int[] buffer = new int[100];\n  }\n}`;

    const report = analyzeProgramComplexity(steps, source);

    assert.equal(report.spaceComplexity.heapOrder, "O(n)");
    assert.equal(report.spaceComplexity.order, "O(n)");
    assert.ok(report.empiricalMetrics.estimatedPeakHeapBytes > 0);
  });

  it("generates canonical reference growth curve data correctly", () => {
    const points = generateGrowthCurveData(32, 8, 24);

    assert.ok(points.length > 0);
    const n8 = points.find((p) => p.n === 8);
    assert.ok(n8);
    assert.equal(n8.constant, 1);
    assert.equal(n8.linear, 8);
    assert.equal(n8.quadratic, 64);
    assert.equal(n8.empirical, 24);
  });

  it("estimates input scale accurately from array syntax and loop bounds", () => {
    const arraySource = `public class Solution { int[] arr = new int[16]; }`;
    const arraySteps: TraceStep[] = [
      {
        stepIndex: 0,
        line: 2,
        eventType: "VARIABLE_ASSIGNMENT",
        description: "arr",
        variables: {
          arr: { name: "arr", type: "int[]", value: "[1,2,3,4,5,6,7,8]" },
        },
        callStack: [],
        heapObjects: {},
        output: "",
      },
    ];

    assert.equal(estimateInputScale(arraySource, arraySteps), 8);
  });
});
