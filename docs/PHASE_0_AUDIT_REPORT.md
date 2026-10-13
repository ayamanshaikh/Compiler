# CodeVista AI — Phase 0 Architectural & Codebase Audit Report
## Comprehensive System Inspection, Capability Inventory, and Phased Roadmap

**Audit Date**: October 13, 2026  
**Auditor**: Senior Software Engineer & System Architect  
**Branch**: `main`  
**Remote**: `https://github.com/ayamanshaikh/Compiler.git`  
**Status**: Clean working tree, fully synchronized at commit `614d76b`  

---

## 1. Current Architecture

CodeVista AI is an educational code-comprehension monorepo consisting of:
1. **Backend (`backend/`)**: Spring Boot 4.1.1 running on OpenJDK 25 LTS, configured with Maven 3.9.16 via Maven Wrapper (`mvnw.cmd` / `mvnw`).
   - `compiler`: Extensible `LanguageCompiler` abstraction with `JavaCompilerAdapter` leveraging `javax.tools.JavaCompiler`.
   - `compiler.intelligence`: `ErrorIntelligenceService` featuring 17 specialized diagnostic explainers mapping compiler errors to root causes and code corrections.
   - `execution`: `LanguageExecutor` and `JavaProcessExecutor` running code in isolated subprocesses with timeouts, memory limits (`-Xmx64m`), and output limits.
   - `trace`: `JavaTraceExecutor` and `JavaSourceInstrumenter` performing source-level instrumentation to emit runtime snapshots (`TraceStep`, `VariableSnapshot`, `StackFrameSnapshot`, `HeapObjectSnapshot`).
   - `algorithm`: `AlgorithmRegistry` and `AlgorithmService` supporting 8 verified algorithmic simulation routines.
   - `curriculum` & `practice`: Complete syllabus with 78 topics and 8 interactive question archetypes.
   - `security`: Stateless JWT authentication (`JwtTokenService`) and BCrypt credential hashing (`PasswordService`).
   - `cache`: Multi-tiered compilation and telemetry caching (`CompilationCache`).
2. **Frontend (`frontend/`)**: Next.js 16.3.6 (Turbopack, React 19, TypeScript 5, Tailwind CSS).
   - Core Routes: `/` (Landing), `/workspace` (Java IDE), `/visualize` (JVM Tracer & Algorithm Visualizer), `/learn` & `/learn/[topic]` (Curriculum), `/practice` (Practice Arena), `/enterprise` (Servlet/Hibernate Simulator), `/admin` (CMS & Telemetry), `/profile`, and `/settings`.
   - Visualizer Library (`src/lib/visualizer/`): `adaptiveStrategy.ts`, `explanationBuilder.ts`, `traceNormalizer.ts`, `traceExport.ts`, `traceUrlSharing.ts`, `traceHistory.ts`, `codeConceptDetector.ts`, `useTraceKeyboardShortcuts.ts`.
   - Concept Renderers (`src/components/visualizer/concepts/`): 14 modular renderers for Variables, Loops, Arrays, Conditions, Expressions, Comparisons, Array Operations, Matrix 2D, Collections, Strings, Recursion, Objects, Exceptions, and Output.

---

## 2. Existing Capabilities

- **Real OpenJDK 25 Compilation**: Authentic diagnostic collection (`line`, `column`, `message`, severity) without mock diagnostics.
- **Sandboxed Execution**: Subprocess containment with strict timeout (5000ms), stdout truncation (32KB), and sandbox temp directory disposal.
- **Bytecode-Accurate Trace Engine**: Source-instrumented runtime collector capturing variables, heap references, call stack depth, and step descriptions.
- **Adaptive Visual Dispatch**: Strategy engine selecting between Mode A (Visual Canvas) and Mode B (7-Part Pedagogical Explanation Timeline).
- **Algorithm Simulation**: Step-by-step visualizations for sorting, searching, two pointers, and stacks with synchronized Java code.
- **Practice Arena with 1-Click Trace**: Direct transition from problem snippets and solution code into the trace visualizer.
- **Accessibility & UX**: Keyboard shortcuts (`Space`, `Arrows`, `B`, `L`, `?`), ARIA live step announcer, visual density modes, and high-contrast toggle.

---

## 3. Existing Components Available for Direct Reuse

- **Frontend Dispatcher**: `AdaptiveConceptDispatcher.tsx`, `TraceVisualizer.tsx`, and all 14 concept renderers.
- **Strategy & Explanation**: `adaptiveStrategy.ts`, `explanationBuilder.ts`, `traceNormalizer.ts`.
- **UI Design System**: `AppShell.tsx`, `PageContainer.tsx`, `PageHeader.tsx`, `Card.tsx`, `Button.tsx`, `Badge.tsx`, `Modal.tsx`, `Tabs.tsx`.
- **Backend Infrastructure**: `JavaCompilerAdapter.java`, `JavaProcessExecutor.java`, `JavaTraceExecutor.java`, `ErrorIntelligenceService.java`, `AlgorithmRegistry.java`.

---

## 4. Missing Capabilities (Gaps Identified)

1. **Dual-Level Explanation (Beginner vs. Detailed)**:
   - While `explanationBuilder.ts` constructs 7-part explanations, it lacks an explicit user-toggleable dual mode (Beginner mode with simple vocabulary and key values vs. Detailed mode with JVM internal semantics, call-stack frames, and runtime reasoning).
2. **Compiler Pipeline Visualization (Phase 2)**:
   - The platform currently returns final compilation output only. It lacks an interactive stage explorer visualizing:
     - Lexical Analysis (Tokens)
     - Syntax Analysis (Abstract Syntax Tree / AST)
     - Semantic Analysis & Type Checking
     - Intermediate Representation / Bytecode (`javap`)
     - Runtime Class Loading
3. **Hardware and Memory Architecture Explorer (Phase 3)**:
   - Variables are shown in generic cards, but there is no dedicated Computer Systems Explorer demonstrating:
     - CPU Registers (Program Counter, Stack Pointer, Accumulator)
     - Instruction flow
     - Stack vs. Heap memory architecture with explicit "Conceptual Model" labeling.
4. **Empirical & Measured Complexity Benchmarking (Phase 4)**:
   - `ComplexityEstimatorCard.tsx` estimates theoretical complexity from trace patterns, but there is no:
     - Theoretical Big-O pattern analyzer with explicit confidence ratings (`High confidence`, `Estimated`, `Partial analysis`, `Unsupported construct`).
     - Bounded multi-input runtime benchmark runner ($N=10, 50, 100, 500, 1000$) measuring execution time ($\mu s$/$ms$) under strict resource limits.
     - Comparative visualization chart graphing theoretical growth against empirical measurements.
5. **Corrected-Execution Debugging Comparison (Phase 5)**:
   - When code fails with a syntax or runtime error, the UI displays error intelligence, but does not yet allow running the suggested corrected code in a side-by-side execution diff.

---

## 5. Risks and Dependencies

- **Benchmark Security**: Running user code across multiple input sizes risks CPU saturation. Benchmarks must enforce strict bounds: max input $N=1000$, max 5 sizes, max runtime 3000ms, and concurrency rate limiting.
- **Compiler Internals**: Extracting AST tokens and bytecode must use standard JDK tools (`javax.tools`, `javap`) rather than unstable internal APIs or fabricated data.
- **Performance**: Trace visualization and benchmark charts must remain memoized to prevent UI jank.

---

## 6. Recommended Minimal File Changes

| Target Milestone | Files to Add / Modify | Purpose |
|:---|:---|:---|
| **Phase 1** | `frontend/src/lib/visualizer/explanationBuilder.ts`<br>`frontend/src/components/visualizer/explanation/StepExplanationCard.tsx`<br>`frontend/src/lib/api/types.ts` | Introduce Beginner and Detailed explanation modes with user toggle. |
| **Phase 2** | `backend/.../compiler/service/CompilerPipelineService.java`<br>`frontend/src/components/compiler/CompilerPipelineExplorer.tsx` | Extract real lexical tokens, AST nodes, and bytecode for interactive stage navigation. |
| **Phase 3** | `frontend/src/components/hardware/HardwareMemoryExplorer.tsx`<br>`frontend/src/lib/hardware/hardwareModel.ts` | Interactive CPU, registers, stack, and heap educational explorer connected to trace state. |
| **Phase 4** | `backend/.../benchmark/BenchmarkExecutor.java`<br>`frontend/src/components/complexity/ComplexityBenchmarkVisualizer.tsx` | Safe multi-input benchmark runner, theoretical confidence ratings, and empirical performance graph. |
| **Phase 5** | `frontend/src/components/visualizer/DebugCorrectionDiff.tsx` | Side-by-side corrected execution comparison. |
| **Phase 6** | `frontend/src/app/workspace/page.tsx`<br>`frontend/src/components/layout/Navbar.tsx` | Seamless workspace integration across Compiler, Hardware, and Complexity views. |

---

## 7. Refined Step-by-Step Implementation Plan

- **PHASE 0**: Repository audit, capability gap analysis, and baseline documentation (Current).
- **PHASE 1**: Adaptive visualization foundation — Beginner vs. Detailed explanation modes and mixed visualizer support.
- **PHASE 2**: Compiler pipeline visualization — Lexer tokens, AST inspection, bytecode disassembly, and stage error linking.
- **PHASE 3**: Hardware and memory visualization — CPU registers, instruction flow, stack/heap models, and bytecode view.
- **PHASE 4**: Complexity analysis — Static pattern analysis with confidence labels and bounded empirical benchmarking.
- **PHASE 5**: Execution visualization & error debugging — Side-by-side corrected execution diff and synchronized error markers.
- **PHASE 6**: Unified user experience — Workspace tab integration and dedicated explorer views.
- **PHASE 7**: Performance & security hardening — Verification of benchmark bounds, process limits, and accessibility.
- **PHASE 8**: Final validation & documentation — Comprehensive test suite execution, zero-lint verification, and final sign-off.

---

## 8. Testing Strategy

1. **Frontend Unit Tests**: Node native test runner (`node --test scripts/run-adaptive-tests.mjs scripts/test-e2e-adaptive-pipeline.mjs`). Target: 100% pass rate.
2. **Backend Unit & Integration Tests**: Maven wrapper (`.\backend\mvnw.cmd test -f backend/pom.xml`). Target: 165+ tests pass with zero failures.
3. **Type & Lint Check**: `tsc --noEmit` (zero errors) and `eslint .` (zero warnings).
4. **Full Builds**: `next build` (all 11 routes pass) and `mvnw package` (JAR artifact packaged).

---

## 9. GitHub Contribution Plan

- Atomic, reviewable commits following Conventional Commits (`docs:`, `feat:`, `test:`, `fix:`, `perf:`).
- Verify tests and builds locally before staging.
- Push each verified step to `origin/main` and verify remote synchronization immediately.

---

## 10. Current Branch and Remote Readiness

- **Current Branch**: `main`
- **Remote URL**: `https://github.com/ayamanshaikh/Compiler.git`
- **Working Tree**: Completely clean, zero uncommitted changes.
- **Remote Status**: In sync with `origin/main` at commit `614d76b`.
- **Readiness**: Fully primed to proceed with Phase 1 upon user authorization.
