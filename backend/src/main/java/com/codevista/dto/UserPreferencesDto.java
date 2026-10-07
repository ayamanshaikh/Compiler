package com.codevista.dto;

import com.codevista.entity.UserPreferences;

public record UserPreferencesDto(
        String theme,
        Integer fontSize,
        Integer tabSize,
        String explanationDepth,
        Boolean autoRunEnabled,
        Integer visualizerSpeed,
        String accent,
        String animationMode,
        Boolean lineWrapping,
        Boolean minimap,
        String visualizationDetail,
        String visualDensity
) {
    public static UserPreferencesDto fromEntity(UserPreferences preferences) {
        if (preferences == null) {
            return new UserPreferencesDto(
                    "dark", 14, 4, "BEGINNER", false, 600,
                    "emerald", "balanced", true, false, "standard", "comfortable"
            );
        }
        return new UserPreferencesDto(
                preferences.getTheme(),
                preferences.getFontSize(),
                preferences.getTabSize(),
                preferences.getExplanationDepth(),
                preferences.getAutoRunEnabled(),
                preferences.getVisualizerSpeed(),
                preferences.getAccent(),
                preferences.getAnimationMode(),
                preferences.getLineWrapping(),
                preferences.getMinimap(),
                preferences.getVisualizationDetail(),
                preferences.getVisualDensity()
        );
    }
}
