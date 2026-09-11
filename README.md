# CodeVista AI

**"Don't just run your code. Understand what happens."**

An interactive Java programming environment designed for students and beginner/intermediate programmers. CodeVista AI compiles real Java code, explains compiler and runtime errors in plain language, and visualizes execution step by step — variables, arrays, comparisons, and swaps — driven by a real execution trace, never a hard-coded demo.

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

- **For compilation errors:** highlights the exact line, shows the raw compiler message, explains what happened in beginner-friendly language, and suggests a fix.
- **For runtime errors:** distinguishes them from compilation failures and points at the failing source line.
- **For successful runs:** captures a real execution trace (via JDI), and lets you step through it with live variable/array state and plain-language commentary.

---

## Features

| Feature | Description |
|---------|-------------|
| **Real Java Compilation** | Actual `javac` compilation and `java` execution — no simulation |
| **Intelligent Error Analysis** | Compiler/runtime errors get a plain-English explanation and fix suggestion |
| **Execution Visualization** | Step through a real trace line-by-line with live variable tracking |
| **Array Visualization** | `int[]`/`double[]`/`float[]` render as bars, `String[]`/`boolean[]`/`char[]` as chips — comparisons and swaps highlighted |
| **Scalar Condition Analysis** | `if (a > b)`, `while (n <= 1)` get a TRUE/FALSE badge with left/right values and operator |
| **Recursion Depth** | Every step shows the call-stack depth — factorial/fibonacci recursion is visible as it unfolds |
| **Object Field Introspection** | User-defined objects expose fields as `obj.field` in the variable panel |
| **Multi-Class Tracing** | Steps into user helper classes (constructor bodies, methods), not just `Main` |
| **Learning / Developer Mode** | Toggle between simple and technical explanations |
| **Example Algorithms** | 8 built-in examples: Bubble Sort, Selection Sort, Binary Search, Linear Search, Factorial, Fibonacci, Stack, Queue |
| **Monaco Editor** | Java syntax highlighting, bracket matching, error-line markers, keyboard shortcuts |
| **Execution History** | Recent runs (successes and failures) via `GET /api/history` |
| **Keyboard Shortcuts** | `Ctrl+Enter` to run, arrow keys to step through execution |

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
              │  /api/compile · /api/history · /api/health
              ▼            (Next.js proxy → Spring Boot)
┌─────────────────────────────────────────────────────────────┐
│                        Backend                               │
│  Spring Boot + Java 25 + Maven                               │
│  ┌──────────────────┐  ┌──────────────────────────────────┐ │
│  │ CompilerService   │  │ ExecutionTraceService            │ │
│  │ (javac + run,     │  │ (JDI-based execution capture)   │ │
│  │  sandbox limits)  │  └──────────────────────────────────┘ │
│  ├──────────────────┤  ┌──────────────────────────────────┐ │
│  │ HistoryService    │  │ ExplanationGenerator             │ │
│  │ (in-memory runs)  │  │ (human-readable step labels)    │ │
│  └──────────────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
              │   subprocess (javac / java with limits)
              ▼
       Java Runtime (user code)
```

### Execution tracing

The `ExecutionTraceService` relaunches the compiled program under the Java Debug Interface (JDI), steps through it line by line, and reads *real* local-variable and array values out of the live JVM. It traces **user classes** (not just `Main`) while stepping over JDK internals, captures typed arrays (`int[]`, `double[]`, `String[]`, `boolean[]`, …), introspects fields of user objects, annotates conditions with their evaluated left/right values and operator, and records recursion call depth. Steps are filtered aggressively (noise like braces and loop-counter churn is removed, compound operations like 3-line swaps are collapsed), then classified and explained by `ExplanationGenerator`. The trace is `truncated`-flagged if it exceeds caps, never silently cut.

---

## Technology Stack

### Frontend
- **Next.js 16** · **React 19** · **TypeScript**
- **Monaco Editor** (via `@monaco-editor/react`)
- **Tailwind CSS 4** · **Lucide React** · **anime.js** · **framer-motion**

### Backend
- **Java 25** · **Spring Boot 4.1** · **Maven**
- **JDI (`jdk.jdi`)** — Java Debug Interface for execution tracing

---

## Getting Started

### Prerequisites

- **Java 25+** (JDK with `javac` on `PATH`)
- **Node.js 18+**
- **Maven** (bundled via `mvnw`)

### Running the Backend

```bash
cd backend/codevista-backend
./mvnw spring-boot:run
```

The backend starts on `http://localhost:8080`. Verify: `curl http://localhost:8080/api/health`.

### Running the Frontend

```bash
# In the project root
npm install
npm run dev
```

The frontend starts on `http://localhost:3000` (or a free port). Open **`/workshop`** for the IDE, **`/history`** for past runs.

The Next.js dev server proxies `/api/*` to the backend, so no CORS configuration is needed in development. If the backend is elsewhere, set `CODEVISTA_API_URL`.

---

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `CODEVISTA_API_URL` | `http://localhost:8080` | Backend origin used by the Next.js proxy (frontend) |
| `NEXT_PUBLIC_COMPILER_API` | `/api` | Full backend URL if the frontend should skip the proxy and call the backend directly |
| `codevista.compilation.timeout-seconds` | `15` | `javac` subprocess timeout |
| `codevista.execution.timeout-seconds` | `10` | `java` subprocess timeout (kills infinite loops) |
| `codevista.execution.max-code-length` | `100000` | Max submitted source-code characters |
| `codevista.execution.max-output-length` | `131072` | Max captured stdout/stderr characters per run |
| `codevista.execution.java-memory-limit` | `256m` | Heap limit for the user program's JVM (`-Xmx`) |
| `codevista.history.max-entries` | `50` | In-memory history size |
| `codevista.cors.allowed-origins` | `*` | Allowed CORS origins (restrict before public deployment) |

Backend properties can be overridden via environment variables, e.g.
`CODEVISTA_EXECUTION_TIMEOUT_SECONDS=5`.

---

## API Documentation

### `GET /api/health`

Liveness probe:

```json
{ "status": "ok", "service": "codevista-backend", "javaVersion": "25.0.4.1" }
```

### `POST /api/compile`

Compile and execute code. `language` defaults to `"java"` and is validated (other languages are rejected with a structured error, keeping a clean seam for future languages).

**Request:**
```json
{
  "code": "public class Main { public static void main(String[] args) { System.out.println(\"Hello!\"); } }",
  "language": "java"
}
```

**Success response** includes the program output plus a real `executionSteps` trace:
```json
{
  "success": true,
  "message": "Code compiled and executed successfully.",
  "error": null,
  "explanation": "Your Java code compiled and executed successfully.",
  "lineNumber": 0,
  "suggestion": null,
  "output": "Hello!",
  "executionSteps": [ { "step": 1, "lineNumber": 1, "action": "OUTPUT", "..." : "..." } ],
  "executionTraceTruncated": false
}
```

**Compilation error response** (HTTP 200 — a valid structured outcome):
```json
{
  "success": false,
  "message": "Compilation failed",
  "error": "Line 3: ';' expected",
  "explanation": "Java requires a semicolon (;) at the end of most statements...",
  "lineNumber": 3,
  "suggestion": "Add a semicolon (;) at the end of the statement on the indicated line.",
  "output": null
}
```

**Runtime error response** points at the failing line from the stack trace:
```json
{
  "success": false,
  "message": "Runtime error",
  "error": "Runtime Error: java.lang.ArithmeticException: / by zero",
  "explanation": "Your program tried to divide a number by zero...",
  "lineNumber": 3,
  "suggestion": "Add a check to ensure the divisor is not zero before performing division.",
  "output": null
}
```

Validation failures (unsupported language, missing/oversized code) return the same structured shape.

### `GET /api/history`

Most-recent runs (newest first), in-memory only:

```json
[
  { "id": 3, "timestamp": "2026-09-08T09:15:00Z", "language": "java",
    "code": "public class Main { ... }", "success": true,
    "message": "Code compiled and executed successfully.",
    "output": "Hello!", "error": null }
]
```

---

## Security

Running untrusted code is the core risk of this product. CodeVista applies layered, configurable limits:

- **Timeouts** — compilation and execution are killed after their limits; a `while(true){}` program returns a timeout error instead of hanging the server. Output is read *concurrently* with the timeout so a chatty or silent runaway process can never deadlock the pipe buffer or the server thread.
- **Output cap** — stdout/stderr is bounded (default 128 KiB) and marked `… [output truncated]`.
- **Source-size cap** — submissions over the limit are rejected.
- **Heap limit** — the user program's JVM runs with `-Xmx` (default 256m); `javac` gets the same via `-J-Xmx`.
- **Isolated temp workspace** — each run compiles in its own temp directory, deleted afterwards.
- **Trace caps** — the JDI tracer stops after 800 raw steps / 8 seconds and reports `truncated`.

### Honest threat model

Plain subprocess isolation (what this repo implements today) is **adequate for local development only**. It does **not** block filesystem or network access — user code runs as the same OS user and could read local files or open sockets. **Do not expose this service to the public internet without additional isolation.**

For production, the execution step must run inside a container or microVM (Docker, gVisor, Firecracker) with:

- CPU/memory cgroup limits
- read-only root filesystem, network disabled
- per-execution ephemeral filesystem
- process/fork limits, seccomp profile

That work is documented as the deployment prerequisite; it is not yet implemented in this repository.

---

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Landing page (live demo)
│   │   ├── history/page.tsx          # Execution history view
│   │   └── workshop/page.tsx         # Main IDE workspace
│   ├── components/
│   │   ├── Editor.tsx                # Monaco code editor
│   │   ├── AnalysisPanel.tsx         # Right-panel orchestrator
│   │   ├── ErrorCard.tsx             # Error display + explanation
│   │   ├── OutputPanel.tsx           # Program output
│   │   ├── Visualizer.tsx            # Step-by-step execution view
│   │   ├── VariablePanel.tsx         # Variable/array state
│   │   ├── ExecutionTimeline.tsx     # Step navigation
│   │   ├── ControlBar.tsx            # Run / Visualize / Reset / Close
│   │   ├── WorkspaceHeader.tsx       # Top bar + History link
│   │   ├── ExampleLoader.tsx         # Algorithm dropdown
│   │   ├── LearningModeToggle.tsx    # Learning / Developer switch
│   │   ├── LiveDemo.tsx              # Landing-page animated demo
│   │   ├── HeroScene.tsx             # 3D hero scene
│   │   └── ParticleField.tsx         # Ambient particle background
│   ├── lib/
│   │   ├── api.ts                    # Backend API client
│   │   └── types.ts                  # TypeScript interfaces
│   └── data/examples.ts              # 8 built-in algorithm examples
│
├── backend/codevista-backend/
│   └── src/main/java/com/codevista/
│       ├── CodevistaBackendApplication.java
│       ├── controller/CompilerController.java   # /api/compile, /history, /health
│       ├── service/CompilerService.java         # javac + java with sandbox limits
│       ├── service/HistoryService.java          # in-memory history ring
│       ├── execution/ExecutionTraceService.java # JDI execution capture
│       ├── analysis/ExplanationGenerator.java   # step labels/explanations
│       └── model/
│           ├── CompileRequest.java
│           ├── CompileResponse.java
│           ├── ExecutionStep.java
│           └── HistoryEntry.java
│
├── .github/workflows/ci.yml          # Frontend + backend CI
├── package.json
└── tsconfig.json
```

---

## Testing

**Backend** (54 tests — compilation, errors, runtime errors, sandbox/timeout behavior, API contract, history, error-category coverage, visualization breadth):

```bash
cd backend/codevista-backend
./mvnw test
```

**Frontend**:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

**CI** — `.github/workflows/ci.yml` runs install → lint → typecheck → build (frontend) and compile → test (backend) on every push/PR.

---

## Deployment

### Backend

```bash
cd backend/codevista-backend
./mvnw package
# The JDI module must be added explicitly when running the packaged jar:
java --add-modules jdk.jdi -jar target/codevista-backend-0.0.1-SNAPSHOT.jar
```

### Frontend

```bash
npm run build
npm start   # serves the production build
# Point CODEVISTA_API_URL at the deployed backend:
#   CODEVISTA_API_URL=https://compiler.example.com npm start
```

Before any public deployment: **restrict `codevista.cors.allowed-origins`**, put the backend behind a reverse proxy with TLS, and move execution into a container sandbox (see Security).

---

## Future Work

- **LLM explanation layer** — optional, grounded in the deterministic trace (never fabricating compiler results)
- **More languages** — Python/C/C++/JS behind the existing `language` validation seam
- **More data structures** — LinkedList, Stack, Queue, HashMap, Tree, Graph structural rendering (collections currently show as `toString()` text)
- **Full debugger** — step over/into/back, call stack
- **Multi-file projects**
- **Container sandbox** — Docker/gVisor/Firecracker execution isolation
- **Persistence** — replace the in-memory history ring with a relational store when accounts are introduced

---

## Research Motivation

CodeVista AI is built on the hypothesis that **making program execution visible** improves learning outcomes for programming beginners. By combining real compilation, real execution traces (not hard-coded animation), visual feedback, and plain-language explanations, students can build an accurate mental model of how programs execute.

---

## License

This project is for educational and demonstration purposes.