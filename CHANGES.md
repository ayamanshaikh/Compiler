# CodeVista AI — Change log

## Visualization + error-intelligence expansion

This pass widens what CodeVista can visualize and explain across the major
topics of introductory Java: more data types, conditions, recursion,
objects, helper classes, and dozens more compiler/runtime error categories.

### Visualization breadth (backend tracer + frontend)

- `model/ExecutionStep.java` — new `typedArrays` (map of
  `{ type, values: string[] }`) and `callDepth` fields; `Comparison` now
  stores the actual `operator` (previously the frontend hard-coded `>`).
- `execution/ExecutionTraceService.java`:
  - **Typed arrays** — `double[]`/`float[]`/`long[]` captured as numeric
    typed arrays (bar-rendered); `String[]`/`boolean[]`/`char[]`/`Object[]`
    captured as typed arrays (chip-rendered); `int[]` keeps the original
    bars + swap detection unchanged.
  - **Scalar condition badges** — conditions like `if (a > b)` or
    `while (n <= 1)` are now evaluated against live values and emitted with
    `comparison { left, right, indices: [], result, operator }`, so every
    condition shows a TRUE/FALSE badge, not only `arr[j] > arr[j+1]`.
  - **Object field introspection** — user-defined objects (default package)
    expose up to 8 visible fields as `obj.field` variable entries.
  - **Recursion / call depth** — `callDepth` counts user-code frames, so
    factorial/fibonacci show depth 2, 3, 4, … as they unfold.
  - **Multi-class tracing** — steps into user helper classes (method bodies,
    constructors) while still stepping over JDK internals; collapse phase
    only folds non-mutating micro-steps into array-changing steps (fixed a
    regression that swallowed declaration/mutation steps).
- `components/Visualizer.tsx` — renders typed arrays (numeric bars or
  string chips), a standalone condition-evaluation block (so scalar
  comparisons show even in programs without arrays), a purple `Depth N`
  chip for recursion, and operator-aware comparison text.
- `lib/types.ts` — `typedArrays`, `callDepth`, `comparison.operator`.

### Error intelligence breadth

- `service/CompilerService.java` — `classifyError` grew from ~16 to ~40
  categories, ordered most-specific-first (constructor rules checked before
  the generic method-argument rule they contain). New categories include:
  method argument/arity mismatch, no suitable method, constructor
  mismatch/not-found, generic inference and type-argument issues,
  not-a-functional-interface (lambdas), abstract-not-implemented,
  cannot-override, static-context reference, unreachable statement,
  duplicate class, public-class-filename mismatch, package-not-found,
  unhandled checked exception, break/continue outside loop, bad operand
  types, and more.
- `controller/CompilerController.java` — every new category gets a
  beginner-friendly `explanation` and actionable `suggestion`; runtime
  exceptions expanded (ClassCastException, IllegalArgumentException,
  NegativeArraySizeException, IllegalStateException, …) with the same
  treatment.

### Tests

- New `VisualizationBreadthTest` (8 tests) — typed arrays, scalar
  comparisons with operator, object fields, call depth, multi-class
  stepping, mutation steps surviving collapse.
- New `ErrorCategoryTest` (21 tests) — compiles deliberately broken
  programs against real `javac` output and asserts the explanation /
  suggestion for every new category, plus runtime-exception handling.
- Backend suite: **54 tests, all passing** (`./mvnw test`).

### Docs

- `README.md` — features table and tracing section updated for the new
  capabilities; test count corrected to 54.

---

## Production hardening pass

This pass fixed a critical execution hang, added real resource limits,
exposed health/history APIs, added a history view, wired CI, and made the
docs honest about the threat model.

### Critical fix: runaway programs can no longer hang the server

`CompilerService` previously read subprocess output to EOF *before* checking
the timeout. A program like `while (true) {}` produced no output, so the
read blocked forever and the 10-second kill was never reached — one user
could pin a server thread indefinitely. Output is now drained concurrently
on a daemon thread while `waitFor(timeout)` runs, so the timeout always
fires and the process is forcibly destroyed.

### Backend hardening

- `service/CompilerService.java` — rewritten process handling:
  - concurrent output reading + real timeout enforcement;
  - stdout/stderr capped at `codevista.execution.max-output-length`
    (default 128 KiB) with a `… [output truncated]` marker;
  - source code capped at `codevista.execution.max-code-length`;
  - user JVM heap bounded via `-Xmx` (also applied to `javac` via
    `-J-Xmx` and to the JDI tracer's JVM);
  - all limits configurable in `application.properties` / env vars.
- `controller/CompilerController.java`:
  - `GET /api/health` liveness probe;
  - `GET /api/history` (most recent runs);
  - request validation: language (default `java`, others rejected),
    empty/whitespace code, oversized code;
  - runtime errors now carry the failing source line (parsed from the
    stack trace) so the editor highlights it;
  - runtime-error responses surface captured (truncated) output;
  - CORS origin list now configurable (`codevista.cors.allowed-origins`).
- `service/HistoryService.java` + `model/HistoryEntry.java` — bounded
  in-memory ring of compile/run attempts (no database).
- `model/CompileRequest.java` — added `language` field.
- `execution/ExecutionTraceService.java` — traced JVM gets `-Xmx256m`.
- New test class `SecurityAndApiTest` (10 tests) covering infinite loops
  (with and without output), output flooding, oversized source, unsupported
  language, runtime error line extraction, health, and history.

### Frontend

- `lib/api.ts` — sends `language`; parses structured error bodies even on
  non-200 responses; adds `getHistory()`.
- `lib/types.ts` — added `HistoryEntry`.
- `app/history/page.tsx` — new History view (loading / empty / error
  states, per-run code + output + error details, refresh).
- `components/WorkspaceHeader.tsx` — History link in the workspace header.
- Removed dead files: `src/data/demoExecution.ts` (unused fixture data) and
  `src/components/LiveDemo.tsx.bak`.

### Config & CI

- `next.config.ts` — backend proxy destination now reads
  `CODEVISTA_API_URL` (default `http://localhost:8080`).
- `.github/workflows/ci.yml` — CI runs install → lint → typecheck → build
  (frontend) and compile → test (backend) on push/PR.

### Docs

- `README.md` — accurate security section (replaced the false claims that
  user code has "no filesystem/network access": plain subprocess isolation
  does not provide that), env-var reference, full API docs including
  health/history, deployment notes (packaged jar needs
  `--add-modules jdk.jdi`), project structure, CI.

## Not done (deliberately)

- Container/microVM sandboxing (Docker/gVisor/Firecracker) — documented as
  a hard prerequisite for public deployment, not yet implemented.
- LLM explanation layer — architecture seam exists; deterministic
  explanations remain the source of truth.
- User accounts / database — history is intentionally in-memory.
- Structural rendering of collections (LinkedList/Stack/Queue/HashMap) —
  they currently show as `toString()` text.