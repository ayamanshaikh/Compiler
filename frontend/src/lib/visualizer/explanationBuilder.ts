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
        beginnerMode: {
          summary: `Create variable '${symbol}' with starting value ${curr || "0"}.`,
          keyValues: `${symbol} = ${curr || "0"}`,
          plainReason: `We need a container named '${symbol}' to store this value so we can use it in math or logic later.`,
          actionSummary: `Variable '${symbol}' created and ready to use.`,
        },
        detailedMode: {
          technicalMechanics: `Allocated slot in local variable array of current JVM stack frame for '${symbol}' (${typeStr}). Initialized with value ${curr || "default"}.`,
          runtimeScope: `Local method scope (${event.scope || "main()"}), frame depth ${event.callStack?.length || 1}`,
          stackHeapImplication: `Primitive/reference stored directly in active thread call-stack frame; no heap allocation unless instantiated.`,
          compilerOrJvmReasoning: `Java compiler verified '${symbol}' was not previously declared in this scope and emitted iload/istore opcode sequence.`,
        },
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
        beginnerMode: {
          summary: `Change '${symbol}' to ${curr}${isMutation ? ` (was ${prev})` : ""}.`,
          keyValues: isMutation ? `${symbol}: ${prev} ➔ ${curr}` : `${symbol} = ${curr}`,
          plainReason: `The program calculated a new value and saved it into '${symbol}', replacing any old number.`,
          actionSummary: `'${symbol}' updated to ${curr}.`,
        },
        detailedMode: {
          technicalMechanics: `Evaluated RHS expression onto operand stack and executed store opcode targeting local variable index for symbol '${symbol}'. Value changed from ${prev ?? "unassigned"} to ${curr}.`,
          runtimeScope: `Active scope (${event.scope || "local"}), line ${event.sourceLine}`,
          stackHeapImplication: `Direct 32/64-bit slot overwrite in current execution frame on thread call stack.`,
          compilerOrJvmReasoning: `JVM verifies runtime type compatibility between assigned value and variable type '${typeStr}'.`,
        },
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
        beginnerMode: {
          summary: `Checking if '${condExpr}' is true: result is ${isTrue ? "YES (True)" : "NO (False)"}.`,
          keyValues: `${condExpr} ➔ ${isTrue ? "TRUE" : "FALSE"}`,
          plainReason: isTrue
            ? "Since the question is true, we go inside the if-block to run its code."
            : "Since the question is false, we skip past the if-block.",
          actionSummary: isTrue ? "Entering if-block code." : "Skipping if-block code.",
        },
        detailedMode: {
          technicalMechanics: `Evaluated boolean relational expression '${condExpr}'. Emitted conditional branch opcode; condition flag set to ${isTrue}.`,
          runtimeScope: `Decision guard at source line ${event.sourceLine}`,
          stackHeapImplication: `Program Counter (PC) conditional jump: ${isTrue ? "fall-through into then-block" : "forward branch jump offset past block"}.`,
          compilerOrJvmReasoning: `Short-circuit boolean operators evaluated. Guard expression evaluated to primitive boolean on operand stack.`,
        },
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
        beginnerMode: {
          summary: `Loop pass #${iteration}${loopVar ? `: counter '${loopVar[0]}' is ${loopVar[1].value}` : ""}.`,
          keyValues: `Pass #${iteration}${loopVar ? ` (${loopVar[0]}=${loopVar[1].value})` : ""}`,
          plainReason: "The loop condition is still met, so the computer loops back and runs the code block again.",
          actionSummary: `Executing pass #${iteration} of loop.`,
        },
        detailedMode: {
          technicalMechanics: `Loop boundary predicate satisfied. Control flow dispatched through loop body iteration #${iteration}.`,
          runtimeScope: `Loop iteration scope (iteration #${iteration})`,
          stackHeapImplication: `Local variable array persists state; operand stack reset for body statements.`,
          compilerOrJvmReasoning: `Iterative cycle backed by comparison and backward goto instruction.`,
        },
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
        beginnerMode: {
          summary: "Loop is done! Condition is no longer true.",
          keyValues: "Loop exit",
          plainReason: "The loop finished all its passes and stopped repeating. The program moves on to the next line.",
          actionSummary: "Loop exited; proceeding to next lines.",
        },
        detailedMode: {
          technicalMechanics: `Loop termination predicate evaluated to false. Backward goto bypassed; control advances to following bytecode instruction.`,
          runtimeScope: `Exiting loop block scope`,
          stackHeapImplication: `Loop-scoped variables dereferenced from active scope; stack frames preserved.`,
          compilerOrJvmReasoning: `JVM advances instruction pointer past loop block boundary.`,
        },
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
        beginnerMode: {
          summary: isMutation
            ? `Change array item at slot [${targetIndex ?? 0}] to ${curr}.`
            : `Read array item at slot [${targetIndex ?? 0}], which is ${curr}.`,
          keyValues: `${symbol || "array"}[${targetIndex ?? 0}] = ${curr}`,
          plainReason: isMutation
            ? "We are storing a new value into this specific numbered position in the list."
            : "We are fetching the value currently saved in this numbered position.",
          actionSummary: isMutation ? "Array element updated." : "Array element read.",
        },
        detailedMode: {
          technicalMechanics: isMutation
            ? `Array store opcode (iastore/aastore) targeting index ${targetIndex ?? 0} with operand value '${curr}'.`
            : `Array load opcode (iaload/aaload) from index ${targetIndex ?? 0}.`,
          runtimeScope: `Heap buffer access via reference symbol '${symbol || "arr"}'`,
          stackHeapImplication: `Direct memory cell mutation in contiguous heap array buffer; array reference pointer unchanged.`,
          compilerOrJvmReasoning: `JVM boundary check: ensures 0 <= index < array.length prior to memory access, throwing ArrayIndexOutOfBoundsException on violation.`,
        },
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
        beginnerMode: {
          summary: `Print message: "${curr || event.output}".`,
          keyValues: `Stdout: "${curr || event.output}"`,
          plainReason: "System.out.println tells the computer to show this message in the console output.",
          actionSummary: `Printed "${curr || event.output}" to output window.`,
        },
        detailedMode: {
          technicalMechanics: `Virtual method call on java.lang.System.out (PrintStream instance). Flushed byte stream to stdout descriptor.`,
          runtimeScope: `Standard output stream runtime pipe`,
          stackHeapImplication: `String instance passed to PrintStream; character array encoded and transferred to OS stdout buffer.`,
          compilerOrJvmReasoning: `Resolved static field java.lang.System.out and dispatched invokevirtual PrintStream.println.`,
        },
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
        beginnerMode: {
          summary: `Call '${methodName}()' to execute its steps.`,
          keyValues: `Calling ${methodName}()`,
          plainReason: `The program jumps to '${methodName}()' to run the actions defined inside it.`,
          actionSummary: `Entered '${methodName}()'.`,
        },
        detailedMode: {
          technicalMechanics: `Invoked method '${methodName}' (invokestatic/invokevirtual). Pushed new execution frame onto JVM thread call stack.`,
          runtimeScope: `New call stack frame scope: ${methodName}()`,
          stackHeapImplication: `Allocates dedicated local variable table and operand stack on current execution thread stack.`,
          compilerOrJvmReasoning: `Bytecode invocation passes arguments and binds formal parameters in newly pushed frame.`,
        },
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
        beginnerMode: {
          summary: `Finished method and returning to caller${curr ? ` with result ${curr}` : ""}.`,
          keyValues: curr ? `Returned: ${curr}` : `Return to caller`,
          plainReason: "The function is done with its work and hands control back to where it was called.",
          actionSummary: "Returned back to calling code.",
        },
        detailedMode: {
          technicalMechanics: `Executed return opcode (return/ireturn/areturn). Popped top stack frame from call stack.`,
          runtimeScope: `Returning to caller frame: ${event.callStack?.[1]?.methodName || "caller"}`,
          stackHeapImplication: `Frame deallocated from call stack; return value placed atop caller's operand stack.`,
          compilerOrJvmReasoning: `Type-checked return value matches declared method return signature.`,
        },
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
        beginnerMode: {
          summary: `Created a new '${symbol || typeStr}' object in memory.`,
          keyValues: `new ${symbol || typeStr}()`,
          plainReason: "The 'new' keyword builds a new object and sets up its starting values.",
          actionSummary: `New '${symbol || typeStr}' created.`,
        },
        detailedMode: {
          technicalMechanics: `Bytecode 'new' opcode allocated uninitialized memory on heap; invoked constructor via 'invokespecial' <init>.`,
          runtimeScope: `Heap instance bound to local variable reference '${symbol}'`,
          stackHeapImplication: `Object header, field storage, and method table pointer allocated on heap; stack slot receives 64-bit reference address.`,
          compilerOrJvmReasoning: `Instantiates class hierarchy from java.lang.Object down, assigning default field values before constructor body executes.`,
        },
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
        beginnerMode: {
          summary: `An error happened: ${event.description}.`,
          keyValues: `Exception: ${event.description}`,
          plainReason: "The computer hit an illegal or impossible condition (like dividing by zero or missing index), stopping the program.",
          actionSummary: "Program stopped due to runtime error.",
        },
        detailedMode: {
          technicalMechanics: `Runtime exception thrown: ${event.description}. Initiated stack unwinding search for active exception handler.`,
          runtimeScope: `Thread execution context (uncaught)`,
          stackHeapImplication: `Instantiation of Throwable object on heap capturing execution stack backtrace.`,
          compilerOrJvmReasoning: `Control diverted to JVM exception table or thread default uncaught exception handler.`,
        },
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
        beginnerMode: {
          summary: lineContent ? `Ran line: ${lineContent}` : `Ran code at line ${event.sourceLine}.`,
          keyValues: `Line ${event.sourceLine}`,
          plainReason: "The computer runs instructions sequentially from top to bottom.",
          actionSummary: "Instruction completed.",
        },
        detailedMode: {
          technicalMechanics: lineContent
            ? `Executed instruction sequence corresponding to: ${lineContent}`
            : `Executed instruction sequence at source line ${event.sourceLine}.`,
          runtimeScope: `Sequential scope: ${event.scope || "main"}`,
          stackHeapImplication: `Program Counter advanced; local operand stack and variables maintained.`,
          compilerOrJvmReasoning: `Sequential instruction execution following bytecode ordering in class file.`,
        },
      };
  }
}
