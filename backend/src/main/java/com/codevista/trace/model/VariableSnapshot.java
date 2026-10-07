package com.codevista.trace.model;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class VariableSnapshot {

    private String name;
    private String type;
    private String value;
    private String previousValue;

    public VariableSnapshot() {
    }

    public VariableSnapshot(String name, String type, String value, String previousValue) {
        this.name = name;
        this.type = type;
        this.value = value;
        this.previousValue = previousValue;
    }

    public VariableSnapshot(String name, String type, String value) {
        this(name, type, value, null);
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getPreviousValue() {
        return previousValue;
    }

    public void setPreviousValue(String previousValue) {
        this.previousValue = previousValue;
    }
}
