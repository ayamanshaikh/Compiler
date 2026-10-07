package com.codevista.practice.dto;

import java.util.HashMap;
import java.util.Map;

public class PracticeStatsResponse {

    private int totalAttempts;
    private int correctCount;
    private int incorrectCount;
    private double accuracyPercentage;

    private Map<String, PerformanceMetric> topicPerformance = new HashMap<>();
    private Map<String, PerformanceMetric> difficultyPerformance = new HashMap<>();

    public PracticeStatsResponse() {
    }

    public PracticeStatsResponse(int totalAttempts, int correctCount, int incorrectCount,
                                 Map<String, PerformanceMetric> topicPerformance,
                                 Map<String, PerformanceMetric> difficultyPerformance) {
        this.totalAttempts = totalAttempts;
        this.correctCount = correctCount;
        this.incorrectCount = incorrectCount;
        this.accuracyPercentage = totalAttempts > 0
                ? Math.round(((double) correctCount / totalAttempts) * 1000.0) / 10.0
                : 0.0;
        this.topicPerformance = topicPerformance != null ? topicPerformance : new HashMap<>();
        this.difficultyPerformance = difficultyPerformance != null ? difficultyPerformance : new HashMap<>();
    }

    public static class PerformanceMetric {
        private int attempts;
        private int correct;
        private double accuracy;

        public PerformanceMetric() {
        }

        public PerformanceMetric(int attempts, int correct) {
            this.attempts = attempts;
            this.correct = correct;
            this.accuracy = attempts > 0
                    ? Math.round(((double) correct / attempts) * 1000.0) / 10.0
                    : 0.0;
        }

        public int getAttempts() {
            return attempts;
        }

        public void setAttempts(int attempts) {
            this.attempts = attempts;
        }

        public int getCorrect() {
            return correct;
        }

        public void setCorrect(int correct) {
            this.correct = correct;
        }

        public double getAccuracy() {
            return accuracy;
        }

        public void setAccuracy(double accuracy) {
            this.accuracy = accuracy;
        }
    }

    public int getTotalAttempts() {
        return totalAttempts;
    }

    public void setTotalAttempts(int totalAttempts) {
        this.totalAttempts = totalAttempts;
    }

    public int getCorrectCount() {
        return correctCount;
    }

    public void setCorrectCount(int correctCount) {
        this.correctCount = correctCount;
    }

    public int getIncorrectCount() {
        return incorrectCount;
    }

    public void setIncorrectCount(int incorrectCount) {
        this.incorrectCount = incorrectCount;
    }

    public double getAccuracyPercentage() {
        return accuracyPercentage;
    }

    public void setAccuracyPercentage(double accuracyPercentage) {
        this.accuracyPercentage = accuracyPercentage;
    }

    public Map<String, PerformanceMetric> getTopicPerformance() {
        return topicPerformance;
    }

    public void setTopicPerformance(Map<String, PerformanceMetric> topicPerformance) {
        this.topicPerformance = topicPerformance;
    }

    public Map<String, PerformanceMetric> getDifficultyPerformance() {
        return difficultyPerformance;
    }

    public void setDifficultyPerformance(Map<String, PerformanceMetric> difficultyPerformance) {
        this.difficultyPerformance = difficultyPerformance;
    }
}
