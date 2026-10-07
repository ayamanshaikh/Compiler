package com.codevista.enterprise.dto;

import java.util.HashMap;
import java.util.Map;

public class ServletExecuteRequest {

    private String scenarioId;
    private String method;
    private String path;
    private Map<String, String> headers = new HashMap<>();
    private Map<String, String> queryParams = new HashMap<>();
    private String body;
    private String customServletCode;

    public ServletExecuteRequest() {
    }

    public ServletExecuteRequest(String scenarioId, String method, String path,
                                 Map<String, String> headers, Map<String, String> queryParams,
                                 String body, String customServletCode) {
        this.scenarioId = scenarioId;
        this.method = method;
        this.path = path;
        if (headers != null) this.headers.putAll(headers);
        if (queryParams != null) this.queryParams.putAll(queryParams);
        this.body = body;
        this.customServletCode = customServletCode;
    }

    public String getScenarioId() {
        return scenarioId;
    }

    public void setScenarioId(String scenarioId) {
        this.scenarioId = scenarioId;
    }

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public Map<String, String> getHeaders() {
        return headers;
    }

    public void setHeaders(Map<String, String> headers) {
        this.headers = headers;
    }

    public Map<String, String> getQueryParams() {
        return queryParams;
    }

    public void setQueryParams(Map<String, String> queryParams) {
        this.queryParams = queryParams;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public String getCustomServletCode() {
        return customServletCode;
    }

    public void setCustomServletCode(String customServletCode) {
        this.customServletCode = customServletCode;
    }
}
