import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  diagnoseCompilerError,
  diagnoseRuntimeError,
  diagnoseProgramFailure,
  applyRemediationFix,
} from "./guidedDebugging";
import { CompilerDiagnostic, TraceStep } from "@/lib/api/types";

describe("Guided Error Diagnosis and Remediation Engine", () => {
  it("diagnoses missing semicolon compiler diagnostic and generates auto-fix", () => {
    const diagnostics: CompilerDiagnostic[] = [
      {
        line: 3,
        column: 15,
        message: "';' expected",
        diagnosticType: "ERROR",
        code: "compiler.err.expected",
      },
    ];

    const source = `public class Main {\n  public static void main(String[] args) {\n    int price = 100\n  }\n}`;

    const report = diagnoseCompilerError(diagnostics, source);

    assert.ok(report);
    assert.equal(report.category, "COMPILER_SYNTAX");
    assert.equal(report.line, 3);
    assert.ok(report.suggestedFix.correctedLine.endsWith(";"));
    assert.ok(report.correctedSourceCode.includes("int price = 100;"));
    assert.equal(report.isGroundedInDiagnostics, true);
  });

  it("diagnoses unresolved symbol and extracts identifier name", () => {
    const diagnostics: CompilerDiagnostic[] = [
      {
        line: 4,
        column: 20,
        message: "cannot find symbol\n  symbol:   variable totalAmount\n  location: class Main",
        diagnosticType: "ERROR",
        code: "compiler.err.cant.resolve.location",
      },
    ];

    const source = `public class Main {\n  public static void main(String[] args) {\n    int x = 5;\n    System.out.println(totalAmount);\n  }\n}`;

    const report = diagnoseCompilerError(diagnostics, source);

    assert.ok(report);
    assert.equal(report.category, "COMPILER_SYMBOL");
    assert.equal(report.line, 4);
    assert.ok(report.beginnerExplanation.summary.includes("totalAmount"));
  });

  it("diagnoses ArrayIndexOutOfBoundsException runtime error and corrects off-by-one loop boundary", () => {
    const stderr = `Exception in thread "main" java.lang.ArrayIndexOutOfBoundsException: Index 5 out of bounds for length 5\n\tat Main.main(Main.java:4)`;
    const steps: TraceStep[] = [
      {
        stepIndex: 0,
        line: 4,
        eventType: "LOOP_ITERATION",
        description: "Loop iter",
        variables: {},
        callStack: [],
        heapObjects: {},
        output: "",
      },
    ];

    const source = `public class Main {\n  public static void main(String[] args) {\n    int[] arr = new int[5];\n    for (int i = 0; i <= arr.length; i++) {\n      System.out.println(arr[i]);\n    }\n  }\n}`;

    const report = diagnoseRuntimeError(stderr, steps, source);

    assert.ok(report);
    assert.equal(report.category, "RUNTIME_INDEX_OUT_OF_BOUNDS");
    assert.equal(report.line, 4);
    assert.ok(report.suggestedFix.correctedLine.includes("< arr.length"));
    assert.ok(report.correctedSourceCode.includes("i < arr.length"));
  });

  it("diagnoses ArithmeticException divide by zero and suggests non-zero divisor guard", () => {
    const stderr = `Exception in thread "main" java.lang.ArithmeticException: / by zero\n\tat Main.main(Main.java:5)`;
    const source = `public class Main {\n  public static void main(String[] args) {\n    int a = 10;\n    int b = 0;\n    int result = a / b;\n  }\n}`;

    const report = diagnoseRuntimeError(stderr, [], source);

    assert.ok(report);
    assert.equal(report.category, "RUNTIME_ARITHMETIC");
    assert.equal(report.line, 5);
    assert.ok(report.suggestedFix.correctedLine.includes("if (b != 0)"));
  });

  it("diagnoses NullPointerException and provides object dereference explanation", () => {
    const stderr = `Exception in thread "main" java.lang.NullPointerException: Cannot invoke "String.length()" because "str" is null\n\tat Main.main(Main.java:4)`;
    const source = `public class Main {\n  public static void main(String[] args) {\n    String str = null;\n    System.out.println(str.length());\n  }\n}`;

    const report = diagnoseRuntimeError(stderr, [], source);

    assert.ok(report);
    assert.equal(report.category, "RUNTIME_NULL_POINTER");
    assert.equal(report.line, 4);
    assert.ok(report.beginnerExplanation.summary.includes("hasn't been created"));
  });

  it("diagnoses StackOverflowError for runaway recursion", () => {
    const stderr = `Exception in thread "main" java.lang.StackOverflowError\n\tat Main.recurse(Main.java:3)`;
    const source = `public class Main {\n  public static void recurse(int n) {\n    recurse(n + 1);\n  }\n}`;

    const report = diagnoseRuntimeError(stderr, [], source);

    assert.ok(report);
    assert.equal(report.category, "RUNTIME_STACK_OVERFLOW");
    assert.equal(report.line, 3);
    assert.ok(report.beginnerExplanation.howToFix.includes("base case"));
  });

  it("routes through unified diagnoseProgramFailure with priority on compiler diagnostics", () => {
    const diagnostics: CompilerDiagnostic[] = [
      {
        line: 2,
        column: 10,
        message: "';' expected",
        diagnosticType: "ERROR",
      },
    ];

    const source = `int x = 5`;

    const report = diagnoseProgramFailure({
      diagnostics,
      sourceCode: source,
    });

    assert.ok(report);
    assert.equal(report.category, "COMPILER_SYNTAX");
  });

  it("applies line replacement remediation safely without corrupting adjacent lines", () => {
    const source = `line 1\nline 2 error\nline 3`;
    const updated = applyRemediationFix(source, "line 2 fixed", 2);
    assert.equal(updated, `line 1\nline 2 fixed\nline 3`);
  });
});
