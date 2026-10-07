package com.codevista.algorithm.model;

import java.util.ArrayList;
import java.util.List;

public class AlgorithmMetadata {

    private String slug;
    private String name;
    private AlgorithmCategory category;
    private String description;
    private String timeComplexityBest;
    private String timeComplexityAverage;
    private String timeComplexityWorst;
    private String spaceComplexity;
    private String javaCode;
    private List<Integer> defaultInput = new ArrayList<>();
    private Integer defaultTarget;

    public AlgorithmMetadata() {
    }

    public AlgorithmMetadata(String slug, String name, AlgorithmCategory category, String description,
                             String timeComplexityBest, String timeComplexityAverage, String timeComplexityWorst,
                             String spaceComplexity, String javaCode, List<Integer> defaultInput, Integer defaultTarget) {
        this.slug = slug;
        this.name = name;
        this.category = category;
        this.description = description;
        this.timeComplexityBest = timeComplexityBest;
        this.timeComplexityAverage = timeComplexityAverage;
        this.timeComplexityWorst = timeComplexityWorst;
        this.spaceComplexity = spaceComplexity;
        this.javaCode = javaCode;
        this.defaultInput = defaultInput != null ? new ArrayList<>(defaultInput) : new ArrayList<>();
        this.defaultTarget = defaultTarget;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public AlgorithmCategory getCategory() {
        return category;
    }

    public void setCategory(AlgorithmCategory category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getTimeComplexityBest() {
        return timeComplexityBest;
    }

    public void setTimeComplexityBest(String timeComplexityBest) {
        this.timeComplexityBest = timeComplexityBest;
    }

    public String getTimeComplexityAverage() {
        return timeComplexityAverage;
    }

    public void setTimeComplexityAverage(String timeComplexityAverage) {
        this.timeComplexityAverage = timeComplexityAverage;
    }

    public String getTimeComplexityWorst() {
        return timeComplexityWorst;
    }

    public void setTimeComplexityWorst(String timeComplexityWorst) {
        this.timeComplexityWorst = timeComplexityWorst;
    }

    public String getSpaceComplexity() {
        return spaceComplexity;
    }

    public void setSpaceComplexity(String spaceComplexity) {
        this.spaceComplexity = spaceComplexity;
    }

    public String getJavaCode() {
        return javaCode;
    }

    public void setJavaCode(String javaCode) {
        this.javaCode = javaCode;
    }

    public List<Integer> getDefaultInput() {
        return defaultInput;
    }

    public void setDefaultInput(List<Integer> defaultInput) {
        this.defaultInput = defaultInput;
    }

    public Integer getDefaultTarget() {
        return defaultTarget;
    }

    public void setDefaultTarget(Integer defaultTarget) {
        this.defaultTarget = defaultTarget;
    }
}
