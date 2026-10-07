package com.codevista.enterprise.model;

import java.util.HashMap;
import java.util.Map;

public class ServletResponseModel {

    private int statusCode;
    private String statusText;
    private Map<String, String> headers = new HashMap<>();
    private String body;
    private Map<String, Object> sessionAttributes = new HashMap<>();
    private String sessionId;

    public ServletResponseModel() {
    }

    public ServletResponseModel(int statusCode, String statusText, Map<String, String> headers,
                                String body, Map<String, Object> sessionAttributes, String sessionId) {
        this.statusCode = statusCode;
        this.statusText = statusText;
        if (headers != null) this.headers.putAll(headers);
        this.body = body;
        if (sessionAttributes != null) this.sessionAttributes.putAll(sessionAttributes);
        this.sessionId = sessionId;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public void setStatusCode(int statusCode) {
        this.statusCode = statusCode;
    }

    public String getStatusText() {
        return statusText;
    }

    public void setStatusText(String statusText) {
        this.statusText = statusText;
    }

    public Map<String, String> getHeaders() {
        return headers;
    }

    public void setHeaders(Map<String, String> headers) {
        this.headers = headers;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public Map<String, Object> getSessionAttributes() {
        return sessionAttributes;
    }

    public void setSessionAttributes(Map<String, Object> sessionAttributes) {
        this.sessionAttributes = sessionAttributes;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }
}
