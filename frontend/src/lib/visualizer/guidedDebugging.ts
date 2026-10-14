import { CompilerDiagnostic, TraceStep } from "@/lib/api/types";

export type DiagnosedErrorCategory =
  | "COMPILER_SYNTAX"
  | "COMPILER_TYPE"
  | "COMPILER_SYMBOL"
  | "RUNTIME_NULL_POINTER"
  | "RUNTIME_INDEX_OUT_OF_BOUNDS"
  | "RUNTIME_ARITHMETIC"
  | "RUNTIME_STACK_OVERFLOW"
  | "RUNTIME_CLASS_CAST"
  | "RUNTIME_GENERIC";

export interface GuidedErrorRemediation {
  errorType: string;
  category: DiagnosedErrorCategory;
  line: number;
  column: number;
  failingSnippet: string;
  observedMessage: string;
  expectedContract: string;
  beginnerExplanation: {
    summary: string;
    analogy: string;
    whyItHappened: string;
    howToFix: string;
  };
  detailedExplanation: {
    technicalError: string;
    jvmOrCompilerSpec: string;
    rootCauseAnalysis: string;
    remediationSteps: string[];
  };
  suggestedFix: {
    originalLine: string;
    correctedLine: string;
    explanation: string;
  };
  correctedSourceCode: string;
  canSimulateFix: boolean;
  isGroundedInDiagnostics: boolean;
}

/**
 * Replaces the failing line with the suggested correction in the given source code.
 */
export function applyRemediationFix(
  sourceCode: string,
  correctedLine: string,
  lineNumber: number
): string {
  const lines = sourceCode.split(/\r?\n/);
  if (lineNumber < 1 || lineNumber > lines.length) {
    return sourceCode;
  }
  lines[lineNumber - 1] = correctedLine;
  return lines.join("\n");
}

/**
 * Diagnoses compiler diagnostics grounded in actual OpenJDK javac messages.
 */
export function diagnoseCompilerError(
  diagnostics: CompilerDiagnostic[],
  sourceCode: string
): GuidedErrorRemediation | null {
  if (!diagnostics || diagnostics.length === 0) return null;

  const primary = diagnostics[0];
  const lineNum = primary.line || 1;
  const colNum = primary.column || 1;
  const lines = sourceCode.split(/\r?\n/);
  const rawLine = lines[lineNum - 1] || "";
  const msg = primary.message || "";
  const lowerMsg = msg.toLowerCase();

  let category: DiagnosedErrorCategory = "COMPILER_SYNTAX";
  let expectedContract = "Valid Java syntactic statement";
  let summary = "The compiler could not understand this line of code.";
  let analogy = "Like forgetting punctuation at the end of a sentence in an essay.";
  let whyItHappened = "Java syntax rules require every statement to end properly.";
  let howToFix = "Review the syntax near the cursor position.";
  let jvmSpec = "JLS §14.5: Statements must conform to Java syntactic grammar.";
  let rootCause = primary.message;
  const remediationSteps: string[] = ["Inspect the indicated line and column."];

  let correctedLine = rawLine;

  if (lowerMsg.includes("';' expected") || lowerMsg.includes("semicolon expected")) {
    category = "COMPILER_SYNTAX";
    expectedContract = "Statement termination token ';' expected before newline";
    summary = "A semicolon ';' is missing at the end of the statement.";
    analogy = "In English, every sentence ends with a period. In Java, every statement must end with a semicolon.";
    whyItHappened = "Java grammar requires an explicit semicolon to demarcate where an instruction terminates.";
    howToFix = "Add a semicolon ';' to the end of the line.";
    jvmSpec = "JLS §14.5: ExpressionStatement is terminated by a semicolon ';'.";
    rootCause = "Missing statement terminator before token newline or closing brace.";
    remediationSteps.push("Append ';' at the end of the expression.");

    if (!rawLine.trim().endsWith(";")) {
      correctedLine = rawLine.trimEnd() + ";";
    }
  } else if (lowerMsg.includes("cannot find symbol")) {
    category = "COMPILER_SYMBOL";
    const symbolMatch = msg.match(/symbol:\s*(?:variable|method|class)\s+([A-Za-z0-9_$]+)/);
    const sym = symbolMatch ? symbolMatch[1] : "identifier";

    expectedContract = `Symbol '${sym}' must be declared and in scope`;
    summary = `The name '${sym}' has not been defined or is spelled incorrectly.`;
    analogy = "Calling a person by a nickname they don't have, or trying to use a tool that hasn't been brought out of the toolbox yet.";
    whyItHappened = `Java searched the current scope and imports for '${sym}' but could not find any declaration matching it.`;
    howToFix = `Check the spelling of '${sym}' or declare it with its type before using it.`;
    jvmSpec = "JLS §6.5: Determining the meaning of a name requires an accessible declaration in the current scope.";
    rootCause = `Unresolved identifier '${sym}' in current lexical scope.`;
    remediationSteps.push(`Ensure '${sym}' is declared with a valid type.`);
    remediationSteps.push(`Verify case sensitivity (Java distinguishes 'myVar' from 'MyVar').`);
  } else if (lowerMsg.includes("incompatible types")) {
    category = "COMPILER_TYPE";
    expectedContract = "Assigned value type must be assignable to target variable type";
    summary = "You are trying to assign a value into a variable of an incompatible type.";
    analogy = "Trying to pour a gallon jug of water into an 8-ounce cup without spilling.";
    whyItHappened = "Java is statically typed. It prevents lossy conversions or mismatched types automatically.";
    howToFix = "Cast the value explicitly or change the variable type to match.";
    jvmSpec = "JLS §5.2: Assignment context permits assignment conversion only if type S is assignable to target type T.";
    rootCause = msg;
    remediationSteps.push("Examine the types of both the left-hand variable and right-hand expression.");
    remediationSteps.push("Use an explicit type cast e.g. (int) value if intentional.");
  } else if (primary.explanation) {
    summary = primary.explanation.simpleExplanation;
    whyItHappened = primary.explanation.whyItHappened;
    howToFix = primary.explanation.howToFix;
    rootCause = primary.explanation.technicalError;
  }

  const correctedSourceCode = applyRemediationFix(sourceCode, correctedLine, lineNum);

  return {
    errorType: primary.code || "Compiler Diagnostic",
    category,
    line: lineNum,
    column: colNum,
    failingSnippet: rawLine.trim(),
    observedMessage: primary.message,
    expectedContract,
    beginnerExplanation: {
      summary,
      analogy,
      whyItHappened,
      howToFix,
    },
    detailedExplanation: {
      technicalError: primary.message,
      jvmOrCompilerSpec: jvmSpec,
      rootCauseAnalysis: rootCause,
      remediationSteps,
    },
    suggestedFix: {
      originalLine: rawLine,
      correctedLine,
      explanation: howToFix,
    },
    correctedSourceCode,
    canSimulateFix: correctedLine !== rawLine,
    isGroundedInDiagnostics: true,
  };
}

/**
 * Diagnoses JVM runtime exceptions grounded in actual exception messages, stack traces, and failing state.
 */
export function diagnoseRuntimeError(
  stderr: string,
  steps: TraceStep[],
  sourceCode: string
): GuidedErrorRemediation | null {
  if (!stderr && (!steps || steps.length === 0)) return null;

  const lines = sourceCode.split(/\r?\n/);

  // Extract exception class and message from standard error or last step
  const exMatch = stderr.match(/Exception in thread ".*?"\s+([A-Za-z0-9_$.]+):\s*(.*)/);
  const exClass = exMatch ? exMatch[1] : "java.lang.RuntimeException";
  const exDetail = exMatch ? exMatch[2] : stderr.trim();

  // Extract failing line number from stack trace
  const lineMatch = stderr.match(/:(\d+)\)/);
  let failingLine = lineMatch ? parseInt(lineMatch[1], 10) : 1;
  if (isNaN(failingLine) || failingLine < 1 || failingLine > lines.length) {
    // Fall back to last recorded step's line
    failingLine = steps.length > 0 && steps[steps.length - 1].line ? steps[steps.length - 1].line : 1;
  }

  const rawLine = lines[failingLine - 1] || "";
  let category: DiagnosedErrorCategory = "RUNTIME_GENERIC";
  let expectedContract = "Safe runtime program execution within bounds";
  let summary = "The program crashed during execution.";
  let analogy = "Like a car hitting a roadblock that wasn't visible on the map.";
  let whyItHappened = "An unexpected state occurred that Java could not resolve at runtime.";
  let howToFix = "Add a safety check before executing this operation.";
  let jvmSpec = "JVM Spec §6.5: Instruction failed runtime verification.";
  let rootCause = exDetail || stderr;
  const remediationSteps: string[] = ["Examine the state of variables immediately before this line executes."];
  let correctedLine = rawLine;

  if (exClass.includes("ArrayIndexOutOfBoundsException") || exDetail.includes("Index") || exDetail.includes("out of bounds")) {
    category = "RUNTIME_INDEX_OUT_OF_BOUNDS";
    expectedContract = "Array index must be >= 0 and < array.length";
    summary = "The code tried to access an array slot that doesn't exist.";
    analogy = "Looking for apartment #10 in a building that only has 5 apartments.";
    whyItHappened = "In Java, array indices start at 0 and end at length - 1. Loops with '<=' often accidentally ask for index 'length', which is 1 past the end.";
    howToFix = "Change '<= arr.length' to '< arr.length', or make sure your index is strictly less than the length.";
    jvmSpec = "JVM Spec: iaload / iastore throws ArrayIndexOutOfBoundsException if index < 0 or index >= arrayref.length.";
    rootCause = `Array index accessed was outside boundary [0, length - 1].`;
    remediationSteps.push("Check loop condition: use '< array.length' instead of '<= array.length'.");
    remediationSteps.push("Validate array length before indexing.");

    // Auto-fix pattern: replace "<= arr.length" with "< arr.length"
    if (rawLine.includes("<=") && (rawLine.includes(".length") || rawLine.includes("length"))) {
      correctedLine = rawLine.replace("<=", "<");
    }
  } else if (exClass.includes("NullPointerException") || exDetail.includes("null")) {
    category = "RUNTIME_NULL_POINTER";
    expectedContract = "Object reference must point to an active heap instance, not null";
    summary = "The code tried to use an object that hasn't been created yet (it is null).";
    analogy = "Trying to open the door to a house that hasn't been built yet, or dial a phone number that is blank.";
    whyItHappened = "A variable holds the special reference 'null', meaning it points to no memory address.";
    howToFix = "Initialize the variable using 'new' before calling methods on it, or check '!= null'.";
    jvmSpec = "JVM Spec: invokevirtual / getfield throws NullPointerException if objectref is null.";
    rootCause = "Dereferencing null pointer.";
    remediationSteps.push("Initialize the object with a constructor call.");
    remediationSteps.push("Add a null check guard before method invocation.");

    if (rawLine.includes(".") && !rawLine.includes("if (") && !rawLine.trim().startsWith("//")) {
      const parts = rawLine.trim().split(".");
      const objName = parts[0].trim();
      if (/^[A-Za-z0-9_$]+$/.test(objName)) {
        correctedLine = `${" ".repeat(rawLine.search(/\S/))}if (${objName} != null) { ${rawLine.trim()} }`;
      }
    }
  } else if (exClass.includes("ArithmeticException") || exDetail.includes("/ by zero")) {
    category = "RUNTIME_ARITHMETIC";
    expectedContract = "Divisor must not be equal to zero (denominator != 0)";
    summary = "The code attempted to divide an integer by zero, which is mathematically impossible.";
    analogy = "Trying to divide 10 cookies equally among 0 people.";
    whyItHappened = "In integer arithmetic, dividing by zero causes the CPU to raise a divide-by-zero hardware exception, which Java catches as ArithmeticException.";
    howToFix = "Add a condition to check if the denominator is zero before dividing.";
    jvmSpec = "JVM Spec: idiv / irem throws ArithmeticException if divisor value is 0.";
    rootCause = "Integer division by zero.";
    remediationSteps.push("Verify the divisor value before division.");
    remediationSteps.push("Guard division with a non-zero check.");

    if (rawLine.includes("/")) {
      const match = rawLine.match(/\/\s*([A-Za-z0-9_$]+)/);
      if (match && match[1]) {
        const divisor = match[1];
        correctedLine = `${" ".repeat(rawLine.search(/\S/))}if (${divisor} != 0) { ${rawLine.trim()} }`;
      }
    }
  } else if (exClass.includes("StackOverflowError")) {
    category = "RUNTIME_STACK_OVERFLOW";
    expectedContract = "Recursive method invocations must reach a base case before exceeding JVM stack limit";
    summary = "A method called itself repeatedly without stopping, running out of call stack memory.";
    analogy = "Sticking two mirrors facing each other: the reflection goes on infinitely until you run out of light.";
    whyItHappened = "The recursive method lacks a base condition, or the arguments passed never move closer to the base condition.";
    howToFix = "Add an 'if' base case at the top of the recursive function that returns immediately when reached.";
    jvmSpec = "JVM Spec §2.5.2: Java Virtual Machine stack overflow occurs when thread requires a larger stack than permitted.";
    rootCause = "Unbounded or infinite recursion without base case convergence.";
    remediationSteps.push("Check that the method has a termination condition (base case).");
    remediationSteps.push("Check that the recursive parameter decreases or moves toward the base case.");
  }

  const correctedSourceCode = applyRemediationFix(sourceCode, correctedLine, failingLine);

  return {
    errorType: exClass.split(".").pop() || "RuntimeException",
    category,
    line: failingLine,
    column: 1,
    failingSnippet: rawLine.trim(),
    observedMessage: exDetail || exClass,
    expectedContract,
    beginnerExplanation: {
      summary,
      analogy,
      whyItHappened,
      howToFix,
    },
    detailedExplanation: {
      technicalError: `${exClass}: ${exDetail}`,
      jvmOrCompilerSpec: jvmSpec,
      rootCauseAnalysis: rootCause,
      remediationSteps,
    },
    suggestedFix: {
      originalLine: rawLine,
      correctedLine,
      explanation: howToFix,
    },
    correctedSourceCode,
    canSimulateFix: correctedLine !== rawLine,
    isGroundedInDiagnostics: true,
  };
}

/**
 * Unified diagnostic entrance point: determines whether failure is a compiler diagnostic or runtime exception.
 */
export function diagnoseProgramFailure(payload: {
  diagnostics?: CompilerDiagnostic[];
  stderr?: string;
  runtimeError?: string;
  steps?: TraceStep[];
  sourceCode: string;
}): GuidedErrorRemediation | null {
  const { diagnostics, stderr, runtimeError, steps, sourceCode } = payload;

  if (diagnostics && diagnostics.length > 0) {
    const res = diagnoseCompilerError(diagnostics, sourceCode);
    if (res) return res;
  }

  const errorString = runtimeError || stderr || "";
  if (errorString.trim().length > 0) {
    return diagnoseRuntimeError(errorString, steps || [], sourceCode);
  }

  return null;
}
