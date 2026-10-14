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
  } else if (lowerMsg.includes("syntaxerror") || lowerMsg.includes("indentationerror")) {
    category = "COMPILER_SYNTAX";
    expectedContract = "Python statements must conform to PEP 8 grammar and indentation";
    summary = lowerMsg.includes("indentationerror")
      ? "Python requires consistent indentation (usually 4 spaces) to define code blocks."
      : "Python could not parse this line because of invalid syntax.";
    analogy = "Like a paragraph with a sudden random indentation that doesn't belong to any list.";
    whyItHappened = "Python does not use curly braces '{}'; it uses whitespace indentation to know which statements belong inside loops, conditions, or functions.";
    howToFix = "Ensure indentation is consistent (4 spaces) and keywords/colons ':' are placed properly.";
    jvmSpec = "CPython Parser: Tokenizer detected indentation mismatch or invalid grammar production.";
    rootCause = primary.message;
    remediationSteps.push("Verify indentation levels match previous lines in the same block.");
    remediationSteps.push("Check that statement headers (if, for, while, def) end with a colon ':'.");
  } else if (lowerMsg.includes("was not declared in this scope")) {
    category = "COMPILER_SYMBOL";
    const symMatch = msg.match(/'([^']+)'\s+was not declared/);
    const sym = symMatch ? symMatch[1] : "identifier";
    expectedContract = `Identifier '${sym}' must be declared with a type before use`;
    summary = `C/C++ compiler cannot find a declaration for '${sym}'.`;
    analogy = "Calling a phone number that hasn't been saved in your contacts yet.";
    whyItHappened = "C and C++ require all variables and functions to be declared before they are called.";
    howToFix = `Declare '${sym}' with its type (e.g. 'int ${sym};') or include the required header file.`;
    jvmSpec = "ISO C++ §6.2: Identification of unqualified names via lookup in declarative regions.";
    rootCause = `Unresolved symbol '${sym}' in current lexical scope.`;
    remediationSteps.push(`Declare '${sym}' before using it.`);
    remediationSteps.push("Verify any required #include header is present at the top of the file.");
  } else if (lowerMsg.includes("expected ';'") || lowerMsg.includes("expected ';' before")) {
    category = "COMPILER_SYNTAX";
    expectedContract = "Statement in C/C++ must terminate with ';'";
    summary = "A semicolon ';' is missing before the next token.";
    analogy = "Like a sentence missing a closing period in an essay.";
    whyItHappened = "C and C++ grammar requires an explicit ';' to mark the boundary of simple statements.";
    howToFix = "Add a semicolon ';' to the end of the line.";
    jvmSpec = "ISO C §6.8: An expression statement consists of an optional expression followed by a semicolon ';'.";
    rootCause = "Missing statement terminator ';'.";
    remediationSteps.push("Append ';' at the end of the statement.");
    if (!rawLine.trim().endsWith(";")) {
      correctedLine = rawLine.trimEnd() + ";";
    }
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
  } else if (exClass.includes("ZeroDivisionError") || exDetail.includes("division by zero")) {
    category = "RUNTIME_ARITHMETIC";
    expectedContract = "Divisor operand must be non-zero (divisor != 0)";
    summary = "The code attempted to divide by zero in Python.";
    analogy = "Trying to distribute books among zero students—it cannot be done mathematically.";
    whyItHappened = "Python does not allow integer or floating-point division by zero and raises ZeroDivisionError immediately.";
    howToFix = "Ensure the denominator is not zero before dividing or use an 'if divisor != 0:' check.";
    jvmSpec = "CPython: PyEval_EvalFrameDefault encountered BINARY_OP / with rhs 0 and raised ZeroDivisionError.";
    rootCause = "Python division by zero.";
    remediationSteps.push("Verify the value of the divisor before division.");
    remediationSteps.push("Add a guard check 'if divisor != 0:' in Python.");
  } else if (exClass.includes("IndexError") || exDetail.includes("list index out of range")) {
    category = "RUNTIME_INDEX_OUT_OF_BOUNDS";
    expectedContract = "List index must be within range 0 <= index < len(sequence)";
    summary = "Attempted to access an index that does not exist in the list.";
    analogy = "Looking for apartment #10 in a building with only 5 apartments.";
    whyItHappened = "Python lists are 0-indexed. An index greater than or equal to len(list) raises IndexError.";
    howToFix = "Ensure your index is less than len(list), or iterate directly using 'for item in list:'.";
    jvmSpec = "CPython PyList_GetItem: index >= PyList_GET_SIZE(listref) bounds check failure.";
    rootCause = "List index out of range.";
    remediationSteps.push("Check that the index is strictly less than len(list).");
    remediationSteps.push("Consider iterating directly over items using 'for x in list:'.");
  } else if (exClass.includes("NameError") || exDetail.includes("is not defined")) {
    category = "COMPILER_SYMBOL";
    const nameMatch = exDetail.match(/name '([^']+)' is not defined/);
    const sym = nameMatch ? nameMatch[1] : "variable";
    expectedContract = `Variable '${sym}' must be assigned before being referenced`;
    summary = `The name '${sym}' has not been assigned a value yet.`;
    analogy = "Trying to open a package that hasn't arrived yet.";
    whyItHappened = `Python looked up '${sym}' in the local and global namespaces, but no object is bound to that name.`;
    howToFix = `Assign a value to '${sym}' (e.g. '${sym} = 0') before using it.`;
    jvmSpec = "CPython: LOAD_NAME/LOAD_FAST failed to resolve identifier in f_locals or f_globals dict.";
    rootCause = `Unbound variable name '${sym}'.`;
    remediationSteps.push(`Define '${sym}' before referencing it.`);
    remediationSteps.push(`Check for typos in '${sym}' (Python is case-sensitive).`);
  } else if (exClass.includes("TypeError") || exDetail.includes("unsupported operand type")) {
    category = "COMPILER_TYPE";
    expectedContract = "Operands must have compatible types for the applied operator";
    summary = "An operator was applied to data types that don't support it (e.g. adding a string to an integer).";
    analogy = "Trying to add 5 apples to 'blue'.";
    whyItHappened = "Python is strongly typed. Even though variables don't require type declarations, Python refuses to perform unsupported operations between mismatched types.";
    howToFix = "Convert the types explicitly, for example with int(x) or str(x).";
    jvmSpec = "CPython: Type slot nb_add returned Py_NotImplemented for operand types.";
    rootCause = exDetail || "Type mismatch in Python expression.";
    remediationSteps.push("Check the types of the variables involved using type(x).");
    remediationSteps.push("Use explicit type casting: str(num) or int(text).");
  } else if (exClass.includes("RecursionError") || exDetail.includes("maximum recursion depth")) {
    category = "RUNTIME_STACK_OVERFLOW";
    expectedContract = "Recursion depth must not exceed sys.getrecursionlimit() (default 1000)";
    summary = "The function called itself repeatedly without reaching a stopping base case.";
    analogy = "Two mirrors facing each other creating an endless tunnel of reflections.";
    whyItHappened = "Python limits recursive calls to prevent system stack overflow. When a function recurses infinitely, Python stops it with RecursionError.";
    howToFix = "Add a stopping condition 'if n <= 1: return ...' at the very beginning of the function.";
    jvmSpec = "CPython: Py_EnterRecursiveCall reached recursion limit.";
    rootCause = "Infinite or excessively deep recursion without base case convergence.";
    remediationSteps.push("Ensure your function has a base case return statement.");
    remediationSteps.push("Ensure each recursive call moves arguments closer to the base case.");
  } else if (exDetail.includes("Segmentation fault") || exDetail.includes("SIGSEGV") || exDetail.includes("core dumped")) {
    category = "RUNTIME_NULL_POINTER";
    expectedContract = "Pointers must reference valid, allocated virtual memory addresses";
    summary = "Segmentation Fault (SIGSEGV): The program tried to access restricted or unmapped memory.";
    analogy = "Trying to enter a room in a building that doesn't exist, or using a key on a locked door you don't own.";
    whyItHappened = "A pointer was dereferenced while pointing to NULL (0x0), an uninitialized address, or already freed memory.";
    howToFix = "Check that the pointer is not NULL ('if (ptr != nullptr)') and that array indices stay within allocated bounds.";
    jvmSpec = "POSIX / x86-64 MMU: Hardware page fault triggered SIGSEGV signal (invalid memory access).";
    rootCause = "Illegal memory dereference (NULL pointer or dangling pointer).";
    remediationSteps.push("Check for nullptr before dereferencing: if (ptr != nullptr) { ... }");
    remediationSteps.push("Ensure dynamic buffers allocated with new/malloc are not accessed after delete/free.");
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
