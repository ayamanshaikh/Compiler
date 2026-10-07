package com.codevista.enterprise.dto;

import com.codevista.enterprise.model.ServletLifecycleStep;
import com.codevista.enterprise.model.ServletResponseModel;

import java.util.ArrayList;
import java.util.List;

public class ServletExecuteResponse {

    private boolean success;
    private ServletResponseModel response;
    private List<ServletLifecycleStep> lifecycleSteps = new ArrayList<>();
    private String logs;

    public ServletExecuteResponse() {
    }

    public ServletExecuteResponse(boolean success, ServletResponseModel response,
                                  List<ServletLifecycleStep> lifecycleSteps, String logs) {
        this.success = success;
        this.response = response;
        if (lifecycleSteps != null) this.lifecycleSteps = new ArrayList<>(lifecycleSteps);
        this.logs = logs;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public ServletResponseModel getResponse() {
        return response;
    }

    public void setResponse(ServletResponseModel response) {
        this.response = response;
    }

    public List<ServletLifecycleStep> getLifecycleSteps() {
        return lifecycleSteps;
    }

    public void setLifecycleSteps(List<ServletLifecycleStep> lifecycleSteps) {
        this.lifecycleSteps = lifecycleSteps;
    }

    public String getLogs() {
        return logs;
    }

    public void setLogs(String logs) {
        this.logs = logs;
    }
}
