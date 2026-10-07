package com.codevista.enterprise.dto;

import com.codevista.enterprise.model.HibernateStep;

import java.util.ArrayList;
import java.util.List;

public class HibernateExecuteResponse {

    private boolean success;
    private String scenarioId;
    private String scenarioName;
    private List<HibernateStep> steps = new ArrayList<>();
    private List<String> generatedSqlList = new ArrayList<>();
    private int totalQueriesFired;
    private String explanation;

    public HibernateExecuteResponse() {
    }

    public HibernateExecuteResponse(boolean success, String scenarioId, String scenarioName,
                                    List<HibernateStep> steps, List<String> generatedSqlList,
                                    int totalQueriesFired, String explanation) {
        this.success = success;
        this.scenarioId = scenarioId;
        this.scenarioName = scenarioName;
        if (steps != null) this.steps = new ArrayList<>(steps);
        if (generatedSqlList != null) this.generatedSqlList = new ArrayList<>(generatedSqlList);
        this.totalQueriesFired = totalQueriesFired;
        this.explanation = explanation;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getScenarioId() {
        return scenarioId;
    }

    public void setScenarioId(String scenarioId) {
        this.scenarioId = scenarioId;
    }

    public String getScenarioName() {
        return scenarioName;
    }

    public void setScenarioName(String scenarioName) {
        this.scenarioName = scenarioName;
    }

    public List<HibernateStep> getSteps() {
        return steps;
    }

    public void setSteps(List<HibernateStep> steps) {
        this.steps = steps;
    }

    public List<String> getGeneratedSqlList() {
        return generatedSqlList;
    }

    public void setGeneratedSqlList(List<String> generatedSqlList) {
        this.generatedSqlList = generatedSqlList;
    }

    public int getTotalQueriesFired() {
        return totalQueriesFired;
    }

    public void setTotalQueriesFired(int totalQueriesFired) {
        this.totalQueriesFired = totalQueriesFired;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }
}
