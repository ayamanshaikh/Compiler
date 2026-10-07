package com.codevista.enterprise.dto;

import java.util.HashMap;
import java.util.Map;

public class HibernateExecuteRequest {

    private String scenarioId;
    private String action;
    private Map<String, Object> params = new HashMap<>();

    public HibernateExecuteRequest() {
    }

    public HibernateExecuteRequest(String scenarioId, String action, Map<String, Object> params) {
        this.scenarioId = scenarioId;
        this.action = action;
        if (params != null) this.params.putAll(params);
    }

    public String getScenarioId() {
        return scenarioId;
    }

    public void setScenarioId(String scenarioId) {
        this.scenarioId = scenarioId;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public Map<String, Object> getParams() {
        return params;
    }

    public void setParams(Map<String, Object> params) {
        this.params = params;
    }
}
