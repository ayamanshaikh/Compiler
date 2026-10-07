package com.codevista.enterprise.model;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class HibernateStep {

    private int stepIndex;
    private String title;
    private String description;
    private String entityName;
    private EntityLifecycleState entityState;
    private List<String> sqlStatements = new ArrayList<>();
    private Map<String, Object> firstLevelCache = new HashMap<>();
    private List<Map<String, Object>> tableSnapshot = new ArrayList<>();

    public HibernateStep() {
    }

    public HibernateStep(int stepIndex, String title, String description, String entityName,
                         EntityLifecycleState entityState, List<String> sqlStatements,
                         Map<String, Object> firstLevelCache, List<Map<String, Object>> tableSnapshot) {
        this.stepIndex = stepIndex;
        this.title = title;
        this.description = description;
        this.entityName = entityName;
        this.entityState = entityState;
        if (sqlStatements != null) this.sqlStatements = new ArrayList<>(sqlStatements);
        if (firstLevelCache != null) this.firstLevelCache = new HashMap<>(firstLevelCache);
        if (tableSnapshot != null) this.tableSnapshot = new ArrayList<>(tableSnapshot);
    }

    public int getStepIndex() {
        return stepIndex;
    }

    public void setStepIndex(int stepIndex) {
        this.stepIndex = stepIndex;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getEntityName() {
        return entityName;
    }

    public void setEntityName(String entityName) {
        this.entityName = entityName;
    }

    public EntityLifecycleState getEntityState() {
        return entityState;
    }

    public void setEntityState(EntityLifecycleState entityState) {
        this.entityState = entityState;
    }

    public List<String> getSqlStatements() {
        return sqlStatements;
    }

    public void setSqlStatements(List<String> sqlStatements) {
        this.sqlStatements = sqlStatements;
    }

    public Map<String, Object> getFirstLevelCache() {
        return firstLevelCache;
    }

    public void setFirstLevelCache(Map<String, Object> firstLevelCache) {
        this.firstLevelCache = firstLevelCache;
    }

    public List<Map<String, Object>> getTableSnapshot() {
        return tableSnapshot;
    }

    public void setTableSnapshot(List<Map<String, Object>> tableSnapshot) {
        this.tableSnapshot = tableSnapshot;
    }
}
