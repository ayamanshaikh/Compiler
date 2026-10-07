package com.codevista.dto;

import com.codevista.entity.UserProgress;

import java.time.Instant;
import java.util.Collections;
import java.util.Set;

public record UserProgressDto(
        Set<String> completedTopics,
        Set<String> solvedQuestions,
        Set<String> bookmarkedAlgorithms,
        Integer currentStreakDays,
        Instant lastActiveAt,
        int completedTopicsCount,
        int solvedQuestionsCount,
        int bookmarkedAlgorithmsCount
) {
    public static UserProgressDto fromEntity(UserProgress progress) {
        if (progress == null) {
            return new UserProgressDto(
                    Collections.emptySet(),
                    Collections.emptySet(),
                    Collections.emptySet(),
                    1,
                    Instant.now(),
                    0,
                    0,
                    0
            );
        }
        Set<String> topics = progress.getCompletedTopics() != null ? progress.getCompletedTopics() : Collections.emptySet();
        Set<String> questions = progress.getSolvedQuestions() != null ? progress.getSolvedQuestions() : Collections.emptySet();
        Set<String> algos = progress.getBookmarkedAlgorithms() != null ? progress.getBookmarkedAlgorithms() : Collections.emptySet();

        return new UserProgressDto(
                topics,
                questions,
                algos,
                progress.getCurrentStreakDays(),
                progress.getLastActiveAt(),
                topics.size(),
                questions.size(),
                algos.size()
        );
    }
}
