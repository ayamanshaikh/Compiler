package com.codevista.trace.model;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class TraceStep {

    private int stepIndex;
    private int line;
    private Integer column;
    private TraceEventType eventType;
    private String description;
    private String scope = "main";
    private String symbol;
    private String previousValue;
    private String currentValue;
    private String operation;
    private String relatedEvent;
    private Map<String, Object> metadata = new HashMap<>();
    private Map<String, VariableSnapshot> variables = new HashMap<>();
    private List<StackFrameSnapshot> callStack = new ArrayList<>();
    private Map<String, HeapObjectSnapshot> heapObjects = new HashMap<>();
    private String output = "";
    private String threadName = "main";

    public TraceStep() {
    }

    public TraceStep(
            int stepIndex,
            int line,
            TraceEventType eventType,
            String description,
            Map<String, VariableSnapshot> variables,
            List<StackFrameSnapshot> callStack,
            Map<String, HeapObjectSnapshot> heapObjects,
            String output,
            String threadName
    ) {
        this.stepIndex = stepIndex;
        this.line = line;
        this.eventType = eventType;
        this.description = description;
        this.variables = variables != null ? variables : new HashMap<>();
        this.callStack = callStack != null ? callStack : new ArrayList<>();
        this.heapObjects = heapObjects != null ? heapObjects : new HashMap<>();
        this.output = output != null ? output : "";
        this.threadName = threadName != null ? threadName : "main";
    }

    public int getStepIndex() {
        return stepIndex;
    }

    public void setStepIndex(int stepIndex) {
        this.stepIndex = stepIndex;
    }

    public int getLine() {
        return line;
    }

    public void setLine(int line) {
        this.line = line;
    }

    public TraceEventType getEventType() {
        return eventType;
    }

    public void setEventType(TraceEventType eventType) {
        this.eventType = eventType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Map<String, VariableSnapshot> getVariables() {
        return variables;
    }

    public void setVariables(Map<String, VariableSnapshot> variables) {
        this.variables = variables;
    }

    public List<StackFrameSnapshot> getCallStack() {
        return callStack;
    }

    public void setCallStack(List<StackFrameSnapshot> callStack) {
        this.callStack = callStack;
    }

    public Map<String, HeapObjectSnapshot> getHeapObjects() {
        return heapObjects;
    }

    public void setHeapObjects(Map<String, HeapObjectSnapshot> heapObjects) {
        this.heapObjects = heapObjects;
    }

    public String getOutput() {
        return output;
    }

    public void setOutput(String output) {
        this.output = output;
    }

    public String getThreadName() {
        return threadName;
    }

    public void setThreadName(String threadName) {
        this.threadName = threadName;
    }

    public Integer getColumn() {
        return column;
    }

    public void setColumn(Integer column) {
        this.column = column;
    }

    public String getScope() {
        return scope;
    }

    public void setScope(String scope) {
        this.scope = scope;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public String getPreviousValue() {
        return previousValue;
    }

    public void setPreviousValue(String previousValue) {
        this.previousValue = previousValue;
    }

    public String getCurrentValue() {
        return currentValue;
    }

    public void setCurrentValue(String currentValue) {
        this.currentValue = currentValue;
    }

    public String getOperation() {
        return operation;
    }

    public void setOperation(String operation) {
        this.operation = operation;
    }

    public String getRelatedEvent() {
        return relatedEvent;
    }

    public void setRelatedEvent(String relatedEvent) {
        this.relatedEvent = relatedEvent;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata != null ? metadata : new HashMap<>();
    }
}
