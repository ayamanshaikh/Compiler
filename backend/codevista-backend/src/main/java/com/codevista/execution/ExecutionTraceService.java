package com.codevista.execution;

import com.codevista.analysis.ExplanationGenerator;
import com.codevista.model.ExecutionStep;
import com.codevista.model.ExecutionStep.TypedArray;
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
 * <p>The tracer is intentionally generic: it works for any Main class and
 * follows calls into user-defined helper classes (anything in the default
 * package — user source is always written without a package declaration,
 * while all JDK classes live in packages). While executing inside JDK
 * code the tracer steps over it, so framework internals never pollute the
 * trace or the server.
 */
@Service
public class ExecutionTraceService {

    private static final int MAX_RAW_STEPS = 800;
    private static final long TIMEOUT_MILLIS = 8000;
    private static final String MAIN_CLASS = "Main";
    private static final int MAX_OBJECT_FIELDS = 8;

    private static final Pattern INDEX_EXPR = Pattern.compile("^(\\w+)\\s*([+-])\\s*(\\d+)$");
    private static final Pattern SCALAR_CMP_PATTERN =
            Pattern.compile("([\\w.]+)\\s*(>=|<=|==|!=|>|<)\\s*([\\w.]+)");

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
        // Bound the traced JVM's heap just like the normal run.
        args.get("options").setValue("-cp " + classDir.toAbsolutePath() + " -Xmx256m");
        args.get("suspend").setValue("true");

        VirtualMachine vm = connector.launch(args);
        Process debuggee = vm.process();
        drain(debuggee.getInputStream());
        drain(debuggee.getErrorStream());

        EventRequestManager erm = vm.eventRequestManager();
        // No class filter: watch every class so user-defined helper classes
        // (also in the default package) get their methods traced too.
        ClassPrepareRequest cpr = erm.createClassPrepareRequest();
        cpr.enable();

        List<ExecutionStep> rawSteps = new ArrayList<>();
        boolean truncated = false;
        StepRequest activeStepRequest = null;

        EventQueue queue = vm.eventQueue();
        boolean running = true;

        try {
            while (running) {
                EventSet eventSet = queue.remove(1000);
                if (eventSet == null) break;

                boolean shouldResume = true;

                for (Event event : eventSet) {
                    if (event instanceof ClassPrepareEvent cpe) {
                        if (isUserClass(cpe.referenceType())) {
                            List<Method> mains = cpe.referenceType().methodsByName("main");
                            if (!mains.isEmpty()) {
                                List<Location> locs = mains.get(0).allLineLocations();
                                if (!locs.isEmpty()) {
                                    BreakpointRequest bp = erm.createBreakpointRequest(locs.get(0));
                                    bp.enable();
                                }
                            }
                        }
                    } else if (event instanceof BreakpointEvent be) {
                        captureStep(be.thread(), sourceLines, rawSteps);
                        activeStepRequest =
                                issueStep(erm, be.thread(), StepRequest.STEP_INTO, activeStepRequest);
                    } else if (event instanceof StepEvent se) {
                        ThreadReference thread = se.thread();
                        if (isUserFrame(thread)) {
                            captureStep(thread, sourceLines, rawSteps);
                            if (rawSteps.size() >= MAX_RAW_STEPS) {
                                truncated = true;
                                running = false;
                                shouldResume = false;
                                try {
                                    vm.exit(0);
                                } catch (Exception ignored) {
                                }
                            } else {
                                // Stay in user code: descend into user method
                                // calls so helper bodies and recursion trace.
                                activeStepRequest =
                                        issueStep(erm, thread, StepRequest.STEP_INTO, activeStepRequest);
                            }
                        } else {
                            // Inside JDK internals — step over the rest of the
                            // method to get back to user code quickly.
                            activeStepRequest =
                                    issueStep(erm, thread, StepRequest.STEP_OVER, activeStepRequest);
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

    /**
     * JDI allows only one pending step request per thread; delete the
     * previous one before issuing the next.
     */
    private StepRequest issueStep(EventRequestManager erm, ThreadReference thread, int depth, StepRequest previous) {
        if (previous != null) {
            try {
                erm.deleteEventRequest(previous);
            } catch (Exception ignored) {
            }
        }
        StepRequest sr = erm.createStepRequest(thread, StepRequest.STEP_LINE, depth);
        sr.enable();
        return sr;
    }

    /** User code lives in the default package; every JDK class is in a package. */
    private boolean isUserClass(ReferenceType type) {
        String name = type.name();
        return name != null
                && !name.isEmpty()
                && !name.contains(".")
                && !name.startsWith("[");
    }

    private boolean isUserFrame(ThreadReference thread) {
        try {
            StackFrame frame = thread.frame(0);
            return frame != null && isUserClass(frame.location().declaringType());
        } catch (Exception e) {
            return false;
        }
    }

    private int computeCallDepth(ThreadReference thread) {
        try {
            int count = thread.frameCount();
            int user = 0;
            int limit = Math.min(count, 100);
            for (StackFrame f : thread.frames(0, limit)) {
                if (isUserClass(f.location().declaringType())) user++;
            }
            return user;
        } catch (Exception e) {
            return 0;
        }
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
            Map<String, TypedArray> typedArrays = new LinkedHashMap<>();
            readFrameState(frame, variables, arrays, intScalars, typedArrays);

            // Skip exact duplicates of the previous step.
            if (!steps.isEmpty()) {
                ExecutionStep last = steps.get(steps.size() - 1);
                if (last.getLineNumber() == lineNumber
                        && last.getVariables().equals(variables)
                        && last.getArrays().equals(arrays)
                        && last.getTypedArrays().equals(typedArrays)) {
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
            step.setTypedArrays(typedArrays);
            step.setHighlights(List.of());
            step.setCallDepth(computeCallDepth(thread));

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
     *   <li>Any step whose arrays or typed arrays differ from the previous
     *       kept step (captures initialisations, mutations, swaps).</li>
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

                // Keep if typed (non-int) arrays changed — e.g. a String[].
                if (!keep && !s.getTypedArrays().equals(prev.getTypedArrays())) {
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

        // ── Pass 2: collapse only compound swap micro-steps ─────────────
        // A plain ASSIGN/DECLARE that does NOT change any array is usually
        // an intermediate step of a compound operation (e.g. the temp line
        // of a three-line swap). Fold it into the FOLLOWING array-changing
        // step. If the next step is not array-changing (a plain mutation
        // target, OUTPUT, RETURN, COMPARE...), the micro-step is emitted as
        // its own step so real mutations and declarations stay visible.
        List<ExecutionStep> collapsed = new ArrayList<>();
        ExecutionStep pendingMicro = null;

        for (ExecutionStep s : kept) {
            String action = s.getAction();
            boolean isMicro = "ASSIGN".equals(action) || "DECLARE".equals(action);
            ExecutionStep lastEmitted =
                    collapsed.isEmpty() ? null : collapsed.get(collapsed.size() - 1);
            boolean changedData = lastEmitted != null
                    && (!s.getArrays().equals(lastEmitted.getArrays())
                        || !s.getTypedArrays().equals(lastEmitted.getTypedArrays()));

            if (isMicro && !changedData) {
                // Remember the latest micro-step; it may fold into a later
                // array-changing step.
                pendingMicro = s;
                continue;
            }

            if (pendingMicro != null) {
                if (changedData) {
                    // The next step mutates an array — fold the micro-step
                    // in (this is the swap pattern: temp = a[j] before
                    // a[j] = a[j+1]).
                    s.setVariables(pendingMicro.getVariables());
                    s.setExplanation(pendingMicro.getExplanation());
                } else {
                    // The next step is not a mutation — the micro-step is
                    // meaningful on its own; emit it.
                    collapsed.add(pendingMicro);
                }
                pendingMicro = null;
            }

            collapsed.add(s);
        }

        // A trailing micro-step (e.g. the last declaration in a method).
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
            Map<String, Integer> intScalars,
            Map<String, TypedArray> typedArrays
    ) {
        try {
            for (LocalVariable lv : frame.visibleVariables()) {
                if ("args".equals(lv.name())) continue;
                Value value = frame.getValue(lv);
                if (value instanceof ArrayReference arrayRef) {
                    List<Value> elements = arrayRef.getValues();

                    boolean allInts = true;
                    List<Integer> ints = new ArrayList<>();
                    for (Value el : elements) {
                        if (el instanceof IntegerValue iv) {
                            ints.add(iv.value());
                        } else {
                            allInts = false;
                            break;
                        }
                    }

                    if (allInts && !elements.isEmpty()) {
                        arrays.put(lv.name(), ints);
                    } else if (elements.isEmpty()) {
                        // Empty array — infer element type from the JVM name.
                        String tn = arrayRef.referenceType().name();
                        if ("[I".equals(tn)) {
                            arrays.put(lv.name(), List.of());
                        } else {
                            typedArrays.put(lv.name(), emptyTypedArray(tn));
                        }
                    } else {
                        TypedArray ta = new TypedArray();
                        ta.setType(elementTypeName(elements));
                        List<String> vals = new ArrayList<>();
                        for (Value el : elements) vals.add(describe(el));
                        ta.setValues(vals);
                        typedArrays.put(lv.name(), ta);
                    }
                    variables.put(lv.name(), describe(value));
                } else {
                    variables.put(lv.name(), describe(value));
                    if (value instanceof IntegerValue iv) {
                        intScalars.put(lv.name(), iv.value());
                    }
                    // Introspect user-defined objects: expose obj.field.
                    if (value instanceof ObjectReference orRef && isUserClass(orRef.referenceType())) {
                        int count = 0;
                        for (Field f : orRef.referenceType().visibleFields()) {
                            if (count >= MAX_OBJECT_FIELDS) break;
                            count++;
                            Value fv = orRef.getValue(f);
                            String key = lv.name() + "." + f.name();
                            variables.put(key, describe(fv));
                            if (fv instanceof IntegerValue fiv) {
                                intScalars.put(key, fiv.value());
                            }
                        }
                    }
                }
            }
        } catch (AbsentInformationException ignored) {
        }
    }

    private String elementTypeName(List<Value> elements) {
        Value first = elements.get(0);
        if (first instanceof IntegerValue) return "int";
        if (first instanceof LongValue) return "long";
        if (first instanceof DoubleValue) return "double";
        if (first instanceof FloatValue) return "float";
        if (first instanceof BooleanValue) return "boolean";
        if (first instanceof CharValue) return "char";
        if (first instanceof ByteValue) return "byte";
        if (first instanceof ShortValue) return "short";
        if (first instanceof StringReference) return "String";
        return "Object";
    }

    private TypedArray emptyTypedArray(String jvmName) {
        TypedArray ta = new TypedArray();
        ta.setType(jvmTypeToFriendly(jvmName));
        ta.setValues(List.of());
        return ta;
    }

    private String jvmTypeToFriendly(String jvmName) {
        return switch (jvmName) {
            case "[I" -> "int";
            case "[J" -> "long";
            case "[D" -> "double";
            case "[F" -> "float";
            case "[Z" -> "boolean";
            case "[C" -> "char";
            case "[B" -> "byte";
            case "[S" -> "short";
            default -> jvmName.startsWith("[L") && jvmName.endsWith(";")
                    ? jvmName.substring(2, jvmName.length() - 1)
                    : jvmName;
        };
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

        // 1) Array comparisons (arr[i] OP arr[j]) — richest visualization.
        var match = explanationGenerator.findArrayComparison(sourceLine);
        if (match != null) {
            List<Integer> array = arrays.get(match.arrayName);
            if (array != null) {
                Integer leftIdx = evalIndex(match.leftIndexExpr, intScalars);
                Integer rightIdx = evalIndex(match.rightIndexExpr, intScalars);
                if (leftIdx != null && rightIdx != null
                        && leftIdx >= 0 && leftIdx < array.size()
                        && rightIdx >= 0 && rightIdx < array.size()) {
                    int left = array.get(leftIdx);
                    int right = array.get(rightIdx);
                    boolean result = evalOperator(match.operator, left, right);
                    step.setComparison(new ExecutionStep.Comparison(left, right, List.of(leftIdx, rightIdx), result, match.operator));
                    step.setHighlights(List.of(leftIdx, rightIdx));
                    return;
                }
            }
        }

        // 2) Scalar comparisons (a > b, count >= 10, x == y).
        Matcher sm = SCALAR_CMP_PATTERN.matcher(sourceLine);
        if (sm.find()) {
            Integer left = evalScalar(sm.group(1), intScalars);
            Integer right = evalScalar(sm.group(3), intScalars);
            if (left != null && right != null) {
                boolean result = evalOperator(sm.group(2), left, right);
                step.setComparison(new ExecutionStep.Comparison(left, right, List.of(), result, sm.group(2)));
                step.setHighlights(List.of());
            }
        }
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

    private Integer evalScalar(String expr, Map<String, Integer> scalars) {
        if (expr == null) return null;
        expr = expr.trim();
        try { return Integer.parseInt(expr); } catch (NumberFormatException ignored) {}
        if (scalars.containsKey(expr)) return scalars.get(expr);
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