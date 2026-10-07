package com.codevista.compiler.model;

import java.util.Arrays;

public enum Language {
    JAVA("java", "Java 25 LTS"),
    PYTHON("python", "Python 3 (Planned)"),
    C("c", "C (Planned)"),
    CPP("cpp", "C++ (Planned)");

    private final String id;
    private final String displayName;

    Language(String id, String displayName) {
        this.id = id;
        this.displayName = displayName;
    }

    public String getId() {
        return id;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static Language fromString(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String clean = value.trim().toLowerCase();
        for (Language lang : values()) {
            if (lang.id.equalsIgnoreCase(clean) || lang.name().equalsIgnoreCase(clean)) {
                return lang;
            }
        }
        return null;
    }

    public static String getSupportedLanguages() {
        return Arrays.stream(values())
                .map(Language::getId)
                .reduce((a, b) -> a + ", " + b)
                .orElse("");
    }
}
