package com.codevista.trace.model;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.HashMap;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class HeapObjectSnapshot {

    private String id;
    private String type;
    private Map<String, Object> state = new HashMap<>();

    public HeapObjectSnapshot() {
    }

    public HeapObjectSnapshot(String id, String type, Map<String, Object> state) {
        this.id = id;
        this.type = type;
        this.state = state != null ? state : new HashMap<>();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Map<String, Object> getState() {
        return state;
    }

    public void setState(Map<String, Object> state) {
        this.state = state;
    }
}
