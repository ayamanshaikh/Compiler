package com.codevista.trace.model;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.HashMap;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class StackFrameSnapshot {

    private String methodName;
    private String className;
    private int line;
    private Map<String, VariableSnapshot> localVariables = new HashMap<>();

    public StackFrameSnapshot() {
    }

    public StackFrameSnapshot(String methodName, String className, int line, Map<String, VariableSnapshot> localVariables) {
        this.methodName = methodName;
        this.className = className;
        this.line = line;
        this.localVariables = localVariables != null ? localVariables : new HashMap<>();
    }

    public String getMethodName() {
        return methodName;
    }

    public void setMethodName(String methodName) {
        this.methodName = methodName;
    }

    public String getClassName() {
        return className;
    }

    public void setClassName(String className) {
        this.className = className;
    }

    public int getLine() {
        return line;
    }

    public void setLine(int line) {
        this.line = line;
    }

    public Map<String, VariableSnapshot> getLocalVariables() {
        return localVariables;
    }

    public void setLocalVariables(Map<String, VariableSnapshot> localVariables) {
        this.localVariables = localVariables;
    }
}
