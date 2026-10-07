package com.codevista.enterprise.dto;

import com.codevista.enterprise.model.ServletScenario;

import java.util.Map;

public class ServletScenarioResponse {

    private String id;
    private String name;
    private String description;
    private String servletCode;
    private String webXmlConfig;
    private String defaultMethod;
    private String defaultPath;
    private Map<String, String> defaultHeaders;
    private Map<String, String> defaultParams;
    private String defaultBody;

    public ServletScenarioResponse() {
    }

    public ServletScenarioResponse(ServletScenario scenario) {
        this.id = scenario.getId();
        this.name = scenario.getName();
        this.description = scenario.getDescription();
        this.servletCode = scenario.getServletCode();
        this.webXmlConfig = scenario.getWebXmlConfig();
        this.defaultMethod = scenario.getDefaultMethod();
        this.defaultPath = scenario.getDefaultPath();
        this.defaultHeaders = scenario.getDefaultHeaders();
        this.defaultParams = scenario.getDefaultParams();
        this.defaultBody = scenario.getDefaultBody();
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

    public String getServletCode() {
        return servletCode;
    }

    public void setServletCode(String servletCode) {
        this.servletCode = servletCode;
    }

    public String getWebXmlConfig() {
        return webXmlConfig;
    }

    public void setWebXmlConfig(String webXmlConfig) {
        this.webXmlConfig = webXmlConfig;
    }

    public String getDefaultMethod() {
        return defaultMethod;
    }

    public void setDefaultMethod(String defaultMethod) {
        this.defaultMethod = defaultMethod;
    }

    public String getDefaultPath() {
        return defaultPath;
    }

    public void setDefaultPath(String defaultPath) {
        this.defaultPath = defaultPath;
    }

    public Map<String, String> getDefaultHeaders() {
        return defaultHeaders;
    }

    public void setDefaultHeaders(Map<String, String> defaultHeaders) {
        this.defaultHeaders = defaultHeaders;
    }

    public Map<String, String> getDefaultParams() {
        return defaultParams;
    }

    public void setDefaultParams(Map<String, String> defaultParams) {
        this.defaultParams = defaultParams;
    }

    public String getDefaultBody() {
        return defaultBody;
    }

    public void setDefaultBody(String defaultBody) {
        this.defaultBody = defaultBody;
    }
}
