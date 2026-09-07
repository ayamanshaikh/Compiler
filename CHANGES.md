# CodeVista AI — Changes in this pass

This pass focused on closing the biggest gap between the product spec and
the existing prototype: **the Execution Visualizer was always showing
hard-coded bubble-sort demo data**, no matter what code the user actually
ran. That violates the project's own rules (never fake execution results;
never hard-code explanations to one demo algorithm) and undercut the
product's signature feature.

## New: a real execution-trace engine (backend)

Added a generic, algorithm-agnostic tracer that actually runs the user's
compiled program under Java's debugger interface (JDI) and reports what
really happened, line by line.

- `backend/.../execution/ExecutionTraceService.java` — launches the
  compiled `Main` class via `com.sun.jdi`, single-steps through it
  (restricted to the user's own class, so it doesn't step into JDK
  internals), and reads real local variable and array values out of the
  live JVM at each line. Capped at 400 steps / 8 seconds so a runaway loop
  can't hang the server; if hit, the trace is marked `truncated` rather
  than silently cut off.
- `backend/.../analysis/ExplanationGenerator.java` — classifies each line
  (loop, comparison, assignment, declaration, output, return, structure)
  from its shape, and generates a plain-language explanation from the
  *actual* values captured — e.g. "Comparing 5 and 3, the condition is
  true." Nothing here is specific to bubble sort; it was also verified
  against an unrelated factorial/comparison program.
- Swap detection is done generically by diffing array snapshots across a
  run of consecutive changing steps, so it also catches the common
  3-line `temp = a[j]; a[j] = a[j+1]; a[j+1] = temp;` pattern, not just
  single-line swaps.
- `model/ExecutionStep.java` — matches the frontend's `ExecutionStep`
  contract exactly (`step`, `lineNumber`, `code`, `action`, `explanation`,
  `variables`, `arrays`, `highlights`, optional `comparison`/`swap`).
- `CompilerService` now compiles with `-g` (needed for JDI to see variable
  names), and after a successful run, generates the trace before cleaning
  up the temp directory. Tracing is wrapped so a tracer failure can never
  break the primary compile/run result — the existing output/error flow is
  untouched.
- `CompileResponse` gained `executionSteps` and `executionTraceTruncated`,
  additively — the existing fields and their meaning are unchanged, so
  nothing that depended on the old contract breaks.
- `pom.xml` now passes `--add-modules jdk.jdi` at both compile and run
  time (via `maven-compiler-plugin` and `spring-boot-maven-plugin`),
  because the `jdk.jdi` module isn't resolved by default for classpath
  ("unnamed module") apps. **If you ever run the packaged jar directly**
  (`java -jar target/codevista-backend-*.jar`) instead of
  `mvnw spring-boot:run`, add the same flag:
  `java --add-modules jdk.jdi -jar target/codevista-backend-*.jar`.

All of the above was written and verified end-to-end in a local JDK
sandbox (compiled and run directly, and through `CompilerService`) against
both the bundled bubble-sort example and an unrelated factorial/comparison
program, before being wired into the Spring Boot service. The full
compile-error path (`javac` failures) was also re-verified unchanged.

## Frontend: use the real trace instead of demo data

- `src/lib/types.ts` — `CompileResponse` gained the two new optional
  fields above.
- `src/app/workshop/page.tsx`:
  - `Run Code` now stores `response.executionSteps` from the backend
    instead of always loading `BUBBLE_SORT_STEPS`.
  - Fixed a bug where the editor's "currently executing line" highlight
    was frozen on the *first* step forever during visualization — it now
    tracks whatever step is actually showing.
  - Added the spec'd `Ctrl+Enter` / `Cmd+Enter` shortcut to run code from
    anywhere in the workspace.
  - Editing the code, or a code change, now clears any stale trace/error
    state instead of leaving old highlights on screen.
- `src/components/Visualizer.tsx` — now reports the active step back up
  to the page via an `onStepChange` callback (used for the editor
  highlight fix above).
- `src/components/AnalysisPanel.tsx` — passes the callback through, and
  shows a short status line after a successful run ("Captured N real
  execution steps from this run…", or a note if the trace was truncated).
- `src/data/demoExecution.ts` — kept, but re-labeled as reference/fixture
  data only; it's no longer imported anywhere in the running app, per the
  project rule that demo data must stay clearly separate from real
  execution data.

## Verified

- All new/changed backend Java files were compiled and run standalone
  (JDK 21, `--add-modules jdk.jdi`) against real `javac`/`java`
  subprocesses — including the full `CompilerService.compileCode()` path
  for both a successful run (34 real steps captured, correct swaps and
  comparisons) and a compile error (unchanged error/line-number
  behavior).
- Changed frontend files pass `tsc --noEmit` and `eslint` with zero
  errors. A full `next build` was attempted but fails in this sandbox
  only because outbound access to `fonts.googleapis.com` (for the Geist
  font) is blocked by the sandbox's network policy — unrelated to these
  changes, and not an issue in a normal environment with internet access.

## Not done in this pass (candidates for next time)

- Monaco Editor swap-in (still a styled `<textarea>`-based editor).
- `Ctrl+S` save-project shortcut (no project persistence exists yet —
  Phase 11+ in the spec).
- Splitting `ExecutionStep`'s two nested static classes
  (`Comparison`/`Swap`) into their own files if you want one-class-per-file
  strictly.
- Tracking non-int arrays/collections (ArrayList, HashMap, etc. — Phase 9).
