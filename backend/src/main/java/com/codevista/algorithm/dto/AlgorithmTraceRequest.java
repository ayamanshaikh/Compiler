package com.codevista.algorithm.dto;

import java.util.List;

public class AlgorithmTraceRequest {

    private List<Integer> input;
    private Integer target;

    public AlgorithmTraceRequest() {
    }

    public AlgorithmTraceRequest(List<Integer> input, Integer target) {
        this.input = input;
        this.target = target;
    }

    public List<Integer> getInput() {
        return input;
    }

    public void setInput(List<Integer> input) {
        this.input = input;
    }

    public Integer getTarget() {
        return target;
    }

    public void setTarget(Integer target) {
        this.target = target;
    }
}
