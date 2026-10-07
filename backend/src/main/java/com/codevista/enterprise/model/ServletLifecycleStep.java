package com.codevista.enterprise.model;

import java.util.HashMap;
import java.util.Map;

public class ServletLifecycleStep {

    private int stepIndex;
    private String phase;
    private String description;
    private String component;
    private Map<String, Object> details = new HashMap<>();

    public ServletLifecycleStep() {
    }

    public ServletLifecycleStep(int stepIndex, String phase, String description, String component) {
        this.stepIndex = stepIndex;
        this.phase = phase;
        this.description = description;
        this.component = component;
    }

    public int getStepIndex() {
        return stepIndex;
    }

    public void setStepIndex(int stepIndex) {
        this.stepIndex = stepIndex;
    }

    public String getPhase() {
        return phase;
    }

    public void setPhase(String phase) {
        this.phase = phase;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getComponent() {
        return component;
    }

    public void setComponent(String component) {
        this.component = component;
    }

    public Map<String, Object> getDetails() {
        return details;
    }

    public void setDetails(Map<String, Object> details) {
        this.details = details;
    }
}
