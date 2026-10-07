package com.codevista.dto;

public record UserProfileResponse(
        UserSummaryDto user,
        UserPreferencesDto preferences,
        UserProgressDto progress,
        int savedSnippetsCount
) {
}
