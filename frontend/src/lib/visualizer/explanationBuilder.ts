import {
  NormalizedExecutionEvent,
  StructuredStepExplanation,
} from "@/lib/api/types";
import { resolveVisualizationStrategy } from "./adaptiveStrategy";

function getLearnMoreForType(typeStr?: string): string {
  const t = (typeStr || "").toLowerCase().trim();
  switch (t) {
    case "int":
      return "In Java, 'int' is a 32-bit signed two's complement integer (-2,147,483,648 to 2,147,483,647).";
    case "double":
      return "Java 'double' is a 64-bit IEEE 754 double-precision floating-point type for fractional calculations.";
    case "float":
      return "Java 'float' is a 32-bit single-precision floating-point type, indicated with an 'f' suffix (e.g. 3.14f).";
    case "boolean":
      return "Java booleans represent strictly true or false. Unlike languages like C, integers cannot be coerced to booleans.";
    case "char":
      return "Java 'char' is a 16-bit Unicode character type supporting values from '\\u0000' to '\\uffff'.";
    case "long":
      return "Java 'long' is a 64-bit two's complement integer, typically denoted with an 'L' suffix (e.g. 100000L).";
    case "string":
      return "In Java, String is an immutable object. Any modification creates a new String instance in memory.";
    default:
      return "Variables in Java are strictly typed and must be declared with a matching type before use.";
  }
}

/**
 * Builds an intentional, structured educational explanation for any execution step.
 * Mode B fallback for non-visual events, and companion narrative for visual events.
 */
export function buildStepExplanation(
  event: NormalizedExecutionEvent,
  sourceLines?: string[]
): StructuredStepExplanation {
  const decision = resolveVisualizationStrategy(event);
  const isVisual = decision.mode === "VISUAL_EXECUTION";

  // Source line snippet
  const lineIndex = event.sourceLine - 1;
  const lineContent =
    sourceLines && lineIndex >= 0 && lineIndex < sourceLines.length
      ? sourceLines[lineIndex]?.trim()
      : undefined;

  // Snapshot variable values
  const currentValues: Record<string, string> = {};
  if (event.variables) {
    Object.entries(event.variables).forEach(([name, snap]) => {
      currentValues[name] = snap.value;
    });
  }

  const symbol = event.symbol || "variable";
  const curr = event.currentValue ?? "";
  const prev = event.previousValue;
  const typeStr =
    (event.metadata?.type as string) ||
    event.variables[symbol]?.type ||
    "int";

  switch (event.conceptType) {
    case "VARIABLE_DECLARATION":
      return {
        stepNumber: event.sequence,
        sourceLine: event.sourceLine,
        lineContent,
        category: "Variable Declaration",
        whatHappens: `A variable named '${symbol}' of type '${typeStr}' is declared and initialized with ${curr || "its default value"}.`,
        currentValues,
        whyItHappens:
          "Variable declarations allocate a named memory location in the local stack frame to hold data for future operations.",
        result: `'${symbol}' is now initialized and holds value ${curr || "default"}.`,
        learnMore: getLearnMoreForType(typeStr),
        isVisualCapable: isVisual,
      };

    case "VARIABLE_ASSIGNMENT":
    case "VALUE_CHANGE": {
      const isMutation = prev !== undefined && prev !== null && prev !== curr;
      return {
        stepNumber: event.sequence,
        sourceLine: event.sourceLine,
        lineContent,
        category: isMutation ? "Value Mutation" : "Variable Assignment",
        whatHappens: isMutation
          ? `The variable '${symbol}' is updated from ${prev} to ${curr}.`
          : `The variable '${symbol}' is assigned the value ${curr}.`,
        currentValues,
        whyItHappens:
          "The expression on the right-hand side of the assignment '=' was evaluated and stored in the target variable.",
        result: isMutation
          ? `'${symbol}' now stores ${curr} (previous value ${prev} was overwritten).`
          : `'${symbol}' now holds ${curr}.`,
        learnMore:
          "Java evaluates the entire right-hand side expression first, then stores the final computed result into the left-hand variable.",
        isVisualCapable: isVisual,
      };
    }

    case "CONDITION_CHECK":
    case "BRANCH": {
      const condExpr = (event.metadata?.condition as string) || symbol || "condition";
      const isTrue =
        curr === "true" ||
        event.metadata?.result === "true" ||
        event.description.includes("TRUE");

      return {
        stepNumber: event.sequence,
        sourceLine: event.sourceLine,
        lineContent,
        category: "Branch Decision",
        whatHappens: `The conditional expression '${condExpr}' is evaluated, resulting in boolean value ${isTrue ? "true" : "false"}.`,
        currentValues,
        whyItHappens:
          "Conditional if/else statements steer program execution flow depending on whether the guard expression is true or false.",
        result: isTrue
          ? "Condition evaluated to TRUE. Control flow enters the conditional block."
          : "Condition evaluated to FALSE. Control flow skips the conditional block.",
        controlFlowNote: isTrue ? "Branch taken (true)" : "Branch skipped (false)",
        learnMore:
          "Java if conditions require strict boolean expressions. In compound expressions (&&, ||), Java uses short-circuit evaluation.",
        isVisualCapable: isVisual,
      };
    }

    case "LOOP_START":
    case "LOOP_ITERATION": {
      const iteration =
        (event.metadata?.iteration as string) ||
        event.description.match(/iteration\s*(\d+)/i)?.[1] ||
        "1";
      const loopVar = Object.entries(event.variables).find(([k]) =>
        /^[ijk]$|^idx$|^count$/i.test(k)
      );

      return {
        stepNumber: event.sequence,
        sourceLine: event.sourceLine,
        lineContent,
        category: "Loop Iteration",
        whatHappens: `Loop iteration #${iteration} is executing${loopVar ? ` with loop counter '${loopVar[0]}' = ${loopVar[1].value}` : ""}.`,
        currentValues,
        whyItHappens:
          "The loop's boundary condition evaluated to true, granting permission to execute the loop body once more.",
        result: `Statements inside the loop body execute for pass #${iteration}.`,
        controlFlowNote: `Loop active (pass #${iteration})`,
        learnMore:
          "A Java for loop follows a standard 4-step cycle: Initialization -> Condition Check -> Body Execution -> Update Expression (↺).",
        isVisualCapable: isVisual,
      };
    }

    case "LOOP_END":
      return {
        stepNumber: event.sequence,
        sourceLine: event.sourceLine,
        lineContent,
        category: "Loop Termination",
        whatHappens: "The loop condition evaluated to false, terminating repetition.",
        currentValues,
        whyItHappens:
          "The loop counter exceeded the termination boundary, signaling the loop cycle to stop.",
        result: "Loop execution ends; control flow proceeds to the statement immediately following the loop.",
        controlFlowNote: "Loop finished",
        learnMore:
          "Variables declared inside a for loop header (such as `for (int i = 0; ...)`) go out of scope once the loop terminates.",
        isVisualCapable: isVisual,
      };

    case "ARRAY_MUTATION":
    case "ARRAY_ACCESS": {
      const isMutation = event.conceptType === "ARRAY_MUTATION";
      const targetIndex = event.metadata?.index ?? event.symbol?.match(/\[(\d+)\]/)?.[1];
      return {
        stepNumber: event.sequence,
        sourceLine: event.sourceLine,
        lineContent,
        category: "Array Operation",
        whatHappens: isMutation
          ? `Array element at ${symbol || "array"}${targetIndex !== undefined ? `[${targetIndex}]` : ""} is modified to '${curr}'.`
          : `Array element at ${symbol || "array"}${targetIndex !== undefined ? `[${targetIndex}]` : ""} was accessed with value '${curr}'.`,
        currentValues,
        whyItHappens:
          "Arrays store elements in contiguous indexed slots in heap memory, accessible in O(1) constant time.",
        result: isMutation
          ? `Array slot now stores '${curr}'.`
          : `Value '${curr}' was read from the array.`,
        learnMore:
          "Java arrays are zero-indexed and fixed in length upon allocation. Accessing an index outside [0, length - 1] raises an ArrayIndexOutOfBoundsException.",
        isVisualCapable: isVisual,
      };
    }

    case "OUTPUT":
      return {
        stepNumber: event.sequence,
        sourceLine: event.sourceLine,
        lineContent,
        category: "Console Output",
        whatHappens: `Standard output stream prints: "${curr || event.output}".`,
        currentValues,
        whyItHappens:
          "A call to System.out.print or System.out.println emitted characters to the runtime's standard output stream.",
        result: `Text buffer appended to console output at line ${event.sourceLine}.`,
        learnMore:
          "System.out is a PrintStream object that outputs text to standard output (stdout), automatically converting objects to string representations via toString().",
        isVisualCapable: isVisual,
      };

    case "FUNCTION_CALL":
    case "METHOD_CALL": {
      const topFrame = event.callStack?.[0];
      const methodName = topFrame?.methodName || event.symbol || "method";
      return {
        stepNumber: event.sequence,
        sourceLine: event.sourceLine,
        lineContent,
        category: "Method Call",
        whatHappens: `Method '${methodName}()' is called, transferring control to its definition.`,
        currentValues,
        whyItHappens:
          "The program reached a method invocation, passing any arguments and jumping to the method body.",
        result: `A new stack frame for '${methodName}()' was pushed onto the call stack (depth: ${event.callStack?.length || 1}).`,
        controlFlowNote: `Call: ${methodName}()`,
        learnMore:
          "Java passes all parameters by value: primitives pass a copy of the value, while objects pass a copy of the reference address.",
        isVisualCapable: isVisual,
      };
    }

    case "RETURN":
      return {
        stepNumber: event.sequence,
        sourceLine: event.sourceLine,
        lineContent,
        category: "Method Return",
        whatHappens: `Method execution finished and returned control to caller${curr ? ` with return value: ${curr}` : ""}.`,
        currentValues,
        whyItHappens:
          "The method reached a return statement or its closing brace, completing its task.",
        result: `The active stack frame was popped off the JVM call stack.`,
        controlFlowNote: "Return to caller",
        learnMore:
          "Local variables in a method frame are discarded upon return, freeing their stack memory.",
        isVisualCapable: isVisual,
      };

    case "OBJECT_CREATE":
    case "CONSTRUCTOR_CALL":
      return {
        stepNumber: event.sequence,
        sourceLine: event.sourceLine,
        lineContent,
        category: "Object Instantiation",
        whatHappens: `A new object instance of '${symbol || typeStr}' is allocated on the heap.`,
        currentValues,
        whyItHappens:
          "The 'new' keyword requests memory allocation from the JVM heap and invokes the class constructor.",
        result: `Instance initialized and reference assigned.`,
        learnMore:
          "Objects in Java reside in the heap and are automatically reclaimed by the Garbage Collector when no active references point to them.",
        isVisualCapable: isVisual,
      };

    case "EXCEPTION":
      return {
        stepNumber: event.sequence,
        sourceLine: event.sourceLine,
        lineContent,
        category: "Runtime Exception",
        whatHappens: `An exception occurred: ${event.description}.`,
        currentValues,
        whyItHappens:
          "An abnormal runtime condition was encountered that interrupted regular sequential execution.",
        result: "Standard execution was halted; exception was thrown.",
        learnMore:
          "In Java, all exceptions inherit from java.lang.Throwable. RuntimeExceptions are unchecked, while others must be declared or caught.",
        isVisualCapable: false,
      };

    default:
      return {
        stepNumber: event.sequence,
        sourceLine: event.sourceLine,
        lineContent,
        category: "Sequential Execution",
        whatHappens: lineContent
          ? `Executed: ${lineContent}`
          : event.description || `Executed statement at line ${event.sourceLine}.`,
        currentValues,
        whyItHappens:
          decision.reason ||
          "Sequential top-to-bottom instruction execution within the current block.",
        result: "Statement completed; control flow advances to the next instruction.",
        learnMore:
          "Java programs execute statement-by-statement in sequential order unless altered by branching, looping, or function calls.",
        isVisualCapable: isVisual,
      };
  }
}
