package com.codevista.enterprise.model;

import java.util.HashMap;
import java.util.Map;

public class ServletScenario {

    private String id;
    private String name;
    private String description;
    private String servletCode;
    private String webXmlConfig;
    private String defaultMethod;
    private String defaultPath;
    private Map<String, String> defaultHeaders = new HashMap<>();
    private Map<String, String> defaultParams = new HashMap<>();
    private String defaultBody;

    public ServletScenario() {
    }

    public ServletScenario(String id, String name, String description, String servletCode,
                           String webXmlConfig, String defaultMethod, String defaultPath,
                           Map<String, String> defaultHeaders, Map<String, String> defaultParams,
                           String defaultBody) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.servletCode = servletCode;
        this.webXmlConfig = webXmlConfig;
        this.defaultMethod = defaultMethod;
        this.defaultPath = defaultPath;
        if (defaultHeaders != null) this.defaultHeaders.putAll(defaultHeaders);
        if (defaultParams != null) this.defaultParams.putAll(defaultParams);
        this.defaultBody = defaultBody;
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
