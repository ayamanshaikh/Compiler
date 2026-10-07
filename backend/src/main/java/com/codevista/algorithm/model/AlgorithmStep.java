package com.codevista.algorithm.model;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class AlgorithmStep {

    private int stepIndex;
    private int line;
    private String description;
    private List<Integer> arrayState = new ArrayList<>();
    private Map<Integer, HighlightType> highlights = new HashMap<>();
    private int comparisons;
    private int swaps;
    private Map<String, Object> extra = new HashMap<>();

    public AlgorithmStep() {
    }

    public AlgorithmStep(int stepIndex, int line, String description, List<Integer> arrayState,
                         Map<Integer, HighlightType> highlights, int comparisons, int swaps) {
        this.stepIndex = stepIndex;
        this.line = line;
        this.description = description;
        this.arrayState = new ArrayList<>(arrayState);
        this.highlights = new HashMap<>(highlights);
        this.comparisons = comparisons;
        this.swaps = swaps;
    }

    public int getStepIndex() {
        return stepIndex;
    }

    public void setStepIndex(int stepIndex) {
        this.stepIndex = stepIndex;
    }

    public int getLine() {
        return line;
    }

    public void setLine(int line) {
        this.line = line;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<Integer> getArrayState() {
        return arrayState;
    }

    public void setArrayState(List<Integer> arrayState) {
        this.arrayState = arrayState;
    }

    public Map<Integer, HighlightType> getHighlights() {
        return highlights;
    }

    public void setHighlights(Map<Integer, HighlightType> highlights) {
        this.highlights = highlights;
    }

    public int getComparisons() {
        return comparisons;
    }

    public void setComparisons(int comparisons) {
        this.comparisons = comparisons;
    }

    public int getSwaps() {
        return swaps;
    }

    public void setSwaps(int swaps) {
        this.swaps = swaps;
    }

    public Map<String, Object> getExtra() {
        return extra;
    }

    public void setExtra(Map<String, Object> extra) {
        this.extra = extra;
    }
}
