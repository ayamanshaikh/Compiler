package com.codevista.execution;

import com.codevista.analysis.ExplanationGenerator;
import com.codevista.model.ExecutionStep;
import com.sun.jdi.*;
import com.sun.jdi.connect.Connector;
import com.sun.jdi.connect.LaunchingConnector;
import com.sun.jdi.event.*;
import com.sun.jdi.request.BreakpointRequest;
import com.sun.jdi.request.ClassPrepareRequest;
import com.sun.jdi.request.EventRequestManager;
import com.sun.jdi.request.StepRequest;
import org.springframework.stereotype.Service;

import java.nio.file.Path;
import java.util.*;
import java.util.concurrent.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Generates a real, step-by-step execution trace of a compiled Java program
 * using the Java Debug Interface (JDI). This is NOT a simulation or a
 * hard-coded demo — it actually launches the compiled class under a
 * debugger, steps through it line by line, and reads the live values of
 * local variables and arrays out of the running JVM.
 *
 * The tracer is intentionally generic: it works for any Main class, not
 * just the bubble-sort example bundled with the product.
 */
@Service
public class ExecutionTraceService {

    private static final int MAX_RAW_STEPS = 800;
    private static final long TIMEOUT_MILLIS = 8000;
    private static final String MAIN_CLASS = "Main";

    private final ExplanationGenerator explanationGenerator;

    public ExecutionTraceService(ExplanationGenerator explanationGenerator) {
        this.explanationGenerator = explanationGenerator;
    }

    public static class TraceResult {
        public final List<ExecutionStep> steps;
        public final boolean truncated;
        public final String error;

        public TraceResult(List<ExecutionStep> steps, boolean truncated, String error) {
            this.steps = steps;
            this.truncated = truncated;
            this.error = error;
        }
    }

    public TraceResult trace(Path classDir, String sourceCode) {
        ExecutorService executor = Executors.newSingleThreadExecutor();
        Future<TraceResult> future = executor.submit(() -> runTrace(classDir, sourceCode));

        try {
            return future.get(TIMEOUT_MILLIS, TimeUnit.MILLISECONDS);
        } catch (TimeoutException e) {
            future.cancel(true);
            return new TraceResult(List.of(), true, "Execution trace timed out.");
        } catch (Exception e) {
            return new TraceResult(List.of(), false, "Execution trace unavailable: " + e.getMessage());
        } finally {
            executor.shutdownNow();
        }
    }

    private TraceResult runTrace(Path classDir, String sourceCode) throws Exception {
        String[] sourceLines = sourceCode.split("\\R", -1);

        LaunchingConnector connector = findLaunchingConnector();
        Map<String, Connector.Argument> args = connector.defaultArguments();
        args.get("main").setValue(MAIN_CLASS);
        args.get("options").setValue("-cp " + classDir.toAbsolutePath());
        args.get("suspend").setValue("true");

        VirtualMachine vm = connector.launch(args);
        Process debuggee = vm.process();
        drain(debuggee.getInputStream());
        drain(debuggee.getErrorStream());

        EventRequestManager erm = vm.eventRequestManager();
        ClassPrepareRequest cpr = erm.createClassPrepareRequest();
        cpr.addClassFilter(MAIN_CLASS);
        cpr.enable();

        List<ExecutionStep> rawSteps = new ArrayList<>();
        boolean truncated = false;

        EventQueue queue = vm.eventQueue();
        boolean running = true;

        try {
            while (running) {
                EventSet eventSet = queue.remove(1000);
                if (eventSet == null) break;

                boolean shouldResume = true;

                for (Event event : eventSet) {
                    if (event instanceof ClassPrepareEvent cpe) {
                        List<Method> mains = cpe.referenceType().methodsByName("main");
                        if (!mains.isEmpty()) {
                            List<Location> locs = mains.get(0).allLineLocations();
                            if (!locs.isEmpty()) {
                                BreakpointRequest bp = erm.createBreakpointRequest(locs.get(0));
                                bp.enable();
                            }
                        }
                    } else if (event instanceof BreakpointEvent be) {
                        captureStep(be.thread(), sourceLines, rawSteps);
                        StepRequest sr = erm.createStepRequest(
                                be.thread(), StepRequest.STEP_LINE, StepRequest.STEP_OVER);
                        sr.addClassFilter(MAIN_CLASS);
                        sr.enable();
                    } else if (event instanceof StepEvent se) {
                        captureStep(se.thread(), sourceLines, rawSteps);
                        if (rawSteps.size() >= MAX_RAW_STEPS) {
                            truncated = true;
                            running = false;
                            shouldResume = false;
                            try {
                                vm.exit(0);
                            } catch (Exception ignored) {
                            }
                        }
                    } else if (event instanceof VMDeathEvent || event instanceof VMDisconnectEvent) {
                        running = false;
                        shouldResume = false;
                    }
                }

                if (shouldResume && running) {
                    eventSet.resume();
                }
            }
        } finally {
            try {
                debuggee.destroyForcibly();
            } catch (Exception ignored) {
            }
        }

        // Post-process: filter noise, collapse compound operations into
        // single steps, detect swaps, then renumber.
        List<ExecutionStep> filtered = filterAndMerge(rawSteps);
        postProcess(filtered);
        renumber(filtered);

        return new TraceResult(filtered, truncated, null);
    }

    // ── Step capture ────────────────────────────────────────────────────

    private void captureStep(ThreadReference thread, String[] sourceLines, List<ExecutionStep> steps) {
        try {
            StackFrame frame = thread.frame(0);
            Location loc = frame.location();
            int lineNumber = loc.lineNumber();
            String sourceLine = (lineNumber >= 1 && lineNumber <= sourceLines.length)
                    ? sourceLines[lineNumber - 1].strip()
                    : "";

            String action = explanationGenerator.classify(sourceLine);

            // Skip structure-only lines entirely.
            if ("STRUCTURE".equals(action)) return;

            Map<String, String> variables = new LinkedHashMap<>();
            Map<String, List<Integer>> arrays = new LinkedHashMap<>();
            Map<String, Integer> intScalars = new HashMap<>();
            readFrameState(frame, variables, arrays, intScalars);

            // Skip exact duplicates of the previous step.
            if (!steps.isEmpty()) {
                ExecutionStep last = steps.get(steps.size() - 1);
                if (last.getLineNumber() == lineNumber
                        && last.getVariables().equals(variables)
                        && last.getArrays().equals(arrays)) {
                    return;
                }
            }

            ExecutionStep step = new ExecutionStep();
            step.setStep(steps.size() + 1);
            step.setLineNumber(lineNumber);
            step.setCode(sourceLine);
            step.setAction(action);
            step.setVariables(variables);
            step.setArrays(arrays);
            step.setHighlights(List.of());

            attachComparison(sourceLine, action, arrays, intScalars, step);
            step.setExplanation(buildExplanation(sourceLine, action, step));

            steps.add(step);
        } catch (Exception ignored) {
        }
    }

    // ── Aggressive filtering & merging ──────────────────────────────────

    /**
     * Walks the raw trace and keeps only the steps that matter, collapsing
     * multi-line compound operations (like swaps) into single steps.
     *
     * <p><b>Keep criteria</b> (checked in order):
     * <ol>
     *   <li>First step — always kept (initial program state).</li>
     *   <li>COMPARE — always kept (user needs to see every condition).</li>
     *   <li>OUTPUT / RETURN — always kept.</li>
     *   <li>Any step whose arrays differ from the previous kept step
     *       (captures initialisations, mutations, swaps).</li>
     *   <li>First declaration of a new variable — kept so the learner
     *       sees it created.</li>
     *   <li>Everything else (re-assignments of loop counters, intermediate
     *       temp variables, re-visits to the same comparison) is dropped.</li>
     * </ol>
     *
     * <p><b>Merge phase:</b> after filtering, consecutive ASSIGN/DECLARE
     * steps that sit between two array-changing steps are collapsed into
     * the later array-changing step, so a three-line swap produces one
     * entry whose arrays reflect the final state.
     */
    private List<ExecutionStep> filterAndMerge(List<ExecutionStep> raw) {
        if (raw.isEmpty()) return raw;

        // ── Pass 1: filter ──────────────────────────────────────────────
        List<ExecutionStep> kept = new ArrayList<>();
        Set<String> seenVariables = new HashSet<>();

        for (ExecutionStep s : raw) {
            boolean keep = false;

            if (kept.isEmpty()) {
                // First step — always keep.
                keep = true;
            } else {
                ExecutionStep prev = kept.get(kept.size() - 1);

                // Always keep comparisons, output, return.
                switch (s.getAction()) {
                    case "COMPARE", "OUTPUT", "RETURN" -> keep = true;
                }

                // Keep if arrays changed (mutation / swap / init).
                if (!keep && !s.getArrays().equals(prev.getArrays())) {
                    keep = true;
                }

                // Keep first declaration of a new variable.
                if (!keep && "DECLARE".equals(s.getAction())) {
                    for (String name : s.getVariables().keySet()) {
                        if (seenVariables.add(name)) {
                            keep = true;
                            break;
                        }
                    }
                }
            }

            if (keep) {
                seenVariables.addAll(s.getVariables().keySet());
                kept.add(s);
            }
        }

        // ── Pass 2: collapse compound operations ────────────────────────
        // Consecutive ASSIGN/DECLARE steps sandwiched between array-
        // changing steps are intermediate micro-steps of a compound
        // operation (e.g. a three-line swap).  Fold them into the
        // following array-changing step so only the final state is shown.
        List<ExecutionStep> collapsed = new ArrayList<>();
        ExecutionStep pendingMicro = null; // accumulated micro-step to fold

        for (ExecutionStep s : kept) {
            boolean isMicro = "ASSIGN".equals(s.getAction()) || "DECLARE".equals(s.getAction());

            if (isMicro) {
                // Accumulate: remember the latest micro-step.
                pendingMicro = s;
                continue;
            }

            // This step is not a micro-step (COMPARE, OUTPUT, RETURN, or
            // an array-changing step).  If there's a pending micro-step,
            // fold it into this step.
            if (pendingMicro != null) {
                // Update this step with the latest variable state.
                s.setVariables(pendingMicro.getVariables());
                s.setExplanation(pendingMicro.getExplanation());
                pendingMicro = null;
            }

            collapsed.add(s);
        }

        // If we end with a trailing micro-step, emit it as its own entry.
        if (pendingMicro != null) {
            collapsed.add(pendingMicro);
        }

        return collapsed;
    }

    /** Re-number steps 1..N after filtering. */
    private void renumber(List<ExecutionStep> steps) {
        for (int i = 0; i < steps.size(); i++) {
            steps.get(i).setStep(i + 1);
        }
    }

    // ── Frame state reading ─────────────────────────────────────────────

    private void readFrameState(
            StackFrame frame,
            Map<String, String> variables,
            Map<String, List<Integer>> arrays,
            Map<String, Integer> intScalars
    ) {
        try {
            for (LocalVariable lv : frame.visibleVariables()) {
                if ("args".equals(lv.name())) continue;
                Value value = frame.getValue(lv);
                if (value instanceof ArrayReference arrayRef) {
                    List<Integer> vals = new ArrayList<>();
                    boolean allInts = true;
                    for (Value el : arrayRef.getValues()) {
                        if (el instanceof IntegerValue iv) {
                            vals.add(iv.value());
                        } else {
                            allInts = false;
                            break;
                        }
                    }
                    if (allInts) {
                        arrays.put(lv.name(), vals);
                    }
                    variables.put(lv.name(), describe(value));
                } else {
                    variables.put(lv.name(), describe(value));
                    if (value instanceof IntegerValue iv) {
                        intScalars.put(lv.name(), iv.value());
                    }
                }
            }
        } catch (AbsentInformationException ignored) {
        }
    }

    // ── Comparison attachment ───────────────────────────────────────────

    private void attachComparison(
            String sourceLine,
            String action,
            Map<String, List<Integer>> arrays,
            Map<String, Integer> intScalars,
            ExecutionStep step
    ) {
        if (!"COMPARE".equals(action)) return;

        var match = explanationGenerator.findArrayComparison(sourceLine);
        if (match == null) return;

        List<Integer> array = arrays.get(match.arrayName);
        if (array == null) return;

        Integer leftIdx = evalIndex(match.leftIndexExpr, intScalars);
        Integer rightIdx = evalIndex(match.rightIndexExpr, intScalars);
        if (leftIdx == null || rightIdx == null) return;
        if (leftIdx < 0 || leftIdx >= array.size() || rightIdx < 0 || rightIdx >= array.size()) return;

        int left = array.get(leftIdx);
        int right = array.get(rightIdx);
        boolean result = evalOperator(match.operator, left, right);

        step.setComparison(new ExecutionStep.Comparison(left, right, List.of(leftIdx, rightIdx), result));
        step.setHighlights(List.of(leftIdx, rightIdx));
    }

    private String buildExplanation(String sourceLine, String action, ExecutionStep step) {
        Integer left = null, right = null;
        Boolean result = null;
        if (step.getComparison() != null) {
            left = step.getComparison().getLeft();
            right = step.getComparison().getRight();
            result = step.getComparison().isResult();
        }
        return explanationGenerator.explain(sourceLine, action, left, right, result);
    }

    // ── Helpers ─────────────────────────────────────────────────────────

    private static final Pattern INDEX_EXPR = Pattern.compile("^(\\w+)\\s*([+-])\\s*(\\d+)$");

    private Integer evalIndex(String expr, Map<String, Integer> scalars) {
        if (expr == null) return null;
        expr = expr.trim();
        try { return Integer.parseInt(expr); } catch (NumberFormatException ignored) {}
        if (scalars.containsKey(expr)) return scalars.get(expr);
        Matcher m = INDEX_EXPR.matcher(expr);
        if (m.matches()) {
            String var = m.group(1);
            String op = m.group(2);
            int amount = Integer.parseInt(m.group(3));
            Integer base = scalars.get(var);
            if (base == null) return null;
            return "+".equals(op) ? base + amount : base - amount;
        }
        return null;
    }

    private boolean evalOperator(String op, int left, int right) {
        return switch (op) {
            case ">" -> left > right;
            case "<" -> left < right;
            case ">=" -> left >= right;
            case "<=" -> left <= right;
            case "==" -> left == right;
            case "!=" -> left != right;
            default -> false;
        };
    }

    /**
     * Detects array mutations by diffing consecutive snapshots and tags
     * a contiguous run of mutations as a swap when exactly two elements
     * were exchanged.
     */
    private void postProcess(List<ExecutionStep> steps) {
        if (steps.isEmpty()) return;

        Set<String> arrayNames = new LinkedHashSet<>();
        for (ExecutionStep s : steps) arrayNames.addAll(s.getArrays().keySet());

        for (String name : arrayNames) {
            int runStart = -1;

            for (int i = 1; i < steps.size(); i++) {
                List<Integer> prev = steps.get(i - 1).getArrays().get(name);
                List<Integer> curr = steps.get(i).getArrays().get(name);
                boolean changed = prev != null && curr != null
                        && prev.size() == curr.size() && !prev.equals(curr);

                if (changed) {
                    if (runStart == -1) runStart = i - 1;
                } else if (runStart != -1) {
                    tagSwapIfApplicable(steps, name, runStart, i - 1);
                    runStart = -1;
                }
            }

            if (runStart != -1) {
                tagSwapIfApplicable(steps, name, runStart, steps.size() - 1);
            }
        }
    }

    private void tagSwapIfApplicable(List<ExecutionStep> steps, String arrayName, int startIdx, int endIdx) {
        List<Integer> before = steps.get(startIdx).getArrays().get(arrayName);
        List<Integer> after = steps.get(endIdx).getArrays().get(arrayName);
        if (before == null || after == null || before.size() != after.size()) return;

        List<Integer> diffIndices = new ArrayList<>();
        for (int idx = 0; idx < before.size(); idx++) {
            if (!Objects.equals(before.get(idx), after.get(idx))) diffIndices.add(idx);
        }

        if (diffIndices.size() != 2) return;

        int a = diffIndices.get(0);
        int b = diffIndices.get(1);
        if (!before.get(a).equals(after.get(b)) || !before.get(b).equals(after.get(a))) return;

        ExecutionStep tagStep = steps.get(endIdx);
        tagStep.setSwap(new ExecutionStep.Swap(List.of(a, b), before, after));
        if (tagStep.getHighlights().isEmpty()) {
            tagStep.setHighlights(List.of(a, b));
        }
        tagStep.setExplanation(tagStep.getExplanation()
                + " As a result, the values at positions " + a + " and " + b + " of " + arrayName + " were swapped.");
    }

    private String describe(Value v) {
        if (v == null) return "null";
        if (v instanceof ArrayReference ar) {
            StringBuilder sb = new StringBuilder("[");
            List<Value> values = ar.getValues();
            for (int i = 0; i < values.size(); i++) {
                if (i > 0) sb.append(", ");
                sb.append(describe(values.get(i)));
            }
            return sb.append("]").toString();
        }
        if (v instanceof StringReference sr) {
            return "\"" + sr.value() + "\"";
        }
        return v.toString();
    }

    private void drain(java.io.InputStream in) {
        Thread t = new Thread(() -> {
            try (java.io.BufferedReader r =
                         new java.io.BufferedReader(new java.io.InputStreamReader(in))) {
                while (r.readLine() != null) {}
            } catch (Exception ignored) {
            }
        });
        t.setDaemon(true);
        t.start();
    }

    private LaunchingConnector findLaunchingConnector() {
        for (Connector c : Bootstrap.virtualMachineManager().allConnectors()) {
            if (c.name().equals("com.sun.jdi.CommandLineLaunch")) {
                return (LaunchingConnector) c;
            }
        }
        throw new IllegalStateException("No JDI launching connector available on this JVM.");
    }
}
