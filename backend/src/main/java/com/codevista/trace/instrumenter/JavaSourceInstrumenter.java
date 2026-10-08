package com.codevista.trace.instrumenter;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class JavaSourceInstrumenter {

    private static final Pattern PACKAGE_PATTERN = Pattern.compile(
            "^\\s*package\\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\\.[a-zA-Z_][a-zA-Z0-9_]*)*)\\s*;",
            Pattern.MULTILINE
    );

    private static final Pattern VAR_DECL_PATTERN = Pattern.compile(
            "^(\\s*)(?:final\\s+)?(int|long|short|byte|float|double|boolean|char|String|[A-Z][a-zA-Z0-9_$]*)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(.+);$"
    );

    private static final Pattern VAR_ASSIGN_PATTERN = Pattern.compile(
            "^(\\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(=|\\+=|-=|\\*=|/=|%=)\s*(.+);$"
    );

    private static final Pattern VAR_INC_DEC_PATTERN = Pattern.compile(
            "^(\\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\\+\\+|--)\s*;$"
    );

    private static final Pattern ARRAY_ASSIGN_PATTERN = Pattern.compile(
            "^(\\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\\[([^\\]]+)\\]\s*=\s*(.+);$"
    );

    private static final Pattern CLASS_DEF_PATTERN = Pattern.compile(
            "\\b(class|interface|enum|record)\\b\\s+[A-Za-z0-9_$]+"
    );

    private static final Pattern MAIN_METHOD_PATTERN = Pattern.compile(
            "public\\s+static\\s+void\\s+main\\s*\\([^)]*\\)\\s*(?:throws\\s+[^{]+)?\\{"
    );

    public String instrument(String sourceCode) {
        if (sourceCode == null || sourceCode.isBlank()) {
            return sourceCode;
        }

        if (!sourceCode.contains("\n") || sourceCode.split("\\r?\\n").length <= 2) {
            sourceCode = sourceCode
                    .replace("{", "{\n")
                    .replace("}", "\n}\n")
                    .replace(";", ";\n");
        }

        String[] rawLines = sourceCode.split("\\r?\\n", -1);
        List<String> outputLines = new ArrayList<>();

        boolean hasImportAdded = false;
        int braceDepth = 0;
        java.util.Set<Integer> classScopeDepths = new java.util.HashSet<>();
        boolean pendingClassScope = false;

        for (int i = 0; i < rawLines.length; i++) {
            int originalLineNum = i + 1;
            String line = rawLines[i];
            String trimmed = line.trim();

            // Insert collector import
            if (!hasImportAdded) {
                if (trimmed.startsWith("package ") && trimmed.endsWith(";")) {
                    outputLines.add(line);
                    outputLines.add("import com.codevista.runtime.CodeVistaTraceCollector;");
                    hasImportAdded = true;
                    continue;
                } else if (!trimmed.startsWith("/*") && !trimmed.startsWith("//") && !trimmed.isEmpty()) {
                    outputLines.add("import com.codevista.runtime.CodeVistaTraceCollector;");
                    hasImportAdded = true;
                }
            }

            // Detect class / interface / enum / record declarations
            if (CLASS_DEF_PATTERN.matcher(trimmed).find()) {
                pendingClassScope = true;
            }

            // Main method entry injection
            Matcher mainMatcher = MAIN_METHOD_PATTERN.matcher(line);
            if (mainMatcher.find()) {
                braceDepth++;
                outputLines.add(line);
                outputLines.add("        CodeVistaTraceCollector.registerHook();");
                outputLines.add("        CodeVistaTraceCollector.line(" + originalLineNum + ", \"Entered main method\");");
                continue;
            }

            // Check if line opens a block
            if (trimmed.equals("{") || trimmed.endsWith("{")) {
                braceDepth++;
                if (pendingClassScope) {
                    classScopeDepths.add(braceDepth);
                    pendingClassScope = false;
                }
                outputLines.add(line);
                if (trimmed.startsWith("for") || trimmed.startsWith("while")) {
                    outputLines.add("        CodeVistaTraceCollector.line(" + originalLineNum + ", \"Loop body iteration\");");
                }
                continue;
            }

            if (trimmed.equals("}") || trimmed.endsWith("}")) {
                classScopeDepths.remove(braceDepth);
                braceDepth = Math.max(0, braceDepth - 1);
                outputLines.add(line);
                continue;
            }

            if (trimmed.isEmpty() || trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
                outputLines.add(line);
                continue;
            }

            // If we are at class / type scope (not inside a method or constructor), do not inject statement trace hooks
            boolean isInsideMethod = braceDepth > 0 && !classScopeDepths.contains(braceDepth);
            if (!isInsideMethod) {
                outputLines.add(line);
                continue;
            }

            // Variable Declaration: int x = 10;
            Matcher declMatcher = VAR_DECL_PATTERN.matcher(line);
            if (declMatcher.matches()) {
                String indent = declMatcher.group(1);
                String type = declMatcher.group(2);
                String varName = declMatcher.group(3);
                outputLines.add(indent + "CodeVistaTraceCollector.line(" + originalLineNum + ", \"Executing declaration of " + varName + "\");");
                outputLines.add(line);
                outputLines.add(indent + "CodeVistaTraceCollector.var(\"" + varName + "\", \"" + type + "\", String.valueOf(" + varName + "), " + originalLineNum + ");");
                continue;
            }

            // Array Assignment: arr[i] = val;
            Matcher arrayMatcher = ARRAY_ASSIGN_PATTERN.matcher(line);
            if (arrayMatcher.matches()) {
                String indent = arrayMatcher.group(1);
                String arrayName = arrayMatcher.group(2);
                String indexExpr = arrayMatcher.group(3);
                outputLines.add(indent + "CodeVistaTraceCollector.line(" + originalLineNum + ", \"Updating array " + arrayName + "\");");
                outputLines.add(line);
                outputLines.add(indent + "CodeVistaTraceCollector.arrayMutate(\"" + arrayName + "\", (int)(" + indexExpr + "), String.valueOf(" + arrayName + "[" + indexExpr + "]), " + originalLineNum + ");");
                continue;
            }

            // Variable Assignment: x = 20; or x += 5;
            Matcher assignMatcher = VAR_ASSIGN_PATTERN.matcher(line);
            if (assignMatcher.matches()) {
                String indent = assignMatcher.group(1);
                String varName = assignMatcher.group(2);
                outputLines.add(indent + "CodeVistaTraceCollector.line(" + originalLineNum + ", \"Updating variable " + varName + "\");");
                outputLines.add(line);
                outputLines.add(indent + "CodeVistaTraceCollector.var(\"" + varName + "\", \"var\", String.valueOf(" + varName + "), " + originalLineNum + ");");
                continue;
            }

            // Increment / Decrement: i++; or count--;
            Matcher incDecMatcher = VAR_INC_DEC_PATTERN.matcher(line);
            if (incDecMatcher.matches()) {
                String indent = incDecMatcher.group(1);
                String varName = incDecMatcher.group(2);
                outputLines.add(line);
                outputLines.add(indent + "CodeVistaTraceCollector.var(\"" + varName + "\", \"var\", String.valueOf(" + varName + "), " + originalLineNum + ");");
                continue;
            }

            // Print statement: System.out.println(...) or System.out.print(...)
            if (trimmed.startsWith("System.out.println(") && trimmed.endsWith(");")) {
                outputLines.add(line);
                String arg = trimmed.substring("System.out.println(".length(), trimmed.length() - 2).trim();
                String valExpr = arg.isEmpty() ? "\"\"" : "String.valueOf(" + arg + ")";
                outputLines.add("        CodeVistaTraceCollector.println(" + valExpr + ", " + originalLineNum + ");");
                continue;
            } else if (trimmed.startsWith("System.out.print(") && trimmed.endsWith(");")) {
                outputLines.add(line);
                String arg = trimmed.substring("System.out.print(".length(), trimmed.length() - 2).trim();
                String valExpr = arg.isEmpty() ? "\"\"" : "String.valueOf(" + arg + ")";
                outputLines.add("        CodeVistaTraceCollector.print(" + valExpr + ", " + originalLineNum + ");");
                continue;
            }

            // Regular statement: inject line marker if non-control line
            if (trimmed.endsWith(";") && !trimmed.startsWith("return") && !trimmed.startsWith("import") && !trimmed.startsWith("package")) {
                outputLines.add("        CodeVistaTraceCollector.line(" + originalLineNum + ", \"Executed line " + originalLineNum + "\");");
            }

            outputLines.add(line);
        }

        return String.join("\n", outputLines);
    }
}
