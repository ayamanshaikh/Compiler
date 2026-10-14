import {
  NormalizedExecutionEvent,
  NormalizedConceptType,
  CompilerDiagnostic,
  TraceEventType,
  VariableSnapshot,
  StackFrameSnapshot,
  HeapObjectSnapshot,
} from "@/lib/api/types";

export type LanguageId = "java" | "python" | "cpp" | "c";
export type SyntaxFamily = "c-like" | "pythonic";
export type MemoryModelType =
  | "jvm_hotspot"
  | "cpython_reference"
  | "native_address_space";
export type ExecutionParadigm =
  | "compiled_bytecode"
  | "interpreted_bytecode"
  | "compiled_native";

export interface LanguageCapabilities {
  syntaxFamily: SyntaxFamily;
  memoryModel: MemoryModelType;
  executionParadigm: ExecutionParadigm;
  defaultFileExtension: string;
  monacoLanguage: string;
  compilationStages: string[];
  disassemblyFormatName: string;
  supportsPointers: boolean;
  supportsDynamicTyping: boolean;
  supportsGarbageCollection: boolean;
  runtimeEngine: string;
}

export interface SampleProgram {
  id: string;
  title: string;
  language: LanguageId;
  category: "Variables" | "Loops" | "Arrays" | "Recursion" | "Objects" | "Pointers" | "Exceptions";
  description: string;
  sourceCode: string;
  defaultInput?: string;
}

export interface LanguageAdapter {
  readonly id: LanguageId;
  readonly name: string;
  readonly version: string;
  readonly fileExtension: string;
  readonly monacoLanguage: string;
  readonly capabilities: LanguageCapabilities;

  /**
   * Normalizes language-specific raw runtime/tracer events into the uniform
   * NormalizedExecutionEvent model.
   */
  normalizeEvent(
    rawEvent: Record<string, unknown>,
    stepIndex: number
  ): NormalizedExecutionEvent;

  /**
   * Parses authentic compiler or runtime diagnostic messages without inventing fake issues.
   */
  parseDiagnostics(rawOutput: string): CompilerDiagnostic[];

  /**
   * Formats raw disassembly (JVM bytecode, CPython opcodes, or x86 assembly) into structured lines.
   */
  formatDisassembly(rawDisassembly: string): string[];

  /**
   * Returns curated pedagogical sample programs grounded in this language.
   */
  getSamplePrograms(): SampleProgram[];

  /**
   * Default starting code snippet for workspace editing.
   */
  getDefaultCode(): string;
}

// ---------------------------------------------------------------------------
// 1. Java Language Adapter (JVM HotSpot)
// ---------------------------------------------------------------------------

export class JavaLanguageAdapter implements LanguageAdapter {
  readonly id: LanguageId = "java";
  readonly name = "Java";
  readonly version = "OpenJDK 21 / 25 LTS";
  readonly fileExtension = ".java";
  readonly monacoLanguage = "java";

  readonly capabilities: LanguageCapabilities = {
    syntaxFamily: "c-like",
    memoryModel: "jvm_hotspot",
    executionParadigm: "compiled_bytecode",
    defaultFileExtension: ".java",
    monacoLanguage: "java",
    compilationStages: [
      "1. Source Code (UTF-8)",
      "2. Lexical Tokenizer (Javac Parser)",
      "3. Abstract Syntax Tree (JCTree)",
      "4. Symbol Resolution & Type Checking (Attr/Flow)",
      "5. JVM Bytecode Generation (.class HotSpot)",
    ],
    disassemblyFormatName: "JVM Bytecode (javap -c -v)",
    supportsPointers: false,
    supportsDynamicTyping: false,
    supportsGarbageCollection: true,
    runtimeEngine: "JVM HotSpot (LVT & Operand Stack)",
  };

  normalizeEvent(
    raw: Record<string, unknown>,
    stepIndex: number
  ): NormalizedExecutionEvent {
    const eventType = (raw.eventType as TraceEventType) || "LINE";
    const line = Number(raw.line ?? raw.sourceLine ?? 1);
    const symbol = typeof raw.symbol === "string" ? raw.symbol : undefined;
    const currVal = raw.currentValue !== undefined ? String(raw.currentValue) : undefined;
    const prevVal = raw.previousValue !== undefined ? String(raw.previousValue) : undefined;

    let conceptType: NormalizedConceptType = "GENERIC_STEP";
    if (eventType === "VARIABLE_DECLARATION") conceptType = "VARIABLE_DECLARATION";
    else if (eventType === "VARIABLE_ASSIGNMENT") {
      conceptType = prevVal ? "VALUE_CHANGE" : "VARIABLE_ASSIGNMENT";
    } else if (eventType === "ARRAY_MUTATION") conceptType = "ARRAY_MUTATION";
    else if (eventType === "ARRAY_ACCESS") conceptType = "ARRAY_ACCESS";
    else if (eventType === "CONDITION_EVALUATION") conceptType = "CONDITION_CHECK";
    else if (eventType === "LOOP_ITERATION") conceptType = "LOOP_ITERATION";
    else if (eventType === "EXCEPTION_THROWN") conceptType = "EXCEPTION";
    else if (eventType === "OUTPUT_PRINT") conceptType = "OUTPUT";
    else if (eventType === "METHOD_ENTRY") conceptType = "METHOD_CALL";
    else if (eventType === "METHOD_EXIT") conceptType = "RETURN";
    else conceptType = "LINE_EXECUTION";

    return {
      sequence: Number(raw.stepIndex ?? stepIndex),
      eventType,
      conceptType,
      sourceLine: line,
      sourceColumn: typeof raw.column === "number" ? raw.column : undefined,
      scope: typeof raw.scope === "string" ? raw.scope : "main",
      symbol,
      previousValue: prevVal,
      currentValue: currVal,
      operation: typeof raw.operation === "string" ? raw.operation : undefined,
      metadata: (raw.metadata as Record<string, unknown>) || {},
      description: typeof raw.description === "string" ? raw.description : `Executing line ${line}`,
      output: typeof raw.output === "string" ? raw.output : "",
      variables: (raw.variables as Record<string, VariableSnapshot>) || {},
      callStack: (raw.callStack as StackFrameSnapshot[]) || [],
      heapObjects: (raw.heapObjects as Record<string, HeapObjectSnapshot>) || {},
    };
  }

  parseDiagnostics(rawOutput: string): CompilerDiagnostic[] {
    if (!rawOutput) return [];
    const diagnostics: CompilerDiagnostic[] = [];
    const lines = rawOutput.split("\n");

    const javacRegex = /(?:[A-Za-z]:)?[^:\n]+:(\d+):\s*(?:error|warning):\s*(.+)/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(javacRegex);
      if (match) {
        const lineNum = parseInt(match[1], 10);
        const msg = match[2].trim();
        const isWarning = /warning:/i.test(line);

        let snippet: string | undefined;
        let col = 1;
        if (i + 2 < lines.length && lines[i + 2].includes("^")) {
          snippet = lines[i + 1].trim();
          col = Math.max(1, lines[i + 2].indexOf("^") + 1);
        }

        diagnostics.push({
          line: lineNum,
          column: col,
          message: msg,
          diagnosticType: isWarning ? "WARNING" : "ERROR",
          sourceContext: snippet,
        });
      }
    }
    return diagnostics;
  }

  formatDisassembly(rawDisassembly: string): string[] {
    if (!rawDisassembly) return [];
    return rawDisassembly
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("Compiled from") && !l.startsWith("Classfile"));
  }

  getSamplePrograms(): SampleProgram[] {
    return [
      {
        id: "java-linear-search",
        title: "Linear Search & Element Scan",
        language: "java",
        category: "Arrays",
        description: "Scans an integer array sequentially to find target value 42 with condition branching.",
        sourceCode: `public class Main {
    public static void main(String[] args) {
        int[] arr = {10, 25, 42, 88, 99};
        int target = 42;
        int foundIndex = -1;

        for (int i = 0; i < arr.length; i++) {
            if (arr[i] == target) {
                foundIndex = i;
                System.out.println("Target found at index: " + foundIndex);
                break;
            }
        }
    }
}`,
      },
      {
        id: "java-bubble-sort",
        title: "Bubble Sort Swap Verification",
        language: "java",
        category: "Arrays",
        description: "Quadratic O(n²) sorting with element swap tracking and inner loop boundary reductions.",
        sourceCode: `public class Main {
    public static void main(String[] args) {
        int[] numbers = {5, 1, 4, 2, 8};
        int n = numbers.length;

        for (int i = 0; i < n - 1; i++) {
            for (int j = 0; j < n - i - 1; j++) {
                if (numbers[j] > numbers[j + 1]) {
                    int temp = numbers[j];
                    numbers[j] = numbers[j + 1];
                    numbers[j + 1] = temp;
                }
            }
        }
    }
}`,
      },
      {
        id: "java-recursion-fib",
        title: "Recursive Fibonacci Call Tree",
        language: "java",
        category: "Recursion",
        description: "Visualizes recursion call stack depth, parameter frames, and base-case returns.",
        sourceCode: `public class Main {
    public static int fib(int n) {
        if (n <= 1) return n;
        return fib(n - 1) + fib(n - 2);
    }

    public static void main(String[] args) {
        int result = fib(4);
        System.out.println("Fibonacci(4) = " + result);
    }
}`,
      },
    ];
  }

  getDefaultCode(): string {
    return `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, CodeVista AI!");
        
        int sum = 0;
        for (int i = 1; i <= 5; i++) {
            sum += i;
            System.out.println("i=" + i + ", running sum=" + sum);
        }
        
        System.out.println("Final Calculated Sum: " + sum);
    }
}`;
  }
}

// ---------------------------------------------------------------------------
// 2. Python Language Adapter (CPython 3.12 Reference Model)
// ---------------------------------------------------------------------------

export class PythonLanguageAdapter implements LanguageAdapter {
  readonly id: LanguageId = "python";
  readonly name = "Python";
  readonly version = "CPython 3.12+";
  readonly fileExtension = ".py";
  readonly monacoLanguage = "python";

  readonly capabilities: LanguageCapabilities = {
    syntaxFamily: "pythonic",
    memoryModel: "cpython_reference",
    executionParadigm: "interpreted_bytecode",
    defaultFileExtension: ".py",
    monacoLanguage: "python",
    compilationStages: [
      "1. Python Source (PEP 8 UTF-8)",
      "2. Tokenizer (tokenize / INDENT & DEDENT)",
      "3. Concrete & Abstract Syntax Tree (ast module)",
      "4. CPython Bytecode Compiler (code objects / PyCodeObject)",
      "5. PyVM Frame Evaluation (PyEval_EvalFrameDefault)",
    ],
    disassemblyFormatName: "CPython Bytecode (dis.dis)",
    supportsPointers: false,
    supportsDynamicTyping: true,
    supportsGarbageCollection: true,
    runtimeEngine: "CPython VM (Name Binding & Reference Counting)",
  };

  normalizeEvent(
    raw: Record<string, unknown>,
    stepIndex: number
  ): NormalizedExecutionEvent {
    const line = Number(raw.line ?? raw.sourceLine ?? 1);
    const symbol = typeof raw.symbol === "string" ? raw.symbol : undefined;
    const currVal = raw.currentValue !== undefined ? String(raw.currentValue) : undefined;
    const prevVal = raw.previousValue !== undefined ? String(raw.previousValue) : undefined;
    const rawType = String(raw.eventType || raw.event || "LINE");

    let eventType: TraceEventType = "LINE";
    let conceptType: NormalizedConceptType = "LINE_EXECUTION";

    if (rawType.includes("ASSIGN") || rawType === "STORE_NAME" || rawType === "STORE_FAST") {
      eventType = "VARIABLE_ASSIGNMENT";
      conceptType = prevVal ? "VALUE_CHANGE" : "VARIABLE_ASSIGNMENT";
    } else if (rawType.includes("LIST") || rawType === "BUILD_LIST" || rawType.includes("APPEND")) {
      eventType = "COLLECTION_OPERATION";
      conceptType = "COLLECTION_OPERATION";
    } else if (rawType.includes("CALL") || rawType === "CALL_FUNCTION") {
      eventType = "METHOD_ENTRY";
      conceptType = "FUNCTION_CALL";
    } else if (rawType.includes("RETURN") || rawType === "RETURN_VALUE") {
      eventType = "METHOD_EXIT";
      conceptType = "RETURN";
    } else if (rawType.includes("EXCEPTION") || rawType.includes("ERROR")) {
      eventType = "EXCEPTION_THROWN";
      conceptType = "EXCEPTION";
    } else if (rawType.includes("PRINT") || rawType.includes("OUTPUT")) {
      eventType = "OUTPUT_PRINT";
      conceptType = "OUTPUT";
    } else if (rawType.includes("FOR") || rawType.includes("WHILE") || rawType === "FOR_ITER") {
      eventType = "LOOP_ITERATION";
      conceptType = "LOOP_ITERATION";
    }

    const variables: Record<string, VariableSnapshot> = (raw.variables as Record<string, VariableSnapshot>) || {};
    if (symbol && currVal !== undefined && !variables[symbol]) {
      const inferredType =
        currVal.startsWith("[") ? "list" :
        currVal.startsWith("{") ? "dict" :
        !isNaN(Number(currVal)) ? "int" :
        currVal === "True" || currVal === "False" ? "bool" : "str";

      variables[symbol] = {
        name: symbol,
        type: inferredType,
        value: currVal,
        previousValue: prevVal,
      };
    }

    return {
      sequence: Number(raw.stepIndex ?? stepIndex),
      eventType,
      conceptType,
      sourceLine: line,
      sourceColumn: typeof raw.column === "number" ? raw.column : undefined,
      scope: typeof raw.scope === "string" ? raw.scope : "global",
      symbol,
      previousValue: prevVal,
      currentValue: currVal,
      operation: typeof raw.operation === "string" ? raw.operation : undefined,
      metadata: {
        language: "python",
        ...(raw.metadata as Record<string, unknown> || {}),
      },
      description: typeof raw.description === "string" ? raw.description : `Execute Python line ${line}`,
      output: typeof raw.output === "string" ? raw.output : "",
      variables,
      callStack: (raw.callStack as StackFrameSnapshot[]) || [],
      heapObjects: (raw.heapObjects as Record<string, HeapObjectSnapshot>) || {},
    };
  }

  parseDiagnostics(rawOutput: string): CompilerDiagnostic[] {
    if (!rawOutput) return [];
    const diagnostics: CompilerDiagnostic[] = [];
    const lines = rawOutput.split("\n");

    const fileLineRegex = /File ".*?", line (\d+)(?:, in (.+))?/i;
    const errorNameRegex = /^([A-Z][a-zA-Z]*Error|SyntaxError|IndentationError):\s*(.+)/;

    let pendingLine = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const fileMatch = line.match(fileLineRegex);
      if (fileMatch) {
        pendingLine = parseInt(fileMatch[1], 10);
      }

      const errMatch = line.match(errorNameRegex);
      if (errMatch) {
        const errType = errMatch[1];
        const msg = errMatch[2].trim();

        let col = 1;
        let snippet: string | undefined;
        if (i > 1 && lines[i - 1].includes("^")) {
          col = Math.max(1, lines[i - 1].indexOf("^") + 1);
          snippet = lines[i - 2]?.trim();
        }

        diagnostics.push({
          line: pendingLine,
          column: col,
          message: `${errType}: ${msg}`,
          diagnosticType: "ERROR",
          sourceContext: snippet,
          code: errType,
        });
      }
    }
    return diagnostics;
  }

  formatDisassembly(rawDisassembly: string): string[] {
    if (!rawDisassembly) return [];
    return rawDisassembly
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("Disassembly of"));
  }

  getSamplePrograms(): SampleProgram[] {
    return [
      {
        id: "python-list-operations",
        title: "Dynamic List & Append Growth",
        language: "python",
        category: "Arrays",
        description: "Tracks dynamic CPython PyListObject memory growth and element append mutations.",
        sourceCode: `def main():
    numbers = []
    for i in range(1, 6):
        numbers.append(i * 10)
        print(f"Appended {i * 10}, list: {numbers}")
    
    total = sum(numbers)
    print(f"Total: {total}")

if __name__ == "__main__":
    main()`,
      },
      {
        id: "python-recursive-factorial",
        title: "Recursive Factorial & Stack Depth",
        language: "python",
        category: "Recursion",
        description: "Visualizes Python call frame creation, parameter bindings, and unwind evaluation.",
        sourceCode: `def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

def main():
    num = 5
    result = factorial(num)
    print(f"Factorial of {num} is {result}")

if __name__ == "__main__":
    main()`,
      },
      {
        id: "python-binary-search",
        title: "Binary Search & Window Halving",
        language: "python",
        category: "Loops",
        description: "Demonstrates logarithmic O(log n) window division with low, mid, and high index pointers.",
        sourceCode: `def binary_search(arr, target):
    low = 0
    high = len(arr) - 1

    while low <= high:
        mid = (low + high) // 2
        guess = arr[mid]
        if guess == target:
            return mid
        elif guess > target:
            high = mid - 1
        else:
            low = mid + 1
    return -1

def main():
    arr = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
    target = 23
    idx = binary_search(arr, target)
    print(f"Target {target} located at index {idx}")

if __name__ == "__main__":
    main()`,
      },
    ];
  }

  getDefaultCode(): string {
    return `# CodeVista AI - Python Interactive Visualizer
def main():
    print("Hello, CodeVista AI in Python!")
    
    running_sum = 0
    for i in range(1, 6):
        running_sum += i
        print(f"i={i}, running_sum={running_sum}")
        
    print(f"Final Calculated Sum: {running_sum}")

if __name__ == "__main__":
    main()`;
  }
}

// ---------------------------------------------------------------------------
// 3. C++ Language Adapter (Native Address Space & Pointers)
// ---------------------------------------------------------------------------

export class CppLanguageAdapter implements LanguageAdapter {
  readonly id: LanguageId = "cpp";
  readonly name = "C++";
  readonly version = "C++20 / Clang 18";
  readonly fileExtension = ".cpp";
  readonly monacoLanguage = "cpp";

  readonly capabilities: LanguageCapabilities = {
    syntaxFamily: "c-like",
    memoryModel: "native_address_space",
    executionParadigm: "compiled_native",
    defaultFileExtension: ".cpp",
    monacoLanguage: "cpp",
    compilationStages: [
      "1. Source Code (.cpp)",
      "2. C Preprocessor (#include expansion & macros)",
      "3. Clang/GCC Parser & AST Construction",
      "4. LLVM IR & Target Code Optimization (-O2)",
      "5. Native Machine Code / Assembly (x86-64 / ARM64)",
    ],
    disassemblyFormatName: "Native x86-64 Assembly (objdump -d / objdump -M intel)",
    supportsPointers: true,
    supportsDynamicTyping: false,
    supportsGarbageCollection: false,
    runtimeEngine: "Native CPU & OS Virtual Address Space",
  };

  normalizeEvent(
    raw: Record<string, unknown>,
    stepIndex: number
  ): NormalizedExecutionEvent {
    const line = Number(raw.line ?? raw.sourceLine ?? 1);
    const symbol = typeof raw.symbol === "string" ? raw.symbol : undefined;
    const currVal = raw.currentValue !== undefined ? String(raw.currentValue) : undefined;
    const prevVal = raw.previousValue !== undefined ? String(raw.previousValue) : undefined;
    const rawType = String(raw.eventType || "LINE");

    let eventType: TraceEventType = "LINE";
    let conceptType: NormalizedConceptType = "LINE_EXECUTION";

    if (rawType.includes("POINTER") || (currVal && currVal.startsWith("0x"))) {
      eventType = "VARIABLE_ASSIGNMENT";
      conceptType = "VARIABLE_ASSIGNMENT";
    } else if (rawType.includes("ASSIGN") || rawType === "VARIABLE_ASSIGNMENT") {
      eventType = "VARIABLE_ASSIGNMENT";
      conceptType = prevVal ? "VALUE_CHANGE" : "VARIABLE_ASSIGNMENT";
    } else if (rawType.includes("ARRAY") || rawType === "ARRAY_MUTATION") {
      eventType = "ARRAY_MUTATION";
      conceptType = "ARRAY_MUTATION";
    } else if (rawType.includes("BRANCH") || rawType.includes("CONDITION")) {
      eventType = "CONDITION_EVALUATION";
      conceptType = "CONDITION_CHECK";
    } else if (rawType.includes("LOOP")) {
      eventType = "LOOP_ITERATION";
      conceptType = "LOOP_ITERATION";
    } else if (rawType.includes("PRINT") || rawType.includes("OUTPUT")) {
      eventType = "OUTPUT_PRINT";
      conceptType = "OUTPUT";
    }

    const metadata: Record<string, unknown> = {
      language: "cpp",
      ...(raw.metadata as Record<string, unknown> || {}),
    };

    if (currVal && currVal.startsWith("0x")) {
      metadata.isPointer = true;
      metadata.targetAddress = currVal;
    }

    return {
      sequence: Number(raw.stepIndex ?? stepIndex),
      eventType,
      conceptType,
      sourceLine: line,
      sourceColumn: typeof raw.column === "number" ? raw.column : undefined,
      scope: typeof raw.scope === "string" ? raw.scope : "main",
      symbol,
      previousValue: prevVal,
      currentValue: currVal,
      operation: typeof raw.operation === "string" ? raw.operation : undefined,
      metadata,
      description: typeof raw.description === "string" ? raw.description : `Execute C++ instruction at line ${line}`,
      output: typeof raw.output === "string" ? raw.output : "",
      variables: (raw.variables as Record<string, VariableSnapshot>) || {},
      callStack: (raw.callStack as StackFrameSnapshot[]) || [],
      heapObjects: (raw.heapObjects as Record<string, HeapObjectSnapshot>) || {},
    };
  }

  parseDiagnostics(rawOutput: string): CompilerDiagnostic[] {
    if (!rawOutput) return [];
    const diagnostics: CompilerDiagnostic[] = [];
    const lines = rawOutput.split("\n");

    const gccRegex = /^(?:[A-Za-z]:)?[^:\n]+:(\d+):(\d+):\s*(error|warning|note):\s*(.+)/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(gccRegex);
      if (match) {
        const lineNum = parseInt(match[1], 10);
        const colNum = parseInt(match[2], 10);
        const diagType = match[3].toLowerCase();
        const msg = match[4].trim();

        let snippet: string | undefined;
        if (i + 1 < lines.length && !lines[i + 1].match(gccRegex)) {
          snippet = lines[i + 1].trim();
        }

        diagnostics.push({
          line: lineNum,
          column: colNum,
          message: msg,
          diagnosticType:
            diagType === "warning" ? "WARNING" :
            diagType === "note" ? "NOTE" : "ERROR",
          sourceContext: snippet,
        });
      }
    }
    return diagnostics;
  }

  formatDisassembly(rawDisassembly: string): string[] {
    if (!rawDisassembly) return [];
    return rawDisassembly
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("Disassembly of section") && !l.startsWith("file format"));
  }

  getSamplePrograms(): SampleProgram[] {
    return [
      {
        id: "cpp-pointers-memory",
        title: "Pointers & Memory Addresses",
        language: "cpp",
        category: "Pointers",
        description: "Demystifies the address-of operator (&) and dereference operator (*) in the virtual memory stack.",
        sourceCode: `#include <iostream>

int main() {
    int value = 42;
    int *ptr = &value;

    std::cout << "Original Value: " << value << std::endl;
    std::cout << "Pointer Address: " << ptr << std::endl;

    *ptr = 99; // Mutate value via pointer dereference
    std::cout << "Mutated Value: " << value << std::endl;

    return 0;
}`,
      },
      {
        id: "cpp-array-pointers",
        title: "Array Traversal via Pointer Arithmetic",
        language: "cpp",
        category: "Pointers",
        description: "Shows contiguous array memory layout and pointer displacement arithmetic *(p + i).",
        sourceCode: `#include <iostream>

int main() {
    int numbers[4] = {10, 20, 30, 40};
    int *ptr = numbers;

    for (int i = 0; i < 4; i++) {
        std::cout << "Element " << i << " = " << *(ptr + i) 
                  << " at address " << (ptr + i) << std::endl;
    }

    return 0;
}`,
      },
      {
        id: "cpp-vector-push",
        title: "Dynamic std::vector Capacity Doubling",
        language: "cpp",
        category: "Arrays",
        description: "Tracks automatic dynamic heap reallocation when vector size exceeds current capacity.",
        sourceCode: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> vec;
    for (int i = 1; i <= 5; i++) {
        vec.push_back(i * 10);
        std::cout << "Added " << (i * 10) 
                  << " | Size: " << vec.size() 
                  << " | Cap: " << vec.capacity() << std::endl;
    }
    return 0;
}`,
      },
    ];
  }

  getDefaultCode(): string {
    return `// CodeVista AI - C++ Interactive Visualizer
#include <iostream>

int main() {
    std::cout << "Hello, CodeVista AI in C++!" << std::endl;
    
    int sum = 0;
    for (int i = 1; i <= 5; ++i) {
        sum += i;
        std::cout << "i=" << i << ", running sum=" << sum << std::endl;
    }
    
    std::cout << "Final Calculated Sum: " << sum << std::endl;
    return 0;
}`;
  }
}

// ---------------------------------------------------------------------------
// 4. C Language Adapter (C17 / C23 Pure Procedural)
// ---------------------------------------------------------------------------

export class CLanguageAdapter implements LanguageAdapter {
  readonly id: LanguageId = "c";
  readonly name = "C";
  readonly version = "C17 / GCC 13";
  readonly fileExtension = ".c";
  readonly monacoLanguage = "c";

  readonly capabilities: LanguageCapabilities = {
    syntaxFamily: "c-like",
    memoryModel: "native_address_space",
    executionParadigm: "compiled_native",
    defaultFileExtension: ".c",
    monacoLanguage: "c",
    compilationStages: [
      "1. C Source Code (.c)",
      "2. Preprocessor (cpp / #include / macros)",
      "3. GCC Lexer & Parser",
      "4. Assembly Code Generation (x86-64 Gas)",
      "5. Linker (ld / crt0 / libc.so)",
    ],
    disassemblyFormatName: "x86-64 AT&T Assembly",
    supportsPointers: true,
    supportsDynamicTyping: false,
    supportsGarbageCollection: false,
    runtimeEngine: "Pure Procedural C Runtime & glibc",
  };

  private readonly cppDelegate = new CppLanguageAdapter();

  normalizeEvent(raw: Record<string, unknown>, stepIndex: number): NormalizedExecutionEvent {
    const event = this.cppDelegate.normalizeEvent(raw, stepIndex);
    event.metadata.language = "c";
    return event;
  }

  parseDiagnostics(rawOutput: string): CompilerDiagnostic[] {
    return this.cppDelegate.parseDiagnostics(rawOutput);
  }

  formatDisassembly(rawDisassembly: string): string[] {
    return this.cppDelegate.formatDisassembly(rawDisassembly);
  }

  getSamplePrograms(): SampleProgram[] {
    return [
      {
        id: "c-malloc-free",
        title: "Manual Heap Allocation (malloc / free)",
        language: "c",
        category: "Pointers",
        description: "Visualizes explicit heap byte request via malloc, memory initialization, and free release.",
        sourceCode: `#include <stdio.h>
#include <stdlib.h>

int main() {
    int *arr = (int*)malloc(3 * sizeof(int));
    if (arr == NULL) return 1;

    arr[0] = 100;
    arr[1] = 200;
    arr[2] = 300;

    for (int i = 0; i < 3; i++) {
        printf("arr[%d] = %d\\n", i, arr[i]);
    }

    free(arr);
    return 0;
}`,
      },
    ];
  }

  getDefaultCode(): string {
    return `// CodeVista AI - C Interactive Visualizer
#include <stdio.h>

int main() {
    printf("Hello, CodeVista AI in C!\\n");
    
    int sum = 0;
    for (int i = 1; i <= 5; ++i) {
        sum += i;
        printf("i=%d, running sum=%d\\n", i, sum);
    }
    
    printf("Final Calculated Sum: %d\\n", sum);
    return 0;
}`;
  }
}

// ---------------------------------------------------------------------------
// 5. Language Adapter Registry (Singleton)
// ---------------------------------------------------------------------------

export class LanguageAdapterRegistry {
  private readonly adapters = new Map<LanguageId, LanguageAdapter>();

  constructor() {
    this.register(new JavaLanguageAdapter());
    this.register(new PythonLanguageAdapter());
    this.register(new CppLanguageAdapter());
    this.register(new CLanguageAdapter());
  }

  register(adapter: LanguageAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  get(id: LanguageId | string): LanguageAdapter {
    const cleanId = (id || "java").toLowerCase() as LanguageId;
    const adapter = this.adapters.get(cleanId);
    if (!adapter) {
      // Fallback to Java default adapter per Rule 2.1
      return this.adapters.get("java")!;
    }
    return adapter;
  }

  getAll(): LanguageAdapter[] {
    return Array.from(this.adapters.values());
  }

  getRegisteredLanguageIds(): LanguageId[] {
    return Array.from(this.adapters.keys());
  }

  getDefaultAdapter(): LanguageAdapter {
    return this.adapters.get("java")!;
  }

  detectFromFilename(filename: string): LanguageId {
    if (!filename) return "java";
    const lower = filename.toLowerCase();
    if (lower.endsWith(".py")) return "python";
    if (lower.endsWith(".cpp") || lower.endsWith(".cc") || lower.endsWith(".cxx") || lower.endsWith(".hpp")) {
      return "cpp";
    }
    if (lower.endsWith(".c") || lower.endsWith(".h")) return "c";
    return "java";
  }
}

export const languageRegistry = new LanguageAdapterRegistry();
