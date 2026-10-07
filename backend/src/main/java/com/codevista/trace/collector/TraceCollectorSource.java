package com.codevista.trace.collector;

public final class TraceCollectorSource {

    public static final String SOURCE = """
package com.codevista.runtime;

import java.util.*;

public class CodeVistaTraceCollector {

    public static final String DELIMITER_START = "===CODEVISTA_TRACE_START===";
    public static final String DELIMITER_END = "===CODEVISTA_TRACE_END===";
    private static final int MAX_STEPS = 1000;

    private static final List<StepData> steps = new ArrayList<>();
    private static final Map<String, VarData> currentVars = new LinkedHashMap<>();
    private static final Map<String, String> currentHeap = new LinkedHashMap<>();
    private static final StringBuilder currentOutput = new StringBuilder();
    private static boolean shutdownHookRegistered = false;

    static {
        registerHook();
    }

    public static synchronized void registerHook() {
        if (!shutdownHookRegistered) {
            shutdownHookRegistered = true;
            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                dumpTrace();
            }));
        }
    }

    public static synchronized void line(int line, String desc) {
        if (steps.size() >= MAX_STEPS) return;
        addStep(line, "LINE", desc);
    }

    public static synchronized void var(String name, String type, String value, int line) {
        if (steps.size() >= MAX_STEPS) return;
        VarData old = currentVars.get(name);
        String prev = old != null ? old.value : null;
        currentVars.put(name, new VarData(name, type, value, prev));
        String event = prev == null ? "VARIABLE_DECLARATION" : "VARIABLE_ASSIGNMENT";
        String desc = prev == null
                ? "Declared variable '" + name + "' of type " + type + " = " + value
                : "Updated variable '" + name + "' to " + value;
        addStep(line, event, desc);
    }

    public static synchronized void arrayMutate(String arrayName, int index, String value, int line) {
        if (steps.size() >= MAX_STEPS) return;
        currentHeap.put(arrayName + "[" + index + "]", value);
        addStep(line, "ARRAY_MUTATION", "Updated element " + arrayName + "[" + index + "] = " + value);
    }

    public static synchronized void branch(String condExpr, boolean taken, int line) {
        if (steps.size() >= MAX_STEPS) return;
        String desc = "Evaluated condition (" + condExpr + ") -> " + (taken ? "TRUE (branch taken)" : "FALSE");
        addStep(line, "CONDITION_EVALUATION", desc);
    }

    public static synchronized void loopIter(int line, int iter) {
        if (steps.size() >= MAX_STEPS) return;
        addStep(line, "LOOP_ITERATION", "Loop iteration " + iter);
    }

    public static synchronized void print(String text, int line) {
        currentOutput.append(text);
        if (steps.size() < MAX_STEPS) {
            addStep(line, "OUTPUT_PRINT", "Printed output: " + escapeSnippet(text));
        }
    }

    public static synchronized void println(String text, int line) {
        currentOutput.append(text).append("\\n");
        if (steps.size() < MAX_STEPS) {
            addStep(line, "OUTPUT_PRINT", "Printed line: " + escapeSnippet(text));
        }
    }

    private static void addStep(int line, String event, String desc) {
        StepData s = new StepData();
        s.stepIndex = steps.size();
        s.line = line;
        s.eventType = event;
        s.description = desc;
        s.output = currentOutput.toString();

        for (Map.Entry<String, VarData> e : currentVars.entrySet()) {
            s.variables.put(e.getKey(), new VarData(e.getValue().name, e.getValue().type, e.getValue().value, e.getValue().previousValue));
        }
        for (Map.Entry<String, String> e : currentHeap.entrySet()) {
            s.heap.put(e.getKey(), e.getValue());
        }

        StackTraceElement[] st = Thread.currentThread().getStackTrace();
        for (int i = 3; i < Math.min(st.length, 7); i++) {
            s.callStack.add(st[i].getClassName() + "." + st[i].getMethodName() + "(line " + st[i].getLineNumber() + ")");
        }

        steps.add(s);
    }

    public static synchronized void dumpTrace() {
        System.out.println(DELIMITER_START);
        StringBuilder json = new StringBuilder("[");
        for (int i = 0; i < steps.size(); i++) {
            if (i > 0) json.append(",");
            StepData s = steps.get(i);
            json.append("{")
                .append("\\"stepIndex\\":").append(s.stepIndex).append(",")
                .append("\\"line\\":").append(s.line).append(",")
                .append("\\"eventType\\":\\"").append(s.eventType).append("\\",")
                .append("\\"description\\":\\"").append(escapeJson(s.description)).append("\\",")
                .append("\\"output\\":\\"").append(escapeJson(s.output)).append("\\",")
                .append("\\"variables\\":{");

            int vi = 0;
            for (Map.Entry<String, VarData> ve : s.variables.entrySet()) {
                if (vi++ > 0) json.append(",");
                VarData vd = ve.getValue();
                json.append("\\"").append(escapeJson(ve.getKey())).append("\\":{")
                    .append("\\"name\\":\\"").append(escapeJson(vd.name)).append("\\",")
                    .append("\\"type\\":\\"").append(escapeJson(vd.type)).append("\\",")
                    .append("\\"value\\":\\"").append(escapeJson(vd.value)).append("\\"");
                if (vd.previousValue != null) {
                    json.append(",\\"previousValue\\":\\"").append(escapeJson(vd.previousValue)).append("\\"");
                }
                json.append("}");
            }
            json.append("},")
                .append("\\"heapObjects\\":{");
            int hi = 0;
            for (Map.Entry<String, String> he : s.heap.entrySet()) {
                if (hi++ > 0) json.append(",");
                json.append("\\"").append(escapeJson(he.getKey())).append("\\":{")
                    .append("\\"id\\":\\"").append(escapeJson(he.getKey())).append("\\",")
                    .append("\\"type\\":\\"ARRAY_ELEMENT\\",")
                    .append("\\"state\\":{\\"value\\":\\"").append(escapeJson(he.getValue())).append("\\"}}");
            }
            json.append("},")
                .append("\\"callStack\\":[");
            for (int ci = 0; ci < s.callStack.size(); ci++) {
                if (ci > 0) json.append(",");
                json.append("{\\"methodName\\":\\"").append(escapeJson(s.callStack.get(ci))).append("\\",")
                    .append("\\"className\\":\\"\\",\\"line\\":").append(s.line).append("}");
            }
            json.append("]")
                .append("}");
        }
        json.append("]");
        System.out.println(json.toString());
        System.out.println(DELIMITER_END);
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\\\", "\\\\\\\\")
                .replace("\\"", "\\\\\\\"")
                .replace("\\n", "\\\\n")
                .replace("\\r", "\\\\r")
                .replace("\\t", "\\\\t");
    }

    private static String escapeSnippet(String s) {
        if (s == null) return "";
        String clean = s.replace("\\n", " ").replace("\\r", "");
        return clean.length() > 40 ? clean.substring(0, 37) + "..." : clean;
    }

    private static class StepData {
        int stepIndex;
        int line;
        String eventType;
        String description;
        String output;
        Map<String, VarData> variables = new LinkedHashMap<>();
        Map<String, String> heap = new LinkedHashMap<>();
        List<String> callStack = new ArrayList<>();
    }

    private static class VarData {
        String name;
        String type;
        String value;
        String previousValue;

        VarData(String name, String type, String value, String previousValue) {
            this.name = name;
            this.type = type;
            this.value = value;
            this.previousValue = previousValue;
        }
    }
}
""";

    private TraceCollectorSource() {
    }
}
