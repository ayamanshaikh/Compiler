# CodeVista AI

**"Don't just run your code. Understand what happens."**

An AI-assisted Java programming environment designed for students and beginner/intermediate programmers. CodeVista AI transforms Java code execution into an interactive learning experience — explaining errors, tracking program state, and visualizing execution step by step.

---

## The Problem

Programming beginners face two major challenges:

1. **Compiler errors are cryptic.** Messages like `';' expected` or `cannot find symbol` don't explain *what went wrong*, *why it went wrong*, or *how to fix it*.

2. **Code execution is invisible.** When students run algorithms like Bubble Sort or Binary Search, they see only the final output — not the comparisons, swaps, and variable changes that produced it.

## The Solution

CodeVista AI provides the complete execution intelligence pipeline:

```
CODE → COMPILE → UNDERSTAND ERRORS → RUN → CAPTURE EXECUTION → VISUALIZE → EXPLAIN → LEARN
```

### For Compilation Errors:
- Highlights the exact error line
- Shows the raw compiler message
- Provides a beginner-friendly explanation of what happened
- Suggests how to fix the problem

### For Successful Execution:
- Captures real execution steps via JDI (Java Debug Interface)
- Shows variable state changes at each step
- Visualizes array mutations with animations
- Explains what each line does in plain language

---

## Features

| Feature | Description |
|---------|-------------|
| **Real Java Compilation** | Actual `javac` compilation — no simulated environments |
| **Intelligent Error Analysis** | Every compiler error gets a plain-English explanation and fix suggestion |
| **Execution Visualization** | Step through execution line-by-line with live variable tracking |
| **Array Visualization** | See arrays transform with comparisons and swaps highlighted |
| **Learning Mode / Developer Mode** | Toggle between simple explanations and technical details |
| **Example Algorithms** | 8 built-in examples: Bubble Sort, Selection Sort, Binary Search, Linear Search, Factorial, Fibonacci, Stack, Queue |
| **Professional Code Editor** | Monaco Editor with Java syntax highlighting, bracket matching, and keyboard shortcuts |
| **AI Explanation Layer** | Architecture supports LLM integration for natural-language explanations |
| **Keyboard Shortcuts** | Ctrl+Enter to run, arrow keys to navigate execution steps |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  Next.js + React + TypeScript + Monaco Editor + Tailwind    │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │  Editor   │  │ Analysis     │  │ Execution Visualizer  │ │
│  │ (Monaco)  │  │ Panel        │  │ (Steps + Variables +  │ │
│  │           │  │ (Errors +    │  │  Arrays + Timeline)   │ │
│  │           │  │  Output)     │  │                       │ │
│  └──────────┘  └──────────────┘  └───────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                    POST /api/compile
                            │
┌─────────────────────────────────────────────────────────────┐
│                        Backend                               │
│  Spring Boot + Java 25 + Maven                               │
│  ┌──────────────────┐  ┌──────────────────────────────────┐ │
│  │ CompilerService   │  │ ExecutionTraceService            │ │
│  │ (javac + run)     │  │ (JDI-based execution capture)   │ │
│  └──────────────────┘  └──────────────────────────────────┘ │
│  ┌──────────────────┐  ┌──────────────────────────────────┐ │
│  │ ErrorAnalysis     │  │ ExplanationGenerator             │ │
│  │ (classify +       │  │ (human-readable step            │ │
│  │  explain errors)  │  │  explanations)                  │ │
│  └──────────────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                    JDI (Java Debug Interface)
                            │
┌─────────────────────────────────────────────────────────────┐
│                     Java Runtime                             │
│  Compiled user code running under debugger                   │
│  Real variable values, real array states, real execution     │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
- **Next.js 16** — React framework
- **React 19** — UI library
- **TypeScript** — Type safety
- **Monaco Editor** — Professional code editing
- **Tailwind CSS 4** — Styling
- **Lucide React** — Icons

### Backend
- **Java 25** — Runtime
- **Spring Boot 4.1** — Web framework
- **Maven** — Build tool
- **JDI (jdk.jdi)** — Java Debug Interface for execution tracing

---

## Getting Started

### Prerequisites

- **Java 25+** (JDK with `javac`)
- **Node.js 18+**
- **Maven** (bundled via `mvnw`)

### Running the Backend

```bash
cd backend/codevista-backend
./mvnw spring-boot:run
```

The backend starts on `http://localhost:8080`.

### Running the Frontend

```bash
# In the project root
npm install
npm run dev
```

The frontend starts on `http://localhost:3000`.

### Opening the Workspace

Navigate to `http://localhost:3000/workshop` to open the interactive Java workspace.

---

## API Documentation

### POST /api/compile

Compile and execute Java code.

**Request:**
```json
{
  "code": "public class Main {\n  public static void main(String[] args) {\n    System.out.println(\"Hello!\");\n  }\n}"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Code compiled and executed successfully.",
  "error": null,
  "explanation": "Your Java code compiled and executed successfully.",
  "lineNumber": 0,
  "suggestion": null,
  "output": "Hello!",
  "executionSteps": [
    {
      "step": 1,
      "lineNumber": 3,
      "code": "System.out.println(\"Hello!\");",
      "action": "OUTPUT",
      "explanation": "The program prints output to the console.",
      "variables": {},
      "arrays": {},
      "highlights": []
    }
  ],
  "executionTraceTruncated": false
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Compilation failed",
  "error": "Line 3: ';' expected",
  "explanation": "Java requires a semicolon at the end of most statements.",
  "lineNumber": 3,
  "suggestion": "Add a semicolon at the end of the statement on line 3.",
  "output": null
}
```

---

## How It Works

### Compilation Pipeline

1. User writes Java code in the Monaco Editor
2. Code is sent to the Spring Boot backend via `POST /api/compile`
3. Backend writes code to a temporary directory
4. `javac` compiles the code
5. If compilation succeeds, `java Main` executes it
6. Output is captured and returned

### Execution Tracing

1. After successful compilation, the `ExecutionTraceService` launches a second JVM under the Java Debug Interface (JDI)
2. A breakpoint is set at the `main` method
3. The tracer steps through each line, capturing:
   - Current line number
   - Source code at that line
   - All local variable values
   - Array states
4. After tracing, `ExplanationGenerator` classifies each step and generates human-readable explanations
5. The trace is returned with the compile response

### Error Analysis

1. Compiler output from `javac` is parsed to extract line numbers and error messages
2. Error messages are classified by type (missing semicolon, cannot find symbol, etc.)
3. Each error type maps to a beginner-friendly explanation and fix suggestion
4. Runtime errors are caught separately and explained with appropriate context

---

## Security Considerations

- **Temporary workspaces**: Each compilation creates an isolated temp directory, cleaned up after execution
- **Execution timeout**: Java programs are killed after 10 seconds (prevents infinite loops)
- **Compilation timeout**: `javac` is killed after 15 seconds
- **No network access**: User code cannot make network calls
- **No filesystem access**: User code is restricted to its temp directory
- **Source size limit**: Large inputs are handled gracefully
- **For production**: Run user code inside containers with CPU/memory limits

---

## Project Structure

```
codevista-ai/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Landing page
│   │   └── workshop/
│   │       └── page.tsx             # Main workspace
│   ├── components/
│   │   ├── Editor.tsx               # Monaco code editor
│   │   ├── AnalysisPanel.tsx        # Right panel orchestrator
│   │   ├── ErrorCard.tsx            # Error display with explanation
│   │   ├── OutputPanel.tsx          # Program output display
│   │   ├── Visualizer.tsx           # Execution step visualizer
│   │   ├── VariablePanel.tsx        # Variable state display
│   │   ├── ExecutionTimeline.tsx    # Step timeline navigation
│   │   ├── ControlBar.tsx           # Run/Visualize/Reset controls
│   │   ├── WorkspaceHeader.tsx      # Top navigation bar
│   │   ├── ExampleLoader.tsx        # Algorithm example dropdown
│   │   └── LearningModeToggle.tsx   # Learning/Developer mode switch
│   ├── lib/
│   │   ├── api.ts                   # Backend API client
│   │   └── types.ts                 # TypeScript interfaces
│   └── data/
│       ├── examples.ts              # 8 built-in algorithm examples
│       └── demoExecution.ts         # Reference fixture data
│
├── backend/codevista-backend/
│   └── src/main/java/com/codevista/
│       ├── CodevistaBackendApplication.java
│       ├── controller/
│       │   └── CompilerController.java
│       ├── service/
│       │   └── CompilerService.java
│       ├── execution/
│       │   └── ExecutionTraceService.java
│       ├── analysis/
│       │   └── ExplanationGenerator.java
│       └── model/
│           ├── CompileRequest.java
│           ├── CompileResponse.java
│           └── ExecutionStep.java
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## Future Work

- **LLM Integration**: Add OpenAI/Anthropic API for natural-language explanations
- **More Data Structures**: Support LinkedList, Stack, Queue, HashMap, Tree, Graph visualization
- **Full Debugger**: Step Into, Step Over, Step Back, conditional breakpoints
- **File Management**: Multi-file projects, import support
- **Sandbox**: Docker-based execution for production deployment
- **Collaboration**: Share code and visualizations with peers
- **Progress Tracking**: Track which algorithms students have completed

---

## Research Motivation

CodeVista AI is built on the hypothesis that **making program execution visible** significantly improves learning outcomes for programming beginners. By combining:

- **Real compilation** (not simulated)
- **Execution tracing** (actual variable states, not hard-coded)
- **Visual feedback** (arrays, comparisons, swaps)
- **Human-readable explanations** (plain language, not compiler jargon)

...students can build a mental model of how programs execute, leading to deeper understanding and faster skill development.

---

## License

This project is for educational and demonstration purposes.
