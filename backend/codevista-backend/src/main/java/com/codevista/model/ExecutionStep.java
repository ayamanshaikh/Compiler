package com.codevista.model;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * A single captured moment of a real, running Java program.
 * Produced by ExecutionTraceService from an actual JDI-instrumented
 * execution — never hand-written or hard-coded to a specific algorithm.
 */
public class ExecutionStep {

    private int step;
    private long lineNumber;
    private String code;
    private String action;
    private String explanation;
    private Map<String, String> variables = new LinkedHashMap<>();
    private Map<String, List<Integer>> arrays = new LinkedHashMap<>();
    private List<Integer> highlights = List.of();
    private Comparison comparison;
    private Swap swap;

    public ExecutionStep() {
    }

    public int getStep() {
        return step;
    }

    public void setStep(int step) {
        this.step = step;
    }

    public long getLineNumber() {
        return lineNumber;
    }

    public void setLineNumber(long lineNumber) {
        this.lineNumber = lineNumber;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public Map<String, String> getVariables() {
        return variables;
    }

    public void setVariables(Map<String, String> variables) {
        this.variables = variables;
    }

    public Map<String, List<Integer>> getArrays() {
        return arrays;
    }

    public void setArrays(Map<String, List<Integer>> arrays) {
        this.arrays = arrays;
    }

    public List<Integer> getHighlights() {
        return highlights;
    }

    public void setHighlights(List<Integer> highlights) {
        this.highlights = highlights;
    }

    public Comparison getComparison() {
        return comparison;
    }

    public void setComparison(Comparison comparison) {
        this.comparison = comparison;
    }

    public Swap getSwap() {
        return swap;
    }

    public void setSwap(Swap swap) {
        this.swap = swap;
    }

    public static class Comparison {
        private int left;
        private int right;
        private List<Integer> indices;
        private boolean result;

        public Comparison() {
        }

        public Comparison(int left, int right, List<Integer> indices, boolean result) {
            this.left = left;
            this.right = right;
            this.indices = indices;
            this.result = result;
        }

        public int getLeft() {
            return left;
        }

        public void setLeft(int left) {
            this.left = left;
        }

        public int getRight() {
            return right;
        }

        public void setRight(int right) {
            this.right = right;
        }

        public List<Integer> getIndices() {
            return indices;
        }

        public void setIndices(List<Integer> indices) {
            this.indices = indices;
        }

        public boolean isResult() {
            return result;
        }

        public void setResult(boolean result) {
            this.result = result;
        }
    }

    public static class Swap {
        private List<Integer> indices;
        private List<Integer> before;
        private List<Integer> after;

        public Swap() {
        }

        public Swap(List<Integer> indices, List<Integer> before, List<Integer> after) {
            this.indices = indices;
            this.before = before;
            this.after = after;
        }

        public List<Integer> getIndices() {
            return indices;
        }

        public void setIndices(List<Integer> indices) {
            this.indices = indices;
        }

        public List<Integer> getBefore() {
            return before;
        }

        public void setBefore(List<Integer> before) {
            this.before = before;
        }

        public List<Integer> getAfter() {
            return after;
        }

        public void setAfter(List<Integer> after) {
            this.after = after;
        }
    }
}
