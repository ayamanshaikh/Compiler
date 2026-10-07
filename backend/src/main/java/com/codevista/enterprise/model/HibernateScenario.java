package com.codevista.enterprise.model;

public class HibernateScenario {

    private String id;
    private String name;
    private String description;
    private String entityJavaCode;
    private String operationCode;

    public HibernateScenario() {
    }

    public HibernateScenario(String id, String name, String description, String entityJavaCode, String operationCode) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.entityJavaCode = entityJavaCode;
        this.operationCode = operationCode;
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
