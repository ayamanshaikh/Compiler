package com.codevista.algorithm.dto;

import com.codevista.algorithm.model.AlgorithmStep;

import java.util.ArrayList;
import java.util.List;

public class AlgorithmTraceResponse {

    private String algorithmSlug;
    private String algorithmName;
    private List<AlgorithmStep> steps = new ArrayList<>();
    private int totalSteps;
    private int totalComparisons;
    private int totalSwaps;
    private boolean success;

    public AlgorithmTraceResponse() {
    }

    public AlgorithmTraceResponse(String algorithmSlug, String algorithmName, List<AlgorithmStep> steps,
                                  int totalComparisons, int totalSwaps, boolean success) {
        this.algorithmSlug = algorithmSlug;
        this.algorithmName = algorithmName;
        this.steps = steps != null ? steps : new ArrayList<>();
        this.totalSteps = this.steps.size();
        this.totalComparisons = totalComparisons;
        this.totalSwaps = totalSwaps;
        this.success = success;
    }

    public String getAlgorithmSlug() {
        return algorithmSlug;
    }

    public void setAlgorithmSlug(String algorithmSlug) {
        this.algorithmSlug = algorithmSlug;
    }

    public String getAlgorithmName() {
        return algorithmName;
    }

    public void setAlgorithmName(String algorithmName) {
        this.algorithmName = algorithmName;
    }

    public List<AlgorithmStep> getSteps() {
        return steps;
    }

    public void setSteps(List<AlgorithmStep> steps) {
        this.steps = steps;
        this.totalSteps = steps != null ? steps.size() : 0;
    }

    public int getTotalSteps() {
        return totalSteps;
    }

    public void setTotalSteps(int totalSteps) {
        this.totalSteps = totalSteps;
    }

    public int getTotalComparisons() {
        return totalComparisons;
    }

    public void setTotalComparisons(int totalComparisons) {
        this.totalComparisons = totalComparisons;
    }

    public int getTotalSwaps() {
        return totalSwaps;
    }

    public void setTotalSwaps(int totalSwaps) {
        this.totalSwaps = totalSwaps;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }
}
