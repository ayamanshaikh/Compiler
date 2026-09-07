package com.codevista.analysis;

import org.springframework.stereotype.Component;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Generates a human-readable action label and explanation for a single
 * source line, using generic structural heuristics (keywords, brackets,
 * operators). This is intentionally algorithm-agnostic: it never assumes
 * bubble sort, or any other specific program. It reasons purely about the
 * shape of the line of code and the variable state supplied to it.
 */
@Component
public class ExplanationGenerator {

    private static final Pattern IF_PATTERN = Pattern.compile("^\\s*if\\s*\\(");
    private static final Pattern FOR_PATTERN = Pattern.compile("^\\s*for\\s*\\(");
    private static final Pattern WHILE_PATTERN = Pattern.compile("^\\s*while\\s*\\(");
    private static final Pattern PRINT_PATTERN = Pattern.compile("System\\.out\\.print");
    private static final Pattern RETURN_PATTERN = Pattern.compile("^\\s*return\\b");
    private static final Pattern DECL_PATTERN =
            Pattern.compile("^\\s*(int|double|float|long|boolean|char|String|var)\\s*(\\[\\])?\\s+\\w+\\s*=");
    private static final Pattern ASSIGN_PATTERN =
            Pattern.compile("^\\s*[\\w.]+(\\s*\\[[^\\]]*])?\\s*(=|\\+=|-=|\\*=|/=)\\s*[^=]");
    private static final Pattern BRACE_ONLY = Pattern.compile("^\\s*[{}]\\s*$");

    public String classify(String line) {
        if (line == null) return "STATEMENT";
        String trimmed = line.trim();

        if (trimmed.isEmpty() || BRACE_ONLY.matcher(trimmed).matches()) return "STRUCTURE";
        if (FOR_PATTERN.matcher(trimmed).find()) return "LOOP";
        if (WHILE_PATTERN.matcher(trimmed).find()) return "LOOP";
        if (IF_PATTERN.matcher(trimmed).find()) return "COMPARE";
        if (PRINT_PATTERN.matcher(trimmed).find()) return "OUTPUT";
        if (RETURN_PATTERN.matcher(trimmed).find()) return "RETURN";
        if (DECL_PATTERN.matcher(trimmed).find()) return "DECLARE";
        if (ASSIGN_PATTERN.matcher(trimmed).find()) return "ASSIGN";

        return "STATEMENT";
    }

    /**
     * Builds a plain-language explanation for a step, given the source line,
     * the classified action, and an optional comparison already computed
     * from live variable/array state (so the explanation reports the real
     * evaluated values, not a guess).
     */
    public String explain(String line, String action, Integer left, Integer right, Boolean comparisonResult) {
        String trimmed = line == null ? "" : line.trim();

        switch (action) {
            case "LOOP":
                return "The loop evaluates its control expression: " + codeSpan(trimmed) + ".";

            case "COMPARE":
                if (left != null && right != null && comparisonResult != null) {
                    String op = comparisonResult ? "is true" : "is false";
                    return "The program checks the condition " + codeSpan(trimmed)
                            + ". Comparing " + left + " and " + right + ", the condition " + op + ".";
                }
                return "The program checks the condition " + codeSpan(trimmed) + ".";

            case "OUTPUT":
                return "The program prints output to the console: " + codeSpan(trimmed) + ".";

            case "RETURN":
                return "The method returns a value here: " + codeSpan(trimmed) + ".";

            case "DECLARE":
                return "A new variable is declared and initialized: " + codeSpan(trimmed) + ".";

            case "ASSIGN":
                return "A variable is updated: " + codeSpan(trimmed) + ".";

            case "STRUCTURE":
                return "Entering or leaving a block.";

            default:
                return "Executing: " + codeSpan(trimmed) + ".";
        }
    }

    private String codeSpan(String code) {
        return "'" + code + "'";
    }

    /**
     * Attempts to find a generic two-index array comparison in an if-line,
     * e.g. "arr[j] > arr[j + 1]" or "arr[i] < arr[i+1]". Returns null if the
     * line doesn't match this generic shape.
     */
    public ArrayComparisonMatch findArrayComparison(String line) {
        if (line == null) return null;

        Pattern p = Pattern.compile(
                "(\\w+)\\s*\\[([^\\]]+)]\\s*(>=|<=|==|!=|>|<)\\s*(\\w+)\\s*\\[([^\\]]+)]"
        );
        Matcher m = p.matcher(line);
        if (!m.find()) return null;

        String arrayName = m.group(1);
        String leftIndexExpr = m.group(2).trim();
        String operator = m.group(3);
        String rightArrayName = m.group(4);
        String rightIndexExpr = m.group(5).trim();

        if (!arrayName.equals(rightArrayName)) return null;

        return new ArrayComparisonMatch(arrayName, leftIndexExpr, rightIndexExpr, operator);
    }

    public static class ArrayComparisonMatch {
        public final String arrayName;
        public final String leftIndexExpr;
        public final String rightIndexExpr;
        public final String operator;

        public ArrayComparisonMatch(String arrayName, String leftIndexExpr, String rightIndexExpr, String operator) {
            this.arrayName = arrayName;
            this.leftIndexExpr = leftIndexExpr;
            this.rightIndexExpr = rightIndexExpr;
            this.operator = operator;
        }
    }
}
