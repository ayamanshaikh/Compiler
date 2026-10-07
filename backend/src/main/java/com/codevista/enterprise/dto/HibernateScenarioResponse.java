package com.codevista.enterprise.dto;

import com.codevista.enterprise.model.HibernateScenario;

public class HibernateScenarioResponse {

    private String id;
    private String name;
    private String description;
    private String entityJavaCode;
    private String operationCode;

    public HibernateScenarioResponse() {
    }

    public HibernateScenarioResponse(HibernateScenario scenario) {
        this.id = scenario.getId();
        this.name = scenario.getName();
        this.description = scenario.getDescription();
        this.entityJavaCode = scenario.getEntityJavaCode();
        this.operationCode = scenario.getOperationCode();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getEntityJavaCode() {
        return entityJavaCode;
    }

    public void setEntityJavaCode(String entityJavaCode) {
        this.entityJavaCode = entityJavaCode;
    }

    public String getOperationCode() {
        return operationCode;
    }

    public void setOperationCode(String operationCode) {
        this.operationCode = operationCode;
    }
}
